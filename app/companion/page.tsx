'use client'

/**
 * KIAAN Companion - Orb-Based Voice Best Friend
 *
 * An immersive, orb-centered interface where KIAAN acts as the user's best friend.
 * The large animated orb is the visual centerpiece, breathing and pulsing with
 * mood-reactive colors. Messages flow below in glass-morphism cards.
 *
 * Design principles:
 * - Orb is the soul of the interface - alive, breathing, responsive
 * - Dark, immersive background with mood-reactive ambient glow
 * - Glass-morphism cards for messages and controls
 * - Voice-first but text-friendly
 * - KIAAN remembers you across sessions
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import CompanionChatBubble from '@/components/companion/CompanionChatBubble'
import CompanionMoodRing from '@/components/companion/CompanionMoodRing'
import { apiFetch } from '@/lib/api'
import { KiaanFriendEngine } from '@/lib/kiaan-friend-engine'
import { useLanguage } from '@/hooks/useLanguage'
import type { VoiceLanguage } from '@/utils/voice/voiceCatalog'

// Dynamic imports for heavy components - loaded on demand to reduce initial bundle
const CompanionVoiceRecorder = dynamic(() => import('@/components/companion/CompanionVoiceRecorder'), {
  ssr: false,
  loading: () => <div className="h-12 w-12 animate-pulse rounded-full bg-slate-800/50" />,
})
const CompanionSuggestions = dynamic(() => import('@/components/companion/CompanionSuggestions'), {
  loading: () => <div className="h-16 animate-pulse rounded-lg bg-slate-800/30" />,
})
const CompanionVoicePlayer = dynamic(() => import('@/components/companion/CompanionVoicePlayer'), {
  ssr: false,
})
const CompanionBreathingExercise = dynamic(() => import('@/components/companion/CompanionBreathingExercise'), {
  loading: () => <div className="h-48 animate-pulse rounded-xl bg-slate-800/30" />,
})
const MoodJourneyPanel = dynamic(() => import('@/components/companion/MoodJourneyPanel'), {
  loading: () => <div className="h-64 animate-pulse rounded-xl bg-slate-800/30" />,
})
const VoiceCompanionSelector = dynamic(() => import('@/components/voice/VoiceCompanionSelector'), {
  ssr: false,
  loading: () => <div className="h-32 animate-pulse rounded-xl bg-slate-800/30" />,
})

// ─── Voice Config Type ──────────────────────────────────────────────
interface VoiceConfig {
  language: string
  speakerId: string
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

// ─── Referral Context Greetings ──────────────────────────────────────

const REFERRAL_GREETINGS: Record<string, string> = {
  'emotional-reset': "Hey friend! I see you just came from the Emotional Reset. How are you feeling now? Sometimes it helps to talk through what came up during that process. I'm all ears.",
  'ardha': "Hey! I noticed you were working with Ardha on reframing your thoughts. Want to talk about what you discovered? Sometimes saying it out loud makes it click even deeper.",
  'viyog': "Friend! You've been working on letting go with Viyoga. That takes real courage. How are you feeling about it? I'm here if you want to process what came up.",
  'relationship-compass': "Hey there. Relationship stuff is never easy, and I saw you were exploring the Relationship Compass. Want to talk about what's going on? No judgment, just your friend listening.",
  'karma-reset': "I see you've been doing some deep work with Karma Reset. That takes a lot of strength. How are you holding up? Sometimes it helps to just talk about it.",
  'karma-footprint': "Hey friend! I noticed you were reflecting on your daily actions. That kind of self-awareness is beautiful. Want to share what you're thinking about?",
  'karmic-tree': "Your growth journey is inspiring, friend! I saw you checking your Karmic Tree. Want to talk about where you are and where you want to go?",
  'sacred-reflections': "Hey! I see you've been journaling. Writing is powerful, and so is talking it through. Want to share what's on your heart today?",
  'kiaan-vibe': "I see you were vibing with some meditation music. Feeling more centered? Want to chat about anything that came up during that peaceful time?",
  'wisdom-rooms': "Hey friend! I noticed you were in the Wisdom Rooms. Community wisdom is amazing, but sometimes you need one-on-one time. I'm right here for you.",
}

// ─── Types ──────────────────────────────────────────────────────────────

interface Message {
  id: string
  role: 'user' | 'companion'
  content: string
  mood?: string | null
  phase?: string | null
  timestamp: Date
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
  happy: 'rgba(245,158,11,0.12)',
  sad: 'rgba(59,130,246,0.12)',
  anxious: 'rgba(168,85,247,0.12)',
  angry: 'rgba(239,68,68,0.12)',
  confused: 'rgba(249,115,22,0.12)',
  peaceful: 'rgba(16,185,129,0.12)',
  hopeful: 'rgba(234,179,8,0.12)',
  lonely: 'rgba(99,102,241,0.12)',
  grateful: 'rgba(34,197,94,0.12)',
  neutral: 'rgba(139,92,246,0.12)',
  excited: 'rgba(236,72,153,0.12)',
  overwhelmed: 'rgba(100,116,139,0.12)',
}

// ─── Component ──────────────────────────────────────────────────────────

export default function CompanionPage() {
  const searchParams = useSearchParams()
  const referralTool = searchParams.get('from')
  const referralMood = searchParams.get('mood')
  const { language: globalLanguage } = useLanguage()

  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentMood, setCurrentMood] = useState(referralMood || 'neutral')
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
  const [showMoodJourney, setShowMoodJourney] = useState(false)
  const [showBreathing, setShowBreathing] = useState(false)
  const [wisdomCorpusCount, setWisdomCorpusCount] = useState(0)
  const [aiStatus, setAiStatus] = useState<'unknown' | 'connected' | 'offline'>('unknown')
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    language: globalLanguage || 'en',
    speakerId: `${globalLanguage || 'en'}_sarvam-aura`,
    emotion: 'neutral',
    speed: 0.95,
    pitch: 0.0,
    autoPlay: false,
  })

  // Sync voice config language with global language preference
  useEffect(() => {
    setVoiceConfig(prev => ({
      ...prev,
      language: globalLanguage,
      speakerId: `${globalLanguage}_${prev.speakerId.split('_').slice(1).join('_') || 'sarvam-aura'}`,
    }))
  }, [globalLanguage])

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const friendEngineRef = useRef(new KiaanFriendEngine())

  // ─── Session Management ─────────────────────────────────────────────

  const startSession = useCallback(async () => {
    try {
      setError(null)
      const response = await apiFetch('/api/companion/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: voiceConfig.language,
          referral_tool: referralTool || undefined,
          referral_mood: referralMood || undefined,
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
  }, [voiceConfig.language, referralTool, referralMood])

  const createLocalSession = useCallback(() => {
    const localId = `local_${Date.now()}`
    setSession({
      sessionId: localId,
      phase: 'connect',
      friendshipLevel: 'new',
      userName: null,
      isActive: true,
    })

    let greeting: string
    if (referralTool && REFERRAL_GREETINGS[referralTool]) {
      greeting = REFERRAL_GREETINGS[referralTool]
    } else {
      const hour = new Date().getHours()
      if (hour >= 5 && hour < 12) {
        greeting = "Good morning, friend! I'm KIAAN. Think of me as that friend who's always here - no judgment, no agenda. What's on your mind today?"
      } else if (hour >= 12 && hour < 17) {
        greeting = "Hey there! I'm KIAAN, your personal friend who never gets tired of listening. How's your day going?"
      } else if (hour >= 17 && hour < 21) {
        greeting = "Good evening! I'm KIAAN. The day's winding down - perfect time for a real conversation. How are you feeling?"
      } else {
        greeting = "Hey night owl! I'm KIAAN. Can't sleep, or just need someone to talk to? Either way, I'm right here."
      }
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
  }, [referralTool])

  useEffect(() => {
    startSession()
  }, [startSession])

  // ─── Check AI backend health on mount ─────────────────────────────
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await apiFetch('/api/companion/health')
        if (res.ok) {
          const data = await res.json()
          setAiStatus(data.ai_enhanced ? 'connected' : 'offline')
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
      // Always route through Next.js API (handles local_ and real sessions)
      const response = await apiFetch('/api/companion/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: session.sessionId,
          message: text.trim(),
          language: voiceConfig.language,
          voice_id: voiceConfig.speakerId?.split('_').pop() || 'sarvam-aura',
          content_type: 'text',
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
        }

        setMessages(prev => [...prev, companionMessage])
        setCurrentMood(data.mood || 'neutral')
        setSession(prev => ({ ...prev, phase: data.phase || prev.phase }))

        // Update AI status based on response tier
        if (data.ai_tier === 'backend' || data.ai_tier === 'nextjs_openai') {
          setAiStatus('connected')
        } else if (data.ai_tier === 'local_engine') {
          setAiStatus('offline')
        }

        setShowSuggestions(true)
        setIsLoading(false)
        return
      }

      // API route returned non-OK — use local fallback
      addLocalFallbackResponse(text.trim())
    } catch {
      // Network failure — use local fallback
      addLocalFallbackResponse(text.trim())
    } finally {
      setIsLoading(false)
      setShowSuggestions(true)
    }
  }, [isLoading, session.sessionId, voiceConfig.language])

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
      const response = await apiFetch('/api/companion/session/end', {
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
      // Silent fail - not critical
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

  // ─── Mood glow color ──────────────────────────────────────────────

  const ambientGlow = MOOD_GLOW[currentMood] || MOOD_GLOW.neutral

  // ─── Render: Initializing ─────────────────────────────────────────

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(180deg, #0a0a14 0%, #12082a 50%, #0a0a14 100%)' }}>
        <div className="text-center">
          <CompanionMoodRing mood="neutral" size="xl" />
          <p className="mt-8 text-white/40 text-sm animate-pulse">KIAAN is getting ready...</p>
        </div>
      </div>
    )
  }

  // ─── Render: Main Orb UI ──────────────────────────────────────────

  return (
    <div
      className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #0a0a14 0%, #12082a 50%, #0a0a14 100%)' }}
    >
      {/* Ambient mood glow behind the orb */}
      <div
        className="absolute pointer-events-none transition-all duration-[3000ms]"
        style={{
          top: '10%',
          left: '50%',
          width: '600px',
          height: '600px',
          transform: 'translateX(-50%)',
          background: `radial-gradient(circle, ${ambientGlow} 0%, transparent 70%)`,
        }}
      />

      {/* Subtle stars/noise texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 20% 30%, white 1px, transparent 1px), radial-gradient(circle at 80% 70%, white 1px, transparent 1px), radial-gradient(circle at 50% 50%, white 0.5px, transparent 0.5px), radial-gradient(circle at 30% 80%, white 0.5px, transparent 0.5px), radial-gradient(circle at 70% 20%, white 1px, transparent 1px)',
          backgroundSize: '200px 200px, 300px 300px, 150px 150px, 250px 250px, 350px 350px',
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
          {/* AI status indicator */}
          <span
            className={`text-[10px] px-2 py-1 rounded-full border flex items-center gap-1 ${
              aiStatus === 'connected'
                ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10'
                : aiStatus === 'offline'
                ? 'border-amber-500/30 text-amber-400 bg-amber-500/10'
                : 'border-white/10 text-white/40 bg-white/5'
            }`}
            title={aiStatus === 'connected' ? 'AI-powered responses active' : 'Using offline wisdom'}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${
              aiStatus === 'connected' ? 'bg-emerald-400' : aiStatus === 'offline' ? 'bg-amber-400' : 'bg-white/40'
            }`} />
            {aiStatus === 'connected'
              ? `AI${wisdomCorpusCount ? ` \u00B7 ${wisdomCorpusCount}` : ''}`
              : aiStatus === 'offline' ? 'Offline' : '...'}
          </span>

          {/* Friendship badge */}
          <span className="text-[10px] px-2.5 py-1 rounded-full border border-white/10 text-white/50 bg-white/5">
            {session.friendshipLevel === 'deep' ? 'Best Friend' :
             session.friendshipLevel === 'close' ? 'Close Friend' :
             session.friendshipLevel === 'familiar' ? 'Friend' :
             'New Friend'}
          </span>

          {/* Voice & Language Settings */}
          <button
            onClick={() => setShowVoiceSettings(v => !v)}
            className={`p-2 rounded-full transition-all ${
              showVoiceSettings
                ? 'bg-purple-500/20 text-purple-400'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
            }`}
            title="Voice, Language & Speaker Settings"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
          </button>

          {/* Auto-play voice toggle */}
          <button
            onClick={() => setVoiceConfig(prev => ({ ...prev, autoPlay: !prev.autoPlay }))}
            className={`p-2 rounded-full transition-all ${
              voiceConfig.autoPlay
                ? 'bg-violet-500/20 text-violet-400'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
            }`}
            title={voiceConfig.autoPlay ? 'Voice auto-play ON' : 'Voice auto-play OFF'}
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

          {/* Breathing exercise trigger */}
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

          {/* Self-Awareness Mirror / Mood Journey */}
          <button
            onClick={() => setShowMoodJourney(v => !v)}
            className={`p-2 rounded-full transition-all ${
              showMoodJourney
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'text-white/30 hover:text-white/60 hover:bg-white/5'
            }`}
            title="Your mood journey & milestones"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
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
              language: (voiceConfig.language || 'en') as VoiceLanguage,
              voiceId: voiceConfig.speakerId?.split('_').pop() || 'sarvam-aura',
              emotion: voiceConfig.emotion || 'neutral',
              speed: voiceConfig.speed || 0.95,
              pitch: voiceConfig.pitch || 0.0,
              autoPlay: voiceConfig.autoPlay ?? true,
            }}
            onConfigChange={(cfg) => setVoiceConfig(prev => ({
              ...prev,
              language: cfg.language,
              speakerId: `${cfg.language}_${cfg.voiceId}`,
              emotion: cfg.emotion,
              speed: cfg.speed,
              pitch: cfg.pitch,
              autoPlay: cfg.autoPlay,
            }))}
            onClose={() => setShowVoiceSettings(false)}
          />
        </div>
      )}

      {/* ─── Self-Awareness Mirror Panel ─── */}
      {showMoodJourney && (
        <div className="relative z-20 max-w-xl mx-auto w-full px-4 pt-3">
          <MoodJourneyPanel onClose={() => setShowMoodJourney(false)} />
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
                // Auto-send a follow-up after breathing
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
            intensity={isLoading ? 0.8 : 0.5}
          />

          <h2 className="mt-6 text-lg font-semibold text-white/90 tracking-wide">KIAAN</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {isLoading ? 'Thinking...' : session.isActive ? 'Your best friend' : 'Session ended'}
          </p>

          {/* ── Mood + Language Indicator ── */}
          <div className="flex items-center gap-2 mt-2">
            {currentMood && currentMood !== 'neutral' && MOOD_DISPLAY[currentMood] && (
              <span className={`text-xs px-2.5 py-1 rounded-full bg-white/5 border border-white/10 flex items-center gap-1.5 ${MOOD_DISPLAY[currentMood].color}`}>
                <span>{MOOD_DISPLAY[currentMood].emoji}</span>
                <span>{MOOD_DISPLAY[currentMood].label}</span>
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
                    voiceId={voiceConfig.speakerId.split('_').pop() || 'sarvam-aura'}
                    language={voiceConfig.language}
                    compact
                    autoPlay={voiceConfig.autoPlay && i === messages.length - 1}
                    onStart={handleVoiceStart}
                    onEnd={handleVoiceEnd}
                  />
                  {/* Mood badge on message */}
                  {msg.mood && msg.mood !== 'neutral' && MOOD_DISPLAY[msg.mood] && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full bg-white/5 ${MOOD_DISPLAY[msg.mood].color}`}>
                      {MOOD_DISPLAY[msg.mood].emoji} {MOOD_DISPLAY[msg.mood].label}
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
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.6), rgba(99,102,241,0.4))',
                  boxShadow: '0 0 12px rgba(139,92,246,0.3)',
                }}
              >
                <span className="text-white text-[10px] font-bold">K</span>
              </div>
              <div className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl rounded-bl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-white/40"
                      style={{
                        animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* ─── Suggestions ─── */}
      {showSuggestions && session.isActive && !isLoading && (
        <div className="relative z-10 max-w-xl mx-auto w-full px-4 pb-2">
          <CompanionSuggestions
            mood={currentMood}
            phase={session.phase}
            isFirstMessage={messages.length <= 1}
            onSelect={handleSuggestion}
          />
        </div>
      )}

      {/* ─── Input Area ─── */}
      {session.isActive ? (
        <footer className="relative z-10 border-t border-white/5" style={{ background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-xl mx-auto px-4 py-3 pb-safe-bottom">
            {error && (
              <p className="text-xs text-red-400/80 mb-2">{error}</p>
            )}
            <div className="flex items-end gap-2">
              {/* Voice recorder */}
              <div className="dark">
                <CompanionVoiceRecorder
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
                  placeholder="Talk to KIAAN..."
                  rows={1}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white/90 placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500/30 transition-all duration-200"
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
                        background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                        boxShadow: '0 0 20px rgba(139,92,246,0.3)',
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

            <p className="text-[10px] text-white/20 text-center mt-2">
              KIAAN is your divine friend, walking beside you with wisdom from the Bhagavad Gita.
            </p>
          </div>
        </footer>
      ) : (
        <footer className="relative z-10 border-t border-white/5 p-4" style={{ background: 'rgba(10,10,20,0.8)', backdropFilter: 'blur(20px)' }}>
          <div className="max-w-xl mx-auto text-center pb-safe-bottom">
            <p className="text-sm text-white/40 mb-3">This conversation has ended.</p>
            <button
              onClick={startSession}
              className="px-6 py-2.5 rounded-full text-sm font-medium text-white transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
                boxShadow: '0 0 25px rgba(139,92,246,0.3)',
              }}
            >
              Start New Conversation
            </button>
          </div>
        </footer>
      )}

      {/* Animation styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes typing-dot {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
      ` }} />
    </div>
  )
}
