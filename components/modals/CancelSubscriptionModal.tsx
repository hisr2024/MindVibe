'use client'

import { useState } from 'react'
import { Modal, Button, Input } from '@/components/ui'

interface CancelSubscriptionModalProps {
  open: boolean
  onClose: () => void
  planName: string
  endDate: Date
  onConfirm: () => Promise<void>
}

const cancellationReasons = [
  'Too expensive',
  'Not using it enough',
  'Found an alternative',
  'Missing features I need',
  'Technical issues',
  'Other',
]

export function CancelSubscriptionModal({
  open,
  onClose,
  planName,
  endDate,
  onConfirm,
}: CancelSubscriptionModalProps) {
  const [step, setStep] = useState<'reason' | 'confirm' | 'complete'>('reason')
  const [reason, setReason] = useState('')
  const [otherReason, setOtherReason] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    setLoading(true)
    setError(null)
    try {
      await onConfirm()
      setStep('complete')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setStep('reason')
    setReason('')
    setOtherReason('')
    setError(null)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={step === 'complete' ? 'Subscription Canceled' : 'Cancel Subscription'}
      size="md"
    >
      {step === 'reason' && (
        <div>
          <p className="text-sm text-orange-100/70 mb-4">
            We're sorry to see you go! Before you cancel, please let us know why:
          </p>

          <div className="space-y-2 mb-4">
            {cancellationReasons.map((r) => (
              <button
                key={r}
                onClick={() => setReason(r)}
                className={`w-full text-left rounded-xl border p-3 text-sm transition ${
                  reason === r
                    ? 'border-orange-400 bg-orange-500/10 text-orange-50'
                    : 'border-orange-500/20 bg-black/30 text-orange-100/80 hover:border-orange-400/50'
                }`}
              >
                {r}
              </button>
            ))}
          </div>

          {reason === 'Other' && (
            <Input
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              placeholder="Please tell us more..."
              className="mb-4"
            />
          )}

          <div className="flex gap-3">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Never Mind
            </Button>
            <Button
              onClick={() => setStep('confirm')}
              variant="danger"
              disabled={!reason || (reason === 'Other' && !otherReason)}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 'confirm' && (
        <div>
          <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-4 mb-4">
            <p className="text-sm text-amber-50 font-medium mb-2">Are you sure?</p>
            <p className="text-sm text-amber-100/80">
              Your {planName} subscription will remain active until{' '}
              <span className="font-semibold">{endDate.toLocaleDateString()}</span>.
              After that, you'll be moved to the Free plan.
            </p>
          </div>

          <ul className="text-sm text-orange-100/70 space-y-2 mb-6">
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400 shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Your KIAAN question quota will drop to 10/month
            </li>
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400 shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              Premium features will no longer be available
            </li>
            <li className="flex items-start gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 shrink-0 mt-0.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Your journal entries and data will be preserved
            </li>
          </ul>

          {error && (
            <p className="text-sm text-red-400 mb-4">{error}</p>
          )}

          <div className="flex gap-3">
            <Button onClick={() => setStep('reason')} variant="outline" className="flex-1">
              Go Back
            </Button>
            <Button
              onClick={handleConfirm}
              variant="danger"
              loading={loading}
              className="flex-1"
            >
              Cancel Subscription
            </Button>
          </div>
        </div>
      )}

      {step === 'complete' && (
        <div className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <p className="text-sm text-orange-100/70 mb-4">
            Your subscription has been canceled. You'll continue to have access to {planName} features
            until {endDate.toLocaleDateString()}.
          </p>

          <p className="text-sm text-orange-100/50 mb-6">
            Changed your mind? You can resubscribe anytime from the pricing page.
          </p>

          <Button onClick={handleClose} variant="primary" className="w-full">
            Got it
          </Button>
        </div>
      )}
    </Modal>
  )
}

export default CancelSubscriptionModal
