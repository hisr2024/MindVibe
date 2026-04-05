/**
 * GitaVoiceSelector — Voice picker for 4 divine voices.
 *
 * Horizontal scroll of voice pills with persona descriptions.
 * Persists selected voice via the store.
 */

'use client'

import { motion } from 'framer-motion'
import { GITA_STATS } from '@/lib/kiaan-vibe/gita-library'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface GitaVoiceSelectorProps {
  selectedVoiceId: string
  onSelect: (voiceId: string) => void
  compact?: boolean
}

export function GitaVoiceSelector({
  selectedVoiceId,
  onSelect,
  compact = false,
}: GitaVoiceSelectorProps) {
  const { triggerHaptic } = useHapticFeedback()
  const voices = GITA_STATS.voices
  const selectedVoice = voices.find(v => v.id === selectedVoiceId) || voices[0]

  return (
    <div>
      {!compact && (
        <p className="text-[10px] text-[#6B6355] uppercase tracking-[0.1em] mb-2 font-[family-name:var(--font-ui)]">
          Listening voice
        </p>
      )}

      {/* Voice pills */}
      <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
        {voices.map(voice => {
          const isSelected = voice.id === selectedVoiceId
          return (
            <motion.button
              key={voice.id}
              onClick={() => { triggerHaptic('selection'); onSelect(voice.id) }}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] transition-all font-[family-name:var(--font-ui)]"
              style={{
                color: isSelected ? voice.color : '#B8AE98',
                backgroundColor: isSelected ? voice.color + '18' : 'transparent',
                border: isSelected
                  ? `1px solid ${voice.color}50`
                  : '1px solid rgba(212,160,23,0.15)',
                fontWeight: isSelected ? 500 : 400,
              }}
              whileTap={{ scale: 0.95 }}
            >
              {voice.name}
            </motion.button>
          )
        })}
      </div>

      {/* Description + speed note */}
      {!compact && (
        <div className="mt-2">
          <p className="text-[11px] text-[#B8AE98] font-[family-name:var(--font-scripture)] italic">
            {selectedVoice.description}
          </p>
          <p className="text-[10px] text-[#6B6355] mt-0.5 font-[family-name:var(--font-ui)]">
            {selectedVoice.name}&apos;s voice is set to {selectedVoice.speed}\u00D7 for sacred reverence
          </p>
        </div>
      )}
    </div>
  )
}

export default GitaVoiceSelector
