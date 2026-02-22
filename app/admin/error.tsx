'use client'

import { useEffect } from 'react'

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Admin panel error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">&#x1F4CA;</div>
        <h2 className="mb-3 text-xl font-semibold text-slate-100">
          Dashboard encountered an issue
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          The admin panel ran into a temporary issue. Your data is safe.
          Please try again or contact the development team if this persists.
        </p>
        {error.digest && (
          <p className="mb-4 font-mono text-xs text-slate-500">
            Reference: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-orange-400"
        >
          Reload dashboard
        </button>
      </div>
    </div>
  )
}
