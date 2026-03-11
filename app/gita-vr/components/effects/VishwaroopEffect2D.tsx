/**
 * VishwaroopEffect2D — Cosmic form visual effect (Chapter 11)
 *
 * When sceneState === 'vishwaroop', displays:
 * - Screen flash (white → gold → fade)
 * - Cosmic radial burst animation
 * - Multiple faded Krishna silhouettes at various scales
 * - Orbiting light orbs
 * - Background color shifts to deep cosmic purple
 *
 * Pure CSS/DOM animation — no WebGL.
 */

'use client'

import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function VishwaroopEffect2D() {
  const sceneState = useGitaVRStore((s) => s.sceneState)

  if (sceneState !== 'vishwaroop') return null

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Flash overlay — fades in then out */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(circle at 40% 50%, rgba(255,215,0,0.4) 0%, rgba(138,43,226,0.2) 50%, transparent 100%)',
          animation: 'vishwa-flash 3s ease-out forwards',
        }}
      />

      {/* Cosmic radial burst lines */}
      <div
        className="absolute left-[40%] top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{
          width: '800px',
          height: '800px',
          animation: 'vishwa-burst-spin 30s linear infinite',
        }}
      >
        {Array.from({ length: 12 }, (_, i) => (
          <div
            key={`ray-${i}`}
            className="absolute left-1/2 top-1/2 origin-center"
            style={{
              width: '2px',
              height: '400px',
              background: `linear-gradient(180deg, transparent 0%, rgba(255,215,0,${0.1 + (i % 3) * 0.05}) 30%, rgba(138,43,226,${0.1 + (i % 3) * 0.03}) 70%, transparent 100%)`,
              transform: `translate(-50%, -100%) rotate(${i * 30}deg)`,
            }}
          />
        ))}
      </div>

      {/* Orbiting cosmic orbs */}
      {Array.from({ length: 8 }, (_, i) => {
        const _angle = (i / 8) * 360
        const _radius = 150 + (i % 3) * 60
        const duration = 8 + i * 2
        const size = 6 + (i % 4) * 4
        const colors = ['#FFD700', '#8A2BE2', '#FF69B4', '#00CED1', '#FF4500', '#7B68EE', '#FFD700', '#FF1493']
        return (
          <div
            key={`orb-${i}`}
            className="absolute left-[40%] top-1/2"
            style={{
              width: `${size}px`,
              height: `${size}px`,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${colors[i]} 0%, transparent 70%)`,
              boxShadow: `0 0 ${size * 2}px ${colors[i]}`,
              animation: `vishwa-orbit-${i} ${duration}s linear infinite`,
              transformOrigin: `0 0`,
            }}
          />
        )
      })}

      {/* Multiple faded Krishna echoes (cosmic form illusion) */}
      {[0.6, 1.2, 1.8].map((scale, i) => (
        <div
          key={`echo-${i}`}
          className="absolute left-[40%] top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            width: '280px',
            height: '520px',
            transform: `translate(-50%, -50%) scale(${scale}) rotate(${(i - 1) * 8}deg)`,
            opacity: 0.08 - i * 0.02,
            background: `radial-gradient(ellipse, rgba(255,215,0,0.15) 0%, rgba(138,43,226,0.1) 40%, transparent 70%)`,
            borderRadius: '50%',
            animation: `vishwa-echo ${6 + i * 2}s ease-in-out infinite`,
          }}
        />
      ))}

      {/* Cosmic dust particles */}
      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 1920 1080">
        {Array.from({ length: 40 }, (_, i) => {
          const cx = ((i * 197) % 1920)
          const cy = ((i * 131) % 1080)
          const r = 1 + (i % 3)
          const colors = ['#FFD700', '#8A2BE2', '#FF69B4', '#00CED1']
          return (
            <circle
              key={`particle-${i}`}
              cx={cx}
              cy={cy}
              r={r}
              fill={colors[i % 4]}
              opacity="0.6"
            >
              <animate
                attributeName="opacity"
                values="0;0.6;0"
                dur={`${2 + (i % 3)}s`}
                begin={`${(i % 5) * 0.5}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="cy"
                values={`${cy};${cy - 50};${cy}`}
                dur={`${4 + (i % 4)}s`}
                repeatCount="indefinite"
              />
            </circle>
          )
        })}
      </svg>

      <style>{`
        @keyframes vishwa-flash {
          0% { opacity: 0; }
          10% { opacity: 1; }
          100% { opacity: 0.3; }
        }

        @keyframes vishwa-burst-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes vishwa-echo {
          0%, 100% { opacity: 0.06; }
          50% { opacity: 0.12; }
        }

        ${Array.from({ length: 8 }, (_, i) => {
          const radius = 150 + (i % 3) * 60
          return `
            @keyframes vishwa-orbit-${i} {
              from { transform: rotate(${(i / 8) * 360}deg) translateX(${radius}px); }
              to { transform: rotate(${(i / 8) * 360 + 360}deg) translateX(${radius}px); }
            }
          `
        }).join('\n')}

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
