/**
 * Tests for BreathingDot component
 *
 * Verifies:
 * - Renders when visible=true with accessible role
 * - Does not render when visible=false
 * - Screen-reader label is present
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { BreathingDot } from '@/components/animations/BreathingDot'

// Mock framer-motion so we can test rendering without animation runtime
vi.mock('framer-motion', () => {
  const React = require('react')

  function createMotionComponent(tag: string) {
    return React.forwardRef(function MotionComponent(props: Record<string, unknown>, ref: React.Ref<unknown>) {
      const {
        initial: _initial,
        animate: _animate,
        exit: _exit,
        transition: _transition,
        whileHover: _whileHover,
        whileTap: _whileTap,
        ...domProps
      } = props
      return React.createElement(tag, { ...domProps, ref })
    })
  }

  return {
    motion: {
      div: createMotionComponent('div'),
      span: createMotionComponent('span'),
    },
    AnimatePresence: function MockAnimatePresence({ children }: { children: React.ReactNode }) {
      return React.createElement(React.Fragment, null, children)
    },
  }
})

describe('BreathingDot', () => {
  it('renders with role="status" when visible', () => {
    render(<BreathingDot visible={true} />)

    const el = screen.getByRole('status')
    expect(el).toBeInTheDocument()
    expect(el).toHaveAttribute('aria-label', 'Preparing a thoughtful response...')
  })

  it('includes a screen-reader-only label', () => {
    render(<BreathingDot visible={true} label="Loading wisdom..." />)

    expect(screen.getByText('Loading wisdom...')).toBeInTheDocument()
  })

  it('does not render content when visible=false', () => {
    render(<BreathingDot visible={false} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('accepts a custom className', () => {
    render(<BreathingDot visible={true} className="my-custom-class" />)

    const el = screen.getByRole('status')
    expect(el.className).toContain('my-custom-class')
  })
})
