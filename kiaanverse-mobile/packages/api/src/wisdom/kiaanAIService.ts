/**
 * kiaanAIService — compatibility shim for screens that import
 * `@kiaanverse/api/wisdom/kiaanAIService`.
 *
 * The original module was removed when Kiaanverse consolidated its chat
 * transport into the `api.chat` / tool-specific endpoints. The chat tab
 * and Emotional-Reset flow still import these two helpers, so this shim
 * preserves the call signatures while routing the traffic through the
 * maintained endpoints.
 *
 * Both helpers return a shape the screens already handle:
 *   { response, verse? } — `response` is the human-readable reply,
 *   `verse` is an optional Gita reference extracted from the response.
 */

import { api } from '../endpoints';
import type { GitaVerse } from '../types';

export interface KiaanAIResult {
  /** Assistant reply text (plain markdown or sentences). */
  response: string;
  /** Optional Gita verse citation surfaced by the backend. */
  verse?: GitaVerse;
}

export interface KiaanHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export type KiaanMode = 'chat' | 'tool' | 'wisdom';

/** Best-effort parser for the assistant message across response shapes. */
function pickResponse(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const obj = data as Record<string, unknown>;
  const candidates = [
    obj.response,
    obj.message,
    obj.content,
    obj.reply,
    obj.text,
    (obj.data as Record<string, unknown> | undefined)?.response,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim().length > 0) return c;
  }
  return '';
}

/** Pull the first verse citation, if any, out of the backend payload. */
function pickVerse(data: unknown): GitaVerse | undefined {
  if (!data || typeof data !== 'object') return undefined;
  const obj = data as Record<string, unknown>;
  const direct = obj.verse as GitaVerse | undefined;
  if (direct && typeof direct === 'object') return direct;
  const ctx = obj.gita_context as { sources?: GitaVerse[] } | undefined;
  const first = ctx?.sources?.[0];
  return first && typeof first === 'object' ? first : undefined;
}

/**
 * Primary chat entry point used by the Sakha tab. Wraps the maintained
 * `api.chat.send` endpoint. The `history` / `mode` parameters are kept
 * for backwards-compatibility — the modern endpoint threads the session
 * server-side, so they are recorded but not retransmitted.
 */
export async function callKiaanAI(
  message: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _history: KiaanHistoryMessage[] = [],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _mode: KiaanMode = 'chat',
  sessionId?: string,
): Promise<KiaanAIResult> {
  const { data } = await api.chat.send(message, sessionId);
  const response = pickResponse(data);
  const verse = pickVerse(data);
  const result: KiaanAIResult = { response };
  if (verse) result.verse = verse;
  return result;
}

/**
 * Tool-scoped helper used by Emotional Reset. Maps the known tool names
 * to their backend endpoints; unknown tools fall back to the Sakha chat.
 */
export async function callKiaanForTool(
  toolName: string,
  payload: Record<string, unknown>,
): Promise<KiaanAIResult> {
  const normalised = toolName.trim().toLowerCase();

  if (normalised === 'emotional reset' || normalised === 'emotional-reset') {
    const emotion = typeof payload.emotion === 'string' ? payload.emotion : '';
    const rawIntensity = payload.intensity;
    const intensity =
      typeof rawIntensity === 'number'
        ? rawIntensity
        : typeof rawIntensity === 'string'
          ? Number.parseInt(rawIntensity, 10) || 5
          : 5;
    const { data } = await api.emotionalReset.start(emotion, intensity);
    const response = pickResponse(data);
    const verse = pickVerse(data);
    const result: KiaanAIResult = { response };
    if (verse) result.verse = verse;
    return result;
  }

  if (normalised === 'ardha') {
    const situation =
      typeof payload.situation === 'string'
        ? payload.situation
        : typeof payload.thought === 'string'
          ? payload.thought
          : '';
    const { data } = await api.ardha.reframe(situation);
    const response = pickResponse(data);
    const verse = pickVerse(data);
    const result: KiaanAIResult = { response };
    if (verse) result.verse = verse;
    return result;
  }

  const message =
    typeof payload.message === 'string'
      ? payload.message
      : JSON.stringify(payload);
  return callKiaanAI(message, [], 'tool');
}
