/**
 * KrishnaIllustration — Elegant silhouette art style
 *
 * Dark divine-blue silhouette with golden edge-glow, recognizable by iconic profile:
 * crown with triple spires, peacock feather, flute at lips, tribhanga pose, flowing dhoti.
 *
 * Art direction: Shadow puppet theater meets divine luminescence.
 * The figure's identity comes from its distinctive outline, not drawn-on anatomy.
 *
 * State-driven Framer Motion animations:
 * - idle: Gentle breathing sway, soft edge glow
 * - speaking: Intensified glow, subtle body animation
 * - blessing: Raised-palm silhouette variant, maximum radiance
 * - listening: Slight head tilt, warm attentive glow
 */

'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useGitaVRStore } from '@/stores/gitaVRStore'

/**
 * Main silhouette path — Krishna in tribhanga pose with flute.
 * One continuous artistic outline: crown spires → peacock feather → head → shoulders →
 * left arm holding flute → torso → right arm at side → dhoti flowing → feet.
 */
const KRISHNA_SILHOUETTE = `
  M200,28
  L210,18 L206,42
  L220,10 L214,48
  L228,22 L220,52

  Q235,48 238,55
  Q248,40 250,24
  C256,16 260,28 252,42
  Q246,56 240,58

  Q236,58 234,62
  Q240,70 240,82
  Q240,108 230,120

  Q244,128 256,146
  Q268,160 276,180
  Q288,198 290,218
  Q292,232 288,244
  Q286,248 282,246

  L278,238
  Q270,226 262,244
  Q258,258 262,276
  Q264,290 258,312
  Q254,328 252,340

  Q246,350 244,368
  Q240,390 250,425
  Q258,460 268,500
  Q280,540 288,570
  Q294,595 290,612
  Q286,628 276,636
  L260,640
  Q254,634 248,640
  L232,640

  Q236,620 232,600
  Q224,560 216,530
  Q208,508 200,500

  Q192,508 184,530
  Q176,560 168,600
  Q164,620 168,640

  L152,640
  Q146,634 140,640
  L124,636
  Q114,628 110,612
  Q106,595 112,570
  Q120,540 132,500
  Q142,460 150,425
  Q160,390 156,368

  Q154,350 148,340
  Q142,328 138,312
  Q136,290 138,276
  Q142,258 138,244
  Q130,226 122,238

  L118,246
  Q114,248 112,244
  Q108,232 110,218
  Q112,198 124,180

  Q100,178 86,172
  Q78,166 76,160
  L78,156
  Q82,152 88,154
  Q108,162 120,158

  Q108,162 94,156
  Q82,150 78,144
  L80,140
  Q84,136 90,140
  Q110,152 118,150

  L116,148
  Q104,142 92,130
  Q86,124 86,118
  L88,114
  Q94,112 100,120
  Q112,134 120,140

  Q132,146 144,146
  Q156,160 160,180
  Q160,120 162,108
  Q160,82 160,70
  Q164,58 166,62
  Q160,58 152,42
  C148,28 144,16 150,24
  L172,52
  L180,10 L186,48
  L194,18 L190,42
  Z
`

/**
 * Blessing variant — right arm raised with open palm (Abhaya mudra).
 * Same overall figure but right arm reaches upward instead of resting at side.
 */
const KRISHNA_BLESSING_SILHOUETTE = `
  M200,28
  L210,18 L206,42
  L220,10 L214,48
  L228,22 L220,52

  Q235,48 238,55
  Q248,40 250,24
  C256,16 260,28 252,42
  Q246,56 240,58

  Q236,58 234,62
  Q240,70 240,82
  Q240,108 230,120

  Q244,128 256,146
  Q268,152 278,148
  Q290,142 296,128
  Q304,112 306,96
  Q308,80 302,72
  Q296,66 290,74
  Q284,82 280,92
  Q274,106 268,118
  Q262,130 254,140

  Q250,148 248,160
  Q246,180 248,200
  Q250,228 252,260
  Q254,300 252,340

  Q246,350 244,368
  Q240,390 250,425
  Q258,460 268,500
  Q280,540 288,570
  Q294,595 290,612
  Q286,628 276,636
  L260,640
  Q254,634 248,640
  L232,640

  Q236,620 232,600
  Q224,560 216,530
  Q208,508 200,500

  Q192,508 184,530
  Q176,560 168,600
  Q164,620 168,640

  L152,640
  Q146,634 140,640
  L124,636
  Q114,628 110,612
  Q106,595 112,570
  Q120,540 132,500
  Q142,460 150,425
  Q160,390 156,368

  Q154,350 148,340
  Q142,328 138,312
  Q136,290 138,276
  Q142,258 138,244
  Q130,226 122,238

  L118,246
  Q114,248 112,244
  Q108,232 110,218
  Q112,198 124,180

  Q100,178 86,172
  Q78,166 76,160
  L78,156
  Q82,152 88,154
  Q108,162 120,158

  Q108,162 94,156
  Q82,150 78,144
  L80,140
  Q84,136 90,140
  Q110,152 118,150

  L116,148
  Q104,142 92,130
  Q86,124 86,118
  L88,114
  Q94,112 100,120
  Q112,134 120,140

  Q132,146 144,146
  Q156,160 160,180
  Q160,120 162,108
  Q160,82 160,70
  Q164,58 166,62
  Q160,58 152,42
  C148,28 144,16 150,24
  L172,52
  L180,10 L186,48
  L194,18 L190,42
  Z
`

