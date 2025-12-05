/**
 * Tests for Phase 3 Tool Components and Pages
 *
 * Tests for:
 * - ToolHeader
 * - ToolActionCard
 * - KarmaPlant
 * - ResetPlanCard
 * - Tool page rendering
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// Tool Components
import { ToolHeader } from '@/components/tools/ToolHeader'
import { ToolActionCard } from '@/components/tools/ToolActionCard'
import { KarmaPlant } from '@/components/tools/KarmaPlant'
import { ResetPlanCard } from '@/components/tools/ResetPlanCard'

describe('ToolHeader', () => {
  it('renders icon and title correctly', () => {
    render(
      <ToolHeader
        icon="🎯"
        title="Viyog - Detachment Coach"
        subtitle="Test subtitle"
      />
    )
    expect(screen.getByText('Viyog - Detachment Coach')).toBeInTheDocument()
    expect(screen.getByText('🎯')).toBeInTheDocument()
  })

  it('renders subtitle correctly', () => {
    render(
      <ToolHeader
        icon="🔄"
        title="Ardha - Reframing Assistant"
        subtitle="Transform negative thoughts into balanced perspectives"
      />
    )
    expect(screen.getByText('Transform negative thoughts into balanced perspectives')).toBeInTheDocument()
  })

  it('renders CTA link when provided', () => {
    render(
      <ToolHeader
        icon="💫"
        title="Emotional Reset"
        subtitle="7-step flow"
        cta={{ label: 'Start Now', href: '/start' }}
      />
    )
    const ctaLink = screen.getByText('Start Now')
    expect(ctaLink).toBeInTheDocument()
    expect(ctaLink.closest('a')).toHaveAttribute('href', '/start')
  })

  it('renders CTA button with onClick when provided', () => {
    const handleClick = vi.fn()
    render(
      <ToolHeader
        icon="🔧"
        title="Karma Reset"
        subtitle="4-part plan"
        cta={{ label: 'Begin', onClick: handleClick }}
      />
    )
    const ctaButton = screen.getByText('Begin')
    fireEvent.click(ctaButton)
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('renders back link when provided', () => {
    render(
      <ToolHeader
        icon="🧭"
        title="Relationship Compass"
        subtitle="Conflict guidance"
        backLink={{ label: 'Back to home', href: '/' }}
      />
    )
    const backLink = screen.getByText('← Back to home')
    expect(backLink).toBeInTheDocument()
    expect(backLink).toHaveAttribute('href', '/')
  })

  it('has proper accessibility attributes', () => {
    render(
      <ToolHeader
        icon="👣"
        title="Karma Footprint"
        subtitle="Analyzer"
      />
    )
    expect(screen.getByRole('banner')).toBeInTheDocument()
  })
})

describe('ToolActionCard', () => {
  it('renders icon, title, and description', () => {
    render(
      <ToolActionCard
        icon="⏱️"
        title="Launch 60s Clarity Pause"
        description="A quick reset when outcome anxiety feels overwhelming."
        ctaLabel="Start Pause"
      />
    )
    expect(screen.getByText('⏱️')).toBeInTheDocument()
    expect(screen.getByText('Launch 60s Clarity Pause')).toBeInTheDocument()
    expect(screen.getByText('A quick reset when outcome anxiety feels overwhelming.')).toBeInTheDocument()
    expect(screen.getByText('Start Pause')).toBeInTheDocument()
  })

  it('renders as link when href is provided', () => {
    render(
      <ToolActionCard
        icon="📝"
        title="Analyze My Day"
        description="Share what happened today."
        ctaLabel="Start Analysis"
        href="/tools/karma-footprint"
      />
    )
    expect(screen.getByRole('link')).toHaveAttribute('href', '/tools/karma-footprint')
  })

  it('renders as button when onClick is provided', () => {
    const handleClick = vi.fn()
    render(
      <ToolActionCard
        icon="🔄"
        title="Reframe a Thought"
        description="Transform negative thoughts."
        ctaLabel="Start Reframing"
        onClick={handleClick}
      />
    )
    fireEvent.click(screen.getByRole('button'))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})

describe('KarmaPlant', () => {
  it('renders correctly for strong_positive state', () => {
    render(<KarmaPlant state="strong_positive" />)
    expect(screen.getByText('Flourishing')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Karma plant showing Flourishing state/i })).toBeInTheDocument()
  })

  it('renders correctly for mild_positive state', () => {
    render(<KarmaPlant state="mild_positive" />)
    expect(screen.getByText('Growing')).toBeInTheDocument()
  })

  it('renders correctly for neutral state', () => {
    render(<KarmaPlant state="neutral" />)
    expect(screen.getByText('Steady')).toBeInTheDocument()
  })

  it('renders correctly for mild_heavy state', () => {
    render(<KarmaPlant state="mild_heavy" />)
    expect(screen.getByText('Wilting')).toBeInTheDocument()
  })

  it('renders correctly for heavy state', () => {
    render(<KarmaPlant state="heavy" />)
    expect(screen.getByText('Needs Care')).toBeInTheDocument()
  })

  it('renders in different sizes', () => {
    const { rerender } = render(<KarmaPlant state="neutral" size="sm" />)
    expect(screen.getByText('Steady')).toBeInTheDocument()

    rerender(<KarmaPlant state="neutral" size="md" />)
    expect(screen.getByText('Steady')).toBeInTheDocument()

    rerender(<KarmaPlant state="neutral" size="lg" />)
    expect(screen.getByText('Steady')).toBeInTheDocument()
  })
})

describe('ResetPlanCard', () => {
  const mockPlan = {
    pauseAndBreathe: 'Take a deep breath and center yourself.',
    nameTheRipple: 'Your words created discomfort for others.',
    repair: 'A sincere apology can begin healing.',
    moveWithIntention: 'Next time, pause before speaking.',
  }

  it('renders all four plan steps', () => {
    render(<ResetPlanCard plan={mockPlan} animated={false} />)
    expect(screen.getByText('Pause & Breathe')).toBeInTheDocument()
    expect(screen.getByText('Name the Ripple')).toBeInTheDocument()
    expect(screen.getByText('Choose the Repair')).toBeInTheDocument()
    expect(screen.getByText('Move with Intention')).toBeInTheDocument()
  })

  it('renders plan content correctly', () => {
    render(<ResetPlanCard plan={mockPlan} animated={false} />)
    expect(screen.getByText('Take a deep breath and center yourself.')).toBeInTheDocument()
    expect(screen.getByText('Your words created discomfort for others.')).toBeInTheDocument()
    expect(screen.getByText('A sincere apology can begin healing.')).toBeInTheDocument()
    expect(screen.getByText('Next time, pause before speaking.')).toBeInTheDocument()
  })

  it('has proper accessibility attributes', () => {
    render(<ResetPlanCard plan={mockPlan} animated={false} />)
    expect(screen.getByRole('region', { name: 'Reset Plan Steps' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Pause & Breathe' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Name the Ripple' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Choose the Repair' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Move with Intention' })).toBeInTheDocument()
  })
})
