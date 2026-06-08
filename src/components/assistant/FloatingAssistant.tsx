import { FormEvent, useMemo, useState } from 'react'
import { Bot, MessageCircle, Minimize2, SendHorizontal } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import { getAccessToken } from '../../api/http'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
}

type AssistantApiResponse = {
  text?: string
  message?: string
}

const DEFAULT_MODEL = 'openai/gpt-oss-120b:cerebras'

export default function FloatingAssistant() {
  const { pathname } = useLocation()
  const [isOpen, setIsOpen] = useState(true)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'I am Silvi, your booking room assistant. How can I help?',
    },
  ])

  const hiddenOnPage = pathname.startsWith('/assistant') || pathname.startsWith('/support')
  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading])

  if (hiddenOnPage) {
    return null
  }

  async function sendMessage(event: FormEvent) {
    event.preventDefault()
    const text = input.trim()
    if (!text || isLoading) return

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setInput('')
    setError(null)
    setIsLoading(true)

    try {
      const token = getAccessToken()
      const response = await fetch('/api/v1/assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          model: DEFAULT_MODEL,
          maxTokens: 140,
          messages: nextMessages.map((item) => ({ role: item.role, content: item.content })),
        }),
      })

      const payload = (await response.json()) as AssistantApiResponse
      if (!response.ok) {
        throw new Error(payload.message ?? `Request failed (${response.status}).`)
      }

      const answer = payload.text?.trim() ?? ''
      if (!answer) {
        throw new Error('No reply from assistant.')
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: answer,
        },
      ])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Assistant request failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed right-4 bottom-20 lg:bottom-4 z-[70] w-[320px] max-w-[calc(100vw-2rem)]">
      {isOpen ? (
        <section className="card shadow-xl border-brand-border overflow-hidden">
          <header className="bg-brand-dark text-white px-3 py-2 flex items-center justify-between">
            <p className="text-xs font-semibold inline-flex items-center gap-1.5">
              <Bot size={14} /> AI Support
            </p>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white/80 hover:text-white"
              aria-label="Minimize AI support"
            >
              <Minimize2 size={14} />
            </button>
          </header>

          <div className="bg-white h-56 overflow-y-auto px-3 py-2 space-y-2">
            {messages.map((message) => (
              <div key={message.id} className={`text-xs leading-relaxed ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                <span className={`inline-block rounded-lg px-2.5 py-1.5 ${message.role === 'user' ? 'bg-brand-dark text-white' : 'bg-brand-surface border border-brand-border text-brand-dark'}`}>
                  {message.content}
                </span>
              </div>
            ))}
            {error && <p className="text-[11px] text-red-600">{error}</p>}
            {isLoading && <p className="text-[11px] text-brand-muted">Silvi is thinking...</p>}
          </div>

          <form onSubmit={sendMessage} className="border-t border-brand-border p-2 bg-white flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask Silvi..."
              className="input-field py-2 text-xs"
            />
            <button type="submit" className="btn-primary px-3 py-2 text-xs" disabled={!canSend}>
              <SendHorizontal size={13} />
            </button>
          </form>
        </section>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="btn-primary rounded-full px-4 py-2 text-xs shadow-lg"
        >
          <MessageCircle size={14} /> AI Support
        </button>
      )}
    </div>
  )
}
