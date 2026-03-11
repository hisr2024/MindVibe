/**
 * ArjunaIllustration — Elegant silhouette art style
 *
 * Dark bronze/amber warrior silhouette with warm edge-glow.
 * Recognizable by: warrior crown, broad pauldrons, Gandiva bow, quiver on back.
 *
 * State-driven posture via Framer Motion:
 * - idle: Standing upright, bow at side
 * - distressed: Slumped posture, head bowed (Chapter 1 despair)
 * - listening: Upright, turned slightly toward Krishna
 * - enlightened: Radiant golden glow, confident stance
 */

'use client'

import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useGitaVRStore } from '@/stores/gitaVRStore'

/**
 * Arjuna idle/listening silhouette — standing warrior with bow at side.
 * Profile shows: warrior crown, broad shoulders with pauldrons, Gandiva bow
 * held vertically beside him, quiver of arrows on back, warrior dhoti.
 */
const ARJUNA_UPRIGHT = `
  M160,52
  L168,32 L166,54
  L180,20 L174,56
  L190,38 L182,58

  Q192,54 195,60
  Q200,56 204,60
  Q206,54 208,58

  L210,38 L216,56
  L220,20 L224,54
  L232,32 L230,52

  Q234,56 236,64
  Q240,74 238,90
  Q236,110 228,122

  Q250,128 268,140
  Q280,150 286,164
  Q292,176 292,186
  Q290,192 286,194
  L280,190
  Q274,182 268,190
  Q264,196 262,210

  Q260,240 264,270
  Q268,300 266,330
  Q264,352 262,370

  Q258,390 262,420
  Q268,460 278,500
  Q288,540 294,570
  Q300,592 296,608
  Q292,624 282,630
  L268,632
  Q262,626 256,632
  L240,632

  Q244,612 240,590
  Q232,555 222,525
  Q212,505 200,498

  Q188,505 178,525
  Q168,555 160,590
  Q156,612 160,632

  L144,632
  Q138,626 132,632
  L118,630
  Q108,624 104,608
  Q100,592 106,570
  Q112,540 122,500
  Q132,460 138,420
  Q142,390 138,370

  Q136,352 134,330
  Q132,300 136,270
  Q138,240 136,210
  Q134,196 128,190
  Q122,182 116,190
  L110,194
  Q106,192 104,186
  Q104,176 110,164
  Q118,150 130,140
  Q148,128 162,122

  Q154,110 152,90
  Q150,74 154,64
  Q156,56 160,52
  Z

  M290,180
  Q298,170 302,152
  Q306,130 308,110
  Q310,90 306,76
  Q302,66 296,72
  Q290,82 288,96
  Q286,120 288,144
  Q290,160 290,180
  Z

  M286,96
  L290,30
  Q292,24 294,30
  L294,70

  M300,90
  L304,28
  Q306,22 308,28
  L306,74
`

/**
 * Arjuna distressed silhouette — slumped, head bowed, bow drooping.
 * Conveys Chapter 1 despair: shoulders hunched, posture collapsed.
 */
const ARJUNA_DISTRESSED = `
  M170,70
  L176,52 L174,72
  L186,40 L182,74
  L194,56 L190,76

  Q196,74 200,78
  Q204,74 210,76

  L206,56 L218,74
  L214,40 L226,72
  L224,52 L230,70

  Q234,72 236,80
  Q240,90 238,108
  Q234,126 226,136

  Q242,144 256,158
  Q266,170 274,182
  Q280,192 280,202
  Q278,208 274,210
  L268,206
  Q262,198 256,204
  Q252,212 250,226

  Q248,256 252,286
  Q256,316 254,346
  Q252,368 250,386

  Q246,406 250,436
  Q256,476 266,516
  Q276,556 282,586
  Q288,608 284,624
  Q280,640 270,646
  L256,648
  Q250,642 244,648
  L228,648

  Q232,628 228,606
  Q220,571 210,541
  Q200,521 192,516

  Q184,521 178,541
  Q168,571 160,606
  Q156,628 160,648

  L144,648
  Q138,642 132,648
  L118,646
  Q108,640 104,624
  Q100,608 106,586
  Q112,556 122,516
  Q132,476 138,436
  Q142,406 138,386

  Q136,368 134,346
  Q132,316 136,286
  Q138,256 136,226
  Q134,212 128,204
  Q122,198 116,206
  L110,210
  Q106,208 104,202
  Q104,192 110,182
  Q118,170 130,158
  Q144,144 158,136

  Q150,126 150,108
  Q150,90 156,80
  Q162,72 170,70
  Z
`

