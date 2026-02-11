'use client'

/**
 * Journey Engine - Six Enemies (Shadripu) Dashboard
 *
 * A comprehensive journey system based on Bhagavad Gita wisdom to conquer
 * the six inner enemies: Kama, Krodha, Lobha, Moha, Mada, and Matsarya.
 */

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  ENEMY_INFO,
  ENEMY_ORDER,
  type EnemyType,
  type JourneyTemplate,
  type JourneyResponse,
  type EnemyRadarData,
  type DashboardResponse,
  getJourneyStatusLabel,
  getJourneyStatusColor,
  getDifficultyLabel,
  getDifficultyColor,
  getMasteryDescription,
} from '@/types/journeyEngine.types'
import { journeyEngineService, JourneyEngineError } from '@/services/journeyEngineService'

// =============================================================================
// ENEMY RADAR COMPONENT
// =============================================================================

function EnemyRadar({ data }: { data: EnemyRadarData }) {
  const size = 280
  const center = size / 2
  const radius = 100

  // Calculate points for hexagon radar
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2
    const r = (value / 100) * radius
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    }
  }

  const enemies = ENEMY_ORDER
  const points = enemies.map((enemy, i) => getPoint(i, data[enemy]))
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  // Grid lines
  const gridLevels = [25, 50, 75, 100]

  return (
    <div className="relative">
      <svg width={size} height={size} className="mx-auto">
        {/* Grid */}
        {gridLevels.map((level) => {
          const gridPoints = enemies.map((_, i) => getPoint(i, level))
          const gridPath = gridPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'
          return (
            <path
              key={level}
              d={gridPath}
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          )
        })}

        {/* Axis lines */}
        {enemies.map((_, i) => {
          const p = getPoint(i, 100)
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={p.x}
              y2={p.y}
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="1"
            />
          )
        })}

        {/* Data area */}
        <path
          d={pathData}
          fill="url(#radarGradient)"
          stroke="rgba(139, 92, 246, 0.8)"
          strokeWidth="2"
          className="transition-all duration-500"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={ENEMY_INFO[enemies[i]].color}
            stroke="white"
            strokeWidth="2"
            className="transition-all duration-500"
          />
        ))}

        {/* Gradient definition */}
        <defs>
          <linearGradient id="radarGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(139, 92, 246, 0.3)" />
            <stop offset="100%" stopColor="rgba(99, 102, 241, 0.3)" />
          </linearGradient>
        </defs>
      </svg>

      {/* Labels */}
      {enemies.map((enemy, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
        const labelRadius = radius + 35
        const x = center + labelRadius * Math.cos(angle)
        const y = center + labelRadius * Math.sin(angle)

        return (
          <div
            key={enemy}
            className="absolute text-center transform -translate-x-1/2 -translate-y-1/2"
            style={{ left: x, top: y }}
          >
            <div className="text-xs font-medium text-white">{ENEMY_INFO[enemy].sanskrit}</div>
            <div className="text-xs text-white/60">{data[enemy]}%</div>
          </div>
        )
      })}
    </div>
  )
}

// =============================================================================
// ENEMY CARD COMPONENT
// =============================================================================

function EnemyCard({
  enemy,
  mastery,
  onSelect,
  isSelected,
}: {
  enemy: EnemyType
  mastery: number
  onSelect: () => void
  isSelected: boolean
}) {
  const info = ENEMY_INFO[enemy]

  return (
    <button
      onClick={onSelect}
      className={`
        relative p-4 rounded-xl border transition-all duration-300 text-left w-full
        ${isSelected
          ? 'border-white/30 bg-white/10 scale-[1.02]'
          : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'
        }
      `}
    >
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${info.gradient} opacity-10`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl">{info.icon === 'flame' ? '🔥' : info.icon === 'zap' ? '⚡' : info.icon === 'coins' ? '💰' : info.icon === 'cloud' ? '☁️' : info.icon === 'crown' ? '👑' : '👁️'}</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-white/10 text-white/70">
            {getMasteryDescription(mastery)}
          </span>
        </div>
        <div className="text-sm font-medium text-white/80">{info.sanskrit}</div>
        <div className="text-lg font-semibold text-white">{info.name}</div>
        <div className="mt-2 h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full bg-gradient-to-r ${info.gradient} transition-all duration-500`}
            style={{ width: `${mastery}%` }}
          />
        </div>
        <div className="mt-1 text-xs text-white/50">{mastery}% mastery</div>
      </div>
    </button>
  )
}

// =============================================================================
// JOURNEY CARD COMPONENT
// =============================================================================

