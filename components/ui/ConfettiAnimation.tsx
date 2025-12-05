'use client'

import { useEffect, useState } from 'react'
import Confetti from 'react-confetti'

interface ConfettiAnimationProps {
  duration?: number
  numberOfPieces?: number
  recycle?: boolean
}

export function ConfettiAnimation({
  duration = 5000,
  numberOfPieces = 200,
  recycle = false,
}: ConfettiAnimationProps) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })
  const [showConfetti, setShowConfetti] = useState(true)

  useEffect(() => {
    // Set initial dimensions
    setDimensions({
      width: window.innerWidth,
      height: window.innerHeight,
    })

    // Handle resize
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    window.addEventListener('resize', handleResize)

    // Auto-hide confetti after duration
    if (!recycle && duration > 0) {
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, duration)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', handleResize)
      }
    }

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [duration, recycle])

  if (!showConfetti || dimensions.width === 0) return null

  return (
    <Confetti
      width={dimensions.width}
      height={dimensions.height}
      numberOfPieces={numberOfPieces}
      recycle={recycle}
      colors={['#FF8938', '#FFA500', '#FFD700', '#FF6B35', '#F5A623', '#FFFFFF']}
      gravity={0.3}
      wind={0.01}
      opacity={0.8}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 100,
        pointerEvents: 'none',
      }}
    />
  )
}

export default ConfettiAnimation
