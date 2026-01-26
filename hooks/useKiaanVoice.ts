/**
 * useKiaanVoice - Comprehensive hook for KIAAN Voice integration
 *
 * Combines voice input, KIAAN wisdom processing, and voice output
 * for a complete voice-driven spiritual guidance experience.
 *
 * Features:
 * - Speech-to-text for user input
 * - KIAAN API integration for Gita-based wisdom responses
 * - Text-to-speech for KIAAN responses
 * - Auto-save to Sacred Reflections
 * - Multi-language support
 */

'use client'

import { useState, useCallback, useRef } from 'react'
import { useVoiceInput } from './useVoiceInput'
import { useVoiceOutput } from './useVoiceOutput'
import { saveSacredReflection } from '@/utils/sacredReflections'

export type KiaanVoiceState =
  | 'idle'           // Ready to start
  | 'listening'      // Recording user speech
  | 'processing'     // Sending to KIAAN API
  | 'speaking'       // Speaking KIAAN response
  | 'error'          // Error occurred

export interface KiaanVoiceMessage {
  id: string
  role: 'user' | 'kiaan'
  content: string
  timestamp: Date
  savedToReflections?: boolean
}

export interface UseKiaanVoiceOptions {
  language?: string
  autoSpeak?: boolean           // Auto-speak KIAAN responses
  autoSaveToReflections?: boolean  // Auto-save responses to Sacred Reflections
  onMessage?: (message: KiaanVoiceMessage) => void
  onStateChange?: (state: KiaanVoiceState) => void
  onError?: (error: string) => void
}

export interface UseKiaanVoiceReturn {
  // State
  state: KiaanVoiceState
  isListening: boolean
  isProcessing: boolean
  isSpeaking: boolean
  currentTranscript: string
  messages: KiaanVoiceMessage[]
  error: string | null

  // Voice Input Controls
  startListening: () => void
  stopListening: () => void

  // Voice Output Controls
  speakResponse: (text: string) => void
  stopSpeaking: () => void

  // KIAAN Integration
  sendToKiaan: (text: string) => Promise<string | null>

  // Convenience Methods
  startVoiceConversation: () => void  // Start listening, auto-process, auto-speak
  saveToReflections: (content: string, source?: 'kiaan' | 'user') => Promise<boolean>
  clearMessages: () => void

  // Support
  isVoiceSupported: boolean
  isTtsSupported: boolean
}

export function useKiaanVoice(options: UseKiaanVoiceOptions = {}): UseKiaanVoiceReturn {
  const {
    language = 'en',
    autoSpeak = true,
    autoSaveToReflections = false,
    onMessage,
    onStateChange,
    onError,
  } = options

  // State
  const [state, setState] = useState<KiaanVoiceState>('idle')
  const [messages, setMessages] = useState<KiaanVoiceMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [currentTranscript, setCurrentTranscript] = useState('')

  // Refs for tracking
  const processingRef = useRef(false)

  // Update state helper
  const updateState = useCallback((newState: KiaanVoiceState) => {
    setState(newState)
    onStateChange?.(newState)
  }, [onStateChange])

  // Voice Input
  const voiceInput = useVoiceInput({
    language,
    onTranscript: (text, isFinal) => {
      setCurrentTranscript(text)
      if (isFinal && text.trim()) {
        handleFinalTranscript(text.trim())
      }
    },
    onError: (err) => {
      setError(err)
      updateState('error')
      onError?.(err)
    },
  })

  // Voice Output
  const voiceOutput = useVoiceOutput({
    language,
    rate: 0.95,
    onStart: () => updateState('speaking'),
    onEnd: () => updateState('idle'),
    onError: (err) => {
      setError(err)
      onError?.(err)
    },
  })

  // Send message to KIAAN API
  const sendToKiaan = useCallback(async (text: string): Promise<string | null> => {
    if (processingRef.current) return null
    processingRef.current = true
    updateState('processing')
    setError(null)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
      const response = await fetch(`${apiUrl}/api/chat/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language,
          context: 'voice'  // Indicate this is a voice interaction
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to get KIAAN response')
      }

      const data = await response.json()
      const kiaanResponse = data.response || data.message || 'I am here with you. Please try again.'

      return kiaanResponse
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to connect to KIAAN'
      setError(errorMsg)
      updateState('error')
      onError?.(errorMsg)
      return null
    } finally {
      processingRef.current = false
    }
  }, [language, updateState, onError])

  // Handle final transcript
  const handleFinalTranscript = useCallback(async (text: string) => {
    // Add user message
    const userMessage: KiaanVoiceMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMessage])
    onMessage?.(userMessage)

    // Save user message to reflections if enabled
    if (autoSaveToReflections) {
      await saveSacredReflection(text, 'user')
      userMessage.savedToReflections = true
    }

    // Get KIAAN response
    const response = await sendToKiaan(text)

    if (response) {
      // Add KIAAN message
      const kiaanMessage: KiaanVoiceMessage = {
        id: `kiaan-${Date.now()}`,
        role: 'kiaan',
        content: response,
        timestamp: new Date(),
      }

      // Save KIAAN response to reflections if enabled
      if (autoSaveToReflections) {
        await saveSacredReflection(response, 'kiaan')
        kiaanMessage.savedToReflections = true
      }

      setMessages(prev => [...prev, kiaanMessage])
      onMessage?.(kiaanMessage)

      // Auto-speak if enabled
      if (autoSpeak && voiceOutput.isSupported) {
        voiceOutput.speak(response)
      } else {
        updateState('idle')
      }
    }
  }, [autoSpeak, autoSaveToReflections, sendToKiaan, voiceOutput, onMessage, updateState])

  // Start listening
  const startListening = useCallback(() => {
    setError(null)
    setCurrentTranscript('')
    updateState('listening')
    voiceInput.startListening()
  }, [voiceInput, updateState])

  // Stop listening
  const stopListening = useCallback(() => {
    voiceInput.stopListening()
    if (state === 'listening') {
      updateState('idle')
    }
  }, [voiceInput, state, updateState])

  // Speak response
  const speakResponse = useCallback((text: string) => {
    voiceOutput.speak(text)
  }, [voiceOutput])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    voiceOutput.cancel()
    updateState('idle')
  }, [voiceOutput, updateState])

  // Start voice conversation (convenience method)
  const startVoiceConversation = useCallback(() => {
    startListening()
  }, [startListening])

  // Save to reflections manually
  const saveToReflections = useCallback(async (
    content: string,
    source: 'kiaan' | 'user' = 'kiaan'
  ): Promise<boolean> => {
    return saveSacredReflection(content, source)
  }, [])

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([])
    setError(null)
    setCurrentTranscript('')
    updateState('idle')
  }, [updateState])

  return {
    // State
    state,
    isListening: voiceInput.isListening,
    isProcessing: state === 'processing',
    isSpeaking: voiceOutput.isSpeaking,
    currentTranscript: voiceInput.interimTranscript || currentTranscript,
    messages,
    error,

    // Voice Input Controls
    startListening,
    stopListening,

    // Voice Output Controls
    speakResponse,
    stopSpeaking,

    // KIAAN Integration
    sendToKiaan,

    // Convenience Methods
    startVoiceConversation,
    saveToReflections,
    clearMessages,

    // Support
    isVoiceSupported: voiceInput.isSupported,
    isTtsSupported: voiceOutput.isSupported,
  }
}
