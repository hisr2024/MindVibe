'use client'

/**
 * Chakra Frequency Control
 *
 * Seven chakra alignment frequencies based on Kundalini yoga:
 * - Muladhara (Root): 396 Hz - Stability, grounding
 * - Svadhisthana (Sacral): 417 Hz - Creativity, emotion
 * - Manipura (Solar Plexus): 528 Hz - Power, will
 * - Anahata (Heart): 639 Hz - Love, compassion
 * - Vishuddha (Throat): 741 Hz - Truth, expression
 * - Ajna (Third Eye): 852 Hz - Intuition, wisdom
 * - Sahasrara (Crown): 963 Hz - Divine connection
 *
 * "कुण्डलिनी शक्ति जागरण" - Kundalini Shakti awakening
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play,
  Square,
  Zap,
  Volume2
} from 'lucide-react'
import { useAudio, type ChakraFrequency } from '@/contexts/AudioContext'

interface ChakraFrequencyControlProps {
  isActive?: boolean
  onToggle?: (active: boolean) => void
  compact?: boolean
}

// Chakra configurations
const CHAKRAS: {
  id: ChakraFrequency
  name: string
  nameSanskrit: string
  frequency: number
  bija: string
  element: string
  qualities: string[]
  color: string
  position: number // 0-100 for visual placement
}[] = [
  {
    id: 'muladhara',
    name: 'Root',
    nameSanskrit: 'मूलाधार',
    frequency: 396,
    bija: 'LAM',
    element: 'Earth',
    qualities: ['Stability', 'Security', 'Grounding'],
    color: '#FF0000',
    position: 95
  },
  {
    id: 'svadhisthana',
    name: 'Sacral',
    nameSanskrit: 'स्वाधिष्ठान',
    frequency: 417,
    bija: 'VAM',
    element: 'Water',
    qualities: ['Creativity', 'Emotion', 'Pleasure'],
    color: '#FF7F00',
    position: 80
  },
  {
    id: 'manipura',
    name: 'Solar Plexus',
    nameSanskrit: 'मणिपूर',
    frequency: 528,
    bija: 'RAM',
    element: 'Fire',
    qualities: ['Power', 'Will', 'Energy'],
    color: '#FFFF00',
    position: 65
  },
  {
    id: 'anahata',
    name: 'Heart',
    nameSanskrit: 'अनाहत',
    frequency: 639,
    bija: 'YAM',
    element: 'Air',
    qualities: ['Love', 'Compassion', 'Forgiveness'],
    color: '#00FF00',
    position: 50
  },
  {
    id: 'vishuddha',
    name: 'Throat',
    nameSanskrit: 'विशुद्ध',
    frequency: 741,
    bija: 'HAM',
    element: 'Ether',
    qualities: ['Expression', 'Truth', 'Communication'],
    color: '#0000FF',
    position: 35
  },
  {
    id: 'ajna',
    name: 'Third Eye',
    nameSanskrit: 'आज्ञा',
    frequency: 852,
    bija: 'OM',
    element: 'Mind',
    qualities: ['Intuition', 'Wisdom', 'Insight'],
    color: '#4B0082',
    position: 20
  },
  {
    id: 'sahasrara',
    name: 'Crown',
    nameSanskrit: 'सहस्रार',
    frequency: 963,
    bija: 'ॐ',
    element: 'Consciousness',
    qualities: ['Divine', 'Enlightenment', 'Unity'],
    color: '#9400D3',
    position: 5
  }
]

export function ChakraFrequencyControl({
  isActive,
  onToggle,
  compact = false
}: ChakraFrequencyControlProps) {
  const {
    state,
    playChakra,
    stopChakra,
    playChakraJourney
  } = useAudio()

  const [selectedChakra, setSelectedChakra] = useState<ChakraFrequency | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isJourneyMode, setIsJourneyMode] = useState(false)
  const [withBinaural, setWithBinaural] = useState(true)

  const currentChakra = state.currentChakra

  // Handle chakra selection
  const handleSelectChakra = useCallback(async (chakra: ChakraFrequency) => {
    if (currentChakra === chakra && isPlaying) {
      stopChakra()
      setIsPlaying(false)
      setSelectedChakra(null)
      onToggle?.(false)
    } else {
      await playChakra(chakra, withBinaural)
      setSelectedChakra(chakra)
      setIsPlaying(true)
      setIsJourneyMode(false)
      onToggle?.(true)
    }
  }, [currentChakra, isPlaying, playChakra, stopChakra, withBinaural, onToggle])

  // Handle chakra journey
  const handleStartJourney = useCallback(async () => {
    setIsJourneyMode(true)
    setIsPlaying(true)
    onToggle?.(true)
    await playChakraJourney(60) // 60 seconds per chakra
  }, [playChakraJourney, onToggle])

  // Handle stop
  const handleStop = useCallback(() => {
    stopChakra()
    setIsPlaying(false)
    setSelectedChakra(null)
    setIsJourneyMode(false)
    onToggle?.(false)
  }, [stopChakra, onToggle])

  const currentConfig = CHAKRAS.find(c => c.id === currentChakra)

  return (
    <div className="space-y-4">
      {/* Chakra Visual Column */}
      <div className="relative">
        {/* Body silhouette background */}
        <div className="relative h-48 mx-auto w-20 bg-gradient-to-b from-purple-500/10 via-green-500/10 to-red-500/10 rounded-full">
          {/* Chakra points */}
          {CHAKRAS.map((chakra) => {
            const isSelected = currentChakra === chakra.id
            const isActive = isPlaying && isSelected

            return (
              <button
                key={chakra.id}
                onClick={() => handleSelectChakra(chakra.id)}
                className="absolute left-1/2 -translate-x-1/2 group"
                style={{ top: `${chakra.position}%` }}
              >
                <motion.div
                  className={`
                    w-6 h-6 rounded-full border-2 transition-all
                    ${isActive ? 'scale-125' : 'hover:scale-110'}
                  `}
                  style={{
                    backgroundColor: isActive ? chakra.color : 'transparent',
                    borderColor: chakra.color,
                    boxShadow: isActive ? `0 0 20px ${chakra.color}` : 'none'
                  }}
                  animate={isActive ? {
                    boxShadow: [
                      `0 0 10px ${chakra.color}`,
                      `0 0 30px ${chakra.color}`,
                      `0 0 10px ${chakra.color}`
                    ]
                  } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 rounded-full"
                      style={{ backgroundColor: chakra.color }}
                      animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    />
                  )}
                </motion.div>

                {/* Tooltip */}
                <div className="absolute left-8 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs whitespace-nowrap">
                    <span style={{ color: chakra.color }}>{chakra.name}</span>
                    <span className="text-white/50 ml-1">{chakra.frequency}Hz</span>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Legend on the side */}
        {!compact && (
          <div className="absolute right-0 top-0 space-y-1 text-[10px]">
            {CHAKRAS.slice(0, 4).map((chakra) => (
              <div key={chakra.id} className="flex items-center gap-1">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: chakra.color }}
                />
                <span className="text-white/40">{chakra.bija}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Chakra Buttons */}
      <div className="flex flex-wrap gap-1 justify-center">
        {CHAKRAS.map((chakra) => {
          const isSelected = currentChakra === chakra.id

          return (
            <button
              key={chakra.id}
              onClick={() => handleSelectChakra(chakra.id)}
              className={`
                px-2 py-1 rounded-lg text-[10px] font-medium transition-all
                ${isSelected
                  ? 'text-white'
                  : 'text-white/50 hover:text-white/80'
                }
              `}
              style={{
                backgroundColor: isSelected ? chakra.color : 'rgba(255,255,255,0.05)',
              }}
            >
              {chakra.nameSanskrit}
            </button>
          )
        })}
      </div>

      {/* Journey Button */}
      <button
        onClick={isJourneyMode ? handleStop : handleStartJourney}
        disabled={isPlaying && !isJourneyMode}
        className={`
          w-full py-2.5 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2
          ${isJourneyMode
            ? 'bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 text-white'
            : 'bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30 text-purple-300 hover:bg-purple-500/30'
          }
          disabled:opacity-50
        `}
      >
        {isJourneyMode ? (
          <>
            <Square className="w-4 h-4" />
            Stop Chakra Journey
          </>
        ) : (
          <>
            <Zap className="w-4 h-4" />
            Start Kundalini Journey
          </>
        )}
      </button>

      {/* Current Chakra Info */}
      <AnimatePresence>
        {isPlaying && currentConfig && !isJourneyMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className="p-3 rounded-xl border border-white/10"
              style={{ backgroundColor: `${currentConfig.color}20` }}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: currentConfig.color }}
                    />
                    <span className="font-medium text-white">{currentConfig.name}</span>
                    <span className="text-white/50 text-xs">({currentConfig.nameSanskrit})</span>
                  </div>
                  <div className="text-xs text-white/60 mt-1">
                    {currentConfig.frequency} Hz • Bija: {currentConfig.bija}
                  </div>
                </div>
                <button
                  onClick={handleStop}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70"
                >
                  <Square className="w-4 h-4" />
                </button>
              </div>

              {/* Qualities */}
              <div className="flex flex-wrap gap-1">
                {currentConfig.qualities.map((quality) => (
                  <span
                    key={quality}
                    className="px-2 py-0.5 rounded-full text-[10px] bg-white/10 text-white/70"
                  >
                    {quality}
                  </span>
                ))}
              </div>

              {/* Element */}
              <div className="mt-2 text-[10px] text-white/40">
                Element: {currentConfig.element}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Binaural toggle */}
      {!compact && (
        <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
          <input
            type="checkbox"
            checked={withBinaural}
            onChange={(e) => setWithBinaural(e.target.checked)}
            className="rounded border-white/20 bg-white/10 text-purple-500 focus:ring-purple-500"
          />
          Add binaural entrainment
        </label>
      )}
    </div>
  )
}

export default ChakraFrequencyControl
