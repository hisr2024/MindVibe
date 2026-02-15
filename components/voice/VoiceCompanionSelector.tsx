'use client'

/**
 * VoiceCompanionSelector - Premium ElevenLabs-Inspired Voice Experience
 *
 * A world-class voice selection interface for the KIAAN Voice Companion.
 * Inspired by ElevenLabs' clean, premium design and Sarvam AI's Indian
 * language expertise.
 *
 * Features:
 * - Language selection with native script names and flag emojis
 * - Voice browsing with provider quality badges (ElevenLabs HD, Sarvam AI)
 * - Live audio preview for each voice
 * - Voice personality descriptions and use-case tags
 * - Warmth/clarity quality bars
 * - Emotion tone selection
 * - Speed and pitch fine-tuning
 * - Auto-play toggle
 * - Pronunciation quality indicator per language
 *
 * Design: Dark glass-morphism, smooth transitions, premium feel
 */

import { useCallback, useMemo, useState } from 'react'
import {
  VOICE_SPEAKERS,
  VOICE_LANGUAGES,
  type VoiceSpeaker,
  type VoiceLanguage,
  type VoiceProvider,
  getVoicesForLanguage,
  getBestVoiceForLanguage,
  getProviderDisplayInfo,
  saveVoiceSelection,
  saveLanguagePreference,
  getSavedVoice,
  getSavedLanguage,
} from '@/utils/voice/voiceCatalog'
import { apiFetch } from '@/lib/api'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface VoiceCompanionConfig {
  language: VoiceLanguage
  voiceId: string
  emotion: string
  speed: number
  pitch: number
  autoPlay: boolean
}

interface Props {
  currentConfig: VoiceCompanionConfig
  onConfigChange: (config: VoiceCompanionConfig) => void
  onClose?: () => void
}

// ─── Constants ──────────────────────────────────────────────────────────────

const LANGUAGE_GROUPS = [
  {
    label: 'Indian Languages',
    description: 'Powered by Sarvam AI + Bhashini AI with native pronunciation',
    provider: 'sarvam' as VoiceProvider,
    languages: ['hi', 'sa', 'ta', 'te', 'bn', 'mr', 'gu', 'kn', 'ml', 'pa', 'en-IN'] as VoiceLanguage[],
  },
  {
    label: 'International',
    description: 'Powered by ElevenLabs HD voices',
    provider: 'elevenlabs' as VoiceProvider,
    languages: ['en', 'es', 'fr', 'de', 'pt', 'ja', 'zh', 'ar'] as VoiceLanguage[],
  },
]

const EMOTION_TONES = [
  { id: 'neutral', label: 'Natural', description: 'Warm, conversational default', gradient: 'from-violet-500 to-indigo-500' },
  { id: 'warmth', label: 'Warmth', description: 'Extra caring and nurturing', gradient: 'from-amber-500 to-orange-500' },
  { id: 'calm', label: 'Calm', description: 'Peaceful and meditative', gradient: 'from-emerald-500 to-teal-500' },
  { id: 'wisdom', label: 'Wisdom', description: 'Measured and authoritative', gradient: 'from-indigo-500 to-purple-500' },
  { id: 'compassion', label: 'Compassion', description: 'Deep empathy and care', gradient: 'from-pink-500 to-rose-500' },
  { id: 'encouragement', label: 'Uplift', description: 'Energizing and positive', gradient: 'from-yellow-500 to-amber-500' },
]

// ─── Component ──────────────────────────────────────────────────────────────

