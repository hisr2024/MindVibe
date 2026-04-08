/**
 * JourneyTemplateCard — Template card for browsing and starting new journeys.
 *
 * This card is the "sacred shop window" for the षड्रिपु Journeys catalog.
 * Beyond the basic title / duration / difficulty, it surfaces the three
 * things a user needs to see in 3 seconds to recognise a journey as theirs:
 *   1. Real-life modern context   (the mirror)
 *   2. Bhagavad Gita verse anchor  (the wisdom)
 *   3. Transformation promise      (the becoming)
 *
 * Props (kept stable for JourneysTab.tsx consumer):
 *   template     — JourneyTemplate (now includes optional gita_verse_ref,
 *                                   gita_verse_text, modern_context,
 *                                   transformation_promise)
 *   startedInfo? — JourneyResponse | null. When the user already has an
 *                  active or paused journey for this template, the card
 *                  surfaces a "Continue → Day N" or "Resume Journey" CTA
 *                  instead of the default "Begin N-Day Journey →".
 *   onStart      — (templateId) => void
 *   isStarting   — boolean
 *   disabled?    — boolean
 *   index?       — number (for staggered motion)
 */

'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'
import type {
  JourneyResponse,
  JourneyTemplate,
  EnemyType,
} from '@/types/journeyEngine.types'
import { ENEMY_INFO, getDifficultyLabel } from '@/types/journeyEngine.types'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { EnemySVGFallback } from '@/components/mobile/journeys/EnemySVGFallback'

interface JourneyTemplateCardProps {
  template: JourneyTemplate
  onStart: (templateId: string) => void
  isStarting: boolean
  disabled?: boolean
  index?: number
  startedInfo?: JourneyResponse | null
}

