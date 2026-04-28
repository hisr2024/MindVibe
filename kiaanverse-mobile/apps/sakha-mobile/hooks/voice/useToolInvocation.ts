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
} from '../../stores/voiceStore';

const NAV_AT_FRACTION_OF_ACK = 0.6;
const NAV_DELAY_CAP_MS = 3500;
const NAV_DEFAULT_ACK_MS = 6000;
const CONFIDENCE_THRESHOLD_FOR_PREFILL = 0.75;

/** Map tool name → in-app route. Matches kiaan_unified_voice_engine.py
 *  TOOL_ROUTES. Centralized here so adding a tool only touches one
 *  table mobile-side. */
export const TOOL_ROUTES: Record<string, string> = {
  EMOTIONAL_RESET: '/tools/emotional-reset',
  KARMA_RESET: '/tools/karma-reset',
  KARMIC_TREE: '/tools/karmic-tree',
  ARDHA: '/tools/ardha',
  VIYOGA: '/tools/viyoga',
  SACRED_REFLECTIONS: '/tools/sacred-reflections',
  KIAAN_VIBE: '/tools/kiaan-vibe',
  WISDOM_ROOMS: '/tools/wisdom-rooms',
  SADHANA: '/tools/sadhana',
  GITA_LIBRARY: '/tools/gita-library',
  MOOD_INSIGHTS: '/tools/mood-insights',
  RELATIONSHIP_COMPASS: '/tools/relationship-compass',
  KARMA_FOOTPRINT: '/tools/karma-footprint',
  COMPANION: '/companion',
  KIAAN_CHAT: '/kiaan/chat',
};

export interface ToolInvocationNavParams {
  prefill: Record<string, unknown> | null;
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

    // Fail-closed KIAAN-scope guard. The backend's tool_invocation
    // frame is supposed to only ever name a tool from the 15-entry
    // tool_prefill_contracts.py registry, but the mobile client must
    // not trust that — a compromised model output or a future routing
    // bug must NOT navigate to an arbitrary in-app path.
    //
    // If the tool is not in our explicit allowlist, drop the
    // invocation and log a warning. The user stays where they are;
    // no spoofed deep-link, no half-prefilled tool surface.
    const route = TOOL_ROUTES[adjusted.tool];
    if (!route) {
      // eslint-disable-next-line no-console
      console.warn(
        `useToolInvocation: rejecting out-of-scope tool "${adjusted.tool}". ` +
        'Sakha may only navigate to the 15 KIAAN tool routes.',
      );
      return;
    }

    navigate(route, {
      prefill: adjusted.inputPayload,
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
