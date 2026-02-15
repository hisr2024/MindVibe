'use client'

import { useEffect, useState } from 'react'

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Standard mount detection for hydration safety
    setMounted(true)
  }, [])

  // Show a minimal loading state to prevent flicker during hydration
  // Use opacity: 0 to fully hide content until hydration completes
  if (!mounted) {
    return (
      <div
        className="min-h-screen bg-slate-950"
        style={{
          opacity: 0,
          visibility: 'hidden',
        }}
        aria-hidden="true"
      >
        {/* Invisible placeholder to prevent layout shift */}
        <div className="sr-only">Loading...</div>
      </div>
    )
  }

  return <>{children}</>
}
