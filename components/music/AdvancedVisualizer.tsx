'use client'

/**
 * Advanced Audio Visualizer
 *
 * ॐ श्री गणेशाय नमः
 *
 * Professional audio visualization with multiple modes:
 * - Waveform (static overview with seek)
 * - Spectrum Analyzer (frequency bars)
 * - Circular Progress (rotating ring)
 * - Breathing Circle (meditation sync)
 * - Particle System (reactive particles)
 * - Chakra Visualization (energy centers)
 *
 * Based on Bhagavad Gita Chapter 11 - Vishvarupa Darshana
 * "अनेकबाहूदरवक्त्रनेत्रं" - Infinite forms and manifestations
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMusic, type BrainwaveState } from '@/contexts/MusicContext'

// ============ Types ============

export type VisualizationType =
  | 'waveform'
  | 'spectrum'
  | 'circular'
  | 'breathing'
  | 'particles'
  | 'chakra'
  | 'mandala'
  | 'aurora'

interface VisualizerProps {
  type?: VisualizationType
  isPlaying?: boolean
  currentTime?: number
  duration?: number
  waveformData?: number[]
  onSeek?: (time: number) => void
  colorScheme?: 'purple' | 'blue' | 'green' | 'orange' | 'chakra' | 'custom'
  customColors?: string[]
  className?: string
  size?: 'small' | 'medium' | 'large' | 'full'
  showControls?: boolean
  breathingPattern?: {
    inhale: number
    hold: number
    exhale: number
    holdEmpty: number
  }
  brainwaveState?: BrainwaveState
}

// ============ Color Schemes ============

const COLOR_SCHEMES = {
  purple: ['#7c3aed', '#a78bfa', '#c4b5fd', '#e9d5ff'],
  blue: ['#2563eb', '#60a5fa', '#93c5fd', '#bfdbfe'],
  green: ['#059669', '#34d399', '#6ee7b7', '#a7f3d0'],
  orange: ['#ea580c', '#fb923c', '#fdba74', '#fed7aa'],
  chakra: ['#dc2626', '#ea580c', '#eab308', '#22c55e', '#0ea5e9', '#4f46e5', '#a855f7'],
  custom: []
}

const BRAINWAVE_COLORS: Record<BrainwaveState, string[]> = {
  delta: ['#1e1b4b', '#3730a3', '#4f46e5', '#818cf8'],
  theta: ['#4c1d95', '#6d28d9', '#8b5cf6', '#a78bfa'],
  alpha: ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa'],
  beta: ['#064e3b', '#059669', '#10b981', '#34d399'],
  gamma: ['#78350f', '#d97706', '#f59e0b', '#fbbf24']
}

// ============ Helper Functions ============

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

// ============ Main Component ============

export function AdvancedVisualizer({
  type = 'spectrum',
  isPlaying = false,
  currentTime = 0,
  duration = 0,
  waveformData,
  onSeek,
  colorScheme = 'purple',
  customColors,
  className = '',
  size = 'medium',
  showControls = true,
  breathingPattern = { inhale: 4, hold: 2, exhale: 6, holdEmpty: 2 },
  brainwaveState
}: VisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)

  const [selectedType, setSelectedType] = useState<VisualizationType>(type)
  const [breathPhase, setBreathPhase] = useState<'inhale' | 'hold' | 'exhale' | 'holdEmpty'>('inhale')
  const [breathProgress, setBreathProgress] = useState(0)

  // Get colors based on scheme and brainwave state
  const colors = useMemo(() => {
    if (customColors && customColors.length > 0) return customColors
    if (brainwaveState) return BRAINWAVE_COLORS[brainwaveState]
    return COLOR_SCHEMES[colorScheme]
  }, [colorScheme, customColors, brainwaveState])

  // Size mappings
  const sizeClasses = {
    small: 'h-16',
    medium: 'h-32',
    large: 'h-64',
    full: 'h-full min-h-[200px]'
  }

  // ============ Breathing Pattern Logic ============

  useEffect(() => {
    if (selectedType !== 'breathing' || !isPlaying) return

    const { inhale, hold, exhale, holdEmpty } = breathingPattern
    const totalCycle = inhale + hold + exhale + holdEmpty

    let elapsed = 0
    const interval = setInterval(() => {
      elapsed += 0.1

      // Determine current phase
      let phaseTime = elapsed % totalCycle

      if (phaseTime < inhale) {
        setBreathPhase('inhale')
        setBreathProgress(phaseTime / inhale)
      } else if (phaseTime < inhale + hold) {
        setBreathPhase('hold')
        setBreathProgress((phaseTime - inhale) / hold)
      } else if (phaseTime < inhale + hold + exhale) {
        setBreathPhase('exhale')
        setBreathProgress((phaseTime - inhale - hold) / exhale)
      } else {
        setBreathPhase('holdEmpty')
        setBreathProgress((phaseTime - inhale - hold - exhale) / holdEmpty)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [selectedType, isPlaying, breathingPattern])

  // ============ Canvas Animation ============

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Set canvas size
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }
    resizeCanvas()

    let phase = 0

    const animate = () => {
      const width = canvas.width / window.devicePixelRatio
      const height = canvas.height / window.devicePixelRatio

      // Clear canvas
      ctx.fillStyle = 'rgba(0, 0, 0, 0.1)'
      ctx.fillRect(0, 0, width, height)

      if (!isPlaying) {
        // Draw static state
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)'
        ctx.fillRect(0, 0, width, height)
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      switch (selectedType) {
        case 'waveform':
          drawWaveform(ctx, width, height, phase, colors)
          break
        case 'spectrum':
          drawSpectrum(ctx, width, height, phase, colors)
          break
        case 'circular':
          drawCircular(ctx, width, height, phase, colors, currentTime, duration)
          break
        case 'breathing':
          drawBreathing(ctx, width, height, breathPhase, breathProgress, colors)
          break
        case 'particles':
          drawParticles(ctx, width, height, phase, colors)
          break
        case 'chakra':
          drawChakra(ctx, width, height, phase)
          break
        case 'mandala':
          drawMandala(ctx, width, height, phase, colors)
          break
        case 'aurora':
          drawAurora(ctx, width, height, phase, colors)
          break
      }

      phase += 0.02
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [selectedType, isPlaying, colors, currentTime, duration, breathPhase, breathProgress])

  // ============ Drawing Functions ============

  const drawWaveform = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    phase: number,
    colors: string[]
  ) => {
    const centerY = height / 2
    const amplitude = height * 0.35

    ctx.beginPath()
    ctx.moveTo(0, centerY)

    for (let x = 0; x < width; x++) {
      const frequency = 0.02
      const y = centerY +
        Math.sin((x * frequency) + phase) * amplitude * 0.6 +
        Math.sin((x * frequency * 2) + phase * 1.5) * amplitude * 0.3 +
        Math.sin((x * frequency * 0.5) + phase * 0.7) * amplitude * 0.1
      ctx.lineTo(x, y)
    }

    ctx.strokeStyle = colors[0]
    ctx.lineWidth = 2
    ctx.shadowColor = colors[0]
    ctx.shadowBlur = 10
    ctx.stroke()

    // Draw second wave
    ctx.beginPath()
    ctx.moveTo(0, centerY)

    for (let x = 0; x < width; x++) {
      const y = centerY +
        Math.sin((x * 0.015) + phase * 0.8) * amplitude * 0.4 +
        Math.sin((x * 0.03) + phase * 1.2) * amplitude * 0.2
      ctx.lineTo(x, y)
    }

    ctx.strokeStyle = colors[1] || colors[0]
    ctx.lineWidth = 1.5
    ctx.shadowBlur = 5
    ctx.stroke()
  }

  const drawSpectrum = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    phase: number,
    colors: string[]
  ) => {
    const barCount = 64
    const barWidth = (width / barCount) * 0.8
    const barGap = (width / barCount) * 0.2

    for (let i = 0; i < barCount; i++) {
      // Simulate frequency data with sine waves
      const frequency = (i / barCount) * 10 + 1
      const amplitude = Math.sin(phase * frequency * 0.5) * 0.3 +
        Math.sin(phase * frequency * 0.3 + i * 0.1) * 0.3 +
        Math.sin(phase + i * 0.2) * 0.2 +
        0.3

      const barHeight = amplitude * height * 0.8

      const x = i * (barWidth + barGap) + barGap / 2
      const y = height - barHeight

      // Gradient for each bar
      const gradient = ctx.createLinearGradient(x, y, x, height)
      gradient.addColorStop(0, colors[0])
      gradient.addColorStop(0.5, colors[1] || colors[0])
      gradient.addColorStop(1, colors[2] || colors[1] || colors[0])

      ctx.fillStyle = gradient
      ctx.shadowColor = colors[0]
      ctx.shadowBlur = 5

      // Rounded bars
      const radius = barWidth / 2
      ctx.beginPath()
      ctx.moveTo(x + radius, y)
      ctx.lineTo(x + barWidth - radius, y)
      ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius)
      ctx.lineTo(x + barWidth, height)
      ctx.lineTo(x, height)
      ctx.lineTo(x, y + radius)
      ctx.quadraticCurveTo(x, y, x + radius, y)
      ctx.fill()
    }
  }

  const drawCircular = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    phase: number,
    colors: string[],
    currentTime: number,
    duration: number
  ) => {
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(width, height) * 0.35

    // Progress ring
    const progress = duration > 0 ? currentTime / duration : 0

    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 8
    ctx.stroke()

    // Active progress
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, -Math.PI / 2, -Math.PI / 2 + (progress * Math.PI * 2))
    const gradient = ctx.createLinearGradient(centerX - radius, centerY, centerX + radius, centerY)
    gradient.addColorStop(0, colors[0])
    gradient.addColorStop(1, colors[1] || colors[0])
    ctx.strokeStyle = gradient
    ctx.lineWidth = 8
    ctx.lineCap = 'round'
    ctx.shadowColor = colors[0]
    ctx.shadowBlur = 15
    ctx.stroke()

    // Animated inner rings
    for (let r = 0; r < 3; r++) {
      const innerRadius = radius * (0.3 + r * 0.2)
      const points = 32

      ctx.beginPath()
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2
        const wobble = Math.sin(phase * 2 + i * 0.5 + r) * (radius * 0.05)
        const x = centerX + Math.cos(angle) * (innerRadius + wobble)
        const y = centerY + Math.sin(angle) * (innerRadius + wobble)

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.strokeStyle = `${colors[r % colors.length]}40`
      ctx.lineWidth = 1
      ctx.shadowBlur = 0
      ctx.stroke()
    }
  }

  const drawBreathing = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    phase: 'inhale' | 'hold' | 'exhale' | 'holdEmpty',
    progress: number,
    colors: string[]
  ) => {
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.4
    const minRadius = maxRadius * 0.3

    // Calculate current radius based on phase
    let targetRadius: number
    switch (phase) {
      case 'inhale':
        targetRadius = lerp(minRadius, maxRadius, progress)
        break
      case 'hold':
        targetRadius = maxRadius
        break
      case 'exhale':
        targetRadius = lerp(maxRadius, minRadius, progress)
        break
      case 'holdEmpty':
        targetRadius = minRadius
        break
    }

    // Draw breathing circle with gradient
    const gradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, targetRadius
    )
    gradient.addColorStop(0, `${colors[0]}80`)
    gradient.addColorStop(0.5, `${colors[1] || colors[0]}40`)
    gradient.addColorStop(1, `${colors[2] || colors[0]}10`)

    ctx.beginPath()
    ctx.arc(centerX, centerY, targetRadius, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.shadowColor = colors[0]
    ctx.shadowBlur = 30
    ctx.fill()

    // Outer glow rings
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath()
      ctx.arc(centerX, centerY, targetRadius + i * 15, 0, Math.PI * 2)
      ctx.strokeStyle = `${colors[0]}${Math.floor((1 - i * 0.25) * 255).toString(16).padStart(2, '0')}`
      ctx.lineWidth = 2
      ctx.shadowBlur = 0
      ctx.stroke()
    }

    // Phase text
    const phaseText = {
      inhale: 'Breathe In',
      hold: 'Hold',
      exhale: 'Breathe Out',
      holdEmpty: 'Pause'
    }

    ctx.font = '16px system-ui'
    ctx.textAlign = 'center'
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
    ctx.shadowBlur = 0
    ctx.fillText(phaseText[phase], centerX, centerY + 5)
  }

  const drawParticles = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    phase: number,
    colors: string[]
  ) => {
    const particleCount = 50

    for (let i = 0; i < particleCount; i++) {
      // Each particle has unique properties
      const seed = i * 0.1
      const baseX = (Math.sin(seed * 13.37) * 0.5 + 0.5) * width
      const baseY = (Math.sin(seed * 7.89) * 0.5 + 0.5) * height

      // Animated position
      const x = baseX + Math.sin(phase * 0.5 + seed * 10) * 30
      const y = baseY + Math.cos(phase * 0.3 + seed * 8) * 30

      // Size pulsing
      const size = 2 + Math.sin(phase * 2 + seed * 5) * 2 + (i % 5)

      // Alpha pulsing
      const alpha = 0.3 + Math.sin(phase + seed * 3) * 0.3

      // Color
      const colorIndex = i % colors.length

      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fillStyle = colors[colorIndex] + Math.floor(alpha * 255).toString(16).padStart(2, '0')
      ctx.shadowColor = colors[colorIndex]
      ctx.shadowBlur = size * 2
      ctx.fill()
    }

    // Connecting lines between nearby particles
    ctx.strokeStyle = `${colors[0]}20`
    ctx.lineWidth = 0.5
    ctx.shadowBlur = 0

    for (let i = 0; i < particleCount; i++) {
      const seed1 = i * 0.1
      const x1 = ((Math.sin(seed1 * 13.37) * 0.5 + 0.5) * width) +
        Math.sin(phase * 0.5 + seed1 * 10) * 30
      const y1 = ((Math.sin(seed1 * 7.89) * 0.5 + 0.5) * height) +
        Math.cos(phase * 0.3 + seed1 * 8) * 30

      for (let j = i + 1; j < particleCount; j++) {
        const seed2 = j * 0.1
        const x2 = ((Math.sin(seed2 * 13.37) * 0.5 + 0.5) * width) +
          Math.sin(phase * 0.5 + seed2 * 10) * 30
        const y2 = ((Math.sin(seed2 * 7.89) * 0.5 + 0.5) * height) +
          Math.cos(phase * 0.3 + seed2 * 8) * 30

        const distance = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
        if (distance < 80) {
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(x2, y2)
          ctx.stroke()
        }
      }
    }
  }

  const drawChakra = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    phase: number
  ) => {
    const chakraColors = COLOR_SCHEMES.chakra
    const centerX = width / 2
    const startY = height * 0.85
    const endY = height * 0.15
    const spacing = (startY - endY) / 6

    chakraColors.forEach((color, i) => {
      const y = startY - i * spacing
      const baseRadius = Math.min(width, height) * 0.06
      const radius = baseRadius + Math.sin(phase * 2 + i) * 5

      // Outer glow
      const gradient = ctx.createRadialGradient(
        centerX, y, 0,
        centerX, y, radius * 2
      )
      gradient.addColorStop(0, color)
      gradient.addColorStop(0.5, color + '40')
      gradient.addColorStop(1, 'transparent')

      ctx.beginPath()
      ctx.arc(centerX, y, radius * 2, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.fill()

      // Inner circle
      ctx.beginPath()
      ctx.arc(centerX, y, radius, 0, Math.PI * 2)
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = 20
      ctx.fill()

      // Pulsing ring
      const ringRadius = radius + Math.sin(phase * 3 + i * 0.5) * 10 + 10
      ctx.beginPath()
      ctx.arc(centerX, y, ringRadius, 0, Math.PI * 2)
      ctx.strokeStyle = color + '40'
      ctx.lineWidth = 2
      ctx.shadowBlur = 0
      ctx.stroke()
    })

    // Central channel (Sushumna)
    ctx.beginPath()
    ctx.moveTo(centerX, startY + 20)
    ctx.lineTo(centerX, endY - 20)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'
    ctx.lineWidth = 3
    ctx.stroke()
  }

  const drawMandala = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    phase: number,
    colors: string[]
  ) => {
    const centerX = width / 2
    const centerY = height / 2
    const maxRadius = Math.min(width, height) * 0.4

    // Draw multiple rotating layers
    for (let layer = 0; layer < 4; layer++) {
      const petals = 8 + layer * 4
      const radius = maxRadius * (0.3 + layer * 0.2)
      const rotation = phase * (layer % 2 === 0 ? 1 : -1) * 0.5

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(rotation)

      for (let i = 0; i < petals; i++) {
        const angle = (i / petals) * Math.PI * 2
        const x = Math.cos(angle) * radius
        const y = Math.sin(angle) * radius

        ctx.beginPath()
        ctx.arc(x, y, radius * 0.15, 0, Math.PI * 2)
        ctx.fillStyle = colors[layer % colors.length] + '60'
        ctx.fill()
      }

      ctx.restore()
    }

    // Center ornament
    ctx.beginPath()
    ctx.arc(centerX, centerY, maxRadius * 0.15, 0, Math.PI * 2)
    const centerGradient = ctx.createRadialGradient(
      centerX, centerY, 0,
      centerX, centerY, maxRadius * 0.15
    )
    centerGradient.addColorStop(0, colors[0])
    centerGradient.addColorStop(1, colors[0] + '40')
    ctx.fillStyle = centerGradient
    ctx.shadowColor = colors[0]
    ctx.shadowBlur = 20
    ctx.fill()
  }

  const drawAurora = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    phase: number,
    colors: string[]
  ) => {
    const layers = 5

    for (let layer = 0; layer < layers; layer++) {
      ctx.beginPath()

      const baseY = height * 0.3 + layer * 20
      const amplitude = height * 0.15

      ctx.moveTo(0, height)

      for (let x = 0; x <= width; x += 2) {
        const y = baseY +
          Math.sin((x * 0.01) + phase + layer * 0.5) * amplitude +
          Math.sin((x * 0.02) + phase * 0.7 + layer) * (amplitude * 0.5)
        ctx.lineTo(x, y)
      }

      ctx.lineTo(width, height)
      ctx.closePath()

      const gradient = ctx.createLinearGradient(0, 0, 0, height)
      gradient.addColorStop(0, colors[layer % colors.length] + '80')
      gradient.addColorStop(0.5, colors[(layer + 1) % colors.length] + '40')
      gradient.addColorStop(1, 'transparent')

      ctx.fillStyle = gradient
      ctx.fill()
    }
  }

  // ============ Seek Handler ============

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!onSeek || duration <= 0 || selectedType !== 'waveform') return

    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const progress = x / rect.width
    const newTime = progress * duration

    onSeek(newTime)
  }, [onSeek, duration, selectedType])

  // ============ Render ============

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full rounded-xl cursor-pointer"
        style={{ background: 'rgba(0, 0, 0, 0.3)' }}
        onClick={handleCanvasClick}
      />

      {/* Type Selector */}
      {showControls && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 p-1 rounded-lg bg-black/50 backdrop-blur-sm">
          {(['spectrum', 'waveform', 'circular', 'breathing', 'particles', 'chakra'] as VisualizationType[]).map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`
                px-2 py-1 rounded text-xs font-medium transition-all
                ${selectedType === t
                  ? 'bg-white/20 text-white'
                  : 'text-white/50 hover:text-white/80'
                }
              `}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      )}

      {/* Progress indicator for waveform */}
      {selectedType === 'waveform' && duration > 0 && (
        <div className="absolute bottom-10 left-4 right-4 flex items-center justify-between text-xs text-white/60">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      )}
    </div>
  )
}

// ============ Helpers ============

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

export default AdvancedVisualizer
