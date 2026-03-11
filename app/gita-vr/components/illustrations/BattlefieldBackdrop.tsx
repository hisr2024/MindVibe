/**
 * BattlefieldBackdrop — Disney-level cinematic Kurukshetra panorama
 *
 * Multi-layer parallax composition with Framer Motion:
 * - Layer 0: Celestial sky with animated gradient transitions
 * - Layer 1: Twinkling star field with varied sizes and rhythms
 * - Layer 2: Dramatic sun disc with corona rays and heat shimmer
 * - Layer 3: Distant mountain range with atmospheric perspective
 * - Layer 4: Army silhouettes with banner pennants
 * - Layer 5: Ornate chariot with horses (center stage)
 * - Layer 6: Foreground dust and terrain
 * - Layer 7: Volumetric fog layers with drift animation
 *
 * State-driven:
 * - normal: Warm sunset palette (amber → crimson → deep purple)
 * - vishwaroop: Cosmic palette (deep indigo → violet → ultraviolet)
 *
 * Subtle parallax on mouse movement for depth perception.
 * Framer Motion for smooth state transitions.
 * Pure CSS/SVG — no WebGL.
 */

'use client'

import { useRef, useEffect, useCallback, useState, useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function BattlefieldBackdrop() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })
  const sceneState = useGitaVRStore((s) => s.sceneState)
  const reduceMotion = useReducedMotion()

  const isVishwaroop = sceneState === 'vishwaroop'

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2
    setMouseOffset({ x, y })
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el || reduceMotion) return
    el.addEventListener('mousemove', handleMouseMove)
    return () => el.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove, reduceMotion])

  /* Deterministic star field */
  const stars = useMemo(() =>
    Array.from({ length: 80 }, (_, i) => ({
      cx: (i * 137.508) % 1920,
      cy: (i * 97.31) % 540,
      r: 0.4 + (i % 5) * 0.35,
      baseOpacity: 0.2 + (i % 5) * 0.12,
      dur: 2.5 + (i % 6) * 0.8,
    })),
  [])

  /* Corona ray angles */
  const coronaRays = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      angle: (i / 24) * 360,
      length: 80 + (i % 3) * 40,
      opacity: 0.04 + (i % 4) * 0.02,
      width: 1 + (i % 3),
    })),
  [])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* === LAYER 0: SKY GRADIENT === */}
      <motion.div
        className="absolute inset-0"
        animate={{
          background: isVishwaroop
            ? 'linear-gradient(180deg, #050010 0%, #0a0025 15%, #1a0050 30%, #2d1b69 50%, #4a1a8a 70%, #1a0040 90%, #050010 100%)'
            : 'linear-gradient(180deg, #0d0618 0%, #1a0a20 10%, #2d1528 22%, #4a1f28 35%, #7a3520 48%, #c4622a 58%, #e8943a 68%, #f0a830 76%, #c4622a 84%, #4a1f28 92%, #1a0a15 100%)',
        }}
        transition={{ duration: 2.5, ease: 'easeInOut' }}
      />

      {/* === LAYER 1: STAR FIELD === */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: isVishwaroop ? 0.9 : 0.2 }}
        transition={{ duration: 2 }}
      >
        <svg className="h-full w-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="star-glow">
              <stop offset="0%" stopColor="white" stopOpacity="1" />
              <stop offset="100%" stopColor="white" stopOpacity="0" />
            </radialGradient>
          </defs>
          {stars.map((s, i) => (
            <g key={`star-${i}`}>
              {/* Star glow */}
              {s.r > 1 && (
                <circle cx={s.cx} cy={s.cy} r={s.r * 4} fill="url(#star-glow)" opacity={s.baseOpacity * 0.3}>
                  <animate
                    attributeName="opacity"
                    values={`${s.baseOpacity * 0.1};${s.baseOpacity * 0.4};${s.baseOpacity * 0.1}`}
                    dur={`${s.dur * 1.5}s`}
                    repeatCount="indefinite"
                  />
                </circle>
              )}
              {/* Star core */}
              <circle cx={s.cx} cy={s.cy} r={s.r} fill="white" opacity={s.baseOpacity}>
                <animate
                  attributeName="opacity"
                  values={`${s.baseOpacity};${s.baseOpacity + 0.3};${s.baseOpacity}`}
                  dur={`${s.dur}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          ))}
        </svg>
      </motion.div>

      {/* === LAYER 2: SUN / COSMIC ORB === */}
      <motion.div
        className="absolute"
        animate={{
          width: isVishwaroop ? '280px' : '160px',
          height: isVishwaroop ? '280px' : '160px',
          left: '62%',
          top: isVishwaroop ? '8%' : '25%',
        }}
        transition={{ duration: 2, ease: 'easeInOut' }}
        style={{
          transform: reduceMotion ? undefined : `translate(${mouseOffset.x * -5}px, ${mouseOffset.y * -3}px)`,
        }}
      >
        {/* Corona rays */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 300 300">
          <defs>
            <radialGradient id="sun-core">
              <stop offset="0%" stopColor={isVishwaroop ? '#8A2BE2' : '#FFF8E0'} stopOpacity="0.9" />
              <stop offset="30%" stopColor={isVishwaroop ? '#6A0DAD' : '#FFD700'} stopOpacity="0.6" />
              <stop offset="60%" stopColor={isVishwaroop ? '#4B0082' : '#E8943A'} stopOpacity="0.3" />
              <stop offset="100%" stopColor="transparent" stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* Main sun disc */}
          <circle cx="150" cy="150" r="50" fill="url(#sun-core)">
            <animate attributeName="r" values="48;52;48" dur="4s" repeatCount="indefinite" />
          </circle>
          {/* Corona rays */}
          {coronaRays.map((ray, i) => {
            const rad = (ray.angle * Math.PI) / 180
            const x1 = 150 + Math.cos(rad) * 55
            const y1 = 150 + Math.sin(rad) * 55
            const x2 = 150 + Math.cos(rad) * (55 + ray.length)
            const y2 = 150 + Math.sin(rad) * (55 + ray.length)
            return (
              <line
                key={`corona-${i}`}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={isVishwaroop ? '#9B30FF' : '#FFD700'}
                strokeWidth={ray.width}
                opacity={ray.opacity}
              >
                <animate
                  attributeName="opacity"
                  values={`${ray.opacity};${ray.opacity * 2.5};${ray.opacity}`}
                  dur={`${3 + (i % 4)}s`}
                  repeatCount="indefinite"
                />
              </line>
            )
          })}
        </svg>
        {/* Heat shimmer glow */}
        <motion.div
          className="absolute inset-[-30%] rounded-full"
          animate={{
            background: isVishwaroop
              ? 'radial-gradient(circle, rgba(138,43,226,0.25) 0%, rgba(75,0,130,0.1) 40%, transparent 70%)'
              : 'radial-gradient(circle, rgba(255,248,224,0.3) 0%, rgba(240,168,48,0.15) 35%, transparent 65%)',
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.div>

      {/* === LAYER 3: DISTANT MOUNTAINS === */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '58%',
          transform: reduceMotion ? undefined : `translateX(${mouseOffset.x * -3}px)`,
          transition: 'transform 0.4s ease-out',
        }}
      >
        <svg className="h-full w-full" viewBox="0 0 1920 650" preserveAspectRatio="none">
          <defs>
            <linearGradient id="mtn-far" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isVishwaroop ? '#1a0050' : '#3a1828'} />
              <stop offset="100%" stopColor={isVishwaroop ? '#0d0025' : '#2d1020'} />
            </linearGradient>
            <linearGradient id="mtn-near" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isVishwaroop ? '#0d0025' : '#1a0a15'} />
              <stop offset="100%" stopColor={isVishwaroop ? '#060012' : '#0d0508'} />
            </linearGradient>
          </defs>
          {/* Far range — jagged peaks with atmospheric haze */}
          <path
            d="M0,380 Q80,280 160,340 Q240,220 360,310 Q440,180 540,290 Q640,200 760,280
               Q860,160 960,260 Q1060,190 1160,270 Q1260,150 1360,250 Q1460,200 1560,300
               Q1660,230 1760,290 Q1840,250 1920,320 L1920,650 L0,650Z"
            fill="url(#mtn-far)"
            opacity="0.75"
          />
          {/* Mid-range rolling hills */}
          <path
            d="M0,440 Q120,380 260,420 Q380,350 500,400 Q640,340 780,390
               Q900,330 1040,380 Q1160,340 1300,380 Q1440,350 1580,400
               Q1720,360 1840,400 Q1880,390 1920,420 L1920,650 L0,650Z"
            fill="url(#mtn-near)"
            opacity="0.85"
          />
          {/* Atmospheric haze between ranges */}
          <rect x="0" y="360" width="1920" height="60" fill={isVishwaroop ? '#1a0050' : '#4a1f28'} opacity="0.08" />
        </svg>
      </div>

      {/* === LAYER 4: ARMY SILHOUETTES === */}
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        animate={{ opacity: isVishwaroop ? 0.15 : 0.55 }}
        transition={{ duration: 2 }}
        style={{
          height: '38%',
          transform: reduceMotion ? undefined : `translateX(${mouseOffset.x * -6}px)`,
          transition: 'transform 0.35s ease-out',
        }}
      >
        <svg className="h-full w-full" viewBox="0 0 1920 420" preserveAspectRatio="none">
          {/* === Pandava (left) === */}
          <g>
            {/* Rows of soldiers — staggered for depth */}
            {Array.from({ length: 30 }, (_, i) => {
              const row = Math.floor(i / 10)
              const col = i % 10
              const x = 30 + col * 55 + row * 18 + (col % 2) * 25
              const h = 22 + (i % 5) * 8 + (2 - row) * 10
              const y = 340 - h + row * 12
              const shade = row === 0 ? '#1a2a4c' : row === 1 ? '#152040' : '#101832'
              return (
                <g key={`p-${i}`} opacity={1 - row * 0.15}>
                  <rect x={x} y={y} width="7" height={h} rx="3" fill={shade} />
                  <circle cx={x + 3.5} cy={y - 3} r="3.5" fill={shade} />
                  <line x1={x + 3.5} y1={y - 28} x2={x + 3.5} y2={y - 3} stroke="#444" strokeWidth="0.8" />
                  {/* Spear tip */}
                  <path d={`M${x + 1.5},${y - 28} L${x + 3.5},${y - 34} L${x + 5.5},${y - 28}`} fill="#556" />
                </g>
              )
            })}
            {/* Battle standard — Pandava (Hanuman flag) */}
            <rect x="280" y="220" width="3" height="90" fill="#666" />
            <path d="M283,220 L320,230 L283,242" fill="#2a4a8c" opacity="0.7">
              <animate attributeName="d" values="M283,220 L320,230 L283,242;M283,220 L318,232 L283,244;M283,220 L320,230 L283,242" dur="3s" repeatCount="indefinite" />
            </path>
            {/* Second banner */}
            <rect x="420" y="240" width="2.5" height="70" fill="#555" />
            <path d="M422.5,240 L450,248 L422.5,258" fill="#3a6aac" opacity="0.6">
              <animate attributeName="d" values="M422.5,240 L450,248 L422.5,258;M422.5,240 L448,250 L422.5,260;M422.5,240 L450,248 L422.5,258" dur="3.5s" repeatCount="indefinite" />
            </path>
          </g>

          {/* === Kaurava (right) === */}
          <g>
            {Array.from({ length: 30 }, (_, i) => {
              const row = Math.floor(i / 10)
              const col = i % 10
              const x = 1380 + col * 55 - row * 18 - (col % 2) * 25
              const h = 22 + (i % 5) * 8 + (2 - row) * 10
              const y = 340 - h + row * 12
              const shade = row === 0 ? '#4c1a1a' : row === 1 ? '#401520' : '#321018'
              return (
                <g key={`k-${i}`} opacity={1 - row * 0.15}>
                  <rect x={x} y={y} width="7" height={h} rx="3" fill={shade} />
                  <circle cx={x + 3.5} cy={y - 3} r="3.5" fill={shade} />
                  <line x1={x + 3.5} y1={y - 28} x2={x + 3.5} y2={y - 3} stroke="#444" strokeWidth="0.8" />
                  <path d={`M${x + 1.5},${y - 28} L${x + 3.5},${y - 34} L${x + 5.5},${y - 28}`} fill="#655" />
                </g>
              )
            })}
            {/* Kaurava banner */}
            <rect x="1620" y="220" width="3" height="90" fill="#666" />
            <path d="M1620,220 L1583,230 L1620,242" fill="#8c2a2a" opacity="0.7">
              <animate attributeName="d" values="M1620,220 L1583,230 L1620,242;M1620,220 L1585,232 L1620,244;M1620,220 L1583,230 L1620,242" dur="2.8s" repeatCount="indefinite" />
            </path>
          </g>
        </svg>
      </motion.div>

      {/* === LAYER 5: CHARIOT === */}
      <div
        className="absolute bottom-[10%] left-1/2"
        style={{
          transform: reduceMotion
            ? 'translateX(-50%)'
            : `translateX(calc(-50% + ${mouseOffset.x * -2}px))`,
          transition: 'transform 0.35s ease-out',
        }}
      >
        <motion.svg
          width="480" height="160" viewBox="0 0 480 160"
          animate={{ opacity: isVishwaroop ? 0.25 : 0.55 }}
          transition={{ duration: 2 }}
        >
          <defs>
            <linearGradient id="chariot-wood" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a3520" />
              <stop offset="100%" stopColor="#2a1a10" />
            </linearGradient>
            <linearGradient id="wheel-metal" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#8B7355" />
              <stop offset="100%" stopColor="#5C4830" />
            </linearGradient>
          </defs>

          {/* Chariot platform */}
          <path d="M130,85 Q125,55 140,45 L310,45 Q325,55 320,85 Z" fill="url(#chariot-wood)" />
          {/* Railing with ornate top */}
          <path d="M135,45 L135,20 Q140,15 145,20" fill="none" stroke="#5C4830" strokeWidth="2" />
          <path d="M315,45 L315,20 Q320,15 325,20" fill="none" stroke="#5C4830" strokeWidth="2" />
          <path d="M145,18 L305,18" fill="none" stroke="#5C4830" strokeWidth="1.5" />
          {/* Canopy arch */}
          <path d="M150,18 Q225,-5 300,18" fill="none" stroke="#6B5540" strokeWidth="2.5" />
          {/* Canopy drape */}
          <path d="M160,16 Q225,8 290,16" fill="#5C1F1F" opacity="0.4" stroke="#8B3A3A" strokeWidth="0.5" />
          {/* Gold trim on chariot */}
          <path d="M130,85 Q125,55 140,45 L310,45 Q325,55 320,85" fill="none" stroke="#DAA520" strokeWidth="1" opacity="0.4" />

          {/* Left wheel with full spokes */}
          <g>
            <circle cx="155" cy="105" r="22" fill="none" stroke="url(#wheel-metal)" strokeWidth="3" />
            <circle cx="155" cy="105" r="4" fill="#8B7355" />
            {[0, 30, 60, 90, 120, 150].map((a, i) => {
              const rad = (a * Math.PI) / 180
              return (
                <line
                  key={`lspoke-${i}`}
                  x1={155 + Math.cos(rad) * 5}
                  y1={105 + Math.sin(rad) * 5}
                  x2={155 + Math.cos(rad) * 20}
                  y2={105 + Math.sin(rad) * 20}
                  stroke="#8B7355" strokeWidth="1.2"
                />
              )
            })}
          </g>

          {/* Right wheel */}
          <g>
            <circle cx="295" cy="105" r="22" fill="none" stroke="url(#wheel-metal)" strokeWidth="3" />
            <circle cx="295" cy="105" r="4" fill="#8B7355" />
            {[0, 30, 60, 90, 120, 150].map((a, i) => {
              const rad = (a * Math.PI) / 180
              return (
                <line
                  key={`rspoke-${i}`}
                  x1={295 + Math.cos(rad) * 5}
                  y1={105 + Math.sin(rad) * 5}
                  x2={295 + Math.cos(rad) * 20}
                  y2={105 + Math.sin(rad) * 20}
                  stroke="#8B7355" strokeWidth="1.2"
                />
              )
            })}
          </g>

          {/* Axle */}
          <line x1="155" y1="105" x2="295" y2="105" stroke="#5C4830" strokeWidth="2" />

          {/* Yoke and horses */}
          <line x1="320" y1="65" x2="380" y2="60" stroke="#5C4830" strokeWidth="2.5" />
          {/* Horse 1 */}
          <g opacity="0.6">
            <ellipse cx="400" cy="55" rx="22" ry="15" fill="#2a1a10" />
            <path d="M418,48 Q425,35 420,30 Q418,35 415,40" fill="#2a1a10" />
            <ellipse cx="395" cy="70" rx="4" ry="14" fill="#2a1a10" />
            <ellipse cx="408" cy="70" rx="4" ry="14" fill="#2a1a10" />
            {/* Mane */}
            <path d="M410,40 Q415,35 412,42 Q417,38 414,45" fill="none" stroke="#1a1010" strokeWidth="1" />
          </g>
          {/* Horse 2 */}
          <g opacity="0.45">
            <ellipse cx="420" cy="50" rx="20" ry="13" fill="#221510" />
            <path d="M436,43 Q442,30 438,26" fill="none" stroke="#221510" strokeWidth="2" />
            <ellipse cx="416" cy="64" rx="3.5" ry="12" fill="#221510" />
            <ellipse cx="427" cy="64" rx="3.5" ry="12" fill="#221510" />
          </g>
          {/* Reins */}
          <path d="M225,35 Q300,30 380,55" fill="none" stroke="#654321" strokeWidth="0.8" opacity="0.5" />
        </motion.svg>
      </div>

      {/* === LAYER 6: GROUND TERRAIN === */}
      <motion.div
        className="absolute bottom-0 left-0 right-0"
        animate={{
          background: isVishwaroop
            ? 'linear-gradient(180deg, transparent 0%, #08001a 25%, #040010 100%)'
            : 'linear-gradient(180deg, transparent 0%, #1a0a10 25%, #0d0508 100%)',
        }}
        transition={{ duration: 2 }}
        style={{ height: '22%' }}
      />

      {/* === LAYER 7: ATMOSPHERIC FOG === */}
      <div className="pointer-events-none absolute inset-0">
        {/* Top vignette */}
        <div
          className="absolute inset-x-0 top-0 h-[20%]"
          style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 100%)' }}
        />
        {/* Bottom vignette */}
        <div
          className="absolute inset-x-0 bottom-0 h-[30%]"
          style={{ background: 'linear-gradient(0deg, rgba(0,0,0,0.7) 0%, transparent 100%)' }}
        />
        {/* Fog bank 1 */}
        <motion.div
          className="absolute bottom-[12%] left-0 right-0 h-[10%]"
          animate={{
            x: ['-3%', '3%', '-3%'],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: `linear-gradient(0deg, transparent 0%, ${isVishwaroop ? 'rgba(100,60,180,0.12)' : 'rgba(180,140,100,0.12)'} 50%, transparent 100%)`,
          }}
        />
        {/* Fog bank 2 — counter drift */}
        <motion.div
          className="absolute bottom-[18%] left-0 right-0 h-[8%]"
          animate={{
            x: ['2%', '-4%', '2%'],
            opacity: [0.1, 0.2, 0.1],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: `linear-gradient(0deg, transparent 0%, ${isVishwaroop ? 'rgba(80,40,160,0.08)' : 'rgba(160,120,80,0.08)'} 50%, transparent 100%)`,
          }}
        />
        {/* Dust motes near ground */}
        <motion.div
          className="absolute bottom-[8%] left-[10%] right-[10%] h-[6%]"
          animate={{
            x: ['-1%', '2%', '-1%'],
            opacity: [0.08, 0.15, 0.08],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
          style={{
            background: `radial-gradient(ellipse 120% 100%, ${isVishwaroop ? 'rgba(100,60,180,0.1)' : 'rgba(200,160,100,0.1)'} 0%, transparent 70%)`,
          }}
        />
      </div>
    </div>
  )
}
