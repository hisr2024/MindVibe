'use client'

/**
 * KIAAN Vibe - Gita Divine Voice Player
 *
 * A specialized component for playing Bhagavad Gita verses with divine voice.
 * Integrates directly with the KIAAN Vibe Player store for queue management.
 *
 * Features:
 * - Multi-language voice selection (Sanskrit, Hindi, English, Tamil, etc.)
 * - Voice style selection (Divine, Calm, Wisdom, Chanting)
 * - Play single verse, full chapter, or curated collections
 * - Add to player queue for continuous listening
 * - Bilingual mode (Sanskrit + translation)
 * - Real-time audio visualization
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Plus,
  ListMusic,
  Volume2,
  Globe,
  Loader2,
  BookOpen,
  Sparkles,
  ChevronDown,
} from 'lucide-react'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import {
  createVerseTrack,
  createChapterTracks,
  createBilingualVerseTrack,
  createDivinePlaylist,
  getCollectionMeta,
  VOICE_STYLE_PARAMS,
  DIVINE_VERSE_COLLECTIONS,
  type GitaVoiceStyle,
  type DivineCollectionKey,
} from '@/lib/kiaan-vibe/gita-voice-tracks'
import { SUPPORTED_LANGUAGES, GITA_CHAPTERS_META } from '@/lib/kiaan-vibe/gita'

// ============ Sub-Components ============

interface VoiceStyleButtonProps {
  style: GitaVoiceStyle
  selected: boolean
  onSelect: (style: GitaVoiceStyle) => void
}

function VoiceStyleButton({ style, selected, onSelect }: VoiceStyleButtonProps) {
  const labels: Record<GitaVoiceStyle, { name: string; desc: string }> = {
    divine: { name: 'Divine', desc: 'Sacred recitation' },
    calm: { name: 'Calm', desc: 'Soothing pace' },
    wisdom: { name: 'Wisdom', desc: 'Clear teaching' },
    chanting: { name: 'Chanting', desc: 'Vedic meter' },
  }

  const info = labels[style]
  return (
    <button
      onClick={() => onSelect(style)}
      className={`
        flex-1 min-w-[80px] px-3 py-2 rounded-xl text-center transition-all
        ${selected
          ? 'bg-orange-500/30 border border-orange-500/50 text-orange-300'
          : 'bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white/80'
        }
      `}
    >
      <p className="text-xs font-medium">{info.name}</p>
      <p className="text-[10px] opacity-60">{info.desc}</p>
    </button>
  )
}

// ============ Main Component ============

interface GitaVoicePlayerProps {
  /** Chapter number (1-18) */
  chapter: number
  /** Verse number */
  verseNumber: number
  /** Sanskrit text of the verse */
  sanskrit: string
  /** Transliteration of the verse */
  transliteration: string
  /** Translation in the current language */
  translation: string
  /** Current display language code */
  currentLanguage: string
  /** Whether to show in compact mode */
  compact?: boolean
}

