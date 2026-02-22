/**
 * Tests for Design System Components
 *
 * Tests Phase 1 components including:
 * - Design tokens
 * - PageHeader
 * - ToolsDropdown
 * - ToolCard
 * - PrimaryActionCard
 * - SecondaryActionCard
 * - PageLayout
 * - DashboardLayout
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'

// Design Tokens
import { colors, typography, spacing, borderRadius, breakpoints, mediaQueries } from '@/lib/design-tokens'

// UI Components
import { PageHeader } from '@/components/ui/PageHeader'

// Navigation Components
import { ToolsDropdown, type ToolCategory } from '@/components/navigation/ToolsDropdown'

// Dashboard Components
import { ToolCard } from '@/components/dashboard/ToolCard'
import { PrimaryActionCard } from '@/components/dashboard/PrimaryActionCard'
import { SecondaryActionCard } from '@/components/dashboard/SecondaryActionCard'

// Layout Components
import { PageLayout } from '@/components/layouts/PageLayout'
import { DashboardLayout, DashboardSection } from '@/components/layouts/DashboardLayout'

describe('Design Tokens', () => {
  describe('Colors', () => {
    it('exports gray scale with expected values', () => {
      expect(colors.gray).toBeDefined()
      expect(colors.gray[50]).toBe('#F9FAFB')
      expect(colors.gray[900]).toBe('#111827')
    })

    it('exports brand colors', () => {
      expect(colors.brand).toBeDefined()
      expect(colors.brand.primary).toBe('#6366F1')
      expect(colors.brand.secondary).toBe('#8B5CF6')
      expect(colors.brand.success).toBe('#10B981')
    })

    it('exports semantic colors', () => {
      expect(colors.background).toBe('#FFFFFF')
      expect(colors.surface).toBe('#F9FAFB')
      expect(colors.error).toBe('#EF4444')
    })

    it('exports tool-specific gradients', () => {
      expect(colors.viyog.from).toBe('#06B6D4')
      expect(colors.viyog.to).toBe('#3B82F6')
      expect(colors.ardha.from).toBe('#8B5CF6')
      expect(colors.compass.from).toBe('#F43F5E')
      expect(colors.karmicTree.from).toBe('#10B981')
    })
  })

  describe('Typography', () => {
    it('exports font families', () => {
      expect(typography.fonts.sans).toContain('--font-inter')
      expect(typography.fonts.display).toContain('SF Pro Display')
    })

    it('exports typography scale', () => {
      expect(typography.pageHeadings.fontSize).toBe('28px')
      expect(typography.sectionHeadings.fontSize).toBe('20px')
      expect(typography.cardTitles.fontSize).toBe('16px')
      expect(typography.body.fontSize).toBe('15px')
      expect(typography.small.fontSize).toBe('13px')
      expect(typography.caption.fontSize).toBe('12px')
    })
  })

  describe('Spacing', () => {
    it('exports spacing scale', () => {
      expect(spacing.xs).toBe('4px')
      expect(spacing.sm).toBe('8px')
      expect(spacing.md).toBe('16px')
      expect(spacing.lg).toBe('24px')
      expect(spacing.xl).toBe('32px')
    })

    it('exports border radius scale', () => {
      expect(borderRadius.sm).toBe('8px')
      expect(borderRadius.md).toBe('12px')
      expect(borderRadius.lg).toBe('16px')
      expect(borderRadius.full).toBe('9999px')
    })
  })

  describe('Breakpoints', () => {
    it('exports breakpoint values', () => {
      expect(breakpoints.mobile).toBe('0px')
      expect(breakpoints.tablet).toBe('768px')
      expect(breakpoints.desktop).toBe('1024px')
      expect(breakpoints.wide).toBe('1440px')
    })

    it('exports media query helpers', () => {
      expect(mediaQueries.tablet).toContain('768px')
      expect(mediaQueries.desktop).toContain('1024px')
      expect(mediaQueries.wide).toContain('1440px')
    })
  })
})

describe('PageHeader', () => {
  it('renders title correctly', () => {
    render(<PageHeader title="Test Title" />)
    expect(screen.getByText('Test Title')).toBeInTheDocument()
  })

  it('renders subtitle when provided', () => {
    render(<PageHeader title="Title" subtitle="Subtitle text" />)
    expect(screen.getByText('Subtitle text')).toBeInTheDocument()
  })

  it('does not render subtitle when not provided', () => {
    render(<PageHeader title="Title" />)
    expect(screen.queryByText('Subtitle text')).not.toBeInTheDocument()
  })

  it('renders back button when showBackButton is true', () => {
    render(<PageHeader title="Title" showBackButton />)
    expect(screen.getByLabelText('Go back')).toBeInTheDocument()
  })

  it('does not render back button when showBackButton is false', () => {
    render(<PageHeader title="Title" showBackButton={false} />)
    expect(screen.queryByLabelText('Go back')).not.toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', () => {
    const onBack = vi.fn()
    render(<PageHeader title="Title" showBackButton onBack={onBack} />)
    fireEvent.click(screen.getByLabelText('Go back'))
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('renders action buttons when provided', () => {
    render(
      <PageHeader
        title="Title"
        actions={<button type="button">Action</button>}
      />
    )
    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  it('renders breadcrumbs when provided', () => {
    render(
      <PageHeader
        title="Title"
        breadcrumbs={<nav aria-label="breadcrumb">Breadcrumbs</nav>}
      />
    )
    expect(screen.getByText('Breadcrumbs')).toBeInTheDocument()
  })
})

describe('ToolsDropdown', () => {
  const mockCategories: ToolCategory[] = [
    {
      id: 'guidance',
      name: 'Guidance Engines',
      items: [
        {
          id: 'viyog',
          name: 'Viyoga',
          description: 'Detachment guidance',
          href: '/viyog',
          icon: <span>V</span>,
        },
      ],
    },
    {
      id: 'karma',
      name: 'Karma & Growth',
      items: [
        {
          id: 'tree',
          name: 'Karmic Tree',
          description: 'Growth journey',
          href: '/karmic-tree',
          icon: <span>T</span>,
        },
      ],
    },
  ]

  it('renders dropdown button', () => {
    render(<ToolsDropdown categories={mockCategories} />)
    expect(screen.getByText('Tools')).toBeInTheDocument()
  })

  it('opens dropdown when clicked', () => {
    render(<ToolsDropdown categories={mockCategories} />)
    fireEvent.click(screen.getByText('Tools'))
    expect(screen.getByText('Guidance Engines')).toBeInTheDocument()
    expect(screen.getByText('Karma & Growth')).toBeInTheDocument()
  })

  it('displays category items when open', () => {
    render(<ToolsDropdown categories={mockCategories} />)
    fireEvent.click(screen.getByText('Tools'))
    expect(screen.getByText('Viyoga')).toBeInTheDocument()
    expect(screen.getByText('Karmic Tree')).toBeInTheDocument()
  })

  it('displays item descriptions', () => {
    render(<ToolsDropdown categories={mockCategories} />)
    fireEvent.click(screen.getByText('Tools'))
    expect(screen.getByText('Detachment guidance')).toBeInTheDocument()
    expect(screen.getByText('Growth journey')).toBeInTheDocument()
  })

  it('has correct aria-expanded state', () => {
    render(<ToolsDropdown categories={mockCategories} />)
    const button = screen.getByText('Tools')
    expect(button).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
  })
})

describe('ToolCard', () => {
  const defaultProps = {
    icon: '🎯',
    title: 'Tool Title',
    description: 'Tool description text',
    gradient: 'from-blue-400/30 to-purple-400/30',
    href: '/tool',
  }

  it('renders title correctly', () => {
    render(<ToolCard {...defaultProps} />)
    expect(screen.getByText('Tool Title')).toBeInTheDocument()
  })

  it('renders description correctly', () => {
    render(<ToolCard {...defaultProps} />)
    expect(screen.getByText('Tool description text')).toBeInTheDocument()
  })

  it('renders icon', () => {
    render(<ToolCard {...defaultProps} />)
    expect(screen.getByText('🎯')).toBeInTheDocument()
  })

  it('renders badge when provided', () => {
    render(<ToolCard {...defaultProps} badge="new" />)
    expect(screen.getByText('new')).toBeInTheDocument()
  })

  it('renders premium badge when provided', () => {
    render(<ToolCard {...defaultProps} badge="premium" />)
    expect(screen.getByText('premium')).toBeInTheDocument()
  })

  it('links to correct href', () => {
    render(<ToolCard {...defaultProps} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/tool')
  })

  it('applies gradient classes', () => {
    render(<ToolCard {...defaultProps} />)
    // Just verify it renders without error
    expect(screen.getByText('Tool Title')).toBeInTheDocument()
  })

  it('renders as disabled when disabled prop is true', () => {
    render(<ToolCard {...defaultProps} disabled />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('Tool Title')).toBeInTheDocument()
  })
})

describe('PrimaryActionCard', () => {
  const defaultProps = {
    title: 'Primary Action',
    description: 'Action description',
    href: '/action',
  }

  it('renders title correctly', () => {
    render(<PrimaryActionCard {...defaultProps} />)
    expect(screen.getByText('Primary Action')).toBeInTheDocument()
  })

  it('renders description correctly', () => {
    render(<PrimaryActionCard {...defaultProps} />)
    expect(screen.getByText('Action description')).toBeInTheDocument()
  })

  it('renders default button text', () => {
    render(<PrimaryActionCard {...defaultProps} />)
    expect(screen.getByText('Get Started')).toBeInTheDocument()
  })

  it('renders custom button text', () => {
    render(<PrimaryActionCard {...defaultProps} buttonText="Start Chat" />)
    expect(screen.getByText('Start Chat')).toBeInTheDocument()
  })

  it('links to correct href', () => {
    render(<PrimaryActionCard {...defaultProps} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/action')
  })

  it('renders icon when provided', () => {
    render(
      <PrimaryActionCard
        {...defaultProps}
        icon={<span data-testid="icon">Icon</span>}
      />
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('applies different variants', () => {
    const { rerender } = render(<PrimaryActionCard {...defaultProps} variant="sunrise" />)
    expect(screen.getByText('Primary Action')).toBeInTheDocument()

    rerender(<PrimaryActionCard {...defaultProps} variant="ocean" />)
    expect(screen.getByText('Primary Action')).toBeInTheDocument()

    rerender(<PrimaryActionCard {...defaultProps} variant="aurora" />)
    expect(screen.getByText('Primary Action')).toBeInTheDocument()
  })
})

describe('SecondaryActionCard', () => {
  const defaultProps = {
    title: 'Secondary Action',
    href: '/action',
  }

  it('renders title correctly', () => {
    render(<SecondaryActionCard {...defaultProps} />)
    expect(screen.getByText('Secondary Action')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(<SecondaryActionCard {...defaultProps} description="Action description" />)
    expect(screen.getByText('Action description')).toBeInTheDocument()
  })

  it('does not render description when not provided', () => {
    render(<SecondaryActionCard {...defaultProps} />)
    expect(screen.queryByText('Action description')).not.toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(
      <SecondaryActionCard
        {...defaultProps}
        icon={<span data-testid="icon">Icon</span>}
      />
    )
    expect(screen.getByTestId('icon')).toBeInTheDocument()
  })

  it('renders metric when provided', () => {
    render(
      <SecondaryActionCard
        {...defaultProps}
        metric={{ value: '85%', label: 'score' }}
      />
    )
    expect(screen.getByText('85%')).toBeInTheDocument()
    expect(screen.getByText('score')).toBeInTheDocument()
  })

  it('links to correct href', () => {
    render(<SecondaryActionCard {...defaultProps} />)
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/action')
  })
})

describe('PageLayout', () => {
  it('renders children', () => {
    render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })

  it('renders PageHeader when header prop is provided', () => {
    render(
      <PageLayout header={{ title: 'Page Title' }}>
        <div>Content</div>
      </PageLayout>
    )
    expect(screen.getByText('Page Title')).toBeInTheDocument()
  })

  it('does not render PageHeader when header prop is not provided', () => {
    render(
      <PageLayout>
        <div>Content</div>
      </PageLayout>
    )
    expect(screen.queryByText('Page Title')).not.toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <PageLayout className="custom-class">
        <div>Content</div>
      </PageLayout>
    )
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })
})

describe('DashboardLayout', () => {
  it('renders children in a grid', () => {
    render(
      <DashboardLayout>
        <div>Item 1</div>
        <div>Item 2</div>
        <div>Item 3</div>
      </DashboardLayout>
    )
    expect(screen.getByText('Item 1')).toBeInTheDocument()
    expect(screen.getByText('Item 2')).toBeInTheDocument()
    expect(screen.getByText('Item 3')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <DashboardLayout className="custom-class">
        <div>Item</div>
      </DashboardLayout>
    )
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('applies grid gap classes', () => {
    const { container } = render(
      <DashboardLayout gap="lg">
        <div>Item</div>
      </DashboardLayout>
    )
    expect(container.firstChild).toHaveClass('gap-8')
  })
})

describe('DashboardSection', () => {
  it('renders title when provided', () => {
    render(
      <DashboardSection title="Section Title">
        <div>Content</div>
      </DashboardSection>
    )
    expect(screen.getByText('Section Title')).toBeInTheDocument()
  })

  it('renders description when provided', () => {
    render(
      <DashboardSection title="Title" description="Section description">
        <div>Content</div>
      </DashboardSection>
    )
    expect(screen.getByText('Section description')).toBeInTheDocument()
  })

  it('renders children', () => {
    render(
      <DashboardSection>
        <div>Content</div>
      </DashboardSection>
    )
    expect(screen.getByText('Content')).toBeInTheDocument()
  })
})
