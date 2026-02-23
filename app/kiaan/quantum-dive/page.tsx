'use client'

/**
 * KIAAN Quantum Dive Page
 *
 * Multi-dimensional consciousness analysis with voice guidance:
 * - Five-layer consciousness mapping (Pancha Kosha)
 * - Real-time voice narration of insights
 * - Interactive exploration of each layer
 * - Gita wisdom integration
 * - Practice recommendations
 *
 * Journey through Annamaya, Pranamaya, Manomaya, Vijnanamaya, and Anandamaya.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { SubscriptionGate } from '@/components/subscription'
import { useLanguage } from '@/hooks/useLanguage'

// Dynamic imports for voice enhancement panels - loaded when sidebar/mobile panel opens
const VoiceEnhancementsPanel = dynamic(
  () => import('@/components/voice/enhancements').then(mod => ({ default: mod.VoiceEnhancementsPanel })),
  { ssr: false, loading: () => <div className="h-64 animate-pulse rounded-xl bg-slate-800/30" /> }
)
const VoiceEnhancementsMobile = dynamic(
  () => import('@/components/voice/enhancements').then(mod => ({ default: mod.VoiceEnhancementsMobile })),
  { ssr: false }
)

// Types
type QuantumDiveStage =
  | 'ready'
  | 'grounding'
  | 'scanning'
  | 'insights'
  | 'wisdom'
  | 'integration'
  | 'complete'

type ConsciousnessLayer =
  | 'annamaya'
  | 'pranamaya'
  | 'manomaya'
  | 'vijnanamaya'
  | 'anandamaya'

interface QuantumState {
  layer: ConsciousnessLayer
  coherence: number
  amplitude: number
  phase: number
  dominant_pattern: string
  blocked_by: string[]
  supported_by: string[]
}

interface QuantumInsight {
  id: string
  type: 'revelation' | 'pattern' | 'warning' | 'encouragement' | 'growth'
  title: string
  content: string
  voice_narration: string
  confidence: number
  layer: ConsciousnessLayer
  priority: 'high' | 'medium' | 'low'
}

interface WisdomRecommendation {
  verse_id: string
  chapter: number
  verse: number
  translation: string
  relevance: string
  layer: ConsciousnessLayer
  application_guide: string
  voice_intro: string
}

interface PracticeRecommendation {
  id: string
  name: string
  description: string
  duration: string
  frequency: string
  target_layer: ConsciousnessLayer
  expected_benefit: string
  voice_guidance: string
}

interface QuantumDiveAnalysis {
  overall_coherence: number
  consciousness_signature: string
  evolution_trend: 'ascending' | 'stable' | 'descending' | 'transforming'
  layers: Record<string, QuantumState>
  temporal_patterns: unknown[]
  insights: QuantumInsight[]
  wisdom_recommendations: WisdomRecommendation[]
  practice_recommendations: PracticeRecommendation[]
  voice_summary: string
  analyzed_at: string
  data_points: number
  confidence_score: number
}

// Layer metadata
const LAYER_INFO: Record<ConsciousnessLayer, { name: string; sanskrit: string; description: string; color: string }> = {
  annamaya: {
    name: 'Physical Body',
    sanskrit: 'Annamaya Kosha',
    description: 'The food sheath - your physical body and sensations',
    color: 'from-amber-500 to-orange-600'
  },
  pranamaya: {
    name: 'Vital Energy',
    sanskrit: 'Pranamaya Kosha',
    description: 'The breath sheath - your life force and vitality',
    color: 'from-yellow-400 to-amber-500'
  },
  manomaya: {
    name: 'Mind & Emotions',
    sanskrit: 'Manomaya Kosha',
    description: 'The mind sheath - your thoughts and feelings',
    color: 'from-emerald-400 to-teal-500'
  },
  vijnanamaya: {
    name: 'Wisdom & Intellect',
    sanskrit: 'Vijnanamaya Kosha',
    description: 'The wisdom sheath - your discernment and insight',
    color: 'from-blue-400 to-indigo-500'
  },
  anandamaya: {
    name: 'Bliss & Spirit',
    sanskrit: 'Anandamaya Kosha',
    description: 'The bliss sheath - your innermost joy and peace',
    color: 'from-violet-400 to-purple-600'
  }
}

const STAGE_TITLES: Record<QuantumDiveStage, string> = {
  ready: 'Ready to Begin',
  grounding: 'Grounding',
  scanning: 'Scanning Consciousness',
  insights: 'Revealing Insights',
  wisdom: 'Ancient Wisdom',
  integration: 'Integration',
  complete: 'Journey Complete'
}

/**
 * Quantum Dive Page Component
 */
