'use client'

/**
 * VerseMeditationPhase — Sacred scripture experience with Sanskrit display.
 * Shows Devanagari first, then transliteration, then English on a parchment card.
 * KIAAN insight styled as Krishna's voice.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SanskritReveal } from '../visuals/SanskritReveal'
import { VerseParchment } from '../components/VerseParchment'
import { SacredButton } from '../components/SacredButton'
import type { SadhanaVerse } from '@/types/sadhana.types'

interface VerseMeditationPhaseProps {
  verse: SadhanaVerse
  onComplete: () => void
}

/** Chapter names in Sanskrit */
const CHAPTER_NAMES: Record<number, string> = {
  1: 'अर्जुनविषादयोग', 2: 'सांख्ययोग', 3: 'कर्मयोग', 4: 'ज्ञानकर्मसंन्यासयोग',
  5: 'कर्मसंन्यासयोग', 6: 'आत्मसंयमयोग', 7: 'ज्ञानविज्ञानयोग', 8: 'अक्षरब्रह्मयोग',
  9: 'राजविद्याराजगुह्ययोग', 10: 'विभूतियोग', 11: 'विश्वरूपदर्शनयोग', 12: 'भक्तियोग',
  13: 'क्षेत्रक्षेत्रज्ञविभागयोग', 14: 'गुणत्रयविभागयोग', 15: 'पुरुषोत्तमयोग',
  16: 'दैवासुरसम्पद्विभागयोग', 17: 'श्रद्धात्रयविभागयोग', 18: 'मोक्षसंन्यासयोग',
}

export function VerseMeditationPhase({ verse, onComplete }: VerseMeditationPhaseProps) {
  const [sanskritDone, setSanskritDone] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [showInsight, setShowInsight] = useState(false)
  const [contemplating, setContemplating] = useState(false)
  const [timer, setTimer] = useState(60)

  const handleSanskritComplete = useCallback(() => {
    setSanskritDone(true)
    setTimeout(() => setShowTranslation(true), 600)
    setTimeout(() => setShowInsight(true), 2000)
  }, [])

  /* Contemplation timer */
  useEffect(() => {
    if (!contemplating) return
    if (timer <= 0) { onComplete(); return }
    const interval = setInterval(() => setTimer(t => t - 1), 1000)
    return () => clearInterval(interval)
  }, [contemplating, timer, onComplete])

  const chapterName = CHAPTER_NAMES[verse.chapter] || ''
  const hasSanskrit = verse.sanskrit && verse.sanskrit.length > 0

  return (
    <motion.div
      className="flex flex-col items-center justify-center min-h-screen px-4 py-16 relative z-10"
      initial={{ opacity: 0, rotateX: 8, y: 30 }}
      animate={{ opacity: 1, rotateX: 0, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
    >
      {/* Chapter context */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center mb-6"
      >
        <p className="text-[10px] text-[#d4a44c]/40 tracking-[0.25em] uppercase mb-1">
          श्रीमद्भगवद्गीता
        </p>
        <p className="text-xs text-[#d4a44c]/50 tracking-widest">
          अध्याय {verse.chapter} — {chapterName}
        </p>
        <p className="text-xs text-[#d4a44c]/30 mt-1">
          श्लोक {verse.verse}
        </p>
      </motion.div>

      {/* Verse Parchment Card */}
      <VerseParchment>
        {/* Sanskrit text (Devanagari) — shown first */}
        {hasSanskrit ? (
          <div className="mb-4">
            <SanskritReveal
              text={verse.sanskrit!}
              speed={50}
              onComplete={handleSanskritComplete}
              className="text-[#FFD700]/90"
            />
          </div>
        ) : (
          <div className="mb-4">
            <SanskritReveal
              text={verse.english}
              subtext={verse.transliteration}
              speed={35}
              onComplete={handleSanskritComplete}
            />
          </div>
        )}

        {/* Transliteration — fades in after Sanskrit */}
        <AnimatePresence>
          {hasSanskrit && sanskritDone && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
              className="text-center text-[#d4a44c]/50 text-sm italic font-light mb-4"
              style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
            >
              {verse.transliteration}
            </motion.p>
          )}
        </AnimatePresence>

        {/* English translation — unfolds after transliteration */}
        <AnimatePresence>
          {showTranslation && hasSanskrit && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="border-t border-[#d4a44c]/10 pt-4 mt-2">
                <p className="text-center text-[#FFF8DC]/70 font-light leading-relaxed text-base">
                  {verse.english}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </VerseParchment>

      {/* KIAAN Insight — styled as Krishna's whisper */}
      <AnimatePresence>
        {showInsight && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-8 max-w-lg w-full px-2"
          >
            <div className="border-l-2 border-[#d4a44c]/30 pl-5 py-1">
              <p className="text-[10px] text-[#d4a44c]/40 tracking-wider uppercase mb-2">
                कृष्ण वाणी · Krishna speaks
              </p>
              <p
                className="text-[#FFF8DC]/60 font-light leading-relaxed text-sm"
                style={{ fontFamily: 'var(--font-sacred, Georgia, serif)' }}
              >
                {verse.personalInterpretation}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <AnimatePresence>
        {showInsight && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 flex flex-col items-center gap-3"
          >
            {!contemplating ? (
              <>
                <SacredButton variant="golden" onClick={() => setContemplating(true)}>
                  Contemplate This Wisdom
                </SacredButton>
                <SacredButton variant="whisper" onClick={onComplete}>
                  Continue
                </SacredButton>
              </>
            ) : (
              <motion.div className="text-center">
                {/* Incense timer — vertical line burning down */}
                <div className="relative w-px h-16 bg-[#d4a44c]/10 mx-auto mb-3">
                  <motion.div
                    className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#d4a44c]/60 to-[#FFD700]/40 rounded-full"
                    style={{ height: `${(timer / 60) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                  {/* Glowing tip */}
                  <motion.div
                    className="absolute left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-[#FFD700]/60"
                    style={{ bottom: `${(timer / 60) * 100}%` }}
                    animate={{ opacity: [0.4, 1, 0.4], scale: [0.8, 1.2, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </div>
                <p className="text-[#d4a44c]/40 text-xs font-light mb-3">{timer}s</p>
                <SacredButton variant="whisper" onClick={onComplete}>
                  End contemplation
                </SacredButton>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
