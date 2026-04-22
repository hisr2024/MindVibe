/**
 * Karma Reset Service — API client for the Android 6-phase Karma Reset
 * flow. Mirrors the web canonical service at
 * `app/(mobile)/m/karma-reset/services/karmaResetService.ts` and the
 * web Next.js routes at `app/api/karma-reset/{reflect,wisdom,complete}`.
 *
 * Reliability contract:
 *   - Every public function is total — it always resolves with a
 *     usable value. The ritual must not stall on a network blip.
 *   - We try the backend first (`/api/karma-reset/...`) via the shared
 *     Axios client (`@kiaanverse/api`) so auth, retry, offline handling
 *     and Sentry instrumentation are applied consistently.
 *   - On any backend failure (network down, 4xx, 5xx, timeout, CORS,
 *     malformed body) we fall through to the static fallbacks bundled
 *     with the app — the same content the web Next.js routes use when
 *     the backend is unavailable.
 *
 * Backend status (current): only `/api/karma-reset/generate` and
 * `/health` are implemented server-side; `/reflect`, `/wisdom`, and
 * `/complete` are not yet wired. The fallbacks ensure the Android
 * ritual works fully even before those endpoints land.
 */

import { apiClient } from '@kiaanverse/api';
import type {
  KarmaCompleteResponse,
  KarmaReflectionAnswer,
  KarmaReflectionQuestion,
  KarmaResetContext,
  KarmaWisdomResponse,
} from '../components/karma-reset/types';
import { getFallbackQuestion } from '../components/karma-reset/fallbackQuestions';
import {
  computeLocalXP,
  getFallbackWisdom,
} from '../components/karma-reset/fallbackWisdom';

/**
 * Conservative input scrubber. Strips C0/C1 control characters
 * (except whitespace tabs/newlines) and trims outer whitespace.
 * Matches the web client's `sanitizeInput` intent without pulling
 * the web lib into the mobile bundle.
 */
function sanitizeString(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
}

function sanitize<T>(value: T): T {
  if (typeof value === 'string') return sanitizeString(value) as unknown as T;
  if (Array.isArray(value)) return value.map(sanitize) as unknown as T;
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = sanitize(v);
    }
    return out as unknown as T;
  }
  return value;
}

/**
 * Loose runtime guard. We only confirm the field types the UI consumes
 * — anything beyond is allowed through as `unknown`-shaped extra data.
 * This keeps the mobile resilient to additive backend changes while
 * still rejecting malformed payloads (e.g. an HTML error page).
 */
function looksLikeQuestion(v: unknown): v is KarmaReflectionQuestion {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.question === 'string' &&
    typeof o.subtext === 'string' &&
    Array.isArray(o.options) &&
    o.options.every((x) => typeof x === 'string')
  );
}

function looksLikeWisdom(v: unknown): v is KarmaWisdomResponse {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.dharmicMirror === 'string' &&
    typeof o.dharmicCounsel === 'string' &&
    typeof o.karmicInsight === 'string' &&
    typeof o.affirmation === 'string' &&
    !!o.primaryShloka &&
    typeof (o.primaryShloka as Record<string, unknown>).sanskrit === 'string' &&
    Array.isArray(o.actionDharma)
  );
}

function looksLikeComplete(v: unknown): v is KarmaCompleteResponse {
  if (!v || typeof v !== 'object') return false;
  const o = v as Record<string, unknown>;
  return (
    typeof o.success === 'boolean' &&
    typeof o.xpAwarded === 'number' &&
    typeof o.streakCount === 'number' &&
    typeof o.message === 'string'
  );
}

export async function getReflectionQuestion(
  context: KarmaResetContext,
  questionIndex: 0 | 1 | 2,
): Promise<KarmaReflectionQuestion> {
  const body = sanitize({ context, questionIndex });
  try {
    const { data } = await apiClient.post<unknown>(
      '/api/karma-reset/reflect',
      body,
    );
    if (looksLikeQuestion(data)) return data;
  } catch {
    // fall through to fallback
  }
  return getFallbackQuestion(context.category, questionIndex);
}

export async function getWisdom(
  context: KarmaResetContext,
  reflections: KarmaReflectionAnswer[],
): Promise<KarmaWisdomResponse> {
  const body = sanitize({ context, reflections });
  try {
    const { data } = await apiClient.post<unknown>(
      '/api/karma-reset/wisdom',
      body,
    );
    if (looksLikeWisdom(data)) return data;
  } catch {
    // fall through to fallback
  }
  return getFallbackWisdom(context.category);
}

export async function completeSession(
  sessionId: string,
  sankalpaSigned: boolean,
  actionDharmaCommitted: string[],
): Promise<KarmaCompleteResponse> {
  const body = sanitize({
    sessionId,
    sankalpaSigned,
    actionDharmaCommitted,
  });
  try {
    const { data } = await apiClient.post<unknown>(
      '/api/karma-reset/complete',
      body,
    );
    if (looksLikeComplete(data)) return data;
  } catch {
    // fall through to local computation
  }
  return {
    success: true,
    xpAwarded: computeLocalXP(sankalpaSigned, actionDharmaCommitted),
    streakCount: 1,
    message: 'Your karma has been met with dharma.',
  };
}
