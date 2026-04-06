/**
 * JourneysScreen — Main orchestrator for the mobile Shadripu Journeys experience.
 *
 * Manages 4-tab navigation (Today / Journeys / Battleground / Wisdom),
 * data loading via useMobileJourneys, and daily refresh via useDailyRefresh.
 * Renders a custom tab bar instead of MobileAppShell's default tabs.
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import useAuth from '@/hooks/useAuth'
import { useHapticFeedback } from '@/hooks/useHapticFeedback'
import { useDailyRefresh } from '@/hooks/useDailyRefresh'
import { useMobileJourneys } from './hooks/useMobileJourneys'
import { JourneysCanvas } from './visuals/JourneysCanvas'
import { TodayTab } from './tabs/TodayTab'
import { JourneysTab } from './tabs/JourneysTab'
import { BattlegroundTab } from './tabs/BattlegroundTab'
import { WisdomTab } from './tabs/WisdomTab'
import type { EnemyType } from '@/types/journeyEngine.types'

// =============================================================================
// TYPES
// =============================================================================

type JourneyTab = 'today' | 'journeys' | 'battleground' | 'wisdom'

interface TabDef {
  id: JourneyTab
  label: string
  icon: string
}

const TABS: TabDef[] = [
  { id: 'today', label: 'Today', icon: '\uD83D\uDD25' },
  { id: 'journeys', label: 'Journeys', icon: '\u2694\uFE0F' },
  { id: 'battleground', label: 'Battleground', icon: '\u2638\uFE0F' },
  { id: 'wisdom', label: 'Wisdom', icon: '\u2726' },
]

// =============================================================================
// COMPONENT
// =============================================================================

export default function JourneysScreen() {
  const { isAuthenticated, loading: authLoading } = useAuth()
  const { triggerHaptic } = useHapticFeedback()
  const [activeTab, setActiveTab] = useState<JourneyTab>('today')
  const [preselectedEnemy, setPreselectedEnemy] = useState<EnemyType | null>(null)
  const [pendingAutoOpenEnemy, setPendingAutoOpenEnemy] = useState<EnemyType | null>(null)

  const handleNavigateFromBattleground = useCallback((enemy: EnemyType) => {
    setPreselectedEnemy(enemy)
    setPendingAutoOpenEnemy(enemy)
    setActiveTab('journeys')
  }, [])

  const {
    dashboard,
    templates,
    isLoading,
    error,
    isAuthError,
    refreshData,
  } = useMobileJourneys(isAuthenticated)

  // Load data on mount once auth resolves
  useEffect(() => {
    if (!authLoading) {
      refreshData()
    }
  }, [authLoading, refreshData])

  // Daily refresh hook — triggers full refresh on day change and every 5 min
  const handleRefresh = useCallback(() => {
    refreshData()
  }, [refreshData])

  useDailyRefresh({
    onDayChange: handleRefresh,
    onRefresh: handleRefresh,
    pollingInterval: 5 * 60 * 1000,
  })

  const handleTabChange = (tab: JourneyTab) => {
    if (tab === activeTab) return
    triggerHaptic('light')
    setActiveTab(tab)
  }

  // Loading state
  const showLoading = authLoading || (isLoading && !dashboard)

  // ==========================================================================
  // AUTH ERROR — Sign-in prompt
  // ==========================================================================
  if (isAuthError && !dashboard && !authLoading) {
    return (
      <div className="relative min-h-[100dvh] bg-[#050714] flex flex-col items-center justify-center px-6">
        <JourneysCanvas activeTab="today" />
        <div className="relative z-10 text-center">
          <div className="text-5xl mb-4">{'\uD83D\uDE4F'}</div>
          <h2 className="font-divine text-2xl italic text-[#EDE8DC] mb-2">
            Begin Your Journey
          </h2>
          <p className="text-sm text-[#B8AE98] font-ui mb-6 max-w-xs">
            Sign in to discover guided journeys through the six inner enemies of the Bhagavad Gita.
          </p>
          <Link
            href="/m/onboarding"
            className="inline-block rounded-xl px-8 py-3 font-ui font-medium text-[#050714] text-sm"
            style={{
              background: 'linear-gradient(135deg, #c8943a, #e8b54a, #f0c96d)',
              boxShadow: '0 4px 16px rgba(212,160,23,0.3)',
            }}
          >
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  // ==========================================================================
  // MAIN LAYOUT
  // ==========================================================================
  return (
    <div className="relative min-h-[100dvh] bg-[#050714] overflow-hidden">
      <JourneysCanvas activeTab={activeTab} />

      {/* Header */}
      <div className="relative z-10 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <Link href="/m" className="text-[#D4A017] text-lg">
            {'\u2190'}
          </Link>
          <div className="text-center">
            <h1 className="text-lg italic text-[#EDE8DC]">
              <span style={{ fontFamily: '"Noto Sans Devanagari", serif' }}>
                {'\u0937\u0921\u094D\u0930\u093F\u092A\u0941'}
              </span>
              <span className="font-divine"> Journeys</span>
            </h1>
            <p className="text-[8px] text-[#6B6355] font-ui tracking-[0.12em] uppercase">
              The Inner Battlefield
            </p>
          </div>
          <div className="w-[18px]" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="relative z-10 mx-4 mb-2 rounded-xl border border-red-500/20 bg-red-900/15 px-4 py-2 text-center">
          <p className="text-xs text-red-300 font-ui">{error}</p>
        </div>
      )}

      {/* Tab content — scrollable area */}
      <div className="relative z-10 pb-[80px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{
              duration: 0.35,
              ease: [0, 0.8, 0.2, 1],
            }}
            className="min-h-full"
          >
            {activeTab === 'today' && (
              <TodayTab
                dashboard={dashboard}
                templates={templates}
                isLoading={showLoading}
                onRefresh={handleRefresh}
              />
            )}
            {activeTab === 'journeys' && (
              <JourneysTab
                dashboard={dashboard}
                templates={templates}
                isLoading={showLoading}
                onRefresh={handleRefresh}
                initialEnemy={preselectedEnemy}
                onEnemyConsumed={() => setPreselectedEnemy(null)}
                autoOpenForEnemy={pendingAutoOpenEnemy}
                onAutoOpenConsumed={() => setPendingAutoOpenEnemy(null)}
              />
            )}
            {activeTab === 'battleground' && (
              <BattlegroundTab
                dashboard={dashboard}
                isLoading={showLoading}
                onNavigateToJourneys={handleNavigateFromBattleground}
              />
            )}
            {activeTab === 'wisdom' && <WisdomTab />}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sacred 4-tab navigation */}
      <div
        className="fixed bottom-0 left-0 right-0 z-20 flex items-center backdrop-blur-xl"
        style={{
          height: 72,
          background: 'rgba(4,6,18,0.95)',
          borderTop: '1px solid rgba(27,79,187,0.15)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className="flex-1 flex flex-col items-center gap-0.5 py-2 transition-opacity"
              style={{ opacity: isActive ? 1 : 0.4 }}
            >
              {isActive && (
                <motion.div
                  layoutId="journeyTabDot"
                  className="w-1 h-1 rounded-full bg-[#D4A017] mb-0.5"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <span className="text-xs leading-none">{tab.icon}</span>
              <span
                className="text-[9px] font-ui leading-none"
                style={{ color: isActive ? '#D4A017' : '#B8AE98' }}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
