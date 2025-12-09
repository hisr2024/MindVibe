/**
 * Karma Reset Client Component
 * 
 * Main client-side component for the Karma Reset tool.
 * Integrates with KIAAN ecosystem and displays navigation to related tools.
 */

'use client'

import { useState } from 'react'
import { EcosystemNav, KiaanBadge } from '@/components/kiaan-ecosystem'
import { ResetPlanCard } from '@/components/tools/ResetPlanCard'
import { KiaanMetadata } from '@/types/kiaan-ecosystem.types'

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
  const [kiaanMetadata, setKiaanMetadata] = useState<KiaanMetadata | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/karma-reset/kiaan/generate', {
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
        throw new Error('Failed to generate reset guidance')
      }

      const data = await response.json()
      setResetGuidance(data.reset_guidance)
      setKiaanMetadata(data.kiaan_metadata)
      setCurrentStep('breathing')
      
      // Auto-advance to plan after breathing exercise
      setTimeout(() => setCurrentStep('plan'), BREATHING_DURATION_MS)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCurrentStep('input')
    setSituation('')
    setWhoFelt('')
    setRepairType('apology')
    setResetGuidance(null)
    setKiaanMetadata(null)
    setError(null)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-gray-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content area */}
          <div className="lg:col-span-3">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                💚 Karma Reset
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-300 mb-4">
                A compassionate ritual to acknowledge impact, repair harm, and move forward with wisdom.
              </p>
              
              {/* KIAAN Badge */}
              {kiaanMetadata && (
                <KiaanBadge
                  versesUsed={kiaanMetadata.verses_used}
                  validationPassed={kiaanMetadata.validation_passed}
                  validationScore={kiaanMetadata.validation_score}
                  className="mb-4"
                />
              )}
            </div>

            {/* Input Form */}
            {currentStep === 'input' && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Situation */}
                  <div>
                    <label htmlFor="situation" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      What happened?
                    </label>
                    <textarea
                      id="situation"
                      value={situation}
                      onChange={(e) => setSituation(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="Describe what happened briefly..."
                      required
                    />
                  </div>

                  {/* Who felt it */}
                  <div>
                    <label htmlFor="whoFelt" className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
                      Who felt the ripple?
                    </label>
                    <input
                      id="whoFelt"
                      type="text"
                      value={whoFelt}
                      onChange={(e) => setWhoFelt(e.target.value)}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="e.g., My friend, My partner, A colleague"
                      required
                    />
                  </div>

                  {/* Repair type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                      How would you like to repair?
                    </label>
                    <div className="space-y-3">
                      <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                        <input
                          type="radio"
                          name="repairType"
                          value="apology"
                          checked={repairType === 'apology'}
                          onChange={(e) => setRepairType(e.target.value as any)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">💚 Apology</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Offer a sincere apology that stays brief and grounded</div>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                        <input
                          type="radio"
                          name="repairType"
                          value="clarification"
                          checked={repairType === 'clarification'}
                          onChange={(e) => setRepairType(e.target.value as any)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">💬 Clarification</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Gently clarify what you meant and invite understanding</div>
                        </div>
                      </label>
                      
                      <label className="flex items-start gap-3 p-4 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 transition-colors">
                        <input
                          type="radio"
                          name="repairType"
                          value="calm_followup"
                          checked={repairType === 'calm_followup'}
                          onChange={(e) => setRepairType(e.target.value as any)}
                          className="mt-1"
                        />
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">🕊️ Calm Follow-up</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">Return with a warm note that re-centers the conversation</div>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Error message */}
                  {error && (
                    <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
                      {error}
                    </div>
                  )}

                  {/* Submit button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 px-6 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loading ? 'Generating wisdom...' : 'Generate Reset Guidance'}
                  </button>
                </form>
              </div>
            )}

            {/* Breathing Step */}
            {currentStep === 'breathing' && resetGuidance && (
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700 text-center">
                <div className="text-6xl mb-6 animate-pulse">🧘</div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Pause & Breathe
                </h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  {resetGuidance.breathingLine}
                </p>
                <button
                  onClick={() => setCurrentStep('plan')}
                  className="mt-8 px-6 py-3 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors"
                >
                  Continue to Plan
                </button>
              </div>
            )}

            {/* Plan Step */}
            {currentStep === 'plan' && resetGuidance && (
              <div className="space-y-6">
                <ResetPlanCard
                  plan={{
                    pauseAndBreathe: resetGuidance.breathingLine,
                    nameTheRipple: resetGuidance.rippleSummary,
                    repair: resetGuidance.repairAction,
                    moveWithIntention: resetGuidance.forwardIntention,
                  }}
                  animated={true}
                />
                
                {/* Actions */}
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={resetForm}
                    className="px-6 py-3 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold transition-colors"
                  >
                    Start New Reset
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar - KIAAN Ecosystem Navigation */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <EcosystemNav currentTool="karma-reset" relatedOnly={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
