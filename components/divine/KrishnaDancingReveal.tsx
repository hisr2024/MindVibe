'use client'

/**
 * KrishnaDancingReveal — Click Krishna's dancing form to reveal the Divine Presence banner
 *
 * A golden-outlined SVG of Krishna in a classic Natya (dance) pose with
 * pulsing shadow animation. Clicking reveals the "Divine Presence" banner
 * below the figure, linking to the /introduction page.
 */

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'
import { KrishnaAnimatedSilhouette } from './KrishnaAnimatedSilhouette'

const DIVINE_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${10 + (i * 11) % 80}%`,
  delay: i * 0.5,
  duration: 3 + (i % 2) * 1.5,
  size: i % 2 === 0 ? 2.5 : 2,
}))

export function KrishnaDancingReveal() {
  const [showPresence, setShowPresence] = useState(false)
  const reduceMotion = useReducedMotion()
  const { t } = useLanguage()

  return (
    <section className="relative mx-auto max-w-3xl">
      <div className="flex flex-col items-center justify-center">

        {/* === Dancing Krishna SVG === */}
        <motion.div
          className="relative cursor-pointer select-none"
          role="button"
          tabIndex={0}
          aria-label={t('home.krishna.ariaLabel', 'Reveal Krishna\'s eternal presence')}
          aria-expanded={showPresence}
          onClick={() => setShowPresence(prev => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              setShowPresence(prev => !prev)
            }
          }}
          animate={
            reduceMotion
              ? undefined
              : {
                  filter: [
                    'drop-shadow(0 0 8px rgba(212,164,76,0.3)) drop-shadow(0 0 20px rgba(212,164,76,0.15))',
                    'drop-shadow(0 0 16px rgba(212,164,76,0.5)) drop-shadow(0 0 35px rgba(212,164,76,0.25))',
                    'drop-shadow(0 0 8px rgba(212,164,76,0.3)) drop-shadow(0 0 20px rgba(212,164,76,0.15))',
                  ],
                }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.97 }}
        >
          <motion.div
            animate={reduceMotion ? undefined : { rotate: [-1.5, 1.5, -1.5] }}
            transition={
              reduceMotion
                ? undefined
                : { duration: 4, repeat: Infinity, ease: 'easeInOut' }
            }
          >
            <svg
              viewBox="0 0 400 700"
              className="h-[200px] sm:h-[260px] md:h-[280px] w-auto"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="krishna-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f0c96d" />
                  <stop offset="50%" stopColor="#e8b54a" />
                  <stop offset="100%" stopColor="#d4a44c" />
                </linearGradient>
              </defs>

              <g
                stroke="url(#krishna-gold)"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="rgba(212,164,76,0.05)"
              >
                <ellipse cx="200" cy="115" rx="32" ry="38" />
                <path d="M175 90 L185 55 L195 80 L200 45 L205 80 L215 55 L225 90" />
                <ellipse cx="200" cy="90" rx="28" ry="6" />
                <path d="M210 60 Q225 25 215 10 Q230 30 228 55" />
                <ellipse cx="220" cy="22" rx="6" ry="10" opacity="0.7" />
                <ellipse cx="200" cy="120" rx="26" ry="32" opacity="0.8" />
                <rect x="190" y="148" width="20" height="18" rx="8" />
                <path d="M155 170 Q180 158 205 165 Q225 158 250 168 L255 188 Q235 182 205 190 Q175 182 150 188 Z" />
                <path d="M158 188 Q168 248 182 305 Q195 318 210 315 Q225 318 232 305 Q242 248 248 188 Z" opacity="0.9" />
                <path d="M155 188 Q130 170 120 145 Q115 128 125 115 Q130 110 138 118 Q135 135 142 155 Q148 168 155 178" opacity="0.85" />
                <ellipse cx="126" cy="114" rx="7" ry="6" opacity="0.8" />
                <path d="M248 188 Q268 200 285 218 Q295 228 298 235 Q300 242 294 244 L272 232 Q260 220 250 205" opacity="0.85" />
                <ellipse cx="296" cy="240" rx="7" ry="6" opacity="0.8" />
                <rect x="195" y="130" width="110" height="4" rx="2" transform="rotate(28 195 130)" opacity="0.7" />
                <circle cx="220" cy="142" r="1.5" opacity="0.5" />
                <circle cx="238" cy="150" r="1.5" opacity="0.5" />
                <circle cx="256" cy="158" r="1.5" opacity="0.5" />
                <path d="M168 172 Q188 188 205 192 Q222 188 242 172" strokeWidth="2" fill="none" opacity="0.5" />
                <path d="M215 310 Q225 400 230 480 Q232 540 228 600 Q226 650 220 680" opacity="0.85" />
                <ellipse cx="218" cy="685" rx="18" ry="6" opacity="0.7" />
                <path d="M185 310 Q170 360 160 400 Q155 420 165 435 Q178 445 190 430 Q195 415 188 390 Q182 370 185 350" opacity="0.85" />
                <path d="M165 432 Q155 440 148 438 Q145 435 150 430 Q158 428 165 432" opacity="0.7" />
                <path d="M180 310 Q168 380 175 450 Q180 500 195 560 Q200 590 205 620 L215 620 Q220 590 225 560 Q238 500 240 450 Q248 380 232 310" opacity="0.7" />
                <path d="M170 340 Q155 380 148 420 Q145 440 150 455" strokeWidth="1.5" fill="none" opacity="0.4" />
                <path d="M160 400 Q148 430 145 460 Q144 475 150 485" strokeWidth="1.5" fill="none" opacity="0.3" />
                <path d="M235 340 Q250 400 255 450 Q258 470 252 490" strokeWidth="1.5" fill="none" opacity="0.4" />
              </g>
            </svg>
          </motion.div>
        </motion.div>

        {/* Hint text */}
        <AnimatePresence>
          {!showPresence && (
            <motion.p
              className="mt-4 text-xs sm:text-sm text-[#d4a44c]/40 font-sacred italic text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {t('home.krishna.hint', 'Touch to feel His presence')}
            </motion.p>
          )}
        </AnimatePresence>

        {/* === Divine Presence Banner (revealed on click) === */}
        <AnimatePresence>
          {showPresence && (
            <motion.div
              className="w-full mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link href="/introduction" className="group block">
                <motion.div
                  className="relative overflow-hidden rounded-[24px] p-5 sm:p-6 md:p-7 shadow-[0_8px_40px_rgba(212,168,67,0.15)] transition-all duration-300 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.12) 0%, rgba(184, 134, 11, 0.08) 50%, rgba(212, 168, 67, 0.06) 100%)',
                    border: '1px solid rgba(212, 168, 67, 0.2)',
                  }}
                  whileHover={{ scale: 1.02, boxShadow: '0 12px 50px rgba(212, 168, 67, 0.25)' }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Inner pulsing glow */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none rounded-[24px]"
                    animate={{
                      boxShadow: [
                        'inset 0 0 30px rgba(212, 168, 67, 0.05)',
                        'inset 0 0 50px rgba(212, 168, 67, 0.12)',
                        'inset 0 0 30px rgba(212, 168, 67, 0.05)',
                      ],
                    }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  />

                  {/* Floating golden particles */}
                  {DIVINE_PARTICLES.map((particle) => (
                    <motion.div
                      key={particle.id}
                      className="absolute rounded-full bg-[#d4a843]/70"
                      style={{
                        width: particle.size,
                        height: particle.size,
                        left: particle.left,
                        bottom: 0,
                      }}
                      animate={{
                        y: [0, -120],
                        opacity: [0, 0.9, 0.7, 0],
                        scale: [0.4, 1, 0.6, 0.2],
                      }}
                      transition={{
                        duration: particle.duration,
                        repeat: Infinity,
                        delay: particle.delay,
                        ease: 'easeOut',
                      }}
                    />
                  ))}

                  {/* Top radiance line */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a843]/50 to-transparent" />

                  {/* Animated Krishna silhouettes flanking the banner */}
                  <KrishnaAnimatedSilhouette position="left" />
                  <KrishnaAnimatedSilhouette position="right" />

                  <div className="relative flex items-center gap-4 sm:gap-5">
                    {/* Golden OM circle with pulsing glow */}
                    <motion.div
                      className="relative flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full sm:h-18 sm:w-18 md:h-20 md:w-20"
                      style={{
                        background: 'linear-gradient(135deg, #d4a843 0%, #e8c56d 50%, #b8860b 100%)',
                      }}
                      animate={{
                        scale: [1, 1.06, 1],
                        boxShadow: [
                          '0 0 25px rgba(212, 168, 67, 0.35), 0 0 50px rgba(212, 168, 67, 0.15)',
                          '0 0 35px rgba(212, 168, 67, 0.5), 0 0 70px rgba(212, 168, 67, 0.25)',
                          '0 0 25px rgba(212, 168, 67, 0.35), 0 0 50px rgba(212, 168, 67, 0.15)',
                        ],
                      }}
                      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <motion.div
                        className="absolute inset-0 rounded-full"
                        animate={{
                          boxShadow: [
                            'inset 0 0 12px rgba(255, 255, 255, 0.3)',
                            'inset 0 0 18px rgba(255, 255, 255, 0.45)',
                            'inset 0 0 12px rgba(255, 255, 255, 0.3)',
                          ],
                        }}
                        transition={{ duration: 2.5, repeat: Infinity }}
                      />
                      <span className="text-3xl sm:text-4xl md:text-[42px] text-[#0a0a0f] drop-shadow-sm select-none" style={{ lineHeight: 1 }}>
                        {'\u0950'}
                      </span>
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <h2 className="flex flex-wrap items-center gap-2.5 font-semibold">
                        {t('home.divinePresence.title', 'Divine Presence')}
                        <span className="inline-flex rounded-full border border-[#d4a843]/30 bg-[#d4a843]/15 px-2.5 py-0.5 text-[10px] font-medium text-[#d4a843] tracking-wide uppercase">
                          {t('home.divinePresence.badge', 'Sacred')}
                        </span>
                      </h2>
                      <p className="mt-1.5 text-body text-[#d4a843]/70 line-clamp-2">
                        {t('home.divinePresence.description', "Enter the divine presence — experience Krishna's loving guidance and sacred wisdom")}
                      </p>
                    </div>

                    {/* Animated arrow */}
                    <motion.div
                      className="flex-shrink-0 text-[#d4a843]/60 transition-colors duration-300 group-hover:text-[#d4a843]"
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <svg className="h-7 w-7 sm:h-8 sm:w-8 md:h-9 md:w-9" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.div>
                  </div>

                  {/* Bottom radiance line */}
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d4a843]/30 to-transparent" />
                </motion.div>
              </Link>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
