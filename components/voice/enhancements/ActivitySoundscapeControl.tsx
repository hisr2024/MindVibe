'use client'

/**
 * Activity Soundscape Control
 *
 * Gita-based activity soundscapes for different daily activities:
 * - Sleep: Delta waves for deep rest (Tamas)
 * - Meditation: Theta waves for Dhyana
 * - Reading: Alpha waves for Jnana (knowledge)
 * - Focus: Beta waves for Karma (action)
 * - Listening: Alpha-Theta for Bhakti (devotion)
 *
 * Based on Bhagavad Gita principles for optimal states.
 */

import { useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Moon,
  Brain,
  BookOpen,
  Target,
  Headphones,
  Sparkles,
  Flame,
  Heart,
  Sun,
  Volume2
} from 'lucide-react'
import { useAudio, type ActivitySoundscape } from '@/contexts/AudioContext'

interface ActivitySoundscapeControlProps {
  isActive?: boolean
  onToggle?: (active: boolean) => void
  compact?: boolean
}

// Activity configurations with Gita references
const ACTIVITIES: {
  id: ActivitySoundscape
  name: string
  nameSanskrit: string
  description: string
  brainwave: string
  gitaRef: string
  icon: typeof Moon
  color: string
  gradient: string
}[] = [
  {
    id: 'sleep',
    name: 'Deep Sleep',
    nameSanskrit: 'निद्रा',
    description: 'Delta waves for restorative rest',
    brainwave: 'Delta 0.5-4 Hz',
    gitaRef: 'BG 6.17',
    icon: Moon,
    color: 'text-indigo-400',
    gradient: 'from-indigo-500/30 to-purple-500/30'
  },
  {
    id: 'meditation',
    name: 'Meditation',
    nameSanskrit: 'ध्यान',
    description: 'Theta waves for deep practice',
    brainwave: 'Theta 4-8 Hz',
    gitaRef: 'BG 6.10',
    icon: Sparkles,
    color: 'text-purple-400',
    gradient: 'from-purple-500/30 to-violet-500/30'
  },
  {
    id: 'reading',
    name: 'Study',
    nameSanskrit: 'अध्ययन',
    description: 'Alpha waves for comprehension',
    brainwave: 'Alpha 8-14 Hz',
    gitaRef: 'BG 4.38',
    icon: BookOpen,
    color: 'text-blue-400',
    gradient: 'from-blue-500/30 to-cyan-500/30'
  },
  {
    id: 'focus',
    name: 'Focus',
    nameSanskrit: 'एकाग्रता',
    description: 'Beta waves for concentration',
    brainwave: 'Beta 14-30 Hz',
    gitaRef: 'BG 2.48',
    icon: Target,
    color: 'text-amber-400',
    gradient: 'from-amber-500/30 to-orange-500/30'
  },
  {
    id: 'listening',
    name: 'Listening',
    nameSanskrit: 'श्रवण',
    description: 'Alpha-Theta for receptive awareness',
    brainwave: 'Alpha-Theta 7-8 Hz',
    gitaRef: 'BG 18.70',
    icon: Headphones,
    color: 'text-emerald-400',
    gradient: 'from-emerald-500/30 to-teal-500/30'
  },
  {
    id: 'healing',
    name: 'Healing',
    nameSanskrit: 'उपचार',
    description: 'Solfeggio 528 Hz for cellular repair',
    brainwave: 'Alpha-Theta 6-10 Hz',
    gitaRef: 'BG 6.17',
    icon: Heart,
    color: 'text-pink-400',
    gradient: 'from-pink-500/30 to-rose-500/30'
  },
  {
    id: 'yoga',
    name: 'Yoga',
    nameSanskrit: 'योग',
    description: 'Balanced alpha for body-mind harmony',
    brainwave: 'Alpha 8-12 Hz',
    gitaRef: 'BG 6.46',
    icon: Sun,
    color: 'text-orange-400',
    gradient: 'from-orange-500/30 to-amber-500/30'
  },
  {
    id: 'prayer',
    name: 'Prayer',
    nameSanskrit: 'भक्ति',
    description: 'Heart-centered frequencies',
    brainwave: 'Alpha-Theta 6-8 Hz',
    gitaRef: 'BG 9.22',
    icon: Flame,
    color: 'text-rose-400',
    gradient: 'from-rose-500/30 to-red-500/30'
  }
]

