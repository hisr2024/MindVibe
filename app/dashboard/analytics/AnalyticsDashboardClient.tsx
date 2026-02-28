'use client'

/**
 * Analytics Dashboard Client Component
 * Dashboard-integrated analytics page with authentication
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/analytics'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export function AnalyticsDashboardClient() {
  const router = useRouter()
  const [userId] = useState<string | undefined>(() => {
    if (typeof window === 'undefined') return undefined
    const onboardingComplete = localStorage.getItem('mindvibe_onboarding_complete')
    if (onboardingComplete !== 'true') return undefined
    const profile = localStorage.getItem('mindvibe_profile')
    if (profile) {
      try { return JSON.parse(profile).email || 'local-user' } catch { return 'local-user' }
    }
    return 'local-user'
  })
  const [isLoading] = useState(() => {
    if (typeof window === 'undefined') return true
    const onboardingComplete = localStorage.getItem('mindvibe_onboarding_complete')
    return onboardingComplete !== 'true'
  })

  useEffect(() => {
    const onboardingComplete = localStorage.getItem('mindvibe_onboarding_complete')
    if (onboardingComplete !== 'true') {
      router.push('/onboarding/welcome')
    }
  }, [router])

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading analytics..." />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-orange-50">Your Analytics</h1>
          <p className="text-sm text-orange-100/60 mt-1">
            Insights into your spiritual wellness journey
          </p>
        </div>
      </div>

      {/* Analytics Dashboard */}
      <AnalyticsDashboard userId={userId} />
    </div>
  )
}

export default AnalyticsDashboardClient
