'use client'

import { TooltipProvider } from '@/components/ui'
import { LanguageProvider } from '@/hooks/useLanguage'
import { ChatProvider } from '@/lib/ChatContext'
import { DivineConsciousnessProvider } from '@/contexts/DivineConsciousnessContext'
import { KiaanVibePlayerProvider } from '@/components/kiaan-vibe-player/PlayerProvider'
import { WakeWordProvider } from '@/contexts/WakeWordContext'
import ErrorBoundary from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <KiaanVibePlayerProvider>
          <DivineConsciousnessProvider>
            <WakeWordProvider>
              <TooltipProvider delayDuration={200}>
                <ChatProvider>
                  {children}
                </ChatProvider>
              </TooltipProvider>
            </WakeWordProvider>
          </DivineConsciousnessProvider>
        </KiaanVibePlayerProvider>
      </LanguageProvider>
    </ErrorBoundary>
  )
}

export default Providers
