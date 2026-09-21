import { Elysia, t } from 'elysia'
import { getStory, getFragment } from '../fragments/storage'
import {
  getGenerationLog,
  listGenerationLogs,
} from '../llm/generation-logs'
import { getLibrarianRuntimeStatus, triggerLibrarian } from '../librarian/scheduler'
import { listAgentRuns } from '../agents'
import {
  getState as getLibrarianState,
  listAnalyses as listLibrarianAnalyses,
  getAnalysis as getLibrarianAnalysis,
  saveAnalysis as saveLibrarianAnalysis,
  getChatHistory as getLibrarianChatHistory,
  appendChatMessage,
  updateChatMessageByRunId,
  clearChatHistory as clearLibrarianChatHistory,
  listConversations,
  createConversation,
  deleteConversation,
  getConversationHistory,
  appendConversationMessage,
  getLatestAnalysisIdsByFragment,
  type ChatHistoryMessage,
  type ChatHistoryToolCall,
} from '../librarian/storage'
import {
  applyFragmentChangeProposal,
  markFragmentChangeProposalApplied,
  markFragmentChangeProposalReverted,
  markFragmentChangeProposalStale,
  ProposalApplyError,
  ProposalValidationError,
  ProposalRevertConflictError,
  refreshPendingFragmentChangeProposals,
  revertFragmentChangeProposal,
} from '../librarian/suggestions'
import { createLogger, type Logger } from '../logging'
import { startAgentRun } from '../runs/agent-run'
import { runStreamResponse, resolveExistingRun } from '../runs/http'
import { findLiveRun, abortedByTimeout, abortedByUser, type Run } from '../runs'
import { createTurnTracker, type TurnTracker } from '../runs/turn-tracker'
import { describeError } from '../error-message'
import { getActiveBranchId } from '../fragments/branches'
import { withKeyLock } from '../async-lock'
import type { LibrarianStatusResponse } from '@/contracts/librarian'


/** Keep a replayed edit recognizable without pasting a whole fragment result into context. */
function summarizeChatToolCall(toolCall: ChatHistoryToolCall): string {
  const args = JSON.stringify(toolCall.args ?? {})
  const compactArgs = args.length > 240 ? args.slice(0, 240) + '…' : args
  return `${toolCall.toolName}(${compactArgs})`
}

/**
 * Rebuild provider-visible history from server-owned durable turns.
 * Tool calls that already landed are explicitly represented so a later turn
 * does not repeat an edit merely because the previous prose reply was cut off.
 */
export function toLibrarianProviderMessages(
  messages: ChatHistoryMessage[],
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages.map((message) => {
    if (message.role === 'user') {
      return { role: 'user' as const, content: message.content.trim() || '(empty message)' }
    }

    const parts: string[] = []
    if (message.content.trim()) parts.push(message.content.trim())

    const applied = (message.toolCalls ?? [])
      .filter(toolCall =>
        toolCall.toolName !== 'planEdits'
        && toolCall.error === undefined
        && toolCall.result !== undefined
      )
      .map(summarizeChatToolCall)
    if (applied.length > 0) {
      parts.push(`[Already applied this turn: ${applied.join('; ')}]`)
    }

    if (message.status === 'error' || message.status === 'cancelled') {
      parts.push(
        `[This turn ended early (${message.status}); work beyond the calls above did not complete.]`,
      )
    }

    return {
      role: 'assistant' as const,
      content: parts.join('\n\n') || '[No reply was recorded for this turn.]',
    }
  })
}

