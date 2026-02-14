/**
 * Zustand store for the micro-pause feature flag.
 *
 * Controls whether a calming "breathing dot" animation is shown for a
 * brief pause before revealing AI response content. Configurable per tool.
 */

import { create } from 'zustand'

/** Tool identifiers that support micro-pause */
export type MicroPauseTool = 'viyoga' | 'ardha' | 'journey' | 'kiaan'

interface MicroPauseState {
  /** Master toggle: when false, micro-pause is skipped everywhere */
  microPauseEnabled: boolean
  setMicroPauseEnabled: (enabled: boolean) => void

  /** Per-tool overrides (true = enabled for that tool) */
  toolOverrides: Record<MicroPauseTool, boolean>
  setToolOverride: (tool: MicroPauseTool, enabled: boolean) => void

  /** Check whether micro-pause is active for a given tool */
  isEnabledForTool: (tool: MicroPauseTool) => boolean
}

/** Tools that have micro-pause enabled by default */
const DEFAULT_TOOL_OVERRIDES: Record<MicroPauseTool, boolean> = {
  viyoga: true,
  ardha: true,
  journey: true,
  kiaan: true,
}

export const useMicroPauseStore = create<MicroPauseState>((set, get) => ({
  microPauseEnabled: true,
  setMicroPauseEnabled: (enabled) => set({ microPauseEnabled: enabled }),

  toolOverrides: { ...DEFAULT_TOOL_OVERRIDES },
  setToolOverride: (tool, enabled) =>
    set((state) => ({
      toolOverrides: { ...state.toolOverrides, [tool]: enabled },
    })),

  isEnabledForTool: (tool) => {
    const state = get()
    if (!state.microPauseEnabled) return false
    return state.toolOverrides[tool] ?? false
  },
}))
