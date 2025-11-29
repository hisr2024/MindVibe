'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Send, Sparkles, Zap } from 'lucide-react'

import { apiFetch } from '@/lib/api'

import { ChatBubble } from './ChatBubble'
import { KiaanAvatar } from './KiaanAvatar'
import { ParticleBackground } from './ParticleBackground'

type Role = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: Role
  content: string
  status?: 'pending' | 'error'
}

const navItems = ['Home', 'Journal', 'KIAAN Chat', 'Insights']

const quickStats = [
  { label: 'Tone', value: 'Steady & kind' },
  { label: 'Model', value: 'GPT-4o core' },
  { label: 'Grounding', value: 'Gita-inspired' },
]

const heroCopy = {
  title: 'Steady, soothing support',
  subtitle: 'KIAAN stays calm and concise.',
}

type QuickPrompt = {
  label: string
  message: string
  theme?: string
  application?: string
}

const Navbar = () => (
  <motion.nav
    className="relative z-10 flex items-center justify-between rounded-2xl bg-white/80 px-6 py-4 shadow-soft ring-1 ring-vibrant-blue/30 backdrop-blur-lg"
    animate={{ boxShadow: '0 8px 28px rgba(16,37,54,.14)' }}
  >
    <div className="flex items-center gap-2 text-ink-100">
      <Sparkles className="h-5 w-5 text-vibrant-pink" aria-hidden />
      <h1 className="text-2xl font-bold tracking-tight text-ink-100">MindVibe</h1>
    </div>
    <ul className="flex items-center space-x-4 text-sm font-semibold text-ink-300">
      {navItems.map(item => (
        <motion.li
          key={item}
          whileHover={{ scale: 1.05, color: '#6bb8c7' }}
          className="relative cursor-pointer px-2 py-1 transition"
        >
          <span className="relative z-10">{item}</span>
          <motion.span
            className="absolute inset-x-0 -bottom-1 h-0.5 origin-left bg-gradient-one"
            initial={{ scaleX: 0 }}
            whileHover={{ scaleX: 1 }}
            transition={{ duration: 0.25 }}
            aria-hidden
          />
        </motion.li>
      ))}
    </ul>
  </motion.nav>
)

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const quickPromptOptions: QuickPrompt[] = [
    {
      label: 'Calm Mind 🧘‍♀️',
      message: 'I need help calming my thoughts.',
      theme: 'control_of_mind',
    },
    {
      label: 'Overcome Stress 🌻',
      message: 'I am feeling weighed down by stress.',
      application: 'stress_reduction',
    },
    {
      label: 'Purpose Boost 🌟',
      message: 'I feel a lack of purpose and direction.',
      theme: 'self_empowerment',
    },
    {
      label: 'Stay Disciplined 🔥',
      message: 'I want to stay consistent and disciplined.',
      theme: 'mastering_the_mind',
      application: 'self_discipline',
    },
  ]

  const statusLabel = useMemo(() => {
    if (isLoadingSession) return 'Connecting softly...'
    if (isSending) return 'KIAAN is replying'
    return 'Ready to listen'
  }, [isLoadingSession, isSending])

  useEffect(() => {
    startSession()
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const startSession = async () => {
    setIsLoadingSession(true)
    setError(null)
    try {
      const response = await apiFetch('/api/chat/start', { method: 'POST' })
      if (!response.ok) {
        throw new Error('Failed to start session')
      }
      const data = await response.json()
      setSessionId(data.session_id)
      setMessages([
        {
          id: data.session_id,
          role: 'assistant',
          content: data.message,
        },
      ])
    } catch (err) {
      setError('Unable to connect to KIAAN. Please try again.')
    } finally {
      setIsLoadingSession(false)
    }
  }

  const sendMessage = async ({ content, theme, application }: { content: string; theme?: string; application?: string }) => {
    if (!content.trim()) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
    }

    const pendingAssistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: 'KIAAN is thinking... 💭',
      status: 'pending',
    }

    setMessages(prev => [...prev, userMessage, pendingAssistantMessage])
    setInput('')
    setIsSending(true)
    setError(null)

    try {
      const response = await apiFetch(
        '/api/chat/message',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: userMessage.content,
            ...(theme ? { theme } : {}),
            ...(application ? { application } : {}),
          }),
        },
        sessionId || undefined,
      )

      if (!response.ok) {
        throw new Error('KIAAN is taking a moment to respond.')
      }

      const data = await response.json()
      setMessages(prev =>
        prev.map(message =>
          message.id === pendingAssistantMessage.id ? { ...message, content: data.response, status: undefined } : message,
        ),
      )
    } catch (err) {
      setError('KIAAN is taking a moment... please try again.')
      setMessages(prev =>
        prev.map(message =>
          message.id === pendingAssistantMessage.id
            ? { ...message, content: 'Something went wrong. 💙', status: 'error' }
            : message,
        ),
      )
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!input.trim()) return
    void sendMessage({ content: input })
  }

  const handleQuickPrompt = (prompt: QuickPrompt) => {
    void sendMessage({
      content: prompt.message,
      theme: prompt.theme,
      application: prompt.application,
    })
  }

  const handleQuickLabel = (prompt: string) => {
    void sendMessage({ content: prompt })
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#eef4f6] to-[#dfe9ef] pb-12 text-ink-100">
      <ParticleBackground />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <Navbar />

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6 rounded-3xl bg-white/85 p-6 shadow-neon-strong ring-1 ring-vibrant-blue/20 backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <KiaanAvatar />
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                {quickStats.map(stat => (
                  <div key={stat.label} className="rounded-2xl bg-white p-3 text-sm ring-1 ring-vibrant-blue/20">
                    <p className="text-xs uppercase tracking-[0.2em] text-vibrant-blue">{stat.label}</p>
                    <p className="flex items-center gap-2 text-base font-semibold text-ink-100">
                      <Zap className="h-4 w-4 text-vibrant-green" aria-hidden />
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-white/90 p-4 ring-1 ring-vibrant-blue/20">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {quickPromptOptions.map(prompt => (
                  <button
                    key={prompt.label}
                    type="button"
                    onClick={() => handleQuickPrompt(prompt)}
                    className="rounded-md border border-calm-200 bg-white px-3 py-2 text-xs font-medium text-ink-100 shadow-sm transition hover:border-vibrant-blue/40 hover:bg-calm-100 disabled:cursor-not-allowed"
                    disabled={isSending || isLoadingSession}
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-300">{statusLabel}</p>

              <div className="h-96 overflow-y-auto rounded-lg border border-calm-200 bg-white p-4 shadow-sm">
                {isLoadingSession ? (
                  <div className="flex h-full items-center justify-center gap-2 text-slate-600">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Connecting to KIAAN...</span>
                  </div>
                ) : (
                  <div className="flex h-80 flex-col gap-3 overflow-y-auto pr-2">
                    <AnimatePresence initial={false}>
                      {messages.map(message => (
                        <ChatBubble key={message.id} text={message.content} sender={message.role} />
                      ))}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {error && (
                <div className="rounded-xl border border-vibrant-pink/30 bg-vibrant-pink/10 px-4 py-2 text-sm text-ink-100 shadow-soft">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Share a quick thought for KIAAN"
                  className="flex-1 rounded-xl border border-calm-200 bg-white px-4 py-3 text-sm text-ink-100 shadow-soft outline-none transition focus:border-vibrant-blue/50 focus:ring-2 focus:ring-vibrant-blue/30"
                  disabled={isSending || isLoadingSession}
                />
                <button
                  type="submit"
                  disabled={isSending || isLoadingSession}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-two px-6 py-3 text-sm font-semibold text-ink-100 shadow-glow transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-vibrant-green/40 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Send message"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>{isSending ? 'Sending...' : 'Start Chat 🚀'}</span>
                </button>
              </form>
            </div>
          </div>
          <div className="text-right text-ink-300">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-vibrant-blue">{heroCopy.title}</p>
            <p className="text-xs text-ink-300/80">{heroCopy.subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
