'use client'

/**
 * GoldenParticles — Canvas 2D particle system with phase-aware behavior.
 * Each Sadhana phase gets distinct particle motion and density.
 */

import { useEffect, useRef } from 'react'
import type { SadhanaPhase } from '@/types/sadhana.types'

interface Particle {
  x: number
  y: number
  radius: number
  speedX: number
  speedY: number
  opacity: number
  fadeDirection: number
  hue: number
}

interface GoldenParticlesProps {
  count?: number
  speed?: number
  phase?: SadhanaPhase
}

const PHASE_CONFIG: Record<SadhanaPhase, {
  count: number
  color: string
  speedMultiplier: number
  direction: 'up' | 'down' | 'horizontal' | 'radial' | 'calm'
}> = {
  loading: { count: 20, color: '212,164,76', speedMultiplier: 0.5, direction: 'up' },
  arrival: { count: 35, color: '255,180,60', speedMultiplier: 0.6, direction: 'up' },
  breathwork: { count: 25, color: '150,170,255', speedMultiplier: 0.3, direction: 'calm' },
  verse: { count: 15, color: '212,164,76', speedMultiplier: 0.2, direction: 'calm' },
  reflection: { count: 20, color: '160,180,200', speedMultiplier: 0.4, direction: 'down' },
  intention: { count: 30, color: '255,200,100', speedMultiplier: 0.5, direction: 'horizontal' },
  complete: { count: 60, color: '255,215,0', speedMultiplier: 0.8, direction: 'radial' },
}

export function GoldenParticles({ count, speed = 0.3, phase = 'arrival' }: GoldenParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const particlesRef = useRef<Particle[]>([])
  const phaseRef = useRef(phase)

  const config = PHASE_CONFIG[phase]
  const particleCount = count ?? config.count

  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    /* Initialize particles */
    const particles: Particle[] = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 0.5 + Math.random() * 2,
      speedX: (Math.random() - 0.5) * speed,
      speedY: -(0.1 + Math.random() * speed),
      opacity: Math.random() * 0.4,
      fadeDirection: Math.random() > 0.5 ? 1 : -1,
      hue: 30 + Math.random() * 20,
    }))
    particlesRef.current = particles

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      const cfg = PHASE_CONFIG[phaseRef.current]
      const now = Date.now() * 0.001

      for (const p of particles) {
        /* Phase-specific movement */
        const sm = cfg.speedMultiplier
        switch (cfg.direction) {
          case 'up':
            p.x += p.speedX * sm + Math.sin(now + p.y * 0.01) * 0.15
            p.y += p.speedY * sm
            if (p.y < -10) { p.y = canvas.height + 10; p.x = Math.random() * canvas.width }
            break
          case 'down':
            p.x += Math.sin(now * 0.5 + p.y * 0.005) * 0.3
            p.y += Math.abs(p.speedY) * sm * 0.5
            if (p.y > canvas.height + 10) { p.y = -10; p.x = Math.random() * canvas.width }
            break
          case 'horizontal':
            p.x += Math.abs(p.speedX + 0.3) * sm
            p.y += Math.sin(now + p.x * 0.005) * 0.2
            if (p.x > canvas.width + 10) { p.x = -10; p.y = Math.random() * canvas.height }
            break
          case 'radial': {
            const cx = canvas.width / 2
            const cy = canvas.height / 2
            const dx = p.x - cx
            const dy = p.y - cy
            const dist = Math.sqrt(dx * dx + dy * dy)
            if (dist > 0) {
              p.x += (dx / dist) * sm * 0.5
              p.y += (dy / dist) * sm * 0.5
            }
            if (dist > Math.max(canvas.width, canvas.height) * 0.6) {
              p.x = cx + (Math.random() - 0.5) * 50
              p.y = cy + (Math.random() - 0.5) * 50
            }
            break
          }
          case 'calm':
          default:
            p.x += Math.sin(now * 0.3 + p.y * 0.003) * 0.15 * sm
            p.y += Math.cos(now * 0.2 + p.x * 0.003) * 0.15 * sm
            break
        }

        /* Fade cycle */
        p.opacity += p.fadeDirection * 0.002
        if (p.opacity > 0.5) p.fadeDirection = -1
        if (p.opacity < 0.03) p.fadeDirection = 1

        /* Draw particle */
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${cfg.color}, ${Math.max(0, p.opacity)})`
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [particleCount, speed])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  )
}
