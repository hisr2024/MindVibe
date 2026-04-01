/**
 * BattlegroundTab — षड्रिपु Radar: visual enemy mastery with
 * interactive radar chart, enemy cards, and detail sheet.
 */

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import type { DashboardResponse, EnemyType } from '@/types/journeyEngine.types'
import { ENEMY_INFO, ENEMY_ORDER, getMasteryDescription } from '@/types/journeyEngine.types'
import { EnemyRadarMobile } from '../components/EnemyRadarMobile'
import { EnemyCard } from '../components/EnemyCard'

interface BattlegroundTabProps {
  dashboard: DashboardResponse | null
  isLoading: boolean
}

export function BattlegroundTab({ dashboard, isLoading }: BattlegroundTabProps) {
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyType | null>(null)

  const handleEnemyTap = (enemy: EnemyType) => {
    setSelectedEnemy((prev) => (prev === enemy ? null : enemy))
  }

  const getMastery = (enemy: string): number =>
    dashboard?.enemy_progress.find((p) => p.enemy === enemy)?.mastery_level ?? 0

  const selectedInfo = selectedEnemy ? ENEMY_INFO[selectedEnemy] : null
  const selectedProgress = selectedEnemy
    ? dashboard?.enemy_progress.find((p) => p.enemy === selectedEnemy)
    : null
  const selectedMastery = selectedProgress?.mastery_level ?? 0

  // Check if user has an active journey for the selected enemy
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
        <h1 className="font-divine text-4xl font-light text-[#D4A017]">
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
          size={280}
        />
      )}

      {/* Enemy cards — 2x3 grid */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        {ENEMY_ORDER.map((enemy, i) => (
          <EnemyCard
            key={enemy}
            enemy={enemy}
            mastery={getMastery(enemy)}
            isSelected={selectedEnemy === enemy}
            onTap={() => handleEnemyTap(enemy)}
            index={i}
          />
        ))}
      </div>

      {/* Selected enemy detail sheet */}
      <AnimatePresence>
        {selectedEnemy && selectedInfo && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="mt-5 rounded-2xl overflow-hidden backdrop-blur-sm"
            style={{
              background: `linear-gradient(160deg, ${selectedInfo.color}20, rgba(11,14,42,0.98))`,
              border: `1px solid ${selectedInfo.color}30`,
            }}
          >
            {/* Handle bar */}
            <div className="flex justify-center pt-3">
              <div className="w-10 h-1 rounded-full bg-white/20" />
            </div>

            <div className="p-5">
              {/* Hero row */}
              <div className="flex items-center gap-4 mb-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${selectedInfo.color}20` }}
                >
                  <span className="font-divine text-3xl italic" style={{ color: selectedInfo.color }}>
                    {selectedInfo.sanskrit.charAt(0)}
                  </span>
                </div>
                <div>
                  <h2
                    className="font-divine text-2xl italic"
                    style={{ color: selectedInfo.color }}
                  >
                    {selectedInfo.sanskrit}
                  </h2>
                  <p className="text-sm text-[#B8AE98] font-ui">
                    {selectedInfo.name} — {selectedInfo.description}
                  </p>
                </div>
              </div>

              {/* Mastery bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] text-[#6B6355] font-ui">Your mastery</span>
                  <span className="text-[10px] font-ui" style={{ color: selectedInfo.color }}>
                    {selectedMastery}% — {getMasteryDescription(selectedMastery)}
                  </span>
                </div>
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: selectedInfo.color }}
                    initial={{ width: 0 }}
                    animate={{ width: `${selectedMastery}%` }}
                    transition={{ duration: 0.6 }}
                  />
                </div>
              </div>

              {/* Key verse */}
              <div className="bg-white/[0.03] rounded-xl p-3 mb-4">
                <p className="text-[9px] text-[#D4A017]/50 font-ui uppercase tracking-wider mb-1">
                  Key Verse — BG {selectedInfo.keyVerse.chapter}.{selectedInfo.keyVerse.verse}
                </p>
                <p className="text-xs text-[#B8AE98] font-sacred italic">
                  Antidote: {selectedInfo.antidote}
                </p>
              </div>

              {/* Action button */}
              {activeJourneyForEnemy ? (
                <Link href={`/m/journeys/${activeJourneyForEnemy.journey_id}`}>
                  <button
                    className="w-full rounded-xl py-3 text-sm font-ui font-semibold text-[#050714]"
                    style={{
                      background: `linear-gradient(135deg, ${selectedInfo.color}cc, ${selectedInfo.color})`,
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
                  className="w-full rounded-xl py-3 text-sm font-ui font-semibold text-[#050714] active:scale-[0.97] transition-transform"
                  style={{
                    background: `linear-gradient(135deg, ${selectedInfo.color}cc, ${selectedInfo.color})`,
                    boxShadow: `0 4px 16px ${selectedInfo.color}30`,
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
