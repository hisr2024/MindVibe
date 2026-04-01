/**
 * JourneysCanvas — Tab-reactive ambient background with sacred particles.
 *
 * Adapts particle color and density based on the active journey tab.
 * Uses CSS-only animations for performance (no JS animation loops).
 */

'use client'

import { useMemo } from 'react'

type JourneyTab = 'today' | 'journeys' | 'battleground' | 'wisdom'

interface JourneysCanvasProps {
  activeTab: JourneyTab
}

interface ParticleConfig {
  colors: string[]
  count: number
  speed: number // multiplier for animation duration
  glow: string // ambient glow color for the background
}

const TAB_CONFIGS: Record<JourneyTab, ParticleConfig> = {
  today: {
    colors: ['#D4A017', '#F0C040', '#FDE68A'],
    count: 20,
    speed: 1,
    glow: 'rgba(212, 160, 23, 0.04)',
  },
  journeys: {
    colors: ['#D4A017', '#EF4444', '#F97316', '#22C55E', '#8B5CF6', '#06B6D4'],
    count: 15,
    speed: 1.2,
    glow: 'rgba(212, 160, 23, 0.03)',
  },
  battleground: {
    colors: ['#EF4444', '#F97316', '#22C55E', '#8B5CF6', '#06B6D4', '#EC4899'],
    count: 25,
    speed: 0.8,
    glow: 'rgba(100, 100, 200, 0.03)',
  },
  wisdom: {
    colors: ['#D4A017', '#F0C040', '#FDE68A'],
    count: 12,
    speed: 1.8, // slower = more serene
    glow: 'rgba(212, 160, 23, 0.05)',
  },
}

/** Deterministic pseudo-random from seed (avoids hydration mismatch). */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453
  return x - Math.floor(x)
}

export function JourneysCanvas({ activeTab }: JourneysCanvasProps) {
  const config = TAB_CONFIGS[activeTab]

  const particles = useMemo(() => {
    return Array.from({ length: config.count }).map((_, i) => {
      const seed = i + 1
      const color = config.colors[i % config.colors.length]
      const left = seededRandom(seed) * 100
      const top = seededRandom(seed + 50) * 100
      const size = 2 + seededRandom(seed + 100) * 3
      const duration = (6 + seededRandom(seed + 150) * 8) * config.speed
      const delay = seededRandom(seed + 200) * duration
      const opacity = 0.15 + seededRandom(seed + 250) * 0.25

      return { color, left, top, size, duration, delay, opacity }
    })
  }, [config.count, config.colors, config.speed])

  return (
    <div className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }}>
      {/* Background ambient glow */}
      <div
        className="absolute top-1/4 left-1/3 w-[400px] h-[400px] rounded-full blur-[120px] transition-colors duration-1000"
        style={{ backgroundColor: config.glow }}
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full blur-[100px] transition-colors duration-1000"
        style={{ backgroundColor: config.glow }}
      />

      {/* Floating particles (CSS-only animation via kiaan-particle class) */}
      {particles.map((p, i) => (
        <div
          key={i}
          className="kiaan-particle absolute rounded-full"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            backgroundColor: p.color,
            opacity: p.opacity,
            '--particle-duration': `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            mixBlendMode: 'screen',
          } as React.CSSProperties}
        />
      ))}
    </div>
  )
}
