'use client'

import { useEffect } from 'react'

export default function CompanionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Companion error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">&#x1F49B;</div>
        <h2 className="mb-3 text-xl font-semibold text-slate-100">
          Your companion stepped away briefly
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Even the closest companions need a moment to regroup.
          Your conversation and progress are safely preserved.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-[#d4a44c] px-6 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-[#d4a44c]"
        >
          Reconnect
        </button>
      </div>
    </div>
  )
}
