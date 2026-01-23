'use client'

import { TooltipProvider } from '@/components/ui'
import { LanguageProvider } from '@/hooks/useLanguage'
import { ChatProvider } from '@/lib/ChatContext'
import { DivineConsciousnessProvider } from '@/contexts/DivineConsciousnessContext'
import { AudioProvider } from '@/contexts/AudioContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AudioProvider>
        <DivineConsciousnessProvider>
          <TooltipProvider delayDuration={200}>
            <ChatProvider>
              {children}
            </ChatProvider>
          </TooltipProvider>
        </DivineConsciousnessProvider>
      </AudioProvider>
    </LanguageProvider>
  )
}

export default Providers
