'use client'

/**
 * Spatial Audio Control Component
 *
 * UI for 3D immersive sound positioning:
 * - Room environment selection
 * - 3D position visualization
 * - Movement path selection
 * - Chakra-aligned positioning
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Headphones,
  Play,
  Pause,
  Settings2,
  Circle,
  RotateCw,
  Waves,
  Mountain,
  TreePine,
  Sparkles
} from 'lucide-react'

// ============ Types ============

export type RoomEnvironment = 'temple' | 'cave' | 'forest' | 'cosmic' | 'room'

export type MovementPath = 'static' | 'orbit' | 'spiral' | 'figure_eight' | 'random'

export interface SpatialAudioControlProps {
  isActive?: boolean
  onToggle?: (active: boolean) => void
  onEnvironmentChange?: (env: RoomEnvironment) => void
  onMovementChange?: (path: MovementPath) => void
  compact?: boolean
  className?: string
}

// ============ Configuration ============

const ENVIRONMENTS: Record<RoomEnvironment, {
  name: string
  nameHindi: string
  description: string
  icon: typeof Headphones
  color: string
  reverbLevel: number
}> = {
  temple: {
    name: 'Sacred Temple',
    nameHindi: 'पवित्र मंदिर',
    description: 'Deep reverb, spiritual atmosphere',
    icon: Sparkles,
    color: 'text-[#d4a44c]',
    reverbLevel: 0.8
  },
  cave: {
    name: 'Crystal Cave',
    nameHindi: 'क्रिस्टल गुफा',
    description: 'Echo-rich, grounding space',
    icon: Mountain,
    color: 'text-purple-400',
    reverbLevel: 0.9
  },
  forest: {
    name: 'Forest Clearing',
    nameHindi: 'वन प्रांगण',
    description: 'Natural ambience, open space',
    icon: TreePine,
    color: 'text-emerald-400',
    reverbLevel: 0.4
  },
  cosmic: {
    name: 'Cosmic Void',
    nameHindi: 'ब्रह्मांडीय शून्य',
    description: 'Infinite space, ethereal',
    icon: Sparkles,
    color: 'text-blue-400',
    reverbLevel: 1.0
  },
  room: {
    name: 'Meditation Room',
    nameHindi: 'ध्यान कक्ष',
    description: 'Intimate, focused space',
    icon: Circle,
    color: 'text-[#d4a44c]',
    reverbLevel: 0.3
  }
}

const MOVEMENT_PATHS: Record<MovementPath, {
  name: string
  description: string
  icon: typeof RotateCw
}> = {
  static: {
    name: 'Static',
    description: 'Fixed position',
    icon: Circle
  },
  orbit: {
    name: 'Orbit',
    description: 'Circular movement around you',
    icon: RotateCw
  },
  spiral: {
    name: 'Spiral',
    description: 'Inward/outward spiral',
    icon: Waves
  },
  figure_eight: {
    name: 'Figure 8',
    description: 'Infinity path movement',
    icon: RotateCw
  },
  random: {
    name: 'Random',
    description: 'Organic movement',
    icon: Sparkles
  }
}

// ============ 3D Position Visualizer ============

function PositionVisualizer({
  environment,
  path,
  isPlaying
}: {
  environment: RoomEnvironment
  path: MovementPath
  isPlaying: boolean
}) {
  const envConfig = ENVIRONMENTS[environment]

  return (
    <div className="relative w-full aspect-square max-w-[200px] mx-auto">
      {/* Environment circle */}
      <div className={`absolute inset-0 rounded-full border-2 border-dashed ${
        envConfig.color.replace('text-', 'border-')
      }/30`} />

      {/* Inner circles for depth */}
      <div className="absolute inset-4 rounded-full border border-white/10" />
      <div className="absolute inset-8 rounded-full border border-white/5" />

      {/* Center point (listener) */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-3 h-3 rounded-full bg-white/80 shadow-lg shadow-white/30" />
      </div>

      {/* Moving sound source */}
      <AnimatePresence>
        {isPlaying && (
          <motion.div
            className={`absolute w-4 h-4 rounded-full ${
              envConfig.color.replace('text-', 'bg-')
            } shadow-lg`}
            style={{ top: '50%', left: '50%', marginTop: -8, marginLeft: -8 }}
            animate={
              path === 'orbit' ? {
                x: [0, 60, 0, -60, 0],
                y: [-60, 0, 60, 0, -60]
              } : path === 'spiral' ? {
                x: [0, 30, 60, 30, 0, -30, -60, -30, 0],
                y: [0, -30, 0, 30, 60, 30, 0, -30, 0],
                scale: [1, 0.8, 0.6, 0.8, 1, 0.8, 0.6, 0.8, 1]
              } : path === 'figure_eight' ? {
                x: [0, 40, 0, -40, 0],
                y: [-30, 0, 30, 0, -30]
              } : path === 'random' ? {
                x: [0, 30, -20, 50, -40, 10, 0],
                y: [-40, 20, 40, -10, -30, 50, -40]
              } : { x: 0, y: -50 }
            }
            transition={{
              duration: path === 'static' ? 0 : 8,
              repeat: Infinity,
              ease: 'linear'
            }}
          >
            <motion.div
              animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0.4, 0.8] }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`absolute inset-0 rounded-full ${
                envConfig.color.replace('text-', 'bg-')
              }/30`}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Environment label */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap">
        <span className={`text-xs font-medium ${envConfig.color}`}>
          {envConfig.name}
        </span>
      </div>
    </div>
  )
}

