'use client'

import { TooltipProvider } from '@/components/ui'
import { LanguageProvider } from '@/hooks/useLanguage'
import { ChatProvider } from '@/lib/ChatContext'
import { DivineConsciousnessProvider } from '@/contexts/DivineConsciousnessContext'
import { AudioProvider } from '@/contexts/AudioContext'
import { MusicProvider } from '@/contexts/MusicContext'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AudioProvider>
        <MusicProvider autoTimeSwitch={true}>
          <DivineConsciousnessProvider>
            <TooltipProvider delayDuration={200}>
              <ChatProvider>
                {children}
              </ChatProvider>
            </TooltipProvider>
          </DivineConsciousnessProvider>
        </MusicProvider>
      </AudioProvider>
    </LanguageProvider>
  )
}

export default Providers
