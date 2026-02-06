/**
 * useEliteVoice Hook
 *
 * Combines all elite KIAAN voice services into a single,
 * easy-to-use React hook for voice-enabled interfaces.
 *
 * Features:
 * - Wake word detection
 * - Speech-to-text with live transcription
 * - Offline-capable AI responses
 * - Neural text-to-speech
 * - Conversation memory
 */

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useVoiceInput } from './useVoiceInput'
import { useVoiceOutput } from './useVoiceOutput'
import { useWakeWord } from './useWakeWord'

// Voice states
export type EliteVoiceState =
  | 'idle'
  | 'wakeword'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error'

// Message type
export interface VoiceMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  verseIds?: string[]
  concern?: string
  isOffline?: boolean
}

// Hook options
export interface UseEliteVoiceOptions {
  language?: string
  userId?: string
  enableWakeWord?: boolean
  autoSpeak?: boolean
  onStateChange?: (state: EliteVoiceState) => void
  onMessage?: (message: VoiceMessage) => void
  onError?: (error: string) => void
}

// Hook return type
export interface UseEliteVoiceReturn {
  // State
  state: EliteVoiceState
  isOnline: boolean
  messages: VoiceMessage[]
  transcript: string
  interimTranscript: string
  error: string | null

  // Support flags
  isVoiceSupported: boolean
  isWakeWordSupported: boolean
  isTTSSupported: boolean

  // Actions
  activate: () => void
  stopListening: () => void
  stopSpeaking: () => void
  clearMessages: () => void
  toggleWakeWord: () => void
  processQuery: (query: string) => Promise<void>

  // Wake word
  isWakeWordActive: boolean
  enableWakeWord: () => void
  disableWakeWord: () => void
}

/**
 * Elite KIAAN Voice Hook
 */
