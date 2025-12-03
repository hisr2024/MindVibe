'use client'

import { motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { gradientCss, brandColors } from './brandTokens'

interface KiaanLogoProps {
  size?: 'sm' | 'md' | 'lg'
  showTagline?: boolean
  animated?: boolean
  className?: string
}

const dimensions = {
  sm: { height: 56, feather: 36, text: 'text-xl', subtitle: 'text-[11px]' },
  md: { height: 72, feather: 46, text: 'text-3xl', subtitle: 'text-xs' },
  lg: { height: 96, feather: 56, text: 'text-4xl', subtitle: 'text-sm' },
}

export function KiaanLogo({ size = 'md', showTagline = true, animated = true, className = '' }: KiaanLogoProps) {
  const { height, feather, text, subtitle } = dimensions[size]
  const shouldReduceMotion = useReducedMotion()
  const isAnimated = animated && !shouldReduceMotion
  const [hovered, setHovered] = useState(false)

  const shimmerVariants = useMemo(
    () => ({
      initial: { x: '-100%' },
      animate: { x: ['-100%', '100%'] },
    }),
    [],
  )

  return (
    <motion.div
      className={`relative isolate flex items-center gap-3 ${className}`}
      style={{ minHeight: height }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label="KIAAN — MindVibe Companion"
    >
      <EnergyRipple animated={isAnimated} hovered={hovered} />
      <PeacockFeatherIcon size={feather} animated={isAnimated} hovered={hovered} />
      <div className="flex flex-col">
        <div className="flex items-baseline gap-3">
          <motion.span
            className={`font-extrabold tracking-[0.14em] ${text} bg-clip-text text-transparent`}
            style={{ backgroundImage: gradientCss.kiaanResonance, WebkitTextStroke: '0.6px rgba(14, 18, 36, 0.35)' }}
            initial={isAnimated ? { opacity: 0.8, y: 4 } : undefined}
            animate={isAnimated ? { opacity: 1, y: 0 } : undefined}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          >
            KIAAN
          </motion.span>
          <motion.span
            className="relative block h-[6px] w-20 overflow-hidden rounded-full"
            style={{ backgroundImage: gradientCss.mvGradientSunrise, boxShadow: '0 0 12px rgba(255,147,89,0.35)' }}
            role="presentation"
          >
            {isAnimated && (
              <motion.span
                className="absolute inset-y-0 w-1/3 bg-white/50 blur-[6px]"
                variants={shimmerVariants}
                initial="initial"
                animate="animate"
                transition={{ duration: 1.4, repeat: Infinity, ease: [0.32, 0, 0.18, 1], repeatDelay: 6.6 }}
              />
            )}
          </motion.span>
        </div>
        {showTagline && (
          <>
            <motion.span
              className={`${subtitle} font-semibold text-slate-100/85 tracking-[0.08em]`}
              initial={isAnimated ? { opacity: 0.75 } : undefined}
              animate={isAnimated ? { opacity: hovered ? 1 : [0.75, 0.92, 0.75] } : undefined}
              transition={
                isAnimated
                  ? { duration: hovered ? 0.3 : 2.4, repeat: hovered ? 0 : Infinity, ease: 'easeInOut' }
                  : undefined
              }
            >
              MindVibe Companion
            </motion.span>
            <motion.span
              className={`${subtitle} font-semibold text-slate-200/70 tracking-[0.12em]`}
              initial={isAnimated ? { opacity: 0.6, y: 2 } : undefined}
              animate={isAnimated ? { opacity: hovered ? 0.9 : [0.6, 0.85, 0.6], y: 0 } : undefined}
              transition={
                isAnimated
                  ? { duration: hovered ? 0.4 : 2.8, repeat: hovered ? 0 : Infinity, ease: 'easeInOut', delay: 0.4 }
                  : undefined
              }
            >
              KIAAN — Crisp, calm guidance.
            </motion.span>
          </>
        )}
      </div>
    </motion.div>
  )
}

export function KiaanLogoStatic(props: Omit<KiaanLogoProps, 'animated'>) {
  return <KiaanLogo {...props} animated={false} />
}

export function KiaanLogoAnimated(props: KiaanLogoProps) {
  return <KiaanLogo {...props} animated />
}

function EnergyRipple({ animated, hovered }: { animated: boolean; hovered: boolean }) {
  return (
    <div className="absolute -left-6 top-1/2 -translate-y-1/2" aria-hidden>
      <motion.div
        className="h-20 w-20 rounded-full"
        style={{ backgroundImage: 'radial-gradient(circle, rgba(106,215,255,0.32), rgba(37,99,235,0) 65%)' }}
        animate={
          animated
            ? {
                scale: hovered ? [1.05, 1.15, 1.05] : [0.95, 1.08, 0.95],
                opacity: hovered ? [0.4, 0.55, 0.4] : [0.32, 0.45, 0.32],
              }
            : undefined
        }
        transition={
          animated
            ? {
                duration: hovered ? 2.4 : 3.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }
            : undefined
        }
      />
    </div>
  )
}

function PeacockFeatherIcon({ size, animated, hovered }: { size: number; animated: boolean; hovered: boolean }) {
  return (
    <motion.svg
      width={size}
      height={size * 1.6}
      viewBox="0 0 40 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Peacock feather accent"
      initial={animated ? { opacity: 0.85, y: 6 } : undefined}
      animate={animated ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <defs>
        <linearGradient id="feather-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={brandColors.modes.innerPeacePrimary.value} />
          <stop offset="45%" stopColor={brandColors.core.mvOceanSky.value} />
          <stop offset="90%" stopColor={brandColors.core.mvAuroraLilac.value} />
        </linearGradient>
        <radialGradient id="feather-eye" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#ffd36f" />
          <stop offset="65%" stopColor="#ff9f52" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </radialGradient>
      </defs>
      <motion.path
        d="M20 60 C20 60, 18 45, 19 28 C20 10, 20 6, 20 4"
        stroke="url(#feather-gradient)"
        strokeWidth="2"
        strokeLinecap="round"
        animate={animated ? { pathLength: [1, 0.96, 1] } : undefined}
        transition={animated ? { duration: 3, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
      <motion.path
        d="M19 28 C15 25, 10 22, 6 20 C10 23, 15 26, 19 30"
        fill="url(#feather-gradient)"
        opacity={0.9}
        animate={animated ? { opacity: [0.7, 0.95, 0.7] } : undefined}
        transition={animated ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
      <motion.path
        d="M21 28 C25 25, 30 22, 34 20 C30 23, 25 26, 21 30"
        fill="url(#feather-gradient)"
        opacity={0.9}
        animate={animated ? { opacity: [0.7, 0.9, 0.7], transition: { delay: 0.18, duration: 2.6, repeat: Infinity } } : undefined}
      />
      <motion.ellipse
        cx="20"
        cy="16"
        rx="11"
        ry="8"
        fill="none"
        stroke="url(#feather-gradient)"
        strokeWidth="2.2"
        filter={hovered ? 'drop-shadow(0 0 12px rgba(106,215,255,0.45))' : undefined}
        animate={animated ? { ry: [8, 8.6, 8] } : undefined}
        transition={animated ? { duration: 2.4, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
      <ellipse cx="20" cy="16" rx="7" ry="5.5" stroke="#1e3a8a" strokeWidth="1.5" fill="none" opacity={0.9} />
      <motion.ellipse
        cx="20"
        cy="16"
        rx="4"
        ry="3.2"
        fill="url(#feather-eye)"
        animate={animated ? { scale: hovered ? [1.05, 1.12, 1.05] : [1, 1.06, 1] } : undefined}
        transition={animated ? { duration: hovered ? 1.4 : 2, repeat: Infinity, ease: 'easeInOut' } : undefined}
      />
    </motion.svg>
  )
}
