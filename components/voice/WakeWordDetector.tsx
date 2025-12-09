/**
 * Wake Word Detector Component
 * Background listener for "Hey KIAAN" wake word
 */

'use client'

import { useEffect } from 'react'
import { useWakeWord } from '@/hooks/useWakeWord'

export interface WakeWordDetectorProps {
  language?: string
  enabled: boolean
  onWakeWordDetected: () => void
  onError?: (error: string) => void
}

export function WakeWordDetector({
  language = 'en',
  enabled,
  onWakeWordDetected,
  onError,
}: WakeWordDetectorProps) {
  const { isActive, isSupported, start, stop } = useWakeWord({
    language,
    onWakeWordDetected: () => {
      // Play activation chime (optional audio feedback)
      if (typeof Audio !== 'undefined') {
        try {
          // Simple beep using Web Audio API
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
          const oscillator = audioContext.createOscillator()
          const gainNode = audioContext.createGain()
          
          oscillator.connect(gainNode)
          gainNode.connect(audioContext.destination)
          
          oscillator.frequency.value = 800
          oscillator.type = 'sine'
          
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
          
          oscillator.start(audioContext.currentTime)
          oscillator.stop(audioContext.currentTime + 0.1)
        } catch (error) {
          // Silent fail for audio
          console.debug('Audio feedback not available')
        }
      }
      
      onWakeWordDetected()
    },
    onError,
  })

  // Start/stop based on enabled prop
  useEffect(() => {
    if (enabled && isSupported) {
      start()
    } else {
      stop()
    }
  }, [enabled, isSupported, start, stop])

  // Don't render anything if not supported
  if (!isSupported) {
    return null
  }

  return (
    <>
      {isActive && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full bg-slate-900/95 px-4 py-2 text-sm text-orange-200 shadow-lg border border-orange-500/30 backdrop-blur-sm animate-fadeIn">
          {/* Pulse indicator */}
          <div className="relative flex items-center justify-center">
            <span className="text-lg">👂</span>
            <span className="absolute inset-0 rounded-full bg-orange-400/30 animate-ping" />
          </div>
          
          <span className="font-medium">
            Listening for &quot;Hey KIAAN&quot;
          </span>
        </div>
      )}
    </>
  )
}
