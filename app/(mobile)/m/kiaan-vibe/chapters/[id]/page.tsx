/**
 * Chapter Detail — Every verse in a chapter, listed and playable.
 *
 * Shows chapter summary, voice selector, play-chapter button,
 * and a scrollable list of all verses.
 */

'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Play, Loader2 } from 'lucide-react'
import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { VerseListItem } from '@/components/mobile/vibe/VerseListItem'
import { GitaVoiceSelector } from '@/components/mobile/vibe/GitaVoiceSelector'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { loadGitaLanguage } from '@/lib/kiaan-vibe/gita'
import {
  createVerseTrack,
  createChapterTracks,
  type GitaVoiceStyle,
} from '@/lib/kiaan-vibe/gita-voice-tracks'
import {
  GITA_MOBILE_CHAPTERS,
  DEVANAGARI_NUMERALS,
  YOGA_TYPE_LABELS,
  YOGA_TYPE_COLORS,
  VOICE_TO_STYLE_MAP,
  VOICE_TO_SPEED_MAP,
  getGitaMobileChapter,
} from '@/lib/kiaan-vibe/gita-library'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface VerseDisplay {
  verseNumber: number
  sanskrit: string
  transliteration: string
  translation: string
}

export default function ChapterDetailPage() {
  const params = useParams()
  const router = useRouter()
  const chapterNum = Number(params.id)
  const { triggerHaptic } = useHapticFeedback()
  const { currentTrack, isPlaying, play, setQueue, addToQueue } = usePlayerStore()

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
        // Load both Sanskrit and English
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
        console.warn('[ChapterDetail] Failed to load verses:', e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadVerses()
    return () => { cancelled = true }
  }, [chapterNum, chapter?.verseCount])

  const handlePlayChapter = useCallback(async () => {
    if (!chapter) return
    triggerHaptic('heavy')
    setPlayingChapter(true)
    try {
      const voiceStyle = (VOICE_TO_STYLE_MAP[selectedVoice] || 'divine') as GitaVoiceStyle
      const tracks = await createChapterTracks(chapterNum, 'sa', voiceStyle)
      if (tracks.length > 0) {
        // Enrich tracks with gitaData for the VerseDisplayPanel
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
      console.warn('[ChapterDetail] Failed to play chapter:', e)
    } finally {
      setPlayingChapter(false)
    }
  }, [chapter, chapterNum, selectedVoice, verses, triggerHaptic, setQueue, play])

  const handlePlayVerse = useCallback(async (verse: VerseDisplay) => {
    if (!chapter) return
    triggerHaptic('medium')
    const voiceStyle = (VOICE_TO_STYLE_MAP[selectedVoice] || 'divine') as GitaVoiceStyle
    const speed = VOICE_TO_SPEED_MAP[selectedVoice]
    const track = createVerseTrack(
      chapterNum,
      verse.verseNumber,
      verse.sanskrit,
      verse.transliteration,
      verse.translation,
      'sa',
      voiceStyle,
      speed,
    )
    // Enrich with gitaData
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
    setQueue([track], 0)
    play(track)
  }, [chapter, chapterNum, selectedVoice, triggerHaptic, setQueue, play])

  if (!chapter) {
    return (
      <MobileAppShell title="Chapter" showBack>
        <div className="flex items-center justify-center h-64">
          <p className="text-[#6B6355]">Chapter not found</p>
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
              {playingChapter ? 'Loading...' : `Play Chapter ${chapterNum} \u2014 ${chapter.verseCount} verses`}
            </span>
          </motion.button>
        </div>

        {/* Verse list */}
        <div className="px-0">
          <p className="px-4 text-[11px] text-[#D4A017] tracking-[0.12em] uppercase mb-2 font-[family-name:var(--font-ui)]">
            All {chapter.verseCount} Verses
          </p>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[#D4A017]" />
            </div>
          ) : (
            <div className="divide-y divide-white/[0.04]">
              {verses.map(verse => {
                const trackId = `gita-voice-${chapterNum}-${verse.verseNumber}-sa-divine`
                const isCurrentVerse = currentTrack?.id === trackId ||
                  (currentTrack?.gitaData?.chapter === chapterNum && currentTrack?.gitaData?.verse === verse.verseNumber)

                return (
                  <VerseListItem
                    key={verse.verseNumber}
                    chapter={chapterNum}
                    verse={verse.verseNumber}
                    chapterColor={chapter.color}
                    sanskritPreview={verse.sanskrit.split('\n')[0]?.slice(0, 50) || ''}
                    englishPreview={verse.translation.slice(0, 80)}
                    isPlaying={isCurrentVerse && isPlaying}
                    onPlay={() => handlePlayVerse(verse)}
                  />
                )
              })}
            </div>
          )}
        </div>
      </div>
    </MobileAppShell>
  )
}
