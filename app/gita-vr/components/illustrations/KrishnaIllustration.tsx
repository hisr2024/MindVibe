/**
 * KrishnaIllustration — Disney-level animated Lord Krishna
 *
 * Richly detailed SVG illustration in the classic Tribhanga (triple-bend) pose:
 * - Flowing silk pitambara with wind animation
 * - Ornate mukut (crown) with Mor Pankh (peacock feather)
 * - Divine blue skin with luminous highlights
 * - Kaustubha gem, Vaijayanti garland, sacred thread
 * - Murali (flute) in graceful hand position
 *
 * Animation follows Disney's 12 principles:
 * - Anticipation before state changes
 * - Follow-through on garment movement
 * - Slow-in/slow-out on all transitions
 * - Secondary action (garland sway, feather bounce)
 * - Overlapping action (hair, clothes, ornaments move at different speeds)
 *
 * Powered by Framer Motion for spring-based, orchestrated transitions.
 */

'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function KrishnaIllustration() {
  const krishnaState = useGitaVRStore((s) => s.krishnaState)
  const reduceMotion = useReducedMotion()

  // Disney-style spring configs for different "weights"
  const gentleSpring = useMemo(() => ({ type: 'spring' as const, stiffness: 40, damping: 15, mass: 1 }), [])
  const softSpring = useMemo(() => ({ type: 'spring' as const, stiffness: 60, damping: 20, mass: 0.8 }), [])
  const clothSpring = useMemo(() => ({ type: 'spring' as const, stiffness: 25, damping: 10, mass: 1.5 }), [])

  // State-driven animation variants (body)
  const bodyVariants = useMemo(() => ({
    idle: { y: [0, -4, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const } },
    speaking: { y: [0, -3, -1, -3, 0], rotate: [0, 0.4, -0.3, 0.2, 0], transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const } },
    listening: { y: [0, -2, 0], transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const } },
    blessing: { y: [0, -5, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const } },
  }), [])

  // Head variants — tilt, nod
  const headVariants = useMemo(() => ({
    idle: { rotate: 0, y: 0 },
    speaking: { rotate: [0, 1.5, -1, 0.5, 0], y: [0, -1, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const } },
    listening: { rotate: [0, 4, 3, 4, 0], y: [0, -1, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const } },
    blessing: { rotate: -2, y: -2, transition: gentleSpring },
  }), [gentleSpring])

  // Right arm — blessing gesture (Abhaya mudra)
  const rightArmVariants = useMemo(() => ({
    idle: { rotate: 0, transition: softSpring },
    speaking: { rotate: [0, -5, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const } },
    listening: { rotate: 0, transition: softSpring },
    blessing: { rotate: -55, transition: { type: 'spring' as const, stiffness: 35, damping: 12, mass: 1.2 } },
  }), [softSpring])

  // Garland sway — follows body but with delay (overlapping action)
  const garlandVariants = useMemo(() => ({
    idle: { rotate: [0, 1.5, -1.5, 0], transition: { duration: 5, repeat: Infinity, ease: 'easeInOut' as const } },
    speaking: { rotate: [0, 2.5, -2, 1, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' as const } },
    listening: { rotate: [0, 1, 0], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const } },
    blessing: { rotate: [0, 2, -1, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const } },
  }), [])

  // Dhoti wind animation — cloth spring physics
  const dhotiVariants = useMemo(() => ({
    idle: { skewX: [0, 0.8, -0.5, 0], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const } },
    speaking: { skewX: [0, 1.2, -0.8, 0.5, 0], transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const } },
    listening: { skewX: [0, 0.5, 0], transition: { duration: 7, repeat: Infinity, ease: 'easeInOut' as const } },
    blessing: { skewX: [0, 1.5, -1, 0], transition: { ...clothSpring, duration: 4, repeat: Infinity } },
  }), [clothSpring])

  if (reduceMotion) {
    return (
      <div className="relative h-[520px] w-[280px]" aria-label="Lord Krishna">
        <KrishnaSVG />
      </div>
    )
  }

  return (
    <div className="relative h-[520px] w-[280px]" aria-label="Lord Krishna">
      {/* Outer divine glow — reacts to state */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{
          filter: krishnaState === 'speaking' || krishnaState === 'blessing'
            ? 'drop-shadow(0 0 60px rgba(255,215,0,0.35)) drop-shadow(0 0 120px rgba(212,164,76,0.15))'
            : 'drop-shadow(0 0 30px rgba(212,164,76,0.15)) drop-shadow(0 0 60px rgba(212,164,76,0.05))',
        }}
        transition={{ duration: 1.2, ease: 'easeInOut' as const }}
      >
        <svg viewBox="0 0 400 700" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="k-aura" cx="50%" cy="38%" r="50%">
              <stop offset="0%" stopColor="#FFD700" stopOpacity="0.25" />
              <stop offset="40%" stopColor="#d4a44c" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#d4a44c" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="k-skin" x1="0.3" y1="0" x2="0.7" y2="1">
              <stop offset="0%" stopColor="#7BAFD4" />
              <stop offset="40%" stopColor="#5B92BF" />
              <stop offset="100%" stopColor="#3D6E99" />
            </linearGradient>
            <linearGradient id="k-skin-shadow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3D6E99" />
              <stop offset="100%" stopColor="#2C5478" />
            </linearGradient>
            <linearGradient id="k-crown" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FFE44D" />
              <stop offset="50%" stopColor="#FFD700" />
              <stop offset="100%" stopColor="#C5960C" />
            </linearGradient>
            <linearGradient id="k-pitambara" x1="0.2" y1="0" x2="0.8" y2="1">
              <stop offset="0%" stopColor="#FFE066" />
              <stop offset="30%" stopColor="#FFD93D" />
              <stop offset="100%" stopColor="#D4A800" />
            </linearGradient>
            <linearGradient id="k-pitambara-fold" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#C9A200" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#C9A200" stopOpacity="0" />
              <stop offset="100%" stopColor="#C9A200" stopOpacity="0.2" />
            </linearGradient>
            <radialGradient id="k-kaustubha" cx="50%" cy="40%" r="50%">
              <stop offset="0%" stopColor="#FF69B4" />
              <stop offset="40%" stopColor="#FF1493" />
              <stop offset="100%" stopColor="#C71585" />
            </radialGradient>
            <filter id="k-glow">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="k-jewel-glow">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="blur" operator="over" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="k-soft-shadow">
              <feDropShadow dx="2" dy="4" stdDeviation="3" floodColor="#1a1a2e" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* === DIVINE AURA === */}
          <motion.ellipse
            cx="200" cy="280" rx="180" ry="280"
            fill="url(#k-aura)"
            animate={{ opacity: [0.4, 0.7, 0.4], scale: [1, 1.04, 1] }}
            transition={{ duration: krishnaState === 'speaking' ? 2 : 4, repeat: Infinity, ease: 'easeInOut' as const }}
          />

          {/* === BODY GROUP === */}
          <motion.g
            variants={bodyVariants}
            animate={krishnaState}
            style={{ originX: '200px', originY: '600px' }}
          >
            {/* === DHOTI (lower garment) with wind physics === */}
            <motion.g variants={dhotiVariants} animate={krishnaState} style={{ originX: '200px', originY: '380px' }}>
              {/* Main dhoti shape — flowing silk */}
              <path
                d="M165,375 Q155,420 148,480 Q142,530 130,580 Q125,600 135,625 L200,640 L265,625 Q275,600 270,580 Q258,530 252,480 Q245,420 235,375 Z"
                fill="url(#k-pitambara)"
                filter="url(#k-soft-shadow)"
              />
              {/* Dhoti wrap fold (pallu) — flowing to the left */}
              <path
                d="M165,378 Q145,400 125,440 Q115,470 120,510 Q122,540 128,570"
                fill="none" stroke="#C9A200" strokeWidth="1.5" opacity="0.4"
              />
              {/* Inner fold lines */}
              <path d="M180,385 Q178,430 172,490 Q168,540 165,590" fill="none" stroke="#C9A200" strokeWidth="0.8" opacity="0.25" />
              <path d="M215,385 Q218,430 222,490 Q225,540 230,585" fill="none" stroke="#C9A200" strokeWidth="0.8" opacity="0.25" />
              {/* Silk sheen highlight */}
              <path
                d="M190,390 Q195,450 192,520 Q190,570 195,620"
                fill="none" stroke="#FFF5CC" strokeWidth="2" opacity="0.15"
              />
              {/* Golden border (zari) */}
              <path
                d="M130,580 Q125,600 135,625 L200,640 L265,625 Q275,600 270,580"
                fill="none" stroke="#FFD700" strokeWidth="3" opacity="0.6"
              />
              <path
                d="M132,576 Q128,595 137,618 L200,632 L263,618 Q272,595 268,576"
                fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.3"
              />
            </motion.g>

            {/* Feet — lotus-like */}
            <ellipse cx="172" cy="642" rx="18" ry="7" fill="url(#k-skin)" />
            <ellipse cx="228" cy="642" rx="18" ry="7" fill="url(#k-skin)" />
            {/* Anklets (Nupura) */}
            <ellipse cx="172" cy="635" rx="12" ry="3.5" fill="none" stroke="#FFD700" strokeWidth="2" />
            <ellipse cx="228" cy="635" rx="12" ry="3.5" fill="none" stroke="#FFD700" strokeWidth="2" />
            {/* Tiny bells on anklets */}
            {[164, 172, 180, 220, 228, 236].map((x, i) => (
              <circle key={`bell-${i}`} cx={x} cy="638" r="1.5" fill="#FFD700" opacity="0.7" />
            ))}

            {/* === TORSO — Tribhanga curve === */}
            <path
              d="M168,225 Q162,250 160,290 Q158,330 162,370 Q163,378 165,375
                 L235,375 Q237,378 238,370 Q242,330 240,290 Q238,250 232,225 Z"
              fill="url(#k-skin)"
              filter="url(#k-soft-shadow)"
            />
            {/* Torso muscle definition (subtle) */}
            <path d="M195,240 Q200,280 198,330" fill="none" stroke="url(#k-skin-shadow)" strokeWidth="1" opacity="0.2" />
            <path d="M205,240 Q200,280 202,330" fill="none" stroke="url(#k-skin-shadow)" strokeWidth="1" opacity="0.2" />
            {/* Navel */}
            <ellipse cx="200" cy="340" rx="3" ry="4" fill="#2C5478" opacity="0.3" />

            {/* === SACRED THREAD (Yajnopavita) === */}
            <path
              d="M185,230 Q210,245 225,275 Q235,310 220,370"
              fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.7"
              strokeLinecap="round"
            />

            {/* === VAIJAYANTI GARLAND === */}
            <motion.g variants={garlandVariants} animate={krishnaState} style={{ originX: '200px', originY: '230px' }}>
              <path
                d="M172,232 Q158,260 162,300 Q168,335 200,350 Q232,335 238,300 Q242,260 228,232"
                fill="none" stroke="#FF6B6B" strokeWidth="4" opacity="0.5" strokeLinecap="round"
              />
              {/* Flowers on garland */}
              {[
                [168, 255], [162, 285], [170, 320], [190, 345], [210, 345], [230, 320], [238, 285], [232, 255],
              ].map(([x, y], i) => (
                <g key={`gf-${i}`}>
                  <circle cx={x} cy={y} r="5" fill={i % 3 === 0 ? '#FF8888' : i % 3 === 1 ? '#FFFFFF' : '#FFB366'} opacity="0.7" />
                  <circle cx={x} cy={y} r="2" fill={i % 3 === 0 ? '#FF4444' : i % 3 === 1 ? '#FFD700' : '#FF6600'} opacity="0.5" />
                </g>
              ))}
              {/* Tulsi leaves */}
              {[[175, 270], [225, 270], [200, 352]].map(([x, y], i) => (
                <ellipse key={`leaf-${i}`} cx={x} cy={y} rx="4" ry="2" fill="#2E7D32" opacity="0.5" transform={`rotate(${i * 30}, ${x}, ${y})`} />
              ))}
            </motion.g>

            {/* === KAUSTUBHA GEM === */}
            <motion.g
              animate={{ scale: [1, 1.15, 1], opacity: [0.8, 1, 0.8] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' as const }}
            >
              <circle cx="200" cy="242" r="10" fill="url(#k-kaustubha)" filter="url(#k-jewel-glow)" />
              <circle cx="200" cy="242" r="5" fill="#FF69B4" opacity="0.8" />
              <circle cx="198" cy="239" r="2" fill="white" opacity="0.6" />
            </motion.g>

            {/* Necklace */}
            <path d="M175,232 Q185,240 200,243 Q215,240 225,232" fill="none" stroke="#FFD700" strokeWidth="2.5" />
            <path d="M178,228 Q190,236 200,238 Q210,236 222,228" fill="none" stroke="#FFD700" strokeWidth="1.5" opacity="0.6" />

            {/* === LEFT ARM (holding flute — Tribhanga) === */}
            <g>
              <path
                d="M168,230 Q148,250 132,280 Q122,300 118,315"
                fill="none" stroke="url(#k-skin)" strokeWidth="22" strokeLinecap="round"
              />
              {/* Hand */}
              <ellipse cx="116" cy="320" rx="10" ry="8" fill="#5B92BF" />
              {/* Fingers holding flute */}
              <path d="M110,316 Q108,320 110,324" fill="none" stroke="#5B92BF" strokeWidth="3" strokeLinecap="round" />
              <path d="M114,314 Q112,320 114,326" fill="none" stroke="#5B92BF" strokeWidth="3" strokeLinecap="round" />
              {/* Bracelet (Kankana) */}
              <ellipse cx="128" cy="290" rx="13" ry="5" fill="none" stroke="#FFD700" strokeWidth="2.5" />
              <ellipse cx="128" cy="290" rx="13" ry="5" fill="none" stroke="#FFE44D" strokeWidth="1" opacity="0.5" />

              {/* === FLUTE (Murali) === */}
              <g transform="rotate(-12, 140, 310)">
                <rect x="88" y="307" width="80" height="8" rx="4" fill="#C5960C" />
                {/* Bamboo texture lines */}
                <line x1="100" y1="307" x2="100" y2="315" stroke="#A07000" strokeWidth="0.5" opacity="0.4" />
                <line x1="120" y1="307" x2="120" y2="315" stroke="#A07000" strokeWidth="0.5" opacity="0.4" />
                <line x1="140" y1="307" x2="140" y2="315" stroke="#A07000" strokeWidth="0.5" opacity="0.4" />
                {/* Finger holes */}
                {[98, 110, 122, 134, 146, 155].map((x, i) => (
                  <circle key={`fh-${i}`} cx={x} cy="311" r="2" fill="#8B6914" />
                ))}
                {/* Flute highlight */}
                <rect x="88" y="308" width="80" height="2" rx="1" fill="#FFE44D" opacity="0.3" />
              </g>
            </g>

            {/* === RIGHT ARM === */}
            <motion.g
              variants={rightArmVariants}
              animate={krishnaState}
              style={{ originX: '232px', originY: '230px' }}
            >
              <path
                d="M232,230 Q252,250 264,280 Q270,300 268,320"
                fill="none" stroke="url(#k-skin)" strokeWidth="22" strokeLinecap="round"
              />
              {/* Hand — Abhaya mudra when blessing (palm forward, fingers up) */}
              <AnimatePresence mode="wait">
                {krishnaState === 'blessing' ? (
                  <motion.g
                    key="blessing-hand"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ellipse cx="270" cy="322" rx="12" ry="14" fill="#5B92BF" />
                    {/* Fingers spread */}
                    <path d="M264,310 L262,296" stroke="#5B92BF" strokeWidth="4" strokeLinecap="round" />
                    <path d="M268,308 L267,293" stroke="#5B92BF" strokeWidth="4" strokeLinecap="round" />
                    <path d="M273,308 L274,293" stroke="#5B92BF" strokeWidth="4" strokeLinecap="round" />
                    <path d="M277,310 L280,296" stroke="#5B92BF" strokeWidth="4" strokeLinecap="round" />
                    {/* Divine glow from palm */}
                    <circle cx="270" cy="310" r="20" fill="#FFD700" opacity="0.1" filter="url(#k-glow)" />
                  </motion.g>
                ) : (
                  <motion.g key="normal-hand" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ellipse cx="270" cy="325" rx="10" ry="8" fill="#5B92BF" />
                  </motion.g>
                )}
              </AnimatePresence>
              {/* Bracelet */}
              <ellipse cx="260" cy="290" rx="13" ry="5" fill="none" stroke="#FFD700" strokeWidth="2.5" />
            </motion.g>

            {/* === HEAD GROUP === */}
            <motion.g
              variants={headVariants}
              animate={krishnaState}
              style={{ originX: '200px', originY: '200px' }}
            >
              {/* Neck */}
              <rect x="190" y="205" width="20" height="25" rx="10" fill="url(#k-skin)" />
              {/* Neck ornament */}
              <path d="M186,220 Q193,225 200,226 Q207,225 214,220" fill="none" stroke="#FFD700" strokeWidth="1.5" />

              {/* Face */}
              <ellipse cx="200" cy="175" rx="35" ry="40" fill="url(#k-skin)" />
              {/* Face contour/jawline highlight */}
              <path d="M168,175 Q170,200 200,212 Q230,200 232,175" fill="none" stroke="#7BAFD4" strokeWidth="1" opacity="0.3" />

              {/* Hair */}
              <path
                d="M165,170 Q165,135 200,125 Q235,135 235,170 Q235,155 225,145 Q215,138 200,135 Q185,138 175,145 Q165,155 165,170"
                fill="#0d0d1a"
              />
              {/* Hair sheen */}
              <path d="M185,135 Q200,130 215,135" fill="none" stroke="#1a1a3a" strokeWidth="2" opacity="0.5" />

              {/* Forehead */}
              {/* Tilak — V-shaped Vaishnava mark */}
              <path d="M193,152 L200,138 L207,152" fill="none" stroke="#FFD700" strokeWidth="2" filter="url(#k-glow)" />
              <path d="M195,150 L200,140 L205,150" fill="#FFD700" opacity="0.6" />
              {/* Chandana dot */}
              <circle cx="200" cy="153" r="2.5" fill="#FF4500" filter="url(#k-glow)" />

              {/* Eyes — large, almond-shaped, divine */}
              <g>
                {/* Eye whites */}
                <ellipse cx="188" cy="172" rx="9" ry="5.5" fill="#FFFFF0" />
                <ellipse cx="212" cy="172" rx="9" ry="5.5" fill="#FFFFF0" />
                {/* Irises — deep dark, compassionate */}
                <motion.g
                  animate={{ scaleY: [1, 1, 0.08, 1, 1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' as const, times: [0, 0.47, 0.5, 0.53, 1] }}
                  style={{ originX: '200px', originY: '172px' }}
                >
                  <circle cx="189" cy="172" r="4" fill="#1a1020" />
                  <circle cx="213" cy="172" r="4" fill="#1a1020" />
                  {/* Eye sparkle — life in the eyes */}
                  <circle cx="190.5" cy="170.5" r="1.5" fill="white" opacity="0.9" />
                  <circle cx="214.5" cy="170.5" r="1.5" fill="white" opacity="0.9" />
                  <circle cx="187" cy="173" r="0.8" fill="white" opacity="0.5" />
                  <circle cx="211" cy="173" r="0.8" fill="white" opacity="0.5" />
                </motion.g>
                {/* Eyeliner — kajal */}
                <path d="M178,172 Q183,166 193,166 Q198,167 198,172 Q198,177 193,178 Q183,178 178,172" fill="none" stroke="#0d0d1a" strokeWidth="1.2" />
                <path d="M202,172 Q207,166 217,166 Q222,167 222,172 Q222,177 217,178 Q207,178 202,172" fill="none" stroke="#0d0d1a" strokeWidth="1.2" />
              </g>

              {/* Eyebrows — graceful arches */}
              <path d="M177,163 Q188,157 198,163" fill="none" stroke="#0d0d1a" strokeWidth="1.8" strokeLinecap="round" />
              <path d="M202,163 Q212,157 223,163" fill="none" stroke="#0d0d1a" strokeWidth="1.8" strokeLinecap="round" />

              {/* Nose — refined */}
              <path d="M200,175 Q197,183 199,190 Q200,192 201,190 Q203,183 200,175" fill="none" stroke="#3D6E99" strokeWidth="1" opacity="0.6" />
              {/* Nose ornament */}
              <circle cx="199" cy="188" r="1.5" fill="#FFD700" opacity="0.5" />

              {/* Lips — gentle divine smile */}
              <motion.g
                animate={
                  krishnaState === 'speaking'
                    ? { scaleY: [1, 1.3, 0.9, 1.2, 1], transition: { duration: 0.5, repeat: Infinity, ease: 'easeInOut' as const } }
                    : { scaleY: 1 }
                }
                style={{ originX: '200px', originY: '198px' }}
              >
                {/* Upper lip */}
                <path d="M190,196 Q195,193 200,194 Q205,193 210,196" fill="#8B5070" opacity="0.7" />
                {/* Lower lip */}
                <path d="M190,196 Q195,202 200,203 Q205,202 210,196" fill="#9B5A7A" opacity="0.6" />
                {/* Smile curve */}
                <path d="M188,198 Q194,204 200,205 Q206,204 212,198" fill="none" stroke="#7A4060" strokeWidth="0.8" opacity="0.5" />
              </motion.g>

              {/* Earrings (Kundala) — ornate fish-shaped */}
              <motion.g
                animate={{ rotate: [0, 3, -3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' as const }}
                style={{ originX: '165px', originY: '178px' }}
              >
                <circle cx="165" cy="180" r="7" fill="#FFD700" filter="url(#k-glow)" />
                <circle cx="165" cy="180" r="4" fill="#FFE44D" />
                <circle cx="165" cy="188" r="3" fill="#FF0000" opacity="0.6" />
              </motion.g>
              <motion.g
                animate={{ rotate: [0, -3, 3, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' as const, delay: 0.5 }}
                style={{ originX: '235px', originY: '178px' }}
              >
                <circle cx="235" cy="180" r="7" fill="#FFD700" filter="url(#k-glow)" />
                <circle cx="235" cy="180" r="4" fill="#FFE44D" />
                <circle cx="235" cy="188" r="3" fill="#FF0000" opacity="0.6" />
              </motion.g>

              {/* === CROWN (Kirita Mukut) === */}
              <g>
                {/* Crown base band */}
                <path
                  d="M167,150 Q167,142 200,138 Q233,142 233,150 L230,155 Q200,148 170,155 Z"
                  fill="url(#k-crown)"
                  stroke="#B8860B"
                  strokeWidth="0.5"
                />
                {/* Crown spires — ornate triple peak */}
                <path d="M175,142 L180,112 L188,135" fill="url(#k-crown)" stroke="#B8860B" strokeWidth="0.3" />
                <path d="M190,138 L200,95 L210,138" fill="url(#k-crown)" stroke="#B8860B" strokeWidth="0.3" />
                <path d="M212,135 L220,112 L225,142" fill="url(#k-crown)" stroke="#B8860B" strokeWidth="0.3" />
                {/* Crown filigree details */}
                <path d="M182,130 Q190,122 198,130" fill="none" stroke="#FFE44D" strokeWidth="0.8" opacity="0.6" />
                <path d="M202,130 Q210,122 218,130" fill="none" stroke="#FFE44D" strokeWidth="0.8" opacity="0.6" />
                {/* Crown jewels */}
                <motion.circle
                  cx="200" cy="118" r="5"
                  fill="#FF0000"
                  filter="url(#k-jewel-glow)"
                  animate={{ opacity: [0.7, 1, 0.7], scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' as const }}
                />
                <circle cx="182" cy="128" r="3.5" fill="#0055FF" opacity="0.8" filter="url(#k-glow)" />
                <circle cx="218" cy="128" r="3.5" fill="#00CC66" opacity="0.8" filter="url(#k-glow)" />
                {/* Pearl border */}
                {[172, 178, 184, 190, 196, 202, 208, 214, 220, 226].map((x, i) => (
                  <circle key={`pearl-${i}`} cx={x} cy="150" r="1.5" fill="#FFFFF0" opacity="0.7" />
                ))}

                {/* === PEACOCK FEATHER (Mor Pankh) === */}
                <motion.g
                  transform="translate(218, 105) rotate(18)"
                  animate={{ rotate: [18, 22, 16, 18] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' as const }}
                  style={{ originX: '218px', originY: '105px' }}
                >
                  {/* Shaft */}
                  <line x1="0" y1="0" x2="0" y2="-72" stroke="#00695C" strokeWidth="1.5" strokeLinecap="round" />
                  {/* Barbs — feathery strands */}
                  {Array.from({ length: 8 }, (_, i) => {
                    const y = -15 - i * 7
                    return (
                      <g key={`barb-${i}`}>
                        <path d={`M0,${y} Q${-5 - i},${y - 4} ${-3 - i * 0.5},${y - 8}`} fill="none" stroke="#00695C" strokeWidth="0.4" opacity="0.4" />
                        <path d={`M0,${y} Q${5 + i},${y - 4} ${3 + i * 0.5},${y - 8}`} fill="none" stroke="#00695C" strokeWidth="0.4" opacity="0.4" />
                      </g>
                    )
                  })}
                  {/* Eye of feather — iridescent */}
                  <ellipse cx="0" cy="-62" rx="12" ry="16" fill="#00695C" opacity="0.9" />
                  <ellipse cx="0" cy="-62" rx="8" ry="12" fill="#1565C0" opacity="0.7" />
                  <ellipse cx="0" cy="-62" rx="4" ry="7" fill="#00BCD4" opacity="0.6" />
                  <ellipse cx="0" cy="-62" rx="2" ry="4" fill="#FFD700" opacity="0.7" />
                  {/* Iridescent shimmer */}
                  <motion.ellipse
                    cx="0" cy="-62" rx="8" ry="12"
                    fill="none" stroke="#00E5FF" strokeWidth="0.5"
                    animate={{ opacity: [0, 0.5, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' as const }}
                  />
                </motion.g>
              </g>
            </motion.g>
          </motion.g>
        </svg>
      </motion.div>
    </div>
  )
}

/** Static fallback for reduced-motion preference */
function KrishnaSVG() {
  return (
    <svg viewBox="0 0 400 700" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="ks-skin" x1="0.3" y1="0" x2="0.7" y2="1">
          <stop offset="0%" stopColor="#7BAFD4" />
          <stop offset="100%" stopColor="#3D6E99" />
        </linearGradient>
        <linearGradient id="ks-crown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE44D" />
          <stop offset="100%" stopColor="#C5960C" />
        </linearGradient>
      </defs>
      <ellipse cx="200" cy="280" rx="150" ry="250" fill="#FFD700" opacity="0.08" />
      <path d="M165,375 Q155,420 148,480 Q142,530 130,580 L200,640 L270,580 Q258,530 252,480 Q245,420 235,375 Z" fill="#FFD93D" />
      <path d="M168,225 Q162,250 160,290 Q158,330 162,370 L238,370 Q242,330 240,290 Q238,250 232,225 Z" fill="url(#ks-skin)" />
      <ellipse cx="200" cy="175" rx="35" ry="40" fill="url(#ks-skin)" />
      <path d="M167,150 Q167,142 200,138 Q233,142 233,150 Z" fill="url(#ks-crown)" />
      <path d="M190,138 L200,95 L210,138" fill="url(#ks-crown)" />
      <circle cx="200" cy="242" r="8" fill="#FF1493" />
      <ellipse cx="188" cy="172" rx="8" ry="4.5" fill="#FFFFF0" />
      <ellipse cx="212" cy="172" rx="8" ry="4.5" fill="#FFFFF0" />
      <circle cx="189" cy="172" r="3.5" fill="#1a1020" />
      <circle cx="213" cy="172" r="3.5" fill="#1a1020" />
      <path d="M188,198 Q200,206 212,198" fill="none" stroke="#7A4060" strokeWidth="1" />
    </svg>
  )
}
