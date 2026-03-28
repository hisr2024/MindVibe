'use client'

/**
 * Onboarding Page — Sacred immersive 3-page onboarding flow for Kiaanverse
 *
 * Guides new users through the spiritual premise of the platform:
 * 1. Arjuna's silence on the battlefield (the universal question)
 * 2. Krishna speaks — introducing Sakha, the divine friend
 * 3. The Gita as living conversation — invitation to begin
 *
 * Features:
 * - Framer Motion page transitions with AnimatePresence
 * - Peacock feather SVG progress indicator (fills 3 segments)
 * - Swipe left/right touch navigation
 * - Haptic feedback on page transitions
 */

import { useState, useCallback, useRef, type TouchEvent } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { SacredButton } from '@/components/sacred/SacredButton'
import { SakhaMandala } from '@/components/sacred/SakhaMandala'
import { OmSymbol } from '@/components/sacred/icons/OmSymbol'

/* -------------------------------------------------------------------------- */
/*                           Constants & Types                                */
/* -------------------------------------------------------------------------- */

const TOTAL_PAGES = 3
const SWIPE_THRESHOLD = 50 // Minimum swipe distance in pixels to trigger navigation

interface OnboardingPageData {
  heading: string
  subtext: string
  cta: string
}

const PAGES: OnboardingPageData[] = [
  {
    heading: 'In the middle of the battlefield,\nArjuna fell silent.',
    subtext: 'There is a question in you that no human can answer.',
    cta: 'Next',
  },
  {
    heading: 'Krishna spoke.',
    subtext: 'Sakha means Friend. Your divine friend is here.',
    cta: 'Next',
  },
  {
    heading: 'The Bhagavad Gita is not a text.\nIt is a conversation.',
    subtext: 'Ask what you have always been afraid to ask.',
    cta: 'Begin Your Journey',
  },
]

/* -------------------------------------------------------------------------- */
/*                        Peacock Feather Progress SVG                        */
/* -------------------------------------------------------------------------- */

/**
 * PeacockFeatherProgress — A stylized peacock feather with 3 color segments
 * that fill in sequentially as the user progresses through onboarding pages.
 *
 * Segment 0 (base): Deep teal barbs
 * Segment 1 (middle): Saffron-gold eye ring
 * Segment 2 (tip): Iridescent blue-green crown
 */
