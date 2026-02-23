'use client'

/**
 * Unified Journeys Page - The Six Enemies (Shadripu) Dashboard
 *
 * A divine, immersive experience merging the journey engine dashboard
 * with journey management. Features gradient backgrounds, radar chart,
 * enemy mastery cards, animated template grid, and today's practice.
 */

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FadeIn } from '@/components/ui'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useLanguage } from '@/hooks/useLanguage'
import useAuth from '@/hooks/useAuth'
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
  getMasteryDescription,
} from '@/types/journeyEngine.types'

// =============================================================================
// HELPER: ICON NAME to EMOJI
// =============================================================================

const ICON_EMOJI: Record<string, string> = {
  flame: '\uD83D\uDD25',
  zap: '\u26A1',
  coins: '\uD83D\uDCB0',
  cloud: '\u2601\uFE0F',
  crown: '\uD83D\uDC51',
  eye: '\uD83D\uDC41\uFE0F',
}

function enemyEmoji(iconName: string): string {
  return ICON_EMOJI[iconName] || '\u2728'
}

// =============================================================================
// ENEMY RADAR CHART
// =============================================================================

interface RadarChartProps {
  data: EnemyProgressResponse[]
  size?: number
}

function EnemyRadarChart({ data, size = 240 }: RadarChartProps) {
  const center = size / 2
  const maxRadius = size * 0.38
  const levels = 5

  const getPoint = (index: number, value: number) => {
    const angle = (Math.PI * 2 * index) / 6 - Math.PI / 2
    const r = (value / 100) * maxRadius
    return { x: center + r * Math.cos(angle), y: center + r * Math.sin(angle) }
  }

  const getMastery = (enemy: string): number => {
    return data.find(p => p.enemy === enemy)?.mastery_level || 0
  }

  const points = ENEMY_ORDER.map((enemy, i) => getPoint(i, getMastery(enemy)))
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z'

  return (
    <div className="relative">
      <svg width={size} height={size} className="mx-auto">
        <defs>
          <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(212, 164, 76, 0.3)" />
            <stop offset="100%" stopColor="rgba(200, 148, 58, 0.15)" />
          </linearGradient>
          <filter id="radarGlow">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Grid rings */}
        {[...Array(levels)].map((_, level) => {
          const r = ((level + 1) / levels) * maxRadius
          const gp = ENEMY_ORDER.map((_, i) => {
            const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
            return `${center + r * Math.cos(a)},${center + r * Math.sin(a)}`
          }).join(' ')
          return (
            <polygon
              key={level}
              points={gp}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          )
        })}

        {/* Axis lines */}
        {ENEMY_ORDER.map((_, i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
          return (
            <line
              key={i}
              x1={center}
              y1={center}
              x2={center + maxRadius * Math.cos(a)}
              y2={center + maxRadius * Math.sin(a)}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          )
        })}

        {/* Data polygon */}
        <motion.path
          d={pathD}
          fill="url(#radarFill)"
          stroke="rgba(212, 164, 76, 0.7)"
          strokeWidth="2"
          filter="url(#radarGlow)"
          initial={{ opacity: 0, scale: 0.3 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />

        {/* Data points */}
        {points.map((p, i) => (
          <motion.circle
            key={ENEMY_ORDER[i]}
            cx={p.x}
            cy={p.y}
            r="5"
            fill={ENEMY_INFO[ENEMY_ORDER[i]].color}
            stroke="white"
            strokeWidth="2"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 + i * 0.08 }}
          />
        ))}

        {/* Labels */}
        {ENEMY_ORDER.map((enemy, i) => {
          const a = (Math.PI * 2 * i) / 6 - Math.PI / 2
          const lr = maxRadius + 28
          const x = center + lr * Math.cos(a)
          const y = center + lr * Math.sin(a)
          const info = ENEMY_INFO[enemy]
          return (
            <text
              key={enemy}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-[10px] fill-white/60 font-medium"
            >
              {info.sanskrit}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// =============================================================================
// ENEMY MASTERY CARD (sidebar)
// =============================================================================

function EnemyMasteryCard({
  enemy,
  mastery,
  isSelected,
  onSelect,
}: {
  enemy: EnemyType
  mastery: number
  isSelected: boolean
  onSelect: () => void
}) {
  const info = ENEMY_INFO[enemy]

  return (
    <motion.button
      onClick={onSelect}
      whileTap={{ scale: 0.97 }}
      className={`
        relative w-full p-3 rounded-xl border text-left transition-all duration-300
        ${isSelected
          ? 'border-[#d4a44c]/30 bg-[#d4a44c]/10 shadow-lg shadow-[#d4a44c]/10'
          : 'border-white/[0.07] bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/15'
        }
      `}
    >
      <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${info.gradient} opacity-[0.06]`} />
      <div className="relative">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-lg">{enemyEmoji(info.icon)}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/10 text-white/60">
            {getMasteryDescription(mastery)}
          </span>
        </div>
        <div className="text-[11px] font-medium text-white/50">{info.sanskrit}</div>
        <div className="text-sm font-semibold text-white">{info.name}</div>
        <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full bg-gradient-to-r ${info.gradient}`}
            initial={{ width: 0 }}
            animate={{ width: `${mastery}%` }}
            transition={{ duration: 0.6, delay: 0.2 }}
          />
        </div>
        <div className="mt-1 text-[10px] text-white/40">{mastery}% mastery</div>
      </div>
    </motion.button>
  )
}

// =============================================================================
// ACTIVE JOURNEY CARD
// =============================================================================

function ActiveJourneyCard({ journey }: { journey: JourneyResponse }) {
  const { triggerHaptic } = useHapticFeedback()
  const primaryEnemy = journey.primary_enemies[0] as EnemyType | undefined
  const enemyInfo = primaryEnemy ? ENEMY_INFO[primaryEnemy] : null

  return (
    <Link href={`/journeys/guided/${journey.journey_id}`}>
      <motion.div
        whileHover={{ scale: 1.02, y: -3 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => triggerHaptic('light')}
        className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
        style={{ borderColor: enemyInfo ? `${enemyInfo.color}25` : undefined }}
      >
        {/* Subtle gradient fill based on progress */}
        {enemyInfo && (
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              background: `linear-gradient(to right, ${enemyInfo.color} ${journey.progress_percentage}%, transparent ${journey.progress_percentage}%)`,
            }}
          />
        )}

        <div className="relative">
          <span className={`absolute right-0 top-0 rounded-full border px-2 py-0.5 text-[10px] ${getJourneyStatusColor(journey.status)}`}>
            {getJourneyStatusLabel(journey.status)}
          </span>

          {enemyInfo && (
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-sm">{enemyEmoji(enemyInfo.icon)}</span>
              <span className="text-xs font-medium" style={{ color: enemyInfo.color }}>
                {enemyInfo.sanskrit}
              </span>
            </div>
          )}

          <h3 className="mb-2 pr-16 text-sm font-semibold text-white line-clamp-1">
            {journey.title}
          </h3>

          <div className="flex items-center justify-between text-xs text-white/50">
            <span>Day {journey.current_day} of {journey.total_days}</span>
            <span className="font-bold text-[#e8b54a]">{Math.round(journey.progress_percentage)}%</span>
          </div>

          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#c8943a] to-[#e8b54a]"
              style={{ backgroundColor: enemyInfo?.color }}
              initial={{ width: 0 }}
              animate={{ width: `${journey.progress_percentage}%` }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </div>

          {journey.streak_days > 0 && (
            <div className="mt-2 flex items-center gap-1 text-[11px] text-amber-400/80">
              <span>{'\uD83D\uDD25'}</span>
              <span>{journey.streak_days} day streak</span>
            </div>
          )}
        </div>
      </motion.div>
    </Link>
  )
}

// =============================================================================
// TEMPLATE CARD
// =============================================================================

function TemplateCard({
  template,
  onStart,
  isStarting,
  disabled,
}: {
  template: JourneyTemplate
  onStart: (id: string) => void
  isStarting: boolean
  disabled: boolean
}) {
  const { triggerHaptic } = useHapticFeedback()
  const primaryEnemy = template.primary_enemy_tags[0] as EnemyType | undefined
  const enemyInfo = primaryEnemy ? ENEMY_INFO[primaryEnemy] : null

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm"
      style={{ borderColor: enemyInfo ? `${enemyInfo.color}20` : undefined }}
    >
      {/* Top-right glow */}
      {enemyInfo && (
        <div
          className="absolute -right-4 -top-4 h-24 w-24 opacity-[0.12] blur-xl"
          style={{ background: `radial-gradient(circle, ${enemyInfo.color}, transparent)` }}
        />
      )}

      <div className="relative">
        {/* Header row: icon + free badge */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2.5">
            {enemyInfo && (
              <div
                className={`w-9 h-9 rounded-lg bg-gradient-to-br ${enemyInfo.gradient} flex items-center justify-center text-base shadow-lg`}
                style={{ boxShadow: `0 4px 12px ${enemyInfo.color}30` }}
              >
                {enemyEmoji(enemyInfo.icon)}
              </div>
            )}
            <div>
              <div className="text-[11px] font-medium" style={{ color: enemyInfo?.color || '#a78bfa' }}>
                {enemyInfo?.sanskrit || 'Journey'}
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-white/40">{template.duration_days} days</span>
                <span className={`text-[10px] ${getDifficultyColor(template.difficulty)}`}>
                  {getDifficultyLabel(template.difficulty)}
                </span>
              </div>
            </div>
          </div>
          {template.is_free && (
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20">
              Free
            </span>
          )}
        </div>

        {/* Title + description */}
        <h3 className="mb-1.5 text-sm font-semibold text-white line-clamp-2">
          {template.title}
        </h3>
        <p className="mb-4 text-xs text-white/50 line-clamp-2">
          {template.description || 'Begin your journey of inner transformation'}
        </p>

        {/* Start button */}
        <button
          onClick={() => {
            triggerHaptic('medium')
            onStart(template.id)
          }}
          disabled={isStarting || disabled}
          className="w-full rounded-lg py-2 text-xs font-semibold text-[#0a0a0f] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[#d4a44c]/20 hover:shadow-[#d4a44c]/30"
          style={{ background: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 45%, #f0c96d 100%)' }}
        >
          {isStarting ? 'Starting...' : 'Start Journey'}
        </button>
      </div>
    </motion.div>
  )
}

// =============================================================================
// ENEMY FILTER PILLS
// =============================================================================

function EnemyFilter({
  selected,
  onSelect,
}: {
  selected: EnemyType | null
  onSelect: (e: EnemyType | null) => void
}) {
  const { triggerHaptic } = useHapticFeedback()

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        onClick={() => { triggerHaptic('light'); onSelect(null) }}
        className={`rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
          selected === null
            ? 'text-[#0a0a0f] shadow-lg shadow-[#d4a44c]/25'
            : 'bg-white/[0.06] text-white/60 hover:bg-white/10'
        }`}
        style={selected === null ? { background: 'linear-gradient(135deg, #c8943a, #e8b54a)' } : undefined}
      >
        All
      </button>
      {ENEMY_ORDER.map((enemy) => {
        const info = ENEMY_INFO[enemy]
        const isActive = selected === enemy
        return (
          <button
            key={enemy}
            onClick={() => { triggerHaptic('light'); onSelect(isActive ? null : enemy) }}
            className="rounded-full px-3 py-1.5 text-xs font-medium transition-all"
            style={{
              backgroundColor: isActive ? info.color : 'rgba(255,255,255,0.05)',
              color: isActive ? '#000' : info.color,
              boxShadow: isActive ? `0 2px 10px ${info.color}40` : 'none',
            }}
          >
            {enemyEmoji(info.icon)} {info.sanskrit}
          </button>
        )
      })}
    </div>
  )
}

// =============================================================================
// STAT CARD
// =============================================================================

function StatCard({
  label,
  value,
  suffix,
  max,
  gradient,
  delay = 0,
}: {
  label: string
  value: number
  suffix?: string
  max?: number
  gradient: string
  delay?: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="relative overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] p-3 sm:p-4 text-center backdrop-blur-sm"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-[0.06]`} />
      <div className="relative">
        <div className="text-2xl sm:text-3xl font-bold text-white">
          {value}
          {suffix && <span className="text-lg text-white/60">{suffix}</span>}
          {max !== undefined && <span className="text-lg text-white/30">/{max}</span>}
        </div>
        <div className="text-[11px] text-white/55 mt-1">{label}</div>
      </div>
    </motion.div>
  )
}

// =============================================================================
// MAIN PAGE COMPONENT
// =============================================================================

export default function JourneysPageClient() {
  const router = useRouter()
  const { triggerHaptic } = useHapticFeedback()
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { t } = useLanguage()

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

      const templatesPromise = journeyEngineService.listTemplates({
        enemy: selectedEnemy || undefined,
        limit: showAllTemplates ? 50 : 6,
      })

      let dashboardPromise: Promise<DashboardResponse | null>
      if (isAuthenticated) {
        dashboardPromise = journeyEngineService.getDashboard().catch((err) => {
          if (err instanceof JourneyEngineError && err.isAuthError()) {
            setIsAuthError(true)
          }
          return null
        })
      } else {
        dashboardPromise = Promise.resolve(null)
        setIsAuthError(true)
      }

      const [templatesData, dashboardData] = await Promise.all([
        templatesPromise,
        dashboardPromise,
      ])

      if (templatesData?.templates) {
        setTemplates(templatesData.templates)
      }
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
    } finally {
      setLoading(false)
    }
  }, [selectedEnemy, showAllTemplates, isAuthenticated])

  useEffect(() => {
    if (!authLoading) {
      loadData()
    }
  }, [loadData, authLoading])

  // Start journey handler
  const handleStartJourney = async (templateId: string) => {
    if (startingJourney) return
    if (dashboard && dashboard.active_journeys.length >= 5) {
      setError('You can only have 5 active journeys at a time. Complete or abandon one first.')
      triggerHaptic('error')
      return
    }
    try {
      setStartingJourney(templateId)
      const journey = await journeyEngineService.startJourney({ template_id: templateId })
      triggerHaptic('success')
      router.push(`/journeys/guided/${journey.journey_id}`)
    } catch (err) {
      const message = err instanceof JourneyEngineError ? err.message : 'Failed to start journey.'
      setError(message)
      if (message.toLowerCase().includes('active journeys') && (!dashboard || dashboard.active_journeys.length === 0)) {
        setIsStuckError(true)
      }
      triggerHaptic('error')
    } finally {
      setStartingJourney(null)
    }
  }

  // Fix stuck journeys
  const handleFixStuckJourneys = async () => {
    try {
      setIsFixing(true)
      setError(null)
      const result = await journeyEngineService.fixStuckJourneys()
      triggerHaptic('success')
      setIsStuckError(false)
      await loadData()
      setError(`Fixed! Cleared ${result.orphaned_cleaned || 0} orphaned journeys. You can now start a new journey.`)
      setTimeout(() => setError(null), 5000)
    } catch (err) {
      setError(err instanceof JourneyEngineError ? err.message : 'Failed to fix stuck journeys.')
      triggerHaptic('error')
    } finally {
      setIsFixing(false)
    }
  }

  const activeJourneyCount = dashboard?.active_journeys.filter(j => j.status === 'active').length || 0
  const canStartNewJourney = activeJourneyCount < 5

  // =========================================================================
  // AUTH ERROR STATE - Sign-in prompt with enemy preview
  // =========================================================================
  if (isAuthError && !dashboard) {
    return (
      <div className="min-h-screen relative">
        {/* Background */}
        <div className="fixed inset-0 bg-[#050507] pointer-events-none" />
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-[#d4a44c]/[0.04] rounded-full blur-[120px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] bg-[#d4a44c]/[0.03] rounded-full blur-[100px]" />
        </div>

        <main className="relative z-10 mx-auto max-w-6xl space-y-8 px-4 sm:px-6 lg:px-8 pb-28 sm:pb-20 md:pb-10 pt-6">
          <FadeIn>
            {/* Header */}
            <div className="text-center mb-2">
              <h1 className="text-3xl sm:text-4xl font-bold text-white">
                The Six Enemies{' '}
                <span style={{ background: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 50%, #f0c96d 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  (Shadripu)
                </span>
              </h1>
              <p className="mt-3 text-white/50 max-w-xl mx-auto text-sm leading-relaxed">
                According to the Bhagavad Gita, these six inner enemies prevent us from attaining peace.
                Master them through guided journeys of wisdom and practice.
              </p>
            </div>

            {/* Sign-in card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl border border-[#d4a44c]/20 bg-white/[0.03] backdrop-blur-sm p-8 text-center"
            >
              <div className="text-5xl mb-4">{'\uD83D\uDE4F'}</div>
              <h3 className="text-lg font-semibold text-white mb-2">Sign In to Begin Your Journey</h3>
              <p className="text-white/50 mb-6 max-w-md mx-auto text-sm">
                Discover guided journeys to strengthen your inner steadiness.
                Track progress, build streaks, and transform from within.
              </p>
              <Link
                href="/onboarding"
                className="inline-block rounded-xl px-8 py-3 font-medium text-[#0a0a0f] shadow-lg shadow-[#d4a44c]/20 transition-all hover:shadow-xl"
                style={{ background: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 45%, #f0c96d 100%)' }}
              >
                Sign In
              </Link>
            </motion.div>

            {/* Enemy preview grid */}
            <div className="mt-8">
              <h2 className="text-base font-semibold text-white/70 mb-4 text-center">The Six Inner Enemies</h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
                {ENEMY_ORDER.map((enemy, i) => {
                  const info = ENEMY_INFO[enemy]
                  return (
                    <motion.div
                      key={enemy}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-4 text-center"
                    >
                      <div
                        className="mx-auto mb-2 h-10 w-10 rounded-full flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${info.color}15`, boxShadow: `0 0 20px ${info.color}15` }}
                      >
                        {enemyEmoji(info.icon)}
                      </div>
                      <div className="text-sm font-semibold" style={{ color: info.color }}>{info.sanskrit}</div>
                      <div className="text-[11px] text-white/50">{info.name}</div>
                    </motion.div>
                  )
                })}
              </div>
            </div>

            {/* Show templates even when not authed */}
            {templates.length > 0 && (
              <div className="mt-8">
                <h2 className="text-base font-semibold text-white/70 mb-4">Available Journeys</h2>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {templates.slice(0, 6).map((template) => (
                    <TemplateCard
                      key={template.id}
                      template={template}
                      onStart={() => router.push('/onboarding')}
                      isStarting={false}
                      disabled={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </FadeIn>
        </main>
      </div>
    )
  }

  // =========================================================================
  // LOADING STATE
  // =========================================================================
  if (loading || authLoading) {
    return (
      <div className="min-h-screen relative">
        <div className="fixed inset-0 bg-[#050507] pointer-events-none" />
        <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white">Strengthen Steadiness Within</h1>
            <p className="mt-2 text-white/50 text-sm">Loading your journey...</p>
          </div>
          <div className="flex items-center justify-center py-20">
            <div className="relative">
              <div className="h-14 w-14 animate-spin rounded-full border-2 border-[#d4a44c]/30 border-t-[#d4a44c]" />
              <div className="absolute inset-0 h-14 w-14 animate-ping rounded-full border border-[#d4a44c]/20" />
            </div>
          </div>
        </main>
      </div>
    )
  }

  // =========================================================================
  // MAIN DASHBOARD VIEW
  // =========================================================================
  return (
    <div className="min-h-screen relative">
      {/* Deep black background */}
      <div className="fixed inset-0 bg-[#050507] pointer-events-none" />

      {/* Ambient floating golden orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[20%] w-[500px] h-[500px] bg-[#d4a44c]/[0.04] rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[20%] right-[15%] w-[400px] h-[400px] bg-[#d4a44c]/[0.03] rounded-full blur-[100px] animate-pulse" style={{ animationDuration: '12s' }} />
        <div className="absolute top-[60%] left-[50%] w-[300px] h-[300px] bg-[#d4a44c]/[0.02] rounded-full blur-[80px] animate-pulse" style={{ animationDuration: '10s' }} />
      </div>

      <main className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pb-28 sm:pb-20 md:pb-10 pt-4 sm:pt-6">
        <FadeIn>
          {/* ============================================================= */}
          {/* HERO HEADER                                                    */}
          {/* ============================================================= */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between mb-6 gap-4">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white"
              >
                The Six Enemies{' '}
                <span style={{ background: 'linear-gradient(135deg, #c8943a 0%, #e8b54a 50%, #f0c96d 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  (Shadripu)
                </span>
              </motion.h1>
              <p className="mt-1.5 text-white/50 text-sm max-w-lg">
                Master the inner enemies through guided journeys of Gita wisdom and daily practice.
              </p>
              <p className="mt-1 text-[11px] tracking-wide text-[#d4a44c]/35" data-testid="mode-label">
                {t('dashboard.mode_label.prefix', 'You are in:')} {t('dashboard.mode_label.journey', 'Training Mode')}
              </p>
            </div>
            <Link
              href="/journeys/new"
              className="shrink-0 rounded-xl border border-[#d4a44c]/20 bg-[#d4a44c]/5 px-4 py-2.5 text-sm font-medium text-[#d4a44c]/70 transition-all hover:bg-[#d4a44c]/10 hover:text-[#e8b54a]"
            >
              + Custom Journey
            </Link>
          </div>

          {/* ============================================================= */}
          {/* ERROR BANNER                                                   */}
          {/* ============================================================= */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`mb-6 rounded-xl border p-4 text-center backdrop-blur-sm ${
                  error.includes('Fixed!') || error.includes('Cleared')
                    ? 'border-emerald-500/30 bg-emerald-900/20 text-emerald-300'
                    : 'border-red-500/20 bg-red-900/15 text-red-300'
                }`}
              >
                <p className="text-sm">{error}</p>
                <div className="mt-2 flex items-center justify-center gap-3">
                  {isStuckError && (
                    <button
                      onClick={handleFixStuckJourneys}
                      disabled={isFixing}
                      className="rounded-lg px-4 py-1.5 text-xs font-medium text-[#0a0a0f] disabled:opacity-50"
                      style={{ background: 'linear-gradient(135deg, #c8943a, #e8b54a)' }}
                    >
                      {isFixing ? 'Fixing...' : 'Fix Stuck Journeys'}
                    </button>
                  )}
                  <button
                    onClick={() => { setError(null); setIsStuckError(false); loadData() }}
                    className="rounded-lg border border-white/10 bg-white/[0.05] px-4 py-1.5 text-xs font-medium text-white/70 hover:bg-white/[0.08] transition"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => { setError(null); setIsStuckError(false) }}
                    className="text-xs text-white/50 underline hover:text-white/70 transition"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ============================================================= */}
          {/* STATS ROW                                                      */}
          {/* ============================================================= */}
          {dashboard && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-4 mb-8">
              <StatCard
                label="Active Journeys"
                value={dashboard.active_journeys.length}
                max={5}
                gradient="from-purple-500 to-indigo-500"
                delay={0}
              />
              <StatCard
                label="Completed"
                value={dashboard.completed_journeys}
                gradient="from-emerald-500 to-green-500"
                delay={0.05}
              />
              <StatCard
                label="Day Streak"
                value={dashboard.current_streak}
                gradient="from-amber-500 to-orange-500"
                delay={0.1}
              />
              <StatCard
                label="Days Practiced"
                value={dashboard.total_days_practiced}
                gradient="from-pink-500 to-rose-500"
                delay={0.15}
              />
            </div>
          )}

          {/* ============================================================= */}
          {/* TODAY'S PRACTICE (prominent when available)                     */}
          {/* ============================================================= */}
          {dashboard && dashboard.today_steps.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-2xl border border-[#d4a44c]/15 bg-gradient-to-r from-[#d4a44c]/[0.06] to-[#d4a44c]/[0.02] p-5 backdrop-blur-sm"
            >
              <h2 className="text-base font-semibold text-[#e8b54a] mb-3">
                Today&apos;s Practice ({dashboard.today_steps.length} {dashboard.today_steps.length === 1 ? 'step' : 'steps'})
              </h2>
              <div className="space-y-2">
                {dashboard.today_steps.map((step) => (
                  <Link
                    key={step.step_id}
                    href={`/journeys/guided/${step.journey_id}`}
                    className="flex items-center justify-between p-3 rounded-xl bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.07] transition-all"
                  >
                    <div>
                      <div className="text-sm font-medium text-white">{step.step_title}</div>
                      <div className="text-xs text-white/40">Day {step.day_index}</div>
                    </div>
                    {step.is_completed ? (
                      <span className="text-xs text-emerald-400 font-medium">{'\u2713'} Complete</span>
                    ) : (
                      <span className="px-3 py-1 text-xs font-medium rounded-lg text-[#0a0a0f]" style={{ background: 'linear-gradient(135deg, #c8943a, #e8b54a)' }}>
                        Practice Now
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </motion.section>
          )}

          {/* ============================================================= */}
          {/* MAIN 3-COLUMN LAYOUT                                           */}
          {/* ============================================================= */}
          <div className="grid lg:grid-cols-12 gap-6">
            {/* ========== LEFT SIDEBAR: Radar + Enemy Cards ========== */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-5">
              {/* Radar Chart */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-sm"
              >
                <h3 className="text-sm font-semibold text-white/70 mb-3 text-center">
                  Enemy Mastery Radar
                </h3>
                <div className="hidden sm:block lg:hidden">
                  <EnemyRadarChart data={dashboard?.enemy_progress || []} size={280} />
                </div>
                <div className="block sm:hidden lg:block">
                  <EnemyRadarChart data={dashboard?.enemy_progress || []} size={220} />
                </div>
              </motion.div>

              {/* Enemy Mastery Cards */}
              <div className="grid grid-cols-2 gap-2">
                {ENEMY_ORDER.map((enemy) => {
                  const progress = dashboard?.enemy_progress.find(p => p.enemy === enemy)
                  return (
                    <EnemyMasteryCard
                      key={enemy}
                      enemy={enemy}
                      mastery={progress?.mastery_level || 0}
                      isSelected={selectedEnemy === enemy}
                      onSelect={() => {
                        triggerHaptic('light')
                        setSelectedEnemy(selectedEnemy === enemy ? null : enemy)
                      }}
                    />
                  )
                })}
              </div>
            </div>

            {/* ========== RIGHT: Active Journeys + Templates ========== */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
              {/* Active Journeys */}
              {dashboard && dashboard.active_journeys.length > 0 && (
                <section>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-base font-semibold text-white">Your Active Journeys</h2>
                    <span className="text-xs text-white/35">{activeJourneyCount}/5 slots</span>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {dashboard.active_journeys.map((journey) => (
                      <ActiveJourneyCard key={journey.journey_id} journey={journey} />
                    ))}
                  </div>
                </section>
              )}

              {/* Max journeys warning */}
              {!canStartNewJourney && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                  <p className="text-amber-300/80 text-xs">
                    You have 5 active journeys. Complete or pause one to start another.
                  </p>
                </div>
              )}

              {/* Available Templates */}
              <section>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-base font-semibold text-white">
                    {selectedEnemy
                      ? `${ENEMY_INFO[selectedEnemy].name} Journeys`
                      : 'Available Journeys'}
                  </h2>
                  {selectedEnemy && (
                    <button
                      onClick={() => setSelectedEnemy(null)}
                      className="text-xs text-[#d4a44c] hover:text-[#e8b54a]"
                    >
                      Show All
                    </button>
                  )}
                </div>

                {/* Enemy filter pills */}
                <div className="mb-4">
                  <EnemyFilter selected={selectedEnemy} onSelect={setSelectedEnemy} />
                </div>

                {/* Templates grid */}
                {templates.length > 0 ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {templates.map((template) => (
                        <TemplateCard
                          key={template.id}
                          template={template}
                          onStart={handleStartJourney}
                          isStarting={startingJourney === template.id}
                          disabled={!canStartNewJourney}
                        />
                      ))}
                    </div>

                    {!showAllTemplates && templates.length >= 6 && (
                      <motion.button
                        onClick={() => setShowAllTemplates(true)}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        className="mt-4 w-full rounded-xl border border-[#d4a44c]/15 bg-[#d4a44c]/5 py-3 text-sm font-medium text-[#d4a44c]/70 hover:bg-[#d4a44c]/10 hover:text-[#e8b54a] transition-all"
                      >
                        View All Templates
                      </motion.button>
                    )}
                  </>
                ) : (
                  <div className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-8 text-center">
                    <div className="text-3xl mb-3">{'\uD83D\uDCDA'}</div>
                    <h3 className="text-base font-medium text-white mb-1">No Templates Available</h3>
                    <p className="text-sm text-white/40">
                      {selectedEnemy
                        ? `No journeys found for ${ENEMY_INFO[selectedEnemy].name}. Try a different enemy.`
                        : 'Journey templates are being prepared. Please check back soon.'}
                    </p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </FadeIn>
      </main>
    </div>
  )
}
