'use client'

/**
 * KiaanVoiceCompanionFooter — Shankha (Sacred Conch Shell) Voice Companion
 *
 * The unified KIAAN Voice Companion that appears on EVERY page. Uses Krishna's
 * Panchajanya conch (Shankha) as the visual centerpiece. Always listening for
 * "Hey KIAAN" wake word, responds with Gita wisdom through three engines:
 *
 *   ENGINE 1 (GUIDANCE):  Static + Dynamic Bhagavad Gita wisdom
 *   ENGINE 2 (FRIEND):    Best friend personality + cross-session memory
 *   ENGINE 3 (VOICE GUIDE): Always-awake assistant + ecosystem navigation
 *
 * Better than Alexa/Siri: offline-capable, emotion-aware, wisdom-grounded,
 * device-adaptive (GPU/NPU), 29 languages, 5-phase conversation model.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'

import { useWakeWord } from '@/hooks/useWakeWord'
import { useHandsFreeMode } from '@/hooks/useHandsFreeMode'
import { useEnhancedVoiceOutput } from '@/hooks/useEnhancedVoiceOutput'
import { useLanguage } from '@/hooks/useLanguage'
import { useHapticFeedback } from '@/hooks'
import { ShankhaIcon } from '@/components/icons/ShankhaIcon'
import { apiFetch } from '@/lib/api'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { KiaanFriendEngine } from '@/lib/kiaan-friend-engine'
import { detectToolSuggestion, type ToolSuggestion } from '@/utils/voice/ecosystemNavigator'

// ─── Types ──────────────────────────────────────────────────────────────────

type FooterMode = 'dormant' | 'listening' | 'responding' | 'expanded'

interface CompanionMessage {
  id: string
  role: 'user' | 'companion'
  content: string
  mood?: string
  wisdomUsed?: { principle: string; verse_ref: string } | null
}

// ─── Tool Links (preserved from KiaanFooter) ────────────────────────────────

const TOOL_LINKS = [
  { id: 'viyoga', icon: '\u{1F549}\uFE0F', label: 'Viyoga', href: '/tools/viyog' },
  { id: 'ardha', icon: '\u{1F4FF}', label: 'Ardha', href: '/tools/ardha' },
  { id: 'kiaan-chat', icon: '\u{1F9D8}', label: 'KIAAN Chat', href: '/kiaan/chat' },
  { id: 'compass', icon: '\u{1F54A}\uFE0F', label: 'Compass', href: '/tools/relationship-compass' },
] as const

// ─── Animation Variants ─────────────────────────────────────────────────────

const panelVariants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
    transition: { type: 'spring' as const, stiffness: 400, damping: 30 },
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 350, damping: 28 },
  },
}

const fabVariants = {
  rest: { scale: 1 },
  hover: { scale: 1.08 },
  tap: { scale: 0.92 },
}

// ─── Component ──────────────────────────────────────────────────────────────

export function KiaanVoiceCompanionFooter() {
  const pathname = usePathname()
  const { language, t } = useLanguage()
  const { triggerHaptic } = useHapticFeedback()

  // ── Core State ──
  const [mode, setMode] = useState<FooterMode>('dormant')
  const [messages, setMessages] = useState<CompanionMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toolSuggestion, setToolSuggestion] = useState<ToolSuggestion | null>(null)
  const [sessionId] = useState<string>(`local_${Date.now()}`)
  const [, setCurrentMood] = useState('neutral')
  const [mounted, setMounted] = useState(false)

  // ── Refs ──
  const mountedRef = useRef(true)
  const friendEngineRef = useRef(new KiaanFriendEngine())
  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const autoCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wakeWordWasActiveRef = useRef(false)
  const vibePlayerWasPlayingRef = useRef(false)
  const modeRef = useRef<FooterMode>(mode)

  // Pages where wake word should not auto-start (they have their own voice)
  const isVoiceConflictPage = pathname === '/companion' || pathname === '/kiaan/chat'

  // Subscribe to Vibe Player state — wake word must not listen during playback
  const playerIsPlaying = usePlayerStore(s => s.isPlaying)

  // ── Vibe Player Coordination ──
  // Pause Vibe Player when Voice Companion needs audio (listening or speaking)
  const pauseVibePlayer = useCallback(() => {
    const playerState = usePlayerStore.getState()
    if (playerState.isPlaying) {
      vibePlayerWasPlayingRef.current = true
      playerState.pause()
    }
  }, [])

  const resumeVibePlayer = useCallback(() => {
    if (vibePlayerWasPlayingRef.current) {
      vibePlayerWasPlayingRef.current = false
      // Small delay to avoid audio glitch from rapid pause→play
      setTimeout(() => {
        usePlayerStore.getState().play()
      }, 300)
    }
  }, [])

  // ── Mount / Unmount ──
  useEffect(() => {
    setMounted(true)
    // Clean up obsolete localStorage key from deleted ChatFooter
    try { localStorage.removeItem('kiaan-footer-open') } catch { /* ignore */ }
    return () => {
      mountedRef.current = false
      if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current)
    }
  }, [])

  // ── Wake Word Detection ──
  const handleWakeWordDetected = useCallback((_phrase: string) => {
    if (!mountedRef.current) return
    triggerHaptic('medium')
    setMode('listening')
    setError(null)
    // Hands-free mode will be activated by the mode change effect
  }, [triggerHaptic])

  const {
    isListening: isWakeWordListening,
    startWakeWordListening,
    stopWakeWordListening,
    wakeWordSupported,
  } = useWakeWord({
    onWakeWordDetected: handleWakeWordDetected,
    language: language || 'en',
  })

  // ── Auto-start wake word on mount (if not on conflict page) ──
  // Wake word must NOT listen while the Vibe Player is actively playing audio,
  // otherwise the browser audio session ducks/interrupts playback. This effect
  // re-runs when playerIsPlaying toggles, re-arming the mic only during silence.
  useEffect(() => {
    if (!mounted || !wakeWordSupported || isVoiceConflictPage) return
    if (mode !== 'dormant') return

    // GUARD: do not arm mic while Vibe Player is playing. Stop any active
    // listening so the audio session fully releases the microphone.
    if (playerIsPlaying) {
      if (isWakeWordListening) stopWakeWordListening()
      return
    }

    if (!isWakeWordListening) {
      const timer = setTimeout(() => {
        if (mountedRef.current) startWakeWordListening()
      }, 1000) // Small delay to let page settle
      return () => clearTimeout(timer)
    }
  }, [mounted, wakeWordSupported, isVoiceConflictPage, mode, isWakeWordListening, playerIsPlaying, startWakeWordListening, stopWakeWordListening])

  // ── Send Message to KIAAN ──
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return

    const userMessage: CompanionMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text.trim(),
    }

    setMessages(prev => [...prev, userMessage])
    setInputText('')
    setIsProcessing(true)
    setError(null)
    setMode('responding')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 15000)

    try {
      const response = await apiFetch('/api/companion/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          message: text.trim(),
          language: language || 'en',
          content_type: 'text',
        }),
        signal: controller.signal,
      })

      if (response.ok) {
        const data = await response.json()

        if (data?.response && mountedRef.current) {
          const companionMsg: CompanionMessage = {
            id: data.message_id || `companion-${Date.now()}`,
            role: 'companion',
            content: data.response,
            mood: data.mood || 'neutral',
            wisdomUsed: data.wisdom_used || null,
          }
          setMessages(prev => [...prev, companionMsg])
          setCurrentMood(data.mood || 'neutral')

          // Check for tool suggestions based on mood
          const suggestion = detectToolSuggestion(text.trim(), data.mood)
          setToolSuggestion(suggestion)

          // Speak the response
          speakRef.current(data.response)
          return
        }
      }

      // API failed or returned no response — use local fallback
      addLocalFallbackRef.current(text.trim())
    } catch {
      // Network error or timeout — use local fallback
      addLocalFallbackRef.current(text.trim())
    } finally {
      clearTimeout(timeout)
      if (mountedRef.current) setIsProcessing(false)
    }
  }, [isProcessing, sessionId, language]) // speak via speakRef, addLocalFallback via addLocalFallbackRef

  // ── Local Fallback (Friend Engine) ──
  const addLocalFallback = useCallback((userText: string) => {
    if (!mountedRef.current) return
    try {
      const result = friendEngineRef.current.processMessage(userText)

      const companionMsg: CompanionMessage = {
        id: `companion-${Date.now()}`,
        role: 'companion',
        content: result.response,
        mood: result.mood,
        wisdomUsed: result.wisdom_used,
      }

      setMessages(prev => [...prev, companionMsg])
      setCurrentMood(result.mood)
      setMode('responding')

      const suggestion = detectToolSuggestion(userText, result.mood)
      setToolSuggestion(suggestion)

      speakRef.current(result.response)
    } catch {
      // Friend engine failed — show compassionate fallback
      const fallbackMsg: CompanionMessage = {
        id: `companion-${Date.now()}`,
        role: 'companion',
        content: 'I\'m here with you. Take a moment to breathe deeply.',
        mood: 'neutral',
        wisdomUsed: null,
      }
      setMessages(prev => [...prev, fallbackMsg])
      setMode('responding')
    }
  }, [])

  // Stable ref for addLocalFallback
  const addLocalFallbackRef = useRef(addLocalFallback)
  useEffect(() => { addLocalFallbackRef.current = addLocalFallback })

  // ── TTS Voice Output ──
  const handleTTSEnd = useCallback(() => {
    if (!mountedRef.current) return
    // After speech ends, schedule auto-collapse
    autoCollapseTimerRef.current = setTimeout(() => {
      if (mountedRef.current && modeRef.current === 'responding') {
        setMode('dormant')
      }
    }, 3000)
  }, [])

  const handleTTSStart = useCallback(() => {
    // Cancel any pending auto-collapse when new speech starts
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current)
      autoCollapseTimerRef.current = null
    }
    // Ensure Vibe Player is paused during TTS playback
    pauseVibePlayer()
  }, [pauseVibePlayer])

  const {
    isSpeaking: isTTSSpeaking,
    speak,
    cancel: cancelTTS,
  } = useEnhancedVoiceOutput({
    language: language || 'en',
    voiceType: 'friendly',
    useBackendTts: true,
    onStart: handleTTSStart,
    onEnd: handleTTSEnd,
  })

  // Stable ref for speak — breaks circular dependency between sendMessage,
  // addLocalFallback, and useEnhancedVoiceOutput declaration order.
  const speakRef = useRef(speak)
  useEffect(() => { speakRef.current = speak; modeRef.current = mode })

  // ── Hands-Free Mode (VAD + STT) ──
  const handleTranscript = useCallback((text: string) => {
    if (!mountedRef.current || !text.trim()) return
    sendMessage(text)
  }, [sendMessage])

  const handleBargeIn = useCallback(() => {
    cancelTTS()
  }, [cancelTTS])

  const {
    isActive: isHandsFreeActive,
    state: handsFreeState,
    activate: activateHandsFree,
    deactivate: deactivateHandsFree,
    interimTranscript,
    vadSupported,
  } = useHandsFreeMode({
    language: language || 'en',
    onTranscript: handleTranscript,
    conversational: false, // Footer is single-turn, not continuous conversation
    isProcessing,
    onBargeIn: handleBargeIn,
  })

  // ── Mode Transitions ──

  // When mode becomes 'listening', stop wake word and activate hands-free
  useEffect(() => {
    if (mode === 'listening') {
      // Pause Vibe Player so it doesn't interfere with speech recognition
      pauseVibePlayer()

      if (isWakeWordListening) {
        wakeWordWasActiveRef.current = true
        stopWakeWordListening()
      }
      if (!isHandsFreeActive) {
        // Delay to let wake word fully release SpeechRecognition
        const timer = setTimeout(() => {
          if (mountedRef.current) activateHandsFree()
        }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [mode, isWakeWordListening, isHandsFreeActive, stopWakeWordListening, activateHandsFree, pauseVibePlayer])

  // When mode becomes 'dormant', deactivate hands-free and resume wake word
  useEffect(() => {
    if (mode === 'dormant') {
      if (isHandsFreeActive) {
        deactivateHandsFree()
      }
      // Resume Vibe Player if it was playing before Voice Companion activated
      resumeVibePlayer()

      // Resume wake word after hands-free fully releases mic
      if (wakeWordWasActiveRef.current && wakeWordSupported && !isWakeWordListening && !isVoiceConflictPage) {
        wakeWordWasActiveRef.current = false
        const timer = setTimeout(() => {
          if (mountedRef.current) startWakeWordListening()
        }, 400) // Proven 400ms delay from CompanionVoiceRecorder
        return () => clearTimeout(timer)
      }
    }
  }, [mode, isHandsFreeActive, deactivateHandsFree, wakeWordSupported, isWakeWordListening, isVoiceConflictPage, startWakeWordListening, resumeVibePlayer])

  // ── User Actions ──

  const handleShankhaPress = useCallback(() => {
    triggerHaptic('medium')

    if (mode === 'dormant') {
      setMode('listening')
      setError(null)
    } else if (mode === 'listening') {
      // Stop listening, go back to dormant
      deactivateHandsFree()
      setMode('dormant')
    } else if (mode === 'responding' || mode === 'expanded') {
      // Toggle expanded panel
      setMode(prev => prev === 'expanded' ? 'responding' : 'expanded')
    }
  }, [mode, triggerHaptic, deactivateHandsFree])

  const handleClose = useCallback(() => {
    cancelTTS()
    deactivateHandsFree()
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current)
      autoCollapseTimerRef.current = null
    }
    setMode('dormant')
    setToolSuggestion(null)
    // Resume Vibe Player if it was playing before companion activated
    resumeVibePlayer()
    triggerHaptic('light')
  }, [cancelTTS, deactivateHandsFree, triggerHaptic, resumeVibePlayer])

  const handleTextSubmit = useCallback(() => {
    if (!inputText.trim() || isProcessing) return
    sendMessage(inputText)
  }, [inputText, isProcessing, sendMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleTextSubmit()
    }
  }, [handleTextSubmit])

  // ── Close on Escape ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mode !== 'dormant') handleClose()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mode, handleClose])

  // ── Close on tap/click outside ──
  useEffect(() => {
    if (mode === 'dormant') return
    const handler = (e: Event) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    const timer = setTimeout(() => document.addEventListener('pointerdown', handler), 10)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('pointerdown', handler)
    }
  }, [mode, handleClose])

  // ── Auto-scroll messages ──
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // ── Focus input when panel opens ──
  useEffect(() => {
    if ((mode === 'responding' || mode === 'expanded') && inputRef.current) {
      inputRef.current.focus()
    }
  }, [mode])

  // ── Cancel auto-collapse on user interaction ──
  const cancelAutoCollapse = useCallback(() => {
    if (autoCollapseTimerRef.current) {
      clearTimeout(autoCollapseTimerRef.current)
      autoCollapseTimerRef.current = null
    }
  }, [])

  if (!mounted) return null

  // ── Derived State ──
  const isPanelOpen = mode !== 'dormant'
  const isListening = mode === 'listening'
  const isResponding = mode === 'responding' || mode === 'expanded'
  const lastCompanionMessage = [...messages].reverse().find(m => m.role === 'companion')

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div
      ref={panelRef}
      className="fixed bottom-[calc(88px+env(safe-area-inset-bottom,0px))] right-3 z-[70] md:bottom-8 md:right-8"
    >
      {/* ── Expanded Panel ── */}
      <AnimatePresence mode="wait">
        {isPanelOpen && (
          <motion.div
            role="dialog"
            aria-label="KIAAN Voice Companion"
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="mb-3 w-[calc(100vw-24px)] max-w-[320px] max-h-[min(420px,calc(100dvh-160px))] overflow-hidden rounded-[20px] border border-[#d4a44c]/20 bg-gradient-to-b from-[#0c0a06]/[0.98] via-[#080808]/95 to-[#050507]/[0.98] shadow-2xl shadow-black/40 backdrop-blur-xl md:max-w-[360px] md:rounded-[24px]"
            onClick={cancelAutoCollapse}
          >
            {/* Top glow accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a44c]/40 to-transparent" />

            {/* ── Header ── */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <ShankhaIcon
                    size={18}
                    color="#d4a44c"
                    filled={isListening || isTTSSpeaking}
                    className={isTTSSpeaking ? 'animate-pulse' : ''}
                  />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-[#f5f0e8]">KIAAN</h3>
                  <p className="text-[10px] text-[#f5f0e8]/60" aria-live="polite">
                    {isListening && handsFreeState === 'hearing'
                      ? t('companion.hearing', 'Hearing you...')
                      : isListening
                      ? t('companion.listening', 'Listening...')
                      : isTTSSpeaking
                      ? t('companion.speaking', 'Speaking...')
                      : isProcessing
                      ? t('companion.thinking', 'Thinking...')
                      : t('companion.voiceCompanion', 'Voice Companion')
                    }
                  </p>
                </div>
              </div>
              <motion.button
                onClick={handleClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-[#f5f0e8]/75 hover:bg-white/10 hover:text-[#f5f0e8] transition-colors"
                aria-label={t('common.close', 'Close')}
                whileTap={{ scale: 0.9 }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* ── Messages / Transcript Area ── */}
            <div className="max-h-[200px] overflow-y-auto px-4 py-3 space-y-2.5 scrollbar-thin scrollbar-thumb-[#d4a44c]/20 scrollbar-track-transparent">
              {/* Listening state: show interim transcript */}
              {isListening && (
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-1.5 mb-3">
                    {/* Sound wave animation */}
                    {[0, 1, 2, 3, 4].map(i => (
                      <motion.div
                        key={i}
                        className="w-1 bg-[#d4a44c] rounded-full"
                        animate={{
                          height: handsFreeState === 'hearing'
                            ? [8, 20, 12, 24, 8]
                            : [4, 8, 4, 8, 4],
                        }}
                        transition={{
                          duration: 0.8,
                          repeat: Infinity,
                          delay: i * 0.1,
                          ease: 'easeInOut',
                        }}
                      />
                    ))}
                  </div>
                  {interimTranscript ? (
                    <p className="text-sm text-[#f5f0e8]/90 italic">
                      &ldquo;{interimTranscript}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs text-[#f5f0e8]/50">
                      {vadSupported
                        ? t('companion.speakNow', 'Speak now... I\'m listening')
                        : t('companion.speakNowTap', 'Speak now...')
                      }
                    </p>
                  )}
                </div>
              )}

              {/* Messages */}
              {isResponding && messages.slice(-4).map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[90%] rounded-2xl px-3 py-2 text-sm ${
                      msg.role === 'user'
                        ? 'bg-gradient-to-br from-[#d4a44c] to-[#c8943a] text-white'
                        : 'bg-slate-800/80 text-slate-100 border border-[#d4a44c]/10'
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              ))}

              {/* Wisdom citation chip */}
              {isResponding && lastCompanionMessage?.wisdomUsed && (
                <div className="flex justify-start">
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#d4a44c]/20 bg-[#d4a44c]/10 px-2.5 py-0.5 text-[10px] text-[#d4a44c]">
                    <span>📖</span>
                    {lastCompanionMessage.wisdomUsed.verse_ref} — {lastCompanionMessage.wisdomUsed.principle}
                  </span>
                </div>
              )}

              {/* Processing indicator */}
              {isProcessing && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/80 rounded-2xl px-4 py-2.5 border border-[#d4a44c]/10">
                    <div className="flex items-center gap-1.5">
                      {[0, 1, 2].map(i => (
                        <div
                          key={i}
                          className="w-1.5 h-1.5 bg-[#d4a44c]/60 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-red-400/80 text-center px-2">{error}</p>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* ── Tool Suggestion ── */}
            {toolSuggestion && isResponding && (
              <div className="border-t border-white/5 px-4 py-2">
                <Link
                  href={toolSuggestion.tool?.route || `/tools/${toolSuggestion.tool?.id}`}
                  onClick={handleClose}
                  className="group flex items-center gap-2 rounded-xl border border-[#d4a44c]/15 bg-gradient-to-r from-[#d4a44c]/10 to-transparent px-3 py-2 transition-all hover:border-[#d4a44c]/30"
                >
                  <span className="text-base">{toolSuggestion.tool?.icon || '✨'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#f5f0e8] truncate">
                      {toolSuggestion.tool?.name || 'Suggested Tool'}
                    </p>
                    <p className="text-[10px] text-[#f5f0e8]/60 truncate">
                      {toolSuggestion.reason || 'May help with what you shared'}
                    </p>
                  </div>
                  <svg className="w-3.5 h-3.5 text-[#d4a44c]/40 group-hover:text-[#d4a44c]/70 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            )}

            {/* ── Quick Tools Row ── */}
            {isResponding && !toolSuggestion && (
              <div className="border-t border-white/5 px-3 py-2">
                <div className="flex items-center gap-1">
                  {TOOL_LINKS.map(tool => (
                    <Link
                      key={tool.id}
                      href={tool.href}
                      onClick={handleClose}
                      className="flex-1 flex items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/[0.03] px-1.5 py-1.5 text-[10px] text-[#f5f0e8]/70 hover:bg-white/[0.06] hover:text-[#f5f0e8] transition-all"
                      title={tool.label}
                    >
                      <span className="text-xs">{tool.icon}</span>
                      <span className="hidden md:inline truncate">{tool.label}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* ── Text Input Area ── */}
            {isResponding && (
              <div className="border-t border-white/5 px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputText}
                    onChange={e => { setInputText(e.target.value); cancelAutoCollapse() }}
                    onKeyDown={handleKeyDown}
                    placeholder={t('companion.typeMessage', 'Share what\'s on your mind...')}
                    className="flex-1 bg-slate-800/60 text-slate-100 placeholder-slate-500 rounded-xl px-3 py-2 text-sm border border-[#d4a44c]/15 focus:outline-none focus:ring-1 focus:ring-[#d4a44c]/40"
                    disabled={isProcessing}
                    maxLength={2000}
                    aria-label={t('companion.typeMessage', 'Type a message')}
                  />
                  {/* Send button */}
                  <motion.button
                    onClick={handleTextSubmit}
                    disabled={!inputText.trim() || isProcessing}
                    className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-r from-[#d4a44c] to-[#c8943a] text-white disabled:opacity-40 disabled:cursor-not-allowed"
                    whileTap={{ scale: 0.9 }}
                    aria-label={t('common.send', 'Send')}
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </motion.button>
                  {/* Shankha mic button (re-activate listening) */}
                  <motion.button
                    onClick={() => {
                      triggerHaptic('medium')
                      setMode('listening')
                    }}
                    disabled={isProcessing}
                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#d4a44c]/20 bg-[#d4a44c]/10 text-[#d4a44c] disabled:opacity-40"
                    whileTap={{ scale: 0.9 }}
                    aria-label={t('companion.startVoice', 'Start voice input')}
                  >
                    <ShankhaIcon size={16} color="currentColor" strokeWidth={2} />
                  </motion.button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shankha FAB (Floating Action Button) ── */}
      <motion.button
        onClick={handleShankhaPress}
        variants={fabVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        animate={
          isListening
            ? { scale: [1, 1.05, 1], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } }
            : isTTSSpeaking
            ? { scale: [1, 1.03, 1], transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } }
            : mode === 'dormant'
            ? {
                boxShadow: [
                  '0 8px 30px rgba(212, 164, 76, 0.3)',
                  '0 12px 40px rgba(212, 164, 76, 0.5)',
                  '0 8px 30px rgba(212, 164, 76, 0.3)',
                ],
                transition: { boxShadow: { duration: 3, repeat: Infinity, ease: 'easeInOut' } },
              }
            : {}
        }
        className="relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg md:h-16 md:w-16"
        style={{ background: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 50%, #f0c96d 100%)' }}
        aria-label={
          isListening
            ? t('companion.stopListening', 'Stop listening')
            : t('companion.talkToKiaan', 'Talk to KIAAN')
        }
        aria-expanded={isPanelOpen}
      >
        {/* Inner glow ring */}
        <span
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.2)' }}
        />

        {/* Sound wave rings when listening */}
        {isListening && (
          <>
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
                className="absolute inset-0 rounded-full border border-[#d4a44c]/30 pointer-events-none"
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  delay: i * 0.4,
                  ease: 'easeOut',
                }}
              />
            ))}
          </>
        )}

        {/* Shankha Icon */}
        <ShankhaIcon
          size={isPanelOpen ? 22 : 24}
          color="white"
          strokeWidth={1.8}
          filled={isListening || isTTSSpeaking}
          className="relative z-10 md:hidden"
        />
        <ShankhaIcon
          size={isPanelOpen ? 24 : 28}
          color="white"
          strokeWidth={1.8}
          filled={isListening || isTTSSpeaking}
          className="relative z-10 hidden md:block"
        />

        {/* Wake word active indicator (tiny pulse dot) */}
        {wakeWordSupported && isWakeWordListening && mode === 'dormant' && (
          <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
            <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-400" />
          </span>
        )}
      </motion.button>
    </div>
  )
}

export default KiaanVoiceCompanionFooter
