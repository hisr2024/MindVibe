'use client'

/**
 * Gita Audio Page
 *
 * ॐ श्रीमद्भगवद्गीता
 *
 * Main page for Bhagavad Gita audio with ambient sounds:
 * - Multi-language audio player
 * - Chapter selection with beautiful cards
 * - Soundscape presets
 * - Learning mode
 * - Popular verses quick access
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen,
  Headphones,
  GraduationCap,
  Sparkles,
  Music2,
  Globe,
  Clock,
  TrendingUp,
  Heart,
  Star,
  ChevronRight,
  Volume2
} from 'lucide-react'
import { GitaAudioPlayer } from '@/components/gita/GitaAudioPlayer'
import { GitaChapterCard } from '@/components/gita/GitaChapterCard'
import { GitaSoundscapeCard } from '@/components/gita/GitaSoundscapeCard'
import { GitaLearningMode } from '@/components/gita/GitaLearningMode'
import {
  GITA_CHAPTERS,
  GITA_SOUNDSCAPES,
  POPULAR_GITA_VERSES,
  type GitaLanguage
} from '@/lib/constants/gita-audio'

type ViewMode = 'player' | 'chapters' | 'soundscapes' | 'learning' | 'popular'

export default function GitaAudioPage() {
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('player')
  const [selectedChapter, setSelectedChapter] = useState(2) // Start with Sankhya Yoga
  const [selectedLanguage, setSelectedLanguage] = useState<GitaLanguage>('sanskrit')
  const [selectedSoundscape, setSelectedSoundscape] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

  // Handlers
  const handleChapterSelect = useCallback((chapter: number) => {
    setSelectedChapter(chapter)
    setViewMode('player')
  }, [])

  const handleSoundscapeSelect = useCallback((soundscapeId: string) => {
    setSelectedSoundscape(soundscapeId)
    setViewMode('player')
  }, [])

  const handleStartLearning = useCallback((chapter: number) => {
    setSelectedChapter(chapter)
    setViewMode('learning')
  }, [])

  // Tab buttons
  const tabs = [
    { id: 'player', label: 'Player', icon: Headphones },
    { id: 'chapters', label: 'Chapters', icon: BookOpen },
    { id: 'soundscapes', label: 'Soundscapes', icon: Music2 },
    { id: 'learning', label: 'Learn', icon: GraduationCap },
    { id: 'popular', label: 'Popular', icon: Star }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0d] via-[#0d0d12] to-[#0a0a0d]">
      {/* Hero Header */}
      <div className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-b from-orange-500/20 to-transparent blur-3xl" />

        {/* Content */}
        <div className="relative max-w-4xl mx-auto px-4 pt-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            {/* Om symbol */}
            <motion.div
              className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-orange-500/30 to-amber-500/30 flex items-center justify-center"
              animate={{
                boxShadow: [
                  '0 0 20px rgba(249, 115, 22, 0.3)',
                  '0 0 40px rgba(249, 115, 22, 0.5)',
                  '0 0 20px rgba(249, 115, 22, 0.3)'
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <span className="text-4xl text-orange-400">ॐ</span>
            </motion.div>

            <h1 className="text-3xl font-bold text-white mb-2">
              Bhagavad Gita Audio
            </h1>
            <p className="text-lg text-amber-200/80 font-sanskrit">
              श्रीमद्भगवद्गीता
            </p>
            <p className="text-sm text-white/50 mt-2 max-w-md mx-auto">
              Listen to the divine wisdom with soothing ambient sounds for deeper understanding
            </p>
          </motion.div>

          {/* Quick stats */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {[
              { icon: BookOpen, value: '18', label: 'Chapters' },
              { icon: Star, value: '700', label: 'Verses' },
              { icon: Globe, value: '6+', label: 'Languages' },
              { icon: Music2, value: '8', label: 'Soundscapes' }
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-3 rounded-xl bg-white/5 text-center border border-white/5"
              >
                <stat.icon className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-white">{stat.value}</p>
                <p className="text-[10px] text-white/40">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Tab navigation */}
          <div className="flex gap-1 p-1 rounded-xl bg-white/5 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = viewMode === tab.id

              return (
                <button
                  key={tab.id}
                  onClick={() => setViewMode(tab.id as ViewMode)}
                  className={`
                    flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg
                    text-sm font-medium transition-all whitespace-nowrap
                    ${isActive
                      ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                      : 'text-white/60 hover:text-white/80 hover:bg-white/5'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 pb-20">
        <AnimatePresence mode="wait">
          {/* Player View */}
          {viewMode === 'player' && (
            <motion.div
              key="player"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GitaAudioPlayer
                defaultChapter={selectedChapter}
                defaultLanguage={selectedLanguage}
                defaultSoundscape={selectedSoundscape || undefined}
                showChapterList={true}
                showSoundscapes={true}
                showLearningMode={true}
                onChapterChange={setSelectedChapter}
                onLanguageChange={setSelectedLanguage}
              />

              {/* Quick actions */}
              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setViewMode('learning')}
                  className="p-4 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-500/20 text-left group hover:border-violet-500/40 transition-colors"
                >
                  <GraduationCap className="w-6 h-6 text-violet-400 mb-2" />
                  <h3 className="font-medium text-white mb-1">Learning Mode</h3>
                  <p className="text-xs text-white/50">Verse-by-verse with meaning</p>
                </button>

                <button
                  onClick={() => setViewMode('soundscapes')}
                  className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/20 text-left group hover:border-emerald-500/40 transition-colors"
                >
                  <Music2 className="w-6 h-6 text-emerald-400 mb-2" />
                  <h3 className="font-medium text-white mb-1">Soundscapes</h3>
                  <p className="text-xs text-white/50">Ambient sounds for immersion</p>
                </button>
              </div>
            </motion.div>
          )}

          {/* Chapters View */}
          {viewMode === 'chapters' && (
            <motion.div
              key="chapters"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">All 18 Chapters</h2>
                <p className="text-sm text-white/50">
                  Each chapter reveals a different yoga path to liberation
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GITA_CHAPTERS.map((chapter) => (
                  <GitaChapterCard
                    key={chapter.number}
                    chapter={chapter}
                    isActive={chapter.number === selectedChapter}
                    isPlaying={isPlaying && chapter.number === selectedChapter}
                    onSelect={() => handleChapterSelect(chapter.number)}
                    variant="default"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Soundscapes View */}
          {viewMode === 'soundscapes' && (
            <motion.div
              key="soundscapes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Ambient Soundscapes</h2>
                <p className="text-sm text-white/50">
                  Layer divine recitation with soothing sounds for deeper immersion
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GITA_SOUNDSCAPES.map((soundscape) => (
                  <GitaSoundscapeCard
                    key={soundscape.id}
                    soundscape={soundscape}
                    isActive={selectedSoundscape === soundscape.id}
                    isPlaying={isPlaying && selectedSoundscape === soundscape.id}
                    onSelect={() => handleSoundscapeSelect(soundscape.id)}
                    variant="featured"
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Learning View */}
          {viewMode === 'learning' && (
            <motion.div
              key="learning"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <GitaLearningMode
                chapter={selectedChapter}
                onComplete={(chapter) => {
                  console.log(`Completed chapter ${chapter}`)
                }}
                onProgress={(progress) => {
                  console.log(`Progress: ${progress}%`)
                }}
              />
            </motion.div>
          )}

          {/* Popular Verses View */}
          {viewMode === 'popular' && (
            <motion.div
              key="popular"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold text-white mb-2">Popular Verses</h2>
                <p className="text-sm text-white/50">
                  The most profound and frequently quoted verses
                </p>
              </div>

              <div className="space-y-3">
                {POPULAR_GITA_VERSES.map((verse, idx) => (
                  <motion.button
                    key={`${verse.chapter}-${verse.verse}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => {
                      setSelectedChapter(verse.chapter)
                      setViewMode('player')
                    }}
                    className="w-full p-4 rounded-xl bg-white/5 border border-white/10 text-left hover:bg-white/10 hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-400">
                          {verse.chapter}.{verse.verse}
                        </span>
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-white mb-0.5 truncate">
                          {verse.title}
                        </h3>
                        <p className="text-sm text-amber-200/70 font-sanskrit truncate">
                          {verse.titleHindi}
                        </p>
                      </div>

                      <ChevronRight className="w-5 h-5 text-white/30 group-hover:text-white/60 transition-colors" />
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom safe area for mobile */}
      <div className="h-20" />
    </div>
  )
}
