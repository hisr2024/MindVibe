'use client'

/**
 * DivineSacredActions - Quick access cards for core KIAAN tools
 *
 * Presented as sacred pathways rather than generic cards.
 * Each action is a portal into a specific aspect of the divine guidance.
 */

import { motion, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { springConfigs, animationVariants } from '@/lib/animations/spring-configs'
import { useLanguage } from '@/hooks/useLanguage'

const sacredPaths = [
  {
    href: '/kiaan/chat',
    titleKey: 'home.sacred.chat.title',
    titleFallback: 'Converse with KIAAN',
    subtitleKey: 'home.sacred.chat.subtitle',
    subtitleFallback: 'Let the divine friend listen to your heart and guide your mind.',
    ctaKey: 'home.sacred.chat.cta',
    ctaFallback: 'Begin Conversation',
    gradient: 'from-[#d4a44c]/10 to-[#f0c96d]/5',
    borderColor: 'border-[#d4a44c]/15',
    hoverBorder: 'rgba(212, 164, 76, 0.35)',
    hoverShadow: '0 20px 60px rgba(212, 164, 76, 0.15)',
    accentColor: 'text-[#f0c96d]/80',
    symbol: '\u0950', // OM
  },
  {
    href: '/dashboard',
    titleKey: 'home.sacred.dashboard.title',
    titleFallback: 'Your Sacred Journey',
    subtitleKey: 'home.sacred.dashboard.subtitle',
    subtitleFallback: 'Witness your growth — mood patterns, wisdom gathered, steps walked.',
    ctaKey: 'home.sacred.dashboard.cta',
    ctaFallback: 'View Progress',
    gradient: 'from-[#1e3a8a]/10 to-[#6ad7ff]/5',
    borderColor: 'border-[#1e3a8a]/15',
    hoverBorder: 'rgba(106, 215, 255, 0.35)',
    hoverShadow: '0 20px 60px rgba(106, 215, 255, 0.12)',
    accentColor: 'text-[#6ad7ff]/80',
    symbol: '\u2727', // sparkle
  },
  {
    href: '/emotional-reset',
    titleKey: 'home.sacred.reset.title',
    titleFallback: 'Emotional Reset',
    subtitleKey: 'home.sacred.reset.subtitle',
    subtitleFallback: 'A sacred pause — breathe, release, return to your center of stillness.',
    ctaKey: 'home.sacred.reset.cta',
    ctaFallback: 'Find Stillness',
    gradient: 'from-[#5b2168]/10 to-[#c2a5ff]/5',
    borderColor: 'border-[#c2a5ff]/12',
    hoverBorder: 'rgba(194, 165, 255, 0.35)',
    hoverShadow: '0 20px 60px rgba(194, 165, 255, 0.12)',
    accentColor: 'text-[#c2a5ff]/80',
    symbol: '\u2605', // star
  },
]

export function DivineSacredActions() {
  const reduceMotion = useReducedMotion()
  const { t } = useLanguage()

  return (
    <motion.section
      className="grid gap-4 sm:grid-cols-2 md:grid-cols-3"
      aria-label="Sacred pathways"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-80px' }}
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.12 },
        },
      }}
    >
      {sacredPaths.map((path) => (
        <motion.div key={path.href} variants={animationVariants.slideUp}>
          <Link href={path.href}>
            <motion.div
              className={`divine-action-card group relative overflow-hidden rounded-2xl border ${path.borderColor} bg-gradient-to-br ${path.gradient} p-5 sm:p-6`}
              whileHover={{
                y: -4,
                borderColor: path.hoverBorder,
                boxShadow: path.hoverShadow,
                transition: springConfigs.snappy,
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Subtle background symbol */}
              <span
                className="pointer-events-none absolute -right-2 -top-2 text-6xl opacity-[0.04] select-none"
                aria-hidden
              >
                {path.symbol}
              </span>

              <h3 className="text-base font-semibold text-slate-100/90 sm:text-lg">
                {t(path.titleKey, path.titleFallback)}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-300/60">
                {t(path.subtitleKey, path.subtitleFallback)}
              </p>
              <div className={`mt-4 inline-flex items-center gap-2 text-sm font-semibold ${path.accentColor}`}>
                {t(path.ctaKey, path.ctaFallback)}
                <motion.span
                  aria-hidden
                  animate={reduceMotion ? undefined : { x: [0, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  &rarr;
                </motion.span>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      ))}
    </motion.section>
  )
}
