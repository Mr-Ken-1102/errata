import { createStreamingRunner, type StreamingRunOptions } from '../agents/create-streaming-runner'
import type { AgentStreamCompletion, AgentStreamResult } from '../agents/stream-types'
import { tool } from 'ai'
import {
  normalizeStorySetupSnapshotInput,
  StorySetupAssessmentSchema,
  StorySetupSnapshotInputSchema,
} from './schema'
import { listStorySetupFragments, syncStorySetupSnapshot } from './sync'

export interface StorySetupChatOptions {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
  mode?: 'assess' | 'continue'
}

function resolveStorySetupMode(opts: StorySetupChatOptions): 'assess' | 'continue' {
  return opts.mode ?? (opts.messages.some(message => message.role === 'user') ? 'continue' : 'assess')
}

const runStorySetupChat = createStreamingRunner<StorySetupChatOptions>({
  name: 'story-setup.chat',
  role: 'story-setup.chat',
  readOnly: true,
  extraContext: async ({ dataDir, storyId, opts, ctxState }) => {
    const setupFragments = await listStorySetupFragments(dataDir, storyId, ctxState?.allFragments)
    return {
      storySetupFragments: setupFragments,
      storySetupReadOnly: resolveStorySetupMode(opts) === 'assess',
    }
  },
  tools: ({ dataDir, storyId, opts, story: currentStory }) => {
    const mode = resolveStorySetupMode(opts)
    if (mode === 'assess') {
      return {
        updateStorySetup: tool({
          description: 'Report the seven checklist items from the existing story material without changing the story.',
          inputSchema: StorySetupAssessmentSchema,
          execute: async ({ checklist }) => {
            try {
              const setupFragments = await listStorySetupFragments(dataDir, storyId)
              return {
                saved: false,
                checklist,
                covered: checklist.filter(item => item.status === 'covered').length,
                story: null,
                fragments: setupFragments.map(fragment => ({
                  id: fragment.id,
                  key: fragment.meta.storySetupKey as string,
                  type: fragment.type,
                  name: fragment.name,
                  description: fragment.description,
                  content: fragment.content,
                })),
              }
            } catch (error) {
              const message = error instanceof Error ? error.message : String(error)
              throw new Error(`Errata could not assess the existing setup: ${message}. Retry updateStorySetup.`)
            }
          },
        }),
      }
    }

    return {
      updateStorySetup: tool({
        description: 'Save the working story details and complete setup-fragment snapshot, and replace the visible checklist before asking the writer the next question.',
        inputSchema: StorySetupSnapshotInputSchema,
        execute: async (input) => {
          try {
            const { story, checklist, fragments } = normalizeStorySetupSnapshotInput(input, currentStory)
            const saved = await syncStorySetupSnapshot(dataDir, storyId, { story: story ?? null, fragments })
            return {
              saved: true,
              checklist,
              covered: checklist.filter(item => item.status === 'covered').length,
              story: saved.story,
              fragments: saved.fragments,
            }
          } catch (error) {
            const message = error instanceof Error ? error.message : String(error)
            throw new Error(`Errata rejected the story setup snapshot: ${message}. Correct it and call updateStorySetup again.`)
          }
        },
      }),
    }
  },
  toolChoice: 'auto',
  forceDisableThinking: true,
  prepareStep: ({ stepNumber }) => ({
    toolChoice: stepNumber === 0
      ? { type: 'tool', toolName: 'updateStorySetup' }
      : 'none',
  }),
  maxSteps: 3,
  messages: ({ compiled, opts }) => {
    const mode = resolveStorySetupMode(opts)
    const contextMessage = compiled.messages.find(message => message.role === 'user')
    const conversation = opts.messages.length > 0
      ? opts.messages
      : mode === 'assess' ? [{
          role: 'user' as const,
          content: 'Assess the checklist against the current story material. Make no story changes. Then ask only about the highest-value genuinely unresolved point; if there is no meaningful material yet, invite any incomplete starting point.',
        }] : [{
          role: 'user' as const,
          content: 'Begin the story setup conversation. Ask what starting point I have, and make it clear that an incomplete idea is welcome.',
        }]
    const assessment = mode === 'assess' && opts.messages.length > 0
      ? [{
          role: 'user' as const,
          content: 'Reassess the checklist against the current story material. Preserve the conversation, make no story changes, and ask only about a genuinely unresolved point.',
        }]
      : []
    return [
      ...(contextMessage ? [{ role: 'user' as const, content: contextMessage.content }] : []),
      ...conversation,
      ...assessment,
    ]
  },
})

