'use client'

/**
 * Voice Language & Speaker Selector - World-Class ElevenLabs-Inspired UI
 *
 * A comprehensive voice configuration panel that allows users to:
 * - Browse and select from 18 supported languages
 * - Choose from 30+ speaker profiles with previews
 * - Configure voice emotion, speed, and pitch
 * - Preview speakers before selection
 * - Save preferences for KIAAN companion
 *
 * Design: Glass-morphism cards, smooth transitions, speaker avatars
 */

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '@/lib/api'

// ─── Types ──────────────────────────────────────────────────────────────

interface LanguageInfo {
  code: string
  name: string
  native_name: string
  script: string
  direction: string
  has_tts: boolean
  has_stt: boolean
  speaker_count: number
  flag_emoji: string
  gita_available: boolean
}

interface SpeakerInfo {
  id: string
  name: string
  display_name: string
  language: string
  gender: string
  description: string
  personality: string
  age_range: string
  accent: string
  best_for: string[]
  quality_score: number
  default_speed: number
  default_pitch: number
  preview_text: string
  avatar_color: string
  is_premium: boolean
  tags: string[]
}

interface VoiceConfig {
  language: string
  speakerId: string
  emotion: string
  speed: number
  pitch: number
  autoPlay: boolean
}

interface Props {
  currentConfig: VoiceConfig
  onConfigChange: (config: VoiceConfig) => void
  onClose?: () => void
  compact?: boolean
}

// ─── Static Data (fallback when API unavailable) ────────────────────────

const LANGUAGE_GROUPS = [
  {
    label: 'Indian Languages',
    languages: ['hi', 'sa', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa'],
  },
  {
    label: 'International',
    languages: ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh'],
  },
]

// Fallback data when API is unavailable (offline mode)
const FALLBACK_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', native_name: 'English', script: 'Latin', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 4, flag_emoji: '\u{1F1FA}\u{1F1F8}', gita_available: true },
  { code: 'hi', name: 'Hindi', native_name: '\u0939\u093F\u0928\u094D\u0926\u0940', script: 'Devanagari', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 2, flag_emoji: '\u{1F1EE}\u{1F1F3}', gita_available: true },
  { code: 'sa', name: 'Sanskrit', native_name: '\u0938\u0902\u0938\u094D\u0915\u0943\u0924', script: 'Devanagari', direction: 'ltr', has_tts: true, has_stt: false, speaker_count: 2, flag_emoji: '\u{1F549}\u{FE0F}', gita_available: true },
  { code: 'ta', name: 'Tamil', native_name: '\u0BA4\u0BAE\u0BBF\u0BB4\u0BCD', script: 'Tamil', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 2, flag_emoji: '\u{1F1EE}\u{1F1F3}', gita_available: true },
  { code: 'te', name: 'Telugu', native_name: '\u0C24\u0C46\u0C32\u0C41\u0C17\u0C41', script: 'Telugu', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 1, flag_emoji: '\u{1F1EE}\u{1F1F3}', gita_available: true },
  { code: 'bn', name: 'Bengali', native_name: '\u09AC\u09BE\u0982\u09B2\u09BE', script: 'Bengali', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 1, flag_emoji: '\u{1F1EE}\u{1F1F3}', gita_available: true },
  { code: 'mr', name: 'Marathi', native_name: '\u092E\u0930\u093E\u0920\u0940', script: 'Devanagari', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 1, flag_emoji: '\u{1F1EE}\u{1F1F3}', gita_available: true },
  { code: 'gu', name: 'Gujarati', native_name: '\u0A97\u0AC1\u0A9C\u0AB0\u0ABE\u0AA4\u0AC0', script: 'Gujarati', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 1, flag_emoji: '\u{1F1EE}\u{1F1F3}', gita_available: true },
  { code: 'kn', name: 'Kannada', native_name: '\u0C95\u0CA8\u0CCD\u0CA8\u0CA1', script: 'Kannada', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 1, flag_emoji: '\u{1F1EE}\u{1F1F3}', gita_available: true },
  { code: 'ml', name: 'Malayalam', native_name: '\u0D2E\u0D32\u0D2F\u0D3E\u0D33\u0D02', script: 'Malayalam', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 1, flag_emoji: '\u{1F1EE}\u{1F1F3}', gita_available: true },
  { code: 'pa', name: 'Punjabi', native_name: '\u0A2A\u0A70\u0A1C\u0A3E\u0A2C\u0A40', script: 'Gurmukhi', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 1, flag_emoji: '\u{1F1EE}\u{1F1F3}', gita_available: true },
  { code: 'es', name: 'Spanish', native_name: 'Espa\u00F1ol', script: 'Latin', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 1, flag_emoji: '\u{1F1EA}\u{1F1F8}', gita_available: true },
  { code: 'fr', name: 'French', native_name: 'Fran\u00E7ais', script: 'Latin', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 1, flag_emoji: '\u{1F1EB}\u{1F1F7}', gita_available: true },
  { code: 'de', name: 'German', native_name: 'Deutsch', script: 'Latin', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 1, flag_emoji: '\u{1F1E9}\u{1F1EA}', gita_available: true },
  { code: 'pt', name: 'Portuguese', native_name: 'Portugu\u00EAs', script: 'Latin', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 1, flag_emoji: '\u{1F1E7}\u{1F1F7}', gita_available: true },
  { code: 'ja', name: 'Japanese', native_name: '\u65E5\u672C\u8A9E', script: 'Kanji/Kana', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 1, flag_emoji: '\u{1F1EF}\u{1F1F5}', gita_available: true },
  { code: 'zh', name: 'Chinese', native_name: '\u4E2D\u6587', script: 'Hanzi', direction: 'ltr', has_tts: true, has_stt: true, speaker_count: 1, flag_emoji: '\u{1F1E8}\u{1F1F3}', gita_available: true },
]

