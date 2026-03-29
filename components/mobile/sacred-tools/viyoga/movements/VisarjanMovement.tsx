'use client'

/**
 * VisarjanMovement — Movement V: The Sacred Release Ceremony
 *
 * A three-phase release ritual:
 * 1. Input: User writes what they wish to release
 * 2. Ceremony: Animated offering to the sacred fire (text floats up, flame surges, particles rise)
 * 3. Complete: Closing affirmation with navigation options
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { SacredButton } from '@/components/sacred/SacredButton'
import { SacredDivider } from '@/components/sacred/SacredDivider'
import { OmSymbol } from '@/components/sacred/icons/OmSymbol'
import { type SeparationType } from '../data/separationTypes'

interface VisarjanMovementProps {
  separationType: SeparationType | null
  separatedFromName: string
  releaseOffering: string
  onReleaseChange: (text: string) => void
  onComplete: () => void
}

type Phase = 'input' | 'ceremony' | 'complete'

/**
 * Default release text based on the separation type.
 * {name} is replaced with the user's input at runtime.
 */
const DEFAULT_OFFERINGS: Record<string, string> = {
  death: 'I release the guilt of words left unsaid to {name}.',
  heartbreak: 'I release the hope that {name} will return.',
  estrangement: 'I release the anger toward {name} that holds me closed.',
  self: 'I release the belief that I am broken.',
  homeland: 'I release the grief of displacement from {name}.',
  divine: 'I release the doubt that separates me from the Divine.',
}

