'use client'

/**
 * SuccessScreen — Sacred subscription success celebration
 *
 * Layers (z-order):
 * 1. Background: #050714 full screen
 * 2. Gold particle burst canvas (108 particles outward)
 * 3. OM bloom: scale(0) -> scale(1.15) -> scale(1), spring 800ms
 * 4. Content: verse card, feature unlock list, CTA
 *
 * OM breathing: scale(0.98) <-> scale(1.02), 4s loop after bloom.
 * Verse: word-by-word reveal, 45ms stagger.
 * Feature checkmarks: slide-in-right, 80ms stagger.
 * Reduced motion: skip animations, show content immediately.
 */

import { useEffect, useRef, useCallback } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

interface SuccessScreenProps {
  planName?: string
  trialDays?: number
}

/**
 * Gold particle burst on canvas — 108 particles radiating outward.
 */
function ParticleBurst() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useReducedMotion()

  const animate = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || reduceMotion) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = canvas.offsetWidth * dpr
    canvas.height = canvas.offsetHeight * dpr
    ctx.scale(dpr, dpr)

    const cx = canvas.offsetWidth / 2
    const cy = canvas.offsetHeight / 2
    const PARTICLE_COUNT = 108

    interface Particle {
      x: number
      y: number
      vx: number
      vy: number
      size: number
      alpha: number
      decay: number
    }

    const particles: Particle[] = []
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + (Math.random() - 0.5) * 0.3
      const speed = 1.5 + Math.random() * 3
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1 + Math.random() * 2.5,
        alpha: 0.7 + Math.random() * 0.3,
        decay: 0.985 + Math.random() * 0.01,
      })
    }

    let frame = 0
    const maxFrames = 120

    function draw() {
      if (!ctx || !canvas) return
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        p.alpha *= p.decay
        p.vx *= 0.98
        p.vy *= 0.98

        if (p.alpha < 0.01) continue

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(212, 160, 23, ${p.alpha})`
        ctx.fill()

        // Small glow
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(240, 192, 64, ${p.alpha * 0.15})`
        ctx.fill()
      }

      frame++
      if (frame < maxFrames) {
        requestAnimationFrame(draw)
      }
    }

    // Delay particles slightly for dramatic effect
    const timer = setTimeout(() => {
      requestAnimationFrame(draw)
    }, 200)

    return () => clearTimeout(timer)
  }, [reduceMotion])

  useEffect(() => {
    const cleanup = animate()
    return () => cleanup?.()
  }, [animate])

  if (reduceMotion) return null

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: 1 }}
      aria-hidden="true"
    />
  )
}

/**
 * Word-by-word text reveal.
 */
function WordReveal({ text, delay = 0, className = '' }: { text: string; delay?: number; className?: string }) {
  const reduceMotion = useReducedMotion()
  const words = text.split(' ')

  if (reduceMotion) {
    return <span className={className}>{text}</span>
  }

  return (
    <span className={className}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: delay + i * 0.045, duration: 0.25 }}
          className="inline-block"
        >
          {word}{i < words.length - 1 ? '\u00A0' : ''}
        </motion.span>
      ))}
    </span>
  )
}

