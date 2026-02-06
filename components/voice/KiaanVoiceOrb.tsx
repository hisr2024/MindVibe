/**
 * KiaanVoiceOrb - The living visual soul of KIAAN
 *
 * A mesmerizing animated orb that serves as the primary interaction point
 * for the Voice Companion. It reacts to:
 * - Voice activity (scales with audio volume)
 * - Emotional state (changes gradient colors)
 * - Companion state (idle/listening/processing/speaking/breathing)
 *
 * Uses pure CSS animations + inline styles for 60fps performance.
 * No canvas/WebGL dependency for broad device support.
 */

'use client'

import { useMemo } from 'react'

export type OrbState =
  | 'idle'
  | 'wake-listening'
  | 'listening'
  | 'processing'
  | 'speaking'
  | 'breathing'
  | 'error'

export type OrbEmotion =
  | 'neutral'
  | 'anxiety'
  | 'sadness'
  | 'anger'
  | 'confusion'
  | 'peace'
  | 'hope'
  | 'love'

interface KiaanVoiceOrbProps {
  state: OrbState
  emotion?: OrbEmotion
  /** Audio volume level 0-1, drives orb scale reactivity */
  volume?: number
  /** Size of the orb in pixels */
  size?: number
  /** Click handler for the orb (mic toggle) */
  onClick?: () => void
  /** Whether the orb is disabled */
  disabled?: boolean
}

// Emotion-to-gradient mapping for the orb's color soul
const EMOTION_GRADIENTS: Record<OrbEmotion, { from: string; via: string; to: string }> = {
  neutral:   { from: '#f97316', via: '#fb923c', to: '#0ea5e9' },   // sunrise-ocean (brand)
  anxiety:   { from: '#f59e0b', via: '#fbbf24', to: '#d97706' },   // amber warmth
  sadness:   { from: '#3b82f6', via: '#60a5fa', to: '#6366f1' },   // calming blue-indigo
  anger:     { from: '#ef4444', via: '#f87171', to: '#f97316' },   // red to cooling orange
  confusion: { from: '#8b5cf6', via: '#a78bfa', to: '#6366f1' },   // clarifying violet
  peace:     { from: '#10b981', via: '#34d399', to: '#06b6d4' },   // serene emerald-cyan
  hope:      { from: '#eab308', via: '#fde047', to: '#f97316' },   // radiant gold
  love:      { from: '#ec4899', via: '#f472b6', to: '#f43f5e' },   // divine rose
}

// State-based animation configurations
const STATE_CONFIG: Record<OrbState, {
  baseScale: number
  pulseAnimation: string
  glowOpacity: number
  ringColor: string
  ringAnimation: string
}> = {
  idle: {
    baseScale: 1,
    pulseAnimation: 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    glowOpacity: 0.15,
    ringColor: 'rgba(255,255,255,0.08)',
    ringAnimation: 'none',
  },
  'wake-listening': {
    baseScale: 1.02,
    pulseAnimation: 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    glowOpacity: 0.2,
    ringColor: 'rgba(16,185,129,0.25)',
    ringAnimation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
  },
  listening: {
    baseScale: 1.05,
    pulseAnimation: 'none', // Volume-driven instead
    glowOpacity: 0.4,
    ringColor: 'rgba(249,115,22,0.3)',
    ringAnimation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
  },
  processing: {
    baseScale: 1,
    pulseAnimation: 'orbProcess 1.5s ease-in-out infinite',
    glowOpacity: 0.3,
    ringColor: 'rgba(14,165,233,0.25)',
    ringAnimation: 'spin 3s linear infinite',
  },
  speaking: {
    baseScale: 1.03,
    pulseAnimation: 'orbSpeak 0.8s ease-in-out infinite',
    glowOpacity: 0.35,
    ringColor: 'rgba(168,85,247,0.25)',
    ringAnimation: 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
  },
  breathing: {
    baseScale: 1,
    pulseAnimation: 'orbBreathe 6s ease-in-out infinite',
    glowOpacity: 0.25,
    ringColor: 'rgba(16,185,129,0.2)',
    ringAnimation: 'orbBreathe 6s ease-in-out infinite',
  },
  error: {
    baseScale: 0.95,
    pulseAnimation: 'none',
    glowOpacity: 0.2,
    ringColor: 'rgba(239,68,68,0.2)',
    ringAnimation: 'none',
  },
}

