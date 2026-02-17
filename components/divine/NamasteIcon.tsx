'use client';

import { motion, useReducedMotion } from 'framer-motion';

interface NamasteIconProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  animated?: boolean;
  showGlow?: boolean;
}

/**
 * Sacred Divine Symbol — replaces the old emoji-based Namaste icon.
 *
 * A hand-crafted SVG: an eight-petalled golden lotus (Ashtadala Padma)
 * with a luminous divine core, seated within a sacred circle.
 * The lotus is the seat of Vishnu/Krishna — symbol of purity,
 * divine beauty, and spiritual awakening.
 *
 * Animations: gentle breathing glow only. No sparkles, no rotating
 * rings, no hover gimmicks.
 */
export function NamasteIcon({
  size = 'lg',
  className = '',
  animated = true,
  showGlow = true,
}: NamasteIconProps) {
  const reduceMotion = useReducedMotion();
  const motionEnabled = animated && !reduceMotion;

  const sizeMap = {
    sm: 48,
    md: 64,
    lg: 96,
    xl: 128,
  };

  const px = sizeMap[size];

  return (
    <motion.div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: px, height: px }}
      initial={motionEnabled ? { opacity: 0, scale: 0.9 } : undefined}
      animate={motionEnabled ? { opacity: 1, scale: 1 } : undefined}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      {/* Soft divine aura — only if showGlow */}
      {showGlow && (
        <motion.div
          className="absolute inset-[-20%] rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(212, 164, 76, 0.15) 0%, rgba(212, 164, 76, 0.05) 45%, transparent 70%)',
          }}
          aria-hidden
          animate={
            motionEnabled
              ? { scale: [0.92, 1.08, 0.92], opacity: [0.5, 0.8, 0.5] }
              : undefined
          }
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}

      {/* Sacred lotus SVG */}
      <motion.svg
        width={px}
        height={px}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Sacred divine lotus symbol"
        animate={
          motionEnabled
            ? { scale: [1, 1.03, 1] }
            : undefined
        }
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          {/* Divine gold gradient for petals */}
          <linearGradient id="lotus-gold" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#f0c96d" />
            <stop offset="50%" stopColor="#d4a44c" />
            <stop offset="100%" stopColor="#b8862d" />
          </linearGradient>

          {/* Lighter gold for inner petals */}
          <linearGradient id="lotus-inner" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#fde9a1" />
            <stop offset="50%" stopColor="#f0c96d" />
            <stop offset="100%" stopColor="#d4a44c" />
          </linearGradient>

          {/* Radiant divine core */}
          <radialGradient id="lotus-core" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fffef0" />
            <stop offset="40%" stopColor="#fde9a1" />
            <stop offset="80%" stopColor="#d4a44c" />
            <stop offset="100%" stopColor="#b8862d" />
          </radialGradient>

          {/* Soft glow filter */}
          <filter id="lotus-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Sacred outer circle */}
        <circle
          cx="60"
          cy="60"
          r="55"
          stroke="url(#lotus-gold)"
          strokeWidth="0.6"
          fill="none"
          opacity="0.25"
        />

        {/* Eight outer petals — Ashtadala Padma */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = i * 45;
          return (
            <g key={`outer-${i}`} transform={`rotate(${angle} 60 60)`}>
              <path
                d="M60 18 C64 26, 67 36, 66 44 C65 48, 63 50, 60 51 C57 50, 55 48, 54 44 C53 36, 56 26, 60 18Z"
                fill="url(#lotus-gold)"
                opacity="0.7"
              />
              {/* Petal vein */}
              <path
                d="M60 22 C60 30, 60 40, 60 48"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.4"
                fill="none"
              />
            </g>
          );
        })}

        {/* Five inner petals — smaller, brighter */}
        {Array.from({ length: 5 }).map((_, i) => {
          const angle = i * 72 + 18;
          return (
            <g key={`inner-${i}`} transform={`rotate(${angle} 60 60)`}>
              <path
                d="M60 32 C63 38, 64 44, 63 48 C62 50, 61 51, 60 51 C59 51, 58 50, 57 48 C56 44, 57 38, 60 32Z"
                fill="url(#lotus-inner)"
                opacity="0.85"
                filter="url(#lotus-glow)"
              />
            </g>
          );
        })}

        {/* Divine luminous core */}
        <motion.circle
          cx="60"
          cy="52"
          r="8"
          fill="url(#lotus-core)"
          filter="url(#lotus-glow)"
          animate={
            motionEnabled
              ? { opacity: [0.8, 1, 0.8], r: [7.5, 8.5, 7.5] as unknown as number[] }
              : undefined
          }
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Inner light point */}
        <circle cx="60" cy="51" r="3" fill="#fffef5" opacity="0.9" />
        <circle cx="59" cy="50" r="1.2" fill="#ffffff" opacity="0.95" />

        {/* Lotus seat curve at bottom */}
        <path
          d="M42 68 Q51 74, 60 72 Q69 74, 78 68"
          stroke="url(#lotus-gold)"
          strokeWidth="1"
          fill="none"
          opacity="0.35"
          strokeLinecap="round"
        />
        <path
          d="M46 72 Q53 77, 60 76 Q67 77, 74 72"
          stroke="url(#lotus-gold)"
          strokeWidth="0.7"
          fill="none"
          opacity="0.2"
          strokeLinecap="round"
        />
      </motion.svg>
    </motion.div>
  );
}

export default NamasteIcon;
