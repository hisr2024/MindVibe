'use client'

/**
 * Mobile Welcome Page — The Sankalpa Sealed
 *
 * Post-payment success screen with staggered sacred animations.
 * Celebrates the user's commitment with OM, verse, and unlocked features.
 */

import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

const SacredParticleCanvas = () => null

const FEATURES = [
  { icon: '🐚', label: 'KIAAN Voice Companion' },
  { icon: '⚔️', label: 'All 6 Shadripu Journeys' },
  { icon: '🕯', label: 'Nitya Sadhana Daily Practice' },
  { icon: '📖', label: 'Sacred Encrypted Journal' },
]

export default function WelcomePage() {
  const router = useRouter()

  return (
    <div className="min-h-screen bg-[#050714] px-6 pb-10 flex flex-col items-center justify-center relative overflow-hidden">
      <SacredParticleCanvas />

      {/* OM Symbol */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, duration: 0.8, ease: 'easeOut' }}
        className="w-24 h-24 rounded-full flex items-center justify-center mb-8"
        style={{
          background: 'radial-gradient(circle, rgba(212,160,23,0.25) 0%, rgba(212,160,23,0.05) 70%)',
          border: '1px solid rgba(212,160,23,0.4)',
          boxShadow: '0 0 60px rgba(212,160,23,0.3)',
        }}
      >
        <span
          className="text-5xl"
          style={{
            color: '#F0C040',
            fontFamily: 'Noto Sans Devanagari, serif',
            textShadow: '0 0 20px rgba(240,192,64,0.6)',
            lineHeight: 2.0,
          }}
        >
          ॐ
        </span>
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.7 }}
        className="text-3xl text-center mb-3"
        style={{
          fontFamily: 'Cormorant Garamond, serif',
          color: '#F0C040',
          fontWeight: 500,
        }}
      >
        Your Path is Open
      </motion.h1>

      {/* Verse */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.3, duration: 0.7 }}
        className="text-center mb-10 max-w-sm"
      >
        <p
          className="italic text-base text-[#D4A017]/90 leading-relaxed"
          style={{ fontFamily: 'Crimson Text, serif' }}
        >
          &ldquo;Even a little of this dharma saves one from great fear.&rdquo;
        </p>
        <p className="text-xs text-white/40 mt-2" style={{ fontFamily: 'Outfit, sans-serif' }}>
          — Bhagavad Gita 2.40
        </p>
      </motion.div>

      {/* Features */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.7, duration: 0.7 }}
        className="w-full max-w-sm space-y-3 mb-10"
      >
        {FEATURES.map((f, i) => (
          <div
            key={i}
            className="flex items-center gap-3 p-3 rounded-xl"
            style={{
              background: 'rgba(22,26,66,0.5)',
              border: '1px solid rgba(212,160,23,0.15)',
            }}
          >
            <span className="text-2xl">{f.icon}</span>
            <span
              className="text-sm text-white/85"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              {f.label}
            </span>
            <svg
              className="ml-auto"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        ))}
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.1, duration: 0.7 }}
        type="button"
        onClick={() => router.push('/m')}
        className="w-full max-w-sm py-4 rounded-full text-base font-medium"
        style={{
          background: 'linear-gradient(135deg, #D4A017 0%, #F0C040 100%)',
          color: '#050714',
          fontFamily: 'Outfit, sans-serif',
          boxShadow: '0 8px 32px rgba(212,160,23,0.4)',
        }}
      >
        Enter the Sanctuary →
      </motion.button>
    </div>
  )
}
