'use client'

/**
 * Onboarding Wizard — 5-step sacred onboarding flow for MindVibe mobile
 *
 * Steps:
 * 1. Welcome — OM symbol animation, Sanskrit mantra, begin invitation
 * 2. Name + Language — user name input, language pill selection
 * 3. Dharmic Path — 4 archetype cards for spiritual level
 * 4. Plan Selection — subscription plans from PLANS array
 * 5. Sacred Activation — personalised greeting, daily wisdom opt-in, final CTA
 *
 * Uses inline styles for pixel-precise sacred design consistency.
 * All sub-components are co-located in this file for self-containment.
 */

import { useState, useCallback, useRef, useEffect, type CSSProperties } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { OmSymbol } from '@/components/sacred/icons/OmSymbol'
import { PLANS, type Plan } from '@/lib/payments/subscription'

/* -------------------------------------------------------------------------- */
/*                            Design Tokens                                   */
/* -------------------------------------------------------------------------- */

const COLORS = {
  bg: '#050714',
  gold: '#D4A017',
  goldMuted: 'rgba(212, 160, 23, 0.35)',
  goldSubtle: 'rgba(212, 160, 23, 0.15)',
  textPrimary: '#F5F0E8',
  textSecondary: 'rgba(245, 240, 232, 0.65)',
  textMuted: 'rgba(245, 240, 232, 0.4)',
  cardBg: 'rgba(212, 160, 23, 0.06)',
  cardBorder: 'rgba(212, 160, 23, 0.18)',
  cardBorderActive: 'rgba(212, 160, 23, 0.6)',
  inputBg: 'rgba(255, 255, 255, 0.05)',
  inputBorder: 'rgba(212, 160, 23, 0.25)',
  inputBorderFocus: 'rgba(212, 160, 23, 0.6)',
  cyan: '#06B6D4',
} as const

const FONTS = {
  display: "'Cormorant Garamond', Georgia, serif",
  scripture: "'Crimson Text', Georgia, serif",
  ui: "'Outfit', -apple-system, sans-serif",
  sanskrit: "'Noto Sans Devanagari', sans-serif",
} as const

/* -------------------------------------------------------------------------- */
/*                           Constants & Types                                */
/* -------------------------------------------------------------------------- */

const TOTAL_STEPS = 5

interface DharmicPath {
  id: string
  title: string
  sanskrit: string
  description: string
  icon: string
}

const DHARMIC_PATHS: DharmicPath[] = [
  {
    id: 'curious-seeker',
    title: 'Curious Seeker',
    sanskrit: 'जिज्ञासु',
    description: 'Just beginning to explore spiritual wisdom',
    icon: '🔍',
  },
  {
    id: 'sincere-student',
    title: 'Sincere Student',
    sanskrit: 'विद्यार्थी',
    description: 'Actively studying the sacred texts',
    icon: '📖',
  },
  {
    id: 'daily-practitioner',
    title: 'Daily Practitioner',
    sanskrit: 'साधक',
    description: 'Committed to daily spiritual practice',
    icon: '🧘',
  },
  {
    id: 'wisdom-sharer',
    title: 'Wisdom Sharer',
    sanskrit: 'गुरु',
    description: 'Guiding others on the path of dharma',
    icon: '🙏',
  },
]

interface Language {
  code: string
  label: string
  native: string
}

const LANGUAGES: Language[] = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
  { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
  { code: 'zh', label: 'Chinese', native: '中文' },
]

/* -------------------------------------------------------------------------- */
/*                          Framer Motion Variants                            */
/* -------------------------------------------------------------------------- */

const stepVariants = {
  enter: (direction: number) => ({
    x: direction * 40,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction * -40,
    opacity: 0,
  }),
}

const stepTransition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
}

/* -------------------------------------------------------------------------- */
/*                          Progress Dots Component                           */
/* -------------------------------------------------------------------------- */

