'use client'

/**
 * KIAAN Vibe - Chapter Verses
 *
 * Display verses for a specific chapter.
 */

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, ChevronRight, Play, Volume2, Loader2, ListMusic } from 'lucide-react'
import { getChapter, GITA_CHAPTERS_META, SUPPORTED_LANGUAGES } from '@/lib/kiaan-vibe/gita'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import { createChapterTracks } from '@/lib/kiaan-vibe/gita-voice-tracks'
import type { GitaChapter } from '@/lib/kiaan-vibe/types'

interface PageProps {
  params: Promise<{ chapter: string }>
}

export default function ChapterVersesPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const chapterNumber = parseInt(resolvedParams.chapter, 10)
  const languageCode = searchParams.get('lang') || 'en'

  const [chapter, setChapter] = useState<GitaChapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [_copiedVerse, setCopiedVerse] = useState<number | null>(null)
  const [isLoadingChapter, setIsLoadingChapter] = useState(false)

  const { play, setQueue, currentTrack, isPlaying: playerIsPlaying } = usePlayerStore()

  const chapterMeta = GITA_CHAPTERS_META.find((c) => c.number === chapterNumber)
  const langInfo = SUPPORTED_LANGUAGES[languageCode] || SUPPORTED_LANGUAGES['en']
  const isCurrentChapter = currentTrack?.tags?.includes(`chapter-${chapterNumber}`)

  /** Play entire chapter in the KIAAN Vibe Player */
  const handlePlayChapter = async () => {
    setIsLoadingChapter(true)
    try {
      const tracks = await createChapterTracks(chapterNumber, languageCode, 'divine')
      if (tracks.length > 0) {
        setQueue(tracks, 0)
        await play(tracks[0])
      }
    } catch (error) {
      console.error('[GitaChapter] Play chapter failed:', error)
    } finally {
      setIsLoadingChapter(false)
    }
  }

  useEffect(() => {
    const loadChapter = async () => {
      try {
        setLoading(true)
        const data = await getChapter(chapterNumber, languageCode)
        setChapter(data)
      } catch (err) {
        console.error('[GitaChapter] Failed to load chapter:', err)
        setChapter(null)
      } finally {
        setLoading(false)
      }
    }
    loadChapter()
  }, [chapterNumber, languageCode])

  const _handleCopy = async (verseNumber: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedVerse(verseNumber)
      setTimeout(() => setCopiedVerse(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Header */}
      <div>
        <Link
          href={`/kiaan-vibe/gita?lang=${languageCode}`}
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to chapters
        </Link>

        <div className="flex items-center gap-2 mb-2">
          <span className="px-2 py-1 rounded-lg bg-orange-500/20 text-orange-400 text-sm font-medium">
            Chapter {chapterNumber}
          </span>
          <span className="px-2 py-1 rounded-lg bg-white/10 text-white/60 text-sm flex items-center gap-1">
            {langInfo.flag} {langInfo.nativeName}
          </span>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">
          {chapterMeta?.nameSanskrit}
        </h1>
        <p className="text-white/60">
          {chapterMeta?.name} • {chapterMeta?.verseCount} verses
        </p>
      </div>

      {/* Play Chapter & Divine Voice Controls */}
      <div className="flex gap-3">
        <button
          onClick={handlePlayChapter}
          disabled={isLoadingChapter}
          className={`
            flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all
            ${isCurrentChapter && playerIsPlaying
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
              : 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-400 border border-orange-500/30 hover:from-orange-500/30 hover:to-amber-500/30'
            }
            ${isLoadingChapter ? 'opacity-80 cursor-wait' : ''}
          `}
        >
          {isLoadingChapter ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading...
            </>
          ) : isCurrentChapter && playerIsPlaying ? (
            <>
              <Volume2 className="w-5 h-5" />
              Playing in Vibe
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Play Chapter
            </>
          )}
        </button>

        <Link
          href={`/kiaan-vibe/gita/voice`}
          className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:bg-white/10 hover:text-white transition-all"
        >
          <ListMusic className="w-5 h-5" />
          <span className="hidden sm:inline">Divine Voice</span>
        </Link>
      </div>

      {/* Verses */}
      {chapter && chapter.verses.length > 0 ? (
        <div className="space-y-4">
          {chapter.verses.map((verse, index) => (
            <Link
              key={verse.verseNumber}
              href={`/kiaan-vibe/gita/${chapterNumber}/${verse.verseNumber}?lang=${languageCode}`}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                className="group p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-orange-500/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  {/* Verse number */}
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-400">
                      {verse.verseNumber}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Sanskrit */}
                    {verse.sanskrit && (
                      <p className="text-orange-300/80 text-sm mb-2 font-sanskrit leading-relaxed">
                        {verse.sanskrit.length > 150
                          ? verse.sanskrit.slice(0, 150) + '...'
                          : verse.sanskrit}
                      </p>
                    )}

                    {/* Translation */}
                    <p className="text-white/80 text-sm line-clamp-2">
                      {verse.translations[languageCode] || 'Translation not available'}
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="flex-shrink-0 w-5 h-5 text-white/30 group-hover:text-orange-400 group-hover:translate-x-1 transition-all mt-2" />
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-white/20 mx-auto mb-4" />
          <p className="text-white/40">
            Verses not available for this language yet.
          </p>
          <Link
            href={`/kiaan-vibe/gita/${chapterNumber}?lang=en`}
            className="mt-4 inline-block text-orange-400 hover:text-orange-300"
          >
            View in English
          </Link>
        </div>
      )}

      {/* Chapter navigation */}
      <div className="flex justify-between pt-4 border-t border-white/10">
        {chapterNumber > 1 ? (
          <Link
            href={`/kiaan-vibe/gita/${chapterNumber - 1}?lang=${languageCode}`}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Chapter {chapterNumber - 1}
          </Link>
        ) : (
          <div />
        )}

        {chapterNumber < 18 && (
          <Link
            href={`/kiaan-vibe/gita/${chapterNumber + 1}?lang=${languageCode}`}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
          >
            Chapter {chapterNumber + 1}
            <ChevronRight className="w-4 h-4" />
          </Link>
        )}
      </div>
    </div>
  )
}
