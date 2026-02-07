/**
 * VoiceSelectorPanel - ElevenLabs-inspired Voice Picker
 *
 * A premium slide-out panel for selecting named voice speakers.
 * Shows voice cards with personality descriptions, language badges,
 * and live audio preview. Supports filtering by language and category.
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  VOICE_SPEAKERS,
  VOICE_LANGUAGES,
  type VoiceSpeaker,
  type VoiceLanguage,
  type VoiceCategory,
} from '@/utils/voice/voiceCatalog'

interface VoiceSelectorPanelProps {
  isOpen: boolean
  onClose: () => void
  selectedVoiceId: string
  onSelectVoice: (voice: VoiceSpeaker) => void
  onPreviewVoice: (voice: VoiceSpeaker) => void
  isPreviewPlaying: boolean
  previewingVoiceId: string | null
  selectedLanguage: VoiceLanguage
  onSelectLanguage: (lang: VoiceLanguage) => void
}

const CATEGORY_LABELS: Record<VoiceCategory, { label: string; icon: string }> = {
  conversational: { label: 'Conversational', icon: '💬' },
  meditation: { label: 'Meditation', icon: '🧘' },
  narration: { label: 'Narration', icon: '📖' },
  sacred: { label: 'Sacred', icon: '🕉️' },
  energetic: { label: 'Energetic', icon: '⚡' },
}

export default function VoiceSelectorPanel({
  isOpen,
  onClose,
  selectedVoiceId,
  onSelectVoice,
  onPreviewVoice,
  isPreviewPlaying,
  previewingVoiceId,
  selectedLanguage,
  onSelectLanguage,
}: VoiceSelectorPanelProps) {
  const [filterCategory, setFilterCategory] = useState<VoiceCategory | 'all'>('all')
  const [filterGender, setFilterGender] = useState<'all' | 'female' | 'male'>('all')

  const filteredVoices = useMemo(() => {
    return VOICE_SPEAKERS.filter(v => {
      if (filterCategory !== 'all' && v.category !== filterCategory) return false
      if (filterGender !== 'all' && v.gender !== filterGender) return false
      return true
    })
  }, [filterCategory, filterGender])

  // Group by: voices that support selected language first, then others
  const sortedVoices = useMemo(() => {
    const supportsLang = filteredVoices.filter(v => v.languages.includes(selectedLanguage))
    const others = filteredVoices.filter(v => !v.languages.includes(selectedLanguage))
    return { supportsLang, others }
  }, [filteredVoices, selectedLanguage])

  const handleSelect = useCallback((voice: VoiceSpeaker) => {
    onSelectVoice(voice)
  }, [onSelectVoice])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed top-0 right-0 h-full w-full max-w-md z-50 bg-gradient-to-b from-[#0a0a12] to-[#0d0d18] border-l border-white/10 shadow-2xl overflow-hidden flex flex-col"
        style={{ animation: 'slideInRight 0.3s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
          <div>
            <h2 className="text-base font-semibold text-white/90">Choose Voice</h2>
            <p className="text-[11px] text-white/40 mt-0.5">Select the voice that speaks to your soul</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white/80 transition-colors"
            aria-label="Close"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Language Selector */}
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <p className="text-[10px] text-white/30 uppercase tracking-wider font-medium mb-2">Language</p>
          <div className="flex gap-1.5 flex-wrap">
            {VOICE_LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => onSelectLanguage(lang.code)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all ${
                  selectedLanguage === lang.code
                    ? 'bg-mv-aurora/20 text-mv-aurora border border-mv-aurora/30 shadow-sm shadow-mv-aurora/10'
                    : 'bg-white/[0.04] text-white/45 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white/60'
                }`}
              >
                <span className="mr-1">{lang.flag}</span>
                {lang.name}
              </button>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="px-5 py-2.5 flex items-center gap-3 border-b border-white/[0.04]">
          <div className="flex gap-1">
            {(['all', 'female', 'male'] as const).map(g => (
              <button
                key={g}
                onClick={() => setFilterGender(g)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  filterGender === g
                    ? 'bg-mv-ocean/20 text-mv-ocean border border-mv-ocean/30'
                    : 'bg-white/[0.03] text-white/35 border border-white/[0.06] hover:bg-white/[0.06]'
                }`}
              >
                {g === 'all' ? 'All' : g === 'female' ? '♀ Female' : '♂ Male'}
              </button>
            ))}
          </div>
          <div className="w-px h-4 bg-white/[0.06]" />
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                filterCategory === 'all'
                  ? 'bg-mv-sunrise/20 text-mv-sunrise border border-mv-sunrise/30'
                  : 'bg-white/[0.03] text-white/35 border border-white/[0.06] hover:bg-white/[0.06]'
              }`}
            >
              All
            </button>
            {(Object.entries(CATEGORY_LABELS) as [VoiceCategory, { label: string; icon: string }][]).map(([cat, { label, icon }]) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all ${
                  filterCategory === cat
                    ? 'bg-mv-sunrise/20 text-mv-sunrise border border-mv-sunrise/30'
                    : 'bg-white/[0.03] text-white/35 border border-white/[0.06] hover:bg-white/[0.06]'
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </div>

        {/* Voice Cards */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
          {/* Voices that support selected language */}
          {sortedVoices.supportsLang.length > 0 && (
            <>
              {sortedVoices.supportsLang.map(voice => (
                <VoiceCard
                  key={voice.id}
                  voice={voice}
                  isSelected={selectedVoiceId === voice.id}
                  isPreviewing={previewingVoiceId === voice.id && isPreviewPlaying}
                  onSelect={() => handleSelect(voice)}
                  onPreview={() => onPreviewVoice(voice)}
                  selectedLanguage={selectedLanguage}
                />
              ))}
            </>
          )}

          {/* Voices in other languages */}
          {sortedVoices.others.length > 0 && (
            <>
              {sortedVoices.supportsLang.length > 0 && (
                <div className="flex items-center gap-2 pt-3 pb-1">
                  <div className="flex-1 h-px bg-white/[0.06]" />
                  <span className="text-[10px] text-white/25 uppercase tracking-wider">Other voices</span>
                  <div className="flex-1 h-px bg-white/[0.06]" />
                </div>
              )}
              {sortedVoices.others.map(voice => (
                <VoiceCard
                  key={voice.id}
                  voice={voice}
                  isSelected={selectedVoiceId === voice.id}
                  isPreviewing={previewingVoiceId === voice.id && isPreviewPlaying}
                  onSelect={() => handleSelect(voice)}
                  onPreview={() => onPreviewVoice(voice)}
                  selectedLanguage={selectedLanguage}
                  dimmed
                />
              ))}
            </>
          )}

          {filteredVoices.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-white/30">No voices match your filters</p>
              <button
                onClick={() => { setFilterCategory('all'); setFilterGender('all') }}
                className="mt-2 text-xs text-mv-aurora hover:text-mv-aurora/80 transition-colors"
              >
                Clear filters
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-white/[0.06] bg-black/20">
          <div className="flex items-center justify-between">
            <div className="text-[11px] text-white/30">
              {VOICE_SPEAKERS.length} voices available
            </div>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-full text-xs font-medium bg-mv-aurora/20 text-mv-aurora border border-mv-aurora/30 hover:bg-mv-aurora/30 transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </>
  )
}

// ─── Voice Card Component ─────────────────────────────────────────────────────

function VoiceCard({
  voice,
  isSelected,
  isPreviewing,
  onSelect,
  onPreview,
  selectedLanguage,
  dimmed,
}: {
  voice: VoiceSpeaker
  isSelected: boolean
  isPreviewing: boolean
  onSelect: () => void
  onPreview: () => void
  selectedLanguage: VoiceLanguage
  dimmed?: boolean
}) {
  return (
    <div
      className={`relative rounded-2xl border transition-all cursor-pointer group ${
        isSelected
          ? 'bg-mv-aurora/[0.08] border-mv-aurora/25 shadow-sm shadow-mv-aurora/5'
          : 'bg-white/[0.02] border-white/[0.06] hover:bg-white/[0.04] hover:border-white/[0.1]'
      } ${dimmed ? 'opacity-50' : ''}`}
      onClick={onSelect}
    >
      <div className="px-4 py-3">
        {/* Top row: name + badges */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            {/* Avatar circle */}
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
              isSelected
                ? 'bg-mv-aurora/20 text-mv-aurora'
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
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="text-mv-aurora flex-shrink-0">
                    <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
                {voice.premium && (
                  <span className="px-1.5 py-0 rounded text-[8px] font-bold uppercase tracking-wider bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-400/80 border border-amber-500/20">
                    HD
                  </span>
                )}
              </div>
              {voice.accent && (
                <span className="text-[10px] text-white/30">{voice.accent}</span>
              )}
            </div>
          </div>

          {/* Preview button */}
          <button
            onClick={(e) => { e.stopPropagation(); onPreview() }}
            className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
              isPreviewing
                ? 'bg-mv-sunrise/20 text-mv-sunrise animate-pulse'
                : 'bg-white/[0.04] text-white/40 hover:bg-white/[0.08] hover:text-white/60 group-hover:bg-white/[0.06]'
            }`}
            aria-label={isPreviewing ? 'Playing preview' : 'Preview voice'}
          >
            {isPreviewing ? (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            )}
          </button>
        </div>

        {/* Description */}
        <p className="text-[11px] text-white/45 leading-relaxed mt-1.5 line-clamp-2">
          {voice.description}
        </p>

        {/* Bottom row: language badges + quality bars */}
        <div className="flex items-center justify-between mt-2.5">
          <div className="flex gap-1 flex-wrap">
            {voice.languages.map(lang => {
              const langInfo = VOICE_LANGUAGES.find(l => l.code === lang)
              if (!langInfo) return null
              return (
                <span
                  key={lang}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium ${
                    lang === selectedLanguage
                      ? 'bg-mv-ocean/15 text-mv-ocean/80 border border-mv-ocean/20'
                      : 'bg-white/[0.03] text-white/30 border border-white/[0.04]'
                  }`}
                >
                  {langInfo.flag} {langInfo.name}
                </span>
              )
            })}
          </div>

          {/* Quality indicators */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" title={`Warmth: ${Math.round(voice.warmth * 100)}%`}>
              <span className="text-[8px] text-white/20">W</span>
              <div className="w-8 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-amber-500/40 to-orange-500/40" style={{ width: `${voice.warmth * 100}%` }} />
              </div>
            </div>
            <div className="flex items-center gap-1" title={`Clarity: ${Math.round(voice.clarity * 100)}%`}>
              <span className="text-[8px] text-white/20">C</span>
              <div className="w-8 h-1 rounded-full bg-white/[0.06] overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500/40 to-blue-500/40" style={{ width: `${voice.clarity * 100}%` }} />
              </div>
            </div>
          </div>
        </div>

        {/* Category tag */}
        <div className="absolute top-3 right-14">
          <span className="text-[8px] text-white/20">
            {CATEGORY_LABELS[voice.category]?.icon}
          </span>
        </div>
      </div>
    </div>
  )
}
