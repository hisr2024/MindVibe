'use client'

import { useEffect } from 'react'

export default function KiaanVibeError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('KIAAN Vibe error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">&#x2728;</div>
        <h2 className="mb-3 text-xl font-semibold text-slate-100">
          The vibe shifted unexpectedly
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Sometimes the energy needs a moment to realign.
          Take a deep breath and let us restore the connection.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-orange-400"
        >
          Restore the vibe
        </button>
      </div>
    </div>
  )
}
