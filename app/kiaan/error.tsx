'use client'

import { useEffect } from 'react'

export default function KiaanError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('KIAAN error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center kiaan-cosmic-bg p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">&#x1F9D8;</div>
        <h2 className="kiaan-text-golden mb-3 text-xl font-semibold">
          KIAAN is gathering wisdom
        </h2>
        <p className="mb-6 text-sm text-[#e8dcc8]/50">
          Even the wisest teachers need a moment of silence.
          KIAAN will return shortly with renewed clarity and insight.
        </p>
        <button
          onClick={reset}
          className="kiaan-btn-golden rounded-lg px-6 py-2.5 text-sm font-medium transition-colors"
        >
          Reconnect with KIAAN
        </button>
      </div>
    </div>
  )
}
