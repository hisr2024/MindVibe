'use client'

import { useState } from 'react'
import { Button, Modal } from '@/components/ui'

interface CancelFlowProps {
  onCancel: (reason: string, feedback?: string) => void
  onKeepSubscription: () => void
  className?: string
}

const cancelReasons = [
  { id: 'too_expensive', label: 'Too expensive' },
  { id: 'not_using', label: 'Not using it enough' },
  { id: 'found_alternative', label: 'Found an alternative' },
  { id: 'missing_features', label: 'Missing features I need' },
  { id: 'technical_issues', label: 'Technical issues' },
  { id: 'temporary', label: 'Temporary break' },
  { id: 'other', label: 'Other reason' },
]

export function CancelFlow({ onCancel, onKeepSubscription, className = '' }: CancelFlowProps) {
  const [step, setStep] = useState<'reason' | 'offer' | 'confirm'>('reason')
  const [selectedReason, setSelectedReason] = useState<string>('')
  const [feedback, setFeedback] = useState('')
  const [showModal, setShowModal] = useState(false)

  const handleStartCancel = () => {
    setShowModal(true)
    setStep('reason')
  }

  const handleSelectReason = (reasonId: string) => {
    setSelectedReason(reasonId)
    // Show offer for price-sensitive users
    if (reasonId === 'too_expensive' || reasonId === 'temporary') {
      setStep('offer')
    } else {
      setStep('confirm')
    }
  }

  const handleAcceptOffer = () => {
    setShowModal(false)
    onKeepSubscription()
  }

  const handleConfirmCancel = () => {
    onCancel(selectedReason, feedback)
    setShowModal(false)
  }

  return (
    <div className={className}>
      <Button variant="ghost" onClick={handleStartCancel} className="text-red-400 hover:text-red-300">
        Cancel Subscription
      </Button>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={
          step === 'reason'
            ? "We're sorry to see you go"
            : step === 'offer'
              ? "Wait! We have an offer for you"
              : "Confirm Cancellation"
        }
        size="md"
      >
        {step === 'reason' && (
          <div className="space-y-4">
            <p className="text-sm text-orange-100/70">
              Before you go, please let us know why you're canceling so we can improve.
            </p>
            
            <div className="space-y-2">
              {cancelReasons.map((reason) => (
                <button
                  key={reason.id}
                  onClick={() => handleSelectReason(reason.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                    selectedReason === reason.id
                      ? 'border-orange-400 bg-orange-500/10'
                      : 'border-orange-500/15 bg-black/20 hover:bg-orange-500/5'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                      selectedReason === reason.id
                        ? 'border-orange-400 bg-orange-400'
                        : 'border-orange-500/30'
                    }`}
                  >
                    {selectedReason === reason.id && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                  <span className="text-sm text-orange-50">{reason.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'offer' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 via-amber-500/20 to-orange-500/20 border border-orange-400/30">
              <h3 className="text-lg font-semibold text-orange-50 mb-2">
                🎁 Special Offer Just For You
              </h3>
              <p className="text-sm text-orange-100/80 mb-4">
                {selectedReason === 'too_expensive'
                  ? "We understand budget constraints. How about 30% off your next 3 months?"
                  : "Need a break? We can pause your subscription for up to 3 months instead of canceling."}
              </p>
              <div className="flex gap-3">
                <Button variant="primary" onClick={handleAcceptOffer}>
                  {selectedReason === 'too_expensive' ? 'Get 30% Off' : 'Pause Instead'}
                </Button>
                <Button variant="ghost" onClick={() => setStep('confirm')}>
                  No thanks, continue
                </Button>
              </div>
            </div>

            <p className="text-xs text-orange-100/50 text-center">
              You can always come back to this offer later
            </p>
          </div>
        )}

        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <h3 className="text-sm font-semibold text-red-100 mb-2">What you'll lose:</h3>
              <ul className="space-y-1 text-sm text-red-200/80">
                <li>• Extended KIAAN question quota</li>
                <li>• Premium features and tools</li>
                <li>• Priority support access</li>
                <li>• Advanced analytics</li>
              </ul>
            </div>

            <div>
              <label className="block text-sm text-orange-100/70 mb-2">
                Any additional feedback? (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                className="w-full h-24 rounded-xl border border-orange-500/30 bg-black/40 px-4 py-3 text-sm text-orange-50 placeholder-orange-100/30 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500/20 resize-none"
                placeholder="Tell us how we can improve..."
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowModal(false)}>
                Keep Subscription
              </Button>
              <Button variant="danger" onClick={handleConfirmCancel}>
                Confirm Cancellation
              </Button>
            </div>

            <p className="text-xs text-orange-100/50 text-center">
              Your subscription will remain active until the end of your current billing period.
            </p>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default CancelFlow
