'use client'

/**
 * KIAAN Vibe - Gita Divine Voice Page
 *
 * A dedicated page for browsing and playing Bhagavad Gita verses
 * with divine voice synthesis. Features curated collections,
 * chapter playback, and multi-language voice support integrated
 * directly into the KIAAN Vibe Player.
 */

import { useState, useCallback } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowLeft,
  Play,
  Globe,
  BookOpen,
  Sparkles,
  Moon,
  Sun,
  Heart,
  ListMusic,
  ChevronDown,
  ChevronRight,
  Volume2,
  Loader2,
} from 'lucide-react'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import {
  createChapterTracks,
  createDivinePlaylist,
  getCollectionMeta,
  DIVINE_VERSE_COLLECTIONS,
  type GitaVoiceStyle,
  type DivineCollectionKey,
} from '@/lib/kiaan-vibe/gita-voice-tracks'
import { SUPPORTED_LANGUAGES, GITA_CHAPTERS_META } from '@/lib/kiaan-vibe/gita'

// Collection icons
const COLLECTION_ICONS: Record<DivineCollectionKey, typeof Sparkles> = {
  essential: Sparkles,
  anxietyRelief: Heart,
  morningMeditation: Sun,
  eveningReflection: Moon,
}

export default function GitaDivineVoicePage() {
  const { play, setQueue, currentTrack, isPlaying } = usePlayerStore()
  const [selectedLang, setSelectedLang] = useState('sa')
  const [selectedStyle, setSelectedStyle] = useState<GitaVoiceStyle>('divine')
  const [showLanguages, setShowLanguages] = useState(false)
  const [loadingCollection, setLoadingCollection] = useState<string | null>(null)
  const [loadingChapter, setLoadingChapter] = useState<number | null>(null)

  const langInfo = SUPPORTED_LANGUAGES[selectedLang]

  /** Play a curated divine collection */
  const handlePlayCollection = useCallback(async (key: DivineCollectionKey) => {
    setLoadingCollection(key)
    try {
      const tracks = await createDivinePlaylist(key, selectedLang, selectedStyle)
      if (tracks.length > 0) {
        setQueue(tracks, 0)
        await play(tracks[0])
      }
    } catch (error) {
      console.error('[GitaDivineVoice] Collection play failed:', error)
    } finally {
      setLoadingCollection(null)
    }
  }, [selectedLang, selectedStyle, play, setQueue])

  /** Play an entire chapter */
  const handlePlayChapter = useCallback(async (chapterNumber: number) => {
    setLoadingChapter(chapterNumber)
    try {
      const tracks = await createChapterTracks(chapterNumber, selectedLang, selectedStyle)
      if (tracks.length > 0) {
        setQueue(tracks, 0)
        await play(tracks[0])
      }
    } catch (error) {
      console.error('[GitaDivineVoice] Chapter play failed:', error)
    } finally {
      setLoadingChapter(null)
    }
  }, [selectedLang, selectedStyle, play, setQueue])

  return (
    <div className="space-y-8 pb-32">
      {/* Header */}
      <div>
        <Link
          href="/kiaan-vibe/gita"
          className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Gita
        </Link>

        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 text-orange-400 text-sm font-medium mb-3">
            <Volume2 className="w-4 h-4" />
            Divine Voice
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Gita Divine Voices
          </h1>
          <p className="text-white/60 max-w-md mx-auto">
            Listen to sacred Bhagavad Gita verses with divine pronunciation
            in multiple languages through the KIAAN Vibe Player
          </p>
        </div>
      </div>

      {/* Voice Controls */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-4">
        {/* Language Selector */}
        <div className="relative">
          <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
            Voice Language
          </label>
          <button
            onClick={() => setShowLanguages(!showLanguages)}
            className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors w-full"
          >
            <Globe className="w-5 h-5 text-orange-400" />
            <span className="text-xl">{langInfo?.flag || '🌐'}</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium">{langInfo?.nativeName || 'Select'}</p>
              <p className="text-xs text-white/40">{langInfo?.name || ''}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showLanguages ? 'rotate-180' : ''}`} />
          </button>

          {showLanguages && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowLanguages(false)} />
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute top-full left-0 right-0 mt-2 z-50 rounded-xl bg-[#1a1a1f] border border-white/10 shadow-2xl overflow-hidden"
              >
                <div className="p-2 max-h-64 overflow-y-auto">
                  <p className="px-3 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">
                    Supported Languages
                  </p>
                  {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
                    <button
                      key={code}
                      onClick={() => { setSelectedLang(code); setShowLanguages(false) }}
                      className={`
                        w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                        ${code === selectedLang ? 'bg-orange-500/20 text-white' : 'text-white/70 hover:bg-white/5'}
                      `}
                    >
                      <span className="text-lg">{info.flag}</span>
                      <div className="flex-1 text-left">
                        <p className="text-sm font-medium">{info.nativeName}</p>
                        <p className="text-xs text-white/40">{info.name}</p>
                      </div>
                      {code === selectedLang && <div className="w-2 h-2 rounded-full bg-orange-500" />}
                    </button>
                  ))}
                </div>
              </motion.div>
            </>
          )}
        </div>

        {/* Voice Style */}
        <div>
          <label className="text-xs text-white/40 uppercase tracking-wider mb-2 block">
            Voice Style
          </label>
          <div className="flex gap-2">
            {(['divine', 'calm', 'wisdom', 'chanting'] as GitaVoiceStyle[]).map(style => {
              const labels: Record<GitaVoiceStyle, string> = {
                divine: 'Divine',
                calm: 'Calm',
                wisdom: 'Wisdom',
                chanting: 'Chanting',
              }
              return (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`
                    flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${selectedStyle === style
                      ? 'bg-orange-500/30 border border-orange-500/50 text-orange-300'
                      : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10'
                    }
                  `}
                >
                  {labels[style]}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Divine Collections */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-400" />
          Divine Collections
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {(Object.keys(DIVINE_VERSE_COLLECTIONS) as DivineCollectionKey[]).map((key) => {
            const meta = getCollectionMeta(key)
            const Icon = COLLECTION_ICONS[key]
            const isLoading = loadingCollection === key

            return (
              <motion.button
                key={key}
                onClick={() => handlePlayCollection(key)}
                disabled={isLoading}
                whileTap={{ scale: 0.98 }}
                className={`
                  group flex items-start gap-4 p-4 rounded-2xl text-left transition-all
                  bg-gradient-to-br ${meta.gradient}/10 border border-white/10
                  hover:border-white/20 hover:bg-white/5
                  ${isLoading ? 'opacity-80 cursor-wait' : ''}
                `}
              >
                <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
                  {isLoading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Icon className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-white text-sm group-hover:text-orange-400 transition-colors">
                    {meta.name}
                  </h3>
                  <p className="text-xs text-white/50 line-clamp-2 mt-0.5">
                    {meta.description}
                  </p>
                  <p className="text-xs text-white/30 mt-1">
                    {meta.verseCount} sacred verses
                  </p>
                </div>
                <Play className="w-5 h-5 text-white/30 group-hover:text-orange-400 flex-shrink-0 mt-1 transition-colors" />
              </motion.button>
            )
          })}
        </div>
      </div>

      {/* Chapter Playback */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-orange-400" />
          Play Full Chapters
        </h2>
        <p className="text-sm text-white/50 mb-4">
          Listen to complete chapters with divine voice recitation. Each verse plays sequentially
          through the KIAAN Vibe Player.
        </p>

        <div className="space-y-2">
          {GITA_CHAPTERS_META.map((chapter, index) => {
            const isLoading = loadingChapter === chapter.number
            const isCurrentChapter = currentTrack?.tags?.includes(`chapter-${chapter.number}`)

            return (
              <motion.div
                key={chapter.number}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <button
                  onClick={() => handlePlayChapter(chapter.number)}
                  disabled={isLoading}
                  className={`
                    w-full group flex items-center gap-4 p-4 rounded-xl text-left transition-all
                    ${isCurrentChapter && isPlaying
                      ? 'bg-orange-500/20 border border-orange-500/30'
                      : 'bg-white/5 border border-transparent hover:bg-white/10 hover:border-white/10'
                    }
                    ${isLoading ? 'opacity-80 cursor-wait' : ''}
                  `}
                >
                  {/* Chapter number */}
                  <div className={`
                    flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center
                    ${isCurrentChapter && isPlaying
                      ? 'bg-orange-500'
                      : 'bg-gradient-to-br from-orange-500/20 to-amber-500/10'
                    }
                  `}>
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    ) : isCurrentChapter && isPlaying ? (
                      <div className="flex gap-0.5">
                        {[1, 2, 3].map(i => (
                          <motion.div
                            key={i}
                            className="w-0.5 bg-white rounded-full"
                            animate={{ height: [3, 10, 3] }}
                            transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm font-bold text-orange-400">{chapter.number}</span>
                    )}
                  </div>

                  {/* Chapter info */}
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium text-sm ${isCurrentChapter && isPlaying ? 'text-orange-400' : 'text-white group-hover:text-orange-400'} transition-colors`}>
                      {chapter.nameSanskrit}
                    </h3>
                    <p className="text-xs text-white/50">
                      {chapter.name} - {chapter.verseCount} verses
                    </p>
                  </div>

                  {/* Play icon */}
                  <div className="flex items-center gap-2">
                    <ListMusic className="w-4 h-4 text-white/30 group-hover:text-orange-400 transition-colors" />
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/40 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </button>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Info section */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
        <h3 className="text-sm font-medium text-white mb-2">About Divine Voice</h3>
        <div className="space-y-2 text-xs text-white/50">
          <p>
            Divine Voice uses advanced AI text-to-speech to recite Bhagavad Gita verses
            with precise Sanskrit pronunciation using Sarvam AI and Google Neural2 voices.
          </p>
          <p>
            Tracks are automatically queued in the KIAAN Vibe Player, allowing you to
            listen while browsing other parts of the app.
          </p>
          <p>
            Supported languages: Sanskrit, Hindi, English, Tamil, Telugu, Bengali,
            Marathi, Gujarati, Kannada, Malayalam, and Punjabi.
          </p>
        </div>
      </div>
    </div>
  )
}
