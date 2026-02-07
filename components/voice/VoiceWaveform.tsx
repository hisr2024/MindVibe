/**
 * VoiceWaveform - Real-time audio waveform visualization
 *
 * Renders a smooth, animated waveform bar visualization that reacts
 * to frequency data from the audio analyzer. Falls back to a
 * simulated animation when no real audio data is available.
 *
 * Used below the orb during listening/speaking states to show
 * audio activity.
 */

'use client'

import { useMemo } from 'react'

interface VoiceWaveformProps {
  /** Raw frequency data from useAudioAnalyzer */
  frequencyData: Uint8Array | null
  /** Number of bars to display */
  barCount?: number
  /** Height of the waveform area in pixels */
  height?: number
  /** Width of the waveform area in pixels */
  width?: number
  /** Color of the bars (CSS color or gradient keyword) */
  color?: string
  /** Whether to show a simulated animation when no data */
  simulateWhenInactive?: boolean
  /** Current state for simulation behavior */
  state?: 'idle' | 'listening' | 'speaking' | 'processing' | 'breathing'
}

export default function VoiceWaveform({
  frequencyData,
  barCount = 32,
  height = 48,
  width = 280,
  color = 'currentColor',
  simulateWhenInactive = false,
  state = 'idle',
}: VoiceWaveformProps) {
  // Extract evenly-spaced samples from frequency data with smoothing
  const bars = useMemo(() => {
    if (frequencyData && frequencyData.length > 0) {
      const step = Math.max(1, Math.floor(frequencyData.length / barCount))
      const result: number[] = []
      for (let i = 0; i < barCount; i++) {
        const index = Math.min(i * step, frequencyData.length - 1)
        // 3-sample average for smoother bars (avoids flickering)
        const prev = index > 0 ? frequencyData[index - 1] : frequencyData[index]
        const curr = frequencyData[index]
        const next = index < frequencyData.length - 1 ? frequencyData[index + 1] : curr
        result.push((prev + curr + next) / (3 * 255))
      }
      return result
    }
    return null
  }, [frequencyData, barCount])

  const barWidth = Math.max(2, (width / barCount) * 0.6)
  const barGap = (width - barWidth * barCount) / (barCount - 1)

  // If we have real data, render it
  if (bars) {
    return (
      <div
        className="flex items-center justify-center"
        style={{ width, height }}
        role="presentation"
        aria-hidden="true"
      >
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
          {bars.map((value, i) => {
            const barHeight = Math.max(2, value * height * 0.85)
            const x = i * (barWidth + barGap)
            const y = (height - barHeight) / 2
            const opacity = 0.3 + value * 0.7

            return (
              <rect
                key={i}
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={barWidth / 2}
                fill={color}
                opacity={opacity}
                style={{ transition: 'height 0.08s ease-out, y 0.08s ease-out, opacity 0.1s ease-out' }}
              />
            )
          })}
        </svg>
      </div>
    )
  }

  // Simulated waveform when no real audio data
  if (!simulateWhenInactive) return null

  return (
    <div
      className="flex items-center justify-center"
      style={{ width, height }}
      role="presentation"
      aria-hidden="true"
    >
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        {Array.from({ length: barCount }, (_, i) => {
          const center = barCount / 2
          const distFromCenter = Math.abs(i - center) / center
          const baseHeight = state === 'processing'
            ? 3 + (1 - distFromCenter) * 8
            : state === 'speaking'
            ? 2 + (1 - distFromCenter) * 6
            : 2

          const x = i * (barWidth + barGap)
          const y = (height - baseHeight) / 2

          // Staggered animation delay based on position from center
          const delay = distFromCenter * 0.4

          return (
            <rect
              key={i}
              x={x}
              y={y}
              width={barWidth}
              height={baseHeight}
              rx={barWidth / 2}
              fill={color}
              opacity={0.25 + (1 - distFromCenter) * 0.25}
              style={{
                animation: state === 'processing' || state === 'speaking'
                  ? `waveSimPulse 1.2s ease-in-out ${delay}s infinite`
                  : 'none',
                transformOrigin: `${x + barWidth / 2}px ${height / 2}px`,
              }}
            />
          )
        })}
        <style>{`
          @keyframes waveSimPulse {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(2.2); }
          }
          @media (prefers-reduced-motion: reduce) {
            rect { animation: none !important; }
          }
        `}</style>
      </svg>
    </div>
  )
}
