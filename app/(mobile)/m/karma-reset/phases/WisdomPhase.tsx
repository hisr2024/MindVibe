'use client'

/**
 * WisdomPhase — Sakha delivers personalized Gita wisdom.
 * The most visually rich phase: dharmic mirror, shloka card,
 * dharmic counsel, karmic insight, action dharma cards, affirmation.
 */

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MobileSentenceReveal } from '@/components/mobile/MobileWordReveal'
import { MobileButton } from '@/components/mobile/MobileButton'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useKarmaReset } from '../hooks/useKarmaReset'
import { DharmaMirrorCard } from '../components/DharmaMirrorCard'
import { ShlokaCard } from '../components/ShlokaCard'
import { ActionDharmaCards } from '../components/ActionDharmaCards'
import type {
  KarmaResetContext,
  KarmaReflectionAnswer,
  KarmaWisdomResponse,
} from '../types'
import { CATEGORY_COLORS } from '../types'

interface WisdomPhaseProps {
  context: KarmaResetContext
  reflections: KarmaReflectionAnswer[]
  onComplete: (wisdom: KarmaWisdomResponse) => void
}

const LOADING_MESSAGES = [
  'Receiving your karma with full presence...',
  'Searching the eternal wisdom of the Gita...',
  'Krishna speaks through the ages...',
  'Finding the verse that was written for this moment...',
]

