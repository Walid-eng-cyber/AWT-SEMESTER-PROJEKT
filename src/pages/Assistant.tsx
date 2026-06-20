import { FormEvent, useMemo, useState } from 'react'
import { Bot, SendHorizontal, Sparkles, UserCircle2 } from 'lucide-react'
import Navbar from '../components/layout/Navbar'
import Sidebar from '../components/layout/Sidebar'
import Footer from '../components/layout/Footer'
import MobileBottomNav from '../components/layout/MobileBottomNav'
import { getAccessToken } from '../api/http'

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

export default function AssistantPage() {
  const [model, setModel] = useState(DEFAULT_MODEL)
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: 'I am Silvi, your booking room assistant. Ask me about rooms, bookings, events, or sign-in help.',
    },
  ])

  const canSend = useMemo(() => input.trim().length > 0 && !isLoading, [input, isLoading])

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
          model: model.trim(),
          messages: nextMessages.map((item) => ({
            role: item.role,
            content: item.content,
          })),
        }),
      })

      const payload = (await response.json()) as AssistantApiResponse

      if (!response.ok) {
        throw new Error(payload.message ?? `Request failed (${response.status}).`)
      }

      const assistantText = payload.text?.trim() ?? ''
      if (!assistantText) {
        throw new Error('The model returned an empty response. Try another model or prompt.')
      }

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: assistantText,
        },
      ])
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Assistant request failed.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar authenticated />
      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto">
          <div className="mb-8">
            <p className="text-xs text-brand-muted mb-1">Support</p>
            <h1 className="text-2xl font-bold text-brand-dark">AI Support</h1>
            <p className="text-sm text-brand-muted mt-2">Chat with an AI model through the backend Hugging Face router integration.</p>
          </div>

          <section className="card p-5 mb-6">
            <div className="grid grid-cols-1 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-brand-dark uppercase tracking-wide mb-1.5">Model</span>
                <input
                  type="text"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  placeholder={DEFAULT_MODEL}
                  className="input-field"
                />
              </label>
            </div>
            <p className="text-xs text-brand-muted mt-3">Your API key is stored server-side in backend environment variables.</p>
          </section>

          <section className="card flex flex-col min-h-[420px]">
            <div className="border-b border-brand-border px-5 py-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-brand-dark inline-flex items-center gap-2">
                <Sparkles size={15} className="text-brand-primary" />
                Assistant Chat
              </p>
              {isLoading && <span className="text-xs text-brand-muted">Thinking...</span>}
            </div>

            <div className="flex-1 px-5 py-4 space-y-3 overflow-y-auto">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && <Bot size={16} className="mt-1 text-brand-primary shrink-0" />}
                  <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed ${message.role === 'user' ? 'bg-brand-dark text-white' : 'bg-brand-surface text-brand-dark border border-brand-border'}`}>
                    {message.content}
                  </div>
                  {message.role === 'user' && <UserCircle2 size={16} className="mt-1 text-brand-dark shrink-0" />}
                </div>
              ))}
              {error && <p className="text-xs text-red-600">{error}</p>}
            </div>

            <form onSubmit={sendMessage} className="border-t border-brand-border px-4 py-3 flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask the assistant..."
                className="input-field"
              />
              <button type="submit" className="btn-primary shrink-0" disabled={!canSend}>
                <SendHorizontal size={16} />
                Send
              </button>
            </form>
          </section>
        </main>
      </div>

      <MobileBottomNav />
      <Footer />
    </div>
  )
}
