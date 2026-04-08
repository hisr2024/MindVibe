'use client'

/**
 * Mobile Companion Page
 *
 * Mobile-optimized voice companion experience wrapping the desktop /companion page
 * within the mobile app shell. Provides the same KIAAN orb-based voice companion
 * with touch-optimized controls and mobile navigation.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Mic, MicOff, ArrowLeft, Volume2, VolumeX, ThumbsUp, ThumbsDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { useAuth } from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useLanguage } from '@/hooks/useLanguage'
import { apiFetch } from '@/lib/api'

// P1-18: BCP-47 locale map for Web Speech API — ensures non-English users
// get recognition in their chosen language (was hardcoded to 'en').
// Indic languages benefit significantly from the India accent model.
const SPEECH_LANG_MAP: Record<string, string> = {
  en: 'en-IN',
  hi: 'hi-IN',
  ta: 'ta-IN',
  te: 'te-IN',
  bn: 'bn-IN',
  mr: 'mr-IN',
  gu: 'gu-IN',
  kn: 'kn-IN',
  ml: 'ml-IN',
  pa: 'pa-IN',
  sa: 'sa-IN',
  es: 'es-ES',
  fr: 'fr-FR',
  de: 'de-DE',
  pt: 'pt-PT',
  it: 'it-IT',
  nl: 'nl-NL',
  pl: 'pl-PL',
  sv: 'sv-SE',
  ru: 'ru-RU',
  ja: 'ja-JP',
  'zh-CN': 'zh-CN',
  ko: 'ko-KR',
  th: 'th-TH',
  vi: 'vi-VN',
  id: 'id-ID',
  ar: 'ar-SA',
  tr: 'tr-TR',
  sw: 'sw-KE',
}

interface CompanionMessage {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: string
}

export default function MobileCompanionPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { triggerHaptic } = useHapticFeedback()
  const { language: appLanguage } = useLanguage()

  // P1-18: Derive BCP-47 locale for SpeechRecognition from app language
  const speechLang = useMemo(
    () => SPEECH_LANG_MAP[appLanguage] ?? `${appLanguage}-IN`,
    [appLanguage],
  )

  const [messages, setMessages] = useState<CompanionMessage[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [connectionError, setConnectionError] = useState(false)
  const [feedbackGiven, setFeedbackGiven] = useState<Record<string, 'positive' | 'negative'>>({})
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const handleVoiceMessageRef = useRef<(text: string) => void>(() => {})

  const onTranscriptCb = useMemo(() => (text: string, isFinal: boolean) => {
    if (isFinal && text.trim()) {
      handleVoiceMessageRef.current(text.trim())
    }
  }, [])

  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
    status,
  } = useVoiceInput({
    language: speechLang,
    onTranscript: onTranscriptCb,
  })

  // Initialize companion session
  useEffect(() => {
    if (!isAuthenticated) return

    const initSession = async () => {
      try {
        const response = await apiFetch('/api/companion/session/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ mode: 'voice' }),
        })

        if (response.ok) {
          const data = await response.json()
          setSessionId(data.session_id)

          if (data.greeting) {
            setMessages([{
              id: 'greeting',
              role: 'assistant',
              text: data.greeting,
              timestamp: new Date().toISOString(),
            }])
          }
        }
      } catch {
        setConnectionError(true)
        setMessages([{
          id: 'fallback-greeting',
          role: 'assistant',
          text: 'Namaste! I am KIAAN, your voice companion. Tap the microphone to speak with me.',
          timestamp: new Date().toISOString(),
        }])
      }
    }

    initSession()
  }, [isAuthenticated])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send voice message to companion
  const handleVoiceMessage = useCallback(async (text: string) => {
    const messageId = crypto.randomUUID()

    setMessages((prev) => [...prev, {
      id: messageId,
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
    }])

    setIsProcessing(true)

    try {
      const response = await apiFetch('/api/companion/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text,
          input_mode: 'voice',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages((prev) => [...prev, {
          id: data.message_id || crypto.randomUUID(),
          role: 'assistant',
          text: data.response || data.message || 'I hear you. Please continue.',
          timestamp: new Date().toISOString(),
        }])
        triggerHaptic('success')
      } else {
        throw new Error('Companion response failed')
      }
    } catch {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        text: 'I had trouble hearing you clearly. Could you try again?',
        timestamp: new Date().toISOString(),
      }])
      triggerHaptic('error')
    } finally {
      setIsProcessing(false)
    }
  }, [sessionId, triggerHaptic])

  // P4-35: Sync ref via useEffect instead of mutating during render.
  // Direct mutation during render is a React anti-pattern that can cause
  // tearing with concurrent rendering and Strict Mode double-invoke.
  useEffect(() => {
    handleVoiceMessageRef.current = handleVoiceMessage
  }, [handleVoiceMessage])

  const toggleRecording = useCallback(() => {
    triggerHaptic('selection')
    if (isListening) {
      stopListening()
    } else {
      resetTranscript()
      startListening()
    }
  }, [isListening, startListening, stopListening, resetTranscript, triggerHaptic])

  const handleFeedback = useCallback(async (messageId: string, rating: 'positive' | 'negative') => {
    setFeedbackGiven((prev) => ({ ...prev, [messageId]: rating }))
    triggerHaptic('selection')
    try {
      await apiFetch('/api/companion/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message_id: messageId, rating, session_id: sessionId }),
      })
    } catch {
      // Feedback is best-effort — don't disrupt the conversation
    }
  }, [sessionId, triggerHaptic])

  return (
    <MobileAppShell
      title="Voice Companion"
      subtitle="Speak with KIAAN"
      showHeader={false}
      showTabBar={false}
    >
      <div className="flex flex-col h-full bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-safe-top py-3 border-b border-white/5">
          <button
            onClick={() => router.back()}
            className="p-2 -ml-2 rounded-xl text-white/70 hover:bg-white/5"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h1 className="text-sm font-semibold">KIAAN Voice</h1>
            <p className="text-caption text-[var(--mv-text-muted)]">
              {isListening ? 'Listening...' : isProcessing ? 'Thinking...' : 'Tap mic to speak'}
            </p>
          </div>
          <button
            onClick={() => setIsMuted(!isMuted)}
            className="p-2 -mr-2 rounded-xl text-white/70 hover:bg-white/5"
            aria-label={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
        </div>

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          <AnimatePresence>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-[#d4a44c]/20 text-[#f5f0e8] border border-[#d4a44c]/20'
                      : 'bg-white/5 text-white/90 border border-white/10'
                  }`}
                >
                  {msg.text}
                </div>
                {msg.role === 'assistant' && msg.id !== 'greeting' && msg.id !== 'fallback-greeting' && (
                  <div className="flex items-center gap-1 mt-1 ml-1">
                    {feedbackGiven[msg.id] ? (
                      <span className="text-[10px] text-white/30">Thanks!</span>
                    ) : (
                      <>
                        <button
                          onClick={() => handleFeedback(msg.id, 'positive')}
                          className="p-1 rounded-full text-white/20 hover:text-green-400 hover:bg-green-400/10 transition-colors"
                          aria-label="Good response"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleFeedback(msg.id, 'negative')}
                          className="p-1 rounded-full text-white/20 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                          aria-label="Poor response"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Interim transcript */}
          {isListening && interimTranscript && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-end"
            >
              <div className="max-w-[80%] px-4 py-3 rounded-2xl text-sm italic text-[#d4a44c]/60 bg-[#d4a44c]/5 border border-[#d4a44c]/10">
                {interimTranscript}
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
              <div className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10">
                <div className="flex gap-1">
                  {/* P0-6: Stable string keys */}
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={`proc-dot-${i}`}
                      className="w-2 h-2 rounded-full bg-white/40"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice error */}
        {voiceError && (
          <div className="px-4 py-2">
            <p className="text-xs text-amber-400 text-center">{voiceError}</p>
          </div>
        )}

        {/* Connection error */}
        {connectionError && (
          <div className="px-4 py-2">
            <p className="text-xs text-amber-400/70 text-center">
              Running in offline mode. Some features may be limited.
            </p>
          </div>
        )}

        {/* Voice control area */}
        <div className="px-4 py-6 pb-safe-bottom border-t border-white/5 flex flex-col items-center gap-3">
          {/* Status text */}
          <p className="text-caption text-[var(--mv-text-muted)]">
            {isListening
              ? 'Listening... tap to stop'
              : status === 'processing'
                ? 'Processing your voice...'
                : isSupported
                  ? 'Tap the microphone to speak'
                  : 'Voice input not available in this browser'}
          </p>

          {/* Mic button */}
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={toggleRecording}
            disabled={isProcessing || !isSupported}
            className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all ${
              isListening
                ? 'bg-red-500 shadow-lg shadow-red-500/30'
                : 'bg-[#d4a44c]/20 border-2 border-[#d4a44c]/40 hover:bg-[#d4a44c]/30'
            } ${(!isSupported || isProcessing) ? 'opacity-50 cursor-not-allowed' : ''}`}
            aria-label={isListening ? 'Stop recording' : 'Start recording'}
          >
            {isListening && (
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-red-400/50"
                animate={{ scale: [1, 1.3], opacity: [0.5, 0] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            )}
            {isListening ? (
              <MicOff className="w-7 h-7 text-white relative z-10" />
            ) : (
              <Mic className="w-7 h-7 text-[#d4a44c] relative z-10" />
            )}
          </motion.button>

          {/* Transcript display */}
          {transcript && !isListening && (
            <p className="text-xs text-white/40 text-center max-w-[80%] truncate">
              Last: &ldquo;{transcript}&rdquo;
            </p>
          )}
        </div>
      </div>
    </MobileAppShell>
  )
}
