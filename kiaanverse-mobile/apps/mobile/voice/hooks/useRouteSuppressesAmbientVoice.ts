/**
 * useRouteSuppressesAmbientVoice — route-level kill switch for the
 * ambient wake-word + FAB.
 *
 * Sakha must be silent in places where:
 *
 *   /(auth)         — user isn't authenticated yet; we don't have a
 *                     userId to start a session, and showing voice UI
 *                     before login leaks "this is a voice product"
 *                     before the user has consented to anything.
 *
 *   /arrival        — first-launch ceremony. Voice activation here
 *                     would shatter the contemplative tone the
 *                     ceremony establishes.
 *
 *   /onboarding     — the user is in a tightly choreographed setup
 *                     flow; surprise voice activation breaks
 *                     completion rates.
 *
 *   /voice          — the legacy redirect screen. It immediately
 *                     forwards to /voice-companion, but during the
 *                     redirect frame the FAB would pop in for a
 *                     beat — looks like a flicker bug.
 *
 *   /voice-companion — the dedicated voice screen owns its own
 *                     session lifecycle (its own wake-word, its own
 *                     mic state machine). Mounting the ambient
 *                     wake-word on top would cause double-listening
 *                     and double-fire on the WAKE_WORD event.
 *
 * Implementation: just inspect the first segment from
 * `useSegments()`. We don't try to be clever about deep paths
 * because Expo Router's grouping syntax (`(auth)`, `(tabs)`) means
 * the first segment is enough to identify the route family.
 */

import { useSegments } from 'expo-router';
import { useMemo } from 'react';

const SUPPRESSED_TOP_SEGMENTS: ReadonlySet<string> = new Set([
  '(auth)',
  'arrival',
  'onboarding',
  'voice',
  'voice-companion',
]);

export function useRouteSuppressesAmbientVoice(): boolean {
  const segments = useSegments();
  return useMemo(() => {
    const top = segments[0];
    if (!top) return true; // Pre-mount frames before router lands.
    return SUPPRESSED_TOP_SEGMENTS.has(top);
  }, [segments]);
}

/** Exported for unit tests so we can assert the suppression list
 *  is exactly the set documented above without exporting the Set
 *  itself (mutability hazard). */
export function listSuppressedTopSegments(): readonly string[] {
  return Array.from(SUPPRESSED_TOP_SEGMENTS).sort();
}
