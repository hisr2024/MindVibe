'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '@/components/ui'
import { MindVibeLockup } from '@/components/branding'
import { springConfigs, animationVariants } from '@/lib/animations/spring-configs'
import { useLanguage } from '@/hooks/useLanguage'

export default function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  // Close menu when route changes
  useEffect(() => {
    setOpen(false)
  }, [pathname])

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

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
      className="fixed inset-x-0 top-0 z-40 border-b border-white/5 bg-[var(--brand-surface)]/95 shadow-lg shadow-black/20 backdrop-blur-xl"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={springConfigs.smooth}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 pr-16 md:pr-4">
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
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 md:hidden"
            aria-expanded={open}
            aria-label={t('navigation.actions.toggleMenu', 'Toggle navigation menu')}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255,255,255,0.1)' }}
            whileTap={{ scale: 0.95 }}
          >
            <motion.svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              animate={{ rotate: open ? 90 : 0 }}
              transition={springConfigs.snappy}
            >
              {open ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="8" x2="20" y2="8" />
                  <line x1="4" y1="16" x2="20" y2="16" />
                </>
              )}
            </motion.svg>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              className="fixed inset-0 top-[60px] z-30 bg-black/75 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              aria-hidden="true"
            />
            {/* Mobile menu */}
            <motion.div
              className="fixed inset-x-0 top-[60px] z-40 max-h-[calc(100vh-60px)] overflow-y-auto border-t border-white/10 bg-slate-950 px-4 py-4 shadow-xl md:hidden"
              aria-label="Mobile navigation"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={springConfigs.smooth}
            >
              <motion.nav
                className="flex flex-col gap-1"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.04,
                    },
                  },
                }}
                initial="hidden"
                animate="visible"
              >
                {links.map(link => {
                  const active = pathname === link.href
                  const isHighlight = 'highlight' in link && link.highlight
                  return (
                    <motion.div
                      key={link.href}
                      variants={animationVariants.slideUp}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        className={`flex min-h-[48px] items-center rounded-xl px-4 py-3 text-base font-medium transition-all focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                          active
                            ? isHighlight
                              ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/20'
                              : 'bg-white/10 text-white'
                            : isHighlight
                            ? 'bg-gradient-to-r from-orange-500/20 to-amber-500/20 text-orange-100 hover:from-orange-500/30 hover:to-amber-500/30'
                            : 'text-white/80 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {link.label}
                        {isHighlight && !active && (
                          <span className="ml-auto rounded-full bg-orange-500/20 px-2 py-0.5 text-xs text-orange-300">
                            AI
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  )
                })}

                <motion.div
                  className="my-2 border-t border-white/10"
                  variants={animationVariants.slideUp}
                />

                <motion.div
                  className="flex min-h-[48px] items-center justify-between rounded-xl bg-white/5 px-4 py-3"
                  variants={animationVariants.slideUp}
                >
                  <span className="text-base font-medium text-white/80">{t('navigation.mainNav.theme', 'Theme')}</span>
                  <ThemeToggle />
                </motion.div>

                <motion.div variants={animationVariants.slideUp} className="mt-2">
                  <Link
                    href="/account"
                    onClick={() => setOpen(false)}
                    className="flex min-h-[48px] items-center justify-center rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-base font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition-all hover:shadow-xl"
                  >
                    {t('navigation.mainNav.account', 'Account Access')}
                  </Link>
                </motion.div>
              </motion.nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
