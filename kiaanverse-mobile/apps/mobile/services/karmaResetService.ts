/**
 * Karma Reset Service — API client for the mobile 6-phase Karma Reset flow.
 *
 * Mirrors the web canonical service at
 * `app/(mobile)/m/karma-reset/services/karmaResetService.ts`.
 *
 * Uses the shared Axios client (`@kiaanverse/api`) so auth, retry, offline
 * handling and Sentry instrumentation are applied consistently.
 */

import { apiClient } from '@kiaanverse/api';
import type {
  KarmaResetContext,
  KarmaReflectionQuestion,
  KarmaReflectionAnswer,
  KarmaWisdomResponse,
  KarmaCompleteResponse,
} from '../components/karma-reset/types';

/**
 * Conservative input scrubber. Strips control chars and trims outer
 * whitespace. Matches the web client's intent (`sanitizeInput`) without
 * pulling the web lib into the mobile bundle.
 */
function sanitizeString(input: string): string {
  // Remove C0/C1 control chars except \t \n \r, then trim.
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

export async function getReflectionQuestion(
  context: KarmaResetContext,
  questionIndex: 0 | 1 | 2,
): Promise<KarmaReflectionQuestion> {
  const body = sanitize({ context, questionIndex });
  const { data } = await apiClient.post<KarmaReflectionQuestion>(
    '/api/karma-reset/reflect',
    body,
  );
  return data;
}

export async function getWisdom(
  context: KarmaResetContext,
  reflections: KarmaReflectionAnswer[],
): Promise<KarmaWisdomResponse> {
  const body = sanitize({ context, reflections });
  const { data } = await apiClient.post<KarmaWisdomResponse>(
    '/api/karma-reset/wisdom',
    body,
  );
  return data;
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
  const { data } = await apiClient.post<KarmaCompleteResponse>(
    '/api/karma-reset/complete',
    body,
  );
  return data;
}
