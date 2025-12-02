'use client'

import { Card, CardContent, Badge } from '@/components/ui'
import ProgressBar from '@/components/ui/ProgressBar'
import { useCountdown } from '@/hooks/useCountdown'

interface KiaanQuotaCardProps {
  used: number
  limit: number
  resetDate: Date
  isUnlimited?: boolean
  onUpgrade?: () => void
  className?: string
}

export function KiaanQuotaCard({
  used,
  limit,
  resetDate,
  isUnlimited = false,
  onUpgrade,
  className = '',
}: KiaanQuotaCardProps) {
  const countdown = useCountdown(resetDate)
  const percentage = isUnlimited ? 0 : Math.min(100, (used / limit) * 100)
  const isExceeded = !isUnlimited && used >= limit
  const isWarning = !isUnlimited && percentage >= 80

  return (
    <Card className={className}>
      <CardContent>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-500/30 via-[#ff9933]/20 to-amber-500/30 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-orange-400">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-orange-50">KIAAN Questions</h3>
              <p className="text-xs text-orange-100/60">Monthly quota</p>
            </div>
          </div>
          {isUnlimited ? (
            <Badge variant="premium">Unlimited</Badge>
          ) : isExceeded ? (
            <Badge variant="danger">Quota Exceeded</Badge>
          ) : isWarning ? (
            <Badge variant="warning">Low Quota</Badge>
          ) : null}
        </div>

        {isUnlimited ? (
          <div className="rounded-xl bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10 border border-orange-400/30 p-4 text-center">
            <p className="text-lg font-bold text-orange-50">∞ Unlimited</p>
            <p className="text-xs text-orange-100/60 mt-1">Ask KIAAN as much as you need</p>
          </div>
        ) : (
          <>
            <ProgressBar
              value={used}
              max={limit}
              label="Questions used"
              size="lg"
              className="mb-4"
            />

            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-xl bg-black/30 border border-orange-500/15 p-3 text-center">
                <p className="text-xs text-orange-100/60 mb-1">Used</p>
                <p className="text-lg font-bold text-orange-50">{used}</p>
              </div>
              <div className="rounded-xl bg-black/30 border border-orange-500/15 p-3 text-center">
                <p className="text-xs text-orange-100/60 mb-1">Remaining</p>
                <p className="text-lg font-bold text-orange-50">{Math.max(0, limit - used)}</p>
              </div>
              <div className="rounded-xl bg-black/30 border border-orange-500/15 p-3 text-center">
                <p className="text-xs text-orange-100/60 mb-1">Resets in</p>
                <p className="text-lg font-bold text-orange-50">{countdown.formatted}</p>
              </div>
            </div>

            {isExceeded && onUpgrade && (
              <button
                onClick={onUpgrade}
                className="w-full rounded-xl bg-gradient-to-r from-orange-400 via-orange-500 to-amber-300 px-4 py-3 text-sm font-semibold text-slate-900 shadow-lg shadow-orange-500/25 transition hover:scale-[1.01]"
              >
                Upgrade for More Questions
              </button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default KiaanQuotaCard
