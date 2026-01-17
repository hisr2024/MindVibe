'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MoodParticles } from './MoodParticles'
import { AnimatedIntensitySlider } from './AnimatedIntensitySlider'
import { StateGlowEffect } from './StateGlowEffect'
import { useHapticFeedback } from '@/hooks'

/**
 * State Check-In Component
 * 
 * Interactive emotional state selector with 17 states organized in 3 categories:
 * - Uplifted (7 states): Peaceful, Happy, Grateful, Charged, Open, Determined, Neutral
 * - Reflective (3 states): Reflective, Tender, Tired
 * - Heavy (7 states): Anxious, Worried, Heavy, Angry, Sad, Loneliness, Depressed
 * 
 * Features:
 * - Glowing circles for each state
 * - Energy bars showing intensity
 * - Smooth animations
 */

export interface EmotionalState {
  id: string
  label: string
  category: 'uplifted' | 'reflective' | 'heavy'
  color: string
  glowColor: string
  emoji: string
}

const EMOTIONAL_STATES: EmotionalState[] = [
  // Uplifted States (7)
  { id: 'peaceful', label: 'Peaceful', category: 'uplifted', color: '#4fd1c5', glowColor: 'rgba(79, 209, 197, 0.4)', emoji: '🧘' },
  { id: 'happy', label: 'Happy', category: 'uplifted', color: '#fbbf24', glowColor: 'rgba(251, 191, 36, 0.4)', emoji: '😊' },
  { id: 'grateful', label: 'Grateful', category: 'uplifted', color: '#34d399', glowColor: 'rgba(52, 211, 153, 0.4)', emoji: '🙏' },
  { id: 'charged', label: 'Charged', category: 'uplifted', color: '#f59e0b', glowColor: 'rgba(245, 158, 11, 0.4)', emoji: '⚡' },
  { id: 'open', label: 'Open', category: 'uplifted', color: '#60a5fa', glowColor: 'rgba(96, 165, 250, 0.4)', emoji: '🌸' },
  { id: 'determined', label: 'Determined', category: 'uplifted', color: '#8b5cf6', glowColor: 'rgba(139, 92, 246, 0.4)', emoji: '💪' },
  { id: 'neutral', label: 'Neutral', category: 'uplifted', color: '#9ca3af', glowColor: 'rgba(156, 163, 175, 0.4)', emoji: '😌' },
  
  // Reflective States (3)
  { id: 'reflective', label: 'Reflective', category: 'reflective', color: '#a78bfa', glowColor: 'rgba(167, 139, 250, 0.4)', emoji: '🤔' },
  { id: 'tender', label: 'Tender', category: 'reflective', color: '#f472b6', glowColor: 'rgba(244, 114, 182, 0.4)', emoji: '💗' },
  { id: 'tired', label: 'Tired', category: 'reflective', color: '#6b7280', glowColor: 'rgba(107, 114, 128, 0.4)', emoji: '😴' },
  
  // Heavy States (7)
  { id: 'anxious', label: 'Anxious', category: 'heavy', color: '#fca5a5', glowColor: 'rgba(252, 165, 165, 0.4)', emoji: '😰' },
  { id: 'worried', label: 'Worried', category: 'heavy', color: '#fdba74', glowColor: 'rgba(253, 186, 116, 0.4)', emoji: '😟' },
  { id: 'heavy', label: 'Heavy', category: 'heavy', color: '#94a3b8', glowColor: 'rgba(148, 163, 184, 0.4)', emoji: '😔' },
  { id: 'angry', label: 'Angry', category: 'heavy', color: '#ef4444', glowColor: 'rgba(239, 68, 68, 0.4)', emoji: '😠' },
  { id: 'sad', label: 'Sad', category: 'heavy', color: '#93c5fd', glowColor: 'rgba(147, 197, 253, 0.4)', emoji: '😢' },
  { id: 'loneliness', label: 'Loneliness', category: 'heavy', color: '#cbd5e1', glowColor: 'rgba(203, 213, 225, 0.4)', emoji: '😞' },
  { id: 'depressed', label: 'Depressed', category: 'heavy', color: '#64748b', glowColor: 'rgba(100, 116, 139, 0.4)', emoji: '😥' },
]

interface StateCheckInProps {
  onStateSelect?: (state: EmotionalState, intensity: number) => void
  className?: string
}

// Constants
const INTENSITY_PERCENTAGE_MULTIPLIER = 10
const MIN_INTENSITY = 1
const MAX_INTENSITY = 10