async function startLibrarianChatRun(args: {
  dataDir: string
  storyId: string
  conversationId: string | null
  message: string
  clientRequestId?: string
  maxSteps: number
  logger: Logger
}): Promise<Run> {
  const {
    dataDir,
    storyId,
    conversationId,
    message,
    clientRequestId,
    maxSteps,
    logger,
  } = args

  const appendMessage = (entry: ChatHistoryMessage) => conversationId
    ? appendConversationMessage(dataDir, storyId, conversationId, entry)
    : appendChatMessage(dataDir, storyId, entry)

  // The server owns history. The client sends only the new user turn.
  const afterUser = await appendMessage({ role: 'user', content: message })
  const providerMessages = toLibrarianProviderMessages(afterUser.messages)

  let tracker: TurnTracker | null = null
  let trackerRunId: string | null = null

  return startAgentRun({
    dataDir,
    storyId,
    kind: 'librarian.chat',
    scopeId: conversationId,
    ...(clientRequestId ? { clientRequestId } : {}),
    agentName: 'librarian.chat',
    input: {
      messages: providerMessages,
      maxSteps,
    },
    onStart: async (runId) => {
      trackerRunId = runId
      // Persist the in-flight assistant turn before the model can apply tools.
      await appendMessage({
        role: 'assistant',
        content: '',
        runId,
        status: 'streaming',
      })
      tracker = createTurnTracker({
        write: (snapshot) => updateChatMessageByRunId(
          dataDir,
          storyId,
          conversationId,
          runId,
          {
            content: snapshot.content,
            ...(snapshot.reasoning ? { reasoning: snapshot.reasoning } : {}),
            ...(snapshot.toolCalls.length > 0 ? { toolCalls: snapshot.toolCalls } : {}),
          },
        ),
      })
    },
    onEvent: (event) => {
      tracker?.onEvent(event)
    },
    onComplete: async (result, signal) => {
      await tracker?.flush()
      const snapshot = tracker?.snapshot()
      const toolCalls = snapshot?.toolCalls ?? []
      const saidNothing = !result.text.trim() && toolCalls.length === 0 && !signal.aborted

      const status = abortedByTimeout(signal)
        ? 'error'
        : abortedByUser(signal)
          ? 'cancelled'
          : saidNothing
            ? 'error'
            : 'complete'

      if (!trackerRunId) throw new Error('Librarian chat run id was not initialized')
      await updateChatMessageByRunId(dataDir, storyId, conversationId, trackerRunId, {
        content: result.text,
        ...(result.reasoning ? { reasoning: result.reasoning } : {}),
        ...(toolCalls.length > 0 ? { toolCalls } : {}),
        status,
        ...(abortedByTimeout(signal) ? { error: 'Generation timed out.' } : {}),
        ...(saidNothing ? { error: 'The model returned an empty response.' } : {}),
      })

      logger.info('Librarian chat completed', {
        stepCount: result.stepCount,
        finishReason: result.finishReason,
        toolCallCount: result.toolCalls.length,
        status,
      })
    },
    onError: async (error, signal) => {
      await tracker?.flush()
      const status = abortedByUser(signal) ? 'cancelled' : 'error'
      if (!trackerRunId) return
      await updateChatMessageByRunId(dataDir, storyId, conversationId, trackerRunId, {
        status,
        ...(status === 'error'
          ? { error: abortedByTimeout(signal) ? 'Generation timed out.' : describeError(error) }
          : {}),
      })
    },
  })


}

