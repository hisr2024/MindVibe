'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import Particles from 'react-tsparticles'
import type { Engine } from 'tsparticles-engine'
import { loadFull } from 'tsparticles'
import { Loader2, Send, Sparkles, Star, Zap } from 'lucide-react'

import { apiFetch } from '@/lib/api'

type Role = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: Role
  content: string
  status?: 'pending' | 'error'
}

const navItems = ['Home', 'Journal', 'KIAAN Chat', 'Insights']

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

const ParticleBackground = () => {
  const particlesInit = useCallback(async (engine: Engine) => {
    await loadFull(engine)
  }, [])

  return (
    <Particles
      id="kiaan-particles"
      className="absolute inset-0"
      init={particlesInit}
      options={{
        fullScreen: false,
        background: { color: 'transparent' },
        fpsLimit: 30,
        particles: {
          color: { value: '#00d4ff' },
          links: { enable: true, color: '#ff4dff', opacity: 0.6, width: 1.1 },
          move: { enable: true, speed: 2.5, outModes: 'bounce' },
          number: { value: 50, density: { enable: true, area: 600 } },
          opacity: { value: 0.6 },
          size: { value: { min: 1.5, max: 4 } },
        },
        detectRetina: true,
      }}
    />
  )
}

const KiaanAvatar = () => (
  <motion.div
    className="flex items-center justify-start gap-4"
    animate={{ scale: [1, 1.08, 1], rotate: [0, 6, -6, 0] }}
    transition={{ repeat: Infinity, repeatType: 'mirror', duration: 6 }}
  >
    <motion.div
      animate={{ opacity: [0.8, 1, 0.8], scale: [1, 1.12, 1] }}
      transition={{ repeat: Infinity, duration: 3.6 }}
      className="p-4"
    >
      <div className="relative grid place-items-center rounded-full bg-gradient-two p-4 shadow-glow">
        <div className="pointer-events-none absolute inset-0 rounded-full bg-gradient-one opacity-40 blur-xl" aria-hidden />
        <Star className="h-12 w-12 text-white" />
      </div>
    </motion.div>
    <div className="max-w-xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vibrant-blue">KIAAN</p>
      <p className="text-lg font-semibold text-white">Hello, I’m KIAAN 🌟 Let’s chat for clarity!</p>
      <p className="text-sm text-slate-200/80">Fast, empowering, and tuned for late-night vibes.</p>
    </div>
  </motion.div>
)

const ChatBubble = ({ text, sender }: { text: string; sender: Role }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9, y: 8 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ duration: 0.28 }}
    className={`max-w-[70%] rounded-2xl px-4 py-3 text-sm shadow-neon-strong backdrop-blur-lg ${
      sender === 'assistant'
        ? 'bg-vibrant-blue/20 text-white ring-1 ring-vibrant-blue/40'
        : 'ml-auto bg-white/10 text-slate-100 ring-1 ring-vibrant-pink/30'
    }`}
    style={{ alignSelf: sender === 'user' ? 'flex-end' : 'flex-start' }}
  >
    {text}
  </motion.div>
)

