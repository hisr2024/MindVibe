/**
 * KrishnaIllustration — Cinematic 2D illustration of Lord Krishna
 *
 * Inline SVG with CSS animations for state-driven poses:
 * - idle: gentle breathing sway + subtle aura pulse
 * - speaking: glowing aura intensifies, mouth animates, body sways
 * - listening: head tilts, compassionate expression
 * - blessing: right hand raised in Abhaya mudra
 *
 * Replaces the 3D procedural model with a beautiful illustrated character.
 */

'use client'

import { useMemo } from 'react'
import { useGitaVRStore } from '@/stores/gitaVRStore'

const KRISHNA_BLUE = '#4a7ab5'
const KRISHNA_BLUE_DARK = '#365d8a'
const GOLD = '#d4a44c'
const BRIGHT_GOLD = '#FFD700'
const YELLOW = '#FFD93D'
const PEACOCK_GREEN = '#00695C'
const SKIN_HIGHLIGHT = '#6a9ad5'

export default function KrishnaIllustration() {
  const krishnaState = useGitaVRStore((s) => s.krishnaState)

  const stateClass = useMemo(() => {
    switch (krishnaState) {
      case 'speaking': return 'krishna-speaking'
      case 'listening': return 'krishna-listening'
      case 'blessing': return 'krishna-blessing'
      default: return 'krishna-idle'
    }
  }, [krishnaState])

  return (
    <div className={`krishna-illustration ${stateClass}`} aria-label="Lord Krishna">
      <style>{`
        .krishna-illustration {
          position: relative;
          width: 280px;
          height: 520px;
          filter: drop-shadow(0 0 30px rgba(212, 164, 76, 0.2));
          transition: filter 0.8s ease;
        }

        .krishna-illustration svg {
          width: 100%;
          height: 100%;
        }

        /* Idle breathing animation */
        .krishna-idle .krishna-body {
          animation: breathe 4s ease-in-out infinite;
        }

        /* Speaking state — enhanced glow + sway */
        .krishna-speaking {
          filter: drop-shadow(0 0 50px rgba(212, 164, 76, 0.4));
        }
        .krishna-speaking .krishna-body {
          animation: speak-sway 2s ease-in-out infinite;
        }
        .krishna-speaking .krishna-mouth {
          animation: mouth-move 0.3s ease-in-out infinite alternate;
        }
        .krishna-speaking .krishna-aura-inner {
          animation: aura-pulse-strong 1.5s ease-in-out infinite;
        }

        /* Listening state — head tilt */
        .krishna-listening .krishna-head {
          animation: head-tilt 3s ease-in-out infinite;
        }
        .krishna-listening .krishna-body {
          animation: breathe 4s ease-in-out infinite;
        }

        /* Blessing state — arm raised */
        .krishna-blessing {
          filter: drop-shadow(0 0 60px rgba(255, 215, 0, 0.5));
        }
        .krishna-blessing .krishna-right-arm {
          transform: rotate(-45deg);
          transform-origin: 170px 200px;
          transition: transform 0.8s ease;
        }
        .krishna-blessing .krishna-body {
          animation: breathe 4s ease-in-out infinite;
        }
        .krishna-blessing .krishna-aura-inner {
          animation: aura-pulse-strong 1s ease-in-out infinite;
        }

        /* Aura idle pulse */
        .krishna-aura-inner {
          animation: aura-pulse 3s ease-in-out infinite;
        }

        /* Eye blink */
        .krishna-eyes {
          animation: blink 4s ease-in-out infinite;
        }

        /* Crown jewel sparkle */
        .krishna-crown-jewel {
          animation: sparkle 2s ease-in-out infinite;
        }

        @keyframes breathe {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-3px); }
        }

        @keyframes speak-sway {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          25% { transform: translateY(-2px) rotate(0.5deg); }
          75% { transform: translateY(-1px) rotate(-0.5deg); }
        }

        @keyframes mouth-move {
          0% { transform: scaleY(1); }
          100% { transform: scaleY(1.8); }
        }

        @keyframes head-tilt {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(3deg); }
        }

        @keyframes aura-pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.05); }
        }

        @keyframes aura-pulse-strong {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }

        @keyframes blink {
          0%, 45%, 55%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(0.1); }
        }

        @keyframes sparkle {
          0%, 100% { opacity: 0.6; }
          50% { opacity: 1; }
        }

        @media (prefers-reduced-motion: reduce) {
          .krishna-illustration * {
            animation: none !important;
            transition: none !important;
          }
        }
      `}</style>

      <svg viewBox="0 0 280 520" xmlns="http://www.w3.org/2000/svg">
        <defs>
          {/* Aura gradient */}
          <radialGradient id="krishna-aura" cx="50%" cy="40%" r="50%">
            <stop offset="0%" stopColor={BRIGHT_GOLD} stopOpacity="0.3" />
            <stop offset="60%" stopColor={GOLD} stopOpacity="0.1" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>

          {/* Skin gradient */}
          <linearGradient id="krishna-skin" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={SKIN_HIGHLIGHT} />
            <stop offset="100%" stopColor={KRISHNA_BLUE} />
          </linearGradient>

          {/* Crown gradient */}
          <linearGradient id="crown-gold" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={BRIGHT_GOLD} />
            <stop offset="100%" stopColor={GOLD} />
          </linearGradient>

          {/* Pitambara gradient */}
          <linearGradient id="pitambara" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={YELLOW} />
            <stop offset="100%" stopColor="#E6B800" />
          </linearGradient>

          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="soft-glow">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* === DIVINE AURA (background glow) === */}
        <g className="krishna-aura-inner">
          <ellipse cx="140" cy="200" rx="130" ry="200" fill="url(#krishna-aura)" />
        </g>

        {/* === BODY GROUP === */}
        <g className="krishna-body">

          {/* === PITAMBARA (Yellow dhoti/lower garment) === */}
          <path
            d="M110,290 Q105,320 108,380 Q110,420 95,460 L185,460 Q170,420 172,380 Q175,320 170,290 Z"
            fill="url(#pitambara)"
            stroke="#C9A200"
            strokeWidth="0.5"
          />
          {/* Dhoti drape folds */}
          <path d="M120,300 Q125,350 118,400" fill="none" stroke="#C9A200" strokeWidth="0.8" opacity="0.4" />
          <path d="M155,295 Q150,340 158,390" fill="none" stroke="#C9A200" strokeWidth="0.8" opacity="0.4" />

          {/* === TORSO === */}
          <path
            d="M115,180 Q110,200 112,240 Q114,270 110,290 L170,290 Q166,270 168,240 Q170,200 165,180 Z"
            fill="url(#krishna-skin)"
            stroke={KRISHNA_BLUE_DARK}
            strokeWidth="0.5"
          />

          {/* Sacred thread (Yajnopavita) */}
          <path
            d="M132,185 Q155,200 165,230 Q170,260 155,290"
            fill="none"
            stroke={GOLD}
            strokeWidth="1.5"
            opacity="0.8"
          />

          {/* Vaijayanti garland */}
          <path
            d="M120,185 Q110,210 115,240 Q120,260 140,270 Q160,260 165,240 Q170,210 160,185"
            fill="none"
            stroke="#FF6B6B"
            strokeWidth="2.5"
            opacity="0.6"
            strokeLinecap="round"
          />
          {/* Garland flowers */}
          {[125, 135, 145, 155].map((x, i) => (
            <circle key={`flower-${i}`} cx={x} cy={185 + (i % 2) * 5} r="3" fill="#FF8888" opacity="0.7" />
          ))}

          {/* Kaustubha jewel (center chest) */}
          <circle cx="140" cy="195" r="6" fill="#FF1493" filter="url(#glow)" opacity="0.8" />
          <circle cx="140" cy="195" r="3" fill="#FF69B4" />

          {/* Necklace */}
          <path
            d="M122,186 Q130,192 140,194 Q150,192 158,186"
            fill="none"
            stroke={GOLD}
            strokeWidth="2"
          />

          {/* === LEFT ARM (holding flute) === */}
          <g className="krishna-left-arm">
            {/* Upper arm */}
            <path
              d="M115,185 Q100,200 90,225 Q85,240 88,250"
              fill="none"
              stroke="url(#krishna-skin)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            {/* Hand */}
            <circle cx="88" cy="252" r="8" fill={KRISHNA_BLUE} />
            {/* Bracelet */}
            <ellipse cx="92" cy="235" rx="10" ry="4" fill="none" stroke={GOLD} strokeWidth="2" />

            {/* Flute (Murali) */}
            <rect x="72" y="240" width="55" height="6" rx="3" fill={GOLD} transform="rotate(-15, 100, 243)" />
            {/* Flute holes */}
            {[82, 92, 102, 112].map((x, i) => (
              <circle key={`hole-${i}`} cx={x} cy="241" r="1.5" fill="#B8860B" transform="rotate(-15, 100, 243)" />
            ))}
          </g>

          {/* === RIGHT ARM === */}
          <g className="krishna-right-arm" style={{ transition: 'transform 0.8s ease' }}>
            <path
              d="M165,185 Q180,200 188,225 Q192,240 190,255"
              fill="none"
              stroke="url(#krishna-skin)"
              strokeWidth="18"
              strokeLinecap="round"
            />
            {/* Hand */}
            <circle cx="190" cy="257" r="8" fill={KRISHNA_BLUE} />
            {/* Bracelet */}
            <ellipse cx="186" cy="235" rx="10" ry="4" fill="none" stroke={GOLD} strokeWidth="2" />
          </g>

          {/* === FEET === */}
          <ellipse cx="118" cy="465" rx="15" ry="6" fill={KRISHNA_BLUE} />
          <ellipse cx="162" cy="465" rx="15" ry="6" fill={KRISHNA_BLUE} />
          {/* Anklets */}
          <ellipse cx="118" cy="458" rx="10" ry="3" fill="none" stroke={GOLD} strokeWidth="1.5" />
          <ellipse cx="162" cy="458" rx="10" ry="3" fill="none" stroke={GOLD} strokeWidth="1.5" />

          {/* === HEAD GROUP === */}
          <g className="krishna-head">
            {/* Neck */}
            <rect x="132" y="165" width="16" height="20" rx="8" fill={KRISHNA_BLUE} />

            {/* Face */}
            <ellipse cx="140" cy="145" rx="28" ry="32" fill="url(#krishna-skin)" />

            {/* Hair */}
            <path
              d="M112,140 Q112,110 140,105 Q168,110 168,140"
              fill="#0a0a0a"
            />

            {/* Eyes */}
            <g className="krishna-eyes">
              {/* Eye whites */}
              <ellipse cx="128" cy="142" rx="7" ry="4.5" fill="#FFFFF0" />
              <ellipse cx="152" cy="142" rx="7" ry="4.5" fill="#FFFFF0" />
              {/* Pupils — dark, deep, compassionate */}
              <circle cx="129" cy="142" r="3" fill="#1a1a1a" />
              <circle cx="153" cy="142" r="3" fill="#1a1a1a" />
              {/* Eye sparkle */}
              <circle cx="130" cy="141" r="1" fill="white" opacity="0.8" />
              <circle cx="154" cy="141" r="1" fill="white" opacity="0.8" />
            </g>

            {/* Eyebrows — graceful arches */}
            <path d="M119,134 Q128,130 137,134" fill="none" stroke="#0a0a0a" strokeWidth="1.5" />
            <path d="M143,134 Q152,130 161,134" fill="none" stroke="#0a0a0a" strokeWidth="1.5" />

            {/* Nose */}
            <path d="M140,145 Q138,152 140,156 Q142,156 141,152" fill="none" stroke={KRISHNA_BLUE_DARK} strokeWidth="1" />

            {/* Gentle smile */}
            <g className="krishna-mouth" style={{ transformOrigin: '140px 163px' }}>
              <path
                d="M131,162 Q136,168 140,169 Q144,168 149,162"
                fill="none"
                stroke="#8B4040"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </g>

            {/* Tilak (sacred forehead mark) */}
            <path
              d="M137,125 L140,118 L143,125 Z"
              fill={BRIGHT_GOLD}
              filter="url(#glow)"
            />
            <circle cx="140" cy="127" r="2" fill="#FF4500" />

            {/* Earrings */}
            <circle cx="111" cy="148" r="5" fill={BRIGHT_GOLD} filter="url(#glow)" />
            <circle cx="169" cy="148" r="5" fill={BRIGHT_GOLD} filter="url(#glow)" />

            {/* === CROWN (MUKUT) === */}
            <g>
              {/* Crown base */}
              <path
                d="M115,118 Q115,100 140,90 Q165,100 165,118"
                fill="url(#crown-gold)"
                stroke="#B8860B"
                strokeWidth="0.5"
              />
              {/* Crown peak */}
              <path
                d="M128,100 L140,72 L152,100"
                fill="url(#crown-gold)"
                stroke="#B8860B"
                strokeWidth="0.5"
              />
              {/* Crown ornaments */}
              <circle cx="140" cy="98" r="4" fill="#FF0000" className="krishna-crown-jewel" filter="url(#glow)" />
              <circle cx="125" cy="108" r="3" fill="#0066FF" opacity="0.8" filter="url(#glow)" />
              <circle cx="155" cy="108" r="3" fill="#00FF66" opacity="0.8" filter="url(#glow)" />

              {/* Peacock feather */}
              <g transform="translate(155, 80) rotate(15)">
                {/* Shaft */}
                <line x1="0" y1="0" x2="0" y2="-55" stroke={PEACOCK_GREEN} strokeWidth="1.5" />
                {/* Feather eye */}
                <ellipse cx="0" cy="-50" rx="10" ry="14"
                  fill={PEACOCK_GREEN}
                  stroke="#00897B"
                  strokeWidth="1"
                  opacity="0.9"
                />
                {/* Inner eye */}
                <ellipse cx="0" cy="-50" rx="5" ry="8" fill="#1565C0" opacity="0.7" />
                <ellipse cx="0" cy="-50" rx="2" ry="4" fill="#FFD700" opacity="0.6" />
                {/* Feather barbs */}
                <path d="M-2,-35 Q-8,-40 -5,-48" fill="none" stroke={PEACOCK_GREEN} strokeWidth="0.5" opacity="0.5" />
                <path d="M2,-35 Q8,-40 5,-48" fill="none" stroke={PEACOCK_GREEN} strokeWidth="0.5" opacity="0.5" />
              </g>
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
