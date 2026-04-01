/**
 * JourneysTab — Journey management: active journeys + template catalog.
 */

'use client'

import { useState, useMemo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import type {
  DashboardResponse,
  JourneyTemplate,
  EnemyType,
} from '@/types/journeyEngine.types'
import { ENEMY_INFO, ENEMY_ORDER } from '@/types/journeyEngine.types'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  journeyEngineService,
  JourneyEngineError,
} from '@/services/journeyEngineService'
import { ActiveJourneyCardMobile } from '../components/ActiveJourneyCardMobile'
import { JourneyTemplateCard } from '../components/JourneyTemplateCard'
import { JourneyCardSkeleton } from '../skeletons/JourneyCardSkeleton'

const ICON_EMOJI: Record<string, string> = {
  flame: '\uD83D\uDD25',
  zap: '\u26A1',
  coins: '\uD83D\uDCB0',
  cloud: '\u2601\uFE0F',
  crown: '\uD83D\uDC51',
  eye: '\uD83D\uDC41\uFE0F',
}

interface JourneysTabProps {
  dashboard: DashboardResponse | null
  templates: JourneyTemplate[]
  isLoading: boolean
  onRefresh: () => void
}

export function JourneysTab({ dashboard, templates, isLoading, onRefresh }: JourneysTabProps) {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyType | null>(null)
  const [startingId, setStartingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const activeCount = dashboard?.active_journeys.filter((j) => j.status === 'active').length ?? 0
  const canStart = activeCount < 5

  // Filter templates by selected enemy
  const filteredTemplates = useMemo(() => {
    if (!selectedEnemy) return templates
    return templates.filter((t) =>
      t.primary_enemy_tags.includes(selectedEnemy),
    )
  }, [templates, selectedEnemy])

  const handleStart = useCallback(
    async (templateId: string) => {
      if (startingId || !canStart) return
      setStartingId(templateId)
      setError(null)
      triggerHaptic('medium')

      try {
        const journey = await journeyEngineService.startJourney({
          template_id: templateId,
        })
        triggerHaptic('success')
        router.push(`/m/journeys/${journey.journey_id}`)
        onRefresh()
      } catch (err) {
        triggerHaptic('error')
        setError(
          err instanceof JourneyEngineError
            ? err.message
            : 'Failed to start journey',
        )
      } finally {
        setStartingId(null)
      }
    },
    [startingId, canStart, triggerHaptic, router, onRefresh],
  )

  return (
    <div className="px-4 pb-6 space-y-5">
      {/* Enemy filter pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-1">
        <button
          onClick={() => {
            triggerHaptic('light')
            setSelectedEnemy(null)
          }}
          className="flex-shrink-0 h-[36px] px-3 rounded-full text-[11px] font-ui font-medium transition-all"
          style={{
            backgroundColor: !selectedEnemy
              ? '#D4A017'
              : 'rgba(255,255,255,0.05)',
            color: !selectedEnemy ? '#050714' : 'rgba(255,255,255,0.6)',
          }}
        >
          All
        </button>
        {ENEMY_ORDER.map((enemy) => {
          const info = ENEMY_INFO[enemy]
          const isActive = selectedEnemy === enemy
          return (
            <button
              key={enemy}
              onClick={() => {
                triggerHaptic('light')
                setSelectedEnemy(isActive ? null : enemy)
              }}
              className="flex-shrink-0 h-[36px] px-3 rounded-full text-[11px] font-ui font-medium transition-all flex items-center gap-1"
              style={{
                backgroundColor: isActive
                  ? info.color
                  : 'rgba(255,255,255,0.05)',
                color: isActive ? '#050714' : info.color,
                boxShadow: isActive ? `0 2px 8px ${info.color}40` : 'none',
              }}
            >
              <span className="text-xs">{ICON_EMOJI[info.icon] || '\u2728'}</span>
              {info.sanskrit}
            </button>
          )
        })}
        <div className="flex-shrink-0 flex items-center pl-1">
          <span className="text-[9px] text-[#6B6355] font-ui whitespace-nowrap">
            {activeCount}/5
          </span>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-900/15 px-4 py-2 text-center">
          <p className="text-xs text-red-300 font-ui">{error}</p>
        </div>
      )}

      {/* Active Journeys */}
      {isLoading ? (
        <JourneyCardSkeleton count={2} />
      ) : dashboard && dashboard.active_journeys.length > 0 ? (
        <section>
          <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B6355] font-ui mb-2">
            Active Journeys
          </p>
          <div className="space-y-3">
            {dashboard.active_journeys.map((journey, i) => (
              <ActiveJourneyCardMobile
                key={journey.journey_id}
                journey={journey}
                index={i}
              />
            ))}
          </div>
        </section>
      ) : (
        <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 text-center">
          <div className="text-3xl mb-2">{'\u2694\uFE0F'}</div>
          <p className="text-sm text-[#EDE8DC] font-ui">No active journeys</p>
          <p className="text-[11px] text-[#6B6355] font-ui mt-1">
            Begin the inner war below.
          </p>
        </div>
      )}

      {/* Max warning */}
      {!canStart && (
        <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2">
          <p className="text-[11px] text-amber-300/80 font-ui text-center">
            5 active journeys. Complete or pause one to start another.
          </p>
        </div>
      )}

      {/* Template catalog */}
      <section>
        <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B6355] font-ui mb-2">
          {selectedEnemy
            ? `${ENEMY_INFO[selectedEnemy].name} Journeys`
            : 'Begin a New Journey'}
        </p>
        {filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {filteredTemplates.map((template, i) => (
              <JourneyTemplateCard
                key={template.id}
                template={template}
                onStart={handleStart}
                isStarting={startingId === template.id}
                disabled={!canStart}
                index={i}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 text-center">
            <p className="text-sm text-[#B8AE98] font-ui">
              {selectedEnemy
                ? `No journeys found for ${ENEMY_INFO[selectedEnemy].name}.`
                : 'Journey templates are being prepared.'}
            </p>
          </div>
        )}
      </section>
    </div>
  )
}
