'use client'

/**
 * ShankhaErrorBoundary — Isolates the mobile voice companion from the app shell.
 *
 * P1-21: Without this boundary, a throw from useWakeWord / useHandsFreeMode /
 * useEnhancedVoiceOutput will crash the entire mobile shell (tab bar, chrome,
 * everything). With the boundary, the voice companion renders a quiet fallback
 * orb and the rest of the app keeps working.
 */

import React from 'react'

interface State {
  hasError: boolean
  error?: Error
}

type Props = React.PropsWithChildren<{ fallback?: React.ReactNode }>

export class ShankhaErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Log to console so Sentry / DevTools captures it. Keep PII out of the message.
    if (typeof console !== 'undefined') {
      console.error('[ShankhaErrorBoundary]', error.message, info.componentStack)
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback !== undefined) return this.props.fallback
      return (
        <div
          role="img"
          aria-label="KIAAN voice companion unavailable"
          title="Voice companion unavailable"
          style={{
            position: 'fixed',
            bottom: 'calc(72px + 12px + env(safe-area-inset-bottom, 0px))',
            right: 16,
            width: 52,
            height: 52,
            borderRadius: '50%',
            background: 'radial-gradient(circle, #1B4FBB, #050714)',
            border: '1.5px solid rgba(212,160,23,0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color: '#D4A017',
            opacity: 0.5,
            zIndex: 70,
            fontFamily: '"Crimson Text", serif',
            pointerEvents: 'none',
          }}
        >
          {'\u0950'}
        </div>
      )
    }
    return this.props.children
  }
}

export default ShankhaErrorBoundary
