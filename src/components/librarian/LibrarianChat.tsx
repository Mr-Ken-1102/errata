import { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type ChatEvent, type ChatHistory } from '@/lib/api'
import { useActiveBranchId } from '@/lib/query-keys'
import { useRunStream } from '@/hooks/use-run-stream'
import { Textarea } from '@/components/ui/textarea'
import { ScrollArea } from '@/components/ui/scroll-area'
import { EmptyHint } from '@/components/ui/prose-text'
import {
  AssistantMessageView,
  type AssistantMessage,
  type ChatMessage,
} from '@/components/chat/ChatMessageParts'
import { ChatSendButton } from '@/components/chat/ChatSendButton'

interface LibrarianChatProps {
  storyId: string
  conversationId?: string | null
  initialInput?: string
}

function toLocalChatMessage(message: ChatHistory['messages'][number]): ChatMessage {
  if (message.role === 'user') {
    return { role: 'user', content: message.content }
  }

  return {
    role: 'assistant',
    content: message.content,
    ...(message.reasoning ? { reasoning: message.reasoning } : {}),
    ...(message.toolCalls?.length
      ? {
          toolCalls: message.toolCalls.map((toolCall, index) => ({
            id: `${message.runId ?? 'stored'}-${index}`,
            toolName: toolCall.toolName,
            args: toolCall.args,
            ...(toolCall.result !== undefined ? { result: toolCall.result } : {}),
            ...(toolCall.error ? { error: toolCall.error } : {}),
          })),
        }
      : {}),
    ...(message.error ? { error: message.error } : {}),
  }
}

function applyEvent(message: AssistantMessage, event: ChatEvent): AssistantMessage {
  switch (event.type) {
    case 'text':
      return { ...message, content: message.content + event.text }
    case 'reasoning':
      return { ...message, reasoning: (message.reasoning ?? '') + event.text }
    case 'tool-call':
      return {
        ...message,
        toolCalls: [
          ...(message.toolCalls ?? []),
          { id: event.id, toolName: event.toolName, args: event.args ?? {} },
        ],
      }
    case 'tool-result':
      return {
        ...message,
        toolCalls: (message.toolCalls ?? []).map(toolCall =>
          toolCall.id === event.id ? { ...toolCall, result: event.result } : toolCall,
        ),
      }
    case 'tool-error':
      return {
        ...message,
        toolCalls: (message.toolCalls ?? []).map(toolCall =>
          toolCall.id === event.id ? { ...toolCall, error: event.error } : toolCall,
        ),
      }
    case 'error':
      return { ...message, error: event.error }
    default:
      return message
  }
}