export function librarianRoutes(dataDir: string) {
  const logger = createLogger('api:librarian', { dataDir })

  return new Elysia({ detail: { tags: ['Librarian'] } })
    // --- Generation Logs ---
    .get('/stories/:storyId/generation-logs', async ({ params }) => {
      return listGenerationLogs(dataDir, params.storyId)
    }, { detail: { summary: 'List generation logs' } })

    .get('/stories/:storyId/generation-logs/:logId', async ({ params, set }) => {
      const log = await getGenerationLog(dataDir, params.storyId, params.logId)
      if (!log) {
        set.status = 404
        return { error: 'Generation log not found' }
      }
      return log
    }, { detail: { summary: 'Get a generation log by ID' } })

    // --- Librarian ---
    .get('/stories/:storyId/librarian/status', async ({ params }) => {
      const state = await getLibrarianState(dataDir, params.storyId)
      const runtime = getLibrarianRuntimeStatus(params.storyId)
      return {
        ...state,
        ...runtime,
      } satisfies LibrarianStatusResponse
    }, { detail: { summary: 'Get librarian status' } })

    .get('/stories/:storyId/librarian/analysis-index', async ({ params }) => {
      const index = await getLatestAnalysisIdsByFragment(dataDir, params.storyId)
      return Object.fromEntries(index)
    }, { detail: { summary: 'Get fragment → analysis ID mapping' } })

    .post('/stories/:storyId/librarian/analyze', async ({ params, body, set }) => {
      const story = await getStory(dataDir, params.storyId)
      if (!story) {
        set.status = 404
        return { error: 'Story not found' }
      }
      const { fragmentId } = body as { fragmentId: string }
      if (!fragmentId) {
        set.status = 422
        return { error: 'fragmentId is required' }
      }
      const fragment = await getFragment(dataDir, params.storyId, fragmentId)
      if (!fragment) {
        set.status = 404
        return { error: 'Fragment not found' }
      }
      triggerLibrarian(dataDir, params.storyId, fragment).catch((err) => {
        logger.error('Manual librarian trigger failed', { error: err instanceof Error ? err.message : String(err) })
      })
      return { ok: true, fragmentId }
    }, { detail: { summary: 'Trigger librarian analysis on a specific fragment' } })

    .get('/stories/:storyId/librarian/analyses', async ({ params }) => {
      return listLibrarianAnalyses(dataDir, params.storyId)
    }, { detail: { summary: 'List all analyses' } })

    .get('/stories/:storyId/librarian/agent-runs', async ({ params }) => {
      return listAgentRuns(params.storyId)
    }, { detail: { summary: 'List agent runs' } })

    .get('/stories/:storyId/librarian/analyses/:analysisId', async ({ params, set }) => {
      const analysis = await getLibrarianAnalysis(dataDir, params.storyId, params.analysisId)
      if (!analysis) {
        set.status = 404
        return { error: 'Analysis not found' }
      }
      return analysis
    }, { detail: { summary: 'Get an analysis by ID' } })

    /**
     * Updates both the analysis intent and its canonical summary-fragment
     * artifact. Analyses created before summary fragments existed have no
     * linked artifact and remain editable as historical records only.
     */
    .patch('/stories/:storyId/librarian/analyses/:analysisId', async ({ params, body, set }) => {
      const analysis = await getLibrarianAnalysis(dataDir, params.storyId, params.analysisId)
      if (!analysis) {
        set.status = 404
        return { error: 'Analysis not found' }
      }

      const story = await getStory(dataDir, params.storyId)
      if (!story) {
        set.status = 404
        return { error: 'Story not found' }
      }

      const nextSummary = body.summaryUpdate.trim()

      analysis.summaryUpdate = nextSummary
      await saveLibrarianAnalysis(dataDir, params.storyId, analysis)

      return analysis
    }, {
      body: t.Object({
        summaryUpdate: t.String(),
      }),
      detail: { summary: 'Update an analysis summary and its linked summary fragment' },
    })

    .post('/stories/:storyId/librarian/analyses/:analysisId/change-proposals/:index/accept', async ({ params, set }) => {
      const analysis = await getLibrarianAnalysis(dataDir, params.storyId, params.analysisId)
      if (!analysis) {
        set.status = 404
        return { error: 'Analysis not found' }
      }
      const index = parseInt(params.index, 10)
      if (isNaN(index) || index < 0 || index >= analysis.fragmentChangeProposals.length) {
        set.status = 422
        return { error: 'Invalid fragment change proposal index' }
      }

      let result: Awaited<ReturnType<typeof applyFragmentChangeProposal>>
      try {
        result = await applyFragmentChangeProposal({
          dataDir,
          storyId: params.storyId,
          analysis,
          proposalIndex: index,
          reason: 'manual-accept',
        })
      } catch (error) {
        if (error instanceof ProposalApplyError) {
          // Some operations wrote to disk before a later one failed. Record the
          // partial application so it stays visible and revertible.
          markFragmentChangeProposalApplied({
            analysis,
            proposalIndex: index,
            result: error.partial,
            autoApplied: false,
          })
          await saveLibrarianAnalysis(dataDir, params.storyId, analysis)
        } else if (error instanceof ProposalValidationError) {
          // Nothing was written; the proposal is stale against current fragment
          // state (typically a sibling proposal already landed the same change).
          // Mark it so the user is not offered an accept that can only fail again.
          markFragmentChangeProposalStale({
            analysis,
            proposalIndex: index,
            reason: error.message,
            validation: error.results,
          })
          await saveLibrarianAnalysis(dataDir, params.storyId, analysis)
        }
        set.status = 422
        return { error: error instanceof Error ? error.message : String(error), analysis }
      }

      markFragmentChangeProposalApplied({
        analysis,
        proposalIndex: index,
        result,
        autoApplied: false,
      })
      // A successful apply can invalidate sibling proposals that carry the same
      // change; mark them stale now instead of letting their accept fail later.
      await refreshPendingFragmentChangeProposals({ dataDir, storyId: params.storyId, analysis })
      await saveLibrarianAnalysis(dataDir, params.storyId, analysis)
      return {
        analysis,
        ...result,
      }
    }, { detail: { summary: 'Accept a fragment change proposal' } })

    .post('/stories/:storyId/librarian/analyses/:analysisId/change-proposals/:index/revert', async ({ params, set }) => {
      const analysis = await getLibrarianAnalysis(dataDir, params.storyId, params.analysisId)
      if (!analysis) {
        set.status = 404
        return { error: 'Analysis not found' }
      }
      const index = parseInt(params.index, 10)
      if (isNaN(index) || index < 0 || index >= analysis.fragmentChangeProposals.length) {
        set.status = 422
        return { error: 'Invalid fragment change proposal index' }
      }

      let result: Awaited<ReturnType<typeof revertFragmentChangeProposal>>
      try {
        result = await revertFragmentChangeProposal({
          dataDir,
          storyId: params.storyId,
          analysis,
          proposalIndex: index,
        })
      } catch (error) {
        if (error instanceof ProposalRevertConflictError) {
          set.status = 409
          return {
            error: error.message,
            ...(error.partial ? { partial: error.partial } : {}),
          }
        }
        set.status = 422
        return { error: error instanceof Error ? error.message : String(error) }
      }

      await markFragmentChangeProposalReverted({
        dataDir,
        storyId: params.storyId,
        analysis,
        proposalIndex: index,
        result,
      })
      // Reverting can make sibling proposals valid again (their change is no
      // longer duplicated); revive any that were auto-marked stale.
      await refreshPendingFragmentChangeProposals({ dataDir, storyId: params.storyId, analysis })
      await saveLibrarianAnalysis(dataDir, params.storyId, analysis)
      return {
        analysis,
        ...result,
      }
    }, { detail: { summary: 'Revert an accepted fragment change proposal' } })

    .post('/stories/:storyId/librarian/analyses/:analysisId/change-proposals/:index/dismiss', async ({ params, set }) => {
      const analysis = await getLibrarianAnalysis(dataDir, params.storyId, params.analysisId)
      if (!analysis) {
        set.status = 404
        return { error: 'Analysis not found' }
      }
      const index = parseInt(params.index, 10)
      if (isNaN(index) || index < 0 || index >= analysis.fragmentChangeProposals.length) {
        set.status = 422
        return { error: 'Invalid fragment change proposal index' }
      }

      analysis.fragmentChangeProposals[index].dismissed = true
      await saveLibrarianAnalysis(dataDir, params.storyId, analysis)
      return { analysis }
    }, { detail: { summary: 'Dismiss a fragment change proposal' } })

    .post('/stories/:storyId/librarian/analyses/:analysisId/contradictions/:index/dismiss', async ({ params, set }) => {
      const analysis = await getLibrarianAnalysis(dataDir, params.storyId, params.analysisId)
      if (!analysis) {
        set.status = 404
        return { error: 'Analysis not found' }
      }
      const index = parseInt(params.index, 10)
      if (isNaN(index) || index < 0 || index >= analysis.contradictions.length) {
        set.status = 422
        return { error: 'Invalid contradiction index' }
      }

      analysis.contradictions[index].dismissed = true
      analysis.contradictions[index].dismissedAt = new Date().toISOString()
      await saveLibrarianAnalysis(dataDir, params.storyId, analysis)
      return { analysis }
    }, { detail: { summary: 'Dismiss a contradiction finding' } })

    .delete('/stories/:storyId/librarian/analyses/:analysisId', async ({ params, set }) => {
      const { deleteAnalysis } = await import('../librarian/storage')
      const deleted = await deleteAnalysis(dataDir, params.storyId, params.analysisId)
      if (!deleted) {
        set.status = 404
        return { error: 'Analysis not found' }
      }
      return { ok: true }
    }, { detail: { summary: 'Delete an analysis' } })

    // --- Librarian Refine ---
    .post('/stories/:storyId/librarian/refine', async ({ params, body, set }) => {
      const requestLogger = logger.child({ storyId: params.storyId })
      requestLogger.info('Refinement request started', { fragmentId: body.fragmentId })

      const story = await getStory(dataDir, params.storyId)
      if (!story) {
        set.status = 404
        return { error: 'Story not found' }
      }

      const fragment = await getFragment(dataDir, params.storyId, body.fragmentId)
      if (!fragment) {
        set.status = 404
        return { error: 'Fragment not found' }
      }

      if (fragment.type === 'prose') {
        set.status = 422
        return { error: 'Cannot refine prose fragments. Use the generation refine mode instead.' }
      }

      try {
        const run = await startAgentRun({
          dataDir,
          storyId: params.storyId,
          kind: 'librarian.refine',
          scopeId: body.fragmentId,
          agentName: 'librarian.refine',
          input: {
            fragmentId: body.fragmentId,
            instructions: body.instructions,
            maxSteps: story.settings.maxSteps ?? 5,
          },
          onComplete: (result) => {
            requestLogger.info('Refinement completed', {
              fragmentId: body.fragmentId,
              stepCount: result.stepCount,
              finishReason: result.finishReason,
              toolCallCount: result.toolCalls.length,
            })
          },
        })
        return runStreamResponse(run)
      } catch (err) {
        requestLogger.error('Refinement failed', { error: err instanceof Error ? err.message : String(err) })
        set.status = 500
        return { error: err instanceof Error ? err.message : 'Refinement failed' }
      }
    }, {
      body: t.Object({
        // Retained temporarily for old clients; the server-owned run generates
        // and returns the authoritative run id in its run-start event.
        runId: t.Optional(t.String()),
        fragmentId: t.String(),
        instructions: t.Optional(t.String()),
      }),
      detail: { summary: 'Refine a non-prose fragment (server-owned run; streaming NDJSON)' },
    })

    // --- Librarian Prose Transform ---
    .post('/stories/:storyId/librarian/prose-transform', async ({ params, body, set }) => {
      const requestLogger = logger.child({ storyId: params.storyId })
      requestLogger.info('Prose transform request started', {
        fragmentId: body.fragmentId,
        operation: body.operation,
      })

      const story = await getStory(dataDir, params.storyId)
      if (!story) {
        set.status = 404
        return { error: 'Story not found' }
      }

      const fragment = await getFragment(dataDir, params.storyId, body.fragmentId)
      if (!fragment) {
        set.status = 404
        return { error: 'Fragment not found' }
      }

      if (fragment.type !== 'prose') {
        set.status = 422
        return { error: 'Only prose fragments support selection transforms.' }
      }

      try {
        const run = await startAgentRun({
          dataDir,
          storyId: params.storyId,
          kind: 'librarian.prose-transform',
          scopeId: body.fragmentId,
          agentName: 'librarian.prose-transform',
          input: {
            fragmentId: body.fragmentId,
            selectedText: body.selectedText,
            operation: body.operation,
            instruction: body.instruction,
            sourceContent: body.sourceContent,
            contextBefore: body.contextBefore,
            contextAfter: body.contextAfter,
          },
          onComplete: (result) => {
            requestLogger.info('Prose transform completed', {
              fragmentId: body.fragmentId,
              operation: body.operation,
              stepCount: result.stepCount,
              finishReason: result.finishReason,
              outputLength: result.text.trim().length,
              reasoningLength: result.reasoning.trim().length,
            })
          },
        })
        return runStreamResponse(run)
      } catch (err) {
        requestLogger.error('Prose transform failed', { error: err instanceof Error ? err.message : String(err) })
        set.status = 500
        return { error: err instanceof Error ? err.message : 'Prose transform failed' }
      }
    }, {
      body: t.Object({
        // Backward-compatible input only; ignored by the server-owned run.
        runId: t.Optional(t.String()),
        fragmentId: t.String(),
        selectedText: t.String({ minLength: 1 }),
        operation: t.Union([t.Literal('rewrite'), t.Literal('expand'), t.Literal('compress'), t.Literal('custom')]),
        instruction: t.Optional(t.String()),
        sourceContent: t.Optional(t.String()),
        contextBefore: t.Optional(t.String()),
        contextAfter: t.Optional(t.String()),
      }),
      detail: { summary: 'Transform a prose selection (server-owned run; streaming NDJSON)' },
    })

    // --- Librarian Chat ---
    .get('/stories/:storyId/librarian/chat', async ({ params }) => {
      return getLibrarianChatHistory(dataDir, params.storyId)
    }, { detail: { summary: 'Get chat history' } })

    .delete('/stories/:storyId/librarian/chat', async ({ params }) => {
      await clearLibrarianChatHistory(dataDir, params.storyId)
      return { ok: true }
    }, { detail: { summary: 'Clear chat history' } })

    .post('/stories/:storyId/librarian/chat', async ({ params, body, set }) => {
      const requestLogger = logger.child({ storyId: params.storyId })
      const story = await getStory(dataDir, params.storyId)
      if (!story) {
        set.status = 404
        return { error: 'Story not found' }
      }

      const text = body.message.trim()
      if (!text) {
        set.status = 422
        return { error: 'message is required' }
      }

      const branchId = await getActiveBranchId(dataDir, params.storyId)
      const lockKey = `librarian-chat-start:${params.storyId}:${branchId}:legacy`

      return withKeyLock(lockKey, async () => {
        const existing = resolveExistingRun(
          params.storyId,
          null,
          body.clientRequestId,
          branchId,
        )
        if (existing) return existing

        const live = findLiveRun(params.storyId, 'librarian.chat', null, branchId)
        if (live) {
          return new Response(JSON.stringify({
            error: 'A chat turn is already running',
            runId: live.id,
          }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        try {
          const run = await startLibrarianChatRun({
            dataDir,
            storyId: params.storyId,
            conversationId: null,
            message: text,
            ...(body.clientRequestId ? { clientRequestId: body.clientRequestId } : {}),
            maxSteps: story.settings.maxSteps ?? 10,
            logger: requestLogger,
          })
          return runStreamResponse(run)
        } catch (error) {
          requestLogger.error('Librarian chat failed to start', { error: describeError(error) })
          return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Chat failed',
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })
    }, {
      body: t.Object({
        message: t.String({ minLength: 1 }),
        clientRequestId: t.Optional(t.String()),
      }),
      detail: { summary: 'Chat with the librarian (server-owned run; streaming NDJSON)' },
    })

    // --- Conversations ---
    .get('/stories/:storyId/librarian/conversations', async ({ params }) => {
      return listConversations(dataDir, params.storyId)
    }, { detail: { summary: 'List chat conversations' } })

    .post('/stories/:storyId/librarian/conversations', async ({ params, body }) => {
      return createConversation(dataDir, params.storyId, body.title ?? 'New chat')
    }, {
      body: t.Object({ title: t.Optional(t.String()) }),
      detail: { summary: 'Create a chat conversation' },
    })

    .delete('/stories/:storyId/librarian/conversations/:conversationId', async ({ params, set }) => {
      const ok = await deleteConversation(dataDir, params.storyId, params.conversationId)
      if (!ok) { set.status = 404; return { error: 'Conversation not found' } }
      return { ok: true }
    }, { detail: { summary: 'Delete a conversation' } })

    .get('/stories/:storyId/librarian/conversations/:conversationId/chat', async ({ params }) => {
      return getConversationHistory(dataDir, params.storyId, params.conversationId)
    }, { detail: { summary: 'Get conversation chat history' } })

    .post('/stories/:storyId/librarian/conversations/:conversationId/chat', async ({ params, body, set }) => {
      const requestLogger = logger.child({
        storyId: params.storyId,
        extra: { conversationId: params.conversationId },
      })

      const story = await getStory(dataDir, params.storyId)
      if (!story) {
        set.status = 404
        return { error: 'Story not found' }
      }

      const conversations = await listConversations(dataDir, params.storyId)
      if (!conversations.some(item => item.id === params.conversationId)) {
        set.status = 404
        return { error: 'Conversation not found' }
      }

      const text = body.message.trim()
      if (!text) {
        set.status = 422
        return { error: 'message is required' }
      }

      const branchId = await getActiveBranchId(dataDir, params.storyId)
      const lockKey = `librarian-chat-start:${params.storyId}:${branchId}:${params.conversationId}`

      return withKeyLock(lockKey, async () => {
        const existing = resolveExistingRun(
          params.storyId,
          params.conversationId,
          body.clientRequestId,
          branchId,
        )
        if (existing) return existing

        const live = findLiveRun(
          params.storyId,
          'librarian.chat',
          params.conversationId,
          branchId,
        )
        if (live) {
          return new Response(JSON.stringify({
            error: 'A chat turn is already running',
            runId: live.id,
          }), {
            status: 409,
            headers: { 'Content-Type': 'application/json' },
          })
        }

        try {
          const run = await startLibrarianChatRun({
            dataDir,
            storyId: params.storyId,
            conversationId: params.conversationId,
            message: text,
            ...(body.clientRequestId ? { clientRequestId: body.clientRequestId } : {}),
            maxSteps: story.settings.maxSteps ?? 10,
            logger: requestLogger,
          })
          return runStreamResponse(run)
        } catch (error) {
          requestLogger.error('Conversation chat failed to start', { error: describeError(error) })
          return new Response(JSON.stringify({
            error: error instanceof Error ? error.message : 'Chat failed',
          }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          })
        }
      })
    }, {
      body: t.Object({
        message: t.String({ minLength: 1 }),
        clientRequestId: t.Optional(t.String()),
      }),
      detail: { summary: 'Chat in a conversation (server-owned run; streaming NDJSON)' },
    })
}
