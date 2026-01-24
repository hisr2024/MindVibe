'use client'

/**
 * Solfeggio Frequency Control
 *
 * Ancient sacred healing frequencies:
 * - 174 Hz: Foundation, security
 * - 285 Hz: Healing, transformation
 * - 396 Hz: Liberation from fear
 * - 417 Hz: Facilitating change
 * - 528 Hz: DNA repair, miracles
 * - 639 Hz: Connecting, relationships
 * - 741 Hz: Expression, solutions
 * - 852 Hz: Awakening intuition
 * - 963 Hz: Divine consciousness
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Volume2,
  Play,
  Square,
  Sparkles,
  Heart,
  Shield,
  Zap,
  Sun,
  Users,
  MessageCircle,
  Eye,
  Crown
} from 'lucide-react'
import { useAudio, type SolfeggioFrequency } from '@/contexts/AudioContext'

interface SolfeggioFrequencyControlProps {
  isActive?: boolean
  onToggle?: (active: boolean) => void
  compact?: boolean
}

// Solfeggio frequency configurations
const SOLFEGGIO_FREQUENCIES: {
  id: SolfeggioFrequency
  frequency: number
  name: string
  nameSanskrit: string
  description: string
  healingProperty: string
  icon: typeof Heart
  color: string
}[] = [
  {
    id: 'ut_174',
    frequency: 174,
    name: 'Foundation',
    nameSanskrit: 'आधार',
    description: 'Lowest Solfeggio - grounding',
    healingProperty: 'Reduces pain, provides security',
    icon: Shield,
    color: 'bg-red-500'
  },
  {
    id: 'ut_285',
    frequency: 285,
    name: 'Quantum',
    nameSanskrit: 'परिवर्तन',
    description: 'Cellular regeneration',
    healingProperty: 'Heals tissues, promotes repair',
    icon: Zap,
    color: 'bg-orange-500'
  },
  {
    id: 'ut_396',
    frequency: 396,
    name: 'Liberation',
    nameSanskrit: 'मुक्ति',
    description: 'UT - Liberating guilt & fear',
    healingProperty: 'Releases fear and guilt',
    icon: Shield,
    color: 'bg-red-600'
  },
  {
    id: 're_417',
    frequency: 417,
    name: 'Change',
    nameSanskrit: 'रूपान्तर',
    description: 'RE - Undoing situations',
    healingProperty: 'Facilitates change, clears trauma',
    icon: Sparkles,
    color: 'bg-orange-600'
  },
  {
    id: 'mi_528',
    frequency: 528,
    name: 'Miracles',
    nameSanskrit: 'चमत्कार',
    description: 'MI - DNA repair frequency',
    healingProperty: 'DNA repair, transformation',
    icon: Heart,
    color: 'bg-yellow-500'
  },
  {
    id: 'fa_639',
    frequency: 639,
    name: 'Connection',
    nameSanskrit: 'संबंध',
    description: 'FA - Relationships',
    healingProperty: 'Enhances love & understanding',
    icon: Users,
    color: 'bg-green-500'
  },
  {
    id: 'sol_741',
    frequency: 741,
    name: 'Expression',
    nameSanskrit: 'अभिव्यक्ति',
    description: 'SOL - Awakening intuition',
    healingProperty: 'Self-expression, solutions',
    icon: MessageCircle,
    color: 'bg-blue-500'
  },
  {
    id: 'la_852',
    frequency: 852,
    name: 'Intuition',
    nameSanskrit: 'अंतर्ज्ञान',
    description: 'LA - Spiritual order',
    healingProperty: 'Awakens intuition, inner strength',
    icon: Eye,
    color: 'bg-indigo-500'
  },
  {
    id: 'si_963',
    frequency: 963,
    name: 'Divine',
    nameSanskrit: 'दिव्य',
    description: 'SI - Divine consciousness',
    healingProperty: 'Activates pineal, divine connection',
    icon: Crown,
    color: 'bg-purple-500'
  }
]

export function SolfeggioFrequencyControl({
  isActive,
  onToggle,
  compact = false
}: SolfeggioFrequencyControlProps) {
  const { playSolfeggio, stopSolfeggio } = useAudio()

  const [currentFrequency, setCurrentFrequency] = useState<SolfeggioFrequency | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.4)
  const [duration, setDuration] = useState<number | undefined>(undefined) // Infinite by default

  // Handle frequency selection
  const handleSelectFrequency = useCallback(async (freq: SolfeggioFrequency) => {
    if (currentFrequency === freq && isPlaying) {
      // Stop if already playing this frequency
      stopSolfeggio()
      setIsPlaying(false)
      setCurrentFrequency(null)
      onToggle?.(false)
    } else {
      // Play new frequency
      await playSolfeggio(freq, duration)
      setCurrentFrequency(freq)
      setIsPlaying(true)
      onToggle?.(true)
    }
  }, [currentFrequency, isPlaying, playSolfeggio, stopSolfeggio, duration, onToggle])

  // Handle stop
  const handleStop = useCallback(() => {
    stopSolfeggio()
    setIsPlaying(false)
    setCurrentFrequency(null)
    onToggle?.(false)
  }, [stopSolfeggio, onToggle])

  const currentConfig = SOLFEGGIO_FREQUENCIES.find(f => f.id === currentFrequency)

  return (
    <div className="space-y-4">
      {/* Frequency Grid */}
      <div className={`grid gap-2 ${compact ? 'grid-cols-3' : 'grid-cols-3 sm:grid-cols-5'}`}>
        {SOLFEGGIO_FREQUENCIES.map((freq) => {
          const Icon = freq.icon
          const isSelected = currentFrequency === freq.id && isPlaying

          return (
            <button
              key={freq.id}
              onClick={() => handleSelectFrequency(freq.id)}
              className={`
                relative p-2 rounded-xl border transition-all text-center
                ${isSelected
                  ? 'border-white/30 bg-white/10'
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
                }
              `}
            >
              {/* Frequency badge */}
              <div className={`mx-auto w-8 h-8 rounded-full ${freq.color} flex items-center justify-center mb-1`}>
                <span className="text-[10px] font-bold text-white">{freq.frequency}</span>
              </div>

              <div className="text-[10px] font-medium text-white/80">{freq.name}</div>
              <div className="text-[8px] text-white/40">{freq.nameSanskrit}</div>

              {/* Playing indicator */}
              {isSelected && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-400 flex items-center justify-center"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                </motion.div>
              )}
            </button>
          )
        })}
      </div>

      {/* Current Frequency Info */}
      <AnimatePresence>
        {isPlaying && currentConfig && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className={`p-3 rounded-xl ${currentConfig.color}/20 border border-white/10`}>
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full ${currentConfig.color} text-white text-xs font-bold`}>
                      {currentConfig.frequency} Hz
                    </span>
                    <span className="text-sm font-medium text-white">{currentConfig.name}</span>
                  </div>
                  <div className="text-xs text-white/60 mt-1">{currentConfig.description}</div>
                </div>
                <button
                  onClick={handleStop}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>

              {/* Healing property */}
              <div className="text-[11px] text-white/50 mb-2">
                <Heart className="w-3 h-3 inline mr-1" />
                {currentConfig.healingProperty}
              </div>

              {/* Visual frequency wave */}
              <div className="h-8 flex items-center gap-0.5 overflow-hidden">
                {Array.from({ length: 30 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className={`w-1 ${currentConfig.color} rounded-full`}
                    animate={{
                      height: [8, 20 + Math.sin(i * 0.5) * 10, 8],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 1 + Math.random() * 0.5,
                      delay: i * 0.05,
                    }}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info */}
      {!isPlaying && !compact && (
        <div className="text-xs text-white/40 text-center">
          Ancient sacred frequencies for healing and transformation
        </div>
      )}
    </div>
  )
}

export default SolfeggioFrequencyControl
