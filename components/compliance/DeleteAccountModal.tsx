'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiFetch } from '@/lib/api'

interface DeleteAccountModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm?: () => void
}

export default function DeleteAccountModal({
  isOpen,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const [step, setStep] = useState<'warning' | 'confirm' | 'submitted'>('warning')
  const [reason, setReason] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [deletionInfo, setDeletionInfo] = useState<{
    graceEndsAt: string
    daysRemaining: number
  } | null>(null)

  const handleSubmit = async () => {
    if (confirmText !== 'DELETE MY ACCOUNT') {
      setErrorMessage('Please type the confirmation text exactly')
      return
    }

    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await apiFetch('/api/gdpr/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: reason || null,
          confirm: true,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to request account deletion')
      }

      const data = await response.json()
      setDeletionInfo({
        graceEndsAt: new Date(data.grace_period_ends_at).toLocaleDateString(),
        daysRemaining: data.grace_period_days,
      })
      setStep('submitted')
      onConfirm?.()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCancel = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await apiFetch('/api/gdpr/delete-account/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Failed to cancel deletion')
      }

      setStep('warning')
      setDeletionInfo(null)
      onClose()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setStep('warning')
    setReason('')
    setConfirmText('')
    setErrorMessage('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md rounded-2xl bg-gray-900 border border-red-500/30 shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 bg-red-500/10 border-b border-red-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-red-500/20">
                <svg className="w-6 h-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-semibold text-red-400">Delete Account</h2>
                <p className="text-sm text-orange-100/50">This action cannot be undone</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 'warning' && (
              <div className="space-y-4">
                <p className="text-sm text-orange-100/70">
                  Deleting your account will permanently remove:
                </p>
                <ul className="text-sm text-orange-100/70 space-y-2">
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Your profile and personal information
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    All journal entries and mood data
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Conversation history with KIAAN
                  </li>
                  <li className="flex items-start gap-2">
                    <svg className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    Your subscription and billing history
                  </li>
                </ul>

                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                  <p className="text-sm text-amber-400">
                    💡 <strong>Grace Period:</strong> You will have 30 days to cancel the deletion before it becomes permanent.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-gray-800 text-orange-100 hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => setStep('confirm')}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors"
                  >
                    Continue
                  </button>
                </div>
              </div>
            )}

            {step === 'confirm' && (
              <div className="space-y-4">
                {errorMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400"
                  >
                    {errorMessage}
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-medium text-orange-100/70 mb-2">
                    Reason for leaving (optional)
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Help us improve by sharing why you're leaving..."
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-orange-50 placeholder-orange-100/30 focus:outline-none focus:border-orange-500 resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-orange-100/70 mb-2">
                    Type <span className="text-red-400 font-mono">DELETE MY ACCOUNT</span> to confirm
                  </label>
                  <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="DELETE MY ACCOUNT"
                    className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-orange-50 placeholder-orange-100/30 focus:outline-none focus:border-red-500 font-mono"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setStep('warning')}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-gray-800 text-orange-100 hover:bg-gray-700 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isLoading || confirmText !== 'DELETE MY ACCOUNT'}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Processing...' : 'Delete My Account'}
                  </button>
                </div>
              </div>
            )}

            {step === 'submitted' && deletionInfo && (
              <div className="space-y-4 text-center">
                <div className="p-4 rounded-full bg-amber-500/10 w-fit mx-auto">
                  <svg className="w-12 h-12 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-orange-50">Deletion Scheduled</h3>
                  <p className="text-sm text-orange-100/70 mt-2">
                    Your account is scheduled for deletion on{' '}
                    <strong className="text-orange-400">{deletionInfo.graceEndsAt}</strong>.
                  </p>
                </div>

                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                  <p className="text-sm text-emerald-400">
                    You have {deletionInfo.daysRemaining} days to cancel this request if you change your mind.
                  </p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleCancel}
                    disabled={isLoading}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                  >
                    {isLoading ? 'Canceling...' : 'Cancel Deletion'}
                  </button>
                  <button
                    onClick={handleClose}
                    className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-gray-800 text-orange-100 hover:bg-gray-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-800/50 border-t border-gray-700">
            <p className="text-xs text-orange-100/40 text-center">
              GDPR Article 17: You have the right to request erasure of your personal data.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