export function WisdomPhase({ context, reflections, onComplete }: WisdomPhaseProps) {
  const { triggerHaptic } = useHapticFeedback()
  const { fetchWisdom, isLoadingWisdom, error } = useKarmaReset()
  const [wisdom, setWisdom] = useState<KarmaWisdomResponse | null>(null)
  const [loadingMsg, setLoadingMsg] = useState(0)
  const [, setCommittedActions] = useState<string[]>([])
  const fetchedRef = useRef(false)

  const categoryColor = CATEGORY_COLORS[context.category]

  // Fetch wisdom on mount
  useEffect(() => {
    if (fetchedRef.current) return
    fetchedRef.current = true

    const load = async () => {
      const result = await fetchWisdom(context, reflections)
      if (result) {
        setWisdom(result)
        triggerHaptic('success')
      }
    }
    load()
  }, [context, reflections, fetchWisdom, triggerHaptic])

  // Cycle loading messages
  useEffect(() => {
    if (!isLoadingWisdom) return
    const interval = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length)
    }, 800)
    return () => clearInterval(interval)
  }, [isLoadingWisdom])

  const handleProceed = () => {
    if (!wisdom) return
    triggerHaptic('medium')
    onComplete(wisdom)
  }

  return (
    <div
      style={{
        padding: '60px 20px 40px',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Loading state */}
      <AnimatePresence>
        {(isLoadingWisdom || !wisdom) && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '40px 0',
            }}
          >
            {/* Sakha avatar with divine-breath */}
            <motion.div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(212,160,23,0.3), rgba(6,182,212,0.15))',
                border: '1px solid rgba(212,160,23,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
              animate={{
                boxShadow: [
                  '0 0 24px rgba(212,160,23,0.15)',
                  '0 0 48px rgba(212,160,23,0.3)',
                  '0 0 24px rgba(212,160,23,0.15)',
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <span style={{ fontSize: 28 }}>🙏</span>
            </motion.div>

            {/* Reflections recap */}
            <div style={{ width: '100%', marginBottom: 20 }}>
              {reflections.map((ref, i) => (
                <div
                  key={i}
                  style={{
                    height: 52,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 12px',
                    marginBottom: 6,
                    borderLeft: `3px solid ${categoryColor}`,
                    borderRadius: '0 8px 8px 0',
                    background: 'rgba(22,26,66,0.4)',
                  }}
                >
                  <p
                    style={{
                      fontFamily: 'var(--font-scripture, Crimson Text, serif)',
                      fontStyle: 'italic',
                      fontSize: 13,
                      color: 'var(--sacred-text-secondary, #B8AE98)',
                      lineHeight: 1.4,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {ref.answer}
                  </p>
                </div>
              ))}
            </div>

            {/* Error state */}
            {error && !isLoadingWisdom && (
              <div style={{ textAlign: 'center' }}>
                <p
                  style={{
                    fontFamily: 'var(--font-scripture, Crimson Text, serif)',
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: '#F97316',
                    marginBottom: 12,
                  }}
                >
                  {error}
                </p>
                <MobileButton
                  variant="ghost"
                  size="md"
                  onClick={async () => {
                    const result = await fetchWisdom(context, reflections)
                    if (result) {
                      setWisdom(result)
                      triggerHaptic('success')
                    }
                  }}
                >
                  Try Again
                </MobileButton>
              </div>
            )}

            {/* Cycling loading text */}
            {isLoadingWisdom && (
              <>
                <motion.p
                  key={loadingMsg}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  style={{
                    fontFamily: 'var(--font-scripture, Crimson Text, serif)',
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: 'var(--sacred-text-secondary, #B8AE98)',
                    textAlign: 'center',
                  }}
                >
                  {LOADING_MESSAGES[loadingMsg]}
                </motion.p>

                <div style={{ marginTop: 16 }}>
                  <SacredOMLoader size={20} />
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wisdom display */}
      {wisdom && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        >
          {/* Section 1: Dharmic Mirror */}
          <DharmaMirrorCard text={wisdom.dharmicMirror} category={context.category} />

          {/* Section 2: Shloka Card */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <ShlokaCard
              sanskrit={wisdom.primaryShloka.sanskrit}
              transliteration={wisdom.primaryShloka.transliteration}
              english={wisdom.primaryShloka.english}
              chapter={wisdom.primaryShloka.chapter}
              verse={wisdom.primaryShloka.verse}
              chapterName={wisdom.primaryShloka.chapterName}
              category={context.category}
            />
          </motion.div>

          {/* Section 3: Dharmic Counsel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 }}
          >
            <MobileSentenceReveal
              text={wisdom.dharmicCounsel}
              delay={1800}
              speed={400}
              className="leading-[1.85]"
            />
          </motion.div>

          {/* Section 4: Karmic Insight */}
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 2.4 }}
            style={{
              background: `${categoryColor}14`,
              borderLeft: `3px solid ${categoryColor}`,
              borderRadius: '0 12px 12px 0',
              padding: '12px 14px',
            }}
          >
            <p
              style={{
                fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                fontStyle: 'italic',
                fontSize: 16,
                color: 'var(--sacred-text-primary, #EDE8DC)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              {wisdom.karmicInsight}
            </p>
          </motion.div>

          {/* Section 5: Action Dharma Cards */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.0 }}
          >
            <ActionDharmaCards
              actions={wisdom.actionDharma}
              onCommit={setCommittedActions}
            />
          </motion.div>

          {/* Section 6: Affirmation — the crown moment */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.8 }}
            style={{ textAlign: 'center', padding: '16px 0' }}
          >
            <p
              style={{
                fontFamily: 'var(--font-display, Playfair Display, serif)',
                fontStyle: 'italic',
                fontSize: 26,
                color: '#F0C040',
                letterSpacing: '0.02em',
                lineHeight: 1.5,
                textShadow: '0 0 20px rgba(212,160,23,0.4)',
              }}
            >
              {wisdom.affirmation}
            </p>
            <p
              style={{
                fontSize: 10,
                color: 'var(--sacred-text-muted, #6B6355)',
                fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                marginTop: 12,
              }}
            >
              Hold this. Then seal your sankalpa.
            </p>
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 4.5 }}
          >
            <MobileButton
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleProceed}
              rightIcon={<span>→</span>}
            >
              Seal My Sankalpa
            </MobileButton>
          </motion.div>
        </motion.div>
      )}
    </div>
  )
}
