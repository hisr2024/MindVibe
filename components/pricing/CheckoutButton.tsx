'use client'

import { useState } from 'react'
import { Button } from '@/components/ui'

interface CheckoutButtonProps {
  tierId: string
  tierName: string
  isYearly: boolean
  price: number
  onCheckout?: (tierId: string, isYearly: boolean) => Promise<void>
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  className?: string
}

export function CheckoutButton({
  tierId,
  tierName,
  isYearly,
  price,
  onCheckout,
  disabled,
  variant = 'primary',
  className = '',
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleClick = async () => {
    if (!onCheckout) return

    setLoading(true)
    setError(null)

    try {
      await onCheckout(tierId, isYearly)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={className}>
      <Button
        onClick={handleClick}
        loading={loading}
        disabled={disabled || loading}
        variant={variant}
        size="lg"
        className="w-full"
      >
        {loading ? <span>Processing...</span> : <span>Subscribe to {tierName}</span>}
      </Button>
      
      {error && (
        <p className="mt-2 text-xs text-red-400 text-center"><span>{error}</span></p>
      )}
      
      <p className="mt-2 text-xs text-orange-100/50 text-center">
        {price === 0
          ? 'Free forever, no credit card required'
          : `You'll be billed $${price}/${isYearly ? 'year' : 'month'} for ${tierName}. Cancel anytime.`}
      </p>
    </div>
  )
}

export default CheckoutButton