// ============ Component ============

export function SpatialAudioControl({
  isActive = false,
  onToggle,
  onEnvironmentChange,
  onMovementChange,
  compact = false,
  className = ''
}: SpatialAudioControlProps) {
  const [playing, setPlaying] = useState(isActive)
  const [environment, setEnvironment] = useState<RoomEnvironment>('temple')
  const [movementPath, setMovementPath] = useState<MovementPath>('orbit')
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    setPlaying(isActive)
  }, [isActive])

  const handleToggle = useCallback(() => {
    const newState = !playing
    setPlaying(newState)
    onToggle?.(newState)
  }, [playing, onToggle])

  const handleEnvironmentChange = useCallback((env: RoomEnvironment) => {
    setEnvironment(env)
    onEnvironmentChange?.(env)
  }, [onEnvironmentChange])

  const handleMovementChange = useCallback((path: MovementPath) => {
    setMovementPath(path)
    onMovementChange?.(path)
  }, [onMovementChange])

  const currentEnv = ENVIRONMENTS[environment]
  const _EnvIcon = currentEnv.icon

  // Compact view
  if (compact) {
    return (
      <div className={`rounded-xl border border-blue-500/20 bg-black/30 p-3 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <Headphones className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-medium text-white">3D Spatial Audio</p>
              <p className="text-[10px] text-white/50">{currentEnv.name}</p>
            </div>
          </div>
          <button
            onClick={handleToggle}
            className={`p-2 rounded-lg transition-all ${
              playing
                ? 'bg-blue-500/30 text-blue-300'
                : 'bg-white/5 text-white/50 hover:bg-white/10'
            }`}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
        </div>
      </div>
    )
  }

  // Full view
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-950/40 to-black/40 backdrop-blur-sm overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-500/20">
              <Headphones className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-white">3D Spatial Audio</h3>
              <p className="text-xs text-white/50">Immersive Sound Positioning</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-2 rounded-lg transition-colors ${
                showSettings ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-white/50 hover:bg-white/10'
              }`}
            >
              <Settings2 className="w-4 h-4" />
            </button>

            <button
              onClick={handleToggle}
              className={`p-2.5 rounded-xl transition-all ${
                playing
                  ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
                  : 'bg-white/10 text-white/70 hover:bg-white/15'
              }`}
            >
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* 3D Visualizer */}
      <div className="p-6 bg-gradient-to-b from-transparent to-white/[0.02]">
        <PositionVisualizer
          environment={environment}
          path={movementPath}
          isPlaying={playing}
        />
      </div>

      {/* Environment Selection */}
      <div className="p-4 border-t border-white/5">
        <p className="text-xs font-medium text-white/50 mb-3">Environment</p>
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
          {(Object.keys(ENVIRONMENTS) as RoomEnvironment[]).map((env) => {
            const config = ENVIRONMENTS[env]
            const Icon = config.icon
            const isSelected = environment === env

            return (
              <button
                key={env}
                onClick={() => handleEnvironmentChange(env)}
                className={`flex-shrink-0 px-3 py-2 rounded-xl border transition-all ${
                  isSelected
                    ? `border-${config.color.replace('text-', '')}/50 bg-white/10`
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <Icon className={`w-4 h-4 mx-auto mb-1 ${isSelected ? config.color : 'text-white/40'}`} />
                <p className={`text-xs whitespace-nowrap ${isSelected ? 'text-white' : 'text-white/60'}`}>
                  {config.name}
                </p>
              </button>
            )
          })}
        </div>
      </div>

      {/* Movement Path Settings */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-white/5"
          >
            <div className="p-4">
              <p className="text-xs font-medium text-white/50 mb-3">Sound Movement</p>
              <div className="grid grid-cols-5 gap-2">
                {(Object.keys(MOVEMENT_PATHS) as MovementPath[]).map((path) => {
                  const config = MOVEMENT_PATHS[path]
                  const Icon = config.icon
                  const isSelected = movementPath === path

                  return (
                    <button
                      key={path}
                      onClick={() => handleMovementChange(path)}
                      className={`p-2 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-blue-500/50 bg-blue-500/20'
                          : 'border-white/10 bg-white/5 hover:bg-white/10'
                      }`}
                    >
                      <Icon className={`w-4 h-4 mx-auto ${isSelected ? 'text-blue-400' : 'text-white/40'}`} />
                      <p className={`text-[10px] mt-1 ${isSelected ? 'text-white' : 'text-white/50'}`}>
                        {config.name}
                      </p>
                    </button>
                  )
                })}
              </div>

              {/* Reverb Level Display */}
              <div className="mt-4 p-3 rounded-xl bg-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-white/50">Reverb Level</span>
                  <span className="text-xs text-white/70">{Math.round(currentEnv.reverbLevel * 100)}%</span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${currentEnv.reverbLevel * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Headphone Reminder */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <Headphones className="w-4 h-4 text-blue-400 flex-shrink-0" />
          <p className="text-[10px] text-blue-300/80">
            Use headphones for the best 3D audio experience
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export default SpatialAudioControl
