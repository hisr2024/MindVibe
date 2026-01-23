'use client'

/**
 * Voice Enhancements Mobile Component
 *
 * Mobile-optimized bottom sheet interface for voice enhancements:
 * - Swipe-up bottom sheet
 * - Touch-optimized controls
 * - Quick access fab
 * - Haptic feedback support
 */

import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion'
import {
  Sparkles,
  X,
  Brain,
  Headphones,
  Wind,
  Music,
  Moon,
  Sun,
  Heart,
  ChevronUp,
  GripHorizontal,
  Play,
  Pause
} from 'lucide-react'
import { BinauraBeatsControl } from './BinauraBeatsControl'
import { SpatialAudioControl } from './SpatialAudioControl'
import { BreathingSyncControl } from './BreathingSyncControl'
import { AmbientSoundscapeControl } from './AmbientSoundscapeControl'
import { SleepModeControl } from './SleepModeControl'
import { DailyCheckInWidget } from './DailyCheckInWidget'
import { AffirmationsWidget } from './AffirmationsWidget'
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

export interface VoiceEnhancementsMobileProps {
  currentLayer?: ConsciousnessLayer
  onEnhancementToggle?: (type: EnhancementType, active: boolean) => void
  className?: string
}

// ============ Configuration ============

const ENHANCEMENTS: {
  type: EnhancementType
  name: string
  icon: typeof Brain
  color: string
  bgColor: string
}[] = [
  { type: 'binaural_beats', name: 'Binaural', icon: Brain, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
  { type: 'spatial_audio', name: '3D Audio', icon: Headphones, color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
  { type: 'breathing', name: 'Breathe', icon: Wind, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  { type: 'soundscapes', name: 'Sounds', icon: Music, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
  { type: 'sleep_mode', name: 'Sleep', icon: Moon, color: 'text-indigo-400', bgColor: 'bg-indigo-500/20' },
  { type: 'check_in', name: 'Check-In', icon: Sun, color: 'text-amber-400', bgColor: 'bg-amber-500/20' },
  { type: 'affirmations', name: 'Affirm', icon: Heart, color: 'text-pink-400', bgColor: 'bg-pink-500/20' }
]

// ============ Floating Action Button ============

function EnhancementsFAB({
  activeCount,
  onClick,
  isPlaying
}: {
  activeCount: number
  onClick: () => void
  isPlaying: boolean
}) {
  return (
    <motion.button
      onClick={onClick}
      className="fixed bottom-20 right-4 z-40"
      whileTap={{ scale: 0.95 }}
    >
      <div className={`relative p-4 rounded-2xl shadow-lg ${
        isPlaying
          ? 'bg-gradient-to-br from-orange-500 to-amber-500 shadow-orange-500/30'
          : 'bg-gradient-to-br from-slate-800 to-slate-900 shadow-black/50'
      }`}>
        <Sparkles className={`w-6 h-6 ${isPlaying ? 'text-white' : 'text-orange-400'}`} />

        {/* Active count badge */}
        {activeCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center"
          >
            <span className="text-xs font-bold text-white">{activeCount}</span>
          </motion.div>
        )}

        {/* Playing indicator */}
        {isPlaying && (
          <motion.div
            className="absolute inset-0 rounded-2xl border-2 border-orange-300/50"
            animate={{ scale: [1, 1.15, 1], opacity: [0.8, 0, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        )}
      </div>
    </motion.button>
  )
}

// ============ Bottom Sheet ============

function EnhancementsBottomSheet({
  isOpen,
  onClose,
  activeEnhancements,
  selectedEnhancement,
  onSelectEnhancement,
  onToggleEnhancement,
  currentLayer
}: {
  isOpen: boolean
  onClose: () => void
  activeEnhancements: Set<EnhancementType>
  selectedEnhancement: EnhancementType | null
  onSelectEnhancement: (type: EnhancementType | null) => void
  onToggleEnhancement: (type: EnhancementType, active: boolean) => void
  currentLayer?: ConsciousnessLayer
}) {
  const dragControls = useDragControls()
  const constraintsRef = useRef(null)

  const handleDragEnd = useCallback((event: never, info: PanInfo) => {
    if (info.offset.y > 100 || info.velocity.y > 500) {
      onClose()
    }
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />

          {/* Bottom Sheet */}
          <motion.div
            ref={constraintsRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            drag="y"
            dragControls={dragControls}
            dragConstraints={{ top: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            className="fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-b from-slate-900 to-black rounded-t-3xl max-h-[85vh] overflow-hidden"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Drag Handle */}
            <div
              className="flex justify-center py-3 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <div className="w-12 h-1.5 rounded-full bg-white/20" />
            </div>

            {/* Header */}
            <div className="px-4 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-purple-500/20">
                  <Sparkles className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-white">Voice Enhancements</h3>
                  <p className="text-xs text-white/50">{activeEnhancements.size} active</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white/5 text-white/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Toggle Grid */}
            <div className="px-4 pb-4">
              <div className="grid grid-cols-4 gap-2">
                {ENHANCEMENTS.slice(0, 4).map((enhancement) => {
                  const Icon = enhancement.icon
                  const isActive = activeEnhancements.has(enhancement.type)
                  const isSelected = selectedEnhancement === enhancement.type

                  return (
                    <button
                      key={enhancement.type}
                      onClick={() => onSelectEnhancement(
                        isSelected ? null : enhancement.type
                      )}
                      onDoubleClick={() => onToggleEnhancement(enhancement.type, !isActive)}
                      className={`p-3 rounded-xl border transition-all ${
                        isSelected
                          ? `border-${enhancement.color.replace('text-', '')}/50 ${enhancement.bgColor}`
                          : isActive
                            ? `border-white/20 ${enhancement.bgColor}`
                            : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <Icon className={`w-6 h-6 mx-auto mb-1.5 ${
                        isActive ? enhancement.color : 'text-white/40'
                      }`} />
                      <p className="text-[10px] text-white/70 text-center">{enhancement.name}</p>
                      {isActive && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-1.5 h-1.5 rounded-full bg-emerald-400 mx-auto mt-1"
                        />
                      )}
                    </button>
                  )
                })}
              </div>

              <div className="grid grid-cols-3 gap-2 mt-2">
                {ENHANCEMENTS.slice(4).map((enhancement) => {
                  const Icon = enhancement.icon
                  const isActive = activeEnhancements.has(enhancement.type)
                  const isSelected = selectedEnhancement === enhancement.type

                  return (
                    <button
                      key={enhancement.type}
                      onClick={() => onSelectEnhancement(
                        isSelected ? null : enhancement.type
                      )}
                      onDoubleClick={() => onToggleEnhancement(enhancement.type, !isActive)}
                      className={`p-3 rounded-xl border transition-all ${
                        isSelected
                          ? `border-${enhancement.color.replace('text-', '')}/50 ${enhancement.bgColor}`
                          : isActive
                            ? `border-white/20 ${enhancement.bgColor}`
                            : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mx-auto mb-1 ${
                        isActive ? enhancement.color : 'text-white/40'
                      }`} />
                      <p className="text-[10px] text-white/70 text-center">{enhancement.name}</p>
                    </button>
                  )
                })}
              </div>

              <p className="text-[10px] text-white/30 text-center mt-2">
                Tap to expand • Double-tap to toggle
              </p>
            </div>

            {/* Selected Enhancement Detail */}
            <AnimatePresence mode="wait">
              {selectedEnhancement && (
                <motion.div
                  key={selectedEnhancement}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-white/5 overflow-y-auto max-h-[50vh]"
                >
                  <div className="p-4">
                    {selectedEnhancement === 'binaural_beats' && (
                      <BinauraBeatsControl
                        isActive={activeEnhancements.has('binaural_beats')}
                        onToggle={(active) => onToggleEnhancement('binaural_beats', active)}
                        currentLayer={currentLayer}
                      />
                    )}
                    {selectedEnhancement === 'spatial_audio' && (
                      <SpatialAudioControl
                        isActive={activeEnhancements.has('spatial_audio')}
                        onToggle={(active) => onToggleEnhancement('spatial_audio', active)}
                      />
                    )}
                    {selectedEnhancement === 'breathing' && (
                      <BreathingSyncControl
                        isActive={activeEnhancements.has('breathing')}
                        onToggle={(active) => onToggleEnhancement('breathing', active)}
                      />
                    )}
                    {selectedEnhancement === 'soundscapes' && (
                      <AmbientSoundscapeControl
                        isActive={activeEnhancements.has('soundscapes')}
                        onToggle={(active) => onToggleEnhancement('soundscapes', active)}
                      />
                    )}
                    {selectedEnhancement === 'sleep_mode' && (
                      <SleepModeControl
                        isActive={activeEnhancements.has('sleep_mode')}
                        onToggle={(active) => onToggleEnhancement('sleep_mode', active)}
                      />
                    )}
                    {selectedEnhancement === 'check_in' && (
                      <DailyCheckInWidget />
                    )}
                    {selectedEnhancement === 'affirmations' && (
                      <AffirmationsWidget />
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// ============ Mini Player Bar ============

function MiniPlayerBar({
  activeEnhancements,
  onTap
}: {
  activeEnhancements: Set<EnhancementType>
  onTap: () => void
}) {
  if (activeEnhancements.size === 0) return null

  const activeList = Array.from(activeEnhancements)
  const firstEnhancement = ENHANCEMENTS.find(e => e.type === activeList[0])

  return (
    <motion.div
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 100, opacity: 0 }}
      onClick={onTap}
      className="fixed bottom-16 left-4 right-4 z-40"
      style={{ marginBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl border border-white/10 p-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Active Icons */}
            <div className="flex -space-x-2">
              {activeList.slice(0, 3).map((type) => {
                const enhancement = ENHANCEMENTS.find(e => e.type === type)!
                const Icon = enhancement.icon
                return (
                  <div
                    key={type}
                    className={`w-8 h-8 rounded-full ${enhancement.bgColor} flex items-center justify-center border-2 border-slate-900`}
                  >
                    <Icon className={`w-4 h-4 ${enhancement.color}`} />
                  </div>
                )
              })}
              {activeList.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border-2 border-slate-900">
                  <span className="text-xs text-white/70">+{activeList.length - 3}</span>
                </div>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-white">
                {activeEnhancements.size} Enhancement{activeEnhancements.size > 1 ? 's' : ''} Active
              </p>
              <p className="text-[10px] text-white/50">
                {firstEnhancement?.name}
                {activeList.length > 1 ? ` +${activeList.length - 1} more` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-400"
            />
            <ChevronUp className="w-5 h-5 text-white/50" />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// ============ Main Component ============

export function VoiceEnhancementsMobile({
  currentLayer,
  onEnhancementToggle,
  className = ''
}: VoiceEnhancementsMobileProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeEnhancements, setActiveEnhancements] = useState<Set<EnhancementType>>(new Set())
  const [selectedEnhancement, setSelectedEnhancement] = useState<EnhancementType | null>(null)

  const handleToggleEnhancement = useCallback((type: EnhancementType, active: boolean) => {
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

    // Haptic feedback (if available)
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
  }, [onEnhancementToggle])

  const isPlaying = activeEnhancements.size > 0

  return (
    <div className={className}>
      {/* FAB */}
      <EnhancementsFAB
        activeCount={activeEnhancements.size}
        onClick={() => setIsOpen(true)}
        isPlaying={isPlaying}
      />

      {/* Mini Player (when not expanded) */}
      <AnimatePresence>
        {!isOpen && activeEnhancements.size > 0 && (
          <MiniPlayerBar
            activeEnhancements={activeEnhancements}
            onTap={() => setIsOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* Bottom Sheet */}
      <EnhancementsBottomSheet
        isOpen={isOpen}
        onClose={() => {
          setIsOpen(false)
          setSelectedEnhancement(null)
        }}
        activeEnhancements={activeEnhancements}
        selectedEnhancement={selectedEnhancement}
        onSelectEnhancement={setSelectedEnhancement}
        onToggleEnhancement={handleToggleEnhancement}
        currentLayer={currentLayer}
      />
    </div>
  )
}

export default VoiceEnhancementsMobile
