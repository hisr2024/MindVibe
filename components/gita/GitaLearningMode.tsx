'use client'

/**
 * Gita Learning Mode Component
 *
 * Comprehensive learning interface for Bhagavad Gita:
 * - Verse-by-verse progression
 * - Audio playback with meaning
 * - Repeat and pause controls
 * - Progress tracking
 * - Quiz mode (optional)
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Volume2,
  BookOpen,
  GraduationCap,
  Target,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Settings2,
  Clock
} from 'lucide-react'
import { GitaVerseDisplay, type GitaVerse } from './GitaVerseDisplay'
import {
  type GitaChapter,
  type GitaLearningSettings,
  GITA_CHAPTERS,
  DEFAULT_LEARNING_SETTINGS
} from '@/lib/constants/gita-audio'

export interface GitaLearningModeProps {
  chapter: number
  initialVerse?: number
  onComplete?: (chapter: number) => void
  onProgress?: (progress: number) => void
  className?: string
}

// Sample verse data (in production, this would come from API/database)
const SAMPLE_VERSE: GitaVerse = {
  chapter: 2,
  verse: 47,
  sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन ।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि ॥',
  transliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana\nmā karma-phala-hetur bhūr mā te saṅgo \'stv akarmaṇi',
  wordMeaning: 'karmaṇi—in prescribed duties; eva—certainly; adhikāraḥ—right; te—of you; mā—not; phaleṣu—in the fruits; kadācana—at any time; mā—never; karma-phala—in the result of the work; hetuḥ—cause; bhūḥ—become; mā—never; te—of you; saṅgaḥ—attachment; astu—be there; akarmaṇi—in not doing prescribed duties',
  translation: 'You have a right to perform your prescribed duties, but you are not entitled to the fruits of your actions. Never consider yourself to be the cause of the results of your activities, nor be attached to inaction.',
  commentary: 'This is one of the most important verses of the Bhagavad Gita, encapsulating the essence of Karma Yoga. Lord Krishna advises Arjuna to focus solely on action without attachment to results. This teaching liberates one from the bondage of karma.'
}

export function GitaLearningMode({
  chapter,
  initialVerse = 1,
  onComplete,
  onProgress,
  className = ''
}: GitaLearningModeProps) {
  // State
  const [currentVerse, setCurrentVerse] = useState(initialVerse)
  const [isPlaying, setIsPlaying] = useState(false)
  const [settings, setSettings] = useState<GitaLearningSettings>(DEFAULT_LEARNING_SETTINGS)
  const [showSettings, setShowSettings] = useState(false)
  const [repeatCount, setRepeatCount] = useState(0)
  const [completedVerses, setCompletedVerses] = useState<Set<number>>(new Set())
  const [streak, setStreak] = useState(0)

  // Chapter info
  const chapterInfo = GITA_CHAPTERS.find(c => c.number === chapter)
  const totalVerses = chapterInfo?.verseCount || 18
  const progress = (completedVerses.size / totalVerses) * 100

  // Current verse data (in production, fetch from API)
  const verseData: GitaVerse = {
    ...SAMPLE_VERSE,
    chapter,
    verse: currentVerse
  }

  // Report progress
  useEffect(() => {
    onProgress?.(progress)
  }, [progress, onProgress])

  // Navigation handlers
  const goToNextVerse = useCallback(() => {
    if (currentVerse < totalVerses) {
      setCompletedVerses(prev => new Set([...prev, currentVerse]))
      setCurrentVerse(prev => prev + 1)
      setRepeatCount(0)

      if (currentVerse === totalVerses - 1) {
        onComplete?.(chapter)
      }
    }
  }, [currentVerse, totalVerses, chapter, onComplete])

  const goToPrevVerse = useCallback(() => {
    if (currentVerse > 1) {
      setCurrentVerse(prev => prev - 1)
      setRepeatCount(0)
    }
  }, [currentVerse])

  const repeatVerse = useCallback(() => {
    setRepeatCount(prev => prev + 1)
    // Restart audio here
  }, [])

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev)
  }, [])

  // Update settings
  const updateSettings = useCallback((key: keyof GitaLearningSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  return (
    <div className={`relative ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Learning Mode</h2>
              <p className="text-sm text-white/50">
                Chapter {chapter}: {chapterInfo?.nameEnglish}
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-2 rounded-lg bg-white/5 text-white/60 hover:text-white transition-colors"
          >
            <Settings2 className="w-5 h-5" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-white/50">
              Verse {currentVerse} of {totalVerses}
            </span>
            <span className="text-white/50">
              {completedVerses.size} completed
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-white/5 text-center">
            <Target className="w-5 h-5 text-violet-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{Math.round(progress)}%</p>
            <p className="text-xs text-white/50">Progress</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 text-center">
            <RotateCcw className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{repeatCount}</p>
            <p className="text-xs text-white/50">Repeats</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 text-center">
            <Trophy className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-lg font-bold text-white">{streak}</p>
            <p className="text-xs text-white/50">Streak</p>
          </div>
        </div>
      </div>

      {/* Verse Display */}
      <GitaVerseDisplay
        verse={verseData}
        showTransliteration={settings.showTransliteration}
        showWordMeaning={settings.showMeaning}
        showCommentary={settings.showCommentary}
        isPlaying={isPlaying}
        className="mb-6"
      />

      {/* Controls */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
        {/* Main controls */}
        <div className="flex items-center justify-center gap-4 mb-4">
          {/* Repeat */}
          <button
            onClick={repeatVerse}
            className="p-2 rounded-full text-white/50 hover:text-white/70 transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Previous */}
          <button
            onClick={goToPrevVerse}
            disabled={currentVerse <= 1}
            className="p-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={togglePlayPause}
            className={`
              p-5 rounded-full transition-all
              ${isPlaying
                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
              }
            `}
          >
            {isPlaying ? (
              <Pause className="w-7 h-7" />
            ) : (
              <Play className="w-7 h-7 ml-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={goToNextVerse}
            disabled={currentVerse >= totalVerses}
            className="p-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors disabled:opacity-30"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Volume */}
          <button
            className="p-2 rounded-full text-white/50 hover:text-white/70 transition-colors"
          >
            <Volume2 className="w-5 h-5" />
          </button>
        </div>

        {/* Verse navigation dots */}
        <div className="flex items-center justify-center gap-1 flex-wrap max-w-md mx-auto">
          {Array.from({ length: Math.min(totalVerses, 20) }, (_, i) => i + 1).map((verse) => (
            <button
              key={verse}
              onClick={() => setCurrentVerse(verse)}
              className={`
                w-2 h-2 rounded-full transition-all
                ${verse === currentVerse
                  ? 'bg-violet-500 w-4'
                  : completedVerses.has(verse)
                    ? 'bg-emerald-500'
                    : 'bg-white/20 hover:bg-white/30'
                }
              `}
            />
          ))}
          {totalVerses > 20 && (
            <span className="text-xs text-white/40 ml-1">+{totalVerses - 20} more</span>
          )}
        </div>
      </div>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10"
          >
            <h4 className="text-sm font-semibold text-white mb-4">Learning Settings</h4>

            <div className="space-y-4">
              {/* Display options */}
              <div className="space-y-3">
                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Show Transliteration</span>
                  <button
                    onClick={() => updateSettings('showTransliteration', !settings.showTransliteration)}
                    className={`
                      w-10 h-6 rounded-full transition-colors
                      ${settings.showTransliteration ? 'bg-violet-500' : 'bg-white/20'}
                    `}
                  >
                    <motion.div
                      className="w-4 h-4 rounded-full bg-white shadow"
                      animate={{ x: settings.showTransliteration ? 20 : 4 }}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Show Word Meaning</span>
                  <button
                    onClick={() => updateSettings('showMeaning', !settings.showMeaning)}
                    className={`
                      w-10 h-6 rounded-full transition-colors
                      ${settings.showMeaning ? 'bg-violet-500' : 'bg-white/20'}
                    `}
                  >
                    <motion.div
                      className="w-4 h-4 rounded-full bg-white shadow"
                      animate={{ x: settings.showMeaning ? 20 : 4 }}
                    />
                  </button>
                </label>

                <label className="flex items-center justify-between">
                  <span className="text-sm text-white/70">Show Commentary</span>
                  <button
                    onClick={() => updateSettings('showCommentary', !settings.showCommentary)}
                    className={`
                      w-10 h-6 rounded-full transition-colors
                      ${settings.showCommentary ? 'bg-violet-500' : 'bg-white/20'}
                    `}
                  >
                    <motion.div
                      className="w-4 h-4 rounded-full bg-white shadow"
                      animate={{ x: settings.showCommentary ? 20 : 4 }}
                    />
                  </button>
                </label>
              </div>

              {/* Playback speed */}
              <div>
                <label className="text-sm text-white/70 mb-2 block">Playback Speed</label>
                <div className="flex gap-1">
                  {[0.5, 0.75, 1.0, 1.25, 1.5].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => updateSettings('playbackSpeed', speed)}
                      className={`
                        flex-1 py-2 rounded-lg text-xs font-medium transition-colors
                        ${settings.playbackSpeed === speed
                          ? 'bg-violet-500 text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                        }
                      `}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Pause duration */}
              <div>
                <label className="text-sm text-white/70 mb-2 block">
                  Pause Between Verses: {settings.pauseDuration}s
                </label>
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={settings.pauseDuration}
                  onChange={(e) => updateSettings('pauseDuration', parseInt(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-violet-500"
                />
              </div>

              {/* Auto advance */}
              <label className="flex items-center justify-between">
                <span className="text-sm text-white/70">Auto-advance to Next Verse</span>
                <button
                  onClick={() => updateSettings('autoAdvance', !settings.autoAdvance)}
                  className={`
                    w-10 h-6 rounded-full transition-colors
                    ${settings.autoAdvance ? 'bg-violet-500' : 'bg-white/20'}
                  `}
                >
                  <motion.div
                    className="w-4 h-4 rounded-full bg-white shadow"
                    animate={{ x: settings.autoAdvance ? 20 : 4 }}
                  />
                </button>
              </label>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default GitaLearningMode
