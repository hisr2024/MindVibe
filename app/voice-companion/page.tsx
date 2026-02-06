'use client'

/**
 * Voice Companion v2 - KIAAN Divine Friend Experience
 *
 * A complete voice-driven spiritual guidance interface with:
 * - "Hey KIAAN" wake word detection (hands-free activation)
 * - Context memory (remembers conversations, emotional patterns)
 * - Divine friend personality with personalized greetings
 * - Continuous conversation mode (auto-listen after KIAAN speaks)
 * - Emotion-aware responses with visual indicators
 * - Divine Voice synthesis with browser TTS fallback
 * - Conversation history with save to Sacred Reflections
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useVoiceOutput } from '@/hooks/useVoiceOutput'
import { useWakeWord } from '@/hooks/useWakeWord'
import { apiFetch } from '@/lib/api'
import { saveSacredReflection } from '@/utils/sacredReflections'
import divineVoiceService from '@/services/divineVoiceService'
import {
  recordKiaanConversation,
  getKiaanContextForResponse,
  getPersonalizedKiaanGreeting,
  getEmotionalSummary,
  contextMemory,
} from '@/utils/voice/contextMemory'

// ─── Types ──────────────────────────────────────────────────────────────────

type CompanionState = 'idle' | 'wake-listening' | 'listening' | 'processing' | 'speaking' | 'error'

interface Message {
  id: string
  role: 'user' | 'kiaan'
  content: string
  timestamp: Date
  verse?: { chapter: number; verse: number; text: string }
  emotion?: string
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

// Quick prompt suggestions based on emotional context
const PROMPT_SUGGESTIONS = {
  default: [
    'How can I find inner peace?',
    'I feel anxious today',
    'Tell me a Gita verse',
    'Guide me through a breathing exercise',
  ],
  returning: [
    'Continue our last conversation',
    'How am I progressing spiritually?',
    'I need guidance today',
    'Share a verse about strength',
  ],
  anxious: [
    'Help me calm my mind',
    'I feel overwhelmed right now',
    'Guide me through meditation',
    'What does the Gita say about fear?',
  ],
}

// ─── Emotion Detection (lightweight client-side) ────────────────────────────

function detectEmotion(text: string): string | undefined {
  const lower = text.toLowerCase()
  const emotions: Record<string, string[]> = {
    anxiety: ['anxious', 'worried', 'nervous', 'fear', 'scared', 'panic', 'stress', 'overwhelmed'],
    sadness: ['sad', 'depressed', 'hopeless', 'lonely', 'grief', 'crying', 'heartbroken'],
    anger: ['angry', 'frustrated', 'annoyed', 'furious', 'irritated', 'mad'],
    confusion: ['confused', 'lost', 'unsure', 'don\'t know', 'stuck', 'uncertain'],
    peace: ['peaceful', 'calm', 'serene', 'grateful', 'thankful', 'blessed'],
    hope: ['hopeful', 'optimistic', 'excited', 'inspired', 'motivated'],
    love: ['love', 'compassion', 'caring', 'kindness', 'devotion'],
  }
  for (const [emotion, keywords] of Object.entries(emotions)) {
    if (keywords.some(kw => lower.includes(kw))) return emotion
  }
  return undefined
}

function getEmotionColor(emotion?: string): string {
  const colors: Record<string, string> = {
    anxiety: 'text-amber-400',
    sadness: 'text-blue-400',
    anger: 'text-red-400',
    confusion: 'text-purple-400',
    peace: 'text-emerald-400',
    hope: 'text-yellow-300',
    love: 'text-pink-400',
  }
  return emotion ? colors[emotion] || 'text-white/50' : 'text-white/50'
}

function getEmotionIcon(emotion?: string): string {
  const icons: Record<string, string> = {
    anxiety: 'M12 9v2m0 4h.01',
    sadness: 'M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    anger: 'M13 10V3L4 14h7v7l9-11h-7z',
    confusion: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    peace: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
    hope: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    love: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z',
  }
  return emotion ? icons[emotion] || '' : ''
}

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
  const [wakeWordEnabled, setWakeWordEnabled] = useState(false)
  const [greeting, setGreeting] = useState<string | null>(null)
  const [emotionalTrend, setEmotionalTrend] = useState<string | null>(null)
  const [currentEmotion, setCurrentEmotion] = useState<string | undefined>(undefined)

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const processingRef = useRef(false)
  const conversationModeRef = useRef(conversationMode)
  const isMountedRef = useRef(true)

  // Keep ref in sync with state
  useEffect(() => {
    conversationModeRef.current = conversationMode
  }, [conversationMode])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
      divineVoiceService.stop()
    }
  }, [])

  // Load personalized greeting and emotional context on mount
  useEffect(() => {
    let cancelled = false
    async function loadContext() {
      try {
        const [greetingText, emotionSummary] = await Promise.all([
          getPersonalizedKiaanGreeting(),
          getEmotionalSummary(),
        ])
        if (cancelled) return
        setGreeting(greetingText)
        if (emotionSummary.trend !== 'unknown') {
          setEmotionalTrend(emotionSummary.trend)
        }
      } catch {
        // Silent fail - greeting defaults to generic
      }
    }
    loadContext()
    return () => { cancelled = true }
  }, [])

  // ─── Wake Word Detection ──────────────────────────────────────────

  const wakeWord = useWakeWord({
    enabled: wakeWordEnabled,
    sensitivity: 'high',
    onWakeWordDetected: (event) => {
      if (!isMountedRef.current) return
      // Wake word detected - start listening for user command
      if (state === 'idle' || state === 'wake-listening') {
        setError(null)
        voiceInput.startListening()
        setState('listening')
      }
    },
    onError: (err) => {
      // Non-fatal - just log, don't disrupt main experience
      console.warn('[Wake Word] Error:', err)
    },
  })

  // Voice Input
  const voiceInput = useVoiceInput({
    language: 'en',
    onTranscript: (text, isFinal) => {
      if (isFinal && text.trim()) {
        handleUserMessage(text.trim())
      }
    },
    onError: (err) => {
      if (!isMountedRef.current) return
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
      setState(wakeWordEnabled ? 'wake-listening' : 'idle')
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
      if (isMountedRef.current) setState(wakeWordEnabled ? 'wake-listening' : 'idle')
    },
  })

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Send message to KIAAN with context memory ───────────────────

  const sendToKiaan = useCallback(async (text: string): Promise<{ response: string; verse?: Message['verse'] } | null> => {
    try {
      // Get conversation context from memory for personalized responses
      const context = await getKiaanContextForResponse()

      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000)

      // Try voice query API first, enhanced with context
      const response = await apiFetch('/api/voice/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: text,
          language: 'en',
          context: context || 'voice',
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

      // Fallback to chat API with context
      const chatController = new AbortController()
      const chatTimeoutId = setTimeout(() => chatController.abort(), 20000)

      const chatResponse = await apiFetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          language: 'en',
          context: context || 'voice',
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
      if (isMountedRef.current) setState(wakeWordEnabled ? 'wake-listening' : 'idle')
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
          setState(wakeWordEnabled ? 'wake-listening' : 'idle')
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
  }, [autoSpeak, useDivineVoice, wakeWordEnabled, voiceOutput, resumeListeningIfConversation])

  // ─── Handle user message ───────────────────────────────────────────

  const handleUserMessage = useCallback(async (text: string) => {
    if (processingRef.current) return
    processingRef.current = true

    // Detect emotion from user message
    const emotion = detectEmotion(text)
    if (emotion) setCurrentEmotion(emotion)

    // Add user message
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date(),
      emotion,
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

    // Record conversation in context memory for future personalization
    try {
      await recordKiaanConversation(text, responseText)
    } catch {
      // Non-fatal - memory recording failure shouldn't break conversation
    }

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
      setState(wakeWordEnabled ? 'wake-listening' : 'idle')
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
    if (newMode && (state === 'idle' || state === 'wake-listening')) {
      voiceInput.startListening()
      setState('listening')
    } else if (!newMode && voiceInput.isListening) {
      voiceInput.stopListening()
      setState(wakeWordEnabled ? 'wake-listening' : 'idle')
    }
  }

  // ─── Wake word toggle ─────────────────────────────────────────────

  const toggleWakeWord = () => {
    const newEnabled = !wakeWordEnabled
    setWakeWordEnabled(newEnabled)
    if (newEnabled) {
      setState('wake-listening')
    } else {
      if (state === 'wake-listening') setState('idle')
    }
  }

  // ─── Stop everything ───────────────────────────────────────────────

  const stopAll = () => {
    voiceInput.stopListening()
    voiceOutput.cancel()
    divineVoiceService.stop()
    setState(wakeWordEnabled ? 'wake-listening' : 'idle')
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
    setCurrentEmotion(undefined)
  }

  // ─── Get context-aware suggestions ─────────────────────────────────

  const getSuggestions = (): string[] => {
    if (currentEmotion && currentEmotion in { anxiety: 1, sadness: 1, anger: 1 }) {
      return PROMPT_SUGGESTIONS.anxious
    }
    const profile = contextMemory.getProfile()
    if (profile && profile.totalConversations > 3) {
      return PROMPT_SUGGESTIONS.returning
    }
    return PROMPT_SUGGESTIONS.default
  }

  // ─── State indicator ──────────────────────────────────────────────

  const stateLabel: Record<CompanionState, string> = {
    idle: 'Tap the mic to start',
    'wake-listening': 'Say "Hey KIAAN" to begin...',
    listening: 'Listening...',
    processing: 'KIAAN is reflecting...',
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
            <h1 className="text-lg font-semibold text-white flex items-center gap-2">
              Voice Companion
              {/* Wake Word indicator */}
              {wakeWordEnabled && (
                <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full ${
                  state === 'wake-listening'
                    ? 'bg-emerald-500/20 text-emerald-400 animate-pulse'
                    : wakeWord.isActive
                    ? 'bg-emerald-500/10 text-emerald-400/60'
                    : 'bg-white/5 text-white/30'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  Hey KIAAN
                </span>
              )}
            </h1>
            <p className="text-xs text-white/50">
              {wakeWordEnabled ? 'Hands-free divine companion' : 'Speak with KIAAN'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Wake Word Toggle */}
          <button
            onClick={toggleWakeWord}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              wakeWordEnabled
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-white/5 text-white/60 border border-white/10 hover:bg-white/10'
            }`}
            title="Enable 'Hey KIAAN' wake word for hands-free activation"
          >
            {wakeWordEnabled ? 'Wake ON' : 'Wake Word'}
          </button>

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
            {conversationMode ? 'Conv ON' : 'Conv'}
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
          <div className="flex items-center justify-between">
            <span className="text-sm text-white/70">&quot;Hey KIAAN&quot; wake word</span>
            <button
              onClick={toggleWakeWord}
              className={`w-10 h-6 rounded-full transition-colors ${wakeWordEnabled ? 'bg-emerald-500' : 'bg-white/20'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform mx-1 ${wakeWordEnabled ? 'translate-x-4' : ''}`} />
            </button>
          </div>
          {/* Emotional Trend Indicator */}
          {emotionalTrend && (
            <div className="flex items-center justify-between pt-2 border-t border-white/5">
              <span className="text-sm text-white/50">Emotional trend</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                emotionalTrend === 'improving' ? 'bg-emerald-500/20 text-emerald-400' :
                emotionalTrend === 'concerning' ? 'bg-amber-500/20 text-amber-400' :
                'bg-white/10 text-white/50'
              }`}>
                {emotionalTrend === 'improving' ? 'Improving' :
                 emotionalTrend === 'concerning' ? 'Needs attention' : 'Stable'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 scrollbar-thin scrollbar-thumb-white/10">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            {/* Avatar with wake word pulse */}
            <div className={`relative w-20 h-20 rounded-full bg-gradient-to-br from-mv-sunrise/20 to-mv-ocean/20 flex items-center justify-center ${
              state === 'wake-listening' ? 'ring-2 ring-emerald-500/30 ring-offset-2 ring-offset-transparent' : ''
            }`}>
              {state === 'wake-listening' && (
                <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
              )}
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={
                state === 'wake-listening' ? 'text-emerald-400' : 'text-mv-sunrise'
              }>
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="19" x2="12" y2="23" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="8" y1="23" x2="16" y2="23" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>

            {/* Personalized greeting */}
            <div>
              <p className="text-white/80 font-medium">
                {greeting || 'Namaste'}
              </p>
              <p className="text-white/40 text-sm mt-1">
                {wakeWordEnabled
                  ? <>Say <span className="text-emerald-400 font-medium">&quot;Hey KIAAN&quot;</span> or tap the mic to begin.</>
                  : 'Tap the microphone or type to begin.'
                }
                <br />
                KIAAN remembers your journey and grows with you.
              </p>
            </div>

            {/* Context-aware quick prompts */}
            <div className="flex flex-wrap gap-2 justify-center mt-2">
              {getSuggestions().map((prompt) => (
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
              {/* Role label with emotion */}
              <div className={`flex items-center gap-1.5 text-[10px] font-medium mb-1 ${
                msg.role === 'user' ? 'text-mv-sunrise/70' : 'text-mv-ocean/70'
              }`}>
                {msg.role === 'user' ? 'You' : 'KIAAN'}
                {msg.emotion && (
                  <span className={`flex items-center gap-0.5 ${getEmotionColor(msg.emotion)}`}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d={getEmotionIcon(msg.emotion)} />
                    </svg>
                    {msg.emotion}
                  </span>
                )}
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
            onClick={() => { setError(null); setState(wakeWordEnabled ? 'wake-listening' : 'idle') }}
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
            state === 'wake-listening' ? 'text-emerald-400' :
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
                : state === 'wake-listening'
                ? 'bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500/30'
                : state === 'speaking' || state === 'processing'
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/30'
                : 'bg-white/10 text-white/60 hover:bg-white/15 hover:text-white border-2 border-white/10'
            }`}
            aria-label={
              state === 'listening' ? 'Stop listening' :
              state === 'wake-listening' ? 'Start listening' :
              state === 'speaking' || state === 'processing' ? 'Stop' :
              'Start listening'
            }
          >
            {/* Pulse ring when listening */}
            {state === 'listening' && (
              <div className="absolute inset-0 rounded-full bg-mv-sunrise/20 animate-ping" />
            )}
            {/* Subtle pulse for wake-listening */}
            {state === 'wake-listening' && (
              <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-pulse" />
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
