'use client'

/**
 * SadhanaJourneyPath — Sacred progress indicator showing the spiritual journey.
 * Displays 6 phase markers with Sanskrit labels connected by a golden flowing line.
 */

import { motion } from 'framer-motion'
import type { SadhanaPhase } from '@/types/sadhana.types'

interface SadhanaJourneyPathProps {
  currentPhase: SadhanaPhase
}

const JOURNEY_STEPS: { phase: SadhanaPhase; symbol: string; label: string }[] = [
  { phase: 'arrival', symbol: 'ॐ', label: 'आगमन' },
  { phase: 'breathwork', symbol: '॰', label: 'प्राणायाम' },
  { phase: 'verse', symbol: 'श्', label: 'श्लोक' },
  { phase: 'reflection', symbol: '◎', label: 'चिंतन' },
  { phase: 'intention', symbol: '❖', label: 'संकल्प' },
  { phase: 'complete', symbol: '✦', label: 'सिद्धि' },
]

const PHASE_ORDER: SadhanaPhase[] = ['arrival', 'breathwork', 'verse', 'reflection', 'intention', 'complete']

export function SadhanaJourneyPath({ currentPhase }: SadhanaJourneyPathProps) {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase)
  if (currentIndex < 0) return null

  const progress = currentIndex / (JOURNEY_STEPS.length - 1)

  return (
    <div className="fixed top-0 left-0 right-0 z-40 pointer-events-none">
      <div className="mx-auto max-w-lg px-6 pt-4">
        {/* Glass container */}
        <div className="relative flex items-center justify-between py-2">
          {/* Background track line */}
          <div className="absolute left-4 right-4 top-1/2 h-px bg-[#d4a44c]/10 -translate-y-1/2" />

          {/* Progress fill line */}
          <motion.div
            className="absolute left-4 top-1/2 h-px bg-gradient-to-r from-[#d4a44c]/60 to-[#d4a44c]/30 -translate-y-1/2 origin-left"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: progress }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: 'calc(100% - 32px)' }}
          />

          {/* Phase markers */}
          {JOURNEY_STEPS.map((step, i) => {
            const isActive = i === currentIndex
            const isComplete = i < currentIndex

            return (
              <div key={step.phase} className="relative flex flex-col items-center z-10">
                <motion.div
                  className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs
                    transition-all duration-700
                    ${isActive
                      ? 'bg-[#d4a44c]/25 border border-[#d4a44c]/50 text-[#d4a44c]'
                      : isComplete
                        ? 'bg-[#d4a44c]/15 border border-[#d4a44c]/25 text-[#d4a44c]/70'
                        : 'bg-white/5 border border-white/10 text-white/20'
                    }
                  `}
                  animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                  transition={isActive ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : {}}
                >
                  {step.symbol}
                </motion.div>

                {/* Label - only visible for active */}
                <motion.span
                  className="absolute -bottom-4 text-[8px] text-[#d4a44c]/50 font-light whitespace-nowrap"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isActive ? 1 : 0 }}
                  transition={{ duration: 0.5 }}
                >
                  {step.label}
                </motion.span>

                {/* Active glow */}
                {isActive && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'radial-gradient(circle, rgba(212,164,76,0.3) 0%, transparent 70%)',
                      width: 40,
                      height: 40,
                      left: -6.5,
                      top: -6.5,
                    }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
