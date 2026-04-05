'use client'

/**
 * Mobile Login Page — The Sacred Threshold
 *
 * Sign In / Create Account tabbed interface with sacred OM header.
 * Handles both authentication modes within a single scrollable screen.
 * Supports ?tab=create query param for deep-linking to signup.
 */

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AuthHeader } from '@/components/mobile/auth/AuthHeader'
import { LoginScreen } from '@/components/mobile/auth/LoginScreen'
import { SignUpScreen } from '@/components/mobile/auth/SignUpScreen'

type AuthTab = 'signin' | 'create'

function LoginContent() {
  const searchParams = useSearchParams()
  const initialTab: AuthTab = searchParams.get('tab') === 'create' ? 'create' : 'signin'
  const [activeTab, setActiveTab] = useState<AuthTab>(initialTab)

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

      {/* Auth forms */}
      {activeTab === 'signin' ? (
        <LoginScreen onSwitchToSignUp={() => setActiveTab('create')} />
      ) : (
        <SignUpScreen onSwitchToLogin={() => setActiveTab('signin')} />
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[var(--sacred-cosmic-void)] flex items-center justify-center">
        <div className="sacred-divine-breath w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-[rgba(22,26,66,0.9)] to-[rgba(17,20,53,0.95)] border border-[rgba(212,160,23,0.4)]">
          <span className="text-3xl text-[var(--sacred-divine-gold)] sacred-text-divine">ॐ</span>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  )
}
