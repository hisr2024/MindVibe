'use client'

/**
 * SankalphaPhase — Sacred intention setting.
 * Dharmic quality selection, editable intention card,
 * and the Sankalpa Seal ceremony.
 */

import React, { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { MobileWordReveal } from '@/components/mobile/MobileWordReveal'
import { MobileTextarea } from '@/components/mobile/MobileInput'
import { VoiceInputButton } from '@/components/voice'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useLanguage } from '@/hooks/useLanguage'
import { SankalpaSealButton } from '../components/SankalpaSealButton'
import type {
  KarmaResetContext,
  KarmaWisdomResponse,
  SankalpaSeal,
} from '../types'
import { DHARMIC_QUALITIES } from '../types'

interface SankalphaPhaseProps {
  wisdom: KarmaWisdomResponse
  context: KarmaResetContext
  onComplete: (sankalpa: SankalpaSeal) => void
}

export function SankalphaPhase({ wisdom, context, onComplete }: SankalphaPhaseProps) {
  const { triggerHaptic } = useHapticFeedback()
  const { language } = useLanguage()

  // Pre-select the first action dharma concept as default quality
  const defaultQuality = useMemo(() => {
    const firstConcept = wisdom.actionDharma[0]?.concept?.toLowerCase() || ''
    return DHARMIC_QUALITIES.find((q) => firstConcept.includes(q.id))?.id || 'ahimsa'
  }, [wisdom])

  const [selectedQuality, setSelectedQuality] = useState(defaultQuality)
  const [isEditing, setIsEditing] = useState(false)

  // Auto-generated sankalpa text
  const defaultIntention = useMemo(() => {
    const quality = DHARMIC_QUALITIES.find((q) => q.id === selectedQuality)
    const action = wisdom.actionDharma[0]?.practice || 'act with conscious awareness'
    return `Today I align with ${quality?.label || 'dharma'}. In my ${context.category}, I choose to ${action.toLowerCase()}`
  }, [selectedQuality, wisdom, context])

  const [intentionText, setIntentionText] = useState(defaultIntention)

  // Update intention when quality changes (only if user hasn't edited)
  const handleQualityChange = useCallback((qualityId: string) => {
    triggerHaptic('light')
    setSelectedQuality(qualityId)
    if (!isEditing) {
      const quality = DHARMIC_QUALITIES.find((q) => q.id === qualityId)
      const action = wisdom.actionDharma[0]?.practice || 'act with conscious awareness'
      setIntentionText(`Today I align with ${quality?.label || 'dharma'}. In my ${context.category}, I choose to ${action.toLowerCase()}`)
    }
  }, [triggerHaptic, isEditing, wisdom, context])

  const handleSeal = useCallback(() => {
    onComplete({
      dharmicFocus: selectedQuality,
      intentionText,
      sealed: true,
      sealedAt: new Date(),
    })
  }, [selectedQuality, intentionText, onComplete])

  const selectedQualityConfig = DHARMIC_QUALITIES.find((q) => q.id === selectedQuality)

  return (
    <div
      style={{
        padding: '60px 20px 40px',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Opening words */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <MobileWordReveal
          text="Arjuna understood. Then he stood up. Now — what will you do?"
          speed={70}
          as="p"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          style={{
            fontFamily: 'var(--font-scripture, Crimson Text, serif)',
            fontStyle: 'italic',
            fontSize: 14,
            color: 'var(--sacred-text-secondary, #B8AE98)',
            marginTop: 12,
          }}
        >
          Set your sankalpa. One intention. One day.
        </motion.p>
      </div>

      {/* Dharmic quality selector — 2×3 grid */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        <p
          style={{
            fontSize: 11,
            color: 'var(--sacred-text-muted, #6B6355)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase' as const,
            fontFamily: 'var(--font-ui, Outfit, sans-serif)',
            marginBottom: 10,
          }}
        >
          Choose your dharmic focus
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 24 }}>
          {DHARMIC_QUALITIES.map((quality) => {
            const isSelected = selectedQuality === quality.id
            return (
              <motion.button
                key={quality.id}
                onClick={() => handleQualityChange(quality.id)}
                whileTap={{ scale: 0.97 }}
                animate={isSelected ? { scale: 1.02 } : { scale: 1 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                aria-pressed={isSelected}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '10px 12px',
                  minHeight: 70,
                  borderRadius: 16,
                  border: isSelected
                    ? `1px solid ${quality.color}80`
                    : '1px solid rgba(255,255,255,0.06)',
                  borderTop: isSelected
                    ? `2px solid ${quality.color}`
                    : '1px solid rgba(255,255,255,0.06)',
                  background: isSelected
                    ? `${quality.color}20`
                    : 'linear-gradient(145deg, rgba(22,26,66,0.6), rgba(17,20,53,0.7))',
                  textAlign: 'left',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                    fontStyle: 'italic',
                    fontSize: 22,
                    color: isSelected ? quality.color : `${quality.color}99`,
                  }}
                >
                  {quality.sanskrit}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                    fontWeight: 500,
                    fontSize: 11,
                    color: 'var(--sacred-text-secondary, #B8AE98)',
                    marginTop: 2,
                  }}
                >
                  {quality.label}
                </span>
                <span
                  style={{
                    fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                    fontWeight: 300,
                    fontSize: 9,
                    color: 'var(--sacred-text-muted, #6B6355)',
                  }}
                >
                  {quality.description}
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Sankalpa statement card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.3 }}
        style={{ marginBottom: 32 }}
      >
        <div
          style={{
            background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
            borderLeft: `4px solid ${selectedQualityConfig?.color || '#D4A017'}`,
            borderRadius: '0 20px 20px 0',
            padding: '16px 20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <p
              style={{
                fontSize: 9,
                color: '#D4A017',
                letterSpacing: '0.15em',
                textTransform: 'uppercase' as const,
                fontFamily: 'var(--font-ui, Outfit, sans-serif)',
              }}
            >
              My Sankalpa
            </p>
            {isEditing && (
              <VoiceInputButton
                language={language}
                onTranscript={(text) => setIntentionText((prev) => prev ? `${prev} ${text}` : text)}
              />
            )}
          </div>

          {isEditing ? (
            <MobileTextarea
              value={intentionText}
              onChange={(e) => setIntentionText(e.target.value)}
              onBlur={() => setIsEditing(false)}
              placeholder="Write your sankalpa..."
              minRows={3}
              maxLength={500}
              autoFocus
            />
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
              }}
            >
              <p
                style={{
                  fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                  fontStyle: 'italic',
                  fontSize: 18,
                  color: 'var(--sacred-text-primary, #EDE8DC)',
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {intentionText}
              </p>
              <p
                style={{
                  fontSize: 10,
                  color: 'var(--sacred-text-muted, #6B6355)',
                  fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                  marginTop: 8,
                }}
              >
                Tap to edit
              </p>
            </button>
          )}
        </div>
      </motion.div>

      {/* The Seal Ceremony */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2.8 }}
      >
        <SankalpaSealButton onSeal={handleSeal} />
      </motion.div>
    </div>
  )
}
