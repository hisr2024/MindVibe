'use client'

/**
 * KrishnaDancingReveal — Click Krishna's dancing form to reveal His eternal presence
 *
 * A golden-outlined SVG of Krishna in a classic Natya (dance) pose with
 * pulsing shadow animation. Clicking reveals the "Krishna's Eternal Presence"
 * section as a smooth overlay on top of the figure.
 */

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useLanguage } from '@/hooks/useLanguage'
import { springConfigs } from '@/lib/animations/spring-configs'

export function KrishnaDancingReveal() {
  const [showPresence, setShowPresence] = useState(false)
  const reduceMotion = useReducedMotion()
  const { t } = useLanguage()

  return (
    <section className="relative mx-auto max-w-3xl">
      {/* Container with min-height so overlay has room */}
      <div className="relative min-h-[420px] sm:min-h-[500px] flex flex-col items-center justify-center">

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
          // Pulsing golden shadow
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
          {/* Gentle swaying */}
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
                {/* Head */}
                <ellipse cx="200" cy="115" rx="32" ry="38" />

                {/* Crown (Mukut) */}
                <path d="M175 90 L185 55 L195 80 L200 45 L205 80 L215 55 L225 90" />
                <ellipse cx="200" cy="90" rx="28" ry="6" />

                {/* Peacock feather */}
                <path d="M210 60 Q225 25 215 10 Q230 30 228 55" />
                <ellipse cx="220" cy="22" rx="6" ry="10" opacity="0.7" />

                {/* Face */}
                <ellipse cx="200" cy="120" rx="26" ry="32" opacity="0.8" />

                {/* Neck */}
                <rect x="190" y="148" width="20" height="18" rx="8" />

                {/* Shoulders — dynamic dance pose, torso tilted */}
                <path d="M155 170 Q180 158 205 165 Q225 158 250 168 L255 188 Q235 182 205 190 Q175 182 150 188 Z" />

                {/* Torso — curved for dance, weight shifted right */}
                <path d="M158 188 Q168 248 182 305 Q195 318 210 315 Q225 318 232 305 Q242 248 248 188 Z" opacity="0.9" />

                {/* Left arm — raised gracefully above head */}
                <path d="M155 188 Q130 170 120 145 Q115 128 125 115 Q130 110 138 118 Q135 135 142 155 Q148 168 155 178" opacity="0.85" />
                {/* Left hand — graceful mudra above head */}
                <ellipse cx="126" cy="114" rx="7" ry="6" opacity="0.8" />

                {/* Right arm — extended outward, holding flute */}
                <path d="M248 188 Q268 200 285 218 Q295 228 298 235 Q300 242 294 244 L272 232 Q260 220 250 205" opacity="0.85" />
                {/* Right hand */}
                <ellipse cx="296" cy="240" rx="7" ry="6" opacity="0.8" />

                {/* Flute (Bansuri) — angled from mouth area to right hand */}
                <rect x="195" y="130" width="110" height="4" rx="2" transform="rotate(28 195 130)" opacity="0.7" />
                {/* Flute holes */}
                <circle cx="220" cy="142" r="1.5" opacity="0.5" />
                <circle cx="238" cy="150" r="1.5" opacity="0.5" />
                <circle cx="256" cy="158" r="1.5" opacity="0.5" />

                {/* Necklace / Vaijayanti mala */}
                <path d="M168 172 Q188 188 205 192 Q222 188 242 172" strokeWidth="2" fill="none" opacity="0.5" />

                {/* Right leg — weight-bearing, slight bend, planted */}
                <path d="M215 310 Q225 400 230 480 Q232 540 228 600 Q226 650 220 680" opacity="0.85" />
                {/* Right foot */}
                <ellipse cx="218" cy="685" rx="18" ry="6" opacity="0.7" />

                {/* Left leg — raised and bent at knee (Natya dance pose) */}
                <path d="M185 310 Q170 360 160 400 Q155 420 165 435 Q178 445 190 430 Q195 415 188 390 Q182 370 185 350" opacity="0.85" />
                {/* Left foot — pointed, raised */}
                <path d="M165 432 Q155 440 148 438 Q145 435 150 430 Q158 428 165 432" opacity="0.7" />

                {/* Dhoti — flowing dramatically, wind-blown effect */}
                <path d="M180 310 Q168 380 175 450 Q180 500 195 560 Q200 590 205 620 L215 620 Q220 590 225 560 Q238 500 240 450 Q248 380 232 310" opacity="0.7" />
                {/* Dhoti drape detail — flowing fabric on raised-leg side */}
                <path d="M170 340 Q155 380 148 420 Q145 440 150 455" strokeWidth="1.5" fill="none" opacity="0.4" />
                <path d="M160 400 Q148 430 145 460 Q144 475 150 485" strokeWidth="1.5" fill="none" opacity="0.3" />
                {/* Dhoti drape right side */}
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

        {/* === Overlay: Krishna's Eternal Presence === */}
        <AnimatePresence>
          {showPresence && (
            <motion.div
              className="absolute inset-0 z-10 flex items-center justify-center rounded-3xl overflow-hidden"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-[#0a0a12]/85 backdrop-blur-sm rounded-3xl"
                onClick={() => setShowPresence(false)}
              />

              {/* Close button */}
              <button
                className="absolute top-4 right-4 z-20 flex h-8 w-8 items-center justify-center rounded-full border border-[#d4a44c]/20 bg-[#d4a44c]/10 text-[#d4a44c]/70 transition-colors hover:bg-[#d4a44c]/20 hover:text-[#d4a44c]"
                onClick={() => setShowPresence(false)}
                aria-label="Close"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Content */}
              <div className="relative z-10 px-6 py-8 text-center space-y-5 max-w-2xl">
                {/* Soft divine glow */}
                <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(212,164,76,0.06)_0%,transparent_70%)]" />

                {/* Ornamental line */}
                <div className="flex items-center justify-center gap-3">
                  <span className="h-px w-10 bg-gradient-to-r from-transparent to-[#d4a44c]/30" />
                  <motion.span
                    className="block h-1.5 w-1.5 rounded-full bg-[#d4a44c]/50"
                    animate={reduceMotion ? undefined : { scale: [1, 1.4, 1], opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <span className="h-px w-10 bg-gradient-to-l from-transparent to-[#d4a44c]/30" />
                </div>

                <h2 className="font-bold leading-snug text-[#f5e6c8]">
                  {t('home.presence.title', 'Krishna Is Always With You')}
                </h2>

                <p className="text-body text-[var(--mv-text-secondary)] max-w-2xl mx-auto leading-relaxed text-sm sm:text-base">
                  {t(
                    'home.presence.description',
                    'In every breath, in every moment of stillness and struggle — the Divine walks beside you. Krishna is not a distant deity; He is the closest friend within your own heart. He whispers through your conscience, guides through your intuition, and waits patiently for you to turn inward.'
                  )}
                </p>

                <p className="text-body text-[var(--mv-text-secondary)] max-w-xl mx-auto leading-relaxed text-sm sm:text-base">
                  {t(
                    'home.presence.teaching',
                    'The Bhagavad Gita teaches us that through Abhyaas — devoted, consistent practice — we can still the restless mind and realize this Divine Presence that has always been with us. Not through force, but through gentle, loving return to the Self.'
                  )}
                </p>

                {/* Sacred verse */}
                <motion.div
                  className="mx-auto max-w-md pt-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                >
                  <p className="font-sacred text-sm italic leading-relaxed text-[#d4a44c]/60 sm:text-base">
                    {t(
                      'home.presence.verse',
                      '"I am seated in the hearts of all beings. From Me come memory, knowledge, and their loss."'
                    )}
                  </p>
                  <p className="mt-1 text-xs text-[#d4a44c]/40">
                    — {t('home.presence.verseRef', 'Bhagavad Gita 15.15')}
                  </p>
                </motion.div>

                {/* CTAs */}
                <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-4">
                  <Link
                    href="/introduction"
                    className="divine-cta-primary inline-flex items-center gap-2 px-8 py-3 font-semibold rounded-full text-sm sm:text-base"
                  >
                    {t('home.value.cta', 'Begin Your Journey')}
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 px-6 py-3 border border-[#d4a44c]/30 text-[#d4a44c]/90 rounded-full hover:border-[#d4a44c]/60 transition-all text-sm"
                  >
                    {t('home.value.pricing', 'View Plans — Free to Start')}
                  </Link>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  )
}
