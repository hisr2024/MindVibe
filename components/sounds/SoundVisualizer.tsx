'use client'

/**
 * Sound Visualizer Component
 *
 * Beautiful animated audio visualizer with multiple modes:
 * - Bars: Classic frequency bars with glow effects
 * - Waves: Organic flowing waveform
 * - Particles: Ambient particle system
 * - Orb: Central glowing orb that pulses with audio
 */

import { useEffect, useRef, useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type VisualizerMode = 'bars' | 'waves' | 'particles' | 'orb'

export interface SoundVisualizerProps {
  isPlaying: boolean
  intensity?: number // 0-1
  mode?: VisualizerMode
  color?: 'sunrise' | 'ocean' | 'aurora' | 'nature' | 'spiritual'
  className?: string
  size?: 'sm' | 'md' | 'lg' | 'full'
}

const COLOR_SCHEMES = {
  sunrise: {
    primary: '#ff9159',
    secondary: '#ffd070',
    glow: 'rgba(255, 145, 89, 0.4)',
    gradient: 'from-orange-500/30 via-amber-500/20 to-yellow-500/10'
  },
  ocean: {
    primary: '#17b1a7',
    secondary: '#6dd7f2',
    glow: 'rgba(23, 177, 167, 0.4)',
    gradient: 'from-teal-500/30 via-cyan-500/20 to-blue-500/10'
  },
  aurora: {
    primary: '#ff8fb4',
    secondary: '#c2a5ff',
    glow: 'rgba(255, 143, 180, 0.4)',
    gradient: 'from-pink-500/30 via-purple-500/20 to-violet-500/10'
  },
  nature: {
    primary: '#22c55e',
    secondary: '#86efac',
    glow: 'rgba(34, 197, 94, 0.4)',
    gradient: 'from-green-500/30 via-emerald-500/20 to-teal-500/10'
  },
  spiritual: {
    primary: '#a78bfa',
    secondary: '#ddd6fe',
    glow: 'rgba(167, 139, 250, 0.4)',
    gradient: 'from-violet-500/30 via-purple-500/20 to-indigo-500/10'
  }
}

const SIZE_MAP = {
  sm: 'h-24',
  md: 'h-40',
  lg: 'h-64',
  full: 'h-full min-h-[200px]'
}

// Generate pseudo-random but consistent values
function generateBars(count: number, intensity: number, isPlaying: boolean): number[] {
  return Array.from({ length: count }, (_, i) => {
    if (!isPlaying) return 0.1
    const base = Math.sin(Date.now() / 500 + i * 0.5) * 0.3 + 0.5
    const variance = Math.sin(Date.now() / 200 + i * 1.2) * 0.2
    return Math.max(0.1, Math.min(1, (base + variance) * intensity))
  })
}

// Bars Visualizer
function BarsVisualizer({
  isPlaying,
  intensity,
  colors
}: {
  isPlaying: boolean
  intensity: number
  colors: typeof COLOR_SCHEMES.sunrise
}) {
  const [bars, setBars] = useState<number[]>([])
  const barCount = 32

  useEffect(() => {
    if (!isPlaying) {
      setBars(Array(barCount).fill(0.1))
      return
    }

    const interval = setInterval(() => {
      setBars(generateBars(barCount, intensity, isPlaying))
    }, 50)

    return () => clearInterval(interval)
  }, [isPlaying, intensity])

  return (
    <div className="flex items-end justify-center gap-[2px] h-full px-4">
      {bars.map((height, i) => (
        <motion.div
          key={i}
          className="w-2 rounded-full"
          style={{
            background: `linear-gradient(to top, ${colors.primary}, ${colors.secondary})`,
            boxShadow: isPlaying ? `0 0 10px ${colors.glow}` : 'none',
          }}
          animate={{
            height: `${height * 100}%`,
            opacity: isPlaying ? 0.6 + height * 0.4 : 0.3
          }}
          transition={{
            duration: 0.1,
            ease: 'easeOut'
          }}
        />
      ))}
    </div>
  )
}

// Waves Visualizer
function WavesVisualizer({
  isPlaying,
  intensity,
  colors
}: {
  isPlaying: boolean
  intensity: number
  colors: typeof COLOR_SCHEMES.sunrise
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2
      canvas.height = canvas.offsetHeight * 2
      ctx.scale(2, 2)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const width = canvas.offsetWidth
      const height = canvas.offsetHeight

      ctx.clearRect(0, 0, width, height)

      if (isPlaying) {
        timeRef.current += 0.02
      }

      // Draw multiple wave layers
      for (let layer = 0; layer < 3; layer++) {
        ctx.beginPath()
        ctx.moveTo(0, height / 2)

        for (let x = 0; x <= width; x += 2) {
          const frequency = 0.02 - layer * 0.005
          const amplitude = isPlaying
            ? (height / 4) * intensity * (1 - layer * 0.2)
            : height / 20
          const y = height / 2 +
            Math.sin(x * frequency + timeRef.current + layer) * amplitude +
            Math.sin(x * frequency * 2 + timeRef.current * 1.5 + layer) * amplitude * 0.3

          ctx.lineTo(x, y)
        }

        ctx.strokeStyle = layer === 0 ? colors.primary : colors.secondary
        ctx.lineWidth = 3 - layer
        ctx.globalAlpha = 1 - layer * 0.3
        ctx.stroke()
      }

      ctx.globalAlpha = 1
      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isPlaying, intensity, colors])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
    />
  )
}

