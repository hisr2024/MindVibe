'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <div role="alert" className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl" aria-hidden="true">&#x1F64F;</div>
        <h2 className="mb-3 text-xl font-semibold text-slate-100">
          Something went gently wrong
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Even on the path to enlightenment, we sometimes stumble.
          Take a breath, and let us try again.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-orange-500 px-6 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-orange-400"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
