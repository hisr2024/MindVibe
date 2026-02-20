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
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | undefined>()

  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingComplete = localStorage.getItem('mindvibe_onboarding_complete')
    if (onboardingComplete !== 'true') {
      router.push('/onboarding/welcome')
      return
    }

    // Get user ID (from localStorage or auth)
    const profile = localStorage.getItem('mindvibe_profile')
    if (profile) {
      try {
        const parsed = JSON.parse(profile)
        setUserId(parsed.email || 'local-user')
      } catch {
        setUserId('local-user')
      }
    } else {
      setUserId('local-user')
    }

    setIsLoading(false)
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
