/**
 * Tests for AmbientSoundscapeControl — render-loop regression.
 *
 * Ensures no setState is called during render (which causes infinite loops).
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>, ref: React.Ref<HTMLDivElement>) =>
      React.createElement('div', { ...props, ref }, children)),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => React.createElement(React.Fragment, null, children),
}))

describe('AmbientSoundscapeControl', () => {
  it('renders without causing re-render loops', async () => {
    const { AmbientSoundscapeControl } = await import(
      '@/components/voice/enhancements/AmbientSoundscapeControl'
    )

    // If there's a render-time setState, this will throw or hang.
    // A successful render without errors = no render loop.
    const { container } = render(
      React.createElement(AmbientSoundscapeControl, { isActive: false })
    )

    expect(container).toBeTruthy()
  })

  it('renders with isActive=true without crashing', async () => {
    const { AmbientSoundscapeControl } = await import(
      '@/components/voice/enhancements/AmbientSoundscapeControl'
    )

    const { container } = render(
      React.createElement(AmbientSoundscapeControl, { isActive: true })
    )

    expect(container).toBeTruthy()
  })

  it('shows "Coming Soon" badge when feature is disabled', async () => {
    const { AmbientSoundscapeControl } = await import(
      '@/components/voice/enhancements/AmbientSoundscapeControl'
    )

    render(React.createElement(AmbientSoundscapeControl, {}))

    // The AMBIENT_SOUNDSCAPE_ENABLED flag is false, so "Coming Soon" should be visible
    expect(screen.getByText('Coming Soon')).toBeTruthy()
  })

  it('renders compact view without errors', async () => {
    const { AmbientSoundscapeControl } = await import(
      '@/components/voice/enhancements/AmbientSoundscapeControl'
    )

    const { container } = render(
      React.createElement(AmbientSoundscapeControl, { compact: true })
    )

    expect(container).toBeTruthy()
  })
})
