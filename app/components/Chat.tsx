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
const quickPromptLabels = [
  'Guide me through a neon breath reset',
  'I need a hype-yet-calm bedtime plan',
  'How do I calm racing thoughts fast?',
  'Remind me I’m safe and capable',
]

const quickStats = [
  { label: 'Response vibe', value: 'Empowering + calm' },
  { label: 'Avg latency', value: '<1s micro-delight' },
  { label: 'Trust', value: 'Safety filters on' },
]

const heroCopy = {
  title: 'Late-night clarity & calm',
  subtitle: 'KIAAN keeps you steady with neon-smooth micro-support.',
}

type QuickPrompt = {
  label: string
  message: string
  theme?: string
  application?: string
}

const Navbar = () => (
  <motion.nav
    className="relative z-10 flex items-center justify-between rounded-2xl bg-black/40 px-6 py-4 shadow-neon-strong ring-1 ring-vibrant-blue/40 backdrop-blur-lg"
    animate={{ boxShadow: '0 8px 24px rgba(0,255,255,.35)' }}
  >
    <div className="flex items-center gap-2 text-white">
      <Sparkles className="h-5 w-5 text-vibrant-pink" aria-hidden />
      <h1 className="text-2xl font-bold tracking-tight text-vibrant-blue">MindVibe</h1>
    </div>
    <ul className="flex items-center space-x-4 text-sm font-semibold text-slate-100/80">
      {navItems.map(item => (
        <motion.li
          key={item}
          whileHover={{ scale: 1.1, color: '#39ff14' }}
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
    if (isLoadingSession) return 'Syncing neon space...'
    if (isSending) return 'KIAAN is responding with glow'
    return 'Live & empowering'
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
    <div className="relative min-h-screen overflow-hidden bg-[#050510] pb-12 text-white">
      <ParticleBackground />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10">
        <Navbar />

        <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
          <div className="space-y-6 rounded-3xl bg-black/40 p-6 shadow-neon-strong ring-1 ring-vibrant-blue/40 backdrop-blur-xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <KiaanAvatar />
              <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                {quickStats.map(stat => (
                  <div key={stat.label} className="rounded-2xl bg-white/5 p-3 text-sm ring-1 ring-white/10">
                    <p className="text-xs uppercase tracking-[0.2em] text-vibrant-blue">{stat.label}</p>
                    <p className="flex items-center gap-2 text-base font-semibold text-white">
                      <Zap className="h-4 w-4 text-vibrant-green" aria-hidden />
                      {stat.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {quickPromptOptions.map(prompt => (
                  <button
                    key={prompt.label}
                    type="button"
                    onClick={() => handleQuickPrompt(prompt)}
                    className="rounded-md border border-indigo-100 bg-white px-3 py-2 text-xs font-medium text-indigo-700 shadow-sm transition hover:border-indigo-300 hover:bg-indigo-50 disabled:cursor-not-allowed"
                    disabled={isSending || isLoadingSession}
                  >
                    {prompt.label}
                  </button>
                ))}
              </div>

              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vibrant-blue">{statusLabel}</p>

              <div className="h-96 overflow-y-auto rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
                <div className="rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-2 text-sm text-red-100 shadow-neon-strong">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder="Drop your thought and watch KIAAN spark"
                  className="flex-1 rounded-xl border border-vibrant-blue/40 bg-white/5 px-4 py-3 text-sm text-white shadow-neon-strong outline-none transition focus:border-vibrant-pink/70 focus:ring-2 focus:ring-vibrant-pink/40"
                  disabled={isSending || isLoadingSession}
                />
                <button
                  type="submit"
                  disabled={isSending || isLoadingSession}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-two px-6 py-3 text-sm font-semibold text-white shadow-glow transition hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-vibrant-green/60 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Send message"
                >
                  {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  <span>{isSending ? 'Sending...' : 'Start Chat 🚀'}</span>
                </button>
              </form>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-vibrant-blue">{heroCopy.title}</p>
            <p className="text-xs text-slate-200/80">{heroCopy.subtitle}</p>
          </div>
        </div>

          <div className="space-y-4 rounded-3xl bg-white/5 p-6 ring-1 ring-vibrant-blue/25 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-vibrant-blue">MindVibe energy</p>
                <h3 className="text-2xl font-bold">Fast, vibrant, reassuring</h3>
                <p className="text-slate-200/80">Empowering micro-interactions, glowing buttons, and aurora gradients keep Gen Z vibes alive.</p>
              </div>
              <Sparkles className="h-6 w-6 text-vibrant-pink" aria-hidden />
            </div>

            <div className="flex flex-wrap gap-2">
              {quickPromptLabels.map(prompt => (
                <motion.button
                  key={prompt}
                  type="button"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-slate-100 ring-1 ring-vibrant-blue/40 transition hover:bg-vibrant-blue/20"
                  onClick={() => handleQuickLabel(prompt)}
                >
                  {prompt}
                </motion.button>
              ))}
            </div>

            <div className="space-y-3 rounded-2xl bg-black/30 p-4 ring-1 ring-white/10">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-one" aria-hidden />
                <div>
                  <p className="text-sm text-slate-200">Neon gradients</p>
                  <p className="text-xs text-slate-300/70">Aurora ribbons and glossy highlights feel futuristic.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-two" aria-hidden />
                <div>
                  <p className="text-sm text-slate-200">Micro-animations</p>
                  <p className="text-xs text-slate-300/70">Buttons bounce, bubbles glow, and particles shimmer.</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-vibrant-green/60" aria-hidden />
                <div>
                  <p className="text-sm text-slate-200">Empowering copy</p>
                  <p className="text-xs text-slate-300/70">Fast, direct language that cheers you on.</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-72 flex-col gap-3 overflow-y-auto pr-2">
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
          <div className="rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-2 text-sm text-red-100 shadow-neon-strong">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Drop your thought and watch KIAAN spark"
            className="flex-1 rounded-xl border border-vibrant-blue/40 bg-white/5 px-4 py-3 text-sm text-white shadow-neon-strong outline-none transition focus:border-vibrant-pink/70 focus:ring-2 focus:ring-vibrant-pink/40"
            disabled={isSending || isLoadingSession}
          />
          <button
            type="submit"
            disabled={isSending || isLoadingSession}
            className="neon-button disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Send message"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            <span>{isSending ? 'Sending...' : 'Start Chat 🚀'}</span>
          </button>
        </form>
      </div>
    </div>
  )
}

export default Chat
