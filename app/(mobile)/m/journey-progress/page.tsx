'use client'

/**
 * Journey Progress Page — Chakra-Based Spiritual Progress Visualization
 *
 * Displays the user's spiritual journey as a vertical chakra column
 * (Muladhara to Sahasrara). Each chakra represents a milestone tied
 * to the user's streak and engagement metrics. Sacred metrics cards
 * sit above the column showing days of dharma, shlokas, and questions.
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

import { MobileAppShell } from '@/components/mobile/MobileAppShell'
import { SacredOMLoader } from '@/components/sacred/SacredOMLoader'
import { SacredCard } from '@/components/sacred/SacredCard'
import { apiFetch } from '@/lib/api'

/* ---------- Chakra definitions (bottom to top) ---------- */

interface Chakra {
  name: string
  sanskrit: string
  color: string
  streakMin: number
  streakMax: number
}

const CHAKRAS: Chakra[] = [
  { name: 'Crown',        sanskrit: 'Sahasrara',    color: '#A855F7', streakMin: 25, streakMax: Infinity },
  { name: 'Third Eye',    sanskrit: 'Ajna',         color: '#6366F1', streakMin: 21, streakMax: 24 },
  { name: 'Throat',       sanskrit: 'Vishuddha',    color: '#3B82F6', streakMin: 16, streakMax: 20 },
  { name: 'Heart',        sanskrit: 'Anahata',      color: '#22C55E', streakMin: 12, streakMax: 15 },
  { name: 'Solar Plexus', sanskrit: 'Manipura',     color: '#EAB308', streakMin: 8,  streakMax: 11 },
  { name: 'Sacral',       sanskrit: 'Svadhisthana', color: '#F97316', streakMin: 4,  streakMax: 7 },
  { name: 'Root',         sanskrit: 'Muladhara',    color: '#EF4444', streakMin: 0,  streakMax: 3 },
]

/* ---------- Types ---------- */

type ChakraState = 'completed' | 'active' | 'upcoming'

interface DashboardData {
  streak: number
  insightsCount: number
  journalEntries: number
}

/* ---------- Helpers ---------- */

function getChakraLevel(streak: number): number {
  // Returns the index in CHAKRAS that is currently active (0 = top, 6 = bottom)
  for (let i = 0; i < CHAKRAS.length; i++) {
    if (streak >= CHAKRAS[i].streakMin && streak <= CHAKRAS[i].streakMax) {
      return i
    }
  }
  return CHAKRAS.length - 1
}

function getChakraState(index: number, activeLevel: number): ChakraState {
  // Lower index = higher chakra. Active level index tells us which is current.
  if (index > activeLevel) return 'completed'
  if (index === activeLevel) return 'active'
  return 'upcoming'
}

/* ---------- Sub-components ---------- */

function ChakraNode({
  chakra,
  state,
  index,
}: {
  chakra: Chakra
  state: ChakraState
  index: number
}) {
  const isActive = state === 'active'
  const isCompleted = state === 'completed'
  const isUpcoming = state === 'upcoming'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.08 * index, duration: 0.4 }}
      className="flex items-center gap-4"
    >
      {/* Chakra circle */}
      <div className="relative flex-shrink-0">
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: chakra.color, filter: 'blur(10px)', opacity: 0.5 }}
            animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        {isCompleted && (
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: '#D4A017', filter: 'blur(8px)', opacity: 0.35 }}
            animate={{ opacity: [0.25, 0.45, 0.25] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          />
        )}
        <div
          className="relative w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-300"
          style={{
            borderColor: isUpcoming ? 'rgba(255,255,255,0.15)' : isCompleted ? '#D4A017' : chakra.color,
            background: isUpcoming
              ? 'rgba(255,255,255,0.03)'
              : isCompleted
                ? 'rgba(212,160,23,0.15)'
                : `${chakra.color}22`,
          }}
        >
          <span
            className="text-xs font-bold"
            style={{
              color: isUpcoming ? 'rgba(255,255,255,0.3)' : isCompleted ? '#D4A017' : chakra.color,
            }}
          >
            {isCompleted ? '\u2713' : chakra.sanskrit.charAt(0)}
          </span>
        </div>
      </div>

      {/* Label */}
      <div>
        <p
          className={`text-sm font-semibold ${isUpcoming ? 'opacity-40' : ''}`}
          style={{ color: isUpcoming ? undefined : isCompleted ? '#D4A017' : chakra.color }}
        >
          {chakra.sanskrit}
        </p>
        <p className={`text-xs sacred-label ${isUpcoming ? 'opacity-30' : 'opacity-60'}`}>
          {chakra.name}
        </p>
      </div>

      {/* Active indicator */}
      {isActive && (
        <motion.span
          className="ml-auto text-[10px] font-bold uppercase tracking-widest sacred-text-ui"
          style={{ color: chakra.color }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          Current
        </motion.span>
      )}
    </motion.div>
  )
}

