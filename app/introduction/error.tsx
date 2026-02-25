'use client'

import { useEffect } from 'react'

export default function IntroductionError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Introduction error:', error)
  }, [error])

  return (
    <div role="alert" className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl" aria-hidden="true">&#x1F64F;</div>
        <h2 className="mb-3 text-xl font-semibold text-slate-100">
          A moment of pause
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Every journey has its detours. Let us find our way back to the beginning.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-[#d4a44c] px-6 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-[#d4a44c]"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
