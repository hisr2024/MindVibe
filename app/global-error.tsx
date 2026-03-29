'use client'

import { useEffect } from 'react'

/** Detect chunk/module load failures caused by stale deployments. */
function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    /loading chunk [\w.-]+ failed/i.test(error.message) ||
    /failed to fetch dynamically imported module/i.test(error.message)
  )
}

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Auto-recover from stale chunk errors (new deployment invalidated old chunks)
    if (isChunkLoadError(error)) {
      try {
        const KEY = '__chunk_reload'
        if (!sessionStorage.getItem(KEY)) {
          sessionStorage.setItem(KEY, '1')
          window.location.reload()
          return
        }
        sessionStorage.removeItem(KEY)
      } catch {
        // sessionStorage unavailable — show error UI
      }
    }
  }, [error])

  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div role="alert" className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="mb-6 text-6xl" aria-hidden="true">&#x1F64F;</div>
            <h2 className="mb-3 text-xl font-semibold">
              Something unexpected happened
            </h2>
            <p className="mb-6 text-sm text-slate-400">
              The universe works in mysterious ways. Let us begin again with fresh energy.
            </p>
            <button
              onClick={reset}
              className="rounded-lg bg-[#d4a44c] px-6 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-[#d4a44c]"
            >
              Refresh
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
