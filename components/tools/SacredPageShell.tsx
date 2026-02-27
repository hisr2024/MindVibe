'use client'

import { type ReactNode } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'

/**
 * SacredPageShell — Gold-Black divine atmosphere wrapper for spiritual tool pages.
 *
 * Provides:
 * - Deep black divine background with cosmic gradient
 * - Floating golden god particles ascending from below
 * - Sacred header with Sanskrit symbol, pulsing golden glow, and anchor verse
 * - Back-to-sanctuary link
 * - Responsive two-column layout slots
 * - Top and bottom golden radiance lines
 *
 * All three sacred instruments (Viyoga, Ardha, Relationship Compass) share this shell
 * to maintain visual unity within the Gold-Black divine theme.
 */

interface SacredPageShellProps {
  /** Tool title (English) */
  title: string
  /** Sanskrit name in Devanagari */
  sanskrit: string
  /** Short sacred subtitle */
  subtitle: string
  /** Mode label for the tool */
  modeLabel?: string
  /** Anchor verse from Bhagavad Gita */
  verse: { english: string; reference: string }
  /** Left column content (input + response) */
  leftContent: ReactNode
  /** Right column content (insights + navigation) */
  rightContent: ReactNode
}

// Golden god particles for the sacred atmosphere
const GOLDEN_PARTICLES = Array.from({ length: 14 }, (_, i) => ({
  id: i,
  left: `${5 + (i * 7) % 90}%`,
  delay: i * 0.65,
  duration: 5 + (i % 4) * 1.3,
  size: i % 3 === 0 ? 2.5 : 1.5,
}))

export function SacredPageShell({
  title,
  sanskrit,
  subtitle,
  modeLabel,
  verse,
  leftContent,
  rightContent,
}: SacredPageShellProps) {
  return (
    <main className="relative min-h-screen bg-gradient-to-b from-[#030305] via-[#050507] to-[#080608] text-white">
      {/* Floating golden god particles — divine atmosphere */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 1 }} aria-hidden="true">
        {GOLDEN_PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: p.left,
              bottom: 0,
              background: 'radial-gradient(circle, rgba(212,164,76,0.9) 0%, rgba(212,164,76,0) 70%)',
              boxShadow: p.size > 2 ? '0 0 6px rgba(212,164,76,0.3)' : 'none',
            }}
            animate={{
              y: [0, -400],
              opacity: [0, 0.7, 0.5, 0],
              scale: [0.3, 1, 0.7, 0.1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeOut',
            }}
          />
        ))}
      </div>

      <div className="relative max-w-4xl mx-auto px-4 py-6 md:py-10 space-y-8" style={{ zIndex: 2 }}>

        {/* Sacred Header */}
        <motion.header
          className="relative overflow-hidden rounded-[28px] border border-[#d4a44c]/12 bg-gradient-to-br from-[#0d0a06]/95 via-[#080706] to-[#0a0806]/90 p-6 sm:p-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          style={{
            boxShadow: '0 16px 64px rgba(212, 164, 76, 0.06), inset 0 1px 0 rgba(212, 164, 76, 0.08)',
          }}
        >
          {/* Top golden radiance */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a44c]/40 to-transparent" />

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 text-[11px] text-[#d4a44c]/40 hover:text-[#d4a44c]/70 transition-colors mb-5"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
            </svg>
            Return to sanctuary
          </Link>

          <div className="flex items-start gap-4 sm:gap-5">
            {/* Sacred Sanskrit Symbol with golden glow */}
            <motion.div
              className="flex h-14 w-14 sm:h-16 sm:w-16 flex-shrink-0 items-center justify-center rounded-2xl border border-[#d4a44c]/15"
              style={{
                background: 'linear-gradient(135deg, rgba(212, 164, 76, 0.12) 0%, rgba(232, 181, 74, 0.06) 100%)',
              }}
              animate={{
                boxShadow: [
                  '0 0 15px rgba(212, 164, 76, 0.1)',
                  '0 0 30px rgba(212, 164, 76, 0.2)',
                  '0 0 15px rgba(212, 164, 76, 0.1)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-xl sm:text-2xl font-sacred text-[#e8b54a]/80 select-none">
                {sanskrit}
              </span>
            </motion.div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#e8b54a] via-[#d4a44c] to-[#f5e6c8] bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-sm text-[#d4a44c]/45 font-sacred italic mt-1">
                {subtitle}
              </p>
              {modeLabel && (
                <p className="mt-1.5 text-[11px] tracking-wide text-[#d4a44c]/25">
                  {modeLabel}
                </p>
              )}
            </div>
          </div>

          {/* Anchor verse */}
          <div className="mt-5 p-4 rounded-xl bg-[#d4a44c]/[0.04] border border-[#d4a44c]/8">
            <p className="font-sacred text-sm text-[#f5e6c8]/50 italic leading-relaxed">
              &ldquo;{verse.english}&rdquo;
            </p>
            <p className="text-[10px] text-[#d4a44c]/25 mt-2 tracking-wide font-mono">
              {verse.reference}
            </p>
          </div>

          {/* Bottom golden radiance */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d4a44c]/20 to-transparent" />
        </motion.header>

        {/* Main Content — Two Column Layout */}
        <div className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          {/* Left Column */}
          <motion.section
            className="space-y-5"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.15 }}
          >
            {leftContent}
          </motion.section>

          {/* Right Column */}
          <motion.section
            className="space-y-4"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.25 }}
          >
            {rightContent}
          </motion.section>
        </div>
      </div>
    </main>
  )
}

export default SacredPageShell