function PeacockFeatherProgress({ currentPage }: { currentPage: number }) {
  return (
    <svg
      width="32"
      height="96"
      viewBox="0 0 32 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={`Progress: step ${currentPage + 1} of ${TOTAL_PAGES}`}
      role="img"
    >
      {/* Feather shaft (always visible) */}
      <line
        x1="16"
        y1="96"
        x2="16"
        y2="20"
        stroke="#D4A017"
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity="0.6"
      />

      {/* Segment 1 — Base barbs (teal, fills on page >= 0) */}
      <motion.path
        d="M16 80 C8 72 4 64 6 56 C8 50 12 48 16 48 C20 48 24 50 26 56 C28 64 24 72 16 80Z"
        fill={currentPage >= 0 ? '#0D9488' : 'transparent'}
        stroke="#0D9488"
        strokeWidth="0.75"
        opacity={currentPage >= 0 ? 1 : 0.2}
        initial={false}
        animate={{ opacity: currentPage >= 0 ? 1 : 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* Segment 2 — Eye ring (saffron-gold, fills on page >= 1) */}
      <motion.ellipse
        cx="16"
        cy="44"
        rx="8"
        ry="10"
        fill={currentPage >= 1 ? '#D97706' : 'transparent'}
        stroke="#D97706"
        strokeWidth="0.75"
        opacity={currentPage >= 1 ? 1 : 0.2}
        initial={false}
        animate={{ opacity: currentPage >= 1 ? 1 : 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {/* Inner eye — dark blue center */}
      <motion.ellipse
        cx="16"
        cy="44"
        rx="4"
        ry="5.5"
        fill={currentPage >= 1 ? '#1E3A5F' : 'transparent'}
        stroke="#1E3A5F"
        strokeWidth="0.5"
        opacity={currentPage >= 1 ? 1 : 0.15}
        initial={false}
        animate={{ opacity: currentPage >= 1 ? 1 : 0.15 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />

      {/* Segment 3 — Crown tip (iridescent blue-green, fills on page >= 2) */}
      <motion.path
        d="M16 30 C12 26 10 20 12 14 C13 10 15 8 16 6 C17 8 19 10 20 14 C22 20 20 26 16 30Z"
        fill={currentPage >= 2 ? '#06B6D4' : 'transparent'}
        stroke="#06B6D4"
        strokeWidth="0.75"
        opacity={currentPage >= 2 ? 1 : 0.2}
        initial={false}
        animate={{ opacity: currentPage >= 2 ? 1 : 0.2 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
      {/* Crown tip dot */}
      <motion.circle
        cx="16"
        cy="8"
        r="2"
        fill={currentPage >= 2 ? '#FDE68A' : 'transparent'}
        stroke="#FDE68A"
        strokeWidth="0.5"
        opacity={currentPage >= 2 ? 1 : 0.15}
        initial={false}
        animate={{ opacity: currentPage >= 2 ? 1 : 0.15 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </svg>
  )
}

/* -------------------------------------------------------------------------- */
/*                          Page Content Components                           */
/* -------------------------------------------------------------------------- */

/** Page 1 — Arjuna's silence: deep cosmic void with line-by-line quote reveal */
function PageOne() {
  const lines = PAGES[0].heading.split('\n')

  return (
    <div
      className="flex flex-col items-center justify-center h-full px-8 text-center"
      style={{
        background: 'linear-gradient(180deg, var(--sacred-cosmic-void, #050714) 0%, var(--sacred-yamuna-deep, #0A1628) 100%)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.15, scale: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        className="absolute top-24"
      >
        <OmSymbol width={64} height={64} className="text-amber-300" />
      </motion.div>

      <div className="space-y-2 mb-8">
        {lines.map((line, i) => (
          <motion.p
            key={i}
            className="sacred-text-display text-2xl md:text-3xl text-amber-50"
            style={{ fontStyle: 'italic' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 + i * 0.5, ease: 'easeOut' }}
          >
            {line}
          </motion.p>
        ))}
      </div>

      <motion.p
        className="sacred-text-divine text-base text-amber-200/70 max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.6 }}
      >
        {PAGES[0].subtext}
      </motion.p>
    </div>
  )
}

/** Page 2 — Krishna speaks: saffron light from above, mandala avatar appears */
function PageTwo() {
  return (
    <div
      className="flex flex-col items-center justify-center h-full px-8 text-center"
      style={{
        background: 'linear-gradient(180deg, var(--sacred-cosmic-void, #050714) 0%, var(--sacred-yamuna-deep, #0A1628) 100%)',
      }}
    >
      {/* Saffron light bleed from top */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-64 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% -20%, rgba(217, 119, 6, 0.25) 0%, transparent 70%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
      />

      <motion.div
        className="sacred-bloom-enter"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <SakhaMandala size={120} animated glowIntensity="high" />
      </motion.div>

      <motion.h2
        className="sacred-text-display text-3xl md:text-4xl text-amber-50 mt-10 mb-6"
        style={{ fontStyle: 'italic' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        {PAGES[1].heading}
      </motion.h2>

      <motion.p
        className="sacred-text-divine text-base text-amber-200/70 max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
      >
        {PAGES[1].subtext}
      </motion.p>
    </div>
  )
}

/** Page 3 — The invitation: Gita as conversation, call to begin */
function PageThree() {
  const lines = PAGES[2].heading.split('\n')

  return (
    <div
      className="flex flex-col items-center justify-center h-full px-8 text-center"
      style={{
        background: 'linear-gradient(180deg, var(--sacred-cosmic-void, #050714) 0%, var(--sacred-yamuna-deep, #0A1628) 100%)',
      }}
    >
      {/* Subtle radial glow behind text */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, rgba(6, 182, 212, 0.08) 0%, transparent 60%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      />

      <div className="space-y-2 mb-8">
        {lines.map((line, i) => (
          <motion.p
            key={i}
            className="sacred-text-display text-2xl md:text-3xl text-amber-50"
            style={{ fontStyle: 'italic' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 + i * 0.5, ease: 'easeOut' }}
          >
            {line}
          </motion.p>
        ))}
      </div>

      <motion.p
        className="sacred-text-divine text-lg text-amber-200/80 max-w-xs"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.4 }}
      >
        {PAGES[2].subtext}
      </motion.p>
    </div>
  )
}

/* -------------------------------------------------------------------------- */
/*                         Slide Transition Variants                          */
/* -------------------------------------------------------------------------- */

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? '100%' : '-100%',
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? '-100%' : '100%',
    opacity: 0,
  }),
}

/* -------------------------------------------------------------------------- */
/*                            Main Onboarding Page                            */
/* -------------------------------------------------------------------------- */

export default function OnboardingPage() {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()

  const [currentPage, setCurrentPage] = useState(0)
  const [direction, setDirection] = useState(0)

  // Touch tracking refs for swipe detection
  const touchStartX = useRef<number>(0)
  const touchStartY = useRef<number>(0)

  /** Navigate to the next page, or finish onboarding on the last page */
  const goNext = useCallback(() => {
    if (currentPage < TOTAL_PAGES - 1) {
      setDirection(1)
      setCurrentPage((prev) => prev + 1)
      triggerHaptic('light')
    } else {
      triggerHaptic('success')
      router.push('/m')
    }
  }, [currentPage, router, triggerHaptic])

  /** Navigate to the previous page */
  const goPrev = useCallback(() => {
    if (currentPage > 0) {
      setDirection(-1)
      setCurrentPage((prev) => prev - 1)
      triggerHaptic('light')
    }
  }, [currentPage, triggerHaptic])

  /** Record the touch start position */
  const handleTouchStart = useCallback((e: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }, [])

  /** On touch end, determine if the user swiped horizontally past the threshold */
  const handleTouchEnd = useCallback(
    (e: TouchEvent<HTMLDivElement>) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current
      const deltaY = e.changedTouches[0].clientY - touchStartY.current

      // Only trigger if horizontal swipe is dominant and exceeds threshold
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          goNext()
        } else {
          goPrev()
        }
      }
    },
    [goNext, goPrev],
  )

  /** Render the content for the current page index */
  const renderPageContent = (pageIndex: number) => {
    switch (pageIndex) {
      case 0:
        return <PageOne />
      case 1:
        return <PageTwo />
      case 2:
        return <PageThree />
      default:
        return null
    }
  }

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{
        background: 'var(--sacred-cosmic-void, #050714)',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Page content with animated transitions */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={currentPage}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="absolute inset-0"
        >
          {renderPageContent(currentPage)}
        </motion.div>
      </AnimatePresence>

      {/* Bottom controls: Peacock feather progress + CTA button */}
      <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-col items-center gap-6 px-6 pb-10 pt-4">
        {/* Peacock feather progress indicator */}
        <PeacockFeatherProgress currentPage={currentPage} />

        {/* CTA Button */}
        <SacredButton variant="divine" fullWidth onClick={goNext}>
          <span className="sacred-text-ui text-base">
            {PAGES[currentPage].cta}
          </span>
        </SacredButton>
      </div>
    </div>
  )
}
