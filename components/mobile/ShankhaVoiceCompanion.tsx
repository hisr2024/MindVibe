'use client'

/**
 * ShankhaVoiceCompanion — Mobile-native Shankha FAB + conversation panel.
 *
 * The sacred conch shell voice companion that appears on every mobile page.
 * 4 modes: dormant → listening → responding → expanded
 *
 * Reuses: useWakeWord, useHandsFreeMode, useEnhancedVoiceOutput,
 * KiaanFriendEngine, ecosystemNavigator (exact desktop parity).
 *
 * Position management:
 *   - Normal: bottom-right above tab bar
 *   - During sadhana breathwork: hidden
 *   - During vibe player expanded: hidden
 *   - During sadhana verse/reflection: reduced opacity
 */

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { useWakeWord } from '@/hooks/useWakeWord'
import { useHandsFreeMode } from '@/hooks/useHandsFreeMode'
import { useEnhancedVoiceOutput } from '@/hooks/useEnhancedVoiceOutput'
import { useLanguage } from '@/hooks/useLanguage'
import { useHapticFeedback } from '@/hooks'
import { ShankhaIcon } from '@/components/icons/ShankhaIcon'
import { ShankhaPanel } from './ShankhaPanel'
import { apiFetch } from '@/lib/api'
import { KiaanFriendEngine } from '@/lib/kiaan-friend-engine'
import { detectToolSuggestion, type ToolSuggestion } from '@/utils/voice/ecosystemNavigator'

// ─── Types ──────────────────────────────────────────────────────────────────

type ShankhaMode = 'dormant' | 'listening' | 'responding' | 'expanded'

interface CompanionMessage {
  id: string
  role: 'user' | 'companion'
  content: string
  mood?: string
  wisdomUsed?: { principle: string; verse_ref: string } | null
}

// ─── Component ──────────────────────────────────────────────────────────────

