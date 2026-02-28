/**
 * Karma Reset Client - Deep Karmic Transformation Journey
 *
 * A comprehensive karma reset experience grounded in Bhagavad Gita wisdom,
 * featuring 10 Gita-aligned karmic paths and a 7-phase transformation journey.
 *
 * The Gita teaches (BG 4.17): "The intricacies of action are very hard
 * to understand. Therefore one should know properly what action is,
 * what forbidden action is, and what inaction is."
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { EcosystemNav } from '@/components/kiaan-ecosystem'
import { SpiritualToolsNav } from '@/components/navigation/SpiritualToolsNav'
import { DeepResetPlanCard } from '@/components/tools/ResetPlanCard'
import { BreathingOrb } from '@/components/animations/BreathingOrb'
import { ConfettiEffect } from '@/components/animations/ConfettiEffect'
import { getBriefErrorMessage } from '@/lib/api-client'
import { apiFetch } from '@/lib/api'
import { springConfigs } from '@/lib/animations/spring-configs'
import { VoiceInputButton, VoiceResponseButton } from '@/components/voice'
import { useLanguage } from '@/hooks/useLanguage'
import CompanionCTA from '@/components/companion/CompanionCTA'
import { KarmaResetTestimonials } from '@/components/testimonials'
import {
  KARMIC_PATHS_CONFIG,
  PHASE_ICONS,
  type KarmicPathKey,
  type DeepKarmaResetApiResponse,
  type PhaseGuidance,
} from '@/types/karma-reset.types'

type ResetStep = 'input' | 'path_selection' | 'breathing' | 'deep_journey' | 'complete'

/** Timing constants */
const BREATHING_DURATION_MS = 8000

