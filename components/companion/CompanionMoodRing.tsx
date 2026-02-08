'use client'

/**
 * CompanionMoodRing - Visual indicator of the conversation's emotional state.
 *
 * A breathing ring around KIAAN's presence that shifts color
 * based on the detected mood. Uses Tailwind animations only (no styled-jsx).
 */

import { useEffect, useState } from 'react'

interface MoodRingProps {
  mood: string
  intensity?: number
  isListening?: boolean
  isSpeaking?: boolean
  size?: 'sm' | 'md' | 'lg'
}

const MOOD_GRADIENTS: Record<string, string> = {
  happy: 'from-amber-300 via-yellow-300 to-orange-300',
  sad: 'from-blue-300 via-indigo-300 to-blue-400',
  anxious: 'from-purple-300 via-violet-300 to-purple-400',
  angry: 'from-red-300 via-rose-300 to-red-400',
  confused: 'from-orange-300 via-amber-300 to-yellow-300',
  peaceful: 'from-emerald-300 via-green-300 to-teal-300',
  hopeful: 'from-yellow-300 via-amber-200 to-yellow-400',
  lonely: 'from-indigo-300 via-blue-300 to-indigo-400',
  grateful: 'from-green-300 via-emerald-300 to-green-400',
  neutral: 'from-gray-300 via-slate-300 to-gray-400',
  excited: 'from-pink-300 via-rose-300 to-pink-400',
  overwhelmed: 'from-slate-300 via-gray-300 to-slate-400',
}

const SIZES = {
  sm: { ring: 'w-16 h-16', inner: 'w-12 h-12', text: 'text-lg' },
  md: { ring: 'w-24 h-24', inner: 'w-20 h-20', text: 'text-2xl' },
  lg: { ring: 'w-32 h-32', inner: 'w-28 h-28', text: 'text-3xl' },
}

export default function CompanionMoodRing({
  mood,
  intensity = 0.5,
  isListening = false,
  isSpeaking = false,
  size = 'md',
}: MoodRingProps) {
  const [pulse, setPulse] = useState(false)

  useEffect(() => {
    if (isSpeaking) {
      const interval = setInterval(() => setPulse(p => !p), 600)
      return () => clearInterval(interval)
    }
    setPulse(false)
  }, [isSpeaking])

  const gradient = MOOD_GRADIENTS[mood] || MOOD_GRADIENTS.neutral
  const sizeClasses = SIZES[size]

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow ring - uses Tailwind animate-pulse for breathing */}
      <div
        className={`absolute ${sizeClasses.ring} rounded-full bg-gradient-to-r ${gradient} opacity-30 blur-md transition-all duration-1000 animate-pulse`}
        style={{ transform: pulse ? 'scale(1.15)' : 'scale(1)' }}
      />

      {/* Main ring */}
      <div
        className={`relative ${sizeClasses.ring} rounded-full bg-gradient-to-br ${gradient} p-[3px] transition-all duration-700 shadow-lg ${isListening ? 'animate-ping-slow' : ''}`}
        style={{ opacity: 0.4 + intensity * 0.6 }}
      >
        {/* Inner circle */}
        <div className={`${sizeClasses.inner} rounded-full bg-white dark:bg-gray-900 flex items-center justify-center`}>
          <span className={`${sizeClasses.text} font-semibold text-transparent bg-clip-text bg-gradient-to-br ${gradient}`}>
            {isListening ? (
              <span className="animate-pulse">K</span>
            ) : isSpeaking ? (
              <span className="animate-bounce">K</span>
            ) : (
              'K'
            )}
          </span>
        </div>
      </div>

      {/* Listening indicator dots */}
      {isListening && (
        <div className="absolute -bottom-2 flex gap-1">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-bounce"
              style={{ animationDelay: `${i * 150}ms` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
