'use client'

import { useEffect } from 'react'

export default function ToolsError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Tools error:', error)
  }, [error])

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl">&#x1F6E0;&#xFE0F;</div>
        <h2 className="mb-3 text-xl font-semibold text-slate-100">
          Our tools need a moment
        </h2>
        <p className="mb-6 text-sm text-slate-400">
          Like a craftsman sharpening their instruments, we need a brief pause
          to restore our tools to working order.
        </p>
        <button
          onClick={reset}
          className="rounded-lg bg-[#d4a44c] px-6 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-[#d4a44c]"
        >
          Reload tools
        </button>
      </div>
    </div>
  )
}
