/**
 * Tests for useMicroPause hook
 *
 * Verifies:
 * - Reduced-motion preference skips the pause entirely
 * - Feature flag controls whether pause fires
 * - Loading→done transition triggers the pause
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useMicroPause } from '@/hooks/useMicroPause'
import { useMicroPauseStore } from '@/lib/micro-pause/store'

// Mock matchMedia — default: reduced-motion OFF
let matchMediaMatches = false
beforeEach(() => {
  matchMediaMatches = false
  vi.mocked(window.matchMedia).mockImplementation((query) => ({
    matches: query === '(prefers-reduced-motion: reduce)' ? matchMediaMatches : false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
})

afterEach(() => {
  // Reset store to defaults between tests
  useMicroPauseStore.setState({
    microPauseEnabled: true,
    toolOverrides: { viyoga: true, ardha: true, journey: true, kiaan: true },
  })
})

describe('useMicroPause', () => {
  it('returns showPause=false initially', () => {
    const { result } = renderHook(() =>
      useMicroPause({ loading: false, hasResult: false, tool: 'viyoga' }),
    )
    expect(result.current.showPause).toBe(false)
  })

  it('activates pause when loading transitions to false with a result', () => {
    vi.useFakeTimers()

    const { result, rerender } = renderHook(
      ({ loading, hasResult }: { loading: boolean; hasResult: boolean }) =>
        useMicroPause({ loading, hasResult, tool: 'viyoga' }),
      { initialProps: { loading: true, hasResult: false } },
    )

    // Transition: loading=true → loading=false with result
    rerender({ loading: false, hasResult: true })

    expect(result.current.showPause).toBe(true)

    // After the pause duration, it should clear
    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.showPause).toBe(false)

    vi.useRealTimers()
  })

  it('skips pause entirely when prefers-reduced-motion is active', () => {
    matchMediaMatches = true

    const { result, rerender } = renderHook(
      ({ loading, hasResult }: { loading: boolean; hasResult: boolean }) =>
        useMicroPause({ loading, hasResult, tool: 'viyoga' }),
      { initialProps: { loading: true, hasResult: false } },
    )

    rerender({ loading: false, hasResult: true })

    // Pause should never activate
    expect(result.current.showPause).toBe(false)
  })

  it('skips pause when feature flag is disabled globally', () => {
    useMicroPauseStore.setState({ microPauseEnabled: false })

    const { result, rerender } = renderHook(
      ({ loading, hasResult }: { loading: boolean; hasResult: boolean }) =>
        useMicroPause({ loading, hasResult, tool: 'viyoga' }),
      { initialProps: { loading: true, hasResult: false } },
    )

    rerender({ loading: false, hasResult: true })

    expect(result.current.showPause).toBe(false)
  })

  it('skips pause when the specific tool is disabled', () => {
    useMicroPauseStore.setState({
      microPauseEnabled: true,
      toolOverrides: { viyoga: false, ardha: true, journey: true, kiaan: true },
    })

    const { result, rerender } = renderHook(
      ({ loading, hasResult }: { loading: boolean; hasResult: boolean }) =>
        useMicroPause({ loading, hasResult, tool: 'viyoga' }),
      { initialProps: { loading: true, hasResult: false } },
    )

    rerender({ loading: false, hasResult: true })

    expect(result.current.showPause).toBe(false)
  })

  it('does not activate if there is no result when loading ends', () => {
    const { result, rerender } = renderHook(
      ({ loading, hasResult }: { loading: boolean; hasResult: boolean }) =>
        useMicroPause({ loading, hasResult, tool: 'ardha' }),
      { initialProps: { loading: true, hasResult: false } },
    )

    // Loading ends but no result (e.g. error)
    rerender({ loading: false, hasResult: false })

    expect(result.current.showPause).toBe(false)
  })
})