function JourneyCard({ journey, onAction }: { journey: JourneyResponse; onAction: (action: string) => void }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-white">{journey.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full border ${getJourneyStatusColor(journey.status)}`}>
              {getJourneyStatusLabel(journey.status)}
            </span>
            <span className="text-xs text-white/50">
              Day {journey.current_day} of {journey.total_days}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-white">{Math.round(journey.progress_percentage)}%</div>
        </div>
      </div>

      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 transition-all"
          style={{ width: `${journey.progress_percentage}%` }}
        />
      </div>

      <div className="flex gap-2">
        {journey.status === 'active' && (
          <>
            <Link
              href={`/journey-engine/${journey.journey_id}`}
              className="flex-1 px-3 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg text-center hover:from-purple-500 hover:to-indigo-500 transition-all"
            >
              Continue
            </Link>
            <button
              onClick={() => onAction('pause')}
              className="px-3 py-2 bg-white/10 text-white/70 text-sm rounded-lg hover:bg-white/20 transition-all"
            >
              Pause
            </button>
          </>
        )}
        {journey.status === 'paused' && (
          <button
            onClick={() => onAction('resume')}
            className="flex-1 px-3 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-medium rounded-lg hover:from-green-500 hover:to-emerald-500 transition-all"
          >
            Resume Journey
          </button>
        )}
      </div>
    </div>
  )
}

// =============================================================================
// TEMPLATE CARD COMPONENT
// =============================================================================

