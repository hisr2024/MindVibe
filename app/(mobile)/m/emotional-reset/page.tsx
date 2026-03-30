'use client'

/**
 * Sacred Mobile Emotional Reset — The Journey from Battlefield to Stillness
 *
 * A 6-phase sacred ritual of emotional alchemy:
 *   Phase 0: THE ARRIVAL — Entry ritual, transition into sacred space
 *   Phase 1: THE FEELING MANDALA — Sacred emotion selection via living mandala
 *   Phase 2: THE SACRED WITNESS — Sakha receives your emotion with verse + reflection
 *   Phase 3: THE BREATH RITUAL — Pranayama breathing mandala
 *   Phase 4: THE INTEGRATION — Personalized wisdom + journal + affirmation
 *   Phase 5: THE RELEASE — Completion ceremony (particle convergence → OM → burst)
 *
 * "When Arjuna was overwhelmed on Kurukshetra, his bow fell from his hands.
 *  Krishna did not give him a form to fill. Krishna held space."
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { MobileFeelingMandala, type EmotionalState } from '@/components/mobile/MobileFeelingMandala'
import { MobileBreathMandala } from '@/components/mobile/MobileBreathMandala'
import { MobileSacredCeremony } from '@/components/mobile/MobileSacredCeremony'
import { MobileWordReveal, MobileSentenceReveal } from '@/components/mobile/MobileWordReveal'
import { MobileSacredRipple } from '@/components/mobile/MobileSacredRipple'
import { MobileTextarea } from '@/components/mobile/MobileInput'
import { MobileButton } from '@/components/mobile/MobileButton'
import { MobileCard } from '@/components/mobile/MobileCard'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'
import { VoiceInputButton, VoiceResponseButton } from '@/components/voice'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useLanguage } from '@/hooks/useLanguage'
import {
  startEmotionalReset,
  processStep as apiProcessStep,
  completeSession as apiCompleteSession,
} from '@/lib/api/emotional-reset'
import { springConfigs } from '@/lib/animations/spring-configs'

type Phase = 0 | 1 | 2 | 3 | 4 | 5

/** Breathing pattern based on intensity */
function breathPatternForIntensity(intensity: number) {
  if (intensity <= 2) return { inhale: 4, hold_in: 4, exhale: 4, hold_out: 1 }
  if (intensity <= 4) return { inhale: 4, hold_in: 7, exhale: 8, hold_out: 1 }
  return { inhale: 2, hold_in: 4, exhale: 6, hold_out: 1 }
}

/** AI response sections parsed from the raw text */
interface AIResponse {
  witness: string
  shloka: { sanskrit: string; transliteration: string; translation: string; reference: string }
  reflection: string
  affirmation: string
}

/** Parse AI response into sections */
function parseAIResponse(raw: string): AIResponse | null {
  try {
    const witnessMatch = raw.match(/\[WITNESS\]\s*([\s\S]*?)(?=\[SHLOKA\])/i)
    const shlokaMatch = raw.match(/\[SHLOKA\]\s*([\s\S]*?)(?=\[REFLECTION\])/i)
    const reflectionMatch = raw.match(/\[REFLECTION\]\s*([\s\S]*?)(?=\[AFFIRMATION\])/i)
    const affirmationMatch = raw.match(/\[AFFIRMATION\]\s*([\s\S]*?)$/i)

    const witness = witnessMatch?.[1]?.trim() || ''
    const shlokaText = shlokaMatch?.[1]?.trim() || ''
    const reflection = reflectionMatch?.[1]?.trim() || ''
    const affirmation = affirmationMatch?.[1]?.trim() || ''

    // Parse shloka sections
    const shlokaLines = shlokaText.split('\n').filter(Boolean).map(s => s.trim())
    const shloka = {
      sanskrit: shlokaLines[0] || '',
      transliteration: shlokaLines[1] || '',
      translation: shlokaLines[2] || '',
      reference: shlokaLines[3] || '',
    }

    if (!witness && !reflection) return null
    return { witness, shloka, reflection, affirmation }
  } catch {
    return null
  }
}

