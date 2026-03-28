'use client'

/**
 * Sacred Mobile Chat Page — "The Divine Dialogue"
 *
 * This is the Kurukshetra. Where the conversation between
 * Arjuna and Krishna happens. Holy ground.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Mic, Send } from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SakhaMandala } from '@/components/sacred/SakhaMandala'
import { OmSymbol } from '@/components/sacred/icons/OmSymbol'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { apiFetch } from '@/lib/api'
import { queueOfflineOperation } from '@/lib/offline/syncService'

interface ChatMessage {
  id: string
  sender: 'user' | 'assistant'
  text: string
  timestamp: string
  status: 'sending' | 'sent' | 'error'
  summary?: string
}

// Conversation starters
const SACRED_STARTERS = [
  'What is my dharma in this moment?',
  'I am afraid. What does Krishna say?',
  'Explain the nature of the Atman',
  'How do I find peace amidst chaos?',
]

export default function SacredMobileChatPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputValue, setInputValue] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [connectionError, setConnectionError] = useState(false)

  // Auto scroll to bottom
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  useEffect(() => {
    scrollToBottom()
  }, [messages, scrollToBottom])

  // Initialize chat session
  useEffect(() => {
    const initSession = async () => {
      if (!isAuthenticated) return
      try {
        const response = await apiFetch('/api/chat/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
        if (response.ok) {
          const data = await response.json()
          setSessionId(data.session_id)
          if (data.messages && data.messages.length > 0) {
            setMessages(data.messages.map((msg: { id: string; role: string; content: string; created_at: string }) => ({
              id: msg.id,
              sender: msg.role === 'user' ? 'user' as const : 'assistant' as const,
              text: msg.content,
              timestamp: msg.created_at,
              status: 'sent' as const,
            })))
          }
        }
      } catch {
        setConnectionError(true)
      }
    }
    initSession()
  }, [isAuthenticated])

  // Send message
  const handleSendMessage = useCallback(async (text: string) => {
    if (!text.trim()) return
    const messageId = crypto.randomUUID()
    const timestamp = new Date().toISOString()

    const userMessage: ChatMessage = {
      id: messageId,
      sender: 'user',
      text,
      timestamp,
      status: 'sending',
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsLoading(true)
    triggerHaptic('light')

    try {
      queueOfflineOperation('chat_message', 'create', messageId, {
        session_id: sessionId,
        content: text,
        timestamp,
      })

      const response = await apiFetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev =>
          prev.map(msg => msg.id === messageId ? { ...msg, status: 'sent' } : msg)
        )
        const assistantMessage: ChatMessage = {
          id: data.message_id || crypto.randomUUID(),
          sender: 'assistant',
          text: data.response || 'I am here with you. Could you share more about what you are feeling?',
          timestamp: new Date().toISOString(),
          status: 'sent',
          summary: data.summary,
        }
        setMessages(prev => [...prev, assistantMessage])
        triggerHaptic('success')
      } else {
        throw new Error('Failed to get response')
      }
    } catch {
      setMessages(prev =>
        prev.map(msg => msg.id === messageId ? { ...msg, status: 'error' } : msg)
      )
      triggerHaptic('error')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, triggerHaptic])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleSendMessage(inputValue)
  }

  return (
    <MobileAppShell title="Sakha" showHeader={false} showTabBar={true}>
      <div className="flex flex-col h-full min-h-0" style={{ background: 'var(--sacred-cosmic-void)' }}>

        {/* ── Sacred Chat Header ── */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.04]"
          style={{ background: 'var(--sacred-yamuna-deep)' }}
        >
          <SakhaMandala size={40} animated glowIntensity="low" />
          <div className="flex-1 min-w-0">
            <h1 className="sacred-text-divine text-lg text-[var(--sacred-white)]">Sakha</h1>
            <p className="sacred-text-ui text-[10px] italic text-[var(--sacred-text-muted)]">
              The Paramatma is listening
            </p>
          </div>
          <button
            onClick={() => { triggerHaptic('selection'); router.push('/m/companion') }}
            className="sacred-btn-icon !w-9 !h-9"
            aria-label="Voice mode"
          >
            <Mic className="w-4 h-4 text-[var(--sacred-divine-gold)]" />
          </button>
        </div>

        {/* ── Messages Area ── */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 min-h-0">
          {/* Sacred background texture */}
          <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='100' cy='100' r='80' stroke='%23D4A017' fill='none' stroke-width='0.5'/%3E%3Ccircle cx='100' cy='100' r='60' stroke='%23D4A017' fill='none' stroke-width='0.5'/%3E%3Ccircle cx='100' cy='100' r='40' stroke='%23D4A017' fill='none' stroke-width='0.5'/%3E%3C/svg%3E")`,
              backgroundSize: '200px 200px',
              backgroundPosition: 'center',
            }}
          />

          {/* Conversation starters (when empty) */}
          {messages.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-6">
              <SakhaMandala size={80} animated glowIntensity="medium" />
              <p className="sacred-text-divine text-lg italic text-[var(--sacred-text-secondary)] text-center">
                What weighs upon your heart?
              </p>
              <div className="flex flex-wrap gap-2 justify-center max-w-sm">
                {SACRED_STARTERS.map((starter, i) => (
                  <motion.button
                    key={starter}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    onClick={() => handleSendMessage(starter)}
                    className="sacred-starter-chip text-left"
                  >
                    {starter}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg, i) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i === messages.length - 1 ? 0.1 : 0 }}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {/* Sakha avatar for assistant messages */}
              {msg.sender === 'assistant' && (
                <div className="flex-shrink-0 mr-2 mt-1">
                  <SakhaMandala size={28} animated={false} />
                </div>
              )}

              <div
                className={`max-w-[72%] px-4 py-3 ${
                  msg.sender === 'user'
                    ? 'sacred-msg-user'
                    : 'sacred-msg-sakha'
                }`}
              >
                <p className={`text-[15px] leading-relaxed ${
                  msg.sender === 'user'
                    ? 'sacred-text-ui text-[var(--sacred-white)]'
                    : 'sacred-text-scripture text-[var(--sacred-text-primary)]'
                }`}>
                  {msg.text}
                </p>
                {msg.status === 'error' && (
                  <p className="text-[10px] text-red-400 mt-1 sacred-text-ui">Failed to send</p>
                )}
              </div>
            </motion.div>
          ))}

          {/* Typing indicator */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="flex items-start gap-2"
              >
                <SakhaMandala size={28} animated />
                <div className="sacred-msg-sakha px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1">
                      <span className="sacred-typing-dot" />
                      <span className="sacred-typing-dot" />
                      <span className="sacred-typing-dot" />
                    </div>
                    <OmSymbol width={14} height={14} className="text-[var(--sacred-divine-gold)] opacity-50" />
                  </div>
                  <p className="sacred-text-ui text-[10px] italic text-[var(--sacred-text-muted)] mt-1">
                    Reflecting on dharma...
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* ── Sacred Chat Input ── */}
        <form
          onSubmit={handleSubmit}
          className="sacred-chat-input-area px-4 py-3 pb-[calc(12px+env(safe-area-inset-bottom,0px))]"
        >
          <div className="flex items-center gap-3">
            <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={connectionError ? 'Reconnecting...' : 'Ask Sakha anything...'}
              className="sacred-chat-input flex-1 px-4 py-3"
              disabled={connectionError}
            />
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-30 transition-opacity"
              style={{
                background: inputValue.trim()
                  ? 'var(--sacred-gradient-krishna-aura)'
                  : 'rgba(22, 26, 66, 0.8)',
                border: '1px solid rgba(212, 160, 23, 0.3)',
              }}
              aria-label="Send message"
            >
              <Send className="w-4.5 h-4.5 text-[var(--sacred-white)]" />
            </motion.button>
          </div>
        </form>
      </div>
    </MobileAppShell>
  )
}
