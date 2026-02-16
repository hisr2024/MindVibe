'use client'

/**
 * KIAAN Voice Companion - Divine Friend with Voice Output
 *
 * A voice-first, orb-centered continuous conversation experience where
 * KIAAN acts as the user's Divine Friend. Every response is automatically
 * spoken aloud. Combines the warmth of the Companion, the wisdom of
 * Viyoga Ardha, and the depth of Relationship Compass.
 *
 * Design principles:
 * - Voice output is PRIMARY - auto-plays every response
 * - Orb is the soul of the interface - alive, breathing, mood-reactive
 * - Continuous conversation with cross-session memory
 * - Dark immersive background with mood-reactive ambient glow
 * - Glass-morphism cards for messages
 * - KIAAN remembers you across sessions (Divine Friend)
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { SubscriptionGate } from '@/components/subscription'
import CompanionChatBubble from '@/components/companion/CompanionChatBubble'
import CompanionMoodRing from '@/components/companion/CompanionMoodRing'
import CompanionVoiceRecorder from '@/components/companion/CompanionVoiceRecorder'
import CompanionSuggestions from '@/components/companion/CompanionSuggestions'
import CompanionVoicePlayer from '@/components/companion/CompanionVoicePlayer'
import CompanionBreathingExercise from '@/components/companion/CompanionBreathingExercise'
import VoiceCompanionSelector from '@/components/voice/VoiceCompanionSelector'
import type { VoiceCompanionConfig } from '@/components/voice/VoiceCompanionSelector'
import { apiFetch } from '@/lib/api'
import { KiaanFriendEngine } from '@/lib/kiaan-friend-engine'
import { useGlobalWakeWord } from '@/contexts/WakeWordContext'
import { stopAllAudio } from '@/utils/audio/universalAudioStop'
import type { CompanionVoiceRecorderHandle } from '@/components/companion/CompanionVoiceRecorder'

// ─── Voice Config Type (extends VoiceCompanionConfig for page state) ──
interface VoiceConfig {
  language: string
  speakerId: string
  voiceId: string
  emotion: string
  speed: number
  pitch: number
  autoPlay: boolean
}

// ─── Mood Emoji + Label Map ─────────────────────────────────────────
const MOOD_DISPLAY: Record<string, { emoji: string; label: string; color: string }> = {
  happy: { emoji: '\uD83D\uDE0A', label: 'Happy', color: 'text-amber-400' },
  sad: { emoji: '\uD83D\uDE22', label: 'Sad', color: 'text-blue-400' },
  anxious: { emoji: '\uD83D\uDE30', label: 'Anxious', color: 'text-purple-400' },
  angry: { emoji: '\uD83D\uDE24', label: 'Angry', color: 'text-red-400' },
  confused: { emoji: '\uD83E\uDD14', label: 'Confused', color: 'text-orange-400' },
  peaceful: { emoji: '\uD83E\uDDD8', label: 'Peaceful', color: 'text-emerald-400' },
  hopeful: { emoji: '\u2728', label: 'Hopeful', color: 'text-yellow-400' },
  lonely: { emoji: '\uD83D\uDC99', label: 'Lonely', color: 'text-indigo-400' },
  grateful: { emoji: '\uD83D\uDE4F', label: 'Grateful', color: 'text-green-400' },
  neutral: { emoji: '\uD83D\uDE0C', label: 'Calm', color: 'text-violet-400' },
  excited: { emoji: '\uD83C\uDF89', label: 'Excited', color: 'text-pink-400' },
  overwhelmed: { emoji: '\uD83C\uDF0A', label: 'Overwhelmed', color: 'text-slate-400' },
  hurt: { emoji: '\uD83D\uDC94', label: 'Hurt', color: 'text-rose-400' },
  jealous: { emoji: '\uD83D\uDE15', label: 'Jealous', color: 'text-lime-400' },
  guilty: { emoji: '\uD83D\uDE14', label: 'Guilty', color: 'text-stone-400' },
  fearful: { emoji: '\uD83D\uDE28', label: 'Fearful', color: 'text-cyan-400' },
  frustrated: { emoji: '\uD83D\uDE23', label: 'Frustrated', color: 'text-orange-500' },
  stressed: { emoji: '\uD83E\uDD2F', label: 'Stressed', color: 'text-red-300' },
}

// ─── Types ──────────────────────────────────────────────────────────────
interface Message {
  id: string
  role: 'user' | 'companion'
  content: string
  mood?: string | null
  phase?: string | null
  timestamp: Date
  aiTier?: string
}

interface SessionState {
  sessionId: string | null
  phase: string
  friendshipLevel: string
  userName: string | null
  isActive: boolean
}

// ─── Mood Ambient Glow Colors ────────────────────────────────────────
const MOOD_GLOW: Record<string, string> = {
  happy: 'rgba(245,158,11,0.15)',
  sad: 'rgba(59,130,246,0.15)',
  anxious: 'rgba(168,85,247,0.15)',
  angry: 'rgba(239,68,68,0.15)',
  confused: 'rgba(249,115,22,0.15)',
  peaceful: 'rgba(16,185,129,0.15)',
  hopeful: 'rgba(234,179,8,0.15)',
  lonely: 'rgba(99,102,241,0.15)',
  grateful: 'rgba(34,197,94,0.15)',
  neutral: 'rgba(168,130,255,0.15)',
  excited: 'rgba(236,72,153,0.15)',
  overwhelmed: 'rgba(100,116,139,0.15)',
}

// ─── Divine Friend Suggestions ──────────────────────────────────────
const DIVINE_SUGGESTIONS: Record<string, string[]> = {
  first_time: [
    "I need a friend to talk to right now",
    "Something is weighing on my heart",
    "I want to understand myself better",
    "Help me find peace with a situation",
    "Share some wisdom with me",
  ],
  connect: [
    "I want to talk about something deep",
    "Can you just be here with me?",
    "I need guidance about a relationship",
    "Something happened and I need perspective",
  ],
  listen: [
    "There's more I want to share...",
    "That resonates with me deeply",
    "I haven't told anyone this before",
    "Help me see this differently",
  ],
  understand: [
    "Yes, you truly understand",
    "Let me explain what I really mean",
    "That's part of it, but there's more",
    "How do I move forward from here?",
  ],
  guide: [
    "That wisdom really speaks to me",
    "I never thought of it that way",
    "What if I can't let go?",
    "Tell me more about that perspective",
    "I want to try a different approach",
  ],
  empower: [
    "I feel lighter after talking to you",
    "You're right, I carry more strength than I think",
    "I needed to hear that, thank you",
    "What should I focus on next?",
    "I'm grateful for this conversation",
  ],
}

// ─── Component ──────────────────────────────────────────────────────────

export default function KiaanVoiceCompanionPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentMood, setCurrentMood] = useState('neutral')
  const [session, setSession] = useState<SessionState>({
    sessionId: null,
    phase: 'connect',
    friendshipLevel: 'new',
    userName: null,
    isActive: false,
  })
  const [isInitializing, setIsInitializing] = useState(true)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)
  const [aiStatus, setAiStatus] = useState<'unknown' | 'connected' | 'offline'>('unknown')
  const [wisdomCorpusCount, setWisdomCorpusCount] = useState(0)
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    language: 'en',
    speakerId: 'en_sarvam-aura',
    voiceId: 'sarvam-aura',
    emotion: 'neutral',
    speed: 0.95,
    pitch: 0.0,
    autoPlay: true, // Voice auto-play ON by default for Voice Companion
  })

  // Bridge between VoiceCompanionConfig and page-level VoiceConfig
  const handleVoiceCompanionConfigChange = useCallback((cfg: VoiceCompanionConfig) => {
    setVoiceConfig(prev => ({
      ...prev,
      language: cfg.language,
      voiceId: cfg.voiceId,
      speakerId: `${cfg.language}_${cfg.voiceId}`,
      emotion: cfg.emotion,
      speed: cfg.speed,
      pitch: cfg.pitch,
      autoPlay: cfg.autoPlay,
    }))
  }, [])

  const [isRecordingFromWake, setIsRecordingFromWake] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const friendEngineRef = useRef(new KiaanFriendEngine())
  const voiceRecorderRef = useRef<CompanionVoiceRecorderHandle>(null)

  // ─── Global Wake Word Integration ──────────────────────────────────
  // Uses the app-wide wake word context. When on this page, wake word
  // detections trigger voice recording directly instead of the overlay.
  const {
    enabled: wakeWordEnabled,
    isListening: wakeWordActive,
    isSupported: wakeWordSupported,
    isActivated: wakeWordJustActivated,
    setEnabled: setWakeWordEnabled,
    pause: pauseGlobalWakeWord,
    resume: resumeGlobalWakeWord,
    dismissActivation,
  } = useGlobalWakeWord()

  // When wake word fires while on this page, intercept the overlay
  // and instead trigger the in-page voice recorder directly.
  useEffect(() => {
    if (!wakeWordJustActivated || !session.isActive) return

    // Dismiss the global overlay since we handle it locally on this page
    dismissActivation()

    // Stop any playing audio first
    stopAllAudio()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    setIsRecordingFromWake(true)

    // Trigger voice recorder after a short delay for mic release
    setTimeout(() => {
      voiceRecorderRef.current?.triggerRecord()
    }, 300)
  }, [wakeWordJustActivated, session.isActive, dismissActivation])

  // Pause global wake word when speaking or loading on this page
  useEffect(() => {
    if (isSpeaking || isLoading || isRecordingFromWake) {
      pauseGlobalWakeWord()
    } else {
      resumeGlobalWakeWord()
    }
  }, [isSpeaking, isLoading, isRecordingFromWake, pauseGlobalWakeWord, resumeGlobalWakeWord])

  // ─── Global Stop Handler ──────────────────────────────────────────
  // Immediately stops all audio playback (premium TTS + browser SpeechSynthesis)
  const handleStopAll = useCallback(() => {
    stopAllAudio()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [])

  // ─── Session Management ─────────────────────────────────────────────

  const startSession = useCallback(async () => {
    try {
      setError(null)
      const response = await apiFetch('/api/voice-companion/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: voiceConfig.language,
          voice_id: voiceConfig.voiceId || voiceConfig.speakerId.split('_').pop() || 'sarvam-aura',
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setSession({
          sessionId: data.session_id,
          phase: data.phase,
          friendshipLevel: data.friendship_level,
          userName: data.user_name,
          isActive: true,
        })

        setMessages([
          {
            id: `greeting-${Date.now()}`,
            role: 'companion',
            content: data.greeting,
            mood: 'neutral',
            phase: 'connect',
            timestamp: new Date(),
          },
        ])
        setShowSuggestions(true)
      } else {
        createLocalSession()
      }
    } catch {
      createLocalSession()
    } finally {
      setIsInitializing(false)
    }
  }, [voiceConfig.language, voiceConfig.speakerId, voiceConfig.voiceId])

  const createLocalSession = useCallback(() => {
    const localId = `local_${Date.now()}`
    setSession({
      sessionId: localId,
      phase: 'connect',
      friendshipLevel: 'new',
      userName: null,
      isActive: true,
    })

    const hour = new Date().getHours()
    let greeting: string
    if (hour >= 5 && hour < 12) {
      greeting = "Good morning, friend. It's a new day and I'm genuinely glad you're here. What's stirring in your heart this morning?"
    } else if (hour >= 12 && hour < 17) {
      greeting = "Hey there, friend. The day is unfolding and I'm here if you want to pause and talk. How are you really doing?"
    } else if (hour >= 17 && hour < 21) {
      greeting = "Good evening, friend. Before the day ends, I want to check in with you. How are you holding up?"
    } else {
      greeting = "Hey, night owl. The world is quiet and it's just us. What's keeping you up tonight?"
    }

    setMessages([
      {
        id: `greeting-${Date.now()}`,
        role: 'companion',
        content: greeting,
        mood: 'neutral',
        phase: 'connect',
        timestamp: new Date(),
      },
    ])
    setShowSuggestions(true)
    setIsInitializing(false)
  }, [])

  useEffect(() => {
    startSession()
  }, [startSession])

  // ─── Check AI backend health on mount ─────────────────────────────
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await apiFetch('/api/voice-companion/health')
        if (res.ok) {
          const data = await res.json()
          const tier1 = data.ai_tiers?.tier1_openai_direct
          const tier2 = data.ai_tiers?.tier2_engine_ai
          setAiStatus((tier1 || tier2) ? 'connected' : 'offline')
          if (data.wisdom_corpus) setWisdomCorpusCount(data.wisdom_corpus)
        } else {
          setAiStatus('offline')
        }
      } catch {
        setAiStatus('offline')
      }
    }
    checkHealth()
  }, [])

  // ─── Message Sending ────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isLoading || !session.sessionId) return

    // Stop any current audio when user sends a new message
    stopAllAudio()
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
    setIsRecordingFromWake(false)

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)
    setShowSuggestions(false)
    setError(null)

    try {
      const response = await apiFetch('/api/voice-companion/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.sessionId,
          message: text.trim(),
          language: voiceConfig.language,
          content_type: 'text',
          voice_id: voiceConfig.voiceId || voiceConfig.speakerId.split('_').pop() || 'sarvam-aura',
          prefer_speed: true,
          response_mode: 'auto',
          emotion_tone: voiceConfig.emotion,
        }),
      })

      if (response.ok) {
        const data = await response.json()

        const companionMessage: Message = {
          id: data.message_id || `companion-${Date.now()}`,
          role: 'companion',
          content: data.response,
          mood: data.mood,
          phase: data.phase,
          timestamp: new Date(),
          aiTier: data.ai_tier || 'unknown',
        }

        setMessages(prev => [...prev, companionMessage])
        setCurrentMood(data.mood || 'neutral')
        setSession(prev => ({ ...prev, phase: data.phase || prev.phase }))

        if (data.ai_tier === 'openai_direct' || data.ai_tier === 'engine_ai' || data.ai_tier === 'backend' || data.ai_tier === 'nextjs_openai') {
          setAiStatus('connected')
        } else if (data.ai_tier === 'template' || data.ai_tier === 'fallback' || data.ai_tier === 'local_engine') {
          setAiStatus('offline')
        }

        setShowSuggestions(true)
        setIsLoading(false)
        return
      }

      addLocalFallbackResponse(text.trim())
    } catch {
      addLocalFallbackResponse(text.trim())
    } finally {
      setIsLoading(false)
      setShowSuggestions(true)
    }
  }, [isLoading, session.sessionId, voiceConfig.language, voiceConfig.speakerId, voiceConfig.voiceId, voiceConfig.emotion])

  const addLocalFallbackResponse = useCallback((userText: string) => {
    const result = friendEngineRef.current.processMessage(userText)

    setCurrentMood(result.mood)
    setSession(prev => ({ ...prev, phase: result.phase }))
    setMessages(prev => [
      ...prev,
      {
        id: `companion-${Date.now()}`,
        role: 'companion',
        content: result.response,
        mood: result.mood,
        phase: result.phase,
        timestamp: new Date(),
      },
    ])
  }, [])

  // ─── End Session ────────────────────────────────────────────────────

  const endSession = useCallback(async () => {
    if (!session.sessionId || session.sessionId.startsWith('local_')) {
      setSession(prev => ({ ...prev, isActive: false }))
      return
    }

    try {
      const response = await apiFetch('/api/voice-companion/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.sessionId }),
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(prev => [
          ...prev,
          {
            id: `farewell-${Date.now()}`,
            role: 'companion',
            content: data.farewell,
            mood: 'peaceful',
            phase: 'empower',
            timestamp: new Date(),
          },
        ])
      }
    } catch {
      // Silent fail
    }

    setSession(prev => ({ ...prev, isActive: false }))
  }, [session.sessionId])

  // ─── Voice Input ────────────────────────────────────────────────────

  const handleVoiceTranscription = useCallback((text: string) => {
    sendMessage(text)
  }, [sendMessage])

  // ─── Keyboard Handling ──────────────────────────────────────────────

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(inputText)
    }
  }, [inputText, sendMessage])

  // ─── Auto-scroll ────────────────────────────────────────────────────

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ─── Auto-resize textarea ──────────────────────────────────────────

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto'
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`
    }
  }, [inputText])

  // ─── Handle suggestion selection ───────────────────────────────────

  const handleSuggestion = useCallback((suggestion: string) => {
    sendMessage(suggestion)
  }, [sendMessage])

  // ─── Voice state handlers ─────────────────────────────────────────

  const handleVoiceStart = useCallback(() => setIsSpeaking(true), [])
  const handleVoiceEnd = useCallback(() => setIsSpeaking(false), [])
  const handleVoiceStop = useCallback(() => {
    setIsSpeaking(false)
  }, [])

  // ─── Mood glow color ──────────────────────────────────────────────

  const ambientGlow = MOOD_GLOW[currentMood] || MOOD_GLOW.neutral

  // ─── Divine Friend suggestions based on phase ─────────────────────

  const getSuggestions = useCallback(() => {
    if (messages.length <= 1) return DIVINE_SUGGESTIONS.first_time
    const phaseSuggestions = DIVINE_SUGGESTIONS[session.phase] || DIVINE_SUGGESTIONS.connect
    return phaseSuggestions.slice(0, 4)
  }, [messages.length, session.phase])

  // ─── Render: Initializing ─────────────────────────────────────────

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #060610 0%, #0d0520 50%, #060610 100%)' }}>
        <div className="text-center">
          <CompanionMoodRing mood="neutral" size="xl" />
          <p className="mt-8 text-white/40 text-sm animate-pulse">KIAAN is preparing your space...</p>
          <p className="mt-2 text-white/20 text-xs">Your Divine Friend awaits</p>
        </div>
      </div>
    )
  }

  // ─── Render: Main Voice Companion UI ──────────────────────────────

  return (
    <SubscriptionGate feature="voice_companion">
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #060610 0%, #0d0520 50%, #060610 100%)' }}
    >
      {/* Ambient mood glow */}
      <div
        className="absolute pointer-events-none transition-all duration-[3000ms]"
        style={{
          top: '8%',
          left: '50%',
          width: '700px',
          height: '700px',
          transform: 'translateX(-50%)',
          background: `radial-gradient(circle, ${ambientGlow} 0%, transparent 70%)`,
        }}
      />

      {/* Subtle star-field texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle at 15% 25%, white 1px, transparent 1px), radial-gradient(circle at 85% 75%, white 1px, transparent 1px), radial-gradient(circle at 50% 50%, white 0.5px, transparent 0.5px), radial-gradient(circle at 25% 85%, white 0.5px, transparent 0.5px), radial-gradient(circle at 75% 15%, white 1px, transparent 1px)',
          backgroundSize: '200px 200px, 300px 300px, 150px 150px, 250px 250px, 350px 350px',
        }}
      />

      {/* Secondary glow for depth */}
      <div
        className="absolute pointer-events-none transition-all duration-[4000ms]"
        style={{
          bottom: '20%',
          left: '50%',
          width: '500px',
          height: '300px',
          transform: 'translateX(-50%)',
          background: `radial-gradient(ellipse, ${ambientGlow} 0%, transparent 80%)`,
          opacity: 0.4,
        }}
      />

      {/* ─── Header ─── */}
      <header className="relative z-10 flex items-center justify-between px-4 py-3 pt-safe-top">
        <Link href="/dashboard" className="p-2 rounded-full text-white/40 hover:text-white/70 hover:bg-white/5 transition-all">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>

        <div className="flex items-center gap-2">
          {/* AI + Voice status */}
          <span
            className={`text-[10px] px-2 py-1 rounded-full border flex items-center gap-1 ${
              aiStatus === 'connected'
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                : aiStatus === 'offline'
                ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                : 'border-white/10 text-white/40 bg-white/5'
            }`}
            title={aiStatus === 'connected' ? 'AI-powered Divine Friend active' : 'Using offline wisdom'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              aiStatus === 'connected' ? 'bg-emerald-400' : aiStatus === 'offline' ? 'bg-amber-400' : 'bg-white/40'
            }`} />
            {aiStatus === 'connected'
              ? `Voice${wisdomCorpusCount ? ` \u00B7 ${wisdomCorpusCount}` : ''}`
              : aiStatus === 'offline' ? 'Offline' : '...'}
          </span>

          {/* Divine Friend badge */}
          <span className="text-[10px] px-2.5 py-1 rounded-full border border-amber-500/20 text-amber-300/70 bg-amber-500/5">
            {session.friendshipLevel === 'deep' ? 'Soul Friend' :
             session.friendshipLevel === 'close' ? 'Dear Friend' :
             session.friendshipLevel === 'familiar' ? 'Growing Bond' :
             'Divine Friend'}
          </span>

          {/* Voice & Language Settings */}
          <button
            onClick={() => setShowVoiceSettings(v => !v)}
            className={`p-2 rounded-full transition-all ${
              showVoiceSettings
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
            }`}
            title="Voice, Language & Speaker Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </button>

          {/* Wake word toggle ("Hey KIAAN") */}
          {wakeWordSupported && (
            <button
              onClick={() => setWakeWordEnabled(!wakeWordEnabled)}
              className={`p-2 rounded-full transition-all ${
                wakeWordEnabled
                  ? wakeWordActive
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-emerald-500/10 text-emerald-400/60'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/5'
              }`}
              title={wakeWordEnabled ? '"Hey KIAAN" wake word ON - say "Hey KIAAN" to start talking' : '"Hey KIAAN" wake word OFF'}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M19 10v2a7 7 0 01-14 0v-2" />
                {wakeWordEnabled && (
                  <>
                    <line x1="12" y1="19" x2="12" y2="23" />
                    <line x1="8" y1="23" x2="16" y2="23" />
                  </>
                )}
              </svg>
            </button>
          )}

          {/* Voice auto-play toggle */}
          <button
            onClick={() => setVoiceConfig(prev => ({ ...prev, autoPlay: !prev.autoPlay }))}
            className={`p-2 rounded-full transition-all ${
              voiceConfig.autoPlay
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
            }`}
            title={voiceConfig.autoPlay ? 'Voice auto-play ON (recommended)' : 'Voice auto-play OFF'}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {voiceConfig.autoPlay ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
              )}
            </svg>
          </button>

          {/* Breathing exercise */}
          <button
            onClick={() => setShowBreathing(v => !v)}
            className={`p-2 rounded-full transition-all ${
              showBreathing
                ? 'bg-sky-500/20 text-sky-400'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
            }`}
            title="Guided breathing"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>

          {session.isActive && (
            <button
              onClick={endSession}
              className="text-[10px] text-white/30 hover:text-white/60 px-2.5 py-1 rounded-full border border-white/10 hover:bg-white/5 transition-all"
              title="End conversation"
            >
              End
            </button>
          )}
        </div>
      </header>

      {/* ─── Voice & Language Settings Panel (ElevenLabs-Inspired) ─── */}
      {showVoiceSettings && (
        <div className="relative z-20 max-w-xl mx-auto w-full px-4 pt-3">
          <VoiceCompanionSelector
            currentConfig={{
              language: voiceConfig.language as any,
              voiceId: voiceConfig.voiceId || voiceConfig.speakerId.split('_').pop() || 'sarvam-aura',
              emotion: voiceConfig.emotion,
              speed: voiceConfig.speed,
              pitch: voiceConfig.pitch,
              autoPlay: voiceConfig.autoPlay,
            }}
            onConfigChange={handleVoiceCompanionConfigChange}
            onClose={() => setShowVoiceSettings(false)}
          />
        </div>
      )}

      {/* ─── Scrollable Content ─── */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {/* ─── In-Chat Breathing Exercise ─── */}
        {showBreathing && (
          <div className="max-w-sm mx-auto px-4 pt-4 pb-2">
            <CompanionBreathingExercise
              cycles={3}
              mood={currentMood}
              onComplete={() => {
                setShowBreathing(false)
                if (session.isActive) {
                  sendMessage('I just did the breathing exercise')
                }
              }}
            />
          </div>
        )}

        {/* ─── Orb Section ─── */}
        <div className="flex flex-col items-center pt-6 pb-4">
          <CompanionMoodRing
            mood={currentMood}
            size="xl"
            isSpeaking={isSpeaking}
            isListening={isLoading}
            intensity={isLoading ? 0.8 : isSpeaking ? 0.9 : 0.5}
          />

          <h2 className="mt-6 text-lg font-semibold text-white/90 tracking-wide">KIAAN</h2>
          <p className="text-xs text-amber-300/50 mt-0.5 tracking-wider">
            {isLoading ? 'Reflecting with wisdom...' : isSpeaking ? 'Speaking to you...' : wakeWordEnabled && wakeWordActive ? 'Listening for "Hey KIAAN"...' : session.isActive ? 'Your Divine Friend' : 'Session ended'}
          </p>

          {/* ── Floating Stop Button ── */}
          {isSpeaking && (
            <button
              onClick={handleStopAll}
              className="mt-4 px-6 py-2.5 rounded-full text-sm font-medium text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
              style={{
                background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                boxShadow: '0 0 25px rgba(239,68,68,0.4), 0 0 50px rgba(239,68,68,0.15)',
                animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
              }}
              aria-label="Stop KIAAN from speaking"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
              Stop Listening
            </button>
          )}

          {/* ── Mood + Voice + Wake Indicator ── */}
          <div className="flex items-center gap-2 mt-2 flex-wrap justify-center">
            {currentMood && currentMood !== 'neutral' && MOOD_DISPLAY[currentMood] && (
              <span className={`text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 ${MOOD_DISPLAY[currentMood].color}`}>
                <span>{MOOD_DISPLAY[currentMood].emoji}</span>
                <span>{MOOD_DISPLAY[currentMood].label}</span>
              </span>
            )}
            {voiceConfig.autoPlay && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 border border-amber-400/20 text-amber-300/70">
                Voice ON
              </span>
            )}
            {wakeWordEnabled && (
              <span className={`text-[10px] px-2 py-1 rounded-full border flex items-center gap-1 ${
                wakeWordActive
                  ? 'bg-emerald-500/10 border-emerald-400/20 text-emerald-300/70'
                  : 'bg-white/5 border-white/10 text-white/30'
              }`}>
                <span className={`w-1 h-1 rounded-full ${wakeWordActive ? 'bg-emerald-400 animate-pulse' : 'bg-white/30'}`} />
                Hey KIAAN
              </span>
            )}
            {voiceConfig.language !== 'en' && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 border border-purple-400/20 text-purple-300">
                {voiceConfig.language.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* ─── Messages ─── */}
        <div className="max-w-xl mx-auto px-4 pb-4">
          {messages.map((msg, i) => (
            <div key={msg.id}>
              <CompanionChatBubble
                id={msg.id}
                role={msg.role}
                content={msg.content}
                mood={msg.mood}
                phase={msg.phase}
                timestamp={msg.timestamp}
                isLatest={i === messages.length - 1}
              />
              {msg.role === 'companion' && (
                <div className="ml-9 mb-3 -mt-1 flex items-center gap-2">
                  <CompanionVoicePlayer
                    text={msg.content}
                    mood={msg.mood || currentMood}
                    voiceId={voiceConfig.voiceId || voiceConfig.speakerId.split('_').pop() || 'sarvam-aura'}
                    language={voiceConfig.language}
                    compact
                    autoPlay={voiceConfig.autoPlay && i === messages.length - 1}
                    onStart={handleVoiceStart}
                    onEnd={handleVoiceEnd}
                    onStop={handleVoiceStop}
                  />
                  {msg.mood && msg.mood !== 'neutral' && MOOD_DISPLAY[msg.mood] && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 ${MOOD_DISPLAY[msg.mood].color}`}>
                      {MOOD_DISPLAY[msg.mood].emoji} {MOOD_DISPLAY[msg.mood].label}
                    </span>
                  )}
                  {msg.aiTier && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                      msg.aiTier === 'openai_direct' ? 'bg-emerald-500/10 text-emerald-400/60 border border-emerald-500/20' :
                      msg.aiTier === 'engine_ai' ? 'bg-sky-500/10 text-sky-400/60 border border-sky-500/20' :
                      'bg-white/5 text-white/30 border border-white/10'
                    }`}>
                      {msg.aiTier === 'openai_direct' ? 'AI' :
                       msg.aiTier === 'engine_ai' ? 'AI' :
                       msg.aiTier === 'template' ? 'Offline' : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="flex items-center gap-2 mb-3">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(245,158,11,0.6), rgba(168,130,255,0.4))',
                  boxShadow: '0 0 12px rgba(245,158,11,0.3)',
                }}
              >
                <span className="text-white text-[10px] font-bold">K</span>
              </div>
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-amber-300/50"
                      style={{
                        animation: `divine-typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
              <span className="text-[10px] text-amber-300/30">Reflecting with wisdom...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ─── Suggestions ─── */}
      {showSuggestions && session.isActive && !isLoading && (
        <div className="relative z-10 max-w-xl mx-auto w-full px-4 pb-2">
          <div className="flex flex-wrap gap-2 px-2">
            {getSuggestions().map((suggestion, i) => (
              <button
                key={i}
                onClick={() => handleSuggestion(suggestion)}
                className="text-xs px-3.5 py-2 rounded-full border border-amber-500/15 text-amber-200/60 bg-amber-500/5 hover:bg-amber-500/10 hover:text-amber-200/90 hover:border-amber-400/30 backdrop-blur-sm transition-all duration-200 whitespace-nowrap"
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ─── Input Area ─── */}
      {session.isActive ? (
        <footer className="relative z-10 border-t border-amber-500/5" style={{ background: 'rgba(6,6,16,0.85)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-xl mx-auto px-4 py-3 pb-safe-bottom">
            {error && (
              <p className="text-xs text-red-400/80 mb-2">{error}</p>
            )}
            <div className="flex items-end gap-2">
              {/* Voice recorder */}
              <div className="dark">
                <CompanionVoiceRecorder
                  ref={voiceRecorderRef}
                  onTranscription={handleVoiceTranscription}
                  isDisabled={!session.isActive}
                  isProcessing={isLoading}
                  language={voiceConfig.language}
                />
              </div>

              {/* Text input */}
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Talk to KIAAN, your Divine Friend..."
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-amber-500/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/25 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500/30 transition-all duration-200"
                  style={{ backdropFilter: 'blur(12px)' }}
                  disabled={isLoading}
                />
              </div>

              {/* Send button */}
              <button
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isLoading}
                className={`p-2.5 rounded-full transition-all duration-200 ${
                  inputText.trim() && !isLoading
                    ? 'text-white shadow-lg hover:scale-105'
                    : 'bg-white/5 text-white/20 cursor-not-allowed'
                }`}
                style={
                  inputText.trim() && !isLoading
                    ? {
                        background: 'linear-gradient(135deg, #f59e0b, #a855f7)',
                        boxShadow: '0 0 20px rgba(245,158,11,0.3)',
                      }
                    : undefined
                }
                aria-label="Send message"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>

            <p className="text-[10px] text-white/15 text-center mt-2">
              KIAAN is your Divine Friend, not a therapist. If you&apos;re in crisis, please call your local emergency line.
            </p>
          </div>
        </footer>
      ) : (
        <footer className="relative z-10 border-t border-amber-500/5 p-4" style={{ background: 'rgba(6,6,16,0.85)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-xl mx-auto text-center pb-safe-bottom">
            <p className="text-sm text-white/40 mb-3">This conversation has ended.</p>
            <button
              onClick={startSession}
              className="px-6 py-2.5 rounded-full text-sm font-medium text-white transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #a855f7)',
                boxShadow: '0 0 25px rgba(245,158,11,0.25)',
              }}
            >
              Begin New Conversation
            </button>
          </div>
        </footer>
      )}

      {/* Animation styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes divine-typing-dot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      ` }} />
    </div>
    </SubscriptionGate>
  )
}
