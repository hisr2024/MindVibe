'use client'

import { TooltipProvider } from '@/components/ui'
import { LanguageProvider } from '@/hooks/useLanguage'
import { ChatProvider } from '@/lib/ChatContext'
import { DivineConsciousnessProvider } from '@/contexts/DivineConsciousnessContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <DivineConsciousnessProvider>
        <TooltipProvider delayDuration={200}>
          <ChatProvider>
            {children}
          </ChatProvider>
        </TooltipProvider>
      </DivineConsciousnessProvider>
    </LanguageProvider>
  )
}

export default Providers