const quickPrompts = [
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

type QuickPrompt = {
    label: string;
    message: string;
    theme?: string;
    application?: string;
};

const Chat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    startSession()
  }, [])

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

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

  const submitMessage = async (value: string) => {
    if (!value.trim() || isSending) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: value.trim(),
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
          body: JSON.stringify({ message: userMessage.content }),
        },
        sessionId || undefined,
      )

      if (!response.ok) {
        throw new Error('KIAAN is taking a moment to respond.')
      }

      const data = await response.json()
      setMessages(prev =>
        prev.map(message =>
          message.id === pendingAssistantMessage.id
            ? { ...message, content: data.response, status: undefined }
            : message,
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

  const sendMessage = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    submitMessage(input)
  }

  const statusLabel = useMemo(() => {
    if (isLoadingSession) return 'Syncing neon space...'
    if (isSending) return 'KIAAN is responding with glow'
    return 'Live & empowering'
  }, [isLoadingSession, isSending])

  return (
    <div className="relative overflow-hidden rounded-3xl border border-vibrant-blue/30 bg-[#050912] p-6 text-white shadow-neon-strong">
      <ParticleBackground />
      <div className="floating-blob -left-24 top-10 h-48 w-48 bg-vibrant-blue/20" aria-hidden />
      <div className="floating-blob -right-10 -bottom-6 h-52 w-52 bg-vibrant-pink/20" aria-hidden />
      <div className="relative z-10 space-y-6">
        <Navbar />

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-5 rounded-3xl bg-black/40 p-6 ring-1 ring-vibrant-blue/25 backdrop-blur-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <KiaanAvatar />
              <div className="rounded-full bg-vibrant-blue/20 px-4 py-2 text-sm text-white ring-1 ring-vibrant-blue/40">
                <span className="inline-flex items-center gap-2">
                  <Zap className="h-4 w-4" aria-hidden />
                  {statusLabel}
                </span>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {quickStats.map(item => (
                <div
                  key={item.label}
                  className="rounded-2xl bg-white/5 px-4 py-3 text-sm ring-1 ring-white/10 backdrop-blur-lg"
                >
                  <p className="text-slate-200/70">{item.label}</p>
                  <p className="text-lg font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>

            <div className="relative flex flex-col gap-3 overflow-hidden rounded-3xl bg-white/5 p-4 ring-1 ring-white/10 backdrop-blur-xl">
              <div className="absolute inset-0 bg-aurora-grid opacity-50" aria-hidden />
              <div className="relative flex flex-col gap-3">
                <div className="flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-200/80">
                  <span>Live chat</span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-vibrant-green animate-pulse" aria-hidden />
                    Active
                  </span>
                </div>
                <div className="flex flex-col gap-3">
                  {isLoadingSession ? (
                    <div className="flex h-72 items-center justify-center gap-2 rounded-2xl bg-black/40 ring-1 ring-white/10">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span className="text-slate-200">Connecting to KIAAN...</span>
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
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-red-400/40 bg-red-500/20 px-4 py-2 text-sm text-red-100 shadow-neon-strong">
                {error}
              </div>
            )}

            <form onSubmit={sendMessage} className="flex flex-col gap-3 rounded-2xl bg-black/40 p-4 ring-1 ring-white/10 backdrop-blur-lg">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-200/70">
                <span>Type to glow</span>
                <span className="rounded-full bg-white/10 px-3 py-1 text-[10px] text-white">Fast interactions</span>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
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
              </div>
              <div className="flex flex-wrap gap-2">
                {quickPrompts.map(prompt => (
                  <motion.button
                    key={prompt}
                    type="button"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.98 }}
                    className="rounded-full bg-white/10 px-3 py-1.5 text-xs text-slate-100 ring-1 ring-vibrant-blue/40 transition hover:bg-vibrant-blue/20"
                    onClick={() => submitMessage(prompt)}
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </form>
          </div>

          <div className="space-y-4 rounded-3xl bg-white/5 p-6 ring-1 ring-vibrant-blue/25 backdrop-blur-xl">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-vibrant-blue">MindVibe energy</p>
                <h3 className="text-2xl font-bold">Fast, vibrant, reassuring</h3>
                <p className="text-slate-200/80">
                  Empowering micro-interactions, glowing buttons, and aurora gradients keep Gen Z vibes alive.
                </p>
              </div>
              <Sparkles className="h-6 w-6 text-vibrant-pink" aria-hidden />
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

            <div className="rounded-2xl bg-gradient-two p-4 text-slate-900 shadow-glow">
              <p className="text-xs uppercase tracking-[0.2em] text-black/70">CTA</p>
              <h4 className="text-xl font-bold">Spark a session with KIAAN</h4>
              <p className="text-sm text-black/70">Snappy responses, luminous UI, and safe-space vibes.</p>
              <button className="mt-3 rounded-xl bg-black/70 px-4 py-2 text-sm font-semibold text-white shadow-neon-strong transition hover:scale-[1.02]">
                Start Chat 🚀
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chat
