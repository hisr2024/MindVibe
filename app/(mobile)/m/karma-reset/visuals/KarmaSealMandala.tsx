'use client'

/**
 * KarmaSealMandala — 12-petal mandala for the completion ceremony.
 * Saffron + gold alternating petals with a spinning Dharma wheel center.
 * Saffron = karma's fire that purifies, Gold = wisdom that remains.
 */

import React from 'react'
import { motion } from 'framer-motion'

interface KarmaSealMandalaProps {
  size?: number
}

export function KarmaSealMandala({ size = 200 }: KarmaSealMandalaProps) {
  const petals = 12
  const outerRadius = size / 2
  const petalLength = outerRadius * 0.7
  const petalWidth = outerRadius * 0.22

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 120, damping: 18, duration: 0.6 }}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ position: 'absolute', inset: 0 }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="petal-gold" cx="50%" cy="100%" r="80%">
            <stop offset="0%" stopColor="#FDE68A" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#D4A017" stopOpacity="0.6" />
          </radialGradient>
          <radialGradient id="petal-saffron" cx="50%" cy="100%" r="80%">
            <stop offset="0%" stopColor="#FB923C" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#F97316" stopOpacity="0.6" />
          </radialGradient>
        </defs>
        <g transform={`translate(${outerRadius}, ${outerRadius})`}>
          {Array.from({ length: petals }).map((_, i) => {
            const angle = (360 / petals) * i
            const isGold = i % 2 === 0
            return (
              <motion.ellipse
                key={i}
                cx={0}
                cy={-petalLength / 2 - 8}
                rx={petalWidth / 2}
                ry={petalLength / 2}
                fill={isGold ? 'url(#petal-gold)' : 'url(#petal-saffron)'}
                transform={`rotate(${angle})`}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.05, duration: 0.4 }}
              />
            )
          })}
        </g>
      </svg>

      {/* Center Dharma wheel — slow rotation */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: size * 0.22,
          height: size * 0.22,
          borderRadius: '50%',
          border: '2px solid rgba(212,160,23,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontFamily: 'var(--font-divine, Cormorant Garamond, serif)',
            fontSize: size * 0.09,
            color: '#F0C040',
          }}
        >
          ॐ
        </span>
      </motion.div>
    </motion.div>
  )
}
