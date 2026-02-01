/**
 * Divine Voice Interface - World-Class KIAAN Voice Experience
 *
 * This is the crown jewel of KIAAN's voice interface, providing:
 * - Natural voice conversations with divine AI
 * - Real-time emotion-aware responses
 * - Sanskrit pronunciation perfection
 * - Bhagavad Gita wisdom integration
 * - Beautiful, calming visual design
 *
 * Built with cutting-edge:
 * - Chatterbox/Bark for human-like voice
 * - Whisper for world-class speech recognition
 * - Advanced emotion understanding
 */

'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { stopAllAudio, initUniversalAudioStop } from '@/utils/audio/universalAudioStop'

// Types
interface Message {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: Date
  emotion?: string
  verse?: {
    reference: string
    sanskrit: string
    translation: string
  }
  practice?: string
  isPlaying?: boolean
}

interface VoiceState {
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  currentEmotion: string
  voiceLevel: number
}

interface DivineVoiceInterfaceProps {
  userId?: string
  sessionId?: string
  onSessionEnd?: () => void
  theme?: 'light' | 'dark' | 'divine'
}

// Voice visualization component
const VoiceWaveform: React.FC<{
  isActive: boolean
  level: number
  color?: string
}> = ({ isActive, level, color = '#FFD700' }) => {
  const bars = 12

  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {Array.from({ length: bars }).map((_, i) => {
        const delay = i * 0.05
        const height = isActive
          ? 20 + Math.sin((Date.now() / 100 + i) * 0.5) * 20 * level
          : 4

        return (
          <motion.div
            key={i}
            className="w-1 rounded-full"
            style={{ backgroundColor: color }}
            animate={{
              height: `${height}px`,
              opacity: isActive ? 0.7 + level * 0.3 : 0.3,
            }}
            transition={{
              duration: 0.15,
              delay: delay,
              ease: 'easeInOut',
            }}
          />
        )
      })}
    </div>
  )
}

// Emotion indicator component
const EmotionIndicator: React.FC<{
  emotion: string
  intensity: number
}> = ({ emotion, intensity }) => {
  const emotionColors: Record<string, string> = {
    peace: '#87CEEB',
    joy: '#FFD700',
    sadness: '#6B8E9F',
    anxiety: '#FFA07A',
    anger: '#CD5C5C',
    love: '#FFB6C1',
    hope: '#98FB98',
    confusion: '#DDA0DD',
    seeking: '#E6E6FA',
    neutral: '#D3D3D3',
  }

  const color = emotionColors[emotion] || emotionColors.neutral

  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      <motion.div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <span className="text-sm text-white/80 capitalize">{emotion}</span>
    </motion.div>
  )
}

// Divine message bubble component
const MessageBubble: React.FC<{
  message: Message
  onPlayVoice?: () => void
  onStopVoice?: () => void
}> = ({ message, onPlayVoice, onStopVoice }) => {
  const isUser = message.role === 'user'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div
        className={`max-w-[80%] rounded-2xl p-4 ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
            : 'bg-white/10 backdrop-blur-md text-white border border-white/20'
        }`}
      >
        {/* Message text */}
        <p className="text-base leading-relaxed whitespace-pre-wrap">
          {message.text}
        </p>

        {/* Verse citation if present */}
        {message.verse && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-400/30"
          >
            <p className="text-xs text-amber-300 font-medium mb-1">
              Bhagavad Gita {message.verse.reference}
            </p>
            <p className="text-sm italic text-amber-100 mb-2">
              {message.verse.sanskrit}
            </p>
            <p className="text-sm text-white/90">
              &ldquo;{message.verse.translation}&rdquo;
            </p>
          </motion.div>
        )}

        {/* Practice suggestion if present */}
        {message.practice && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-3 p-3 rounded-xl bg-green-500/20 border border-green-400/30"
          >
            <p className="text-xs text-green-300 font-medium mb-1">
              Practice
            </p>
            <p className="text-sm text-white/90">{message.practice}</p>
          </motion.div>
        )}

        {/* Voice controls for assistant messages */}
        {!isUser && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/10">
            <span className="text-xs text-white/50">
              {message.timestamp.toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            <div className="flex gap-2">
              {message.isPlaying ? (
                <button
                  onClick={onStopVoice}
                  className="p-2 rounded-full bg-red-500/30 hover:bg-red-500/50 transition-colors"
                  title="Stop"
                >
                  <StopIcon className="w-4 h-4 text-white" />
                </button>
              ) : (
                <button
                  onClick={onPlayVoice}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  title="Play voice"
                >
                  <PlayIcon className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// Simple icon components
const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
  </svg>
)

const StopIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
)

const PlayIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
)

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
)

