/**
 * KIAAN Power Manager — Battery-Aware Engine Control
 *
 * Three power modes:
 * ULTRA-LOW (<20% battery): Friend Engine only, wake word duty-cycled
 * BALANCED  (20-80%):       All 3 engines, on-demand loading
 * PERFORMANCE (charging/desktop/80%+): All 3 warm, continuous listening
 *
 * Reads battery state from navigator.getBattery() and adjusts engine behavior.
 * Also handles page visibility (pause when backgrounded) and thermal throttling.
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type PowerMode = 'ultra-low' | 'balanced' | 'performance'

interface BatteryManager extends EventTarget {
  charging: boolean
  chargingTime: number
  dischargingTime: number
  level: number
  onchargingchange: ((this: BatteryManager, ev: Event) => void) | null
  onlevelchange: ((this: BatteryManager, ev: Event) => void) | null
}

type PowerModeCallback = (mode: PowerMode) => void

// ─── State ──────────────────────────────────────────────────────────────────

let currentMode: PowerMode = 'balanced'
let batteryLevel = 1.0
let isCharging = false
let isVisible = true
let battery: BatteryManager | null = null
const listeners = new Set<PowerModeCallback>()
let initialized = false

// ─── Public API ─────────────────────────────────────────────────────────────

/**
 * Get current power mode
 */
export function getPowerMode(): PowerMode {
  if (!initialized) initSync()
  return currentMode
}

/**
 * Subscribe to power mode changes. Returns unsubscribe function.
 */
export function onPowerModeChange(callback: PowerModeCallback): () => void {
  listeners.add(callback)
  return () => listeners.delete(callback)
}

/**
 * Get detailed power state
 */
export function getPowerState(): {
  mode: PowerMode
  batteryLevel: number
  isCharging: boolean
  isVisible: boolean
} {
  return { mode: currentMode, batteryLevel, isCharging, isVisible }
}

/**
 * Initialize power manager (call once at app startup)
 */
export async function initPowerManager(): Promise<void> {
  if (initialized) return
  initialized = true

  // Page visibility
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
    isVisible = document.visibilityState === 'visible'
  }

  // Battery API
  if (typeof navigator !== 'undefined' && 'getBattery' in navigator) {
    try {
      battery = await (navigator as unknown as { getBattery: () => Promise<BatteryManager> }).getBattery()
      batteryLevel = battery.level
      isCharging = battery.charging

      battery.onchargingchange = () => {
        if (battery) {
          isCharging = battery.charging
          recalculate()
        }
      }
      battery.onlevelchange = () => {
        if (battery) {
          batteryLevel = battery.level
          recalculate()
        }
      }
    } catch {
      // Battery API not available — stay in balanced mode
    }
  }

  // Desktop detection: no battery API or always charging → performance mode
  if (!battery) {
    // Assume desktop — performance mode
    currentMode = 'performance'
  }

  recalculate()
}

/**
 * Force a specific power mode (for testing or user override)
 */
export function forcePowerMode(mode: PowerMode): void {
  currentMode = mode
  notifyListeners()
}

/**
 * Cleanup power manager
 */
export function destroyPowerManager(): void {
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
  listeners.clear()
  battery = null
  initialized = false
}

// ─── Private ────────────────────────────────────────────────────────────────

function initSync(): void {
  // Synchronous initialization for first getPowerMode() call
  if (typeof document !== 'undefined') {
    isVisible = document.visibilityState === 'visible'
  }
  // Can't read battery synchronously, default to balanced
  initialized = true

  // Async init in background
  initPowerManager().catch(() => {})
}

function handleVisibilityChange(): void {
  isVisible = document.visibilityState === 'visible'
  recalculate()
}

function recalculate(): void {
  const previousMode = currentMode

  if (!isVisible) {
    // App backgrounded → ultra-low
    currentMode = 'ultra-low'
  } else if (batteryLevel < 0.2 && !isCharging) {
    // Low battery → ultra-low
    currentMode = 'ultra-low'
  } else if (isCharging || batteryLevel > 0.8) {
    // Charging or high battery → performance
    currentMode = 'performance'
  } else if (!battery) {
    // No battery (desktop) → performance
    currentMode = 'performance'
  } else {
    // Default → balanced
    currentMode = 'balanced'
  }

  if (currentMode !== previousMode) {
    notifyListeners()
  }
}

function notifyListeners(): void {
  for (const listener of listeners) {
    try {
      listener(currentMode)
    } catch {
      // Listener threw — ignore
    }
  }
}
