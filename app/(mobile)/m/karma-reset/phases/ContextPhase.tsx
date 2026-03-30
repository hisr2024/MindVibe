'use client'

/**
 * ContextPhase — What happened? Category + weight + description + timeframe.
 * The user describes the karmic action/situation through touch-native selectors.
 */

import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MobileTextarea } from '@/components/mobile/MobileInput'
import { MobileButton } from '@/components/mobile/MobileButton'
import { VoiceInputButton } from '@/components/voice'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useLanguage } from '@/hooks/useLanguage'
import { KarmaCategorySelector } from '../components/KarmaCategorySelector'
import { KarmaWeightSelector } from '../components/KarmaWeightSelector'
import type {
  KarmaCategory,
  KarmaWeight,
  KarmaTimeframe,
  KarmaResetContext,
} from '../types'
import { CATEGORY_COLORS } from '../types'

interface ContextPhaseProps {
  onComplete: (ctx: KarmaResetContext) => void
}

const TIMEFRAMES: { id: KarmaTimeframe; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'recent', label: 'This week' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'past', label: 'From the past' },
]

const WHO_OPTIONS: { id: 'self' | 'one_person' | 'group'; label: string }[] = [
  { id: 'self', label: 'Just me' },
  { id: 'one_person', label: 'One person' },
  { id: 'group', label: 'A group' },
]

export function ContextPhase({ onComplete }: ContextPhaseProps) {
  const { triggerHaptic } = useHapticFeedback()
  const { language } = useLanguage()
  const [category, setCategory] = useState<KarmaCategory | null>(null)
  const [weight, setWeight] = useState<KarmaWeight | null>(null)
  const [description, setDescription] = useState('')
  const [timeframe, setTimeframe] = useState<KarmaTimeframe>('today')
  const [whoInvolved, setWhoInvolved] = useState<'self' | 'one_person' | 'group' | undefined>(undefined)

  const categoryColor = category ? CATEGORY_COLORS[category] : '#D4A017'

  const canProceed = useMemo(
    () => category !== null && weight !== null && description.trim().length >= 10,
    [category, weight, description]
  )

  const handleSubmit = () => {
    if (!canProceed || !category || !weight) return
    triggerHaptic('medium')
    onComplete({
      category,
      weight,
      description: description.trim(),
      whoInvolved,
      timeframe,
    })
  }

  return (
    <div
      style={{
        padding: '60px 20px 120px',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <p
          style={{
            fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
            fontStyle: 'italic',
            fontSize: 10,
            color: 'var(--sacred-text-muted, #6B6355)',
            marginBottom: 2,
          }}
        >
          दुःख-संयोग-वियोग
        </p>
        <p
          style={{
            fontFamily: 'var(--font-ui, Outfit, sans-serif)',
            fontSize: 10,
            color: 'var(--sacred-text-muted, #6B6355)',
          }}
        >
          Disconnection from suffering through conscious action
        </p>
      </div>

      {/* Category Selector */}
      <div style={{ marginBottom: 28 }}>
        <KarmaCategorySelector selected={category} onSelect={setCategory} />
      </div>

      {/* Weight Selector */}
      <div style={{ marginBottom: 28 }}>
        <KarmaWeightSelector
          selected={weight}
          onSelect={setWeight}
          categoryColor={categoryColor}
        />
      </div>

      {/* Description textarea */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <label
            style={{
              fontSize: 11,
              color: 'var(--sacred-text-muted, #6B6355)',
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              fontFamily: 'var(--font-ui, Outfit, sans-serif)',
            }}
          >
            What happened? Speak freely.
          </label>
          <VoiceInputButton
            language={language}
            onTranscript={(text) => setDescription((prev) => prev ? `${prev} ${text}` : text)}
          />
        </div>
        <MobileTextarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="In your own words... what action, thought, or situation are you examining?"
          minRows={4}
          maxLength={1000}
        />
        <p
          style={{
            fontSize: 10,
            color: 'var(--sacred-text-muted, #6B6355)',
            textAlign: 'right',
            marginTop: 4,
            fontFamily: 'var(--font-ui, Outfit, sans-serif)',
          }}
        >
          ✦ {description.trim().split(/\s+/).filter(Boolean).length} words
        </p>
      </div>

      {/* Who involved (optional) */}
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontSize: 11,
            color: 'var(--sacred-text-muted, #6B6355)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            fontFamily: 'var(--font-ui, Outfit, sans-serif)',
            marginBottom: 8,
          }}
        >
          Who else was involved? (optional)
        </p>
        <div style={{ display: 'flex', gap: 8 }}>
          {WHO_OPTIONS.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                triggerHaptic('light')
                setWhoInvolved(whoInvolved === opt.id ? undefined : opt.id)
              }}
              style={{
                padding: '6px 14px',
                borderRadius: 20,
                fontSize: 12,
                fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                fontWeight: whoInvolved === opt.id ? 500 : 400,
                background: whoInvolved === opt.id
                  ? 'rgba(212,160,23,0.15)'
                  : 'rgba(22,26,66,0.5)',
                border: `1px solid ${whoInvolved === opt.id ? 'rgba(212,160,23,0.5)' : 'rgba(255,255,255,0.06)'}`,
                color: whoInvolved === opt.id
                  ? '#F0C040'
                  : 'var(--sacred-text-primary, #EDE8DC)',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe */}
      <div style={{ marginBottom: 28 }}>
        <p
          style={{
            fontSize: 11,
            color: 'var(--sacred-text-muted, #6B6355)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            fontFamily: 'var(--font-ui, Outfit, sans-serif)',
            marginBottom: 8,
          }}
        >
          When?
        </p>
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.id}
              onClick={() => {
                triggerHaptic('light')
                setTimeframe(tf.id)
              }}
              style={{
                padding: '8px 16px',
                borderRadius: 20,
                fontSize: 13,
                fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                fontWeight: timeframe === tf.id ? 500 : 400,
                whiteSpace: 'nowrap',
                background: timeframe === tf.id
                  ? 'rgba(212,160,23,0.15)'
                  : 'rgba(22,26,66,0.5)',
                border: `1px solid ${timeframe === tf.id ? 'rgba(212,160,23,0.5)' : 'rgba(255,255,255,0.06)'}`,
                color: timeframe === tf.id
                  ? '#F0C040'
                  : 'var(--sacred-text-primary, #EDE8DC)',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Proceed CTA */}
      <AnimatePresence>
        {canProceed && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.3 }}
          >
            <MobileButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleSubmit}
              leftIcon={<span style={{ fontSize: 16 }}>🪷</span>}
            >
              Bring This to Sakha
            </MobileButton>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
