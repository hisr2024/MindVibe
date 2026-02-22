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
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">&#x1F9D8;</div>
        <h2 className="mb-3 text-xl font-semibold text-slate-100">
          KIAAN is gathering wisdom
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Even the wisest teachers need a moment of silence.
          KIAAN will return shortly with renewed clarity and insight.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-orange-400"
        >
          Reconnect with KIAAN
        </button>
      </div>
    </div>
  )
}
