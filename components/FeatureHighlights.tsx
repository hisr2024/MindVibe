/**
 * Feature Highlight Cards
 * Showcases key features like Voice Chat, Offline Mode, and Karma Reset
 */

'use client'

import Link from 'next/link'
import { useOfflineMode } from '@/hooks/useOfflineMode'

export function FeatureHighlights() {
  const { isOnline, queueCount } = useOfflineMode()

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Featured capabilities">
      {/* Voice Features */}
      <div className="group relative overflow-hidden rounded-2xl border border-blue-500/20 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent p-5 shadow-[0_14px_60px_rgba(59,130,246,0.16)] transition hover:border-blue-500/40 hover:shadow-[0_20px_80px_rgba(59,130,246,0.25)]">
        <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-gradient-to-br from-blue-400/30 to-cyan-400/20 blur-2xl" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-blue-500/20 p-2">
              <svg className="h-5 w-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-300">
              New
            </span>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-blue-50">Voice Chat</h3>
          <p className="mb-4 text-sm text-blue-100/70">
            Talk naturally with KIAAN using voice. Hands-free conversations in multiple languages.
          </p>
          <div className="flex items-center gap-2 text-xs text-blue-300/80">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Available in chat</span>
          </div>
        </div>
      </div>

      {/* Offline Mode */}
      <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent p-5 shadow-[0_14px_60px_rgba(16,185,129,0.16)] transition hover:border-emerald-500/40 hover:shadow-[0_20px_80px_rgba(16,185,129,0.25)]">
        <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-gradient-to-br from-emerald-400/30 to-teal-400/20 blur-2xl" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-emerald-500/20 p-2">
              <svg className="h-5 w-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <div className={`h-2 w-2 rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-amber-400'} animate-pulse`} />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-emerald-50">Offline Access</h3>
          <p className="mb-4 text-sm text-emerald-100/70">
            Access conversations and wisdom verses offline. Auto-syncs when you&apos;re back online.
          </p>
          <div className="flex items-center gap-2 text-xs text-emerald-300/80">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{isOnline ? 'Connected' : 'Offline'} {queueCount > 0 ? `• ${queueCount} queued` : ''}</span>
          </div>
        </div>
      </div>

      {/* Karma Reset / Emotional Reset */}
      <div className="group relative overflow-hidden rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/10 via-amber-500/5 to-transparent p-5 shadow-[0_14px_60px_rgba(249,115,22,0.16)] transition hover:border-orange-500/40 hover:shadow-[0_20px_80px_rgba(249,115,22,0.25)]">
        <div className="absolute right-4 top-4 h-16 w-16 rounded-full bg-gradient-to-br from-orange-400/30 to-amber-400/20 blur-2xl" />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-lg bg-orange-500/20 p-2">
              <svg className="h-5 w-5 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-orange-50">Emotional Reset</h3>
          <p className="mb-4 text-sm text-orange-100/70">
            7-step guided process to transform emotional overwhelm into calm clarity.
          </p>
          <Link
            href="/tools/emotional-reset"
            className="inline-flex items-center gap-1 text-xs font-medium text-orange-300 hover:text-orange-200"
          >
            <span>Start Reset</span>
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  )
}
