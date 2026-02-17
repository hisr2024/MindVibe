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
                d="M60 12 C66 22, 71 34, 69 44 C67 50, 64 56, 60 60 C56 56, 53 50, 51 44 C49 34, 54 22, 60 12Z"
                fill="url(#lotus-gold)"
                opacity="0.7"
              />
              {/* Petal vein */}
              <path
                d="M60 16 C60 28, 60 42, 60 56"
                stroke="rgba(255,255,255,0.15)"
                strokeWidth="0.4"
                fill="none"
              />
            </g>
          );
        })}

        {/* Eight inner petals — between outer petals, brighter */}
        {Array.from({ length: 8 }).map((_, i) => {
          const angle = i * 45 + 22.5;
          return (
            <g key={`inner-${i}`} transform={`rotate(${angle} 60 60)`}>
              <path
                d="M60 28 C64 35, 67 43, 66 49 C65 53, 63 57, 60 60 C57 57, 55 53, 54 49 C53 43, 56 35, 60 28Z"
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
          cy="60"
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
        <circle cx="60" cy="60" r="3" fill="#fffef5" opacity="0.9" />
        <circle cx="59" cy="59" r="1.2" fill="#ffffff" opacity="0.95" />
      </motion.svg>
    </motion.div>
  );
}

export default NamasteIcon;
