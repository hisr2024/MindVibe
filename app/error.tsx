'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { isChunkLoadError, attemptChunkRecovery } from '@/lib/chunk-recovery'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('Application error:', error)

    // Auto-recover from stale chunk errors (new deployment invalidated old chunks)
    if (isChunkLoadError(error)) {
      if (attemptChunkRecovery()) return
    }
  }, [error])

  return (
    <div role="alert" className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl" aria-hidden="true">&#x1F64F;</div>
        <h2 className="mb-3 text-xl font-semibold">
          Something went gently wrong
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Even on the path to enlightenment, we sometimes stumble.
          Take a breath, and let us try again.
        </p>
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={reset}
            className="rounded-lg bg-[#d4a44c] px-6 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-[#e8b54a]"
          >
            Try again
          </button>
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-400 transition-colors hover:text-[#d4a44c]"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  )
}