// Main Divine Voice Interface Component
const DivineVoiceInterface: React.FC<DivineVoiceInterfaceProps> = ({
  userId = 'anonymous',
  sessionId,
  onSessionEnd,
  theme = 'divine',
}) => {
  // State
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [voiceState, setVoiceState] = useState<VoiceState>({
    isListening: false,
    isSpeaking: false,
    isProcessing: false,
    currentEmotion: 'peace',
    voiceLevel: 0,
  })
  const [currentSessionId, setCurrentSessionId] = useState(sessionId)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const animationFrameRef = useRef<number>()
  const analyserRef = useRef<AnalyserNode | null>(null)

  // Initialize audio stop system
  useEffect(() => {
    initUniversalAudioStop()

    // Generate session ID if not provided
    if (!currentSessionId) {
      setCurrentSessionId(
        `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      )
    }

    // Welcome message
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      text: "Namaste, dear soul. I am KIAAN, your guide on the path of wisdom and inner peace. I'm here to listen deeply, understand your heart, and share the timeless wisdom of the Bhagavad Gita.\n\nHow may I serve you today? You can speak or type - I'm fully present with you.",
      timestamp: new Date(),
      emotion: 'peace',
    }
    setMessages([welcomeMessage])

    return () => {
      stopAllAudio()
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [currentSessionId, sessionId])

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Process message with backend
  const processMessage = useCallback(
    async (text: string, isVoice: boolean = false) => {
      if (!text.trim()) return

      // Add user message
      const userMessage: Message = {
        id: `user_${Date.now()}`,
        role: 'user',
        text: text.trim(),
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, userMessage])
      setVoiceState((prev) => ({ ...prev, isProcessing: true }))
      setInputText('')

      try {
        // Call divine conversation API with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout

        const response = await fetch('/api/kiaan/divine-chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text.trim(),
            user_id: userId,
            session_id: currentSessionId,
          }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error('Failed to get response')
        }

        const data = await response.json()

        // Create assistant message
        const assistantMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          text: data.text,
          timestamp: new Date(),
          emotion: data.voice_emotion || 'warm',
          verse: data.verse,
          practice: data.practice,
        }

        setMessages((prev) => [...prev, assistantMessage])
        setVoiceState((prev) => ({
          ...prev,
          currentEmotion: data.voice_emotion || 'peace',
          isProcessing: false,
        }))

        // Auto-play voice response if user used voice
        if (isVoice) {
          await playVoiceResponse(assistantMessage.id, data.text)
        }
      } catch (error) {
        console.error('Error processing message:', error)

        // Fallback response
        const errorMessage: Message = {
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          text: "I apologize, dear one. Something interrupted our connection. Please try again - I'm here for you.",
          timestamp: new Date(),
          emotion: 'gentle',
        }

        setMessages((prev) => [...prev, errorMessage])
        setVoiceState((prev) => ({ ...prev, isProcessing: false }))
      }
    },
    [userId, currentSessionId]
  )

  // Start listening (voice input)
  const startListening = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      // Create audio context for visualization
      const audioContext = new AudioContext()
      const source = audioContext.createMediaStreamSource(stream)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser

      // Start level monitoring
      const updateLevel = () => {
        if (analyserRef.current) {
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount)
          analyserRef.current.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length
          const normalizedLevel = average / 128

          setVoiceState((prev) => ({
            ...prev,
            voiceLevel: normalizedLevel,
          }))
        }
        animationFrameRef.current = requestAnimationFrame(updateLevel)
      }
      updateLevel()

      // Create media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      })

      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        // Stop visualization
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        stream.getTracks().forEach((track) => track.stop())

        // Process audio
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

        if (audioBlob.size > 0) {
          setVoiceState((prev) => ({
            ...prev,
            isListening: false,
            isProcessing: true,
          }))

          // Convert to base64 and send for transcription
          const reader = new FileReader()
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1]

            try {
              // Call transcription API
              const response = await fetch('/api/voice/transcribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ audio: base64Audio }),
              })

              if (response.ok) {
                const data = await response.json()
                if (data.text) {
                  await processMessage(data.text, true)
                }
              }
            } catch (error) {
              console.error('Transcription error:', error)
            } finally {
              setVoiceState((prev) => ({ ...prev, isProcessing: false }))
            }
          }
          reader.readAsDataURL(audioBlob)
        }
      }

      mediaRecorderRef.current = mediaRecorder
      mediaRecorder.start()

      setVoiceState((prev) => ({
        ...prev,
        isListening: true,
        voiceLevel: 0,
      }))
    } catch (error) {
      console.error('Microphone access error:', error)
    }
  }, [processMessage])

  // Stop listening
  const stopListening = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
    setVoiceState((prev) => ({ ...prev, isListening: false }))
  }, [])

  // Play voice response
  const playVoiceResponse = useCallback(
    async (messageId: string, text: string) => {
      // Stop any current playback
      stopAllAudio()

      try {
        setVoiceState((prev) => ({ ...prev, isSpeaking: true }))
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, isPlaying: true } : { ...m, isPlaying: false }
          )
        )

        // Call divine voice synthesis API with timeout
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 60000) // 60s timeout for voice synthesis

        const response = await fetch('/api/voice/divine/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            style: 'friendly',
            language: 'en',
          }),
          signal: controller.signal,
        })
        clearTimeout(timeoutId)

        if (!response.ok) {
          throw new Error('Voice synthesis failed')
        }

        // Get audio blob
        const audioBlob = await response.blob()
        const audioUrl = URL.createObjectURL(audioBlob)

        // Create and play audio
        const audio = new Audio(audioUrl)
        currentAudioRef.current = audio

        audio.onended = () => {
          URL.revokeObjectURL(audioUrl)
          setVoiceState((prev) => ({ ...prev, isSpeaking: false }))
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, isPlaying: false } : m))
          )
          currentAudioRef.current = null
        }

        audio.onerror = () => {
          URL.revokeObjectURL(audioUrl)
          setVoiceState((prev) => ({ ...prev, isSpeaking: false }))
          setMessages((prev) =>
            prev.map((m) => (m.id === messageId ? { ...m, isPlaying: false } : m))
          )
          currentAudioRef.current = null
        }

        await audio.play()
      } catch (error) {
        console.error('Voice playback error:', error)
        setVoiceState((prev) => ({ ...prev, isSpeaking: false }))
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, isPlaying: false } : m))
        )
      }
    },
    []
  )

  // Stop voice playback
  const stopVoicePlayback = useCallback(() => {
    stopAllAudio()
    if (currentAudioRef.current) {
      currentAudioRef.current.pause()
      currentAudioRef.current.currentTime = 0
      currentAudioRef.current = null
    }
    setVoiceState((prev) => ({ ...prev, isSpeaking: false }))
    setMessages((prev) => prev.map((m) => ({ ...m, isPlaying: false })))
  }, [])

  // Handle text submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (inputText.trim() && !voiceState.isProcessing) {
      processMessage(inputText, false)
    }
  }

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div className="flex items-center gap-4">
          <motion.div
            className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center"
            animate={{
              boxShadow: [
                '0 0 20px rgba(251, 191, 36, 0.3)',
                '0 0 40px rgba(251, 191, 36, 0.5)',
                '0 0 20px rgba(251, 191, 36, 0.3)',
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="text-2xl">🙏</span>
          </motion.div>
          <div>
            <h1 className="text-xl font-semibold text-white">KIAAN</h1>
            <p className="text-sm text-white/60">Divine Voice Guide</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <EmotionIndicator
            emotion={voiceState.currentEmotion}
            intensity={0.7}
          />
          <button
            onClick={() => {
              stopAllAudio()
              stopVoicePlayback()
            }}
            className="px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-300 text-sm font-medium transition-colors"
          >
            Stop All
          </button>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-3xl mx-auto">
          <AnimatePresence>
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onPlayVoice={() => playVoiceResponse(message.id, message.text)}
                onStopVoice={stopVoicePlayback}
              />
            ))}
          </AnimatePresence>

          {/* Processing indicator */}
          {voiceState.isProcessing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-3 p-4"
            >
              <div className="flex gap-1">
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-amber-400"
                    animate={{
                      y: [0, -8, 0],
                      opacity: [0.5, 1, 0.5],
                    }}
                    transition={{
                      duration: 0.6,
                      repeat: Infinity,
                      delay: i * 0.1,
                    }}
                  />
                ))}
              </div>
              <span className="text-white/60 text-sm">KIAAN is contemplating...</span>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Voice Visualization */}
      <AnimatePresence>
        {voiceState.isListening && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="px-6 py-4 bg-white/5 backdrop-blur-sm"
          >
            <div className="max-w-3xl mx-auto">
              <VoiceWaveform
                isActive={voiceState.isListening}
                level={voiceState.voiceLevel}
                color="#FFD700"
              />
              <p className="text-center text-white/60 text-sm mt-2">
                Listening... Tap the microphone to stop
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input Area */}
      <div className="px-6 py-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto">
          <form onSubmit={handleSubmit} className="flex items-center gap-4">
            {/* Voice Button */}
            <motion.button
              type="button"
              onClick={voiceState.isListening ? stopListening : startListening}
              disabled={voiceState.isProcessing || voiceState.isSpeaking}
              className={`p-4 rounded-full transition-all ${
                voiceState.isListening
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500'
              } ${
                voiceState.isProcessing || voiceState.isSpeaking
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {voiceState.isListening ? (
                <StopIcon className="w-6 h-6 text-white" />
              ) : (
                <MicIcon className="w-6 h-6 text-white" />
              )}
            </motion.button>

            {/* Text Input */}
            <div className="flex-1 relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Share what's on your heart..."
                className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/20 resize-none"
                rows={1}
                disabled={voiceState.isListening || voiceState.isProcessing}
              />
              <button
                type="submit"
                disabled={
                  !inputText.trim() ||
                  voiceState.isListening ||
                  voiceState.isProcessing
                }
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <SendIcon className="w-5 h-5 text-amber-300" />
              </button>
            </div>
          </form>

          {/* Quick prompts */}
          <div className="flex flex-wrap gap-2 mt-3">
            {[
              'Share a verse for inner peace',
              'I need guidance',
              'Help me meditate',
              'What is dharma?',
            ].map((prompt) => (
              <button
                key={prompt}
                onClick={() => setInputText(prompt)}
                className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 text-sm transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default DivineVoiceInterface