export function JourneyTemplateCard({
  template,
  onStart,
  isStarting,
  disabled,
  index = 0,
  startedInfo = null,
}: JourneyTemplateCardProps) {
  const { triggerHaptic } = useHapticFeedback()
  const [imageFailed, setImageFailed] = useState(false)

  const primaryEnemy = template.primary_enemy_tags[0] as EnemyType | undefined
  const info = primaryEnemy ? ENEMY_INFO[primaryEnemy] : null
  const accentColor = info?.color ?? '#D4A017'
  const rgb = info?.colorRGB ?? '212,160,23'

  // Started-state derivations. When the user already has an active or paused
  // journey for this template, we change both the top-right pill and the CTA
  // so the catalog visibly reflects the journey they started — addressing the
  // "I don't know which journey I started" gap.
  const isActive = startedInfo?.status === 'active'
  const isPaused = startedInfo?.status === 'paused'

  // Sacred enrichment — prefer template-level data, fall back to the
  // canonical enemy metadata. Everything here is optional, so we gate
  // each block on truthiness to keep the card graceful if the backend
  // hasn't been redeployed yet.
  const verseRef = template.gita_verse_ref ?? info?.keyVerse ?? null
  const verseSanskrit = template.gita_verse_text ?? null
  const verseTranslit = info?.keyVerseText ?? null
  const modernContext = template.modern_context ?? info?.modernContext ?? null
  const transformation = template.transformation_promise ?? info?.conqueredBy ?? null

  const handleStart = () => {
    if (disabled || isStarting) return
    triggerHaptic('medium')
    onStart(template.id)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-2xl flex flex-col"
      style={{
        border: `1px solid rgba(${rgb},0.22)`,
        borderTop: `2px solid ${accentColor}`,
        background:
          'linear-gradient(145deg, rgba(22,26,66,0.96), rgba(17,20,53,0.99))',
      }}
    >
      {/* ── HERO ─────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          height: 96,
          background: info
            ? `linear-gradient(135deg, rgba(${rgb},0.35), rgba(${rgb},0.08))`
            : 'linear-gradient(135deg, rgba(212,160,23,0.3), rgba(212,160,23,0.08))',
        }}
      >
        {/* AI hero image if available — fails silently to gradient + SVG */}
        {!imageFailed && (
          <Image
            src={`/images/journeys/templates/journey-${template.id}.webp`}
            alt=""
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            className="object-cover opacity-40"
            onError={() => setImageFailed(true)}
          />
        )}

        {/* SVG fallback symbol (always rendered underneath as watermark) */}
        {primaryEnemy && (
          <div className="absolute top-2 right-2 opacity-30 pointer-events-none">
            <EnemySVGFallback enemyId={primaryEnemy} color={accentColor} size={44} />
          </div>
        )}

        {/* Sanskrit overlay */}
        {info && (
          <div className="absolute bottom-1.5 left-2.5 flex items-baseline gap-1.5">
            <span
              style={{
                fontFamily: '"Noto Sans Devanagari", sans-serif',
                fontSize: 22,
                fontWeight: 500,
                color: accentColor,
                textShadow: `0 0 16px rgba(${rgb},0.55)`,
                lineHeight: 1,
              }}
            >
              {info.devanagari}
            </span>
            <span
              className="font-divine italic text-white/70"
              style={{ fontSize: 11 }}
            >
              {info.name}
            </span>
          </div>
        )}

        {/* Duration / difficulty pills */}
        <div className="absolute top-2 left-2 flex gap-1">
          <span
            className="font-ui"
            style={{
              fontSize: 8,
              padding: '2px 6px',
              borderRadius: 6,
              background: 'rgba(5,7,20,0.78)',
              border: `1px solid rgba(${rgb},0.35)`,
              color: accentColor,
              letterSpacing: '0.06em',
            }}
          >
            {template.duration_days}d
          </span>
          <span
            className="font-ui"
            style={{
              fontSize: 8,
              padding: '2px 6px',
              borderRadius: 6,
              background: 'rgba(5,7,20,0.78)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#B8AE98',
            }}
          >
            {getDifficultyLabel(template.difficulty)}
          </span>
        </div>

        {/* Started badge takes priority over the Free pill — once a user
            has begun this template, surface their progress instead. */}
        {isActive ? (
          <span
            className="absolute top-2 right-12 font-ui"
            style={{
              fontSize: 8,
              padding: '2px 6px',
              borderRadius: 6,
              background: 'rgba(16,185,129,0.18)',
              border: '1px solid rgba(16,185,129,0.4)',
              color: '#6EE7B7',
              letterSpacing: '0.06em',
            }}
          >
            DAY {startedInfo?.current_day ?? 1}
          </span>
        ) : isPaused ? (
          <span
            className="absolute top-2 right-12 font-ui"
            style={{
              fontSize: 8,
              padding: '2px 6px',
              borderRadius: 6,
              background: 'rgba(217,119,6,0.18)',
              border: '1px solid rgba(217,119,6,0.4)',
              color: '#FCD34D',
              letterSpacing: '0.06em',
            }}
          >
            PAUSED
          </span>
        ) : template.is_free ? (
          <span
            className="absolute top-2 right-12 font-ui"
            style={{
              fontSize: 8,
              padding: '2px 6px',
              borderRadius: 6,
              background: 'rgba(16,185,129,0.15)',
              border: '1px solid rgba(16,185,129,0.35)',
              color: '#6EE7B7',
            }}
          >
            Free
          </span>
        ) : null}
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────── */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <h3
          className="font-divine italic text-[#EDE8DC] leading-tight line-clamp-2"
          style={{ fontSize: 15 }}
        >
          {template.title}
        </h3>

        {template.description && (
          <p
            className="font-sacred italic text-[#B8AE98] leading-snug line-clamp-2"
            style={{ fontSize: 11 }}
          >
            {template.description}
          </p>
        )}

        {/* ── REAL-LIFE HOOK ─────────────────────────────────────────── */}
        {modernContext && (
          <div
            style={{
              padding: '6px 8px',
              background: `rgba(${rgb},0.07)`,
              border: `1px solid rgba(${rgb},0.2)`,
              borderLeft: `2px solid ${accentColor}`,
              borderRadius: '0 8px 8px 0',
            }}
          >
            <div
              className="font-ui uppercase"
              style={{
                fontSize: 7,
                color: accentColor,
                letterSpacing: '0.12em',
                marginBottom: 2,
              }}
            >
              Today this looks like
            </div>
            <div
              className="font-sacred italic text-[#B8AE98] leading-snug line-clamp-2"
              style={{ fontSize: 10 }}
            >
              {modernContext}
            </div>
          </div>
        )}

        {/* ── GITA VERSE ─────────────────────────────────────────────── */}
        {(verseRef || verseSanskrit || verseTranslit) && (
          <div
            style={{
              padding: '6px 8px',
              background:
                'linear-gradient(100deg, rgba(212,160,23,0.08), rgba(17,20,53,0.6))',
              border: '1px solid rgba(212,160,23,0.18)',
              borderLeft: '2px solid rgba(212,160,23,0.6)',
              borderRadius: '0 8px 8px 0',
            }}
          >
            {verseRef && (
              <div
                className="font-ui uppercase"
                style={{
                  fontSize: 7,
                  color: '#D4A017',
                  letterSpacing: '0.12em',
                  marginBottom: 2,
                }}
              >
                {`\u2726 BG ${verseRef.chapter}.${verseRef.verse}`}
              </div>
            )}
            {verseSanskrit && (
              <div
                style={{
                  fontFamily: '"Noto Sans Devanagari", sans-serif',
                  fontSize: 11,
                  color: '#F0C040',
                  lineHeight: 1.6,
                }}
                className="line-clamp-1"
              >
                {verseSanskrit.split('\n')[0]}
              </div>
            )}
            {verseTranslit && (
              <div
                className="font-sacred italic line-clamp-1"
                style={{ fontSize: 9, color: '#6B6355' }}
              >
                {verseTranslit}
              </div>
            )}
          </div>
        )}

        {/* ── TRANSFORMATION PROMISE ─────────────────────────────────── */}
        {transformation && (
          <div className="flex items-center gap-1.5">
            <span
              className="inline-flex items-center justify-center flex-shrink-0"
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                background: `rgba(${rgb},0.18)`,
                border: `1px solid rgba(${rgb},0.35)`,
                fontSize: 9,
                color: accentColor,
              }}
            >
              →
            </span>
            <span
              className="font-sacred italic text-[#B8AE98] leading-snug line-clamp-1"
              style={{ fontSize: 10 }}
            >
              Conquered by{' '}
              <span style={{ color: accentColor }}>{transformation}</span>
            </span>
          </div>
        )}

        {/* ── CTA ───────────────────────────────────────────────────── */}
        <button
          type="button"
          onClick={handleStart}
          disabled={isStarting || disabled}
          className="w-full rounded-lg py-2 font-ui font-semibold transition-all active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed mt-auto"
          style={{
            fontSize: 11,
            touchAction: 'manipulation',
            // Started journeys get a tinted-glass treatment so the CTA reads
            // as "continue what you started" rather than "start something new".
            background: isActive || isPaused
              ? `rgba(${rgb},0.18)`
              : `linear-gradient(135deg, ${accentColor}cc, ${accentColor})`,
            border: isActive || isPaused
              ? `1px solid rgba(${rgb},0.45)`
              : '1px solid transparent',
            color: isActive || isPaused ? accentColor : '#050714',
            boxShadow: isActive || isPaused
              ? 'none'
              : `0 2px 8px rgba(${rgb},0.25)`,
          }}
        >
          {isStarting
            ? 'Starting...'
            : isActive
              ? `Continue \u2192 Day ${startedInfo?.current_day ?? 1}`
              : isPaused
                ? 'Resume Journey'
                : `Begin ${template.duration_days}-Day Journey \u2192`}
        </button>
      </div>
    </motion.div>
  )
}
