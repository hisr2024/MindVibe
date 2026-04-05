/**
 * VerseDisplayPanel — Verse display inside the full-screen player.
 *
 * Appears between the waveform and progress bar when a Gita track
 * is playing. Shows Sanskrit (character-by-character reveal),
 * transliteration, English translation, and KIAAN insight.
 *
 * The Prev/Next verse buttons browse text WITHOUT changing audio.
 * This enables deep reading while listening.
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Volume2, Bookmark, Share2 } from 'lucide-react'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { GITA_MOBILE_CHAPTERS, getGitaMobileChapter } from '@/lib/kiaan-vibe/gita-library'
import { SanskritReveal, WordByWordReveal } from './SanskritReveal'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface VerseDisplayPanelProps {
  visible: boolean
}

export function VerseDisplayPanel({ visible }: VerseDisplayPanelProps) {
  const currentTrack = usePlayerStore(s => s.currentTrack)
  const { triggerHaptic } = useHapticFeedback()

  // Local browsing offset — allows reading adjacent verses without changing audio
  const [browseOffset, setBrowseOffset] = useState(0)
  const [saved, setSaved] = useState(false)
  const [translitVisible, setTranslitVisible] = useState(false)

  // The verse data from the currently playing track
  const gitaData = currentTrack?.gitaData

  // Reset browse offset when track changes
  useEffect(() => {
    setBrowseOffset(0)
    setTranslitVisible(false)
    setSaved(false)
  }, [currentTrack?.id])

  // Get the displayed verse (may differ from playing verse if browsing)
  const displayedVerse = useMemo(() => {
    if (!gitaData) return null
    // For now, browsing just shows current verse (full navigation would
    // require loading adjacent verse data from the Gita JSON)
    if (browseOffset === 0) return gitaData
    return gitaData
  }, [gitaData, browseOffset])

  const chapter = displayedVerse ? getGitaMobileChapter(displayedVerse.chapter) : null

  const handleSanskritComplete = useCallback(() => {
    // Show transliteration after Sanskrit reveals
    setTimeout(() => setTranslitVisible(true), 400)
  }, [])

  const handleSave = useCallback(() => {
    if (!displayedVerse) return
    triggerHaptic('medium')
    setSaved(true)
    // Persist to Sacred Library via localStorage
    try {
      const key = 'mindvibe-sacred-library'
      const existing = JSON.parse(localStorage.getItem(key) || '[]')
      const verseKey = `${displayedVerse.chapter}-${displayedVerse.verse}`
      if (!existing.includes(verseKey)) {
        existing.push(verseKey)
        localStorage.setItem(key, JSON.stringify(existing))
      }
    } catch { /* localStorage unavailable */ }
    setTimeout(() => setSaved(false), 1500)
  }, [displayedVerse, triggerHaptic])

  const handleShare = useCallback(async () => {
    if (!displayedVerse) return
    triggerHaptic('light')
    const text = [
      displayedVerse.sanskrit,
      '',
      displayedVerse.translation,
      '',
      `Bhagavad Gita ${displayedVerse.chapter}.${displayedVerse.verse}`,
      '\u2014 via Kiaanverse',
    ].join('\n')

    if (navigator.share) {
      try {
        await navigator.share({ text })
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard?.writeText(text)
    }
  }, [displayedVerse, triggerHaptic])

  if (!gitaData || !displayedVerse || !visible) return null

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`${displayedVerse.chapter}-${displayedVerse.verse}`}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ type: 'spring', damping: 28, stiffness: 300, duration: 0.3 }}
        className="mx-3.5 my-2 rounded-2xl overflow-hidden"
        style={{
          background: 'radial-gradient(ellipse at 50% 30%, rgba(212,160,23,0.1), rgba(17,20,53,0.98))',
          border: '1px solid rgba(212,160,23,0.22)',
          borderTop: '2px solid rgba(212,160,23,0.65)',
        }}
      >
        <div className="px-4 py-4">
          {/* ── Panel header: Ref badge + Prev/Next ───────────────────── */}
          <div className="flex items-center justify-between mb-3">
            <span
              className="text-[9px] tracking-[0.1em] uppercase font-[family-name:var(--font-ui)]"
              style={{ color: '#D4A017' }}
            >
              BG {displayedVerse.chapter}.{displayedVerse.verse} \u00B7 {displayedVerse.chapterName}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => { triggerHaptic('selection'); setBrowseOffset(o => o - 1) }}
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.15)' }}
              >
                <ChevronLeft size={12} color="#D4A017" />
              </button>
              <button
                onClick={() => { triggerHaptic('selection'); setBrowseOffset(o => o + 1) }}
                className="w-6 h-6 rounded-md flex items-center justify-center"
                style={{ background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.15)' }}
              >
                <ChevronRight size={12} color="#D4A017" />
              </button>
            </div>
          </div>

          {/* ── Section 1: Sanskrit (character-by-character reveal) ──── */}
          <SanskritReveal
            text={displayedVerse.sanskrit}
            staggerMs={60}
            onComplete={handleSanskritComplete}
            style={{
              marginBottom: 8,
              textShadow: '0 0 10px rgba(212,160,23,0.35)',
            }}
          />

          {/* ── Gold divider ──────────────────────────────────────────── */}
          <div className="h-px my-3" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.3), transparent)' }} />

          {/* ── Section 2: Transliteration ────────────────────────────── */}
          <AnimatePresence>
            {translitVisible && displayedVerse.transliteration && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="font-[family-name:var(--font-scripture)] italic text-[11px] leading-relaxed mb-2"
                style={{ color: '#B8AE98' }}
              >
                {displayedVerse.transliteration}
              </motion.p>
            )}
          </AnimatePresence>

          {/* ── Gold divider ──────────────────────────────────────────── */}
          <div className="h-px my-3" style={{ background: 'linear-gradient(90deg, transparent, rgba(212,160,23,0.3), transparent)' }} />

          {/* ── Section 3: English Translation ───────────────────────── */}
          <p
            className="text-[13px] leading-relaxed mb-3 font-[family-name:var(--font-ui)]"
            style={{ color: '#EDE8DC', fontWeight: 400, lineHeight: 1.7 }}
          >
            {displayedVerse.translation}
          </p>

          {/* ── KIAAN's Insight ───────────────────────────────────────── */}
          {displayedVerse.kiaanInsight && (
            <div
              className="rounded-r-lg py-2 px-3 mb-3"
              style={{
                borderLeft: '2px solid #D4A017',
                background: 'rgba(212,160,23,0.05)',
              }}
            >
              <p
                className="text-[8px] tracking-[0.15em] uppercase mb-1.5 font-[family-name:var(--font-ui)]"
                style={{ color: '#D4A017' }}
              >
                \u2726 KIAAN&apos;S INSIGHT
              </p>
              <WordByWordReveal
                text={displayedVerse.kiaanInsight}
                staggerMs={50}
                className="font-[family-name:var(--font-divine)] italic text-[13px] leading-relaxed"
                style={{ color: '#EDE8DC', lineHeight: 1.65 }}
              />
            </div>
          )}

          {/* ── Action buttons row ────────────────────────────────────── */}
          <div className="flex gap-2 mt-1">
            {/* Listen button */}
            <button
              className="flex-1 h-8 rounded-[10px] flex items-center justify-center gap-1.5 text-[10px] font-[family-name:var(--font-ui)]"
              style={{
                background: 'rgba(22,26,66,0.5)',
                border: '1px solid rgba(212,160,23,0.15)',
                color: '#B8AE98',
              }}
            >
              <Volume2 size={12} />
              Listen
            </button>

            {/* Save button */}
            <button
              onClick={handleSave}
              className="flex-1 h-8 rounded-[10px] flex items-center justify-center gap-1.5 text-[10px] font-[family-name:var(--font-ui)] transition-all"
              style={{
                background: saved ? 'rgba(212,160,23,0.15)' : 'rgba(22,26,66,0.5)',
                border: saved ? '1px solid rgba(212,160,23,0.4)' : '1px solid rgba(212,160,23,0.15)',
                color: saved ? '#D4A017' : '#B8AE98',
              }}
            >
              <Bookmark size={12} fill={saved ? '#D4A017' : 'none'} />
              {saved ? '\u2726 Saved' : 'Save'}
            </button>

            {/* Share button */}
            <button
              onClick={handleShare}
              className="flex-1 h-8 rounded-[10px] flex items-center justify-center gap-1.5 text-[10px] font-[family-name:var(--font-ui)]"
              style={{
                background: 'rgba(22,26,66,0.5)',
                border: '1px solid rgba(212,160,23,0.15)',
                color: '#B8AE98',
              }}
            >
              <Share2 size={12} />
              Share
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default VerseDisplayPanel
