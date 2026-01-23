'use client'

import { useEffect, useState } from 'react'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Show a minimal loading state to prevent flicker during hydration
  if (!mounted) {
    return (
      <div
        className="min-h-screen bg-slate-950"
        style={{
          opacity: 0.99,
          visibility: 'visible',
        }}
      >
        {/* Invisible placeholder to prevent layout shift */}
        <div className="sr-only">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