export function ShankhaVoiceCompanion() {
  const pathname = usePathname()
  const { language } = useLanguage()
  const { triggerHaptic } = useHapticFeedback()

  // Core state
  const [mode, setMode] = useState<ShankhaMode>('dormant')
  const [messages, setMessages] = useState<CompanionMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [toolSuggestion, setToolSuggestion] = useState<ToolSuggestion | null>(null)
  // P2-25: Use cryptographically random session id instead of predictable Date.now()
  const [sessionId] = useState(() => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return `local_${crypto.randomUUID()}`
    }
    // Fallback for very old browsers: timestamp + high-entropy random
    return `local_${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
  })
  const [mounted, setMounted] = useState(false)

  // Refs
  const mountedRef = useRef(true)
  const friendEngineRef = useRef(new KiaanFriendEngine())
  const panelRef = useRef<HTMLDivElement>(null)
  const fabRef = useRef<HTMLButtonElement>(null) // P1-15: focus return target
  const autoCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // P0-5: Named timer ref so unmount cleanup can clear the pending wake-word
  // restart timer. Hands-free resume uses effect-scoped cleanup (line 288) so
  // no separate ref is needed there — React calls the effect cleanup on unmount.
  const wakeWordResumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wakeWordWasActiveRef = useRef(false)
  const modeRef = useRef<ShankhaMode>(mode)
  // P0-4 / P2-26: In-flight guard + rate limit window + abort controller
  const inflightRef = useRef(false)
  const requestTimestampsRef = useRef<number[]>([])
  const abortRef = useRef<AbortController | null>(null)

  const isVoiceConflictPage = pathname === '/m/companion' || pathname === '/m/kiaan'

  useEffect(() => {
    setMounted(true)
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      // P0-5: Clear outstanding component-level timers
      if (autoCollapseTimerRef.current) { clearTimeout(autoCollapseTimerRef.current); autoCollapseTimerRef.current = null }
      if (wakeWordResumeTimerRef.current) { clearTimeout(wakeWordResumeTimerRef.current); wakeWordResumeTimerRef.current = null }
      // Abort any in-flight companion request so no post-unmount state updates fire
      try { abortRef.current?.abort() } catch {}
    }
  }, [])

  // ── Wake Word ──
  const handleWakeWordDetected = useCallback(() => {
    if (!mountedRef.current) return
    triggerHaptic('medium')
    setMode('listening')
    setError(null)
  }, [triggerHaptic])

  const {
    isListening: isWakeWordListening,
    startWakeWordListening,
    stopWakeWordListening,
    wakeWordSupported,
  } = useWakeWord({ onWakeWordDetected: handleWakeWordDetected, language: language || 'en' })

  useEffect(() => {
    if (!mounted || !wakeWordSupported || isVoiceConflictPage) return
    if (mode === 'dormant' && !isWakeWordListening) {
      // P0-5: Use named timer ref so unmount cleanup can cancel it
      wakeWordResumeTimerRef.current = setTimeout(() => {
        if (mountedRef.current) startWakeWordListening()
      }, 1000)
      return () => {
        if (wakeWordResumeTimerRef.current) {
          clearTimeout(wakeWordResumeTimerRef.current)
          wakeWordResumeTimerRef.current = null
        }
      }
    }
  }, [mounted, wakeWordSupported, isVoiceConflictPage, mode, isWakeWordListening, startWakeWordListening])

  // ── Send Message ──
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return
    // P2-26: Rate limit — max 1 in-flight request
    if (inflightRef.current) return
    // P2-26: Rolling window — max 6 requests/minute
    const now = Date.now()
    const oneMinuteAgo = now - 60_000
    requestTimestampsRef.current = requestTimestampsRef.current.filter(t => t > oneMinuteAgo)
    if (requestTimestampsRef.current.length >= 6) {
      const oldestInWindow = requestTimestampsRef.current[0]
      const resetIn = Math.max(1, Math.ceil((oldestInWindow + 60_000 - now) / 1000))
      setError(`Please wait ${resetIn}s before sending another message`)
      return
    }
    requestTimestampsRef.current.push(now)

    const userMsg: CompanionMessage = { id: `user-${Date.now()}`, role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsProcessing(true)
    setError(null)
    setMode('responding')

    // P1-17: If offline, skip fetch and use local fallback immediately
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      addLocalFallbackRef.current?.(text.trim())
      if (mountedRef.current) setIsProcessing(false)
      return
    }

    // P0-4: Use a shared abort controller so unmount cleanup can cancel
    const controller = new AbortController()
    abortRef.current = controller
    inflightRef.current = true
    const timeout = setTimeout(() => controller.abort(), 15000)
    try {
      const response = await apiFetch('/api/companion/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text.trim(), language: language || 'en', content_type: 'text' }),
        signal: controller.signal,
      })

      // P0-4: Gate EVERY state mutation post-await
      if (!mountedRef.current) return

      if (response.ok) {
        const data = await response.json()
        if (!mountedRef.current) return
        if (data?.response) {
          const companionMsg: CompanionMessage = {
            id: data.message_id || `companion-${Date.now()}`, role: 'companion',
            content: data.response, mood: data.mood || 'neutral', wisdomUsed: data.wisdom_used || null,
          }
          setMessages(prev => [...prev, companionMsg])
          if (!mountedRef.current) return
          setToolSuggestion(detectToolSuggestion(text.trim(), data.mood))
          // P0-7: Explicit guard + error surface instead of silent drop
          if (speakRef.current) {
            try { speakRef.current(data.response) } catch (e) { console.error('[Shankha] TTS failed', e) }
          } else {
            console.error('[Shankha] TTS not ready when response arrived')
          }
          return
        }
      }
      addLocalFallbackRef.current?.(text.trim())
    } catch (err) {
      // Swallow deliberate aborts (unmount / navigation away)
      if (!(err instanceof Error && err.name === 'AbortError')) {
        if (mountedRef.current) addLocalFallbackRef.current?.(text.trim())
      }
    } finally {
      clearTimeout(timeout)
      inflightRef.current = false
      if (abortRef.current === controller) abortRef.current = null
      if (mountedRef.current) setIsProcessing(false)
    }
  }, [isProcessing, sessionId, language])

  const addLocalFallback = useCallback((userText: string) => {
    if (!mountedRef.current) return
    try {
      const result = friendEngineRef.current.processMessage(userText)
      const companionMsg: CompanionMessage = {
        id: `companion-${Date.now()}`, role: 'companion',
        content: result.response, mood: result.mood, wisdomUsed: result.wisdom_used,
      }
      setMessages(prev => [...prev, companionMsg])
      setMode('responding')
      setToolSuggestion(detectToolSuggestion(userText, result.mood))
      speakRef.current?.(result.response)
    } catch {
      // Friend engine failed — show compassionate fallback
      const fallbackMsg: CompanionMessage = {
        id: `companion-${Date.now()}`, role: 'companion',
        content: 'I\'m here with you. Take a moment to breathe deeply.',
        mood: 'neutral', wisdomUsed: null,
      }
      setMessages(prev => [...prev, fallbackMsg])
      setMode('responding')
    }
  }, [])

  // ── TTS ──
  const handleTTSEnd = useCallback(() => {
    if (!mountedRef.current) return
    autoCollapseTimerRef.current = setTimeout(() => {
      if (mountedRef.current && modeRef.current === 'responding') setMode('dormant')
    }, 3000)
  }, [])

  const handleTTSStart = useCallback(() => {
    if (autoCollapseTimerRef.current) { clearTimeout(autoCollapseTimerRef.current); autoCollapseTimerRef.current = null }
  }, [])

  const { isSpeaking: isTTSSpeaking, speak, cancel: cancelTTS, ttsMode } = useEnhancedVoiceOutput({
    language: language || 'en', voiceType: 'friendly', useBackendTts: true,
    onStart: handleTTSStart, onEnd: handleTTSEnd,
  })

  // Stable refs — initialized with actual values, kept in sync via effect.
  // P0-1: Use useLayoutEffect with explicit deps so refs flush synchronously
  // before paint. handleTTSEnd reads modeRef.current inside a 3s setTimeout;
  // with useEffect there is a concurrent-rendering window where the timer
  // fires before the effect and reads a stale mode, causing the panel to
  // auto-collapse mid-conversation.
  const speakRef = useRef(speak)
  const addLocalFallbackRef = useRef(addLocalFallback)
  useLayoutEffect(() => {
    speakRef.current = speak
    addLocalFallbackRef.current = addLocalFallback
    modeRef.current = mode
  }, [speak, addLocalFallback, mode])

  // ── Hands-Free VAD ──
  const handleTranscript = useCallback((text: string) => {
    if (!mountedRef.current || !text.trim()) return
    sendMessage(text)
  }, [sendMessage])

  const {
    isActive: isHandsFreeActive, state: handsFreeState,
    activate: activateHandsFree, deactivate: deactivateHandsFree,
    interimTranscript, vadSupported,
  } = useHandsFreeMode({
    language: language || 'en', onTranscript: handleTranscript,
    conversational: false, isProcessing, onBargeIn: () => cancelTTS(),
  })

  // ── Mode transitions ──
  useEffect(() => {
    if (mode === 'listening') {
      if (isWakeWordListening) { wakeWordWasActiveRef.current = true; stopWakeWordListening() }
      if (!isHandsFreeActive) {
        const timer = setTimeout(() => { if (mountedRef.current) activateHandsFree() }, 500)
        return () => clearTimeout(timer)
      }
    }
  }, [mode, isWakeWordListening, isHandsFreeActive, stopWakeWordListening, activateHandsFree])

  useEffect(() => {
    if (mode === 'dormant') {
      if (isHandsFreeActive) deactivateHandsFree()
      if (wakeWordWasActiveRef.current && wakeWordSupported && !isWakeWordListening && !isVoiceConflictPage) {
        wakeWordWasActiveRef.current = false
        const timer = setTimeout(() => { if (mountedRef.current) startWakeWordListening() }, 400)
        return () => clearTimeout(timer)
      }
    }
  }, [mode, isHandsFreeActive, deactivateHandsFree, wakeWordSupported, isWakeWordListening, isVoiceConflictPage, startWakeWordListening])

  // ── User Actions ──
  const handleShankhaPress = useCallback(() => {
    triggerHaptic('medium')
    if (mode === 'dormant') { setMode('listening'); setError(null) }
    else if (mode === 'listening') { deactivateHandsFree(); setMode('dormant') }
    else if (mode === 'responding' || mode === 'expanded') { setMode(prev => prev === 'expanded' ? 'responding' : 'expanded') }
  }, [mode, triggerHaptic, deactivateHandsFree])

  const handleClose = useCallback(() => {
    cancelTTS(); deactivateHandsFree()
    if (autoCollapseTimerRef.current) { clearTimeout(autoCollapseTimerRef.current); autoCollapseTimerRef.current = null }
    setMode('dormant'); setToolSuggestion(null); triggerHaptic('light')
    // P1-15: Return focus to the FAB after the panel exit animation settles,
    // so keyboard users can easily re-open the companion.
    if (typeof requestAnimationFrame !== 'undefined') {
      requestAnimationFrame(() => { fabRef.current?.focus() })
    } else {
      fabRef.current?.focus()
    }
  }, [cancelTTS, deactivateHandsFree, triggerHaptic])

  const handleTextSubmit = useCallback(() => {
    if (!inputText.trim() || isProcessing) return
    sendMessage(inputText)
  }, [inputText, isProcessing, sendMessage])

  const cancelAutoCollapse = useCallback(() => {
    if (autoCollapseTimerRef.current) { clearTimeout(autoCollapseTimerRef.current); autoCollapseTimerRef.current = null }
  }, [])

  // ── Close on Escape ──
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape' && mode !== 'dormant') handleClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [mode, handleClose])

  // ── Close on tap/click outside ──
  useEffect(() => {
    if (mode === 'dormant') return
    const handler = (e: Event) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) handleClose()
    }
    const timer = setTimeout(() => document.addEventListener('pointerdown', handler), 10)
    return () => { clearTimeout(timer); document.removeEventListener('pointerdown', handler) }
  }, [mode, handleClose])

  if (!mounted) return null

  const isPanelOpen = mode !== 'dormant'
  const isListening = mode === 'listening'
  const isResponding = mode === 'responding' || mode === 'expanded'

  // ─── FAB Background by mode ──
  const fabBackground = isListening
    ? 'radial-gradient(circle, #0E7490, #050714)'
    : isResponding
    ? 'radial-gradient(circle, #D4A017 0%, #1B4FBB 60%, #050714 100%)'
    : 'radial-gradient(circle, #1B4FBB, #050714)'

  const fabBorderColor = isListening
    ? 'rgba(6,182,212,0.7)'
    : isResponding
    ? 'rgba(212,160,23,0.8)'
    : 'rgba(212,160,23,0.5)'

  const shankhaColor = isListening ? '#06B6D4' : isResponding ? '#D4A017' : '#D4A017'

  return (
    <div
      ref={panelRef}
      className="fixed z-[70]"
      style={{
        bottom: 'calc(72px + 12px + env(safe-area-inset-bottom, 0px))',
        right: 16,
      }}
    >
      {/* Panel */}
      <AnimatePresence mode="wait">
        {isPanelOpen && (
          <ShankhaPanel
            isListening={isListening}
            isResponding={isResponding}
            isProcessing={isProcessing}
            isTTSSpeaking={isTTSSpeaking}
            messages={messages}
            inputText={inputText}
            interimTranscript={interimTranscript}
            handsFreeState={handsFreeState as 'idle' | 'hearing' | 'processing'}
            vadSupported={vadSupported}
            toolSuggestion={toolSuggestion}
            error={error}
            onInputChange={setInputText}
            onSubmit={handleTextSubmit}
            onVoiceActivate={() => { triggerHaptic('medium'); setMode('listening') }}
            onClose={handleClose}
            onCancelAutoCollapse={cancelAutoCollapse}
          />
        )}
      </AnimatePresence>

      {/* Shankha FAB — P1-14: 64px meets WCAG 2.5.5 AAA, P1-15: focus target */}
      <motion.button
        ref={fabRef}
        onClick={handleShankhaPress}
        className="relative flex h-16 w-16 items-center justify-center rounded-full"
        style={{
          background: fabBackground,
          border: `2px solid ${fabBorderColor}`,
          boxShadow: '0 8px 32px rgba(5,7,20,0.8), 0 0 20px rgba(27,79,187,0.3)',
          touchAction: 'manipulation',
        }}
        whileTap={{ scale: 0.92 }}
        animate={
          isListening
            ? { scale: [1, 1.1, 1], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } }
            : isTTSSpeaking
            ? { scale: [1, 1.03, 1], transition: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' } }
            : mode === 'dormant'
            ? { boxShadow: [
                '0 8px 30px rgba(212,160,23,0.2), 0 0 20px rgba(27,79,187,0.2)',
                '0 12px 40px rgba(212,160,23,0.35), 0 0 30px rgba(27,79,187,0.3)',
                '0 8px 30px rgba(212,160,23,0.2), 0 0 20px rgba(27,79,187,0.2)',
              ], transition: { boxShadow: { duration: 4, repeat: Infinity, ease: 'easeInOut' } } }
            : {}
        }
        aria-label={isListening ? 'Stop listening' : 'Talk to KIAAN'}
        aria-expanded={isPanelOpen}
      >
        {/* Sound wave rings when listening */}
        {isListening && (
          <>
            {/* P0-6: Stable string keys for consistency (fixed-length list) */}
            {[0, 1, 2].map(i => (
              <motion.span
                key={`ring-${i}`}
                className="absolute inset-0 rounded-full border pointer-events-none"
                style={{ borderColor: 'rgba(6,182,212,0.3)' }}
                initial={{ scale: 1, opacity: 0.6 }}
                animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.5, ease: 'easeOut' }}
              />
            ))}
          </>
        )}

        {/* Shankha Icon */}
        <ShankhaIcon
          size={isPanelOpen ? 22 : 24}
          color={shankhaColor}
          strokeWidth={1.8}
          filled={isListening || isTTSSpeaking}
          className={`relative z-10 ${isTTSSpeaking ? 'animate-[spin_2s_linear_infinite]' : ''}`}
        />

        {/* Wake word dot */}
        {wakeWordSupported && isWakeWordListening && mode === 'dormant' && (
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#D4A017] opacity-50" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#D4A017]" />
          </span>
        )}

        {/* P1-20: Degraded TTS badge when premium backend is unavailable */}
        {ttsMode === 'browser' && (
          <span
            role="img"
            aria-label="Using browser voice synthesis — quality reduced"
            title="Using browser voice — reduced quality"
            className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-amber-500"
            style={{ border: '1px solid rgba(0,0,0,0.3)' }}
          />
        )}
      </motion.button>
    </div>
  )
}

export default ShankhaVoiceCompanion
