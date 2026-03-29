'use client'

/**
 * VilapMovement — Movement II: The Sacred Expression
 *
 * A multi-section input form where the user maps their separation:
 * 1. Separation type selector (6 types from data)
 * 2. Name input (who/what they are separated from)
 * 3. Distance slider (Fresh → Eternal)
 * 4. Context/expression textarea
 * 5. Submit CTA to bring the offering to Sakha
 *
 * All state is managed by the parent orchestrator via props.
 */

import { motion, AnimatePresence } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { SacredCard } from '@/components/sacred/SacredCard'
import { SacredButton } from '@/components/sacred/SacredButton'
import { SacredInput } from '@/components/sacred/SacredInput'
import { SEPARATION_TYPES, type SeparationType } from '../data/separationTypes'

interface VilapMovementProps {
  separationType: SeparationType | null
  onSeparationTypeChange: (type: SeparationType) => void
  separatedFromName: string
  onNameChange: (name: string) => void
  distanceLevel: number
  onDistanceLevelChange: (level: number) => void
  userExpression: string
  onExpressionChange: (text: string) => void
  onSubmit: () => void
  loading: boolean
}

const DISTANCE_LABELS = [
  { sanskrit: 'नव', english: 'Fresh' },
  { sanskrit: 'उपस्थित', english: 'Present' },
  { sanskrit: 'गहरा', english: 'Deep' },
  { sanskrit: 'पुराना', english: 'Old' },
  { sanskrit: 'शाश्वत', english: 'Eternal' },
]

const slideUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
}

export function VilapMovement({
  separationType,
  onSeparationTypeChange,
  separatedFromName,
  onNameChange,
  distanceLevel,
  onDistanceLevelChange,
  userExpression,
  onExpressionChange,
  onSubmit,
  loading,
}: VilapMovementProps) {
  const { triggerHaptic } = useHapticFeedback()

  const hasType = separationType !== null
  const hasNameOrSkipped = hasType && (separatedFromName.length > 0 || separationType.id === 'self')

  return (
    <div className="flex flex-col gap-6 pb-8">
      {/* Section 1: Separation Type Selector */}
      <div className="flex flex-col gap-3">
        <h2 className="font-divine italic text-[18px] text-[#D4A017] px-1">
          What form does your separation take?
        </h2>

        <div className="flex flex-col gap-2">
          {SEPARATION_TYPES.map((type) => {
            const isSelected = separationType?.id === type.id
            return (
              <SacredCard
                key={type.id}
                interactive
                className="cursor-pointer"
                onClick={() => {
                  triggerHaptic('selection')
                  onSeparationTypeChange(type)
                }}
                style={{
                  borderLeft: isSelected ? `3px solid ${type.color}` : '3px solid transparent',
                  backgroundColor: isSelected ? `${type.color}1A` : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <span
                    className="font-divine text-[14px] shrink-0 w-[80px]"
                    style={{ color: type.color }}
                  >
                    {type.sanskrit}
                  </span>
                  <div className="flex flex-col min-w-0">
                    <span className="font-ui text-[14px] text-[var(--sacred-text-primary)]">
                      {type.label}
                    </span>
                    <span className="font-ui text-[11px] text-[var(--sacred-text-muted)]">
                      {type.subtext}
                    </span>
                  </div>
                </div>
              </SacredCard>
            )
          })}
        </div>
      </div>

      {/* Section 2: Name Input (shows after type selected) */}
      <AnimatePresence>
        {hasType && (
          <motion.div
            className="flex flex-col gap-2"
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            <p className="font-sacred italic text-[14px] text-[#B8AE98] px-1">
              Who or what are you separated from?
            </p>
            <SacredInput
              value={separatedFromName}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="A name, a place, a version of yourself..."
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 3: Distance Slider (shows after name entered or type is 'self') */}
      <AnimatePresence>
        {hasNameOrSkipped && (
          <motion.div
            className="flex flex-col gap-3"
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
          >
            <p className="font-sacred text-[13px] text-[#B8AE98] px-1">
              How far does this separation feel?
            </p>

            <div className="px-2">
              <input
                type="range"
                min={0}
                max={4}
                step={1}
                value={distanceLevel}
                onChange={(e) => onDistanceLevelChange(Number(e.target.value))}
                className="w-full h-1 appearance-none rounded-full cursor-pointer
                  [&::-webkit-slider-track]:bg-[#D4A017]/20 [&::-webkit-slider-track]:rounded-full [&::-webkit-slider-track]:h-1
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[#D4A017]
                  [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(212,160,23,0.5)]
                  [&::-moz-range-track]:bg-[#D4A017]/20 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:h-1
                  [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:bg-[#D4A017] [&::-moz-range-thumb]:border-0"
              />

              <div className="flex justify-between mt-2 px-0.5">
                {DISTANCE_LABELS.map((label, i) => (
                  <div key={i} className="flex flex-col items-center w-[50px]">
                    <span
                      className={`font-divine text-[10px] ${
                        distanceLevel === i ? 'text-[#D4A017]' : 'text-[var(--sacred-text-muted)]'
                      }`}
                    >
                      {label.sanskrit}
                    </span>
                    <span
                      className={`font-ui text-[10px] ${
                        distanceLevel === i ? 'text-[#B8AE98]' : 'text-[var(--sacred-text-muted)]'
                      }`}
                    >
                      {label.english}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 4: Context / Expression Field */}
      <AnimatePresence>
        {hasNameOrSkipped && (
          <motion.div
            className="flex flex-col gap-2"
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.2 }}
          >
            <p className="font-divine italic text-[16px] text-[#D4A017] px-1">
              What do you wish you could say to them?
            </p>
            <textarea
              value={userExpression}
              onChange={(e) => onExpressionChange(e.target.value)}
              placeholder="Speak freely. This space holds everything..."
              className="sacred-input px-4 py-3 text-[15px] font-sacred italic
                placeholder:italic placeholder:text-[var(--sacred-text-muted)]
                min-h-[100px] w-full resize-none"
              rows={4}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Section 5: Submit CTA */}
      <AnimatePresence>
        {hasNameOrSkipped && (
          <motion.div
            variants={slideUp}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.4, ease: 'easeOut', delay: 0.3 }}
          >
            <SacredButton
              variant="divine"
              fullWidth
              disabled={!separationType || loading}
              onClick={() => {
                triggerHaptic('medium')
                onSubmit()
              }}
            >
              {loading ? 'Bringing to Sakha...' : 'Bring This to Sakha'}
            </SacredButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default VilapMovement
