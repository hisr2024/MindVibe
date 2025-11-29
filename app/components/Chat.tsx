'use client'

import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Loader2, Send, Sparkles } from 'lucide-react'

import { apiFetch } from '@/lib/api'

import { ChatBubble } from './ChatBubble'
import { KiaanAvatar } from './KiaanAvatar'
import { ParticleBackground } from './ParticleBackground'
import { Skeleton } from './ui/skeleton'

type Role = 'user' | 'assistant'

type ChatMessage = {
  id: string
  role: Role
  content: string
  status?: 'pending' | 'error'
}

type QuickPrompt = {
  label: string
  message: string
  theme?: string
  application?: string
}

const quickPrompts: QuickPrompt[] = [
  { label: 'Calm Mind 🧘‍♀️', message: 'I need help calming my thoughts.', theme: 'control_of_mind' },
  { label: 'Overcome Stress 🌻', message: 'I am feeling weighed down by stress.', application: 'stress_reduction' },
  { label: 'Purpose Boost 🌟', message: 'I feel a lack of purpose and direction.', theme: 'self_empowerment' },
  { label: 'Stay Disciplined 🔥', message: 'I want to stay consistent and disciplined.', theme: 'mastering_the_mind', application: 'self_discipline' },
]

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [isLoadingSession, setIsLoadingSession] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const heroCopy = useMemo(
    () => ({
      title: 'Fast, neon, reassuring',
      subtitle: 'Empowering micro-interactions, glowing buttons, and aurora gradients tuned for Gen Z focus.',
    }),
    [],
  )

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
          message.id === pendingAssistantMessage.id ? { ...message, content: 'Something went wrong. 💙', status: 'error' } : message,
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

  return (
    <div className="glass-aurora relative overflow-hidden rounded-3xl bg-black/60 p-6 text-white">
      <ParticleBackground />
      <div className="relative space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-100/80">
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 shadow-soft ring-1 ring-white/10">
              <Sparkles className="h-4 w-4" aria-hidden />
              Neon-fast replies
            </span>
            <span className="flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 shadow-soft ring-1 ring-white/10">
              <Sparkles className="h-4 w-4" aria-hidden />
              Gen Z glow
            </span>
            {isSending && (
              <span className="rounded-full bg-vibrant-blue/20 px-3 py-1 text-white shadow-soft ring-1 ring-vibrant-blue/50">
                Crafting a glow reply…
              </span>
            )}
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-vibrant-blue">{heroCopy.title}</p>
            <p className="text-xs text-slate-200/80">{heroCopy.subtitle}</p>
          </div>
        </div>

        <KiaanAvatar />

        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {quickPrompts.map(prompt => (
            <motion.button
              key={prompt.label}
              type="button"
              onClick={() => handleQuickPrompt(prompt)}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              className="rounded-xl border border-vibrant-blue/30 bg-white/5 px-3 py-2 text-xs font-medium text-white shadow-neon-strong transition hover:border-vibrant-pink/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vibrant-blue/50"
              disabled={isSending || isLoadingSession}
            >
              {prompt.label}
            </motion.button>
          ))}
        </div>

        <div
          className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
          aria-label="Chat log"
          role="log"
          aria-live="polite"
          aria-busy={isSending || isLoadingSession}
        >
          {isLoadingSession ? (
            <div className="space-y-2" aria-label="Loading chat">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-1/2" />
              <Skeleton className="h-5 w-3/4" />
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
