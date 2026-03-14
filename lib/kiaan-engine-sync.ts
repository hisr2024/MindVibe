/**
 * KIAAN Engine Sync Bus — Cross-Engine Event Communication
 *
 * Enables all three engines (Guidance, Friend, Navigation) to share state:
 * - Friend detects mood → Guidance uses it for verse selection
 * - Guidance matches verse → Navigation knows spiritual context
 * - Navigation identifies intent → Friend adjusts tone
 *
 * Also enables cross-tool intelligence: mood from voice companion
 * can influence journal prompts, meditation suggestions, etc.
 *
 * Features:
 * - WeakRef subscribers (auto-cleanup on component unmount)
 * - BroadcastChannel for cross-tab sync
 * - Engine snapshot for instant state query
 * - Max 50 subscribers cap (prevents memory leaks)
 */

// ─── Types ──────────────────────────────────────────────────────────────────

export type EngineEvent =
  | 'mood-detected'
  | 'intent-classified'
  | 'verse-matched'
  | 'tool-suggested'
  | 'phase-changed'
  | 'context-updated'
  | 'power-mode-changed'

export interface EngineSnapshot {
  mood: string | null
  moodIntensity: number
  intent: string | null
  targetTool: string | null
  verseRef: string | null
  verseTheme: string | null
  suggestedTool: string | null
  phase: string | null
  powerMode: string | null
  lastUpdated: number
}

type EventCallback = (data: unknown) => void

// ─── Engine Sync Bus ────────────────────────────────────────────────────────

class EngineSyncBus {
  private subscribers = new Map<EngineEvent, Set<WeakRef<EventCallback>>>()
  private snapshot: EngineSnapshot = {
    mood: null,
    moodIntensity: 0,
    intent: null,
    targetTool: null,
    verseRef: null,
    verseTheme: null,
    suggestedTool: null,
    phase: null,
    powerMode: null,
    lastUpdated: 0,
  }
  private broadcastChannel: BroadcastChannel | null = null
  private callbackRefs = new Map<EventCallback, WeakRef<EventCallback>>()

  constructor() {
    // Cross-tab sync via BroadcastChannel
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.broadcastChannel = new BroadcastChannel('kiaan-engine-sync')
        this.broadcastChannel.onmessage = (event: MessageEvent) => {
          const { eventName, data } = event.data as { eventName: EngineEvent; data: unknown }
          this.updateSnapshot(eventName, data)
          this.notifySubscribers(eventName, data)
        }
      } catch {
        // BroadcastChannel not available
      }
    }
  }

  /**
   * Publish an engine event
   */
  publish(event: EngineEvent, data: unknown): void {
    this.updateSnapshot(event, data)
    this.notifySubscribers(event, data)

    // Broadcast to other tabs
    this.broadcastChannel?.postMessage({ eventName: event, data })
  }

  /**
   * Subscribe to an engine event. Returns unsubscribe function.
   */
  subscribe(event: EngineEvent, callback: EventCallback): () => void {
    if (!this.subscribers.has(event)) {
      this.subscribers.set(event, new Set())
    }

    const subs = this.subscribers.get(event)!

    // Enforce max 50 subscribers per event
    if (subs.size >= 50) {
      this.cleanupDead(event)
      if (subs.size >= 50) {
        console.warn(`[EngineSyncBus] Max 50 subscribers for '${event}', ignoring new subscription`)
        return () => {}
      }
    }

    const weakRef = new WeakRef(callback)
    subs.add(weakRef)
    this.callbackRefs.set(callback, weakRef)

    return () => {
      subs.delete(weakRef)
      this.callbackRefs.delete(callback)
    }
  }

  /**
   * Get current snapshot of all engine states
   */
  getSnapshot(): Readonly<EngineSnapshot> {
    return { ...this.snapshot }
  }

  /**
   * Destroy the bus and release resources
   */
  destroy(): void {
    this.subscribers.clear()
    this.callbackRefs.clear()
    this.broadcastChannel?.close()
    this.broadcastChannel = null
  }

  // ─── Private ─────────────────────────────────────────────────────

  private updateSnapshot(event: EngineEvent, data: unknown): void {
    const d = data as Record<string, unknown>
    this.snapshot.lastUpdated = Date.now()

    switch (event) {
      case 'mood-detected':
        this.snapshot.mood = d.mood as string
        this.snapshot.moodIntensity = d.intensity as number
        break
      case 'intent-classified':
        this.snapshot.intent = d.action as string
        this.snapshot.targetTool = (d.tool as string) || null
        break
      case 'verse-matched':
        this.snapshot.verseRef = d.ref as string
        this.snapshot.verseTheme = d.theme as string
        break
      case 'tool-suggested':
        this.snapshot.suggestedTool = d.tool as string
        break
      case 'phase-changed':
        this.snapshot.phase = d.phase as string
        break
      case 'power-mode-changed':
        this.snapshot.powerMode = d.mode as string
        break
    }
  }

  private notifySubscribers(event: EngineEvent, data: unknown): void {
    const subs = this.subscribers.get(event)
    if (!subs) return

    for (const weakRef of subs) {
      const callback = weakRef.deref()
      if (callback) {
        try {
          callback(data)
        } catch {
          // Subscriber threw — ignore to not break other subscribers
        }
      } else {
        subs.delete(weakRef)
      }
    }
  }

  private cleanupDead(event: EngineEvent): void {
    const subs = this.subscribers.get(event)
    if (!subs) return

    for (const weakRef of subs) {
      if (!weakRef.deref()) {
        subs.delete(weakRef)
      }
    }
  }
}

// Singleton instance
export const engineSyncBus = new EngineSyncBus()
