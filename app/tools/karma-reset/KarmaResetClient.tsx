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
            {/* Header — Sacred Karma Reset */}
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  className="divine-companion-avatar h-14 w-14 rounded-full bg-gradient-to-br from-[#c8943a] via-[#e8b54a] to-[#f0c96d] flex items-center justify-center flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={springConfigs.smooth}
                >
                  <span className="text-2xl">&#x1F49A;</span>
                </motion.div>
                <div>
                  <motion.h1
                    className="text-3xl sm:text-4xl font-bold kiaan-text-golden"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springConfigs.smooth}
                  >
                    Karma Reset
                  </motion.h1>
                  <p className="text-[11px] text-[#d4a44c]/50 tracking-[0.12em] uppercase mt-0.5">Guided by KIAAN, your divine companion</p>
                </div>
                {/* Connection status indicator */}
                {backendHealthy !== null && (
                  <span className="flex items-center gap-2 text-xs ml-auto">
                    {backendHealthy ? (
                      <>
                        <span className="divine-diya h-2 w-2 rounded-full bg-[#e8b54a]" />
                        <span className="text-[#d4a44c]/70">Connected</span>
                      </>
                    ) : (
                      <>
                        <span className="h-2 w-2 rounded-full bg-amber-500/60" />
                        <span className="text-amber-400/70">Offline (guided fallback)</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="divine-sacred-thread w-full mb-4" />
              <p className="text-base text-[#f5f0e8]/65 font-sacred leading-relaxed">
                A sacred, gentle process to acknowledge the ripple you&apos;ve caused, repair the connection with grace, and move forward with clarity and intention.
              </p>
            </div>

            {/* Input Form — Sacred Reflection Space */}
            {currentStep === 'input' && (
              <div className="divine-reset-container rounded-3xl p-6 sm:p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Situation */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor="situation" className="text-sm font-medium text-[#f5f0e8]">
                        What happened, dear friend?
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

                  {/* Repair type — Sacred paths */}
                  <div>
                    <label className="block text-sm font-medium text-[#f5f0e8] mb-3">
                      How would you like to restore harmony?
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-4 rounded-xl divine-step-card cursor-pointer transition-all">
                        <input
                          type="radio"
                          name="repairType"
                          value="apology"
                          checked={repairType === 'apology'}
                          onChange={(e) => setRepairType(e.target.value as 'apology' | 'clarification' | 'calm_followup')}
                          className="mt-1 accent-[#d4a44c]"
                        />
                        <div>
                          <div className="font-medium text-[#f5f0e8]">&#x1F49A; Sincere Apology</div>
                          <div className="text-sm text-[#f5f0e8]/60 mt-0.5">Offer heartfelt words that acknowledge and heal</div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 rounded-xl divine-step-card cursor-pointer transition-all">
                        <input
                          type="radio"
                          name="repairType"
                          value="clarification"
                          checked={repairType === 'clarification'}
                          onChange={(e) => setRepairType(e.target.value as 'apology' | 'clarification' | 'calm_followup')}
                          className="mt-1 accent-[#d4a44c]"
                        />
                        <div>
                          <div className="font-medium text-[#f5f0e8]">&#x1F54A;&#xFE0F; Gentle Clarification</div>
                          <div className="text-sm text-[#f5f0e8]/60 mt-0.5">Illuminate your true intention with grace and compassion</div>
                        </div>
                      </label>

                      <label className="flex items-start gap-3 p-4 rounded-xl divine-step-card cursor-pointer transition-all">
                        <input
                          type="radio"
                          name="repairType"
                          value="calm_followup"
                          checked={repairType === 'calm_followup'}
                          onChange={(e) => setRepairType(e.target.value as 'apology' | 'clarification' | 'calm_followup')}
                          className="mt-1 accent-[#d4a44c]"
                        />
                        <div>
                          <div className="font-medium text-[#f5f0e8]">&#x1F338; Warm Re-connection</div>
                          <div className="text-sm text-[#f5f0e8]/60 mt-0.5">Return with warmth that restores the sacred bond</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Error message — compassionate */}
                  {error && (
                    <div className="p-4 rounded-xl divine-step-card border-amber-500/20">
                      <div className="flex items-start gap-3">
                        <span className="text-[#e8b54a] text-lg">&#x1F9D8;</span>
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#e8b54a]/90 mb-1">A moment of patience</h4>
                          <p className="text-sm text-[#f5f0e8]/65">{error}</p>
                          {retryCount >= MAX_RETRIES && (
                            <p className="text-sm text-[#f5f0e8]/55 mt-2">
                              Do not worry, dear friend &#8212; KIAAN has prepared gentle guidance for you below.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Submit button — Sacred action */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-xl kiaan-btn-golden text-lg font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {loading ? 'KIAAN is preparing your sacred guidance...' : 'Begin Sacred Reset'}
                  </button>
                </form>
              </div>
            )}

            {/* Breathing Step — Sacred Pause */}
            {currentStep === 'breathing' && resetGuidance && (
              <motion.div
                className="divine-reset-container rounded-3xl p-8"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={springConfigs.smooth}
              >
                <div className="text-center mb-2">
                  <div className="divine-companion-avatar h-12 w-12 rounded-full bg-gradient-to-br from-[#c8943a] via-[#e8b54a] to-[#f0c96d] flex items-center justify-center mx-auto mb-3">
                    <span className="text-lg">&#x1F9D8;</span>
                  </div>
                  <h2 className="text-2xl font-bold kiaan-text-golden mb-1">
                    Sacred Pause
                  </h2>
                  <p className="text-[10px] text-[#d4a44c]/45 tracking-[0.12em] uppercase">Breathe with KIAAN</p>
                </div>
                <div className="divine-sacred-thread w-16 mx-auto my-4" />
                <div className="flex items-center justify-center gap-3 mb-8">
                  <p className="text-lg text-[#f5f0e8]/75 text-center font-sacred leading-relaxed">
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
                  color="#e8b54a"
                  pattern="4-7-8"
                  className="my-8"
                />

                <div className="text-center mt-8">
                  <button
                    onClick={() => setCurrentStep('plan')}
                    className="kiaan-btn-golden px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02]"
                  >
                    Continue to Sacred Plan
                  </button>
                </div>
              </motion.div>
            )}

            {/* Plan Step — Your Sacred Path Forward */}
            {currentStep === 'plan' && resetGuidance && (
              <motion.div
                className="space-y-6"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={springConfigs.smooth}
              >
                <div className="text-center mb-2">
                  <h2 className="text-xl font-semibold kiaan-text-golden">Your Sacred Path Forward</h2>
                  <p className="text-[11px] text-[#d4a44c]/45 mt-1">KIAAN has crafted this guidance for you with care</p>
                  <div className="divine-sacred-thread w-20 mx-auto mt-3" />
                </div>

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

                {/* Actions — Sacred completion */}
                <div className="flex gap-4 justify-center flex-wrap">
                  <motion.button
                    onClick={handleComplete}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="kiaan-btn-golden px-8 py-3 rounded-xl font-semibold transition-all duration-200"
                  >
                    Complete Sacred Reset
                  </motion.button>
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-[#d4a44c]/20 hover:border-[#d4a44c]/35 text-[#f5f0e8]/80 font-semibold transition-all duration-200"
                  >
                    Begin New Journey
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
