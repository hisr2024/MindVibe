'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function NotFound() {
  const router = useRouter()

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 p-6" aria-labelledby="not-found-heading">
      <div className="max-w-md text-center">
        <div className="mb-6 text-6xl" aria-hidden="true">&#x1F549;&#xFE0F;</div>
        <h1 id="not-found-heading" className="mb-3 text-2xl font-semibold">
          Page Not Found
        </h1>
        <p className="mb-6 text-sm text-slate-400">
          This path does not exist, but many others await you.
          As the Gita teaches, every journey begins with a single step.
        </p>
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/"
            className="inline-block rounded-lg bg-[#d4a44c] px-6 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-[#e8b54a]"
          >
            Return Home
          </Link>
          <button
            onClick={() => router.back()}
            className="text-sm text-slate-400 transition-colors hover:text-[#d4a44c]"
          >
            Go Back
          </button>
        </div>
      </div>
    </main>
  )
}
