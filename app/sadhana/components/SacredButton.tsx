'use client'

/**
 * SacredButton — Phase-specific divine buttons replacing repetitive identical pills.
 * Three variants: golden (primary CTA), whisper (secondary/skip), vow (hold-to-confirm).
 */

import { useState, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'

interface SacredButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'golden' | 'whisper' | 'vow'
  disabled?: boolean
  /** Hold duration in ms for 'vow' variant */
  holdDuration?: number
  className?: string
}

export function SacredButton({
  children,
  onClick,
  variant = 'golden',
  disabled = false,
  holdDuration = 1500,
  className = '',
}: SacredButtonProps) {
  const [holdProgress, setHoldProgress] = useState(0)
  const holdInterval = useRef<ReturnType<typeof setInterval> | null>(null)
  const holdStart = useRef<number>(0)

  const startHold = useCallback(() => {
    if (variant !== 'vow' || disabled) return
    holdStart.current = Date.now()
    holdInterval.current = setInterval(() => {
      const elapsed = Date.now() - holdStart.current
      const progress = Math.min(elapsed / holdDuration, 1)
      setHoldProgress(progress)
      if (progress >= 1) {
        clearInterval(holdInterval.current!)
        holdInterval.current = null
        /* Trigger haptic feedback if available */
        if (navigator.vibrate) navigator.vibrate(50)
        onClick?.()
      }
    }, 16)
  }, [variant, disabled, holdDuration, onClick])

  const cancelHold = useCallback(() => {
    if (holdInterval.current) {
      clearInterval(holdInterval.current)
      holdInterval.current = null
    }
    setHoldProgress(0)
  }, [])

  if (variant === 'whisper') {
    return (
      <motion.button
        onClick={onClick}
        disabled={disabled}
        whileHover={{ opacity: 1 }}
        whileTap={{ scale: 0.97 }}
        className={`group relative px-6 py-2 text-[#d4a44c]/50 text-sm font-light tracking-wide transition-colors hover:text-[#d4a44c]/80 disabled:opacity-30 ${className}`}
      >
        {children}
        <motion.span
          className="absolute bottom-0.5 left-1/2 h-px bg-[#d4a44c]/40 -translate-x-1/2"
          initial={{ width: 0 }}
          whileHover={{ width: '80%' }}
          transition={{ duration: 0.3 }}
        />
      </motion.button>
    )
  }

  if (variant === 'vow') {
    const circumference = 2 * Math.PI * 28
    const strokeDashoffset = circumference * (1 - holdProgress)

    return (
      <div className={`relative flex flex-col items-center gap-3 ${className}`}>
        {/* Circular progress ring */}
        <motion.div
          className="relative cursor-pointer select-none"
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          whileTap={{ scale: 0.96 }}
        >
          <svg width="72" height="72" className="absolute -inset-1">
            <circle
              cx="36" cy="36" r="28"
              fill="none"
              stroke="rgba(212,164,76,0.15)"
              strokeWidth="2"
            />
            <circle
              cx="36" cy="36" r="28"
              fill="none"
              stroke="rgba(212,164,76,0.8)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              transform="rotate(-90 36 36)"
              style={{ transition: 'stroke-dashoffset 0.05s linear' }}
            />
          </svg>
          <div
            className={`
              w-[70px] h-[70px] rounded-full flex items-center justify-center
              bg-gradient-to-br from-[#d4a44c]/25 to-[#FFD700]/10
              border border-[#d4a44c]/30 backdrop-blur-md
              text-[#d4a44c] text-xs font-light text-center leading-tight
              ${disabled ? 'opacity-30' : ''}
            `}
          >
            {holdProgress > 0 ? '🙏' : 'ॐ'}
          </div>
        </motion.div>
        <p className="text-[#d4a44c]/60 text-xs font-light">
          {holdProgress > 0 ? 'Sealing your vow...' : 'Hold to accept'}
        </p>
        <p className="text-[#d4a44c] text-sm font-light">{children}</p>
      </div>
    )
  }

  /* Golden variant (default) */
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className={`
        relative overflow-hidden px-8 py-3.5 rounded-full
        bg-gradient-to-r from-[#d4a44c]/25 via-[#FFD700]/15 to-[#d4a44c]/25
        text-[#d4a44c] border border-[#d4a44c]/30
        backdrop-blur-md font-light tracking-wide
        hover:from-[#d4a44c]/35 hover:via-[#FFD700]/25 hover:to-[#d4a44c]/35
        transition-all duration-500
        disabled:opacity-30 disabled:cursor-not-allowed
        ${className}
      `}
    >
      {/* Shimmer effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-[#FFD700]/10 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  )
}