function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingTop: 16,
        paddingBottom: 8,
      }}
    >
      {Array.from({ length: total }).map((_, i) => (
        <motion.div
          key={i}
          animate={{
            width: i === current ? 20 : 6,
            backgroundColor: i === current ? COLORS.gold : COLORS.goldMuted,
            opacity: i === current ? 1 : 0.5,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          style={{
            height: 6,
            borderRadius: 3,
          }}
        />
      ))}
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                            StepHeader Component                            */
/* -------------------------------------------------------------------------- */

function StepHeader({
  currentStep,
  onBack,
}: {
  currentStep: number
  onBack: () => void
}) {
  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 'max(env(safe-area-inset-top, 12px), 12px)',
        paddingLeft: 16,
        paddingRight: 16,
        minHeight: 48,
      }}
    >
      {currentStep > 0 && currentStep <= 4 && (
        <button
          onClick={onBack}
          aria-label="Go back"
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            color: COLORS.textSecondary,
            fontSize: 24,
            cursor: 'pointer',
            padding: 8,
            minHeight: 48,
            minWidth: 48,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            touchAction: 'manipulation' as const,
          }}
        >
          ←
        </button>
      )}
      <ProgressDots current={currentStep} total={TOTAL_STEPS} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                           StepCTA Component                                */
/* -------------------------------------------------------------------------- */

function StepCTA({
  label,
  onClick,
  disabled = false,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <div
      style={{
        padding: '16px 24px',
        paddingBottom: 'max(env(safe-area-inset-bottom, 24px), 24px)',
      }}
    >
      <button
        onClick={onClick}
        disabled={disabled}
        style={{
          width: '100%',
          minHeight: 48,
          padding: '14px 24px',
          borderRadius: 12,
          border: 'none',
          background: disabled
            ? COLORS.goldSubtle
            : `linear-gradient(135deg, ${COLORS.gold} 0%, #B8860B 100%)`,
          color: disabled ? COLORS.textMuted : COLORS.bg,
          fontFamily: FONTS.ui,
          fontSize: 16,
          fontWeight: 600,
          letterSpacing: 0.5,
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'opacity 0.2s ease, transform 0.15s ease',
          touchAction: 'manipulation' as const,
        }}
      >
        {label}
      </button>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                        Step 1: WelcomeStep                                 */
/* -------------------------------------------------------------------------- */

function WelcomeStep({ onContinue }: { onContinue: () => void }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '0 32px',
        textAlign: 'center',
      }}
    >
      {/* Animated OM symbol */}
      <motion.div
        initial={{ opacity: 0, scale: 0.6, rotate: -10 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ marginBottom: 40 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        >
          <OmSymbol
            width={96}
            height={96}
            className=""
            animated
          />
        </motion.div>
      </motion.div>

      {/* Welcome text */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        style={{
          fontFamily: FONTS.display,
          fontSize: 32,
          fontWeight: 300,
          color: COLORS.textPrimary,
          lineHeight: 1.3,
          marginBottom: 16,
        }}
      >
        Welcome, dear soul
      </motion.h1>

      {/* Sanskrit mantra */}
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.7 }}
        style={{
          fontFamily: FONTS.sanskrit,
          fontSize: 18,
          color: COLORS.gold,
          lineHeight: 2.0,
          marginBottom: 12,
        }}
      >
        ॐ सह नाववतु । सह नौ भुनक्तु ।
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 1.0 }}
        style={{
          fontFamily: FONTS.scripture,
          fontSize: 14,
          color: COLORS.textSecondary,
          fontStyle: 'italic',
          maxWidth: 280,
          lineHeight: 1.6,
        }}
      >
        &ldquo;May we be protected together, may we be nourished together.&rdquo;
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        style={{ marginTop: 48, width: '100%', maxWidth: 320 }}
      >
        <StepCTA label="Begin the journey →" onClick={onContinue} />
      </motion.div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                    Step 2: NameLanguageStep                                */
