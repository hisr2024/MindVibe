'use client'

/**
 * OTPVerification — 6-digit code entry with auto-advance
 *
 * Individual boxes for each digit, auto-advances on input,
 * supports paste (detects 6-char clipboard), and has a resend timer.
 */

import { useState, useRef, useEffect, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react'

interface OTPVerificationProps {
  onComplete: (code: string) => void
  onResend: () => void
  email: string
  loading?: boolean
  error?: string
}

const OTP_LENGTH = 6
const RESEND_COOLDOWN = 60

export function OTPVerification({ onComplete, onResend, email, loading, error }: OTPVerificationProps) {
  const [digits, setDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''))
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend countdown
  useEffect(() => {
    if (resendTimer <= 0) return
    const interval = setInterval(() => {
      setResendTimer((t) => t - 1)
    }, 1000)
    return () => clearInterval(interval)
  }, [resendTimer])

  const handleChange = useCallback((index: number, value: string) => {
    if (!/^\d*$/.test(value)) return

    const char = value.slice(-1)
    const newDigits = [...digits]
    newDigits[index] = char
    setDigits(newDigits)

    // Auto-advance
    if (char && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus()
    }

    // Check if complete
    const code = newDigits.join('')
    if (code.length === OTP_LENGTH && newDigits.every(d => d)) {
      onComplete(code)
    }
  }, [digits, onComplete])

  const handleKeyDown = useCallback((index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
      const newDigits = [...digits]
      newDigits[index - 1] = ''
      setDigits(newDigits)
    }
  }, [digits])

  const handlePaste = useCallback((e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH)
    if (pasted.length === OTP_LENGTH) {
      const newDigits = pasted.split('')
      setDigits(newDigits)
      inputRefs.current[OTP_LENGTH - 1]?.focus()
      onComplete(pasted)
    }
  }, [onComplete])

  const handleResend = () => {
    setResendTimer(RESEND_COOLDOWN)
    onResend()
  }

  return (
    <div className="flex flex-col items-center w-full">
      <p className="sacred-text-ui text-sm text-[var(--sacred-text-secondary)] text-center mb-6">
        Enter the 6-digit code sent to<br />
        <span className="text-[var(--sacred-divine-gold-bright)]">{email}</span>
      </p>

      {/* OTP Boxes */}
      <div className="flex gap-2.5 mb-4">
        {digits.map((digit, i) => (
          <input
            key={i}
            ref={(el) => { inputRefs.current[i] = el }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            onPaste={i === 0 ? handlePaste : undefined}
            disabled={loading}
            className={`w-12 h-14 text-center text-xl font-semibold rounded-[14px] bg-[rgba(22,26,66,0.55)] border transition-all duration-300 text-[var(--sacred-text-primary)] sacred-text-ui outline-none ${
              digit
                ? 'border-[rgba(212,160,23,0.5)]'
                : 'border-[rgba(212,160,23,0.18)]'
            } focus:border-[rgba(212,160,23,0.6)] focus:shadow-[0_0_0_3px_rgba(212,160,23,0.08)]`}
            aria-label={`Digit ${i + 1}`}
          />
        ))}
      </div>

      {error && (
        <p className="sacred-text-ui text-xs text-red-400 mb-3">{error}</p>
      )}

      {/* Resend */}
      <div className="mt-4">
        {resendTimer > 0 ? (
          <p className="sacred-text-ui text-xs text-[var(--sacred-text-muted)]">
            Resend code in {resendTimer}s
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="sacred-text-ui text-xs text-[var(--sacred-divine-gold)] hover:text-[var(--sacred-divine-gold-bright)] transition-colors"
          >
            Resend verification code
          </button>
        )}
      </div>
    </div>
  )
}

export default OTPVerification