export default function MobileEmotionalResetPage() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const { triggerHaptic } = useHapticFeedback()
  const { language } = useLanguage()

  // Phase state
  const [phase, setPhase] = useState<Phase>(0)
  const [selectedEmotion, setSelectedEmotion] = useState<EmotionalState | null>(null)
  const [intensity, setIntensity] = useState(0)
  const [userContext, setUserContext] = useState('')

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [aiResponse, setAiResponse] = useState<AIResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Breath state
  const [breathComplete, setBreathComplete] = useState(false)

  // Integration state
  const [journalEntry, setJournalEntry] = useState('')

  // Ceremony state
  const [showCeremony, setShowCeremony] = useState(false)
  const [startTime] = useState(() => Date.now())

  // Arrival animation
  const [showRipple, setShowRipple] = useState(false)
  const [rippleOrigin] = useState(() => ({
    x: typeof window !== 'undefined' ? window.innerWidth / 2 : 200,
    y: typeof window !== 'undefined' ? window.innerHeight / 2 : 400,
  }))

  // Phase 0: Arrival sequence
  useEffect(() => {
    if (phase !== 0) return

    if (reduceMotion) {
      setPhase(1)
      return
    }

    setShowRipple(true)

    const timers = [
      setTimeout(() => setShowRipple(false), 1200),
      setTimeout(() => setPhase(1), 1600),
    ]

    return () => timers.forEach(clearTimeout)
  }, [phase, reduceMotion])

  // Handle emotion selection from mandala
  const handleEmotionSelect = useCallback((emotion: EmotionalState, selectedIntensity: number) => {
    setSelectedEmotion(emotion)
    setIntensity(selectedIntensity)
  }, [])

  // Submit emotion to Sakha (Phase 1 → Phase 2)
  const handleOfferToSakha = useCallback(async () => {
    if (!selectedEmotion) return

    triggerHaptic('medium')
    setPhase(2)
    setIsLoading(true)
    setError(null)

    try {
      // Start an emotional reset session
      const sessionData = await startEmotionalReset()
      setSessionId(sessionData.session_id)

      // Process step 1 with user's emotion input
      const emotionText = `I am feeling ${selectedEmotion.label.toLowerCase()} (${selectedEmotion.sanskrit}) at intensity ${intensity}/5.${userContext ? ` ${userContext}` : ''}`

      const stepData = await apiProcessStep(
        sessionData.session_id,
        1,
        emotionText
      )

      // Try to parse as sectioned response
      const guidance = stepData.guidance || ''
      const parsed = parseAIResponse(guidance)

      if (parsed) {
        setAiResponse(parsed)
      } else {
        // Fallback: use the full guidance as witness text
        setAiResponse({
          witness: guidance,
          shloka: { sanskrit: '', transliteration: '', translation: '', reference: '' },
          reflection: stepData.assessment?.assessment || '',
          affirmation: '',
        })
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unable to connect. Please try again.'
      setError(msg)
      // Provide fallback
      setAiResponse({
        witness: `Dear one, I see you carrying ${selectedEmotion?.label.toLowerCase() || 'this weight'}. Your feeling is valid and witnessed.`,
        shloka: {
          sanskrit: '\u0927\u0943\u0924\u093F\u0938\u094D\u092E\u0943\u0924\u093F\u0932\u092D\u0938\u094D\u0924\u0924\u094D\u0924\u094D\u0935\u0902',
          transliteration: 'dhritis smritir labhas tattvam',
          translation: 'Fortitude, memory, wisdom, and steadfastness \u2014 these are born of sattva.',
          reference: 'BG 18.43',
        },
        reflection: 'The Gita reminds us that within every storm of emotion lies the unchanged Atman. Like the ocean remains deep even when its surface churns, your true self is unshaken.',
        affirmation: 'I am the eternal witness, undisturbed by the waves of temporary feeling.',
      })
    } finally {
      setIsLoading(false)
    }
  }, [selectedEmotion, intensity, userContext, triggerHaptic])

  // Move to breathing
  const handleMoveToBreath = useCallback(() => {
    triggerHaptic('light')
    setPhase(3)
  }, [triggerHaptic])

  // Breathing complete → Integration
  const handleBreathComplete = useCallback(() => {
    setBreathComplete(true)
    triggerHaptic('success')
    setTimeout(() => setPhase(4), 800)
  }, [triggerHaptic])

  // Complete session → Ceremony
  const handleCompleteReset = useCallback(async () => {
    triggerHaptic('medium')
    setShowCeremony(true)
    setPhase(5)

    // Complete the backend session
    if (sessionId) {
      try {
        await apiCompleteSession(sessionId)
      } catch {
        // Ceremony still plays even if API fails
      }
    }
  }, [sessionId, triggerHaptic])

  // Ceremony complete → navigate away
  const handleCeremonyComplete = useCallback(() => {
    router.push('/m')
  }, [router])

  // Duration string
  const durationStr = (() => {
    const elapsed = Math.floor((Date.now() - startTime) / 60000)
    return `${Math.max(1, elapsed)} min`
  })()

  // Scroll to top on phase change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [phase])

  // Determine if we should show tab bar
  const isImmersive = phase === 0 || phase === 3 || phase === 5

  return (
    <MobileAppShell
      title={phase === 0 ? undefined : 'Emotional Reset'}
      showBack={phase > 0 && phase < 5}
      onBack={() => {
        if (phase > 1) setPhase((phase - 1) as Phase)
        else router.back()
      }}
      showHeader={phase > 0 && phase < 5}
      showTabBar={!isImmersive}
    >
      {/* Sacred background */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, #0A0D28 0%, var(--sacred-cosmic-void, #050714) 70%)',
          zIndex: 0,
        }}
      />

      {/* Sacred ripple on arrival */}
      <MobileSacredRipple origin={rippleOrigin} active={showRipple} />

      {/* ==================== PHASE 0: THE ARRIVAL ==================== */}
      <AnimatePresence mode="popLayout">
        {phase === 0 && (
          <motion.div
            key="arrival"
            className="fixed inset-0 flex flex-col items-center justify-center"
            style={{ zIndex: 10, background: 'var(--sacred-cosmic-void, #050714)' }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <SacredOMLoader size={64} message="Entering sacred space..." />
          </motion.div>
        )}

        {/* ==================== PHASE 1: THE FEELING MANDALA ==================== */}
        {phase === 1 && (
          <motion.div
            key="mandala"
            className="relative px-4 pt-2 pb-6"
            style={{ zIndex: 2, willChange: 'transform, opacity', touchAction: 'manipulation' }}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -12 }}
            transition={springConfigs.gentle}
          >
            {/* Header */}
            <div className="text-center mb-4">
              <p
                style={{
                  fontSize: '10px',
                  color: 'var(--sacred-text-muted, #6B6355)',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                }}
              >
                The Paramatma is with you
              </p>
            </div>

            {/* The Sacred Mandala */}
            <MobileFeelingMandala
              onSelect={handleEmotionSelect}
            />

            {/* Optional context textarea — appears after emotion+intensity selected */}
            <AnimatePresence>
              {selectedEmotion && intensity > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-4 px-2"
                >
                  <div
                    className="rounded-[20px] p-4"
                    style={{
                      background: 'rgba(22,26,66,0.4)',
                      border: '1px solid rgba(212,160,23,0.15)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <label
                        className="text-sm"
                        style={{
                          color: 'var(--sacred-text-muted, #6B6355)',
                          fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                          fontStyle: 'italic',
                        }}
                      >
                        Pour your heart here... (optional)
                      </label>
                      <VoiceInputButton
                        language={language}
                        onTranscript={(text) => setUserContext(prev => prev ? `${prev} ${text}` : text)}
                      />
                    </div>
                    <MobileTextarea
                      value={userContext}
                      onChange={(e) => setUserContext(e.target.value)}
                      placeholder="Speak freely \u2014 this is sacred space"
                      minRows={3}
                      maxLength={500}
                      className="!bg-transparent !border-none !p-0 !text-[var(--sacred-text-primary,#EDE8DC)]"
                    />
                  </div>

                  <MobileButton
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleOfferToSakha}
                    className="mt-4"
                    leftIcon={<span style={{ fontSize: '16px' }}>{'\u{1F33A}'}</span>}
                  >
                    Offer to Sakha
                  </MobileButton>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* ==================== PHASE 2: THE SACRED WITNESS ==================== */}
        {phase === 2 && (
          <motion.div
            key="witness"
            className="relative px-5 pt-2 pb-8"
            style={{ zIndex: 2, willChange: 'transform, opacity', touchAction: 'manipulation', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' as any }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={springConfigs.gentle}
          >
            {/* Sakha avatar receiving */}
            <div className="flex flex-col items-center mb-6">
              <motion.div
                className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(212,160,23,0.3), rgba(6,182,212,0.15))',
                  border: '1px solid rgba(212,160,23,0.3)',
                  boxShadow: '0 0 24px rgba(212,160,23,0.15)',
                }}
                animate={isLoading && !reduceMotion ? {
                  boxShadow: [
                    '0 0 24px rgba(212,160,23,0.15)',
                    '0 0 48px rgba(212,160,23,0.3)',
                    '0 0 24px rgba(212,160,23,0.15)',
                  ],
                } : {}}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <span style={{ fontSize: '28px' }}>{'\u{1F64F}'}</span>
              </motion.div>

              {isLoading && (
                <motion.p
                  animate={!reduceMotion ? { opacity: [0.4, 1, 0.4] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="mt-3 text-xs"
                  style={{
                    color: 'var(--sacred-divine-gold, #D4A017)',
                    fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                    fontStyle: 'italic',
                  }}
                >
                  Sakha is receiving your offering...
                </motion.p>
              )}
            </div>

            {/* Error state */}
            {error && (
              <MobileCard variant="outlined" className="mb-4 !border-amber-500/20">
                <p className="text-xs" style={{ color: 'var(--sacred-saffron-core, #F97316)' }}>
                  {error}
                </p>
              </MobileCard>
            )}

            {/* AI Response */}
            {aiResponse && !isLoading && (
              <div className="space-y-5">
                {/* WITNESS section */}
                <div>
                  <MobileWordReveal
                    text={aiResponse.witness}
                    speed={60}
                    className="leading-relaxed"
                    as="p"
                  />
                </div>

                {/* SHLOKA section — elevated sacred card */}
                {aiResponse.shloka.sanskrit && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.4, ...springConfigs.gentle }}
                  >
                    <MobileCard variant="elevated" className="!p-5">
                      {/* Sacred top border */}
                      <div
                        className="absolute inset-x-0 top-0 h-0.5 rounded-t-[18px]"
                        style={{ background: 'linear-gradient(90deg, transparent, var(--sacred-divine-gold, #D4A017), transparent)' }}
                      />

                      {/* Sanskrit */}
                      <p
                        className="text-center leading-relaxed mb-2"
                        style={{
                          color: 'var(--sacred-divine-gold-bright, #F0C040)',
                          fontSize: '18px',
                          fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                          fontStyle: 'italic',
                          textShadow: '0 0 10px rgba(212,160,23,0.3)',
                        }}
                      >
                        {aiResponse.shloka.sanskrit}
                      </p>

                      {/* Transliteration */}
                      {aiResponse.shloka.transliteration && (
                        <p
                          className="text-center mb-2"
                          style={{
                            color: 'var(--sacred-text-secondary, #B8AE98)',
                            fontSize: '12px',
                            fontFamily: 'var(--font-scripture, Crimson Text, serif)',
                            fontStyle: 'italic',
                          }}
                        >
                          {aiResponse.shloka.transliteration}
                        </p>
                      )}

                      {/* Translation */}
                      <p
                        className="text-center mb-2"
                        style={{
                          color: 'var(--sacred-text-primary, #EDE8DC)',
                          fontSize: '14px',
                          fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                          lineHeight: 1.6,
                        }}
                      >
                        {aiResponse.shloka.translation}
                      </p>

                      {/* Reference */}
                      {aiResponse.shloka.reference && (
                        <p
                          className="text-right"
                          style={{
                            fontSize: '10px',
                            color: 'var(--sacred-text-muted, #6B6355)',
                            fontFamily: 'monospace',
                          }}
                        >
                          {aiResponse.shloka.reference}
                        </p>
                      )}

                      {/* Voice */}
                      <div className="flex justify-end mt-2">
                        <VoiceResponseButton
                          text={`${aiResponse.shloka.translation}. ${aiResponse.shloka.reference}`}
                          language={language}
                          size="sm"
                          variant="minimal"
                        />
                      </div>
                    </MobileCard>
                  </motion.div>
                )}

                {/* REFLECTION section */}
                {aiResponse.reflection && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                  >
                    <MobileSentenceReveal
                      text={aiResponse.reflection}
                      delay={1200}
                      speed={300}
                      className="leading-[1.85]"
                    />
                  </motion.div>
                )}

                {/* AFFIRMATION section — the culminating moment */}
                {aiResponse.affirmation && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.8 }}
                    className="text-center py-4"
                  >
                    <motion.p
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 2, ...springConfigs.gentle }}
                      style={{
                        color: 'var(--sacred-divine-gold, #D4A017)',
                        fontSize: '20px',
                        fontFamily: 'var(--font-display, Playfair Display, serif)',
                        fontStyle: 'italic',
                        letterSpacing: '0.03em',
                        lineHeight: 1.6,
                        textShadow: '0 0 16px rgba(212,160,23,0.2)',
                      }}
                    >
                      &ldquo;{aiResponse.affirmation}&rdquo;
                    </motion.p>
                  </motion.div>
                )}

                {/* Continue to breathing CTA */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 2.5 }}
                >
                  <MobileButton
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={handleMoveToBreath}
                  >
                    Begin Sacred Breathing
                  </MobileButton>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}

        {/* ==================== PHASE 3: THE BREATH RITUAL ==================== */}
        {phase === 3 && (
          <motion.div
            key="breath"
            className="fixed inset-0 flex flex-col items-center justify-center px-6"
            style={{
              zIndex: 10,
              background: 'radial-gradient(ellipse at 50% 50%, #0A0D28 0%, var(--sacred-cosmic-void, #050714) 80%)',
              willChange: 'opacity',
              touchAction: 'manipulation',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Back button */}
            <button
              className="absolute top-[env(safe-area-inset-top,16px)] left-4 p-2 rounded-full"
              style={{
                marginTop: 'env(safe-area-inset-top, 16px)',
                background: 'rgba(255,255,255,0.06)',
              }}
              onClick={() => setPhase(2)}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" style={{ color: 'var(--sacred-text-secondary, #B8AE98)' }} />
            </button>

            <p
              className="mb-2"
              style={{
                fontSize: '10px',
                color: 'var(--sacred-text-muted, #6B6355)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
              }}
            >
              Sacred Breath Purification
            </p>

            <MobileBreathMandala
              pattern={breathPatternForIntensity(intensity)}
              rounds={4}
              autoStart
              onComplete={handleBreathComplete}
            />

            {/* Skip option */}
            {!breathComplete && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 5 }}
                onClick={handleBreathComplete}
                className="mt-6 text-xs"
                style={{ color: 'var(--sacred-text-muted, #6B6355)' }}
              >
                Skip breathing
              </motion.button>
            )}
          </motion.div>
        )}

        {/* ==================== PHASE 4: THE INTEGRATION ==================== */}
        {phase === 4 && (
          <motion.div
            key="integration"
            className="relative px-5 pt-2 pb-40"
            style={{ zIndex: 2, willChange: 'transform, opacity', touchAction: 'manipulation', WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' as any }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={springConfigs.gentle}
          >
            {/* Emotional journey summary */}
            <MobileCard variant="outlined" className="mb-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                  style={{
                    background: `${selectedEmotion?.glowColor || '#D4A017'}20`,
                    border: `1px solid ${selectedEmotion?.glowColor || '#D4A017'}40`,
                  }}
                >
                  <span style={{ fontSize: '16px' }}>{'\u{1F33A}'}</span>
                </div>
                <div>
                  <p
                    className="text-xs"
                    style={{
                      color: 'var(--sacred-text-muted, #6B6355)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Your Emotional Journey
                  </p>
                  <p
                    style={{
                      color: selectedEmotion?.glowColor || 'var(--sacred-divine-gold, #D4A017)',
                      fontSize: '14px',
                      fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                    }}
                  >
                    {selectedEmotion?.label} ({selectedEmotion?.sanskrit}) &middot; Intensity {intensity}/5
                  </p>
                </div>
              </div>
            </MobileCard>

            {/* Saved shloka */}
            {aiResponse?.shloka?.translation && (
              <MobileCard variant="elevated" className="mb-4 !p-4">
                <div className="flex items-center justify-between mb-2">
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'var(--sacred-divine-gold, #D4A017)',
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                    }}
                  >
                    Saved to Sacred Library
                  </span>
                  <span style={{ fontSize: '14px' }}>{'\u{1F516}'}</span>
                </div>
                <p
                  style={{
                    color: 'var(--sacred-divine-gold-bright, #F0C040)',
                    fontSize: '15px',
                    fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                  }}
                >
                  &ldquo;{aiResponse.shloka.translation}&rdquo;
                </p>
                <p className="text-right mt-1" style={{ fontSize: '10px', color: 'var(--sacred-text-muted, #6B6355)' }}>
                  {aiResponse.shloka.reference}
                </p>
              </MobileCard>
            )}

            {/* Journal reflection */}
            <div className="mb-4">
              <p
                className="mb-2"
                style={{
                  color: 'var(--sacred-divine-gold, #D4A017)',
                  fontSize: '16px',
                  fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                  fontStyle: 'italic',
                }}
              >
                What arose for you?
              </p>
              <MobileTextarea
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="Your sacred journal awaits..."
                minRows={4}
                helperText="This stays private and sacred"
              />
            </div>

            {/* Sacred affirmation talisman */}
            {aiResponse?.affirmation && (
              <div
                className="rounded-[20px] p-5 text-center mb-4"
                style={{
                  background: 'rgba(5,7,20,0.9)',
                  border: '1px solid var(--sacred-divine-gold, #D4A017)',
                  boxShadow: '0 0 24px rgba(212,160,23,0.08)',
                }}
              >
                <span style={{ fontSize: '12px', color: 'var(--sacred-text-muted, #6B6355)' }}>{'\u0950'}</span>
                <p
                  className="mt-2"
                  style={{
                    color: 'var(--sacred-divine-gold, #D4A017)',
                    fontSize: '18px',
                    fontFamily: 'var(--font-display, Playfair Display, serif)',
                    fontStyle: 'italic',
                    lineHeight: 1.6,
                  }}
                >
                  &ldquo;{aiResponse.affirmation}&rdquo;
                </p>
                <p className="mt-2" style={{ fontSize: '10px', color: 'var(--sacred-text-muted, #6B6355)' }}>
                  Carry this today
                </p>
              </div>
            )}

            {/* Sticky CTA */}
            <div
              className="fixed bottom-0 left-0 right-0 p-4"
              style={{
                paddingBottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
                background: 'linear-gradient(transparent, var(--sacred-cosmic-void, #050714) 30%)',
                zIndex: 20,
              }}
            >
              <MobileButton
                variant="primary"
                size="lg"
                fullWidth
                onClick={handleCompleteReset}
              >
                Complete Sacred Reset
              </MobileButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==================== PHASE 5: THE RELEASE (CEREMONY) ==================== */}
      <MobileSacredCeremony
        variant="emotional"
        active={showCeremony}
        onComplete={handleCeremonyComplete}
        message="Your offering has been received. The Atman within you is untouched."
        secondaryLine={aiResponse?.shloka?.translation}
        duration={durationStr}
        emotionLabel={selectedEmotion ? `${selectedEmotion.label} \u2192 Peace` : undefined}
      />
    </MobileAppShell>
  )
}
