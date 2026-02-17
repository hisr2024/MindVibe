'use client'

/**
 * DivineKrishnaPresence - The Divine Friend awaits
 *
 * An immersive hero section that embodies Krishna as the compassionate
 * divine friend (Sakha) and spiritual guide. Not a flashy card —
 * a serene, atmospheric presence that makes the user feel held and welcomed.
 */

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { KiaanLogo } from '@/src/components/KiaanLogo'
import { springConfigs } from '@/lib/animations/spring-configs'
import { useLanguage } from '@/hooks/useLanguage'

export function DivineKrishnaPresence() {
  const reduceMotion = useReducedMotion()
  const { t } = useLanguage()

  return (
    <motion.header
      className="relative overflow-hidden rounded-3xl"
      initial={reduceMotion ? undefined : { opacity: 0, y: 30 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Atmospheric container */}
      <div className="divine-hero-container relative px-6 py-10 sm:px-8 sm:py-14 md:px-12 md:py-20">
        {/* Radial divine light behind the logo */}
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
              : {
                  scale: [1, 1.08, 1],
                  opacity: [0.7, 1, 0.7],
                }
          }
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Content */}
        <div className="relative flex flex-col items-center justify-center space-y-6 text-center">
          {/* KIAAN Logo */}
          <motion.div
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.85 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, ...springConfigs.smooth }}
          >
            <KiaanLogo
              size="lg"
              className="drop-shadow-[0_8px_40px_rgba(212,164,76,0.2)]"
            />
          </motion.div>

          {/* Divine greeting */}
          <motion.div
            className="space-y-3"
            initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
            animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
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

          {/* Sacred verse - brief opener */}
          <motion.div
            className="mx-auto max-w-md"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
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
            transition={{ delay: 1, ...springConfigs.smooth }}
          >
            <Link href="/kiaan/chat">
              <motion.div
                className="divine-cta-primary inline-flex items-center gap-2.5 rounded-2xl px-7 py-3.5 text-sm font-semibold shadow-lg"
                whileHover={{ scale: 1.04, boxShadow: '0 20px 50px rgba(212, 164, 76, 0.3)' }}
                whileTap={{ scale: 0.96 }}
                transition={springConfigs.snappy}
              >
                {t('home.divine.ctaPrimary', 'Speak with Krishna')}
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

          {/* Privacy - sacred trust */}
          <motion.p
            className="pt-2 text-xs text-slate-400/50"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={reduceMotion ? undefined : { opacity: 1 }}
            transition={{ delay: 1.3, duration: 0.5 }}
          >
            {t('home.divine.privacy', 'Your words remain sacred and private. A confidential refuge.')}
          </motion.p>
        </div>
      </div>
    </motion.header>
  )
}
