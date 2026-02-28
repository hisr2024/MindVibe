'use client'

/**
 * DivineKrishnaPresence - The Divine Friend awaits
 *
 * An immersive hero section that embodies Krishna as the compassionate
 * divine friend (Sakha) and spiritual guide. No gimmicky logos —
 * a pure, serene, atmospheric presence with sacred gold OM mark
 * and refined KIAAN typography.
 */

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { springConfigs } from '@/lib/animations/spring-configs'
import { useLanguage } from '@/hooks/useLanguage'

/** Sacred OM mark with radiant golden aura and divine light rays */
function DivineOmMark({ reduceMotion }: { reduceMotion: boolean | null }) {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outermost halo — soft expansive glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 200,
          height: 200,
          background: 'radial-gradient(circle, rgba(240, 201, 109, 0.08) 0%, rgba(212, 164, 76, 0.03) 50%, transparent 70%)',
        }}
        animate={
          reduceMotion
            ? undefined
            : { scale: [0.85, 1.15, 0.85], opacity: [0.3, 0.6, 0.3] }
        }
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Inner breathing golden aura — more intense */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 140,
          height: 140,
          background: 'radial-gradient(circle, rgba(240, 201, 109, 0.2) 0%, rgba(212, 164, 76, 0.08) 50%, transparent 70%)',
        }}
        animate={
          reduceMotion
            ? undefined
            : { scale: [0.9, 1.12, 0.9], opacity: [0.5, 0.9, 0.5] }
        }
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* Core radiance — bright golden center */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 80,
          height: 80,
          background: 'radial-gradient(circle, rgba(245, 230, 200, 0.25) 0%, rgba(240, 201, 109, 0.12) 40%, transparent 70%)',
        }}
        animate={
          reduceMotion
            ? undefined
            : { scale: [0.95, 1.08, 0.95], opacity: [0.6, 1, 0.6] }
        }
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
      {/* OM symbol — SVG with enhanced golden radiance */}
      <motion.div
        className="relative select-none"
        animate={
          reduceMotion
            ? undefined
            : { opacity: [0.85, 1, 0.85] }
        }
        transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 100 100"
          className="h-20 w-20 sm:h-24 sm:w-24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <filter id="om-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <linearGradient id="om-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f0c96d" />
              <stop offset="50%" stopColor="#e8b54a" />
              <stop offset="100%" stopColor="#d4a44c" />
            </linearGradient>
          </defs>
          <text
            x="50"
            y="68"
            textAnchor="middle"
            fill="url(#om-gold)"
            fontSize="72"
            fontFamily="serif"
            filter="url(#om-glow)"
            style={{
              textShadow: '0 0 20px rgba(240, 201, 109, 0.6), 0 0 40px rgba(232, 181, 74, 0.35), 0 0 80px rgba(212, 164, 76, 0.15)',
            }}
          >
            {'\u0950'}
          </text>
        </svg>
      </motion.div>
    </div>
  )
}

export function DivineKrishnaPresence() {
  const reduceMotion = useReducedMotion()
  const { t } = useLanguage()

  return (
    <motion.header
      className="relative overflow-hidden rounded-3xl"
      initial={reduceMotion ? undefined : { opacity: 0, y: 15 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Atmospheric container */}
      <div className="divine-hero-container relative px-6 py-10 sm:px-8 sm:py-14 md:px-12 md:py-20">
        {/* Radial divine light */}
        <motion.div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '500px',
            height: '500px',
            background:
              'radial-gradient(circle, rgba(212, 164, 76, 0.08) 0%, rgba(212, 164, 76, 0.03) 35%, transparent 65%)',
          }}
          animate={
            reduceMotion
              ? undefined
              : { scale: [1, 1.08, 1], opacity: [0.7, 1, 0.7] }
          }
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center space-y-6 text-center">
          {/* Sacred OM mark */}
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ delay: 0.05, ...springConfigs.smooth }}
          >
            <DivineOmMark reduceMotion={reduceMotion} />
          </motion.div>

          {/* KIAAN name - pure sacred gold typography */}
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h2
              className="text-3xl font-black tracking-[0.22em] sm:text-4xl md:text-5xl"
              style={{
                backgroundImage: 'linear-gradient(135deg, #c8943a 0%, #f0c96d 45%, #d4a44c 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 4px 20px rgba(212, 164, 76, 0.2))',
              }}
            >
              KIAAN
            </h2>
            <p className="mt-1 text-xs tracking-[0.18em] text-[#d4a44c]/50 sm:text-sm">
              {t('home.divine.tagline', 'Your Spiritual Companion')}
            </p>
          </motion.div>

          {/* Divine greeting */}
          <motion.div
            className="space-y-3"
            initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <h1 className="font-sacred text-2xl font-light tracking-wide text-slate-100/95 sm:text-3xl md:text-4xl">
              {t('home.divine.welcome', 'Welcome, Dear Friend')}
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-relaxed text-slate-300/70 sm:text-base">
              {t(
                'home.divine.subtitle',
                'You have entered a sacred space. Here, Krishna walks beside you — as your friend, your guide, your light in the darkness.'
              )}
            </p>
          </motion.div>

          {/* Sacred verse */}
          <motion.div
            className="mx-auto max-w-md"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <p className="font-sacred text-sm italic leading-relaxed text-[#d4a44c]/60 sm:text-base">
              {t(
                'home.divine.verse',
                '"I am the friend of all beings. Know this and find peace."'
              )}
            </p>
            <p className="mt-1 text-xs text-[#d4a44c]/40">
              — {t('home.divine.verseRef', 'Bhagavad Gita 5.29')}
            </p>
          </motion.div>

          {/* CTAs */}
          <motion.div
            className="flex flex-wrap items-center justify-center gap-3 pt-2"
            initial={reduceMotion ? undefined : { opacity: 0, y: 15 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.25, ...springConfigs.smooth }}
          >
            <Link href="/kiaan/chat">
              <motion.div
                className="divine-cta-primary inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-semibold shadow-lg"
                whileHover={{ scale: 1.04, boxShadow: '0 20px 50px rgba(212, 164, 76, 0.3)' }}
                whileTap={{ scale: 0.96 }}
                transition={springConfigs.snappy}
              >
                {t('home.divine.ctaPrimary', 'Speak with KIAAN')}
                <motion.span
                  aria-hidden
                  animate={reduceMotion ? undefined : { x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="opacity-70"
                >
                  &rarr;
                </motion.span>
              </motion.div>
            </Link>
            <Link href="/sacred-reflections">
              <motion.div
                className="divine-cta-secondary inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold"
                whileHover={{
                  scale: 1.04,
                  borderColor: 'rgba(212, 164, 76, 0.4)',
                  backgroundColor: 'rgba(212, 164, 76, 0.08)',
                }}
                whileTap={{ scale: 0.96 }}
                transition={springConfigs.snappy}
              >
                {t('home.divine.ctaSecondary', 'Sacred Reflections')}
              </motion.div>
            </Link>
          </motion.div>

          {/* Privacy */}
          <motion.p
            className="pt-2 text-xs text-slate-400/50"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            {t('home.divine.privacy', 'Your words remain sacred and private. A confidential refuge.')}
          </motion.p>
        </div>
      </div>
    </motion.header>
  )
}