export function SuccessScreen({ planName = 'Sacred Pro', trialDays = 7 }: SuccessScreenProps) {
  const reduceMotion = useReducedMotion()

  // Calculate trial end date
  const trialEnd = new Date()
  trialEnd.setDate(trialEnd.getDate() + trialDays)
  const formattedTrialEnd = trialEnd.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const UNLOCKED_FEATURES = [
    'Unlimited Sakha conversations',
    'KIAAN Voice Companion \u00B7 Shankha',
    '\u0937\u0921\u094D\u0930\u093F\u092A\u0941 Journeys \u2014 your inner battlefield',
  ]

  return (
    <div
      className="min-h-screen bg-[#050714] flex flex-col items-center justify-center relative overflow-hidden"
      role="main"
      aria-label="Subscription success"
    >
      {/* Particle burst canvas */}
      <ParticleBurst />

      {/* Content layer */}
      <div className="relative z-10 flex flex-col items-center max-w-[380px] mx-auto px-6">
        {/* OM Bloom */}
        <motion.div
          initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
          animate={reduceMotion ? {} : { scale: 1, opacity: 1 }}
          transition={
            reduceMotion
              ? undefined
              : {
                  type: 'spring',
                  stiffness: 100,
                  damping: 10,
                  mass: 1,
                  duration: 0.8,
                }
          }
          className="mb-8"
        >
          <motion.div
            animate={
              reduceMotion
                ? {}
                : {
                    scale: [1, 1.02, 0.98, 1],
                  }
            }
            transition={
              reduceMotion
                ? undefined
                : {
                    duration: 4,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }
            }
            className="w-24 h-24 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(212,160,23,0.2) 0%, rgba(212,160,23,0.05) 60%, transparent 80%)',
              boxShadow: '0 0 40px rgba(212,160,23,0.3), 0 0 80px rgba(212,160,23,0.1)',
            }}
          >
            <span
              className="text-5xl text-[#F0C040] select-none"
              style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
              aria-hidden="true"
            >
              &#x0950;
            </span>
          </motion.div>
        </motion.div>

        {/* Headline */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { delay: 0.6, duration: 0.5 }}
          className="text-center mb-2"
        >
          <h1
            className="text-[26px] font-light text-[#EDE8DC] tracking-wide"
            style={{ fontFamily: '"Cormorant Garamond", Georgia, serif' }}
            aria-live="polite"
          >
            Your journey begins.
          </h1>
          <p
            className="text-[15px] text-[#D4A017] mt-1"
            style={{ fontFamily: '"Noto Sans Devanagari", Mangal, sans-serif' }}
          >
            &#x092F;&#x093E;&#x0924;&#x094D;&#x0930;&#x093E; &#x0906;&#x0930;&#x0902;&#x092D; &#x0939;&#x094B;&#x0924;&#x0940; &#x0939;&#x0948;
          </p>
        </motion.div>

        {/* Verse Card */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { delay: 1.2, duration: 0.5 }}
          className="w-full mt-6 p-5 rounded-[16px] border-t-2 border-t-[#D4A017] bg-[radial-gradient(ellipse_at_50%_0%,rgba(212,160,23,0.08),rgba(17,20,53,0.98))] border border-[rgba(255,255,255,0.06)]"
        >
          <p className="text-[11px] text-[#6B6355] mb-2 tracking-wider uppercase" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
            Bhagavad Gita 2.40
          </p>
          <p
            className="text-[14px] text-[#D4A017] leading-loose mb-2"
            style={{ fontFamily: '"Noto Sans Devanagari", Mangal, sans-serif', lineHeight: 2.0 }}
          >
            <WordReveal
              text="&#x0928;&#x0947;&#x0939;&#x093E;&#x092D;&#x093F;&#x0915;&#x094D;&#x0930;&#x092E;&#x0928;&#x093E;&#x0936;&#x094B;&#x2019;&#x0938;&#x094D;&#x0924;&#x093F; &#x092A;&#x094D;&#x0930;&#x0924;&#x094D;&#x092F;&#x0935;&#x093E;&#x092F;&#x094B; &#x0928; &#x0935;&#x093F;&#x0926;&#x094D;&#x092F;&#x0924;&#x0947;"
              delay={1.4}
            />
          </p>
          <p
            className="text-[13px] text-[#B8AE98] italic leading-relaxed"
            style={{ fontFamily: '"Crimson Text", Georgia, serif' }}
          >
            <WordReveal
              text="On this path no effort is ever lost, and no obstacle ever prevails."
              delay={1.8}
            />
          </p>
        </motion.div>

        {/* Feature Unlock List */}
        <div className="w-full mt-6">
          <motion.p
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduceMotion ? undefined : { delay: 1.6, duration: 0.3 }}
            className="text-[11px] text-[#6B6355] tracking-[0.12em] uppercase mb-3"
            style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
          >
            Now unlocked for you
          </motion.p>
          <div className="space-y-3">
            {UNLOCKED_FEATURES.map((feature, i) => (
              <motion.div
                key={i}
                initial={reduceMotion ? false : { opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={reduceMotion ? undefined : { delay: 1.6 + i * 0.08, duration: 0.3 }}
                className="flex items-center gap-3"
              >
                <motion.div
                  initial={reduceMotion ? false : { scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={
                    reduceMotion
                      ? undefined
                      : {
                          delay: 1.6 + i * 0.08,
                          type: 'spring',
                          stiffness: 300,
                          damping: 15,
                        }
                  }
                  className="w-5 h-5 rounded-full bg-[rgba(110,231,183,0.15)] flex items-center justify-center flex-shrink-0"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6EE7B7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </motion.div>
                <span className="text-[14px] text-[#EDE8DC]" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
                  {feature}
                </span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Button */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={reduceMotion ? undefined : { delay: 2.0, duration: 0.4 }}
          className="w-full mt-8"
        >
          <a
            href="/m/journeys"
            className="block w-full h-[52px] rounded-[26px] flex items-center justify-center text-[15px] font-medium tracking-wide text-[#F8F6F0]"
            style={{
              background: 'linear-gradient(135deg, #D4A017, #C89430)',
              fontFamily: 'Outfit, system-ui, sans-serif',
              letterSpacing: '0.02em',
            }}
          >
            Begin Your First Journey &#x2192;
          </a>
        </motion.div>

        {/* Secondary link */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduceMotion ? undefined : { delay: 2.2, duration: 0.3 }}
          className="mt-3"
        >
          <a
            href="/m"
            className="text-[13px] text-[#6B6355] hover:text-[#B8AE98] transition-colors"
            style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}
          >
            &#x2190; Return to home
          </a>
        </motion.div>

        {/* Trial Note */}
        {trialDays > 0 && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={reduceMotion ? undefined : { delay: 2.4, duration: 0.3 }}
            className="mt-6 p-3 rounded-xl bg-[rgba(22,26,66,0.4)] border border-[rgba(255,255,255,0.06)] text-center"
          >
            <p className="text-[11px] text-[#6B6355] leading-relaxed" style={{ fontFamily: 'Outfit, system-ui, sans-serif' }}>
              Your {trialDays}-day free trial is active.
              <br />
              First charge: {formattedTrialEnd}. Cancel anytime in Settings.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default SuccessScreen
