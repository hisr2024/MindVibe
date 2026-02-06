'use client'

/**
 * Voice Companion - Conversational Voice Interface with KIAAN
 *
 * A focused, distraction-free voice conversation experience:
 * - Tap to talk, release to send
 * - Continuous conversation mode (auto-listen after KIAAN speaks)
 * - Real-time transcription display
 * - Divine Voice synthesis with browser fallback
 * - Conversation history with save to Sacred Reflections
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useVoiceOutput } from '@/hooks/useVoiceOutput'
import { apiFetch } from '@/lib/api'
import { saveSacredReflection } from '@/utils/sacredReflections'
import divineVoiceService from '@/services/divineVoiceService'

// ─── Types ──────────────────────────────────────────────────────────────────

type CompanionState = 'idle' | 'listening' | 'processing' | 'speaking' | 'error'

interface Message {
  id: string
  role: 'user' | 'kiaan'
  content: string
  timestamp: Date
  verse?: { chapter: number; verse: number; text: string }
  saved?: boolean
}

// ─── Fallback Responses ─────────────────────────────────────────────────────

const FALLBACK_RESPONSES = [
  "The Gita teaches us that peace comes from within. Take a deep breath, and know that you are exactly where you need to be.",
  "Remember, you have the right to your actions, but not to the fruits of your actions. Focus on what you can control.",
  "In moments of challenge, the wise remain undisturbed. Your inner peace is your greatest strength.",
  "The soul is eternal and unchanging. Whatever difficulties you face are temporary.",
  "Whenever you feel lost, remember that you are never alone on this journey. I am here with you.",
]

// ─── Component ──────────────────────────────────────────────────────────────

export default function VoiceCompanionPage() {
  // State
  const [state, setState] = useState<CompanionState>('idle')
  const [messages, setMessages] = useState<Message[]>([])
  const [error, setError] = useState<string | null>(null)
  const [conversationMode, setConversationMode] = useState(false)
  const [textInput, setTextInput] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [autoSpeak, setAutoSpeak] = useState(true)
  const [useDivineVoice, setUseDivineVoice] = useState(true)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processingRef = useRef(false)
  const conversationModeRef = useRef(conversationMode)
  const isMountedRef = useRef(true)

  // Keep ref in sync with state
  useEffect(() => {
    conversationModeRef.current = conversationMode
  }, [conversationMode])

  // Cleanup on unmount - prevent setState on unmounted component
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      divineVoiceService.stop()
    }
  }, [])

  // Voice Input
  const voiceInput = useVoiceInput({
    language: 'en',
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        handleUserMessage(text.trim())
      }
    },
    onError: (err) => {
      setError(err)
      setState('error')
    },
  })

  // Voice Output (browser TTS fallback)
  const voiceOutput = useVoiceOutput({
    language: 'en',
    rate: 0.95,
    onStart: () => { if (isMountedRef.current) setState('speaking') },
    onEnd: () => {
      if (!isMountedRef.current) return
      setState('idle')
      // In conversation mode, auto-listen after KIAAN finishes
      if (conversationModeRef.current) {
        setTimeout(() => {
          if (!isMountedRef.current) return
          voiceInput.startListening()
          setState('listening')
        }, 500)
      }
    },
    onError: () => {
      if (isMountedRef.current) setState('idle')
    },
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Send message to KIAAN ─────────────────────────────────────────

  const sendToKiaan = useCallback(async (text: string): Promise<{ response: string; verse?: Message['verse'] } | null> => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      // Try voice query API first
      const response = await apiFetch('/api/voice/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          language: 'en',
          context: 'voice',
          include_audio: false,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const data = await response.json()
        return {
          response: data.response || data.message || 'I am here with you.',
          verse: data.verse,
        }
      }

      // Fallback to chat API
      const chatController = new AbortController()
      const chatTimeoutId = setTimeout(() => chatController.abort(), 20000)

      const chatResponse = await apiFetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: 'en',
          context: 'voice',
        }),
        signal: chatController.signal,
      })
      clearTimeout(chatTimeoutId)

      if (chatResponse.ok) {
        const chatData = await chatResponse.json()
        return {
          response: chatData.response || chatData.message || 'I am here with you.',
        }
      }

      return null
    } catch {
      return null
    }
  }, [])

  // ─── Speak response ────────────────────────────────────────────────

  // Helper: resume listening in conversation mode (safe for unmount)
  const resumeListeningIfConversation = useCallback(() => {
    if (!isMountedRef.current) return
    if (conversationModeRef.current) {
      setTimeout(() => {
        if (!isMountedRef.current) return
        voiceInput.startListening()
        setState('listening')
      }, 500)
    }
  }, [voiceInput])

  const speakResponse = useCallback(async (text: string) => {
    if (!autoSpeak) {
      if (isMountedRef.current) setState('idle')
      resumeListeningIfConversation()
      return
    }

    if (isMountedRef.current) setState('speaking')

    // Try divine voice first, fall back to browser TTS
    if (useDivineVoice) {
      const result = await divineVoiceService.synthesize({
        text,
        language: 'en',
        style: 'friendly',
        onEnd: () => {
          if (!isMountedRef.current) return
          setState('idle')
          resumeListeningIfConversation()
        },
        onError: () => {
          if (!isMountedRef.current) return
          // Fall back to browser TTS
          voiceOutput.speak(text)
        },
      })

      if (result.success) return
    }

    // Browser TTS fallback
    if (isMountedRef.current) {
      voiceOutput.speak(text)
    }
  }, [autoSpeak, useDivineVoice, voiceOutput, resumeListeningIfConversation])

  // ─── Handle user message ───────────────────────────────────────────

  const handleUserMessage = useCallback(async (text: string) => {
    if (processingRef.current) return
    processingRef.current = true

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
    }
    setMessages(prev => [...prev, userMsg])

    // Process with KIAAN
    setState('processing')
    setError(null)

    const result = await sendToKiaan(text)

    const responseText = result?.response
      || FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)]

    // Add KIAAN message
    const kiaanMsg: Message = {
      id: `kiaan-${Date.now()}`,
      role: 'kiaan',
      content: responseText,
      timestamp: new Date(),
      verse: result?.verse,
    }
    setMessages(prev => [...prev, kiaanMsg])

    processingRef.current = false

    // Speak the response
    await speakResponse(responseText)
  }, [sendToKiaan, speakResponse])

  // ─── Text input handler ────────────────────────────────────────────

  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!textInput.trim()) return
    handleUserMessage(textInput.trim())
    setTextInput('')
  }

  // ─── Mic button handler ────────────────────────────────────────────

  const handleMicToggle = () => {
    if (voiceInput.isListening) {
      voiceInput.stopListening()
      setState('idle')
    } else {
      setError(null)
      voiceInput.startListening()
      setState('listening')
    }
  }

  // ─── Conversation mode toggle ──────────────────────────────────────

  const toggleConversationMode = () => {
    const newMode = !conversationMode
    setConversationMode(newMode)
    if (newMode && state === 'idle') {
      voiceInput.startListening()
      setState('listening')
    } else if (!newMode && voiceInput.isListening) {
      voiceInput.stopListening()
      setState('idle')
    }
  }

  // ─── Stop everything ───────────────────────────────────────────────

  const stopAll = () => {
    voiceInput.stopListening()
    voiceOutput.cancel()
    divineVoiceService.stop()
    setState('idle')
    setConversationMode(false)
  }

  // ─── Save message ─────────────────────────────────────────────────

  const saveMessage = async (msg: Message) => {
    const success = await saveSacredReflection(msg.content, msg.role === 'kiaan' ? 'kiaan' : 'user')
    if (success) {
      setMessages(prev =>
        prev.map(m => m.id === msg.id ? { ...m, saved: true } : m)
      )
    }
  }

  // ─── Clear conversation ────────────────────────────────────────────

  const clearConversation = () => {
    stopAll()
    setMessages([])
    setError(null)
  }

  // ─── State indicator ──────────────────────────────────────────────

  const stateLabel: Record<CompanionState, string> = {
    idle: 'Tap the mic to start',
    listening: 'Listening...',
    processing: 'KIAAN is thinking...',
    speaking: 'KIAAN is speaking...',
    error: error || 'Something went wrong',
  }

  // ─── Render ────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Link
            href="/kiaan/chat"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            aria-label="Back to chat"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-white">Voice Companion</h1>
            <p className="text-xs text-white/50">Speak with KIAAN</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Conversation Mode Toggle */}
          <button
            onClick={toggleConversationMode}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              conversationMode
                ? 'bg-mv-sunrise/20 text-mv-sunrise border border-mv-sunrise/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
            title="Continuous conversation - auto-listen after KIAAN speaks"
          >
            {conversationMode ? 'Conversation ON' : 'Conversation'}
          </button>

          {/* Settings */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/60"
            aria-label="Settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </svg>
          </button>

          {/* Clear */}
          {messages.length > 0 && (
            <button
              onClick={clearConversation}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-white/60"
              aria-label="Clear conversation"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="py-3 px-4 my-2 rounded-2xl bg-white/5 border border-white/10 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Auto-speak responses</span>
            <button
              onClick={() => setAutoSpeak(!autoSpeak)}
              className={`w-10 h-6 rounded-full transition-colors ${autoSpeak ? 'bg-mv-sunrise' : 'bg-white/20'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${autoSpeak ? 'translate-x-4' : ''}`} />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">Use Divine Voice (high quality)</span>
            <button
              onClick={() => setUseDivineVoice(!useDivineVoice)}
              className={`w-10 h-6 rounded-full transition-colors ${useDivineVoice ? 'bg-mv-ocean' : 'bg-white/20'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${useDivineVoice ? 'translate-x-4' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-mv-sunrise/20 to-mv-ocean/20 flex items-center justify-center">
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-mv-sunrise">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="text-white/80 font-medium">Namaste</p>
              <p className="text-white/40 text-sm mt-1">
                Tap the microphone or type to begin.<br />
                KIAAN is ready to guide you with wisdom.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {['How can I find inner peace?', 'I feel anxious today', 'Tell me a Gita verse'].map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => handleUserMessage(prompt)}
                  className="px-3 py-1.5 rounded-full text-xs bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80 transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-mv-sunrise/15 border border-mv-sunrise/20 text-white'
                  : 'bg-white/5 border border-white/10 text-white/90'
              }`}
            >
              {/* Role label */}
              <div className={`text-[10px] font-medium mb-1 ${
                msg.role === 'user' ? 'text-mv-sunrise/70' : 'text-mv-ocean/70'
              }`}>
                {msg.role === 'user' ? 'You' : 'KIAAN'}
              </div>

              {/* Content */}
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

              {/* Verse reference */}
              {msg.verse && (
                <div className="mt-2 pt-2 border-t border-white/10">
                  <p className="text-[10px] text-mv-ocean/60 font-medium">
                    Bhagavad Gita {msg.verse.chapter}.{msg.verse.verse}
                  </p>
                  <p className="text-xs text-white/50 italic mt-0.5">{msg.verse.text}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-[10px] text-white/30">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {msg.role === 'kiaan' && (
                  <>
                    <button
                      onClick={() => speakResponse(msg.content)}
                      className="text-[10px] text-white/30 hover:text-white/60 transition-colors"
                      title="Replay"
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => saveMessage(msg)}
                      className={`text-[10px] transition-colors ${
                        msg.saved ? 'text-mv-sunrise/70' : 'text-white/30 hover:text-white/60'
                      }`}
                      title={msg.saved ? 'Saved' : 'Save to reflections'}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill={msg.saved ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                        <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Processing indicator */}
        {state === 'processing' && (
          <div className="flex justify-start">
            <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-mv-ocean animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 rounded-full bg-mv-ocean animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 rounded-full bg-mv-ocean animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-white/40">KIAAN is reflecting...</span>
              </div>
            </div>
          </div>
        )}

        {/* Interim transcript */}
        {voiceInput.interimTranscript && (
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-mv-sunrise/10 border border-mv-sunrise/15 border-dashed">
              <p className="text-sm text-white/50 italic">{voiceInput.interimTranscript}</p>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Error Banner */}
      {error && state === 'error' && (
        <div className="mx-2 mb-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-xs">
          {error}
          <button
            onClick={() => { setError(null); setState('idle') }}
            className="ml-2 underline text-red-400 hover:text-red-300"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-white/10 py-4 space-y-3">
        {/* State indicator */}
        <div className="text-center">
          <span className={`text-xs font-medium ${
            state === 'listening' ? 'text-mv-sunrise animate-pulse' :
            state === 'processing' ? 'text-mv-ocean' :
            state === 'speaking' ? 'text-mv-aurora' :
            state === 'error' ? 'text-red-400' :
            'text-white/40'
          }`}>
            {stateLabel[state]}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Text input */}
          <form onSubmit={handleTextSubmit} className="flex-1 flex gap-2">
            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-mv-sunrise/30 focus:ring-1 focus:ring-mv-sunrise/20 transition-all"
              disabled={state === 'processing' || state === 'speaking'}
            />
            {textInput.trim() && (
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-mv-sunrise/20 text-mv-sunrise text-sm font-medium hover:bg-mv-sunrise/30 transition-colors"
                disabled={state === 'processing' || state === 'speaking'}
              >
                Send
              </button>
            )}
          </form>

          {/* Mic button */}
          <button
            onClick={state === 'speaking' || state === 'processing' ? stopAll : handleMicToggle}
            disabled={!voiceInput.isSupported && state !== 'speaking' && state !== 'processing'}
            className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all shrink-0 ${
              state === 'listening'
                ? 'bg-mv-sunrise text-white shadow-lg shadow-mv-sunrise/30 scale-110'
                : state === 'speaking' || state === 'processing'
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/30'
                : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white border-2 border-white/10'
            }`}
            aria-label={
              state === 'listening' ? 'Stop listening' :
              state === 'speaking' || state === 'processing' ? 'Stop' :
              'Start listening'
            }
          >
            {/* Pulse ring when listening */}
            {state === 'listening' && (
              <div className="absolute inset-0 rounded-full bg-mv-sunrise/20 animate-ping" />
            )}

            {state === 'speaking' || state === 'processing' ? (
              // Stop icon
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              // Mic icon
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>
        </div>

        {/* Voice support warning */}
        {!voiceInput.isSupported && (
          <p className="text-center text-[10px] text-white/30">
            Voice input requires Chrome, Edge, or Safari. Use text input instead.
          </p>
        )}
      </div>
    </div>
  )
}
