'use client'

import { Modal, Button } from '@/components/ui'
import Link from 'next/link'

interface FeatureLockedModalProps {
  open: boolean
  onClose: () => void
  featureName: string
  requiredTier: string
  description?: string
  onUpgrade?: () => void
}

export function FeatureLockedModal({
  open,
  onClose,
  featureName,
  requiredTier,
  description,
  onUpgrade,
}: FeatureLockedModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Premium Feature"
      size="md"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-[#d4a44c]/30 via-[#d4a44c]/30 to-rose-500/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d4a44c]">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>

        <h3 className="text-lg font-semibold text-[#f5f0e8] mb-2">{featureName}</h3>
        
        <p className="text-sm text-[#f5f0e8]/70 mb-4">
          {description || `This feature is available on the ${requiredTier} plan and above.`}
        </p>

        <div className="rounded-xl bg-gradient-to-r from-[#d4a44c]/10 via-[#d4a44c]/10 to-[#d4a44c]/10 border border-[#d4a44c]/30 p-4 mb-6">
          <p className="text-sm font-medium text-[#f5f0e8] mb-2">Upgrade to {requiredTier} to unlock:</p>
          <ul className="text-sm text-[#f5f0e8]/80 space-y-1 text-left">
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {featureName}
            </li>
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              More KIAAN questions
            </li>
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Priority support
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          {onUpgrade ? (
            <Button onClick={onUpgrade} variant="primary" size="lg" className="w-full">
              Upgrade Now
            </Button>
          ) : (
            <Link href="/pricing" className="w-full">
              <Button variant="primary" size="lg" className="w-full">
                View Plans
              </Button>
            </Link>
          )}
          <Button onClick={onClose} variant="ghost" size="md">
            Maybe Later
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default FeatureLockedModal