function TemplateCard({
  template,
  onStart,
  disabled,
}: {
  template: JourneyTemplate
  onStart: () => void
  disabled: boolean
}) {
  const primaryEnemy = template.primary_enemy_tags[0] as EnemyType | undefined
  const enemyInfo = primaryEnemy ? ENEMY_INFO[primaryEnemy] : null

  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all">
      <div className="flex items-start gap-3 mb-3">
        {enemyInfo && (
          <div
            className={`w-10 h-10 rounded-lg bg-gradient-to-br ${enemyInfo.gradient} flex items-center justify-center text-white`}
          >
            {enemyInfo.icon === 'flame' ? '🔥' : enemyInfo.icon === 'zap' ? '⚡' : enemyInfo.icon === 'coins' ? '💰' : enemyInfo.icon === 'cloud' ? '☁️' : enemyInfo.icon === 'crown' ? '👑' : '👁️'}
          </div>
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-white">{template.title}</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-white/50">{template.duration_days} days</span>
            <span className={`text-xs ${getDifficultyColor(template.difficulty)}`}>
              {getDifficultyLabel(template.difficulty)}
            </span>
            {template.is_free && (
              <span className="text-xs px-1.5 py-0.5 bg-green-500/20 text-green-400 rounded">Free</span>
            )}
          </div>
        </div>
      </div>

      <p className="text-sm text-white/60 mb-4 line-clamp-2">{template.description}</p>

      <button
        onClick={onStart}
        disabled={disabled}
        className="w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-sm font-medium rounded-lg hover:from-purple-500 hover:to-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Start Journey
      </button>
    </div>
  )
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function JourneyEnginePage() {
  // State
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [radarData, setRadarData] = useState<EnemyRadarData | null>(null)
  const [templates, setTemplates] = useState<JourneyTemplate[]>([])
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyType | null>(null)
  const [filteredTemplates, setFilteredTemplates] = useState<JourneyTemplate[]>([])

  // Load data
  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Load independently so partial failures don't kill all data
      const [dashboardResult, radarResult, templateResult] = await Promise.allSettled([
        journeyEngineService.getDashboard(),
        journeyEngineService.getEnemyRadar(),
        journeyEngineService.listTemplates({ limit: 20 }),
      ])

      // Check for auth errors in any result
      for (const result of [dashboardResult, radarResult, templateResult]) {
        if (result.status === 'rejected' && result.reason instanceof JourneyEngineError && result.reason.isAuthError()) {
          setError('Please sign in to access your journey dashboard')
          setIsLoading(false)
          return
        }
      }

      if (dashboardResult.status === 'fulfilled') setDashboard(dashboardResult.value)
      if (radarResult.status === 'fulfilled') setRadarData(radarResult.value)
      if (templateResult.status === 'fulfilled') {
        setTemplates(templateResult.value.templates)
        setFilteredTemplates(templateResult.value.templates)
      }

      // Only show error if all three failed
      const allFailed = [dashboardResult, radarResult, templateResult].every(r => r.status === 'rejected')
      if (allFailed) {
        setError('Failed to load journey data')
      }
    } catch (err) {
      setError('Failed to load journey data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Filter templates by enemy
  useEffect(() => {
    if (selectedEnemy) {
      setFilteredTemplates(
        templates.filter((t) => t.primary_enemy_tags.includes(selectedEnemy))
      )
    } else {
      setFilteredTemplates(templates)
    }
  }, [selectedEnemy, templates])

  // Start a journey
  const handleStartJourney = async (templateId: string) => {
    try {
      await journeyEngineService.startJourney({ template_id: templateId })
      loadData()
    } catch (err) {
      if (err instanceof JourneyEngineError) {
        if (err.isMaxJourneysError()) {
          setError('You can only have 5 active journeys at a time. Complete or pause one to start another.')
        } else {
          setError(err.message)
        }
      }
    }
  }

  // Journey actions
  const handleJourneyAction = async (journeyId: string, action: string) => {
    try {
      if (action === 'pause') {
        await journeyEngineService.pauseJourney(journeyId)
      } else if (action === 'resume') {
        await journeyEngineService.resumeJourney(journeyId)
      }
      loadData()
    } catch (err) {
      if (err instanceof JourneyEngineError) {
        setError(err.message)
      }
    }
  }

  const activeJourneyCount = dashboard?.active_journeys.filter((j) => j.status === 'active').length || 0
  const canStartNewJourney = activeJourneyCount < 5

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-indigo-900">
      {/* Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 px-4 py-4 border-b border-white/10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/dashboard" className="text-white/60 hover:text-white transition-colors">
            &larr; Dashboard
          </Link>
          <h1 className="text-lg font-semibold text-white">Conquer Your Inner Enemies</h1>
          <Link href="/kiaan" className="text-white/60 hover:text-white transition-colors">
            KIAAN &rarr;
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 px-4 py-8 max-w-7xl mx-auto">
        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/30 rounded-xl">
            <p className="text-red-300">{error}</p>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-400 hover:text-red-300"
            >
              Dismiss
            </button>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
            <p className="mt-4 text-white/60">Loading your journey...</p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">The Six Enemies (Shadripu)</h2>
              <p className="text-white/60 max-w-2xl mx-auto">
                According to Bhagavad Gita, these six inner enemies prevent us from attaining peace.
                Master them through guided journeys of wisdom and practice.
              </p>
            </div>

            {/* Stats Row */}
            {dashboard && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-3xl font-bold text-white">{dashboard.active_journeys.length}</div>
                  <div className="text-sm text-white/50">Active Journeys</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-3xl font-bold text-green-400">{dashboard.completed_journeys}</div>
                  <div className="text-sm text-white/50">Completed</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-3xl font-bold text-amber-400">{dashboard.current_streak}</div>
                  <div className="text-sm text-white/50">Day Streak</div>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <div className="text-3xl font-bold text-purple-400">{dashboard.total_days_practiced}</div>
                  <div className="text-sm text-white/50">Days Practiced</div>
                </div>
              </div>
            )}

            {/* Main Grid */}
            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left Column - Enemy Radar */}
              <div className="lg:col-span-1 space-y-6">
                <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4 text-center">Enemy Mastery Radar</h3>
                  {radarData && <EnemyRadar data={radarData} />}
                </div>

                {/* Enemy Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {ENEMY_ORDER.map((enemy) => (
                    <EnemyCard
                      key={enemy}
                      enemy={enemy}
                      mastery={radarData?.[enemy] || 0}
                      onSelect={() => setSelectedEnemy(selectedEnemy === enemy ? null : enemy)}
                      isSelected={selectedEnemy === enemy}
                    />
                  ))}
                </div>
              </div>

              {/* Right Column - Journeys & Templates */}
              <div className="lg:col-span-2 space-y-6">
                {/* Active Journeys */}
                {dashboard?.active_journeys && dashboard.active_journeys.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Your Active Journeys</h3>
                      <span className="text-sm text-white/50">{activeJourneyCount}/5 slots used</span>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      {dashboard.active_journeys.map((journey) => (
                        <JourneyCard
                          key={journey.journey_id}
                          journey={journey}
                          onAction={(action) => handleJourneyAction(journey.journey_id, action)}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Today's Steps */}
                {dashboard?.today_steps && dashboard.today_steps.length > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border border-purple-500/30">
                    <h3 className="text-lg font-semibold text-white mb-3">Today&apos;s Steps</h3>
                    <div className="space-y-2">
                      {dashboard.today_steps.map((step) => (
                        <div
                          key={`${step.journey_id}-${step.day_index}`}
                          className="flex items-center justify-between p-3 rounded-lg bg-white/5"
                        >
                          <div>
                            <div className="font-medium text-white">{step.step_title}</div>
                            <div className="text-sm text-white/50">Day {step.day_index}</div>
                          </div>
                          {step.is_completed ? (
                            <span className="text-green-400">Completed</span>
                          ) : (
                            <Link
                              href={`/journey-engine/${step.journey_id}`}
                              className="px-3 py-1 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-500 transition-all"
                            >
                              Do Now
                            </Link>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Available Templates */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-white">
                      {selectedEnemy
                        ? `${ENEMY_INFO[selectedEnemy].name} Journeys`
                        : 'Available Journeys'}
                    </h3>
                    {selectedEnemy && (
                      <button
                        onClick={() => setSelectedEnemy(null)}
                        className="text-sm text-purple-400 hover:text-purple-300"
                      >
                        Show All
                      </button>
                    )}
                  </div>

                  {!canStartNewJourney && (
                    <div className="mb-4 p-3 bg-amber-500/20 border border-amber-500/30 rounded-lg">
                      <p className="text-amber-300 text-sm">
                        You have 5 active journeys. Complete or pause one to start another.
                      </p>
                    </div>
                  )}

                  <div className="grid md:grid-cols-2 gap-4">
                    {filteredTemplates.slice(0, 6).map((template) => (
                      <TemplateCard
                        key={template.id}
                        template={template}
                        onStart={() => handleStartJourney(template.id)}
                        disabled={!canStartNewJourney}
                      />
                    ))}
                  </div>

                  {filteredTemplates.length > 6 && (
                    <div className="text-center mt-4">
                      <Link
                        href="/journey-engine/templates"
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        View all {filteredTemplates.length} templates &rarr;
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
