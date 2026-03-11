/**
 * BattlefieldBackdrop — Layered cinematic Kurukshetra scene
 *
 * Multi-layer CSS/SVG composition creating depth illusion:
 * Layer 1: Sunset sky gradient (amber → crimson → deep purple)
 * Layer 2: Distant hills and army silhouettes
 * Layer 3: Chariot platform + foreground terrain
 * Layer 4: Atmospheric haze/fog overlays
 *
 * Subtle parallax on mouse movement for immersive depth.
 * Pure CSS/SVG — no WebGL required.
 */

'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function BattlefieldBackdrop() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 })
  const sceneState = useGitaVRStore((s) => s.sceneState)

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
    if (!el) return

    // Check for reduced motion preference
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    el.addEventListener('mousemove', handleMouseMove)
    return () => el.removeEventListener('mousemove', handleMouseMove)
  }, [handleMouseMove])

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Layer 0: Sky gradient */}
      <div
        className="absolute inset-0 transition-all duration-[2000ms]"
        style={{
          background: isVishwaroop
            ? 'linear-gradient(180deg, #0a0015 0%, #1a0040 25%, #2d1b69 50%, #4a1a8a 75%, #0a0015 100%)'
            : 'linear-gradient(180deg, #1a0a20 0%, #2d1528 15%, #5c2a1a 35%, #c4622a 55%, #e8943a 70%, #f0a830 80%, #2d1528 95%)',
        }}
      />

      {/* Layer 1: Stars (visible in darker scenes) */}
      <div
        className="absolute inset-0 transition-opacity duration-[2000ms]"
        style={{ opacity: isVishwaroop ? 0.8 : 0.15 }}
      >
        <svg className="h-full w-full" viewBox="0 0 1920 1080" preserveAspectRatio="xMidYMid slice">
          {Array.from({ length: 60 }, (_, i) => (
            <circle
              key={`star-${i}`}
              cx={((i * 137.5) % 1920)}
              cy={((i * 97.3) % 600)}
              r={0.5 + (i % 3) * 0.5}
              fill="white"
              opacity={0.3 + (i % 4) * 0.15}
            >
              <animate
                attributeName="opacity"
                values={`${0.3 + (i % 4) * 0.15};${0.6 + (i % 3) * 0.1};${0.3 + (i % 4) * 0.15}`}
                dur={`${3 + (i % 4)}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}
        </svg>
      </div>

      {/* Layer 2: Sun/moon disc */}
      <div
        className="absolute transition-all duration-[2000ms]"
        style={{
          width: isVishwaroop ? '200px' : '120px',
          height: isVishwaroop ? '200px' : '120px',
          left: '65%',
          top: isVishwaroop ? '10%' : '28%',
          background: isVishwaroop
            ? 'radial-gradient(circle, rgba(138,43,226,0.6) 0%, rgba(75,0,130,0.3) 40%, transparent 70%)'
            : 'radial-gradient(circle, rgba(240,168,48,0.8) 0%, rgba(196,98,42,0.4) 40%, transparent 70%)',
          borderRadius: '50%',
          transform: `translate(${mouseOffset.x * -5}px, ${mouseOffset.y * -3}px)`,
        }}
      />

      {/* Layer 3: Distant mountains/hills silhouette */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '55%',
          transform: `translateX(${mouseOffset.x * -3}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        <svg className="h-full w-full" viewBox="0 0 1920 600" preserveAspectRatio="none">
          {/* Far mountains */}
          <path
            d="M0,350 Q200,200 400,300 Q600,180 800,280 Q1000,150 1200,250 Q1400,170 1600,280 Q1800,220 1920,300 L1920,600 L0,600Z"
            fill={isVishwaroop ? '#1a0040' : '#2d1528'}
            opacity="0.8"
          />
          {/* Near hills */}
          <path
            d="M0,420 Q150,360 350,400 Q550,340 750,380 Q950,320 1150,370 Q1350,330 1550,380 Q1750,350 1920,400 L1920,600 L0,600Z"
            fill={isVishwaroop ? '#0d0020' : '#1a0a15'}
            opacity="0.9"
          />
        </svg>
      </div>

      {/* Layer 4: Army silhouettes (left — Pandava, right — Kaurava) */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '40%',
          transform: `translateX(${mouseOffset.x * -6}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        <svg className="h-full w-full" viewBox="0 0 1920 450" preserveAspectRatio="none">
          {/* Left army — Pandava silhouettes */}
          <g opacity={isVishwaroop ? 0.2 : 0.5}>
            {Array.from({ length: 20 }, (_, i) => {
              const x = 50 + i * 40 + (i % 3) * 15
              const h = 30 + (i % 4) * 10
              return (
                <g key={`pandava-${i}`}>
                  {/* Soldier body */}
                  <rect x={x} y={350 - h} width="8" height={h} rx="3" fill="#1a2a4c" />
                  {/* Spear */}
                  <line x1={x + 4} y1={350 - h - 25} x2={x + 4} y2={350 - h} stroke="#3a3a3a" strokeWidth="1" />
                  {/* Head */}
                  <circle cx={x + 4} cy={350 - h - 4} r="4" fill="#1a2a4c" />
                </g>
              )
            })}
            {/* Pandava battle flags */}
            <rect x="200" y="240" width="3" height="70" fill="#555" />
            <rect x="203" y="240" width="20" height="15" fill="#3a5a9c" opacity="0.7" />
          </g>

          {/* Right army — Kaurava silhouettes */}
          <g opacity={isVishwaroop ? 0.2 : 0.5}>
            {Array.from({ length: 20 }, (_, i) => {
              const x = 1420 + i * 40 - (i % 3) * 15
              const h = 30 + (i % 4) * 10
              return (
                <g key={`kaurava-${i}`}>
                  <rect x={x} y={350 - h} width="8" height={h} rx="3" fill="#4c1a1a" />
                  <line x1={x + 4} y1={350 - h - 25} x2={x + 4} y2={350 - h} stroke="#3a3a3a" strokeWidth="1" />
                  <circle cx={x + 4} cy={350 - h - 4} r="4" fill="#4c1a1a" />
                </g>
              )
            })}
            <rect x="1700" y="240" width="3" height="70" fill="#555" />
            <rect x="1703" y="240" width="20" height="15" fill="#9c3a3a" opacity="0.7" />
          </g>
        </svg>
      </div>

      {/* Layer 5: Ground/terrain */}
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: '25%',
          background: isVishwaroop
            ? 'linear-gradient(180deg, transparent 0%, #0a0015 30%, #050008 100%)'
            : 'linear-gradient(180deg, transparent 0%, #1a0a10 30%, #0d0508 100%)',
        }}
      />

      {/* Layer 6: Chariot silhouette (center) */}
      <div
        className="absolute bottom-[12%] left-1/2 -translate-x-1/2"
        style={{
          transform: `translateX(calc(-50% + ${mouseOffset.x * -2}px))`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        <svg width="400" height="120" viewBox="0 0 400 120" opacity={isVishwaroop ? 0.3 : 0.6}>
          {/* Chariot body */}
          <path
            d="M120,80 L100,50 L300,50 L280,80 Z"
            fill="#2a1a10"
            stroke="#3a2a15"
            strokeWidth="1"
          />
          {/* Chariot wheels */}
          <circle cx="140" cy="90" r="18" fill="none" stroke="#3a2a15" strokeWidth="2" />
          <circle cx="260" cy="90" r="18" fill="none" stroke="#3a2a15" strokeWidth="2" />
          {/* Wheel spokes */}
          {[0, 45, 90, 135].map((angle, i) => (
            <g key={`spoke-${i}`}>
              <line
                x1={140 + Math.cos((angle * Math.PI) / 180) * 5}
                y1={90 + Math.sin((angle * Math.PI) / 180) * 5}
                x2={140 + Math.cos((angle * Math.PI) / 180) * 16}
                y2={90 + Math.sin((angle * Math.PI) / 180) * 16}
                stroke="#3a2a15" strokeWidth="1"
              />
              <line
                x1={260 + Math.cos((angle * Math.PI) / 180) * 5}
                y1={90 + Math.sin((angle * Math.PI) / 180) * 5}
                x2={260 + Math.cos((angle * Math.PI) / 180) * 16}
                y2={90 + Math.sin((angle * Math.PI) / 180) * 16}
                stroke="#3a2a15" strokeWidth="1"
              />
            </g>
          ))}
          {/* Chariot canopy pole */}
          <line x1="200" y1="50" x2="200" y2="10" stroke="#3a2a15" strokeWidth="2" />
          {/* Canopy */}
          <path d="M150,15 Q200,0 250,15" fill="none" stroke="#5c3a20" strokeWidth="2" />
          {/* Horses hint (simplified) */}
          <path d="M300,60 Q330,40 350,55 Q370,40 390,50" fill="none" stroke="#2a1a10" strokeWidth="2" opacity="0.5" />
        </svg>
      </div>

      {/* Layer 7: Atmospheric fog overlays */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(0deg, rgba(0,0,0,0.6) 0%, transparent 25%),
            linear-gradient(180deg, rgba(0,0,0,0.3) 0%, transparent 15%)
          `,
        }}
      />

      {/* Low fog wisps */}
      <div
        className="absolute bottom-[15%] left-0 right-0 h-[15%] opacity-30"
        style={{
          background: 'linear-gradient(0deg, transparent 0%, rgba(180,140,100,0.15) 50%, transparent 100%)',
          animation: 'fog-drift 20s ease-in-out infinite',
        }}
      />

      <style>{`
        @keyframes fog-drift {
          0%, 100% { transform: translateX(-2%); }
          50% { transform: translateX(2%); }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
