'use client'

/**
 * MobileErrorBoundary
 *
 * A compassionate error boundary designed for the mobile experience.
 * Shows healing-focused error messages instead of frightening crash screens.
 * Provides retry and navigation options for graceful recovery.
 */

import React, { Component, ReactNode } from 'react'
import { RefreshCw, Home, ArrowLeft } from 'lucide-react'

interface Props {
  children: ReactNode
  fallbackTitle?: string
  fallbackMessage?: string
}

interface State {
  hasError: boolean
  error: Error | null
}

export class MobileErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('MobileErrorBoundary caught error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleGoHome = () => {
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') {
      window.location.href = '/m'
    }
  }

  handleGoBack = () => {
    this.setState({ hasError: false, error: null })
    if (typeof window !== 'undefined') {
      window.history.back()
    }
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0b0f] flex flex-col items-center justify-center px-6 text-center">
          {/* Calming animation */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/10 flex items-center justify-center mb-6 animate-pulse">
            <span className="text-4xl">🙏</span>
          </div>

          <h2 className="text-xl font-semibold text-white mb-2">
            {this.props.fallbackTitle || 'A moment of pause'}
          </h2>
          <p className="text-sm text-slate-400 mb-8 max-w-xs leading-relaxed">
            {this.props.fallbackMessage ||
              'Something unexpected happened. Take a breath — we\'ll get you back on your path.'}
          </p>

          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={this.handleRetry}
              className="w-full py-3 rounded-xl bg-orange-500 text-white font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>

            <button
              onClick={this.handleGoBack}
              className="w-full py-3 rounded-xl bg-white/[0.06] text-white font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </button>

            <button
              onClick={this.handleGoHome}
              className="w-full py-3 rounded-xl bg-white/[0.04] text-slate-400 font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Home className="w-4 h-4" />
              Return Home
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * MobileLoadingSkeleton
 *
 * Full-page loading skeleton for mobile pages.
 * Shows while page data is being fetched.
 */
export function MobilePageSkeleton() {
  return (
    <div className="min-h-screen bg-[#0b0b0f] px-4 pt-16 pb-24 animate-pulse">
      {/* Header skeleton */}
      <div className="mb-6">
        <div className="h-4 w-24 bg-white/[0.06] rounded mb-2" />
        <div className="h-7 w-48 bg-white/[0.08] rounded" />
      </div>

      {/* Card skeleton */}
      <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.06] mb-4">
        <div className="h-4 w-32 bg-white/[0.06] rounded mb-3" />
        <div className="flex gap-2 mb-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="flex-1 h-16 bg-white/[0.04] rounded-xl" />
          ))}
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
            <div className="h-6 w-8 bg-white/[0.06] rounded mx-auto mb-1" />
            <div className="h-3 w-16 bg-white/[0.04] rounded mx-auto" />
          </div>
        ))}
      </div>

      {/* List items skeleton */}
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-20 rounded-2xl bg-white/[0.03] border border-white/[0.06]" />
        ))}
      </div>
    </div>
  )
}
