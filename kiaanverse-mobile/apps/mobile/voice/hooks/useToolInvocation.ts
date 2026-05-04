/**
 * useToolInvocation — handles VOICE_GUIDE → INPUT_TO_TOOL navigation
 * with the spec-mandated timing.
 *
 * Per spec section "VOICE_GUIDE INPUT_TO_TOOL CONTRACT":
 *
 *   1. The audible carry acknowledgment streams via TTS first
 *      ("मैं तुम्हें Emotional Reset पर ले जा रहा हूँ — और अभी हमने
 *      जो साझा किया, work पर anxiety — मैंने उसे साथ ले लिया है।").
 *
 *   2. Begin screen transition at 60% of acknowledgment audio
 *      (cap 3.5s):
 *
 *        const ackDuration = audioMetadata.duration_ms ?? 6000;
 *        setTimeout(() => {
 *          navigation.navigate(toolRoute(tool), {
 *            prefill: input_payload,
 *            source: 'voice_companion',
 *            carry_id,
 *          });
 *        }, Math.min(ackDuration * 0.6, 3500));
 *
 *   3. Confidence threshold: if voice_guide_result.confidence < 0.75,
 *      downgrade to NAVIGATE only (no prefill). Wrong prefill is worse
 *      than no prefill.
 *
 * The hook subscribes to the store's `pendingToolInvocation` and
 * fires the navigation once. The screen passes its router via the
 * `navigate` callback so this hook stays router-agnostic (Expo Router
 * vs. react-navigation tests both work).
 */

import { useCallback, useEffect, useRef } from 'react';
import {
  useVoiceStore,
  type ToolInvocationView,
} from '../stores/voiceStore';

const NAV_AT_FRACTION_OF_ACK = 0.6;
const NAV_DELAY_CAP_MS = 3500;
const NAV_DEFAULT_ACK_MS = 6000;
const CONFIDENCE_THRESHOLD_FOR_PREFILL = 0.75;

/** Map tool name → in-app route. Authoritative client-side mirror of the
 *  Python TOOL_ROUTES (the backend just emits the tool name + payload —
 *  the client owns where each tool actually lives in the app shell).
 *
 *  Centralized here so adding a tool only touches one table mobile-side.
 *  Keep these in sync with the real Expo Router paths under app/. The
 *  PR-G audit uncovered nine 404s where TOOL_ROUTES claimed `/tools/*`
 *  paths that never shipped — fixed below by pointing at the actual
 *  destinations. */
export const TOOL_ROUTES: Record<string, string> = {
  // The five canonical /tools/<name> routes that exist on disk.
  EMOTIONAL_RESET: '/tools/emotional-reset',
  KARMA_RESET: '/tools/karma-reset',
  ARDHA: '/tools/ardha',
  VIYOGA: '/tools/viyoga',
  RELATIONSHIP_COMPASS: '/tools/relationship-compass',

  // Top-level routes (the screens predate the /tools/ namespace).
  SACRED_REFLECTIONS: '/sacred-reflections',
  WISDOM_ROOMS: '/wisdom-rooms',
  SADHANA: '/sadhana',
  KARMA_FOOTPRINT: '/karma-footprint',

  // Tab-group routes — Expo Router strips the (tabs) segment, so the
  // public URL is just `/chat`, `/shlokas`, `/`.
  KIAAN_CHAT: '/chat',
  GITA_LIBRARY: '/shlokas',
  KIAAN_VIBE: '/', // embedded in the home tab

  // /wellness/mood is the canonical mood-insights surface.
  MOOD_INSIGHTS: '/wellness/mood',

  // Voice companion is the home for COMPANION tool intent.
  COMPANION: '/voice-companion',

  // KARMIC_TREE has no production screen yet — stub at /tools/karmic-tree
  // (added in this PR) tells the user it's coming, so voice nav never
  // 404s. Replace with the real route once the tree screen ships.
  KARMIC_TREE: '/tools/karmic-tree',
};

export interface ToolInvocationNavParams {
  /** JSON-stringified prefill payload, or null. Must be a string at this
   *  boundary because expo-router serialises params via String(value)
   *  when constructing the URL — passing an object yields the literal
   *  "[object Object]" on the destination, where useVoicePrefill's
   *  JSON.parse silently throws and prefill becomes null. The
   *  destination calls JSON.parse to rehydrate. */
  prefill: string | null;
  source: 'voice_companion';
  carry_id: string | null;
}

interface UseToolInvocationOptions {
  /** Router-agnostic navigate fn the screen supplies. Most callers will
   *  pass `(href, params) => router.push({ pathname: href, params })`. */
  navigate: (href: string, params: ToolInvocationNavParams) => void;
  /** Optional duration of the carry-acknowledgment audio. The screen
   *  knows this from the ServerDoneFrame.first_audio_byte_ms +
   *  audio.chunk events. Defaults to 6s if unknown. */
  ackDurationMs?: number;
}

export interface ToolInvocationAPI {
  /** Programmatically trigger a pending invocation now (skips the timer). */
  fireNow: () => void;
}

/** Pure helper exported for unit tests — returns the navigation
 *  delay in ms given an ack duration. */
export function computeNavDelay(ackDurationMs: number = NAV_DEFAULT_ACK_MS): number {
  return Math.min(ackDurationMs * NAV_AT_FRACTION_OF_ACK, NAV_DELAY_CAP_MS);
}

/** Pure helper — strips a prefill payload to NAVIGATE-only behavior
 *  when confidence is below threshold. Exported for unit tests. */
export function downgradeIfLowConfidence(
  invocation: ToolInvocationView,
): ToolInvocationView {
  if (invocation.confidence >= CONFIDENCE_THRESHOLD_FOR_PREFILL) return invocation;
  return {
    ...invocation,
    action: 'NAVIGATE',
    inputPayload: null,
    carryId: null,
  };
}

export function useToolInvocation({
  navigate,
  ackDurationMs,
}: UseToolInvocationOptions): ToolInvocationAPI {
  const consumeToolInvocation = useVoiceStore((s) => s.consumeToolInvocation);
  const pending = useVoiceStore((s) => s.pendingToolInvocation);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fireNow = useCallback(() => {
    const t = consumeToolInvocation();
    if (!t) return;
    const adjusted = downgradeIfLowConfidence(t);
    const route = TOOL_ROUTES[adjusted.tool] ?? `/tools/${adjusted.tool.toLowerCase()}`;
    // Serialise prefill HERE, not at the receiver. expo-router stringifies
    // every param value via String() when building the URL, so passing
    // adjusted.inputPayload as an object would arrive at useVoicePrefill
    // as the literal "[object Object]" — JSON.parse throws, the catch
    // silently nulls prefill, and the destination shows no banner / no
    // seeded fields. Stringifying here keeps the wire format opaque to
    // the caller and the receive-side JSON.parse round-trips cleanly.
    const prefillJson =
      adjusted.inputPayload != null ? JSON.stringify(adjusted.inputPayload) : null;
    navigate(route, {
      prefill: prefillJson,
      source: 'voice_companion',
      carry_id: adjusted.carryId,
    });
  }, [consumeToolInvocation, navigate]);

  useEffect(() => {
    if (!pending) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    const delay = computeNavDelay(ackDurationMs);
    timerRef.current = setTimeout(fireNow, delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
    };
  }, [pending, ackDurationMs, fireNow]);

  return { fireNow };
}
