'use client'

/**
 * SacredCanvas — Fullscreen animated Canvas 2D background
 * Renders flowing sacred geometry, golden gradients, and energy lines.
 * All warm tones — no dark voids.
 */

import { useEffect, useRef, useCallback } from 'react'
import type { SadhanaPhase } from '@/types/sadhana.types'

interface SacredCanvasProps {
  phase: SadhanaPhase
}

interface EnergyLine {
  x: number
  y: number
  angle: number
  speed: number
  length: number
  opacity: number
  hue: number
}

const PHASE_COLORS: Record<SadhanaPhase, { bg1: string; bg2: string; bg3: string }> = {
  loading: { bg1: '#1a1a2e', bg2: '#16213e', bg3: '#0f3460' },
  arrival: { bg1: '#1a1a2e', bg2: '#2d1b3d', bg3: '#1a0f2e' },
  breathwork: { bg1: '#0f2027', bg2: '#1a1a3e', bg3: '#0d1b2a' },
  verse: { bg1: '#1a1a2e', bg2: '#2e1a1a', bg3: '#1a0f2e' },
  reflection: { bg1: '#1a1520', bg2: '#2d1b25', bg3: '#1a1020' },
  intention: { bg1: '#1a1a10', bg2: '#2d2b1b', bg3: '#1a1a0f' },
  complete: { bg1: '#1a1a2e', bg2: '#2e2a1a', bg3: '#1a1a10' },
}

export function SacredCanvas({ phase }: SacredCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const linesRef = useRef<EnergyLine[]>([])
  const timeRef = useRef(0)

  const initLines = useCallback((width: number, height: number) => {
    const lines: EnergyLine[] = []
    for (let i = 0; i < 20; i++) {
      lines.push({
        x: Math.random() * width,
        y: Math.random() * height,
        angle: Math.random() * Math.PI * 2,
        speed: 0.2 + Math.random() * 0.5,
        length: 40 + Math.random() * 80,
        opacity: 0.03 + Math.random() * 0.08,
        hue: 35 + Math.random() * 15,
      })
    }
    linesRef.current = lines
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initLines(canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      timeRef.current += 0.008
      const t = timeRef.current
      const w = canvas.width
      const h = canvas.height
      const colors = PHASE_COLORS[phase]

      /* Background gradient */
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7)
      grad.addColorStop(0, colors.bg2)
      grad.addColorStop(0.5, colors.bg1)
      grad.addColorStop(1, colors.bg3)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      /* Central golden glow */
      const glowRad = Math.min(w, h) * (0.25 + Math.sin(t * 0.5) * 0.05)
      const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, glowRad)
      glow.addColorStop(0, 'rgba(212, 164, 76, 0.12)')
      glow.addColorStop(0.5, 'rgba(212, 164, 76, 0.04)')
      glow.addColorStop(1, 'rgba(212, 164, 76, 0)')
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      if (prefersReduced) {
        animationRef.current = requestAnimationFrame(draw)
        return
      }

      /* Flowing energy lines */
      for (const line of linesRef.current) {
        line.x += Math.cos(line.angle) * line.speed
        line.y += Math.sin(line.angle) * line.speed
        line.angle += (Math.sin(t + line.x * 0.001) * 0.02)

        if (line.x < -100) line.x = w + 100
        if (line.x > w + 100) line.x = -100
        if (line.y < -100) line.y = h + 100
        if (line.y > h + 100) line.y = -100

        ctx.beginPath()
        ctx.moveTo(line.x, line.y)
        ctx.lineTo(
          line.x + Math.cos(line.angle) * line.length,
          line.y + Math.sin(line.angle) * line.length
        )
        ctx.strokeStyle = `hsla(${line.hue}, 60%, 60%, ${line.opacity})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      /* Sacred geometry rings */
      const ringCount = 3
      for (let i = 0; i < ringCount; i++) {
        const radius = Math.min(w, h) * (0.15 + i * 0.1) + Math.sin(t * 0.3 + i) * 10
        const opacity = 0.04 - i * 0.01
        ctx.beginPath()
        ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(212, 164, 76, ${opacity})`
        ctx.lineWidth = 1
        ctx.stroke()
      }

      /* Vignette overlay */
      const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7)
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.3)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, w, h)

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [phase, initLines])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      aria-hidden="true"
    />
  )
}
