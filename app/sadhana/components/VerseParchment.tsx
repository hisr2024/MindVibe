'use client'

/**
 * VerseParchment — Decorative parchment-style card for displaying Gita verses.
 * Golden corner ornaments, warm inner glow, slots for Sanskrit/transliteration/English.
 */

import { motion } from 'framer-motion'

interface VerseParchmentProps {
  children: React.ReactNode
  className?: string
}

export function VerseParchment({ children, className = '' }: VerseParchmentProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className={`relative max-w-2xl w-full mx-auto ${className}`}
    >
      {/* Outer glow */}
      <div
        className="absolute -inset-4 rounded-3xl pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(212,164,76,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Main parchment */}
      <div className="relative rounded-2xl overflow-hidden border border-[#d4a44c]/15 backdrop-blur-md">
        {/* Parchment background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(145deg, rgba(26,21,16,0.95) 0%, rgba(15,13,8,0.95) 50%, rgba(20,16,10,0.95) 100%)',
          }}
        />

        {/* Inner glow border */}
        <div
          className="absolute inset-px rounded-2xl pointer-events-none"
          style={{
            background: 'linear-gradient(145deg, rgba(212,164,76,0.08) 0%, transparent 30%, transparent 70%, rgba(212,164,76,0.05) 100%)',
          }}
        />

        {/* Corner ornaments */}
        <CornerOrnament position="top-left" />
        <CornerOrnament position="top-right" />
        <CornerOrnament position="bottom-left" />
        <CornerOrnament position="bottom-right" />

        {/* Content */}
        <div className="relative p-6 md:p-8">
          {children}
        </div>
      </div>
    </motion.div>
  )
}

function CornerOrnament({ position }: { position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' }) {
  const transforms: Record<string, string> = {
    'top-left': '',
    'top-right': 'scaleX(-1)',
    'bottom-left': 'scaleY(-1)',
    'bottom-right': 'scale(-1)',
  }

  const positions: Record<string, string> = {
    'top-left': 'top-2 left-2',
    'top-right': 'top-2 right-2',
    'bottom-left': 'bottom-2 left-2',
    'bottom-right': 'bottom-2 right-2',
  }

  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className={`absolute ${positions[position]} pointer-events-none`}
      style={{ transform: transforms[position] }}
    >
      <path
        d="M2 22V12C2 6.477 6.477 2 12 2h10"
        stroke="rgba(212,164,76,0.3)"
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M2 22V16C2 10.477 6.477 6 12 6h6"
        stroke="rgba(212,164,76,0.15)"
        strokeWidth="0.5"
        strokeLinecap="round"
      />
      <circle cx="2" cy="22" r="1.5" fill="rgba(212,164,76,0.25)" />
    </svg>
  )
}
