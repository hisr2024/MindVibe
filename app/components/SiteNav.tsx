'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '@/components/ui'
import { MindVibeLockup } from '@/components/branding'
import { springConfigs, animationVariants } from '@/lib/animations/spring-configs'
import { useLanguage } from '@/hooks/useLanguage'

export default function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  const links = useMemo(() => [
    { href: '/', label: t('navigation.mainNav.home', 'Home') },
    { href: '/kiaan/chat', label: t('navigation.features.kiaan', 'KIAAN Chat'), highlight: true },
    { href: '/dashboard', label: t('navigation.mainNav.dashboard', 'Dashboard') },
    { href: '/wisdom-rooms', label: t('navigation.features.wisdomRooms', 'Wisdom Rooms') },
    { href: '/sacred-reflections', label: t('navigation.features.sacredReflections', 'Sacred Reflections') },
    { href: '/karmic-tree', label: t('navigation.features.karmicTree', 'Karmic Tree') },
    { href: '/profile', label: t('navigation.mainNav.profile', 'Profile') },
  ], [t])

  return (
    <motion.header 
      className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-[var(--brand-surface)]/95 shadow-lg shadow-black/20 backdrop-blur-xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={springConfigs.smooth}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex items-center gap-3 text-slate-100 transition hover:text-white"
          aria-label="MindVibe home"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springConfigs.snappy}
          >
            <MindVibeLockup theme="sunrise" animated className="drop-shadow-[0_10px_40px_rgba(255,147,89,0.28)]" />
          </motion.div>
        </Link>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
          {links.map((link, index) => {
            const active = pathname === link.href || pathname.startsWith(link.href + '/')
            const isHighlight = 'highlight' in link && link.highlight
            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, ...springConfigs.smooth }}
              >
                <Link
                  href={link.href}
                  className={`block rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                    active
                      ? isHighlight
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30'
                        : 'bg-white/10 text-white shadow-glowSunrise'
                      : isHighlight
                      ? 'bg-gradient-to-r from-orange-500/80 to-amber-500/80 text-white hover:from-orange-500 hover:to-amber-500 shadow-md shadow-orange-500/20'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="block"
                  >
                    {link.label}
                  </motion.span>
                </Link>
              </motion.div>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/subscription"
            className="hidden rounded-full border border-white/10 px-4 py-2 text-sm font-semibold text-white/80 transition hover:bg-white/5 hover:text-white sm:inline-flex"
          >
            <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {t('navigation.mainNav.pricing', 'Subscriptions')}
            </motion.span>
          </Link>
          <Link
            href="/account"
            className="hidden rounded-full bg-mvGradientSunrise px-4 py-2 text-sm font-semibold text-slate-950 shadow-glowSunrise md:inline-flex"
          >
            <motion.span 
              whileHover={{ scale: 1.05 }} 
              whileTap={{ scale: 0.95 }}
              transition={springConfigs.snappy}
            >
              {t('navigation.mainNav.account', 'Account Access')}
            </motion.span>
          </Link>
          <motion.button
            onClick={() => setOpen(value => !value)}
            className="inline-flex items-center justify-center rounded-full border border-white/10 px-3 py-2 text-white/80 md:hidden"
            aria-expanded={open}
            aria-label={t('navigation.actions.toggleMenu', 'Toggle navigation menu')}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-sm font-semibold">{t('navigation.actions.menu', 'Menu')}</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div 
            className="border-t border-white/5 bg-slate-950/95 px-4 py-3 md:hidden" 
            aria-label="Mobile navigation"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={springConfigs.smooth}
          >
            <motion.div 
              className="flex flex-col gap-2"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.05,
                  },
                },
              }}
              initial="hidden"
              animate="visible"
            >
              {links.map(link => {
                const active = pathname === link.href
                return (
                  <motion.div
                    key={link.href}
                    variants={animationVariants.slideUp}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`block rounded-xl px-3 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-mv.ocean focus:ring-offset-2 focus:ring-offset-slate-900 ${
                        active ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                )
              })}
              <motion.div 
                className="flex items-center justify-between rounded-xl px-3 py-2"
                variants={animationVariants.slideUp}
              >
                <span className="text-sm text-white/80">{t('navigation.mainNav.theme', 'Theme')}</span>
                <ThemeToggle />
              </motion.div>
              <motion.div variants={animationVariants.slideUp}>
                <Link
                  href="/account"
                  onClick={() => setOpen(false)}
                  className="block rounded-full bg-mvGradientSunrise px-3 py-2 text-center text-sm font-semibold text-slate-950 shadow-glowSunrise"
                >
                  {t('navigation.mainNav.account', 'Account Access')}
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
