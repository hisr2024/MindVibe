'use client'

/**
 * CompanionMoodRing - The KIAAN Orb
 *
 * A stunning multi-layered animated orb that serves as KIAAN's visual presence.
 * Shifts colors based on mood, breathes gently, pulses when speaking,
 * and ripples when listening. The centerpiece of the orb-based UI.
 */

import { useEffect, useState } from 'react'

interface MoodRingProps {
  mood: string
  intensity?: number
  isListening?: boolean
  isSpeaking?: boolean
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const MOOD_COLORS: Record<string, { from: string; via: string; to: string; glow: string }> = {
  happy: { from: '#f59e0b', via: '#f97316', to: '#eab308', glow: 'rgba(245,158,11,0.35)' },
  sad: { from: '#3b82f6', via: '#6366f1', to: '#2563eb', glow: 'rgba(59,130,246,0.35)' },
  anxious: { from: '#a855f7', via: '#8b5cf6', to: '#7c3aed', glow: 'rgba(168,85,247,0.35)' },
  angry: { from: '#ef4444', via: '#f43f5e', to: '#dc2626', glow: 'rgba(239,68,68,0.35)' },
  confused: { from: '#f97316', via: '#f59e0b', to: '#ea580c', glow: 'rgba(249,115,22,0.35)' },
  peaceful: { from: '#10b981', via: '#34d399', to: '#059669', glow: 'rgba(16,185,129,0.35)' },
  hopeful: { from: '#eab308', via: '#f59e0b', to: '#fbbf24', glow: 'rgba(234,179,8,0.35)' },
  lonely: { from: '#6366f1', via: '#818cf8', to: '#4f46e5', glow: 'rgba(99,102,241,0.35)' },
  grateful: { from: '#22c55e', via: '#10b981', to: '#16a34a', glow: 'rgba(34,197,94,0.35)' },
  neutral: { from: '#8b5cf6', via: '#a78bfa', to: '#6d28d9', glow: 'rgba(139,92,246,0.35)' },
  excited: { from: '#ec4899', via: '#f43f5e', to: '#db2777', glow: 'rgba(236,72,153,0.35)' },
  overwhelmed: { from: '#64748b', via: '#94a3b8', to: '#475569', glow: 'rgba(100,116,139,0.35)' },
}

const SIZES: Record<string, { container: number; ring: number; inner: number; text: string; glow: number }> = {
  sm: { container: 48, ring: 40, inner: 32, text: 'text-xs', glow: 64 },
  md: { container: 80, ring: 68, inner: 56, text: 'text-lg', glow: 110 },
  lg: { container: 120, ring: 104, inner: 88, text: 'text-2xl', glow: 160 },
  xl: { container: 200, ring: 170, inner: 140, text: 'text-5xl', glow: 320 },
}

export default function CompanionMoodRing({
  mood,
  intensity = 0.5,
  isListening = false,
  isSpeaking = false,
  size = 'md',
}: MoodRingProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const colors = MOOD_COLORS[mood] || MOOD_COLORS.neutral
  const s = SIZES[size] || SIZES.md
  const isXL = size === 'xl'
  const isLarge = size === 'lg' || size === 'xl'

  return (
    <div
      className="relative flex items-center justify-center"
      style={{ width: s.container, height: s.container }}
    >
      {/* Layer 1: Deep ambient glow */}
      <div
        className="absolute rounded-full transition-all duration-[2000ms]"
        style={{
          width: s.glow,
          height: s.glow,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${colors.glow} 0%, transparent 70%)`,
          animation: mounted ? 'orb-glow 4s ease-in-out infinite' : undefined,
          opacity: 0.4 + intensity * 0.4,
        }}
      />

      {/* Layer 2: Secondary glow for depth */}
      {isLarge && (
        <div
          className="absolute rounded-full transition-all duration-[2000ms]"
          style={{
            width: s.glow * 0.7,
            height: s.glow * 0.7,
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: `radial-gradient(circle, ${colors.from}44 0%, transparent 70%)`,
            animation: mounted ? 'orb-glow 3s ease-in-out infinite 1s' : undefined,
            opacity: 0.5,
          }}
        />
      )}

      {/* Layer 3: Rotating conic gradient ring */}
      {isLarge && (
        <div
          className="absolute rounded-full"
          style={{
            width: s.ring + (isXL ? 24 : 12),
            height: s.ring + (isXL ? 24 : 12),
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            background: `conic-gradient(from 0deg, ${colors.from}, transparent 25%, ${colors.via}, transparent 50%, ${colors.to}, transparent 75%, ${colors.from})`,
            animation: mounted ? 'orb-rotate 10s linear infinite' : undefined,
            opacity: 0.35,
          }}
        />
      )}

      {/* Layer 4: Speaking ripples */}
      {isSpeaking && (
        <>
          <div
            className="absolute rounded-full"
            style={{
              width: s.ring,
              height: s.ring,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              border: `2px solid ${colors.from}`,
              animation: 'orb-ripple 2s ease-out infinite',
            }}
          />
          <div
            className="absolute rounded-full"
            style={{
              width: s.ring,
              height: s.ring,
              left: '50%',
              top: '50%',
              transform: 'translate(-50%, -50%)',
              border: `2px solid ${colors.via}`,
              animation: 'orb-ripple 2s ease-out infinite 0.6s',
            }}
          />
          {isXL && (
            <div
              className="absolute rounded-full"
              style={{
                width: s.ring,
                height: s.ring,
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                border: `1px solid ${colors.to}`,
                animation: 'orb-ripple 2s ease-out infinite 1.2s',
              }}
            />
          )}
        </>
      )}

      {/* Layer 5: Main orb body - gradient sphere */}
      <div
        className="absolute rounded-full transition-all duration-1000"
        style={{
          width: s.ring,
          height: s.ring,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle at 35% 35%, ${colors.from}cc, ${colors.via}aa, ${colors.to}88)`,
          boxShadow: `
            0 0 ${isXL ? 40 : 20}px ${colors.glow},
            inset 0 -${isXL ? 20 : 10}px ${isXL ? 40 : 20}px rgba(0,0,0,0.3),
            inset 0 ${isXL ? 10 : 5}px ${isXL ? 20 : 10}px rgba(255,255,255,0.15)
          `,
          animation: isSpeaking
            ? 'orb-speak 1.4s ease-in-out infinite'
            : mounted
            ? 'orb-breathe 5s ease-in-out infinite'
            : undefined,
          opacity: 0.6 + intensity * 0.4,
        }}
      />

      {/* Layer 6: Glass highlight on sphere (top reflection) */}
      {isLarge && (
        <div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: s.ring * 0.7,
            height: s.ring * 0.35,
            left: '50%',
            top: `calc(50% - ${s.ring * 0.18}px)`,
            transform: 'translate(-50%, -50%)',
            background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, transparent 100%)',
            borderRadius: '50%',
          }}
        />
      )}

      {/* Layer 7: Inner dark core */}
      <div
        className="absolute rounded-full flex items-center justify-center transition-all duration-1000"
        style={{
          width: s.inner,
          height: s.inner,
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle at 40% 40%, rgba(15,10,30,0.7), rgba(5,5,15,0.85))',
          backdropFilter: 'blur(12px)',
          border: `1px solid rgba(255,255,255,0.08)`,
          boxShadow: `inset 0 0 ${isXL ? 30 : 15}px rgba(0,0,0,0.4)`,
        }}
      >
        <span
          className={`${s.text} font-bold transition-all duration-500`}
          style={{
            color: `${colors.from}dd`,
            textShadow: `0 0 ${isXL ? 30 : 15}px ${colors.glow}, 0 0 ${isXL ? 60 : 30}px ${colors.glow}`,
            animation: isListening ? 'orb-letter-pulse 1.2s ease-in-out infinite' : undefined,
          }}
        >
          K
        </span>
      </div>

      {/* Layer 8: Orbiting particles (xl only) */}
      {isXL && mounted && (
        <>
          {[0, 1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 3 + (i % 3),
                height: 3 + (i % 3),
                left: '50%',
                top: '50%',
                backgroundColor: i % 2 === 0 ? colors.from : colors.via,
                opacity: 0.5 + (i % 3) * 0.15,
                animation: `orb-particle-${i % 3} ${6 + i * 1.5}s linear infinite`,
                boxShadow: `0 0 4px ${colors.glow}`,
              }}
            />
          ))}
        </>
      )}

      {/* Layer 9: Listening dots */}
      {isListening && (
        <div
          className="absolute flex gap-1.5"
          style={{ bottom: isXL ? -16 : isLarge ? -10 : -8, left: '50%', transform: 'translateX(-50%)' }}
        >
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="rounded-full"
              style={{
                width: isXL ? 6 : 4,
                height: isXL ? 6 : 4,
                backgroundColor: colors.from,
                animation: `orb-dot-bounce 1.2s ease-in-out ${i * 0.15}s infinite`,
                boxShadow: `0 0 6px ${colors.glow}`,
              }}
            />
          ))}
        </div>
      )}

      {/* Keyframe animations */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes orb-glow {
          0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.3; }
          50% { transform: translate(-50%, -50%) scale(1.08); opacity: 0.5; }
        }
        @keyframes orb-rotate {
          0% { transform: translate(-50%, -50%) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes orb-breathe {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.04); }
        }
        @keyframes orb-speak {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.08); }
        }
        @keyframes orb-ripple {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
          100% { transform: translate(-50%, -50%) scale(1.8); opacity: 0; }
        }
        @keyframes orb-letter-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes orb-dot-bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes orb-particle-0 {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(95px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(95px) rotate(-360deg); }
        }
        @keyframes orb-particle-1 {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(105px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(105px) rotate(-360deg); }
        }
        @keyframes orb-particle-2 {
          0% { transform: translate(-50%, -50%) rotate(0deg) translateX(115px) rotate(0deg); }
          100% { transform: translate(-50%, -50%) rotate(360deg) translateX(115px) rotate(-360deg); }
        }
      `}} />
    </div>
  )
}
