'use client'

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50">
        <div role="alert" className="flex min-h-screen items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="mb-6 text-6xl" aria-hidden="true">&#x1F64F;</div>
            <h2 className="mb-3 text-xl font-semibold text-slate-100">
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
