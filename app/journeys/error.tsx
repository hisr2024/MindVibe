'use client'

import { useEffect } from 'react'

export default function JourneysError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Journeys error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">&#x1F6A3;</div>
        <h2 className="mb-3 text-xl font-semibold text-slate-100">
          A brief pause on the path
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Every journey has its detours. This is merely a moment of rest
          before we continue forward together.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-[#d4a44c] px-6 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-[#d4a44c]"
        >
          Continue the journey
        </button>
      </div>
    </div>
  )
}
