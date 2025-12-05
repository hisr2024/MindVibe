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
  it('renders with seed stage', () => {
    render(<KarmaPlant stage="seed" />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Karma plant at seed stage')
  })

  it('renders with seedling stage', () => {
    render(<KarmaPlant stage="seedling" />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Karma plant at seedling stage')
  })

  it('renders with sapling stage', () => {
    render(<KarmaPlant stage="sapling" />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Karma plant at sapling stage')
  })

  it('renders with branching stage', () => {
    render(<KarmaPlant stage="branching" />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Karma plant at branching stage')
  })

  it('renders with canopy stage', () => {
    render(<KarmaPlant stage="canopy" />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('aria-label', 'Karma plant at canopy stage')
  })

  it('applies custom size', () => {
    render(<KarmaPlant stage="seedling" size={200} />)
    const svg = screen.getByRole('img')
    expect(svg).toHaveAttribute('width', '200')
    expect(svg).toHaveAttribute('height', '200')
  })

  it('includes title element for accessibility', () => {
    render(<KarmaPlant stage="seedling" />)
    expect(screen.getByTitle('Karma Plant - seedling stage')).toBeInTheDocument()
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
    expect(screen.getByText('Your Karmic Tree')).toBeInTheDocument()
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
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockData),
    })

    render(<KarmicTreeClient />)

    await waitFor(() => {
      expect(screen.getByText('Level 5')).toBeInTheDocument()
    })
    expect(screen.getByText('450 XP')).toBeInTheDocument()
  })

  it('has role="region" for accessibility', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))
    render(<KarmicTreeClient />)
    expect(screen.getByRole('region', { name: 'Karmic Tree Progress' })).toBeInTheDocument()
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
      expect(screen.getByText('Moods')).toBeInTheDocument()
      expect(screen.getByText('Chats')).toBeInTheDocument()
    })
  })
})

describe('ResetPlanCard', () => {
  const defaultStep = {
    step: 1,
    title: 'Test Step',
    content: 'Test content',
  }

  it('renders step number correctly', () => {
    render(<ResetPlanCard step={defaultStep} />)
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  it('renders title correctly', () => {
    render(<ResetPlanCard step={defaultStep} />)
    expect(screen.getByText('Test Step')).toBeInTheDocument()
  })

  it('renders content correctly', () => {
    render(<ResetPlanCard step={defaultStep} />)
    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  it('applies revealed state correctly', () => {
    const { container, rerender } = render(<ResetPlanCard step={defaultStep} revealed={true} />)
    expect(container.firstChild).toHaveClass('opacity-100')

    rerender(<ResetPlanCard step={defaultStep} revealed={false} />)
    expect(container.firstChild).toHaveClass('opacity-0')
  })

  it('applies different variants', () => {
    const stepWithVariant = (variant: 'orange' | 'purple' | 'green' | 'blue') => ({
      ...defaultStep,
      variant,
    })

    const { rerender } = render(<ResetPlanCard step={stepWithVariant('orange')} />)
    expect(screen.getByText('Test Step')).toBeInTheDocument()

    rerender(<ResetPlanCard step={stepWithVariant('purple')} />)
    expect(screen.getByText('Test Step')).toBeInTheDocument()

    rerender(<ResetPlanCard step={stepWithVariant('green')} />)
    expect(screen.getByText('Test Step')).toBeInTheDocument()

    rerender(<ResetPlanCard step={stepWithVariant('blue')} />)
    expect(screen.getByText('Test Step')).toBeInTheDocument()
  })

  it('has role="region" for accessibility', () => {
    render(<ResetPlanCard step={defaultStep} />)
    expect(screen.getByRole('region', { name: 'Test Step' })).toBeInTheDocument()
  })
})
