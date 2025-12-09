'use client'

import { TooltipProvider } from '@/components/ui'
import { LanguageProvider } from '@/hooks/useLanguage'
import { ChatProvider } from '@/lib/ChatContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <TooltipProvider delayDuration={200}>
        <ChatProvider>
          {children}
        </ChatProvider>
      </TooltipProvider>
    </LanguageProvider>
  )
}

export default Providers
