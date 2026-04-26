'use client'

/**
 * KarmaCanvas — Phase-reactive sacred background for Karma Reset.
 * Renders a subtle ember glow at the bottom (karma's fire) and a
 * phase-specific center glow that warms toward gold as phases progress.
 */

import React, { useEffect, useRef } from 'react'
import type { KarmaResetPhase, KarmaCategory } from '../types'

interface KarmaCanvasProps {
  phase: KarmaResetPhase
  category?: KarmaCategory
}

const PHASE_CONFIG: Record<KarmaResetPhase, {
  rgb: string
  glowOpacity: number
  emberOpacity: number
}> = {
  entry:      { rgb: '249,115,22',  glowOpacity: 0.04, emberOpacity: 0.04 },
  context:    { rgb: '212,160,23',  glowOpacity: 0.06, emberOpacity: 0.05 },
  reflection: { rgb: '27,79,187',   glowOpacity: 0.05, emberOpacity: 0.04 },
  wisdom:     { rgb: '212,160,23',  glowOpacity: 0.10, emberOpacity: 0.06 },
  sankalpa:   { rgb: '240,192,64',  glowOpacity: 0.12, emberOpacity: 0.08 },
  seal:       { rgb: '212,160,23',  glowOpacity: 0.15, emberOpacity: 0.10 },
}

export function KarmaCanvas({ phase }: KarmaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const configRef = useRef(PHASE_CONFIG[phase])
  const phaseRef = useRef(phase)

  // Smoothly transition config on phase change
  useEffect(() => {
    configRef.current = PHASE_CONFIG[phase]
    phaseRef.current = phase
  }, [phase])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let frame = 0
    let cancelled = false

    const dpr = Math.min(window.devicePixelRatio || 1, 2) // cap dpr to avoid huge buffers on Android
    const resize = () => {
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
    }
    resize()
    window.addEventListener('resize', resize)

    const drawFrame = () => {
      const w = window.innerWidth
      const h = window.innerHeight
      const config = configRef.current

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      // Ember glow at bottom (karma's fire, always present)
      const emberPulse = config.emberOpacity + 0.015 * Math.sin(frame * 0.02)
      const emberGrad = ctx.createRadialGradient(w / 2, h, 0, w / 2, h, h * 0.5)
      emberGrad.addColorStop(0, `rgba(249,115,22,${emberPulse})`)
      emberGrad.addColorStop(1, 'rgba(249,115,22,0)')
      ctx.fillStyle = emberGrad
      ctx.fillRect(0, 0, w, h)

      // Phase-specific center glow
      const centerPulse = config.glowOpacity * (0.6 + 0.4 * Math.sin(frame * 0.015))
      const centerGrad = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, w * 0.5)
      centerGrad.addColorStop(0, `rgba(${config.rgb},${centerPulse})`)
      centerGrad.addColorStop(1, `rgba(${config.rgb},0)`)
      ctx.fillStyle = centerGrad
      ctx.fillRect(0, 0, w, h)
    }

    const tick = () => {
      if (cancelled) return
      // During the seal phase the screen already has a mandala + flame
      // garland animating. Running this RAF on top causes GPU pressure that
      // crashes Android WebView. Paint one final still frame and stop.
      if (phaseRef.current === 'seal') {
        drawFrame()
        animRef.current = 0
        return
      }
      // Throttle to ~30 fps — visually identical for a slow ember pulse,
      // half the GPU work compared to vsync (60+ fps).
      drawFrame()
      frame++
      animRef.current = window.setTimeout(() => {
        animRef.current = requestAnimationFrame(tick)
      }, 33) as unknown as number
    }

    tick()

    return () => {
      cancelled = true
      window.removeEventListener('resize', resize)
      if (animRef.current) {
        cancelAnimationFrame(animRef.current)
        clearTimeout(animRef.current)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 0,
      }}
      aria-hidden="true"
    />
  )
}
