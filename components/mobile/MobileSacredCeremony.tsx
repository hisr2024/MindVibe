'use client'

/**
 * MobileSacredCeremony — Completion Ceremonies
 *
 * Two variants of divine completion experiences:
 *
 * EMOTIONAL: 108 golden particles converge to center, form OM,
 * shatter outward, settle floating. Message reveals word by word.
 *
 * KARMIC: Sudarshana Chakra spins fast → slows → glows gold →
 * dissolves to light. "OM tat sat" appears in sacred gold.
 *
 * The Disney moment. The reason someone will cry.
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { MobileWordReveal } from './MobileWordReveal'

interface MobileSacredCeremonyProps {
  /** Ceremony variant */
  variant: 'emotional' | 'karmic'
  /** Whether the ceremony is active */
  active: boolean
  /** Called when ceremony completes */
  onComplete?: () => void
  /** Primary message to reveal */
  message?: string
  /** Secondary line (shloka or sankalpa) */
  secondaryLine?: string
  /** Duration stats */
  duration?: string
  /** Emotion journey summary (emotional variant) */
  emotionLabel?: string
  /** Unique karmic fingerprint data (karmic variant) */
  karmicWeb?: Record<string, number>
  className?: string
}

export function MobileSacredCeremony({
  variant,
  active,
  onComplete,
  message = 'Your offering has been received.',
  secondaryLine,
  duration,
  emotionLabel,
  className = '',
}: MobileSacredCeremonyProps) {
  const reduceMotion = useReducedMotion()
  const { triggerHaptic } = useHapticFeedback()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)

  const [phase, setPhase] = useState<'particles' | 'om' | 'burst' | 'message' | 'summary'>('particles')
  const [messageRevealed, setMessageRevealed] = useState(false)

  // Particle convergence animation (canvas-based)
  const runParticleAnimation = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width = canvas.offsetWidth * 2
    const h = canvas.height = canvas.offsetHeight * 2
    ctx.scale(2, 2)
    const cw = w / 2
    const ch = h / 2
    const cx = cw / 2
    const cy = ch / 2

    // Create 108 particles at screen edges
    const particles = Array.from({ length: 108 }, (_, i) => {
      const edge = Math.floor(Math.random() * 4)
      let x: number, y: number
      switch (edge) {
        case 0: x = Math.random() * cw; y = -10; break
        case 1: x = cw + 10; y = Math.random() * ch; break
        case 2: x = Math.random() * cw; y = ch + 10; break
        default: x = -10; y = Math.random() * ch; break
      }

      // Color distribution: 70% gold, 20% teal, 10% white
      const colorRoll = Math.random()
      let color: string
      if (colorRoll < 0.7) color = variant === 'emotional' ? '#D4A017' : '#F0C040'
      else if (colorRoll < 0.9) color = '#06B6D4'
      else color = '#FDE68A'

      return {
        x, y, targetX: cx, targetY: cy,
        vx: 0, vy: 0,
        size: 1.5 + Math.random() * 2,
        color,
        opacity: 0.8,
        phase: 'converge' as 'converge' | 'burst' | 'float',
        burstVx: 0, burstVy: 0,
        delay: i * 4, // stagger convergence
      }
    })

    let frame = 0
    const CONVERGE_FRAMES = 60 // ~1s at 60fps
    const BURST_FRAME = CONVERGE_FRAMES + 10
    const FLOAT_FRAME = BURST_FRAME + 15
    const END_FRAME = FLOAT_FRAME + 90

    const animate = () => {
      ctx.clearRect(0, 0, cw, ch)
      frame++

      // Phase transitions
      if (frame === CONVERGE_FRAMES) {
        triggerHaptic('heavy')
        setPhase('om')
      }
      if (frame === BURST_FRAME) {
        setPhase('burst')
        particles.forEach(p => {
          const angle = Math.random() * Math.PI * 2
          const speed = 2 + Math.random() * 4
          p.burstVx = Math.cos(angle) * speed
          p.burstVy = Math.sin(angle) * speed
          p.phase = 'burst'
        })
      }
      if (frame === FLOAT_FRAME) {
        setPhase('message')
        particles.forEach(p => { p.phase = 'float' })
      }
      if (frame >= END_FRAME) {
        setPhase('summary')
        cancelAnimationFrame(animFrameRef.current)
        return
      }

      // Update & draw particles
      particles.forEach(p => {
        if (frame < p.delay) return

        if (p.phase === 'converge') {
          // Spring toward center
          const dx = p.targetX - p.x
          const dy = p.targetY - p.y
          p.vx += dx * 0.04
          p.vy += dy * 0.04
          p.vx *= 0.92
          p.vy *= 0.92
          p.x += p.vx
          p.y += p.vy
        } else if (p.phase === 'burst') {
          p.x += p.burstVx
          p.y += p.burstVy
          p.burstVx *= 0.95
          p.burstVy *= 0.95
          p.opacity *= 0.97
        } else {
          // Float upward slowly
          p.y -= 0.3
          p.x += Math.sin(frame * 0.02 + p.x) * 0.2
          p.opacity *= 0.995
        }

        // Draw
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = Math.max(0, p.opacity)
        ctx.fill()

        // Glow for larger particles
        if (p.size > 2) {
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3)
          grad.addColorStop(0, `${p.color}40`)
          grad.addColorStop(1, `${p.color}00`)
          ctx.fillStyle = grad
          ctx.globalAlpha = p.opacity * 0.5
          ctx.fill()
        }
      })

      ctx.globalAlpha = 1
      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)
  }, [variant, triggerHaptic])

  // Start ceremony
  useEffect(() => {
    if (!active) {
      setPhase('particles')
      setMessageRevealed(false)
      return
    }

    if (reduceMotion) {
      setPhase('summary')
      triggerHaptic('success')
      return
    }

    // Small delay then start particles
    const timer = setTimeout(() => {
      runParticleAnimation()
    }, 200)

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(animFrameRef.current)
    }
  }, [active, reduceMotion, runParticleAnimation, triggerHaptic])

  if (!active) return null

  return (
    <div className={`fixed inset-0 flex flex-col items-center justify-center ${className}`}
      style={{ zIndex: 100, background: 'var(--sacred-cosmic-void, #050714)' }}
    >
      {/* Particle canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ opacity: phase === 'summary' ? 0 : 1, transition: 'opacity 0.5s' }}
      />

      {/* OM symbol — appears during convergence peak */}
      <AnimatePresence>
        {phase === 'om' && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, rotate: 360 }}
            exit={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="absolute"
            style={{ zIndex: 10 }}
          >
            <span
              style={{
                fontSize: '64px',
                color: 'var(--sacred-divine-gold, #D4A017)',
                textShadow: '0 0 30px rgba(212,160,23,0.6), 0 0 60px rgba(212,160,23,0.3)',
                fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
              }}
            >
              {'\u0950'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Message reveal */}
      <AnimatePresence>
        {(phase === 'message' || phase === 'summary') && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative z-20 px-8 text-center max-w-sm"
          >
            <MobileWordReveal
              text={message}
              speed={80}
              className="text-xl leading-relaxed"
              as="p"
              onComplete={() => setMessageRevealed(true)}
            />

            {/* Secondary line (shloka / sankalpa) */}
            <AnimatePresence>
              {messageRevealed && secondaryLine && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-4 italic leading-relaxed"
                  style={{
                    color: 'var(--sacred-divine-gold, #D4A017)',
                    fontSize: '16px',
                    fontFamily: 'var(--font-scripture, Crimson Text, serif)',
                  }}
                >
                  &ldquo;{secondaryLine}&rdquo;
                </motion.p>
              )}
            </AnimatePresence>

            {/* Karmic variant: OM tat sat */}
            {variant === 'karmic' && messageRevealed && (
              <motion.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2, type: 'spring', stiffness: 100 }}
                className="mt-8"
                style={{
                  fontSize: '42px',
                  color: 'var(--sacred-divine-gold, #D4A017)',
                  textShadow: '0 0 24px rgba(212,160,23,0.4)',
                  fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
                  fontWeight: 300,
                }}
              >
                {'\u0950'} {'\u0924\u0924\u094D'} {'\u0938\u0924\u094D'}
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary view — after message reveal */}
      <AnimatePresence>
        {phase === 'summary' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="relative z-20 mt-8 text-center"
          >
            {/* Completion lotus */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, rgba(212,160,23,0.2), rgba(6,182,212,0.1))',
                border: '1px solid rgba(212,160,23,0.3)',
                boxShadow: '0 0 32px rgba(212,160,23,0.2)',
              }}
            >
              <span style={{ fontSize: '28px' }}>{variant === 'emotional' ? '\u2728' : '\u2638\uFE0F'}</span>
            </motion.div>

            <p
              style={{
                fontSize: '10px',
                color: 'var(--sacred-text-muted, #6B6355)',
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontFamily: 'var(--font-ui, Outfit, sans-serif)',
              }}
            >
              {variant === 'emotional' ? 'Emotional Reset Complete' : 'Karma Reset Complete'}
            </p>

            {/* Stats */}
            <div className="flex items-center justify-center gap-4 mt-3">
              {duration && (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--sacred-text-secondary, #B8AE98)',
                    fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                  }}
                >
                  Duration: {duration}
                </span>
              )}
              {emotionLabel && (
                <span
                  style={{
                    fontSize: '11px',
                    color: 'var(--sacred-text-secondary, #B8AE98)',
                    fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                  }}
                >
                  {emotionLabel}
                </span>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-8 px-4">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onComplete}
                className="flex-1 py-3.5 rounded-xl text-sm font-medium"
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid var(--sacred-divine-gold, #D4A017)',
                  color: 'var(--sacred-divine-gold, #D4A017)',
                  fontFamily: 'var(--font-ui, Outfit, sans-serif)',
                }}
              >
                Return to Sakha
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MobileSacredCeremony
