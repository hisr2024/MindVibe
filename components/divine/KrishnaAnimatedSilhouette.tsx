'use client'

/**
 * KrishnaAnimatedSilhouette — Bal Krishna (Childhood Krishna) Dancing Silhouette
 *
 * A playful, animated childhood Krishna (Bal Gopal) silhouette designed for the
 * Divine Presence banner. Uses child proportions: large round head (~1/3 of height),
 * chubby limbs, round belly — the iconic butter-stealing, flute-playing baby Krishna.
 *
 * Multiple animation layers for Disney/Pixar-quality feel:
 *   1. Whole body gentle bounce (playful up-down motion)
 *   2. Subtle body tilt (dancing sway left-right)
 *   3. Aura glow pulse behind figure
 *   4. Dhoti fabric sway (CSS keyframe on trailing edge)
 *
 * For `position="right"`, the figure is cleanly mirrored via SVG transform.
 * Does NOT affect KIAAN AI Ecosystem — purely decorative, pointer-events-none.
 */

import { motion, useReducedMotion } from 'framer-motion'

interface KrishnaAnimatedSilhouetteProps {
  position: 'left' | 'right'
  className?: string
}

export function KrishnaAnimatedSilhouette({
  position,
  className = '',
}: KrishnaAnimatedSilhouetteProps) {
  const reduceMotion = useReducedMotion()
  const id = `bal-krishna-${position}`

  return (
    <div
      className={`pointer-events-none absolute bottom-0 ${
        position === 'left' ? 'left-0' : 'right-0'
      } h-full ${className}`}
      aria-hidden="true"
      style={{ opacity: 0.22 }}
    >
      {/* Layer 1: Playful bounce — the whole figure bobs up and down */}
      <motion.div
        className="h-full"
        animate={
          reduceMotion
            ? undefined
            : { y: [0, -3, 0, -1, 0] }
        }
        transition={
          reduceMotion
            ? undefined
            : { duration: 2.4, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {/* Layer 2: Dancing tilt — gentle side-to-side sway */}
        <motion.div
          className="h-full"
          animate={
            reduceMotion
              ? undefined
              : { rotate: [-2, 2.5, -2] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
          }
          style={{ transformOrigin: 'center bottom' }}
        >
          <svg
            viewBox="0 0 200 320"
            className="h-full w-auto"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMax meet"
          >
            <defs>
              <radialGradient id={`${id}-aura`} cx="50%" cy="45%" r="50%">
                <stop offset="0%" stopColor="#d4a44c" stopOpacity="0.35" />
                <stop offset="50%" stopColor="#d4a44c" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#d4a44c" stopOpacity="0" />
              </radialGradient>
              <filter id={`${id}-soft`}>
                <feGaussianBlur stdDeviation="0.8" />
              </filter>
            </defs>

            <g transform={position === 'right' ? 'translate(200,0) scale(-1,1)' : undefined}>

              {/* Aura glow behind figure */}
              <motion.ellipse
                cx="100"
                cy="160"
                rx="80"
                ry="130"
                fill={`url(#${id}-aura)`}
                animate={
                  reduceMotion
                    ? undefined
                    : { opacity: [0.3, 0.6, 0.3] }
                }
                transition={
                  reduceMotion
                    ? undefined
                    : { duration: 3.5, repeat: Infinity, ease: 'easeInOut' }
                }
              />

              {/* ======= BAL KRISHNA (Childhood Krishna) ======= */}
              <g filter={`url(#${id}-soft)`} fill="#d4a44c">

                {/* === HEAD (large, round — child proportions) === */}
                <ellipse cx="100" cy="58" rx="28" ry="30" />

                {/* Crown (Mukut) — small, cute, 3 points */}
                <ellipse cx="100" cy="33" rx="18" ry="4" />
                <path d="M85 33 L90 16 L97 28 L100 10 L103 28 L110 16 L115 33" />

                {/* Peacock feather — single elegant plume curving right */}
                <path d="M108 18 Q118 5 114 -5 Q122 8 118 22" />
                <ellipse cx="116" cy="0" rx="4" ry="7" opacity="0.7" />

                {/* Curly hair tufts */}
                <circle cx="75" cy="50" r="6" opacity="0.6" />
                <circle cx="78" cy="38" r="5" opacity="0.5" />
                <circle cx="125" cy="50" r="6" opacity="0.6" />
                <circle cx="122" cy="38" r="5" opacity="0.5" />

                {/* Face — round, childlike */}
                <ellipse cx="100" cy="62" rx="23" ry="25" opacity="0.85" />

                {/* === NECK (short, chubby) === */}
                <rect x="93" y="85" width="14" height="10" rx="5" />

                {/* === TORSO (chubby, round belly) === */}
                <path d="M78 95 Q88 90 100 93 Q112 90 122 95 L128 120 Q125 148 100 155 Q75 148 72 120 Z" />

                {/* Round belly highlight */}
                <ellipse cx="100" cy="130" rx="18" ry="15" opacity="0.7" />

                {/* Necklace — small beads */}
                <path d="M82 97 Q92 105 100 107 Q108 105 118 97" stroke="#d4a44c" strokeWidth="2" fill="none" opacity="0.5" />

                {/* === LEFT ARM — raised up playfully (waving/dancing) === */}
                <path d="M78 100 Q62 90 52 75 Q48 68 52 62 Q56 58 60 65 Q62 72 68 82 Q72 90 78 95" opacity="0.85" />
                {/* Left hand — open, playful */}
                <ellipse cx="53" cy="63" rx="6" ry="5" opacity="0.8" />
                {/* Tiny butter ball in hand */}
                <circle cx="53" cy="56" r="5" opacity="0.6" />

                {/* === RIGHT ARM — extended out, holding flute === */}
                <path d="M122 100 Q135 108 145 118 Q150 125 152 128 Q154 132 150 133 L138 126 Q132 118 126 108" opacity="0.85" />
                {/* Right hand */}
                <ellipse cx="151" cy="130" rx="5" ry="4" opacity="0.8" />

                {/* Small flute (Bansuri) — held at angle */}
                <rect x="130" y="124" width="40" height="3.5" rx="1.75" transform="rotate(15 130 124)" opacity="0.7" />
                <circle cx="142" cy="127" r="1" opacity="0.5" />
                <circle cx="150" cy="129" r="1" opacity="0.5" />
                <circle cx="158" cy="131" r="1" opacity="0.5" />

                {/* === DHOTI (short, child-length, with flowing drape) === */}
                <path d="M76 148 Q70 175 72 200 Q75 218 85 230 L100 234 L115 230 Q125 218 128 200 Q130 175 124 148 Z" opacity="0.85" />

                {/* Dhoti drape detail — fabric fold lines */}
                <path d="M85 155 Q82 180 88 210" stroke="#d4a44c" strokeWidth="1.5" fill="none" opacity="0.4" />
                <path d="M115 155 Q118 180 112 210" stroke="#d4a44c" strokeWidth="1.5" fill="none" opacity="0.4" />

                {/* Dhoti flowing tail — trailing fabric edge */}
                <motion.path
                  d="M72 200 Q60 215 58 230 Q57 240 62 245"
                  fill="#d4a44c"
                  opacity={0.6}
                  animate={
                    reduceMotion
                      ? undefined
                      : { d: [
                          'M72 200 Q60 215 58 230 Q57 240 62 245',
                          'M72 200 Q56 218 55 233 Q55 245 60 248',
                          'M72 200 Q60 215 58 230 Q57 240 62 245',
                        ]}
                  }
                  transition={
                    reduceMotion
                      ? undefined
                      : { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
                  }
                />

                {/* === RIGHT LEG — standing, slight bend (weight-bearing) === */}
                <path d="M110 225 Q115 250 116 272 Q116 285 112 295" opacity="0.85" />
                {/* Right foot */}
                <ellipse cx="110" cy="298" rx="10" ry="4" opacity="0.7" />
                {/* Ankle bell (ghungroo) */}
                <circle cx="114" cy="290" r="2.5" opacity="0.5" />
                <circle cx="109" cy="291" r="2" opacity="0.4" />

                {/* === LEFT LEG — raised, bent at knee (dance pose!) === */}
                <path d="M88 225 Q78 240 75 250 Q73 258 78 262 Q84 265 88 258 Q90 250 88 242" opacity="0.85" />
                {/* Left foot — pointed up, playful */}
                <ellipse cx="80" cy="260" rx="8" ry="3.5" opacity="0.7" transform="rotate(-20 80 260)" />
                {/* Ankle bell (ghungroo) */}
                <circle cx="76" cy="255" r="2.5" opacity="0.5" />
                <circle cx="82" cy="256" r="2" opacity="0.4" />
              </g>
            </g>
          </svg>
        </motion.div>
      </motion.div>
    </div>
  )
}
