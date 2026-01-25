'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Card, CardContent } from '@/components/ui'
import { SettingsSection, SettingsItem, SettingsDivider } from '@/components/settings'
import { apiFetch } from '@/lib/api'

interface TwoFactorStatus {
  enabled: boolean
  backup_codes_remaining: number
}

interface SetupData {
  secret: string
  uri: string
  qr_code: string
  backup_codes: string[]
}

type SetupStep = 'initial' | 'scanning' | 'verify' | 'backup' | 'complete'

export default function SecuritySettingsPage() {
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [setupStep, setSetupStep] = useState<SetupStep>('initial')
  const [setupData, setSetupData] = useState<SetupData | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [disableCode, setDisableCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [disabling, setDisabling] = useState(false)
  const [showDisableForm, setShowDisableForm] = useState(false)
  const [backupCodesCopied, setBackupCodesCopied] = useState(false)
  const [regeneratingBackupCodes, setRegeneratingBackupCodes] = useState(false)
  const [regenerateCode, setRegenerateCode] = useState('')
  const [showRegenerateForm, setShowRegenerateForm] = useState(false)
  const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null)

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true)
      const res = await apiFetch('/api/auth/2fa/status')
      if (res.ok) {
        const data = await res.json()
        setTwoFactorStatus(data)
      } else if (res.status === 401) {
        setError('Please log in to manage security settings')
      } else {
        setError('Failed to load 2FA status')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  const startSetup = async () => {
    try {
      setError(null)
      const res = await apiFetch('/api/auth/2fa/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        const data = await res.json()
        setSetupData(data)
        setSetupStep('scanning')
      } else {
        const errorData = await res.json()
        setError(errorData.detail || 'Failed to start 2FA setup')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    }
  }

  const verifySetup = async () => {
    if (!verifyCode || verifyCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    try {
      setVerifying(true)
      setError(null)

      const res = await apiFetch('/api/auth/2fa/enable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: verifyCode }),
      })

      if (res.ok) {
        setSetupStep('backup')
      } else {
        const errorData = await res.json()
        setError(errorData.detail || 'Invalid code. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const completeSetup = () => {
    setSetupStep('complete')
    fetchStatus()
    setTimeout(() => {
      setSetupStep('initial')
      setSetupData(null)
      setVerifyCode('')
    }, 3000)
  }

  const disable2FA = async () => {
    if (!disableCode || disableCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }
    if (!disablePassword) {
      setError('Please enter your password')
      return
    }

    try {
      setDisabling(true)
      setError(null)

      const res = await apiFetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: disableCode, password: disablePassword }),
      })

      if (res.ok) {
        setShowDisableForm(false)
        setDisableCode('')
        setDisablePassword('')
        fetchStatus()
      } else {
        const errorData = await res.json()
        setError(errorData.detail || 'Failed to disable 2FA')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setDisabling(false)
    }
  }

  const regenerateBackupCodes = async () => {
    if (!regenerateCode || regenerateCode.length !== 6) {
      setError('Please enter a 6-digit code')
      return
    }

    try {
      setRegeneratingBackupCodes(true)
      setError(null)

      const res = await apiFetch('/api/auth/2fa/regenerate-backup-codes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: regenerateCode }),
      })

      if (res.ok) {
        const data = await res.json()
        setNewBackupCodes(data.backup_codes)
        setShowRegenerateForm(false)
        setRegenerateCode('')
        fetchStatus()
      } else {
        const errorData = await res.json()
        setError(errorData.detail || 'Failed to regenerate backup codes')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setRegeneratingBackupCodes(false)
    }
  }

  const copyBackupCodes = (codes: string[]) => {
    navigator.clipboard.writeText(codes.join('\n'))
    setBackupCodesCopied(true)
    setTimeout(() => setBackupCodesCopied(false), 2000)
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-orange-500/20 rounded w-48 mb-4"></div>
          <div className="h-4 bg-orange-500/10 rounded w-64 mb-8"></div>
          <div className="h-64 bg-orange-500/10 rounded-xl"></div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div className="mb-8">
        <Link href="/settings" className="text-orange-400 hover:text-orange-300 text-sm mb-4 inline-block">
          &larr; Back to Settings
        </Link>
        <h1 className="text-3xl font-bold text-orange-50 mb-2">Security Settings</h1>
        <p className="text-orange-100/70">Protect your account with additional security measures</p>
      </div>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mb-6 rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-200"
          >
            {error}
            <button
              onClick={() => setError(null)}
              className="ml-4 text-red-400 hover:text-red-300"
            >
              Dismiss
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-Factor Authentication */}
      <SettingsSection
        title="Two-Factor Authentication (2FA)"
        description="Add an extra layer of security to your account"
        className="mb-6"
      >
        {twoFactorStatus?.enabled ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-emerald-50">2FA is Enabled</p>
                  <p className="text-xs text-emerald-200/70">
                    {twoFactorStatus.backup_codes_remaining} backup codes remaining
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowRegenerateForm(true)}
                >
                  Regenerate Codes
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => setShowDisableForm(true)}
                >
                  Disable
                </Button>
              </div>
            </div>

            {/* Regenerate Backup Codes Form */}
            <AnimatePresence>
              {showRegenerateForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Card variant="bordered" className="mt-4">
                    <CardContent className="space-y-4">
                      <p className="text-sm text-orange-100/70">
                        Enter your current 2FA code to generate new backup codes. This will invalidate all existing backup codes.
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-orange-100 mb-1">
                          2FA Code
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={regenerateCode}
                          onChange={(e) => setRegenerateCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-2 bg-black/20 border border-orange-500/30 rounded-lg text-orange-50 placeholder-orange-300/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          placeholder="Enter 6-digit code"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={regenerateBackupCodes}
                          disabled={regeneratingBackupCodes}
                        >
                          {regeneratingBackupCodes ? 'Generating...' : 'Generate New Codes'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowRegenerateForm(false)
                            setRegenerateCode('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* New Backup Codes Display */}
            <AnimatePresence>
              {newBackupCodes && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card variant="bordered" className="mt-4 border-amber-500/30 bg-amber-500/5">
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-amber-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium">Save These Backup Codes</span>
                      </div>
                      <p className="text-sm text-orange-100/70">
                        These codes will only be shown once. Store them securely.
                      </p>
                      <div className="grid grid-cols-2 gap-2 p-4 bg-black/30 rounded-lg font-mono text-sm">
                        {newBackupCodes.map((code, i) => (
                          <div key={i} className="text-orange-100">{code}</div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => copyBackupCodes(newBackupCodes)}
                        >
                          {backupCodesCopied ? 'Copied!' : 'Copy Codes'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setNewBackupCodes(null)}
                        >
                          I&apos;ve Saved Them
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Disable 2FA Form */}
            <AnimatePresence>
              {showDisableForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <Card variant="bordered" className="mt-4 border-red-500/30 bg-red-500/5">
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-red-400">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span className="font-medium">Disable Two-Factor Authentication</span>
                      </div>
                      <p className="text-sm text-orange-100/70">
                        This will make your account less secure. Are you sure?
                      </p>
                      <div>
                        <label className="block text-sm font-medium text-orange-100 mb-1">
                          Current 2FA Code
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={6}
                          value={disableCode}
                          onChange={(e) => setDisableCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full px-4 py-2 bg-black/20 border border-orange-500/30 rounded-lg text-orange-50 placeholder-orange-300/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          placeholder="Enter 6-digit code"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-orange-100 mb-1">
                          Password
                        </label>
                        <input
                          type="password"
                          value={disablePassword}
                          onChange={(e) => setDisablePassword(e.target.value)}
                          className="w-full px-4 py-2 bg-black/20 border border-orange-500/30 rounded-lg text-orange-50 placeholder-orange-300/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                          placeholder="Enter your password"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={disable2FA}
                          disabled={disabling}
                        >
                          {disabling ? 'Disabling...' : 'Disable 2FA'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowDisableForm(false)
                            setDisableCode('')
                            setDisablePassword('')
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : setupStep === 'initial' ? (
          <div className="space-y-4">
            <Card variant="bordered">
              <CardContent className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-orange-50">Enable 2FA</p>
                  <p className="text-xs text-orange-100/50">
                    Use an authenticator app like Google Authenticator or Authy
                  </p>
                </div>
                <Button variant="primary" size="sm" onClick={startSetup}>
                  Set Up
                </Button>
              </CardContent>
            </Card>
            <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/30">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-blue-200">Why enable 2FA?</p>
                  <p className="text-xs text-blue-200/70 mt-1">
                    Two-factor authentication adds an extra layer of security by requiring a code from your phone in addition to your password. This protects your account even if your password is compromised.
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : setupStep === 'scanning' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-orange-50 mb-2">
                Step 1: Scan QR Code
              </h3>
              <p className="text-sm text-orange-100/70">
                Open your authenticator app and scan this QR code
              </p>
            </div>

            {setupData?.qr_code && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-xl">
                  <img
                    src={`data:image/png;base64,${setupData.qr_code}`}
                    alt="2FA QR Code"
                    className="w-48 h-48"
                  />
                </div>
              </div>
            )}

            <div className="text-center">
              <p className="text-xs text-orange-100/50 mb-2">
                Or enter this code manually:
              </p>
              <code className="px-4 py-2 bg-black/30 rounded-lg text-orange-300 font-mono text-sm">
                {setupData?.secret}
              </code>
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setSetupStep('initial')}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setSetupStep('verify')}>
                Next
              </Button>
            </div>
          </motion.div>
        ) : setupStep === 'verify' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-orange-50 mb-2">
                Step 2: Verify Code
              </h3>
              <p className="text-sm text-orange-100/70">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>

            <div className="flex justify-center">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                value={verifyCode}
                onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                className="w-48 px-6 py-4 bg-black/20 border border-orange-500/30 rounded-xl text-center text-2xl font-mono text-orange-50 placeholder-orange-300/50 focus:outline-none focus:ring-2 focus:ring-orange-500/50 tracking-widest"
                placeholder="000000"
                autoFocus
              />
            </div>

            <div className="flex justify-center gap-4">
              <Button variant="outline" onClick={() => setSetupStep('scanning')}>
                Back
              </Button>
              <Button
                variant="primary"
                onClick={verifySetup}
                disabled={verifying || verifyCode.length !== 6}
              >
                {verifying ? 'Verifying...' : 'Verify'}
              </Button>
            </div>
          </motion.div>
        ) : setupStep === 'backup' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h3 className="text-lg font-semibold text-orange-50 mb-2">
                Step 3: Save Backup Codes
              </h3>
              <p className="text-sm text-orange-100/70">
                These codes can be used to access your account if you lose your phone
              </p>
            </div>

            <div className="p-4 bg-amber-500/10 rounded-xl border border-amber-500/30">
              <div className="flex items-center gap-2 text-amber-400 mb-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="font-medium">Important: Save these codes now!</span>
              </div>
              <p className="text-xs text-amber-200/70">
                Store these backup codes in a safe place. Each code can only be used once.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 p-4 bg-black/30 rounded-xl font-mono text-sm">
              {setupData?.backup_codes.map((code, i) => (
                <div key={i} className="text-orange-100 p-2 bg-black/20 rounded">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex justify-center gap-4">
              <Button
                variant="outline"
                onClick={() => setupData && copyBackupCodes(setupData.backup_codes)}
              >
                {backupCodesCopied ? 'Copied!' : 'Copy All Codes'}
              </Button>
              <Button variant="primary" onClick={completeSetup}>
                I&apos;ve Saved My Codes
              </Button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-emerald-50 mb-2">
              2FA Enabled Successfully!
            </h3>
            <p className="text-sm text-emerald-200/70">
              Your account is now protected with two-factor authentication
            </p>
          </motion.div>
        )}
      </SettingsSection>

      {/* Active Sessions */}
      <SettingsSection
        title="Active Sessions"
        description="Manage devices logged into your account"
        className="mb-6"
      >
        <Card variant="bordered">
          <CardContent className="flex items-center justify-between">
            <div>
              <p className="font-medium text-orange-50">View All Sessions</p>
              <p className="text-xs text-orange-100/50">
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
                <p className="font-medium text-orange-50 text-sm">Use a strong, unique password</p>
                <p className="text-xs text-orange-100/50 mt-1">
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
                <p className="font-medium text-orange-50 text-sm">Enable two-factor authentication</p>
                <p className="text-xs text-orange-100/50 mt-1">
                  Adds an extra layer of protection even if your password is compromised.
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
                <p className="font-medium text-orange-50 text-sm">Review active sessions regularly</p>
                <p className="text-xs text-orange-100/50 mt-1">
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
                <p className="font-medium text-orange-50 text-sm">Be cautious of phishing</p>
                <p className="text-xs text-orange-100/50 mt-1">
                  Never share your password or 2FA codes. We&apos;ll never ask for them via email.
                </p>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>
    </main>
  )
}