export default function VoiceCompanionSelector({
  currentConfig,
  onConfigChange,
  onClose,
}: Props) {
  const [selectedLang, setSelectedLang] = useState<VoiceLanguage>(
    (currentConfig.language as VoiceLanguage) || getSavedLanguage()
  )
  const [selectedVoiceId, setSelectedVoiceId] = useState(
    currentConfig.voiceId || getSavedVoice().id
  )
  const [selectedEmotion, setSelectedEmotion] = useState(currentConfig.emotion || 'neutral')
  const [speed, setSpeed] = useState(currentConfig.speed || 0.95)
  const [pitch, setPitch] = useState(currentConfig.pitch || 0.0)
  const [autoPlay, setAutoPlay] = useState(currentConfig.autoPlay ?? true)
  const [activeSection, setActiveSection] = useState<'language' | 'voice' | 'tone' | 'settings'>('language')
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false)
  const [previewingVoiceId, setPreviewingVoiceId] = useState<string | null>(null)
  const [filterGender, setFilterGender] = useState<'all' | 'female' | 'male'>('all')

  // Available voices for the selected language
  const availableVoices = useMemo(() => {
    const voices = getVoicesForLanguage(selectedLang)
    if (filterGender === 'all') return voices
    return voices.filter(v => v.gender === filterGender)
  }, [selectedLang, filterGender])

  // Selected voice info
  const selectedVoice = useMemo(() => {
    return VOICE_SPEAKERS.find(v => v.id === selectedVoiceId)
  }, [selectedVoiceId])

  // Language info for selected language
  const selectedLangInfo = useMemo(() => {
    return VOICE_LANGUAGES.find(l => l.code === selectedLang)
  }, [selectedLang])

  // ─── Config Change Handler ───────────────────────────────────────────

  const emitConfig = useCallback((updates: Partial<VoiceCompanionConfig>) => {
    const newConfig: VoiceCompanionConfig = {
      language: selectedLang,
      voiceId: selectedVoiceId,
      emotion: selectedEmotion,
      speed,
      pitch,
      autoPlay,
      ...updates,
    }
    onConfigChange(newConfig)
  }, [selectedLang, selectedVoiceId, selectedEmotion, speed, pitch, autoPlay, onConfigChange])

  // ─── Language Selection ──────────────────────────────────────────────

  const handleLanguageSelect = useCallback((lang: VoiceLanguage) => {
    setSelectedLang(lang)
    saveLanguagePreference(lang)

    // Auto-select best voice for the new language
    const bestVoice = getBestVoiceForLanguage(lang)
    setSelectedVoiceId(bestVoice.id)
    saveVoiceSelection(bestVoice.id)

    emitConfig({ language: lang, voiceId: bestVoice.id })
    setActiveSection('voice')
  }, [emitConfig])

  // ─── Voice Selection ─────────────────────────────────────────────────

  const handleVoiceSelect = useCallback((voice: VoiceSpeaker) => {
    setSelectedVoiceId(voice.id)
    saveVoiceSelection(voice.id)
    emitConfig({ voiceId: voice.id })
  }, [emitConfig])

  // ─── Voice Preview ───────────────────────────────────────────────────

  const handlePreview = useCallback(async (voice: VoiceSpeaker) => {
    if (isPreviewPlaying) return
    setIsPreviewPlaying(true)
    setPreviewingVoiceId(voice.id)

    try {
      const response = await apiFetch('/api/companion/voice/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: voice.previewText,
          mood: 'neutral',
          voice_id: voice.id,
          language: voice.primaryLanguage,
        }),
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType?.includes('audio')) {
          const blob = await response.blob()
          const url = URL.createObjectURL(blob)
          const audio = new Audio(url)
          audio.onended = () => {
            setIsPreviewPlaying(false)
            setPreviewingVoiceId(null)
            URL.revokeObjectURL(url)
          }
          audio.onerror = () => {
            setIsPreviewPlaying(false)
            setPreviewingVoiceId(null)
            URL.revokeObjectURL(url)
          }
          await audio.play()
          return
        }
      }

      // Fallback to browser TTS preview with language-matched voice
      if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(voice.previewText)
        utterance.rate = voice.browserConfig.rate
        utterance.pitch = voice.browserConfig.pitch
        // Set language so browser picks the right accent/voice
        const langMap: Record<string, string> = {
          en: 'en-IN', hi: 'hi-IN', sa: 'hi-IN', ta: 'ta-IN', te: 'te-IN',
          bn: 'bn-IN', mr: 'mr-IN', gu: 'gu-IN', kn: 'kn-IN', ml: 'ml-IN',
          pa: 'pa-IN', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', pt: 'pt-BR',
          ja: 'ja-JP', zh: 'zh-CN',
        }
        utterance.lang = langMap[voice.primaryLanguage] || voice.primaryLanguage
        // Try to match a voice from the browser voices for this language
        const voices = window.speechSynthesis.getVoices()
        const langPrefix = (langMap[voice.primaryLanguage] || voice.primaryLanguage).split('-')[0]
        const matchedVoice = voices.find(v => v.lang.startsWith(langPrefix))
        if (matchedVoice) utterance.voice = matchedVoice
        utterance.onend = () => {
          setIsPreviewPlaying(false)
          setPreviewingVoiceId(null)
        }
        utterance.onerror = () => {
          setIsPreviewPlaying(false)
          setPreviewingVoiceId(null)
        }
        window.speechSynthesis.speak(utterance)
      } else {
        setIsPreviewPlaying(false)
        setPreviewingVoiceId(null)
      }
    } catch {
      setIsPreviewPlaying(false)
      setPreviewingVoiceId(null)
    }
  }, [isPreviewPlaying])

  // ─── Emotion Selection ───────────────────────────────────────────────

  const handleEmotionSelect = useCallback((emotionId: string) => {
    setSelectedEmotion(emotionId)
    emitConfig({ emotion: emotionId })
  }, [emitConfig])

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl backdrop-blur-xl bg-gradient-to-b from-white/[0.07] to-white/[0.02] border border-white/10 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-white/90">Voice & Language</h3>
          <p className="text-[11px] text-white/40 mt-0.5">
            {selectedVoice
              ? `${selectedVoice.name} \u00B7 ${selectedLangInfo?.nativeName || selectedLang}`
              : 'Choose your companion voice'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedVoice?.poweredBy && (
            <span className={`text-[9px] px-2 py-0.5 rounded-full border ${
              selectedVoice.poweredBy === 'elevenlabs'
                ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                : selectedVoice.poweredBy === 'sarvam'
                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                : selectedVoice.poweredBy === 'bhashini'
                ? 'border-sky-500/20 bg-sky-500/10 text-sky-400'
                : 'border-white/10 bg-white/5 text-white/40'
            }`}>
              {getProviderDisplayInfo(selectedVoice.poweredBy).label}
            </span>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white/70 transition-colors"
              aria-label="Close"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          )}
        </div>
      </div>

      {/* Section Nav */}
      <div className="flex border-b border-white/[0.04]">
        {([
          { key: 'language' as const, label: 'Language', icon: 'M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129' },
          { key: 'voice' as const, label: 'Voice', icon: 'M15.536 8.464a5 5 0 010 7.072M18.364 5.636a9 9 0 010 12.728M11 5L6 9H2v6h4l5 4V5z' },
          { key: 'tone' as const, label: 'Tone', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
          { key: 'settings' as const, label: 'Settings', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4' },
        ]).map(({ key, label, icon }) => (
          <button
            key={key}
            onClick={() => setActiveSection(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-medium transition-all border-b-2 ${
              activeSection === key
                ? 'border-amber-500/70 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-white/35 hover:text-white/55 hover:bg-white/[0.02]'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d={icon} />
            </svg>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
        {/* ─── Language Section ──────────────────────────────────────── */}
        {activeSection === 'language' && (
          <div className="p-4 space-y-5">
            {LANGUAGE_GROUPS.map(group => (
              <div key={group.label}>
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h4 className="text-[11px] font-semibold text-white/45 uppercase tracking-wider">
                      {group.label}
                    </h4>
                    <p className="text-[9px] text-white/25 mt-0.5">{group.description}</p>
                  </div>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${
                    group.provider === 'sarvam'
                      ? 'border-emerald-500/20 text-emerald-400/60 bg-emerald-500/5'
                      : 'border-amber-500/20 text-amber-400/60 bg-amber-500/5'
                  }`}>
                    {group.provider === 'sarvam' ? 'Sarvam + Bhashini' : 'ElevenLabs'}
                  </span>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                  {group.languages.map(langCode => {
                    const lang = VOICE_LANGUAGES.find(l => l.code === langCode)
                    if (!lang) return null
                    const isSelected = selectedLang === langCode
                    const voiceCount = getVoicesForLanguage(langCode).length
                    return (
                      <button
                        key={langCode}
                        onClick={() => handleLanguageSelect(langCode)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-xl transition-all ${
                          isSelected
                            ? 'bg-amber-500/15 border border-amber-400/30 ring-1 ring-amber-400/15 shadow-sm shadow-amber-500/10'
                            : 'bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06] hover:border-white/[0.1]'
                        }`}
                      >
                        <span className="text-lg leading-none">{lang.flag}</span>
                        <span className={`text-[10px] font-medium leading-tight text-center ${
                          isSelected ? 'text-amber-300' : 'text-white/70'
                        }`}>
                          {lang.nativeName}
                        </span>
                        <span className="text-[8px] text-white/30">{voiceCount} voice{voiceCount !== 1 ? 's' : ''}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ─── Voice Section ─────────────────────────────────────────── */}
        {activeSection === 'voice' && (
          <div className="p-4">
            {/* Gender filter */}
            <div className="flex items-center gap-2 mb-3">
              <span className="text-[10px] text-white/30">Filter:</span>
              {(['all', 'female', 'male'] as const).map(g => (
                <button
                  key={g}
                  onClick={() => setFilterGender(g)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-medium transition-all ${
                    filterGender === g
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-400/25'
                      : 'bg-white/[0.03] text-white/35 border border-white/[0.06] hover:bg-white/[0.06]'
                  }`}
                >
                  {g === 'all' ? 'All' : g === 'female' ? 'Female' : 'Male'}
                </button>
              ))}
              <div className="flex-1" />
              <span className="text-[9px] text-white/25">
                {availableVoices.length} voice{availableVoices.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Voice list */}
            <div className="space-y-2">
              {availableVoices.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-white/30">No voices match your filters</p>
                  <button
                    onClick={() => setFilterGender('all')}
                    className="mt-2 text-xs text-amber-400/70 hover:text-amber-400 transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                availableVoices.map(voice => {
                  const isSelected = selectedVoiceId === voice.id
                  const isPreviewing = previewingVoiceId === voice.id && isPreviewPlaying
                  const providerInfo = getProviderDisplayInfo(voice.poweredBy)

                  return (
                    <div
                      key={voice.id}
                      onClick={() => handleVoiceSelect(voice)}
                      className={`relative rounded-xl border cursor-pointer transition-all group ${
                        isSelected
                          ? 'bg-amber-500/[0.08] border-amber-400/25 shadow-sm shadow-amber-500/5'
                          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
                      }`}
                    >
                      <div className="px-3.5 py-3">
                        <div className="flex items-start justify-between gap-2">
                          {/* Avatar + name */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-400/30'
                                : voice.gender === 'female'
                                  ? 'bg-pink-500/10 text-pink-400/70'
                                  : 'bg-blue-500/10 text-blue-400/70'
                            }`}>
                              {voice.name[0]}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm font-semibold text-white/90">{voice.name}</span>
                                {isSelected && (
                                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="text-amber-400 flex-shrink-0">
                                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                                {voice.premium && (
                                  <span className="px-1.5 py-0 rounded text-[7px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-400/70 border border-amber-500/15">
                                    HD
                                  </span>
                                )}
                              </div>
                              {voice.accent && (
                                <span className="text-[9px] text-white/25">{voice.accent}</span>
                              )}
                            </div>
                          </div>

                          {/* Preview button */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePreview(voice) }}
                            disabled={isPreviewPlaying}
                            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                              isPreviewing
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-white/[0.04] text-white/35 hover:bg-white/[0.08] hover:text-white/55 group-hover:bg-white/[0.06]'
                            }`}
                            aria-label={isPreviewing ? 'Playing preview' : `Preview ${voice.name}`}
                          >
                            {isPreviewing ? (
                              <div className="flex items-center gap-[2px]">
                                {[0, 1, 2].map(i => (
                                  <div key={i} className="w-[3px] rounded-full bg-amber-400" style={{
                                    height: `${8 + Math.random() * 8}px`,
                                    animation: `voiceBarPulse 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
                                  }} />
                                ))}
                              </div>
                            ) : (
                              <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            )}
                          </button>
                        </div>

                        {/* Description */}
                        <p className="text-[10px] text-white/40 leading-relaxed mt-1.5 line-clamp-2 ml-[46px]">
                          {voice.description}
                        </p>

                        {/* Bottom row: provider + quality bars */}
                        <div className="flex items-center justify-between mt-2 ml-[46px]">
                          <span className={`text-[8px] px-1.5 py-0.5 rounded-full border ${
                            voice.poweredBy === 'elevenlabs'
                              ? 'border-amber-500/15 text-amber-400/50 bg-amber-500/5'
                              : voice.poweredBy === 'sarvam'
                              ? 'border-emerald-500/15 text-emerald-400/50 bg-emerald-500/5'
                              : voice.poweredBy === 'bhashini'
                              ? 'border-sky-500/15 text-sky-400/50 bg-sky-500/5'
                              : 'border-white/[0.06] text-white/25 bg-white/[0.02]'
                          }`}>
                            {providerInfo.label}
                          </span>

                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1" title={`Warmth: ${Math.round(voice.warmth * 100)}%`}>
                              <span className="text-[7px] text-white/15">Warmth</span>
                              <div className="w-10 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-amber-500/50 to-orange-500/50" style={{ width: `${voice.warmth * 100}%` }} />
                              </div>
                            </div>
                            <div className="flex items-center gap-1" title={`Clarity: ${Math.round(voice.clarity * 100)}%`}>
                              <span className="text-[7px] text-white/15">Clarity</span>
                              <div className="w-10 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500/50 to-blue-500/50" style={{ width: `${voice.clarity * 100}%` }} />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {/* ─── Tone Section ──────────────────────────────────────────── */}
        {activeSection === 'tone' && (
          <div className="p-4">
            <p className="text-[11px] text-white/35 mb-3">
              Set the emotional tone for how KIAAN speaks to you.
            </p>
            <div className="grid grid-cols-2 gap-2">
              {EMOTION_TONES.map(tone => {
                const isSelected = selectedEmotion === tone.id
                return (
                  <button
                    key={tone.id}
                    onClick={() => handleEmotionSelect(tone.id)}
                    className={`flex flex-col items-start p-3 rounded-xl transition-all text-left ${
                      isSelected
                        ? 'bg-white/[0.06] border border-amber-400/25 ring-1 ring-amber-400/10'
                        : 'bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-br ${tone.gradient} ${
                        isSelected ? 'ring-2 ring-white/20' : ''
                      }`} />
                      <span className={`text-xs font-medium ${isSelected ? 'text-amber-300' : 'text-white/70'}`}>
                        {tone.label}
                      </span>
                    </div>
                    <p className="text-[9px] text-white/30 mt-1 ml-[18px]">{tone.description}</p>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── Settings Section ──────────────────────────────────────── */}
        {activeSection === 'settings' && (
          <div className="p-4 space-y-5">
            {/* Speed */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-white/50 font-medium">Speaking Speed</label>
                <span className="text-[11px] font-mono text-amber-300/70">{speed.toFixed(2)}x</span>
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
                  emitConfig({ speed: val })
                }}
                className="w-full h-1.5 rounded-full appearance-none bg-white/[0.06] accent-amber-500"
              />
              <div className="flex justify-between text-[8px] text-white/20 mt-1">
                <span>Slower</span>
                <span>Natural</span>
                <span>Faster</span>
              </div>
            </div>

            {/* Pitch */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[11px] text-white/50 font-medium">Voice Pitch</label>
                <span className="text-[11px] font-mono text-amber-300/70">{pitch > 0 ? '+' : ''}{pitch.toFixed(1)}</span>
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
                  emitConfig({ pitch: val })
                }}
                className="w-full h-1.5 rounded-full appearance-none bg-white/[0.06] accent-amber-500"
              />
              <div className="flex justify-between text-[8px] text-white/20 mt-1">
                <span>Deeper</span>
                <span>Natural</span>
                <span>Higher</span>
              </div>
            </div>

            {/* Auto-play */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/[0.03] border border-white/[0.05]">
              <div>
                <div className="text-[11px] text-white/70 font-medium">Auto-play Responses</div>
                <div className="text-[9px] text-white/30 mt-0.5">Automatically speak KIAAN&apos;s replies aloud</div>
              </div>
              <button
                onClick={() => {
                  const next = !autoPlay
                  setAutoPlay(next)
                  emitConfig({ autoPlay: next })
                }}
                className={`relative w-10 h-5.5 rounded-full transition-colors ${
                  autoPlay ? 'bg-amber-500' : 'bg-white/15'
                }`}
                role="switch"
                aria-checked={autoPlay}
              >
                <span
                  className={`absolute top-[2px] left-[2px] w-4.5 h-4.5 rounded-full bg-white shadow-sm transition-transform ${
                    autoPlay ? 'translate-x-[18px]' : 'translate-x-0'
                  }`}
                  style={{ width: '18px', height: '18px' }}
                />
              </button>
            </div>

            {/* Provider Info */}
            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
              <p className="text-[10px] text-white/25 mb-2 font-medium uppercase tracking-wider">Voice Providers</p>
              <div className="space-y-1.5">
                {[
                  { name: 'ElevenLabs', quality: '10/10', desc: 'Most natural human-like voices', color: 'text-amber-400' },
                  { name: 'Sarvam AI', quality: '9.5/10', desc: 'Best Indian language pronunciation', color: 'text-emerald-400' },
                  { name: 'Bhashini AI', quality: '9/10', desc: 'Government of India, 22 Indian languages', color: 'text-sky-400' },
                ].map(p => (
                  <div key={p.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${p.color.replace('text-', 'bg-')}`} />
                      <span className={`text-[10px] font-medium ${p.color}`}>{p.name}</span>
                    </div>
                    <span className="text-[9px] text-white/20">{p.quality}</span>
                  </div>
                ))}
              </div>
              <p className="text-[8px] text-white/15 mt-2">
                KIAAN automatically selects the best available provider for your language.
                Indian languages: Sarvam AI &rarr; Bhashini AI &rarr; ElevenLabs.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer: Current Selection Summary */}
      {selectedVoice && (
        <div className="px-4 py-3 border-t border-white/[0.04] bg-black/20">
          <div className="flex items-center gap-2.5">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
              selectedVoice.poweredBy === 'elevenlabs'
                ? 'bg-amber-500/20 text-amber-400'
                : selectedVoice.poweredBy === 'sarvam'
                ? 'bg-emerald-500/20 text-emerald-400'
                : selectedVoice.poweredBy === 'bhashini'
                ? 'bg-sky-500/20 text-sky-400'
                : 'bg-white/10 text-white/40'
            }`}>
              {selectedVoice.name[0]}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="font-medium text-white/80">{selectedVoice.name}</span>
                <span className="text-white/20">&middot;</span>
                <span className="text-white/35">{selectedLangInfo?.nativeName}</span>
                <span className="text-white/20">&middot;</span>
                <span className="text-white/35 capitalize">{selectedEmotion}</span>
                <span className="text-white/20">&middot;</span>
                <span className="text-white/35">{speed.toFixed(1)}x</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style jsx global>{`
        @keyframes voiceBarPulse {
          from { height: 4px; }
          to { height: 14px; }
        }
      `}</style>
    </div>
  )
}
