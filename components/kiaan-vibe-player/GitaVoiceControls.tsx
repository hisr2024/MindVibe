'use client'

/**
 * GitaVoiceControls — Shared language + voice-style selector for Bhagavad
 * Gita playback. Used by the chapter page and the floating Vibe Player when
 * a Gita voice track is the current track.
 *
 * Kept self-contained (no extra deps) so it can be dropped into any surface
 * that plays Gita audio.
 */

import { SUPPORTED_LANGUAGES } from '@/lib/kiaan-vibe/gita'
import type { GitaVoiceStyle } from '@/lib/kiaan-vibe/gita-voice-tracks'

export const GITA_VOICE_STYLES: { id: GitaVoiceStyle; label: string; sanskrit: string; desc: string }[] = [
  { id: 'divine',   label: 'Divine',   sanskrit: 'दिव्य', desc: 'Sacred recitation' },
  { id: 'calm',     label: 'Calm',     sanskrit: 'शान्त', desc: 'Soothing pace' },
  { id: 'wisdom',   label: 'Wisdom',   sanskrit: 'ज्ञान', desc: 'Clear teaching' },
  { id: 'chanting', label: 'Chanting', sanskrit: 'मंत्र', desc: 'Vedic meter' },
]

interface GitaVoiceControlsProps {
  selectedLang: string
  onLangChange: (lang: string) => void
  selectedStyle: GitaVoiceStyle
  onStyleChange: (style: GitaVoiceStyle) => void
  /** compact = single-row layout for the sticky player bar */
  compact?: boolean
}

export function GitaVoiceControls({
  selectedLang,
  onLangChange,
  selectedStyle,
  onStyleChange,
  compact = false,
}: GitaVoiceControlsProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-nowrap overflow-x-auto no-scrollbar">
        <select
          value={selectedLang}
          onChange={e => onLangChange(e.target.value)}
          aria-label="Gita language"
          className="h-7 px-2 pr-6 rounded-lg text-[11px] bg-[#1a1a1f]/80 border border-[#d4a44c]/30 text-[#f5f0e8] outline-none cursor-pointer appearance-none"
        >
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
            <option key={code} value={code}>
              {info.flag} {info.nativeName}
            </option>
          ))}
        </select>
        {GITA_VOICE_STYLES.map(style => {
          const on = selectedStyle === style.id
          return (
            <button
              key={style.id}
              type="button"
              onClick={() => onStyleChange(style.id)}
              aria-pressed={on}
              className={`h-7 px-2.5 rounded-full text-[10px] font-medium whitespace-nowrap transition-all border ${
                on
                  ? 'bg-[#d4a44c]/20 border-[#d4a44c]/50 text-[#e8b54a]'
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {style.label}
            </button>
          )
        })}
      </div>
    )
  }

  // Full layout
  return (
    <div className="space-y-3">
      {/* Language */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-[#d4a44c] mb-1.5">
          Language
        </div>
        <select
          value={selectedLang}
          onChange={e => onLangChange(e.target.value)}
          aria-label="Select Gita language"
          className="w-full h-10 px-3 rounded-xl text-sm bg-white/5 border border-[#d4a44c]/25 text-white/90 outline-none cursor-pointer appearance-none"
        >
          {Object.entries(SUPPORTED_LANGUAGES).map(([code, info]) => (
            <option key={code} value={code}>
              {info.flag} {info.nativeName} — {info.name}
            </option>
          ))}
        </select>
      </div>

      {/* Voice style */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-[#d4a44c] mb-1.5">
          Voice Style
        </div>
        <div className="grid grid-cols-2 gap-2">
          {GITA_VOICE_STYLES.map(style => {
            const on = selectedStyle === style.id
            return (
              <button
                key={style.id}
                type="button"
                onClick={() => onStyleChange(style.id)}
                aria-pressed={on}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all border ${
                  on
                    ? 'bg-[#d4a44c]/15 border-[#d4a44c]/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#d4a44c] text-sm">{style.sanskrit}</span>
                    <span className={`text-xs font-medium ${on ? 'text-white' : 'text-white/80'}`}>
                      {style.label}
                    </span>
                  </div>
                  <div className="text-[10px] text-white/50 truncate">{style.desc}</div>
                </div>
                {on && (
                  <div className="w-2 h-2 rounded-full bg-[#d4a44c] flex-shrink-0 ml-2" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default GitaVoiceControls
