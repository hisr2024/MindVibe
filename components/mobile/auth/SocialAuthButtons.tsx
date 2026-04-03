'use client'

/**
 * SocialAuthButtons — Google + Apple OAuth buttons
 *
 * Two-column layout. On tap, initiates OAuth flow via backend redirect.
 * Apple Sign In is required by App Store when any social login is offered.
 */

import { useState } from 'react'

interface SocialAuthButtonsProps {
  onGoogleAuth: () => void
  onAppleAuth: () => void
  loading?: boolean
}

export function SocialAuthButtons({ onGoogleAuth, onAppleAuth, loading }: SocialAuthButtonsProps) {
  const [activeProvider, setActiveProvider] = useState<string | null>(null)

  const handleGoogle = () => {
    setActiveProvider('google')
    onGoogleAuth()
  }

  const handleApple = () => {
    setActiveProvider('apple')
    onAppleAuth()
  }

  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {/* Google */}
      <button
        type="button"
        onClick={handleGoogle}
        disabled={loading}
        className="flex items-center justify-center gap-2 h-12 rounded-[14px] bg-[rgba(22,26,66,0.5)] border border-[rgba(255,255,255,0.1)] text-[var(--sacred-text-primary)] sacred-text-ui text-sm transition-all active:scale-[0.97] disabled:opacity-50"
      >
        {activeProvider === 'google' && loading ? (
          <div className="w-4 h-4 border-2 border-[var(--sacred-divine-gold)] border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.26c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
        )}
        <span>Google</span>
      </button>

      {/* Apple */}
      <button
        type="button"
        onClick={handleApple}
        disabled={loading}
        className="flex items-center justify-center gap-2 h-12 rounded-[14px] bg-[rgba(22,26,66,0.5)] border border-[rgba(255,255,255,0.1)] text-[var(--sacred-text-primary)] sacred-text-ui text-sm transition-all active:scale-[0.97] disabled:opacity-50"
      >
        {activeProvider === 'apple' && loading ? (
          <div className="w-4 h-4 border-2 border-[var(--sacred-divine-gold)] border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg width="16" height="18" viewBox="0 0 16 18" fill="currentColor">
            <path d="M13.34 9.48c-.02-2.08 1.7-3.08 1.78-3.13-0.97-1.42-2.48-1.61-3.01-1.64-1.28-.13-2.5.76-3.15.76-.65 0-1.65-.74-2.72-.72-1.4.02-2.69.81-3.41 2.07-1.46 2.52-.37 6.26 1.05 8.31.69 1 1.52 2.13 2.61 2.09 1.05-.04 1.44-.68 2.71-.68 1.27 0 1.62.68 2.73.66 1.13-.02 1.83-.1.02 2.52-1.4-.96-2.77-2.84-2.77z"/>
            <path d="M10.88 3.16c.58-.7.97-1.67.86-2.64-.83.03-1.83.55-2.43 1.25-.53.62-1 1.61-.87 2.56.93.07 1.87-.47 2.44-1.17z"/>
          </svg>
        )}
        <span>Apple</span>
      </button>
    </div>
  )
}

export default SocialAuthButtons