const FALLBACK_SPEAKERS: Record<string, SpeakerInfo[]> = {
  en: [
    { id: 'en_priya', name: 'priya', display_name: 'Priya', language: 'en', gender: 'female', description: 'Warm, empathetic friend with gentle Indian-English accent', personality: 'Your wise, understanding best friend who listens deeply', age_range: '25-35', accent: 'Indian-English', best_for: ['personal guidance', 'emotional support', 'daily conversations'], quality_score: 9.5, default_speed: 0.95, default_pitch: 0.3, preview_text: "Hey friend, I'm Priya. Think of me as that friend who always understands.", avatar_color: '#EC4899', is_premium: false, tags: ['empathetic', 'warm', 'default'] },
    { id: 'en_arjun', name: 'arjun', display_name: 'Arjun', language: 'en', gender: 'male', description: 'Calm, grounded voice with wisdom and depth', personality: 'A thoughtful guide who speaks with clarity and purpose', age_range: '30-45', accent: 'Neutral', best_for: ['gita wisdom', 'meditation guidance', 'philosophical discussions'], quality_score: 9.3, default_speed: 0.92, default_pitch: -0.3, preview_text: "I'm Arjun. Let me share the timeless wisdom of the Gita with you.", avatar_color: '#6366F1', is_premium: false, tags: ['wise', 'calm', 'philosophical'] },
    { id: 'en_krishna', name: 'krishna', display_name: 'Krishna', language: 'en', gender: 'male', description: 'Deep, divine voice for sacred verses and spiritual guidance', personality: 'The divine teacher speaking eternal wisdom', age_range: 'ageless', accent: 'Classical', best_for: ['gita verses', 'divine teachings', 'spiritual guidance'], quality_score: 9.7, default_speed: 0.88, default_pitch: -1.0, preview_text: 'The Self is neither born nor does it ever die. It is eternal, ever-existing.', avatar_color: '#7C3AED', is_premium: true, tags: ['divine', 'sacred', 'premium'] },
  ],
  hi: [
    { id: 'hi_ananya', name: 'ananya', display_name: 'Ananya', language: 'hi', gender: 'female', description: 'Melodious Hindi voice with warmth and emotional depth', personality: 'A caring friend who speaks from the heart in Hindi', age_range: '25-35', accent: 'Standard Hindi', best_for: ['hindi conversations', 'emotional support', 'daily guidance'], quality_score: 9.4, default_speed: 0.94, default_pitch: 0.2, preview_text: 'Namaste dost! Main Ananya hoon.', avatar_color: '#EC4899', is_premium: false, tags: ['hindi', 'empathetic', 'melodious'] },
  ],
}