export function ActivitySoundscapeControl({
  isActive: externalActive,
  onToggle,
  compact = false
}: ActivitySoundscapeControlProps) {
  const {
    state,
    startActivity,
    stopActivity,
    setActivityVolume
  } = useAudio()

  const [selectedActivity, setSelectedActivity] = useState<ActivitySoundscape | null>(null)
  const [volume, setVolume] = useState(0.5)
  const [showAllActivities, setShowAllActivities] = useState(false)

  const isActive = externalActive ?? state.activityEnabled
  const currentActivity = state.currentActivity

  // Handle activity selection
  const handleSelectActivity = useCallback(async (activity: ActivitySoundscape) => {
    setSelectedActivity(activity)
    await startActivity(activity)
    onToggle?.(true)
  }, [startActivity, onToggle])

  // Handle stop
  const handleStop = useCallback(() => {
    stopActivity()
    setSelectedActivity(null)
    onToggle?.(false)
  }, [stopActivity, onToggle])

  // Handle volume change
  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    setActivityVolume(newVolume)
  }, [setActivityVolume])

  // Sync with external state
  useEffect(() => {
    if (currentActivity && !selectedActivity) {
      setSelectedActivity(currentActivity)
    } else if (!currentActivity && selectedActivity) {
      setSelectedActivity(null)
    }
  }, [currentActivity, selectedActivity])

  const displayedActivities = showAllActivities
    ? ACTIVITIES
    : ACTIVITIES.slice(0, compact ? 4 : 5)

  return (
    <div className="space-y-4">
      {/* Activity Grid */}
      <div className={`grid gap-2 ${compact ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-4'}`}>
        {displayedActivities.map((activity) => {
          const Icon = activity.icon
          const isSelected = currentActivity === activity.id

          return (
            <button
              key={activity.id}
              onClick={() => isSelected ? handleStop() : handleSelectActivity(activity.id)}
              className={`
                relative p-3 rounded-xl border transition-all text-left
                ${isSelected
                  ? `border-white/30 bg-gradient-to-br ${activity.gradient}`
                  : 'border-white/10 bg-white/5 hover:bg-white/10'
                }
              `}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className={`w-4 h-4 ${isSelected ? activity.color : 'text-white/50'}`} />
                <span className={`text-xs font-medium ${isSelected ? 'text-white' : 'text-white/70'}`}>
                  {activity.name}
                </span>
              </div>
              <div className="text-[10px] text-white/40">{activity.nameSanskrit}</div>
              {!compact && (
                <div className="text-[9px] text-white/30 mt-1">{activity.brainwave}</div>
              )}

              {/* Active indicator */}
              {isSelected && (
                <motion.div
                  layoutId="activityIndicator"
                  className="absolute top-1 right-1 w-2 h-2 rounded-full bg-green-400"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                />
              )}
            </button>
          )
        })}
      </div>

      {/* Show more button */}
      {ACTIVITIES.length > displayedActivities.length && (
        <button
          onClick={() => setShowAllActivities(!showAllActivities)}
          className="w-full text-xs text-white/40 hover:text-white/60 py-1"
        >
          {showAllActivities ? 'Show less' : `Show ${ACTIVITIES.length - displayedActivities.length} more`}
        </button>
      )}

      {/* Current Activity Info */}
      <AnimatePresence>
        {currentActivity && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {(() => {
              const activity = ACTIVITIES.find(a => a.id === currentActivity)
              if (!activity) return null

              return (
                <div className={`p-3 rounded-xl bg-gradient-to-br ${activity.gradient} border border-white/10`}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="text-sm font-medium text-white">
                        {activity.name} Mode Active
                      </div>
                      <div className="text-xs text-white/60">{activity.description}</div>
                    </div>
                    <button
                      onClick={handleStop}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/70"
                    >
                      Stop
                    </button>
                  </div>

                  {/* Volume control */}
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-white/50" />
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none cursor-pointer bg-white/20 accent-white"
                    />
                    <span className="text-xs text-white/50 w-8">{Math.round(volume * 100)}%</span>
                  </div>

                  {/* Gita reference */}
                  <div className="mt-2 pt-2 border-t border-white/10">
                    <div className="text-[10px] text-white/40">
                      Gita: {activity.gitaRef} • {activity.brainwave}
                    </div>
                  </div>
                </div>
              )
            })()}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info text when nothing selected */}
      {!currentActivity && !compact && (
        <div className="text-xs text-white/40 text-center">
          Select an activity to optimize your brain frequencies
        </div>
      )}
    </div>
  )
}

export default ActivitySoundscapeControl
