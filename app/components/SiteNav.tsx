'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ThemeToggle } from '@/components/ui'
import { springConfigs, animationVariants } from '@/lib/animations/spring-configs'
import { useLanguage } from '@/hooks/useLanguage'
import { LanguageSelector } from '@/components/navigation/LanguageSelector'
import { SakhaSymbol } from '@/components/branding/SakhaSymbol'

export default function SiteNav() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  useEffect(() => {
    if (open) setOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    { href: '/sadhana', label: t('navigation.features.sadhana', 'Sadhana'), divine: true },
    { href: '/kiaan/chat', label: t('navigation.features.kiaan', 'KIAAN'), highlight: true },
    { href: '/dashboard', label: t('navigation.mainNav.dashboard', 'Dashboard') },
    { href: '/journeys', label: t('navigation.features.wisdomJourneys', 'Journeys'), premium: true },
{ href: '/sacred-reflections', label: t('navigation.features.sacredReflections', 'Sacred Reflections') },
    { href: '/tools/karmic-tree', label: t('navigation.features.karmicTree', 'Karmic Tree') },
    { href: '/profile', label: t('navigation.mainNav.profile', 'Profile') },
    { href: '/account', label: t('navigation.mainNav.account', 'Account') },
  ], [t])

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-40"
      style={{
        backgroundColor: 'rgba(5, 7, 20, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(212, 160, 23, 0.1)',
      }}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={springConfigs.smooth}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 pr-16 md:pr-4">
        {/* Logo — Sakha symbol + wordmark */}
        <Link
          href="/"
          className="flex items-center gap-2 font-divine italic transition-opacity hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(5,7,20,0.85)]"
          style={{
            color: '#D4A017',
            fontSize: '28px',
            fontWeight: 500,
            letterSpacing: '0.02em',
          }}
          aria-label="Sakha home"
        >
          <SakhaSymbol variant="icon" size={36} animated={false} />
          <motion.span
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={springConfigs.snappy}
            className="inline-block"
          >
            Sakha
          </motion.span>
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
                  className={`block rounded-full px-3 py-2 font-ui transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(5,7,20,0.85)] ${
                    active
                      ? isDivine
                        ? 'border-2 border-[#D4A017] text-[#F0C040] shadow-lg shadow-[#D4A017]/20'
                        : isHighlight
                        ? 'border-2 border-[#D4A017] text-[#F0C040] shadow-lg shadow-[#D4A017]/20'
                        : 'text-[#D4A017]'
                      : isDivine
                      ? 'border border-[rgba(212,160,23,0.4)] text-[rgba(212,160,23,0.8)] hover:border-[#D4A017] hover:text-[#F0C040]'
                      : isHighlight
                      ? 'border border-[rgba(212,160,23,0.4)] text-[rgba(212,160,23,0.8)] hover:border-[#D4A017] hover:text-[#F0C040]'
                      : 'text-[#B8AE98] hover:text-[#D4A017]'
                  }`}
                  style={{
                    fontSize: '13px',
                    fontWeight: 500,
                    letterSpacing: '0.02em',
                  }}
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
          <LanguageSelector />

          {/* CTA: Subscriptions — gold gradient button */}
          <Link
            href="/dashboard/subscription"
            className="hidden rounded-full font-ui transition-transform duration-200 sm:inline-flex focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(5,7,20,0.85)]"
            style={{
              background: 'linear-gradient(135deg, #D4A017 0%, #F0C040 50%, #D4A017 100%)',
              color: '#050714',
              fontSize: '13px',
              fontWeight: 600,
              letterSpacing: '0.02em',
              padding: '9px 18px',
              boxShadow: '0 4px 14px rgba(212, 160, 23, 0.35)',
            }}
          >
            <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              {t('navigation.mainNav.pricing', 'Subscriptions')}
            </motion.span>
          </Link>
          <motion.button
            onClick={() => setOpen(value => !value)}
            className="inline-flex h-11 w-11 items-center justify-center rounded-xl md:hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/60"
            style={{
              border: '1px solid rgba(212, 160, 23, 0.3)',
              backgroundColor: 'rgba(212, 160, 23, 0.05)',
              color: '#B8AE98',
            }}
            aria-expanded={open}
            aria-label={t('navigation.actions.toggleMenu', 'Toggle navigation menu')}
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(212, 160, 23, 0.12)' }}
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
            {/* Mobile menu — Kiaanverse dropdown: rgba(11,14,42,0.98) + blur + gold border */}
            <motion.div
              className="fixed inset-x-0 top-[60px] z-40 max-h-[calc(100vh-60px)] overflow-y-auto px-4 py-4 md:hidden"
              style={{
                backgroundColor: 'rgba(11, 14, 42, 0.98)',
                backdropFilter: 'blur(20px)',
                WebkitBackdropFilter: 'blur(20px)',
                borderTop: '1px solid rgba(212, 160, 23, 0.3)',
                borderBottom: '1px solid rgba(212, 160, 23, 0.3)',
                boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
              }}
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
                        className={`flex min-h-[48px] items-center rounded-xl px-4 py-3 font-ui transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A017]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[rgba(11,14,42,0.98)] ${
                          active
                            ? isDivine
                              ? 'border-2 border-[#D4A017] text-[#F0C040] shadow-lg shadow-[#D4A017]/20'
                              : isHighlight
                              ? 'border-2 border-[#D4A017] text-[#F0C040] shadow-lg shadow-[#D4A017]/20'
                              : 'text-[#D4A017]'
                            : isDivine
                            ? 'border border-[rgba(212,160,23,0.4)] text-[rgba(212,160,23,0.8)] hover:border-[#D4A017] hover:text-[#F0C040]'
                            : isHighlight
                            ? 'border border-[rgba(212,160,23,0.4)] text-[rgba(212,160,23,0.8)] hover:border-[#D4A017] hover:text-[#F0C040]'
                            : 'text-[#B8AE98] hover:text-[#D4A017]'
                        }`}
                        style={{
                          fontSize: '13px',
                          fontWeight: 500,
                          letterSpacing: '0.02em',
                        }}
                      >
                        {link.label}
                        {isHighlight && !active && (
                          <span
                            className="ml-auto rounded-full px-2 py-0.5"
                            style={{
                              fontSize: '10px',
                              fontWeight: 600,
                              backgroundColor: 'rgba(212, 160, 23, 0.15)',
                              color: 'rgba(212, 160, 23, 0.9)',
                            }}
                          >
                            AI
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  )
                })}

                <motion.div
                  className="my-2"
                  style={{ borderTop: '1px solid rgba(212, 160, 23, 0.15)' }}
                  variants={animationVariants.slideUp}
                />

                <motion.div
                  className="flex min-h-[48px] items-center justify-between rounded-xl px-4 py-3"
                  style={{ backgroundColor: 'rgba(212, 160, 23, 0.05)' }}
                  variants={animationVariants.slideUp}
                >
                  <span className="font-ui" style={{ fontSize: '13px', fontWeight: 500, color: '#B8AE98', letterSpacing: '0.02em' }}>
                    {t('navigation.mainNav.theme', 'Theme')}
                  </span>
                  <ThemeToggle />
                </motion.div>

                <motion.div
                  className="flex min-h-[48px] items-center justify-between rounded-xl px-4 py-3"
                  style={{ backgroundColor: 'rgba(212, 160, 23, 0.05)' }}
                  variants={animationVariants.slideUp}
                >
                  <span className="font-ui" style={{ fontSize: '13px', fontWeight: 500, color: '#B8AE98', letterSpacing: '0.02em' }}>
                    {t('navigation.mainNav.language', 'Language')}
                  </span>
                  <LanguageSelector variant="sheet" />
                </motion.div>

              </motion.nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.header>
  )
}
