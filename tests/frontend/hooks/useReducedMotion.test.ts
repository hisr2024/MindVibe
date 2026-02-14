/**
 * Tests for useReducedMotion hook.
 *
 * Verifies:
 * - Returns false when prefers-reduced-motion is not set
 * - Returns true when prefers-reduced-motion: reduce is active
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { useReducedMotion } from '@/hooks/useReducedMotion'

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

describe('useReducedMotion', () => {
  it('returns false when reduced motion is not requested', () => {
    matchMediaMatches = false
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(false)
  })

  it('returns true when prefers-reduced-motion: reduce is active', () => {
    matchMediaMatches = true
    const { result } = renderHook(() => useReducedMotion())
    expect(result.current).toBe(true)
  })
})
