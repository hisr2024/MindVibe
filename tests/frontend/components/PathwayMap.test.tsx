/**
 * Tests for PathwayMap component.
 *
 * Covers: rendering 5 items, active state via aria-current,
 * correct href attributes, a11y attributes, and reduced-motion class.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import React from 'react'
import { PathwayMap } from '@/components/navigation/PathwayMap'
import { PATHWAY_STEPS } from '@/lib/navigation/pathway'

// --- Mocks ----------------------------------------------------------------

// Allow per-test control of the pathname returned by usePathname.
let mockPathname = '/'

vi.mock('next/navigation', () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
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

// Minimal translation mock – returns fallback (English).
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

function renderPathway() {
  return render(<PathwayMap />)
}

// --- Tests -----------------------------------------------------------------

describe('PathwayMap', () => {
  beforeEach(() => {
    mockPathname = '/'
  })

  it('renders exactly 5 pathway items', () => {
    renderPathway()

    const nav = screen.getByRole('navigation', { name: /healing pathway/i })
    const links = within(nav).getAllByRole('link')

    expect(links).toHaveLength(5)
  })

  it('renders the correct labels in order', () => {
    renderPathway()

    const links = screen.getAllByRole('link')
    const labels = links.map((link) => link.textContent)

    expect(labels).toEqual(['Pause', 'Understand', 'Converse', 'Apply', 'Train'])
  })

  it('renders correct href for each step', () => {
    renderPathway()

    const links = screen.getAllByRole('link')

    PATHWAY_STEPS.forEach((step, index) => {
      expect(links[index]).toHaveAttribute('href', step.href)
    })
  })

  it('sets aria-current="page" on the active step (exact match)', () => {
    mockPathname = '/viyog'
    renderPathway()

    const pauseLink = screen.getByRole('link', { name: /pause/i })
    expect(pauseLink).toHaveAttribute('aria-current', 'page')

    // Other links should NOT have aria-current
    const otherLinks = screen
      .getAllByRole('link')
      .filter((link) => link !== pauseLink)
    otherLinks.forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current')
    })
  })

  it('sets aria-current="page" on the active step (prefix match)', () => {
    // /kiaan/chat should match the Converse step whose href is /kiaan/chat
    mockPathname = '/kiaan/chat'
    renderPathway()

    const converseLink = screen.getByRole('link', { name: /converse/i })
    expect(converseLink).toHaveAttribute('aria-current', 'page')
  })

  it('includes "You are here" in aria-label for the active step', () => {
    mockPathname = '/ardha'
    renderPathway()

    const understandLink = screen.getByRole('link', { name: /understand/i })
    expect(understandLink).toHaveAttribute(
      'aria-label',
      expect.stringContaining('You are here')
    )
  })

  it('does not include "You are here" for inactive steps', () => {
    mockPathname = '/ardha'
    renderPathway()

    const pauseLink = screen.getByRole('link', { name: /^pause$/i })
    expect(pauseLink.getAttribute('aria-label')).not.toContain('You are here')
  })

  it('wraps items in a nav landmark with an accessible name', () => {
    renderPathway()

    const nav = screen.getByRole('navigation', { name: /healing pathway/i })
    expect(nav).toBeInTheDocument()
  })

  it('uses an ordered list for semantic structure', () => {
    renderPathway()

    const nav = screen.getByRole('navigation', { name: /healing pathway/i })
    const list = within(nav).getByRole('list')
    expect(list).toBeInTheDocument()
    expect(list.tagName).toBe('OL')
  })

  it('renders arrow connectors between steps but not after last', () => {
    const { container } = renderPathway()

    // There are 4 connectors between 5 steps
    const connectors = container.querySelectorAll('[aria-hidden="true"]')
    expect(connectors).toHaveLength(4)
  })

  it('connectors have motion-safe:animate-pulse for reduced-motion respect', () => {
    const { container } = renderPathway()

    const connectors = container.querySelectorAll('[aria-hidden="true"]')
    connectors.forEach((connector) => {
      expect(connector.className).toContain('motion-safe:animate-pulse')
    })
  })

  it('no step has aria-current when pathname does not match any step', () => {
    mockPathname = '/profile'
    renderPathway()

    const links = screen.getAllByRole('link')
    links.forEach((link) => {
      expect(link).not.toHaveAttribute('aria-current')
    })
  })
})
