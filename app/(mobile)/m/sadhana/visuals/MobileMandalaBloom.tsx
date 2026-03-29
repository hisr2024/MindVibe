'use client'

/**
 * MobileMandalaBloom — Full-screen conic-gradient spinning mandala
 * for the completion seal phase. Uses CSS conic-gradient for the
 * sacred geometry pattern and Framer Motion for the entrance + rotation.
 */

import { motion } from 'framer-motion'

export function MobileMandalaBloom() {
  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[2]">
      {/* Spinning mandala */}
      <motion.div
        className="absolute"
        style={{
          width: '110vw',
          height: '110vw',
          background: `conic-gradient(
            from 0deg,
            #D4A017 0deg,
            #0E7490 45deg,
            #D4A017 90deg,
            #1B4FBB 135deg,
            #D4A017 180deg,
            #0E7490 225deg,
            #D4A017 270deg,
            #1B4FBB 315deg,
            #D4A017 360deg
          )`,
          borderRadius: '50%',
          opacity: 0.85,
          filter: 'blur(40px)',
        }}
        initial={{ scale: 0, rotate: 0 }}
        animate={{
          scale: 1,
          rotate: 360,
        }}
        transition={{
          scale: { type: 'spring', stiffness: 100, damping: 15, duration: 0.8 },
          rotate: { duration: 8, repeat: Infinity, ease: 'linear' },
        }}
      />

      {/* Center OM */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 15 }}
      >
        <motion.span
          className="text-7xl font-[family-name:var(--font-divine)] text-[#D4A017] select-none"
          style={{
            textShadow: '0 0 20px rgba(212,160,23,0.8), 0 0 40px rgba(212,160,23,0.4)',
          }}
          animate={{
            textShadow: [
              '0 0 20px rgba(212,160,23,0.8), 0 0 40px rgba(212,160,23,0.4)',
              '0 0 30px rgba(212,160,23,1), 0 0 60px rgba(212,160,23,0.6)',
              '0 0 20px rgba(212,160,23,0.8), 0 0 40px rgba(212,160,23,0.4)',
            ],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          ॐ
        </motion.span>
      </motion.div>
    </div>
  )
}
