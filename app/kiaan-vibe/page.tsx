'use client'

/**
 * KIAAN Vibe - Unified Sacred Audio Experience
 *
 * ॐ श्री कृष्णाय नमः
 *
 * The ultimate spiritual audio player combining:
 * - Bhagavad Gita chapters with translation/language selection
 * - AI-generated meditation music (Web Audio synthesis)
 * - User uploaded audio files
 *
 * Built with love and devotion by KIAAN - the best software developer,
 * coding specialist, and AI engineer.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
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
  ChevronDown,
  ChevronUp,
  Upload,
  Trash2,
  List,
  Languages,
  Headphones,
  Waves,
  Brain,
  Zap,
  Leaf,
  Clock
} from 'lucide-react'

import { GITA_CHAPTERS } from '@/lib/constants/gita-audio'
import musicEngine, { type MusicTrack, type PlayerState, PRESET_TRACKS } from '@/utils/audio/SimpleMusicEngine'

// ============ Types ============

type AudioSource = 'gita' | 'music' | 'upload'
type MoodState = 'peaceful' | 'energetic' | 'healing' | 'focused' | 'sleepy' | 'devotional'
type GitaLanguage = 'sanskrit' | 'english' | 'hindi'

interface GitaChapterInfo {
  number: number
  nameSanskrit: string
  nameEnglish: string
  verseCount: number
  duration: string
  theme: string
  color: string
}

// ============ Gita Audio URLs (Verified Working) ============

const GITA_AUDIO_URLS: Record<GitaLanguage, Record<number, string>> = {
  english: {
    // LibriVox - Sir Edwin Arnold translation (Public Domain)
    1: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_01_arnold_64kb.mp3',
    2: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_02_arnold_64kb.mp3',
    3: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_03_arnold_64kb.mp3',
    4: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_04_arnold_64kb.mp3',
    5: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_05_arnold_64kb.mp3',
    6: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_06_arnold_64kb.mp3',
    7: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_07_arnold_64kb.mp3',
    8: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_08_arnold_64kb.mp3',
    9: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_09_arnold_64kb.mp3',
    10: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_10_arnold_64kb.mp3',
    11: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_11_arnold_64kb.mp3',
    12: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_12_arnold_64kb.mp3',
    13: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_13_arnold_64kb.mp3',
    14: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_14_arnold_64kb.mp3',
    15: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_15_arnold_64kb.mp3',
    16: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_16_arnold_64kb.mp3',
    17: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_17_arnold_64kb.mp3',
    18: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_18_arnold_64kb.mp3',
  },
  sanskrit: {
    // Will use proxy for Sanskrit sources
    1: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter01.mp3'),
    2: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter02.mp3'),
    3: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter03.mp3'),
    4: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter04.mp3'),
    5: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter05.mp3'),
    6: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter06.mp3'),
    7: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter07.mp3'),
    8: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter08.mp3'),
    9: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter09.mp3'),
    10: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter10.mp3'),
    11: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter11.mp3'),
    12: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter12.mp3'),
    13: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter13.mp3'),
    14: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter14.mp3'),
    15: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter15.mp3'),
    16: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter16.mp3'),
    17: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter17.mp3'),
    18: '/api/audio/proxy?url=' + encodeURIComponent('https://ia800207.us.archive.org/25/items/BhagavadGitaChanting/Chapter18.mp3'),
  },
  hindi: {
    // Fallback to English for now
    1: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_01_arnold_64kb.mp3',
    2: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_02_arnold_64kb.mp3',
    3: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_03_arnold_64kb.mp3',
    4: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_04_arnold_64kb.mp3',
    5: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_05_arnold_64kb.mp3',
    6: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_06_arnold_64kb.mp3',
    7: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_07_arnold_64kb.mp3',
    8: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_08_arnold_64kb.mp3',
    9: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_09_arnold_64kb.mp3',
    10: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_10_arnold_64kb.mp3',
    11: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_11_arnold_64kb.mp3',
    12: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_12_arnold_64kb.mp3',
    13: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_13_arnold_64kb.mp3',
    14: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_14_arnold_64kb.mp3',
    15: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_15_arnold_64kb.mp3',
    16: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_16_arnold_64kb.mp3',
    17: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_17_arnold_64kb.mp3',
    18: 'https://ia801406.us.archive.org/10/items/bhagavad_gita_0803_librivox/bhagavadgita_18_arnold_64kb.mp3',
  }
}

// ============ Language Config ============

const LANGUAGE_CONFIG: Record<GitaLanguage, { name: string; nativeName: string; flag: string }> = {
  sanskrit: { name: 'Sanskrit', nativeName: 'संस्कृत', flag: '🕉️' },
  english: { name: 'English', nativeName: 'English', flag: '📖' },
  hindi: { name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳' },
}

// ============ Mood Config ============

const MOODS: { id: MoodState; label: string; icon: React.ReactNode; color: string }[] = [
  { id: 'peaceful', label: 'Peaceful', icon: <Leaf className="w-4 h-4" />, color: 'from-emerald-500/20 to-teal-500/20' },
  { id: 'energetic', label: 'Energetic', icon: <Zap className="w-4 h-4" />, color: 'from-orange-500/20 to-amber-500/20' },
  { id: 'healing', label: 'Healing', icon: <Heart className="w-4 h-4" />, color: 'from-pink-500/20 to-rose-500/20' },
  { id: 'focused', label: 'Focused', icon: <Brain className="w-4 h-4" />, color: 'from-violet-500/20 to-purple-500/20' },
  { id: 'sleepy', label: 'Sleepy', icon: <Moon className="w-4 h-4" />, color: 'from-indigo-500/20 to-blue-500/20' },
  { id: 'devotional', label: 'Devotional', icon: <Sparkles className="w-4 h-4" />, color: 'from-amber-500/20 to-yellow-500/20' }
]

// ============ Helper Functions ============

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds)) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function getProxyUrl(url: string): string {
  if (url.startsWith('/api/')) return url
  return `/api/audio/proxy?url=${encodeURIComponent(url)}`
}

// ============ Main Component ============

export default function KiaanVibePage() {
  // Audio refs
  const gitaAudioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Audio state
  const [activeSource, setActiveSource] = useState<AudioSource>('music')
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Gita state
  const [gitaLanguage, setGitaLanguage] = useState<GitaLanguage>('english')
  const [gitaChapter, setGitaChapter] = useState(1)
  const [gitaCurrentTime, setGitaCurrentTime] = useState(0)
  const [gitaDuration, setGitaDuration] = useState(0)
  const [gitaVolume, setGitaVolume] = useState(0.7)
  const [showChapterList, setShowChapterList] = useState(false)
  const [showLanguageSelector, setShowLanguageSelector] = useState(false)

  // Music state
  const [musicState, setMusicState] = useState<PlayerState>({
    isPlaying: false,
    currentTrack: null,
    currentTime: 0,
    duration: 0,
    volume: 0.7,
    queue: [],
    queueIndex: 0
  })

  // Upload state
  const [uploadedTracks, setUploadedTracks] = useState<MusicTrack[]>([])

  // UI state
  const [selectedMood, setSelectedMood] = useState<MoodState>('peaceful')
  const [expandedSection, setExpandedSection] = useState<'gita' | 'music' | 'upload' | null>('music')
  const [isMuted, setIsMuted] = useState(false)

  // ============ Initialize Audio ============

  useEffect(() => {
    // Create Gita audio element
    gitaAudioRef.current = new Audio()
    gitaAudioRef.current.preload = 'metadata'

    // Setup event listeners
    const audio = gitaAudioRef.current

    audio.addEventListener('loadstart', () => setIsLoading(true))
    audio.addEventListener('canplay', () => setIsLoading(false))
    audio.addEventListener('playing', () => {
      setIsPlaying(true)
      setIsLoading(false)
      setError(null)
    })
    audio.addEventListener('pause', () => setIsPlaying(false))
    audio.addEventListener('ended', () => handleGitaNextChapter())
    audio.addEventListener('timeupdate', () => {
      setGitaCurrentTime(audio.currentTime)
    })
    audio.addEventListener('loadedmetadata', () => {
      setGitaDuration(audio.duration)
    })
    audio.addEventListener('error', (e) => {
      console.error('Gita audio error:', e)
      setError('Failed to load audio. Trying alternate source...')
      setIsLoading(false)
      // Try fallback to English
      if (gitaLanguage !== 'english') {
        setGitaLanguage('english')
      }
    })

    // Subscribe to music engine state
    musicEngine.setOnStateChange(setMusicState)

    // Load uploaded tracks
    const savedTracks = musicEngine.getUserTracks()
    setUploadedTracks(savedTracks)

    return () => {
      if (gitaAudioRef.current) {
        gitaAudioRef.current.pause()
        gitaAudioRef.current.src = ''
      }
    }
  }, [])

  // ============ Gita Audio Handlers ============

  const playGitaChapter = useCallback(async (chapter: number, language: GitaLanguage) => {
    if (!gitaAudioRef.current) return

    // Stop music if playing
    musicEngine.pause()

    setActiveSource('gita')
    setGitaChapter(chapter)
    setIsLoading(true)
    setError(null)

    const audioUrl = GITA_AUDIO_URLS[language]?.[chapter]
    if (!audioUrl) {
      setError(`No audio available for Chapter ${chapter} in ${language}`)
      setIsLoading(false)
      return
    }

    try {
      // Use proxy for all external URLs to bypass CORS
      const finalUrl = getProxyUrl(audioUrl)
      gitaAudioRef.current.src = finalUrl
      gitaAudioRef.current.volume = gitaVolume
      await gitaAudioRef.current.load()
      await gitaAudioRef.current.play()
    } catch (err: any) {
      console.error('Gita playback error:', err)
      if (err.name === 'NotAllowedError') {
        setError('Tap the play button to start audio')
      } else {
        setError('Failed to play. Please try again.')
      }
      setIsLoading(false)
    }
  }, [gitaVolume])

  const handleGitaPlayPause = useCallback(async () => {
    if (!gitaAudioRef.current) return

    if (activeSource !== 'gita' || !gitaAudioRef.current.src) {
      await playGitaChapter(gitaChapter, gitaLanguage)
    } else if (isPlaying) {
      gitaAudioRef.current.pause()
    } else {
      try {
        await gitaAudioRef.current.play()
      } catch (err) {
        console.error('Resume error:', err)
        setError('Failed to resume playback')
      }
    }
  }, [activeSource, isPlaying, gitaChapter, gitaLanguage, playGitaChapter])

  const handleGitaNextChapter = useCallback(() => {
    const nextChapter = gitaChapter >= 18 ? 1 : gitaChapter + 1
    playGitaChapter(nextChapter, gitaLanguage)
  }, [gitaChapter, gitaLanguage, playGitaChapter])

  const handleGitaPrevChapter = useCallback(() => {
    if (gitaCurrentTime > 3) {
      if (gitaAudioRef.current) {
        gitaAudioRef.current.currentTime = 0
      }
      return
    }
    const prevChapter = gitaChapter <= 1 ? 18 : gitaChapter - 1
    playGitaChapter(prevChapter, gitaLanguage)
  }, [gitaChapter, gitaCurrentTime, gitaLanguage, playGitaChapter])

  const handleGitaSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!gitaAudioRef.current || !gitaDuration) return
    const percent = parseFloat(e.target.value)
    gitaAudioRef.current.currentTime = (percent / 100) * gitaDuration
  }, [gitaDuration])

  const handleGitaVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value)
    setGitaVolume(vol)
    if (gitaAudioRef.current) {
      gitaAudioRef.current.volume = vol
    }
  }, [])

  const handleLanguageChange = useCallback((language: GitaLanguage) => {
    setGitaLanguage(language)
    setShowLanguageSelector(false)
    if (activeSource === 'gita' && isPlaying) {
      playGitaChapter(gitaChapter, language)
    }
  }, [activeSource, isPlaying, gitaChapter, playGitaChapter])

  // ============ Music Handlers ============

  const handleMusicPlay = useCallback((track: MusicTrack) => {
    // Stop Gita if playing
    if (gitaAudioRef.current) {
      gitaAudioRef.current.pause()
    }
    setActiveSource('music')
    const allTracks = musicEngine.getAllTracks()
    const index = allTracks.findIndex(t => t.id === track.id)
    musicEngine.setQueue(allTracks, index >= 0 ? index : 0)
  }, [])

  const handleMusicToggle = useCallback(() => {
    if (activeSource !== 'music') {
      // Switch to music
      if (gitaAudioRef.current) {
        gitaAudioRef.current.pause()
      }
      setActiveSource('music')
      if (musicState.currentTrack) {
        musicEngine.play()
      }
    } else {
      musicEngine.toggle()
    }
  }, [activeSource, musicState.currentTrack])

  // ============ Upload Handlers ============

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      const track = await musicEngine.addUserTrack(file)
      if (track) {
        setUploadedTracks(prev => [...prev, track])
      }
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [])

  const handleDeleteTrack = useCallback((trackId: string) => {
    musicEngine.removeUserTrack(trackId)
    setUploadedTracks(prev => prev.filter(t => t.id !== trackId))
  }, [])

  const handlePlayUploadedTrack = useCallback((track: MusicTrack) => {
    if (gitaAudioRef.current) {
      gitaAudioRef.current.pause()
    }
    setActiveSource('upload')
    musicEngine.setQueue([track], 0)
  }, [])

  // ============ Global Controls ============

  const handleMuteToggle = useCallback(() => {
    setIsMuted(!isMuted)
    if (gitaAudioRef.current) {
      gitaAudioRef.current.muted = !isMuted
    }
    musicEngine.setVolume(isMuted ? 0.7 : 0)
  }, [isMuted])

  // Current chapter info
  const currentChapter = GITA_CHAPTERS.find(c => c.number === gitaChapter)
  const langConfig = LANGUAGE_CONFIG[gitaLanguage]

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#050505] via-[#0b0b0f] to-[#0a0812] text-white">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-orange-500/5 rounded-full blur-[150px]" />
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
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

          {/* Mood Selector */}
          <section>
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
          </section>

          {/* ============ BHAGAVAD GITA SECTION ============ */}
          <section className="rounded-2xl bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent border border-orange-500/20 overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'gita' ? null : 'gita')}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="p-2 rounded-xl bg-orange-500/20"
                  animate={activeSource === 'gita' && isPlaying ? {
                    boxShadow: ['0 0 10px rgba(249, 115, 22, 0.3)', '0 0 20px rgba(249, 115, 22, 0.5)', '0 0 10px rgba(249, 115, 22, 0.3)']
                  } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
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
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4">
                    {/* Language Selector */}
                    <div className="relative">
                      <button
                        onClick={() => setShowLanguageSelector(!showLanguageSelector)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                      >
                        <Languages className="w-4 h-4 text-white/60" />
                        <span className="text-sm">{langConfig.flag} {langConfig.nativeName}</span>
                        <ChevronDown className={`w-3 h-3 text-white/40 transition-transform ${showLanguageSelector ? 'rotate-180' : ''}`} />
                      </button>

                      {showLanguageSelector && (
                        <div className="absolute top-full left-0 mt-2 w-48 rounded-xl bg-[#1a1a1f] border border-white/10 shadow-2xl z-50 overflow-hidden">
                          {Object.entries(LANGUAGE_CONFIG).map(([lang, config]) => (
                            <button
                              key={lang}
                              onClick={() => handleLanguageChange(lang as GitaLanguage)}
                              className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-white/5 transition-colors ${
                                gitaLanguage === lang ? 'bg-orange-500/20' : ''
                              }`}
                            >
                              <span>{config.flag}</span>
                              <span className="text-sm">{config.nativeName}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Current Chapter Display */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-white/50">Chapter {gitaChapter} of 18</span>
                        {activeSource === 'gita' && isPlaying && (
                          <div className="flex gap-0.5">
                            {[1, 2, 3].map((i) => (
                              <motion.div
                                key={i}
                                className="w-0.5 bg-orange-400 rounded-full"
                                animate={{ height: [4, 12, 4] }}
                                transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                      <h4 className="text-lg font-bold text-white">{currentChapter?.nameSanskrit}</h4>
                      <p className="text-sm text-white/60">{currentChapter?.nameEnglish}</p>
                      <p className="text-xs text-white/40 mt-1">{currentChapter?.theme}</p>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="0.1"
                        value={gitaDuration ? (gitaCurrentTime / gitaDuration) * 100 : 0}
                        onChange={handleGitaSeek}
                        className="w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-orange-500"
                        style={{
                          background: `linear-gradient(to right, rgb(249 115 22) ${gitaDuration ? (gitaCurrentTime / gitaDuration) * 100 : 0}%, rgba(255,255,255,0.1) ${gitaDuration ? (gitaCurrentTime / gitaDuration) * 100 : 0}%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-white/40">
                        <span>{formatTime(gitaCurrentTime)}</span>
                        <span>{formatTime(gitaDuration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-center gap-4">
                      <button
                        onClick={handleGitaPrevChapter}
                        className="p-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                      >
                        <SkipBack className="w-5 h-5" />
                      </button>

                      <button
                        onClick={handleGitaPlayPause}
                        disabled={isLoading}
                        className={`p-5 rounded-full transition-all ${
                          activeSource === 'gita' && isPlaying
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                            : 'bg-white/10 text-white/70 hover:bg-white/20'
                        } disabled:opacity-50`}
                      >
                        {isLoading ? (
                          <motion.div
                            className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          />
                        ) : activeSource === 'gita' && isPlaying ? (
                          <Pause className="w-7 h-7" />
                        ) : (
                          <Play className="w-7 h-7 ml-1" />
                        )}
                      </button>

                      <button
                        onClick={handleGitaNextChapter}
                        className="p-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 transition-colors"
                      >
                        <SkipForward className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center gap-3">
                      <Headphones className="w-4 h-4 text-white/50" />
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={gitaVolume}
                        onChange={handleGitaVolumeChange}
                        className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-white/10 accent-orange-500"
                      />
                      <span className="text-xs text-white/40 w-8">{Math.round(gitaVolume * 100)}%</span>
                    </div>

                    {/* Error */}
                    {error && (
                      <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
                        <p className="text-sm text-red-400">{error}</p>
                      </div>
                    )}

                    {/* Chapter List Toggle */}
                    <button
                      onClick={() => setShowChapterList(!showChapterList)}
                      className="w-full p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-white/60" />
                        <span className="text-sm text-white/80">All 18 Chapters</span>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showChapterList ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Chapter List */}
                    <AnimatePresence>
                      {showChapterList && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="max-h-64 overflow-y-auto space-y-1"
                        >
                          {GITA_CHAPTERS.map((chapter) => (
                            <button
                              key={chapter.number}
                              onClick={() => {
                                playGitaChapter(chapter.number, gitaLanguage)
                                setShowChapterList(false)
                              }}
                              className={`w-full p-3 rounded-xl text-left transition-all flex items-center gap-3 ${
                                gitaChapter === chapter.number
                                  ? 'bg-orange-500/20 border border-orange-500/30'
                                  : 'hover:bg-white/5'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                                gitaChapter === chapter.number ? 'bg-orange-500 text-white' : 'bg-white/10 text-white/70'
                              }`}>
                                {chapter.number}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{chapter.nameSanskrit}</p>
                                <p className="text-xs text-white/50 truncate">{chapter.nameEnglish}</p>
                              </div>
                              <span className="text-xs text-white/40">{chapter.duration}</span>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* ============ MEDITATION MUSIC SECTION ============ */}
          <section className="rounded-2xl bg-gradient-to-br from-violet-500/10 via-purple-500/5 to-transparent border border-violet-500/20 overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'music' ? null : 'music')}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-500/20">
                  <Music2 className="w-5 h-5 text-violet-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-semibold text-white">Meditation Music</h3>
                  <p className="text-xs text-violet-200/60">AI-generated sacred sounds</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px] font-medium">
                  {PRESET_TRACKS.length} Tracks
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
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4">
                    {/* Now Playing */}
                    {musicState.currentTrack && (
                      <div className="p-4 rounded-xl bg-gradient-to-br from-violet-500/10 to-purple-500/5 border border-violet-500/20">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-12 h-12 rounded-xl bg-violet-500/20 flex items-center justify-center">
                            {musicState.isPlaying ? (
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3].map(i => (
                                  <motion.div
                                    key={i}
                                    animate={{ height: [4, 12, 4] }}
                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                    className="w-0.5 bg-violet-400 rounded-full"
                                  />
                                ))}
                              </div>
                            ) : (
                              <Music2 className="w-5 h-5 text-violet-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-medium text-white truncate">{musicState.currentTrack.title}</h4>
                            <p className="text-xs text-white/50">{musicState.currentTrack.artist}</p>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all"
                              style={{ width: `${musicState.duration ? (musicState.currentTime / musicState.duration) * 100 : 0}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-white/40">
                            <span>{formatTime(musicState.currentTime)}</span>
                            <span>{formatTime(musicState.duration)}</span>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="flex items-center justify-center gap-4 mt-3">
                          <button
                            onClick={() => musicEngine.playPrevious()}
                            className="p-2 text-white/50 hover:text-white transition-colors"
                          >
                            <SkipBack className="w-5 h-5" />
                          </button>
                          <button
                            onClick={handleMusicToggle}
                            className={`p-4 rounded-full transition-all ${
                              musicState.isPlaying
                                ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/30'
                                : 'bg-white/10 text-white hover:bg-white/15'
                            }`}
                          >
                            {musicState.isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                          </button>
                          <button
                            onClick={() => musicEngine.playNext()}
                            className="p-2 text-white/50 hover:text-white transition-colors"
                          >
                            <SkipForward className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Track List */}
                    <div className="max-h-72 overflow-y-auto space-y-1">
                      {PRESET_TRACKS.map((track) => (
                        <button
                          key={track.id}
                          onClick={() => handleMusicPlay(track)}
                          className={`w-full p-3 rounded-xl text-left flex items-center gap-3 transition-colors ${
                            musicState.currentTrack?.id === track.id
                              ? 'bg-violet-500/15'
                              : 'hover:bg-white/5'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            musicState.currentTrack?.id === track.id && musicState.isPlaying
                              ? 'bg-violet-500/30'
                              : 'bg-white/5'
                          }`}>
                            {musicState.currentTrack?.id === track.id && musicState.isPlaying ? (
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3].map(i => (
                                  <motion.div
                                    key={i}
                                    animate={{ height: [4, 10, 4] }}
                                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                    className="w-0.5 bg-violet-400 rounded-full"
                                  />
                                ))}
                              </div>
                            ) : (
                              <Music2 className="w-4 h-4 text-white/40" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${
                              musicState.currentTrack?.id === track.id ? 'text-violet-400' : 'text-white'
                            }`}>
                              {track.title}
                            </p>
                            <p className="text-xs text-white/40 truncate">{track.artist}</p>
                          </div>
                          <span className="text-xs text-white/30">{formatTime(track.duration)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* ============ MY UPLOADS SECTION ============ */}
          <section className="rounded-2xl bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 overflow-hidden">
            <button
              onClick={() => setExpandedSection(expandedSection === 'upload' ? null : 'upload')}
              className="w-full p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20">
                  <Upload className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-semibold text-white">My Uploads</h3>
                  <p className="text-xs text-emerald-200/60">Add your own music</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-medium">
                  {uploadedTracks.length} Tracks
                </span>
                {expandedSection === 'upload' ? (
                  <ChevronUp className="w-5 h-5 text-white/40" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-white/40" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {expandedSection === 'upload' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-4">
                    {/* Upload Button */}
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="audio/*"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full p-4 rounded-xl border-2 border-dashed border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-colors flex items-center justify-center gap-2 text-white/40 hover:text-emerald-400"
                      >
                        <Upload className="w-5 h-5" />
                        <span className="text-sm font-medium">Upload Music Files</span>
                      </button>
                      <p className="text-xs text-white/30 text-center mt-2">
                        Supports MP3, WAV, OGG, M4A
                      </p>
                    </div>

                    {/* Uploaded Tracks */}
                    {uploadedTracks.length === 0 ? (
                      <div className="p-8 text-center">
                        <Music2 className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-sm text-white/30">No uploaded music yet</p>
                      </div>
                    ) : (
                      <div className="max-h-64 overflow-y-auto space-y-1">
                        {uploadedTracks.map((track) => (
                          <div
                            key={track.id}
                            className={`p-3 rounded-xl flex items-center gap-3 transition-colors ${
                              musicState.currentTrack?.id === track.id
                                ? 'bg-emerald-500/15'
                                : 'hover:bg-white/5'
                            }`}
                          >
                            <button
                              onClick={() => handlePlayUploadedTrack(track)}
                              className="flex-1 flex items-center gap-3 text-left"
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                musicState.currentTrack?.id === track.id && musicState.isPlaying
                                  ? 'bg-emerald-500/30'
                                  : 'bg-white/5'
                              }`}>
                                {musicState.currentTrack?.id === track.id && musicState.isPlaying ? (
                                  <div className="flex items-center gap-0.5">
                                    {[1, 2, 3].map(i => (
                                      <motion.div
                                        key={i}
                                        animate={{ height: [4, 10, 4] }}
                                        transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                                        className="w-0.5 bg-emerald-400 rounded-full"
                                      />
                                    ))}
                                  </div>
                                ) : (
                                  <Music2 className="w-4 h-4 text-white/40" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${
                                  musicState.currentTrack?.id === track.id ? 'text-emerald-400' : 'text-white'
                                }`}>
                                  {track.title}
                                </p>
                                <p className="text-xs text-white/40">My Music</p>
                              </div>
                              <span className="text-xs text-white/30">{formatTime(track.duration)}</span>
                            </button>
                            <button
                              onClick={() => handleDeleteTrack(track.id)}
                              className="p-2 rounded-lg text-white/20 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </section>

          {/* Quick Stats */}
          <section className="grid grid-cols-4 gap-3">
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
              <p className="text-lg font-bold text-white">{PRESET_TRACKS.length}</p>
              <p className="text-[10px] text-white/40">Sounds</p>
            </div>
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-center">
              <Languages className="w-5 h-5 mx-auto mb-1 text-blue-400" />
              <p className="text-lg font-bold text-white">3+</p>
              <p className="text-[10px] text-white/40">Languages</p>
            </div>
          </section>

          {/* KIAAN Tips */}
          <section className="rounded-2xl bg-gradient-to-br from-violet-500/5 via-purple-500/5 to-orange-500/5 border border-white/5 p-5">
            <h3 className="text-sm font-medium text-white/70 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-400" />
              KIAAN Vibe Tips
            </h3>
            <ul className="text-xs text-white/50 space-y-2">
              <li className="flex items-start gap-2">
                <Sun className="w-3 h-3 mt-0.5 text-amber-400" />
                <span><strong className="text-amber-300">Morning:</strong> Start with Chapter 2 for clarity</span>
              </li>
              <li className="flex items-start gap-2">
                <Brain className="w-3 h-3 mt-0.5 text-violet-400" />
                <span><strong className="text-violet-300">Focus:</strong> Play meditation music while reading</span>
              </li>
              <li className="flex items-start gap-2">
                <Moon className="w-3 h-3 mt-0.5 text-indigo-400" />
                <span><strong className="text-indigo-300">Night:</strong> Chapter 12 for peaceful sleep</span>
              </li>
              <li className="flex items-start gap-2">
                <Upload className="w-3 h-3 mt-0.5 text-emerald-400" />
                <span><strong className="text-emerald-300">Upload:</strong> Add your favorite mantras & bhajans</span>
              </li>
            </ul>
          </section>

          {/* Bottom spacing for mobile nav */}
          <div className="h-24" />
        </div>
      </div>
    </main>
  )
}
