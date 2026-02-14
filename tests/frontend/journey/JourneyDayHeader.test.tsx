/**
 * Component tests for JourneyDayHeader.
 *
 * Verifies that the header renders:
 * - Day X / 14 counter
 * - Progress percentage label
 * - Progress bar with ARIA attributes
 * - Today's theme
 * - Focus (inner force)
 * - Special copy for day 14
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import { JourneyDayHeader } from '@/components/journey/JourneyDayHeader'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(function MockMotionDiv(
      props: React.HTMLAttributes<HTMLDivElement> & { initial?: unknown; animate?: unknown; transition?: unknown },
      ref: React.Ref<HTMLDivElement>
    ) {
      const { initial: _i, animate: _a, transition: _t, ...rest } = props
      return React.createElement('div', { ...rest, ref })
    }),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children),
}))

describe('JourneyDayHeader', () => {
  it('renders Day X / 14 correctly for day 1', () => {
    render(<JourneyDayHeader currentDay={1} completedDays={0} />)
    const counter = screen.getByTestId('day-counter')
    expect(counter).toHaveTextContent('Day 1')
    expect(counter).toHaveTextContent('/ 14')
  })

  it('renders Day 7 / 14 correctly', () => {
    render(<JourneyDayHeader currentDay={7} completedDays={6} />)
    const counter = screen.getByTestId('day-counter')
    expect(counter).toHaveTextContent('Day 7')
    expect(counter).toHaveTextContent('/ 14')
  })

  it('displays correct progress percentage', () => {
    render(<JourneyDayHeader currentDay={7} completedDays={7} />)
    const label = screen.getByTestId('progress-label')
    expect(label).toHaveTextContent('50%')
  })

  it('displays 0% when no days completed', () => {
    render(<JourneyDayHeader currentDay={1} completedDays={0} />)
    const label = screen.getByTestId('progress-label')
    expect(label).toHaveTextContent('0%')
  })

  it('displays 100% when all days completed', () => {
    render(<JourneyDayHeader currentDay={14} completedDays={14} />)
    const label = screen.getByTestId('progress-label')
    expect(label).toHaveTextContent('100%')
  })

  it('renders progress bar with correct ARIA attributes', () => {
    render(<JourneyDayHeader currentDay={5} completedDays={4} totalDays={14} />)
    const bar = screen.getByTestId('progress-bar')
    expect(bar).toHaveAttribute('role', 'progressbar')
    expect(bar).toHaveAttribute('aria-valuenow', '4')
    expect(bar).toHaveAttribute('aria-valuemin', '0')
    expect(bar).toHaveAttribute('aria-valuemax', '14')
  })

  it('renders today\'s theme for a regular day', () => {
    render(<JourneyDayHeader currentDay={1} completedDays={0} />)
    const theme = screen.getByTestId('day-theme')
    expect(theme).toHaveTextContent('Stillness within chaos')
  })

  it('renders the focus (inner force) for a regular day', () => {
    render(<JourneyDayHeader currentDay={1} completedDays={0} />)
    const focus = screen.getByTestId('day-focus')
    expect(focus).toHaveTextContent('Dhriti (Steadfastness)')
  })

  it('renders different theme and focus for day 5', () => {
    render(<JourneyDayHeader currentDay={5} completedDays={4} />)
    expect(screen.getByTestId('day-theme')).toHaveTextContent('Releasing what is held')
    expect(screen.getByTestId('day-focus')).toHaveTextContent('Vairagya (Non-attachment)')
  })

  it('renders "Practice continues" directly for day 14 (no "Today\'s theme:" prefix)', () => {
    render(<JourneyDayHeader currentDay={14} completedDays={13} />)
    const theme = screen.getByTestId('day-theme')
    expect(theme).toHaveTextContent('Practice continues')
    expect(theme.textContent).not.toContain('Today')
  })

  it('renders the focus for day 14', () => {
    render(<JourneyDayHeader currentDay={14} completedDays={13} />)
    expect(screen.getByTestId('day-focus')).toHaveTextContent('Abhyasa (Steady practice)')
  })

  it('supports custom totalDays', () => {
    render(<JourneyDayHeader currentDay={3} completedDays={2} totalDays={7} />)
    const counter = screen.getByTestId('day-counter')
    expect(counter).toHaveTextContent('Day 3')
    expect(counter).toHaveTextContent('/ 7')
    const label = screen.getByTestId('progress-label')
    expect(label).toHaveTextContent('29%')
  })

  it('has data-testid on the outer wrapper', () => {
    render(<JourneyDayHeader currentDay={1} completedDays={0} />)
    expect(screen.getByTestId('journey-day-header')).toBeInTheDocument()
  })
})
