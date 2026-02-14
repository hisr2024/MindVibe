/**
 * Tests for the micro-pause feature flag Zustand store.
 *
 * Verifies:
 * - Default state: master toggle on, all tools enabled
 * - Global toggle disables all tools
 * - Per-tool override works independently
 * - isEnabledForTool respects both master + per-tool flags
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { useMicroPauseStore } from '@/lib/micro-pause/store'

beforeEach(() => {
  // Reset to defaults between tests
  useMicroPauseStore.setState({
    microPauseEnabled: true,
    toolOverrides: { viyoga: true, ardha: true, journey: true, kiaan: true },
  })
})

describe('useMicroPauseStore', () => {
  it('has micro-pause enabled by default', () => {
    const state = useMicroPauseStore.getState()
    expect(state.microPauseEnabled).toBe(true)
  })

  it('has all tools enabled by default', () => {
    const state = useMicroPauseStore.getState()
    expect(state.toolOverrides.viyoga).toBe(true)
    expect(state.toolOverrides.ardha).toBe(true)
    expect(state.toolOverrides.journey).toBe(true)
    expect(state.toolOverrides.kiaan).toBe(true)
  })

  it('isEnabledForTool returns true for default-enabled tools', () => {
    const { isEnabledForTool } = useMicroPauseStore.getState()
    expect(isEnabledForTool('viyoga')).toBe(true)
    expect(isEnabledForTool('ardha')).toBe(true)
    expect(isEnabledForTool('journey')).toBe(true)
    expect(isEnabledForTool('kiaan')).toBe(true)
  })

  it('global toggle disables all tools', () => {
    useMicroPauseStore.getState().setMicroPauseEnabled(false)

    const { isEnabledForTool } = useMicroPauseStore.getState()
    expect(isEnabledForTool('viyoga')).toBe(false)
    expect(isEnabledForTool('ardha')).toBe(false)
    expect(isEnabledForTool('kiaan')).toBe(false)
  })

  it('per-tool override disables only that tool', () => {
    useMicroPauseStore.getState().setToolOverride('ardha', false)

    const { isEnabledForTool } = useMicroPauseStore.getState()
    expect(isEnabledForTool('viyoga')).toBe(true)
    expect(isEnabledForTool('ardha')).toBe(false)
    expect(isEnabledForTool('kiaan')).toBe(true)
  })

  it('re-enabling global toggle restores per-tool state', () => {
    useMicroPauseStore.getState().setMicroPauseEnabled(false)
    useMicroPauseStore.getState().setMicroPauseEnabled(true)

    const { isEnabledForTool } = useMicroPauseStore.getState()
    expect(isEnabledForTool('viyoga')).toBe(true)
  })
})
