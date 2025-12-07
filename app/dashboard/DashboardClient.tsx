'use client'

import { useState } from 'react'
import { FadeIn } from '@/components/ui'
import { ToolsDashboardSection } from '@/components/dashboard'
import { KiaanChatModal } from '@/components/chat'

export default function DashboardClient() {
  const [isChatModalOpen, setIsChatModalOpen] = useState(false)

  return (
    <>
      <main className="mx-auto max-w-7xl space-y-6 px-4 pb-16 lg:px-6">
        <FadeIn>
          <ToolsDashboardSection onKiaanClick={() => setIsChatModalOpen(true)} />
        </FadeIn>
      </main>

      {/* Chat Modal Overlay */}
      <KiaanChatModal 
        isOpen={isChatModalOpen} 
        onClose={() => setIsChatModalOpen(false)} 
      />
    </>
  )
}
