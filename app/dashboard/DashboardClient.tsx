'use client'

import { FadeIn } from '@/components/ui'
import { ToolsDashboardSection } from '@/components/dashboard'

export default function DashboardClient() {
  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 pb-16 lg:px-6">
      <FadeIn>
        <ToolsDashboardSection />
      </FadeIn>
    </main>
  )
}
