/**
 * Error Boundary for KIAAN Voice Companion
 *
 * Catches runtime errors in the voice companion and displays
 * a compassionate, Gita-inspired recovery message instead of
 * crashing the entire page.
 *
 * Implements Item #101: Error boundary component.
 */

'use client'

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  errorMessage: string
}

const RECOVERY_MESSAGES = [
  "Even the strongest warriors stumble, dear friend. The Gita teaches us that no effort is ever wasted. Let's begin again.",
  "A moment of disruption, nothing more. Like Arjuna's moment of doubt on the battlefield, this too shall pass. I'm right here.",
  "The Gita says: 'The soul is neither born, nor does it die.' And neither does our connection. Let me restart for you.",
  "In Chapter 2, Krishna said challenges are temporary. This little hiccup is proof. Let's continue our journey together.",
]

export default class VoiceErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message || 'Something unexpected happened',
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, errorMessage: '' })
  }

  render() {
    if (this.state.hasError) {
      const message = RECOVERY_MESSAGES[Math.floor(Math.random() * RECOVERY_MESSAGES.length)]

      return (
        <div className="flex flex-col h-[100dvh] bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 items-center justify-center px-6">
          {/* Orb placeholder */}
          <div className="w-32 h-32 rounded-full bg-gradient-to-br from-mv-sunrise/20 via-mv-aurora/20 to-mv-ocean/20 flex items-center justify-center mb-8 animate-pulse">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-mv-sunrise/30 via-mv-aurora/30 to-mv-ocean/30 flex items-center justify-center">
              <span className="text-4xl">🙏</span>
            </div>
          </div>

          {/* Recovery message */}
          <p className="text-white/80 text-center text-sm leading-relaxed max-w-sm mb-6">
            {message}
          </p>

          {/* Retry button */}
          <button
            onClick={this.handleRetry}
            className="px-6 py-3 rounded-2xl bg-mv-sunrise/15 border border-mv-sunrise/25 text-mv-sunrise text-sm font-medium hover:bg-mv-sunrise/25 transition-all active:scale-95"
          >
            Return to KIAAN
          </button>

          {/* Error details (subtle) */}
          <p className="mt-8 text-[10px] text-white/20 max-w-xs text-center">
            {this.state.errorMessage}
          </p>
        </div>
      )
    }

    return this.props.children
  }
}