export function GitaVoicePlayer({
  chapter,
  verseNumber,
  sanskrit,
  transliteration,
  translation,
  currentLanguage,
  compact = false,
}: GitaVoicePlayerProps) {
  const { currentTrack, isPlaying, play, setQueue, addToQueue, pause, toggle } = usePlayerStore()
  const [selectedStyle, setSelectedStyle] = useState<GitaVoiceStyle>('divine')
  const [selectedLang, setSelectedLang] = useState(currentLanguage)
  const [showLanguages, setShowLanguages] = useState(false)
  const [showStyles, setShowStyles] = useState(false)
  const [isLoadingTrack, setIsLoadingTrack] = useState(false)
  const [isLoadingChapter, setIsLoadingChapter] = useState(false)

  // Check if this verse is currently playing in the Vibe Player
  const currentTrackId = currentTrack?.id || ''
  const isThisVersePlaying = currentTrackId.includes(`gita-voice-${chapter}-${verseNumber}-`)

  /** Play this verse in the KIAAN Vibe Player */
  const handlePlayVerse = useCallback(async () => {
    if (isThisVersePlaying && isPlaying) {
      pause()
      return
    }

    setIsLoadingTrack(true)
    try {
      const track = createVerseTrack(
        chapter,
        verseNumber,
        sanskrit,
        transliteration,
        translation,
        selectedLang,
        selectedStyle,
      )
      setQueue([track], 0)
      await play(track)
    } catch (error) {
      console.error('[GitaVoicePlayer] Play verse failed:', error)
    } finally {
      setIsLoadingTrack(false)
    }
  }, [chapter, verseNumber, sanskrit, transliteration, translation, selectedLang, selectedStyle, isThisVersePlaying, isPlaying, play, setQueue, pause])

  /** Play bilingual mode (Sanskrit + Translation) */
  const handlePlayBilingual = useCallback(async () => {
    setIsLoadingTrack(true)
    try {
      const track = createBilingualVerseTrack(
        chapter,
        verseNumber,
        sanskrit,
        transliteration,
        translation,
        selectedLang === 'sa' ? 'en' : selectedLang,
        selectedStyle,
      )
      setQueue([track], 0)
      await play(track)
    } catch (error) {
      console.error('[GitaVoicePlayer] Bilingual play failed:', error)
    } finally {
      setIsLoadingTrack(false)
    }
  }, [chapter, verseNumber, sanskrit, transliteration, translation, selectedLang, selectedStyle, play, setQueue])

  /** Add verse to the player queue */
  const handleAddToQueue = useCallback(() => {
    const track = createVerseTrack(
      chapter,
      verseNumber,
      sanskrit,
      transliteration,
      translation,
      selectedLang,
      selectedStyle,
    )
    addToQueue(track)
  }, [chapter, verseNumber, sanskrit, transliteration, translation, selectedLang, selectedStyle, addToQueue])

  /** Play entire chapter in sequence */
  const handlePlayChapter = useCallback(async () => {
    setIsLoadingChapter(true)
    try {
      const tracks = await createChapterTracks(chapter, selectedLang, selectedStyle)
      if (tracks.length > 0) {
        // Start from the current verse index
        const startIndex = tracks.findIndex(t => t.id.includes(`-${verseNumber}-`))
        setQueue(tracks, Math.max(0, startIndex))
        await play(tracks[Math.max(0, startIndex)])
      }
    } catch (error) {
      console.error('[GitaVoicePlayer] Play chapter failed:', error)
    } finally {
      setIsLoadingChapter(false)
    }
  }, [chapter, verseNumber, selectedLang, selectedStyle, play, setQueue])

  const langInfo = SUPPORTED_LANGUAGES[selectedLang]

  // Compact mode for inline use
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {/* Play button */}
        <button
          onClick={handlePlayVerse}
          disabled={isLoadingTrack}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            ${isThisVersePlaying && isPlaying
              ? 'bg-orange-500 text-white'
              : 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30'
            }
            ${isLoadingTrack ? 'opacity-70 cursor-wait' : ''}
          `}
          aria-label={isThisVersePlaying && isPlaying ? 'Pause' : 'Play in Vibe Player'}
        >
          {isLoadingTrack ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isThisVersePlaying && isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          Vibe
        </button>

        {/* Add to queue */}
        <button
          onClick={handleAddToQueue}
          className="p-1.5 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 hover:text-white transition-colors"
          aria-label="Add to queue"
          title="Add to Vibe Player queue"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    )
  }

  // Full mode
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl bg-gradient-to-br from-orange-500/5 to-amber-500/5 border border-orange-500/20"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Volume2 className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-medium text-white">Divine Voice Player</span>
        </div>
        <span className="text-xs text-white/40">KIAAN Vibe</span>
      </div>

      {/* Voice Style Selector */}
      <div className="mb-3">
        <button
          onClick={() => setShowStyles(!showStyles)}
          className="flex items-center gap-1 text-xs text-white/50 mb-2 hover:text-white/70 transition-colors"
        >
          Voice Style
          <ChevronDown className={`w-3 h-3 transition-transform ${showStyles ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {showStyles && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="flex gap-2 mb-3">
                {(['divine', 'calm', 'wisdom', 'chanting'] as GitaVoiceStyle[]).map(style => (
                  <VoiceStyleButton
                    key={style}
                    style={style}
                    selected={selectedStyle === style}
                    onSelect={setSelectedStyle}
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Language Selector */}
      <div className="mb-4 relative">
        <button
          onClick={() => setShowLanguages(!showLanguages)}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors w-full"
        >
          <Globe className="w-4 h-4 text-orange-400" />
          <span className="text-lg">{langInfo?.flag || '🌐'}</span>
          <span className="text-sm flex-1 text-left">{langInfo?.nativeName || 'Select Language'}</span>
          <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showLanguages ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showLanguages && (
            <motion.div
              initial={{ opacity: 0, y: -5, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: -5, height: 0 }}
              className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl bg-[#1a1a1f] border border-white/10 shadow-2xl overflow-hidden"
            >
              <div className="p-2 max-h-48 overflow-y-auto">
                {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
                  <button
                    key={code}
                    onClick={() => {
                      setSelectedLang(code)
                      setShowLanguages(false)
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors
                      ${code === selectedLang ? 'bg-orange-500/20 text-white' : 'text-white/70 hover:bg-white/5'}
                    `}
                  >
                    <span>{info.flag}</span>
                    <span className="text-sm">{info.nativeName}</span>
                    {code === selectedLang && <div className="ml-auto w-2 h-2 rounded-full bg-orange-500" />}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Click outside to close dropdowns */}
      {(showLanguages || showStyles) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => { setShowLanguages(false); setShowStyles(false) }}
        />
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {/* Primary: Play Verse */}
        <button
          onClick={handlePlayVerse}
          disabled={isLoadingTrack}
          className={`
            w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all
            ${isThisVersePlaying && isPlaying
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
              : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:from-orange-400 hover:to-amber-400'
            }
            ${isLoadingTrack ? 'opacity-80 cursor-wait' : ''}
          `}
        >
          {isLoadingTrack ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading Divine Voice...
            </>
          ) : isThisVersePlaying && isPlaying ? (
            <>
              <Pause className="w-5 h-5" />
              Pause Divine Voice
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Play in {langInfo?.nativeName || 'Selected Language'}
            </>
          )}
        </button>

        {/* Secondary actions row */}
        <div className="flex gap-2">
          {/* Bilingual mode */}
          {selectedLang !== 'sa' && (
            <button
              onClick={handlePlayBilingual}
              disabled={isLoadingTrack}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/15 transition-colors text-sm font-medium"
            >
              <Sparkles className="w-4 h-4 text-amber-400" />
              Sanskrit + {langInfo?.name || 'Translation'}
            </button>
          )}

          {/* Add to queue */}
          <button
            onClick={handleAddToQueue}
            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-white/10 text-white/80 hover:bg-white/15 transition-colors text-sm font-medium"
            title="Add verse to player queue"
          >
            <Plus className="w-4 h-4 text-green-400" />
            Queue
          </button>
        </div>

        {/* Play full chapter */}
        <button
          onClick={handlePlayChapter}
          disabled={isLoadingChapter}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all text-sm"
        >
          {isLoadingChapter ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading chapter...
            </>
          ) : (
            <>
              <ListMusic className="w-4 h-4" />
              Play Entire Chapter {chapter} ({GITA_CHAPTERS_META.find(c => c.number === chapter)?.verseCount} verses)
            </>
          )}
        </button>
      </div>
    </motion.div>
  )
}

// ============ Divine Collection Player ============

interface DivineCollectionPlayerProps {
  collectionKey: DivineCollectionKey
}

export function DivineCollectionPlayer({ collectionKey }: DivineCollectionPlayerProps) {
  const { play, setQueue } = usePlayerStore()
  const [selectedLang, setSelectedLang] = useState('sa')
  const [selectedStyle, setSelectedStyle] = useState<GitaVoiceStyle>('divine')
  const [isLoading, setIsLoading] = useState(false)

  const meta = getCollectionMeta(collectionKey)

  const handlePlay = async () => {
    setIsLoading(true)
    try {
      const tracks = await createDivinePlaylist(collectionKey, selectedLang, selectedStyle)
      if (tracks.length > 0) {
        setQueue(tracks, 0)
        await play(tracks[0])
      }
    } catch (error) {
      console.error('[DivineCollectionPlayer] Play failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`p-4 rounded-2xl bg-gradient-to-br ${meta.gradient}/20 border border-white/10 hover:border-white/20 transition-all cursor-pointer`}
      onClick={handlePlay}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
          {isLoading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <BookOpen className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm">{meta.name}</h3>
          <p className="text-xs text-white/50 line-clamp-2">{meta.description}</p>
          <p className="text-xs text-white/30 mt-1">{meta.verseCount} verses</p>
        </div>
        <Play className="w-5 h-5 text-white/40 flex-shrink-0 mt-1" />
      </div>
    </motion.div>
  )
}

export default GitaVoicePlayer
