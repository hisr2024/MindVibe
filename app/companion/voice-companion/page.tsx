'use client'

/**
 * KIAAN Voice Companion - Guided Bhagavad Gita Exploration
 *
 * A dedicated voice-first interface for exploring the complete Bhagavad Gita
 * with KIAAN as your divine guide. Features:
 * - 18-chapter navigator with visual cards
 * - Verse-by-verse voice playback with Sanskrit + translation
 * - Wisdom Sphere: static browse + dynamic AI recommendations
 * - Voice discussion about any verse with KIAAN
 * - Speaker selection for recitation vs explanation
 *
 * Design: Dark immersive background, glass-morphism, purple/gold spiritual theme
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import VoiceLanguageSpeakerSelector from '@/components/voice/VoiceLanguageSpeakerSelector'

// ─── Types ──────────────────────────────────────────────────────────────

interface GitaChapter {
  number: number
  sanskritName: string
  englishName: string
  verseCount: number
  themes: string[]
  mentalHealthFocus: string
  yogaType: string
}

interface GitaVerse {
  chapter: number
  verse: number
  sanskrit: string
  transliteration: string
  translation: string
  theme: string
}

interface WisdomMode {
  type: 'static' | 'dynamic'
  filter?: string
  emotion?: string
}

interface VoiceConfig {
  language: string
  speakerId: string
  emotion: string
  speed: number
  pitch: number
  autoPlay: boolean
}

// ─── Chapter Data (all 18 chapters - works offline) ────────────────────

const CHAPTERS: GitaChapter[] = [
  { number: 1, sanskritName: 'अर्जुनविषादयोग', englishName: "Arjuna's Grief", verseCount: 47, themes: ['grief', 'moral dilemma', 'overwhelm'], mentalHealthFocus: 'Anxiety & Grief', yogaType: 'Vishada Yoga' },
  { number: 2, sanskritName: 'सांख्ययोग', englishName: 'The Yoga of Knowledge', verseCount: 72, themes: ['self-knowledge', 'equanimity', 'emotional regulation'], mentalHealthFocus: 'Self-Awareness', yogaType: 'Sankhya Yoga' },
  { number: 3, sanskritName: 'कर्मयोग', englishName: 'The Yoga of Action', verseCount: 43, themes: ['purposeful action', 'duty', 'overcoming inertia'], mentalHealthFocus: 'Depression & Purpose', yogaType: 'Karma Yoga' },
  { number: 4, sanskritName: 'ज्ञानकर्मसंन्यासयोग', englishName: 'Knowledge & Renunciation', verseCount: 42, themes: ['knowledge', 'trust', 'faith'], mentalHealthFocus: 'Self-Doubt & Trust', yogaType: 'Jnana Karma Sannyasa Yoga' },
  { number: 5, sanskritName: 'कर्मसंन्यासयोग', englishName: 'Renunciation of Action', verseCount: 29, themes: ['inner peace', 'detachment', 'contentment'], mentalHealthFocus: 'Letting Go', yogaType: 'Karma Sannyasa Yoga' },
  { number: 6, sanskritName: 'ध्यानयोग', englishName: 'The Yoga of Meditation', verseCount: 47, themes: ['meditation', 'mindfulness', 'self-mastery'], mentalHealthFocus: 'Anxiety & Mindfulness', yogaType: 'Dhyana Yoga' },
  { number: 7, sanskritName: 'ज्ञानविज्ञानयोग', englishName: 'Knowledge of the Divine', verseCount: 30, themes: ['divine connection', 'faith', 'wonder'], mentalHealthFocus: 'Existential Questions', yogaType: 'Jnana Vijnana Yoga' },
  { number: 8, sanskritName: 'अक्षरब्रह्मयोग', englishName: 'The Imperishable', verseCount: 28, themes: ['transcendence', 'the eternal', 'impermanence'], mentalHealthFocus: 'Death Anxiety', yogaType: 'Akshara Brahma Yoga' },
  { number: 9, sanskritName: 'राजविद्याराजगुह्ययोग', englishName: 'The Royal Knowledge', verseCount: 34, themes: ['devotion', 'unconditional love', 'acceptance'], mentalHealthFocus: 'Self-Worth & Acceptance', yogaType: 'Raja Vidya Raja Guhya Yoga' },
  { number: 10, sanskritName: 'विभूतियोग', englishName: 'Divine Glories', verseCount: 42, themes: ['divine qualities', 'excellence', 'gratitude'], mentalHealthFocus: 'Low Self-Esteem', yogaType: 'Vibhuti Yoga' },
  { number: 11, sanskritName: 'विश्वरूपदर्शनयोग', englishName: 'The Universal Vision', verseCount: 55, themes: ['cosmic perspective', 'awe', 'humility'], mentalHealthFocus: 'Perspective & Humility', yogaType: 'Vishvarupa Darshana Yoga' },
  { number: 12, sanskritName: 'भक्तियोग', englishName: 'The Yoga of Devotion', verseCount: 20, themes: ['love', 'devotion', 'ideal qualities'], mentalHealthFocus: 'Relationship Healing', yogaType: 'Bhakti Yoga' },
  { number: 13, sanskritName: 'क्षेत्रक्षेत्रज्ञविभागयोग', englishName: 'The Field & Knower', verseCount: 35, themes: ['body-mind distinction', 'self-knowledge'], mentalHealthFocus: 'Identity & Mindfulness', yogaType: 'Kshetra Kshetrajna Vibhaga Yoga' },
  { number: 14, sanskritName: 'गुणत्रयविभागयोग', englishName: 'Three Qualities of Nature', verseCount: 27, themes: ['behavioral patterns', 'habits', 'balance'], mentalHealthFocus: 'Habits & Mood', yogaType: 'Gunatraya Vibhaga Yoga' },
  { number: 15, sanskritName: 'पुरुषोत्तमयोग', englishName: 'The Supreme Person', verseCount: 20, themes: ['life purpose', 'meaning', 'ultimate reality'], mentalHealthFocus: 'Life Purpose', yogaType: 'Purushottama Yoga' },
  { number: 16, sanskritName: 'दैवासुरसम्पद्विभागयोग', englishName: 'Divine & Demonic Qualities', verseCount: 24, themes: ['virtue', 'self-improvement', 'toxic traits'], mentalHealthFocus: 'Character Growth', yogaType: 'Daivasura Sampad Vibhaga Yoga' },
  { number: 17, sanskritName: 'श्रद्धात्रयविभागयोग', englishName: 'Three Types of Faith', verseCount: 28, themes: ['faith', 'discipline', 'motivation'], mentalHealthFocus: 'Motivation & Discipline', yogaType: 'Shraddhatraya Vibhaga Yoga' },
  { number: 18, sanskritName: 'मोक्षसंन्यासयोग', englishName: 'Liberation', verseCount: 78, themes: ['liberation', 'integration', 'surrender', 'dharma'], mentalHealthFocus: 'Integration & Freedom', yogaType: 'Moksha Sannyasa Yoga' },
]

// ─── Sample Verses (per chapter, loads full data from API) ─────────────

const SAMPLE_VERSES: Record<number, GitaVerse[]> = {
  2: [
    { chapter: 2, verse: 47, sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।', transliteration: 'karmaṇy evādhikāras te mā phaleṣu kadācana', translation: 'You have the right to action alone, never to its fruits.', theme: 'Detachment from results' },
    { chapter: 2, verse: 14, sanskrit: 'मात्रास्पर्शास्तु कौन्तेय शीतोष्णसुखदुःखदाः।', transliteration: 'mātrā-sparśās tu kaunteya śītoṣṇa-sukha-duḥkha-dāḥ', translation: 'The contact of the senses with their objects gives rise to cold and heat, pleasure and pain. They are impermanent.', theme: 'Impermanence' },
    { chapter: 2, verse: 62, sanskrit: 'ध्यायतो विषयान्पुंसः सङ्गस्तेषूपजायते।', transliteration: 'dhyāyato viṣayān puṁsaḥ saṅgas teṣūpajāyate', translation: 'When one dwells on sense objects, attachment arises. From attachment springs desire, from desire anger.', theme: 'Chain of destruction' },
  ],
  6: [
    { chapter: 6, verse: 5, sanskrit: 'उद्धरेदात्मनात्मानं नात्मानमवसादयेत्।', transliteration: 'uddhared ātmanātmānaṁ nātmānam avasādayet', translation: 'Elevate yourself through your own effort. Do not degrade yourself. You are your own friend and your own enemy.', theme: 'Self as friend' },
    { chapter: 6, verse: 17, sanskrit: 'युक्ताहारविहारस्य युक्तचेष्टस्य कर्मसु।', transliteration: 'yuktāhāra-vihārasya yukta-ceṣṭasya karmasu', translation: 'For one who is moderate in eating, recreation, work, sleep, and wakefulness, yoga destroys all sorrow.', theme: 'Balance' },
    { chapter: 6, verse: 35, sanskrit: 'असंशयं महाबाहो मनो दुर्निग्रहं चलम्।', transliteration: 'asaṁśayaṁ mahā-bāho mano durnigrahaṁ calam', translation: 'The mind is restless and hard to control, O mighty-armed one. But it can be trained through practice and detachment.', theme: 'Mind training' },
  ],
  9: [
    { chapter: 9, verse: 26, sanskrit: 'पत्रं पुष्पं फलं तोयं यो मे भक्त्या प्रयच्छति।', transliteration: 'patraṁ puṣpaṁ phalaṁ toyaṁ yo me bhaktyā prayacchati', translation: 'Whoever offers me a leaf, a flower, a fruit, or water with devotion - I accept that offering of love.', theme: 'Love & Worth' },
    { chapter: 9, verse: 30, sanskrit: 'अपि चेत्सुदुराचारो भजते मामनन्यभाक्।', transliteration: 'api cet su-durācāro bhajate mām ananya-bhāk', translation: 'Even if the most sinful person worships me with devotion, they shall be regarded as righteous.', theme: 'Redemption' },
  ],
  18: [
    { chapter: 18, verse: 47, sanskrit: 'श्रेयान्स्वधर्मो विगुणः परधर्मात्स्वनुष्ठितात्।', transliteration: 'śreyān sva-dharmo viguṇaḥ para-dharmāt sv-anuṣṭhitāt', translation: 'It is better to follow your own dharma imperfectly than to follow another\'s dharma perfectly.', theme: 'Your unique path' },
    { chapter: 18, verse: 66, sanskrit: 'सर्वधर्मान्परित्यज्य मामेकं शरणं व्रज।', transliteration: 'sarva-dharmān parityajya mām ekaṁ śaraṇaṁ vraja', translation: 'Abandon all varieties of dharmas and surrender unto me alone. I shall deliver you from all sinful reactions. Do not fear.', theme: 'Surrender & freedom' },
    { chapter: 18, verse: 78, sanskrit: 'यत्र योगेश्वरः कृष्णो यत्र पार्थो धनुर्धरः।', transliteration: 'yatra yogeśvaraḥ kṛṣṇo yatra pārtho dhanur-dharaḥ', translation: 'Where there is Krishna, the lord of yoga, and Arjuna, the wielder of the bow, there will be prosperity, victory, happiness, and firm justice.', theme: 'Wisdom + Action = Victory' },
  ],
}

// ─── Component ──────────────────────────────────────────────────────────

export default function VoiceCompanionPage() {
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [verses, setVerses] = useState<GitaVerse[]>([])
  const [wisdomMode, setWisdomMode] = useState<WisdomMode>({ type: 'static' })
  const [searchQuery, setSearchQuery] = useState('')
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    language: 'en', speakerId: 'en_priya', emotion: 'neutral',
    speed: 0.95, pitch: 0.0, autoPlay: false,
  })
  const [dailyVerse, setDailyVerse] = useState<GitaVerse | null>(null)
  const [askKiaanVerse, setAskKiaanVerse] = useState<string | null>(null)
  const [kiaanResponse, setKiaanResponse] = useState<string | null>(null)
  const [isKiaanThinking, setIsKiaanThinking] = useState(false)
  const [dynamicEmotion, setDynamicEmotion] = useState('neutral')

  const chapterScrollRef = useRef<HTMLDivElement>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)

  // Total verses
  const totalVerses = CHAPTERS.reduce((sum, ch) => sum + ch.verseCount, 0)

  // ─── Load Verses for Chapter ──────────────────────────────────────

  const loadChapterVerses = useCallback(async (chapterNum: number) => {
    setSelectedChapter(chapterNum)
    setVerses([])

    // Use sample verses first (instant)
    if (SAMPLE_VERSES[chapterNum]) {
      setVerses(SAMPLE_VERSES[chapterNum])
    }

    // Try loading from API
    try {
      const res = await apiFetch(`/api/gita/${chapterNum}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.verses?.length > 0) {
          setVerses(data.verses.map((v: any) => ({
            chapter: chapterNum,
            verse: v.verseNumber || v.verse_number,
            sanskrit: v.sanskrit || '',
            transliteration: v.transliteration || '',
            translation: v.translation || '',
            theme: v.theme || '',
          })))
        }
      }
    } catch {
      // Keep sample verses
    }
  }, [])

  // ─── Load Daily Verse ──────────────────────────────────────────────

  useEffect(() => {
    // Set a thoughtful daily verse
    const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
    const versePool = [
      SAMPLE_VERSES[2]?.[0], SAMPLE_VERSES[6]?.[0], SAMPLE_VERSES[9]?.[0],
      SAMPLE_VERSES[18]?.[0], SAMPLE_VERSES[2]?.[2],
    ].filter(Boolean) as GitaVerse[]
    if (versePool.length > 0) {
      setDailyVerse(versePool[dayOfYear % versePool.length])
    }
  }, [])

  // ─── Voice Playback ───────────────────────────────────────────────

  const playVerse = async (verse: GitaVerse) => {
    const verseKey = `${verse.chapter}.${verse.verse}`
    if (isPlaying === verseKey) {
      // Stop
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
      setIsPlaying(null)
      return
    }

    setIsPlaying(verseKey)

    try {
      const textToSpeak = verse.sanskrit + '. ' + verse.translation
      const res = await apiFetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToSpeak,
          language: voiceConfig.language === 'sa' ? 'sa' : voiceConfig.language,
          voice_type: 'wisdom',
          speed: voiceConfig.speed,
        }),
      })

      if (res.ok) {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        currentAudioRef.current = audio
        audio.onended = () => { setIsPlaying(null); URL.revokeObjectURL(url) }
        audio.onerror = () => { setIsPlaying(null); URL.revokeObjectURL(url) }
        await audio.play()
      } else {
        setIsPlaying(null)
      }
    } catch {
      setIsPlaying(null)
    }
  }

  // ─── Ask KIAAN ─────────────────────────────────────────────────────

  const askKiaanAboutVerse = async (verse: GitaVerse) => {
    const verseKey = `${verse.chapter}.${verse.verse}`
    setAskKiaanVerse(verseKey)
    setKiaanResponse(null)
    setIsKiaanThinking(true)

    try {
      const res = await apiFetch('/api/companion/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: `voice_companion_${Date.now()}`,
          message: `Help me deeply understand Bhagavad Gita Chapter ${verse.chapter}, Verse ${verse.verse}: "${verse.translation}". What does this mean for my daily life? How can I apply this wisdom practically?`,
          language: voiceConfig.language,
          content_type: 'text',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setKiaanResponse(data.response || 'This verse holds deep wisdom. Let me share what it means...')
      } else {
        setKiaanResponse(
          `This verse from Chapter ${verse.chapter} teaches us about ${verse.theme || 'timeless wisdom'}. ` +
          `The Sanskrit "${verse.sanskrit?.slice(0, 50)}..." carries vibrations of truth that have guided seekers for millennia. ` +
          `In your daily life, this means focusing on what you can control - your actions, your attitude, your response to life's challenges. ` +
          `Take a moment to reflect: how does this teaching speak to what you're experiencing right now?`
        )
      }
    } catch {
      setKiaanResponse(
        `This beautiful verse speaks to the heart of human experience. The wisdom here is both ancient and immediately practical. ` +
        `Consider: what aspect of this teaching resonates most with where you are in your journey right now?`
      )
    } finally {
      setIsKiaanThinking(false)
    }
  }

  // ─── Dynamic Wisdom (emotion-based recommendations) ─────────────

  const EMOTION_OPTIONS = [
    { id: 'anxious', label: 'Anxious', icon: '😰', chapters: [2, 6] },
    { id: 'sad', label: 'Sad', icon: '😢', chapters: [2, 9] },
    { id: 'angry', label: 'Angry', icon: '😤', chapters: [2, 3, 16] },
    { id: 'lost', label: 'Lost', icon: '🌫️', chapters: [3, 15, 18] },
    { id: 'lonely', label: 'Lonely', icon: '💙', chapters: [6, 9] },
    { id: 'grateful', label: 'Grateful', icon: '🙏', chapters: [10, 11] },
    { id: 'seeking', label: 'Seeking', icon: '🔍', chapters: [4, 7, 13] },
    { id: 'peaceful', label: 'At Peace', icon: '🧘', chapters: [5, 12] },
  ]

  const handleEmotionSelect = (emotionId: string) => {
    setDynamicEmotion(emotionId)
    const emotionData = EMOTION_OPTIONS.find(e => e.id === emotionId)
    if (emotionData && emotionData.chapters.length > 0) {
      loadChapterVerses(emotionData.chapters[0])
    }
  }

  // ─── Search Filter ─────────────────────────────────────────────────

  const filteredChapters = searchQuery
    ? CHAPTERS.filter(ch =>
        ch.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.sanskritName.includes(searchQuery) ||
        ch.themes.some(t => t.includes(searchQuery.toLowerCase())) ||
        ch.mentalHealthFocus.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : CHAPTERS

  const selectedChapterData = selectedChapter
    ? CHAPTERS.find(ch => ch.number === selectedChapter)
    : null

  // ─── Render ─────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950 text-white">
      {/* Header */}
      <div className="sticky top-0 z-50 backdrop-blur-xl bg-gray-950/80 border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/companion" className="p-2 rounded-full hover:bg-white/5 transition-colors">
              <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-300 to-amber-300 bg-clip-text text-transparent">
                Gita Voice Companion
              </h1>
              <p className="text-xs text-white/40">{totalVerses} verses across 18 chapters</p>
            </div>
          </div>
          <button
            onClick={() => setShowVoiceSettings(!showVoiceSettings)}
            className="p-2 rounded-full hover:bg-white/5 transition-colors"
            aria-label="Voice settings"
          >
            <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Voice Settings Panel */}
      {showVoiceSettings && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <VoiceLanguageSpeakerSelector
            currentConfig={voiceConfig}
            onConfigChange={setVoiceConfig}
            onClose={() => setShowVoiceSettings(false)}
          />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-8">
        {/* Daily Verse Card */}
        {dailyVerse && !selectedChapter && (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-purple-500/10 border border-amber-400/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-400 text-lg">OM</span>
              <h2 className="text-sm font-semibold text-amber-300/80 uppercase tracking-wider">Verse of the Day</h2>
            </div>
            <p className="text-lg text-amber-100/90 font-serif italic mb-2">{dailyVerse.sanskrit}</p>
            <p className="text-sm text-white/70 mb-3">{dailyVerse.translation}</p>
            <div className="flex items-center gap-3">
              <span className="text-xs text-white/40">Ch.{dailyVerse.chapter} V.{dailyVerse.verse}</span>
              <button
                onClick={() => playVerse(dailyVerse)}
                className="px-3 py-1.5 text-xs rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors"
              >
                {isPlaying === `${dailyVerse.chapter}.${dailyVerse.verse}` ? 'Stop' : 'Listen'}
              </button>
              <button
                onClick={() => askKiaanAboutVerse(dailyVerse)}
                className="px-3 py-1.5 text-xs rounded-full bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
              >
                Ask KIAAN
              </button>
            </div>
          </div>
        )}

        {/* Wisdom Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setWisdomMode({ type: 'static' }); setSelectedChapter(null) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              wisdomMode.type === 'static'
                ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            Browse Chapters
          </button>
          <button
            onClick={() => setWisdomMode({ type: 'dynamic' })}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              wisdomMode.type === 'dynamic'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            Guide Me (by Emotion)
          </button>
        </div>

        {/* Dynamic Mode: Emotion Selector */}
        {wisdomMode.type === 'dynamic' && (
          <div className="space-y-4">
            <p className="text-sm text-white/50">How are you feeling right now? KIAAN will guide you to the right wisdom.</p>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {EMOTION_OPTIONS.map(em => (
                <button
                  key={em.id}
                  onClick={() => handleEmotionSelect(em.id)}
                  className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all ${
                    dynamicEmotion === em.id
                      ? 'bg-amber-500/20 border border-amber-400/30 ring-1 ring-amber-400/20'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-2xl">{em.icon}</span>
                  <span className="text-[10px] text-white/50">{em.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        {wisdomMode.type === 'static' && !selectedChapter && (
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapters by name, theme, or focus..."
              className="w-full px-4 py-3 pl-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/30"
            />
            <svg className="absolute left-3 top-3.5 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        )}

        {/* Chapter Navigator */}
        {!selectedChapter && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3" ref={chapterScrollRef}>
            {filteredChapters.map(ch => (
              <button
                key={ch.number}
                onClick={() => loadChapterVerses(ch.number)}
                className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-purple-500/10 hover:border-purple-400/20 text-left transition-all group"
              >
                <div className="flex items-start justify-between mb-2">
                  <span className="text-2xl font-bold text-purple-400/60 group-hover:text-purple-300 transition-colors">
                    {ch.number}
                  </span>
                  <span className="text-[10px] text-white/30 px-2 py-0.5 rounded-full bg-white/5">
                    {ch.verseCount} verses
                  </span>
                </div>
                <h3 className="text-sm font-semibold text-white/90 group-hover:text-purple-200 transition-colors">
                  {ch.englishName}
                </h3>
                <p className="text-xs text-amber-400/60 mt-0.5">{ch.sanskritName}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {ch.themes.slice(0, 2).map(t => (
                    <span key={t} className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-white/40">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-purple-300/50 mt-2">{ch.mentalHealthFocus}</p>
              </button>
            ))}
          </div>
        )}

        {/* Chapter Detail + Verses */}
        {selectedChapter && selectedChapterData && (
          <div className="space-y-6">
            {/* Chapter Header */}
            <div className="flex items-start gap-4">
              <button
                onClick={() => { setSelectedChapter(null); setVerses([]); setAskKiaanVerse(null); setKiaanResponse(null) }}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0 mt-1"
              >
                <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-purple-400">{selectedChapterData.number}</span>
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedChapterData.englishName}</h2>
                    <p className="text-sm text-amber-400/70">{selectedChapterData.sanskritName}</p>
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  {selectedChapterData.verseCount} verses &middot; {selectedChapterData.yogaType} &middot; {selectedChapterData.mentalHealthFocus}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedChapterData.themes.map(t => (
                    <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-purple-500/10 text-purple-300/70 border border-purple-400/10">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Verses List */}
            <div className="space-y-3">
              {verses.length === 0 ? (
                <div className="text-center py-12 text-white/30">
                  <p>Loading verses...</p>
                  <p className="text-xs mt-2">Full verse data loads from the API</p>
                </div>
              ) : (
                verses.map(verse => {
                  const verseKey = `${verse.chapter}.${verse.verse}`
                  const isVersePlaying = isPlaying === verseKey
                  const isAskingKiaan = askKiaanVerse === verseKey

                  return (
                    <div
                      key={verseKey}
                      className={`p-4 rounded-xl transition-all ${
                        isAskingKiaan
                          ? 'bg-purple-500/10 border border-purple-400/20'
                          : 'bg-white/5 border border-white/5 hover:bg-white/8'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-xs text-purple-400/60 font-mono mt-1 flex-shrink-0 w-8">
                          {verse.verse}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-amber-200/80 font-serif leading-relaxed">{verse.sanskrit}</p>
                          {verse.transliteration && (
                            <p className="text-xs text-white/30 mt-1 italic">{verse.transliteration}</p>
                          )}
                          <p className="text-sm text-white/70 mt-2 leading-relaxed">{verse.translation}</p>
                          {verse.theme && (
                            <span className="inline-block mt-2 px-2 py-0.5 text-[10px] rounded-full bg-amber-500/10 text-amber-300/60">
                              {verse.theme}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => playVerse(verse)}
                            className={`p-2 rounded-full transition-colors ${
                              isVersePlaying
                                ? 'bg-purple-500/30 text-purple-300'
                                : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/60'
                            }`}
                            aria-label={isVersePlaying ? 'Stop playback' : 'Play verse'}
                          >
                            {isVersePlaying ? (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                            ) : (
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                            )}
                          </button>
                          <button
                            onClick={() => askKiaanAboutVerse(verse)}
                            className="p-2 rounded-full bg-white/5 text-white/40 hover:bg-purple-500/20 hover:text-purple-300 transition-colors"
                            aria-label="Ask KIAAN about this verse"
                            title="Ask KIAAN"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* KIAAN Insight */}
                      {isAskingKiaan && (
                        <div className="mt-4 pt-4 border-t border-purple-400/10">
                          {isKiaanThinking ? (
                            <div className="flex items-center gap-2 text-purple-300/60">
                              <div className="animate-pulse flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                              <span className="text-xs">KIAAN is reflecting...</span>
                            </div>
                          ) : kiaanResponse ? (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                                  <span className="text-[8px] text-white font-bold">K</span>
                                </div>
                                <span className="text-xs font-medium text-purple-300">KIAAN&apos;s Insight</span>
                              </div>
                              <p className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap">{kiaanResponse}</p>
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>

            {/* Chapter Navigation */}
            <div className="flex items-center justify-between pt-4">
              {selectedChapter > 1 && (
                <button
                  onClick={() => loadChapterVerses(selectedChapter - 1)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 text-sm transition-colors"
                >
                  &larr; Chapter {selectedChapter - 1}
                </button>
              )}
              <div className="flex-1" />
              {selectedChapter < 18 && (
                <button
                  onClick={() => loadChapterVerses(selectedChapter + 1)}
                  className="px-4 py-2 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 text-sm transition-colors"
                >
                  Chapter {selectedChapter + 1} &rarr;
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
