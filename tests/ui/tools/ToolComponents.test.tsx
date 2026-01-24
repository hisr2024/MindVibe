/**
 * Tests for Phase 3 Tool Components
 *
 * Tests for reusable components:
 * - ToolHeader
 * - ToolActionCard
 * - KarmaPlant
 * - KarmicTreeClient
 * - ResetPlanCard
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import React from 'react'

// Component imports
import { ToolHeader } from '@/components/tools/ToolHeader'
import { ToolActionCard } from '@/components/tools/ToolActionCard'
import { KarmaPlant } from '@/components/tools/KarmaPlant'
import { KarmicTreeClient } from '@/components/tools/KarmicTreeClient'
import { ResetPlanCard } from '@/components/tools/ResetPlanCard'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('ToolHeader', () => {
  it('renders title correctly', () => {
    render(<ToolHeader icon="📝" title="Test Tool" subtitle="Test subtitle" />)
    expect(screen.getByText('Test Tool')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<ToolHeader icon="📝" title="Test Tool" subtitle="Test Subtitle" />)
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<ToolHeader icon="🎯" title="Test Tool" subtitle="Subtitle" />)
    expect(screen.getByText('🎯')).toBeInTheDocument()
  })

  it('renders back link with correct href', () => {
    render(
      <ToolHeader
        icon="📝"
        title="Test Tool"
        subtitle="Subtitle"
        backLink={{ label: 'Back to dashboard', href: '/dashboard' }}
      />
    )
    const link = screen.getByText(/Back to dashboard/i)
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard')
  })

  it('has role="banner" for accessibility', () => {
    render(<ToolHeader icon="📝" title="Test Tool" subtitle="Subtitle" />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders CTA button when provided', () => {
    render(
      <ToolHeader
        icon="📝"
        title="Test Tool"
        subtitle="Subtitle"
        cta={{ label: 'Get Started', href: '/start' }}
      />
    )
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })
})

describe('ToolActionCard', () => {
  it('renders title correctly', () => {
    render(<ToolActionCard title="Card Title" />)
    expect(screen.getByText('Card Title')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<ToolActionCard title="Card Title" description="Card description" />)
    expect(screen.getByText('Card description')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(<ToolActionCard title="Card Title" icon="🎯" />)
    expect(screen.getByText('🎯')).toBeInTheDocument()
  })

  it('renders as link when href is provided', () => {
    render(<ToolActionCard title="Card Title" href="/test" />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/test')
  })

  it('renders children content', () => {
    render(
      <ToolActionCard title="Card Title">
        <p>Child content</p>
      </ToolActionCard>
    )
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('applies different variants correctly', () => {
    const { rerender } = render(<ToolActionCard title="Card" variant="orange" />)
    expect(screen.getByText('Card')).toBeInTheDocument()

    rerender(<ToolActionCard title="Card" variant="purple" />)
    expect(screen.getByText('Card')).toBeInTheDocument()

    rerender(<ToolActionCard title="Card" variant="green" />)
    expect(screen.getByText('Card')).toBeInTheDocument()

    rerender(<ToolActionCard title="Card" variant="blue" />)
    expect(screen.getByText('Card')).toBeInTheDocument()

    rerender(<ToolActionCard title="Card" variant="rose" />)
    expect(screen.getByText('Card')).toBeInTheDocument()
  })

  it('applies disabled state correctly', () => {
    render(<ToolActionCard title="Card Title" href="/test" disabled />)
    // When disabled, it should not be a link
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})

describe('KarmaPlant', () => {
  it('renders with strong_positive state', () => {
    render(<KarmaPlant state="strong_positive" />)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Karma plant showing Flourishing state')
  })

  it('renders with mild_positive state', () => {
    render(<KarmaPlant state="mild_positive" />)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Karma plant showing Growing state')
  })

  it('renders with neutral state', () => {
    render(<KarmaPlant state="neutral" />)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Karma plant showing Steady state')
  })

  it('renders with mild_heavy state', () => {
    render(<KarmaPlant state="mild_heavy" />)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Karma plant showing Wilting state')
  })

  it('renders with heavy state', () => {
    render(<KarmaPlant state="heavy" />)
    expect(screen.getByRole('img')).toHaveAttribute('aria-label', 'Karma plant showing Needs Care state')
  })

  it('applies different sizes', () => {
    const { rerender } = render(<KarmaPlant state="neutral" size="sm" />)
    expect(screen.getByRole('img')).toBeInTheDocument()

    rerender(<KarmaPlant state="neutral" size="md" />)
    expect(screen.getByRole('img')).toBeInTheDocument()

    rerender(<KarmaPlant state="neutral" size="lg" />)
    expect(screen.getByRole('img')).toBeInTheDocument()
  })

  it('displays state label', () => {
    render(<KarmaPlant state="strong_positive" />)
    expect(screen.getByText('Flourishing')).toBeInTheDocument()
  })
})

describe('KarmicTreeClient', () => {
  beforeEach(() => {
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('renders with loading state initially', () => {
    mockFetch.mockImplementation(() => new Promise(() => {})) // Never resolves
    render(<KarmicTreeClient />)
    expect(screen.getByText(/Karmic Tree/i)).toBeInTheDocument()
  })

  it('renders with fallback data when API fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    render(<KarmicTreeClient />)

    await waitFor(() => {
      // Check that component rendered something after API failure
      expect(screen.getByText(/Karmic Tree/i)).toBeInTheDocument()
    })
  })

  it('renders with API data when successful', async () => {
    const mockData = {
      level: 5,
      xp: 450,
      next_level_xp: 600,
      progress_percent: 75,
      tree_stage: 'branching',
      activity: { moods: 10, journals: 8, chats: 15, streak: 5 },
      achievements: [],
      unlockables: [],
      notifications: [],
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    render(<KarmicTreeClient />)

    await waitFor(() => {
      expect(screen.getByText(/Level 5/i)).toBeInTheDocument()
    })
  })

  it('renders progress display', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    render(<KarmicTreeClient />)

    await waitFor(() => {
      // Should show some progress-related content
      expect(screen.getByText(/Karmic Tree/i)).toBeInTheDocument()
    })
  })
})

describe('ResetPlanCard', () => {
  const defaultPlan = {
    pauseAndBreathe: 'Take a deep breath and center yourself.',
    nameTheRipple: 'Identify the emotional ripple effect.',
    repair: 'Choose one concrete repair action.',
    moveWithIntention: 'Move forward with clear intention.',
  }

  it('renders all four steps', () => {
    render(<ResetPlanCard plan={defaultPlan} animated={false} />)
    expect(screen.getByText('Pause & Breathe')).toBeInTheDocument()
    expect(screen.getByText('Name the Ripple')).toBeInTheDocument()
    expect(screen.getByText('Choose the Repair')).toBeInTheDocument()
    expect(screen.getByText('Move with Intention')).toBeInTheDocument()
  })

  it('renders step content correctly', () => {
    render(<ResetPlanCard plan={defaultPlan} animated={false} />)
    expect(screen.getByText('Take a deep breath and center yourself.')).toBeInTheDocument()
    expect(screen.getByText('Identify the emotional ripple effect.')).toBeInTheDocument()
    expect(screen.getByText('Choose one concrete repair action.')).toBeInTheDocument()
    expect(screen.getByText('Move forward with clear intention.')).toBeInTheDocument()
  })

  it('renders step numbers', () => {
    render(<ResetPlanCard plan={defaultPlan} animated={false} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('has role="region" for accessibility', () => {
    render(<ResetPlanCard plan={defaultPlan} animated={false} />)
    const regions = screen.getAllByRole('region')
    expect(regions.length).toBeGreaterThan(0)
  })

  it('applies animation when animated=true', async () => {
    render(<ResetPlanCard plan={defaultPlan} animated={true} />)
    // Initially some cards may be hidden
    await waitFor(() => {
      expect(screen.getByText('Pause & Breathe')).toBeInTheDocument()
    }, { timeout: 2000 })
  })
})