export default function QuantumDivePage() {
  // State
  const [stage, setStage] = useState<QuantumDiveStage>('ready')
  const [analysis, setAnalysis] = useState<QuantumDiveAnalysis | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentNarration, setCurrentNarration] = useState('')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [selectedLayer, setSelectedLayer] = useState<ConsciousnessLayer | null>(null)
  const [progress, setProgress] = useState(0)
  const [_isQuickDive, setIsQuickDive] = useState(false)

  // Refs
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Hooks
  const { language } = useLanguage()

  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      speechRef.current = new SpeechSynthesisUtterance()
      speechRef.current.rate = 0.9
      speechRef.current.pitch = 1.0
      speechRef.current.volume = 1.0
    }
  }, [])

  // Speak text using TTS
  const speak = useCallback((text: string) => {
    if (!speechRef.current || !('speechSynthesis' in window)) return

    // Cancel any ongoing speech
    window.speechSynthesis.cancel()

    speechRef.current.text = text
    speechRef.current.lang = language || 'en-US'

    speechRef.current.onstart = () => setIsSpeaking(true)
    speechRef.current.onend = () => setIsSpeaking(false)
    speechRef.current.onerror = () => setIsSpeaking(false)

    window.speechSynthesis.speak(speechRef.current)
    setCurrentNarration(text)
  }, [language])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }, [])

  // Start Quantum Dive
  const startQuantumDive = useCallback(async (quick: boolean = false) => {
    setIsQuickDive(quick)
    setIsLoading(true)
    setError(null)
    setStage('grounding')
    setProgress(10)

    // Grounding narration
    speak(quick
      ? "Let's take a quick quantum dive into your consciousness. Take a deep breath."
      : "Welcome to your Quantum Dive session. Take a moment to settle into a comfortable position. Take three deep breaths with me."
    )

    try {
      // Make API call
      setProgress(20)
      const endpoint = quick ? '/api/kiaan/quantum-dive/quick' : '/api/kiaan/quantum-dive/analyze'
      const response = await fetch(endpoint, {
        method: quick ? 'GET' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: quick ? undefined : JSON.stringify({
          time_range_weeks: 4,
          voice_optimized: true
        })
      })

      if (!response.ok) {
        throw new Error('Failed to perform quantum dive')
      }

      const data: QuantumDiveAnalysis = await response.json()
      setAnalysis(data)

      // Transition through stages
      setStage('scanning')
      setProgress(40)
      speak(`Your quantum coherence score is ${data.overall_coherence} out of 100. ${getCoherenceDescription(data.overall_coherence)}`)

      // Wait for speech to finish before continuing
      await new Promise(resolve => setTimeout(resolve, quick ? 3000 : 5000))

      // Insights
      setStage('insights')
      setProgress(60)
      if (data.insights.length > 0) {
        speak(data.insights[0].voice_narration)
        await new Promise(resolve => setTimeout(resolve, quick ? 3000 : 5000))
      }

      // Wisdom
      setStage('wisdom')
      setProgress(75)
      if (data.wisdom_recommendations.length > 0) {
        const verse = data.wisdom_recommendations[0]
        speak(`${verse.voice_intro} From chapter ${verse.chapter}, verse ${verse.verse}: "${verse.translation}"`)
        await new Promise(resolve => setTimeout(resolve, quick ? 4000 : 6000))
      }

      // Integration
      setStage('integration')
      setProgress(90)
      if (data.practice_recommendations.length > 0) {
        speak(`My recommendation for you: ${data.practice_recommendations[0].voice_guidance}`)
        await new Promise(resolve => setTimeout(resolve, 3000))
      }

      // Complete
      setStage('complete')
      setProgress(100)
      speak(quick
        ? "This concludes your quick quantum dive. Carry this awareness with you."
        : "Your quantum dive is complete. Remember, this journey is yours. Each moment of awareness is a step toward greater coherence."
      )

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setStage('ready')
    } finally {
      setIsLoading(false)
    }
  }, [speak])

  // Get coherence description
  const getCoherenceDescription = (coherence: number): string => {
    if (coherence >= 80) return 'This reflects excellent alignment across your consciousness layers.'
    if (coherence >= 60) return 'This shows good integration with specific areas for deepening.'
    if (coherence >= 40) return 'There are opportunities to bring more harmony to your layers.'
    return 'This indicates a period of transformation and growth opportunity.'
  }

  // Get trend description
  const getTrendDescription = (trend: string): string => {
    switch (trend) {
      case 'ascending': return 'Your consciousness is rising'
      case 'descending': return 'A period of transformation'
      case 'transforming': return 'Deep change is happening'
      default: return 'Stable foundation'
    }
  }

  // Get trend icon
  const getTrendIcon = (trend: string): string => {
    switch (trend) {
      case 'ascending': return '/'
      case 'descending': return '\\'
      case 'transforming': return '~'
      default: return '-'
    }
  }

  // Explore specific layer
  const exploreLayer = useCallback(async (layer: ConsciousnessLayer) => {
    if (!analysis) return

    setSelectedLayer(layer)
    const layerState = analysis.layers[layer]
    const layerInfo = LAYER_INFO[layer]

    if (!layerState) return

    const coherencePercent = Math.round(layerState.coherence * 100)

    speak(
      `Let us explore ${layerInfo.sanskrit} more deeply - ${layerInfo.description}. ` +
      `Your ${layerInfo.name} shows ${coherencePercent} percent coherence. ` +
      `The dominant pattern here is: ${layerState.dominant_pattern}.` +
      (layerState.blocked_by.length > 0
        ? ` Some obstacles here may include: ${layerState.blocked_by.join(', ')}.`
        : '') +
      (layerState.supported_by.length > 0
        ? ` What's supporting this layer: ${layerState.supported_by.join(', ')}.`
        : '')
    )
  }, [analysis, speak])

  // Reset and start over
  const resetDive = useCallback(() => {
    stopSpeaking()
    setStage('ready')
    setAnalysis(null)
    setError(null)
    setProgress(0)
    setSelectedLayer(null)
    setCurrentNarration('')
  }, [stopSpeaking])

  // Render layer card
  const renderLayerCard = (layer: ConsciousnessLayer) => {
    const info = LAYER_INFO[layer]
    const state = analysis?.layers[layer]
    const coherence = state ? Math.round(state.coherence * 100) : 0
    const isSelected = selectedLayer === layer

    return (
      <button
        key={layer}
        onClick={() => exploreLayer(layer)}
        className={`
          relative p-4 rounded-xl border transition-all duration-300
          ${isSelected
            ? 'border-[#d4a44c]/40 bg-[#d4a44c]/10 scale-105'
            : 'border-[#d4a44c]/10 bg-[#d4a44c]/[0.03] hover:bg-[#d4a44c]/[0.08] hover:border-[#d4a44c]/25'
          }
        `}
      >
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${info.color} opacity-10`} />
        <div className="relative">
          <div className="text-xs text-[#d4a44c]/50 mb-1">{info.sanskrit}</div>
          <div className="font-medium text-[#e8dcc8] mb-2">{info.name}</div>

          {state && (
            <>
              {/* Coherence bar */}
              <div className="h-2 bg-[#d4a44c]/10 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full bg-gradient-to-r ${info.color} transition-all duration-1000`}
                  style={{ width: `${coherence}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#d4a44c]/60">{coherence}%</span>
                <span className="text-[#d4a44c]/40">{state.dominant_pattern}</span>
              </div>
            </>
          )}
        </div>
      </button>
    )
  }

  return (
    <SubscriptionGate feature="quantum_dive">
    <div className="kiaan-cosmic-bg min-h-screen relative overflow-hidden">
      {/* Background effects - cosmic golden nebula */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="kiaan-nebula absolute top-1/4 left-1/4 w-96 h-96 bg-[#d4a44c]/8 rounded-full blur-[100px]" />
        <div className="kiaan-nebula absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#d4a44c]/6 rounded-full blur-[120px]" style={{ animationDelay: '-8s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#8b5cf6]/[0.03] rounded-full blur-[140px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-4 border-b border-[#d4a44c]/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/kiaan"
            className="text-[#d4a44c]/50 hover:text-[#d4a44c] transition-colors"
          >
            &larr; Back to KIAAN
          </Link>
          <h1 className="kiaan-text-golden text-lg font-semibold">Quantum Dive</h1>
          <Link
            href="/companion"
            className="text-[#d4a44c]/50 hover:text-[#d4a44c] transition-colors"
          >
            Voice &rarr;
          </Link>
        </div>
      </header>

      {/* Main content with sidebar */}
      <div className="relative z-10 px-4 py-8 max-w-7xl mx-auto">
        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-6">
          {/* Main content */}
          <main className="max-w-4xl mx-auto lg:mx-0">
        {/* Stage indicator */}
        <div className="text-center mb-8">
          <div className="text-sm text-[#d4a44c]/50 mb-2">{STAGE_TITLES[stage]}</div>

          {/* Progress bar */}
          {stage !== 'ready' && stage !== 'complete' && (
            <div className="h-1 bg-[#d4a44c]/10 rounded-full overflow-hidden max-w-md mx-auto">
              <div
                className="h-full bg-gradient-to-r from-[#c8943a] to-[#e8b54a] transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Ready state */}
        {stage === 'ready' && (
          <div className="text-center space-y-8">
            {/* Quantum symbol - golden cosmic rings */}
            <div className="relative w-48 h-48 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-[#d4a44c]/25 animate-spin-slow" />
              <div className="absolute inset-4 rounded-full border-2 border-[#e8b54a]/30 animate-spin-slow-reverse" />
              <div className="absolute inset-8 rounded-full border-2 border-[#c8943a]/20 animate-spin-slow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="kiaan-text-golden text-4xl font-light">Q</div>
              </div>
            </div>

            <div>
              <h2 className="kiaan-text-golden text-2xl font-semibold mb-4">
                Quantum Dive
              </h2>
              <p className="text-[#e8dcc8]/50 max-w-md mx-auto mb-8">
                A multi-dimensional journey through your five layers of consciousness.
                Discover insights, receive ancient wisdom, and find your path to greater coherence.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 max-w-md mx-auto">
                <p className="text-red-300">{error}</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => startQuantumDive(false)}
                disabled={isLoading}
                className="kiaan-btn-golden px-8 py-4 font-medium rounded-xl transition-all disabled:opacity-50"
              >
                Begin Full Quantum Dive
                <span className="block text-xs text-[#0a0a0f]/60 mt-1">~15 minutes</span>
              </button>

              <button
                onClick={() => startQuantumDive(true)}
                disabled={isLoading}
                className="px-8 py-4 bg-[#d4a44c]/10 hover:bg-[#d4a44c]/20 text-[#e8dcc8] font-medium rounded-xl transition-all border border-[#d4a44c]/20 disabled:opacity-50"
              >
                Quick Dive
                <span className="block text-xs text-[#d4a44c]/50 mt-1">~2 minutes</span>
              </button>
            </div>
          </div>
        )}

        {/* Active dive state */}
        {stage !== 'ready' && (
          <div className="space-y-8">
            {/* Coherence display */}
            {analysis && (
              <div className="text-center">
                <div className="relative w-40 h-40 mx-auto mb-4">
                  {/* Circular progress */}
                  <svg className="w-full h-full -rotate-90">
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="rgba(255,255,255,0.1)"
                      strokeWidth="8"
                    />
                    <circle
                      cx="80"
                      cy="80"
                      r="70"
                      fill="none"
                      stroke="url(#coherenceGradient)"
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${(analysis.overall_coherence / 100) * 440} 440`}
                      className="transition-all duration-1000"
                    />
                    <defs>
                      <linearGradient id="coherenceGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#c8943a" />
                        <stop offset="100%" stopColor="#e8b54a" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="kiaan-text-golden text-4xl font-bold">{analysis.overall_coherence}</div>
                    <div className="text-xs text-[#d4a44c]/50">Coherence</div>
                  </div>
                </div>

                <div className="text-[#e8dcc8] font-medium">{analysis.consciousness_signature}</div>
                <div className="text-[#d4a44c]/50 text-sm flex items-center justify-center gap-2 mt-1">
                  <span>{getTrendIcon(analysis.evolution_trend)}</span>
                  <span>{getTrendDescription(analysis.evolution_trend)}</span>
                </div>
              </div>
            )}

            {/* Current narration */}
            {currentNarration && (
              <div className="kiaan-cosmic-card rounded-xl p-6 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  {isSpeaking && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#d4a44c]/15 flex items-center justify-center">
                      <div className="w-3 h-3 bg-[#d4a44c] rounded-full animate-pulse" />
                    </div>
                  )}
                  <p className="text-[#e8dcc8]/80 italic leading-relaxed">{currentNarration}</p>
                </div>
              </div>
            )}

            {/* Five layers grid */}
            {analysis && stage !== 'grounding' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                {(['annamaya', 'pranamaya', 'manomaya', 'vijnanamaya', 'anandamaya'] as ConsciousnessLayer[]).map(renderLayerCard)}
              </div>
            )}

            {/* Selected layer details */}
            {selectedLayer && analysis && (
              <div className="kiaan-cosmic-card rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-[#d4a44c]/50">{LAYER_INFO[selectedLayer].sanskrit}</div>
                    <h3 className="text-xl font-semibold text-[#e8dcc8]">{LAYER_INFO[selectedLayer].name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedLayer(null)}
                    className="text-[#d4a44c]/40 hover:text-[#d4a44c]"
                  >
                    x
                  </button>
                </div>

                <p className="text-[#e8dcc8]/60 mb-4">{LAYER_INFO[selectedLayer].description}</p>

                {analysis.layers[selectedLayer] && (
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-[#d4a44c]/50 mb-1">Dominant Pattern</div>
                      <div className="text-[#e8dcc8]">{analysis.layers[selectedLayer].dominant_pattern}</div>
                    </div>

                    {analysis.layers[selectedLayer].blocked_by.length > 0 && (
                      <div>
                        <div className="text-xs text-[#d4a44c]/50 mb-1">Obstacles</div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.layers[selectedLayer].blocked_by.map((item, i) => (
                            <span key={i} className="px-2 py-1 bg-red-500/15 text-red-300/80 text-sm rounded border border-red-500/15">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.layers[selectedLayer].supported_by.length > 0 && (
                      <div>
                        <div className="text-xs text-[#d4a44c]/50 mb-1">Supporters</div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.layers[selectedLayer].supported_by.map((item, i) => (
                            <span key={i} className="px-2 py-1 bg-[#d4a44c]/10 text-[#d4a44c]/80 text-sm rounded border border-[#d4a44c]/15">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Insights section */}
            {analysis && analysis.insights.length > 0 && stage !== 'grounding' && stage !== 'scanning' && (
              <div className="space-y-3">
                <h3 className="kiaan-text-golden text-lg font-semibold">Key Insights</h3>
                <div className="grid gap-3">
                  {analysis.insights.slice(0, 3).map((insight) => (
                    <div
                      key={insight.id}
                      className={`p-4 rounded-lg border ${
                        insight.type === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/20'
                          : insight.type === 'encouragement'
                          ? 'bg-[#d4a44c]/10 border-[#d4a44c]/20'
                          : 'bg-[#d4a44c]/[0.06] border-[#d4a44c]/15'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {insight.type === 'warning' ? '!' : insight.type === 'encouragement' ? '*' : '#'}
                        </span>
                        <div>
                          <div className="font-medium text-[#e8dcc8]">{insight.title}</div>
                          <p className="text-[#e8dcc8]/60 text-sm mt-1">{insight.content}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Wisdom section */}
            {analysis && analysis.wisdom_recommendations.length > 0 && (stage === 'wisdom' || stage === 'integration' || stage === 'complete') && (
              <div className="space-y-3">
                <h3 className="kiaan-text-golden text-lg font-semibold">Gita Wisdom</h3>
                <div className="grid gap-3">
                  {analysis.wisdom_recommendations.slice(0, 2).map((verse) => (
                    <div
                      key={verse.verse_id}
                      className="kiaan-cosmic-card p-4 rounded-lg"
                    >
                      <div className="text-xs text-[#d4a44c]/60 mb-2">
                        Chapter {verse.chapter}, Verse {verse.verse}
                      </div>
                      <p className="text-[#e8dcc8]/90 italic mb-3">&quot;{verse.translation}&quot;</p>
                      <p className="text-[#e8dcc8]/50 text-sm">{verse.application_guide}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practice recommendations */}
            {analysis && analysis.practice_recommendations.length > 0 && (stage === 'integration' || stage === 'complete') && (
              <div className="space-y-3">
                <h3 className="kiaan-text-golden text-lg font-semibold">Recommended Practices</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {analysis.practice_recommendations.slice(0, 2).map((practice) => (
                    <div
                      key={practice.id}
                      className="p-4 rounded-lg bg-[#d4a44c]/[0.04] border border-[#d4a44c]/12"
                    >
                      <div className="font-medium text-[#e8dcc8] mb-1">{practice.name}</div>
                      <p className="text-[#e8dcc8]/50 text-sm mb-3">{practice.description}</p>
                      <div className="flex gap-4 text-xs text-[#d4a44c]/40">
                        <span>{practice.duration}</span>
                        <span>{practice.frequency}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex justify-center gap-4 pt-4">
              {isSpeaking && (
                <button
                  onClick={stopSpeaking}
                  className="px-6 py-2 bg-[#d4a44c]/10 hover:bg-[#d4a44c]/20 text-[#e8dcc8] rounded-lg transition-all border border-[#d4a44c]/20"
                >
                  Stop Speaking
                </button>
              )}

              {stage === 'complete' && (
                <button
                  onClick={resetDive}
                  className="kiaan-btn-golden px-6 py-2 rounded-lg transition-all"
                >
                  Start New Dive
                </button>
              )}

              {stage !== 'complete' && (
                <button
                  onClick={resetDive}
                  className="px-6 py-2 bg-[#d4a44c]/10 hover:bg-[#d4a44c]/20 text-[#d4a44c]/60 hover:text-[#d4a44c] rounded-lg transition-all border border-[#d4a44c]/15"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
          </main>

          {/* Desktop Sidebar - Voice Enhancements */}
          <aside className="hidden lg:block sticky top-4 h-fit">
            <VoiceEnhancementsPanel
              currentLayer={selectedLayer || undefined}
              compact
              className="w-full"
            />
          </aside>
        </div>

        {/* Mobile Voice Enhancements */}
        <div className="lg:hidden">
          <VoiceEnhancementsMobile
            currentLayer={selectedLayer || undefined}
          />
        </div>
      </div>

      {/* Custom animation styles */}
      <style jsx>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-slow-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        .animate-spin-slow-reverse {
          animation: spin-slow-reverse 15s linear infinite;
        }
      `}</style>
    </div>
    </SubscriptionGate>
  )
}
