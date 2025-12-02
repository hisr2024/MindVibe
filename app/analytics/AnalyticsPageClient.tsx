/**
 * Analytics Page Client Component
 * Protected analytics dashboard with authentication check
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AnalyticsDashboard } from '@/components/analytics'
import { Card, CardContent } from '@/components/ui'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'

export default function AnalyticsPageClient() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [userId, setUserId] = useState<string | undefined>()

  useEffect(() => {
    // Check if user has completed onboarding
    const onboardingComplete = localStorage.getItem('mindvibe_onboarding_complete')
    if (onboardingComplete !== 'true') {
      router.push('/onboarding')
      return
    }

    // Get user ID (from localStorage or auth)
    const profile = localStorage.getItem('mindvibe_profile')
    if (profile) {
      const parsed = JSON.parse(profile)
      setUserId(parsed.email || 'local-user')
    } else {
      setUserId('local-user')
    }

    setIsLoading(false)
  }, [router])

  if (isLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" label="Loading analytics..." />
      </main>
    )
  }

  return (
    <main className="min-h-screen px-4 py-8 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Back link */}
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-sm text-orange-100/60 hover:text-orange-50 transition mb-6"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Dashboard
        </button>

        {/* Analytics Dashboard */}
        <AnalyticsDashboard userId={userId} />
      </div>
    </main>
  )
}
