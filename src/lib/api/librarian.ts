import { apiFetch } from './client'
import { fetchRunEventStream } from './runs'
import { readPovCharacterId } from './generation'
import type {
  LibrarianStatusResponse,
  LibrarianAnalysisSummary,
  LibrarianAnalysis,
  LibrarianAcceptChangeProposalResponse,
  LibrarianRevertChangeProposalResponse,
  ChatHistory,
  ConversationMeta,
  AgentRunTraceRecord,
} from './types'

export const librarian = {
  getStatus: (storyId: string) =>
    apiFetch<LibrarianStatusResponse>(`/stories/${storyId}/librarian/status`),
  getAnalysisIndex: (storyId: string) =>
    apiFetch<Record<string, string>>(`/stories/${storyId}/librarian/analysis-index`),
  analyze: (storyId: string, fragmentId: string) =>
    apiFetch<{ ok: boolean; fragmentId: string }>(`/stories/${storyId}/librarian/analyze`, {
      method: 'POST',
      body: JSON.stringify({ fragmentId }),
    }),
  listAnalyses: (storyId: string) =>
    apiFetch<LibrarianAnalysisSummary[]>(`/stories/${storyId}/librarian/analyses`),
  listAgentRuns: (storyId: string) =>
    apiFetch<AgentRunTraceRecord[]>(`/stories/${storyId}/librarian/agent-runs`),
  getAnalysis: (storyId: string, id: string) =>
    apiFetch<LibrarianAnalysis>(`/stories/${storyId}/librarian/analyses/${id}`),
  updateAnalysis: (storyId: string, analysisId: string, data: { summaryUpdate: string }) =>
    apiFetch<LibrarianAnalysis>(`/stories/${storyId}/librarian/analyses/${analysisId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  acceptChangeProposal: (storyId: string, analysisId: string, index: number) =>
    apiFetch<LibrarianAcceptChangeProposalResponse>(`/stories/${storyId}/librarian/analyses/${analysisId}/change-proposals/${index}/accept`, { method: 'POST' }),
  revertChangeProposal: (storyId: string, analysisId: string, index: number) =>
    apiFetch<LibrarianRevertChangeProposalResponse>(`/stories/${storyId}/librarian/analyses/${analysisId}/change-proposals/${index}/revert`, { method: 'POST' }),
  dismissChangeProposal: (storyId: string, analysisId: string, index: number) =>
    apiFetch<{ analysis: LibrarianAnalysis }>(`/stories/${storyId}/librarian/analyses/${analysisId}/change-proposals/${index}/dismiss`, { method: 'POST' }),
  dismissContradiction: (storyId: string, analysisId: string, index: number) =>
    apiFetch<{ analysis: LibrarianAnalysis }>(`/stories/${storyId}/librarian/analyses/${analysisId}/contradictions/${index}/dismiss`, { method: 'POST' }),
  deleteAnalysis: (storyId: string, analysisId: string) =>
    apiFetch<{ ok: boolean }>(`/stories/${storyId}/librarian/analyses/${analysisId}`, { method: 'DELETE' }),
  refine: (
    storyId: string,
    fragmentId: string,
    instructions?: string,
    legacyRunIdOrOptions?: string | { branchId?: string },
    _legacySignal?: AbortSignal,
  ) => {
    const branchId = typeof legacyRunIdOrOptions === 'object'
      ? legacyRunIdOrOptions.branchId
      : undefined
    return fetchRunEventStream(`/stories/${storyId}/librarian/refine`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fragmentId,
        instructions,
        ...(branchId ? { branchId } : {}),
      }),
    })
  },
  transformProseSelection: (
    storyId: string,
    fragmentId: string,
    operation: 'rewrite' | 'expand' | 'compress' | 'custom',
    selectedText: string,
    options?: {
      sourceContent?: string
      contextBefore?: string
      contextAfter?: string
      instruction?: string
      runId?: string
      branchId?: string
      povCharacterId?: string
    },
  ) => {
    const povCharacterId = options?.povCharacterId
      ?? readPovCharacterId(storyId, options?.branchId)
    return fetchRunEventStream(`/stories/${storyId}/librarian/prose-transform`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fragmentId,
        operation,
        selectedText,
        sourceContent: options?.sourceContent,
        contextBefore: options?.contextBefore,
        contextAfter: options?.contextAfter,
        instruction: options?.instruction,
        ...(options?.branchId ? { branchId: options.branchId } : {}),
        ...(povCharacterId ? { povCharacterId } : {}),
      }),
    })
  },
  chat: (storyId: string, message: string, clientRequestId?: string) =>
    fetchRunEventStream(`/stories/${storyId}/librarian/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message,
        ...(clientRequestId ? { clientRequestId } : {}),
      }),
    }),
  getChatHistory: (storyId: string) =>
    apiFetch<ChatHistory>(`/stories/${storyId}/librarian/chat`),
  clearChatHistory: (storyId: string) =>
    apiFetch<{ ok: boolean }>(`/stories/${storyId}/librarian/chat`, { method: 'DELETE' }),
  // Conversations
  listConversations: (storyId: string) =>
    apiFetch<ConversationMeta[]>(`/stories/${storyId}/librarian/conversations`),
  createConversation: (storyId: string, title?: string, povCharacterId?: string) =>
    apiFetch<ConversationMeta>(`/stories/${storyId}/librarian/conversations`, {
      method: 'POST',
      body: JSON.stringify({
        title,
        ...(povCharacterId ? { povCharacterId } : {}),
      }),
    }),
  deleteConversation: (storyId: string, conversationId: string) =>
    apiFetch<{ ok: boolean }>(`/stories/${storyId}/librarian/conversations/${conversationId}`, {
      method: 'DELETE',
    }),
  getConversationHistory: (storyId: string, conversationId: string) =>
    apiFetch<ChatHistory>(`/stories/${storyId}/librarian/conversations/${conversationId}/chat`),
  conversationChat: (
    storyId: string,
    conversationId: string,
    message: string,
    clientRequestId?: string,
  ) => fetchRunEventStream(`/stories/${storyId}/librarian/conversations/${conversationId}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      ...(clientRequestId ? { clientRequestId } : {}),
    }),
  }),
}