export function useEliteVoice(
  options: UseEliteVoiceOptions = {}
): UseEliteVoiceReturn {
  const {
    language = 'en',
    userId = 'default-user',
    enableWakeWord = false,
    autoSpeak = true,
    onStateChange,
    onMessage,
    onError
  } = options

  // State
  const [state, setState] = useState<EliteVoiceState>('idle')
  const [isOnline, setIsOnline] = useState(true)
  const [messages, setMessages] = useState<VoiceMessage[]>([])
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [wakeWordEnabled, setWakeWordEnabled] = useState(enableWakeWord)

  // Refs
  const synthesisRef = useRef<SpeechSynthesis | null>(null)
  const servicesInitializedRef = useRef(false)

  // Voice input hook
  const {
    isListening,
    transcript: voiceTranscript,
    interimTranscript: voiceInterim,
    isSupported: voiceSupported,
    error: voiceError,
    startListening,
    stopListening: stopVoiceListening,
    resetTranscript
  } = useVoiceInput({
    language,
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        setTranscript(text)
        processQuery(text)
      } else {
        setInterimTranscript(text)
      }
    },
    onError: (err) => {
      setError(err)
      setState('error')
      onError?.(err)
    }
  })

  // Voice output hook
  const {
    isSpeaking,
    isSupported: ttsSupported,
    error: ttsError,
    speak,
    cancel: cancelSpeech
  } = useVoiceOutput({
    language,
    rate: 0.95,
    onEnd: () => {
      setState(wakeWordEnabled ? 'wakeword' : 'idle')

      // Auto-resume listening in wake word mode
      if (wakeWordEnabled) {
        setTimeout(() => {
          setState('listening')
          startListening()
        }, 1000)
      }
    },
    onError: (err) => {
      setError(err)
      setState('error')
      onError?.(err)
    }
  })

  // Wake word hook
  const {
    isActive: wakeWordActive,
    isSupported: wakeWordSupported,
    start: startWakeWord,
    stop: stopWakeWord
  } = useWakeWord({
    language,
    onWakeWordDetected: handleWakeWordDetected,
    onError: (err) => {
      console.warn('Wake word error:', err)
    }
  })

  // Initialize services
  useEffect(() => {
    if (servicesInitializedRef.current) return
    servicesInitializedRef.current = true

    // Named handlers for proper cleanup
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    // Check online status
    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initialize speech synthesis
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      synthesisRef.current = window.speechSynthesis
    }

    // Auto-enable wake word if requested
    if (enableWakeWord && wakeWordSupported) {
      startWakeWord()
      setWakeWordEnabled(true)
      setState('wakeword')
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Sync state changes
  useEffect(() => {
    onStateChange?.(state)
  }, [state, onStateChange])

  // Sync voice errors
  useEffect(() => {
    if (voiceError) {
      setError(voiceError)
    }
  }, [voiceError])

  // Handle wake word detection
  function handleWakeWordDetected() {
    // Play activation sound
    playActivationSound()

    // Haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([50, 100, 50])
    }

    // Start listening
    setState('listening')
    resetTranscript()
    startListening()
  }

  // Play activation sound
  function playActivationSound() {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext
      if (!AudioContextClass) return

      const ctx = new AudioContextClass()
      const oscillator = ctx.createOscillator()
      const gain = ctx.createGain()

      oscillator.connect(gain)
      gain.connect(ctx.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'

      gain.gain.setValueAtTime(0.3, ctx.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15)

      oscillator.start(ctx.currentTime)
      oscillator.stop(ctx.currentTime + 0.15)

      setTimeout(() => ctx.close(), 200)
    } catch (e) {
      // Silent fail
    }
  }

  // Process voice query
  const processQuery = useCallback(async (query: string) => {
    if (!query.trim()) {
      setState(wakeWordEnabled ? 'wakeword' : 'idle')
      return
    }

    // Add user message
    const userMessage: VoiceMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, userMessage])
    onMessage?.(userMessage)

    // Start thinking
    setState('thinking')
    setTranscript('')
    setInterimTranscript('')

    try {
      let responseText: string

      if (isOnline) {
        // Online: use API
        const res = await fetch('/api/voice/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            query,
            language,
            history: messages.slice(-6)
          })
        })

        if (!res.ok) {
          throw new Error('API request failed')
        }

        const data = await res.json()
        responseText = data.response || "I'm here for you. How can I help?"
      } else {
        // Offline: use fallback response
        responseText = generateOfflineResponse(query)
      }

      // Add assistant message
      const assistantMessage: VoiceMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: responseText,
        timestamp: new Date(),
        isOffline: !isOnline
      }
      setMessages(prev => [...prev, assistantMessage])
      onMessage?.(assistantMessage)

      // Speak response if auto-speak is enabled
      if (autoSpeak) {
        setState('speaking')
        speak(responseText)
      } else {
        setState(wakeWordEnabled ? 'wakeword' : 'idle')
      }

    } catch (err) {
      console.error('Query error:', err)

      // Fallback response
      const fallbackResponse = "I'm here with you. Could you try asking that again?"
      const errorMessage: VoiceMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: fallbackResponse,
        timestamp: new Date(),
        isOffline: true
      }
      setMessages(prev => [...prev, errorMessage])

      if (autoSpeak) {
        setState('speaking')
        speak(fallbackResponse)
      } else {
        setState(wakeWordEnabled ? 'wakeword' : 'idle')
      }
    }
  }, [isOnline, language, messages, autoSpeak, wakeWordEnabled, speak, onMessage])

  // Generate offline response
  function generateOfflineResponse(query: string): string {
    const queryLower = query.toLowerCase()

    if (queryLower.includes('anxious') || queryLower.includes('worried')) {
      return "I hear your anxiety. Ancient wisdom teaches us that peace comes from focusing on what you can control. Take four slow breaths. Focus on what's actually in your control right now. Remember, this feeling is temporary."
    }

    if (queryLower.includes('stressed') || queryLower.includes('overwhelmed')) {
      return "I sense you're feeling overwhelmed. The Gita reminds us that when you try to do everything at once, you do nothing well. Focus on one thing at a time. What's the most important thing you could focus on right now?"
    }

    if (queryLower.includes('sad') || queryLower.includes('depressed')) {
      return "I hear the heaviness in your words. When life feels dark, remember the light is still within you. Be gentle with yourself. This feeling is real, but it will pass. Is there someone you trust who knows how you're feeling?"
    }

    return "Thank you for sharing. Ancient wisdom teaches that all challenges contain seeds of growth. Focus on what's in your control. Take one small action toward what matters to you. What would be most helpful right now?"
  }

  // Activate voice (manual trigger)
  const activate = useCallback(() => {
    handleWakeWordDetected()
  }, [])

  // Stop listening
  const stopListening = useCallback(() => {
    stopVoiceListening()
    setState(wakeWordEnabled ? 'wakeword' : 'idle')
  }, [stopVoiceListening, wakeWordEnabled])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    cancelSpeech()
    setState(wakeWordEnabled ? 'wakeword' : 'idle')
  }, [cancelSpeech, wakeWordEnabled])

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([])
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  // Toggle wake word
  const toggleWakeWord = useCallback(() => {
    if (wakeWordEnabled) {
      stopWakeWord()
      setWakeWordEnabled(false)
      setState('idle')
    } else {
      startWakeWord()
      setWakeWordEnabled(true)
      setState('wakeword')
    }
  }, [wakeWordEnabled, startWakeWord, stopWakeWord])

  // Enable wake word
  const enableWakeWordFn = useCallback(() => {
    if (!wakeWordEnabled) {
      startWakeWord()
      setWakeWordEnabled(true)
      setState('wakeword')
    }
  }, [wakeWordEnabled, startWakeWord])

  // Disable wake word
  const disableWakeWord = useCallback(() => {
    if (wakeWordEnabled) {
      stopWakeWord()
      setWakeWordEnabled(false)
      setState('idle')
    }
  }, [wakeWordEnabled, stopWakeWord])

  return {
    // State
    state,
    isOnline,
    messages,
    transcript,
    interimTranscript,
    error,

    // Support flags
    isVoiceSupported: voiceSupported,
    isWakeWordSupported: wakeWordSupported,
    isTTSSupported: ttsSupported,

    // Actions
    activate,
    stopListening,
    stopSpeaking,
    clearMessages,
    toggleWakeWord,
    processQuery,

    // Wake word
    isWakeWordActive: wakeWordActive,
    enableWakeWord: enableWakeWordFn,
    disableWakeWord
  }
}
