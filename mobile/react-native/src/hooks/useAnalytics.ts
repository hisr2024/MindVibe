/**
 * Analytics Hook
 *
 * Tracks user behavior for product improvement while respecting privacy.
 * Events are:
 * - Batched and sent periodically (not real-time)
 * - Filtered based on user privacy preferences
 * - Never include PII (no names, emails, or content)
 * - Sent to the backend analytics endpoint
 *
 * Usage:
 *   const { track } = useAnalytics();
 *   track('journey_started', { journey_id: '123', enemy: 'krodha' });
 */

import { useCallback, useRef, useEffect } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useUserPreferencesStore } from '@state/stores/userPreferencesStore';
import { apiClient } from '@services/apiClient';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AnalyticsEvent {
  name: string;
  properties: Record<string, string | number | boolean>;
  timestamp: string;
}

// ---------------------------------------------------------------------------
// Event Queue (module-level singleton)
// ---------------------------------------------------------------------------

let eventQueue: AnalyticsEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
const FLUSH_INTERVAL_MS = 30_000; // 30 seconds
const MAX_BATCH_SIZE = 50;

async function flushEvents(): Promise<void> {
  if (eventQueue.length === 0) return;

  const batch = eventQueue.splice(0, MAX_BATCH_SIZE);

  try {
    await apiClient.post('/analytics/events', { events: batch });
  } catch {
    // Re-queue failed events (at front) for next flush
    eventQueue.unshift(...batch);
    // Cap queue to prevent memory growth
    if (eventQueue.length > 500) {
      eventQueue = eventQueue.slice(-500);
    }
  }
}

function startFlushTimer(): void {
  if (flushTimer) return;
  flushTimer = setInterval(flushEvents, FLUSH_INTERVAL_MS);
}

function stopFlushTimer(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAnalytics() {
  const analyticsEnabled = useUserPreferencesStore((s) => s.privacy.analyticsEnabled);
  const appStateRef = useRef(AppState.currentState);

  // Start/stop flush timer based on app state
  useEffect(() => {
    startFlushTimer();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextState === 'active'
      ) {
        startFlushTimer();
      } else if (nextState.match(/inactive|background/)) {
        // Flush remaining events before backgrounding
        flushEvents();
        stopFlushTimer();
      }
      appStateRef.current = nextState;
    });

    return () => {
      subscription.remove();
      stopFlushTimer();
    };
  }, []);

  /**
   * Track an analytics event.
   * No-ops if analytics is disabled in user preferences.
   */
  const track = useCallback(
    (name: string, properties: Record<string, string | number | boolean> = {}) => {
      if (!analyticsEnabled) return;

      eventQueue.push({
        name,
        properties,
        timestamp: new Date().toISOString(),
      });

      // Auto-flush if queue is large
      if (eventQueue.length >= MAX_BATCH_SIZE) {
        flushEvents();
      }
    },
    [analyticsEnabled],
  );

  /**
   * Track screen view.
   */
  const trackScreen = useCallback(
    (screenName: string) => {
      track('screen_view', { screen: screenName });
    },
    [track],
  );

  return { track, trackScreen };
}
