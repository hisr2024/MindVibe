'use client'

/**
 * Mobile KIAAN Voice Companion Page
 *
 * Full voice-first conversational experience with KIAAN:
 * - Tap-to-talk voice input with visual pulse
 * - AI-powered voice responses (3-tier fallback)
 * - Real-time transcript display
 * - Mood-reactive visual feedback
 * - Wake word activation ("Hey KIAAN")
 * - Conversation history
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import {
  Mic,
  MicOff,
  X,
  MessageSquare,
  Volume2,
  VolumeX,
  ChevronLeft,
  Sparkles,
} from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useKiaanVoice } from '@/hooks/useKiaanVoice'
import { apiFetch } from '@/lib/api'

interface ConversationMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  mood?: string
  timestamp: string
  aiTier?: string
}

export default function MobileVoiceCompanionPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()

  const [sessionId, setSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showTranscript, setShowTranscript] = useState(true)
  const [currentMood, setCurrentMood] = useState<string>('neutral')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const {
    speak,
    isSpeaking,
    startListening,
    stopListening,
    isListening,
    transcript,
    interimTranscript,
    stopAll,
    isSupported,
    error: voiceError,
  } = useKiaanVoice({
    onTranscript: (text) => {
      if (text.trim()) {
        handleUserMessage(text.trim())
      }
    },
    onError: (err) => {
      console.error('[VoiceCompanion] Voice error:', err)
    },
  })

  // Initialize session
  useEffect(() => {
    if (!isAuthenticated) return

    const initSession = async () => {
      try {
        const response = await apiFetch('/api/voice-companion/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })

        if (response.ok) {
          const data = await response.json()
          setSessionId(data.session_id)

          const greeting: ConversationMessage = {
            id: `greeting-${Date.now()}`,
            role: 'assistant',
            text: data.greeting || 'Hey friend! I\'m KIAAN. Tap the mic and let\'s talk.',
            timestamp: new Date().toISOString(),
          }
          setMessages([greeting])

          if (!isMuted) {
            await speak(greeting.text)
          }
        }
      } catch {
        const fallbackGreeting: ConversationMessage = {
          id: `greeting-${Date.now()}`,
          role: 'assistant',
          text: 'Hey! I\'m KIAAN, your wisdom companion. Tap the mic to start our conversation.',
          timestamp: new Date().toISOString(),
        }
        setMessages([fallbackGreeting])
        setSessionId(`local_${Date.now()}`)
      }
    }

    initSession()
  }, [isAuthenticated]) // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' })
  }, [messages])

  const handleUserMessage = useCallback(async (text: string) => {
    if (isProcessing) return

    const userMsg: ConversationMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    }
    setMessages(prev => [...prev, userMsg])
    setIsProcessing(true)
    triggerHaptic('light')

    try {
      const response = await apiFetch('/api/voice-companion/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          language: 'en',
          content_type: 'text',
        }),
      })

      if (response.ok) {
        const data = await response.json()

        if (data.mood) setCurrentMood(data.mood)

        const assistantMsg: ConversationMessage = {
          id: data.message_id || `assistant-${Date.now()}`,
          role: 'assistant',
          text: data.response || 'I hear you. Tell me more.',
          mood: data.mood,
          timestamp: new Date().toISOString(),
          aiTier: data.ai_tier,
        }
        setMessages(prev => [...prev, assistantMsg])
        triggerHaptic('success')

        if (!isMuted) {
          await speak(assistantMsg.text, data.mood)
        }
      } else {
        throw new Error('Response not OK')
      }
    } catch {
      const fallbackMsg: ConversationMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: 'I\'m having trouble connecting right now. Take a deep breath — I\'m still here with you.',
        timestamp: new Date().toISOString(),
        aiTier: 'local_engine',
      }
      setMessages(prev => [...prev, fallbackMsg])
      triggerHaptic('error')
    } finally {
      setIsProcessing(false)
    }
  }, [isProcessing, sessionId, isMuted, speak, triggerHaptic])

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      triggerHaptic('medium')
      stopListening()
    } else {
      triggerHaptic('selection')
      stopAll()
      startListening()
    }
  }, [isListening, startListening, stopListening, stopAll, triggerHaptic])

  // Mood-based gradient
  const moodGradient: Record<string, string> = {
    anxious: 'from-blue-500/20 via-transparent to-transparent',
    sad: 'from-indigo-500/20 via-transparent to-transparent',
    angry: 'from-red-500/20 via-transparent to-transparent',
    happy: 'from-[#d4a44c]/20 via-transparent to-transparent',
    neutral: 'from-white/5 via-transparent to-transparent',
    calm: 'from-green-500/20 via-transparent to-transparent',
  }

  return (
    <MobileAppShell title="" showHeader={false} showTabBar={false}>
      <div className={`flex flex-col h-[100dvh] bg-gradient-to-b ${moodGradient[currentMood] || moodGradient.neutral} bg-[#050507]`}>
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 bg-[#050507]/80 backdrop-blur-xl"
          style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
        >
          <button onClick={() => router.push('/m/kiaan')} className="p-2 -ml-2">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>

          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#d4a44c]" />
            <span className="text-sm font-semibold text-white">Voice Companion</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full"
            >
              {isMuted ? (
                <VolumeX className="w-5 h-5 text-white/40" />
              ) : (
                <Volume2 className="w-5 h-5 text-white/70" />
              )}
            </button>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="p-2 rounded-full"
            >
              <MessageSquare className={`w-5 h-5 ${showTranscript ? 'text-[#d4a44c]' : 'text-white/40'}`} />
            </button>
          </div>
        </div>

        {/* Conversation area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" style={{ touchAction: 'pan-y' }}>
          <AnimatePresence mode="popLayout">
            {showTranscript && messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                  msg.role === 'user'
                    ? 'bg-[#d4a44c]/20 border border-[#d4a44c]/30 text-white'
                    : 'bg-white/[0.06] border border-white/[0.08] text-white/90'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  {msg.mood && (
                    <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-white/50">
                      {msg.mood}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Interim transcript */}
          {(interimTranscript || transcript) && isListening && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end"
            >
              <div className="max-w-[85%] px-4 py-3 rounded-2xl bg-[#d4a44c]/10 border border-[#d4a44c]/20 text-sm text-white/60 italic">
                {interimTranscript || transcript}...
              </div>
            </motion.div>
          )}

          {/* Processing indicator */}
          {isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-start"
            >
              <div className="px-4 py-3 rounded-2xl bg-white/[0.06] border border-white/[0.08]">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-[#d4a44c]"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, delay: i * 0.2, repeat: Infinity }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice error */}
        {voiceError && !isSupported && (
          <div className="mx-4 mb-2 px-3 py-2 rounded-xl bg-[#d4a44c]/10 border border-[#d4a44c]/20">
            <p className="text-xs text-[#d4a44c]">Voice not supported. Use text chat instead.</p>
            <button
              onClick={() => router.push('/m/kiaan')}
              className="text-xs text-[#d4a44c] underline mt-1"
            >
              Switch to Text Chat
            </button>
          </div>
        )}

        {/* Controls area */}
        <div
          className="px-4 pb-6 pt-4 bg-gradient-to-t from-[#050507] via-[#050507] to-transparent"
          style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 24px)' }}
        >
          {/* Speaking indicator */}
          <AnimatePresence>
            {isSpeaking && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="flex items-center justify-center gap-2 mb-4"
              >
                <div className="flex gap-0.5">
                  {[0, 1, 2, 3, 4].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1 bg-[#d4a44c] rounded-full"
                      animate={{ height: [8, 20, 8] }}
                      transition={{ duration: 0.6, delay: i * 0.1, repeat: Infinity }}
                    />
                  ))}
                </div>
                <span className="text-xs text-[#d4a44c]">KIAAN is speaking...</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main mic button */}
          <div className="flex items-center justify-center">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={handleMicToggle}
              disabled={isProcessing}
              className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 shadow-lg shadow-red-500/30'
                  : 'bg-gradient-to-br from-[#d4a44c] to-orange-500 shadow-lg shadow-[#d4a44c]/30'
              } disabled:opacity-50`}
            >
              {/* Pulse rings when listening */}
              {isListening && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-red-400"
                    animate={{ scale: [1, 1.5], opacity: [0.6, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full border-2 border-red-400"
                    animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                    transition={{ duration: 1.5, delay: 0.5, repeat: Infinity }}
                  />
                </>
              )}

              {isListening ? (
                <MicOff className="w-8 h-8 text-white" />
              ) : (
                <Mic className="w-8 h-8 text-black" />
              )}
            </motion.button>
          </div>

          {/* Status text */}
          <p className="text-center text-xs text-white/40 mt-3">
            {isListening
              ? 'Listening... Tap to stop'
              : isSpeaking
              ? 'KIAAN is responding...'
              : isProcessing
              ? 'Thinking...'
              : 'Tap to speak with KIAAN'}
          </p>

          {/* Quick action: switch to text */}
          <div className="flex justify-center mt-4">
            <button
              onClick={() => router.push('/m/kiaan')}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] text-xs text-white/50"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Switch to Text Chat
            </button>
          </div>
        </div>
      </div>
    </MobileAppShell>
  )
}