const STORY_SETUP_MAX_ATTEMPTS = 2

function hasValidStorySetupUpdate(completion: AgentStreamCompletion): boolean {
  return completion.toolCalls.some(call => call.toolName === 'updateStorySetup')
}

async function drainBufferedAttempt(
  result: AgentStreamResult,
  onReader: (reader: ReadableStreamDefaultReader<string> | null) => void,
): Promise<{ chunks: string[]; completion: AgentStreamCompletion }> {
  const reader = result.eventStream.getReader()
  onReader(reader)
  const chunks: string[] = []

  const readToEnd = (async () => {
    try {
      for (;;) {
        const { done, value } = await reader.read()
        if (done) return
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
      onReader(null)
    }
  })()

  try {
    const [completion] = await Promise.all([result.completion, readToEnd])
    return { chunks, completion }
  } catch (error) {
    try {
      await reader.cancel(error)
    } catch {
      // The stream may already be errored or closed.
    }
    throw error
  }
}

export async function storySetupChat(
  dataDir: string,
  storyId: string,
  opts: StorySetupChatOptions,
  execution?: StreamingRunOptions,
): Promise<AgentStreamResult> {
  let activeReader: ReadableStreamDefaultReader<string> | null = null
  let cancelled = false
  let completionResolve!: (completion: AgentStreamCompletion) => void
  let completionReject!: (error: unknown) => void

  const completion = new Promise<AgentStreamCompletion>((resolve, reject) => {
    completionResolve = resolve
    completionReject = reject
  })

  const eventStream = new ReadableStream<string>({
    start(controller) {
      void (async () => {
        try {
          for (let attempt = 1; attempt <= STORY_SETUP_MAX_ATTEMPTS; attempt++) {
            if (execution?.abortSignal?.aborted) {
              const error = new Error('Story setup aborted')
              error.name = 'AbortError'
              throw error
            }

            const result = await runStorySetupChat(dataDir, storyId, opts, execution)
            const buffered = await drainBufferedAttempt(result, reader => {
              activeReader = reader
            })

            if (!hasValidStorySetupUpdate(buffered.completion)) {
              if (buffered.completion.toolErrors.length > 0) {
                throw new Error(`Story setup update failed: ${buffered.completion.toolErrors[0].error}`)
              }
              if (attempt < STORY_SETUP_MAX_ATTEMPTS) continue
              throw new Error(
                `Story setup ended without a valid updateStorySetup result after ${STORY_SETUP_MAX_ATTEMPTS} attempts`,
              )
            }

            if (!buffered.completion.text.trim()) {
              throw new Error('Story setup updated its snapshot but ended before asking the next question')
            }

            if (cancelled) {
              const error = new Error('Story setup aborted')
              error.name = 'AbortError'
              throw error
            }

            for (const chunk of buffered.chunks) controller.enqueue(chunk)
            controller.close()
            completionResolve(buffered.completion)
            return
          }
        } catch (error) {
          if (!cancelled) controller.error(error)
          completionReject(error)
        }
      })()
    },
    cancel(reason) {
      cancelled = true
      if (activeReader) {
        void activeReader.cancel(reason).catch(() => {})
      }
    },
  })

  return { eventStream, completion }
}
