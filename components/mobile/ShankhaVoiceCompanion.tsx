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

import { useState, useCallback, useEffect, useRef } from 'react'
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
  const [sessionId] = useState(`local_${Date.now()}`)
  const [mounted, setMounted] = useState(false)

  // Refs
  const mountedRef = useRef(true)
  const friendEngineRef = useRef(new KiaanFriendEngine())
  const panelRef = useRef<HTMLDivElement>(null)
  const autoCollapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const wakeWordWasActiveRef = useRef(false)
  const speakRef = useRef<(text: string) => void>()
  const addLocalFallbackRef = useRef<(text: string) => void>()
  const modeRef = useRef<ShankhaMode>(mode)

  const isVoiceConflictPage = pathname === '/m/companion' || pathname === '/m/kiaan'

  useEffect(() => {
    setMounted(true)
    return () => { mountedRef.current = false; if (autoCollapseTimerRef.current) clearTimeout(autoCollapseTimerRef.current) }
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
      const timer = setTimeout(() => { if (mountedRef.current) startWakeWordListening() }, 1000)
      return () => clearTimeout(timer)
    }
  }, [mounted, wakeWordSupported, isVoiceConflictPage, mode, isWakeWordListening, startWakeWordListening])

  // ── Send Message ──
  const sendMessage = useCallback(async (text: string) => {
    if (!text.trim() || isProcessing) return
    const userMsg: CompanionMessage = { id: `user-${Date.now()}`, role: 'user', content: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsProcessing(true)
    setError(null)
    setMode('responding')

    try {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 15000)
      const response = await apiFetch('/api/companion/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, message: text.trim(), language: language || 'en', content_type: 'text' }),
        signal: controller.signal,
      })
      clearTimeout(timeout)

      if (response.ok) {
        const data = await response.json()
        if (data?.response && mountedRef.current) {
          const companionMsg: CompanionMessage = {
            id: data.message_id || `companion-${Date.now()}`, role: 'companion',
            content: data.response, mood: data.mood || 'neutral', wisdomUsed: data.wisdom_used || null,
          }
          setMessages(prev => [...prev, companionMsg])
          setToolSuggestion(detectToolSuggestion(text.trim(), data.mood))
          speakRef.current?.(data.response)
          return
        }
      }
      addLocalFallbackRef.current?.(text.trim())
    } catch {
      addLocalFallbackRef.current?.(text.trim())
    } finally {
      if (mountedRef.current) setIsProcessing(false)
    }
  }, [isProcessing, sessionId, language])

  const addLocalFallback = useCallback((userText: string) => {
    if (!mountedRef.current) return
    const result = friendEngineRef.current.processMessage(userText)
    const companionMsg: CompanionMessage = {
      id: `companion-${Date.now()}`, role: 'companion',
      content: result.response, mood: result.mood, wisdomUsed: result.wisdom_used,
    }
    setMessages(prev => [...prev, companionMsg])
    setMode('responding')
    setToolSuggestion(detectToolSuggestion(userText, result.mood))
    speakRef.current?.(result.response)
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

  const { isSpeaking: isTTSSpeaking, speak, cancel: cancelTTS } = useEnhancedVoiceOutput({
    language: language || 'en', voiceType: 'friendly', useBackendTts: true,
    onStart: handleTTSStart, onEnd: handleTTSEnd,
  })

  // Keep refs in sync with latest values
  useEffect(() => { speakRef.current = speak; addLocalFallbackRef.current = addLocalFallback; modeRef.current = mode })

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
      className="fixed z-[60]"
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

      {/* Shankha FAB */}
      <motion.button
        onClick={handleShankhaPress}
        className="relative flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          background: fabBackground,
          border: `2px solid ${fabBorderColor}`,
          boxShadow: '0 8px 32px rgba(5,7,20,0.8), 0 0 20px rgba(27,79,187,0.3)',
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
            {[0, 1, 2].map(i => (
              <motion.span
                key={i}
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
      </motion.button>
    </div>
  )
}

export default ShankhaVoiceCompanion