export default function KiaanVoiceOrb({
  state,
  emotion = 'neutral',
  volume = 0,
  size = 160,
  onClick,
  disabled = false,
}: KiaanVoiceOrbProps) {
  const gradient = EMOTION_GRADIENTS[emotion] || EMOTION_GRADIENTS.neutral
  const config = STATE_CONFIG[state] || STATE_CONFIG.idle

  // Volume-reactive scale: only when listening or speaking
  const volumeScale = useMemo(() => {
    if (state === 'listening') return 1 + volume * 0.25
    if (state === 'speaking') return 1 + volume * 0.12
    return 1
  }, [state, volume])

  const totalScale = config.baseScale * volumeScale

  // Icon for center of orb
  const orbIcon = useMemo(() => {
    const iconSize = size * 0.22
    const strokeWidth = 1.8

    switch (state) {
      case 'listening':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )
      case 'processing':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg animate-spin" style={{ animationDuration: '2s' }}>
            <circle cx="12" cy="12" r="10" strokeDasharray="32 32" />
          </svg>
        )
      case 'speaking':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg">
            <path d="M9 18V5l12-2v13" />
            <circle cx="6" cy="18" r="3" />
            <circle cx="18" cy="16" r="3" />
          </svg>
        )
      case 'breathing':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg">
            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
            <path d="M12 6v6l4 2" />
          </svg>
        )
      case 'error':
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="#fca5a5" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        )
      default:
        // idle / wake-listening: Om symbol via SVG path
        return (
          <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-lg opacity-80">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="23" />
            <line x1="8" y1="23" x2="16" y2="23" />
          </svg>
        )
    }
  }, [state, size])

  return (
    <>
      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes orbProcess {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.06); }
        }
        @keyframes orbSpeak {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.04); }
        }
        @keyframes orbBreathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.15); }
        }
        @keyframes orbGlowRotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>

      <button
        onClick={onClick}
        disabled={disabled}
        className="relative flex items-center justify-center focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent rounded-full transition-opacity"
        style={{
          width: size + 60,
          height: size + 60,
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
        aria-label={
          state === 'listening' ? 'Stop listening' :
          state === 'speaking' || state === 'processing' ? 'Stop KIAAN' :
          'Start speaking to KIAAN'
        }
      >
        {/* Outer ring - state indicator */}
        <div
          className="absolute rounded-full"
          style={{
            width: size + 40,
            height: size + 40,
            border: `2px solid ${config.ringColor}`,
            animation: config.ringAnimation,
          }}
        />

        {/* Second ring - subtle accent */}
        <div
          className="absolute rounded-full"
          style={{
            width: size + 24,
            height: size + 24,
            border: `1px solid rgba(255,255,255,0.04)`,
            animation: state === 'breathing' ? 'orbBreathe 6s ease-in-out infinite reverse' : 'none',
          }}
        />

        {/* Ambient glow layer */}
        <div
          className="absolute rounded-full blur-xl"
          style={{
            width: size + 20,
            height: size + 20,
            background: `radial-gradient(circle, ${gradient.from}${Math.round(config.glowOpacity * 255).toString(16).padStart(2, '0')}, transparent 70%)`,
            animation: 'orbGlowRotate 8s linear infinite',
          }}
        />

        {/* Main orb body */}
        <div
          className="absolute rounded-full shadow-2xl"
          style={{
            width: size,
            height: size,
            background: `
              radial-gradient(circle at 35% 35%, ${gradient.via}40, transparent 50%),
              radial-gradient(circle at 65% 65%, ${gradient.to}30, transparent 50%),
              linear-gradient(135deg, ${gradient.from}, ${gradient.via}, ${gradient.to})
            `,
            transform: `scale(${totalScale})`,
            transition: state === 'listening' ? 'transform 0.08s ease-out' : 'transform 0.3s ease-out',
            animation: config.pulseAnimation,
            boxShadow: `
              0 0 ${20 + volume * 40}px ${gradient.from}${Math.round((0.2 + volume * 0.3) * 255).toString(16).padStart(2, '0')},
              0 0 ${40 + volume * 60}px ${gradient.via}${Math.round((0.1 + volume * 0.15) * 255).toString(16).padStart(2, '0')},
              inset 0 0 30px rgba(255,255,255,0.1)
            `,
          }}
        >
          {/* Inner glass highlight */}
          <div
            className="absolute rounded-full"
            style={{
              top: '8%',
              left: '15%',
              width: '45%',
              height: '35%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 100%)',
              borderRadius: '50%',
            }}
          />
        </div>

        {/* Floating animation wrapper for icon */}
        <div
          className="relative z-10 flex items-center justify-center"
          style={{
            animation: state === 'idle' || state === 'wake-listening' ? 'orbFloat 3s ease-in-out infinite' : 'none',
          }}
        >
          {orbIcon}
        </div>

        {/* Volume ripple rings (listening mode) */}
        {state === 'listening' && volume > 0.1 && (
          <>
            <div
              className="absolute rounded-full border border-white/10"
              style={{
                width: size + volume * 50,
                height: size + volume * 50,
                transition: 'all 0.15s ease-out',
                opacity: volume * 0.5,
              }}
            />
            <div
              className="absolute rounded-full border border-white/5"
              style={{
                width: size + volume * 80,
                height: size + volume * 80,
                transition: 'all 0.2s ease-out',
                opacity: volume * 0.3,
              }}
            />
          </>
        )}
      </button>
    </>
  )
}
