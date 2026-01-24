'use client'

/**
 * Floating Sound Player Component
 *
 * Compact, always-accessible mini player:
 * - Shows current playing scene
 * - Quick controls (play/pause, volume)
 * - Expandable for more options
 * - Draggable position
 */

import { useState, useCallback } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  X,
  ChevronUp,
  Music,
  SkipForward,
  Maximize2
} from 'lucide-react'
import { useAudio } from '@/contexts/AudioContext'
import { SOUND_SCENES, type SoundScene } from './SoundSceneCard'
import Link from 'next/link'

export interface FloatingSoundPlayerProps {
  onExpand?: () => void
  className?: string
}

export function FloatingSoundPlayer({
  onExpand,
  className = ''
}: FloatingSoundPlayerProps) {
  const {
    stopAmbient,
    setAmbientVolume,
    state: audioState,
    playSound
  } = useAudio()

  const [isExpanded, setIsExpanded] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)

  const dragControls = useDragControls()

  // Get current scene based on audio state
  const currentScene: SoundScene | null = audioState.currentAmbient
    ? SOUND_SCENES.find(s => {
        // Map ambient to scene
        const mapping: Record<string, string[]> = {
          'nature': ['morning-peace'],
          'temple': ['temple-dawn'],
          'focus': ['deep-focus', 'energy-boost'],
          'rain': ['rainforest'],
          'ocean': ['ocean-waves'],
          'river': ['mountain-stream'],
          'night': ['deep-sleep'],
          'fire': ['cozy-fireplace'],
          'tibetan': ['meditation-temple'],
          'forest': ['forest-night'],
          'healing': ['heart-healing']
        }
        return mapping[audioState.currentAmbient as string]?.includes(s.id)
      }) || null
    : null

  const isPlaying = audioState.ambientEnabled

  const handleTogglePlay = useCallback(async () => {
    playSound('click')
    if (isPlaying) {
      stopAmbient()
    }
    // If not playing, redirect to sounds page
  }, [isPlaying, stopAmbient, playSound])

  const handleMuteToggle = useCallback(() => {
    if (isMuted) {
      setAmbientVolume(volume)
      setIsMuted(false)
    } else {
      setAmbientVolume(0)
      setIsMuted(true)
    }
    playSound('toggle')
  }, [isMuted, volume, setAmbientVolume, playSound])

  const handleVolumeChange = useCallback((newVolume: number) => {
    setVolume(newVolume)
    setAmbientVolume(newVolume)
    if (newVolume === 0) {
      setIsMuted(true)
    } else if (isMuted) {
      setIsMuted(false)
    }
  }, [setAmbientVolume, isMuted])

  const handleDismiss = useCallback(() => {
    stopAmbient()
    setIsDismissed(true)
  }, [stopAmbient])

  // Only show if something is playing and not dismissed
  if (!isPlaying || isDismissed) {
    return null
  }

  return (
    <motion.div
      drag
      dragControls={dragControls}
      dragMomentum={false}
      dragElastic={0.1}
      initial={{ opacity: 0, y: 100, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 100, scale: 0.9 }}
      className={`
        fixed bottom-24 right-4 z-50
        ${className}
      `}
    >
      <motion.div
        layout
        className={`
          rounded-2xl border border-white/10 bg-[#0d0d10]/95 backdrop-blur-xl
          shadow-[0_20px_60px_rgba(0,0,0,0.5)]
          overflow-hidden
          ${isExpanded ? 'w-80' : 'w-auto'}
        `}
      >
        {/* Main bar */}
        <div className="flex items-center gap-3 p-3">
          {/* Playing indicator / scene icon */}
          <div className="relative">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/30 to-amber-500/20">
              {currentScene ? (
                <currentScene.icon className="w-5 h-5 text-orange-400" />
              ) : (
                <Music className="w-5 h-5 text-orange-400" />
              )}
            </div>

            {/* Playing animation */}
            <motion.div
              className="absolute -bottom-0.5 -right-0.5 flex gap-0.5"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              {[1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-0.5 bg-orange-400 rounded-full"
                  animate={{ height: [2, 6, 2] }}
                  transition={{
                    duration: 0.4,
                    repeat: Infinity,
                    delay: i * 0.1,
                  }}
                />
              ))}
            </motion.div>
          </div>

          {/* Scene info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {currentScene?.name || 'Ambient Sounds'}
            </p>
            <p className="text-[10px] text-white/50 truncate">
              {currentScene?.nameHindi || 'Playing'}
            </p>
          </div>

          {/* Quick controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleTogglePlay}
              className="p-2 rounded-lg bg-orange-500/20 text-orange-400 hover:bg-orange-500/30 transition-colors"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-2 rounded-lg bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70 transition-colors"
            >
              <ChevronUp className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>

            <button
              onClick={handleDismiss}
              className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-red-500/20 hover:text-red-400 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Expanded section */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="px-3 pb-3 space-y-3 border-t border-white/5 pt-3">
                {/* Volume control */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMuteToggle}
                    className="p-1.5 rounded-lg text-white/50 hover:text-white/70 transition-colors"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX className="w-4 h-4" />
                    ) : (
                      <Volume2 className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                    className="flex-1 h-1 rounded-full appearance-none cursor-pointer bg-white/10 accent-orange-500"
                  />
                  <span className="text-[10px] text-white/40 w-6 text-right">
                    {Math.round((isMuted ? 0 : volume) * 100)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Link
                    href="/sounds"
                    className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-white/5 text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    onClick={() => onExpand?.()}
                  >
                    <Maximize2 className="w-4 h-4" />
                    <span className="text-xs font-medium">Open Full Player</span>
                  </Link>
                </div>

                {/* Current scene description */}
                {currentScene && (
                  <div className="p-2 rounded-lg bg-white/5">
                    <p className="text-[10px] text-white/40 mb-0.5">Current Scene</p>
                    <p className="text-xs text-white/60">{currentScene.description}</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export default FloatingSoundPlayer