/* -------------------------------------------------------------------------- */

function NameLanguageStep({
  name,
  onNameChange,
  language,
  onLanguageChange,
  onContinue,
}: {
  name: string
  onNameChange: (name: string) => void
  language: string
  onLanguageChange: (code: string) => void
  onContinue: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isValid = name.trim().length > 0

  useEffect(() => {
    // Auto-focus the name input after the step animates in
    const timer = setTimeout(() => {
      inputRef.current?.focus()
    }, 400)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: '0 24px',
        overflowY: 'auto',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 32, marginTop: 24 }}>
        <h2
          style={{
            fontFamily: FONTS.display,
            fontSize: 28,
            fontWeight: 300,
            color: COLORS.textPrimary,
            lineHeight: 1.3,
            marginBottom: 8,
          }}
        >
          What shall we call you?
        </h2>
        <p
          style={{
            fontFamily: FONTS.scripture,
            fontSize: 14,
            color: COLORS.textSecondary,
            fontStyle: 'italic',
          }}
        >
          Every soul has a name that carries its vibration
        </p>
      </div>

      {/* Name input */}
      <div style={{ marginBottom: 32 }}>
        <input
          ref={inputRef}
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          placeholder="Your name"
          autoComplete="given-name"
          style={{
            width: '100%',
            padding: '14px 16px',
            borderRadius: 12,
            border: `1px solid ${COLORS.inputBorder}`,
            background: COLORS.inputBg,
            color: COLORS.textPrimary,
            fontFamily: FONTS.ui,
            fontSize: 16,
            outline: 'none',
            transition: 'border-color 0.2s ease',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = COLORS.inputBorderFocus
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = COLORS.inputBorder
          }}
        />
      </div>

      {/* Language selection */}
      <div style={{ marginBottom: 24 }}>
        <p
          style={{
            fontFamily: FONTS.ui,
            fontSize: 14,
            fontWeight: 500,
            color: COLORS.textSecondary,
            marginBottom: 12,
            textAlign: 'center',
          }}
        >
          Preferred language
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 8,
            justifyContent: 'center',
          }}
        >
          {LANGUAGES.map((lang) => {
            const isActive = language === lang.code
            return (
              <button
                key={lang.code}
                onClick={() => onLanguageChange(lang.code)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 20,
                  border: `1px solid ${isActive ? COLORS.cardBorderActive : COLORS.cardBorder}`,
                  background: isActive ? COLORS.goldSubtle : 'transparent',
                  color: isActive ? COLORS.gold : COLORS.textSecondary,
                  fontFamily: FONTS.ui,
                  fontSize: 13,
                  fontWeight: isActive ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  touchAction: 'manipulation' as const,
                  minHeight: 36,
                }}
              >
                {lang.native}
              </button>
            )
          })}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <StepCTA
        label="Continue →"
        onClick={onContinue}
        disabled={!isValid}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                      Step 3: DharmicPathStep                               */
/* -------------------------------------------------------------------------- */

