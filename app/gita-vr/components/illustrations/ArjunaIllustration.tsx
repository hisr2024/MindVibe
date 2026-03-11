/**
 * ArjunaIllustration — Disney-level animated Arjuna
 *
 * Richly detailed SVG warrior-prince in Kshatriya armor:
 * - Ornate Kirita crown with sapphire centerpiece
 * - Kavach (chest armor) with intricate detailing
 * - Gandiva bow held at his side
 * - Warrior dhoti with royal blue/maroon
 *
 * State-driven animation via Framer Motion:
 * - distressed: slumped posture, head bowed (Chapter 1 despair)
 * - listening: upright, gazing at Krishna with reverence
 * - enlightened: radiant glow, confident stance
 * - idle: gentle breathing
 */

'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function ArjunaIllustration() {
  const arjunaState = useGitaVRStore((s) => s.arjunaState)
  const reduceMotion = useReducedMotion()

  const bodyVariants = useMemo(() => ({
    idle: { y: [0, -2, 0], transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' as const } },
    distressed: { y: [8, 6, 8], rotate: [2, 3, 2], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const } },
    listening: { y: [0, -3, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const } },
    enlightened: { y: [0, -4, 0], transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const } },
  }), [])

  const headVariants = useMemo(() => ({
    idle: { rotate: 0, y: 0 },
    distressed: { rotate: [12, 14, 12], y: [6, 8, 6], transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const } },
    listening: { rotate: [-5, -7, -5], y: [-2, -3, -2], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const } },
    enlightened: { rotate: 0, y: -3, transition: { type: 'spring' as const, stiffness: 40, damping: 15 } },
  }), [])

  const glowFilter = useMemo(() => {
    if (arjunaState === 'enlightened') return 'drop-shadow(0 0 40px rgba(255,215,0,0.3)) drop-shadow(0 0 80px rgba(75,0,200,0.1))'
    if (arjunaState === 'distressed') return 'drop-shadow(0 0 10px rgba(100,100,120,0.1))'
    return 'drop-shadow(0 0 20px rgba(112,128,144,0.15))'
  }, [arjunaState])

  if (reduceMotion) {
    return <div className="relative h-[440px] w-[220px]" aria-label="Arjuna" />
  }

  return (
    <div className="relative h-[440px] w-[220px]" aria-label="Arjuna">
      <motion.div
        className="h-full w-full"
        animate={{ filter: glowFilter }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 320 650" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="a-skin" x1="0.3" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor="#D4965A" />
              <stop offset="100%" stopColor="#A0622D" />
            </linearGradient>
            <linearGradient id="a-armor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8899AA" />
              <stop offset="30%" stopColor="#6B7D8D" />
              <stop offset="100%" stopColor="#4A5B6A" />
            </linearGradient>
            <linearGradient id="a-armor-highlight" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#AABBCC" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#6B7D8D" stopOpacity="0" />
            </linearGradient>
            <linearGradient id="a-dhoti" x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#8B3A3A" />
              <stop offset="100%" stopColor="#5C1F1F" />
            </linearGradient>
            <filter id="a-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="a-shadow">
              <feDropShadow dx="2" dy="3" stdDeviation="2" floodColor="#1a1a2e" floodOpacity="0.25" />
            </filter>
          </defs>

          <motion.g
            variants={bodyVariants}
            animate={arjunaState}
            style={{ originX: '160px', originY: '580px' }}
          >
            {/* === DHOTI (warrior lower garment) === */}
            <motion.g
              animate={arjunaState === 'distressed'
                ? { skewX: [0, 0.3, 0], transition: { duration: 7, repeat: Infinity } }
                : { skewX: [0, 0.6, -0.4, 0], transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' } }
              }
              style={{ originX: '160px', originY: '365px' }}
            >
              <path
                d="M130,365 Q122,410 118,470 Q115,520 108,570 L160,590 L212,570 Q205,520 202,470 Q198,410 190,365 Z"
                fill="url(#a-dhoti)" filter="url(#a-shadow)"
              />
              {/* Fold lines */}
              <path d="M145,375 Q143,430 138,500" fill="none" stroke="#3D1515" strokeWidth="0.8" opacity="0.25" />
              <path d="M172,375 Q174,430 178,500" fill="none" stroke="#3D1515" strokeWidth="0.8" opacity="0.25" />
              {/* Gold border */}
              <path d="M108,570 L160,590 L212,570" fill="none" stroke="#DAA520" strokeWidth="2.5" opacity="0.5" />
            </motion.g>

            {/* Feet */}
            <ellipse cx="138" cy="592" rx="16" ry="6" fill="url(#a-skin)" />
            <ellipse cx="182" cy="592" rx="16" ry="6" fill="url(#a-skin)" />
            {/* Warrior sandals */}
            <path d="M122,592 Q138,598 154,592" fill="none" stroke="#654321" strokeWidth="1.5" />
            <path d="M166,592 Q182,598 198,592" fill="none" stroke="#654321" strokeWidth="1.5" />

            {/* === ARMOR / TORSO (Kavach) === */}
            <path
              d="M132,215 Q126,240 128,290 Q130,330 130,365 L190,365 Q190,330 192,290 Q194,240 188,215 Z"
              fill="url(#a-armor)" filter="url(#a-shadow)"
            />
            {/* Armor highlights */}
            <path d="M140,220 Q138,280 140,360" fill="none" stroke="url(#a-armor-highlight)" strokeWidth="2" />
            <path d="M178,220 Q180,280 178,360" fill="none" stroke="url(#a-armor-highlight)" strokeWidth="2" />
            {/* Center plate line */}
            <line x1="160" y1="220" x2="160" y2="350" stroke="#AABBCC" strokeWidth="1" opacity="0.2" />
            {/* Armor rivets */}
            {[140, 150, 160, 170, 180].map((x, i) => (
              <circle key={`rivet-${i}`} cx={x} cy="230" r="1.5" fill="#AABBCC" opacity="0.4" />
            ))}

            {/* Shoulder guards (pauldrons) */}
            <ellipse cx="128" cy="218" rx="18" ry="10" fill="url(#a-armor)" stroke="#5A6B7A" strokeWidth="0.5" />
            <ellipse cx="192" cy="218" rx="18" ry="10" fill="url(#a-armor)" stroke="#5A6B7A" strokeWidth="0.5" />
            {/* Shoulder guard detail */}
            <path d="M115,218 Q128,210 141,218" fill="none" stroke="#AABBCC" strokeWidth="0.5" opacity="0.3" />
            <path d="M179,218 Q192,210 205,218" fill="none" stroke="#AABBCC" strokeWidth="0.5" opacity="0.3" />

            {/* === LEFT ARM === */}
            <path
              d="M132,220 Q115,245 105,275 Q100,295 102,310"
              fill="none" stroke="url(#a-skin)" strokeWidth="18" strokeLinecap="round"
            />
            <ellipse cx="102" cy="314" rx="8" ry="7" fill="#C68642" />
            {/* Arm guard */}
            <ellipse cx="115" cy="255" rx="11" ry="4" fill="url(#a-armor)" stroke="#5A6B7A" strokeWidth="0.5" />

            {/* === RIGHT ARM (holds Gandiva) === */}
            <path
              d="M188,220 Q205,245 212,275 Q215,295 214,310"
              fill="none" stroke="url(#a-skin)" strokeWidth="18" strokeLinecap="round"
            />
            <ellipse cx="214" cy="314" rx="8" ry="7" fill="#C68642" />
            {/* Arm guard */}
            <ellipse cx="202" cy="255" rx="11" ry="4" fill="url(#a-armor)" stroke="#5A6B7A" strokeWidth="0.5" />

            {/* === GANDIVA BOW === */}
            <g>
              {/* Bow limbs — elegant curve */}
              <path
                d="M222,230 Q248,300 240,380 Q235,420 222,450"
                fill="none" stroke="#6B3A1F" strokeWidth="4" strokeLinecap="round"
              />
              {/* Bow grip */}
              <rect x="218" y="330" width="8" height="25" rx="4" fill="#8B4513" />
              {/* Bowstring */}
              <line x1="222" y1="230" x2="222" y2="450" stroke="#C0C0C0" strokeWidth="1" opacity="0.6" />
              {/* Golden tips */}
              <circle cx="222" cy="228" r="3" fill="#DAA520" />
              <circle cx="222" cy="452" r="3" fill="#DAA520" />
            </g>

            {/* === HEAD GROUP === */}
            <motion.g
              variants={headVariants}
              animate={arjunaState}
              style={{ originX: '160px', originY: '190px' }}
            >
              {/* Neck */}
              <rect x="150" y="195" width="20" height="22" rx="10" fill="url(#a-skin)" />

              {/* Face */}
              <ellipse cx="160" cy="168" rx="28" ry="33" fill="url(#a-skin)" />
              {/* Jawline */}
              <path d="M134,168 Q136,190 160,200 Q184,190 186,168" fill="none" stroke="#A0622D" strokeWidth="0.8" opacity="0.3" />

              {/* Hair — warrior tied back */}
              <path
                d="M132,162 Q132,132 160,124 Q188,132 188,162 Q185,148 175,138 Q165,132 160,130 Q155,132 145,138 Q135,148 132,162"
                fill="#1a1010"
              />
              {/* Hair bun */}
              <ellipse cx="168" cy="128" rx="10" ry="8" fill="#1a1010" />
              {/* Hair ribbon */}
              <path d="M170,122 Q180,115 175,108" fill="none" stroke="#8B3A3A" strokeWidth="2" />

              {/* Eyes */}
              <g>
                <ellipse cx="150" cy="166" rx="7" ry="4.5" fill="#FFFFF0" />
                <ellipse cx="170" cy="166" rx="7" ry="4.5" fill="#FFFFF0" />
                <motion.g
                  animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
                  transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', times: [0, 0.48, 0.5, 0.52, 1] }}
                  style={{ originX: '160px', originY: '166px' }}
                >
                  <circle cx="151" cy="166" r="3.5" fill="#2D1500" />
                  <circle cx="171" cy="166" r="3.5" fill="#2D1500" />
                  <circle cx="152" cy="165" r="1.2" fill="white" opacity="0.8" />
                  <circle cx="172" cy="165" r="1.2" fill="white" opacity="0.8" />
                </motion.g>
                {/* Eye outline */}
                <path d="M142,166 Q146,161 155,161 Q158,162 158,166 Q158,171 155,172 Q146,172 142,166" fill="none" stroke="#1a1010" strokeWidth="1" />
                <path d="M162,166 Q166,161 175,161 Q178,162 178,166 Q178,171 175,172 Q166,172 162,166" fill="none" stroke="#1a1010" strokeWidth="1" />
              </g>

              {/* Eyebrows — strong warrior brows */}
              <path d="M140,158 Q150,153 159,158" fill="none" stroke="#1a1010" strokeWidth="2" strokeLinecap="round" />
              <path d="M161,158 Q170,153 180,158" fill="none" stroke="#1a1010" strokeWidth="2" strokeLinecap="round" />

              {/* Nose */}
              <path d="M160,168 Q158,175 160,180" fill="none" stroke="#8B5A30" strokeWidth="0.8" opacity="0.5" />

              {/* Expression — changes with state */}
              {arjunaState === 'distressed' ? (
                <path d="M150,185 Q155,183 160,183 Q165,183 170,185" fill="none" stroke="#654321" strokeWidth="1.2" strokeLinecap="round" />
              ) : arjunaState === 'enlightened' ? (
                <path d="M150,184 Q155,189 160,190 Q165,189 170,184" fill="none" stroke="#654321" strokeWidth="1.2" strokeLinecap="round" />
              ) : (
                <path d="M151,185 Q156,187 160,187 Q164,187 169,185" fill="none" stroke="#654321" strokeWidth="1" strokeLinecap="round" />
              )}

              {/* Warrior crown (Kirita) */}
              <path d="M135,148 L160,132 L185,148" fill="none" stroke="#DAA520" strokeWidth="3" />
              <path d="M137,152 Q160,142 183,152" fill="url(#a-armor)" stroke="#DAA520" strokeWidth="1.5" />
              {/* Crown sapphire */}
              <motion.circle
                cx="160" cy="143" r="4"
                fill="#4169E1" filter="url(#a-glow)"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <circle cx="159" cy="142" r="1.5" fill="white" opacity="0.4" />
            </motion.g>
          </motion.g>

          {/* Enlightened glow overlay */}
          {arjunaState === 'enlightened' && (
            <motion.ellipse
              cx="160" cy="350" rx="120" ry="250"
              fill="url(#a-skin)" opacity="0"
              animate={{ opacity: [0, 0.05, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            />
          )}
        </svg>
      </motion.div>
    </div>
  )
}
