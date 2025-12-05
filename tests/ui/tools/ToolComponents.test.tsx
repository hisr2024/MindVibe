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
    render(<ToolHeader title="Test Tool" />)
    expect(screen.getByText('Test Tool')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<ToolHeader title="Test Tool" subtitle="Test Subtitle" />)
    expect(screen.getByText('Test Subtitle')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<ToolHeader title="Test Tool" description="Test description text" />)
    expect(screen.getByText('Test description text')).toBeInTheDocument()
  })

  it('renders badge when provided', () => {
    render(<ToolHeader title="Test Tool" badge="🎯 New feature" />)
    expect(screen.getByText('🎯 New feature')).toBeInTheDocument()
  })

  it('renders back link with correct href', () => {
    render(<ToolHeader title="Test Tool" backHref="/dashboard" backText="← Back to dashboard" />)
    const link = screen.getByText('← Back to dashboard')
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('href', '/dashboard')
  })

  it('has role="banner" for accessibility', () => {
    render(<ToolHeader title="Test Tool" />)
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })

  it('renders custom actions', () => {
    render(
      <ToolHeader
        title="Test Tool"
        actions={<button type="button">Custom Action</button>}
      />
    )
    expect(screen.getByText('Custom Action')).toBeInTheDocument()
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
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})

describe('KarmaPlant', () => {
  it('renders with strong_positive state', () => {
    render(<KarmaPlant state="strong_positive" />)
    const plant = screen.getByRole('img')
    expect(plant).toHaveAttribute('aria-label', 'Karma plant showing Flourishing state')
  })

  it('renders with mild_positive state', () => {
    render(<KarmaPlant state="mild_positive" />)
    const plant = screen.getByRole('img')
    expect(plant).toHaveAttribute('aria-label', 'Karma plant showing Growing state')
  })

  it('renders with neutral state', () => {
    render(<KarmaPlant state="neutral" />)
    const plant = screen.getByRole('img')
    expect(plant).toHaveAttribute('aria-label', 'Karma plant showing Steady state')
  })

  it('renders with mild_heavy state', () => {
    render(<KarmaPlant state="mild_heavy" />)
    const plant = screen.getByRole('img')
    expect(plant).toHaveAttribute('aria-label', 'Karma plant showing Wilting state')
  })

  it('renders with heavy state', () => {
    render(<KarmaPlant state="heavy" />)
    const plant = screen.getByRole('img')
    expect(plant).toHaveAttribute('aria-label', 'Karma plant showing Needs Care state')
  })

  it('applies custom size', () => {
    render(<KarmaPlant state="neutral" size="lg" />)
    // Size 'lg' corresponds to 180x220
    const plant = screen.getByRole('img')
    expect(plant).toBeInTheDocument()
  })

  it('displays the state label', () => {
    render(<KarmaPlant state="neutral" />)
    expect(screen.getByText('Steady')).toBeInTheDocument()
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
    expect(screen.getByText('Loading Karmic Tree...')).toBeInTheDocument()
  })

  it('renders with fallback data when API fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    render(<KarmicTreeClient />)
    
    await waitFor(() => {
      expect(screen.getByText('Live data unavailable. Showing demo progress.')).toBeInTheDocument()
    })
    
    // Check that fallback data is displayed
    expect(screen.getByText('Level 1')).toBeInTheDocument()
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
      expect(screen.getByText('Level 5')).toBeInTheDocument()
    })
    expect(screen.getByText('450 xp')).toBeInTheDocument()
  })

  it('renders progress bar with correct role', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    render(<KarmicTreeClient />)
    
    await waitFor(() => {
      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })
  })

  it('displays activity stats', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    render(<KarmicTreeClient />)
    
    await waitFor(() => {
      expect(screen.getByText('Journals')).toBeInTheDocument()
      expect(screen.getByText('Mood logs')).toBeInTheDocument()
      expect(screen.getByText('Chats')).toBeInTheDocument()
    })
  })
})

describe('ResetPlanCard', () => {
  const defaultPlan = {
    pauseAndBreathe: 'Take a deep breath',
    nameTheRipple: 'Identify the impact',
    repair: 'Make amends',
    moveWithIntention: 'Continue mindfully',
  }

  it('renders step titles correctly', () => {
    render(<ResetPlanCard plan={defaultPlan} animated={false} />)
    expect(screen.getByText('Pause & Breathe')).toBeInTheDocument()
    expect(screen.getByText('Name the Ripple')).toBeInTheDocument()
    expect(screen.getByText('Choose the Repair')).toBeInTheDocument()
    expect(screen.getByText('Move with Intention')).toBeInTheDocument()
  })

  it('renders step content correctly', () => {
    render(<ResetPlanCard plan={defaultPlan} animated={false} />)
    expect(screen.getByText('Take a deep breath')).toBeInTheDocument()
    expect(screen.getByText('Identify the impact')).toBeInTheDocument()
    expect(screen.getByText('Make amends')).toBeInTheDocument()
    expect(screen.getByText('Continue mindfully')).toBeInTheDocument()
  })

  it('renders step numbers correctly', () => {
    render(<ResetPlanCard plan={defaultPlan} animated={false} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
  })

  it('has role="region" for accessibility', () => {
    render(<ResetPlanCard plan={defaultPlan} animated={false} />)
    expect(screen.getByRole('region', { name: 'Reset Plan Steps' })).toBeInTheDocument()
  })

  it('renders all 4 steps', () => {
    render(<ResetPlanCard plan={defaultPlan} animated={false} />)
    const regions = screen.getAllByRole('region')
    // 1 for the outer container + 4 for each step
    expect(regions.length).toBe(5)
  })
})
