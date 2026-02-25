/**
 * AnalyticsDashboard Component
 * Main dashboard container with tabs and sections
 */

'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { AnalyticsOverview } from './AnalyticsOverview'
import { MoodTrendChart } from './MoodTrendChart'
import { JournalStatistics } from './JournalStatistics'
import { KIAANInsights } from './KIAANInsights'
import { WeeklySummary } from './WeeklySummary'
import { DataExport } from './DataExport'
import { useAnalytics } from '@/hooks/useAnalytics'
import type { AnalyticsPeriod } from '@/types/analytics.types'

interface AnalyticsDashboardProps {
  userId?: string
  className?: string
}

type TabId = 'overview' | 'journal' | 'kiaan' | 'summary'

const tabs: { id: TabId; label: string; icon: string }[] = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'journal', label: 'Journal', icon: '📝' },
  { id: 'kiaan', label: 'KIAAN', icon: '💬' },
  { id: 'summary', label: 'Weekly', icon: '📅' },
]

export function AnalyticsDashboard({
  userId,
  className = '',
}: AnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview')

  const {
    overview,
    moodTrends,
    journalStats,
    kiaanInsights,
    weeklySummary,
    analyticsData,
    filters,
    setPeriod,
    loading,
    isAnyLoading,
    errors,
    refresh,
  } = useAnalytics(userId)

  const handlePeriodChange = (period: AnalyticsPeriod) => {
    setPeriod(period)
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[#f5f0e8]">Analytics</h1>
          <p className="text-sm text-[#f5f0e8]/60 mt-1">
            Track your wellness journey
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DataExport analyticsData={analyticsData} />
          <button
            onClick={refresh}
            disabled={isAnyLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#d4a44c]/20 text-sm text-[#f5f0e8]/80 hover:border-[#d4a44c]/50 hover:text-[#f5f0e8] transition disabled:opacity-50"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`w-4 h-4 ${isAnyLoading ? 'animate-spin' : ''}`}
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
              <path d="M3 21v-5h5" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 mb-6 pb-2 -mx-2 px-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition ${
              activeTab === tab.id
                ? 'bg-[#d4a44c]/20 text-[#f5f0e8] border border-[#d4a44c]/50'
                : 'text-[#f5f0e8]/60 hover:text-[#f5f0e8] hover:bg-[#d4a44c]/10 border border-transparent'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <AnalyticsOverview
              metrics={overview}
              isLoading={loading.overview}
            />
            <MoodTrendChart
              data={moodTrends}
              period={filters.period}
              onPeriodChange={handlePeriodChange}
              isLoading={loading.moodTrends}
            />
          </div>
        )}

        {activeTab === 'journal' && (
          <JournalStatistics
            stats={journalStats}
            isLoading={loading.journalStats}
          />
        )}

        {activeTab === 'kiaan' && (
          <KIAANInsights
            insights={kiaanInsights}
            isLoading={loading.kiaanInsights}
          />
        )}

        {activeTab === 'summary' && (
          <WeeklySummary
            summary={weeklySummary}
            isLoading={loading.weeklySummary}
          />
        )}
      </motion.div>

      {/* Error State */}
      {Object.values(errors).some((e) => e !== null) && (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
          <p className="text-sm text-red-400">
            Some data failed to load. Try refreshing the page.
          </p>
        </div>
      )}
    </div>
  )
}

export default AnalyticsDashboard
