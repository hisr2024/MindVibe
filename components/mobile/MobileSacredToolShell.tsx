'use client'

/**
 * MobileSacredToolShell — Mobile-optimized sacred tool wrapper
 *
 * A mobile-native version of SacredPageShell that provides:
 * - Compact sacred header with Sanskrit symbol (pulsing golden glow)
 * - Floating golden god particles (8 particles for mobile perf)
 * - Single-column layout optimized for touch
 * - Sacred gradient background matching the Gold-Black divine theme
 * - Collapsible cards with haptic feedback for sidebar content
 *
 * Used by: Viyoga, Ardha, Relationship Compass mobile pages
 */

import { type ReactNode, useState } from 'react'
import { motion } from 'framer-motion'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { springConfigs, staggerContainer, animationVariants } from '@/lib/animations/spring-configs'

interface MobileSacredToolShellProps {
  title: string
  sanskrit: string
  subtitle: string
  verse: { english: string; reference: string }
  children: ReactNode
}

const GOLDEN_PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${8 + (i * 12) % 84}%`,
  delay: i * 0.8,
  duration: 6 + (i % 3) * 1.5,
  size: i % 3 === 0 ? 2.5 : 1.5,
}))

export function MobileSacredToolShell({
  title,
  sanskrit,
  subtitle,
  verse,
  children,
}: MobileSacredToolShellProps) {
  return (
    <div className="relative min-h-0">
      {/* Floating golden god particles — reduced to 8 for mobile perf */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      >
        {GOLDEN_PARTICLES.map((p) => (
          <motion.div
            key={p.id}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: p.left,
              bottom: 0,
              background:
                'radial-gradient(circle, rgba(212,164,76,0.9) 0%, rgba(212,164,76,0) 70%)',
              boxShadow:
                p.size > 2 ? '0 0 6px rgba(212,164,76,0.3)' : 'none',
            }}
            animate={{
              y: [0, -350],
              opacity: [0, 0.6, 0.4, 0],
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

      <div className="relative space-y-4 px-4 pt-2 pb-6" style={{ zIndex: 2 }}>
        {/* Sacred Header — compact for mobile */}
        <motion.header
          className="relative overflow-hidden rounded-[22px] border border-[#d4a44c]/12 bg-gradient-to-br from-[#0d0a06]/95 via-[#080706] to-[#0a0806]/90 p-4"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springConfigs.gentle}
          style={{
            boxShadow:
              '0 12px 48px rgba(212, 164, 76, 0.06), inset 0 1px 0 rgba(212, 164, 76, 0.08)',
          }}
        >
          {/* Top golden radiance line */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#d4a44c]/40 to-transparent" />

          <div className="flex items-start gap-3">
            {/* Sanskrit symbol with pulsing golden glow */}
            <motion.div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-[#d4a44c]/15"
              style={{
                background:
                  'linear-gradient(135deg, rgba(212, 164, 76, 0.12) 0%, rgba(232, 181, 74, 0.06) 100%)',
              }}
              animate={{
                boxShadow: [
                  '0 0 12px rgba(212, 164, 76, 0.1)',
                  '0 0 24px rgba(212, 164, 76, 0.2)',
                  '0 0 12px rgba(212, 164, 76, 0.1)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="text-lg font-sacred text-[#e8b54a]/80 select-none">
                {sanskrit}
              </span>
            </motion.div>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold bg-gradient-to-r from-[#e8b54a] via-[#d4a44c] to-[#f5e6c8] bg-clip-text text-transparent">
                {title}
              </h1>
              <p className="text-xs text-[#d4a44c]/45 font-sacred italic mt-0.5">
                {subtitle}
              </p>
            </div>
          </div>

          {/* Anchor verse — compact */}
          <div className="mt-3 p-3 rounded-lg bg-[#d4a44c]/[0.04] border border-[#d4a44c]/8">
            <p className="font-sacred text-xs text-[#f5e6c8]/50 italic leading-relaxed">
              &ldquo;{verse.english}&rdquo;
            </p>
            <p className="text-[9px] text-[#d4a44c]/25 mt-1.5 tracking-wide font-mono">
              {verse.reference}
            </p>
          </div>

          {/* Bottom golden radiance line */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#d4a44c]/20 to-transparent" />
        </motion.header>

        {/* Content — staggered entrance */}
        <motion.div
          className="space-y-4"
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
        >
          {children}
        </motion.div>
      </div>
    </div>
  )
}

/**
 * MobileSacredSection — animated child wrapper for stagger effect
 */
export function MobileSacredSection({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={className}
      variants={animationVariants.slideUp}
      transition={springConfigs.smooth}
    >
      {children}
    </motion.div>
  )
}

/**
 * MobileCollapsibleCard — expandable card for sidebar content on mobile
 */
export function MobileCollapsibleCard({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string
  icon?: ReactNode
  children: ReactNode
  defaultOpen?: boolean
}) {
  const { triggerHaptic } = useHapticFeedback()
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <motion.div
      className="rounded-[18px] border border-[#d4a44c]/10 bg-[#0d0a06]/80 overflow-hidden"
      style={{ boxShadow: '0 4px 24px rgba(212, 164, 76, 0.03)' }}
      variants={animationVariants.slideUp}
      transition={springConfigs.smooth}
    >
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => {
          triggerHaptic('selection')
          setIsOpen(!isOpen)
        }}
        className="w-full flex items-center gap-2 p-4 text-left min-h-[48px]"
        aria-expanded={isOpen}
      >
        {icon && (
          <span className="text-[#d4a44c]/60 shrink-0">{icon}</span>
        )}
        <span className="text-xs font-semibold text-[#f5e6c8]/70 flex-1">
          {title}
        </span>
        <motion.span
          className="text-[#d4a44c]/30 text-xs shrink-0"
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▼
        </motion.span>
      </motion.button>

      <motion.div
        initial={false}
        animate={{
          height: isOpen ? 'auto' : 0,
          opacity: isOpen ? 1 : 0,
        }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="overflow-hidden"
      >
        <div className="px-4 pb-4">
          {children}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default MobileSacredToolShell
