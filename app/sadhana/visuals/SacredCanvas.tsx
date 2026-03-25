'use client'

/**
 * SacredCanvas — Fullscreen animated Canvas 2D background with phase-specific visuals.
 * Each phase renders a dramatically different sacred atmosphere:
 *   arrival  → Warm temple glow with floating diya flames
 *   breathwork → Deep cosmic nebula with pulsing stars
 *   verse    → Dark parchment grain with golden manuscript borders
 *   reflection → Still water surface with gentle ripples from center
 *   intention → Dawn horizon, indigo→gold gradient sweep
 *   complete → Full golden radiance with divine light rays
 */

import { useEffect, useRef, useCallback } from 'react'
import type { SadhanaPhase } from '@/types/sadhana.types'

interface SacredCanvasProps {
  phase: SadhanaPhase
}

interface FloatingElement {
  x: number
  y: number
  angle: number
  speed: number
  size: number
  opacity: number
  hue: number
  drift: number
}

const PHASE_ATMOSPHERES: Record<SadhanaPhase, {
  bg: [string, string, string]
  glow: { color: string; intensity: number; radius: number }
}> = {
  loading: {
    bg: ['#0a0a14', '#0f0d1a', '#0a0812'],
    glow: { color: '212,164,76', intensity: 0.06, radius: 0.3 },
  },
  arrival: {
    bg: ['#1a1008', '#12080a', '#1a0f06'],
    glow: { color: '255,180,60', intensity: 0.18, radius: 0.35 },
  },
  breathwork: {
    bg: ['#06081a', '#0a0614', '#040818'],
    glow: { color: '100,140,255', intensity: 0.1, radius: 0.4 },
  },
  verse: {
    bg: ['#14100a', '#0f0c06', '#16120c'],
    glow: { color: '212,164,76', intensity: 0.12, radius: 0.25 },
  },
  reflection: {
    bg: ['#080a14', '#0a0c16', '#060810'],
    glow: { color: '120,160,200', intensity: 0.08, radius: 0.35 },
  },
  intention: {
    bg: ['#14100a', '#1a1510', '#201a0e'],
    glow: { color: '255,200,100', intensity: 0.15, radius: 0.45 },
  },
  complete: {
    bg: ['#1a1508', '#201a0c', '#1a1206'],
    glow: { color: '255,215,0', intensity: 0.25, radius: 0.5 },
  },
}

export function SacredCanvas({ phase }: SacredCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const elementsRef = useRef<FloatingElement[]>([])
  const timeRef = useRef(0)
  const prevPhaseRef = useRef<SadhanaPhase>(phase)
  const transitionRef = useRef(0)

  const initElements = useCallback((width: number, height: number) => {
    const elements: FloatingElement[] = []
    const count = 25
    for (let i = 0; i < count; i++) {
      elements.push({
        x: Math.random() * width,
        y: Math.random() * height,
        angle: Math.random() * Math.PI * 2,
        speed: 0.1 + Math.random() * 0.4,
        size: 1 + Math.random() * 3,
        opacity: 0.02 + Math.random() * 0.08,
        hue: 30 + Math.random() * 20,
        drift: Math.random() * Math.PI * 2,
      })
    }
    elementsRef.current = elements
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
      initElements(canvas.width, canvas.height)
    }
    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      timeRef.current += 0.006
      const t = timeRef.current
      const w = canvas.width
      const h = canvas.height
      const atmo = PHASE_ATMOSPHERES[phase]

      /* Cross-fade transition tracking */
      if (prevPhaseRef.current !== phase) {
        transitionRef.current = 0
        prevPhaseRef.current = phase
      }
      transitionRef.current = Math.min(transitionRef.current + 0.015, 1)

      /* Background gradient */
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.8)
      grad.addColorStop(0, atmo.bg[1])
      grad.addColorStop(0.5, atmo.bg[0])
      grad.addColorStop(1, atmo.bg[2])
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, w, h)

      /* Central glow — breathing effect */
      const breathScale = 1 + Math.sin(t * 0.4) * 0.08
      const glowRad = Math.min(w, h) * atmo.glow.radius * breathScale
      const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, glowRad)
      glow.addColorStop(0, `rgba(${atmo.glow.color}, ${atmo.glow.intensity})`)
      glow.addColorStop(0.6, `rgba(${atmo.glow.color}, ${atmo.glow.intensity * 0.3})`)
      glow.addColorStop(1, `rgba(${atmo.glow.color}, 0)`)
      ctx.fillStyle = glow
      ctx.fillRect(0, 0, w, h)

      if (prefersReduced) {
        animationRef.current = requestAnimationFrame(draw)
        return
      }

      /* Phase-specific visuals */
      if (phase === 'arrival') {
        drawDiyaFlames(ctx, w, h, t, elementsRef.current)
      } else if (phase === 'breathwork') {
        drawCosmicStars(ctx, w, h, t, elementsRef.current)
      } else if (phase === 'verse') {
        drawParchmentGrain(ctx, w, h, t)
      } else if (phase === 'reflection') {
        drawWaterRipples(ctx, w, h, t)
      } else if (phase === 'intention') {
        drawDawnHorizon(ctx, w, h, t)
      } else if (phase === 'complete') {
        drawDivineRays(ctx, w, h, t)
      }

      /* Sacred geometry rings — subtle, phase-colored */
      const ringCount = 3
      for (let i = 0; i < ringCount; i++) {
        const radius = Math.min(w, h) * (0.15 + i * 0.12) + Math.sin(t * 0.25 + i) * 8
        const opacity = 0.03 - i * 0.008
        ctx.beginPath()
        ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(${atmo.glow.color}, ${opacity})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      }

      /* Vignette */
      const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.7)
      vignette.addColorStop(0, 'rgba(0,0,0,0)')
      vignette.addColorStop(1, 'rgba(0,0,0,0.4)')
      ctx.fillStyle = vignette
      ctx.fillRect(0, 0, w, h)

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [phase, initElements])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 -z-10"
      aria-hidden="true"
    />
  )
}

