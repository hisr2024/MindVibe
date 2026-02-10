/**
 * Tests for PricingCard component
 *
 * Tests:
 * - Rendering pricing information
 * - KIAAN quota display
 * - Feature list display
 * - Button states
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PricingCard, type PricingTier } from '@/components/pricing/PricingCard'

const mockTier: PricingTier = {
  id: 'basic',
  name: 'Basic',
  description: 'Perfect for individuals starting their wellness journey',
  monthlyPrice: 2.49,
  yearlyPrice: 24.99,
  features: [
    '50 KIAAN questions/month',
    'Encrypted journal',
    'Mood tracking',
    'Email support',
  ],
  cta: 'Get Started',
  kiaanQuota: 50,
}

const mockFreeTier: PricingTier = {
  id: 'free',
  name: 'Free',
  description: 'Get started with basic features',
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: [
    '20 KIAAN questions/month',
    'Mood tracking',
    'Community access',
  ],
  cta: 'Start Free',
  kiaanQuota: 20,
}

const mockPremiumTier: PricingTier = {
  id: 'premium',
  name: 'Premium',
  description: 'Full access to all features',
  monthlyPrice: 15,
  yearlyPrice: 149.99,
  features: [
    '300 KIAAN questions/month',
    'Advanced analytics',
    'Priority support',
  ],
  highlighted: true,
  badge: 'Most Popular',
  cta: 'Go Premium',
  kiaanQuota: 300,
}

const mockEnterpriseTier: PricingTier = {
  id: 'enterprise',
  name: 'Enterprise',
  description: 'Unlimited access for power users',
  monthlyPrice: 20,
  yearlyPrice: 199.99,
  features: [
    'Unlimited KIAAN questions',
    'API access',
    'Dedicated support',
  ],
  cta: 'Go Enterprise',
  kiaanQuota: 'unlimited',
}

describe('PricingCard', () => {
  const mockOnSelect = vi.fn()

  beforeEach(() => {
    mockOnSelect.mockClear()
  })

  describe('Basic Rendering', () => {
    it('renders tier name correctly', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('Basic')).toBeInTheDocument()
    })

    it('renders tier description', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText(/Perfect for individuals/)).toBeInTheDocument()
    })

    it('renders all features', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      mockTier.features.forEach((feature) => {
        expect(screen.getByText(feature)).toBeInTheDocument()
      })
    })

    it('renders CTA button text', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByRole('button', { name: 'Get Started' })).toBeInTheDocument()
    })
  })

  describe('KIAAN Quota Display', () => {
    it('displays numeric quota correctly', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('50/month')).toBeInTheDocument()
    })

    it('displays unlimited quota correctly', () => {
      render(
        <PricingCard
          tier={mockEnterpriseTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('Unlimited')).toBeInTheDocument()
    })

    it('displays free tier quota (20 questions)', () => {
      render(
        <PricingCard
          tier={mockFreeTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('20/month')).toBeInTheDocument()
    })

    it('shows KIAAN Questions label', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('KIAAN Questions')).toBeInTheDocument()
    })
  })

  describe('Pricing Display', () => {
    it('displays monthly price when isYearly is false', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('$2.49')).toBeInTheDocument()
      expect(screen.getByText('/month')).toBeInTheDocument()
    })

    it('displays yearly price when isYearly is true', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={true}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('$24.99')).toBeInTheDocument()
      expect(screen.getByText('/year')).toBeInTheDocument()
    })

    it('shows monthly equivalent for yearly billing', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={true}
          onSelect={mockOnSelect}
          formattedMonthlyEquivalent="$2.08"
        />
      )

      // $24.99 / 12 = $2.08
      expect(screen.getByText(/\$2\.08\/month when billed yearly/)).toBeInTheDocument()
    })

    it('displays $0 for free tier', () => {
      render(
        <PricingCard
          tier={mockFreeTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('$0')).toBeInTheDocument()
    })
  })

  describe('Highlighted Tier', () => {
    it('renders badge when provided', () => {
      render(
        <PricingCard
          tier={mockPremiumTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('Most Popular')).toBeInTheDocument()
    })

    it('does not render badge when not provided', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.queryByText('Most Popular')).not.toBeInTheDocument()
    })
  })

  describe('Button Interactions', () => {
    it('calls onSelect with tier id when clicked', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))

      expect(mockOnSelect).toHaveBeenCalledWith('basic')
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
    })

    it('shows "Current Plan" when currentPlan matches tier id', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
          currentPlan="basic"
        />
      )

      expect(screen.getByRole('button', { name: 'Current Plan' })).toBeInTheDocument()
    })

    it('disables button when currentPlan matches', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
          currentPlan="basic"
        />
      )

      expect(screen.getByRole('button', { name: 'Current Plan' })).toBeDisabled()
    })

    it('disables button when loading', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
          loading={true}
        />
      )

      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Accessibility', () => {
    it('has accessible button', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      const button = screen.getByRole('button')
      expect(button).toBeInTheDocument()
      expect(button).not.toBeDisabled()
    })

    it('features list is readable', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      const list = screen.getAllByRole('listitem')
      expect(list.length).toBe(mockTier.features.length)
    })
  })
})
