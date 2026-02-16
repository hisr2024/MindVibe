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
  name: 'Plus',
  description: 'Build a steady practice with guided support',
  monthlyPrice: 4.99,
  yearlyPrice: 49.99,
  features: [
    '150 KIAAN questions/month',
    'Encrypted journal',
    'Voice synthesis',
    '3 Wisdom Journeys',
  ],
  cta: 'Get Started',
  kiaanQuota: 150,
}

const mockFreeTier: PricingTier = {
  id: 'free',
  name: 'Free',
  description: 'Perfect for getting started with KIAAN',
  monthlyPrice: 0,
  yearlyPrice: 0,
  features: [
    '15 KIAAN questions/month',
    'Mood tracking',
    'Community access',
  ],
  cta: 'Start Free',
  kiaanQuota: 15,
}

const mockPremiumTier: PricingTier = {
  id: 'premium',
  name: 'Pro',
  description: '300 KIAAN questions with all features unlocked',
  monthlyPrice: 9.99,
  yearlyPrice: 99.99,
  features: [
    '300 KIAAN questions/month',
    'Advanced analytics',
    'Priority support',
  ],
  highlighted: true,
  badge: 'Most Popular',
  cta: 'Go Pro',
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

      expect(screen.getByText('Plus')).toBeInTheDocument()
    })

    it('renders tier description', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText(/Build a steady practice/)).toBeInTheDocument()
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

      expect(screen.getByText('150/month')).toBeInTheDocument()
    })

    it('displays free tier quota (15 questions)', () => {
      render(
        <PricingCard
          tier={mockFreeTier}
          isYearly={false}
          onSelect={mockOnSelect}
        />
      )

      expect(screen.getByText('15/month')).toBeInTheDocument()
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

      expect(screen.getByText('$4.99')).toBeInTheDocument()
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

      expect(screen.getByText('$49.99')).toBeInTheDocument()
      expect(screen.getByText('/year')).toBeInTheDocument()
    })

    it('shows monthly equivalent for yearly billing', () => {
      render(
        <PricingCard
          tier={mockTier}
          isYearly={true}
          onSelect={mockOnSelect}
          formattedMonthlyEquivalent="$4.17"
        />
      )

      // $49.99 / 12 = ~$4.17
      expect(screen.getByText(/\$4\.17\/month when billed yearly/)).toBeInTheDocument()
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
