'use client'

export function SecureBadge() {
  return (
    <div className="flex items-center justify-center gap-2 text-[11px] text-white/50">
      <span>🔒</span>
      <span>256-bit SSL · PCI DSS Level 1 · Stripe</span>
    </div>
  )
}
