'use client'

/**
 * KIAAN Vibe - Unified Sacred Audio Experience
 *
 * ॐ श्री कृष्णाय नमः
 *
 * Merges Meditation Music + Bhagavad Gita Audio into one divine experience.
 * AI-powered recommendations based on mood, time, and spiritual journey.
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Music2,
  BookOpen,
  Sparkles,
  Heart,
  Moon,
  Sun,
  Cloud,
  Leaf,
  Waves,
  Wind,
  ChevronDown,
  ChevronUp,
  Settings,
  Shuffle,
  Repeat,
  Clock,
  Brain,
  Zap
} from 'lucide-react'

import { SimpleMusicPlayer } from '@/components/music'
import { GitaAudioPlayer } from '@/components/gita/GitaAudioPlayer'
import { GITA_CHAPTERS, GITA_SOUNDSCAPES, CHAPTER_RECOMMENDATIONS } from '@/lib/constants/gita-audio'

// ============ Types ============

type VibeMode = 'meditation' | 'gita' | 'mixed' | 'auto'
type MoodState = 'peaceful' | 'energetic' | 'healing' | 'focused' | 'sleepy' | 'devotional'
type TimeOfDay = 'brahma_muhurta' | 'morning' | 'afternoon' | 'evening' | 'night'

interface KiaanRecommendation {
  mode: VibeMode
  title: string
  titleHindi: string
  description: string
  gitaChapter?: number
  soundscape?: string
  musicCategory?: string
  duration: string
}

// ============ AI Recommendations Engine ============

function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours()
  if (hour >= 4 && hour < 6) return 'brahma_muhurta'
  if (hour >= 6 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  if (hour >= 17 && hour < 20) return 'evening'
  return 'night'
}

function getKiaanRecommendations(mood: MoodState, timeOfDay: TimeOfDay): KiaanRecommendation[] {
  const recommendations: KiaanRecommendation[] = []

  // Time-based Gita recommendations
  const timeBasedGita: Record<TimeOfDay, { chapter: number; soundscape: string }> = {
    brahma_muhurta: { chapter: 2, soundscape: 'morning_shlokas' },
    morning: { chapter: 6, soundscape: 'gita_deep_learning' },
    afternoon: { chapter: 3, soundscape: 'karma_yoga_focus' },
    evening: { chapter: 9, soundscape: 'gita_dhyana' },
    night: { chapter: 12, soundscape: 'sleep_gita' }
  }

  // Mood-based recommendations
  const moodBasedGita: Record<MoodState, { chapters: number[]; soundscape: string }> = {
    peaceful: { chapters: [12, 2], soundscape: 'gita_dhyana' },
    energetic: { chapters: [3, 11], soundscape: 'karma_yoga_focus' },
    healing: { chapters: [9, 15], soundscape: 'heart_healing_gita' },
    focused: { chapters: [6, 8], soundscape: 'gita_deep_learning' },
    sleepy: { chapters: [12, 18], soundscape: 'sleep_gita' },
    devotional: { chapters: [9, 11, 12], soundscape: 'morning_shlokas' }
  }

  const timeRec = timeBasedGita[timeOfDay]
  const moodRec = moodBasedGita[mood]

  // Primary recommendation based on time
  recommendations.push({
    mode: 'gita',
    title: `${GITA_CHAPTERS[timeRec.chapter - 1].nameEnglish}`,
    titleHindi: GITA_CHAPTERS[timeRec.chapter - 1].nameSanskrit,
    description: `Perfect for ${timeOfDay.replace('_', ' ')} - ${GITA_CHAPTERS[timeRec.chapter - 1].theme}`,
    gitaChapter: timeRec.chapter,
    soundscape: timeRec.soundscape,
    duration: GITA_CHAPTERS[timeRec.chapter - 1].duration
  })

  // Mood-based recommendation
  if (moodRec.chapters[0] !== timeRec.chapter) {
    recommendations.push({
      mode: 'gita',
      title: `${GITA_CHAPTERS[moodRec.chapters[0] - 1].nameEnglish}`,
      titleHindi: GITA_CHAPTERS[moodRec.chapters[0] - 1].nameSanskrit,
      description: `For your ${mood} mood - ${GITA_CHAPTERS[moodRec.chapters[0] - 1].theme}`,
      gitaChapter: moodRec.chapters[0],
      soundscape: moodRec.soundscape,
      duration: GITA_CHAPTERS[moodRec.chapters[0] - 1].duration
    })
  }

  // Mixed mode recommendation
  recommendations.push({
    mode: 'mixed',
    title: 'Sacred Blend',
    titleHindi: 'दिव्य मिश्रण',
    description: 'Meditation music with Gita verses in the background',
    gitaChapter: moodRec.chapters[0],
    soundscape: moodRec.soundscape,
    musicCategory: mood === 'energetic' ? 'morning_ragas' : 'meditation',
    duration: '30-60 min'
  })

  // Pure meditation recommendation
  recommendations.push({
    mode: 'meditation',
    title: 'Pure Meditation',
    titleHindi: 'शुद्ध ध्यान',
    description: 'Natural sounds for deep inner peace',
    musicCategory: timeOfDay === 'night' ? 'sleep' : 'meditation',
    duration: '20-40 min'
  })

  return recommendations
}

// ============ Mood Selector ============

const MOODS: { id: MoodState; label: string; labelHindi: string; icon: React.ReactNode; color: string }[] = [
  { id: 'peaceful', label: 'Peaceful', labelHindi: 'शांत', icon: <Leaf className="w-4 h-4" />, color: 'from-emerald-500/20 to-teal-500/20' },
  { id: 'energetic', label: 'Energetic', labelHindi: 'ऊर्जावान', icon: <Zap className="w-4 h-4" />, color: 'from-orange-500/20 to-amber-500/20' },
  { id: 'healing', label: 'Healing', labelHindi: 'उपचार', icon: <Heart className="w-4 h-4" />, color: 'from-pink-500/20 to-rose-500/20' },
  { id: 'focused', label: 'Focused', labelHindi: 'केंद्रित', icon: <Brain className="w-4 h-4" />, color: 'from-violet-500/20 to-purple-500/20' },
  { id: 'sleepy', label: 'Sleepy', labelHindi: 'निद्रा', icon: <Moon className="w-4 h-4" />, color: 'from-indigo-500/20 to-blue-500/20' },
  { id: 'devotional', label: 'Devotional', labelHindi: 'भक्ति', icon: <Sparkles className="w-4 h-4" />, color: 'from-amber-500/20 to-yellow-500/20' }
]

// ============ Main Component ============

export default function KiaanVibePage() {
  const [activeMode, setActiveMode] = useState<VibeMode>('auto')
  const [selectedMood, setSelectedMood] = useState<MoodState>('peaceful')
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning')
  const [recommendations, setRecommendations] = useState<KiaanRecommendation[]>([])
  const [showGitaPlayer, setShowGitaPlayer] = useState(false)
  const [showMusicPlayer, setShowMusicPlayer] = useState(false)
  const [expandedSection, setExpandedSection] = useState<'recommendations' | 'gita' | 'music' | null>('recommendations')

  // Initialize time and recommendations
  useEffect(() => {
    const tod = getTimeOfDay()
    setTimeOfDay(tod)
    setRecommendations(getKiaanRecommendations(selectedMood, tod))
  }, [selectedMood])

  // Handle recommendation selection
  const handleRecommendationSelect = useCallback((rec: KiaanRecommendation) => {
    setActiveMode(rec.mode)
    if (rec.mode === 'gita' || rec.mode === 'mixed') {
      setShowGitaPlayer(true)
      setExpandedSection('gita')
    }
    if (rec.mode === 'meditation' || rec.mode === 'mixed') {
      setShowMusicPlayer(true)
      if (rec.mode === 'meditation') {
        setExpandedSection('music')
      }
    }
  }, [])

  // Time icon based on time of day
  const TimeIcon = {
    brahma_muhurta: <Sparkles className="w-4 h-4 text-violet-400" />,
    morning: <Sun className="w-4 h-4 text-amber-400" />,
    afternoon: <Sun className="w-4 h-4 text-orange-400" />,
    evening: <Cloud className="w-4 h-4 text-pink-400" />,
    night: <Moon className="w-4 h-4 text-indigo-400" />
  }[timeOfDay]

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#0a0812] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-purple-500/3 rounded-full blur-[200px]" />
      </div>

      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-30 backdrop-blur-xl bg-[#0a0a0d]/80 border-b border-white/5">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Link href="/dashboard" className="p-2 rounded-xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="flex items-center gap-3">
                  {/* KIAAN Vibe Logo */}
                  <motion.div
                    className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500/30 via-purple-500/20 to-orange-500/30 flex items-center justify-center"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(139, 92, 246, 0.2)',
                        '0 0 40px rgba(249, 115, 22, 0.3)',
                        '0 0 20px rgba(139, 92, 246, 0.2)'
                      ]
                    }}
                    transition={{ duration: 4, repeat: Infinity }}
                  >
                    <span className="text-2xl font-bold bg-gradient-to-r from-violet-300 to-orange-300 bg-clip-text text-transparent">ॐ</span>
                  </motion.div>
                  <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-violet-200 via-purple-200 to-orange-200 bg-clip-text text-transparent">
                      KIAAN Vibe
                    </h1>
                    <p className="text-xs text-white/40 font-sanskrit">कियान वाइब - दिव्य ध्वनि</p>
                  </div>
                </div>
              </div>

              {/* Time indicator */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5">
                {TimeIcon}
                <span className="text-xs text-white/60 capitalize">{timeOfDay.replace('_', ' ')}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 py-6">
          {/* Hero Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl sm:text-3xl font-bold mb-3 bg-gradient-to-r from-violet-200 via-purple-100 to-orange-200 bg-clip-text text-transparent">
              Sacred Sound Experience
            </h2>
            <p className="text-white/50 text-sm max-w-md mx-auto">
              AI-powered meditation music & Bhagavad Gita audio unified for your spiritual journey
            </p>
          </motion.section>

          {/* Mood Selector */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6"
          >
            <h3 className="text-sm font-medium text-white/60 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4" />
              How are you feeling?
            </h3>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((mood) => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                    selectedMood === mood.id
                      ? `bg-gradient-to-r ${mood.color} border border-white/20 text-white`
                      : 'bg-white/5 border border-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  {mood.icon}
                  <span className="text-sm">{mood.label}</span>
                </button>
              ))}
            </div>
          </motion.section>

          {/* KIAAN Recommendations */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <button
              onClick={() => setExpandedSection(expandedSection === 'recommendations' ? null : 'recommendations')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-orange-500/10 border border-violet-500/20 mb-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-500/20">
                  <Brain className="w-5 h-5 text-violet-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-semibold text-white">KIAAN Recommends</h3>
                  <p className="text-xs text-white/50">AI-powered suggestions for you</p>
                </div>
              </div>
              {expandedSection === 'recommendations' ? (
                <ChevronUp className="w-5 h-5 text-white/40" />
              ) : (
                <ChevronDown className="w-5 h-5 text-white/40" />
              )}
            </button>

            <AnimatePresence>
              {expandedSection === 'recommendations' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 overflow-hidden"
                >
                  {recommendations.map((rec, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleRecommendationSelect(rec)}
                      className="w-full p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all text-left group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                              rec.mode === 'gita' ? 'bg-orange-500/20 text-orange-300' :
                              rec.mode === 'meditation' ? 'bg-violet-500/20 text-violet-300' :
                              'bg-purple-500/20 text-purple-300'
                            }`}>
                              {rec.mode === 'gita' ? 'Gita' : rec.mode === 'meditation' ? 'Music' : 'Blend'}
                            </span>
                            <span className="text-xs text-white/40">{rec.duration}</span>
                          </div>
                          <h4 className="text-sm font-medium text-white group-hover:text-violet-200 transition-colors">
                            {rec.title}
                          </h4>
                          <p className="text-xs text-amber-200/60 font-sanskrit">{rec.titleHindi}</p>
                          <p className="text-xs text-white/40 mt-1">{rec.description}</p>
                        </div>
                        <Play className="w-8 h-8 p-2 rounded-full bg-white/10 text-white/60 group-hover:bg-violet-500/30 group-hover:text-violet-200 transition-all" />
                      </div>
                    </motion.button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Bhagavad Gita Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-6"
          >
            <button
              onClick={() => setExpandedSection(expandedSection === 'gita' ? null : 'gita')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-rose-500/10 border border-orange-500/20 mb-3"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 rounded-xl bg-orange-500/20"
                  animate={{
                    boxShadow: [
                      '0 0 10px rgba(249, 115, 22, 0.2)',
                      '0 0 20px rgba(249, 115, 22, 0.4)',
                      '0 0 10px rgba(249, 115, 22, 0.2)'
                    ]
                  }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <span className="text-xl">ॐ</span>
                </motion.div>
                <div className="text-left">
                  <h3 className="text-base font-semibold text-white">Bhagavad Gita Audio</h3>
                  <p className="text-xs text-amber-200/60 font-sanskrit">श्रीमद्भगवद्गीता</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 text-[10px] font-medium">
                  18 Chapters
                </span>
                {expandedSection === 'gita' ? (
                  <ChevronUp className="w-5 h-5 text-white/40" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/40" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {expandedSection === 'gita' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <GitaAudioPlayer />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Meditation Music Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-6"
          >
            <button
              onClick={() => setExpandedSection(expandedSection === 'music' ? null : 'music')}
              className="w-full flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-violet-500/10 via-purple-500/10 to-indigo-500/10 border border-violet-500/20 mb-3"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-500/20">
                  <Music2 className="w-5 h-5 text-violet-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-semibold text-white">Meditation Music</h3>
                  <p className="text-xs text-violet-200/60 font-sanskrit">ध्यान संगीत</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-medium">
                  Ultra HD
                </span>
                {expandedSection === 'music' ? (
                  <ChevronUp className="w-5 h-5 text-white/40" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/40" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {expandedSection === 'music' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <SimpleMusicPlayer />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.section>

          {/* Quick Stats */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="grid grid-cols-4 gap-3 mb-6"
          >
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
              <BookOpen className="w-5 h-5 mx-auto mb-1 text-orange-400" />
              <p className="text-lg font-bold text-white">18</p>
              <p className="text-[10px] text-white/40">Chapters</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
              <Sparkles className="w-5 h-5 mx-auto mb-1 text-amber-400" />
              <p className="text-lg font-bold text-white">700</p>
              <p className="text-[10px] text-white/40">Verses</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
              <Music2 className="w-5 h-5 mx-auto mb-1 text-violet-400" />
              <p className="text-lg font-bold text-white">6+</p>
              <p className="text-[10px] text-white/40">Languages</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
              <Waves className="w-5 h-5 mx-auto mb-1 text-blue-400" />
              <p className="text-lg font-bold text-white">8</p>
              <p className="text-[10px] text-white/40">Soundscapes</p>
            </div>
          </motion.section>

          {/* Tips */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="rounded-2xl bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-orange-500/5 border border-white/5 p-5">
              <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                KIAAN Tips
              </h3>
              <ul className="text-xs text-white/50 space-y-2">
                <li className="flex items-start gap-2">
                  <Sun className="w-3 h-3 mt-0.5 text-amber-400" />
                  <span><strong className="text-amber-300">Morning:</strong> Start with Chapter 2 for clarity and wisdom</span>
                </li>
                <li className="flex items-start gap-2">
                  <Brain className="w-3 h-3 mt-0.5 text-violet-400" />
                  <span><strong className="text-violet-300">Focus:</strong> Chapter 6 with ambient sounds for deep meditation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Moon className="w-3 h-3 mt-0.5 text-indigo-400" />
                  <span><strong className="text-indigo-300">Night:</strong> Chapter 12 with ocean waves for peaceful sleep</span>
                </li>
                <li className="flex items-start gap-2">
                  <Heart className="w-3 h-3 mt-0.5 text-pink-400" />
                  <span><strong className="text-pink-300">Healing:</strong> Mix meditation music with Gita for deeper peace</span>
                </li>
              </ul>
            </div>
          </motion.section>

          {/* Bottom spacing */}
          <div className="h-24" />
        </div>
      </div>
    </main>
  )
}
