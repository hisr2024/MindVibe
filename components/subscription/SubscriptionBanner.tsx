'use client'

import Link from 'next/link'
import { useFeatureAccess } from '@/hooks/useFeatureAccess'
import { Button } from '@/components/ui'

interface SubscriptionBannerProps {
  /** Feature key to check — banner hides when user has access */
  feature: string
  /** Short benefit message shown in the banner */
  message?: string
  /** CTA button text */
  ctaText?: string
  className?: string
}

/**
 * Non-blocking soft upsell banner.
 *
 * Shows a dismissible upgrade nudge at the top of a page when the user's tier
 * is below what's needed for the full experience. Doesn't block content.
 */
export function SubscriptionBanner({
  feature,
  message,
  ctaText = 'Upgrade',
  className = '',
}: SubscriptionBannerProps) {
  const { hasAccess, featureLabel, tier: _tier } = useFeatureAccess()

  // Don't show banner if user already has access
  if (hasAccess(feature)) return null

  const label = featureLabel(feature)
  const defaultMessage = `Unlock ${label} and more — Plus starts at just $4.99/mo`

  return (
    <div
      className={`rounded-2xl bg-gradient-to-r from-[#d4a44c]/15 via-[#d4a44c]/10 to-[#d4a44c]/15 border border-[#d4a44c]/25 p-3 sm:p-4 ${className}`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-gradient-to-br from-[#d4a44c] via-[#d4a44c] to-[#e8b54a] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-900">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <p className="text-sm text-[#f5f0e8]/90 truncate">
            {message || defaultMessage}
          </p>
        </div>
        <Link href="/pricing" className="shrink-0">
          <Button variant="primary" size="sm">
            {ctaText}
          </Button>
        </Link>
      </div>
    </div>
  )
}

export default SubscriptionBanner