export function LibrarianChat({ storyId, conversationId, initialInput }: LibrarianChatProps) {
  const queryClient = useQueryClient()
  const branchId = useActiveBranchId(storyId)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const initialInputAppliedRef = useRef<string | null>(null)
  const prevConversationIdRef = useRef<string | null | undefined>(undefined)
  const liveRef = useRef<AssistantMessage | null>(null)

  const historyQueryKey = useMemo(() => (
    conversationId
      ? ['librarian-conversation-history', storyId, branchId, conversationId]
      : ['librarian-chat-history', storyId, branchId]
  ), [branchId, conversationId, storyId])

  const fetchHistory = useCallback(() => (
    conversationId
      ? api.librarian.getConversationHistory(storyId, conversationId)
      : api.librarian.getChatHistory(storyId)
  ), [conversationId, storyId])

  const installHistory = useCallback((history: ChatHistory) => {
    const local = history.messages.map(toLocalChatMessage)
    setMessages(local)

    const lastStored = history.messages[history.messages.length - 1]
    const lastLocal = local[local.length - 1]
    liveRef.current = lastStored?.role === 'assistant'
      && lastStored.status === 'streaming'
      && lastLocal?.role === 'assistant'
      ? lastLocal
      : null
  }, [])

  const refreshHistory = useCallback(async () => {
    const history = await queryClient.fetchQuery({
      queryKey: historyQueryKey,
      queryFn: fetchHistory,
    })
    installHistory(history)
    return history
  }, [fetchHistory, historyQueryKey, installHistory, queryClient])

  const handleEvent = useCallback((event: ChatEvent) => {
    if (event.type === 'run-start') {
      // Cursor 0 replay starts from a clean assistant snapshot. Persisted user
      // history is already installed before auto-attach begins.
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

    const nextAssistant = applyEvent(
      liveRef.current ?? { role: 'assistant', content: '' },
      event,
    )
    liveRef.current = nextAssistant
    setMessages(previous => {
      const next = [...previous]
      if (next[next.length - 1]?.role === 'assistant') next[next.length - 1] = nextAssistant
      else next.push(nextAssistant)
      return next
    })
  }, [])

  const handleSettled = useCallback(async (
    status: 'running' | 'complete' | 'error' | 'cancelled',
    message?: string,
  ) => {
    liveRef.current = null
    if (message) setError(message)

    // Server persistence is authoritative. Replace the streamed approximation
    // with the exact stored turn once the run settles.
    try {
      await refreshHistory()
    } catch {
      // Keep the live view if history refetch itself fails.
    }

    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['fragments', storyId] }),
      ...(conversationId
        ? [queryClient.invalidateQueries({ queryKey: ['librarian-conversations', storyId] })]
        : []),
    ])

    if (status === 'cancelled') setError(null)
    textareaRef.current?.focus()
  }, [conversationId, queryClient, refreshHistory, storyId])

  const run = useRunStream({
    storyId,
    branchId,
    kind: 'librarian.chat',
    scopeId: conversationId ?? null,
    onEvent: handleEvent,
    onSettled: handleSettled,
    // Install durable history first. Then cursor replay can safely layer on top.
    autoAttach: loaded,
  })
  const isStreaming = run.isStreaming

  // Reset local history when switching named conversations.
  useEffect(() => {
    if (prevConversationIdRef.current !== conversationId) {
      prevConversationIdRef.current = conversationId
      setMessages([])
      setLoaded(false)
      setError(null)
      liveRef.current = null
    }
  }, [conversationId])

  // Branch changes are a different story timeline, even with the same conversation id.
  useEffect(() => {
    setMessages([])
    setLoaded(false)
    setError(null)
    liveRef.current = null
  }, [branchId])

  useEffect(() => {
    if (initialInput && initialInput !== initialInputAppliedRef.current) {
      setInput(initialInput)
      initialInputAppliedRef.current = initialInput
      setTimeout(() => textareaRef.current?.focus(), 0)
    }
  }, [initialInput])

  const { data: chatHistory } = useQuery({
    queryKey: historyQueryKey,
    queryFn: fetchHistory,
    staleTime: Infinity,
  })

  useEffect(() => {
    if (!chatHistory || loaded) return
    installHistory(chatHistory)
    setLoaded(true)
  }, [chatHistory, installHistory, loaded])

  const isNearBottomRef = useRef(true)

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    const scrollArea = messagesEndRef.current?.closest('[data-radix-scroll-area-viewport]')
    if (!scrollArea) return
    const handleScroll = () => {
      const threshold = 80
      isNearBottomRef.current =
        scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < threshold
    }
    scrollArea.addEventListener('scroll', handleScroll, { passive: true })
    return () => scrollArea.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (isNearBottomRef.current) scrollToBottom()
  }, [messages, scrollToBottom])

  // Grow the composer up to the same limit used by the shared chat hook.
  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = Math.min(element.scrollHeight, 400) + 'px'
  }, [input])

  const handleSend = useCallback(async () => {
    const text = input.trim()
    if (!text || !loaded) return
    if (isStreaming) {
      setError('Wait for the current reply to finish before sending another.')
      return
    }

    setInput('')
    setError(null)
    liveRef.current = { role: 'assistant', content: '' }
    setMessages(previous => [
      ...previous,
      { role: 'user', content: text },
      { role: 'assistant', content: '' },
    ])

    try {
      await run.start((clientRequestId) => (
        conversationId
          ? api.librarian.conversationChat(
              storyId,
              conversationId,
              text,
              clientRequestId,
            )
          : api.librarian.chat(storyId, text, clientRequestId)
      ))
    } catch (sendError) {
      setError(sendError instanceof Error ? sendError.message : 'Chat failed')
      // The server may already have persisted the user turn. Re-read rather
      // than guessing which part of the request landed.
      await refreshHistory().catch(() => {})
    } finally {
      textareaRef.current?.focus()
    }
  }, [conversationId, input, isStreaming, loaded, refreshHistory, run, storyId])

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
    <div className="flex flex-col h-full" data-component-id="librarian-chat-root">
      <ScrollArea className="flex-1 min-h-0" data-component-id="librarian-chat-scroll">
        <div className="p-3 space-y-3">
          {messages.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-12 text-center"
              data-component-id="librarian-chat-empty"
            >
              <EmptyHint className="max-w-[240px]">
                Ask the librarian to make changes across your story — update characters,
                adjust guidelines, or reshape knowledge.
              </EmptyHint>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={`${message.role}-${index}`}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-xs ${
                  message.role === 'user'
                    ? 'bg-primary/10 text-foreground'
                    : 'bg-card/50 border border-border/30 text-foreground/80'
                }`}
              >
                {message.role === 'assistant' ? (
                  <AssistantMessageView
                    msg={message}
                    streaming={isStreaming && index === messages.length - 1}
                    storyId={storyId}
                  />
                ) : (
                  <div className="break-words whitespace-pre-wrap">{message.content}</div>
                )}
              </div>
            </div>
          ))}

          {run.isReconnecting && (
            <div
              className="text-[0.625rem] text-muted-foreground italic"
              data-component-id="librarian-chat-reconnecting"
            >
              Reconnecting — the librarian is still working on the server.
            </div>
          )}

          {error && (
            <div className="text-xs text-destructive bg-destructive/5 rounded-md p-2">
              {error}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-border/30 p-3 space-y-2">
        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the librarian..."
            disabled={isStreaming || !loaded}
            className="min-h-[40px] max-h-[400px] resize-none text-xs bg-transparent placeholder:italic placeholder:text-muted-foreground flex-1"
            rows={1}
            data-component-id="librarian-chat-input"
          />
          <ChatSendButton
            isStreaming={isStreaming}
            canSend={loaded && !!input.trim()}
            onSend={() => { void handleSend() }}
            onStop={() => { void run.cancel() }}
            stopLabel="Stop the librarian"
            idPrefix="librarian-chat"
          />
        </div>

        <p className="text-[0.625rem] text-muted-foreground text-center">
          Enter to send, Shift+Enter for newline
        </p>
      </div>
    </div>
  )
}
