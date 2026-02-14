/**
 * Component tests for NextStepLink.
 *
 * Covers: renders exactly one link when suggestion exists,
 * renders nothing when suggestion is null or feature flag is off.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { NextStepLink } from '@/components/suggestions/NextStepLink'
import type { Suggestion } from '@/lib/suggestions/nextStep'

// --- Mocks ----------------------------------------------------------------

// Feature flag state
let mockEnabled = true

vi.mock('@/lib/suggestions/store', () => ({
  useNextStepStore: (selector: (s: { nextStepSuggestionsEnabled: boolean }) => boolean) =>
    selector({ nextStepSuggestionsEnabled: mockEnabled }),
}))

vi.mock('next/link', () => ({
  default: function MockLink({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode
    href: string
    [key: string]: unknown
  }) {
    return React.createElement('a', { href, ...rest }, children)
  },
}))

vi.mock('@/hooks/useLanguage', () => ({
  useLanguage: () => ({
    language: 'en',
    t: (_key: string, fallback?: string) => fallback ?? _key,
    config: { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
    isRTL: false,
    isInitialized: true,
    setLanguage: vi.fn(),
  }),
}))

// --- Helpers ---------------------------------------------------------------

const sampleSuggestion: Suggestion = {
  targetTool: 'ardha',
  href: '/ardha',
  labelKey: 'navigation.next_step.explore_ardha',
  labelFallback: 'Explore in Ardha \u2192',
}

// --- Tests -----------------------------------------------------------------

describe('NextStepLink', () => {
  beforeEach(() => {
    mockEnabled = true
  })

  it('renders exactly one link when suggestion exists and feature is enabled', () => {
    render(<NextStepLink suggestion={sampleSuggestion} />)

    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(1)
    expect(links[0]).toHaveAttribute('href', '/ardha')
    expect(links[0]).toHaveTextContent('Explore in Ardha')
  })

  it('renders nothing when suggestion is null', () => {
    const { container } = render(<NextStepLink suggestion={null} />)
    expect(container.innerHTML).toBe('')
  })

  it('renders nothing when feature flag is disabled', () => {
    mockEnabled = false
    const { container } = render(<NextStepLink suggestion={sampleSuggestion} />)
    expect(container.innerHTML).toBe('')
  })

  it('uses the fallback label from the suggestion', () => {
    const customSuggestion: Suggestion = {
      targetTool: 'kiaan',
      href: '/kiaan/chat',
      labelKey: 'navigation.next_step.continue_kiaan',
      labelFallback: 'Continue with KIAAN \u2192',
    }
    render(<NextStepLink suggestion={customSuggestion} />)

    const link = screen.getByRole('link')
    expect(link).toHaveTextContent('Continue with KIAAN')
    expect(link).toHaveAttribute('href', '/kiaan/chat')
  })

  it('renders as a subtle text link (has text-xs class)', () => {
    render(<NextStepLink suggestion={sampleSuggestion} />)

    const link = screen.getByRole('link')
    expect(link.className).toContain('text-xs')
  })
})
