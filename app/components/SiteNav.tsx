'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '@/components/ui'
import { MindVibeLockup } from '@/components/branding'
import { springConfigs, animationVariants } from '@/lib/animations/spring-configs'
import { useLanguage } from '@/hooks/useLanguage'
import { GlobalLanguageSelector } from '@/components/navigation/GlobalLanguageSelector'

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

  // Close mobile menu on Escape key
  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [open])

  const links = useMemo(() => [
    { href: '/', label: t('navigation.mainNav.home', 'Home'), divine: true },
    { href: '/kiaan/chat', label: t('navigation.features.kiaan', 'KIAAN'), highlight: true },
    { href: '/dashboard', label: t('navigation.mainNav.dashboard', 'Dashboard') },
    { href: '/journeys', label: t('navigation.features.wisdomJourneys', 'Journeys'), premium: true },
    { href: '/sacred-reflections', label: t('navigation.features.sacredReflections', 'Sacred Reflections') },
    { href: '/tools/karmic-tree', label: t('navigation.features.karmicTree', 'Karmic Tree') },
    { href: '/profile', label: t('navigation.mainNav.profile', 'Profile') },
    { href: '/account', label: t('navigation.mainNav.account', 'Account') },
    { href: '/introduction', label: t('navigation.mainNav.divinePresence', 'Divine Presence'), divine: true },
  ], [t])

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-40 border-b border-[#d4a44c]/10 bg-[#050507]/95 shadow-lg shadow-black/30 backdrop-blur-xl"
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
            const active = link.href === '/' ? pathname === '/' : (pathname === link.href || pathname.startsWith(link.href + '/'))
            const isHighlight = 'highlight' in link && link.highlight
            const isDivine = 'divine' in link && link.divine
            return (
              <motion.div
                key={link.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05, ...springConfigs.smooth }}
              >
                <Link
                  href={link.href}
                  aria-current={active ? 'page' : undefined}
                  className={`block rounded-full px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507] ${
                    active
                      ? isDivine
                        ? 'border-2 border-[#d4a44c] text-[#e8b54a] shadow-lg shadow-[#d4a44c]/20'
                        : isHighlight
                        ? 'border-2 border-[#d4a44c] text-[#e8b54a] shadow-lg shadow-[#d4a44c]/20'
                        : 'bg-[#d4a44c]/10 text-white shadow-[0_0_16px_rgba(212,164,76,0.15)]'
                      : isDivine
                      ? 'border border-[#d4a44c]/40 text-[#d4a44c]/80 hover:border-[#d4a44c]/60 hover:text-[#e8b54a]'
                      : isHighlight
                      ? 'border border-[#d4a44c]/40 text-[#d4a44c]/80 hover:border-[#d4a44c]/60 hover:text-[#e8b54a]'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/90'
                  }`}
                >
                  <motion.span
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="block flex items-center gap-1"
                  >
                    {link.label}
                  </motion.span>
                </Link>
              </motion.div>
            )
          })}
        </nav>

        <div className="flex items-center gap-2 md:gap-3">
          {/* Language Selector - Always visible */}
          <GlobalLanguageSelector />

          <Link
            href="/dashboard/subscription"
            className="hidden rounded-full border border-[#d4a44c]/20 px-4 py-2 text-sm font-semibold text-white/70 transition hover:border-[#d4a44c]/40 hover:text-white sm:inline-flex"
          >
            <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {t('navigation.mainNav.pricing', 'Subscriptions')}
            </motion.span>
          </Link>
          <Link
            href="/introduction"
            className="hidden rounded-full px-4 py-2 text-sm font-semibold text-[#0a0a0f] shadow-[0_4px_20px_rgba(212,164,76,0.3)] md:inline-flex"
            style={{ background: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 45%, #f0c96d 100%)' }}
          >
            <motion.span
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={springConfigs.snappy}
            >
              {t('navigation.mainNav.divinePresence', 'Divine Presence')}
            </motion.span>
          </Link>
          <motion.button
            onClick={() => setOpen(value => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-[#d4a44c]/20 bg-[#d4a44c]/5 text-white/70 md:hidden"
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
              className="fixed inset-x-0 top-[60px] z-40 max-h-[calc(100vh-60px)] overflow-y-auto border-t border-[#d4a44c]/10 bg-[#050507] px-4 py-4 shadow-xl md:hidden"
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
                  const isDivine = 'divine' in link && link.divine
                  return (
                    <motion.div
                      key={link.href}
                      variants={animationVariants.slideUp}
                    >
                      <Link
                        href={link.href}
                        onClick={() => setOpen(false)}
                        aria-current={active ? 'page' : undefined}
                        className={`flex min-h-[48px] items-center rounded-xl px-4 py-3 text-base font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#d4a44c]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#050507] ${
                          active
                            ? isDivine
                              ? 'border-2 border-[#d4a44c] text-[#e8b54a] shadow-lg shadow-[#d4a44c]/20'
                              : isHighlight
                              ? 'border-2 border-[#d4a44c] text-[#e8b54a] shadow-lg shadow-[#d4a44c]/20'
                              : 'bg-[#d4a44c]/10 text-white'
                            : isDivine
                            ? 'border border-[#d4a44c]/40 text-[#d4a44c]/80 hover:border-[#d4a44c]/60 hover:text-[#e8b54a]'
                            : isHighlight
                            ? 'border border-[#d4a44c]/40 text-[#d4a44c]/80 hover:border-[#d4a44c]/60 hover:text-[#e8b54a]'
                            : 'text-white/70 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        {link.label}
                        {isHighlight && !active && (
                          <span className="ml-auto rounded-full bg-[#d4a44c]/15 px-2 py-0.5 text-xs text-[#d4a44c]/80">
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
                  className="flex min-h-[48px] items-center justify-between rounded-xl bg-[#d4a44c]/5 px-4 py-3"
                  variants={animationVariants.slideUp}
                >
                  <span className="text-base font-medium text-white/80">{t('navigation.mainNav.theme', 'Theme')}</span>
                  <ThemeToggle />
                </motion.div>

                <motion.div variants={animationVariants.slideUp} className="mt-2">
                  <Link
                    href="/introduction"
                    onClick={() => setOpen(false)}
                    className="flex min-h-[48px] items-center justify-center rounded-xl px-4 py-3 text-base font-semibold text-[#0a0a0f] shadow-lg shadow-[#d4a44c]/20 transition-all hover:shadow-xl"
                    style={{ background: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 45%, #f0c96d 100%)' }}
                  >
                    {t('navigation.mainNav.divinePresence', 'Divine Presence')}
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
