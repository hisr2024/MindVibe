'use client'

import { FadeIn } from '@/components/ui'
import { ToolsDashboardSection } from '@/components/dashboard'

/**
 * DashboardClient component - Main dashboard view
 * 
 * Note: KIAAN chat modal integration was removed in favor of direct navigation to /kiaan.
 * This ensures a consistent navigation pattern across mobile and desktop.
 */
export default function DashboardClient() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 pb-16 lg:px-6">
      <FadeIn>
        <ToolsDashboardSection />
      </FadeIn>
    </main>
  )
}