/** Arrival: Warm diya (oil lamp) flames floating upward */
function drawDiyaFlames(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elements: FloatingElement[]) {
  for (const el of elements) {
    el.y -= el.speed * 0.5
    el.x += Math.sin(t * 2 + el.drift) * 0.3
    if (el.y < -20) {
      el.y = h + 20
      el.x = Math.random() * w
    }

    const flicker = 0.6 + Math.sin(t * 8 + el.drift) * 0.4
    const radius = el.size * (1.5 + Math.sin(t * 4 + el.drift) * 0.5)

    /* Flame glow */
    const flameGrad = ctx.createRadialGradient(el.x, el.y, 0, el.x, el.y, radius * 6)
    flameGrad.addColorStop(0, `rgba(255,180,60,${0.06 * flicker})`)
    flameGrad.addColorStop(1, 'rgba(255,180,60,0)')
    ctx.fillStyle = flameGrad
    ctx.fillRect(el.x - radius * 6, el.y - radius * 6, radius * 12, radius * 12)

    /* Flame core */
    ctx.beginPath()
    ctx.arc(el.x, el.y, radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,200,80,${el.opacity * flicker * 2})`
    ctx.fill()
  }
}

/** Breathwork: Deep cosmic nebula with pulsing stars */
function drawCosmicStars(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, elements: FloatingElement[]) {
  for (const el of elements) {
    const pulse = 0.5 + Math.sin(t * 1.5 + el.drift) * 0.5
    const radius = el.size * 0.8 * (0.8 + pulse * 0.4)

    /* Star glow */
    const starGrad = ctx.createRadialGradient(el.x, el.y, 0, el.x, el.y, radius * 4)
    starGrad.addColorStop(0, `rgba(150,170,255,${0.08 * pulse})`)
    starGrad.addColorStop(1, 'rgba(150,170,255,0)')
    ctx.fillStyle = starGrad
    ctx.fillRect(el.x - radius * 4, el.y - radius * 4, radius * 8, radius * 8)

    /* Star core */
    ctx.beginPath()
    ctx.arc(el.x, el.y, radius * 0.4, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(200,210,255,${el.opacity * pulse * 3})`
    ctx.fill()
  }

  /* Nebula wisps */
  for (let i = 0; i < 3; i++) {
    const cx = w * (0.3 + i * 0.2) + Math.sin(t * 0.2 + i) * 30
    const cy = h * (0.4 + Math.sin(t * 0.15 + i * 2) * 0.1)
    const nebula = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.2)
    nebula.addColorStop(0, `rgba(100,80,180,${0.03 + Math.sin(t + i) * 0.01})`)
    nebula.addColorStop(1, 'rgba(100,80,180,0)')
    ctx.fillStyle = nebula
    ctx.fillRect(0, 0, w, h)
  }
}

