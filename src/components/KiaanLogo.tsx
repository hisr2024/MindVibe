'use client'

import { easeInOut, motion, useReducedMotion } from 'framer-motion'
import { useMemo, useState } from 'react'

export type KiaanLogoSize = 'sm' | 'md' | 'lg'

type LogoVariant = 'lockup' | 'icon'

interface KiaanLogoProps {
  size?: KiaanLogoSize
  showTagline?: boolean
  animated?: boolean
  className?: string
  variant?: LogoVariant
}

const dimensionMap: Record<KiaanLogoSize, { mark: number; title: string; subtitle: string }> = {
  sm: { mark: 64, title: 'text-xl', subtitle: 'text-[11px]' },
  md: { mark: 84, title: 'text-3xl', subtitle: 'text-xs' },
  lg: { mark: 104, title: 'text-4xl', subtitle: 'text-sm' },
}

const goldToSilver = 'linear-gradient(135deg, #d6a240 0%, #f5c56a 40%, #c0c7d4 100%)'

export function KiaanLogo({
  size = 'md',
  showTagline = true,
  animated = true,
  className = '',
  variant = 'lockup',
}: KiaanLogoProps) {
  const [hovered, setHovered] = useState(false)
  const reduceMotion = useReducedMotion()
  const motionEnabled = animated && !reduceMotion
  const { mark, title, subtitle } = dimensionMap[size]

  const shimmerVariants = useMemo(
    () => ({
      initial: { x: '-120%' },
      animate: { x: ['-120%', '120%'] },
    }),
    [],
  )

  const subtitleVisible = showTagline && variant !== 'icon'

  return (
    <motion.div
      className={`relative isolate flex items-center gap-3 sm:gap-4 ${className}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      initial={motionEnabled ? { opacity: 0, y: 6 } : undefined}
      animate={motionEnabled ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
      aria-label="KIAAN — Your Spiritual Companion logo"
    >
      <EnergyAura size={mark} animated={motionEnabled} hovered={hovered} />
      <LogoMark
        size={mark}
        animated={motionEnabled}
        hovered={hovered}
        shimmerVariants={shimmerVariants}
      />

      <div
        className={`${variant === 'icon' ? 'hidden sm:flex' : 'flex'} flex-col leading-tight text-left`}
      >
        <div
          className={`font-black tracking-[0.18em] ${title} bg-clip-text text-transparent`}
          style={{
            backgroundImage: goldToSilver,
            textShadow: '0 2px 18px rgba(244, 194, 106, 0.35)',
            WebkitTextStroke: '0.55px rgba(12, 16, 28, 0.35)',
          }}
        >
          KIAAN
        </div>
        {subtitleVisible && (
          <>
            <motion.span
              className={`${subtitle} font-semibold tracking-[0.12em] text-slate-100/90`}
              initial={motionEnabled ? { opacity: 0.75 } : undefined}
              animate={motionEnabled ? { opacity: hovered ? 1 : [0.75, 0.92, 0.75] } : undefined}
              transition={
                motionEnabled
                  ? { duration: hovered ? 0.3 : 2.8, repeat: hovered ? 0 : Infinity, ease: easeInOut }
                  : undefined
              }
            >
              Your Spiritual Companion
            </motion.span>
            <motion.span
              className={`${subtitle} font-semibold tracking-[0.16em] text-slate-200/80`}
              initial={motionEnabled ? { opacity: 0.6, y: 2 } : undefined}
              animate={motionEnabled ? { opacity: hovered ? 0.95 : [0.6, 0.86, 0.6], y: 0 } : undefined}
              transition={
                motionEnabled
                  ? { duration: hovered ? 0.4 : 3.6, repeat: hovered ? 0 : Infinity, ease: easeInOut, delay: 0.4 }
                  : undefined
              }
            >
              Your Guide to Inner Peace
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

function EnergyAura({ size, animated, hovered }: { size: number; animated: boolean; hovered: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute -left-5 top-1/2 -translate-y-1/2"
      style={{ width: size + 32, height: size + 32 }}
      aria-hidden
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(79,208,255,0.26), rgba(37, 99, 235, 0) 68%)',
          filter: 'blur(4px)',
        }}
        animate={
          animated
            ? {
                scale: hovered ? [1.02, 1.12, 1.02] : [0.94, 1.08, 0.94],
                opacity: hovered ? [0.6, 0.9, 0.6] : [0.45, 0.75, 0.45],
              }
            : undefined
        }
        transition={
          animated
            ? { duration: hovered ? 2.6 : 4, repeat: Infinity, ease: easeInOut }
            : undefined
        }
      />
    </motion.div>
  )
}

function LogoMark({
  size,
  animated,
  hovered,
  shimmerVariants,
}: {
  size: number
  animated: boolean
  hovered: boolean
  shimmerVariants: { initial: { x: string }; animate: { x: string[] } }
}) {
  const featherSway = animated
    ? {
        rotate: hovered ? [0, -2, 2, 0] : [-2.5, 2.5, -2.5],
      }
    : undefined

  const fluteShimmer = animated
    ? { duration: 1.4, repeat: Infinity, ease: easeInOut, repeatDelay: 3.6 }
    : undefined

  const glowBreathing = animated
    ? { opacity: [0.52, 0.92, 0.52], scale: [0.96, 1.06, 0.96] }
    : undefined

  return (
    <div
      className="relative flex items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/90 to-slate-900/70 p-3 shadow-[0_22px_80px_rgba(27,106,169,0.35)]"
      style={{ width: size + 12, height: size + 12 }}
    >
      <motion.div
        className="absolute inset-1 rounded-xl"
        style={{ background: 'radial-gradient(circle at 45% 35%, rgba(106,215,255,0.2), transparent 55%)' }}
        animate={glowBreathing}
        transition={animated ? { duration: 4, repeat: Infinity, ease: easeInOut } : undefined}
      />
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
        role="img"
        aria-label="KIAAN Your Spiritual Companion mark"
      >
        <defs>
          <linearGradient id="flute-body" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#d6a240" />
            <stop offset="40%" stopColor="#f5c56a" />
            <stop offset="100%" stopColor="#c0c7d4" />
          </linearGradient>
          <linearGradient id="k-arm" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#d0d7e2" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="feather-fill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#14c8c4" />
            <stop offset="40%" stopColor="#1ca3e0" />
            <stop offset="75%" stopColor="#7ad6ff" />
            <stop offset="100%" stopColor="#c7b8ff" />
          </linearGradient>
          <radialGradient id="feather-eye" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#ffe7a3" />
            <stop offset="55%" stopColor="#ffbf6b" />
            <stop offset="100%" stopColor="#1d3b8b" />
          </radialGradient>
        </defs>

        <motion.circle
          cx="60"
          cy="62"
          r="44"
          fill="url(#feather-fill)"
          opacity={0.08}
          animate={glowBreathing}
          transition={animated ? { duration: 4, repeat: Infinity, ease: easeInOut, delay: 0.3 } : undefined}
        />

        <motion.circle
          cx="60"
          cy="62"
          r="38"
          stroke="url(#feather-fill)"
          strokeWidth="1.8"
          opacity={0.28}
          animate={animated ? { scale: [0.98, 1.05, 0.98], opacity: [0.25, 0.5, 0.25] } : undefined}
          transition={animated ? { duration: 3.4, repeat: Infinity, ease: easeInOut } : undefined}
        />

        <motion.g animate={glowBreathing} transition={animated ? { duration: 4, repeat: Infinity, ease: easeInOut } : undefined}>
          <line x1="44" y1="28" x2="44" y2="94" stroke="url(#flute-body)" strokeWidth="9" strokeLinecap="round" />
          {[38, 54, 70].map(y => (
            <circle key={y} cx="44" cy={y} r="2" fill="#0b1020" opacity={0.8} />
          ))}
          {animated && (
            <motion.rect
              x="26"
              y="26"
              width="36"
              height="72"
              rx="10"
              fill="url(#flute-body)"
              opacity={0.24}
              variants={shimmerVariants}
              initial="initial"
              animate="animate"
              transition={fluteShimmer}
              style={{ mixBlendMode: 'screen' }}
            />
          )}
        </motion.g>

        <path d="M48 58 L78 32" stroke="url(#k-arm)" strokeWidth="9" strokeLinecap="round" />
        <path d="M48 66 L82 94" stroke="url(#k-arm)" strokeWidth="9" strokeLinecap="round" />

        <motion.g
          transform="translate(62 4)"
          animate={featherSway}
          transition={animated ? { duration: 2.8, repeat: Infinity, ease: easeInOut } : undefined}
          style={{ transformOrigin: '20px 32px' }}
        >
          <motion.path
            d="M16 62 C18 46 30 30 46 24 C54 21 60 28 58 38 C55 50 42 62 30 68 C24 71 18 70 14 66"
            fill="url(#feather-fill)"
            stroke="rgba(26,82,148,0.45)"
            strokeWidth="1.2"
            filter="drop-shadow(0 6px 16px rgba(30, 90, 146, 0.35))"
          />
          <motion.path
            d="M28 26 C30 34 26 46 20 56"
            stroke="rgba(255,255,255,0.9)"
            strokeWidth="1.4"
            strokeLinecap="round"
            strokeOpacity={0.85}
          />
          <motion.ellipse
            cx="38"
            cy="26"
            rx="10"
            ry="7"
            fill="url(#feather-eye)"
            opacity={0.92}
            animate={animated ? { scale: hovered ? [1.02, 1.08, 1.02] : [1, 1.05, 1] } : undefined}
            transition={animated ? { duration: hovered ? 1.4 : 2.2, repeat: Infinity, ease: easeInOut } : undefined}
          />
          <motion.circle
            cx="38"
            cy="26"
            r="13"
            stroke="rgba(255,255,255,0.65)"
            strokeWidth="1"
            opacity={0.55}
            animate={animated ? { scale: [0.96, 1.08, 0.96], opacity: [0.4, 0.8, 0.4] } : undefined}
            transition={animated ? { duration: 3.2, repeat: Infinity, ease: easeInOut } : undefined}
          />
        </motion.g>
      </motion.svg>
    </div>
  )
}
