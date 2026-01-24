'use client'

/**
 * Voice Enhancements Panel
 *
 * Main container for all KIAAN voice enhancements:
 * - Collapsible sections for each enhancement
 * - Master controls
 * - Session management
 * - Responsive layout
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Settings2,
  ChevronDown,
  ChevronUp,
  Volume2,
  VolumeX,
  Power,
  Sparkles,
  Brain,
  Headphones,
  Wind,
  Music,
  Moon,
  Sun,
  Heart,
  Target,
  Waves,
  Zap,
  Compass
} from 'lucide-react'
import { BinauraBeatsControl } from './BinauraBeatsControl'
import { SpatialAudioControl } from './SpatialAudioControl'
import { BreathingSyncControl } from './BreathingSyncControl'
import { AmbientSoundscapeControl } from './AmbientSoundscapeControl'
import { SleepModeControl } from './SleepModeControl'
import { DailyCheckInWidget } from './DailyCheckInWidget'
import { AffirmationsWidget } from './AffirmationsWidget'
// Gita-Based Controls
import { ActivitySoundscapeControl } from './ActivitySoundscapeControl'
import { SolfeggioFrequencyControl } from './SolfeggioFrequencyControl'
import { ChakraFrequencyControl } from './ChakraFrequencyControl'
import { GunaStateControl } from './GunaStateControl'
import type { ConsciousnessLayer } from '@/services/voice/elite/QuantumDiveEngine'

// ============ Types ============

export type EnhancementType =
  | 'binaural_beats'
  | 'spatial_audio'
  | 'breathing'
  | 'soundscapes'
  | 'sleep_mode'
  | 'check_in'
  | 'affirmations'
  // Gita-Based
  | 'activity_soundscape'
  | 'solfeggio'
  | 'chakra'
  | 'guna'

export interface EnhancementState {
  type: EnhancementType
  active: boolean
  volume: number
}

export interface VoiceEnhancementsPanelProps {
  currentLayer?: ConsciousnessLayer
  onEnhancementToggle?: (type: EnhancementType, active: boolean) => void
  onMasterVolumeChange?: (volume: number) => void
  initialStates?: Partial<Record<EnhancementType, boolean>>
  showAllByDefault?: boolean
  compact?: boolean
  className?: string
}

// ============ Configuration ============

const ENHANCEMENTS: {
  type: EnhancementType
  name: string
  nameHindi: string
  description: string
  icon: typeof Brain
  color: string
  gradient: string
}[] = [
  {
    type: 'binaural_beats',
    name: 'Binaural Beats',
    nameHindi: 'बाइनॉरल बीट्स',
    description: 'Brainwave entrainment for focus & relaxation',
    icon: Brain,
    color: 'text-purple-400',
    gradient: 'from-purple-500/20 to-indigo-500/20'
  },
  {
    type: 'spatial_audio',
    name: '3D Spatial Audio',
    nameHindi: '3D स्थानिक ऑडियो',
    description: 'Immersive sound positioning',
    icon: Headphones,
    color: 'text-blue-400',
    gradient: 'from-blue-500/20 to-cyan-500/20'
  },
  {
    type: 'breathing',
    name: 'Breathing Guide',
    nameHindi: 'श्वास मार्गदर्शक',
    description: 'Voice-synced breathwork',
    icon: Wind,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/20 to-teal-500/20'
  },
  {
    type: 'soundscapes',
    name: 'Ambient Soundscapes',
    nameHindi: 'परिवेशी ध्वनि',
    description: 'Layered nature & spiritual sounds',
    icon: Music,
    color: 'text-orange-400',
    gradient: 'from-orange-500/20 to-amber-500/20'
  },
  {
    type: 'sleep_mode',
    name: 'Sleep Mode',
    nameHindi: 'नींद मोड',
    description: 'Gradual rest induction',
    icon: Moon,
    color: 'text-indigo-400',
    gradient: 'from-indigo-500/20 to-purple-500/20'
  },
  {
    type: 'check_in',
    name: 'Daily Check-In',
    nameHindi: 'दैनिक जांच',
    description: 'Mood & wellness tracking',
    icon: Sun,
    color: 'text-amber-400',
    gradient: 'from-amber-500/20 to-orange-500/20'
  },
  {
    type: 'affirmations',
    name: 'Affirmations',
    nameHindi: 'सकारात्मक पुष्टि',
    description: 'Personalized positive guidance',
    icon: Heart,
    color: 'text-pink-400',
    gradient: 'from-pink-500/20 to-rose-500/20'
  },
  // Gita-Based Enhancements
  {
    type: 'activity_soundscape',
    name: 'Activity Mode',
    nameHindi: 'गतिविधि मोड',
    description: 'Sleep, meditation, focus, reading soundscapes',
    icon: Target,
    color: 'text-cyan-400',
    gradient: 'from-cyan-500/20 to-teal-500/20'
  },
  {
    type: 'solfeggio',
    name: 'Solfeggio Frequencies',
    nameHindi: 'सॉल्फेजियो',
    description: 'Sacred healing frequencies 174-963 Hz',
    icon: Waves,
    color: 'text-rose-400',
    gradient: 'from-rose-500/20 to-pink-500/20'
  },
  {
    type: 'chakra',
    name: 'Chakra Alignment',
    nameHindi: 'चक्र संतुलन',
    description: 'Seven chakra frequencies & Kundalini',
    icon: Zap,
    color: 'text-violet-400',
    gradient: 'from-violet-500/20 to-purple-500/20'
  },
  {
    type: 'guna',
    name: 'Guna States',
    nameHindi: 'गुण स्थिति',
    description: 'Sattva, Rajas, Tamas from Gita Ch.14',
    icon: Compass,
    color: 'text-yellow-400',
    gradient: 'from-yellow-500/20 to-amber-500/20'
  }
]

// ============ Enhancement Section ============

function EnhancementSection({
  enhancement,
  isExpanded,
  isActive,
  onToggleExpand,
  onToggleActive,
  currentLayer,
  compact
}: {
  enhancement: typeof ENHANCEMENTS[0]
  isExpanded: boolean
  isActive: boolean
  onToggleExpand: () => void
  onToggleActive: (active: boolean) => void
  currentLayer?: ConsciousnessLayer
  compact?: boolean
}) {
  const Icon = enhancement.icon

  return (
    <div className={`rounded-xl border transition-all ${
      isActive
        ? `border-${enhancement.color.replace('text-', '')}/30 bg-gradient-to-br ${enhancement.gradient}`
        : 'border-white/10 bg-white/5'
    }`}>
      {/* Section Header */}
      <div
        className="flex items-center justify-between p-3 cursor-pointer"
        onClick={onToggleExpand}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${enhancement.gradient}`}>
            <Icon className={`w-4 h-4 ${enhancement.color}`} />
          </div>
          <div>
            <h4 className="text-sm font-medium text-white">{enhancement.name}</h4>
            <p className="text-[10px] text-white/40">{enhancement.nameHindi}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Active Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onToggleActive(!isActive)
            }}
            className={`p-1.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-white/20 text-white'
                : 'bg-white/5 text-white/30 hover:bg-white/10'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
          </button>

          {/* Expand Toggle */}
          <button className="p-1.5 rounded-lg bg-white/5 text-white/50 hover:bg-white/10">
            {isExpanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 pt-0">
              {enhancement.type === 'binaural_beats' && (
                <BinauraBeatsControl
                  isActive={isActive}
                  onToggle={onToggleActive}
                  currentLayer={currentLayer}
                  compact={compact}
                />
              )}
              {enhancement.type === 'spatial_audio' && (
                <SpatialAudioControl
                  isActive={isActive}
                  onToggle={onToggleActive}
                  compact={compact}
                />
              )}
              {enhancement.type === 'breathing' && (
                <BreathingSyncControl
                  isActive={isActive}
                  onToggle={onToggleActive}
                  compact={compact}
                />
              )}
              {enhancement.type === 'soundscapes' && (
                <AmbientSoundscapeControl
                  isActive={isActive}
                  onToggle={onToggleActive}
                  compact={compact}
                />
              )}
              {enhancement.type === 'sleep_mode' && (
                <SleepModeControl
                  isActive={isActive}
                  onToggle={onToggleActive}
                  compact={compact}
                />
              )}
              {enhancement.type === 'check_in' && (
                <DailyCheckInWidget compact={compact} />
              )}
              {enhancement.type === 'affirmations' && (
                <AffirmationsWidget compact={compact} />
              )}
              {/* Gita-Based Controls */}
              {enhancement.type === 'activity_soundscape' && (
                <ActivitySoundscapeControl
                  isActive={isActive}
                  onToggle={onToggleActive}
                  compact={compact}
                />
              )}
              {enhancement.type === 'solfeggio' && (
                <SolfeggioFrequencyControl
                  isActive={isActive}
                  onToggle={onToggleActive}
                  compact={compact}
                />
              )}
              {enhancement.type === 'chakra' && (
                <ChakraFrequencyControl
                  isActive={isActive}
                  onToggle={onToggleActive}
                  compact={compact}
                />
              )}
              {enhancement.type === 'guna' && (
                <GunaStateControl
                  isActive={isActive}
                  onToggle={onToggleActive}
                  compact={compact}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ============ Main Component ============

export function VoiceEnhancementsPanel({
  currentLayer,
  onEnhancementToggle,
  onMasterVolumeChange,
  initialStates = {},
  showAllByDefault = false,
  compact = false,
  className = ''
}: VoiceEnhancementsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<EnhancementType>>(
    showAllByDefault ? new Set(ENHANCEMENTS.map(e => e.type)) : new Set()
  )
  const [activeEnhancements, setActiveEnhancements] = useState<Set<EnhancementType>>(
    new Set(Object.entries(initialStates).filter(([, v]) => v).map(([k]) => k as EnhancementType))
  )
  const [masterVolume, setMasterVolume] = useState(0.7)
  const [masterMuted, setMasterMuted] = useState(false)
  const [showPanel, setShowPanel] = useState(true)

  const handleToggleExpand = useCallback((type: EnhancementType) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }, [])

  const handleToggleActive = useCallback((type: EnhancementType, active: boolean) => {
    setActiveEnhancements(prev => {
      const next = new Set(prev)
      if (active) {
        next.add(type)
      } else {
        next.delete(type)
      }
      return next
    })
    onEnhancementToggle?.(type, active)
  }, [onEnhancementToggle])

  const handleMasterVolumeChange = useCallback((volume: number) => {
    setMasterVolume(volume)
    setMasterMuted(volume === 0)
    onMasterVolumeChange?.(volume)
  }, [onMasterVolumeChange])

  const activeCount = activeEnhancements.size

  // Compact sidebar view
  if (compact) {
    return (
      <div className={`rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm overflow-hidden ${className}`}>
        {/* Header */}
        <div
          className="p-4 border-b border-white/5 cursor-pointer"
          onClick={() => setShowPanel(!showPanel)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-purple-500/20">
                <Sparkles className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white">Voice Enhancements</h3>
                <p className="text-xs text-white/50">
                  {activeCount} active
                </p>
              </div>
            </div>
            {showPanel ? (
              <ChevronUp className="w-5 h-5 text-white/50" />
            ) : (
              <ChevronDown className="w-5 h-5 text-white/50" />
            )}
          </div>
        </div>

        {/* Collapsible Content */}
        <AnimatePresence>
          {showPanel && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3 space-y-2">
                {ENHANCEMENTS.map((enhancement) => (
                  <EnhancementSection
                    key={enhancement.type}
                    enhancement={enhancement}
                    isExpanded={expandedSections.has(enhancement.type)}
                    isActive={activeEnhancements.has(enhancement.type)}
                    onToggleExpand={() => handleToggleExpand(enhancement.type)}
                    onToggleActive={(active) => handleToggleActive(enhancement.type, active)}
                    currentLayer={currentLayer}
                    compact
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    )
  }

  // Full panel view
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900/90 to-black/90 backdrop-blur-xl overflow-hidden ${className}`}
    >
      {/* Panel Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-purple-500/20">
              <Sparkles className="w-6 h-6 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Voice Enhancements</h2>
              <p className="text-sm text-white/50">
                {activeCount} enhancement{activeCount !== 1 ? 's' : ''} active
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Master Volume */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMasterMuted(!masterMuted)}
                className={`p-2 rounded-lg transition-colors ${
                  masterMuted ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white/70'
                }`}
              >
                {masterMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={masterMuted ? 0 : masterVolume}
                onChange={(e) => handleMasterVolumeChange(parseFloat(e.target.value))}
                className="w-24 h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-orange-500"
              />
            </div>

            {/* Settings */}
            <button className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10">
              <Settings2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Toggles Row */}
      <div className="px-4 py-3 border-b border-white/5 bg-white/[0.02]">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {ENHANCEMENTS.map((enhancement) => {
            const Icon = enhancement.icon
            const isActive = activeEnhancements.has(enhancement.type)

            return (
              <button
                key={enhancement.type}
                onClick={() => handleToggleActive(enhancement.type, !isActive)}
                className={`flex-shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                  isActive
                    ? `border-${enhancement.color.replace('text-', '')}/50 bg-gradient-to-r ${enhancement.gradient}`
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? enhancement.color : 'text-white/40'}`} />
                <span className={`text-xs ${isActive ? 'text-white' : 'text-white/50'}`}>
                  {enhancement.name}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Enhancement Sections */}
      <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto">
        {ENHANCEMENTS.map((enhancement) => (
          <EnhancementSection
            key={enhancement.type}
            enhancement={enhancement}
            isExpanded={expandedSections.has(enhancement.type)}
            isActive={activeEnhancements.has(enhancement.type)}
            onToggleExpand={() => handleToggleExpand(enhancement.type)}
            onToggleActive={(active) => handleToggleActive(enhancement.type, active)}
            currentLayer={currentLayer}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between text-xs text-white/40">
          <span>Voice-first experience by KIAAN</span>
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Ready
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default VoiceEnhancementsPanel
