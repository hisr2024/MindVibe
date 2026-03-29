'use client'

/**
 * Mobile Companion Voice Player
 *
 * Premium voice playback for KIAAN companion messages, optimized for mobile:
 * - Voice persona indicator (Aura, Rishi, Nova, Orion) with divine styling
 * - Waveform visualization with golden gradient bars
 * - Play/Pause/Stop controls (44px+ touch targets)
 * - Mood-based voice auto-selection
 * - Premium audio (ElevenLabs/Sarvam/Edge TTS) with browser fallback
 * - Auto-play with user-interaction detection
 * - Compact inline + full panel modes
 * - Provider badge
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Play, Pause, Square, Loader2 } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

export interface MobileCompanionVoicePlayerProps {
  text: string
  mood?: string
  voiceId?: string
  language?: string
  autoPlay?: boolean
  onStart?: () => void
  onEnd?: () => void
  onStop?: () => void
  compact?: boolean
}

type PlaybackState = 'idle' | 'loading' | 'playing' | 'paused'

const VOICE_PERSONAS: Record<string, { name: string; color: string }> = {
  'sarvam-aura':      { name: 'Aura',  color: '#a78bfa' },
  'sarvam-rishi':     { name: 'Rishi', color: '#d4a44c' },
  'elevenlabs-nova':  { name: 'Nova',  color: '#60a5fa' },
  'elevenlabs-orion': { name: 'Orion', color: '#34d399' },
}

const MOOD_VOICE_MAP: Record<string, string> = {
  anxious: 'sarvam-aura', sad: 'sarvam-aura', angry: 'elevenlabs-orion',
  confused: 'elevenlabs-nova', lonely: 'sarvam-aura', hopeful: 'elevenlabs-nova',
  peaceful: 'sarvam-rishi', grateful: 'elevenlabs-nova', overwhelmed: 'sarvam-rishi',
  excited: 'elevenlabs-nova', neutral: 'elevenlabs-nova',
}

const LANG_TO_BCP47: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', sa: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
  bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN',
  pa: 'pa-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-BR',
  it: 'it-IT', nl: 'nl-NL', pl: 'pl-PL', sv: 'sv-SE', ru: 'ru-RU',
  ja: 'ja-JP', zh: 'zh-CN', 'zh-CN': 'zh-CN', ko: 'ko-KR',
  th: 'th-TH', vi: 'vi-VN', id: 'id-ID', ar: 'ar-SA', tr: 'tr-TR', sw: 'sw-KE',
}

export function MobileCompanionVoicePlayer({
  text,
  mood = 'neutral',
  voiceId,
  language = 'en',
  autoPlay = false,
  onStart,
  onEnd,
  onStop,
  compact = false,
}: MobileCompanionVoicePlayerProps) {
  const { triggerHaptic } = useHapticFeedback()
  const [state, setState] = useState<PlaybackState>('idle')
  const [provider, setProvider] = useState<string>('')
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(20).fill(0.1))
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const stateRef = useRef<PlaybackState>(state)

  useEffect(() => { stateRef.current = state }, [state])

  const effectiveVoiceId = voiceId || MOOD_VOICE_MAP[mood] || 'elevenlabs-nova'
  const persona = VOICE_PERSONAS[effectiveVoiceId] || VOICE_PERSONAS['elevenlabs-nova']

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
    }
  }, [])

  // Waveform animation
  const animateWaveform = useCallback(() => {
    const tick = () => {
      if (analyzerRef.current && stateRef.current === 'playing') {
        const data = new Uint8Array(analyzerRef.current.frequencyBinCount)
        analyzerRef.current.getByteFrequencyData(data)
        const barCount = 20
        const step = Math.floor(data.length / barCount)
        const bars: number[] = []
        for (let i = 0; i < barCount; i++) {
          bars.push(Math.max(0.08, data[i * step] / 255))
        }
        setWaveformBars(bars)
        animFrameRef.current = requestAnimationFrame(tick)
      } else if (stateRef.current === 'playing') {
        setWaveformBars(prev => prev.map(() => 0.15 + Math.random() * 0.7))
        animFrameRef.current = requestAnimationFrame(tick)
      }
    }
    tick()
  }, [])

  useEffect(() => {
    if (state === 'playing') {
      animateWaveform()
    } else if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [state, animateWaveform])

  const IDLE_BARS = useMemo(() => Array(20).fill(0.1) as number[], [])
  const displayBars = state === 'idle' ? IDLE_BARS : waveformBars

  // Browser TTS fallback
  const fallbackToBrowserTTS = useCallback((config?: { rate?: number; pitch?: number }) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setState('idle')
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = config?.rate || 0.93
    utterance.pitch = config?.pitch ? 1.0 + config.pitch * 0.1 : 1.0
    const bcp47Lang = LANG_TO_BCP47[language] || language
    utterance.lang = bcp47Lang

    const voices = window.speechSynthesis.getVoices()
    const preferFemale = effectiveVoiceId !== 'sarvam-rishi' && effectiveVoiceId !== 'elevenlabs-orion'
    const langVoices = voices.filter(v => v.lang.startsWith(bcp47Lang.split('-')[0]))
    let selected: SpeechSynthesisVoice | undefined
    if (langVoices.length > 0) {
      selected = langVoices.find(v =>
        preferFemale
          ? /female|woman|jenny|samantha|swara|pallavi|neerja|sobhana|denise|xiaoxiao|nanami/i.test(v.name)
          : /male|man|guy|daniel|david|madhur|prabhat|valluvar|conrad|keita|yunxi/i.test(v.name)
      ) || langVoices[0]
    } else {
      selected = voices.find(v =>
        preferFemale
          ? /Jenny|Samantha|Google.*Female|Aria|Natural/i.test(v.name)
          : /Guy|Daniel|David|Google.*Male/i.test(v.name)
      ) || voices.find(v => /Google|Natural|Neural/i.test(v.name))
    }
    if (selected) utterance.voice = selected

    utterance.onstart = () => { setState('playing'); setProvider('browser_fallback'); onStart?.() }
    utterance.onend = () => { setState('idle'); onEnd?.() }
    utterance.onerror = () => setState('idle')
    window.speechSynthesis.speak(utterance)
  }, [text, effectiveVoiceId, language, onStart, onEnd])

  // Main play function
  const playAudio = useCallback(async () => {
    if (state === 'playing') {
      if (audioRef.current) { audioRef.current.pause(); setState('paused') }
      return
    }
    if (state === 'paused' && audioRef.current) {
      try { await audioRef.current.play(); setState('playing') } catch { setState('idle') }
      return
    }

    setState('loading')
    triggerHaptic('medium')

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      try {
        const response = await apiFetch('/api/companion/voice/synthesize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, mood, voice_id: effectiveVoiceId, language }),
          signal: controller.signal,
        })

        if (response.ok) {
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('audio')) {
            const blob = await response.blob()
            if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
            const url = URL.createObjectURL(blob)
            blobUrlRef.current = url

            const audio = new Audio(url)
            audioRef.current = audio

            try {
              if (!audioContextRef.current) audioContextRef.current = new AudioContext()
              const source = audioContextRef.current.createMediaElementSource(audio)
              const analyzer = audioContextRef.current.createAnalyser()
              analyzer.fftSize = 64
              source.connect(analyzer)
              analyzer.connect(audioContextRef.current.destination)
              analyzerRef.current = analyzer
            } catch {
              // AudioContext not available
            }

            audio.onplay = () => {
              setState('playing')
              setProvider(response.headers.get('x-voice-provider') || 'premium')
              onStart?.()
              triggerHaptic('light')
            }
            audio.onended = () => { setState('idle'); onEnd?.() }
            audio.onerror = () => { setState('idle'); fallbackToBrowserTTS() }

            try { await audio.play() } catch { setState('idle'); fallbackToBrowserTTS() }
            return
          }

          const data = await response.json()
          if (data.fallback_to_browser) {
            fallbackToBrowserTTS(data.browser_config)
            return
          }
        }
      } finally {
        clearTimeout(timeoutId)
      }
    } catch {
      // Backend unavailable
    }

    fallbackToBrowserTTS()
  }, [text, mood, effectiveVoiceId, language, state, onStart, onEnd, fallbackToBrowserTTS, triggerHaptic])

  const stopAudio = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0 }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) window.speechSynthesis.cancel()
    setState('idle')
    triggerHaptic('light')
    onStop?.()
    onEnd?.()
  }, [onStop, onEnd, triggerHaptic])

  // User interaction tracking for autoplay
  const userInteractedRef = useRef(false)
  useEffect(() => {
    if (userInteractedRef.current) return
    const markInteracted = () => {
      userInteractedRef.current = true
      window.removeEventListener('click', markInteracted, true)
      window.removeEventListener('touchstart', markInteracted, true)
    }
    window.addEventListener('click', markInteracted, true)
    window.addEventListener('touchstart', markInteracted, true)
    return () => {
      window.removeEventListener('click', markInteracted, true)
      window.removeEventListener('touchstart', markInteracted, true)
    }
  }, [])

  // Auto-play
  useEffect(() => {
    if (autoPlay && state === 'idle' && text && userInteractedRef.current) {
      const timer = setTimeout(() => playAudio(), 300)
      return () => clearTimeout(timer)
    }
  }, [autoPlay, text, state, playAudio])

  // ===== COMPACT MODE =====
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={playAudio}
          disabled={state === 'loading'}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            state === 'playing'
              ? 'bg-[#d4a44c]/20 text-[#e8b54a]'
              : state === 'loading'
              ? 'bg-white/[0.06] text-white/40'
              : 'bg-white/[0.06] text-white/60'
          }`}
          aria-label={state === 'playing' ? 'Pause' : 'Listen'}
        >
          {state === 'loading' ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : state === 'playing' ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          {state === 'playing' ? 'Pause' : 'Listen'}
        </motion.button>

        {(state === 'playing' || state === 'paused') && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={stopAudio}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs bg-red-500/15 text-red-400 font-medium"
            aria-label="Stop"
          >
            <Square className="w-3 h-3 fill-current" />
            Stop
          </motion.button>
        )}
      </span>
    )
  }

  // ===== FULL MODE =====
  return (
    <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-3 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        {/* Play/Pause button */}
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={playAudio}
          disabled={state === 'loading'}
          className={`flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            state === 'playing'
              ? 'bg-[#d4a44c] text-white shadow-lg shadow-[#d4a44c]/30'
              : state === 'loading'
              ? 'bg-white/[0.08] text-white/40 animate-pulse'
              : 'bg-[#d4a44c]/15 text-[#e8b54a]'
          }`}
          aria-label={state === 'playing' ? 'Pause' : state === 'paused' ? 'Resume' : 'Play'}
        >
          {state === 'loading' ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : state === 'playing' ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </motion.button>

        {/* Waveform visualization */}
        <div className="flex-1 flex items-center gap-[2px] h-8">
          {displayBars.map((height, i) => (
            <div
              key={i}
              className="flex-1 rounded-full transition-all duration-75"
              style={{
                height: `${Math.max(12, height * 100)}%`,
                minHeight: 3,
                background: state === 'playing'
                  ? 'linear-gradient(to top, #d4a44c, #e8b54a)'
                  : 'rgba(255,255,255,0.12)',
              }}
            />
          ))}
        </div>

        {/* Stop button */}
        {(state === 'playing' || state === 'paused') && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.9 }}
            onClick={stopAudio}
            className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center bg-white/[0.06] text-white/50 active:text-red-400 transition-all"
            aria-label="Stop"
          >
            <Square className="w-4 h-4 fill-current" />
          </motion.button>
        )}

        {/* Voice persona indicator */}
        <div className="flex-shrink-0 text-right">
          <p className="text-[10px] font-semibold" style={{ color: persona.color }}>
            {persona.name}
          </p>
          {provider && (
            <p className="text-[8px] text-white/30">
              {provider === 'elevenlabs' ? 'ElevenLabs HD' :
               provider === 'sarvam_ai_bulbul' ? 'Sarvam AI' :
               provider === 'edge_tts' ? 'Edge TTS' :
               provider === 'browser_fallback' ? 'Local' : 'HD'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default MobileCompanionVoicePlayer
