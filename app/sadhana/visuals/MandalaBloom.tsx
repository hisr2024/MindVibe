'use client'

/**
 * MandalaBloom — CSS + Canvas animated mandala that blooms from center.
 * Uses conic-gradient, radial-gradient, and gentle rotation.
 */

import { motion } from 'framer-motion'

interface MandalaBloomProps {
  isActive: boolean
  size?: number
}

export function MandalaBloom({ isActive, size = 300 }: MandalaBloomProps) {
  return (
    <motion.div
      className="relative"
      style={{ width: size, height: size }}
      initial={{ scale: 0, opacity: 0 }}
      animate={isActive ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
      transition={{ duration: 1.5, ease: 'easeOut' }}
    >
      {/* Outer ring — slow rotation */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `conic-gradient(
            from 0deg,
            rgba(212,164,76,0.08) 0deg,
            rgba(255,215,0,0.15) 30deg,
            rgba(212,164,76,0.05) 60deg,
            rgba(244,164,96,0.12) 90deg,
            rgba(212,164,76,0.08) 120deg,
            rgba(255,215,0,0.15) 150deg,
            rgba(212,164,76,0.05) 180deg,
            rgba(244,164,96,0.12) 210deg,
            rgba(212,164,76,0.08) 240deg,
            rgba(255,215,0,0.15) 270deg,
            rgba(212,164,76,0.05) 300deg,
            rgba(244,164,96,0.12) 330deg,
            rgba(212,164,76,0.08) 360deg
          )`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
      />

      {/* Middle ring — counter rotation */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: size * 0.12,
          background: `conic-gradient(
            from 45deg,
            rgba(255,215,0,0.05) 0deg,
            rgba(212,164,76,0.12) 45deg,
            rgba(255,215,0,0.05) 90deg,
            rgba(212,164,76,0.12) 135deg,
            rgba(255,215,0,0.05) 180deg,
            rgba(212,164,76,0.12) 225deg,
            rgba(255,215,0,0.05) 270deg,
            rgba(212,164,76,0.12) 315deg,
            rgba(255,215,0,0.05) 360deg
          )`,
        }}
        animate={{ rotate: -360 }}
        transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
      />

      {/* Inner glow */}
      <motion.div
        className="absolute rounded-full"
        style={{
          inset: size * 0.3,
          background: 'radial-gradient(circle, rgba(212,164,76,0.2) 0%, rgba(212,164,76,0.05) 60%, transparent 100%)',
        }}
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Center dot */}
      <div
        className="absolute rounded-full bg-[#d4a44c]/40"
        style={{
          width: size * 0.06,
          height: size * 0.06,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    </motion.div>
  )
}