export default function ArjunaIllustration() {
  const arjunaState = useGitaVRStore((s) => s.arjunaState)
  const reduceMotion = useReducedMotion()

  const isEnlightened = arjunaState === 'enlightened'
  const isDistressed = arjunaState === 'distressed'

  const bodyVariants = useMemo(() => ({
    idle: { y: [0, -2, 0], transition: { duration: 4.5, repeat: Infinity, ease: 'easeInOut' as const } },
    distressed: { y: [4, 6, 4], transition: { duration: 6, repeat: Infinity, ease: 'easeInOut' as const } },
    listening: { y: [0, -3, 0], transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' as const } },
    enlightened: { y: [0, -4, 0], transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' as const } },
  }), [])

  const silhouettePath = isDistressed ? ARJUNA_DISTRESSED : ARJUNA_UPRIGHT

  if (reduceMotion) {
    return (
      <div className="relative h-[500px] w-[260px]" aria-label="Arjuna">
        <svg viewBox="0 0 400 680" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="as-fill" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#3a2510" />
              <stop offset="100%" stopColor="#1a0d05" />
            </linearGradient>
          </defs>
          <path d={ARJUNA_UPRIGHT} fill="url(#as-fill)" />
        </svg>
      </div>
    )
  }

  return (
    <div className="relative h-[500px] w-[260px]" aria-label="Arjuna">
      {/* === WARM BACKLIGHT (subtle, secondary character) === */}
      <motion.div
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
        animate={{
          opacity: isEnlightened ? 0.3 : 0.1,
          scale: [1, 1.03, 1],
        }}
        transition={{
          opacity: { duration: 1.2, ease: 'easeOut' },
          scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
        }}
      >
        <div
          className="h-[110%] w-[140%] rounded-full"
          style={{
            background: isEnlightened
              ? 'radial-gradient(ellipse, rgba(255,215,0,0.15) 0%, rgba(200,160,60,0.06) 40%, transparent 65%)'
              : 'radial-gradient(ellipse, rgba(200,160,100,0.08) 0%, rgba(140,100,60,0.03) 40%, transparent 65%)',
          }}
        />
      </motion.div>

      {/* === MAIN SVG === */}
      <motion.div
        className="relative h-full w-full"
        variants={bodyVariants}
        animate={arjunaState}
        style={{ originX: '50%', originY: '90%' }}
      >
        <svg viewBox="0 0 400 680" className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            {/* Warm bronze gradient fill */}
            <linearGradient id="a-fill" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#3a2510" />
              <stop offset="40%" stopColor="#2a1a0a" />
              <stop offset="100%" stopColor="#1a0d05" />
            </linearGradient>

            {/* Inner depth gradient */}
            <linearGradient id="a-inner" x1="0.3" y1="0.2" x2="0.7" y2="0.8">
              <stop offset="0%" stopColor="#5a3a20" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#1a0d05" stopOpacity="0" />
            </linearGradient>

            {/* Warm amber edge glow */}
            <filter id="a-edge-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feMorphology operator="dilate" radius="1" in="SourceAlpha" result="dilated" />
              <feGaussianBlur stdDeviation="6" in="dilated" result="blurred" />
              <feFlood floodColor="#C68642" floodOpacity="0.35" result="glowColor" />
              <feComposite in="glowColor" in2="blurred" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Enlightened golden glow */}
            <filter id="a-edge-glow-enlightened" x="-25%" y="-25%" width="150%" height="150%">
              <feMorphology operator="dilate" radius="2" in="SourceAlpha" result="dilated" />
              <feGaussianBlur stdDeviation="10" in="dilated" result="blurred" />
              <feFlood floodColor="#FFD700" floodOpacity="0.5" result="glowColor" />
              <feComposite in="glowColor" in2="blurred" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Distressed dim glow */}
            <filter id="a-edge-glow-dim" x="-15%" y="-15%" width="130%" height="130%">
              <feMorphology operator="dilate" radius="0.5" in="SourceAlpha" result="dilated" />
              <feGaussianBlur stdDeviation="4" in="dilated" result="blurred" />
              <feFlood floodColor="#8B6914" floodOpacity="0.2" result="glowColor" />
              <feComposite in="glowColor" in2="blurred" operator="in" result="glow" />
              <feMerge>
                <feMergeNode in="glow" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            <filter id="a-jewel">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* === SILHOUETTE with state-driven glow === */}
          <path
            d={silhouettePath}
            fill="url(#a-fill)"
            filter={
              isEnlightened ? 'url(#a-edge-glow-enlightened)'
              : isDistressed ? 'url(#a-edge-glow-dim)'
              : 'url(#a-edge-glow)'
            }
          />

          {/* Inner gradient overlay */}
          <path d={silhouettePath} fill="url(#a-inner)" />

          {/* === SUBTLE HIGHLIGHTS === */}

          {/* Crown sapphire glow */}
          <motion.circle
            cx="200" cy={isDistressed ? 76 : 56}
            r="3"
            fill="#4169E1"
            filter="url(#a-jewel)"
            animate={{ opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />

          {/* Armor highlight line — subtle chest plate reflection */}
          {!isDistressed && (
            <path
              d="M185,180 Q200,175 215,180"
              fill="none" stroke="#8B7355" strokeWidth="1" opacity="0.2"
            />
          )}
        </svg>
      </motion.div>

      {/* Enlightened state — golden particles */}
      {isEnlightened && (
        <div className="pointer-events-none absolute inset-0">
          {Array.from({ length: 6 }, (_, i) => (
            <motion.div
              key={`ep-${i}`}
              className="absolute rounded-full"
              style={{
                width: 2 + (i % 2),
                height: 2 + (i % 2),
                left: 40 + (i * 97) % 180,
                top: 80 + (i * 67) % 350,
                background: 'radial-gradient(circle, rgba(255,235,150,0.9) 0%, transparent 70%)',
                boxShadow: `0 0 8px rgba(255,215,0,0.4)`,
              }}
              animate={{
                y: [0, -12, 0],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: 3 + (i % 3),
                repeat: Infinity,
                ease: 'easeInOut',
                delay: i * 0.5,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
