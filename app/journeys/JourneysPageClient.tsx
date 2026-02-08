'use client'

/**
 * Unified Journeys Page - Combines Journey Engine templates with personal journeys.
 *
 * Features:
 * - Browse guided journey templates (Six Enemies / Shadripu)
 * - View active guided journeys with progress
 * - Track progress with radar chart
 * - Create custom journeys
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FadeIn } from '@/components/ui'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import {
  journeyEngineService,
  JourneyEngineError,
} from '@/services/journeyEngineService'
import type {
  JourneyTemplate,
  JourneyResponse,
  EnemyProgressResponse,
  EnemyType,
  DashboardResponse,
} from '@/types/journeyEngine.types'
import {
  ENEMY_INFO,
  ENEMY_ORDER,
  getDifficultyLabel,
  getDifficultyColor,
  getJourneyStatusLabel,
  getJourneyStatusColor,
} from '@/types/journeyEngine.types'

// =============================================================================
// RADAR CHART COMPONENT
// =============================================================================

interface RadarChartProps {
  data: EnemyProgressResponse[]
  size?: number
}

function EnemyRadarChart({ data, size = 200 }: RadarChartProps) {
  const centerX = size / 2
  const centerY = size / 2
  const maxRadius = size * 0.4
  const levels = 5

  // Calculate points for each enemy
  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2
    const radius = (value / 100) * maxRadius
    return {
      x: centerX + radius * Math.cos(angle),
      y: centerY + radius * Math.sin(angle),
    }
  }

  // Get mastery level for each enemy (0-100)
  const getMasteryForEnemy = (enemy: string): number => {
    const progress = data.find(p => p.enemy === enemy)
    return progress?.mastery_level || 0
  }

  // Build polygon path
  const points = ENEMY_ORDER.map((enemy, i) => {
    const mastery = getMasteryForEnemy(enemy)
    return getPoint(i, mastery)
  })
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <svg width={size} height={size} className="mx-auto">
      {/* Background grid */}
      {[...Array(levels)].map((_, level) => {
        const radius = ((level + 1) / levels) * maxRadius
        const gridPoints = ENEMY_ORDER.map((_, i) => {
          const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
          return `${centerX + radius * Math.cos(angle)},${centerY + radius * Math.sin(angle)}`
        }).join(' ')
        return (
          <polygon
            key={level}
            points={gridPoints}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        )
      })}

      {/* Axis lines */}
      {ENEMY_ORDER.map((enemy, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
        const endX = centerX + maxRadius * Math.cos(angle)
        const endY = centerY + maxRadius * Math.sin(angle)
        return (
          <line
            key={enemy}
            x1={centerX}
            y1={centerY}
            x2={endX}
            y2={endY}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
          />
        )
      })}

      {/* Data polygon */}
      <motion.path
        d={pathD}
        fill="rgba(245, 158, 11, 0.3)"
        stroke="#F59E0B"
        strokeWidth="2"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      />

      {/* Data points */}
      {points.map((point, i) => (
        <motion.circle
          key={ENEMY_ORDER[i]}
          cx={point.x}
          cy={point.y}
          r="4"
          fill={ENEMY_INFO[ENEMY_ORDER[i]].color}
          stroke="white"
          strokeWidth="2"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3, delay: 0.3 + i * 0.1 }}
        />
      ))}

      {/* Labels */}
      {ENEMY_ORDER.map((enemy, i) => {
        const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2
        const labelRadius = maxRadius + 25
        const x = centerX + labelRadius * Math.cos(angle)
        const y = centerY + labelRadius * Math.sin(angle)
        const info = ENEMY_INFO[enemy]
        return (
          <text
            key={enemy}
            x={x}
            y={y}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-[11px] fill-white/70 font-medium"
          >
            {info.sanskrit}
          </text>
        )
      })}
    </svg>
  )
}

// =============================================================================
// TEMPLATE CARD COMPONENT
// =============================================================================

interface TemplateCardProps {
  template: JourneyTemplate
  onStart: (templateId: string) => void
  isStarting: boolean
}

