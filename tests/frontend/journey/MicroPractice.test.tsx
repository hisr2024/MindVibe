/**
 * Component tests for MicroPractice.
 *
 * Verifies:
 * - Renders title, practice text, and toggle
 * - Toggling persists state via practiceState adapter
 * - Hydrates toggle from IDB on mount
 * - Returns null for invalid day
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { MicroPractice } from '@/components/journey/MicroPractice'

// ---------------------------------------------------------------------------
// Mock the persistence adapter
// ---------------------------------------------------------------------------
const mockGetPracticeState = vi.fn()
const mockSetPracticeState = vi.fn()

vi.mock('@/lib/journey/practiceState', () => ({
  getPracticeState: (...args: unknown[]) => mockGetPracticeState(...args),
  setPracticeState: (...args: unknown[]) => mockSetPracticeState(...args),
}))

// ---------------------------------------------------------------------------
// Mock framer-motion to avoid animation issues in jsdom
// ---------------------------------------------------------------------------
vi.mock('framer-motion', () => ({
  motion: {
    div: (props: React.HTMLAttributes<HTMLDivElement>) => {
      const { children, ...rest } = props
      return <div {...rest}>{children}</div>
    },
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('MicroPractice', () => {
  beforeEach(() => {
    mockGetPracticeState.mockReset()
    mockSetPracticeState.mockReset()
    mockGetPracticeState.mockResolvedValue(false)
    mockSetPracticeState.mockResolvedValue(undefined)
  })

  it('renders the section title', async () => {
    render(<MicroPractice journeyId="j1" day={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('micro-practice-title')).toHaveTextContent(
        /today.*micro-practice/i,
      )
    })
  })

  it('renders the micro-practice text for the given day', async () => {
    render(<MicroPractice journeyId="j1" day={1} />)

    await waitFor(() => {
      const text = screen.getByTestId('micro-practice-text')
      expect(text).toHaveTextContent('Pause for 60 seconds')
    })
  })

  it('renders the "Mark practiced" label', async () => {
    render(<MicroPractice journeyId="j1" day={7} />)

    await waitFor(() => {
      expect(screen.getByTestId('micro-practice-label')).toHaveTextContent(
        'Mark practiced',
      )
    })
  })

  it('renders a toggle switch', async () => {
    render(<MicroPractice journeyId="j1" day={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('micro-practice-toggle')).toBeInTheDocument()
    })
  })

  it('hydrates the toggle state from IDB on mount', async () => {
    mockGetPracticeState.mockResolvedValueOnce(true)

    render(<MicroPractice journeyId="j1" day={3} />)

    await waitFor(() => {
      const toggle = screen.getByTestId('micro-practice-toggle')
      expect(toggle).toHaveAttribute('data-state', 'checked')
    })

    expect(mockGetPracticeState).toHaveBeenCalledWith('j1', 3)
  })

  it('starts unchecked when IDB returns false', async () => {
    mockGetPracticeState.mockResolvedValueOnce(false)

    render(<MicroPractice journeyId="j1" day={2} />)

    await waitFor(() => {
      const toggle = screen.getByTestId('micro-practice-toggle')
      expect(toggle).toHaveAttribute('data-state', 'unchecked')
    })
  })

  it('persists state when toggled on', async () => {
    render(<MicroPractice journeyId="j1" day={5} />)

    await waitFor(() => {
      expect(screen.getByTestId('micro-practice-toggle')).toBeInTheDocument()
    })

    const toggle = screen.getByTestId('micro-practice-toggle')
    fireEvent.click(toggle)

    await waitFor(() => {
      expect(mockSetPracticeState).toHaveBeenCalledWith('j1', 5, true)
    })
  })

  it('persists state when toggled off', async () => {
    mockGetPracticeState.mockResolvedValueOnce(true)

    render(<MicroPractice journeyId="j1" day={5} />)

    await waitFor(() => {
      expect(screen.getByTestId('micro-practice-toggle')).toHaveAttribute(
        'data-state',
        'checked',
      )
    })

    const toggle = screen.getByTestId('micro-practice-toggle')
    fireEvent.click(toggle)

    await waitFor(() => {
      expect(mockSetPracticeState).toHaveBeenCalledWith('j1', 5, false)
    })
  })

  it('renders nothing for an out-of-range day', () => {
    const { container } = render(<MicroPractice journeyId="j1" day={99} />)
    expect(container.innerHTML).toBe('')
  })

  it('shows different practice text for day 14', async () => {
    render(<MicroPractice journeyId="j1" day={14} />)

    await waitFor(() => {
      expect(screen.getByTestId('micro-practice-text')).toHaveTextContent(
        'Choose any micro-practice from the past 13 days',
      )
    })
  })

  it('re-hydrates when the day prop changes', async () => {
    mockGetPracticeState.mockResolvedValueOnce(true) // day 1
    mockGetPracticeState.mockResolvedValueOnce(false) // day 2

    const { rerender } = render(<MicroPractice journeyId="j1" day={1} />)

    await waitFor(() => {
      expect(screen.getByTestId('micro-practice-toggle')).toHaveAttribute(
        'data-state',
        'checked',
      )
    })

    rerender(<MicroPractice journeyId="j1" day={2} />)

    await waitFor(() => {
      expect(screen.getByTestId('micro-practice-toggle')).toHaveAttribute(
        'data-state',
        'unchecked',
      )
    })

    expect(mockGetPracticeState).toHaveBeenCalledWith('j1', 1)
    expect(mockGetPracticeState).toHaveBeenCalledWith('j1', 2)
  })
})