/** Verse: Dark parchment grain with golden filigree lines */
function drawParchmentGrain(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  /* Subtle golden border lines at edges */
  const borderOpacity = 0.04 + Math.sin(t * 0.5) * 0.02
  ctx.strokeStyle = `rgba(212,164,76,${borderOpacity})`
  ctx.lineWidth = 1

  /* Top decorative line */
  ctx.beginPath()
  ctx.moveTo(w * 0.15, h * 0.08)
  ctx.lineTo(w * 0.85, h * 0.08)
  ctx.stroke()

  /* Bottom decorative line */
  ctx.beginPath()
  ctx.moveTo(w * 0.15, h * 0.92)
  ctx.lineTo(w * 0.85, h * 0.92)
  ctx.stroke()

  /* Floating dust motes */
  for (let i = 0; i < 8; i++) {
    const mx = w * (0.2 + i * 0.08) + Math.sin(t * 0.3 + i * 1.5) * 20
    const my = h * (0.3 + Math.sin(t * 0.2 + i * 2) * 0.2)
    const mopacity = 0.03 + Math.sin(t * 0.5 + i) * 0.02
    ctx.beginPath()
    ctx.arc(mx, my, 1.5, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(212,164,76,${mopacity})`
    ctx.fill()
  }
}

/** Reflection: Still water with concentric ripples from center */
function drawWaterRipples(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w / 2
  const cy = h / 2

  for (let i = 0; i < 5; i++) {
    const phase = (t * 0.3 + i * 0.8) % 4
    const radius = phase * Math.min(w, h) * 0.15
    const opacity = Math.max(0, 0.04 * (1 - phase / 4))

    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(120,160,200,${opacity})`
    ctx.lineWidth = 1
    ctx.stroke()
  }

  /* Subtle horizontal shimmer lines (water surface) */
  for (let i = 0; i < 6; i++) {
    const ly = h * (0.3 + i * 0.08)
    const wave = Math.sin(t * 0.4 + i * 0.5) * 15
    ctx.beginPath()
    ctx.moveTo(w * 0.2 + wave, ly)
    ctx.lineTo(w * 0.8 + wave, ly)
    ctx.strokeStyle = `rgba(120,160,200,${0.015})`
    ctx.lineWidth = 0.5
    ctx.stroke()
  }
}

/** Intention: Dawn horizon with warm gradient sweep */
function drawDawnHorizon(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const horizonY = h * 0.65

  /* Dawn glow at horizon */
  const dawn = ctx.createRadialGradient(w / 2, horizonY, 0, w / 2, horizonY, w * 0.5)
  const dawnIntensity = 0.08 + Math.sin(t * 0.3) * 0.03
  dawn.addColorStop(0, `rgba(255,200,100,${dawnIntensity})`)
  dawn.addColorStop(0.5, `rgba(255,150,80,${dawnIntensity * 0.3})`)
  dawn.addColorStop(1, 'rgba(255,150,80,0)')
  ctx.fillStyle = dawn
  ctx.fillRect(0, 0, w, h)

  /* Horizon line */
  ctx.beginPath()
  ctx.moveTo(0, horizonY)
  ctx.lineTo(w, horizonY)
  ctx.strokeStyle = 'rgba(255,200,100,0.06)'
  ctx.lineWidth = 1
  ctx.stroke()

  /* Light motes drifting from horizon */
  for (let i = 0; i < 6; i++) {
    const mx = w * (0.2 + i * 0.12) + Math.sin(t + i) * 10
    const my = horizonY - 20 - i * 30 + Math.sin(t * 0.5 + i * 2) * 10
    const grad = ctx.createRadialGradient(mx, my, 0, mx, my, 8)
    grad.addColorStop(0, `rgba(255,200,100,${0.04 + Math.sin(t + i) * 0.02})`)
    grad.addColorStop(1, 'rgba(255,200,100,0)')
    ctx.fillStyle = grad
    ctx.fillRect(mx - 8, my - 8, 16, 16)
  }
}

/** Complete: Divine light rays emanating from center */
function drawDivineRays(ctx: CanvasRenderingContext2D, w: number, h: number, t: number) {
  const cx = w / 2
  const cy = h / 2
  const rayCount = 12

  for (let i = 0; i < rayCount; i++) {
    const angle = (i / rayCount) * Math.PI * 2 + t * 0.05
    const length = Math.min(w, h) * (0.3 + Math.sin(t * 0.5 + i) * 0.1)
    const endX = cx + Math.cos(angle) * length
    const endY = cy + Math.sin(angle) * length

    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(endX, endY)
    ctx.strokeStyle = `rgba(255,215,0,${0.04 + Math.sin(t * 0.8 + i * 0.5) * 0.02})`
    ctx.lineWidth = 2
    ctx.stroke()
  }

  /* Central intense glow */
  const coreGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(w, h) * 0.15)
  coreGlow.addColorStop(0, 'rgba(255,215,0,0.15)')
  coreGlow.addColorStop(0.5, 'rgba(255,215,0,0.05)')
  coreGlow.addColorStop(1, 'rgba(255,215,0,0)')
  ctx.fillStyle = coreGlow
  ctx.fillRect(0, 0, w, h)
}
