'use client'

/**
 * KIAAN Mobile Voice Page
 *
 * Optimized mobile-first voice interface with:
 * - Touch-friendly large buttons
 * - Simplified visual feedback
 * - Offline support indicators
 * - Quick enhancement toggles
 * - Haptic feedback support
 * - SOUND EFFECTS for all interactions
 *
 * Mobile-optimized for touch interactions.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { apiFetch } from '@/lib/api'
import { useUISound } from '@/hooks/useUISound'

type VoiceState = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

interface VoiceSettings {
  hapticFeedback: boolean
  autoPlay: boolean
  voiceType: 'calm' | 'wisdom' | 'friendly'
}

export default function MobileVoicePage() {
  const [state, setState] = useState<VoiceState>('idle')
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [response, setResponse] = useState('')
  const [isOnline, setIsOnline] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [sessionId] = useState(() => `voice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`)

  const [settings, setSettings] = useState<VoiceSettings>({
    hapticFeedback: true,
    autoPlay: true,
    voiceType: 'friendly',
  })

  const [showSettings, setShowSettings] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const micTransitionRef = useRef<boolean>(false) // Prevent race conditions during mic transitions
  const warmUpStreamRef = useRef<MediaStream | null>(null) // Keep microphone warm for instant activation
  const retryCountRef = useRef<number>(0)
  const maxRetries = 3

  const { t, language } = useLanguage()

  // Audio hook for sound effects
  const {
    playSound,
    playOm,
    playSingingBowl,
  } = useUISound()

  // Stub functions for binaural (removed feature)
  const startBinaural = () => {}
  const stopBinaural = () => {}
  const audioState = { binauralActive: false }

  // Voice input hook
  const {
    isListening,
    isSupported: voiceSupported,
    error: voiceError,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceInput({
    language: language || 'en',
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setTranscript(text)
        playSound('complete')  // Sound when transcript finalized
        handleUserQuery(text)
      } else {
        setInterimTranscript(text)
      }
    },
    onError: (err) => {
      console.error('[Mobile Voice] Voice input error:', err)

      // Don't show error if we're in a transition
      if (micTransitionRef.current) {
        console.log('[Mobile Voice] Ignoring error during mic transition')
        return
      }

      // Check if this is a recoverable error
      const lowerErr = err.toLowerCase()
      if (lowerErr.includes('no-speech') || lowerErr.includes('aborted') || lowerErr.includes('no speech')) {
        // These are expected - just return to idle
        console.log('[Mobile Voice] Recoverable error, returning to idle')
        setState('idle')

        // Elite: Re-warm microphone for next activation
        setTimeout(() => warmUpMicrophone(), 500)
        return
      }

      // For actual errors, show the error state
      setError(err)
      setState('error')
      playSound('error')  // Sound on error
    },
  })

  // Elite: Warm up microphone for instant activation
  async function warmUpMicrophone(): Promise<boolean> {
    if (warmUpStreamRef.current) return true
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true }
      })
      warmUpStreamRef.current = stream
      return true
    } catch {
      return false
    }
  }

  // Elite: Release warm-up stream
  function releaseWarmUpStream(): void {
    if (warmUpStreamRef.current) {
      warmUpStreamRef.current.getTracks().forEach(track => track.stop())
      warmUpStreamRef.current = null
    }
  }

  // Online status and warm-up
  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Elite: Pre-warm microphone if permission already granted
    if (navigator.permissions?.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(result => {
          if (result.state === 'granted') warmUpMicrophone()
        })
        .catch(() => {})
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      releaseWarmUpStream()
    }
  }, [])

  // Haptic feedback helper
  const triggerHaptic = useCallback(
    (type: 'light' | 'medium' | 'heavy' = 'medium') => {
      if (!settings.hapticFeedback) return
      if ('vibrate' in navigator) {
        const duration = type === 'light' ? 10 : type === 'medium' ? 25 : 50
        navigator.vibrate(duration)
      }
    },
    [settings.hapticFeedback]
  )

  // Handle voice button press with race condition protection
  const handleVoicePress = async () => {
    // Prevent rapid clicks causing issues
    if (micTransitionRef.current) {
      console.log('[Mobile Voice] Already transitioning, ignoring press')
      return
    }

    triggerHaptic('medium')

    if (isListening) {
      micTransitionRef.current = true
      try {
        stopListening()
        setState('idle')
      } finally {
        setTimeout(() => {
          micTransitionRef.current = false
        }, 300)
      }
    } else {
      micTransitionRef.current = true
      setError(null)
      resetTranscript()
      setInterimTranscript('')
      setTranscript('')
      setState('listening')

      try {
        // Elite: Release warm-up stream - SpeechRecognition manages its own mic
        releaseWarmUpStream()

        // Small delay to ensure any previous recognition is fully stopped
        await new Promise(resolve => setTimeout(resolve, 100))
        startListening()
      } catch (err) {
        console.error('[Mobile Voice] Failed to start listening:', err)
        setError('Could not start listening. Please check microphone permissions.')
        setState('error')
        playSound('error')
      } finally {
        setTimeout(() => {
          micTransitionRef.current = false
        }, 500)
      }
    }
  }

  // Process user query
  const handleUserQuery = async (query: string) => {
    if (!query.trim()) return

    triggerHaptic('light')
    setState('thinking')

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, userMessage])

    try {
      // Call enhanced voice query endpoint with analytics
      const res = await apiFetch('/api/voice/query/enhanced', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          language: language || 'en',
          session_id: sessionId,
          mood_at_time: null, // Could be enhanced with mood detection
          history: messages.slice(-4).map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      })

      if (!res.ok) throw new Error('Failed to get response')

      const data = await res.json()
      const responseText = data.response || "I'm here for you. How can I help?"

      setResponse(responseText)
      setConversationId(data.conversation_id)

      // Add assistant message
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      // Speak response if autoPlay enabled
      if (settings.autoPlay) {
        await speakResponse(responseText)
      } else {
        setState('idle')
      }
    } catch (err) {
      console.error('Voice query error:', err)

      // Fallback response
      const fallbackResponse =
        "I'm here with you. Even without a connection, remember: " +
        'You have the strength within to face any challenge. ' +
        'Take a deep breath and know that this moment shall pass.'

      setResponse(fallbackResponse)
      const assistantMessage: Message = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])

      if (settings.autoPlay) {
        await speakResponse(fallbackResponse)
      } else {
        setState('idle')
      }
    }
  }

  // Speak response using TTS
  const speakResponse = async (text: string) => {
    setState('speaking')
    triggerHaptic('light')

    try {
      // Try server TTS first
      const res = await apiFetch('/api/voice/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          language: language || 'en',
          voice_type: settings.voiceType,
        }),
      })

      if (res.ok) {
        const audioBlob = await res.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        if (audioRef.current) {
          audioRef.current.src = audioUrl
          audioRef.current.onended = () => {
            setState('idle')
            URL.revokeObjectURL(audioUrl)
          }
          await audioRef.current.play()
          return
        }
      }
    } catch (err) {
      console.warn('Server TTS failed, using browser:', err)
    }

    // Fallback to browser TTS
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language || 'en'
      utterance.rate = 0.9
      utterance.onend = () => setState('idle')
      window.speechSynthesis.speak(utterance)
    } else {
      setState('idle')
    }
  }

  // Submit feedback
  const submitFeedback = async (helpful: boolean) => {
    if (!conversationId) return
    triggerHaptic('light')

    try {
      await apiFetch(`/api/voice/history/${conversationId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ was_helpful: helpful }),
      })
    } catch (err) {
      console.error('Feedback error:', err)
    }
  }

  // Get state-specific UI
  const getStateConfig = () => {
    switch (state) {
      case 'listening':
        return {
          color: 'from-orange-500 to-amber-500',
          pulse: true,
          icon: '🎤',
          text: interimTranscript || 'Listening...',
        }
      case 'thinking':
        return {
          color: 'from-purple-500 to-indigo-500',
          pulse: true,
          icon: '🤔',
          text: 'Thinking...',
        }
      case 'speaking':
        return {
          color: 'from-green-500 to-emerald-500',
          pulse: true,
          icon: '🔊',
          text: 'Speaking...',
        }
      case 'error':
        return {
          color: 'from-red-500 to-rose-500',
          pulse: false,
          icon: '⚠️',
          text: error || 'Something went wrong',
        }
      default:
        return {
          color: 'from-slate-700 to-slate-600',
          pulse: false,
          icon: '🕉️',
          text: 'Tap to speak with KIAAN',
        }
    }
  }

  const stateConfig = getStateConfig()

  if (!voiceSupported) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-800 p-6 text-center">
        <div className="text-6xl mb-6">🎙️</div>
        <h1 className="text-xl font-bold text-slate-100 mb-3">Voice Not Supported</h1>
        <p className="text-slate-400 mb-6 max-w-sm">
          Your browser doesn&apos;t support voice features. Please try using Chrome, Safari, or Edge.
        </p>
        <Link
          href="/flows/kiaan"
          className="rounded-xl bg-orange-500 px-6 py-3 font-medium text-white"
        >
          Use Text Chat Instead
        </Link>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="safe-area-top flex items-center justify-between p-4">
        <Link href="/flows/kiaan" className="flex items-center gap-2 text-slate-400">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span>Back</span>
        </Link>
        <div className="flex items-center gap-2">
          {!isOnline && (
            <span className="rounded-full bg-amber-500/20 px-2 py-1 text-xs text-amber-400">
              Offline
            </span>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-700/50"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
            </svg>
          </button>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mx-4 mb-4 rounded-2xl border border-slate-700 bg-slate-800/90 p-4 backdrop-blur">
          <h3 className="mb-3 font-medium text-slate-200">Voice Settings</h3>
          <div className="space-y-3">
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Haptic Feedback</span>
              <input
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, hapticFeedback: e.target.checked }))
                }
                className="h-5 w-5 rounded accent-orange-500"
              />
            </label>
            <label className="flex items-center justify-between">
              <span className="text-sm text-slate-300">Auto-Play Response</span>
              <input
                type="checkbox"
                checked={settings.autoPlay}
                onChange={(e) =>
                  setSettings((s) => ({ ...s, autoPlay: e.target.checked }))
                }
                className="h-5 w-5 rounded accent-orange-500"
              />
            </label>
            <div>
              <span className="mb-2 block text-sm text-slate-300">Voice Type</span>
              <div className="flex gap-2">
                {(['friendly', 'calm', 'wisdom'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setSettings((s) => ({ ...s, voiceType: type }))}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm capitalize ${
                      settings.voiceType === type
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-4 text-5xl">🕉️</div>
            <h2 className="text-lg font-medium text-slate-200">KIAAN Voice</h2>
            <p className="mt-2 max-w-xs text-sm text-slate-400">
              Speak your heart. KIAAN is here to listen with wisdom from the Bhagavad Gita.
            </p>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-orange-500 text-white'
                      : 'border border-slate-700 bg-slate-800 text-slate-200'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                  {msg.role === 'assistant' && conversationId === `assistant-${msg.id.split('-')[1]}` && (
                    <div className="mt-2 flex gap-2 pt-2 border-t border-slate-700/50">
                      <button
                        onClick={() => submitFeedback(true)}
                        className="text-xs text-green-400 hover:text-green-300"
                      >
                        👍 Helpful
                      </button>
                      <button
                        onClick={() => submitFeedback(false)}
                        className="text-xs text-slate-400 hover:text-slate-300"
                      >
                        👎 Not helpful
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voice Button Area */}
      <div className="safe-area-bottom flex flex-col items-center p-6">
        {/* Status Text */}
        <p className="mb-4 text-center text-sm text-slate-400">{stateConfig.text}</p>

        {/* Main Voice Button */}
        <button
          onClick={handleVoicePress}
          disabled={state === 'thinking'}
          className={`relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br ${stateConfig.color} shadow-lg transition-all duration-300 active:scale-95 disabled:opacity-50`}
        >
          {stateConfig.pulse && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-white/20" />
              <span className="absolute inset-2 animate-pulse rounded-full bg-white/10" />
            </>
          )}
          <span className="relative text-4xl">{stateConfig.icon}</span>
        </button>

        {/* Quick Actions */}
        {state === 'idle' && messages.length > 0 && (
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => {
                setMessages([])
                setConversationId(null)
              }}
              className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-400 hover:bg-slate-800"
            >
              Clear Chat
            </button>
            {response && !settings.autoPlay && (
              <button
                onClick={() => speakResponse(response)}
                className="rounded-full bg-slate-700 px-4 py-2 text-sm text-slate-200"
              >
                🔊 Play Response
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hidden Audio Element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  )
}