function TemplateCard({ template, onStart, isStarting }: TemplateCardProps) {
  const { triggerHaptic } = useHapticFeedback()
  const primaryEnemy = template.primary_enemy_tags[0] as EnemyType | undefined
  const enemyInfo = primaryEnemy ? ENEMY_INFO[primaryEnemy] : null

  const handleStart = () => {
    triggerHaptic('medium')
    onStart(template.id)
  }

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 md:p-5"
      style={{
        borderColor: enemyInfo ? `${enemyInfo.color}30` : undefined,
      }}
    >
      {/* Enemy indicator */}
      {enemyInfo && (
        <div
          className="absolute right-0 top-0 h-20 w-20 opacity-10"
          style={{
            background: `radial-gradient(circle at top right, ${enemyInfo.color}, transparent)`,
          }}
        />
      )}

      {/* Free badge */}
      {template.is_free && (
        <span className="absolute right-3 top-3 rounded-full bg-green-500/20 px-2 py-0.5 text-xs text-green-400 border border-green-500/30">
          Free
        </span>
      )}

      {/* Enemy tag */}
      {enemyInfo && (
        <div className="mb-3 flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: enemyInfo.color }}
          />
          <span className="text-xs font-medium" style={{ color: enemyInfo.color }}>
            {enemyInfo.sanskrit} ({enemyInfo.name})
          </span>
        </div>
      )}

      {/* Title */}
      <h3 className="mb-2 text-base sm:text-lg font-semibold text-white line-clamp-2">
        {template.title}
      </h3>

      {/* Description */}
      <p className="mb-4 text-sm text-white/60 line-clamp-2">
        {template.description || 'Begin your journey of transformation'}
      </p>

      {/* Metadata */}
      <div className="mb-4 flex items-center gap-4 text-xs text-white/50">
        <span>{template.duration_days} days</span>
        <span className={getDifficultyColor(template.difficulty)}>
          {getDifficultyLabel(template.difficulty)}
        </span>
      </div>

      {/* Start button */}
      <button
        onClick={handleStart}
        disabled={isStarting}
        className="w-full rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 py-2.5 text-sm font-medium text-black transition-all hover:from-amber-400 hover:to-orange-400 disabled:opacity-50"
      >
        {isStarting ? 'Starting...' : 'Start Journey'}
      </button>
    </motion.div>
  )
}

// =============================================================================
// ACTIVE JOURNEY CARD COMPONENT
// =============================================================================

interface ActiveJourneyCardProps {
  journey: JourneyResponse
}

