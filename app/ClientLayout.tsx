'use client'

import { LanguageProvider } from '@/hooks/useLanguage'
import { useEffect, useState } from 'react'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return null
  }
  
  return <LanguageProvider>{children}</LanguageProvider>
}
