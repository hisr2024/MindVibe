/**
 * useDivineVoiceConversation - Sacred Voice Experience Hook
 *
 * Creates an immersive, Alexa/Siri-like voice conversation with KIAAN
 * infused with the calming wisdom of Bhagavad Gita.
 *
 * Features:
 * - Divine greeting and farewell with serene voice
 * - Emotional awareness and adaptive voice prosody
 * - Conversation state management
 * - Auto-play audio responses
 * - Speech-to-text integration
 * - Breathing practice support
 *
 * Usage:
 * ```tsx
 * const {
 *   startConversation,
 *   sendMessage,
 *   endConversation,
 *   isListening,
 *   isSpeaking,
 *   currentResponse,
 *   emotionalState
 * } = useDivineVoiceConversation()
 * ```
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { apiFetch } from '@/lib/api'

// Types
export interface VoiceSettings {
  speed: number
  pitch: number
  volume: string
  voice_type: string
}

export interface EmotionalAnalysis {
  state: string
  intensity: number
}

export interface ConversationMessage {
  role: 'user' | 'kiaan'
  content: string
  timestamp: string
  emotionalState?: string
  phase?: string
}

export interface DivineConversationState {
  sessionId: string | null
  phase: string
  emotionalState: string
  emotionalIntensity: number
  messageCount: number
  isActive: boolean
  messages: ConversationMessage[]
}

export interface DivineResponseResult {
  response: string
  ssml: string
  voiceSettings: VoiceSettings
  emotionalAnalysis: EmotionalAnalysis
  phase: string
  audioBase64: string | null
}

// Audio utilities
const playBase64Audio = (base64Audio: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    try {
      const audioData = atob(base64Audio)
      const arrayBuffer = new ArrayBuffer(audioData.length)
      const view = new Uint8Array(arrayBuffer)
      for (let i = 0; i < audioData.length; i++) {
        view[i] = audioData.charCodeAt(i)
      }
      const blob = new Blob([arrayBuffer], { type: 'audio/mp3' })
      const audioUrl = URL.createObjectURL(blob)
      const audio = new Audio(audioUrl)

      audio.onended = () => {
        URL.revokeObjectURL(audioUrl)
        resolve()
      }
      audio.onerror = (e) => {
        URL.revokeObjectURL(audioUrl)
        reject(e)
      }

      audio.play().catch(reject)
    } catch (error) {
      reject(error)
    }
  })
}

// Speech recognition setup
const getSpeechRecognition = (): SpeechRecognition | null => {
  if (typeof window === 'undefined') return null

  const SpeechRecognition =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  if (!SpeechRecognition) return null

  return new SpeechRecognition()
}

export interface UseDivineVoiceConversationOptions {
  language?: string
  autoPlayAudio?: boolean
  onEmotionalStateChange?: (state: string, intensity: number) => void
  onPhaseChange?: (phase: string) => void
  onError?: (error: Error) => void
}

export function useDivineVoiceConversation(options: UseDivineVoiceConversationOptions = {}) {
  const {
    language = 'en',
    autoPlayAudio = true,
    onEmotionalStateChange,
    onPhaseChange,
    onError,
  } = options

  // State
  const [conversationState, setConversationState] = useState<DivineConversationState>({
    sessionId: null,
    phase: 'idle',
    emotionalState: 'neutral',
    emotionalIntensity: 0.5,
    messageCount: 0,
    isActive: false,
    messages: [],
  })

  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentResponse, setCurrentResponse] = useState<string>('')
  const [error, setError] = useState<string | null>(null)

  // Refs
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const audioQueueRef = useRef<string[]>([])
  const isPlayingRef = useRef(false)

  // Audio queue processor
  const processAudioQueue = useCallback(async () => {
    if (isPlayingRef.current || audioQueueRef.current.length === 0) return

    isPlayingRef.current = true
    setIsSpeaking(true)

    while (audioQueueRef.current.length > 0) {
      const audioBase64 = audioQueueRef.current.shift()
      if (audioBase64) {
        try {
          await playBase64Audio(audioBase64)
        } catch (err) {
          console.error('[Divine Voice] Audio playback error:', err)
        }
      }
    }

    isPlayingRef.current = false
    setIsSpeaking(false)
  }, [])

  // Add audio to queue
  const queueAudio = useCallback(
    (audioBase64: string) => {
      if (autoPlayAudio && audioBase64) {
        audioQueueRef.current.push(audioBase64)
        processAudioQueue()
      }
    },
    [autoPlayAudio, processAudioQueue]
  )

  /**
   * Start a new divine voice conversation
   */
  const startConversation = useCallback(async (): Promise<DivineResponseResult | null> => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await apiFetch(
        '/api/voice/conversation/start',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            language,
            voice_preference: 'calm',
          }),
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to start conversation: ${response.statusText}`)
      }

      const data = await response.json()

      // Update state
      setConversationState((prev) => ({
        ...prev,
        sessionId: data.session_id,
        phase: data.phase,
        isActive: true,
        messages: [
          {
            role: 'kiaan',
            content: data.greeting,
            timestamp: new Date().toISOString(),
            phase: data.phase,
          },
        ],
      }))

      setCurrentResponse(data.greeting)

      // Queue audio playback
      if (data.audio_base64) {
        queueAudio(data.audio_base64)
      }

      onPhaseChange?.(data.phase)

      return {
        response: data.greeting,
        ssml: data.ssml,
        voiceSettings: data.voice_settings,
        emotionalAnalysis: { state: 'neutral', intensity: 0.5 },
        phase: data.phase,
        audioBase64: data.audio_base64,
      }
    } catch (err) {
      const error = err as Error
      setError(error.message)
      onError?.(error)
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [language, queueAudio, onPhaseChange, onError])

  /**
   * Send a message in the conversation
   */
  const sendMessage = useCallback(
    async (
      message: string,
      includeBreathing: boolean = true,
      includePractice: boolean = false
    ): Promise<DivineResponseResult | null> => {
      if (!conversationState.sessionId) {
        setError('No active conversation. Please start a conversation first.')
        return null
      }

      setIsProcessing(true)
      setError(null)

      try {
        // Add user message to state
        setConversationState((prev) => ({
          ...prev,
          messages: [
            ...prev.messages,
            {
              role: 'user',
              content: message,
              timestamp: new Date().toISOString(),
            },
          ],
        }))

        const response = await apiFetch(
          '/api/voice/conversation/message',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              session_id: conversationState.sessionId,
              message,
              language,
              include_breathing: includeBreathing,
              include_practice: includePractice,
            }),
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to send message: ${response.statusText}`)
        }

        const data = await response.json()

        // Update state
        setConversationState((prev) => ({
          ...prev,
          phase: data.phase,
          emotionalState: data.emotional_analysis.state,
          emotionalIntensity: data.emotional_analysis.intensity,
          messageCount: data.message_count,
          messages: [
            ...prev.messages,
            {
              role: 'kiaan',
              content: data.response,
              timestamp: new Date().toISOString(),
              emotionalState: data.emotional_analysis.state,
              phase: data.phase,
            },
          ],
        }))

        setCurrentResponse(data.response)

        // Notify callbacks
        onEmotionalStateChange?.(data.emotional_analysis.state, data.emotional_analysis.intensity)
        onPhaseChange?.(data.phase)

        // Queue audio playback
        if (data.audio_base64) {
          queueAudio(data.audio_base64)
        }

        return {
          response: data.response,
          ssml: data.ssml,
          voiceSettings: data.voice_settings,
          emotionalAnalysis: data.emotional_analysis,
          phase: data.phase,
          audioBase64: data.audio_base64,
        }
      } catch (err) {
        const error = err as Error
        setError(error.message)
        onError?.(error)
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    [conversationState.sessionId, language, queueAudio, onEmotionalStateChange, onPhaseChange, onError]
  )

  /**
   * End the conversation with a divine blessing
   */
  const endConversation = useCallback(async (): Promise<DivineResponseResult | null> => {
    if (!conversationState.sessionId) {
      return null
    }

    setIsProcessing(true)

    try {
      const response = await apiFetch(
        `/api/voice/conversation/end?session_id=${conversationState.sessionId}`,
        {
          method: 'POST',
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to end conversation: ${response.statusText}`)
      }

      const data = await response.json()

      // Add farewell message
      setConversationState((prev) => ({
        ...prev,
        phase: 'blessing',
        isActive: false,
        messages: [
          ...prev.messages,
          {
            role: 'kiaan',
            content: data.farewell,
            timestamp: new Date().toISOString(),
            phase: 'blessing',
          },
        ],
      }))

      setCurrentResponse(data.farewell)

      // Queue audio playback
      if (data.audio_base64) {
        queueAudio(data.audio_base64)
      }

      onPhaseChange?.('blessing')

      return {
        response: data.farewell,
        ssml: data.ssml,
        voiceSettings: data.voice_settings,
        emotionalAnalysis: { state: 'peaceful', intensity: 0.7 },
        phase: 'blessing',
        audioBase64: data.audio_base64,
      }
    } catch (err) {
      const error = err as Error
      setError(error.message)
      onError?.(error)
      return null
    } finally {
      setIsProcessing(false)
    }
  }, [conversationState.sessionId, queueAudio, onPhaseChange, onError])

  /**
   * Get a guided breathing moment
   */
  const getBreathingMoment = useCallback(
    async (emotionalState: string = 'neutral') => {
      setIsProcessing(true)

      try {
        const response = await apiFetch(
          `/api/voice/conversation/breathe?emotional_state=${emotionalState}${
            conversationState.sessionId ? `&session_id=${conversationState.sessionId}` : ''
          }`,
          {
            method: 'POST',
          }
        )

        if (!response.ok) {
          throw new Error(`Failed to get breathing moment: ${response.statusText}`)
        }

        const data = await response.json()

        setCurrentResponse(data.breathing_guide)

        // Queue audio playback
        if (data.audio_base64) {
          queueAudio(data.audio_base64)
        }

        return data
      } catch (err) {
        const error = err as Error
        setError(error.message)
        onError?.(error)
        return null
      } finally {
        setIsProcessing(false)
      }
    },
    [conversationState.sessionId, queueAudio, onError]
  )

  /**
   * Start voice listening
   */
  const startListening = useCallback(() => {
    const recognition = getSpeechRecognition()

    if (!recognition) {
      setError('Speech recognition not supported in this browser')
      return
    }

    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = language

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript
      if (transcript) {
        sendMessage(transcript)
      }
    }

    recognition.onerror = (event) => {
      setIsListening(false)
      if (event.error !== 'no-speech') {
        setError(`Speech recognition error: ${event.error}`)
      }
    }

    recognitionRef.current = recognition
    recognition.start()
  }, [language, sendMessage])

  /**
   * Stop voice listening
   */
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      setIsListening(false)
    }
  }, [])

  /**
   * Stop audio playback
   */
  const stopSpeaking = useCallback(() => {
    audioQueueRef.current = []
    setIsSpeaking(false)
  }, [])

  /**
   * Reset conversation
   */
  const resetConversation = useCallback(() => {
    setConversationState({
      sessionId: null,
      phase: 'idle',
      emotionalState: 'neutral',
      emotionalIntensity: 0.5,
      messageCount: 0,
      isActive: false,
      messages: [],
    })
    setCurrentResponse('')
    setError(null)
    audioQueueRef.current = []
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
      audioQueueRef.current = []
    }
  }, [])

  return {
    // State
    conversationState,
    currentResponse,
    isListening,
    isSpeaking,
    isProcessing,
    error,

    // Computed
    isActive: conversationState.isActive,
    sessionId: conversationState.sessionId,
    phase: conversationState.phase,
    emotionalState: conversationState.emotionalState,
    emotionalIntensity: conversationState.emotionalIntensity,
    messages: conversationState.messages,

    // Actions
    startConversation,
    sendMessage,
    endConversation,
    getBreathingMoment,

    // Voice control
    startListening,
    stopListening,
    stopSpeaking,

    // Utilities
    resetConversation,
  }
}

export default useDivineVoiceConversation
