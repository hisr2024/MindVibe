'use client'

/**
 * SecureBadge — SSL + PCI compliance indicator
 *
 * Lock icon + "256-bit SSL · PCI DSS · Razorpay/Stripe"
 * Muted, centered, bottom of payment screen.
 */

interface SecureBadgeProps {
  provider?: 'razorpay' | 'stripe'
}

export function SecureBadge({ provider = 'razorpay' }: SecureBadgeProps) {
  const providerName = provider === 'razorpay' ? 'Razorpay' : 'Stripe'

  return (
    <div className="flex items-center justify-center gap-1.5 py-3">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--sacred-text-muted)]">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
      </svg>
      <span className="sacred-text-ui text-[11px] text-[var(--sacred-text-muted)]">
        256-bit SSL · PCI DSS · {providerName}
      </span>
    </div>
  )
}

export default SecureBadge
