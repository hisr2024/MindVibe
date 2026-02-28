'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'

interface UseCountdownResult {
  days: number
  hours: number
  minutes: number
  seconds: number
  isComplete: boolean
  formatted: string
}

export function useCountdown(targetDate: Date | string): UseCountdownResult {
  const target = useMemo(
    () => typeof targetDate === 'string' ? new Date(targetDate) : targetDate,
    [targetDate]
  )
  const [timeLeft, setTimeLeft] = useState(() => calculateTimeLeft(target))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const tick = useCallback(() => {
    const newTimeLeft = calculateTimeLeft(target)
    setTimeLeft(newTimeLeft)
    
    if (newTimeLeft.total <= 0 && intervalRef.current) {
      clearInterval(intervalRef.current)
    }
  }, [target])

  useEffect(() => {
    intervalRef.current = setInterval(tick, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [tick])

  return {
    days: timeLeft.days,
    hours: timeLeft.hours,
    minutes: timeLeft.minutes,
    seconds: timeLeft.seconds,
    isComplete: timeLeft.total <= 0,
    formatted: formatCountdown(timeLeft),
  }
}

interface TimeLeft {
  total: number
  days: number
  hours: number
  minutes: number
  seconds: number
}

function calculateTimeLeft(target: Date): TimeLeft {
  const total = Math.max(0, target.getTime() - Date.now())
  
  return {
    total,
    days: Math.floor(total / (1000 * 60 * 60 * 24)),
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
  }
}

function formatCountdown(timeLeft: TimeLeft): string {
  if (timeLeft.days > 0) {
    return `${timeLeft.days}d ${timeLeft.hours}h`
  }
  if (timeLeft.hours > 0) {
    return `${timeLeft.hours}h ${timeLeft.minutes}m`
  }
  if (timeLeft.minutes > 0) {
    return `${timeLeft.minutes}m ${timeLeft.seconds}s`
  }
  return `${timeLeft.seconds}s`
}

export default useCountdown
