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
      }
      if (speakerRes?.speakers) {
        setSpeakers(speakerRes.speakers)
      }
    } catch {
      // Use empty state - API may not be available
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
      if (!speaker) return

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