const SACRED_MESSAGES = [
  'Your offering has been received by the Sacred Fire.',
  'What is released... no longer has power over you.',
  'What remains is love. Only love.',
]

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function VisarjanMovement({
  separationType,
  separatedFromName,
  releaseOffering,
  onReleaseChange,
  onComplete: _onComplete,
}: VisarjanMovementProps) {
  const [phase, setPhase] = useState<Phase>('input')
  const [visibleMessages, setVisibleMessages] = useState(0)
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()

  const displayName = separatedFromName || 'them'

  // Populate default offering text if empty
  useEffect(() => {
    if (releaseOffering) return
    const typeId = separationType?.id ?? 'death'
    const defaultText = (DEFAULT_OFFERINGS[typeId] ?? DEFAULT_OFFERINGS['death'])
      .replace(/\{name\}/g, displayName)
    onReleaseChange(defaultText)
  }, [separationType, displayName, releaseOffering, onReleaseChange])

  // Ceremony phase — reveal sacred messages sequentially, then transition to complete
  useEffect(() => {
    if (phase !== 'ceremony') return

    // After 2.5s (text float + flame surge), start revealing messages
    const baseDelay = 2500
    const messageInterval = 800

    const timers: NodeJS.Timeout[] = []

    SACRED_MESSAGES.forEach((_, i) => {
      const timer = setTimeout(() => {
        setVisibleMessages(i + 1)
      }, baseDelay + i * messageInterval)
      timers.push(timer)
    })

    // Transition to complete after all messages shown
    const completeTimer = setTimeout(() => {
      setPhase('complete')
    }, baseDelay + SACRED_MESSAGES.length * messageInterval + 1500)
    timers.push(completeTimer)

    return () => timers.forEach(clearTimeout)
  }, [phase])

  const handleOffer = () => {
    triggerHaptic('heavy')
    setPhase('ceremony')
  }

  // --- Phase: Input ---
  if (phase === 'input') {
    return (
      <div className="flex flex-col items-center gap-6 pb-8 px-1">
        <h2 className="font-divine italic text-[20px] text-[#D4A017] text-center">
          What do you wish to release?
        </h2>

        <p className="font-sacred italic text-[13px] text-[#B8AE98] text-center max-w-[300px]">
          Not the love. Not the memory. But the weight of the pain.
        </p>

        {/* Diya flame — larger version of Aaroha flame */}
        <div className="relative my-2">
          <svg
            width="40"
            height="56"
            viewBox="0 0 20 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 2C10 2 4 10 4 16C4 19.3 6.7 22 10 22C13.3 22 16 19.3 16 16C16 10 10 2 10 2Z"
              fill="#D4A017"
            />
            <path
              d="M10 6C10 6 7 11 7 15C7 16.7 8.3 18 10 18C11.7 18 13 16.7 13 15C13 11 10 6 10 6Z"
              fill="#F5D060"
            />
          </svg>
          <div
            className="absolute inset-0 -m-6 rounded-full animate-pulse"
            style={{
              background: 'radial-gradient(circle, rgba(212,160,23,0.25) 0%, transparent 70%)',
              filter: 'blur(8px)',
            }}
          />
        </div>

        <textarea
          value={releaseOffering}
          onChange={(e) => onReleaseChange(e.target.value)}
          className="sacred-input px-4 py-3 text-[15px] font-sacred italic
            placeholder:italic placeholder:text-[var(--sacred-text-muted)]
            min-h-[100px] w-full resize-none"
          rows={4}
          placeholder="Write what you wish to offer to the sacred fire..."
        />

        <SacredButton variant="divine" fullWidth onClick={handleOffer}>
          Offer to the Sacred Fire
        </SacredButton>
      </div>
    )
  }

  // --- Phase: Ceremony ---
  if (phase === 'ceremony') {
    return (
      <div
        className="fixed inset-0 z-50 flex flex-col items-center justify-center"
        style={{ background: '#020510' }}
      >
        {/* Release text floating upward */}
        <motion.p
          className="font-sacred italic text-[15px] text-center max-w-[80vw] absolute"
          initial={{ opacity: 1, y: 0, color: 'rgba(237, 232, 220, 1)' }}
          animate={{
            opacity: [1, 0.8, 0],
            y: [0, -80, -200],
            color: [
              'rgba(237, 232, 220, 1)',
              'rgba(212, 160, 23, 1)',
              'rgba(212, 160, 23, 0)',
            ],
          }}
          transition={{ duration: 1.5, ease: 'easeIn' }}
        >
          {releaseOffering}
        </motion.p>

        {/* Diya flame surge */}
        <motion.div
          className="relative"
          initial={{ scale: 1 }}
          animate={{ scale: [1, 1.6, 1] }}
          transition={{ delay: 0.8, duration: 0.4, type: 'spring', stiffness: 300 }}
        >
          <svg
            width="40"
            height="56"
            viewBox="0 0 20 28"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path
              d="M10 2C10 2 4 10 4 16C4 19.3 6.7 22 10 22C13.3 22 16 19.3 16 16C16 10 10 2 10 2Z"
              fill="#D4A017"
            />
            <path
              d="M10 6C10 6 7 11 7 15C7 16.7 8.3 18 10 18C11.7 18 13 16.7 13 15C13 11 10 6 10 6Z"
              fill="#F5D060"
            />
          </svg>
          <div
            className="absolute inset-0 -m-8 rounded-full"
            style={{
              background: 'radial-gradient(circle, rgba(212,160,23,0.35) 0%, transparent 70%)',
              filter: 'blur(10px)',
            }}
          />
        </motion.div>

        {/* Golden particles rising */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {Array.from({ length: 6 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: 'rgba(212, 160, 23, 0.7)' }}
              initial={{
                opacity: 0,
                y: 0,
                x: (i - 2.5) * 12,
              }}
              animate={{
                opacity: [0, 0.8, 0],
                y: [0, -60 - i * 20, -120 - i * 25],
              }}
              transition={{
                delay: 1.0 + i * 0.15,
                duration: 1.2,
                ease: 'easeOut',
              }}
            />
          ))}
        </div>

        {/* Sacred messages — word by word reveal */}
        <div className="absolute bottom-[25%] flex flex-col items-center gap-4 px-8">
          {SACRED_MESSAGES.map((msg, i) => (
            <AnimatePresence key={i}>
              {i < visibleMessages && (
                <motion.p
                  className="font-sacred italic text-[15px] text-[#EDE8DC] text-center"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                  {msg}
                </motion.p>
              )}
            </AnimatePresence>
          ))}
        </div>
      </div>
    )
  }

  // --- Phase: Complete ---
  return (
    <div className="flex flex-col items-center gap-5 py-8 px-1">
      {/* OM symbol with gentle pulse */}
      <motion.div
        className="text-[#D4A017]"
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        <OmSymbol width={56} height={56} />
      </motion.div>

      <p className="font-ui text-[10px] text-[var(--sacred-text-muted)] uppercase tracking-[0.15em]">
        Viyoga Complete
      </p>

      <p className="font-ui text-[9px] text-[var(--sacred-text-muted)]">
        Offered on {formatDate(new Date())}
      </p>

      <SacredDivider className="my-2" />

      <div className="flex flex-col gap-2 w-full">
        <SacredButton
          variant="ghost"
          fullWidth
          onClick={() => router.push('/m')}
        >
          Return to Home
        </SacredButton>

        <SacredButton
          variant="ghost"
          fullWidth
          onClick={() => router.push('/m/journal')}
        >
          Journal This
        </SacredButton>

        <SacredButton
          variant="ghost"
          fullWidth
          onClick={() => router.push('/m/kiaan')}
        >
          Talk to Sakha
        </SacredButton>
      </div>
    </div>
  )
}

export default VisarjanMovement
