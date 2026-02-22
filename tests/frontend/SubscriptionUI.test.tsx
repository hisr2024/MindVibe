/**
 * Tests for Subscription Management UI
 *
 * Tests:
 * - Quota display components
 * - Usage tracking
 * - Subscription status
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// Mock quota display component
const QuotaDisplay = ({
  used,
  limit,
  feature,
}: {
  used: number
  limit: number | 'unlimited'
  feature: string
}) => {
  const isUnlimited = limit === 'unlimited'
  const remaining = isUnlimited ? 'Unlimited' : limit - used

  return (
    <div data-testid="quota-display" role="status">
      <h3>{feature}</h3>
      <div className="quota-used" data-testid="quota-used">
        {used} used
      </div>
      <div className="quota-remaining" data-testid="quota-remaining">
        {isUnlimited ? 'Unlimited' : `${remaining} remaining`}
      </div>
      {!isUnlimited && (
        <div
          className="quota-progress"
          data-testid="quota-progress"
          role="progressbar"
          aria-valuenow={used}
          aria-valuemax={limit}
        >
          {((used / limit) * 100).toFixed(0)}%
        </div>
      )}
    </div>
  )
}

// Mock subscription status component
const SubscriptionStatus = ({
  tier,
  status,
  renewsAt,
}: {
  tier: string
  status: 'active' | 'canceled' | 'past_due'
  renewsAt?: string
}) => {
  return (
    <div data-testid="subscription-status" role="status">
      <div data-testid="tier">{tier}</div>
      <div data-testid="status">{status}</div>
      {renewsAt && <div data-testid="renews-at">Renews: {renewsAt}</div>}
    </div>
  )
}

describe('QuotaDisplay Component', () => {
  describe('Free Tier Quota (20 questions)', () => {
    it('displays used count', () => {
      render(
        <QuotaDisplay used={5} limit={20} feature="KIAAN Questions" />
      )

      expect(screen.getByTestId('quota-used')).toHaveTextContent('5 used')
    })

    it('displays remaining count', () => {
      render(
        <QuotaDisplay used={5} limit={20} feature="KIAAN Questions" />
      )

      expect(screen.getByTestId('quota-remaining')).toHaveTextContent('15 remaining')
    })

    it('displays progress bar', () => {
      render(
        <QuotaDisplay used={5} limit={20} feature="KIAAN Questions" />
      )

      const progressBar = screen.getByRole('progressbar')
      expect(progressBar).toBeInTheDocument()
      expect(progressBar).toHaveAttribute('aria-valuenow', '5')
      expect(progressBar).toHaveAttribute('aria-valuemax', '20')
    })

    it('shows 0 remaining when quota exhausted', () => {
      render(
        <QuotaDisplay used={20} limit={20} feature="KIAAN Questions" />
      )

      expect(screen.getByTestId('quota-remaining')).toHaveTextContent('0 remaining')
    })

    it('shows full usage at 100%', () => {
      render(
        <QuotaDisplay used={20} limit={20} feature="KIAAN Questions" />
      )

      expect(screen.getByTestId('quota-progress')).toHaveTextContent('100%')
    })
  })

  describe('Premium Tier Quota (Unlimited)', () => {
    it('displays unlimited for premium users', () => {
      render(
        <QuotaDisplay used={150} limit="unlimited" feature="KIAAN Questions" />
      )

      expect(screen.getByTestId('quota-remaining')).toHaveTextContent('Unlimited')
    })

    it('does not show progress bar for unlimited quota', () => {
      render(
        <QuotaDisplay used={150} limit="unlimited" feature="KIAAN Questions" />
      )

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    it('still shows used count for unlimited', () => {
      render(
        <QuotaDisplay used={250} limit="unlimited" feature="KIAAN Questions" />
      )

      expect(screen.getByTestId('quota-used')).toHaveTextContent('250 used')
    })
  })

  describe('Accessibility', () => {
    it('has accessible status role', () => {
      render(
        <QuotaDisplay used={5} limit={20} feature="KIAAN Questions" />
      )

      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })
})

describe('SubscriptionStatus Component', () => {
  describe('Active Subscription', () => {
    it('displays tier name', () => {
      render(
        <SubscriptionStatus tier="Premium" status="active" renewsAt="2024-02-01" />
      )

      expect(screen.getByTestId('tier')).toHaveTextContent('Premium')
    })

    it('displays active status', () => {
      render(
        <SubscriptionStatus tier="Premium" status="active" renewsAt="2024-02-01" />
      )

      expect(screen.getByTestId('status')).toHaveTextContent('active')
    })

    it('displays renewal date', () => {
      render(
        <SubscriptionStatus tier="Premium" status="active" renewsAt="2024-02-01" />
      )

      expect(screen.getByTestId('renews-at')).toHaveTextContent('Renews: 2024-02-01')
    })
  })

  describe('Canceled Subscription', () => {
    it('displays canceled status', () => {
      render(
        <SubscriptionStatus tier="Basic" status="canceled" />
      )

      expect(screen.getByTestId('status')).toHaveTextContent('canceled')
    })

    it('does not show renewal date when canceled', () => {
      render(
        <SubscriptionStatus tier="Basic" status="canceled" />
      )

      expect(screen.queryByTestId('renews-at')).not.toBeInTheDocument()
    })
  })

  describe('Past Due Subscription', () => {
    it('displays past_due status', () => {
      render(
        <SubscriptionStatus tier="Premium" status="past_due" />
      )

      expect(screen.getByTestId('status')).toHaveTextContent('past_due')
    })
  })

  describe('Free Tier', () => {
    it('displays Free tier name', () => {
      render(
        <SubscriptionStatus tier="Free" status="active" />
      )

      expect(screen.getByTestId('tier')).toHaveTextContent('Free')
    })
  })
})

describe('Subscription UI Integration', () => {
  it('displays correct quota for free tier (20 questions)', () => {
    const freeUserQuota = { used: 3, limit: 20 }

    render(
      <QuotaDisplay
        used={freeUserQuota.used}
        limit={freeUserQuota.limit}
        feature="KIAAN Questions"
      />
    )

    expect(screen.getByTestId('quota-used')).toHaveTextContent('3 used')
    expect(screen.getByTestId('quota-remaining')).toHaveTextContent('17 remaining')
  })

  it('displays correct quota for basic tier (50 questions)', () => {
    const basicUserQuota = { used: 45, limit: 50 }

    render(
      <QuotaDisplay
        used={basicUserQuota.used}
        limit={basicUserQuota.limit}
        feature="KIAAN Questions"
      />
    )

    expect(screen.getByTestId('quota-used')).toHaveTextContent('45 used')
    expect(screen.getByTestId('quota-remaining')).toHaveTextContent('5 remaining')
  })
})
