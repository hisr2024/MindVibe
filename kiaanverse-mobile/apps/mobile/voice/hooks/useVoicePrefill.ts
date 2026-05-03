/**
 * useVoicePrefill — destination-side helper for the INPUT_TO_TOOL contract.
 *
 * `useToolInvocation` (the source side) navigates with route params:
 *
 *   navigate('/tools/ardha', {
 *     prefill: '{"split_theme":"work vs family","mood_label":"anxious"}',
 *     source:  'voice_companion',
 *     carry_id: 'carry-abc123',
 *   })
 *
 * The destination screen calls `useVoicePrefill('ARDHA')` to:
 *   1. read those params via expo-router,
 *   2. JSON-parse the prefill payload,
 *   3. validate it against the per-tool ToolVoicePrefillContract
 *      (allowedFields whitelist — extra fields are dropped, not trusted),
 *   4. expose typed prefill + a one-shot `acknowledge()` so the
 *      VoicePrefillBanner can dismiss itself when the user proceeds.
 *
 * Why a hook (not a context):
 *   - prefill is screen-scoped, not app-scoped;
 *   - each destination decides which fields to surface in its UI;
 *   - the source/carry_id is navigation-local, not session-global.
 *
 * Confidence floor: voice_guide_min_confidence is enforced upstream in
 * `useToolInvocation.downgradeIfLowConfidence` (low confidence collapses
 * to NAVIGATE-only and we receive `prefill === null`). We don't re-check
 * here — the spec puts that gate at the source.
 */

import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  getContract,
  type ToolVoicePrefillContract,
} from '../lib/tool-prefill-contracts';

export interface VoicePrefillResult<T extends Record<string, unknown>> {
  /** The whitelisted prefill payload (allowedFields only), or null if
   *  the user opened this screen by tapping rather than via voice. */
  prefill: T | null;
  /** Carry-id correlating this navigation to the voice turn that
   *  spawned it (lets the screen post telemetry back if needed). */
  carryId: string | null;
  /** Always 'voice_companion' when prefill is non-null; null otherwise. */
  source: 'voice_companion' | null;
  /** True iff the banner is still showing (not yet acknowledged). */
  isVoicePrefilled: boolean;
  /** Dismiss the banner — call once the screen has applied the values. */
  acknowledge: () => void;
}

interface RawVoiceParams {
  prefill?: string | string[];
  source?: string | string[];
  carry_id?: string | string[];
}

function asScalar(v: string | string[] | undefined): string | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return typeof v === 'string' ? v : null;
}

/** Whitelist a parsed prefill object to the tool's allowedFields. */
function applyAllowedFields<T extends Record<string, unknown>>(
  raw: unknown,
  contract: ToolVoicePrefillContract,
): T | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const out: Record<string, unknown> = {};
  let kept = 0;
  for (const field of contract.allowedFields) {
    const value = (raw as Record<string, unknown>)[field];
    if (value !== undefined) {
      out[field] = value;
      kept++;
    }
  }
  return kept > 0 ? (out as T) : null;
}

/**
 * Read voice prefill params for the given tool name.
 *
 * @param toolName — must be a key of TOOL_PREFILL_CONTRACTS
 *   (e.g. 'ARDHA', 'EMOTIONAL_RESET').
 *
 * Example:
 *   const { prefill, isVoicePrefilled, acknowledge } =
 *     useVoicePrefill<{ split_theme?: string; mood_label?: string }>('ARDHA');
 *
 *   useEffect(() => {
 *     if (prefill?.split_theme) setThought(prefill.split_theme);
 *   }, [prefill?.split_theme]);
 *
 *   {isVoicePrefilled && (
 *     <VoicePrefillBanner label="From your conversation with Sakha"
 *                          onDismiss={acknowledge} />
 *   )}
 */
export function useVoicePrefill<T extends Record<string, unknown>>(
  toolName: string,
): VoicePrefillResult<T> {
  const params = useLocalSearchParams<RawVoiceParams>();
  const contract = getContract(toolName);

  // Banner dismissal state. Default to "showing" iff we got a payload
  // — and only flip once per mount (acknowledged ref guards against
  // expo-router re-firing the same params on focus events).
  const [acknowledged, setAcknowledged] = useState(false);
  const acknowledgedRef = useRef(false);

  const acknowledge = useCallback(() => {
    if (acknowledgedRef.current) return;
    acknowledgedRef.current = true;
    setAcknowledged(true);
  }, []);

  const result = useMemo<VoicePrefillResult<T>>(() => {
    if (!contract) {
      return {
        prefill: null,
        carryId: null,
        source: null,
        isVoicePrefilled: false,
        acknowledge,
      };
    }
    const sourceRaw = asScalar(params.source);
    if (sourceRaw !== 'voice_companion') {
      return {
        prefill: null,
        carryId: null,
        source: null,
        isVoicePrefilled: false,
        acknowledge,
      };
    }
    const prefillStr = asScalar(params.prefill);
    let prefill: T | null = null;
    if (prefillStr) {
      try {
        prefill = applyAllowedFields<T>(JSON.parse(prefillStr), contract);
      } catch {
        // Malformed JSON from a stale link — ignore, treat as
        // navigate-only. Don't throw: voice navigation should never
        // crash a tool screen.
        prefill = null;
      }
    }
    const carryId = asScalar(params.carry_id);
    return {
      prefill,
      carryId,
      source: 'voice_companion',
      isVoicePrefilled: prefill !== null && !acknowledged,
      acknowledge,
    };
  }, [
    contract,
    params.source,
    params.prefill,
    params.carry_id,
    acknowledged,
    acknowledge,
  ]);

  return result;
}
