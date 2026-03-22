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
  id: 'bhakta',
  name: 'Bhakta',
  description: 'More questions and encrypted journal for devoted seekers',
  monthlyPrice: 6.99,
  yearlyPrice: 47.99,
  features: [
    '50 KIAAN questions/month',
    'Encrypted journal',
    '3 Wisdom Journeys',
    '90-day data retention',
  ],
  cta: 'Get Started',
  kiaanQuota: 50,
}

const mockFreeTier: PricingTier = {
  id: 'free',
  name: 'Seeker',
  description: 'Begin your spiritual journey with KIAAN',
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: [
    '5 KIAAN questions/month',
    'Mood tracking',
    'Community access',
  ],
  cta: 'Start Free',
  kiaanQuota: 5,
}

const mockSadhakTier: PricingTier = {
  id: 'sadhak',
  name: 'Sadhak',
  description: 'Full access to all features with 300 KIAAN questions',
  monthlyPrice: 12.99,
  yearlyPrice: 89.99,
  features: [
    '300 KIAAN questions/month',
    'Advanced analytics',
    'Priority support',
  ],
  highlighted: true,
  badge: 'Most Popular',
  cta: 'Go Sadhak',
  kiaanQuota: 300,
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

      expect(screen.getByText('Bhakta')).toBeInTheDocument()
    })

    it('renders tier description', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText(/More questions and encrypted journal/)).toBeInTheDocument()
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

    it('displays free tier quota (15 questions)', () => {
      render(
        <PricingCard
          tier={mockFreeTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('5/month')).toBeInTheDocument()
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

      expect(screen.getByText('$6.99')).toBeInTheDocument()
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

      expect(screen.getByText('$47.99')).toBeInTheDocument()
      expect(screen.getByText('/year')).toBeInTheDocument()
    })

    it('shows monthly equivalent for yearly billing', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={true}
          onSelect={mockOnSelect}
          formattedMonthlyEquivalent="$4.00"
        />
      )

      // $47.99 / 12 = ~$4.00
      expect(screen.getByText(/\$4\.00\/month when billed yearly/)).toBeInTheDocument()
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
          tier={mockSadhakTier}
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

      expect(mockOnSelect).toHaveBeenCalledWith('bhakta')
      expect(mockOnSelect).toHaveBeenCalledTimes(1)
    })

    it('shows "Current Plan" when currentPlan matches tier id', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
          currentPlan="bhakta"
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
          currentPlan="bhakta"
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
