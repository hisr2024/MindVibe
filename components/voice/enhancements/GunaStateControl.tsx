'use client'

/**
 * Guna State Control
 *
 * Based on Bhagavad Gita Chapter 14 - Gunatray Vibhag Yoga
 *
 * Three fundamental qualities of nature:
 * - Sattva (सत्त्व): Purity, clarity, wisdom, harmony
 * - Rajas (रजस्): Activity, passion, desire, energy
 * - Tamas (तमस्): Rest, inertia, grounding, stillness
 *
 * "सत्त्वं रजस्तम इति गुणाः प्रकृतिसम्भवाः" (BG 14.5)
 * "Sattva, Rajas, Tamas - these qualities born of Prakriti"
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sun,
  Flame,
  Moon,
  Sparkles
} from 'lucide-react'
import { useAudio, type GunaState } from '@/contexts/AudioContext'

interface GunaStateControlProps {
  isActive?: boolean
  onToggle?: (active: boolean) => void
  compact?: boolean
}

// Guna configurations
const GUNAS: {
  id: GunaState
  name: string
  nameSanskrit: string
  description: string
  qualities: string[]
  gitaVerse: string
  gitaText: string
  icon: typeof Sun
  color: string
  gradient: string
  recommended: string[]
}[] = [
  {
    id: 'sattva',
    name: 'Sattva',
    nameSanskrit: 'सत्त्व',
    description: 'Pure consciousness - clarity, wisdom, harmony',
    qualities: ['Clarity', 'Wisdom', 'Peace', 'Joy'],
    gitaVerse: 'BG 14.6',
    gitaText: 'सत्त्वं निर्मलत्वात्प्रकाशकमनामयम्',
    icon: Sun,
    color: 'text-yellow-400',
    gradient: 'from-yellow-500/30 via-amber-500/20 to-orange-500/10',
    recommended: ['Meditation', 'Study', 'Creative work', 'Spiritual practice']
  },
  {
    id: 'rajas',
    name: 'Rajas',
    nameSanskrit: 'रजस्',
    description: 'Active energy - passion, desire, action',
    qualities: ['Energy', 'Action', 'Passion', 'Drive'],
    gitaVerse: 'BG 14.7',
    gitaText: 'रजो रागात्मकं विद्धि तृष्णासङ्गसमुद्भवम्',
    icon: Flame,
    color: 'text-orange-400',
    gradient: 'from-orange-500/30 via-red-500/20 to-rose-500/10',
    recommended: ['Work', 'Exercise', 'Projects', 'Social activities']
  },
  {
    id: 'tamas',
    name: 'Tamas',
    nameSanskrit: 'तमस्',
    description: 'Deep rest - stillness, grounding, restoration',
    qualities: ['Rest', 'Stillness', 'Grounding', 'Recovery'],
    gitaVerse: 'BG 14.8',
    gitaText: 'तमस्त्वज्ञानजं विद्धि मोहनं सर्वदेहिनाम्',
    icon: Moon,
    color: 'text-indigo-400',
    gradient: 'from-indigo-500/30 via-purple-500/20 to-violet-500/10',
    recommended: ['Sleep', 'Deep relaxation', 'Recovery', 'Grounding']
  }
]

export function GunaStateControl({
  isActive,
  onToggle,
  compact = false
}: GunaStateControlProps) {
  const { state, setGuna, stopAll } = useAudio()

  const [selectedGuna, setSelectedGuna] = useState<GunaState | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const currentGuna = state.currentGuna

  // Handle guna selection
  const handleSelectGuna = useCallback(async (guna: GunaState) => {
    if (currentGuna === guna) {
      // Deselect
      stopAll()
      setSelectedGuna(null)
      onToggle?.(false)
    } else {
      // Select new guna
      setIsTransitioning(true)
      setSelectedGuna(guna)
      await setGuna(guna)
      setIsTransitioning(false)
      onToggle?.(true)
    }
  }, [currentGuna, setGuna, stopAll, onToggle])

  const currentConfig = GUNAS.find(g => g.id === currentGuna)

  return (
    <div className="space-y-4">
      {/* Header */}
      {!compact && (
        <div className="text-center mb-4">
          <div className="text-xs text-white/40 mb-1">Bhagavad Gita Chapter 14</div>
          <div className="text-sm text-white/60">
            गुणत्रय विभाग योग
          </div>
        </div>
      )}

      {/* Guna Cards */}
      <div className={`grid gap-3 ${compact ? 'grid-cols-3' : 'grid-cols-1 sm:grid-cols-3'}`}>
        {GUNAS.map((guna) => {
          const Icon = guna.icon
          const isSelected = currentGuna === guna.id
          const isLoading = isTransitioning && selectedGuna === guna.id

          return (
            <button
              key={guna.id}
              onClick={() => handleSelectGuna(guna.id)}
              disabled={isTransitioning}
              className={`
                relative p-4 rounded-2xl border transition-all text-left overflow-hidden
                ${isSelected
                  ? `border-white/30 bg-gradient-to-br ${guna.gradient}`
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
                }
                disabled:opacity-50
              `}
            >
              {/* Background animation when selected */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0 opacity-30"
                  style={{
                    background: `radial-gradient(circle at 50% 50%, ${guna.color.replace('text-', 'rgb(var(--')}), transparent)`
                  }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.2, 0.4, 0.2]
                  }}
                  transition={{ repeat: Infinity, duration: 3 }}
                />
              )}

              <div className="relative">
                {/* Icon and name */}
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-xl bg-gradient-to-br ${guna.gradient}`}>
                    <Icon className={`w-5 h-5 ${isSelected ? guna.color : 'text-white/50'}`} />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{guna.name}</div>
                    <div className="text-xs text-white/50">{guna.nameSanskrit}</div>
                  </div>
                </div>

                {/* Description */}
                {!compact && (
                  <p className="text-xs text-white/60 mb-3">{guna.description}</p>
                )}

                {/* Qualities */}
                {!compact && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {guna.qualities.map((quality) => (
                      <span
                        key={quality}
                        className={`px-2 py-0.5 rounded-full text-[10px] ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-white/5 text-white/40'
                        }`}
                      >
                        {quality}
                      </span>
                    ))}
                  </div>
                )}

                {/* Loading state */}
                {isLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-2xl">
                    <motion.div
                      className={`w-6 h-6 border-2 border-t-transparent rounded-full ${guna.color.replace('text-', 'border-')}`}
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    />
                  </div>
                )}

                {/* Active indicator */}
                {isSelected && !isLoading && (
                  <div className="absolute top-2 right-2">
                    <motion.div
                      className={`w-2 h-2 rounded-full ${guna.color.replace('text-', 'bg-')}`}
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>

      {/* Current Guna Info */}
      <AnimatePresence>
        {currentGuna && currentConfig && !compact && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-4 rounded-xl bg-gradient-to-br ${currentConfig.gradient} border border-white/10`}>
              {/* Gita verse */}
              <div className="mb-3">
                <div className="text-xs text-white/40 mb-1">{currentConfig.gitaVerse}</div>
                <div className="text-sm text-white/70 italic font-sanskrit">
                  {currentConfig.gitaText}
                </div>
              </div>

              {/* Recommended activities */}
              <div>
                <div className="text-xs text-white/50 mb-2">Recommended for:</div>
                <div className="flex flex-wrap gap-2">
                  {currentConfig.recommended.map((activity) => (
                    <span
                      key={activity}
                      className="px-2 py-1 rounded-lg bg-white/10 text-white/70 text-xs"
                    >
                      {activity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      {!currentGuna && !compact && (
        <div className="text-center text-xs text-white/40">
          Select a Guna to align your audio environment
        </div>
      )}
    </div>
  )
}

export default GunaStateControl
