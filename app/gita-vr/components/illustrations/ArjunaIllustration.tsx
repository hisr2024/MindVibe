/**
 * ArjunaIllustration — Cinematic 2D illustration of Arjuna
 *
 * Inline SVG with CSS animations for state-driven poses:
 * - idle: default standing pose
 * - distressed: head bowed, dejected posture
 * - listening: looking up at Krishna, attentive
 * - enlightened: upright, radiant, determined
 */

'use client'

import { useMemo } from 'react'
import { useGitaVRStore } from '@/stores/gitaVRStore'

const SKIN = '#C68642'
const SKIN_DARK = '#A0522D'
const ARMOR_SILVER = '#708090'
const ARMOR_DARK = '#4A5568'

export default function ArjunaIllustration() {
  const arjunaState = useGitaVRStore((s) => s.arjunaState)

  const stateClass = useMemo(() => {
    switch (arjunaState) {
      case 'distressed': return 'arjuna-distressed'
      case 'listening': return 'arjuna-listening'
      case 'enlightened': return 'arjuna-enlightened'
      default: return 'arjuna-idle'
    }
  }, [arjunaState])

  return (
    <div className={`arjuna-illustration ${stateClass}`} aria-label="Arjuna">
      <style>{`
        .arjuna-illustration {
          position: relative;
          width: 200px;
          height: 440px;
          filter: drop-shadow(0 0 15px rgba(112, 128, 144, 0.2));
          transition: filter 0.8s ease, transform 0.8s ease;
        }

        .arjuna-illustration svg {
          width: 100%;
          height: 100%;
        }

        /* Idle — subtle breathing */
        .arjuna-idle .arjuna-body {
          animation: arjuna-breathe 4.5s ease-in-out infinite;
        }

        /* Distressed — slumped posture */
        .arjuna-distressed {
          transform: translateY(10px);
          filter: drop-shadow(0 0 10px rgba(100, 100, 100, 0.15));
        }
        .arjuna-distressed .arjuna-head {
          animation: head-droop 5s ease-in-out infinite;
        }
        .arjuna-distressed .arjuna-body {
          animation: arjuna-breathe-slow 6s ease-in-out infinite;
        }

        /* Listening — attentive, looking up */
        .arjuna-listening .arjuna-head {
          animation: look-up 4s ease-in-out infinite;
        }
        .arjuna-listening .arjuna-body {
          animation: arjuna-breathe 4s ease-in-out infinite;
        }

        /* Enlightened — radiant glow */
        .arjuna-enlightened {
          filter: drop-shadow(0 0 30px rgba(255, 215, 0, 0.3));
        }
        .arjuna-enlightened .arjuna-body {
          animation: arjuna-breathe 3.5s ease-in-out infinite;
        }

        @keyframes arjuna-breathe {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-2px); }
        }

        @keyframes arjuna-breathe-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-1px); }
        }

        @keyframes head-droop {
          0%, 100% { transform: rotate(8deg) translateY(5px); }
          50% { transform: rotate(10deg) translateY(7px); }
        }

        @keyframes look-up {
          0%, 100% { transform: rotate(-3deg) translateY(-2px); }
          50% { transform: rotate(-5deg) translateY(-3px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .arjuna-illustration * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <svg viewBox="0 0 200 440" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="arjuna-skin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={SKIN} />
            <stop offset="100%" stopColor={SKIN_DARK} />
          </linearGradient>
          <linearGradient id="arjuna-armor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={ARMOR_SILVER} />
            <stop offset="100%" stopColor={ARMOR_DARK} />
          </linearGradient>
          <filter id="arjuna-glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="arjuna-body">
          {/* === LOWER BODY (Dhoti) === */}
          <path
            d="M80,250 Q75,290 78,340 Q80,380 70,400 L130,400 Q120,380 122,340 Q125,290 120,250 Z"
            fill="#8B4513"
            stroke="#654321"
            strokeWidth="0.5"
          />

          {/* === ARMOR / TORSO === */}
          <path
            d="M82,150 Q78,170 80,210 Q82,240 80,250 L120,250 Q118,240 120,210 Q122,170 118,150 Z"
            fill="url(#arjuna-armor)"
            stroke="#2D3748"
            strokeWidth="0.5"
          />
          {/* Armor details */}
          <path d="M90,160 L90,240" fill="none" stroke="#A0AEC0" strokeWidth="0.5" opacity="0.4" />
          <path d="M110,160 L110,240" fill="none" stroke="#A0AEC0" strokeWidth="0.5" opacity="0.4" />
          {/* Chest plate center line */}
          <path d="M100,155 L100,200" fill="none" stroke="#A0AEC0" strokeWidth="1" opacity="0.3" />

          {/* Shoulder guards */}
          <ellipse cx="78" cy="155" rx="12" ry="8" fill={ARMOR_SILVER} stroke={ARMOR_DARK} strokeWidth="0.5" />
          <ellipse cx="122" cy="155" rx="12" ry="8" fill={ARMOR_SILVER} stroke={ARMOR_DARK} strokeWidth="0.5" />

          {/* === LEFT ARM === */}
          <path
            d="M82,155 Q68,175 62,200 Q58,220 60,230"
            fill="none"
            stroke="url(#arjuna-skin)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <circle cx="60" cy="232" r="6" fill={SKIN} />

          {/* === RIGHT ARM (holds Gandiva bow) === */}
          <path
            d="M118,155 Q132,175 136,200 Q138,215 137,225"
            fill="none"
            stroke="url(#arjuna-skin)"
            strokeWidth="14"
            strokeLinecap="round"
          />
          <circle cx="137" cy="227" r="6" fill={SKIN} />

          {/* Gandiva Bow */}
          <path
            d="M142,180 Q160,220 142,280"
            fill="none"
            stroke="#8B4513"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Bow string */}
          <line x1="142" y1="180" x2="142" y2="280" stroke="#C0C0C0" strokeWidth="0.8" />

          {/* === FEET === */}
          <ellipse cx="88" cy="405" rx="12" ry="5" fill={SKIN_DARK} />
          <ellipse cx="118" cy="405" rx="12" ry="5" fill={SKIN_DARK} />

          {/* === HEAD === */}
          <g className="arjuna-head" style={{ transformOrigin: '100px 120px' }}>
            {/* Neck */}
            <rect x="93" y="133" width="14" height="20" rx="7" fill={SKIN} />

            {/* Face */}
            <ellipse cx="100" cy="115" rx="22" ry="26" fill="url(#arjuna-skin)" />

            {/* Hair */}
            <path
              d="M78,112 Q78,88 100,82 Q122,88 122,112"
              fill="#1a1a1a"
            />
            {/* Hair tied back */}
            <path
              d="M100,82 Q100,75 108,78 Q116,82 110,88"
              fill="#1a1a1a"
            />

            {/* Eyes */}
            <ellipse cx="91" cy="112" rx="5" ry="3.5" fill="#FFFFF0" />
            <ellipse cx="109" cy="112" rx="5" ry="3.5" fill="#FFFFF0" />
            <circle cx="92" cy="112" r="2.5" fill="#2D1B00" />
            <circle cx="110" cy="112" r="2.5" fill="#2D1B00" />

            {/* Eyebrows — warrior-like, defined */}
            <path d="M84,106 Q91,103 98,106" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />
            <path d="M102,106 Q109,103 116,106" fill="none" stroke="#1a1a1a" strokeWidth="1.5" />

            {/* Nose */}
            <path d="M100,114 Q98,120 100,124" fill="none" stroke={SKIN_DARK} strokeWidth="0.8" />

            {/* Expression — neutral/slight concern */}
            <path
              d="M93,128 Q97,130 100,130 Q103,130 107,128"
              fill="none"
              stroke="#654321"
              strokeWidth="1"
              strokeLinecap="round"
            />

            {/* Kirita (warrior crown / headband) */}
            <path
              d="M78,98 L122,98"
              fill="none"
              stroke="#DAA520"
              strokeWidth="3"
            />
            {/* Crown center gem */}
            <circle cx="100" cy="97" r="4" fill="#4169E1" filter="url(#arjuna-glow)" />
          </g>
        </g>
      </svg>
    </div>
  )
}
