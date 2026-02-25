/**
 * Karma Reset Client Component
 * 
 * Main client-side component for the Karma Reset tool.
 * Integrates with KIAAN ecosystem and displays navigation to related tools.
 */

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { EcosystemNav } from '@/components/kiaan-ecosystem'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import { ResetPlanCard } from '@/components/tools/ResetPlanCard'
import { BreathingOrb } from '@/components/animations/BreathingOrb'
import { ConfettiEffect } from '@/components/animations/ConfettiEffect'
import { getBriefErrorMessage } from '@/lib/api-client'
import { apiFetch } from '@/lib/api'
import { KiaanMetadata } from '@/types/kiaan-ecosystem.types'
import { springConfigs } from '@/lib/animations/spring-configs'
import { VoiceInputButton, VoiceResponseButton } from '@/components/voice'
import { useLanguage } from '@/hooks/useLanguage'
import CompanionCTA from '@/components/companion/CompanionCTA'
import { KarmaResetTestimonials } from '@/components/testimonials'

type ResetStep = 'input' | 'breathing' | 'plan' | 'complete'

interface ResetGuidance {
  breathingLine: string
  rippleSummary: string
  repairAction: string
  forwardIntention: string
}

// Timing constants
const BREATHING_DURATION_MS = 5000

export default function KarmaResetClient() {
  const [currentStep, setCurrentStep] = useState<ResetStep>('input')
  const [situation, setSituation] = useState('')
  const [whoFelt, setWhoFelt] = useState('')
  const [repairType, setRepairType] = useState<'apology' | 'clarification' | 'calm_followup'>('apology')
  const [loading, setLoading] = useState(false)
  const [resetGuidance, setResetGuidance] = useState<ResetGuidance | null>(null)
  const [_kiaanMetadata, setKiaanMetadata] = useState<KiaanMetadata | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const MAX_RETRIES = 2

  // Voice integration
  const { language } = useLanguage()

  // Health check on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await apiFetch('/api/karma-reset/kiaan/health', {
          method: 'GET',
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const data = await response.json()
          setBackendHealthy(data.status === 'healthy')
        } else {
          setBackendHealthy(false)
        }
      } catch (error) {
        console.error('Karma Reset health check failed:', error)
        setBackendHealthy(false)
      }
    }

    checkHealth()
  }, [])

  const submitKarmaReset = async (attemptCount = 0) => {
    setLoading(true)
    if (attemptCount === 0) {
      setError(null)
      setRetryCount(0)
    }

    try {
      // Use apiFetch to automatically include CSRF token for POST requests
      const response = await apiFetch('/api/karma-reset/kiaan/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          situation,
          feeling: whoFelt,
          repair_type: repairType,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMessage = errorData.detail || errorData.message || 'Failed to generate reset guidance'
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setResetGuidance(data.reset_guidance)
      setKiaanMetadata(data.kiaan_metadata)
      setCurrentStep('breathing')
      
      // Auto-advance to plan after breathing exercise
      setTimeout(() => setCurrentStep('plan'), BREATHING_DURATION_MS)
    } catch (err) {
      // Get user-friendly error message using shared utility
      const errorMessage = getBriefErrorMessage(err) || 'An error occurred'
      
      // Retry logic
      if (attemptCount < MAX_RETRIES) {
        setRetryCount(attemptCount + 1)
        setError(`${errorMessage}. Retrying... (Attempt ${attemptCount + 1}/${MAX_RETRIES})`)
        
        // Retry after a short delay
        setTimeout(() => {
          submitKarmaReset(attemptCount + 1)
        }, 1500)
      } else {
        // Show user-friendly error with fallback guidance
        setError(
          `${errorMessage} We've provided fallback guidance below, or you can try again later.`
        )
        
        // Set fallback guidance
        const fallbackGuidance = getFallbackGuidance(repairType)
        setResetGuidance(fallbackGuidance)
        setCurrentStep('breathing')
        setTimeout(() => setCurrentStep('plan'), BREATHING_DURATION_MS)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitKarmaReset()
  }

  const getFallbackGuidance = (repair: 'apology' | 'clarification' | 'calm_followup'): ResetGuidance => {
    const fallbacks = {
      apology: {
        breathingLine: "Take four slow breaths. Let each exhale soften the moment.",
        rippleSummary: "You experienced a moment that affected someone you care about.",
        repairAction: "Offer a sincere apology that acknowledges the moment with genuine care.",
        forwardIntention: "Move forward with intention to communicate with kindness."
      },
      clarification: {
        breathingLine: "Breathe deeply. Clear communication begins with inner calm.",
        rippleSummary: "A misunderstanding created distance between you and another.",
        repairAction: "Gently clarify your intention and invite understanding.",
        forwardIntention: "Speak with clarity and compassion in future interactions."
      },
      calm_followup: {
        breathingLine: "Take a centering breath. Calm begins within.",
        rippleSummary: "A tense moment left residue in your connection.",
        repairAction: "Return with warmth and re-center the conversation.",
        forwardIntention: "Practice responding with patience and presence."
      }
    }
    return fallbacks[repair] || fallbacks.apology
  }

  const resetForm = () => {
    setCurrentStep('input')
    setSituation('')
    setWhoFelt('')
    setRepairType('apology')
    setResetGuidance(null)
    setKiaanMetadata(null)
    setError(null)
    setShowConfetti(false)
  }

  const handleComplete = () => {
    setShowConfetti(true)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050505] via-[#050507] to-[#120907] text-white">
      {/* Background gradients */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-gradient-to-br from-[#d4a44c]/25 via-[#ff9933]/14 to-transparent blur-3xl" />
        <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-gradient-to-tr from-[#ff9933]/18 via-[#d4a44c]/10 to-transparent blur-[120px]" />
        <div className="absolute left-1/4 top-1/3 h-56 w-56 animate-pulse rounded-full bg-gradient-to-br from-[#1f2937]/70 via-[#ff9933]/10 to-transparent blur-[90px]" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-7xl relative">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-3">
                <motion.h1 
                  className="text-4xl font-bold bg-gradient-to-r from-[#e8b54a] via-[#ffb347] to-[#e8b54a] bg-clip-text text-transparent flex items-center gap-2"
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={springConfigs.smooth}
                >
                  <motion.span
                    animate={{
                      scale: [1, 1.08, 1],
                      rotate: [0, 3, -3, 0],
                    }}
                    transition={{
                      duration: 4,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    💚
                  </motion.span>
                  Karma Reset
                </motion.h1>
                {/* Connection status indicator */}
                {backendHealthy !== null && (
                  <span className="flex items-center gap-2 text-xs">
                    {backendHealthy ? (
                      <>
                        <span className="flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span className="text-green-400">Connected</span>
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-yellow-500"></span>
                        <span className="text-yellow-400">Offline (using fallback)</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <p className="text-lg text-[#f5f0e8]/80 mb-4">
                A gentle process to acknowledge impact, repair connections, and move forward with clarity.
              </p>
            </div>

            {/* Input Form */}
            {currentStep === 'input' && (
              <div className="rounded-3xl border border-[#d4a44c]/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#050507]/80 to-[#120a07]/90 p-8 shadow-[0_30px_120px_rgba(212,164,76,0.18)] backdrop-blur">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Situation */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="situation" className="text-sm font-medium text-[#f5f0e8]">
                        What happened?
                      </label>
                      <VoiceInputButton
                        language={language}
                        onTranscript={(text) => setSituation(prev => prev ? `${prev} ${text}` : text)}
                        disabled={loading}
                      />
                    </div>
                    <textarea
                      id="situation"
                      value={situation}
                      onChange={(e) => setSituation(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-[#d4a44c]/30 bg-white/5 text-[#f5f0e8] placeholder:text-[#f5f0e8]/40 focus:ring-2 focus:ring-[#d4a44c]/50 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="Speak or type to describe what happened..."
                      required
                    />
                  </div>

                  {/* Who felt it */}
                  <div>
                    <label htmlFor="whoFelt" className="block text-sm font-medium text-[#f5f0e8] mb-2">
                      Who felt the ripple?
                    </label>
                    <div className="flex gap-2">
                      <input
                        id="whoFelt"
                        type="text"
                        value={whoFelt}
                        onChange={(e) => setWhoFelt(e.target.value)}
                        className="flex-1 px-4 py-3 rounded-lg border border-[#d4a44c]/30 bg-white/5 text-[#f5f0e8] placeholder:text-[#f5f0e8]/40 focus:ring-2 focus:ring-[#d4a44c]/50 focus:border-transparent"
                        placeholder="e.g., My friend, My partner, A colleague"
                        required
                      />
                      <VoiceInputButton
                        language={language}
                        onTranscript={(text) => setWhoFelt(text)}
                        disabled={loading}
                      />
                    </div>
                  </div>

                  {/* Repair type */}
                  <div>
                    <label className="block text-sm font-medium text-[#f5f0e8] mb-3">
                      How would you like to repair?
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-4 rounded-lg border border-[#d4a44c]/20 bg-white/5 cursor-pointer hover:border-[#d4a44c]/40 hover:bg-white/10 transition-all">
                        <input
                          type="radio"
                          name="repairType"
                          value="apology"
                          checked={repairType === 'apology'}
                          onChange={(e) => setRepairType(e.target.value as 'apology' | 'clarification' | 'calm_followup')}
                          className="mt-1 accent-[#d4a44c]"
                        />
                        <div>
                          <div className="font-medium text-[#f5f0e8]">💚 Apology</div>
                          <div className="text-sm text-[#f5f0e8]/70">Offer a sincere apology that stays brief and grounded</div>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 p-4 rounded-lg border border-[#d4a44c]/20 bg-white/5 cursor-pointer hover:border-[#d4a44c]/40 hover:bg-white/10 transition-all">
                        <input
                          type="radio"
                          name="repairType"
                          value="clarification"
                          checked={repairType === 'clarification'}
                          onChange={(e) => setRepairType(e.target.value as 'apology' | 'clarification' | 'calm_followup')}
                          className="mt-1 accent-[#d4a44c]"
                        />
                        <div>
                          <div className="font-medium text-[#f5f0e8]">💬 Clarification</div>
                          <div className="text-sm text-[#f5f0e8]/70">Gently clarify what you meant and invite understanding</div>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 p-4 rounded-lg border border-[#d4a44c]/20 bg-white/5 cursor-pointer hover:border-[#d4a44c]/40 hover:bg-white/10 transition-all">
                        <input
                          type="radio"
                          name="repairType"
                          value="calm_followup"
                          checked={repairType === 'calm_followup'}
                          onChange={(e) => setRepairType(e.target.value as 'apology' | 'clarification' | 'calm_followup')}
                          className="mt-1 accent-[#d4a44c]"
                        />
                        <div>
                          <div className="font-medium text-[#f5f0e8]">🕊️ Calm Follow-up</div>
                          <div className="text-sm text-[#f5f0e8]/70">Return with a warm note that re-centers the conversation</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
                      <div className="flex items-start gap-3">
                        <span className="text-red-400 text-xl">⚠️</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-red-300 mb-1">Connection Issue</h4>
                          <p className="text-sm text-red-200/80">{error}</p>
                          {retryCount >= MAX_RETRIES && (
                            <p className="text-sm text-red-200/70 mt-2">
                              💙 Don&apos;t worry - we&apos;ve prepared fallback guidance for you below.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-[#d4a44c] via-[#ff9933] to-[#d4a44c] hover:from-[#d4a44c] hover:via-[#d4a44c] hover:to-[#d4a44c] disabled:from-gray-500 disabled:via-gray-600 disabled:to-gray-500 text-slate-950 font-semibold text-lg transition-all duration-200 shadow-lg shadow-[#d4a44c]/25 hover:shadow-xl hover:shadow-[#d4a44c]/40 hover:scale-[1.02]"
                  >
                    {loading ? 'Creating your reset...' : 'Get Reset Guidance'}
                  </button>
                </form>
              </div>
            )}

            {/* Breathing Step */}
            {currentStep === 'breathing' && resetGuidance && (
              <motion.div
                className="rounded-3xl border border-[#d4a44c]/15 bg-gradient-to-br from-[#0d0d0f]/90 via-[#050507]/80 to-[#120a07]/90 p-8 shadow-[0_30px_120px_rgba(212,164,76,0.18)] backdrop-blur"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={springConfigs.smooth}
              >
                <h2 className="text-2xl font-bold text-[#f5f0e8] mb-6 text-center">
                  Pause & Breathe
                </h2>
                <div className="flex items-center justify-center gap-3 mb-8">
                  <p className="text-lg text-[#f5f0e8]/80 text-center">
                    {resetGuidance.breathingLine}
                  </p>
                  <VoiceResponseButton
                    text={resetGuidance.breathingLine}
                    language={language}
                    size="md"
                    variant="accent"
                  />
                </div>

                <BreathingOrb
                  size={250}
                  color="#ff9933"
                  pattern="4-7-8"
                  className="my-8"
                />

                <div className="text-center mt-8">
                  <button
                    onClick={() => setCurrentStep('plan')}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4a44c] via-[#ff9933] to-[#d4a44c] hover:from-[#d4a44c] hover:via-[#d4a44c] hover:to-[#d4a44c] text-slate-950 font-semibold transition-all duration-200 shadow-lg shadow-[#d4a44c]/25 hover:shadow-xl hover:shadow-[#d4a44c]/40 hover:scale-[1.02]"
                  >
                    Continue to Plan
                  </button>
                </div>
              </motion.div>
            )}

            {/* Plan Step */}
            {currentStep === 'plan' && resetGuidance && (
              <motion.div 
                className="space-y-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springConfigs.smooth}
              >
                <ResetPlanCard
                  plan={{
                    pauseAndBreathe: resetGuidance.breathingLine,
                    nameTheRipple: resetGuidance.rippleSummary,
                    repair: resetGuidance.repairAction,
                    moveWithIntention: resetGuidance.forwardIntention,
                  }}
                  animated={true}
                />
                
                {/* Confetti Effect */}
                <ConfettiEffect trigger={showConfetti} />
                
                {/* Actions */}
                <div className="flex gap-4 justify-center flex-wrap">
                  <motion.button
                    onClick={handleComplete}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#d4a44c] via-[#ff9933] to-[#d4a44c] hover:from-[#d4a44c] hover:via-[#d4a44c] hover:to-[#d4a44c] text-slate-950 font-semibold transition-all duration-200 shadow-lg shadow-[#d4a44c]/25 hover:shadow-xl hover:shadow-[#d4a44c]/40"
                  >
                    ✨ Complete Reset
                  </motion.button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-[#d4a44c]/30 hover:border-[#d4a44c]/50 text-[#f5f0e8] font-semibold transition-all duration-200"
                  >
                    Start New Reset
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar - Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              <SpiritualToolsNav currentTool="karma-reset" />
              <EcosystemNav currentTool="karma-reset" relatedOnly={false} />
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <KarmaResetTestimonials />

        <CompanionCTA fromTool="karma-reset" />
      </div>
    </div>
  )
}