const EMOTIONS = [
  { id: 'neutral', label: 'Neutral', icon: '😊', color: '#8B5CF6' },
  { id: 'warmth', label: 'Warmth', icon: '🤗', color: '#F59E0B' },
  { id: 'calm', label: 'Calm', icon: '🧘', color: '#10B981' },
  { id: 'wisdom', label: 'Wisdom', icon: '🦉', color: '#6366F1' },
  { id: 'compassion', label: 'Compassion', icon: '💜', color: '#EC4899' },
  { id: 'encouragement', label: 'Uplift', icon: '✨', color: '#EAB308' },
  { id: 'devotion', label: 'Devotion', icon: '🙏', color: '#7C3AED' },
  { id: 'serenity', label: 'Serenity', icon: '🌊', color: '#06B6D4' },
]

// ─── Component ──────────────────────────────────────────────────────────

export default function VoiceLanguageSpeakerSelector({
  currentConfig,
  onConfigChange,
  onClose,
  compact = false,
}: Props) {
  const [languages, setLanguages] = useState<LanguageInfo[]>([])
  const [speakers, setSpeakers] = useState<Record<string, SpeakerInfo[]>>({})
  const [selectedLang, setSelectedLang] = useState(currentConfig.language || 'en')
  const [selectedSpeaker, setSelectedSpeaker] = useState(currentConfig.speakerId || 'en_priya')
  const [selectedEmotion, setSelectedEmotion] = useState(currentConfig.emotion || 'neutral')
  const [speed, setSpeed] = useState(currentConfig.speed || 0.95)
  const [pitch, setPitch] = useState(currentConfig.pitch || 0.0)
  const [autoPlay, setAutoPlay] = useState(currentConfig.autoPlay || false)
  const [activeTab, setActiveTab] = useState<'language' | 'speaker' | 'emotion' | 'settings'>('language')
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [loading, setLoading] = useState(true)

  // ─── Load Data ────────────────────────────────────────────────────

  useEffect(() => {
    loadVoiceData()
  }, [])

  const loadVoiceData = async () => {
    try {
      const [langRes, speakerRes] = await Promise.all([
        apiFetch('/api/voice/multilingual/languages').then(r => r.ok ? r.json() : null),
        apiFetch('/api/voice/multilingual/speakers').then(r => r.ok ? r.json() : null),
      ])

      if (langRes?.languages) {
        setLanguages(langRes.languages)
      } else {
        setLanguages(FALLBACK_LANGUAGES)
      }
      if (speakerRes?.speakers) {
        setSpeakers(speakerRes.speakers)
      } else {
        setSpeakers(FALLBACK_SPEAKERS)
      }
    } catch {
      // API unavailable - use fallback data for offline support
      setLanguages(FALLBACK_LANGUAGES)
      setSpeakers(FALLBACK_SPEAKERS)
    } finally {
      setLoading(false)
    }
  }

  // ─── Config Updates ───────────────────────────────────────────────

  const updateConfig = useCallback((updates: Partial<VoiceConfig>) => {
    const newConfig = {
      language: selectedLang,
      speakerId: selectedSpeaker,
      emotion: selectedEmotion,
      speed,
      pitch,
      autoPlay,
      ...updates,
    }
    onConfigChange(newConfig)
  }, [selectedLang, selectedSpeaker, selectedEmotion, speed, pitch, autoPlay, onConfigChange])

  const handleLanguageSelect = (langCode: string) => {
    setSelectedLang(langCode)
    // Auto-select first speaker for language
    const langSpeakers = speakers[langCode] || []
    if (langSpeakers.length > 0) {
      setSelectedSpeaker(langSpeakers[0].id)
      updateConfig({ language: langCode, speakerId: langSpeakers[0].id })
    } else {
      updateConfig({ language: langCode })
    }
    setActiveTab('speaker')
  }

  const handleSpeakerSelect = (speakerId: string) => {
    setSelectedSpeaker(speakerId)
    updateConfig({ speakerId })
  }

  const handleEmotionSelect = (emotionId: string) => {
    setSelectedEmotion(emotionId)
    updateConfig({ emotion: emotionId })
  }

  // ─── Preview Voice ────────────────────────────────────────────────

  const previewSpeaker = async (speakerId: string) => {
    if (isPreviewPlaying) return
    setIsPreviewPlaying(true)

    try {
      const speaker = Object.values(speakers).flat().find(s => s.id === speakerId)
      if (!speaker) {
        setIsPreviewPlaying(false)
        return
      }

      const response = await apiFetch('/api/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: speaker.preview_text || `Hello, I am ${speaker.display_name}. I'm here to be your companion.`,
          language: speaker.language,
          voice_type: 'friendly',
          speed: speaker.default_speed,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const audio = new Audio(url)
        audio.onended = () => {
          setIsPreviewPlaying(false)
          URL.revokeObjectURL(url)
        }
        audio.onerror = () => {
          setIsPreviewPlaying(false)
          URL.revokeObjectURL(url)
        }
        await audio.play()
      } else {
        setIsPreviewPlaying(false)
      }
    } catch {
      setIsPreviewPlaying(false)
    }
  }

  // ─── Current Speaker Info ─────────────────────────────────────────

  const currentSpeakerInfo = Object.values(speakers)
    .flat()
    .find(s => s.id === selectedSpeaker)

  const currentLangSpeakers = speakers[selectedLang] || []

  // ─── Render ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent" />
      </div>
    )
  }

  return (
    <div className={`rounded-2xl backdrop-blur-xl bg-white/5 border border-white/10 ${compact ? 'p-4' : 'p-6'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white">Voice Settings</h3>
          <p className="text-sm text-white/50 mt-1">
            {currentSpeakerInfo
              ? `${currentSpeakerInfo.display_name} - ${currentSpeakerInfo.description}`
              : 'Choose your companion voice'}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Close voice settings"
          >
            <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-white/5 mb-6">
        {(['language', 'speaker', 'emotion', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-purple-500/30 text-purple-300 shadow-lg shadow-purple-500/10'
                : 'text-white/50 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {tab === 'language' && 'Language'}
            {tab === 'speaker' && 'Speaker'}
            {tab === 'emotion' && 'Emotion'}
            {tab === 'settings' && 'Settings'}
          </button>
        ))}
      </div>

      {/* Language Tab */}
      {activeTab === 'language' && (
        <div className="space-y-6">
          {LANGUAGE_GROUPS.map(group => (
            <div key={group.label}>
              <h4 className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                {group.label}
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {group.languages.map(langCode => {
                  const lang = languages.find(l => l.code === langCode)
                  if (!lang) return null
                  const isSelected = selectedLang === langCode
                  return (
                    <button
                      key={langCode}
                      onClick={() => handleLanguageSelect(langCode)}
                      className={`flex items-center gap-2 p-3 rounded-xl text-left transition-all ${
                        isSelected
                          ? 'bg-purple-500/20 border border-purple-400/30 ring-1 ring-purple-400/20'
                          : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                      }`}
                    >
                      <span className="text-lg">{lang.flag_emoji}</span>
                      <div className="min-w-0">
                        <div className={`text-sm font-medium truncate ${isSelected ? 'text-purple-300' : 'text-white/80'}`}>
                          {lang.native_name}
                        </div>
                        <div className="text-xs text-white/40">{lang.name}</div>
                      </div>
                      {lang.gita_available && (
                        <span className="ml-auto text-[10px] text-amber-400/70" title="Gita available">
                          OM
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Speaker Tab */}
      {activeTab === 'speaker' && (
        <div className="space-y-3">
          {currentLangSpeakers.length === 0 ? (
            <div className="text-center py-8 text-white/40">
              <p>No speakers available for this language yet.</p>
              <p className="text-sm mt-1">Using default voice synthesis.</p>
            </div>
          ) : (
            currentLangSpeakers.map(speaker => {
              const isSelected = selectedSpeaker === speaker.id
              return (
                <div
                  key={speaker.id}
                  onClick={() => handleSpeakerSelect(speaker.id)}
                  className={`p-4 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 ring-1 ring-purple-400/20'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold"
                      style={{ backgroundColor: speaker.avatar_color + '30', borderColor: speaker.avatar_color, borderWidth: '2px' }}
                    >
                      {speaker.display_name.charAt(0)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`font-semibold ${isSelected ? 'text-purple-300' : 'text-white/90'}`}>
                          {speaker.display_name}
                        </span>
                        {speaker.is_premium && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-500/20 text-amber-400 border border-amber-400/30">
                            PREMIUM
                          </span>
                        )}
                        <span className="text-xs text-white/30 capitalize">{speaker.gender}</span>
                      </div>
                      <p className="text-sm text-white/50 mt-0.5">{speaker.description}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {speaker.best_for.slice(0, 3).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-[10px] rounded-full bg-white/5 text-white/40 border border-white/5"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Preview Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        previewSpeaker(speaker.id)
                      }}
                      disabled={isPreviewPlaying}
                      className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors flex-shrink-0"
                      aria-label={`Preview ${speaker.display_name} voice`}
                    >
                      {isPreviewPlaying ? (
                        <svg className="w-5 h-5 text-purple-400 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15V7l6 5-6 5z"/>
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-white/50" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                    </button>
                  </div>

                  {/* Quality Score */}
                  {isSelected && (
                    <div className="mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/40">Quality Score</span>
                        <div className="flex items-center gap-1">
                          <div className="w-20 h-1.5 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{ width: `${(speaker.quality_score / 10) * 100}%` }}
                            />
                          </div>
                          <span className="text-purple-300 font-mono">{speaker.quality_score}</span>
                        </div>
                      </div>
                      <p className="text-xs text-white/30 mt-2 italic">&quot;{speaker.personality}&quot;</p>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}

      {/* Emotion Tab */}
      {activeTab === 'emotion' && (
        <div className="space-y-4">
          <p className="text-sm text-white/40">
            How should KIAAN express the voice? This affects tone, pace, and delivery.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {EMOTIONS.map(emotion => {
              const isSelected = selectedEmotion === emotion.id
              return (
                <button
                  key={emotion.id}
                  onClick={() => handleEmotionSelect(emotion.id)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    isSelected
                      ? 'border-2 shadow-lg'
                      : 'bg-white/5 border border-white/5 hover:bg-white/10'
                  }`}
                  style={isSelected ? {
                    backgroundColor: emotion.color + '15',
                    borderColor: emotion.color + '50',
                    boxShadow: `0 4px 20px ${emotion.color}15`,
                  } : undefined}
                >
                  <span className="text-2xl">{emotion.icon}</span>
                  <span className={`text-sm font-medium ${isSelected ? 'text-white' : 'text-white/60'}`}>
                    {emotion.label}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Speed Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-white/60">Speaking Speed</label>
              <span className="text-sm font-mono text-purple-300">{speed.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.5"
              step="0.05"
              value={speed}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                setSpeed(val)
                updateConfig({ speed: val })
              }}
              className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-white/30 mt-1">
              <span>Slow</span>
              <span>Normal</span>
              <span>Fast</span>
            </div>
          </div>

          {/* Pitch Slider */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm text-white/60">Voice Pitch</label>
              <span className="text-sm font-mono text-purple-300">{pitch > 0 ? '+' : ''}{pitch.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min="-5"
              max="5"
              step="0.5"
              value={pitch}
              onChange={(e) => {
                const val = parseFloat(e.target.value)
                setPitch(val)
                updateConfig({ pitch: val })
              }}
              className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-white/30 mt-1">
              <span>Deep</span>
              <span>Natural</span>
              <span>High</span>
            </div>
          </div>

          {/* Auto Play Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-white/5">
            <div>
              <div className="text-sm text-white/80">Auto-play Responses</div>
              <div className="text-xs text-white/40 mt-0.5">Automatically speak KIAAN&apos;s replies</div>
            </div>
            <button
              onClick={() => {
                setAutoPlay(!autoPlay)
                updateConfig({ autoPlay: !autoPlay })
              }}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                autoPlay ? 'bg-purple-500' : 'bg-white/20'
              }`}
              role="switch"
              aria-checked={autoPlay}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                  autoPlay ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Current Selection Summary */}
      {!compact && currentSpeakerInfo && (
        <div className="mt-6 pt-4 border-t border-white/5">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/10">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ backgroundColor: currentSpeakerInfo.avatar_color + '30' }}
            >
              {currentSpeakerInfo.display_name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white/80 truncate">
                <span className="font-medium">{currentSpeakerInfo.display_name}</span>
                <span className="text-white/40 mx-1">&middot;</span>
                <span className="text-white/40 capitalize">{selectedEmotion} tone</span>
                <span className="text-white/40 mx-1">&middot;</span>
                <span className="text-white/40">{speed.toFixed(1)}x</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
