'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { Button, Card, CardContent } from '@/components/ui'
import { SettingsSection } from '@/components/settings'

function SecuritySettingsContent() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <Link href="/settings" className="text-[#d4a44c] hover:text-[#e8b54a] text-sm mb-4 inline-block">
          &larr; Back to Settings
        </Link>
        <h1 className="text-3xl font-bold text-[#f5f0e8] mb-2">Security Settings</h1>
        <p className="text-[#f5f0e8]/70">Manage your account security</p>
      </div>

      {/* Active Sessions */}
      <SettingsSection
        title="Active Sessions"
        description="Manage devices logged into your account"
        className="mb-6"
      >
        <Card variant="bordered">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#f5f0e8]">View All Sessions</p>
              <p className="text-xs text-[#f5f0e8]/70">
                See and revoke access from other devices
              </p>
            </div>
            <Link href="/settings/security/sessions">
              <Button variant="outline" size="sm">Manage</Button>
            </Link>
          </CardContent>
        </Card>
      </SettingsSection>

      {/* Security Tips */}
      <SettingsSection
        title="Security Best Practices"
        description="Tips to keep your account secure"
        className="mb-6"
      >
        <div className="space-y-3">
          <div className="p-4 bg-black/20 rounded-xl border border-orange-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[#f5f0e8] text-sm">Use a strong, unique password</p>
                <p className="text-xs text-[#f5f0e8]/70 mt-1">
                  Combine uppercase, lowercase, numbers, and symbols. Never reuse passwords.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-black/20 rounded-xl border border-orange-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[#f5f0e8] text-sm">Review active sessions regularly</p>
                <p className="text-xs text-[#f5f0e8]/70 mt-1">
                  Revoke access from devices you don&apos;t recognize or no longer use.
                </p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-black/20 rounded-xl border border-orange-500/20">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="font-medium text-[#f5f0e8] text-sm">Be cautious of phishing</p>
                <p className="text-xs text-[#f5f0e8]/70 mt-1">
                  Never share your password. We&apos;ll never ask for it via email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>
    </main>
  )
}

export default function SecuritySettingsPage() {
  return (
    <Suspense
      fallback={
        <main className="mx-auto max-w-3xl px-4 py-12">
          <div className="animate-pulse">
            <div className="h-8 bg-[#d4a44c]/20 rounded w-48 mb-4" />
            <div className="h-4 bg-[#d4a44c]/10 rounded w-64 mb-8" />
            <div className="h-64 bg-[#d4a44c]/10 rounded-xl" />
          </div>
        </main>
      }
    >
      <SecuritySettingsContent />
    </Suspense>
  )
}
