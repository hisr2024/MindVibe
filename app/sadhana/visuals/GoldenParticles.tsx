'use client'

/**
 * GoldenParticles — Canvas 2D particle system
 * Floating golden motes that drift upward with gentle movement.
 */

import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  radius: number
  speedX: number
  speedY: number
  opacity: number
  fadeDirection: number
}

interface GoldenParticlesProps {
  count?: number
  speed?: number
}

export function GoldenParticles({ count = 40, speed = 0.3 }: GoldenParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)

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

    const particles: Particle[] = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: 0.5 + Math.random() * 2,
      speedX: (Math.random() - 0.5) * speed,
      speedY: -(0.1 + Math.random() * speed),
      opacity: Math.random() * 0.5,
      fadeDirection: Math.random() > 0.5 ? 1 : -1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        p.x += p.speedX + Math.sin(Date.now() * 0.001 + p.y * 0.01) * 0.2
        p.y += p.speedY
        p.opacity += p.fadeDirection * 0.003
        if (p.opacity > 0.6) p.fadeDirection = -1
        if (p.opacity < 0.05) p.fadeDirection = 1

        if (p.y < -10) {
          p.y = canvas.height + 10
          p.x = Math.random() * canvas.width
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 164, 76, ${Math.max(0, p.opacity)})`
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animRef.current)
    }
  }, [count, speed])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  )
}
