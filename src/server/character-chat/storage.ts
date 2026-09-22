import { mkdir, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { existsSync } from 'node:fs'
import { getActiveBranchId, getContentRoot, getScopedBranchId } from '../fragments/branches'
import { writeJsonAtomic } from '../fs-utils'
import { withKeyLock } from '../async-lock'
import { getRun } from '../runs'

// --- Types ---

export type PersonaMode =
  | { type: 'character'; characterId: string }
  | { type: 'stranger' }
  | { type: 'custom'; prompt: string }

export type CharacterChatTurnStatus = 'streaming' | 'complete' | 'error' | 'cancelled'

export interface CharacterChatMessage {
  role: 'user' | 'assistant'
  content: string
  reasoning?: string
  createdAt: string
  runId?: string
  status?: CharacterChatTurnStatus
  error?: string
}

export interface CharacterChatConversation {
  id: string
  characterId: string
  persona: PersonaMode
  storyPointFragmentId: string | null
  title: string
  messages: CharacterChatMessage[]
  createdAt: string
  updatedAt: string
}

export interface CharacterChatConversationSummary {
  id: string
  characterId: string
  persona: PersonaMode
  storyPointFragmentId: string | null
  title: string
  messageCount: number
  createdAt: string
  updatedAt: string
}

// --- ID generation ---

export function generateConversationId(): string {
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  return `cc-${ts}-${rand}`
}

// --- Path helpers ---

async function characterChatDir(dataDir: string, storyId: string): Promise<string> {
  const root = await getContentRoot(dataDir, storyId)
  return join(root, 'character-chat')
}

async function conversationsDir(dataDir: string, storyId: string): Promise<string> {
  const dir = await characterChatDir(dataDir, storyId)
  return join(dir, 'conversations')
}

async function conversationPath(dataDir: string, storyId: string, conversationId: string): Promise<string> {
  const dir = await conversationsDir(dataDir, storyId)
  return join(dir, `${conversationId}.json`)
}

async function conversationLockKey(
  dataDir: string,
  storyId: string,
  conversationId: string,
): Promise<string> {
  const branchId = getScopedBranchId(storyId) ?? await getActiveBranchId(dataDir, storyId)
  return `character-chat:${storyId}:${branchId}:${conversationId}`
}

// --- CRUD ---

export async function saveConversation(
  dataDir: string,
  storyId: string,
  conversation: CharacterChatConversation,
): Promise<void> {
  const dir = await conversationsDir(dataDir, storyId)
  await mkdir(dir, { recursive: true })
  await writeJsonAtomic(
    await conversationPath(dataDir, storyId, conversation.id),
    conversation,
  )
}

async function readConversationFile(
  dataDir: string,
  storyId: string,
  conversationId: string,
): Promise<CharacterChatConversation | null> {
  const path = await conversationPath(dataDir, storyId, conversationId)
  if (!existsSync(path)) return null
  const raw = await readFile(path, 'utf-8')
  return JSON.parse(raw) as CharacterChatConversation
}

export async function getConversation(
  dataDir: string,
  storyId: string,
  conversationId: string,
): Promise<CharacterChatConversation | null> {
  const conversation = await readConversationFile(dataDir, storyId, conversationId)
  if (!conversation) return null

  const branchId = getScopedBranchId(storyId) ?? await getActiveBranchId(dataDir, storyId)
  let changed = false
  const messages = conversation.messages.map((message) => {
    if (message.status !== 'streaming') return message
    const run = message.runId ? getRun(message.runId) : null
    if (run?.status === 'running' && run.branchId === branchId) return message
    changed = true
    return {
      ...message,
      status: 'error' as const,
      error: message.error ?? 'Generation was interrupted',
    }
  })

  return changed ? { ...conversation, messages } : conversation
}

export async function appendMessage(
  dataDir: string,
  storyId: string,
  conversationId: string,
  message: CharacterChatMessage,
): Promise<CharacterChatConversation | null> {
  const lockKey = await conversationLockKey(dataDir, storyId, conversationId)
  return withKeyLock(lockKey, async () => {
    const conversation = await readConversationFile(dataDir, storyId, conversationId)
    if (!conversation) return null
    const updated: CharacterChatConversation = {
      ...conversation,
      messages: [...conversation.messages, message],
      updatedAt: new Date().toISOString(),
    }
    await saveConversation(dataDir, storyId, updated)
    return updated
  })
}

export async function updateMessageByRunId(
  dataDir: string,
  storyId: string,
  conversationId: string,
  runId: string,
  patch: Partial<CharacterChatMessage>,
): Promise<CharacterChatConversation | null> {
  const lockKey = await conversationLockKey(dataDir, storyId, conversationId)
  return withKeyLock(lockKey, async () => {
    const conversation = await readConversationFile(dataDir, storyId, conversationId)
    if (!conversation) return null
    const index = conversation.messages.findIndex(message => message.runId === runId)
    if (index === -1) return conversation

    const messages = [...conversation.messages]
    messages[index] = { ...messages[index], ...patch }
    const updated: CharacterChatConversation = {
      ...conversation,
      messages,
      updatedAt: new Date().toISOString(),
    }
    await saveConversation(dataDir, storyId, updated)
    return updated
  })
}

export async function listConversations(
  dataDir: string,
  storyId: string,
  characterId?: string,
): Promise<CharacterChatConversationSummary[]> {
  const dir = await conversationsDir(dataDir, storyId)
  if (!existsSync(dir)) return []

  const entries = (await readdir(dir)).filter(entry => entry.endsWith('.json'))

  // Conversation files are independent. Reading them concurrently removes an
  // avoidable N-file waterfall while preserving fail-fast behavior for corrupt
  // JSON instead of silently hiding damaged conversations.
  const conversations = await Promise.all(entries.map(async (entry) => {
    const raw = await readFile(join(dir, entry), 'utf-8')
    return JSON.parse(raw) as CharacterChatConversation
  }))

  const summaries: CharacterChatConversationSummary[] = []
  for (const conv of conversations) {
    if (characterId && conv.characterId !== characterId) continue

    summaries.push({
      id: conv.id,
      characterId: conv.characterId,
      persona: conv.persona,
      storyPointFragmentId: conv.storyPointFragmentId,
      title: conv.title,
      messageCount: conv.messages.length,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
    })
  }

  // Sort newest first
  summaries.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  return summaries
}

export async function deleteConversation(
  dataDir: string,
  storyId: string,
  conversationId: string,
): Promise<boolean> {
  const path = await conversationPath(dataDir, storyId, conversationId)
  if (!existsSync(path)) return false
  const { unlink } = await import('node:fs/promises')
  await unlink(path)
  return true
}
