/**
 * DivineAura2D — CSS-based golden aura behind Krishna
 *
 * Replaces the GLSL Fresnel shader with pure CSS radial gradients
 * and box-shadow effects. Pulsates gently during idle, intensifies
 * during speaking/blessing states.
 */

'use client'

import { useGitaVRStore } from '@/stores/gitaVRStore'

export default function DivineAura2D() {
  const krishnaState = useGitaVRStore((s) => s.krishnaState)

  const isActive = krishnaState === 'speaking' || krishnaState === 'blessing'

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {/* Primary aura glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-[60%] -translate-y-1/2 rounded-full transition-all duration-1000"
        style={{
          width: isActive ? '500px' : '380px',
          height: isActive ? '600px' : '480px',
          background: `radial-gradient(ellipse,
            rgba(255, 215, 0, ${isActive ? 0.15 : 0.06}) 0%,
            rgba(212, 164, 76, ${isActive ? 0.1 : 0.04}) 30%,
            rgba(212, 164, 76, ${isActive ? 0.05 : 0.02}) 60%,
            transparent 100%
          )`,
          animation: isActive
            ? 'aura-2d-pulse-strong 1.5s ease-in-out infinite'
            : 'aura-2d-pulse 3s ease-in-out infinite',
        }}
      />

      {/* Secondary ring glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-[60%] -translate-y-1/2 rounded-full transition-all duration-1000"
        style={{
          width: isActive ? '300px' : '220px',
          height: isActive ? '380px' : '300px',
          background: `radial-gradient(ellipse,
            rgba(255, 215, 0, ${isActive ? 0.12 : 0.04}) 0%,
            transparent 70%
          )`,
          animation: isActive
            ? 'aura-2d-pulse-strong 2s ease-in-out infinite reverse'
            : 'aura-2d-pulse 4s ease-in-out infinite reverse',
        }}
      />

      <style>{`
        @keyframes aura-2d-pulse {
          0%, 100% { opacity: 0.7; transform: translate(-60%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-60%, -50%) scale(1.05); }
        }

        @keyframes aura-2d-pulse-strong {
          0%, 100% { opacity: 0.8; transform: translate(-60%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-60%, -50%) scale(1.12); }
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation: none !important; }
        }
      `}</style>
    </div>
  )
}
