'use client'

/**
 * Mobile Login Page — The Sacred Threshold
 *
 * Sign In / Create Account tabbed interface with sacred OM header.
 * Handles both authentication modes within a single scrollable screen.
 * Supports ?tab=create query param for deep-linking to signup.
 *
 * Biometric Authentication:
 * - When available and registered: shows "Sign in with Face ID/Biometrics" above the email form
 * - On successful password login: offers to enable biometric if available but not registered
 * - Falls back silently to password form on biometric failure
 */

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { AuthHeader } from '@/components/mobile/auth/AuthHeader'
import { LoginScreen } from '@/components/mobile/auth/LoginScreen'
import { SignUpScreen } from '@/components/mobile/auth/SignUpScreen'
import { useBiometricAuth } from '@/hooks/useBiometricAuth'

type AuthTab = 'signin' | 'create'

/**
 * Detect whether the device is iOS (iPhone/iPad) for biometric button label.
 * Falls back to generic "Biometrics" label for Android and other platforms.
 */
function getBiometricLabel(): string {
  if (typeof navigator === 'undefined') return 'Sign in with Biometrics'
  const ua = navigator.userAgent
  if (/iPhone|iPad|iPod/.test(ua)) {
    return 'Sign in with Face ID'
  }
  return 'Sign in with Biometrics'
}

function LoginContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab: AuthTab = searchParams.get('tab') === 'create' ? 'create' : 'signin'
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab)

  // Biometric auth state
  const {
    isAvailable: biometricAvailable,
    isRegistered: biometricRegistered,
    isLoading: biometricHookLoading,
    authenticate: biometricAuthenticate,
    register: biometricRegister,
  } = useBiometricAuth()

  const [isBiometricLoading, setIsBiometricLoading] = useState(false)
  const [showBiometricOffer, setShowBiometricOffer] = useState(false)
  const [hasAttemptedBiometric, setHasAttemptedBiometric] = useState(false)
  const [biometricLabel, setBiometricLabel] = useState('Sign in with Biometrics')
  const [biometricOfferLoading, setBiometricOfferLoading] = useState(false)

  // User info captured from successful password login (for biometric registration)
  const [loggedInUser, setLoggedInUser] = useState<{ id: string; email: string; name?: string } | null>(null)

  // Set biometric label on mount (needs navigator.userAgent which is client-only)
  useEffect(() => {
    setBiometricLabel(getBiometricLabel())
  }, [])

  /**
   * Handle biometric authentication attempt.
   * On success: navigate to main app.
   * On failure: silently fall back to password form (no alarming error).
   */
  const handleBiometricLogin = useCallback(async () => {
    setIsBiometricLoading(true)
    setHasAttemptedBiometric(true)

    try {
      const result = await biometricAuthenticate()

      if (result.success) {
        router.push('/m')
        return
      }

      // Silent fallback — user sees the password form with no error
    } catch {
      // Silent fallback on unexpected errors
    } finally {
      setIsBiometricLoading(false)
    }
  }, [biometricAuthenticate, router])

  /**
   * Callback from LoginScreen after successful password login.
   * If biometric is available but not registered, show the offer bottom sheet.
   * Returns true to prevent LoginScreen from navigating (we'll handle it).
   */
  const handlePasswordLoginSuccess = useCallback(
    (user: { id: string; email: string; name?: string }): boolean => {
      if (biometricAvailable && !biometricRegistered) {
        setLoggedInUser(user)
        setShowBiometricOffer(true)
        return true // Prevent default navigation — we show the offer first
      }
      return false // Let LoginScreen navigate normally
    },
    [biometricAvailable, biometricRegistered]
  )

  /**
   * Handle enabling biometric from the offer bottom sheet.
   */
  const handleEnableBiometric = useCallback(async () => {
    if (!loggedInUser) return
    setBiometricOfferLoading(true)

    try {
      await biometricRegister(loggedInUser.id, loggedInUser.email)
    } catch {
      // Registration failed — proceed to app anyway
    } finally {
      setBiometricOfferLoading(false)
      setShowBiometricOffer(false)
      router.push('/m')
    }
  }, [loggedInUser, biometricRegister, router])

  /**
   * Handle "Maybe later" from the biometric offer bottom sheet.
   */
  const handleSkipBiometric = useCallback(() => {
    setShowBiometricOffer(false)
    router.push('/m')
  }, [router])

  // Whether to show biometric login button (available, registered, on sign-in tab)
  const showBiometricButton = biometricAvailable && biometricRegistered && activeTab === 'signin'

  return (
    <div className="min-h-screen bg-[var(--sacred-cosmic-void)] px-5 pb-10 overflow-y-auto">
      {/* Sacred header with OM */}
      <AuthHeader />

      {/* Tab switcher */}
      <div className="flex rounded-2xl bg-[rgba(22,26,66,0.5)] border border-[rgba(255,255,255,0.06)] p-1 mb-6">
        <button
          onClick={() => setActiveTab('signin')}
          className={`flex-1 py-2.5 rounded-xl text-sm sacred-text-ui transition-all ${
            activeTab === 'signin'
              ? 'bg-[rgba(27,79,187,0.3)] text-[var(--sacred-text-primary)] border border-[rgba(212,160,23,0.25)]'
              : 'text-[var(--sacred-text-muted)]'
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => setActiveTab('create')}
          className={`flex-1 py-2.5 rounded-xl text-sm sacred-text-ui transition-all ${
            activeTab === 'create'
              ? 'bg-[rgba(27,79,187,0.3)] text-[var(--sacred-text-primary)] border border-[rgba(212,160,23,0.25)]'
              : 'text-[var(--sacred-text-muted)]'
          }`}
        >
          Create Account
        </button>
      </div>

      {/* Biometric Login Button — shown above email form when available and registered */}
      {showBiometricButton && (
        <>
          <button
            type="button"
            onClick={handleBiometricLogin}
            disabled={isBiometricLoading || biometricHookLoading}
            style={{
              width: '100%',
              height: '56px',
              borderRadius: '28px',
              background: 'radial-gradient(ellipse at 50% 0%, #D4A017 0%, #B8860B 50%, #8B6914 100%)',
              border: '1px solid rgba(212, 160, 23, 0.4)',
              color: '#050714',
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 600,
              fontSize: '16px',
              letterSpacing: '0.02em',
              cursor: isBiometricLoading ? 'wait' : 'pointer',
              opacity: isBiometricLoading ? 0.7 : 1,
              transition: 'opacity 0.2s ease, transform 0.1s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            {isBiometricLoading ? (
              <span
                style={{
                  display: 'inline-block',
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(5, 7, 20, 0.3)',
                  borderTopColor: '#050714',
                  borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite',
                }}
              />
            ) : (
              <>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                {biometricLabel}
              </>
            )}
          </button>

          {/* "or use password" divider */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '20px 0',
          }}>
            <div style={{
              flex: 1,
              height: '1px',
              background: 'linear-gradient(to right, transparent, rgba(212, 160, 23, 0.3), transparent)',
            }} />
            <span style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '12px',
              color: 'rgba(255, 255, 255, 0.4)',
              whiteSpace: 'nowrap',
            }}>
              or use password
            </span>
            <div style={{
              flex: 1,
              height: '1px',
              background: 'linear-gradient(to right, transparent, rgba(212, 160, 23, 0.3), transparent)',
            }} />
          </div>
        </>
      )}

      {/* Auth forms */}
      {activeTab === 'signin' ? (
        <LoginScreen
          onSwitchToSignUp={() => setActiveTab('create')}
          onLoginSuccess={handlePasswordLoginSuccess}
        />
      ) : (
        <SignUpScreen onSwitchToLogin={() => setActiveTab('signin')} />
      )}

      {/* Biometric Offer Bottom Sheet — shown after successful password login */}
      {showBiometricOffer && (
        <>
          {/* Backdrop */}
          <div
            onClick={handleSkipBiometric}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
              zIndex: 9998,
              animation: 'fadeIn 0.25s ease-out',
            }}
          />

          {/* Bottom Sheet */}
          <div style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 9999,
            background: 'linear-gradient(180deg, #0E1330 0%, #050714 100%)',
            borderTop: '1px solid rgba(212, 160, 23, 0.25)',
            borderRadius: '24px 24px 0 0',
            padding: '32px 24px',
            paddingBottom: 'max(32px, env(safe-area-inset-bottom))',
            animation: 'slideUp 0.3s ease-out',
          }}>
            {/* Handle bar */}
            <div style={{
              width: '40px',
              height: '4px',
              borderRadius: '2px',
              background: 'rgba(255, 255, 255, 0.15)',
              margin: '0 auto 24px',
            }} />

            {/* Icon */}
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'radial-gradient(ellipse at 50% 30%, rgba(212, 160, 23, 0.2), rgba(212, 160, 23, 0.05))',
              border: '1px solid rgba(212, 160, 23, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#D4A017" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                <circle cx="12" cy="16" r="1" />
              </svg>
            </div>

            {/* Title */}
            <h3 style={{
              fontFamily: 'Outfit, sans-serif',
              fontWeight: 600,
              fontSize: '20px',
              color: '#FFFFFF',
              textAlign: 'center',
              margin: '0 0 8px',
            }}>
              Enable Quick Sign In
            </h3>

            {/* Description */}
            <p style={{
              fontFamily: 'Outfit, sans-serif',
              fontSize: '14px',
              color: 'rgba(255, 255, 255, 0.5)',
              textAlign: 'center',
              lineHeight: 1.5,
              margin: '0 0 28px',
            }}>
              Use biometric authentication for faster, more secure access to your sanctuary.
            </p>

            {/* Enable Biometric Button (gold) */}
            <button
              type="button"
              onClick={handleEnableBiometric}
              disabled={biometricOfferLoading}
              style={{
                width: '100%',
                height: '56px',
                borderRadius: '28px',
                background: 'radial-gradient(ellipse at 50% 0%, #D4A017 0%, #B8860B 50%, #8B6914 100%)',
                border: '1px solid rgba(212, 160, 23, 0.4)',
                color: '#050714',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 600,
                fontSize: '16px',
                letterSpacing: '0.02em',
                cursor: biometricOfferLoading ? 'wait' : 'pointer',
                opacity: biometricOfferLoading ? 0.7 : 1,
                transition: 'opacity 0.2s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '12px',
              }}
            >
              {biometricOfferLoading ? (
                <span
                  style={{
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    border: '2px solid rgba(5, 7, 20, 0.3)',
                    borderTopColor: '#050714',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
              ) : (
                'Enable Biometric Login'
              )}
            </button>

            {/* Maybe Later Button (ghost) */}
            <button
              type="button"
              onClick={handleSkipBiometric}
              disabled={biometricOfferLoading}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '24px',
                background: 'transparent',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: 'rgba(255, 255, 255, 0.5)',
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 500,
                fontSize: '15px',
                cursor: 'pointer',
                transition: 'border-color 0.2s ease, color 0.2s ease',
              }}
            >
              Maybe later
            </button>
          </div>
        </>
      )}

      {/* Keyframe animations for biometric UI */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--sacred-cosmic-void)] flex items-center justify-center">
        <div className="sacred-divine-breath w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-[rgba(22,26,66,0.9)] to-[rgba(17,20,53,0.95)] border border-[rgba(212,160,23,0.4)]">
          <span className="text-3xl text-[var(--sacred-divine-gold)] sacred-text-divine">&#x0950;</span>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
