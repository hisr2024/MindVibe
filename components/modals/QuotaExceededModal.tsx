'use client'

import { useMemo } from 'react'
import { Modal, Button } from '@/components/ui'
import Link from 'next/link'

interface QuotaExceededModalProps {
  open: boolean
  onClose: () => void
  quota: number
  resetDate: Date
  onUpgrade?: () => void
}

export function QuotaExceededModal({
  open,
  onClose,
  quota,
  resetDate,
  onUpgrade,
}: QuotaExceededModalProps) {
  const daysUntilReset = useMemo(
    // eslint-disable-next-line react-hooks/purity
    () => Math.max(0, Math.ceil((resetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
    [resetDate]
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="KIAAN Question Quota Reached"
      size="md"
    >
      <div className="text-center">
        <div className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500/30 via-amber-500/30 to-orange-500/30 flex items-center justify-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>

        <p className="text-sm text-orange-100/80 mb-4">
          You&apos;ve used all {quota} of your monthly KIAAN questions. Your quota will reset in{' '}
          <span className="font-semibold text-orange-50">{daysUntilReset} days</span>.
        </p>

        <div className="rounded-xl bg-orange-500/10 border border-orange-500/20 p-4 mb-6">
          <p className="text-xs text-orange-100/70 mb-2">
            KIAAN is still here for you! You can:
          </p>
          <ul className="text-sm text-orange-100/80 space-y-1 text-left">
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Continue journaling and tracking moods
            </li>
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Access guided breathing exercises
            </li>
            <li className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Read daily wisdom
            </li>
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          {onUpgrade ? (
            <Button onClick={onUpgrade} variant="primary" size="lg" className="w-full">
              Upgrade for More Questions
            </Button>
          ) : (
            <Link href="/pricing" className="w-full">
              <Button variant="primary" size="lg" className="w-full">
                Upgrade for More Questions
              </Button>
            </Link>
          )}
          <Button onClick={onClose} variant="ghost" size="md">
            I&apos;ll wait for the reset
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default QuotaExceededModal