function DharmicPathStep({
  selectedPath,
  onSelect,
}: {
  selectedPath: string | null
  onSelect: (pathId: string) => void
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: '0 24px',
        overflowY: 'auto',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 28, marginTop: 24 }}>
        <h2
          style={{
            fontFamily: FONTS.display,
            fontSize: 28,
            fontWeight: 300,
            color: COLORS.textPrimary,
            lineHeight: 1.3,
            marginBottom: 8,
          }}
        >
          Where are you on the path?
        </h2>
        <p
          style={{
            fontFamily: FONTS.scripture,
            fontSize: 14,
            color: COLORS.textSecondary,
            fontStyle: 'italic',
          }}
        >
          There is no wrong answer — every step is sacred
        </p>
      </div>

      {/* Path cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {DHARMIC_PATHS.map((path) => {
          const isActive = selectedPath === path.id
          return (
            <motion.button
              key={path.id}
              onClick={() => onSelect(path.id)}
              whileTap={{ scale: 0.97 }}
              animate={{
                borderColor: isActive ? COLORS.cardBorderActive : COLORS.cardBorder,
                backgroundColor: isActive ? COLORS.goldSubtle : COLORS.cardBg,
              }}
              transition={{ duration: 0.2 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '16px 18px',
                borderRadius: 14,
                border: `1px solid ${COLORS.cardBorder}`,
                background: COLORS.cardBg,
                cursor: 'pointer',
                textAlign: 'left',
                touchAction: 'manipulation' as const,
                minHeight: 48,
                width: '100%',
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>{path.icon}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    gap: 8,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      fontFamily: FONTS.ui,
                      fontSize: 15,
                      fontWeight: 600,
                      color: isActive ? COLORS.gold : COLORS.textPrimary,
                    }}
                  >
                    {path.title}
                  </span>
                  <span
                    style={{
                      fontFamily: FONTS.sanskrit,
                      fontSize: 13,
                      color: COLORS.gold,
                      lineHeight: 2.0,
                    }}
                  >
                    {path.sanskrit}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: FONTS.ui,
                    fontSize: 12,
                    color: COLORS.textMuted,
                    lineHeight: 1.4,
                  }}
                >
                  {path.description}
                </span>
              </div>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: COLORS.gold,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    color: COLORS.bg,
                    flexShrink: 0,
                  }}
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      <div style={{ flex: 1 }} />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                        Step 4: PlanStep                                    */
/* -------------------------------------------------------------------------- */

function PlanStep({
  selectedPlan,
  onSelect,
  onContinue,
}: {
  selectedPlan: string | null
  onSelect: (planId: string) => void
  onContinue: () => void
}) {
  /**
   * Format price for display. Free plans show "Free", paid plans show
   * USD monthly price as the default visible price.
   */
  const formatPrice = (plan: Plan): string => {
    const usdPrice = plan.price.USD.monthly
    if (usdPrice === 0) return 'Free'
    return `$${usdPrice}/mo`
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        padding: '0 24px',
        overflowY: 'auto',
      }}
    >
      {/* Title */}
      <div style={{ textAlign: 'center', marginBottom: 24, marginTop: 24 }}>
        <h2
          style={{
            fontFamily: FONTS.display,
            fontSize: 28,
            fontWeight: 300,
            color: COLORS.textPrimary,
            lineHeight: 1.3,
            marginBottom: 8,
          }}
        >
          Choose your path
        </h2>
        <p
          style={{
            fontFamily: FONTS.scripture,
            fontSize: 14,
            color: COLORS.textSecondary,
            fontStyle: 'italic',
          }}
        >
          You can always change your plan later
        </p>
      </div>

      {/* Plan cards */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {PLANS.map((plan) => {
          const isActive = selectedPlan === plan.id
          return (
            <motion.button
              key={plan.id}
              onClick={() => onSelect(plan.id)}
              whileTap={{ scale: 0.97 }}
              animate={{
                borderColor: isActive ? COLORS.cardBorderActive : COLORS.cardBorder,
                backgroundColor: isActive ? COLORS.goldSubtle : COLORS.cardBg,
              }}
              transition={{ duration: 0.2 }}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                padding: '18px 18px',
                borderRadius: 14,
                border: `1px solid ${COLORS.cardBorder}`,
                background: COLORS.cardBg,
                cursor: 'pointer',
                textAlign: 'left',
                touchAction: 'manipulation' as const,
                minHeight: 48,
                width: '100%',
                overflow: 'hidden',
              }}
            >
              {/* Badge */}
              {plan.badge && (
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    padding: '3px 10px',
                    borderBottomLeftRadius: 8,
                    background: plan.featured
                      ? COLORS.gold
                      : COLORS.cyan,
                    fontFamily: FONTS.ui,
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: COLORS.bg,
                    textTransform: 'uppercase',
                  }}
                >
                  {plan.badge}
                </div>
              )}

              {/* Plan name + Sanskrit */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: FONTS.ui,
                    fontSize: 17,
                    fontWeight: 600,
                    color: isActive ? COLORS.gold : COLORS.textPrimary,
                  }}
                >
                  {plan.name}
                </span>
                <span
                  style={{
                    fontFamily: FONTS.sanskrit,
                    fontSize: 14,
                    color: COLORS.gold,
                    lineHeight: 2.0,
                  }}
                >
                  {plan.sanskrit}
                </span>
              </div>

              {/* Price */}
              <span
                style={{
                  fontFamily: FONTS.ui,
                  fontSize: 20,
                  fontWeight: 700,
                  color: isActive ? COLORS.gold : COLORS.textPrimary,
                }}
              >
                {formatPrice(plan)}
              </span>

              {/* Description / tagline */}
              <span
                style={{
                  fontFamily: FONTS.ui,
                  fontSize: 13,
                  color: COLORS.textSecondary,
                  lineHeight: 1.5,
                }}
              >
                {plan.tagline}
              </span>

              {/* Selection indicator */}
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  style={{
                    position: 'absolute',
                    top: 16,
                    right: plan.badge ? 16 : 16,
                    marginTop: plan.badge ? 20 : 0,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: COLORS.gold,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    color: COLORS.bg,
                  }}
                >
                  ✓
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      <div style={{ flex: 1, minHeight: 16 }} />

      <StepCTA
        label="Continue →"
        onClick={onContinue}
        disabled={!selectedPlan}
      />
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                    Step 5: ActivationStep                                  */
/* -------------------------------------------------------------------------- */

function ActivationStep({
  name,
  dailyWisdom,
  onDailyWisdomChange,
  onActivate,
  isSubmitting,
}: {
  name: string
  dailyWisdom: boolean
  onDailyWisdomChange: (checked: boolean) => void
  onActivate: () => void
  isSubmitting: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
        padding: '0 32px',
        textAlign: 'center',
      }}
    >
      {/* Rotating OM */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
        style={{ marginBottom: 36 }}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
          style={{
            color: COLORS.gold,
          }}
        >
          <OmSymbol width={80} height={80} animated />
        </motion.div>
      </motion.div>

      {/* Personalised greeting */}
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
        style={{
          fontFamily: FONTS.display,
          fontSize: 28,
          fontWeight: 300,
          color: COLORS.textPrimary,
          lineHeight: 1.3,
          marginBottom: 12,
        }}
      >
        Namaste, {name || 'dear soul'}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        style={{
          fontFamily: FONTS.scripture,
          fontSize: 15,
          color: COLORS.textSecondary,
          fontStyle: 'italic',
          lineHeight: 1.6,
          maxWidth: 300,
          marginBottom: 8,
        }}
      >
        Your sacred space is ready. The wisdom of the Bhagavad Gita awaits you.
      </motion.p>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.9 }}
        style={{
          fontFamily: FONTS.sanskrit,
          fontSize: 16,
          color: COLORS.gold,
          lineHeight: 2.0,
          marginBottom: 36,
        }}
      >
        योगस्थः कुरु कर्माणि
      </motion.p>

      {/* Daily wisdom opt-in */}
      <motion.label
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.1 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 18px',
          borderRadius: 12,
          border: `1px solid ${COLORS.cardBorder}`,
          background: COLORS.cardBg,
          cursor: 'pointer',
          maxWidth: 320,
          width: '100%',
          marginBottom: 36,
          touchAction: 'manipulation' as const,
        }}
      >
        <input
          type="checkbox"
          checked={dailyWisdom}
          onChange={(e) => onDailyWisdomChange(e.target.checked)}
          style={{
            width: 20,
            height: 20,
            accentColor: COLORS.gold,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: FONTS.ui,
            fontSize: 14,
            color: COLORS.textSecondary,
            lineHeight: 1.4,
            textAlign: 'left',
          }}
        >
          Send me daily wisdom from the Gita
        </span>
      </motion.label>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 1.3 }}
        style={{ width: '100%', maxWidth: 320 }}
      >
        <StepCTA
          label={isSubmitting ? 'Preparing your space...' : 'Enter the sacred space →'}
          onClick={onActivate}
          disabled={isSubmitting}
        />
      </motion.div>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                        Main Onboarding Wizard Page                         */
