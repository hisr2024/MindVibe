'use client'

/**
 * Gita Audio Player Component
 *
 * ॐ श्रीमद्भगवद्गीता
 *
 * Premium Bhagavad Gita audio player with:
 * - Multi-language support (Sanskrit, Hindi, Telugu, Tamil, Malayalam, English)
 * - Chapter and verse navigation
 * - Ambient sound layering
 * - Beautiful visualizations
 * - Learning mode with meaning display
 * - Soundscape presets
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
  BookOpen,
  Globe,
  Music2,
  Heart,
  Moon,
  Sun,
  Brain,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings2,
  ListMusic,
  Timer,
  Headphones,
  Languages,
  type LucideIcon
} from 'lucide-react'
import {
  GitaAudioEngine,
  getGitaAudioEngine,
  type GitaPlaybackState
} from '@/services/audio/GitaAudioEngine'
import {
  type GitaLanguage,
  type GitaChapter,
  type GitaSoundscape,
  GITA_CHAPTERS,
  GITA_AUDIO_SOURCES,
  GITA_SOUNDSCAPES,
  getGitaChapter
} from '@/lib/constants/gita-audio'

// ============ Types ============

export interface GitaAudioPlayerProps {
  className?: string
  defaultChapter?: number
  defaultLanguage?: GitaLanguage
  defaultSoundscape?: string
  showChapterList?: boolean
  showSoundscapes?: boolean
  showLearningMode?: boolean
  compact?: boolean
  onChapterChange?: (chapter: number) => void
  onLanguageChange?: (language: GitaLanguage) => void
}

// ============ Language Config ============

const LANGUAGE_CONFIG: Record<GitaLanguage, {
  name: string
  nativeName: string
  flag: string
  color: string
}> = {
  sanskrit: { name: 'Sanskrit', nativeName: 'संस्कृत', flag: '🕉️', color: 'from-orange-500 to-amber-500' },
  hindi: { name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', color: 'from-orange-600 to-green-600' },
  telugu: { name: 'Telugu', nativeName: 'తెలుగు', flag: '🎵', color: 'from-yellow-500 to-amber-600' },
  tamil: { name: 'Tamil', nativeName: 'தமிழ்', flag: '🏛️', color: 'from-red-500 to-rose-600' },
  malayalam: { name: 'Malayalam', nativeName: 'മലയാളം', flag: '🌴', color: 'from-green-500 to-emerald-600' },
  english: { name: 'English', nativeName: 'English', flag: '📖', color: 'from-blue-500 to-indigo-600' },
  kannada: { name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🏯', color: 'from-red-500 to-yellow-600' },
  gujarati: { name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🦚', color: 'from-orange-500 to-red-500' },
  bengali: { name: 'Bengali', nativeName: 'বাংলা', flag: '🪷', color: 'from-green-500 to-orange-500' },
  marathi: { name: 'Marathi', nativeName: 'मराठी', flag: '🚩', color: 'from-orange-500 to-green-500' }
}

// ============ Soundscape Icons ============

const SOUNDSCAPE_ICONS: Record<string, LucideIcon> = {
  Sun: Sun,
  Moon: Moon,
  Brain: Brain,
  BookOpen: BookOpen,
  Heart: Heart,
  Sparkles: Sparkles,
  Music: Music2,
  Globe: Globe
}

// ============ Helper Functions ============

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// ============ Main Component ============

export function GitaAudioPlayer({
  className = '',
  defaultChapter = 1,
  defaultLanguage = 'sanskrit',
  defaultSoundscape,
  showChapterList = true,
  showSoundscapes = true,
  showLearningMode = true,
  compact = false,
  onChapterChange,
  onLanguageChange
}: GitaAudioPlayerProps) {
  // Engine instance
  const [engine] = useState(() => getGitaAudioEngine())

  // Playback state
  const [state, setState] = useState<GitaPlaybackState>({
    isPlaying: false,
    isPaused: false,
    isLoading: false,
    currentLanguage: defaultLanguage,
    currentChapter: defaultChapter,
    currentVerse: 1,
    currentTime: 0,
    duration: 0,
    progress: 0,
    volume: 0.7,
    playbackSpeed: 1.0,
    playbackMode: 'continuous',
    soundscapeId: defaultSoundscape || null,
    ambientVolume: 0.25,
    error: null
  })

  // UI state
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)
  const [showChapters, setShowChapters] = useState(false)
  const [showSoundscapeSelector, setShowSoundscapeSelector] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)

  // Current chapter info
  const currentChapter = useMemo(() =>
    getGitaChapter(state.currentChapter),
    [state.currentChapter]
  )

  // Available languages (filtered to those with audio)
  const availableLanguages = useMemo(() =>
    GITA_AUDIO_SOURCES.map(s => s.language),
    []
  )

  // Initialize engine
  useEffect(() => {
    engine.initialize()

    // Set up state listener
    const originalConfig = (engine as any).config
    ;(engine as any).config = {
      ...originalConfig,
      onStateChange: (newState: GitaPlaybackState) => {
        setState(newState)
      }
    }

    return () => {
      // Cleanup
    }
  }, [engine])

  // ============ Playback Handlers ============

  const handlePlayPause = useCallback(async () => {
    if (state.isPlaying) {
      engine.pause()
    } else if (state.isPaused) {
      await engine.resume()
    } else {
      await engine.playChapter(state.currentChapter, state.currentLanguage)
    }
  }, [engine, state.isPlaying, state.isPaused, state.currentChapter, state.currentLanguage])

  const handlePrevChapter = useCallback(async () => {
    await engine.previousChapter()
    onChapterChange?.(engine.getState().currentChapter)
  }, [engine, onChapterChange])

  const handleNextChapter = useCallback(async () => {
    await engine.nextChapter()
    onChapterChange?.(engine.getState().currentChapter)
  }, [engine, onChapterChange])

  const handleChapterSelect = useCallback(async (chapter: number) => {
    await engine.playChapter(chapter, state.currentLanguage)
    setShowChapters(false)
    onChapterChange?.(chapter)
  }, [engine, state.currentLanguage, onChapterChange])

  const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const percent = parseFloat(e.target.value)
    engine.seekTo(percent)
  }, [engine])

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value)
    engine.setGitaVolume(volume)
  }, [engine])

  const handleAmbientVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value)
    engine.setAmbientVolume(volume)
  }, [engine])

  const handleLanguageSelect = useCallback(async (language: GitaLanguage) => {
    await engine.setLanguage(language)
    setShowLanguageSelector(false)
    onLanguageChange?.(language)
  }, [engine, onLanguageChange])

  const handleSoundscapeSelect = useCallback(async (soundscapeId: string) => {
    await engine.playWithSoundscape(soundscapeId, state.currentChapter)
    setShowSoundscapeSelector(false)
  }, [engine, state.currentChapter])

  const handleSpeedChange = useCallback((speed: number) => {
    engine.setPlaybackSpeed(speed)
  }, [engine])

  // ============ Render ============

  const langConfig = LANGUAGE_CONFIG[state.currentLanguage]

  return (
    <div className={`relative ${className}`}>
      {/* Main Player Card */}
      <motion.div
        layout
        className="rounded-3xl border border-white/10 bg-gradient-to-br from-[#0d0d10]/95 to-[#0a0a0d]/95 backdrop-blur-xl overflow-hidden"
      >
        {/* Header with Visualization */}
        <div className="relative h-48 overflow-hidden">
          {/* Animated gradient background */}
          <div className={`absolute inset-0 bg-gradient-to-br ${currentChapter?.color || 'from-orange-500 to-amber-600'} opacity-40`} />

          {/* Animated sacred geometry */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="w-32 h-32 rounded-full border-2 border-white/20"
              animate={state.isPlaying ? {
                scale: [1, 1.1, 1],
                rotate: [0, 180, 360],
                opacity: [0.3, 0.6, 0.3]
              } : {}}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute w-24 h-24 rounded-full border border-white/30"
              animate={state.isPlaying ? {
                scale: [1.1, 1, 1.1],
                rotate: [360, 180, 0]
              } : {}}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
            />
            <motion.div
              className="absolute w-16 h-16 rounded-full bg-white/10"
              animate={state.isPlaying ? {
                scale: [1, 1.2, 1]
              } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Om symbol */}
            <span className="absolute text-4xl text-white/80 font-sanskrit">
              ॐ
            </span>
          </div>

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0d] via-transparent to-transparent" />

          {/* Top controls */}
          <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
            {/* Language selector */}
            <button
              onClick={() => setShowLanguageSelector(!showLanguageSelector)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-black/30 backdrop-blur-sm text-white/80 hover:text-white transition-colors"
            >
              <Languages className="w-4 h-4" />
              <span className="text-sm">{langConfig.nativeName}</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showLanguageSelector ? 'rotate-180' : ''}`} />
            </button>

            {/* Settings & favorite */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFavorite(!isFavorite)}
                className={`p-2 rounded-lg transition-colors ${
                  isFavorite ? 'bg-rose-500/30 text-rose-400' : 'bg-black/30 text-white/60 hover:text-white'
                }`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg bg-black/30 text-white/60 hover:text-white transition-colors"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Chapter info */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-xs text-white/50 mb-1">
                  Chapter {state.currentChapter} of 18
                </p>
                <h2 className="text-xl font-bold text-white mb-0.5">
                  {currentChapter?.nameSanskrit}
                </h2>
                <p className="text-sm text-white/70">
                  {currentChapter?.nameEnglish}
                </p>
              </div>

              {/* Soundscape indicator */}
              {state.soundscapeId && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10">
                  <Music2 className="w-4 h-4 text-white/60" />
                  <span className="text-xs text-white/60">
                    {GITA_SOUNDSCAPES.find(s => s.id === state.soundscapeId)?.name}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="px-4 py-2">
          <div className="flex items-center gap-3">
            <span className="text-xs text-white/50 w-10 text-right">
              {formatTime(state.currentTime)}
            </span>
            <input
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={state.progress}
              onChange={handleSeek}
              className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-orange-500"
              style={{
                background: `linear-gradient(to right, rgb(249 115 22) ${state.progress}%, rgba(255,255,255,0.1) ${state.progress}%)`
              }}
            />
            <span className="text-xs text-white/50 w-10">
              {formatTime(state.duration)}
            </span>
          </div>
        </div>

        {/* Main controls */}
        <div className="px-4 pb-4">
          <div className="flex items-center justify-center gap-4">
            {/* Repeat */}
            <button
              onClick={() => engine.setPlaybackMode(
                state.playbackMode === 'chapter_loop' ? 'continuous' : 'chapter_loop'
              )}
              className={`p-2 rounded-full transition-colors ${
                state.playbackMode === 'chapter_loop'
                  ? 'text-orange-400'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              <Repeat className="w-5 h-5" />
            </button>

            {/* Previous */}
            <button
              onClick={handlePrevChapter}
              className="p-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Play/Pause */}
            <button
              onClick={handlePlayPause}
              disabled={state.isLoading}
              className={`p-5 rounded-full transition-all ${
                state.isPlaying
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              } disabled:opacity-50`}
            >
              {state.isLoading ? (
                <motion.div
                  className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : state.isPlaying ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7 ml-1" />
              )}
            </button>

            {/* Next */}
            <button
              onClick={handleNextChapter}
              className="p-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            {/* Chapters */}
            <button
              onClick={() => setShowChapters(!showChapters)}
              className={`p-2 rounded-full transition-colors ${
                showChapters ? 'text-orange-400' : 'text-white/50 hover:text-white/70'
              }`}
            >
              <ListMusic className="w-5 h-5" />
            </button>
          </div>

          {/* Volume controls */}
          <div className="mt-4 flex items-center gap-4">
            {/* Gita volume */}
            <div className="flex-1 flex items-center gap-2">
              <Headphones className="w-4 h-4 text-white/50" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.volume}
                onChange={handleVolumeChange}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-white/10 accent-orange-500"
              />
              <span className="text-xs text-white/40 w-8">
                {Math.round(state.volume * 100)}%
              </span>
            </div>

            {/* Ambient volume */}
            <div className="flex-1 flex items-center gap-2">
              <Music2 className="w-4 h-4 text-white/50" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={state.ambientVolume}
                onChange={handleAmbientVolumeChange}
                className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-white/10 accent-violet-500"
              />
              <span className="text-xs text-white/40 w-8">
                {Math.round(state.ambientVolume * 100)}%
              </span>
            </div>
          </div>
        </div>

        {/* Soundscape selector */}
        {showSoundscapes && (
          <div className="border-t border-white/5">
            <button
              onClick={() => setShowSoundscapeSelector(!showSoundscapeSelector)}
              className="w-full p-4 flex items-center justify-between text-left hover:bg-white/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Music2 className="w-5 h-5 text-white/60" />
                <div>
                  <p className="text-sm font-medium text-white">Ambient Soundscapes</p>
                  <p className="text-xs text-white/50">Layer with soothing sounds</p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-white/40 transition-transform ${showSoundscapeSelector ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showSoundscapeSelector && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                    {GITA_SOUNDSCAPES.map((soundscape) => {
                      const Icon = SOUNDSCAPE_ICONS[soundscape.icon] || Sparkles
                      const isActive = state.soundscapeId === soundscape.id

                      return (
                        <button
                          key={soundscape.id}
                          onClick={() => handleSoundscapeSelect(soundscape.id)}
                          className={`
                            relative p-3 rounded-xl text-left overflow-hidden transition-all
                            ${isActive
                              ? 'ring-2 ring-orange-500/50'
                              : 'hover:bg-white/5'
                            }
                          `}
                        >
                          {/* Background gradient */}
                          <div className={`
                            absolute inset-0 bg-gradient-to-br ${soundscape.gradient}
                            transition-opacity
                            ${isActive ? 'opacity-30' : 'opacity-10'}
                          `} />

                          <div className="relative">
                            <div className="flex items-center gap-2 mb-1">
                              <Icon className="w-4 h-4 text-white/70" />
                              <span className="text-sm font-medium text-white">
                                {soundscape.name}
                              </span>
                            </div>
                            <p className="text-[10px] text-white/50 line-clamp-1">
                              {soundscape.description}
                            </p>
                          </div>

                          {isActive && (
                            <motion.div
                              className="absolute top-2 right-2 w-2 h-2 rounded-full bg-orange-500"
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                            />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Chapter list */}
        {showChapterList && (
          <AnimatePresence>
            {showChapters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-white/5 overflow-hidden"
              >
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    All 18 Chapters
                  </h3>
                  <div className="max-h-64 overflow-y-auto space-y-1 pr-2">
                    {GITA_CHAPTERS.map((chapter) => {
                      const isActive = chapter.number === state.currentChapter

                      return (
                        <button
                          key={chapter.number}
                          onClick={() => handleChapterSelect(chapter.number)}
                          className={`
                            w-full p-3 rounded-xl text-left transition-all
                            ${isActive
                              ? 'bg-orange-500/20 border border-orange-500/30'
                              : 'hover:bg-white/5 border border-transparent'
                            }
                          `}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`
                              w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold
                              ${isActive ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/70'}
                            `}>
                              {chapter.number}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-white truncate">
                                  {chapter.nameSanskrit}
                                </p>
                                {isActive && state.isPlaying && (
                                  <div className="flex gap-0.5">
                                    {[1, 2, 3].map((i) => (
                                      <motion.div
                                        key={i}
                                        className="w-0.5 bg-orange-400 rounded-full"
                                        animate={{ height: [4, 12, 4] }}
                                        transition={{
                                          duration: 0.5,
                                          repeat: Infinity,
                                          delay: i * 0.1
                                        }}
                                      />
                                    ))}
                                  </div>
                                )}
                              </div>
                              <p className="text-xs text-white/50 truncate">
                                {chapter.nameEnglish} - {chapter.verseCount} verses
                              </p>
                            </div>
                            <span className="text-xs text-white/40">
                              {chapter.duration}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}

        {/* Error display */}
        {state.error && (
          <div className="px-4 pb-4">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <p className="text-sm text-red-400">{state.error}</p>
            </div>
          </div>
        )}
      </motion.div>

      {/* Language selector dropdown */}
      <AnimatePresence>
        {showLanguageSelector && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 left-4 z-50 w-64 rounded-xl bg-[#1a1a1f] border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="p-2">
              <p className="px-3 py-2 text-xs font-medium text-white/50 uppercase tracking-wider">
                Select Language
              </p>
              {availableLanguages.map((lang) => {
                const config = LANGUAGE_CONFIG[lang]
                const isActive = lang === state.currentLanguage

                return (
                  <button
                    key={lang}
                    onClick={() => handleLanguageSelect(lang)}
                    className={`
                      w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors
                      ${isActive ? 'bg-orange-500/20 text-white' : 'text-white/70 hover:bg-white/5 hover:text-white'}
                    `}
                  >
                    <span className="text-lg">{config.flag}</span>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium">{config.nativeName}</p>
                      <p className="text-xs text-white/50">{config.name}</p>
                    </div>
                    {isActive && (
                      <div className="w-2 h-2 rounded-full bg-orange-500" />
                    )}
                  </button>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-16 right-4 z-50 w-72 rounded-xl bg-[#1a1a1f] border border-white/10 shadow-2xl overflow-hidden"
          >
            <div className="p-4">
              <h4 className="text-sm font-semibold text-white mb-4">Playback Settings</h4>

              {/* Playback speed */}
              <div className="mb-4">
                <label className="text-xs text-white/50 mb-2 block">Playback Speed</label>
                <div className="flex gap-1">
                  {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`
                        flex-1 py-2 rounded-lg text-xs font-medium transition-colors
                        ${state.playbackSpeed === speed
                          ? 'bg-orange-500 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }
                      `}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Playback mode */}
              <div>
                <label className="text-xs text-white/50 mb-2 block">Playback Mode</label>
                <div className="space-y-1">
                  {[
                    { id: 'continuous', label: 'Continuous', desc: 'Play all chapters' },
                    { id: 'chapter_loop', label: 'Loop Chapter', desc: 'Repeat current chapter' },
                    { id: 'learning', label: 'Learning Mode', desc: 'Pause between verses' }
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => engine.setPlaybackMode(mode.id as any)}
                      className={`
                        w-full p-3 rounded-lg text-left transition-colors
                        ${state.playbackMode === mode.id
                          ? 'bg-orange-500/20 border border-orange-500/30'
                          : 'bg-white/5 hover:bg-white/10 border border-transparent'
                        }
                      `}
                    >
                      <p className="text-sm font-medium text-white">{mode.label}</p>
                      <p className="text-xs text-white/50">{mode.desc}</p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close dropdowns */}
      {(showLanguageSelector || showSettings) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowLanguageSelector(false)
            setShowSettings(false)
          }}
        />
      )}
    </div>
  )
}

export default GitaAudioPlayer
