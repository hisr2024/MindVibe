/**
 * WakeWordDetector Component
 *
 * Visual wake word detection UI with:
 * - Sensitivity control (ultra/high/medium/low)
 * - Real-time detection status indicators
 * - Audio level visualization
 * - Detection confidence display
 * - Accessible controls (WCAG 2.1 AA)
 */

'use client'

import { useCallback, useEffect, useRef } from 'react'
import { useWakeWord } from '@/hooks/useWakeWord'
import type { WakeWordDetectionEvent, WakeWordSensitivity } from '@/utils/speech/wakeWord'

export interface WakeWordDetectorProps {
  language?: string
  enabled: boolean
  sensitivity?: WakeWordSensitivity
  onWakeWordDetected: (event?: WakeWordDetectionEvent) => void
  onError?: (error: string) => void
  showSensitivityControl?: boolean
  showStatus?: boolean
  minimal?: boolean
  className?: string
}

const SENSITIVITY_LABELS: Record<WakeWordSensitivity, string> = {
  ultra: 'Ultra',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

const SENSITIVITY_DESCRIPTIONS: Record<WakeWordSensitivity, string> = {
  ultra: 'Detects from across the room. May have occasional false triggers.',
  high: 'Detects reliably at normal distance. Recommended.',
  medium: 'Requires clear, direct speech. Very few false triggers.',
  low: 'Requires close, clear speech. No false triggers.',
}

export function WakeWordDetector({
  language = 'en',
  enabled,
  sensitivity: initialSensitivity = 'high',
  onWakeWordDetected,
  onError,
  showSensitivityControl = false,
  showStatus = false,
  minimal = true,
  className = '',
}: WakeWordDetectorProps) {
  const pulseRef = useRef<HTMLDivElement>(null)
  const detectionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const {
    isActive,
    isSupported,
    error,
    sensitivity,
    listeningState,
    lastDetection,
    start,
    stop,
    toggle,
    setSensitivity,
  } = useWakeWord({
    language,
    enabled,
    sensitivity: initialSensitivity,
    onWakeWordDetected: (event: WakeWordDetectionEvent) => {
      triggerDetectionAnimation()
      onWakeWordDetected(event)
    },
    onError,
  })

  // Visual pulse on detection
  const triggerDetectionAnimation = useCallback(() => {
    if (pulseRef.current) {
      pulseRef.current.style.animation = 'none'
      void pulseRef.current.offsetWidth
      pulseRef.current.style.animation = 'pulse 1.5s ease-out'

      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current)
      }
      detectionTimeoutRef.current = setTimeout(() => {
        if (pulseRef.current) {
          pulseRef.current.style.animation = 'none'
        }
      }, 1500)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (detectionTimeoutRef.current) {
        clearTimeout(detectionTimeoutRef.current)
      }
    }
  }, [])

  if (!isSupported) {
    return null
  }

  // Minimal mode: invisible detector that just listens
  if (minimal && !showSensitivityControl && !showStatus) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {/* Main status */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div ref={pulseRef} className="relative">
            <button
              onClick={toggle}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                isActive
                  ? 'bg-green-500/20 border border-green-500/40'
                  : 'bg-gray-700/50 border border-gray-600/30'
              }`}
              aria-label={isActive ? 'Stop wake word detection' : 'Start wake word detection'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className={`w-5 h-5 ${isActive ? 'text-green-400' : 'text-gray-500'}`}
              >
                <path d="M8.25 4.5a3.75 3.75 0 117.5 0v8.25a3.75 3.75 0 11-7.5 0V4.5z" />
                <path d="M6 10.5a.75.75 0 01.75.75v1.5a5.25 5.25 0 1010.5 0v-1.5a.75.75 0 011.5 0v1.5a6.751 6.751 0 01-6 6.709v2.291h3a.75.75 0 010 1.5h-7.5a.75.75 0 010-1.5h3v-2.291a6.751 6.751 0 01-6-6.709v-1.5A.75.75 0 016 10.5z" />
              </svg>
            </button>
            {isActive && (
              <span className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-20" />
            )}
          </div>

          <div>
            <p className={`text-sm font-medium ${isActive ? 'text-green-400' : 'text-gray-400'}`}>
              {isActive ? 'Listening for "Hey KIAAN"' : 'Wake Word Off'}
            </p>
            {showStatus && listeningState && (
              <p className="text-xs text-gray-500">
                {SENSITIVITY_LABELS[sensitivity]} | {listeningState.detectionCount} detections
              </p>
            )}
          </div>
        </div>

        {lastDetection && showStatus && (
          <div className="text-xs text-right">
            <p className="text-green-400">{Math.round(lastDetection.confidence * 100)}%</p>
            <p className="text-gray-500">{lastDetection.matchType}</p>
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-2 bg-red-500/10 rounded-lg">
          <p className="text-xs text-red-400 flex-1">{error}</p>
          <button onClick={start} className="text-xs text-red-300 underline">Retry</button>
        </div>
      )}

      {/* Sensitivity control */}
      {showSensitivityControl && (
        <div className="space-y-2">
          <label className="text-xs text-gray-400 font-medium">Sensitivity</label>
          <div className="flex gap-1">
            {(['low', 'medium', 'high', 'ultra'] as WakeWordSensitivity[]).map((level) => (
              <button
                key={level}
                onClick={() => setSensitivity(level)}
                className={`flex-1 py-1 text-xs rounded transition-all ${
                  sensitivity === level
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-gray-800/50 text-gray-500 border border-gray-700/30'
                }`}
                title={SENSITIVITY_DESCRIPTIONS[level]}
                aria-pressed={sensitivity === level}
              >
                {SENSITIVITY_LABELS[level]}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-600">{SENSITIVITY_DESCRIPTIONS[sensitivity]}</p>
        </div>
      )}
    </div>
  )
}

export default WakeWordDetector
