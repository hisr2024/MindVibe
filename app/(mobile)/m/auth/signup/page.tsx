'use client'

/**
 * Mobile Signup Page — Direct entry to account creation
 *
 * Redirects to the login page with Create Account tab active.
 * Exists as a separate route for deep-linking and onboarding flows.
 */

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SignupPage() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/m/auth/login?tab=create')
  }, [router])

  return (
    <div className="min-h-screen bg-[var(--sacred-cosmic-void)] flex items-center justify-center">
      <div className="sacred-divine-breath w-16 h-16 rounded-full flex items-center justify-center bg-gradient-to-br from-[rgba(22,26,66,0.9)] to-[rgba(17,20,53,0.95)] border border-[rgba(212,160,23,0.4)]">
        <span className="text-3xl text-[var(--sacred-divine-gold)] sacred-text-divine">ॐ</span>
      </div>
    </div>
  )
}
