'use client'

/**
 * ReflectionPhase — Sakha asks 3 adaptive questions, one at a time.
 * Full-screen sacred dialogue with pre-written answer options
 * and a "speak freely" textarea option.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MobileWordReveal } from '@/components/mobile/MobileWordReveal'
import { MobileTextarea } from '@/components/mobile/MobileInput'
import { MobileButton } from '@/components/mobile/MobileButton'
import { VoiceInputButton } from '@/components/voice'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useLanguage } from '@/hooks/useLanguage'
import { useKarmaReset } from '../hooks/useKarmaReset'
import type {
  KarmaResetContext,
  KarmaReflectionQuestion,
  KarmaReflectionAnswer,
} from '../types'
import { CATEGORY_COLORS } from '../types'

interface ReflectionPhaseProps {
  context: KarmaResetContext
  onComplete: (answers: KarmaReflectionAnswer[]) => void
}

export function ReflectionPhase({ context, onComplete }: ReflectionPhaseProps) {
  const { triggerHaptic } = useHapticFeedback()
  const { language } = useLanguage()
  const { fetchReflectionQuestion, isLoadingQuestion, error } = useKarmaReset()

  const [questionIndex, setQuestionIndex] = useState(0)
  const [currentQuestion, setCurrentQuestion] = useState<KarmaReflectionQuestion | null>(null)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [freeText, setFreeText] = useState('')
  const [showFreeText, setShowFreeText] = useState(false)
  const [answers, setAnswers] = useState<KarmaReflectionAnswer[]>([])

  const categoryColor = CATEGORY_COLORS[context.category]

  // Fetch question on index change
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const q = await fetchReflectionQuestion(context, questionIndex as 0 | 1 | 2)
      if (!cancelled && q) setCurrentQuestion(q)
    }
    load()
    return () => { cancelled = true }
  }, [questionIndex, context, fetchReflectionQuestion])

  const handleSelectOption = useCallback((option: string) => {
    triggerHaptic('light')
    setSelectedOption(option)
    setShowFreeText(false)
    setFreeText('')
  }, [triggerHaptic])

  const handleShowFreeText = useCallback(() => {
    triggerHaptic('light')
    setShowFreeText(true)
    setSelectedOption(null)
  }, [triggerHaptic])

  const currentAnswer = selectedOption || (showFreeText && freeText.trim().length > 0 ? freeText.trim() : null)

  const handleNext = useCallback(() => {
    if (!currentAnswer || !currentQuestion) return
    triggerHaptic('light')

    const answer: KarmaReflectionAnswer = {
      questionIndex,
      question: currentQuestion.question,
      answer: currentAnswer,
    }

    const newAnswers = [...answers, answer]
    setAnswers(newAnswers)

    if (questionIndex < 2) {
      setQuestionIndex(questionIndex + 1)
      setSelectedOption(null)
      setFreeText('')
      setShowFreeText(false)
      setCurrentQuestion(null)
    } else {
      onComplete(newAnswers)
    }
  }, [currentAnswer, currentQuestion, questionIndex, answers, triggerHaptic, onComplete])

  return (
    <div
      style={{
        padding: '60px 20px 40px',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* Progress: 3 lotus indicators */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            animate={i === questionIndex ? { scale: [1, 1.15, 1] } : {}}
            transition={i === questionIndex ? { duration: 2, repeat: Infinity } : {}}
            style={{
              fontSize: 16,
              opacity: i <= questionIndex ? 1 : 0.3,
              filter: i < questionIndex ? 'none' : i === questionIndex ? 'none' : 'grayscale(1)',
            }}
          >
            {i < questionIndex ? '🪷' : i === questionIndex ? '🪷' : '○'}
          </motion.span>
        ))}
      </div>

      {/* Sakha avatar */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
        <motion.div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(212,160,23,0.3), rgba(6,182,212,0.15))',
            border: '1px solid rgba(212,160,23,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          animate={{
            boxShadow: [
              '0 0 20px rgba(212,160,23,0.15)',
              '0 0 36px rgba(212,160,23,0.25)',
              '0 0 20px rgba(212,160,23,0.15)',
            ],
          }}
          transition={{ duration: 4, repeat: Infinity }}
        >
          <span style={{ fontSize: 22 }}>🙏</span>
        </motion.div>
        <p
          style={{
            fontSize: 10,
            color: 'var(--sacred-text-muted, #6B6355)',
            fontStyle: 'italic',
            fontFamily: 'var(--font-scripture, Crimson Text, serif)',
            marginTop: 6,
          }}
        >
          Sakha is with you
        </p>
      </div>

      {/* Question display */}
      <AnimatePresence mode="wait">
        {isLoadingQuestion || !currentQuestion ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 12 }}
          >
            {error && !isLoadingQuestion ? (
              <>
                <p style={{ fontFamily: 'var(--font-scripture, Crimson Text, serif)', fontStyle: 'italic', fontSize: 14, color: '#F97316', textAlign: 'center' }}>
                  {error}
                </p>
                <MobileButton
                  variant="ghost"
                  size="md"
                  onClick={async () => {
                    const q = await fetchReflectionQuestion(context, questionIndex as 0 | 1 | 2)
                    if (q) setCurrentQuestion(q)
                  }}
                >
                  Try Again
                </MobileButton>
              </>
            ) : (
              <SacredOMLoader size={32} message="Sakha is contemplating..." />
            )}
          </motion.div>
        ) : (
          <motion.div
            key={`q-${questionIndex}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {/* Question card */}
            <div
              style={{
                background: 'linear-gradient(145deg, rgba(22,26,66,0.95), rgba(17,20,53,0.98))',
                border: '1px solid rgba(212,160,23,0.12)',
                borderTop: '2px solid rgba(212,160,23,0.5)',
                borderRadius: 24,
                padding: 24,
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  fontSize: 9,
                  color: '#D4A017',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase' as const,
                  fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                  marginBottom: 12,
                }}
              >
                Sakha asks:
              </p>
              <MobileWordReveal
                text={currentQuestion.question}
                speed={70}
                className="leading-[1.65]"
                as="p"
              />
              {currentQuestion.subtext && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{
                    fontFamily: 'var(--font-scripture, Crimson Text, serif)',
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: 'var(--sacred-text-secondary, #B8AE98)',
                    lineHeight: 1.6,
                    marginTop: 12,
                  }}
                >
                  {currentQuestion.subtext}
                </motion.p>
              )}
            </div>

            {/* Answer options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {currentQuestion.options.map((option, i) => {
                const isSelected = selectedOption === option
                return (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + i * 0.1 }}
                    onClick={() => handleSelectOption(option)}
                    whileTap={{ scale: 0.99 }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 14,
                      padding: '14px 16px',
                      minHeight: 58,
                      borderRadius: 14,
                      background: isSelected
                        ? `${categoryColor}1A`
                        : 'rgba(22,26,66,0.4)',
                      border: 'none',
                      borderLeft: `3px solid ${isSelected ? categoryColor : 'rgba(255,255,255,0.06)'}`,
                      textAlign: 'left',
                      cursor: 'pointer',
                      WebkitTapHighlightColor: 'transparent',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {/* Radio circle */}
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        border: `2px solid ${isSelected ? '#D4A017' : 'rgba(212,160,23,0.3)'}`,
                        background: isSelected ? '#D4A017' : 'transparent',
                        flexShrink: 0,
                        transition: 'all 0.15s ease',
                      }}
                    />
                    <span
                      style={{
                        fontFamily: 'var(--font-scripture, Crimson Text, serif)',
                        fontStyle: 'italic',
                        fontSize: 15,
                        color: 'var(--sacred-text-primary, #EDE8DC)',
                        lineHeight: 1.4,
                      }}
                    >
                      {option}
                    </span>
                  </motion.button>
                )
              })}

              {/* Speak freely option */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
                onClick={handleShowFreeText}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 16px',
                  minHeight: 48,
                  borderRadius: 14,
                  background: showFreeText ? `${categoryColor}1A` : 'transparent',
                  border: 'none',
                  borderLeft: `3px dashed ${showFreeText ? categoryColor : 'rgba(255,255,255,0.1)'}`,
                  textAlign: 'left',
                  cursor: 'pointer',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-scripture, Crimson Text, serif)',
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: 'var(--sacred-text-secondary, #B8AE98)',
                  }}
                >
                  Speak freely...
                </span>
              </motion.button>

              {/* Free text area */}
              <AnimatePresence>
                {showFreeText && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
                      <VoiceInputButton
                        language={language}
                        onTranscript={(text) => setFreeText((prev) => prev ? `${prev} ${text}` : text)}
                      />
                    </div>
                    <MobileTextarea
                      value={freeText}
                      onChange={(e) => setFreeText(e.target.value)}
                      placeholder="Share what is in your heart..."
                      minRows={3}
                      maxLength={500}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Next / Receive Wisdom CTA */}
            <AnimatePresence>
              {currentAnswer && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ marginTop: 20 }}
                >
                  <MobileButton
                    variant="ghost"
                    size="lg"
                    fullWidth
                    onClick={handleNext}
                    rightIcon={<span>→</span>}
                  >
                    {questionIndex < 2 ? 'Next Question' : 'Receive Wisdom'}
                  </MobileButton>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
