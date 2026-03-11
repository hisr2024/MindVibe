/**
 * VerseDisplay — Sanskrit verse display panel
 *
 * Shows the current Gita verse with Sanskrit (Devanagari),
 * transliteration, and English translation in a divine floating panel.
 * Regular DOM element (no Three.js Html wrapper).
 */

'use client'

import { useGitaVRStore } from '@/stores/gitaVRStore'

interface VerseDisplayProps {
  sanskrit?: string
  transliteration?: string
  translation?: string
  chapter?: number
  verse?: number
}

export default function VerseDisplay({
  sanskrit,
  transliteration,
  translation,
  chapter,
  verse,
}: VerseDisplayProps) {
  const showVerseDisplay = useGitaVRStore((s) => s.showVerseDisplay)
  const krishnaResponse = useGitaVRStore((s) => s.krishnaResponse)

  // Use verse from Krishna's response if available
  const verseRef = krishnaResponse?.verse_reference
  const displaySanskrit = sanskrit || verseRef?.sanskrit || ''
  const displayTranslit = transliteration || verseRef?.transliteration || ''
  const displayTranslation = translation || verseRef?.translation || ''
  const displayChapter = chapter || verseRef?.chapter
  const displayVerse = verse || verseRef?.verse

  if (!showVerseDisplay && !verseRef) return null
  if (!displaySanskrit && !displayTranslation) return null

  return (
    <div className="w-[300px] rounded-xl border border-[#d4a44c]/20 bg-black/85 p-4 backdrop-blur-lg">
      {/* Chapter:Verse reference */}
      {displayChapter && displayVerse && (
        <p className="mb-2 text-center text-[10px] uppercase tracking-widest text-[#d4a44c]/50">
          Chapter {displayChapter} : Verse {displayVerse}
        </p>
      )}

      {/* Sanskrit in Devanagari */}
      {displaySanskrit && (
        <p className="mb-2 text-center font-serif text-base leading-relaxed text-[#d4a44c]">
          {displaySanskrit}
        </p>
      )}

      {/* Transliteration */}
      {displayTranslit && (
        <p className="mb-2 text-center text-xs italic text-white/40">
          {displayTranslit}
        </p>
      )}

      {/* Divider */}
      <div className="my-2 h-px bg-[#d4a44c]/10" />

      {/* English translation */}
      {displayTranslation && (
        <p className="text-center text-sm leading-relaxed text-white/70">
          {displayTranslation}
        </p>
      )}
    </div>
  )
}
