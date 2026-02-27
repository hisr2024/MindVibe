/**
 * Tests for Phase 3 Tool Pages
 *
 * Tests page rendering for:
 * - Karma Footprint page
 * - Tool page existence checks
 * - Tool page header rendering
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

// Test mocks for Next.js navigation
vi.mock('next/navigation', () => ({
  redirect: vi.fn(),
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/tools/test',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
  useSelectedLayoutSegment: () => null,
  useSelectedLayoutSegments: () => [],
  notFound: vi.fn(),
  ReadonlyURLSearchParams: URLSearchParams,
}))

// Mock useFeatureAccess so SubscriptionGate renders children instead of loading spinner
vi.mock('@/hooks/useFeatureAccess', () => ({
  useFeatureAccess: () => ({
    tier: 'premier',
    hasAccess: () => true,
    requiredTier: () => 'free',
    featureLabel: () => '',
    isPaid: true,
    isPremium: true,
    kiaanQuota: -1,
    isKiaanUnlimited: true,
    journeyLimit: -1,
    loading: false,
  }),
}))

// Mock fetch for pages that use it
global.fetch = vi.fn(() =>
  Promise.reject(new Error('Network error'))
)

describe('Karma Footprint Page', () => {
  it('renders the page title correctly', async () => {
    const { default: KarmaFootprintPage } = await import('@/app/tools/karma-footprint/page')
    render(<KarmaFootprintPage />)

    await waitFor(() => {
      const titles = screen.getAllByText(/Karma Footprint Analyzer/i)
      expect(titles.length).toBeGreaterThan(0)
    })
  })

  it('renders the subtitle correctly', async () => {
    const { default: KarmaFootprintPage } = await import('@/app/tools/karma-footprint/page')
    render(<KarmaFootprintPage />)

    await waitFor(() => {
      const subtitles = screen.getAllByText(/Reflect on your daily actions/i)
      expect(subtitles.length).toBeGreaterThan(0)
    })
  })

  it('renders the day input form', async () => {
    const { default: KarmaFootprintPage } = await import('@/app/tools/karma-footprint/page')
    render(<KarmaFootprintPage />)

    await waitFor(() => {
      expect(screen.getByLabelText(/how did your day go/i)).toBeInTheDocument()
    })
  })

  it('renders the analyze action card', async () => {
    const { default: KarmaFootprintPage } = await import('@/app/tools/karma-footprint/page')
    render(<KarmaFootprintPage />)

    await waitFor(() => {
      expect(screen.getByText('Analyze My Day')).toBeInTheDocument()
    })
  })

  it('renders the start analysis button', async () => {
    const { default: KarmaFootprintPage } = await import('@/app/tools/karma-footprint/page')
    render(<KarmaFootprintPage />)

    await waitFor(() => {
      expect(screen.getByText('Start Analysis')).toBeInTheDocument()
    })
  })

  it('renders Karmic Tree action card', async () => {
    const { default: KarmaFootprintPage } = await import('@/app/tools/karma-footprint/page')
    render(<KarmaFootprintPage />)

    await waitFor(() => {
      expect(screen.getByText(/View Karmic Tree/i)).toBeInTheDocument()
    })
  })

  it('renders related tools links via SpiritualToolsNav', async () => {
    const { default: KarmaFootprintPage } = await import('@/app/tools/karma-footprint/page')
    render(<KarmaFootprintPage />)

    await waitFor(() => {
      expect(screen.getByText(/Emotional Reset/i)).toBeInTheDocument()
    })
  })

  it('has accessible textarea element', async () => {
    const { default: KarmaFootprintPage } = await import('@/app/tools/karma-footprint/page')
    render(<KarmaFootprintPage />)

    await waitFor(() => {
      expect(screen.getByRole('textbox')).toBeInTheDocument()
    })
  })

  it('renders back navigation link', async () => {
    const { default: KarmaFootprintPage } = await import('@/app/tools/karma-footprint/page')
    render(<KarmaFootprintPage />)

    await waitFor(() => {
      expect(screen.getByText(/Back to home/i)).toBeInTheDocument()
    })
  })
})

describe('Tool Pages Exist', () => {
  it('viyog tool page exists', async () => {
    const pageModule = await import('@/app/tools/viyog/page')
    expect(pageModule.default).toBeDefined()
  })

  it('ardha tool page exists', async () => {
    const pageModule = await import('@/app/tools/ardha/page')
    expect(pageModule.default).toBeDefined()
  })

  it('relationship-compass tool page exists', async () => {
    const pageModule = await import('@/app/tools/relationship-compass/page')
    expect(pageModule.default).toBeDefined()
  })

  it('emotional-reset tool page exists', async () => {
    const pageModule = await import('@/app/tools/emotional-reset/page')
    expect(pageModule.default).toBeDefined()
  })

  it('karma-footprint tool page exists', async () => {
    const pageModule = await import('@/app/tools/karma-footprint/page')
    expect(pageModule.default).toBeDefined()
  })

  it('karmic-tree tool page exists', async () => {
    const pageModule = await import('@/app/tools/karmic-tree/page')
    expect(pageModule.default).toBeDefined()
  })
})

describe('Tool Pages Headers', () => {
  it('viyog page has correct heading', async () => {
    const { default: ViyogPage } = await import('@/app/tools/viyog/page')
    render(<ViyogPage />)

    await waitFor(() => {
      const headings = screen.getAllByText(/Viyoga/i)
      expect(headings.length).toBeGreaterThan(0)
    })
  })

  it('ardha page has correct heading', async () => {
    const { default: ArdhaPage } = await import('@/app/tools/ardha/page')
    render(<ArdhaPage />)

    await waitFor(() => {
      const headings = screen.getAllByText(/Ardha/i)
      expect(headings.length).toBeGreaterThan(0)
    })
  })

  it('relationship-compass page has correct heading', async () => {
    const { default: RelationshipCompassPage } = await import('@/app/tools/relationship-compass/page')
    render(<RelationshipCompassPage />)

    await waitFor(() => {
      expect(screen.getByText('Relationship Compass')).toBeInTheDocument()
    })
  })

  it('emotional-reset page has correct heading', async () => {
    const { default: EmotionalResetPage } = await import('@/app/tools/emotional-reset/page')
    render(<EmotionalResetPage />)

    await waitFor(() => {
      const headings = screen.getAllByText(/Emotional Reset/i)
      expect(headings.length).toBeGreaterThan(0)
    })
  })
})