function EnergyLine({ activeLevel }: { activeLevel: number }) {
  // The line runs from bottom to top. The filled portion goes up to the active chakra.
  const filledPercent = ((CHAKRAS.length - 1 - activeLevel) / (CHAKRAS.length - 1)) * 100

  return (
    <div className="absolute left-6 top-0 bottom-0 w-[2px] -translate-x-1/2">
      {/* Background line */}
      <div className="absolute inset-0 bg-white/[0.06] rounded-full" />

      {/* Filled portion from bottom */}
      <motion.div
        className="absolute bottom-0 left-0 w-full rounded-full"
        style={{
          background: 'linear-gradient(to top, #EF4444, #F97316, #EAB308, #22C55E, #3B82F6, #6366F1, #A855F7)',
        }}
        initial={{ height: '0%' }}
        animate={{ height: `${filledPercent}%` }}
        transition={{ duration: 1.2, ease: 'easeOut', delay: 0.3 }}
      />

      {/* Animated pulse traveling upward */}
      <motion.div
        className="absolute left-0 w-full h-8 rounded-full"
        style={{
          background: 'linear-gradient(to top, transparent, rgba(212,160,23,0.6), transparent)',
        }}
        animate={{ bottom: ['0%', `${filledPercent}%`] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}

/* ---------- Main Page Component ---------- */

export default function JourneyProgressPage() {
  const [data, setData] = useState<DashboardData>({
    streak: 0,
    insightsCount: 0,
    journalEntries: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await apiFetch('/api/analytics/dashboard')
        if (response.ok) {
          const json = await response.json()
          setData({
            streak: json.streak || 0,
            insightsCount: json.insights_count || 0,
            journalEntries: json.journal_entries || 0,
          })
        }
      } catch (error) {
        // Fallback to zeros on network failure — user still sees the UI
        console.error('Failed to fetch dashboard analytics:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboard()
  }, [])

  if (isLoading) {
    return (
      <MobileAppShell title="Journey Progress" showHeader={true} showTabBar={true}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <SacredOMLoader size={56} message="Aligning your chakras..." />
        </div>
      </MobileAppShell>
    )
  }

  const activeLevel = getChakraLevel(data.streak)

  const metrics = [
    { label: 'Days of Dharma', value: data.streak },
    { label: 'Shlokas Received', value: data.insightsCount },
    { label: 'Questions Asked', value: data.journalEntries },
  ]

  return (
    <MobileAppShell title="Journey Progress" showHeader={true} showTabBar={true}>
      <div className="px-page-x pt-4 pb-8 space-y-6">
        {/* Sacred Metrics */}
        <motion.section
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="grid grid-cols-3 gap-3">
            {metrics.map((metric) => (
              <SacredCard key={metric.label} variant="sacred" className="text-center">
                <p className="text-xl font-bold sacred-text-divine">{metric.value}</p>
                <p className="text-[10px] mt-1 uppercase tracking-wider sacred-label">
                  {metric.label}
                </p>
              </SacredCard>
            ))}
          </div>
        </motion.section>

        <div className="sacred-divider" />

        {/* Chakra Column Header */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <h2 className="text-lg font-semibold sacred-text-divine">Spiritual Ascent</h2>
          <p className="text-xs sacred-text-ui opacity-50 mt-1">
            Your journey through the seven energy centers
          </p>
        </motion.div>

        {/* Chakra Column */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative pl-2"
        >
          {/* Energy line connecting all chakras */}
          <EnergyLine activeLevel={activeLevel} />

          {/* Chakra nodes (top to bottom: Sahasrara first) */}
          <div className="relative space-y-6 py-2">
            {CHAKRAS.map((chakra, index) => (
              <ChakraNode
                key={chakra.sanskrit}
                chakra={chakra}
                state={getChakraState(index, activeLevel)}
                index={index}
              />
            ))}
          </div>
        </motion.section>

        {/* Current level description */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <SacredCard variant="divine" className="text-center">
            <p className="text-xs uppercase tracking-widest sacred-label mb-2">Current Level</p>
            <p
              className="text-lg font-bold"
              style={{ color: CHAKRAS[activeLevel].color }}
            >
              {CHAKRAS[activeLevel].sanskrit}
            </p>
            <p className="text-xs sacred-text-ui opacity-50 mt-1">
              {CHAKRAS[activeLevel].name} Chakra
            </p>
            {activeLevel > 0 && (
              <p className="text-[11px] sacred-text-ui opacity-40 mt-3">
                {CHAKRAS[activeLevel].streakMax - data.streak + 1} more days to reach{' '}
                {CHAKRAS[activeLevel - 1].sanskrit}
              </p>
            )}
            {activeLevel === 0 && (
              <p className="text-[11px] sacred-text-divine mt-3">
                You have reached the highest chakra. Namaste.
              </p>
            )}
          </SacredCard>
        </motion.div>
      </div>
    </MobileAppShell>
  )
}
