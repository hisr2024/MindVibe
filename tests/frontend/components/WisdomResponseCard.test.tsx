import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock VoiceResponseButton to avoid complex voice dependencies
vi.mock('@/components/voice', () => ({
  VoiceResponseButton: function MockVoiceResponseButton() {
    return <button data-testid="voice-btn">Voice</button>
  },
}))

import WisdomResponseCard from '@/components/tools/WisdomResponseCard'

// Mock clipboard API
const writeTextMock = vi.fn().mockResolvedValue(undefined)
Object.defineProperty(navigator, 'clipboard', {
  value: { writeText: writeTextMock },
  writable: true,
  configurable: true,
})

const baseSections = {
  sacred_recognition: 'First section content about sacred recognition.',
  anatomy_of_attachment: 'Second section content about anatomy of attachment.',
  gita_core_transmission: 'Third section content about gita core transmission.',
  sakshi_practice_60s: 'Fourth section content about sakshi practice.',
  karma_yoga_step_today: 'Fifth section content about karma yoga step today.',
}

const baseProps = {
  tool: 'viyoga' as const,
  sections: baseSections,
  fullResponse: 'Full response text',
  timestamp: '2026-02-14T12:00:00Z',
}

describe('WisdomResponseCard — Accordion behavior', () => {
  beforeEach(() => {
    writeTextMock.mockClear()
  })

  it('renders all section titles', async () => {
    render(<WisdomResponseCard {...baseProps} />)

    await waitFor(() => {
      expect(screen.getByText('Sacred Recognition')).toBeInTheDocument()
      expect(screen.getByText('Anatomy of Attachment')).toBeInTheDocument()
      expect(screen.getByText('Gita Core Transmission')).toBeInTheDocument()
      expect(screen.getByText('Sakshi Practice (60s)')).toBeInTheDocument()
      expect(screen.getByText('Karma Yoga Step (Today)')).toBeInTheDocument()
    })
  })

  it('default-expands first 2 sections when there are more than 3', async () => {
    render(<WisdomResponseCard {...baseProps} />)

    await waitFor(() => {
      // First 2 sections should have visible content
      expect(screen.getByText('First section content about sacred recognition.')).toBeInTheDocument()
      expect(screen.getByText('Second section content about anatomy of attachment.')).toBeInTheDocument()
    })
  })

  it('expands all sections when 3 or fewer', async () => {
    const fewSections = {
      sacred_recognition: 'Content A',
      anatomy_of_attachment: 'Content B',
      gita_core_transmission: 'Content C',
    }

    render(
      <WisdomResponseCard
        {...baseProps}
        sections={fewSections}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('Content A')).toBeInTheDocument()
      expect(screen.getByText('Content B')).toBeInTheDocument()
      expect(screen.getByText('Content C')).toBeInTheDocument()
    })
  })

  it('clicking a collapsed section expands it', async () => {
    const user = userEvent.setup()
    render(<WisdomResponseCard {...baseProps} />)

    // The third section trigger
    const trigger = await screen.findByText('Gita Core Transmission')
    await user.click(trigger)

    await waitFor(() => {
      expect(
        screen.getByText('Third section content about gita core transmission.')
      ).toBeInTheDocument()
    })
  })

  it('clicking an expanded section collapses it', async () => {
    const user = userEvent.setup()
    render(<WisdomResponseCard {...baseProps} />)

    // Wait for the initial useEffect expansion to settle
    await waitFor(() => {
      expect(screen.getByText('First section content about sacred recognition.')).toBeInTheDocument()
    })

    // First section is expanded by default — click its trigger to collapse
    const trigger = screen.getByText('Sacred Recognition')
    await user.click(trigger)

    // After collapse, the accordion item should have data-state="closed"
    await waitFor(() => {
      const triggerBtn = trigger.closest('button')
      expect(triggerBtn).toHaveAttribute('data-state', 'closed')
    })
  })

  it('"Expand All" button opens every section', async () => {
    const user = userEvent.setup()
    render(<WisdomResponseCard {...baseProps} />)

    // Wait for the initial useEffect expansion to settle
    await waitFor(() => {
      expect(screen.getByText('First section content about sacred recognition.')).toBeInTheDocument()
    })

    const expandAllBtn = screen.getByRole('button', { name: /expand all/i })
    await user.click(expandAllBtn)

    await waitFor(() => {
      // All 5 accordion item triggers should have data-state="open"
      const openTriggers = document.querySelectorAll(
        'button[data-state="open"][aria-expanded="true"]'
      )
      expect(openTriggers.length).toBe(5)
    })
  })

  it('"Collapse All" button closes every section', async () => {
    const user = userEvent.setup()
    render(<WisdomResponseCard {...baseProps} />)

    // First expand all, then collapse all
    const expandAllBtn = await screen.findByRole('button', { name: /expand all/i })
    await user.click(expandAllBtn)

    const collapseAllBtn = screen.getByRole('button', { name: /collapse all/i })
    await user.click(collapseAllBtn)

    await waitFor(() => {
      // All AccordionContent elements should be closed
      const contentEls = document.querySelectorAll('[data-state="open"]')
      // Only the Root element may have data-state; items should all be closed
      const openItems = document.querySelectorAll('[role="region"][data-state="open"]')
      expect(openItems.length).toBe(0)
    })
  })

  it('uses proper ARIA roles from Radix Accordion', async () => {
    render(<WisdomResponseCard {...baseProps} />)

    await waitFor(() => {
      // Radix Accordion renders triggers with role="button" inside headings
      const triggers = screen.getAllByRole('button')
      // Should have section triggers + control buttons (expand/collapse/copy/full text/voice)
      expect(triggers.length).toBeGreaterThanOrEqual(5)

      // Content regions should exist
      const regions = document.querySelectorAll('[role="region"]')
      expect(regions.length).toBeGreaterThan(0)
    })
  })

  it('shows full text view when "Full Text" button is clicked', async () => {
    const user = userEvent.setup()
    render(<WisdomResponseCard {...baseProps} />)

    const fullTextBtn = await screen.findByRole('button', { name: /full text/i })
    await user.click(fullTextBtn)

    await waitFor(() => {
      expect(screen.getByText('Full response text')).toBeInTheDocument()
    })
  })

  it('respects prefers-reduced-motion on chevron', () => {
    render(<WisdomResponseCard {...baseProps} />)

    // The chevron SVGs should have the motion-reduce:transition-none class
    const svgs = document.querySelectorAll('svg.motion-reduce\\:transition-none')
    expect(svgs.length).toBeGreaterThan(0)
  })
})
