'use client'

/**
 * CompanionVoicePlayer - Premium voice playback for KIAAN messages.
 *
 * ElevenLabs-inspired voice player that:
 * - Fetches premium audio from backend (ElevenLabs / Sarvam AI / Bhashini AI)
 * - Falls back to browser Speech Synthesis with emotion-adapted params
 * - Shows voice waveform visualization during playback
 * - Supports play/pause/stop controls
 * - Indicates which voice persona is speaking
 * - Adapts voice based on detected mood
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { apiFetch } from '@/lib/api'

export interface VoicePlayerProps {
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

const VOICE_PERSONAS: Record<string, { name: string; color: string; icon: string }> = {
  'sarvam-aura': { name: 'Aura', color: 'text-violet-600', icon: '🎙️' },
  'sarvam-rishi': { name: 'Rishi', color: 'text-amber-600', icon: '🎙️' },
  'elevenlabs-nova': { name: 'Nova', color: 'text-blue-600', icon: '🎙️' },
  'elevenlabs-orion': { name: 'Orion', color: 'text-emerald-600', icon: '🎙️' },
}

// Mood-to-default voice mapping (auto-select best voice per emotion)
const MOOD_VOICE_MAP: Record<string, string> = {
  anxious: 'sarvam-aura',
  sad: 'sarvam-aura',
  angry: 'elevenlabs-orion',
  confused: 'elevenlabs-nova',
  lonely: 'sarvam-aura',
  hopeful: 'elevenlabs-nova',
  peaceful: 'sarvam-rishi',
  grateful: 'elevenlabs-nova',
  overwhelmed: 'sarvam-rishi',
  excited: 'elevenlabs-nova',
  neutral: 'elevenlabs-nova',
}

// Map language code to BCP-47 for browser SpeechSynthesis
const LANG_TO_BCP47: Record<string, string> = {
  en: 'en-IN', hi: 'hi-IN', sa: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
  bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN',
  pa: 'pa-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-BR',
  ja: 'ja-JP', zh: 'zh-CN', ar: 'ar-SA',
}

export default function CompanionVoicePlayer({
  text,
  mood = 'neutral',
  voiceId,
  language = 'en',
  autoPlay = false,
  onStart,
  onEnd,
  onStop,
  compact = false,
}: VoicePlayerProps) {
  const [state, setState] = useState<PlaybackState>('idle')
  const [provider, setProvider] = useState<string>('')
  const [waveformBars, setWaveformBars] = useState<number[]>(Array(20).fill(0.1))
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const animFrameRef = useRef<number | null>(null)
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const stateRef = useRef<PlaybackState>(state)

  // Keep stateRef in sync via effect to avoid ref-during-render lint error
  useEffect(() => {
    stateRef.current = state
  }, [state])

  // Auto-select voice based on mood if not specified
  const effectiveVoiceId = voiceId || MOOD_VOICE_MAP[mood] || 'elevenlabs-nova'
  const persona = VOICE_PERSONAS[effectiveVoiceId] || VOICE_PERSONAS['elevenlabs-nova']

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {})
      }
    }
  }, [])

  // Waveform animation using ref to avoid self-reference in useCallback
  const animateWaveform = useCallback(() => {
    const tick = () => {
      if (analyzerRef.current && stateRef.current === 'playing') {
        const data = new Uint8Array(analyzerRef.current.frequencyBinCount)
        analyzerRef.current.getByteFrequencyData(data)

        const barCount = 20
        const step = Math.floor(data.length / barCount)
        const bars: number[] = []
        for (let i = 0; i < barCount; i++) {
          const value = data[i * step] / 255
          bars.push(Math.max(0.08, value))
        }
        setWaveformBars(bars)
        animFrameRef.current = requestAnimationFrame(tick)
      } else if (stateRef.current === 'playing') {
        // Simulated waveform when AudioContext isn't available
        setWaveformBars(prev =>
          prev.map(() => 0.15 + Math.random() * 0.7)
        )
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

  // Derive display bars: show flat bars when idle, animated bars when playing
  const IDLE_BARS = useMemo(() => Array(20).fill(0.1) as number[], [])
  const displayBars = state === 'idle' ? IDLE_BARS : waveformBars

  // Browser TTS fallback — declared BEFORE playAudio so it can be referenced
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

    // Select best available voice matching the language and gender preference
    const voices = window.speechSynthesis.getVoices()
    const preferFemale = effectiveVoiceId !== 'sarvam-rishi' && effectiveVoiceId !== 'elevenlabs-orion'

    // First, try to find a voice that matches the selected language
    const langVoices = voices.filter(v => v.lang.startsWith(bcp47Lang.split('-')[0]))

    let selected: SpeechSynthesisVoice | undefined
    if (langVoices.length > 0) {
      // Prefer gender-matching voice within the target language
      selected = langVoices.find(v =>
        preferFemale
          ? /female|woman|jenny|samantha|swara|pallavi|neerja|sobhana|denise|xiaoxiao|nanami/i.test(v.name)
          : /male|man|guy|daniel|david|madhur|prabhat|valluvar|conrad|keita|yunxi/i.test(v.name)
      ) || langVoices[0]
    } else {
      // No language-specific voice available; fall back to English voice selection
      selected = voices.find(v =>
        preferFemale
          ? /Jenny|Samantha|Google.*Female|Aria|Natural/i.test(v.name)
          : /Guy|Daniel|David|Google.*Male/i.test(v.name)
      ) || voices.find(v => /Google|Natural|Neural/i.test(v.name))
    }
    if (selected) utterance.voice = selected

    utterance.onstart = () => {
      setState('playing')
      setProvider('browser')
      onStart?.()
    }
    utterance.onend = () => {
      setState('idle')
      onEnd?.()
    }
    utterance.onerror = () => setState('idle')

    window.speechSynthesis.speak(utterance)
  }, [text, effectiveVoiceId, language, onStart, onEnd])

  // Main play function — uses fallbackToBrowserTTS which is declared above
  const playAudio = useCallback(async () => {
    if (state === 'playing') {
      // Pause
      if (audioRef.current) {
        audioRef.current.pause()
        setState('paused')
      }
      return
    }

    if (state === 'paused' && audioRef.current) {
      // Resume
      try {
        await audioRef.current.play()
        setState('playing')
      } catch {
        setState('idle')
      }
      return
    }

    setState('loading')

    // Try backend premium voice first (15s timeout to prevent indefinite loading state)
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 15000)
      const response = await apiFetch('/api/companion/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          mood,
          voice_id: effectiveVoiceId,
          language,
        }),
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      if (response.ok) {
        const contentType = response.headers.get('content-type')

        if (contentType?.includes('audio')) {
          // Got premium audio back
          const blob = await response.blob()
          if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current)
          const url = URL.createObjectURL(blob)
          blobUrlRef.current = url

          const audio = new Audio(url)
          audioRef.current = audio

          // Try to create AudioContext for waveform
          try {
            if (!audioContextRef.current) {
              audioContextRef.current = new AudioContext()
            }
            const source = audioContextRef.current.createMediaElementSource(audio)
            const analyzer = audioContextRef.current.createAnalyser()
            analyzer.fftSize = 64
            source.connect(analyzer)
            analyzer.connect(audioContextRef.current.destination)
            analyzerRef.current = analyzer
          } catch {
            // AudioContext not available - use simulated waveform
          }

          audio.onplay = () => {
            setState('playing')
            setProvider(response.headers.get('x-voice-provider') || 'premium')
            onStart?.()
          }
          audio.onended = () => {
            setState('idle')
            onEnd?.()
          }
          audio.onerror = () => {
            setState('idle')
            fallbackToBrowserTTS()
          }

          try {
            await audio.play()
          } catch {
            // Browser blocked autoplay (NotAllowedError) — fall back to
            // browser TTS which is more permissive about autoplay policies
            setState('idle')
            fallbackToBrowserTTS()
          }
          return
        }

        // Backend returned browser fallback config
        const data = await response.json()
        if (data.fallback_to_browser) {
          fallbackToBrowserTTS(data.browser_config)
          return
        }
      }
    } catch {
      // Backend unavailable
    }

    // Fallback to browser TTS
    fallbackToBrowserTTS()
  }, [text, mood, effectiveVoiceId, language, state, onStart, onEnd, fallbackToBrowserTTS])

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setState('idle')
    onStop?.()
    onEnd?.()
  }, [onStop, onEnd])

  // Track whether user has interacted with the page (required for audio autoplay)
  const userInteractedRef = useRef(false)
  useEffect(() => {
    if (userInteractedRef.current) return
    const markInteracted = () => {
      userInteractedRef.current = true
      window.removeEventListener('click', markInteracted, true)
      window.removeEventListener('touchstart', markInteracted, true)
      window.removeEventListener('keydown', markInteracted, true)
    }
    window.addEventListener('click', markInteracted, true)
    window.addEventListener('touchstart', markInteracted, true)
    window.addEventListener('keydown', markInteracted, true)
    return () => {
      window.removeEventListener('click', markInteracted, true)
      window.removeEventListener('touchstart', markInteracted, true)
      window.removeEventListener('keydown', markInteracted, true)
    }
  }, [])

  // Auto-play if requested (triggers on mount and when autoPlay/text change)
  // Only autoplay after user has interacted with the page to comply with browser policy
  useEffect(() => {
    if (autoPlay && state === 'idle' && text && userInteractedRef.current) {
      const timer = setTimeout(() => playAudio(), 300)
      return () => clearTimeout(timer)
    }
  }, [autoPlay, text]) // eslint-disable-line react-hooks/exhaustive-deps

  if (compact) {
    return (
      <span className="inline-flex items-center gap-1">
        <button
          onClick={playAudio}
          disabled={state === 'loading'}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-all ${
            state === 'playing'
              ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
              : 'bg-gray-100 text-gray-500 hover:bg-violet-50 hover:text-violet-600 dark:bg-gray-800 dark:text-gray-400'
          }`}
          title={state === 'playing' ? 'Pause' : 'Listen'}
        >
          {state === 'loading' ? (
            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : state === 'playing' ? (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
          {state === 'playing' ? 'Pause' : 'Listen'}
        </button>
        {(state === 'playing' || state === 'paused') && (
          <button
            onClick={stop}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 transition-all"
            title="Stop"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            Stop
          </button>
        )}
      </span>
    )
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200/50 dark:border-gray-700/50">
      {/* Play/Pause button */}
      <button
        onClick={playAudio}
        disabled={state === 'loading'}
        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          state === 'playing'
            ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
            : state === 'loading'
            ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 animate-pulse'
            : 'bg-violet-100 dark:bg-violet-900/30 text-violet-600 hover:bg-violet-200'
        }`}
      >
        {state === 'loading' ? (
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : state === 'playing' || state === 'paused' ? (
          state === 'playing' ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )
        ) : (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </button>

      {/* Waveform visualization */}
      <div className="flex-1 flex items-center gap-[2px] h-8">
        {displayBars.map((height, i) => (
          <div
            key={i}
            className={`flex-1 rounded-full transition-all duration-75 ${
              state === 'playing'
                ? 'bg-gradient-to-t from-violet-500 to-indigo-400'
                : 'bg-gray-300 dark:bg-gray-600'
            }`}
            style={{
              height: `${Math.max(8, height * 100)}%`,
              minHeight: '3px',
            }}
          />
        ))}
      </div>

      {/* Stop button */}
      {(state === 'playing' || state === 'paused') && (
        <button
          onClick={stop}
          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-500 hover:bg-red-100 hover:text-red-500 transition-all"
          aria-label="Stop audio playback"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        </button>
      )}

      {/* Voice persona indicator */}
      <div className="flex-shrink-0 text-right">
        <p className={`text-[10px] font-medium ${persona.color}`}>{persona.name}</p>
        {provider && (
          <p className="text-[8px] text-gray-400">
            {provider === 'elevenlabs' ? 'ElevenLabs HD' :
             provider === 'sarvam_ai_bulbul' ? 'Sarvam AI' :
             provider === 'bhashini_ai' ? 'Bhashini AI' :
             provider === 'browser_fallback' ? 'Local' : 'HD'}
          </p>
        )}
      </div>
    </div>
  )
}