export default function KarmaResetClient() {
  // Flow state
  const [currentStep, setCurrentStep] = useState<ResetStep>('input')
  const [situation, setSituation] = useState('')
  const [whoFelt, setWhoFelt] = useState('')
  const [selectedPath, setSelectedPath] = useState<KarmicPathKey>('kshama')

  // Response data
  const [deepResponse, setDeepResponse] = useState<DeepKarmaResetApiResponse | null>(null)
  const [currentPhase, setCurrentPhase] = useState(0)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [_retryCount, setRetryCount] = useState(0)
  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showVerseDetail, setShowVerseDetail] = useState(false)
  const MAX_RETRIES = 2

  // Voice integration
  const { language } = useLanguage()

  // Health check on mount
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000)
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
      } catch {
        setBackendHealthy(false)
      }
    }
    checkHealth()
  }, [])

  const submitKarmaReset = useCallback(async (attemptCount = 0) => {
    setLoading(true)
    if (attemptCount === 0) {
      setError(null)
      setRetryCount(0)
    }

    try {
      const response = await apiFetch('/api/karma-reset/kiaan/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          situation,
          feeling: whoFelt,
          repair_type: selectedPath,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.detail || errorData.message || 'Failed to generate deep karma reset guidance')
      }

      const data: DeepKarmaResetApiResponse = await response.json()
      setDeepResponse(data)
      setCurrentPhase(0)
      setCurrentStep('breathing')

      // Auto-advance to deep journey after breathing
      setTimeout(() => setCurrentStep('deep_journey'), BREATHING_DURATION_MS)
    } catch (err) {
      const errorMessage = getBriefErrorMessage(err) || 'An error occurred'
      if (attemptCount < MAX_RETRIES) {
        setRetryCount(attemptCount + 1)
        setError(`${errorMessage}. Retrying... (Attempt ${attemptCount + 1}/${MAX_RETRIES})`)
        setTimeout(() => submitKarmaReset(attemptCount + 1), 1500)
      } else {
        setError(`${errorMessage} KIAAN has prepared guidance from static Gita wisdom below.`)
        setLoading(false)
      }
      return
    }
    setLoading(false)
  }, [situation, whoFelt, selectedPath])

  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!situation.trim()) return
    setCurrentStep('path_selection')
  }

  const handlePathSelect = (path: KarmicPathKey) => {
    setSelectedPath(path)
  }

  const handlePathConfirm = () => {
    submitKarmaReset()
  }

  const advancePhase = () => {
    if (!deepResponse?.deep_guidance?.phases) return
    const totalPhases = deepResponse.deep_guidance.phases.length
    if (currentPhase < totalPhases - 1) {
      setCurrentPhase(prev => prev + 1)
    }
  }

  const goBackPhase = () => {
    if (currentPhase > 0) {
      setCurrentPhase(prev => prev - 1)
    }
  }

  const handleComplete = () => {
    setShowConfetti(true)
    setShowVerseDetail(true)
  }

  const resetForm = () => {
    setCurrentStep('input')
    setSituation('')
    setWhoFelt('')
    setSelectedPath('kshama')
    setDeepResponse(null)
    setCurrentPhase(0)
    setError(null)
    setShowConfetti(false)
    setShowVerseDetail(false)
  }

  // Helper to get current phase data
  const currentPhaseData: PhaseGuidance | null =
    deepResponse?.deep_guidance?.phases?.[currentPhase] ?? null
  const totalPhases = deepResponse?.deep_guidance?.phases?.length ?? 7
  const isLastPhase = currentPhase >= totalPhases - 1

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
              <div className="flex items-center gap-4 mb-4">
                <motion.div
                  className="divine-companion-avatar h-14 w-14 rounded-full bg-gradient-to-br from-[#c8943a] via-[#e8b54a] to-[#f0c96d] flex items-center justify-center flex-shrink-0"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={springConfigs.smooth}
                >
                  <span className="text-2xl">{'\u{1F549}\uFE0F'}</span>
                </motion.div>
                <div>
                  <motion.h1
                    className="text-3xl sm:text-4xl font-bold kiaan-text-golden"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={springConfigs.smooth}
                  >
                    Deep Karma Reset
                  </motion.h1>
                  <p className="text-[11px] text-[#d4a44c]/50 tracking-[0.12em] uppercase mt-0.5">
                    Gita-grounded karmic transformation &middot; KIAAN Wisdom Engine
                  </p>
                </div>
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
                        <span className="text-amber-400/70">Offline (Gita wisdom fallback)</span>
                      </>
                    )}
                  </span>
                )}
              </div>
              <div className="divine-sacred-thread w-full mb-4" />
              <p className="text-base text-[#f5f0e8]/65 font-sacred leading-relaxed">
                A deep, 7-phase karmic transformation journey grounded in Bhagavad Gita wisdom.
                Choose your karmic path, receive personalized guidance from ancient teachings,
                and walk forward with sacred intention and daily sadhana.
              </p>
            </div>

            <AnimatePresence mode="wait">
              {/* ==================== STEP 1: INPUT ==================== */}
              {currentStep === 'input' && (
                <motion.div
                  key="input"
                  className="divine-reset-container rounded-3xl p-6 sm:p-8"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={springConfigs.smooth}
                >
                  <form onSubmit={handleInputSubmit} className="space-y-6">
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
                        placeholder="Describe the situation that created a karmic ripple... The more detail you share, the deeper the Gita's wisdom can reach."
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
                          placeholder="e.g., My friend, My partner, A colleague, Myself"
                        />
                        <VoiceInputButton
                          language={language}
                          onTranscript={(text) => setWhoFelt(text)}
                          disabled={loading}
                        />
                      </div>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="p-4 rounded-xl divine-step-card border-amber-500/20">
                        <div className="flex items-start gap-3">
                          <span className="text-[#e8b54a] text-lg">{'\u{1F9D8}'}</span>
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#e8b54a]/90 mb-1">A moment of patience</h4>
                            <p className="text-sm text-[#f5f0e8]/65">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Continue to path selection */}
                    <button
                      type="submit"
                      disabled={!situation.trim()}
                      className="w-full py-4 px-6 rounded-xl kiaan-btn-golden text-lg font-semibold transition-all duration-200 hover:scale-[1.02] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                      Choose Your Karmic Path
                    </button>
                  </form>
                </motion.div>
              )}

              {/* ==================== STEP 2: PATH SELECTION ==================== */}
              {currentStep === 'path_selection' && (
                <motion.div
                  key="path_selection"
                  className="space-y-6"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={springConfigs.smooth}
                >
                  <div className="text-center mb-2">
                    <h2 className="text-2xl font-bold kiaan-text-golden mb-1">Choose Your Karmic Path</h2>
                    <p className="text-sm text-[#f5f0e8]/55">
                      Each path is grounded in a specific Bhagavad Gita teaching. Select the one that resonates with your situation.
                    </p>
                    <div className="divine-sacred-thread w-20 mx-auto mt-3" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {KARMIC_PATHS_CONFIG.map((path) => (
                      <motion.button
                        key={path.key}
                        onClick={() => handlePathSelect(path.key)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className={`text-left p-4 rounded-2xl divine-step-card transition-all duration-300 ${
                          selectedPath === path.key
                            ? 'border-[#d4a44c]/60 bg-[#d4a44c]/10 ring-1 ring-[#d4a44c]/40'
                            : 'border-[#d4a44c]/15 hover:border-[#d4a44c]/30'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl flex-shrink-0">{path.icon}</span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-[#f5f0e8]">{path.name}</span>
                              <span className="text-xs text-[#d4a44c]/60">{path.sanskrit_name}</span>
                            </div>
                            <p className="text-xs text-[#f5f0e8]/55 leading-relaxed">{path.description}</p>
                          </div>
                          {selectedPath === path.key && (
                            <span className="text-[#e8b54a] flex-shrink-0">{'\u2713'}</span>
                          )}
                        </div>
                      </motion.button>
                    ))}
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-4 justify-center flex-wrap">
                    <button
                      onClick={() => setCurrentStep('input')}
                      className="px-6 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-[#d4a44c]/20 hover:border-[#d4a44c]/35 text-[#f5f0e8]/80 font-semibold transition-all duration-200"
                    >
                      Back
                    </button>
                    <motion.button
                      onClick={handlePathConfirm}
                      disabled={loading}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      className="kiaan-btn-golden px-8 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading ? 'KIAAN is preparing your sacred guidance...' : 'Begin Deep Karma Reset'}
                    </motion.button>
                  </div>
                </motion.div>
              )}

              {/* ==================== STEP 3: BREATHING ==================== */}
              {currentStep === 'breathing' && deepResponse && (
                <motion.div
                  key="breathing"
                  className="divine-reset-container rounded-3xl p-8"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={springConfigs.smooth}
                >
                  <div className="text-center mb-2">
                    <div className="divine-companion-avatar h-12 w-12 rounded-full bg-gradient-to-br from-[#c8943a] via-[#e8b54a] to-[#f0c96d] flex items-center justify-center mx-auto mb-3">
                      <span className="text-lg">{'\u{1F549}\uFE0F'}</span>
                    </div>
                    <h2 className="text-2xl font-bold kiaan-text-golden mb-1">
                      {'\u{1F32C}\uFE0F'} Pranayama Shuddhi
                    </h2>
                    <p className="text-xs text-[#d4a44c]/50 mb-1">
                      {deepResponse.karmic_path?.sanskrit_name ?? ''} &middot; {deepResponse.karmic_path?.name ?? 'Karma Reset'}
                    </p>
                    <p className="text-[10px] text-[#d4a44c]/40 tracking-[0.12em] uppercase">
                      Sacred Breath Purification
                    </p>
                  </div>
                  <div className="divine-sacred-thread w-16 mx-auto my-4" />

                  <div className="flex items-center justify-center gap-3 mb-8">
                    <p className="text-lg text-[#f5f0e8]/75 text-center font-sacred leading-relaxed max-w-lg">
                      {deepResponse.reset_guidance?.breathingLine ??
                        'Take seven deep breaths. With each exhale, release the agitated energy. The Gita teaches that pranayama calms the storm within and creates clarity for genuine repair.'}
                    </p>
                    <VoiceResponseButton
                      text={deepResponse.reset_guidance?.breathingLine ?? 'Take seven deep breaths and release the agitated energy.'}
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
                      onClick={() => setCurrentStep('deep_journey')}
                      className="kiaan-btn-golden px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02]"
                    >
                      Enter the Sacred Journey
                    </button>
                  </div>
                </motion.div>
              )}

              {/* ==================== STEP 4: DEEP JOURNEY (7 PHASES) ==================== */}
              {currentStep === 'deep_journey' && deepResponse && deepResponse.deep_guidance?.phases && (
                <motion.div
                  key="deep_journey"
                  className="space-y-6"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={springConfigs.smooth}
                >
                  {/* Journey header with progress */}
                  <div className="text-center mb-2">
                    <h2 className="text-xl font-semibold kiaan-text-golden">
                      {deepResponse.karmic_path?.name ?? 'Deep Karma Reset'}
                    </h2>
                    <p className="text-xs text-[#d4a44c]/50 mt-1">
                      {deepResponse.karmic_path?.sanskrit_name ?? ''}
                    </p>

                    {/* Phase progress bar */}
                    <div className="flex items-center justify-center gap-1.5 mt-4 mb-2">
                      {(deepResponse.deep_guidance?.phases ?? []).map((phase, idx) => (
                        <button
                          key={phase.phase}
                          onClick={() => setCurrentPhase(idx)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            idx === currentPhase
                              ? 'w-8 bg-[#e8b54a]'
                              : idx < currentPhase
                              ? 'w-4 bg-[#e8b54a]/50'
                              : 'w-4 bg-[#d4a44c]/20'
                          }`}
                          aria-label={`Phase ${phase.phase}: ${phase.english_name}`}
                        />
                      ))}
                    </div>
                    <p className="text-[10px] text-[#d4a44c]/40">
                      Phase {currentPhase + 1} of {totalPhases}
                    </p>
                  </div>

                  {/* Current phase card */}
                  <AnimatePresence mode="wait">
                    {currentPhaseData && (
                      <motion.div
                        key={`phase-${currentPhase}`}
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -30 }}
                        transition={{ duration: 0.3 }}
                        className="divine-reset-container rounded-3xl p-6 sm:p-8"
                      >
                        {/* Phase header */}
                        <div className="flex items-center gap-3 mb-4">
                          <span
                            className="h-10 w-10 rounded-full bg-gradient-to-br from-[#c8943a] to-[#e8b54a] text-[#0a0a12] flex items-center justify-center text-sm font-bold shadow-lg"
                          >
                            {currentPhaseData.phase}
                          </span>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xl">
                                {PHASE_ICONS[currentPhaseData.icon] || '\u2728'}
                              </span>
                              <h3 className="text-lg font-semibold text-[#f5f0e8]">
                                {currentPhaseData.name}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-[#d4a44c]/60">
                                {currentPhaseData.sanskrit_name}
                              </span>
                              <span className="text-[10px] text-[#d4a44c]/40">
                                {currentPhaseData.english_name}
                              </span>
                            </div>
                          </div>
                          <div className="ml-auto">
                            <VoiceResponseButton
                              text={currentPhaseData.guidance}
                              language={language}
                              size="md"
                              variant="accent"
                            />
                          </div>
                        </div>

                        {/* Phase guidance text */}
                        <div className="text-sm leading-relaxed text-[#f5f0e8]/80 bg-black/20 rounded-xl p-5 border border-[#d4a44c]/10 font-sacred">
                          {currentPhaseData.guidance}
                        </div>

                        {/* Show core verse on the wisdom integration phase */}
                        {currentPhaseData.phase === 7 && deepResponse.deep_guidance?.core_verse && (
                          <div className="mt-4 p-4 rounded-xl bg-[#d4a44c]/5 border border-[#d4a44c]/20">
                            <p className="text-xs text-[#d4a44c]/60 uppercase tracking-wider mb-2">
                              Core Verse &middot; BG {deepResponse.deep_guidance.core_verse.chapter}.{deepResponse.deep_guidance.core_verse.verse}
                            </p>
                            {deepResponse.deep_guidance.core_verse.sanskrit && (
                              <p className="text-sm text-[#e8b54a]/80 font-sacred mb-2 leading-relaxed">
                                {deepResponse.deep_guidance.core_verse.sanskrit}
                              </p>
                            )}
                            {deepResponse.deep_guidance.core_verse.transliteration && (
                              <p className="text-xs text-[#f5f0e8]/50 italic mb-2">
                                {deepResponse.deep_guidance.core_verse.transliteration}
                              </p>
                            )}
                            <p className="text-sm text-[#f5f0e8]/70 leading-relaxed">
                              {deepResponse.deep_guidance.core_verse.english}
                            </p>
                            {deepResponse.deep_guidance.core_verse.hindi && (
                              <p className="text-sm text-[#f5f0e8]/55 mt-2 leading-relaxed">
                                {deepResponse.deep_guidance.core_verse.hindi}
                              </p>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Navigation buttons */}
                  <div className="flex gap-4 justify-center flex-wrap">
                    {currentPhase > 0 && (
                      <button
                        onClick={goBackPhase}
                        className="px-6 py-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-[#d4a44c]/20 hover:border-[#d4a44c]/35 text-[#f5f0e8]/80 font-semibold transition-all duration-200"
                      >
                        Previous Phase
                      </button>
                    )}

                    {!isLastPhase ? (
                      <motion.button
                        onClick={advancePhase}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="kiaan-btn-golden px-8 py-3 rounded-xl font-semibold transition-all duration-200"
                      >
                        Next Phase
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={handleComplete}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        className="kiaan-btn-golden px-8 py-3 rounded-xl font-semibold transition-all duration-200"
                      >
                        Complete Sacred Journey
                      </motion.button>
                    )}
                  </div>

                  {/* Sadhana section (visible after phase 5) */}
                  {currentPhase >= 5 && (deepResponse.deep_guidance?.sadhana?.length ?? 0) > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="divine-reset-container rounded-3xl p-6"
                    >
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-lg">{'\u{1F4FF}'}</span>
                        <h3 className="text-base font-semibold text-[#f5f0e8]">
                          Daily Sadhana for Sustained Transformation
                        </h3>
                      </div>
                      <div className="space-y-3">
                        {(deepResponse.deep_guidance?.sadhana ?? []).map((practice, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-3 p-3 rounded-xl bg-black/20 border border-[#d4a44c]/10"
                          >
                            <span className="h-6 w-6 rounded-full bg-[#d4a44c]/20 text-[#e8b54a] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-sm text-[#f5f0e8]/70 leading-relaxed font-sacred">
                              {practice}
                            </p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}

                  {/* Verse wisdom section (shown on completion) */}
                  {showVerseDetail && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="space-y-4"
                    >
                      {/* Karmic teaching */}
                      <div className="divine-reset-container rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{'\u{1F4D6}'}</span>
                          <h3 className="text-base font-semibold text-[#f5f0e8]">
                            Karmic Teaching
                          </h3>
                        </div>
                        <p className="text-sm text-[#f5f0e8]/70 leading-relaxed font-sacred">
                          {deepResponse.karmic_path?.karmic_teaching ?? 'The Gita teaches that every action creates consequence, and every consequence is an opportunity for growth.'}
                        </p>
                      </div>

                      {/* Guna analysis */}
                      <div className="divine-reset-container rounded-3xl p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">{'\u2728'}</span>
                          <h3 className="text-base font-semibold text-[#f5f0e8]">
                            Guna Analysis
                          </h3>
                        </div>
                        <p className="text-sm text-[#f5f0e8]/70 leading-relaxed font-sacred">
                          {deepResponse.karmic_path?.guna_analysis ?? 'Through awareness and practice, we transform the gunas that drive our actions.'}
                        </p>
                      </div>

                      {/* Supporting verses */}
                      {(deepResponse.deep_guidance?.supporting_verses?.length ?? 0) > 0 && (
                        <div className="divine-reset-container rounded-3xl p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">{'\u{1F4DC}'}</span>
                            <h3 className="text-base font-semibold text-[#f5f0e8]">
                              Supporting Gita Verses
                            </h3>
                          </div>
                          <div className="space-y-3">
                            {(deepResponse.deep_guidance?.supporting_verses ?? []).map((sv, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-black/20 border border-[#d4a44c]/10"
                              >
                                <p className="text-xs text-[#d4a44c]/60 mb-1">
                                  BG {sv.chapter}.{sv.verse}
                                </p>
                                <p className="text-sm text-[#f5f0e8]/70 font-sacred">
                                  {sv.key_teaching}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Validation score */}
                      {deepResponse.kiaan_metadata && (
                        <div className="divine-reset-container rounded-3xl p-6">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="text-lg">{'\u{1F3AF}'}</span>
                            <h3 className="text-base font-semibold text-[#f5f0e8]">
                              Gita Compliance
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="p-3 rounded-xl bg-black/20 border border-[#d4a44c]/10 text-center">
                              <p className="text-lg font-bold text-[#e8b54a]">
                                {deepResponse.kiaan_metadata.compliance_level || 'N/A'}
                              </p>
                              <p className="text-[10px] text-[#f5f0e8]/40 uppercase">Compliance</p>
                            </div>
                            <div className="p-3 rounded-xl bg-black/20 border border-[#d4a44c]/10 text-center">
                              <p className="text-lg font-bold text-[#e8b54a]">
                                {deepResponse.kiaan_metadata.pillars_met}/5
                              </p>
                              <p className="text-[10px] text-[#f5f0e8]/40 uppercase">Pillars Met</p>
                            </div>
                            <div className="p-3 rounded-xl bg-black/20 border border-[#d4a44c]/10 text-center">
                              <p className="text-lg font-bold text-[#e8b54a]">
                                {deepResponse.kiaan_metadata.verses_used}
                              </p>
                              <p className="text-[10px] text-[#f5f0e8]/40 uppercase">Verses Used</p>
                            </div>
                            <div className="p-3 rounded-xl bg-black/20 border border-[#d4a44c]/10 text-center">
                              <p className="text-lg font-bold text-[#e8b54a]">
                                {Math.round((deepResponse.kiaan_metadata.five_pillar_score || 0) * 100)}%
                              </p>
                              <p className="text-[10px] text-[#f5f0e8]/40 uppercase">Five Pillar</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Confetti */}
                      <ConfettiEffect trigger={showConfetti} />

                      {/* Final actions */}
                      <div className="flex gap-4 justify-center flex-wrap pt-4">
                        <button
                          onClick={resetForm}
                          className="kiaan-btn-golden px-8 py-3 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02]"
                        >
                          Begin New Karmic Journey
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* All 7 phases overview card */}
                  {!showVerseDetail && (
                    <DeepResetPlanCard
                      phases={deepResponse.deep_guidance?.phases ?? []}
                      currentPhase={currentPhase}
                      onPhaseClick={setCurrentPhase}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar */}
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
