'use client'

/**
 * KIAAN Voice Companion — Three-Engine Voice-First AI Interface
 *
 * Architecture: Three engines running in parallel for instant, intelligent responses.
 *
 * ENGINE 1 — FRIEND ENGINE:
 *   Casual conversation, emotional support, humor, gestures.
 *   Responds as a real friend — no unsolicited spiritual advice.
 *   Psychology-backed empathy (CBT, ACT, Polyvagal).
 *
 * ENGINE 2 — GUIDANCE ENGINE:
 *   10/10 Bhagavad Gita compliance via Wisdom Core (701 verses).
 *   Static wisdom (verse lookup, chapter navigation) +
 *   Dynamic wisdom (mood-scored, context-aware verse selection).
 *   Modern psychology interpretations of ancient wisdom.
 *
 * ENGINE 3 — ASSISTANT ENGINE:
 *   Full KIAAN AI Ecosystem navigation via voice commands.
 *   "Take me to Viyoga", "Open my journal", "Play meditation music".
 *   16+ tools, 100+ routes, voice input injection into tools.
 *
 * Wake Word: Activates on "Hey KIAAN" / "KIAAN" voice command.
 * Power-Aware: Adapts engine usage based on battery/device tier.
 * Offline-First: Friend Engine works fully offline.
 * Accessibility: WCAG 2.1 AA, prefers-reduced-motion respected.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { apiFetch } from '@/lib/api'
import { orchestrate, type OrchestratorResult } from '@/lib/kiaan-engine-orchestrator'
import { KiaanFriendEngine } from '@/lib/kiaan-friend-engine'
import { getPowerMode, onPowerModeChange, initPowerManager, type PowerMode } from '@/lib/kiaan-power-manager'
import { engineSyncBus } from '@/lib/kiaan-engine-sync'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useWakeWord } from '@/hooks/useWakeWord'
import type { VoiceLanguage } from '@/utils/voice/voiceCatalog'

// ─── Dynamic imports for heavy components (code-split) ──────────────────────
const KiaanVoiceOrb = dynamic(
  () => import('@/components/voice/KiaanVoiceOrb').then(m => ({ default: m.default })),
  { ssr: false }
)
const VoiceWaveform = dynamic(
  () => import('@/components/voice/VoiceWaveform').then(m => ({ default: m.default })),
  { ssr: false }
)
const VoiceCompanionSelector = dynamic(
  () => import('@/components/voice/VoiceCompanionSelector'),
  { ssr: false, loading: () => <div className="h-32 animate-pulse rounded-xl bg-white/5" /> }
)
const _CompanionVoiceRecorder = dynamic(
  () => import('@/components/companion/CompanionVoiceRecorder'),
  { ssr: false }
)

// ─── Types ──────────────────────────────────────────────────────────────────

type ActiveEngine = 'friend' | 'guidance' | 'assistant'
type CompanionPhase = 'idle' | 'wake-listening' | 'listening' | 'processing' | 'speaking' | 'breathing'

interface ChatMessage {
  id: string
  role: 'user' | 'kiaan'
  content: string
  timestamp: number
  engine: ActiveEngine
  mood?: string
  verse?: { ref: string; sanskrit?: string; translation?: string; application?: string } | null
  navigation?: { tool: string; route: string; reason: string } | null
  gesture?: string
}

interface EngineStatus {
  friend: { active: boolean; mood: string | null; phase: string; latencyMs: number }
  guidance: { active: boolean; verseRef: string | null; theme: string | null; latencyMs: number }
  assistant: { active: boolean; intent: string | null; targetTool: string | null; latencyMs: number }
}

interface VoiceConfig {
  language: VoiceLanguage
  autoPlay: boolean
  speed: number
  pitch: number
}

// ─── Constants ──────────────────────────────────────────────────────────────

const FRIEND_GESTURES: Record<string, string> = {
  happy: '🤗', excited: '🎉', hopeful: '✨', peaceful: '🕊️', grateful: '🙏',
  anxious: '💛', sad: '🫂', angry: '🔥', confused: '🤔', lonely: '💜',
  overwhelmed: '🌊', hurt: '💔', guilty: '🌱', stressed: '😮‍💨',
  neutral: '👋', fearful: '🛡️', frustrated: '💪',
}

const ENGINE_COLORS = {
  friend: { bg: 'from-amber-500/20 to-orange-500/20', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-amber-500/20' },
  guidance: { bg: 'from-emerald-500/20 to-teal-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-emerald-500/20' },
  assistant: { bg: 'from-blue-500/20 to-indigo-500/20', text: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
} as const

const SACRED_GREETINGS = [
  'Namaste, friend. I am here.',
  'Om. What weighs on your heart?',
  'I am listening, always.',
  'Speak freely. No judgment here.',
  'Your friend KIAAN is awake.',
  'Tell me everything.',
  'I am here for you, always.',
  'What is on your mind today?',
]

// ─── Helper: Mood → OrbEmotion mapping ──────────────────────────────────────

type OrbEmotion = 'neutral' | 'anxiety' | 'sadness' | 'anger' | 'confusion' | 'peace' | 'hope' | 'love'

function moodToOrbEmotion(mood: string | null): OrbEmotion {
  if (!mood) return 'neutral'
  const map: Record<string, OrbEmotion> = {
    anxious: 'anxiety', scared: 'anxiety', stressed: 'anxiety', fearful: 'anxiety', nervous: 'anxiety',
    sad: 'sadness', lonely: 'sadness', hurt: 'sadness', guilty: 'sadness',
    angry: 'anger', frustrated: 'anger',
    confused: 'confusion', overwhelmed: 'confusion',
    peaceful: 'peace', grateful: 'peace', calm: 'peace',
    hopeful: 'hope', excited: 'hope', happy: 'hope',
    loving: 'love',
  }
  return map[mood] ?? 'neutral'
}

// ─── Helper: Phase → OrbState mapping ───────────────────────────────────────

type OrbState = 'idle' | 'wake-listening' | 'listening' | 'processing' | 'speaking' | 'breathing' | 'error'

function phaseToOrbState(phase: CompanionPhase): OrbState {
  return phase as OrbState
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function KiaanVoiceCompanionPage() {
  const router = useRouter()

  // ── Core State ──────────────────────────────────────────────────────
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [phase, setPhase] = useState<CompanionPhase>('idle')
  const [currentMood, setCurrentMood] = useState<string | null>(null)
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [activeEngine, setActiveEngine] = useState<ActiveEngine>('friend')
  const [showSettings, setShowSettings] = useState(false)
  const [showEnginePanel, setShowEnginePanel] = useState(false)

  // ── Engine Status (live telemetry) ──────────────────────────────────
  const [engineStatus, setEngineStatus] = useState<EngineStatus>({
    friend: { active: true, mood: null, phase: 'connect', latencyMs: 0 },
    guidance: { active: true, verseRef: null, theme: null, latencyMs: 0 },
    assistant: { active: true, intent: null, targetTool: null, latencyMs: 0 },
  })

  // ── Power & Device ─────────────────────────────────────────────────
  const [powerMode, setPowerMode] = useState<PowerMode>('balanced')

  // ── Voice Config ───────────────────────────────────────────────────
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    language: 'en',
    autoPlay: true,
    speed: 0.95,
    pitch: 0,
  })

  // ── Refs ───────────────────────────────────────────────────────────
  const chatEndRef = useRef<HTMLDivElement>(null)
  const enhanceAbortRef = useRef<AbortController | null>(null)
  const _friendEngineRef = useRef(new KiaanFriendEngine())
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const isSpeakingRef = useRef(false)

  // ── Voice Input (4-tier STT) ───────────────────────────────────────
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported: isSttSupported,
    startListening,
    stopListening,
    resetTranscript,
    sttProvider,
    status: _sttStatus,
  } = useVoiceInput({ language: voiceConfig.language })

  // ── Wake Word Detection ────────────────────────────────────────────
  const {
  } = useWakeWord({
    sensitivity: 'high',
    enabled: true,
    onWakeWordDetected: () => {
      if (phase === 'idle') handleWakeWordActivation()
    },
  })

  // ── Initialize power manager ───────────────────────────────────────
  useEffect(() => {
    initPowerManager()
    setPowerMode(getPowerMode())
    const unsub = onPowerModeChange((mode: PowerMode) => setPowerMode(mode))
    return () => { unsub() }
  }, [])

  // ── Subscribe to engine sync bus ───────────────────────────────────
  useEffect(() => {
    const unsubs = [
      engineSyncBus.subscribe('mood-detected', (raw: unknown) => {
        const data = raw as { mood: string; intensity: number }
        setEngineStatus(prev => ({
          ...prev,
          friend: { ...prev.friend, mood: data.mood, active: true },
        }))
      }),
      engineSyncBus.subscribe('verse-matched', (raw: unknown) => {
        const data = raw as { ref: string; theme: string }
        setEngineStatus(prev => ({
          ...prev,
          guidance: { ...prev.guidance, verseRef: data.ref, theme: data.theme, active: true },
        }))
      }),
      engineSyncBus.subscribe('intent-classified', (raw: unknown) => {
        const data = raw as { action: string; tool: string | null }
        setEngineStatus(prev => ({
          ...prev,
          assistant: { ...prev.assistant, intent: data.action, targetTool: data.tool, active: true },
        }))
      }),
      engineSyncBus.subscribe('tool-suggested', (raw: unknown) => {
        const data = raw as { tool: string; reason: string }
        setEngineStatus(prev => ({
          ...prev,
          assistant: { ...prev.assistant, targetTool: data.tool, active: true },
        }))
      }),
    ]
    return () => { unsubs.forEach(fn => fn()) }
  }, [])

  // ── Auto-scroll chat ──────────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Wake word activation is handled via onWakeWordDetected callback in useWakeWord

  // ── Process transcript when listening stops ───────────────────────
  useEffect(() => {
    if (!isListening && transcript && phase === 'listening') {
      handleUserMessage(transcript)
      resetTranscript()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening, transcript])

  // ── Greeting on mount ─────────────────────────────────────────────
  useEffect(() => {
    const greeting = SACRED_GREETINGS[Math.floor(Math.random() * SACRED_GREETINGS.length)]
    const greetMsg: ChatMessage = {
      id: `kiaan_greeting_${Date.now()}`,
      role: 'kiaan',
      content: greeting,
      timestamp: Date.now(),
      engine: 'friend',
      gesture: '🙏',
    }
    setMessages([greetMsg])
    speakText(greeting)

    return () => {
      // Cleanup on unmount
      if (enhanceAbortRef.current) enhanceAbortRef.current.abort()
      if (typeof window !== 'undefined') window.speechSynthesis?.cancel()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ─── Wake Word Activation ─────────────────────────────────────────

  const handleWakeWordActivation = useCallback(() => {
    setPhase('wake-listening')
    // Brief wake acknowledgment then start listening
    const ack = 'I am here.'
    speakText(ack, () => {
      setPhase('listening')
      startListening()
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startListening])

  // ─── Speak Text (Browser TTS with callbacks) ─────────────────────

  const speakText = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !window.speechSynthesis || !voiceConfig.autoPlay) {
      onEnd?.()
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = voiceConfig.speed
    utterance.lang = voiceConfig.language === 'hi' ? 'hi-IN' : voiceConfig.language === 'sa' ? 'sa-IN' : 'en-US'
    utterance.onstart = () => {
      isSpeakingRef.current = true
      setPhase('speaking')
    }
    utterance.onend = () => {
      isSpeakingRef.current = false
      setPhase('idle')
      onEnd?.()
    }
    utterance.onerror = () => {
      isSpeakingRef.current = false
      setPhase('idle')
      onEnd?.()
    }
    window.speechSynthesis.speak(utterance)
  }, [voiceConfig.autoPlay, voiceConfig.speed, voiceConfig.language])

  // ─── Core Message Handler (Three-Engine Pipeline) ─────────────────

  const handleUserMessage = useCallback(async (msg: string) => {
    if (!msg.trim()) return

    // Cancel any ongoing enhancement
    if (enhanceAbortRef.current) {
      enhanceAbortRef.current.abort()
      enhanceAbortRef.current = null
    }

    // Add user message
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: Date.now(),
      engine: 'friend',
    }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)
    setPhase('processing')

    const kiaanMsgId = `kiaan_${Date.now()}`
    let localResult: OrchestratorResult | null = null

    // ── STEP 1: Instant local response via Three-Engine Orchestrator (<100ms) ──
    try {
      const orchStart = performance.now()
      localResult = await orchestrate(msg, voiceConfig.language)
      const orchLatency = performance.now() - orchStart

      // Determine which engine dominated the response
      let dominantEngine: ActiveEngine = 'friend'
      if (localResult.intent.action === 'navigate' && localResult.toolSuggestion) {
        dominantEngine = 'assistant'
      } else if (localResult.wisdomText) {
        dominantEngine = 'guidance'
      }

      setActiveEngine(dominantEngine)
      setCurrentMood(localResult.friendResponse.mood)

      // Update engine telemetry
      setEngineStatus(prev => ({
        friend: {
          ...prev.friend,
          active: true,
          mood: localResult!.friendResponse.mood,
          phase: localResult!.friendResponse.phase,
          latencyMs: orchLatency,
        },
        guidance: {
          ...prev.guidance,
          active: !!localResult!.wisdomText,
          verseRef: localResult!.verseMatch?.verse_ref ?? null,
          theme: localResult!.verseMatch?.theme ?? null,
          latencyMs: orchLatency,
        },
        assistant: {
          ...prev.assistant,
          active: !!localResult!.toolSuggestion,
          intent: localResult!.intent.action,
          targetTool: localResult!.intent.targetTool,
          latencyMs: orchLatency,
        },
      }))

      // Build rich message
      const kiaanMsg: ChatMessage = {
        id: kiaanMsgId,
        role: 'kiaan',
        content: localResult.localResponse,
        mood: localResult.friendResponse.mood,
        timestamp: Date.now(),
        engine: dominantEngine,
        gesture: FRIEND_GESTURES[localResult.friendResponse.mood] ?? '🙏',
        verse: localResult.verseMatch
          ? {
              ref: localResult.verseMatch.verse_ref,
              sanskrit: localResult.verseMatch.sanskrit,
              translation: localResult.verseMatch.english,
              application: localResult.wisdomText ?? undefined,
            }
          : null,
        navigation: localResult.toolSuggestion
          ? {
              tool: localResult.toolSuggestion.tool.id,
              route: localResult.toolSuggestion.tool.route,
              reason: localResult.toolSuggestion.reason,
            }
          : null,
      }
      setMessages(prev => [...prev, kiaanMsg])
      setIsLoading(false)

      // Speak the response
      speakText(localResult.localResponse)

      // ── ASSISTANT ENGINE: Auto-navigate if high-confidence navigation intent ──
      if (
        dominantEngine === 'assistant' &&
        localResult.intent.action === 'navigate' &&
        localResult.intent.targetTool &&
        localResult.intent.confidence >= 0.8 &&
        localResult.toolSuggestion
      ) {
        // Navigate after speaking completes
        const route = localResult.toolSuggestion.tool.route
        setTimeout(() => {
          router.push(route)
        }, 2500)
      }
    } catch {
      // Orchestrator failed — fall through to backend
      setIsLoading(false)
    }

    // ── STEP 2: Background Enhancement via Backend (1-3s, non-blocking) ──
    if (!localResult || localResult.needsEnhancement) {
      const abortController = new AbortController()
      enhanceAbortRef.current = abortController

      try {
        const history = messages.slice(-8).map(m => ({
          role: m.role === 'kiaan' ? 'assistant' : 'user',
          content: m.content,
        }))

        const res = await apiFetch('/api/kiaan/friend/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: msg,
            language: voiceConfig.language,
            force_mode: null,
            conversation_history: history,
            friendship_level: messages.length > 20 ? 'close' : messages.length > 6 ? 'familiar' : 'new',
          }),
          signal: abortController.signal,
        })

        if (res.ok && !abortController.signal.aborted) {
          const data = await res.json()
          setCurrentMood(data.mood)

          if (localResult) {
            // Enhance existing local message
            setMessages(prev =>
              prev.map(m =>
                m.id === kiaanMsgId
                  ? {
                      ...m,
                      content: data.response,
                      mood: data.mood,
                      gesture: FRIEND_GESTURES[data.mood] ?? m.gesture,
                    }
                  : m,
              ),
            )
          } else {
            // No local result — add backend response directly
            setMessages(prev => [
              ...prev,
              {
                id: kiaanMsgId,
                role: 'kiaan' as const,
                content: data.response,
                mood: data.mood,
                timestamp: Date.now(),
                engine: 'friend' as ActiveEngine,
                gesture: FRIEND_GESTURES[data.mood] ?? '🙏',
              },
            ])
            speakText(data.response)
          }
        }
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        // Backend enhancement failed — local response still shown
      }
    }

    setPhase('idle')
  }, [messages, voiceConfig.language, speakText, router])

  // ─── Voice Mic Toggle ─────────────────────────────────────────────

  const handleMicToggle = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      setPhase('listening')
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // ─── Text Submit ──────────────────────────────────────────────────

  const handleTextSubmit = useCallback(() => {
    if (inputText.trim()) {
      handleUserMessage(inputText.trim())
      setInputText('')
      if (textareaRef.current) textareaRef.current.style.height = 'auto'
    }
  }, [inputText, handleUserMessage])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        handleTextSubmit()
      }
    },
    [handleTextSubmit],
  )

  // ─── Suggestion Chips ─────────────────────────────────────────────

  const suggestions = useMemo(() => {
    if (messages.length <= 1) {
      return [
        'How are you feeling today?',
        'Tell me something wise',
        'I need guidance',
        'Take me to my journal',
      ]
    }
    if (activeEngine === 'guidance') {
      return [
        'Read me another verse',
        'Explain that deeper',
        'How do I apply this?',
        'Show me Chapter 2',
      ]
    }
    if (activeEngine === 'assistant') {
      return [
        'Open Emotional Reset',
        'Play meditation music',
        'Show my karma footprint',
        'Take me to Viyoga',
      ]
    }
    return [
      'I want to talk about something personal',
      'Something happened today...',
      'Can you just listen for a bit?',
      'I need some wisdom right now',
    ]
  }, [messages.length, activeEngine])

  // ─── Computed Values ──────────────────────────────────────────────

  const orbEmotion = moodToOrbEmotion(currentMood)
  const orbState = phaseToOrbState(phase)

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <div className="relative flex h-[100dvh] flex-col overflow-hidden bg-[#0a0a12]">
      {/* ── Ambient Background Gradient ────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-[3000ms]"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 50% 20%,
              ${currentMood === 'anxious' ? 'rgba(212,164,76,0.08)' :
                currentMood === 'sad' ? 'rgba(59,130,246,0.08)' :
                currentMood === 'angry' ? 'rgba(239,68,68,0.06)' :
                currentMood === 'peaceful' ? 'rgba(16,185,129,0.08)' :
                currentMood === 'hopeful' ? 'rgba(234,179,8,0.08)' :
                'rgba(139,92,246,0.06)'}
              0%,
              transparent 70%
            )
          `,
        }}
      />

      {/* ── Sacred Particles (reduced-motion aware) ────────────────── */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden motion-reduce:hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute h-1 w-1 rounded-full opacity-20"
            style={{
              background: 'radial-gradient(circle, #d4a44c, transparent)',
              left: `${15 + i * 14}%`,
              top: `${10 + (i % 3) * 25}%`,
              animation: `float-particle ${8 + i * 2}s ease-in-out infinite`,
              animationDelay: `${i * 1.3}s`,
            }}
          />
        ))}
      </div>

      {/* ── Header with Engine Status Indicators ───────────────────── */}
      <header className="relative z-10 flex items-center justify-between px-4 pb-2 pt-4 sm:px-6">
        <div className="flex items-center gap-3">
          <h1 className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 bg-clip-text text-lg font-bold tracking-wide text-transparent">
            KIAAN
          </h1>
          <span className="text-xs text-white/30">Voice Companion</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Power Mode Indicator */}
          <div
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium tracking-wider ${
              powerMode === 'performance'
                ? 'bg-emerald-500/10 text-emerald-400'
                : powerMode === 'ultra-low'
                  ? 'bg-red-500/10 text-red-400'
                  : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {powerMode === 'ultra-low' ? 'SAVE' : powerMode === 'performance' ? 'PERF' : 'BAL'}
          </div>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(s => !s)}
            className="rounded-lg p-2 text-white/40 transition-colors hover:bg-white/5 hover:text-white/70"
            aria-label="Voice settings"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.32 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
          </button>
        </div>
      </header>

      {/* ── Three-Engine Status Bar ────────────────────────────────── */}
      <div className="relative z-10 mx-4 mb-3 sm:mx-6">
        <button
          onClick={() => setShowEnginePanel(p => !p)}
          className="flex w-full items-center justify-center gap-4 rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-2 backdrop-blur-sm transition-all hover:bg-white/[0.04]"
        >
          {/* Engine 1: Friend */}
          <EngineIndicator
            label="Friend"
            active={engineStatus.friend.active}
            color={ENGINE_COLORS.friend}
            detail={engineStatus.friend.mood ? `${FRIEND_GESTURES[engineStatus.friend.mood] ?? ''} ${engineStatus.friend.mood}` : 'Ready'}
            isLead={activeEngine === 'friend'}
          />
          <div className="h-4 w-px bg-white/10" />
          {/* Engine 2: Guidance */}
          <EngineIndicator
            label="Guidance"
            active={engineStatus.guidance.active}
            color={ENGINE_COLORS.guidance}
            detail={engineStatus.guidance.verseRef ?? 'Gita Ready'}
            isLead={activeEngine === 'guidance'}
          />
          <div className="h-4 w-px bg-white/10" />
          {/* Engine 3: Assistant */}
          <EngineIndicator
            label="Assistant"
            active={engineStatus.assistant.active}
            color={ENGINE_COLORS.assistant}
            detail={engineStatus.assistant.targetTool ?? 'Listening'}
            isLead={activeEngine === 'assistant'}
          />
        </button>

        {/* Engine Detail Panel (expandable) */}
        {showEnginePanel && (
          <div className="mt-2 overflow-hidden rounded-2xl border border-white/5 bg-[#12121e]/95 p-4 backdrop-blur-xl">
            <EngineDetailPanel engineStatus={engineStatus} powerMode={powerMode} />
          </div>
        )}
      </div>

      {/* ── Voice Settings Panel (collapsible) ─────────────────────── */}
      {showSettings && (
        <div className="relative z-10 mx-4 mb-3 overflow-hidden rounded-2xl border border-white/5 bg-[#12121e]/95 backdrop-blur-xl sm:mx-6">
          <div className="p-4">
            <VoiceCompanionSelector
              currentConfig={{
                language: voiceConfig.language,
                voiceId: '',
                emotion: 'natural',
                speed: voiceConfig.speed,
                pitch: voiceConfig.pitch,
                autoPlay: voiceConfig.autoPlay,
              }}
              onConfigChange={(config) =>
                setVoiceConfig({
                  language: config.language,
                  autoPlay: config.autoPlay,
                  speed: config.speed,
                  pitch: config.pitch,
                })
              }
              onClose={() => setShowSettings(false)}
            />
          </div>
        </div>
      )}

      {/* ── Main Chat Area ─────────────────────────────────────────── */}
      <main className="relative z-10 flex flex-1 flex-col overflow-hidden">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto scroll-smooth px-4 sm:px-6" id="chat-scroll">
          <div className="mx-auto max-w-2xl space-y-4 pb-4 pt-2">
            {messages.map(msg => (
              <MessageBubble key={msg.id} message={msg} onNavigate={router.push} onSpeak={speakText} />
            ))}

            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 text-sm">
                  K
                </div>
                <div className="rounded-2xl rounded-tl-md bg-white/[0.04] px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <div className="h-2 w-2 animate-bounce rounded-full bg-amber-400/60" style={{ animationDelay: '0ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-amber-400/60" style={{ animationDelay: '150ms' }} />
                    <div className="h-2 w-2 animate-bounce rounded-full bg-amber-400/60" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </div>

        {/* ── Suggestion Chips ──────────────────────────────────────── */}
        <div className="flex flex-wrap justify-center gap-2 px-4 py-2">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => handleUserMessage(s)}
              className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs text-white/50 transition-all hover:border-amber-500/20 hover:bg-amber-500/5 hover:text-white/70 active:scale-95"
            >
              {s}
            </button>
          ))}
        </div>
      </main>

      {/* ── Bottom: Orb + Voice Input ──────────────────────────────── */}
      <footer className="relative z-10 pb-[env(safe-area-inset-bottom)] pt-2">
        {/* Central Orb */}
        <div className="flex flex-col items-center gap-3 pb-3">
          <KiaanVoiceOrb
            state={orbState}
            emotion={orbEmotion}
            size={phase === 'listening' || phase === 'speaking' ? 100 : 80}
            onClick={handleMicToggle}
          />

          {/* Waveform during listening/speaking */}
          {(phase === 'listening' || phase === 'speaking') && (
            <VoiceWaveform
              frequencyData={null}
              barCount={24}
              height={32}
              width={200}
              color="amber"
              simulateWhenInactive
              state={phase}
            />
          )}

          {/* Listening transcript preview */}
          {isListening && (transcript || interimTranscript) && (
            <div className="max-w-sm rounded-xl bg-white/5 px-4 py-2 text-center text-sm text-white/60">
              {transcript}
              {interimTranscript && <span className="text-white/30">{interimTranscript}</span>}
            </div>
          )}

          {/* STT Provider badge */}
          {isListening && sttProvider && (
            <div className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] text-white/25">
              {sttProvider === 'web-speech-api' ? 'Browser STT' : sttProvider}
            </div>
          )}
        </div>

        {/* Text Input Bar */}
        <div className="mx-4 mb-3 flex items-end gap-2 sm:mx-6">
          {/* Mic button */}
          <button
            onClick={handleMicToggle}
            disabled={!isSttSupported}
            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-all ${
              isListening
                ? 'bg-red-500/20 text-red-400 shadow-lg shadow-red-500/20'
                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
            } ${!isSttSupported ? 'cursor-not-allowed opacity-30' : ''}`}
            aria-label={isListening ? 'Stop listening' : 'Start listening'}
          >
            {isListening ? (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
                <path d="M19 10v2a7 7 0 01-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            )}
          </button>

          {/* Text input */}
          <div className="relative flex-1">
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={e => {
                setInputText(e.target.value)
                // Auto-resize
                e.target.style.height = 'auto'
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
              }}
              onKeyDown={handleKeyDown}
              placeholder="Talk to KIAAN..."
              rows={1}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm text-white/90 placeholder-white/25 outline-none transition-colors focus:border-amber-500/30 focus:bg-white/[0.06]"
              style={{ maxHeight: 120 }}
            />
          </div>

          {/* Send button */}
          <button
            onClick={handleTextSubmit}
            disabled={!inputText.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/80 to-orange-600/80 text-white shadow-lg shadow-amber-500/20 transition-all hover:from-amber-500 hover:to-orange-600 active:scale-95 disabled:opacity-30 disabled:shadow-none"
            aria-label="Send message"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>

        {/* Footer tagline */}
        <p className="pb-2 text-center text-[10px] text-white/15">
          Three engines. One friend. Infinite wisdom.
        </p>
      </footer>

      {/* ── CSS Keyframes ──────────────────────────────────────────── */}
      <style jsx>{`
        @keyframes float-particle {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.15; }
          25% { transform: translateY(-20px) translateX(10px); opacity: 0.3; }
          50% { transform: translateY(-10px) translateX(-5px); opacity: 0.2; }
          75% { transform: translateY(-25px) translateX(8px); opacity: 0.25; }
        }
      `}</style>
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════

// ─── Engine Indicator (Header Bar) ──────────────────────────────────────

interface EngineIndicatorProps {
  label: string
  active: boolean
  color: { bg: string; text: string; border: string; glow: string }
  detail: string
  isLead: boolean
}

function EngineIndicator({ label, active, color, detail, isLead }: EngineIndicatorProps) {
  return (
    <div className={`flex items-center gap-1.5 transition-all ${isLead ? 'scale-105' : 'opacity-60'}`}>
      {/* Status dot */}
      <div
        className={`h-1.5 w-1.5 rounded-full transition-all ${
          active ? `bg-current ${color.text} ${isLead ? 'animate-pulse' : ''}` : 'bg-white/20'
        }`}
      />
      <div className="flex flex-col">
        <span className={`text-[10px] font-semibold tracking-wider ${isLead ? color.text : 'text-white/40'}`}>
          {label}
        </span>
        <span className="max-w-[80px] truncate text-[9px] text-white/25">
          {detail}
        </span>
      </div>
    </div>
  )
}

// ─── Engine Detail Panel (Expanded) ─────────────────────────────────────

interface EngineDetailPanelProps {
  engineStatus: EngineStatus
  powerMode: PowerMode
}

function EngineDetailPanel({ engineStatus, powerMode }: EngineDetailPanelProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold tracking-wider text-white/50">ENGINE TELEMETRY</h3>
        <span className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/30">
          Power: {powerMode}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Friend Engine */}
        <div className={`rounded-xl border ${ENGINE_COLORS.friend.border} bg-gradient-to-b ${ENGINE_COLORS.friend.bg} p-3`}>
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-lg">💛</span>
            <span className={`text-[11px] font-bold ${ENGINE_COLORS.friend.text}`}>Friend</span>
          </div>
          <div className="space-y-1 text-[10px] text-white/40">
            <div>Mood: <span className="text-white/60">{engineStatus.friend.mood ?? '—'}</span></div>
            <div>Phase: <span className="text-white/60">{engineStatus.friend.phase}</span></div>
            <div>Latency: <span className="text-white/60">{engineStatus.friend.latencyMs.toFixed(0)}ms</span></div>
          </div>
        </div>

        {/* Guidance Engine */}
        <div className={`rounded-xl border ${ENGINE_COLORS.guidance.border} bg-gradient-to-b ${ENGINE_COLORS.guidance.bg} p-3`}>
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-lg">📿</span>
            <span className={`text-[11px] font-bold ${ENGINE_COLORS.guidance.text}`}>Guidance</span>
          </div>
          <div className="space-y-1 text-[10px] text-white/40">
            <div>Verse: <span className="text-white/60">{engineStatus.guidance.verseRef ?? '—'}</span></div>
            <div>Theme: <span className="text-white/60">{engineStatus.guidance.theme ?? '—'}</span></div>
            <div>Corpus: <span className="text-white/60">701 verses</span></div>
          </div>
        </div>

        {/* Assistant Engine */}
        <div className={`rounded-xl border ${ENGINE_COLORS.assistant.border} bg-gradient-to-b ${ENGINE_COLORS.assistant.bg} p-3`}>
          <div className="mb-2 flex items-center gap-1.5">
            <span className="text-lg">🧭</span>
            <span className={`text-[11px] font-bold ${ENGINE_COLORS.assistant.text}`}>Assistant</span>
          </div>
          <div className="space-y-1 text-[10px] text-white/40">
            <div>Intent: <span className="text-white/60">{engineStatus.assistant.intent ?? '—'}</span></div>
            <div>Tool: <span className="text-white/60">{engineStatus.assistant.targetTool ?? '—'}</span></div>
            <div>Routes: <span className="text-white/60">16+ tools</span></div>
          </div>
        </div>
      </div>

      {powerMode === 'ultra-low' && (
        <div className="rounded-lg bg-red-500/10 px-3 py-2 text-[11px] text-red-400/80">
          Battery saver active — Friend Engine only. Guidance and Assistant paused to conserve energy.
        </div>
      )}
    </div>
  )
}

// ─── Message Bubble ─────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage
  onNavigate: (route: string) => void
  onSpeak: (text: string) => void
}

function MessageBubble({ message, onNavigate, onSpeak }: MessageBubbleProps) {
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[80%] rounded-2xl rounded-br-md bg-gradient-to-br from-purple-600/30 to-indigo-600/20 px-4 py-2.5 backdrop-blur-sm">
          <p className="text-sm text-white/90">{message.content}</p>
          <time className="mt-1 block text-[10px] text-white/20">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>
      </div>
    )
  }

  // KIAAN message
  const engineColor = ENGINE_COLORS[message.engine]

  return (
    <div className="flex items-start gap-3">
      {/* Avatar with engine color ring */}
      <div
        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${engineColor.border} bg-gradient-to-br ${engineColor.bg}`}
      >
        <span className="text-xs font-bold text-white/70">K</span>
        {message.gesture && (
          <span className="absolute -right-1 -top-1 text-sm">{message.gesture}</span>
        )}
      </div>

      <div className="max-w-[85%] space-y-2">
        {/* Engine badge */}
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-semibold tracking-wider ${engineColor.text}`}>
            {message.engine.toUpperCase()}
          </span>
          <time className="text-[10px] text-white/20">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </time>
        </div>

        {/* Main text bubble */}
        <div className="rounded-2xl rounded-tl-md border border-white/5 bg-white/[0.04] px-4 py-3 backdrop-blur-sm">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/80">{message.content}</p>
        </div>

        {/* Gita Verse Card (Guidance Engine) */}
        {message.verse && (
          <div className="overflow-hidden rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-900/20 to-teal-900/10">
            <div className="border-b border-emerald-500/10 px-4 py-2">
              <span className="text-[11px] font-semibold tracking-wider text-emerald-400">
                📿 {message.verse.ref}
              </span>
            </div>
            {message.verse.sanskrit && (
              <div className="border-b border-emerald-500/10 px-4 py-2">
                <p className="font-serif text-sm italic leading-relaxed text-amber-300/70">{message.verse.sanskrit}</p>
              </div>
            )}
            {message.verse.translation && (
              <div className="border-b border-emerald-500/10 px-4 py-2">
                <p className="text-xs leading-relaxed text-white/60">{message.verse.translation}</p>
              </div>
            )}
            {message.verse.application && (
              <div className="px-4 py-2">
                <p className="text-[11px] leading-relaxed text-emerald-400/70">
                  <span className="font-semibold">Modern Application:</span> {message.verse.application}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Navigation Card (Assistant Engine) */}
        {message.navigation && (
          <button
            onClick={() => onNavigate(message.navigation!.route)}
            className="group flex w-full items-center gap-3 rounded-xl border border-blue-500/20 bg-gradient-to-r from-blue-900/20 to-indigo-900/10 px-4 py-3 text-left transition-all hover:border-blue-500/40 hover:from-blue-900/30 active:scale-[0.98]"
          >
            <span className="text-xl">🧭</span>
            <div className="flex-1">
              <p className="text-xs font-semibold text-blue-400">
                Navigate to {message.navigation.tool}
              </p>
              <p className="text-[10px] text-white/30">{message.navigation.reason}</p>
            </div>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-400/50 transition-transform group-hover:translate-x-1"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        )}

        {/* Listen button */}
        <button
          onClick={() => onSpeak(message.content)}
          className="flex items-center gap-1.5 rounded-full border border-white/5 bg-white/[0.02] px-2.5 py-1 text-[10px] text-white/30 transition-colors hover:bg-white/5 hover:text-white/50"
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Listen
        </button>
      </div>
    </div>
  )
}