function ActiveJourneyCard({ journey }: ActiveJourneyCardProps) {
  const { triggerHaptic } = useHapticFeedback()
  const primaryEnemy = journey.primary_enemies[0] as EnemyType | undefined
  const enemyInfo = primaryEnemy ? ENEMY_INFO[primaryEnemy] : null

  return (
    <Link href={`/journeys/guided/${journey.journey_id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => triggerHaptic('light')}
        className="relative overflow-hidden rounded-xl border border-white/10 bg-white/5 p-4"
        style={{
          borderColor: enemyInfo ? `${enemyInfo.color}30` : undefined,
        }}
      >
        {/* Progress bar background */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: enemyInfo
              ? `linear-gradient(to right, ${enemyInfo.color} ${journey.progress_percentage}%, transparent ${journey.progress_percentage}%)`
              : undefined,
          }}
        />

        <div className="relative">
          {/* Status badge */}
          <span className={`absolute right-0 top-0 rounded-full border px-2 py-0.5 text-xs ${getJourneyStatusColor(journey.status)}`}>
            {getJourneyStatusLabel(journey.status)}
          </span>

          {/* Enemy indicator */}
          {enemyInfo && (
            <div className="mb-2 flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: enemyInfo.color }}
              />
              <span className="text-xs" style={{ color: enemyInfo.color }}>
                {enemyInfo.sanskrit}
              </span>
            </div>
          )}

          {/* Title */}
          <h3 className="mb-2 pr-12 sm:pr-16 text-base font-semibold text-white line-clamp-1">
            {journey.title}
          </h3>

          {/* Progress info */}
          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Day {journey.current_day} of {journey.total_days}</span>
            <span className="font-medium text-amber-400">
              {Math.round(journey.progress_percentage)}%
            </span>
          </div>

          {/* Progress bar */}
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: enemyInfo?.color || '#F59E0B' }}
              initial={{ width: 0 }}
              animate={{ width: `${journey.progress_percentage}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>

          {/* Streak */}
          {journey.streak_days > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-amber-400">
              <span>🔥</span>
              <span>{journey.streak_days} day streak</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  )
}

// =============================================================================
// ENEMY FILTER COMPONENT
// =============================================================================

interface EnemyFilterProps {
  selected: EnemyType | null
  onSelect: (enemy: EnemyType | null) => void
}

function EnemyFilter({ selected, onSelect }: EnemyFilterProps) {
  const { triggerHaptic } = useHapticFeedback()

  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => {
          triggerHaptic('light')
          onSelect(null)
        }}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
          selected === null
            ? 'bg-amber-500 text-black'
            : 'bg-white/10 text-white/70 hover:bg-white/20'
        }`}
      >
        All
      </button>
      {ENEMY_ORDER.map((enemy) => {
        const info = ENEMY_INFO[enemy]
        const isSelected = selected === enemy
        return (
          <button
            key={enemy}
            onClick={() => {
              triggerHaptic('light')
              onSelect(isSelected ? null : enemy)
            }}
            className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              backgroundColor: isSelected ? info.color : 'rgba(255,255,255,0.1)',
              color: isSelected ? 'black' : info.color,
              borderColor: isSelected ? info.color : 'transparent',
            }}
          >
            {info.sanskrit}
          </button>
        )
      })}
    </div>
  )
}

// =============================================================================
// STATS CARDS COMPONENT
// =============================================================================

interface StatsCardsProps {
  dashboard: DashboardResponse | null
}

function StatsCards({ dashboard }: StatsCardsProps) {
  if (!dashboard) return null

  const stats = [
    {
      label: 'Active Journeys',
      value: dashboard.active_journeys.length,
      max: 5,
      icon: '🎯',
    },
    {
      label: 'Completed',
      value: dashboard.completed_journeys,
      icon: '✅',
    },
    {
      label: 'Days Practiced',
      value: dashboard.total_days_practiced,
      icon: '📅',
    },
    {
      label: 'Current Streak',
      value: dashboard.current_streak,
      suffix: ' days',
      icon: '🔥',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 text-center"
        >
          <div className="text-xl sm:text-2xl mb-1">{stat.icon}</div>
          <div className="text-xl sm:text-2xl font-bold text-white">
            {stat.value}
            {stat.suffix}
            {stat.max && <span className="text-white/40 text-lg">/{stat.max}</span>}
          </div>
          <div className="text-xs text-white/50">{stat.label}</div>
        </div>
      ))}
    </div>
  )
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function JourneysPageClient() {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()

  // State
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAuthError, setIsAuthError] = useState(false)
  const [isStuckError, setIsStuckError] = useState(false)
  const [isFixing, setIsFixing] = useState(false)
  const [dashboard, setDashboard] = useState<DashboardResponse | null>(null)
  const [templates, setTemplates] = useState<JourneyTemplate[]>([])
  const [selectedEnemy, setSelectedEnemy] = useState<EnemyType | null>(null)
  const [startingJourney, setStartingJourney] = useState<string | null>(null)
  const [showAllTemplates, setShowAllTemplates] = useState(false)

  // Load data
  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setIsAuthError(false)

      // Always load templates (no auth required)
      const templatesPromise = journeyEngineService.listTemplates({
        enemy: selectedEnemy || undefined,
        limit: showAllTemplates ? 50 : 6,
      })

      // Attempt to load dashboard - auth is handled via httpOnly cookies.
      // If user is not authenticated, the API returns 401 and we show auth prompt.
      const dashboardPromise: Promise<DashboardResponse | null> =
        journeyEngineService.getDashboard().catch((err) => {
          console.warn('[JourneysPageClient] Dashboard load failed:', err)
          if (err instanceof JourneyEngineError && err.isAuthError()) {
            setIsAuthError(true)
          }
          return null
        })

      const [templatesData, dashboardData] = await Promise.all([
        templatesPromise,
        dashboardPromise,
      ])

      setTemplates(templatesData.templates)
      if (dashboardData) {
        setDashboard(dashboardData)
      }
    } catch (err) {
      if (err instanceof JourneyEngineError) {
        if (err.isAuthError()) {
          setIsAuthError(true)
          setError('Please sign in to access your journeys.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to load journeys. Please try again.')
      }
      console.error('[JourneysPageClient] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedEnemy, showAllTemplates])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle starting a journey
  const handleStartJourney = async (templateId: string) => {
    if (startingJourney) return

    // Check if user has max active journeys
    if (dashboard && dashboard.active_journeys.length >= 5) {
      setError('You can only have 5 active journeys at a time. Complete or abandon a journey to start a new one.')
      triggerHaptic('error')
      return
    }

    try {
      setStartingJourney(templateId)
      const journey = await journeyEngineService.startJourney({ template_id: templateId })
      triggerHaptic('success')
      router.push(`/journeys/guided/${journey.journey_id}`)
    } catch (err) {
      const message = err instanceof JourneyEngineError
        ? err.message
        : 'Failed to start journey. Please try again.'
      setError(message)
      // Detect stuck state: error says "active journeys" but dashboard shows none
      if (message.toLowerCase().includes('active journeys') && (!dashboard || dashboard.active_journeys.length === 0)) {
        setIsStuckError(true)
      }
      triggerHaptic('error')
    } finally {
      setStartingJourney(null)
    }
  }

  // Handle fixing stuck journeys
  const handleFixStuckJourneys = async () => {
    try {
      setIsFixing(true)
      setError(null)

      const result = await journeyEngineService.fixStuckJourneys()

      triggerHaptic('success')
      setIsStuckError(false)
      setError(null)

      // Reload data after fix
      await loadData()

      // Show success message briefly
      setError(`Fixed! Cleared ${result.orphaned_cleaned || 0} orphaned journeys. You can now start a new journey.`)
      setTimeout(() => setError(null), 5000)
    } catch (err) {
      const message = err instanceof JourneyEngineError
        ? err.message
        : 'Failed to fix stuck journeys. Please try again.'
      setError(message)
      triggerHaptic('error')
    } finally {
      setIsFixing(false)
    }
  }

  // Render auth error state
  if (isAuthError) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-3 sm:px-4 pb-28 sm:pb-20 pt-2 sm:pt-4 lg:px-6">
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">My Journeys</h1>
              <p className="mt-1 text-white/60">Transform through Bhagavad Gita wisdom</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-amber-500/30 bg-amber-900/20 p-8 text-center"
          >
            <div className="text-5xl mb-4">🙏</div>
            <h3 className="text-lg font-medium text-white mb-2">Sign In to Begin Your Journey</h3>
            <p className="text-white/60 mb-6 max-w-md mx-auto">
              Discover guided journeys based on the Six Inner Enemies (Shadripu) from the Bhagavad Gita.
              Track your progress, build streaks, and transform your inner world.
            </p>
            <Link
              href="/onboarding"
              className="inline-block rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-8 py-3 font-medium text-black hover:from-amber-400 hover:to-orange-400"
            >
              Sign In
            </Link>
          </motion.div>

          {/* Preview of enemies */}
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">The Six Inner Enemies (Shadripu)</h2>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
              {ENEMY_ORDER.map((enemy) => {
                const info = ENEMY_INFO[enemy]
                return (
                  <div
                    key={enemy}
                    className="rounded-xl border border-white/10 bg-white/5 p-4 text-center"
                    style={{ borderColor: `${info.color}30` }}
                  >
                    <div
                      className="mx-auto mb-2 h-10 w-10 rounded-full flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${info.color}20`, color: info.color }}
                    >
                      {info.icon === 'flame' && '🔥'}
                      {info.icon === 'zap' && '⚡'}
                      {info.icon === 'coins' && '💰'}
                      {info.icon === 'cloud' && '☁️'}
                      {info.icon === 'crown' && '👑'}
                      {info.icon === 'eye' && '👁️'}
                    </div>
                    <div className="text-sm font-semibold" style={{ color: info.color }}>
                      {info.sanskrit}
                    </div>
                    <div className="text-xs text-white/50">{info.name}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </FadeIn>
      </main>
    )
  }

  // Render loading state
  if (loading) {
    return (
      <main className="mx-auto max-w-5xl space-y-6 px-3 sm:px-4 pb-28 sm:pb-20 pt-2 sm:pt-4 lg:px-6">
        <FadeIn>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white md:text-3xl">My Journeys</h1>
              <p className="mt-1 text-white/60">Transform through Bhagavad Gita wisdom</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
          </div>
        </FadeIn>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 pb-20 pt-4 lg:px-6">
      <FadeIn>
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">My Journeys</h1>
            <p className="mt-1 text-white/60">Transform through Bhagavad Gita wisdom</p>
          </div>
          <Link
            href="/journeys/new"
            className="rounded-xl bg-white/10 px-4 py-2.5 font-medium text-white/70 transition-all hover:bg-white/20"
          >
            + Custom Journey
          </Link>
        </div>

        {/* Error message */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`rounded-xl border p-4 text-center ${
                error.includes('Fixed!') || error.includes('Cleared')
                  ? 'border-green-500/30 bg-green-900/20 text-green-400'
                  : 'border-red-500/30 bg-red-900/20 text-red-400'
              }`}
            >
              <p>{error}</p>
              <div className="mt-2 flex items-center justify-center gap-3">
                {isStuckError && (
                  <button
                    onClick={handleFixStuckJourneys}
                    disabled={isFixing}
                    className="rounded-lg bg-amber-500 px-4 py-1.5 text-sm font-medium text-black hover:bg-amber-400 disabled:opacity-50"
                  >
                    {isFixing ? 'Fixing...' : 'Fix Stuck Journeys'}
                  </button>
                )}
                <button
                  onClick={() => {
                    setError(null)
                    setIsStuckError(false)
                  }}
                  className="text-sm underline hover:opacity-80"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats */}
        <StatsCards dashboard={dashboard} />

        {/* Active Journeys Section */}
        {dashboard && dashboard.active_journeys.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Active Journeys</h2>
              <span className="text-xs text-white/50">
                {dashboard.active_journeys.length}/5 slots used
              </span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dashboard.active_journeys.map((journey) => (
                <ActiveJourneyCard key={journey.journey_id} journey={journey} />
              ))}
            </div>
          </section>
        )}

        {/* Progress Radar */}
        {dashboard && dashboard.enemy_progress.length > 0 && (
          <section className="rounded-xl border border-white/10 bg-white/5 p-3 sm:p-4 md:p-6">
            <h2 className="text-lg font-semibold text-white mb-4 text-center">
              Enemy Mastery Progress
            </h2>
            <div className="hidden sm:block">
              <EnemyRadarChart data={dashboard.enemy_progress} size={250} />
            </div>
            <div className="block sm:hidden">
              <EnemyRadarChart data={dashboard.enemy_progress} size={200} />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {ENEMY_ORDER.map((enemy) => {
                const info = ENEMY_INFO[enemy]
                const progress = dashboard.enemy_progress.find(p => p.enemy === enemy)
                const mastery = progress?.mastery_level || 0
                return (
                  <div key={enemy} className="text-center">
                    <div className="text-xs font-medium" style={{ color: info.color }}>
                      {info.sanskrit}
                    </div>
                    <div className="text-lg font-bold text-white">{mastery}%</div>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Journey Templates Section */}
        <section>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Start a Guided Journey</h2>
          </div>

          {/* Enemy filter */}
          <div className="mb-4">
            <EnemyFilter selected={selectedEnemy} onSelect={setSelectedEnemy} />
          </div>

          {/* Templates grid */}
          {templates.length > 0 ? (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    onStart={handleStartJourney}
                    isStarting={startingJourney === template.id}
                  />
                ))}
              </div>
              {!showAllTemplates && templates.length === 6 && (
                <button
                  onClick={() => setShowAllTemplates(true)}
                  className="mt-4 w-full rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-white/70 hover:bg-white/10"
                >
                  View All Templates
                </button>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
              <div className="text-4xl mb-3">📚</div>
              <h3 className="text-lg font-medium text-white mb-2">No Templates Available</h3>
              <p className="text-white/60">
                {selectedEnemy
                  ? `No journeys found for ${ENEMY_INFO[selectedEnemy].name}. Try selecting a different enemy.`
                  : 'Journey templates are being prepared. Please check back soon.'}
              </p>
            </div>
          )}
        </section>

        {/* Today's Steps (if any) */}
        {dashboard && dashboard.today_steps.length > 0 && (
          <section className="rounded-xl border border-amber-500/30 bg-amber-900/10 p-6">
            <h2 className="text-lg font-semibold text-amber-400 mb-4">
              Today&apos;s Practice ({dashboard.today_steps.length} steps)
            </h2>
            <div className="space-y-3">
              {dashboard.today_steps.map((step) => (
                <Link
                  key={step.step_id}
                  href={`/journeys/guided/${step.journey_id}`}
                  className="block rounded-lg border border-amber-500/20 bg-amber-900/20 p-4 hover:bg-amber-900/30 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-medium text-white">{step.step_title}</div>
                      <div className="text-xs text-white/50">Day {step.day_index}</div>
                    </div>
                    {step.is_completed ? (
                      <span className="text-green-400">✓ Complete</span>
                    ) : (
                      <span className="text-amber-400">→ Continue</span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </FadeIn>
    </main>
  )
}