// Orb Visualizer
function OrbVisualizer({
  isPlaying,
  intensity,
  colors
}: {
  isPlaying: boolean
  intensity: number
  colors: typeof COLOR_SCHEMES.sunrise
}) {
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (!isPlaying) {
      setScale(1)
      return
    }

    const interval = setInterval(() => {
      const pulse = 1 + Math.sin(Date.now() / 300) * 0.15 * intensity
      setScale(pulse)
    }, 50)

    return () => clearInterval(interval)
  }, [isPlaying, intensity])

  return (
    <div className="flex items-center justify-center h-full">
      <motion.div
        className="relative"
        animate={{ scale }}
        transition={{ duration: 0.1 }}
      >
        {/* Outer glow rings */}
        {[1, 2, 3].map((ring) => (
          <motion.div
            key={ring}
            className="absolute rounded-full"
            style={{
              width: `${100 + ring * 40}px`,
              height: `${100 + ring * 40}px`,
              left: `${-ring * 20}px`,
              top: `${-ring * 20}px`,
              border: `2px solid ${colors.primary}`,
              opacity: isPlaying ? (0.4 - ring * 0.1) : 0.1,
              boxShadow: `0 0 ${20 + ring * 10}px ${colors.glow}`,
            }}
            animate={{
              scale: isPlaying ? [1, 1.1, 1] : 1,
              opacity: isPlaying ? [0.3 - ring * 0.08, 0.5 - ring * 0.1, 0.3 - ring * 0.08] : 0.1,
            }}
            transition={{
              duration: 2 + ring * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: ring * 0.2
            }}
          />
        ))}

        {/* Core orb */}
        <motion.div
          className="relative w-[100px] h-[100px] rounded-full"
          style={{
            background: `radial-gradient(circle at 30% 30%, ${colors.secondary}, ${colors.primary})`,
            boxShadow: `
              0 0 60px ${colors.glow},
              inset 0 0 30px rgba(255, 255, 255, 0.2)
            `,
          }}
          animate={{
            boxShadow: isPlaying
              ? [
                  `0 0 60px ${colors.glow}, inset 0 0 30px rgba(255, 255, 255, 0.2)`,
                  `0 0 100px ${colors.glow}, inset 0 0 40px rgba(255, 255, 255, 0.3)`,
                  `0 0 60px ${colors.glow}, inset 0 0 30px rgba(255, 255, 255, 0.2)`,
                ]
              : `0 0 30px ${colors.glow}, inset 0 0 20px rgba(255, 255, 255, 0.1)`
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </motion.div>
    </div>
  )
}

// Particles Visualizer
function ParticlesVisualizer({
  isPlaying,
  intensity,
  colors
}: {
  isPlaying: boolean
  intensity: number
  colors: typeof COLOR_SCHEMES.sunrise
}) {
  const particleCount = 40
  const particles = useMemo(() =>
    Array.from({ length: particleCount }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 2 + Math.random() * 4,
      speed: 0.5 + Math.random() * 1.5,
      delay: Math.random() * 2,
    })),
  [])

  return (
    <div className="relative w-full h-full overflow-hidden">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            background: particle.id % 2 === 0 ? colors.primary : colors.secondary,
            boxShadow: `0 0 ${particle.size * 2}px ${colors.glow}`,
          }}
          initial={{ y: '100%', opacity: 0 }}
          animate={{
            y: isPlaying ? [100, -10] : [100, 90],
            opacity: isPlaying ? [0, intensity * 0.8, 0] : 0.2,
          }}
          transition={{
            duration: particle.speed * (isPlaying ? 3 : 10),
            repeat: Infinity,
            delay: particle.delay,
            ease: 'linear'
          }}
        />
      ))}

      {/* Central ambient glow */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
      >
        <motion.div
          className="w-32 h-32 rounded-full blur-3xl"
          style={{ background: colors.glow }}
          animate={{
            scale: isPlaying ? [1, 1.3, 1] : 1,
            opacity: isPlaying ? [0.3, 0.5, 0.3] : 0.15,
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        />
      </div>
    </div>
  )
}

export function SoundVisualizer({
  isPlaying,
  intensity = 0.7,
  mode = 'orb',
  color = 'sunrise',
  className = '',
  size = 'md'
}: SoundVisualizerProps) {
  const colors = COLOR_SCHEMES[color]

  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${SIZE_MAP[size]} ${className}`}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-50`} />

      {/* Visualizer content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          className="relative w-full h-full"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {mode === 'bars' && (
            <BarsVisualizer isPlaying={isPlaying} intensity={intensity} colors={colors} />
          )}
          {mode === 'waves' && (
            <WavesVisualizer isPlaying={isPlaying} intensity={intensity} colors={colors} />
          )}
          {mode === 'orb' && (
            <OrbVisualizer isPlaying={isPlaying} intensity={intensity} colors={colors} />
          )}
          {mode === 'particles' && (
            <ParticlesVisualizer isPlaying={isPlaying} intensity={intensity} colors={colors} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export default SoundVisualizer
