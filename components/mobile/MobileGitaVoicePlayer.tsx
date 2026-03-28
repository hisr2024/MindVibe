'use client'

/**
 * Mobile Gita Divine Voice Player
 *
 * Touch-optimized component for playing Bhagavad Gita verses with divine voice.
 * Integrates with KIAAN Vibe Player store for queue management.
 *
 * Features:
 * - Horizontal scroll voice style selector (divine/calm/wisdom/chanting)
 * - Bottom sheet language selector (29+ languages)
 * - Play single verse, bilingual mode, full chapter
 * - Add to queue with haptic confirmation
 * - Compact inline mode for verse cards
 * - Sacred Sanskrit typography with divine glow
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  Plus,
  ListMusic,
  Globe,
  Loader2,
  BookOpen,
  Sparkles,
  Check,
} from 'lucide-react'
import { usePlayerStore } from '@/lib/kiaan-vibe/store'
import {
  createVerseTrack,
  createChapterTracks,
  createBilingualVerseTrack,
  createDivinePlaylist,
  getCollectionMeta,
  type GitaVoiceStyle,
  type DivineCollectionKey,
} from '@/lib/kiaan-vibe/gita-voice-tracks'
import { SUPPORTED_LANGUAGES, GITA_CHAPTERS_META } from '@/lib/kiaan-vibe/gita'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { MobileBottomSheet } from './MobileBottomSheet'

// ============ Voice Style Card ============

interface VoiceStyleCardProps {
  style: GitaVoiceStyle
  selected: boolean
  onSelect: (style: GitaVoiceStyle) => void
}

const VOICE_STYLE_CONFIG: Record<GitaVoiceStyle, {
  name: string
  desc: string
  gradient: string
  icon: string
}> = {
  divine: { name: 'Divine', desc: 'Sacred recitation', gradient: 'from-amber-500/20 to-[#d4a44c]/10', icon: '\u2728' },
  calm: { name: 'Calm', desc: 'Soothing pace', gradient: 'from-cyan-500/20 to-blue-500/10', icon: '\uD83C\uDF3F' },
  wisdom: { name: 'Wisdom', desc: 'Clear teaching', gradient: 'from-purple-500/20 to-indigo-500/10', icon: '\uD83D\uDCDA' },
  chanting: { name: 'Chanting', desc: 'Vedic meter', gradient: 'from-orange-500/20 to-amber-500/10', icon: '\uD83D\uDD49\uFE0F' },
}

function VoiceStyleCard({ style, selected, onSelect }: VoiceStyleCardProps) {
  const { triggerHaptic } = useHapticFeedback()
  const config = VOICE_STYLE_CONFIG[style]

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => {
        onSelect(style)
        triggerHaptic('selection')
      }}
      className={`
        flex-shrink-0 w-[100px] p-3 rounded-2xl text-center transition-all
        border backdrop-blur-sm
        ${selected
          ? 'bg-[#d4a44c]/15 border-[#d4a44c]/30 shadow-lg shadow-[#d4a44c]/10'
          : 'bg-white/[0.03] border-white/[0.08]'
        }
      `}
    >
      <div className="text-xl mb-1.5">{config.icon}</div>
      <p className={`text-xs font-semibold ${selected ? 'text-[#e8b54a]' : 'text-white/70'}`}>
        {config.name}
      </p>
      <p className="text-[9px] text-white/40 mt-0.5">{config.desc}</p>
      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="mt-1.5 mx-auto w-1.5 h-1.5 rounded-full bg-[#d4a44c]"
        />
      )}
    </motion.button>
  )
}

// ============ Main Component ============

interface MobileGitaVoicePlayerProps {
  chapter: number
  verseNumber: number
  sanskrit: string
  transliteration: string
  translation: string
  currentLanguage: string
  compact?: boolean
}

export function MobileGitaVoicePlayer({
  chapter,
  verseNumber,
  sanskrit,
  transliteration,
  translation,
  currentLanguage,
  compact = false,
}: MobileGitaVoicePlayerProps) {
  const { currentTrack, isPlaying, play, setQueue, addToQueue, pause } = usePlayerStore()
  const { triggerHaptic } = useHapticFeedback()

  const [selectedStyle, setSelectedStyle] = useState<GitaVoiceStyle>('divine')
  const [selectedLang, setSelectedLang] = useState(currentLanguage)
  const [showLanguageSheet, setShowLanguageSheet] = useState(false)
  const [isLoadingTrack, setIsLoadingTrack] = useState(false)
  const [isLoadingChapter, setIsLoadingChapter] = useState(false)
  const [addedToQueue, setAddedToQueue] = useState(false)

  const currentTrackId = currentTrack?.id || ''
  const isThisVersePlaying = currentTrackId.includes(`gita-voice-${chapter}-${verseNumber}-`)
  const langInfo = SUPPORTED_LANGUAGES[selectedLang]

  /** Play this verse */
  const handlePlayVerse = useCallback(async () => {
    if (isThisVersePlaying && isPlaying) {
      pause()
      return
    }
    setIsLoadingTrack(true)
    triggerHaptic('medium')
    try {
      const track = createVerseTrack(chapter, verseNumber, sanskrit, transliteration, translation, selectedLang, selectedStyle)
      setQueue([track], 0)
      await play(track)
    } catch (error) {
      console.warn('[MobileGitaVoicePlayer] Play verse failed:', error)
    } finally {
      setIsLoadingTrack(false)
    }
  }, [chapter, verseNumber, sanskrit, transliteration, translation, selectedLang, selectedStyle, isThisVersePlaying, isPlaying, play, setQueue, pause, triggerHaptic])

  /** Play bilingual mode */
  const handlePlayBilingual = useCallback(async () => {
    setIsLoadingTrack(true)
    triggerHaptic('medium')
    try {
      const track = createBilingualVerseTrack(chapter, verseNumber, sanskrit, transliteration, translation, selectedLang === 'sa' ? 'en' : selectedLang, selectedStyle)
      setQueue([track], 0)
      await play(track)
    } catch (error) {
      console.warn('[MobileGitaVoicePlayer] Bilingual play failed:', error)
    } finally {
      setIsLoadingTrack(false)
    }
  }, [chapter, verseNumber, sanskrit, transliteration, translation, selectedLang, selectedStyle, play, setQueue, triggerHaptic])

  /** Add to queue */
  const handleAddToQueue = useCallback(() => {
    const track = createVerseTrack(chapter, verseNumber, sanskrit, transliteration, translation, selectedLang, selectedStyle)
    addToQueue(track)
    triggerHaptic('success')
    setAddedToQueue(true)
    setTimeout(() => setAddedToQueue(false), 2000)
  }, [chapter, verseNumber, sanskrit, transliteration, translation, selectedLang, selectedStyle, addToQueue, triggerHaptic])

  /** Play entire chapter */
  const handlePlayChapter = useCallback(async () => {
    setIsLoadingChapter(true)
    triggerHaptic('medium')
    try {
      const tracks = await createChapterTracks(chapter, selectedLang, selectedStyle)
      if (tracks.length > 0) {
        const startIndex = tracks.findIndex(t => t.id.includes(`-${verseNumber}-`))
        setQueue(tracks, Math.max(0, startIndex))
        await play(tracks[Math.max(0, startIndex)])
      }
    } catch (error) {
      console.warn('[MobileGitaVoicePlayer] Play chapter failed:', error)
    } finally {
      setIsLoadingChapter(false)
    }
  }, [chapter, verseNumber, selectedLang, selectedStyle, play, setQueue, triggerHaptic])

  // ===== COMPACT MODE =====
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handlePlayVerse}
          disabled={isLoadingTrack}
          className={`
            flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all
            ${isThisVersePlaying && isPlaying
              ? 'bg-[#d4a44c] text-white shadow-lg shadow-[#d4a44c]/30'
              : 'bg-[#d4a44c]/15 text-[#e8b54a]'
            }
          `}
          aria-label={isThisVersePlaying && isPlaying ? 'Pause' : 'Play'}
        >
          {isLoadingTrack ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : isThisVersePlaying && isPlaying ? (
            <Pause className="w-3.5 h-3.5" />
          ) : (
            <Play className="w-3.5 h-3.5" />
          )}
          Vibe
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={handleAddToQueue}
          className={`p-2 rounded-xl transition-all ${
            addedToQueue
              ? 'bg-green-500/20 text-green-400'
              : 'bg-white/[0.06] text-white/50'
          }`}
          aria-label="Add to queue"
        >
          {addedToQueue ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
        </motion.button>
      </div>
    )
  }

  // ===== FULL MODE =====
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-gradient-to-br from-[#d4a44c]/[0.06] to-transparent border border-[#d4a44c]/15 overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#d4a44c]/15 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#d4a44c]" />
            </div>
            <span className="text-sm font-semibold text-white">Divine Voice Player</span>
          </div>
          <span className="text-[10px] text-[#d4a44c]/60 font-medium tracking-wider uppercase">KIAAN Vibe</span>
        </div>

        {/* Voice Style Selector - horizontal scroll */}
        <div className="px-4 pb-3">
          <p className="text-[10px] text-white/40 uppercase tracking-wider mb-2 font-medium">Voice Style</p>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
            {(['divine', 'calm', 'wisdom', 'chanting'] as GitaVoiceStyle[]).map(style => (
              <VoiceStyleCard
                key={style}
                style={style}
                selected={selectedStyle === style}
                onSelect={setSelectedStyle}
              />
            ))}
          </div>
        </div>

        {/* Language Selector Button */}
        <div className="px-4 pb-4">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => { setShowLanguageSheet(true); triggerHaptic('light') }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/[0.08] transition-all"
          >
            <Globe className="w-4 h-4 text-[#e8b54a]" />
            <span className="text-lg">{langInfo?.flag || '\uD83C\uDF10'}</span>
            <span className="text-sm text-white/80 flex-1 text-left">{langInfo?.nativeName || 'Select Language'}</span>
            <span className="text-xs text-white/30">Change</span>
          </motion.button>
        </div>

        {/* Action Buttons */}
        <div className="px-4 pb-4 space-y-2.5">
          {/* Primary: Play Verse */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePlayVerse}
            disabled={isLoadingTrack}
            className={`
              w-full flex items-center justify-center gap-2.5 px-4 py-3.5 rounded-xl font-semibold transition-all
              ${isThisVersePlaying && isPlaying
                ? 'bg-[#d4a44c] text-white shadow-xl shadow-[#d4a44c]/30'
                : 'text-white shadow-lg shadow-[#d4a44c]/20'
              }
            `}
            style={!(isThisVersePlaying && isPlaying) ? { background: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 45%, #f0c96d 100%)' } : undefined}
          >
            {isLoadingTrack ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Loading Divine Voice...</span>
              </>
            ) : isThisVersePlaying && isPlaying ? (
              <>
                <Pause className="w-5 h-5" />
                <span>Pause Divine Voice</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>Play in {langInfo?.nativeName || 'Selected Language'}</span>
              </>
            )}
          </motion.button>

          {/* Secondary row */}
          <div className="flex gap-2">
            {/* Bilingual mode */}
            {selectedLang !== 'sa' && (
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handlePlayBilingual}
                disabled={isLoadingTrack}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl bg-white/[0.06] border border-white/[0.06] text-white/70 text-sm font-medium transition-all"
              >
                <BookOpen className="w-4 h-4 text-[#d4a44c]" />
                <span className="truncate">Sanskrit + {langInfo?.name || 'Translation'}</span>
              </motion.button>
            )}

            {/* Add to queue */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToQueue}
              className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                addedToQueue
                  ? 'bg-green-500/10 border-green-500/20 text-green-400'
                  : 'bg-white/[0.06] border-white/[0.06] text-white/70'
              }`}
            >
              {addedToQueue ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4 text-green-400" />}
              <span>{addedToQueue ? 'Added!' : 'Queue'}</span>
            </motion.button>
          </div>

          {/* Play full chapter */}
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handlePlayChapter}
            disabled={isLoadingChapter}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-white/50 text-sm transition-all"
          >
            {isLoadingChapter ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Loading chapter...</span>
              </>
            ) : (
              <>
                <ListMusic className="w-4 h-4" />
                <span>Play Chapter {chapter} ({GITA_CHAPTERS_META.find(c => c.number === chapter)?.verseCount} verses)</span>
              </>
            )}
          </motion.button>
        </div>
      </motion.div>

      {/* Language Bottom Sheet */}
      <MobileBottomSheet
        isOpen={showLanguageSheet}
        onClose={() => setShowLanguageSheet(false)}
        title="Select Language"
        subtitle="Choose your preferred language for divine voice"
        height="half"
        showHandle
        dismissible
      >
        <div className="px-1 pb-4 space-y-1">
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
            <motion.button
              key={code}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                setSelectedLang(code)
                setShowLanguageSheet(false)
                triggerHaptic('selection')
              }}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                ${code === selectedLang
                  ? 'bg-[#d4a44c]/15 border border-[#d4a44c]/25'
                  : 'bg-white/[0.02] border border-transparent'
                }
              `}
            >
              <span className="text-xl">{info.flag}</span>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${code === selectedLang ? 'text-[#e8b54a]' : 'text-white/80'}`}>
                  {info.nativeName}
                </p>
                <p className="text-[10px] text-white/40">{info.name}</p>
              </div>
              {code === selectedLang && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-5 h-5 rounded-full bg-[#d4a44c] flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </motion.div>
              )}
            </motion.button>
          ))}
        </div>
      </MobileBottomSheet>
    </>
  )
}

// ============ Divine Collection Card (Mobile) ============

interface MobileDivineCollectionCardProps {
  collectionKey: DivineCollectionKey
}

export function MobileDivineCollectionCard({ collectionKey }: MobileDivineCollectionCardProps) {
  const { play, setQueue } = usePlayerStore()
  const { triggerHaptic } = useHapticFeedback()
  const [isLoading, setIsLoading] = useState(false)

  const meta = getCollectionMeta(collectionKey)

  const handlePlay = async () => {
    setIsLoading(true)
    triggerHaptic('medium')
    try {
      const tracks = await createDivinePlaylist(collectionKey, 'sa', 'divine')
      if (tracks.length > 0) {
        setQueue(tracks, 0)
        await play(tracks[0])
      }
    } catch (error) {
      console.warn('[MobileDivineCollectionCard] Play failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`w-full p-4 rounded-2xl bg-gradient-to-br ${meta.gradient}/15 border border-white/[0.08] text-left transition-all`}
      onClick={handlePlay}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-lg`}>
          {isLoading ? (
            <Loader2 className="w-6 h-6 text-white animate-spin" />
          ) : (
            <BookOpen className="w-6 h-6 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm">{meta.name}</h3>
          <p className="text-[11px] text-white/50 line-clamp-2 mt-0.5">{meta.description}</p>
          <p className="text-[10px] text-white/40 mt-1">{meta.verseCount} verses</p>
        </div>
        <Play className="w-5 h-5 text-white/40 flex-shrink-0 mt-1" />
      </div>
    </motion.button>
  )
}

export default MobileGitaVoicePlayer
