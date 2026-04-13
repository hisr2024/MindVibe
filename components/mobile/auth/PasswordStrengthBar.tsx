'use client'

/**
 * PasswordStrengthBar — Real-time password strength indicator
 *
 * 4 levels: Weak (red) / Fair (amber) / Good (gold) / Strong (green)
 * Checks: length >= 8, uppercase, number, special character
 */

interface PasswordStrengthBarProps {
  password: string
}

function getStrength(password: string): { level: number; label: string; color: string; symbol: string } {
  if (!password) return { level: 0, label: '', color: 'transparent', symbol: '' }

  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 1) return { level: 1, label: 'Weak', color: '#EF4444', symbol: '!' }
  if (score === 2) return { level: 2, label: 'Fair', color: '#F59E0B', symbol: '~' }
  if (score === 3) return { level: 3, label: 'Good', color: '#D4A017', symbol: '+' }
  return { level: 4, label: 'Strong', color: '#10B981', symbol: '\u2713' }
}

export function PasswordStrengthBar({ password }: PasswordStrengthBarProps) {
  const { level, label, color, symbol } = getStrength(password)

  if (!password) return null

  return (
    <div className="mt-1.5 mb-2 px-1" role="status" aria-live="polite" aria-label={label ? `Password strength: ${label}` : undefined}>
      <div className="flex gap-1 h-[3px] rounded-full overflow-hidden" aria-hidden="true">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="flex-1 rounded-full transition-all duration-300"
            style={{
              backgroundColor: i <= level ? color : 'rgba(255,255,255,0.08)',
            }}
          />
        ))}
      </div>
      <p
        className="sacred-text-ui text-xs mt-1 text-right transition-colors duration-300 font-medium"
        style={{ color }}
      >
        <span aria-hidden="true">{symbol} </span>{label}
      </p>
    </div>
  )
}

export default PasswordStrengthBar
