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
import { useLanguage } from '@/hooks/useLanguage'

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
  temporal_patterns: any[]
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
  const [isQuickDive, setIsQuickDive] = useState(false)

  // Refs
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Hooks
  const { t, language } = useLanguage()

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
            ? 'border-white/30 bg-white/10 scale-105'
            : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
          }
        `}
      >
        <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${info.color} opacity-20`} />
        <div className="relative">
          <div className="text-xs text-white/60 mb-1">{info.sanskrit}</div>
          <div className="font-medium text-white mb-2">{info.name}</div>

          {state && (
            <>
              {/* Coherence bar */}
              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                <div
                  className={`h-full bg-gradient-to-r ${info.color} transition-all duration-1000`}
                  style={{ width: `${coherence}%` }}
                />
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-white/60">{coherence}%</span>
                <span className="text-white/40">{state.dominant_pattern}</span>
              </div>
            </>
          )}
        </div>
      </button>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* Background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-4 border-b border-white/10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/app/kiaan"
            className="text-white/60 hover:text-white transition-colors"
          >
            &larr; Back to KIAAN
          </Link>
          <h1 className="text-lg font-semibold text-white">Quantum Dive</h1>
          <Link
            href="/app/kiaan/voice"
            className="text-white/60 hover:text-white transition-colors"
          >
            Voice &rarr;
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 px-4 py-8 max-w-4xl mx-auto">
        {/* Stage indicator */}
        <div className="text-center mb-8">
          <div className="text-sm text-white/50 mb-2">{STAGE_TITLES[stage]}</div>

          {/* Progress bar */}
          {stage !== 'ready' && stage !== 'complete' && (
            <div className="h-1 bg-white/10 rounded-full overflow-hidden max-w-md mx-auto">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Ready state */}
        {stage === 'ready' && (
          <div className="text-center space-y-8">
            {/* Quantum symbol */}
            <div className="relative w-48 h-48 mx-auto">
              <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-spin-slow" />
              <div className="absolute inset-4 rounded-full border-2 border-indigo-500/40 animate-spin-slow-reverse" />
              <div className="absolute inset-8 rounded-full border-2 border-blue-500/30 animate-spin-slow" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-4xl font-light text-white/80">Q</div>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Quantum Dive
              </h2>
              <p className="text-white/60 max-w-md mx-auto mb-8">
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
                className="px-8 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-medium rounded-xl transition-all disabled:opacity-50"
              >
                Begin Full Quantum Dive
                <span className="block text-xs text-white/60 mt-1">~15 minutes</span>
              </button>

              <button
                onClick={() => startQuantumDive(true)}
                disabled={isLoading}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-all border border-white/20 disabled:opacity-50"
              >
                Quick Dive
                <span className="block text-xs text-white/60 mt-1">~2 minutes</span>
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
                        <stop offset="0%" stopColor="#8B5CF6" />
                        <stop offset="100%" stopColor="#6366F1" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-4xl font-bold text-white">{analysis.overall_coherence}</div>
                    <div className="text-xs text-white/50">Coherence</div>
                  </div>
                </div>

                <div className="text-white/80 font-medium">{analysis.consciousness_signature}</div>
                <div className="text-white/50 text-sm flex items-center justify-center gap-2 mt-1">
                  <span>{getTrendIcon(analysis.evolution_trend)}</span>
                  <span>{getTrendDescription(analysis.evolution_trend)}</span>
                </div>
              </div>
            )}

            {/* Current narration */}
            {currentNarration && (
              <div className="bg-white/5 border border-white/10 rounded-xl p-6 max-w-2xl mx-auto">
                <div className="flex items-start gap-3">
                  {isSpeaking && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                      <div className="w-3 h-3 bg-purple-400 rounded-full animate-pulse" />
                    </div>
                  )}
                  <p className="text-white/80 italic leading-relaxed">{currentNarration}</p>
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
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-sm text-white/50">{LAYER_INFO[selectedLayer].sanskrit}</div>
                    <h3 className="text-xl font-semibold text-white">{LAYER_INFO[selectedLayer].name}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedLayer(null)}
                    className="text-white/40 hover:text-white"
                  >
                    x
                  </button>
                </div>

                <p className="text-white/70 mb-4">{LAYER_INFO[selectedLayer].description}</p>

                {analysis.layers[selectedLayer] && (
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs text-white/50 mb-1">Dominant Pattern</div>
                      <div className="text-white">{analysis.layers[selectedLayer].dominant_pattern}</div>
                    </div>

                    {analysis.layers[selectedLayer].blocked_by.length > 0 && (
                      <div>
                        <div className="text-xs text-white/50 mb-1">Obstacles</div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.layers[selectedLayer].blocked_by.map((item, i) => (
                            <span key={i} className="px-2 py-1 bg-red-500/20 text-red-300 text-sm rounded">
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {analysis.layers[selectedLayer].supported_by.length > 0 && (
                      <div>
                        <div className="text-xs text-white/50 mb-1">Supporters</div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.layers[selectedLayer].supported_by.map((item, i) => (
                            <span key={i} className="px-2 py-1 bg-green-500/20 text-green-300 text-sm rounded">
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
                <h3 className="text-lg font-semibold text-white">Key Insights</h3>
                <div className="grid gap-3">
                  {analysis.insights.slice(0, 3).map((insight) => (
                    <div
                      key={insight.id}
                      className={`p-4 rounded-lg border ${
                        insight.type === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/30'
                          : insight.type === 'encouragement'
                          ? 'bg-green-500/10 border-green-500/30'
                          : 'bg-blue-500/10 border-blue-500/30'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">
                          {insight.type === 'warning' ? '!' : insight.type === 'encouragement' ? '*' : '#'}
                        </span>
                        <div>
                          <div className="font-medium text-white">{insight.title}</div>
                          <p className="text-white/70 text-sm mt-1">{insight.content}</p>
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
                <h3 className="text-lg font-semibold text-white">Gita Wisdom</h3>
                <div className="grid gap-3">
                  {analysis.wisdom_recommendations.slice(0, 2).map((verse) => (
                    <div
                      key={verse.verse_id}
                      className="p-4 rounded-lg bg-indigo-500/10 border border-indigo-500/30"
                    >
                      <div className="text-xs text-indigo-300 mb-2">
                        Chapter {verse.chapter}, Verse {verse.verse}
                      </div>
                      <p className="text-white/90 italic mb-3">"{verse.translation}"</p>
                      <p className="text-white/60 text-sm">{verse.application_guide}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Practice recommendations */}
            {analysis && analysis.practice_recommendations.length > 0 && (stage === 'integration' || stage === 'complete') && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">Recommended Practices</h3>
                <div className="grid sm:grid-cols-2 gap-3">
                  {analysis.practice_recommendations.slice(0, 2).map((practice) => (
                    <div
                      key={practice.id}
                      className="p-4 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="font-medium text-white mb-1">{practice.name}</div>
                      <p className="text-white/60 text-sm mb-3">{practice.description}</p>
                      <div className="flex gap-4 text-xs text-white/40">
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
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                >
                  Stop Speaking
                </button>
              )}

              {stage === 'complete' && (
                <button
                  onClick={resetDive}
                  className="px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-lg transition-all"
                >
                  Start New Dive
                </button>
              )}

              {stage !== 'ready' && stage !== 'complete' && (
                <button
                  onClick={resetDive}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white/60 hover:text-white rounded-lg transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}
      </main>

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
  )
}
