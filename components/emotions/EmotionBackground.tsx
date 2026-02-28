/**
 * Emotion Background Animations
 *
 * Ambient particle system that adapts to user's emotional state.
 * Each emotion has unique particle behavior and animation patterns.
 *
 * Quantum Enhancement #4: Emotion-Driven UI Themes
 */

'use client'

import { useEffect, useState, useMemo } from 'react'
import { Emotion } from '@/lib/emotionClassifier'
import { useCurrentEmotionTheme } from '@/hooks/useEmotionTheme'

interface Particle {
  id: number
  x: number
  y: number
  size: number
  vx: number
  vy: number
  opacity: number
  animationDuration: number
}

interface EmotionBackgroundProps {
  emotion?: Emotion  // Optional override, uses current if not provided
  particleCount?: number
  disabled?: boolean  // Disable for accessibility/performance
}

/**
 * Generates particles based on emotion type
 */
function generateParticles(
  count: number,
  emotion: Emotion,
  width: number,
  height: number
): Particle[] {
  const particles: Particle[] = []

  for (let i = 0; i < count; i++) {
    let vx = (Math.random() - 0.5) * 0.5
    let vy = (Math.random() - 0.5) * 0.5
    let size = Math.random() * 4 + 2

    // Emotion-specific particle properties
    switch (emotion) {
      case 'calm':
        // Slow, gentle movement
        vx *= 0.5
        vy *= 0.5
        size *= 0.8
        break

      case 'energized':
        // Fast, dynamic movement
        vx *= 1.5
        vy *= 1.5
        size *= 1.2
        break

      case 'melancholic':
        // Very slow drift downward
        vx *= 0.3
        vy = Math.abs(vy) * 0.4  // Mostly downward
        size *= 0.7
        break

      case 'anxious':
        // Steady, controlled movement
        const angle = Math.random() * Math.PI * 2
        vx = Math.cos(angle) * 0.3
        vy = Math.sin(angle) * 0.3
        size *= 0.9
        break

      case 'balanced':
        // Medium, balanced movement
        vx *= 0.7
        vy *= 0.7
        size *= 1.0
        break
    }

    particles.push({
      id: i,
      x: Math.random() * width,
      y: Math.random() * height,
      size,
      vx,
      vy,
      opacity: Math.random() * 0.4 + 0.2,
      animationDuration: 20 + Math.random() * 10
    })
  }

  return particles
}

/**
 * Gets animation class based on emotion
 */
function getAnimationClass(emotion: Emotion): string {
  const animations: Record<Emotion, string> = {
    calm: 'animation-gentle-flow',
    energized: 'animation-dynamic-pulse',
    melancholic: 'animation-slow-drift',
    anxious: 'animation-steady-breathe',
    balanced: 'animation-subtle-wave'
  }
  return animations[emotion]
}

/**
 * Ambient background animation component
 *
 * Renders floating particles that move according to the current emotion.
 * Automatically updates when emotion changes.
 */
export function EmotionBackground({
  emotion: emotionOverride,
  particleCount,
  disabled = false
}: EmotionBackgroundProps) {
  const { emotion: currentEmotion, theme } = useCurrentEmotionTheme()
  const emotion = emotionOverride || currentEmotion

  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  })

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Generate particles
  const particles = useMemo(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return []

    const count = particleCount || theme.particleCount
    return generateParticles(count, emotion, dimensions.width, dimensions.height)
  }, [emotion, dimensions, particleCount, theme.particleCount])

  // Don't render if disabled or reduced motion preferred
  if (disabled || prefersReducedMotion || dimensions.width === 0) {
    return null
  }

  const animationClass = getAnimationClass(emotion)

  return (
    <div className="emotion-particles" aria-hidden="true">
      <svg
        width={dimensions.width}
        height={dimensions.height}
        style={{ position: 'fixed', top: 0, left: 0 }}
      >
        {particles.map(particle => (
          <circle
            key={particle.id}
            className={`emotion-particle ${animationClass}`}
            cx={particle.x}
            cy={particle.y}
            r={particle.size}
            fill={theme.particleColor}
            opacity={particle.opacity}
            style={{
              animationDelay: `${particle.id * 0.1}s`,
              animationDuration: `${particle.animationDuration}s`
            }}
          />
        ))}
      </svg>
    </div>
  )
}

/**
 * Emotion indicator component
 *
 * Shows current emotion with a subtle badge.
 * Can be placed anywhere in the UI.
 */
export function EmotionIndicator({
  className = ''
}: {
  className?: string
}) {
  const { emotion, theme } = useCurrentEmotionTheme()

  const emotionLabels: Record<Emotion, string> = {
    calm: '🧘 Calm',
    energized: '⚡ Energized',
    melancholic: '🌙 Reflective',
    anxious: '🌊 Grounding',
    balanced: '⚖️ Balanced'
  }

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${className}`}
      style={{
        backgroundColor: theme.particleColor,
        color: theme.text,
        border: `1px solid ${theme.borderColor}`
      }}
    >
      <div
        className="h-2 w-2 rounded-full"
        style={{ backgroundColor: theme.primary }}
      />
      <span>{emotionLabels[emotion]}</span>
    </div>
  )
}
