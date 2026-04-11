/**
 * BattlegroundTab — षड्रिपु Radar: visual enemy mastery with
 * interactive radar chart, enemy cards with sacred symbols, and detail sheet.
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import type { DashboardResponse, EnemyType } from '@/types/journeyEngine.types'
import { ENEMY_INFO, ENEMY_ORDER, getMasteryDescription } from '@/types/journeyEngine.types'
import { EnemyRadarMobile } from '../components/EnemyRadarMobile'
import { EnemyCard } from '../components/EnemyCard'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'

interface BattlegroundTabProps {
  dashboard: DashboardResponse | null
  isLoading: boolean
  onNavigateToJourneys?: (enemy: EnemyType) => void
}

export function BattlegroundTab({ dashboard, isLoading, onNavigateToJourneys }: BattlegroundTabProps) {
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyType | null>(null)
  const { triggerHaptic } = useHapticFeedback()

  const handleEnemyTap = (enemy: EnemyType) => {
    triggerHaptic('light')
    setSelectedEnemy((prev) => (prev === enemy ? null : enemy))
  }

  const getEnemyProgress = (enemy: string) =>
    dashboard?.enemy_progress.find((p) => p.enemy === enemy)

  const selectedInfo = selectedEnemy ? ENEMY_INFO[selectedEnemy] : null
  const selectedProgress = selectedEnemy
    ? dashboard?.enemy_progress.find((p) => p.enemy === selectedEnemy)
    : null
  const selectedMastery = selectedProgress?.mastery_level ?? 0
  const selectedActivePct = selectedProgress?.active_journey_progress_pct ?? 0
  const selectedActiveDay = selectedProgress?.active_journey_day ?? 0
  const selectedActiveTotalDays = selectedProgress?.active_journey_total_days ?? 0
  const hasSelectedActive =
    selectedActivePct > 0 && selectedActiveTotalDays > 0

  const activeJourneyForEnemy = selectedEnemy
    ? dashboard?.active_journeys.find((j) =>
        j.primary_enemies.includes(selectedEnemy),
      )
    : null

  return (
    <div className="px-4 pb-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center pt-2 mb-4"
      >
        <h1
          className="font-divine text-[34px] font-light text-[#D4A017]"
          style={{ textShadow: '0 0 20px rgba(212,160,23,0.3)' }}
        >
          {'\u0937\u0921\u094D\u0930\u093F\u092A\u0941'}
        </h1>
        <p className="text-[11px] text-[#6B6355] font-ui mt-1">
          The Six Inner Enemies
        </p>
      </motion.div>

      {/* Radar chart */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-[200px] h-[200px] rounded-full border border-white/[0.06] animate-pulse bg-white/[0.02]" />
        </div>
      ) : (
        <EnemyRadarMobile
          data={dashboard?.enemy_progress ?? []}
          selectedEnemy={selectedEnemy}
          onEnemyTap={handleEnemyTap}
          size={300}
        />
      )}

      {/* Enemy cards — 2x3 grid */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        {ENEMY_ORDER.map((enemy, i) => {
          const ep = getEnemyProgress(enemy)
          return (
            <EnemyCard
              key={enemy}
              enemy={enemy}
              mastery={ep?.mastery_level ?? 0}
              activeJourneyProgress={ep?.active_journey_progress_pct ?? 0}
              activeJourneyDay={ep?.active_journey_day ?? 0}
              activeJourneyTotalDays={ep?.active_journey_total_days ?? 0}
              isSelected={selectedEnemy === enemy}
              onTap={() => handleEnemyTap(enemy)}
              index={i}
            />
          )
        })}
      </div>

      {/* Selected enemy detail sheet */}
      <AnimatePresence>
        {selectedEnemy && selectedInfo && (
          <motion.div
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 60 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
            className="mt-5 rounded-2xl overflow-hidden backdrop-blur-lg"
            style={{
              background: `linear-gradient(160deg, rgba(${selectedInfo.colorRGB},0.12), rgba(11,14,42,0.98))`,
              border: `1px solid rgba(${selectedInfo.colorRGB},0.25)`,
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="p-5">
              {/* Hero row with Devanagari */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `rgba(${selectedInfo.colorRGB},0.15)` }}
                >
                  <span
                    className="text-[28px] leading-none"
                    style={{
                      fontFamily: '"Noto Sans Devanagari", sans-serif',
                      color: selectedInfo.color,
                      lineHeight: 2.0,
                    }}
                  >
                    {selectedInfo.devanagari}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h2
                    className="font-divine text-2xl italic"
                    style={{ color: selectedInfo.color }}
                  >
                    {selectedInfo.sanskrit}
                  </h2>
                  <p className="text-sm text-[#EDE8DC] font-ui">
                    {selectedInfo.name}
                  </p>
                  <p className="text-xs text-[#B8AE98] font-ui mt-0.5">
                    {selectedInfo.description}
                  </p>
                </div>
              </div>

              {/* Active journey progress bar (shown when there's an
                  active journey for this enemy — the primary signal the
                  user wants to see grow each day). */}
              {hasSelectedActive && (
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#6B6355] font-ui uppercase tracking-[0.12em]">
                      Current journey
                    </span>
                    <span
                      className="text-[10px] font-ui"
                      style={{ color: selectedInfo.color }}
                    >
                      Day {selectedActiveDay} of {selectedActiveTotalDays} · {selectedActivePct}%
                    </span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: `linear-gradient(90deg, ${selectedInfo.color}, ${selectedInfo.color}aa)`,
                        boxShadow: `0 0 12px rgba(${selectedInfo.colorRGB},0.4)`,
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${selectedActivePct}%` }}
                      transition={{ duration: 0.7 }}
                    />
                  </div>
                </div>
              )}

              {/* Mastery bar (long-term weighted across all journeys). */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#6B6355] font-ui">
                    {hasSelectedActive ? 'Long-term mastery' : 'Your mastery'}
                  </span>
                  <span className="text-[10px] font-ui" style={{ color: selectedInfo.color }}>
                    {selectedMastery}% — {getMasteryDescription(selectedMastery)}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: selectedInfo.color, opacity: 0.55 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedMastery}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>

              {/* Stats row */}
              {selectedProgress && (
                <div className="flex gap-3 mb-4">
                  {[
                    { label: 'Started', value: selectedProgress.journeys_started },
                    { label: 'Completed', value: selectedProgress.journeys_completed },
                    { label: 'Days', value: selectedProgress.total_days_practiced },
                    { label: 'Streak', value: selectedProgress.current_streak },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="flex-1 rounded-xl bg-white/[0.04] py-2 text-center"
                    >
                      <div className="text-sm font-divine text-[#F0C040]">{stat.value}</div>
                      <div className="text-[8px] text-[#6B6355] font-ui">{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Key verse */}
              <div className="bg-white/[0.03] rounded-xl p-3 mb-4">
                <p className="text-[9px] text-[#D4A017]/50 font-ui uppercase tracking-wider mb-1">
                  Key Verse — BG {selectedInfo.keyVerse.chapter}.{selectedInfo.keyVerse.verse}
                </p>
                <p className="text-xs text-[#B8AE98] font-sacred italic mb-1.5">
                  {selectedInfo.keyVerseText}
                </p>
                <p className="text-[10px] text-[#6B6355] font-ui">
                  Conquered by: {selectedInfo.conqueredBy}
                </p>
              </div>

              {/* Modern context */}
              <div className="mb-4">
                <p className="text-[9px] text-[#6B6355] font-ui uppercase tracking-wider mb-1">
                  In today&apos;s world
                </p>
                <p className="text-xs text-[#B8AE98] font-ui">
                  {selectedInfo.modernContext}
                </p>
              </div>

              {/* Action button */}
              {activeJourneyForEnemy ? (
                <Link href={`/m/journeys/${activeJourneyForEnemy.journey_id}`}>
                  <button
                    className="w-full rounded-xl py-3 text-sm font-ui font-semibold text-[#050714] active:scale-[0.97] transition-transform"
                    style={{
                      background: `linear-gradient(135deg, ${selectedInfo.color}cc, ${selectedInfo.color})`,
                      boxShadow: `0 4px 16px rgba(${selectedInfo.colorRGB},0.3)`,
                    }}
                  >
                    Continue Day {activeJourneyForEnemy.current_day} {'\u2192'}
                  </button>
                </Link>
              ) : selectedMastery >= 100 ? (
                <button
                  disabled
                  className="w-full rounded-xl py-3 text-sm font-ui font-semibold text-[#050714] opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #D4A017cc, #D4A017)',
                  }}
                >
                  Journey Mastered {'\u2713'}
                </button>
              ) : (
                <button
                  onClick={() => {
                    triggerHaptic('medium')
                    if (!onNavigateToJourneys || !selectedEnemy) return
                    // Close enemy sheet FIRST so the tab switch is visible,
                    // then navigate on the next frame.
                    const enemyId = selectedEnemy
                    setSelectedEnemy(null)
                    requestAnimationFrame(() => {
                      onNavigateToJourneys(enemyId)
                    })
                  }}
                  className="w-full rounded-xl py-3 text-sm font-ui font-semibold text-[#050714] active:scale-[0.97] transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${selectedInfo.color}cc, ${selectedInfo.color})`,
                    boxShadow: `0 4px 16px rgba(${selectedInfo.colorRGB},0.3)`,
                  }}
                >
                  Begin Journey {'\u2192'}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
