/**
 * Mobile Gita Chapter Page
 *
 * Shows chapter info and a scrollable list of all verses.
 * Tapping a verse navigates to /m/gita/[chapter]/[verse] for full reading.
 * Route: /m/gita/13 (chapter number)
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Play, Loader2, ChevronRight } from 'lucide-react'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { GitaVoiceSelector } from '@/components/mobile/vibe/GitaVoiceSelector'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { loadGitaLanguage } from '@/lib/kiaan-vibe/gita'
import {
  createChapterTracks,
  type GitaVoiceStyle,
} from '@/lib/kiaan-vibe/gita-voice-tracks'
import {
  DEVANAGARI_NUMERALS,
  YOGA_TYPE_LABELS,
  YOGA_TYPE_COLORS,
  getGitaVoiceConfig,
  getGitaMobileChapter,
} from '@/lib/kiaan-vibe/gita-library'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface VerseDisplay {
  verseNumber: number
  sanskrit: string
  transliteration: string
  translation: string
}

export default function MobileGitaChapterPage() {
  const params = useParams()
  const router = useRouter()
  const chapterNum = Number(params.chapter)
  const { triggerHaptic } = useHapticFeedback()
  const { play, setQueue, currentTrack, isPlaying } = usePlayerStore()

  const [selectedVoice, setSelectedVoice] = useState('divine-krishna')
  const [verses, setVerses] = useState<VerseDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [playingChapter, setPlayingChapter] = useState(false)

  const chapter = useMemo(() => getGitaMobileChapter(chapterNum), [chapterNum])
  const yogaColor = chapter ? YOGA_TYPE_COLORS[chapter.yogaType] : '#D4A017'

  // Load verse data
  useEffect(() => {
    let cancelled = false
    async function loadVerses() {
      setLoading(true)
      try {
        const [saData, enData] = await Promise.all([
          loadGitaLanguage('sa'),
          loadGitaLanguage('en'),
        ])

        const saChapter = saData?.chapters.find(c => c.chapterNumber === chapterNum)
        const enChapter = enData?.chapters.find(c => c.chapterNumber === chapterNum)

        if (cancelled) return

        const verseCount = chapter?.verseCount || saChapter?.verseCount || 0
        const displayVerses: VerseDisplay[] = []

        for (let i = 1; i <= verseCount; i++) {
          const saVerse = saChapter?.verses.find(v => v.verseNumber === i)
          const enVerse = enChapter?.verses.find(v => v.verseNumber === i)
          displayVerses.push({
            verseNumber: i,
            sanskrit: saVerse?.sanskrit || '',
            transliteration: saVerse?.transliteration || '',
            translation: enVerse?.translation || saVerse?.translation || '',
          })
        }

        setVerses(displayVerses)
      } catch (e) {
        console.warn('[GitaChapter] Failed to load verses:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadVerses()
    return () => { cancelled = true }
  }, [chapterNum, chapter?.verseCount])

  // Play entire chapter
  const handlePlayChapter = useCallback(async () => {
    if (!chapter) return
    triggerHaptic('heavy')
    setPlayingChapter(true)
    try {
      const cfg = getGitaVoiceConfig(selectedVoice)
      const voiceStyle = cfg.style as GitaVoiceStyle
      const tracks = await createChapterTracks(chapterNum, 'en', voiceStyle)
      tracks.forEach(t => {
        if (t.src && !t.src.includes('voice_id=')) {
          t.src = t.src + `&voice_id=${encodeURIComponent(selectedVoice)}`
        }
        if (t.ttsMetadata) {
          t.ttsMetadata.voiceId = selectedVoice
          t.ttsMetadata.voiceGender = cfg.gender
        }
      })
      if (tracks.length > 0) {
        const enrichedTracks = tracks.map((track, idx) => {
          const verse = verses[idx]
          if (verse && chapter) {
            track.gitaData = {
              chapter: chapterNum,
              verse: verse.verseNumber,
              chapterName: chapter.english,
              chapterSanskrit: chapter.sanskrit,
              sanskrit: verse.sanskrit,
              transliteration: verse.transliteration,
              translation: verse.translation,
              yogaType: chapter.yogaType,
            }
          }
          return track
        })
        setQueue(enrichedTracks, 0)
        play(enrichedTracks[0])
      }
    } catch (e) {
      console.warn('[GitaChapter] Failed to play chapter:', e)
    } finally {
      setPlayingChapter(false)
    }
  }, [chapter, chapterNum, selectedVoice, verses, triggerHaptic, setQueue, play])

  if (!chapter) {
    return (
      <MobileAppShell title="Chapter" showBack>
        <div className="flex flex-col items-center justify-center h-64 gap-3">
          <span className="text-3xl">📖</span>
          <p className="text-[#6B6355] font-[family-name:var(--font-ui)]">Chapter not found</p>
          <button
            type="button"
            onClick={() => router.back()}
            className="mt-2 px-5 py-2.5 rounded-2xl text-[13px] text-[#D4A017] font-[family-name:var(--font-ui)]"
            style={{
              background: 'rgba(212,160,23,0.12)',
              border: '1px solid rgba(212,160,23,0.3)',
            }}
          >
            ← Go back
          </button>
        </div>
      </MobileAppShell>
    )
  }

  return (
    <MobileAppShell
      title={`Chapter ${chapterNum}`}
      subtitle={chapter.english}
      showBack
    >
      <div className="pb-32">
        {/* Chapter header card */}
        <div className="px-4 mb-4">
          <div
            className="rounded-2xl p-4"
            style={{
              background: `linear-gradient(135deg, ${chapter.color}20, rgba(5,7,20,0.97))`,
              border: `1px solid ${chapter.color}30`,
              borderTop: `2px solid ${chapter.color}`,
            }}
          >
            <div className="flex items-start justify-between mb-2">
              {/* Devanagari numeral */}
              <span
                className="font-[family-name:var(--font-divine)] text-[48px] leading-none"
                style={{ color: chapter.color, fontWeight: 300 }}
              >
                {DEVANAGARI_NUMERALS[chapter.number]}
              </span>
              {/* Yoga type badge */}
              <span
                className="text-[9px] tracking-[0.1em] uppercase px-2.5 py-1 rounded-full font-[family-name:var(--font-ui)]"
                style={{
                  color: yogaColor,
                  backgroundColor: yogaColor + '18',
                  border: `1px solid ${yogaColor}35`,
                }}
              >
                {YOGA_TYPE_LABELS[chapter.yogaType]}
              </span>
            </div>

            {/* Sanskrit name */}
            <p
              className="font-[family-name:var(--font-scripture)] italic text-[22px] mb-1"
              style={{ color: chapter.color }}
            >
              {chapter.sanskrit}
            </p>

            {/* English name */}
            <p className="text-[14px] text-[#B8AE98] mb-1 font-[family-name:var(--font-ui)]">
              {chapter.english}
            </p>

            {/* Theme */}
            <p className="font-[family-name:var(--font-scripture)] italic text-[13px] text-[#6B6355] mb-3">
              {chapter.theme}
            </p>

            {/* Stats */}
            <div className="flex gap-4">
              <span className="text-[11px] text-[#6B6355] font-[family-name:var(--font-ui)]">
                {chapter.verseCount} verses
              </span>
              <span className="text-[11px] text-[#6B6355] font-[family-name:var(--font-ui)]">
                ~{chapter.durationMinutes} min
              </span>
            </div>
          </div>
        </div>

        {/* Voice selector */}
        <div className="px-4 mb-4">
          <GitaVoiceSelector
            selectedVoiceId={selectedVoice}
            onSelect={setSelectedVoice}
          />
        </div>

        {/* Play chapter button */}
        <div className="px-4 mb-5">
          <motion.button
            type="button"
            onClick={handlePlayChapter}
            disabled={playingChapter || loading}
            className="w-full h-12 rounded-2xl flex items-center justify-center gap-2 font-[family-name:var(--font-ui)]"
            style={{
              background: `linear-gradient(135deg, ${chapter.color}30, ${chapter.color}15)`,
              border: `1px solid ${chapter.color}40`,
              color: chapter.color,
              fontWeight: 500,
            }}
            whileTap={{ scale: 0.97 }}
          >
            {playingChapter ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Play size={16} fill={chapter.color} />
            )}
            <span className="text-[13px]">
              {playingChapter ? 'Loading...' : `Play Chapter ${chapterNum} — ${chapter.verseCount} verses`}
            </span>
          </motion.button>
        </div>

        {/* Verse list */}
        <div>
          <p className="px-4 text-[11px] text-[#D4A017] tracking-[0.12em] uppercase mb-2 font-[family-name:var(--font-ui)]">
            All {chapter.verseCount} Verses
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#D4A017]" />
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {verses.map((v, idx) => {
                const isCurrentVerse =
                  currentTrack?.gitaData?.chapter === chapterNum &&
                  currentTrack?.gitaData?.verse === v.verseNumber &&
                  isPlaying

                return (
                  <motion.button
                    key={v.verseNumber}
                    type="button"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: Math.min(idx * 0.02, 0.6) }}
                    onClick={() => {
                      triggerHaptic('selection')
                      router.push(`/m/gita/${chapterNum}/${v.verseNumber}`)
                    }}
                    className="flex items-center gap-3 w-full text-left px-4 py-3"
                    style={isCurrentVerse ? {
                      borderLeft: `3px solid ${chapter.color}`,
                      backgroundColor: chapter.color + '14',
                    } : {
                      borderLeft: '3px solid transparent',
                    }}
                  >
                    {/* Verse number box */}
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-[10px] flex items-center justify-center"
                      style={{
                        backgroundColor: isCurrentVerse ? chapter.color + '30' : 'rgba(212,160,23,0.1)',
                        border: `1px solid ${isCurrentVerse ? chapter.color + '60' : 'rgba(212,160,23,0.2)'}`,
                      }}
                    >
                      <span
                        className="text-[12px] font-semibold font-[family-name:var(--font-ui)]"
                        style={{ color: isCurrentVerse ? chapter.color : '#D4A017' }}
                      >
                        {v.verseNumber}
                      </span>
                    </div>

                    {/* Verse preview */}
                    <div className="flex-1 min-w-0">
                      {v.sanskrit && (
                        <p
                          className="text-[13px] leading-snug mb-0.5 truncate"
                          style={{
                            fontFamily: '"Noto Sans Devanagari", sans-serif',
                            color: '#F0C040',
                            lineHeight: 2.0,
                          }}
                        >
                          {v.sanskrit.split('\n')[0]?.slice(0, 50)}
                        </p>
                      )}
                      <p className="font-[family-name:var(--font-scripture)] italic text-[12px] text-[#B8AE98] leading-snug line-clamp-2">
                        {v.translation}
                      </p>
                    </div>

                    <ChevronRight size={14} className="flex-shrink-0 text-[#6B6355]" />
                  </motion.button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </MobileAppShell>
  )
}