export function StateCheckIn({ onStateSelect, className = '' }: StateCheckInProps) {
  const [selectedState, setSelectedState] = useState<EmotionalState | null>(null)
  const [intensity, setIntensity] = useState(5)
  const [hoveredState, setHoveredState] = useState<string | null>(null)
  const [particleTrigger, setParticleTrigger] = useState<{ id: string; origin: { x: number; y: number } } | null>(null)
  const { triggerHaptic } = useHapticFeedback()

  const handleStateClick = (state: EmotionalState, event: React.MouseEvent) => {
    setSelectedState(state)
    triggerHaptic('medium')
    
    // Trigger particle effect at click position
    const rect = event.currentTarget.getBoundingClientRect()
    setParticleTrigger({
      id: `${state.id}-${Date.now()}`,
      origin: {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      },
    })
    
    // Clear particle trigger after animation
    setTimeout(() => setParticleTrigger(null), 100)
    
    if (onStateSelect) {
      onStateSelect(state, intensity)
    }
  }

  const categories = {
    uplifted: EMOTIONAL_STATES.filter(s => s.category === 'uplifted'),
    reflective: EMOTIONAL_STATES.filter(s => s.category === 'reflective'),
    heavy: EMOTIONAL_STATES.filter(s => s.category === 'heavy'),
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Category: Uplifted */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-orange-50 flex items-center gap-2">
          <span className="text-xl">✨</span>
          Uplifted
        </h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
          {categories.uplifted.map((state) => (
            <StateCircle
              key={state.id}
              state={state}
              isSelected={selectedState?.id === state.id}
              isHovered={hoveredState === state.id}
              onHover={setHoveredState}
              onClick={handleStateClick}
            />
          ))}
        </div>
      </div>

      {/* Category: Reflective */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-orange-50 flex items-center gap-2">
          <span className="text-xl">🌙</span>
          Reflective
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {categories.reflective.map((state) => (
            <StateCircle
              key={state.id}
              state={state}
              isSelected={selectedState?.id === state.id}
              isHovered={hoveredState === state.id}
              onHover={setHoveredState}
              onClick={handleStateClick}
            />
          ))}
        </div>
      </div>

      {/* Category: Heavy */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-orange-50 flex items-center gap-2">
          <span className="text-xl">🌧️</span>
          Heavy
        </h3>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-7">
          {categories.heavy.map((state) => (
            <StateCircle
              key={state.id}
              state={state}
              isSelected={selectedState?.id === state.id}
              isHovered={hoveredState === state.id}
              onHover={setHoveredState}
              onClick={handleStateClick}
            />
          ))}
        </div>
      </div>

      {/* Intensity Slider */}
      {selectedState && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-[#0d0d0f]/90 via-[#0b0b0f]/80 to-[#120a07]/90 p-6 shadow-[0_20px_80px_rgba(255,115,39,0.12)]"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{selectedState.emoji}</span>
              <div>
                <h4 className="text-lg font-semibold text-orange-50">{selectedState.label}</h4>
                <p className="text-xs text-orange-100/70">Adjust the intensity</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedState(null)}
              className="rounded-lg p-2 text-orange-100/60 hover:bg-orange-500/10 hover:text-orange-50 transition-colors"
              aria-label="Clear selection"
            >
              ✕
            </button>
          </div>

          {/* Animated Intensity Slider */}
          <AnimatedIntensitySlider
            value={intensity}
            onChange={(newIntensity) => {
              setIntensity(newIntensity)
              if (onStateSelect) {
                onStateSelect(selectedState, newIntensity)
              }
            }}
            color={selectedState.color}
            glowColor={selectedState.glowColor}
          />
        </motion.div>
      )}

      {/* Particle effect overlay */}
      {particleTrigger && selectedState && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <MoodParticles
            color={selectedState.color}
            trigger={!!particleTrigger}
            origin={particleTrigger.origin}
          />
        </div>
      )}
    </div>
  )
}

interface StateCircleProps {
  state: EmotionalState
  isSelected: boolean
  isHovered: boolean
  onHover: (stateId: string | null) => void
  onClick: (state: EmotionalState, event: React.MouseEvent) => void
}

function StateCircle({ state, isSelected, isHovered, onHover, onClick }: StateCircleProps) {
  return (
    <motion.button
      onClick={(e) => onClick(state, e)}
      onMouseEnter={() => onHover(state.id)}
      onMouseLeave={() => onHover(null)}
      whileHover={{ scale: 1.1, z: 20 }}
      whileTap={{ scale: 0.95 }}
      className="relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all focus:outline-none focus:ring-2 focus:ring-orange-400/50"
      style={{
        backgroundColor: isSelected || isHovered ? 'rgba(255, 255, 255, 0.05)' : 'transparent',
        perspective: '1000px',
      }}
    >
      {/* Glowing Circle with 3D effect */}
      <div
        className="relative flex items-center justify-center transition-all duration-300"
        style={{
          filter: isSelected || isHovered ? `drop-shadow(0 0 12px ${state.glowColor})` : 'none',
          transform: isHovered ? 'translateZ(10px)' : 'translateZ(0)',
          transformStyle: 'preserve-3d',
        }}
      >
        {/* Glow effect */}
        <StateGlowEffect state={state} isActive={isSelected || isHovered} />
        
        {/* Main circle */}
        <div
          className="relative h-12 w-12 rounded-full flex items-center justify-center text-xl transition-all duration-300 border-2"
          style={{
            backgroundColor: state.color,
            borderColor: isSelected ? 'rgba(255, 255, 255, 0.4)' : 'transparent',
            boxShadow: isSelected ? `0 0 20px ${state.glowColor}` : isHovered ? `0 0 12px ${state.glowColor}` : 'none',
            transform: isSelected ? 'scale(1.1)' : 'scale(1)',
          }}
        >
          {state.emoji}
        </div>
      </div>

      {/* Label */}
      <span
        className="text-xs font-medium text-center transition-colors"
        style={{
          color: isSelected || isHovered ? state.color : 'rgba(255, 255, 255, 0.7)',
        }}
      >
        {state.label}
      </span>

      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-orange-500 flex items-center justify-center text-[10px]"
        >
          ✓
        </motion.div>
      )}
    </motion.button>
  )
}