export default function KrishnaIllustration() {
  const krishnaState = useGitaVRStore((s) => s.krishnaState)
  const reduceMotion = useReducedMotion()

  const isActive = krishnaState === 'speaking' || krishnaState === 'blessing'
  const isBlessing = krishnaState === 'blessing'

  const bodyVariants = useMemo(() => ({
    idle: { y: [0, -4, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const } },
    speaking: { y: [0, -3, -1, -3, 0], rotate: [0, 0.3, -0.2, 0.15, 0], transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const } },
    listening: { y: [0, -2, 0], rotate: [0, 1.5, 0], transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const } },
    blessing: { y: [0, -5, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const } },
  }), [])

  /* Floating golden particles around the figure */
  const particles = useMemo(() =>
    Array.from({ length: 10 }, (_, i) => ({
      x: 60 + (i * 137.508) % 280,
      y: 100 + (i * 97.31) % 440,
      size: 1.5 + (i % 3) * 1,
      dur: 3 + (i % 4) * 1.2,
      delay: i * 0.4,
    })),
  [])

  if (reduceMotion) {
    return (
      <div className="relative h-[600px] w-[320px]" aria-label="Lord Krishna">
        <svg viewBox="0 0 400 680" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ks-fill" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#1a3060" />
              <stop offset="100%" stopColor="#0a1535" />
            </linearGradient>
          </defs>
          <ellipse cx="200" cy="340" rx="160" ry="300" fill="#FFD700" opacity="0.06" />
          <path d={KRISHNA_SILHOUETTE} fill="url(#ks-fill)" />
        </svg>
      </div>
    )
  }

  return (
    <div className="relative h-[600px] w-[320px]" aria-label="Lord Krishna">
      {/* === GOLDEN BACKLIGHT === */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        animate={{
          opacity: isBlessing ? 0.5 : isActive ? 0.35 : 0.2,
          scale: [1, 1.04, 1],
        }}
        transition={{
          opacity: { duration: 1, ease: 'easeOut' },
          scale: { duration: isActive ? 2.5 : 4.5, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <div
          className="h-[120%] w-[160%] rounded-full"
          style={{
            background: `radial-gradient(ellipse, rgba(255,215,0,0.18) 0%, rgba(212,164,76,0.08) 35%, transparent 65%)`,
          }}
        />
      </motion.div>

      {/* === MAIN SVG === */}
      <motion.div
        className="relative h-full w-full"
        variants={bodyVariants}
        animate={krishnaState}
        style={{ originX: '50%', originY: '90%' }}
      >
        <svg viewBox="0 0 400 680" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Deep divine-blue gradient fill */}
            <linearGradient id="k-fill" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#1a3060" />
              <stop offset="40%" stopColor="#122248" />
              <stop offset="100%" stopColor="#0a1535" />
            </linearGradient>

            {/* Lighter inner gradient for depth suggestion */}
            <linearGradient id="k-inner" x1="0.3" y1="0.2" x2="0.7" y2="0.8">
              <stop offset="0%" stopColor="#2a4a80" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#1a3060" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#0a1535" stopOpacity="0" />
            </linearGradient>

            {/* Golden edge glow filter */}
            <filter id="k-edge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feMorphology operator="dilate" radius="1.5" in="SourceAlpha" result="dilated" />
              <feGaussianBlur stdDeviation="8" in="dilated" result="blurred" />
              <feFlood floodColor="#d4a44c" floodOpacity="0.5" result="glowColor" />
              <feComposite in="glowColor" in2="blurred" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Intensified edge glow for speaking/blessing */}
            <filter id="k-edge-glow-active" x="-30%" y="-30%" width="160%" height="160%">
              <feMorphology operator="dilate" radius="2" in="SourceAlpha" result="dilated" />
              <feGaussianBlur stdDeviation="12" in="dilated" result="blurred" />
              <feFlood floodColor="#FFD700" floodOpacity="0.6" result="glowColor" />
              <feComposite in="glowColor" in2="blurred" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Jewel glow for crown and kaustubha gem */}
            <filter id="k-jewel">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Backlight radial glow */}
            <radialGradient id="k-backlight" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.12" />
              <stop offset="40%" stopColor="#d4a44c" stopOpacity="0.05" />
              <stop offset="100%" stopColor="transparent" />
            </radialGradient>
          </defs>

          {/* === SILHOUETTE with edge glow === */}
          <AnimatePresence mode="wait">
            {isBlessing ? (
              <motion.path
                key="blessing"
                d={KRISHNA_BLESSING_SILHOUETTE}
                fill="url(#k-fill)"
                filter="url(#k-edge-glow-active)"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.8 }}
                transition={{ duration: 0.5 }}
              />
            ) : (
              <motion.path
                key="default"
                d={KRISHNA_SILHOUETTE}
                fill="url(#k-fill)"
                filter={isActive ? 'url(#k-edge-glow-active)' : 'url(#k-edge-glow)'}
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0.8 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>

          {/* Inner gradient overlay — suggests depth without explicit anatomy */}
          <path d={isBlessing ? KRISHNA_BLESSING_SILHOUETTE : KRISHNA_SILHOUETTE} fill="url(#k-inner)" />

          {/* === SUBTLE DETAIL HIGHLIGHTS (low opacity, within silhouette) === */}

          {/* Crown jewel glow — three points of light at the crown peaks */}
          <motion.circle
            cx="200" cy="14" r="4"
            fill="#FFD700"
            filter="url(#k-jewel)"
            animate={{ opacity: [0.5, 0.9, 0.5], scale: [1, 1.2, 1] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.circle
            cx="210" cy="22" r="2.5"
            fill="#FF4500"
            filter="url(#k-jewel)"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
          />
          <motion.circle
            cx="190" cy="22" r="2.5"
            fill="#4169E1"
            filter="url(#k-jewel)"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          />

          {/* Kaustubha gem — glowing point on chest */}
          <motion.circle
            cx="200" cy="240"
            r="5"
            fill="#FF69B4"
            filter="url(#k-jewel)"
            animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Flute highlight — thin golden line across the flute area */}
          <line
            x1="78" y1="152" x2="120" y2="145"
            stroke="#d4a44c" strokeWidth="1.5" opacity="0.35" strokeLinecap="round"
          />

          {/* Fabric fold suggestions — very subtle strokes within the dhoti area */}
          <path
            d="M185,400 Q190,460 188,530"
            fill="none" stroke="#2a4a80" strokeWidth="1" opacity="0.15"
          />
          <path
            d="M215,400 Q210,460 212,530"
            fill="none" stroke="#2a4a80" strokeWidth="1" opacity="0.15"
          />

          {/* Golden waist sash line */}
          <path
            d="M156,370 Q178,362 200,365 Q222,362 244,370"
            fill="none" stroke="#d4a44c" strokeWidth="1.5" opacity="0.3"
          />
        </svg>
      </motion.div>

      {/* === FLOATING GOLDEN PARTICLES === */}
      <div className="pointer-events-none absolute inset-0">
        {particles.map((p, i) => (
          <motion.div
            key={`kp-${i}`}
            className="absolute rounded-full"
            style={{
              width: p.size,
              height: p.size,
              left: p.x,
              top: p.y,
              background: 'radial-gradient(circle, rgba(255,235,150,0.9) 0%, transparent 70%)',
              boxShadow: `0 0 ${p.size * 4}px rgba(255,215,0,0.4)`,
            }}
            animate={{
              y: [0, -15, 0],
              opacity: isActive ? [0.3, 0.7, 0.3] : [0.15, 0.4, 0.15],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{
              duration: p.dur,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: p.delay,
            }}
          />
        ))}
      </div>
    </div>
  )
}
