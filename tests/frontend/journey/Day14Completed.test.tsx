/**
 * Component tests for Day14Completed.
 *
 * Verifies:
 * - Renders "Practice continues" title
 * - Renders grounded body text (no celebratory language)
 * - Renders "Handle today's trigger" link pointing to /tools/viyog
 * - Renders "Daily micro-practice" link pointing to /tools/ardha
 * - Does not contain celebratory words like "congratulations" or "overcame"
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Day14Completed } from '@/components/journey/Day14Completed'

// ---------------------------------------------------------------------------
// Mock next/link so it renders a plain <a> tag for href assertions
// ---------------------------------------------------------------------------
vi.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string
    children: React.ReactNode
    [key: string]: unknown
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Day14Completed', () => {
  it('renders the outer wrapper with data-testid', () => {
    render(<Day14Completed />)
    expect(screen.getByTestId('day14-completed')).toBeInTheDocument()
  })

  it('renders "Practice continues" as the title', () => {
    render(<Day14Completed />)
    expect(screen.getByTestId('day14-title')).toHaveTextContent(
      'Practice continues',
    )
  })

  it('renders grounded body text about continuing practice', () => {
    render(<Day14Completed />)
    const body = screen.getByTestId('day14-body')
    expect(body).toHaveTextContent(/14 days are a beginning/i)
    expect(body).toHaveTextContent(/work deepens from here/i)
  })

  it('does not contain celebratory or "overcame" language', () => {
    render(<Day14Completed />)
    const wrapper = screen.getByTestId('day14-completed')
    const text = wrapper.textContent?.toLowerCase() ?? ''
    expect(text).not.toContain('congratulations')
    expect(text).not.toContain('overcame')
    expect(text).not.toContain('well done')
    expect(text).not.toContain('amazing')
  })

  it('renders "Handle today\'s trigger" link to /tools/viyog', () => {
    render(<Day14Completed />)
    const link = screen.getByTestId('day14-link-trigger')
    expect(link).toHaveTextContent("Handle today's trigger")
    expect(link).toHaveAttribute('href', '/tools/viyog')
  })

  it('renders "Daily micro-practice" link to /tools/ardha', () => {
    render(<Day14Completed />)
    const link = screen.getByTestId('day14-link-practice')
    expect(link).toHaveTextContent('Daily micro-practice')
    expect(link).toHaveAttribute('href', '/tools/ardha')
  })

  it('renders both links inside the same container', () => {
    render(<Day14Completed />)
    const wrapper = screen.getByTestId('day14-completed')
    const triggerLink = screen.getByTestId('day14-link-trigger')
    const practiceLink = screen.getByTestId('day14-link-practice')
    expect(wrapper).toContainElement(triggerLink)
    expect(wrapper).toContainElement(practiceLink)
  })

  it('shows "Day 14" label', () => {
    render(<Day14Completed />)
    expect(screen.getByTestId('day14-completed')).toHaveTextContent('Day 14')
  })

  it('applies custom className', () => {
    render(<Day14Completed className="mt-8" />)
    const wrapper = screen.getByTestId('day14-completed')
    expect(wrapper.className).toContain('mt-8')
  })
})