/* -------------------------------------------------------------------------- */

export default function OnboardingPage() {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()

  // Wizard state
  const [currentStep, setCurrentStep] = useState(0)
  const [direction, setDirection] = useState(1)

  // User data
  const [name, setName] = useState('')
  const [language, setLanguage] = useState('en')
  const [dharmicPath, setDharmicPath] = useState<string | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [dailyWisdom, setDailyWisdom] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-advance timer ref for dharmic path step
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  /** Navigate forward */
  const goNext = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1) {
      setDirection(1)
      setCurrentStep((prev) => prev + 1)
      triggerHaptic('light')
    }
  }, [currentStep, triggerHaptic])

  /** Navigate backward */
  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setDirection(-1)
      setCurrentStep((prev) => prev - 1)
      triggerHaptic('light')
    }
  }, [currentStep, triggerHaptic])

  /** Handle dharmic path selection — auto-advance after 300ms */
  const handlePathSelect = useCallback(
    (pathId: string) => {
      setDharmicPath(pathId)
      triggerHaptic('selection')

      // Clear any existing timer
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current)
      }

      // Auto-advance after 300ms
      autoAdvanceTimer.current = setTimeout(() => {
        setDirection(1)
        setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS - 1))
        triggerHaptic('light')
      }, 300)
    },
    [triggerHaptic],
  )

  // Cleanup auto-advance timer on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current)
      }
    }
  }, [])

  /** Submit profile setup to the API */
  const handleActivate = useCallback(async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    triggerHaptic('success')

    try {
      const response = await fetch('/api/auth/profile/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          language,
          dharmic_path: dharmicPath,
          plan: selectedPlan,
          daily_wisdom: dailyWisdom,
        }),
      })

      if (!response.ok) {
        // Non-blocking: even if the API call fails, let the user proceed
        // The profile can be completed later. Log for debugging.
        console.error('Profile setup failed:', response.status)
      }

      // Navigate to the main app
      router.push('/m')
    } catch (error) {
      // Network error — still navigate, profile setup will be retried
      console.error('Profile setup network error:', error)
      router.push('/m')
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, name, language, dharmicPath, selectedPlan, dailyWisdom, router, triggerHaptic])

  /** Render the current step */
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onContinue={goNext} />
      case 1:
        return (
          <NameLanguageStep
            name={name}
            onNameChange={setName}
            language={language}
            onLanguageChange={setLanguage}
            onContinue={goNext}
          />
        )
      case 2:
        return (
          <DharmicPathStep
            selectedPath={dharmicPath}
            onSelect={handlePathSelect}
          />
        )
      case 3:
        return (
          <PlanStep
            selectedPlan={selectedPlan}
            onSelect={setSelectedPlan}
            onContinue={goNext}
          />
        )
      case 4:
        return (
          <ActivationStep
            name={name}
            dailyWisdom={dailyWisdom}
            onDailyWisdomChange={setDailyWisdom}
            onActivate={handleActivate}
            isSubmitting={isSubmitting}
          />
        )
      default:
        return null
    }
  }

  return (
    <div
      style={{
        background: COLORS.bg,
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Header with progress dots and back button */}
      <StepHeader currentStep={currentStep} onBack={goBack} />

      {/* Step content with animated transitions */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentStep}
            custom={direction}
            variants={stepVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={stepTransition}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}
