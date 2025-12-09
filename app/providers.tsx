'use client'

import { TooltipProvider } from '@/components/ui'
import { LanguageProvider } from '@/hooks/useLanguage'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <TooltipProvider delayDuration={200}>
        {children}
      </TooltipProvider>
    </LanguageProvider>
  )
}

export default Providers
