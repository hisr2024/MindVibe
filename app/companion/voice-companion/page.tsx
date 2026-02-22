'use client'

/**
 * KIAAN Voice Companion - Best Friend + Gita Guide (Dual Mode)
 *
 * A world-class voice-first interface where KIAAN serves dual roles:
 *
 * MODE 1 - BEST FRIEND (default):
 *   Casual chat, emotional support, daily check-ins, humor, companionship.
 *   No unsolicited spiritual advice. Just a great friend.
 *
 * MODE 2 - GITA GUIDE (on request):
 *   Modern, secular Bhagavad Gita exploration. Psychology-backed interpretation.
 *   18-chapter navigator, verse playback, AI-powered insights.
 *
 * Features:
 * - Seamless mode switching (auto-detect or manual toggle)
 * - Best friend chat with mood-reactive responses
 * - Daily wisdom with modern psychology interpretation
 * - Mood check-in widget
 * - 18-chapter navigator with modern chapter interpretation
 * - Verse-by-verse voice playback with Sanskrit + translation
 * - Ask KIAAN for deep verse exploration
 * - Speaker selection for recitation vs explanation
 *
 * Design: Dark immersive, glass-morphism, purple/gold/teal spiritual theme
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { apiFetch } from '@/lib/api'
import VoiceCompanionSelector from '@/components/voice/VoiceCompanionSelector'
import type { VoiceLanguage } from '@/utils/voice/voiceCatalog'

// ─── Types ──────────────────────────────────────────────────────────────

interface GitaChapter {
  number: number
  sanskritName: string
  englishName: string
  verseCount: number
  themes: string[]
  spiritualFocus: string
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

interface VoiceConfig {
  language: string
  speakerId: string
  emotion: string
  speed: number
  pitch: number
  autoPlay: boolean
}

interface ChatMessage {
  id: string
  role: 'user' | 'kiaan'
  content: string
  mood?: string
  timestamp: number
  mode?: string
  gitaInsight?: ChapterGuide | null
}

interface DailyWisdom {
  chapter: number
  verse: number
  verse_id: string
  modern_title: string
  insight: string
  secular_theme: string
  psychology: string
  daily_practice: string
  applies_to: string[]
}

interface ChapterGuide {
  chapter: number
  modern_title: string
  secular_theme: string
  psychology_connection?: string
  modern_lesson: string
  daily_practice: string
  applies_to: string[]
}

type PageMode = 'friend' | 'guide'

// ─── Chapter Data (all 18 chapters - works offline) ────────────────────

const CHAPTERS: GitaChapter[] = [
  { number: 1, sanskritName: '\u0905\u0930\u094D\u091C\u0941\u0928\u0935\u093F\u0937\u093E\u0926\u092F\u094B\u0917', englishName: "Arjuna's Grief", verseCount: 47, themes: ['grief', 'moral dilemma', 'overwhelm'], spiritualFocus: 'Anxiety & Grief', yogaType: 'Vishada Yoga' },
  { number: 2, sanskritName: '\u0938\u093E\u0902\u0916\u094D\u092F\u092F\u094B\u0917', englishName: 'The Yoga of Knowledge', verseCount: 72, themes: ['self-knowledge', 'equanimity', 'emotional regulation'], spiritualFocus: 'Self-Awareness', yogaType: 'Sankhya Yoga' },
  { number: 3, sanskritName: '\u0915\u0930\u094D\u092E\u092F\u094B\u0917', englishName: 'The Yoga of Action', verseCount: 43, themes: ['purposeful action', 'duty', 'overcoming inertia'], spiritualFocus: 'Depression & Purpose', yogaType: 'Karma Yoga' },
  { number: 4, sanskritName: '\u091C\u094D\u091E\u093E\u0928\u0915\u0930\u094D\u092E\u0938\u0902\u0928\u094D\u092F\u093E\u0938\u092F\u094B\u0917', englishName: 'Knowledge & Renunciation', verseCount: 42, themes: ['knowledge', 'trust', 'faith'], spiritualFocus: 'Self-Doubt & Trust', yogaType: 'Jnana Karma Sannyasa Yoga' },
  { number: 5, sanskritName: '\u0915\u0930\u094D\u092E\u0938\u0902\u0928\u094D\u092F\u093E\u0938\u092F\u094B\u0917', englishName: 'Renunciation of Action', verseCount: 29, themes: ['inner peace', 'detachment', 'contentment'], spiritualFocus: 'Letting Go', yogaType: 'Karma Sannyasa Yoga' },
  { number: 6, sanskritName: '\u0927\u094D\u092F\u093E\u0928\u092F\u094B\u0917', englishName: 'The Yoga of Meditation', verseCount: 47, themes: ['meditation', 'mindfulness', 'self-mastery'], spiritualFocus: 'Anxiety & Mindfulness', yogaType: 'Dhyana Yoga' },
  { number: 7, sanskritName: '\u091C\u094D\u091E\u093E\u0928\u0935\u093F\u091C\u094D\u091E\u093E\u0928\u092F\u094B\u0917', englishName: 'Knowledge of the Divine', verseCount: 30, themes: ['divine connection', 'faith', 'wonder'], spiritualFocus: 'Existential Questions', yogaType: 'Jnana Vijnana Yoga' },
  { number: 8, sanskritName: '\u0905\u0915\u094D\u0937\u0930\u092C\u094D\u0930\u0939\u094D\u092E\u092F\u094B\u0917', englishName: 'The Imperishable', verseCount: 28, themes: ['transcendence', 'the eternal', 'impermanence'], spiritualFocus: 'Death Anxiety', yogaType: 'Akshara Brahma Yoga' },
  { number: 9, sanskritName: '\u0930\u093E\u091C\u0935\u093F\u0926\u094D\u092F\u093E\u0930\u093E\u091C\u0917\u0941\u0939\u094D\u092F\u092F\u094B\u0917', englishName: 'The Royal Knowledge', verseCount: 34, themes: ['devotion', 'unconditional love', 'acceptance'], spiritualFocus: 'Self-Worth & Acceptance', yogaType: 'Raja Vidya Raja Guhya Yoga' },
  { number: 10, sanskritName: '\u0935\u093F\u092D\u0942\u0924\u093F\u092F\u094B\u0917', englishName: 'Divine Glories', verseCount: 42, themes: ['divine qualities', 'excellence', 'gratitude'], spiritualFocus: 'Low Self-Esteem', yogaType: 'Vibhuti Yoga' },
  { number: 11, sanskritName: '\u0935\u093F\u0936\u094D\u0935\u0930\u0942\u092A\u0926\u0930\u094D\u0936\u0928\u092F\u094B\u0917', englishName: 'The Universal Vision', verseCount: 55, themes: ['cosmic perspective', 'awe', 'humility'], spiritualFocus: 'Perspective & Humility', yogaType: 'Vishvarupa Darshana Yoga' },
  { number: 12, sanskritName: '\u092D\u0915\u094D\u0924\u093F\u092F\u094B\u0917', englishName: 'The Yoga of Devotion', verseCount: 20, themes: ['love', 'devotion', 'ideal qualities'], spiritualFocus: 'Relationship Healing', yogaType: 'Bhakti Yoga' },
  { number: 13, sanskritName: '\u0915\u094D\u0937\u0947\u0924\u094D\u0930\u0915\u094D\u0937\u0947\u0924\u094D\u0930\u091C\u094D\u091E\u0935\u093F\u092D\u093E\u0917\u092F\u094B\u0917', englishName: 'The Field & Knower', verseCount: 35, themes: ['body-mind distinction', 'self-knowledge'], spiritualFocus: 'Identity & Mindfulness', yogaType: 'Kshetra Kshetrajna Vibhaga Yoga' },
  { number: 14, sanskritName: '\u0917\u0941\u0923\u0924\u094D\u0930\u092F\u0935\u093F\u092D\u093E\u0917\u092F\u094B\u0917', englishName: 'Three Qualities of Nature', verseCount: 27, themes: ['behavioral patterns', 'habits', 'balance'], spiritualFocus: 'Habits & Mood', yogaType: 'Gunatraya Vibhaga Yoga' },
  { number: 15, sanskritName: '\u092A\u0941\u0930\u0941\u0937\u094B\u0924\u094D\u0924\u092E\u092F\u094B\u0917', englishName: 'The Supreme Person', verseCount: 20, themes: ['life purpose', 'meaning', 'ultimate reality'], spiritualFocus: 'Life Purpose', yogaType: 'Purushottama Yoga' },
  { number: 16, sanskritName: '\u0926\u0948\u0935\u093E\u0938\u0941\u0930\u0938\u092E\u094D\u092A\u0926\u094D\u0935\u093F\u092D\u093E\u0917\u092F\u094B\u0917', englishName: 'Divine & Demonic Qualities', verseCount: 24, themes: ['virtue', 'self-improvement', 'toxic traits'], spiritualFocus: 'Character Growth', yogaType: 'Daivasura Sampad Vibhaga Yoga' },
  { number: 17, sanskritName: '\u0936\u094D\u0930\u0926\u094D\u0927\u093E\u0924\u094D\u0930\u092F\u0935\u093F\u092D\u093E\u0917\u092F\u094B\u0917', englishName: 'Three Types of Faith', verseCount: 28, themes: ['faith', 'discipline', 'motivation'], spiritualFocus: 'Motivation & Discipline', yogaType: 'Shraddhatraya Vibhaga Yoga' },
  { number: 18, sanskritName: '\u092E\u094B\u0915\u094D\u0937\u0938\u0902\u0928\u094D\u092F\u093E\u0938\u092F\u094B\u0917', englishName: 'Liberation', verseCount: 78, themes: ['liberation', 'integration', 'surrender', 'dharma'], spiritualFocus: 'Integration & Freedom', yogaType: 'Moksha Sannyasa Yoga' },
]

// ─── Sample Verses (per chapter, loads full data from API) ─────────────

const SAMPLE_VERSES: Record<number, GitaVerse[]> = {
  2: [
    { chapter: 2, verse: 47, sanskrit: '\u0915\u0930\u094D\u092E\u0923\u094D\u092F\u0947\u0935\u093E\u0927\u093F\u0915\u093E\u0930\u0938\u094D\u0924\u0947 \u092E\u093E \u092B\u0932\u0947\u0937\u0941 \u0915\u0926\u093E\u091A\u0928\u0964', transliteration: 'karma\u1E47y ev\u0101dhik\u0101ras te m\u0101 phale\u1E63u kad\u0101cana', translation: 'You have the right to action alone, never to its fruits.', theme: 'Detachment from results' },
    { chapter: 2, verse: 14, sanskrit: '\u092E\u093E\u0924\u094D\u0930\u093E\u0938\u094D\u092A\u0930\u094D\u0936\u093E\u0938\u094D\u0924\u0941 \u0915\u094C\u0928\u094D\u0924\u0947\u092F \u0936\u0940\u0924\u094B\u0937\u094D\u0923\u0938\u0941\u0916\u0926\u0941\u0903\u0916\u0926\u093E\u0903\u0964', transliteration: 'm\u0101tr\u0101-spar\u015B\u0101s tu kaunteya \u015B\u012Bto\u1E63\u1E47a-sukha-du\u1E25kha-d\u0101\u1E25', translation: 'The contact of the senses with their objects gives rise to cold and heat, pleasure and pain. They are impermanent.', theme: 'Impermanence' },
    { chapter: 2, verse: 62, sanskrit: '\u0927\u094D\u092F\u093E\u092F\u0924\u094B \u0935\u093F\u0937\u092F\u093E\u0928\u094D\u092A\u0941\u0902\u0938\u0903 \u0938\u0919\u094D\u0917\u0938\u094D\u0924\u0947\u0937\u0942\u092A\u091C\u093E\u092F\u0924\u0947\u0964', transliteration: 'dhy\u0101yato vi\u1E63ay\u0101n pu\u1E41sa\u1E25 sa\u1E45gas te\u1E63\u016Bpaj\u0101yate', translation: 'When one dwells on sense objects, attachment arises. From attachment springs desire, from desire anger.', theme: 'Chain of destruction' },
  ],
  6: [
    { chapter: 6, verse: 5, sanskrit: '\u0909\u0926\u094D\u0927\u0930\u0947\u0926\u093E\u0924\u094D\u092E\u0928\u093E\u0924\u094D\u092E\u093E\u0928\u0902 \u0928\u093E\u0924\u094D\u092E\u093E\u0928\u092E\u0935\u0938\u093E\u0926\u092F\u0947\u0924\u094D\u0964', transliteration: 'uddhared \u0101tman\u0101tm\u0101na\u1E41 n\u0101tm\u0101nam avas\u0101dayet', translation: 'Elevate yourself through your own effort. Do not degrade yourself. You are your own friend and your own enemy.', theme: 'Self as friend' },
    { chapter: 6, verse: 17, sanskrit: '\u092F\u0941\u0915\u094D\u0924\u093E\u0939\u093E\u0930\u0935\u093F\u0939\u093E\u0930\u0938\u094D\u092F \u092F\u0941\u0915\u094D\u0924\u091A\u0947\u0937\u094D\u091F\u0938\u094D\u092F \u0915\u0930\u094D\u092E\u0938\u0941\u0964', transliteration: 'yukt\u0101h\u0101ra-vih\u0101rasya yukta-ce\u1E63\u1E6Dasya karmasu', translation: 'For one who is moderate in eating, recreation, work, sleep, and wakefulness, yoga destroys all sorrow.', theme: 'Balance' },
    { chapter: 6, verse: 35, sanskrit: '\u0905\u0938\u0902\u0936\u092F\u0902 \u092E\u0939\u093E\u092C\u093E\u0939\u094B \u092E\u0928\u094B \u0926\u0941\u0930\u094D\u0928\u093F\u0917\u094D\u0930\u0939\u0902 \u091A\u0932\u092E\u094D\u0964', transliteration: 'asa\u1E41\u015Baya\u1E41 mah\u0101-b\u0101ho mano durnigrah\u0101\u1E41 calam', translation: 'The mind is restless and hard to control, O mighty-armed one. But it can be trained through practice and detachment.', theme: 'Mind training' },
  ],
  9: [
    { chapter: 9, verse: 26, sanskrit: '\u092A\u0924\u094D\u0930\u0902 \u092A\u0941\u0937\u094D\u092A\u0902 \u092B\u0932\u0902 \u0924\u094B\u092F\u0902 \u092F\u094B \u092E\u0947 \u092D\u0915\u094D\u0924\u094D\u092F\u093E \u092A\u094D\u0930\u092F\u091A\u094D\u091B\u0924\u093F\u0964', transliteration: 'patra\u1E41 pu\u1E63pa\u1E41 phala\u1E41 toya\u1E41 yo me bhakty\u0101 prayacchati', translation: 'Whoever offers me a leaf, a flower, a fruit, or water with devotion - I accept that offering of love.', theme: 'Love & Worth' },
    { chapter: 9, verse: 30, sanskrit: '\u0905\u092A\u093F \u091A\u0947\u0924\u094D\u0938\u0941\u0926\u0941\u0930\u093E\u091A\u093E\u0930\u094B \u092D\u091C\u0924\u0947 \u092E\u093E\u092E\u0928\u0928\u094D\u092F\u092D\u093E\u0915\u094D\u0964', transliteration: 'api cet su-dur\u0101c\u0101ro bhajate m\u0101m ananya-bh\u0101k', translation: 'Even if the most sinful person worships me with devotion, they shall be regarded as righteous.', theme: 'Redemption' },
  ],
  18: [
    { chapter: 18, verse: 47, sanskrit: '\u0936\u094D\u0930\u0947\u092F\u093E\u0928\u094D\u0938\u094D\u0935\u0927\u0930\u094D\u092E\u094B \u0935\u093F\u0917\u0941\u0923\u0903 \u092A\u0930\u0927\u0930\u094D\u092E\u093E\u0924\u094D\u0938\u094D\u0935\u0928\u0941\u0937\u094D\u0920\u093F\u0924\u093E\u0924\u094D\u0964', transliteration: '\u015Brey\u0101n sva-dharmo vigu\u1E47a\u1E25 para-dharm\u0101t sv-anu\u1E63\u1E6Dhit\u0101t', translation: 'It is better to follow your own dharma imperfectly than to follow another\'s dharma perfectly.', theme: 'Your unique path' },
    { chapter: 18, verse: 66, sanskrit: '\u0938\u0930\u094D\u0935\u0927\u0930\u094D\u092E\u093E\u0928\u094D\u092A\u0930\u093F\u0924\u094D\u092F\u091C\u094D\u092F \u092E\u093E\u092E\u0947\u0915\u0902 \u0936\u0930\u0923\u0902 \u0935\u094D\u0930\u091C\u0964', transliteration: 'sarva-dharm\u0101n parityajya m\u0101m eka\u1E41 \u015Bara\u1E47a\u1E41 vraja', translation: 'Abandon all varieties of dharmas and surrender unto me alone. I shall deliver you from all sinful reactions. Do not fear.', theme: 'Surrender & freedom' },
    { chapter: 18, verse: 78, sanskrit: '\u092F\u0924\u094D\u0930 \u092F\u094B\u0917\u0947\u0936\u094D\u0935\u0930\u0903 \u0915\u0943\u0937\u094D\u0923\u094B \u092F\u0924\u094D\u0930 \u092A\u093E\u0930\u094D\u0925\u094B \u0927\u0928\u0941\u0930\u094D\u0927\u0930\u0903\u0964', transliteration: 'yatra yoge\u015Bvara\u1E25 k\u1E5B\u1E63\u1E47o yatra p\u0101rtho dhanur-dhara\u1E25', translation: 'Where there is Krishna, the lord of yoga, and Arjuna, the wielder of the bow, there will be prosperity, victory, happiness, and firm justice.', theme: 'Wisdom + Action = Victory' },
  ],
}

// ─── Component ──────────────────────────────────────────────────────────

export default function VoiceCompanionPage() {
  // ── Core State ────────────────────────────────────────────────────
  const [pageMode, setPageMode] = useState<PageMode>('friend')
  const [selectedChapter, setSelectedChapter] = useState<number | null>(null)
  const [verses, setVerses] = useState<GitaVerse[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [isPlaying, setIsPlaying] = useState<string | null>(null)
  const [showVoiceSettings, setShowVoiceSettings] = useState(false)
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    language: 'en', speakerId: 'en_sarvam-aura', emotion: 'neutral',
    speed: 0.95, pitch: 0.0, autoPlay: false,
  })

  // ── Best Friend Chat State ────────────────────────────────────────
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [detectedMood, setDetectedMood] = useState<string | null>(null)

  // ── Gita Guide State ──────────────────────────────────────────────
  const [askKiaanVerse, setAskKiaanVerse] = useState<string | null>(null)
  const [kiaanResponse, setKiaanResponse] = useState<string | null>(null)
  const [isKiaanThinking, setIsKiaanThinking] = useState(false)
  const [dynamicEmotion, setDynamicEmotion] = useState('neutral')
  const [chapterGuide, setChapterGuide] = useState<ChapterGuide | null>(null)

  // ── Daily Wisdom State ────────────────────────────────────────────
  const [dailyWisdom, setDailyWisdom] = useState<DailyWisdom | null>(null)
  const [dailyVerse, setDailyVerse] = useState<GitaVerse | null>(null)

  // ── Mood Check-in State ───────────────────────────────────────────
  const [moodQuestion, setMoodQuestion] = useState<string | null>(null)
  const [showMoodCheckin, setShowMoodCheckin] = useState(false)

  // ── Refs ───────────────────────────────────────────────────────────
  const chatEndRef = useRef<HTMLDivElement>(null)
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const chatInputRef = useRef<HTMLInputElement>(null)

  const totalVerses = CHAPTERS.reduce((sum, ch) => sum + ch.verseCount, 0)
  const selectedVoiceId = voiceConfig.speakerId?.split('_').pop() || 'sarvam-aura'

  // ── Cleanup audio on unmount ──────────────────────────────────────
  useEffect(() => {
    return () => {
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current = null
      }
    }
  }, [])

  // ── Load daily wisdom on mount ────────────────────────────────────
  useEffect(() => {
    const loadDaily = async () => {
      try {
        const res = await apiFetch('/api/kiaan/friend/daily-wisdom')
        if (res.ok) {
          const data = await res.json()
          if (data?.wisdom) setDailyWisdom(data.wisdom)
        }
      } catch { /* use fallback */ }

      // Fallback daily verse from samples
      const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000)
      const pool = [
        SAMPLE_VERSES[2]?.[0], SAMPLE_VERSES[6]?.[0], SAMPLE_VERSES[9]?.[0],
        SAMPLE_VERSES[18]?.[0], SAMPLE_VERSES[2]?.[2],
      ].filter(Boolean) as GitaVerse[]
      if (pool.length > 0) setDailyVerse(pool[dayOfYear % pool.length])
    }
    loadDaily()

    // Add welcome message
    setChatMessages([{
      id: 'welcome',
      role: 'kiaan',
      content: "Hey! I'm KIAAN, your companion. Think of me as that friend who's always here - no judgment, just real talk. What's on your mind?",
      mood: 'neutral',
      timestamp: Date.now(),
      mode: 'best_friend',
    }])
  }, [])

  // ── Scroll chat to bottom ─────────────────────────────────────────
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  // ═══════════════════════════════════════════════════════════════════
  // BEST FRIEND CHAT
  // ═══════════════════════════════════════════════════════════════════

  const sendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return
    const msg = chatInput.trim()
    setChatInput('')

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: msg,
      timestamp: Date.now(),
    }
    setChatMessages(prev => [...prev, userMsg])
    setIsChatLoading(true)

    try {
      const history = chatMessages.slice(-8).map(m => ({
        role: m.role === 'kiaan' ? 'assistant' : 'user',
        content: m.content,
      }))

      const res = await apiFetch('/api/kiaan/friend/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          language: voiceConfig.language,
          force_mode: null,
          conversation_history: history,
          friendship_level: chatMessages.length > 20 ? 'close' : chatMessages.length > 6 ? 'familiar' : 'new',
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setDetectedMood(data.mood)

        const kiaanMsg: ChatMessage = {
          id: `kiaan_${Date.now()}`,
          role: 'kiaan',
          content: data.response,
          mood: data.mood,
          timestamp: Date.now(),
          mode: data.mode,
          gitaInsight: data.gita_insight,
        }
        setChatMessages(prev => [...prev, kiaanMsg])

        // If guide mode was triggered, suggest switching
        if (data.mode === 'gita_guide' && data.suggested_chapter) {
          setSelectedChapter(null)
        }
      } else {
        // Fallback response
        setChatMessages(prev => [...prev, {
          id: `kiaan_${Date.now()}`,
          role: 'kiaan',
          content: "I hear you. Tell me more - I'm listening.",
          timestamp: Date.now(),
          mode: 'best_friend',
        }])
      }
    } catch {
      setChatMessages(prev => [...prev, {
        id: `kiaan_${Date.now()}`,
        role: 'kiaan',
        content: "I'm right here with you. Sometimes just talking helps, even when the words feel hard to find.",
        timestamp: Date.now(),
        mode: 'best_friend',
      }])
    } finally {
      setIsChatLoading(false)
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // MOOD CHECK-IN
  // ═══════════════════════════════════════════════════════════════════

  const startMoodCheckin = async () => {
    setShowMoodCheckin(true)
    let question: string | null = null
    try {
      const res = await apiFetch('/api/kiaan/friend/mood-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        const data = await res.json()
        question = data.question
      }
    } catch { /* use default */ }
    setMoodQuestion(question || "Quick check - how are you REALLY doing? Not the polite answer, the real one.")
  }

  // ═══════════════════════════════════════════════════════════════════
  // GITA GUIDE FUNCTIONS
  // ═══════════════════════════════════════════════════════════════════

  const loadChapterVerses = useCallback(async (chapterNum: number) => {
    setSelectedChapter(chapterNum)
    setVerses([])
    setChapterGuide(null)

    if (SAMPLE_VERSES[chapterNum]) setVerses(SAMPLE_VERSES[chapterNum])

    // Load verses and modern guide in parallel
    const versesPromise = apiFetch(`/api/gita/chapters/${chapterNum}`)
      .then(async res => {
        if (res.ok) {
          const data = await res.json()
          if (data?.verses?.length > 0) {
            setVerses(data.verses.map((v: any) => ({
              chapter: v.chapter || chapterNum,
              verse: v.verse,
              sanskrit: v.sanskrit || '',
              transliteration: v.transliteration || '',
              translation: v.preview || '',
              theme: v.theme || '',
            })))
          }
        }
      }).catch(() => {})

    const guidePromise = apiFetch(`/api/kiaan/friend/gita-guide/${chapterNum}`)
      .then(async res => {
        if (res.ok) {
          const data = await res.json()
          if (data?.chapter_guide) setChapterGuide(data.chapter_guide)
        }
      }).catch(() => {})

    await Promise.all([versesPromise, guidePromise])
  }, [])

  const playVerse = async (verse: GitaVerse) => {
    const verseKey = `${verse.chapter}.${verse.verse}`
    if (isPlaying === verseKey) {
      if (currentAudioRef.current) { currentAudioRef.current.pause(); currentAudioRef.current = null }
      setIsPlaying(null)
      return
    }
    setIsPlaying(verseKey)
    try {
      const res = await apiFetch('/api/companion/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: verse.sanskrit + '. ' + verse.translation,
          language: voiceConfig.language,
          voice_id: selectedVoiceId,
          voice_type: 'wisdom', speed: voiceConfig.speed,
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
      } else { setIsPlaying(null) }
    } catch { setIsPlaying(null) }
  }

  const askKiaanAboutVerse = async (verse: GitaVerse) => {
    const verseKey = `${verse.chapter}.${verse.verse}`
    setAskKiaanVerse(verseKey)
    setKiaanResponse(null)
    setIsKiaanThinking(true)
    try {
      const res = await apiFetch('/api/kiaan/friend/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `Help me deeply understand Bhagavad Gita Chapter ${verse.chapter}, Verse ${verse.verse}: "${verse.translation}". What does this mean for my daily life? Give me a modern, practical interpretation.`,
          language: voiceConfig.language,
          force_mode: 'guide',
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setKiaanResponse(data.response || 'This verse holds deep wisdom. Let me share what it means...')
      } else {
        setKiaanResponse(
          `This verse from Chapter ${verse.chapter} teaches us about ${verse.theme || 'timeless wisdom'}. ` +
          `In modern terms: focus on what you can control - your actions, your attitude, your response to life. ` +
          `The psychology behind this: when we detach from outcomes (not from effort), anxiety drops and performance improves. ` +
          `Try this today: pick one task and give it your best without checking how it's "doing" afterwards.`
        )
      }
    } catch {
      setKiaanResponse(
        `This verse speaks to the heart of human experience. The behavioral science behind it: ` +
        `our brains are wired to over-focus on outcomes (loss aversion), but peak performance research shows ` +
        `that process-focus beats outcome-focus every time. What aspect resonates with where you are right now?`
      )
    } finally { setIsKiaanThinking(false) }
  }

  // ── Emotion-based dynamic mode ────────────────────────────────────
  const EMOTION_OPTIONS = [
    { id: 'anxious', label: 'Anxious', icon: '\uD83D\uDE30', chapters: [2, 6] },
    { id: 'sad', label: 'Sad', icon: '\uD83D\uDE22', chapters: [2, 9] },
    { id: 'angry', label: 'Angry', icon: '\uD83D\uDE24', chapters: [2, 3, 16] },
    { id: 'lost', label: 'Lost', icon: '\uD83C\uDF2B\uFE0F', chapters: [3, 15, 18] },
    { id: 'lonely', label: 'Lonely', icon: '\uD83D\uDC99', chapters: [6, 9] },
    { id: 'grateful', label: 'Grateful', icon: '\uD83D\uDE4F', chapters: [10, 11] },
    { id: 'seeking', label: 'Seeking', icon: '\uD83D\uDD0D', chapters: [4, 7, 13] },
    { id: 'peaceful', label: 'At Peace', icon: '\uD83E\uDDD8', chapters: [5, 12] },
  ]

  const handleEmotionSelect = (emotionId: string) => {
    setDynamicEmotion(emotionId)
    const emotionData = EMOTION_OPTIONS.find(e => e.id === emotionId)
    if (emotionData?.chapters.length) loadChapterVerses(emotionData.chapters[0])
  }

  // ── Filters ───────────────────────────────────────────────────────
  const filteredChapters = searchQuery
    ? CHAPTERS.filter(ch =>
        ch.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ch.sanskritName.includes(searchQuery) ||
        ch.themes.some(t => t.includes(searchQuery.toLowerCase())) ||
        ch.spiritualFocus.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : CHAPTERS

  const selectedChapterData = selectedChapter ? CHAPTERS.find(ch => ch.number === selectedChapter) : null

  // ═══════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950 text-white">
      {/* ── Header ─────────────────────────────────────────────────── */}
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
                KIAAN
              </h1>
              <p className="text-xs text-white/40">
                {pageMode === 'friend' ? 'Your Best Friend' : `Gita Guide \u00B7 ${totalVerses} verses`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex items-center bg-white/5 rounded-full p-0.5">
              <button
                onClick={() => { setPageMode('friend'); setSelectedChapter(null) }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  pageMode === 'friend'
                    ? 'bg-purple-500/30 text-purple-300 shadow-lg shadow-purple-500/10'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                Friend
              </button>
              <button
                onClick={() => setPageMode('guide')}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  pageMode === 'guide'
                    ? 'bg-amber-500/30 text-amber-300 shadow-lg shadow-amber-500/10'
                    : 'text-white/40 hover:text-white/60'
                }`}
              >
                Gita Guide
              </button>
            </div>
            <button onClick={() => setShowVoiceSettings(!showVoiceSettings)} className="p-2 rounded-full hover:bg-white/5 transition-colors" aria-label="Voice settings">
              <svg className="w-5 h-5 text-white/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Voice Settings */}
      {showVoiceSettings && (
        <div className="max-w-6xl mx-auto px-4 pt-4">
          <VoiceCompanionSelector
            currentConfig={{
              language: (voiceConfig.language || 'en') as any,
              voiceId: selectedVoiceId,
              emotion: voiceConfig.emotion || 'neutral',
              speed: voiceConfig.speed || 0.95,
              pitch: voiceConfig.pitch || 0.0,
              autoPlay: voiceConfig.autoPlay ?? true,
            }}
            onConfigChange={(cfg) => setVoiceConfig(prev => ({
              ...prev,
              language: cfg.language,
              speakerId: `${cfg.language}_${cfg.voiceId}`,
              emotion: cfg.emotion,
              speed: cfg.speed,
              pitch: cfg.pitch,
              autoPlay: cfg.autoPlay,
            }))}
            onClose={() => setShowVoiceSettings(false)}
          />
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* ══════════════════════════════════════════════════════════ */}
        {/* DAILY WISDOM CARD (shows in both modes) */}
        {/* ══════════════════════════════════════════════════════════ */}
        {(dailyWisdom || dailyVerse) && !selectedChapter && (
          <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 to-purple-500/10 border border-amber-400/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-400 text-lg">OM</span>
              <h2 className="text-sm font-semibold text-amber-300/80 uppercase tracking-wider">Today&apos;s Wisdom</h2>
              {dailyWisdom && (
                <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300/60 border border-purple-400/10">
                  Ch.{dailyWisdom.chapter}
                </span>
              )}
            </div>
            {dailyWisdom ? (
              <>
                <p className="text-base font-semibold text-white/90 mb-1">{dailyWisdom.modern_title}</p>
                <p className="text-sm text-white/70 leading-relaxed mb-3">{dailyWisdom.insight}</p>
                <div className="p-3 rounded-xl bg-white/5 border border-white/5 mb-3">
                  <p className="text-xs text-purple-300/70 font-medium mb-1">Psychology</p>
                  <p className="text-xs text-white/50 leading-relaxed">{dailyWisdom.psychology}</p>
                </div>
                <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-400/10">
                  <p className="text-xs text-amber-300/70 font-medium mb-1">Today&apos;s Practice</p>
                  <p className="text-xs text-white/60 leading-relaxed">{dailyWisdom.daily_practice}</p>
                </div>
                <div className="flex flex-wrap gap-1 mt-3">
                  {dailyWisdom.applies_to.map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-white/30">{tag}</span>
                  ))}
                </div>
              </>
            ) : dailyVerse ? (
              <>
                <p className="text-lg text-amber-100/90 font-serif italic mb-2">{dailyVerse.sanskrit}</p>
                <p className="text-sm text-white/70 mb-3">{dailyVerse.translation}</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-white/40">Ch.{dailyVerse.chapter} V.{dailyVerse.verse}</span>
                  <button onClick={() => playVerse(dailyVerse)} className="px-3 py-1.5 text-xs rounded-full bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 transition-colors">
                    {isPlaying === `${dailyVerse.chapter}.${dailyVerse.verse}` ? 'Stop' : 'Listen'}
                  </button>
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* BEST FRIEND MODE */}
        {/* ══════════════════════════════════════════════════════════ */}
        {pageMode === 'friend' && (
          <div className="space-y-4">
            {/* Mood Check-in + Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={startMoodCheckin}
                className="px-4 py-2 rounded-xl bg-teal-500/10 text-teal-300/80 border border-teal-400/20 hover:bg-teal-500/20 text-sm font-medium transition-all"
              >
                Mood Check-in
              </button>
              <button
                onClick={() => setPageMode('guide')}
                className="px-4 py-2 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 text-sm transition-all"
              >
                Explore Gita Wisdom
              </button>
            </div>

            {/* Mood Check-in Card */}
            {showMoodCheckin && moodQuestion && (
              <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-blue-500/10 border border-teal-400/20">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-teal-400 to-blue-400 flex items-center justify-center">
                    <span className="text-[10px] text-white font-bold">K</span>
                  </div>
                  <span className="text-xs font-medium text-teal-300">Mood Check-in</span>
                  <button onClick={() => setShowMoodCheckin(false)} className="ml-auto p-1 rounded-full hover:bg-white/10">
                    <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-white/80 mb-3">{moodQuestion}</p>
                <input
                  type="text"
                  placeholder="Type how you feel..."
                  className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm placeholder-white/30 focus:outline-none focus:border-teal-400/30"
                  onKeyDown={async (e) => {
                    if (e.key === 'Enter') {
                      const value = (e.target as HTMLInputElement).value
                      if (value.trim()) {
                        setChatInput(value)
                        setShowMoodCheckin(false)
                        setTimeout(() => sendMessage(), 0)
                      }
                    }
                  }}
                />
              </div>
            )}

            {/* Chat Messages */}
            <div className="space-y-3 min-h-[40vh] max-h-[60vh] overflow-y-auto pr-1">
              {chatMessages.map(msg => (
                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'order-2' : 'order-1'}`}>
                    {msg.role === 'kiaan' && (
                      <div className="flex items-center gap-2 mb-1">
                        <div className="w-5 h-5 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <span className="text-[8px] text-white font-bold">K</span>
                        </div>
                        <span className="text-[10px] text-white/30">KIAAN</span>
                        {msg.mode === 'gita_guide' && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300/60">Guide</span>
                        )}
                        {msg.mood && msg.mood !== 'neutral' && (
                          <span className="text-[10px] text-white/20">{msg.mood}</span>
                        )}
                      </div>
                    )}
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed ${
                      msg.role === 'user'
                        ? 'bg-purple-500/20 text-white/90 rounded-tr-md'
                        : 'bg-white/5 text-white/80 rounded-tl-md border border-white/5'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    </div>
                    {/* Gita insight card inline */}
                    {msg.gitaInsight && (
                      <div className="mt-2 p-3 rounded-xl bg-amber-500/5 border border-amber-400/10">
                        <p className="text-xs text-amber-300/70 font-medium">{msg.gitaInsight.modern_title} (Ch.{msg.gitaInsight.chapter})</p>
                        <p className="text-xs text-white/50 mt-1">{msg.gitaInsight.modern_lesson}</p>
                        <button
                          onClick={() => { setPageMode('guide'); loadChapterVerses(msg.gitaInsight!.chapter) }}
                          className="mt-2 text-[10px] text-purple-300/60 hover:text-purple-300 transition-colors"
                        >
                          Explore this chapter &rarr;
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {isChatLoading && (
                <div className="flex justify-start">
                  <div className="flex items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/5 rounded-tl-md">
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 rounded-full bg-purple-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="sticky bottom-0 pt-2 pb-4 bg-gradient-to-t from-gray-950 via-gray-950/95 to-transparent">
              <div className="flex items-center gap-2">
                <input
                  ref={chatInputRef}
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendMessage()}
                  placeholder="Talk to KIAAN..."
                  className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/30 text-sm"
                  disabled={isChatLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!chatInput.trim() || isChatLoading}
                  className="p-3 rounded-xl bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Send message"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
              {detectedMood && detectedMood !== 'neutral' && (
                <p className="text-[10px] text-white/20 mt-1 ml-1">KIAAN senses: {detectedMood}</p>
              )}
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════ */}
        {/* GITA GUIDE MODE */}
        {/* ══════════════════════════════════════════════════════════ */}
        {pageMode === 'guide' && (
          <div className="space-y-6">
            {/* Sub-mode: Browse vs Dynamic */}
            {!selectedChapter && (
              <>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setDynamicEmotion('neutral')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      dynamicEmotion === 'neutral'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    Browse Chapters
                  </button>
                  <button
                    onClick={() => setDynamicEmotion('anxious')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      dynamicEmotion !== 'neutral'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                        : 'bg-white/5 text-white/50 hover:bg-white/10'
                    }`}
                  >
                    Guide Me (by Emotion)
                  </button>
                  <button
                    onClick={() => setPageMode('friend')}
                    className="ml-auto px-3 py-2 rounded-xl bg-white/5 text-white/40 hover:bg-white/10 text-sm transition-all"
                  >
                    Talk to KIAAN
                  </button>
                </div>

                {/* Emotion Selector */}
                {dynamicEmotion !== 'neutral' && (
                  <div className="space-y-3">
                    <p className="text-sm text-white/50">How are you feeling? KIAAN will guide you to the right wisdom.</p>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {EMOTION_OPTIONS.map(em => (
                        <button key={em.id} onClick={() => handleEmotionSelect(em.id)}
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
                {dynamicEmotion === 'neutral' && (
                  <div className="relative">
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search chapters by name, theme, or focus..."
                      className="w-full px-4 py-3 pl-10 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-400/30"
                    />
                    <svg className="absolute left-3 top-3.5 w-4 h-4 text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                )}

                {/* Chapter Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {filteredChapters.map(ch => (
                    <button key={ch.number} onClick={() => loadChapterVerses(ch.number)}
                      className="p-4 rounded-xl bg-white/5 border border-white/5 hover:bg-purple-500/10 hover:border-purple-400/20 text-left transition-all group"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-2xl font-bold text-purple-400/60 group-hover:text-purple-300 transition-colors">{ch.number}</span>
                        <span className="text-[10px] text-white/30 px-2 py-0.5 rounded-full bg-white/5">{ch.verseCount} verses</span>
                      </div>
                      <h3 className="text-sm font-semibold text-white/90 group-hover:text-purple-200 transition-colors">{ch.englishName}</h3>
                      <p className="text-xs text-amber-400/60 mt-0.5">{ch.sanskritName}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {ch.themes.slice(0, 2).map(t => (
                          <span key={t} className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-white/40">{t}</span>
                        ))}
                      </div>
                      <p className="text-[10px] text-purple-300/50 mt-2">{ch.spiritualFocus}</p>
                    </button>
                  ))}
                </div>
              </>
            )}

            {/* ── Chapter Detail + Verses ──────────────────────────── */}
            {selectedChapter && selectedChapterData && (
              <div className="space-y-6">
                {/* Chapter Header */}
                <div className="flex items-start gap-4">
                  <button onClick={() => { setSelectedChapter(null); setVerses([]); setAskKiaanVerse(null); setKiaanResponse(null); setChapterGuide(null) }}
                    className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0 mt-1">
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
                      {selectedChapterData.verseCount} verses &middot; {selectedChapterData.yogaType} &middot; {selectedChapterData.spiritualFocus}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selectedChapterData.themes.map(t => (
                        <span key={t} className="px-2 py-0.5 text-xs rounded-full bg-purple-500/10 text-purple-300/70 border border-purple-400/10">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Modern Chapter Interpretation */}
                {chapterGuide && (
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-500/10 to-teal-500/10 border border-purple-400/15">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
                        <span className="text-[10px] text-white font-bold">K</span>
                      </div>
                      <span className="text-sm font-medium text-purple-300">Modern Interpretation</span>
                    </div>
                    <h3 className="text-base font-semibold text-white/90 mb-2">{chapterGuide.modern_title}</h3>
                    <p className="text-xs text-teal-300/70 mb-3">{chapterGuide.secular_theme}</p>
                    {chapterGuide.psychology_connection && (
                      <div className="p-3 rounded-lg bg-white/5 border border-white/5 mb-3">
                        <p className="text-[10px] text-purple-300/60 font-medium uppercase tracking-wider mb-1">Behavioral Science</p>
                        <p className="text-xs text-white/60 leading-relaxed">{chapterGuide.psychology_connection}</p>
                      </div>
                    )}
                    <p className="text-sm text-white/70 leading-relaxed mb-3">{chapterGuide.modern_lesson}</p>
                    <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-400/10">
                      <p className="text-[10px] text-amber-300/60 font-medium uppercase tracking-wider mb-1">Daily Practice</p>
                      <p className="text-xs text-white/60 leading-relaxed">{chapterGuide.daily_practice}</p>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {chapterGuide.applies_to.map(tag => (
                        <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-white/30">{tag}</span>
                      ))}
                    </div>
                  </div>
                )}

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
                        <div key={verseKey} className={`p-4 rounded-xl transition-all ${
                          isAskingKiaan ? 'bg-purple-500/10 border border-purple-400/20' : 'bg-white/5 border border-white/5 hover:bg-white/10'
                        }`}>
                          <div className="flex items-start gap-3">
                            <span className="text-xs text-purple-400/60 font-mono mt-1 flex-shrink-0 w-8">{verse.verse}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-amber-200/80 font-serif leading-relaxed">{verse.sanskrit}</p>
                              {verse.transliteration && <p className="text-xs text-white/30 mt-1 italic">{verse.transliteration}</p>}
                              <p className="text-sm text-white/70 mt-2 leading-relaxed">{verse.translation}</p>
                              {verse.theme && (
                                <span className="inline-block mt-2 px-2 py-0.5 text-[10px] rounded-full bg-amber-500/10 text-amber-300/60">{verse.theme}</span>
                              )}
                            </div>
                            <div className="flex flex-col gap-2 flex-shrink-0">
                              <button onClick={() => playVerse(verse)}
                                className={`p-2 rounded-full transition-colors ${isVersePlaying ? 'bg-purple-500/30 text-purple-300' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                                aria-label={isVersePlaying ? 'Stop' : 'Play'}>
                                {isVersePlaying ? (
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                                ) : (
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                                )}
                              </button>
                              <button onClick={() => askKiaanAboutVerse(verse)}
                                className="p-2 rounded-full bg-white/5 text-white/40 hover:bg-purple-500/20 hover:text-purple-300 transition-colors"
                                aria-label="Ask KIAAN" title="Ask KIAAN">
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
                                    <span className="text-xs font-medium text-purple-300">KIAAN&apos;s Modern Insight</span>
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
                    <button onClick={() => loadChapterVerses(selectedChapter - 1)} className="px-4 py-2 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 text-sm transition-colors">
                      &larr; Chapter {selectedChapter - 1}
                    </button>
                  )}
                  <div className="flex-1" />
                  {selectedChapter < 18 && (
                    <button onClick={() => loadChapterVerses(selectedChapter + 1)} className="px-4 py-2 rounded-xl bg-white/5 text-white/50 hover:bg-white/10 text-sm transition-colors">
                      Chapter {selectedChapter + 1} &rarr;
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
