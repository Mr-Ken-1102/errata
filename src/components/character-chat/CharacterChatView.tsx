import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type ChatEvent, type Fragment } from '@/lib/api'
import type { PersonaMode, CharacterChatConversationSummary } from '@/lib/api/types'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Caption, EmptyHint } from '@/components/ui/prose-text'
import { AssistantMessageView, type AssistantMessage, type ChatMessage } from '@/components/chat/ChatMessageParts'
import { ChatSendButton } from '@/components/chat/ChatSendButton'
import { useRunStream } from '@/hooks/use-run-stream'
import { CharacterAvatar } from '@/components/shared/CharacterAvatar'
import { ChatConfig } from './ChatConfig'
import { ConversationList } from './ConversationList'
import { q, useActiveBranchId } from '@/lib/query-keys'

interface CharacterChatViewProps {
  storyId: string
  initialCharacterId?: string | null
  onClose: () => void
}

export function CharacterChatView({ storyId, initialCharacterId, onClose }: CharacterChatViewProps) {
  const queryClient = useQueryClient()
  const branchId = useActiveBranchId(storyId)

  // Config state
  const [characterId, setCharacterId] = useState<string | null>(initialCharacterId ?? null)
  const [persona, setPersona] = useState<PersonaMode>({ type: 'stranger' })
  const [storyPointId, setStoryPointId] = useState<string | null>(null)

  // Conversation state
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showConversations, setShowConversations] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pendingFirstMessage, setPendingFirstMessage] = useState<string | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const liveRef = useRef<AssistantMessage | null>(null)
  const conversationIdRef = useRef<string | null>(null)

  useEffect(() => {
    conversationIdRef.current = conversationId
  }, [conversationId])

  const activeConversationStorageKey = useMemo(
    () => `errata:character-chat:active:${storyId}:${branchId ?? ''}`,
    [branchId, storyId],
  )

  const installConversation = useCallback((conversation: Awaited<ReturnType<typeof api.characterChat.getConversation>>) => {
    setCharacterId(conversation.characterId)
    setPersona(conversation.persona)
    setStoryPointId(conversation.storyPointFragmentId)
    setConversationId(conversation.id)
    conversationIdRef.current = conversation.id
    setMessages(conversation.messages.map((message): ChatMessage => (
      message.role === 'assistant'
        ? {
            role: 'assistant',
            content: message.content,
            ...(message.reasoning ? { reasoning: message.reasoning } : {}),
            ...(message.error ? { error: message.error } : {}),
          }
        : { role: 'user', content: message.content }
    )))
    const last = conversation.messages[conversation.messages.length - 1]
    liveRef.current = last?.role === 'assistant' && last.status === 'streaming'
      ? {
          role: 'assistant',
          content: last.content,
          ...(last.reasoning ? { reasoning: last.reasoning } : {}),
          ...(last.error ? { error: last.error } : {}),
        }
      : null
  }, [])

  const refreshConversation = useCallback(async () => {
    const currentId = conversationIdRef.current
    if (!currentId) return null
    const conversation = await api.characterChat.getConversation(storyId, currentId)
    installConversation(conversation)
    return conversation
  }, [installConversation, storyId])

  const handleRunEvent = useCallback((event: ChatEvent) => {
    if (event.type === 'run-start') {
      const fresh: AssistantMessage = { role: 'assistant', content: '' }
      liveRef.current = fresh
      setMessages(previous => {
        const next = [...previous]
        if (next[next.length - 1]?.role === 'assistant') next[next.length - 1] = fresh
        else next.push(fresh)
        return next
      })
      return
    }
    if (event.type === 'run-end' || event.type === 'keepalive') return

    const current = liveRef.current ?? { role: 'assistant' as const, content: '' }
    let next = current
    switch (event.type) {
      case 'text':
        next = { ...current, content: current.content + event.text }
        break
      case 'reasoning':
        next = { ...current, reasoning: (current.reasoning ?? '') + event.text }
        break
      case 'error':
        next = { ...current, error: event.error }
        break
      default:
        return
    }

    liveRef.current = next
    setMessages(previous => {
      const copy = [...previous]
      if (copy[copy.length - 1]?.role === 'assistant') copy[copy.length - 1] = next
      else copy.push(next)
      return copy
    })
  }, [])

  const handleRunSettled = useCallback(async (
    status: 'running' | 'complete' | 'error' | 'cancelled',
    message?: string,
  ) => {
    liveRef.current = null
    if (message) setError(message)
    try {
      await refreshConversation()
    } catch {
      // Keep streamed state if the authoritative reload fails.
    }
    await queryClient.invalidateQueries({ queryKey: ['character-chat-conversations', storyId] })
    if (status === 'cancelled') setError(null)
    textareaRef.current?.focus()
  }, [queryClient, refreshConversation, storyId])

  const run = useRunStream({
    storyId,
    branchId,
    kind: 'character-chat',
    scopeId: conversationId,
    onEvent: handleRunEvent,
    onSettled: handleRunSettled,
    // During the first-send handoff the conversation id has just been created,
    // but the pending message has not started yet. Avoid an attach/start race.
    autoAttach: !!conversationId && pendingFirstMessage === null,
  })
  const isStreaming = run.isStreaming || pendingFirstMessage !== null

  // Data queries
  const { data: allFragments } = useQuery(q.fragments(storyId, branchId))

  const { data: proseChain } = useQuery(q.proseChain(storyId, branchId))

  const characters = (allFragments ?? []).filter((f) => f.type === 'character')
  const proseFragments = (allFragments ?? []).filter((f) => f.type === 'prose')

  // Build media lookup for character portraits
  const mediaById = useMemo(() => {
    const map = new Map<string, Fragment>()
    for (const f of allFragments ?? []) {
      if (f.type === 'image' || f.type === 'icon') map.set(f.id, f)
    }
    return map
  }, [allFragments])

  // Auto-select first character if none selected
  useEffect(() => {
    if (!characterId && characters.length > 0) {
      setCharacterId(characters[0].id)
    }
  }, [characterId, characters])

  const selectedCharacter = characters.find((c) => c.id === characterId)

  // Scroll to bottom on new messages (only if already near bottom)
  const isNearBottomRef = useRef(true)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const scrollArea = messagesEndRef.current?.closest('[data-radix-scroll-area-viewport]')
    if (!scrollArea) return
    const handleScroll = () => {
      const threshold = 80
      isNearBottomRef.current = scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < threshold
    }
    scrollArea.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollArea.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isNearBottomRef.current) {
      scrollToBottom()
    }
  }, [messages, scrollToBottom])

  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = Math.min(element.scrollHeight, 400) + 'px'
  }, [input])

  const resetConversationState = useCallback(() => {
    setConversationId(null)
    conversationIdRef.current = null
    setMessages([])
    setError(null)
    liveRef.current = null
    setPendingFirstMessage(null)
  }, [])

  const clearActiveConversation = useCallback(() => {
    try { sessionStorage.removeItem(activeConversationStorageKey) } catch { /* ignore */ }
    resetConversationState()
  }, [activeConversationStorageKey, resetConversationState])

  // Handle character change — reset conversation.
  const handleCharacterChange = useCallback((id: string) => {
    setCharacterId(id)
    clearActiveConversation()
  }, [clearActiveConversation])

  // Start new conversation without leaving an empty persisted conversation.
  const startNewConversation = useCallback(() => {
    clearActiveConversation()
    setShowConversations(false)
    textareaRef.current?.focus()
  }, [clearActiveConversation])

  const resumeConversation = useCallback(async (conv: CharacterChatConversationSummary) => {
    try {
      const full = await api.characterChat.getConversation(storyId, conv.id)
      installConversation(full)
      try { sessionStorage.setItem(activeConversationStorageKey, full.id) } catch { /* ignore */ }
      setError(null)
      setShowConversations(false)
    } catch (resumeError) {
      setError(resumeError instanceof Error ? resumeError.message : 'Failed to load conversation')
    }
  }, [activeConversationStorageKey, installConversation, resetConversationState, storyId])

  // Restore the conversation that was open in this branch so a page reload can
  // reattach to its server-owned run.
  useEffect(() => {
    let cancelled = false
    resetConversationState()

    let saved: string | null = null
    try { saved = sessionStorage.getItem(activeConversationStorageKey) } catch { /* ignore */ }
    if (!saved) return

    void api.characterChat.getConversation(storyId, saved).then((conversation) => {
      if (cancelled) return
      installConversation(conversation)
    }).catch(() => {
      try { sessionStorage.removeItem(activeConversationStorageKey) } catch { /* ignore */ }
    })

    return () => { cancelled = true }
  }, [activeConversationStorageKey, installConversation, storyId])

  const startExistingConversationTurn = useCallback(async (conversationIdToUse: string, text: string) => {
    await run.start((clientRequestId) =>
      api.characterChat.chat(
        storyId,
        conversationIdToUse,
        text,
        clientRequestId,
      ),
    )
  }, [run, storyId])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming || !characterId) return

    setInput('')
    setError(null)
    liveRef.current = { role: 'assistant', content: '' }
    setMessages(previous => [
      ...previous,
      { role: 'user', content: text },
      { role: 'assistant', content: '' },
    ])

    if (!conversationId) {
      // Two-phase first send: create the scope now; start the run only after
      // React has rendered useRunStream with that concrete conversation id.
      setPendingFirstMessage(text)
      try {
        const conversation = await api.characterChat.createConversation(storyId, {
          characterId,
          persona,
          storyPointFragmentId: storyPointId,
        })
        conversationIdRef.current = conversation.id
        setConversationId(conversation.id)
        try { sessionStorage.setItem(activeConversationStorageKey, conversation.id) } catch { /* ignore */ }
      } catch (createError) {
        setPendingFirstMessage(null)
        setMessages(previous => previous.slice(0, Math.max(0, previous.length - 2)))
        setInput(text)
        setError(createError instanceof Error ? createError.message : 'Failed to create conversation')
      }
      return
    }

    try {
      await startExistingConversationTurn(conversationId, text)
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Chat failed')
      await refreshConversation().catch(() => {})
    } finally {
      textareaRef.current?.focus()
    }
  }, [
    activeConversationStorageKey,
    characterId,
    conversationId,
    input,
    isStreaming,
    persona,
    refreshConversation,
    startExistingConversationTurn,
    storyId,
    storyPointId,
  ])

  // Complete the first-send handoff only after useRunStream has been rendered
  // with the newly created conversation id.
  useEffect(() => {
    if (!conversationId || pendingFirstMessage === null) return
    const text = pendingFirstMessage
    let cancelled = false

    void startExistingConversationTurn(conversationId, text).catch(async (sendError) => {
      if (cancelled) return
      setError(sendError instanceof Error ? sendError.message : 'Chat failed')
      await refreshConversation().catch(() => {})
    }).finally(() => {
      if (!cancelled) {
        setPendingFirstMessage(null)
        textareaRef.current?.focus()
      }
    })

    return () => { cancelled = true }
  }, [conversationId, pendingFirstMessage, refreshConversation, startExistingConversationTurn])

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter'
      && !event.shiftKey
      && !event.nativeEvent.isComposing
    ) {
      event.preventDefault()
      void handleSend()
    }
  }, [handleSend])

  return (
    <div className="flex flex-col h-full relative" data-component-id="character-chat-view">
      {/* Config bar */}
      <ChatConfig
        characters={characters}
        selectedCharacterId={characterId}
        onCharacterChange={handleCharacterChange}
        persona={persona}
        onPersonaChange={setPersona}
        proseChain={proseChain ?? null}
        proseFragments={proseFragments}
        storyPointId={storyPointId}
        onStoryPointChange={setStoryPointId}
        onShowConversations={() => setShowConversations(true)}
        onClose={onClose}
        disabled={isStreaming}
        mediaById={mediaById}
      />

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0" data-component-id="character-chat-scroll">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
          {/* Empty state */}
          {messages.length === 0 && selectedCharacter && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <CharacterAvatar character={selectedCharacter} mediaById={mediaById} size="lg" />
              <div>
                <h3 className="font-display text-xl tracking-tight mb-1">
                  {selectedCharacter.name}
                </h3>
                <Caption className="italic max-w-[280px]">
                  {selectedCharacter.description}
                </Caption>
              </div>
              <p className="text-[0.6875rem] text-muted-foreground max-w-[240px] leading-relaxed">
                Start a conversation. The character will respond in their voice, knowing only the story events up to your selected point.
              </p>
            </div>
          )}

          {/* No character selected */}
          {messages.length === 0 && !selectedCharacter && characters.length > 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <EmptyHint>
                Select a character to begin.
              </EmptyHint>
            </div>
          )}

          {/* No characters in story */}
          {characters.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <EmptyHint className="max-w-[240px]">
                Create character fragments in your story first, then return here to chat with them.
              </EmptyHint>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => {
            const isFirstAssistantInGroup = msg.role === 'assistant' && (i === 1 || (i > 0 && messages[i - 1]?.role === 'user'))
            return (
              <div
                key={`${msg.role}-${i}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${
                  isFirstAssistantInGroup ? 'items-start gap-2.5' : msg.role === 'assistant' ? 'pl-[34px]' : ''
                }`}
              >
                {isFirstAssistantInGroup && selectedCharacter && (
                  <CharacterAvatar character={selectedCharacter} mediaById={mediaById} size="sm" />
                )}
                <div
                  className={`max-w-[80%] rounded-xl px-4 py-2.5 text-[0.8125rem] leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary/8 text-foreground'
                      : 'bg-card/60 border border-border/20 text-foreground/85'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div>
                      {isFirstAssistantInGroup && (
                        <div className="font-display text-[0.6875rem] text-primary/50 mb-1 tracking-wide">
                          {selectedCharacter?.name}
                        </div>
                      )}
                      <div className="font-prose">
                        <AssistantMessageView
                          msg={msg}
                          streaming={isStreaming && i === messages.length - 1}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="break-words whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>
              </div>
            )
          })}

          {error && (
            <div className="text-xs text-destructive bg-destructive/5 rounded-lg p-3">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="border-t border-border/20 bg-card/20">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex gap-2 items-end">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                selectedCharacter
                  ? `Say something to ${selectedCharacter.name}...`
                  : 'Select a character first...'
              }
              disabled={isStreaming || !characterId}
              className="min-h-[44px] max-h-[400px] resize-none text-[0.8125rem] bg-transparent
                placeholder:italic placeholder:text-muted-foreground flex-1 border-border/30
                focus-visible:ring-primary/20"
              rows={1}
              data-component-id="character-chat-input"
            />
            <ChatSendButton
              isStreaming={isStreaming}
              canSend={!!input.trim() && !!characterId}
              onSend={() => { void handleSend() }}
              onStop={() => { void run.cancel() }}
              stopLabel={`Stop ${selectedCharacter?.name ?? 'the character'}`}
              idPrefix="character-chat"
              size="md"
            />
          </div>

          <p className="text-[0.625rem] text-muted-foreground text-center mt-2">
            Enter to send · Shift+Enter for newline
          </p>
        </div>
      </div>

      {/* Conversation list overlay */}
      {showConversations && (
        <ConversationList
          storyId={storyId}
          characterId={characterId}
          characters={characters}
          mediaById={mediaById}
          onSelect={resumeConversation}
          onNew={startNewConversation}
          onClose={() => setShowConversations(false)}
        />
      )}
    </div>
  )
}
