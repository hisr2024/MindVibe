/**
 * Unified KIAAN client — thin wrapper over the backend's
 * `/api/kiaan/*` surface.
 *
 *   POST /api/kiaan/chat                         → Sakha chat
 *   POST /api/kiaan/tools/emotional-reset        → Emotional Reset
 *   POST /api/kiaan/tools/ardha                  → Cognitive reframing
 *   POST /api/kiaan/tools/viyoga                 → Sacred detachment
 *   POST /api/kiaan/tools/karma-reset            → Karmic pattern reset
 *   POST /api/kiaan/tools/relationship-compass   → Relationship dharma
 *   POST /api/kiaan/tools/karmalytix             → Weekly Sacred Mirror
 *
 * All endpoints return the tight `ChatResponse` envelope the backend's
 * `routes/kiaan.py` defines: `{ response: string, conversation_id: string | null }`.
 * Per-tool fields (sections, analysis, verse) are NOT part of the wire
 * contract — the UI derives structure client-side from the single
 * `response` string.
 *
 * Auth, retries and 401-refresh are inherited from `apiClient` (client.ts)
 * so callers don't re-implement them.
 *
 * Privacy — KarmaLytix:
 *   The backend explicitly documents "journal content is encrypted and
 *   never shared". This client enforces that at the edge — passing
 *   `content`, `body`, `text`, `entry` or `journal_text` in the metadata
 *   map throws synchronously before any request is issued. That is a
 *   belt-and-braces check; the primary guarantee is that callers never
 *   include those fields in the first place.
 */

import { apiClient } from '../client';

// ── Types ─────────────────────────────────────────────────────────────────

export interface KiaanMessage {
  readonly role: 'user' | 'assistant';
  readonly content: string;
}

/**
 * Structural shape of a Gita verse the backend grounds its answer on.
 * Fields match `routes/kiaan.py`'s `gita_verse` pass-through (an
 * untyped dict), not a strict pydantic model — they are optional and the
 * backend echoes whatever shape the client sends. This mirror is the
 * shape kiaanverse.com ships from its WisdomCore feed.
 */
export interface KiaanGitaVerse {
  readonly chapter?: number;
  readonly verse?: number;
  readonly sanskrit?: string;
  readonly transliteration?: string;
  readonly translation?: string;
  // Allow upstream fields without widening to `any`.
  readonly [extra: string]: string | number | boolean | null | undefined;
}

export interface KiaanChatRequest {
  readonly message: string;
  readonly conversation_history?: readonly KiaanMessage[];
  readonly tool_name?: string;
  readonly gita_verse?: KiaanGitaVerse | null;
  /** Backend accepts "chat" | "tool" | arbitrary ≤64 chars. */
  readonly context?: string;
  /** Wisdom Room bridge — preserved on the wire as `context` so the
   *  system prompt can be tuned server-side. The backend only reads
   *  `context` / `system_context`; we coerce room_context into `context`
   *  for callers who use this alias. */
  readonly room_context?: string;
  /** Full replacement system prompt (max 4k chars on the backend). */
  readonly system_context?: string;
}

export interface KiaanChatResponse {
  readonly response: string;
  readonly conversation_id: string | null;
}

export interface KiaanToolRequest<I extends Record<string, string> = Record<string, string>> {
  readonly inputs: I;
  readonly gita_verse?: KiaanGitaVerse | null;
}

// ── Per-tool input shapes (matching backend keys exactly) ─────────────────
//
// Every field name below comes from `backend/routes/kiaan.py` — do not
// rename without updating the backend handler. Fields are free-form
// strings because the backend coerces everything via `_tool_input` and
// clamps to 1000 chars.

export interface EmotionalResetInputs {
  readonly emotion: string;     // "anger" | "fear" | "grief" | "anxiety" | "shame" | "overwhelm"
  readonly intensity: string;   // "1".."10"
  readonly situation: string;
}

export interface ArdhaInputs {
  readonly situation: string;
  readonly limiting_belief: string;
  readonly fear: string;
}

/**
 * Viyoga inputs — the backend reads `attachment`, `attachment_type` and
 * `freedom_vision` (see `backend/routes/kiaan.py:256-258`). Keep this
 * aligned with the Python handler; a mismatch silently becomes an empty
 * string on the server because `_tool_input` defaults gracefully.
 */
export interface ViyogaInputs {
  readonly attachment: string;
  readonly attachment_type: string;
  readonly freedom_vision: string;
}

export interface KarmaResetInputs {
  readonly pattern: string;
  readonly dimension: string;    // "speech" | "action" | "thought" | "relationship" | "work" | "body"
  readonly dharmic_action: string;
}

export interface RelationshipCompassInputs {
  readonly challenge: string;
  readonly relationship_type: string;  // "partner" | "parent" | "child" | "friend" | "colleague" | "self"
  readonly core_difficulty: string;
}

/**
 * KarmaLytix metadata — NEVER include raw journal text. The backend
 * prompt explicitly reminds itself of this boundary:
 *   "METADATA ONLY — journal content is encrypted and never shared."
 *
 * Every field is a string because `_tool_input` coerces to str. Numeric
 * summaries (days journaled, karma scores) must be stringified by the
 * caller — we surface that in the types below.
 */
export interface KarmaLytixMetadata {
  readonly mood_pattern?: string;
  readonly tags?: string;
  readonly journaling_days?: string;
  readonly dharmic_challenge?: string;
  readonly pattern_noticed?: string;
  readonly sankalpa?: string;
  /** JSON-stringified numeric scores keyed by dimension. */
  readonly karma_dimensions?: string;
}

/**
 * Fields that must never appear in a KarmaLytix request. Any caller that
 * includes one of these is attempting (almost always accidentally) to
 * upload raw journal text. Fail loudly.
 */
const KARMALYTIX_FORBIDDEN_KEYS: readonly string[] = [
  'content',
  'body',
  'text',
  'entry',
  'journal_text',
  'ciphertext',
  'plaintext',
];

/** Dev-time guard. Always runs — cost is negligible and the blast radius
 *  of a leak is severe (plaintext reflection content reaching the LLM). */
function assertKarmaLytixSafe(metadata: Readonly<Record<string, unknown>>): void {
  for (const key of KARMALYTIX_FORBIDDEN_KEYS) {
    if (key in metadata) {
      throw new Error(
        `[KarmaLytix] "${key}" must never leave the device. ` +
          'Only metadata is sent to the server.',
      );
    }
  }
}

// ── Request helpers ───────────────────────────────────────────────────────

function buildChatBody(request: KiaanChatRequest): Record<string, unknown> {
  const body: Record<string, unknown> = {
    message: request.message,
    conversation_history: request.conversation_history ?? [],
  };
  if (request.tool_name !== undefined) body.tool_name = request.tool_name;
  if (request.gita_verse) body.gita_verse = request.gita_verse;
  if (request.system_context !== undefined) body.system_context = request.system_context;
  // `room_context` is a friendlier alias the Wisdom Rooms UI uses — the
  // backend only reads `context`, so fold it in. Explicit `context` wins
  // if both are provided (caller knows best).
  const context = request.context ?? (request.room_context ? `room:${request.room_context}` : undefined);
  if (context !== undefined) body.context = context;
  return body;
}

// ── Public surface ────────────────────────────────────────────────────────

export const kiaan = {
  /** Sakha chat — non-streaming. For the streaming UX the chat tab uses
   *  `useSakhaStream` against `/api/chat/message/stream`; this endpoint
   *  is the right choice for tool-adjacent callers that need a single
   *  blocking response (e.g. Wisdom Rooms, voice companion). */
  async chat(request: KiaanChatRequest): Promise<KiaanChatResponse> {
    const { data } = await apiClient.post<KiaanChatResponse>(
      '/api/kiaan/chat',
      buildChatBody(request),
    );
    return data;
  },

  tools: {
    async emotionalReset(
      inputs: EmotionalResetInputs,
      gitaVerse?: KiaanGitaVerse | null,
    ): Promise<KiaanChatResponse> {
      const { data } = await apiClient.post<KiaanChatResponse>(
        '/api/kiaan/tools/emotional-reset',
        { inputs, gita_verse: gitaVerse ?? null },
      );
      return data;
    },

    async ardha(
      inputs: ArdhaInputs,
      gitaVerse?: KiaanGitaVerse | null,
    ): Promise<KiaanChatResponse> {
      const { data } = await apiClient.post<KiaanChatResponse>(
        '/api/kiaan/tools/ardha',
        { inputs, gita_verse: gitaVerse ?? null },
      );
      return data;
    },

    async viyoga(
      inputs: ViyogaInputs,
      gitaVerse?: KiaanGitaVerse | null,
    ): Promise<KiaanChatResponse> {
      const { data } = await apiClient.post<KiaanChatResponse>(
        '/api/kiaan/tools/viyoga',
        { inputs, gita_verse: gitaVerse ?? null },
      );
      return data;
    },

    async karmaReset(
      inputs: KarmaResetInputs,
      gitaVerse?: KiaanGitaVerse | null,
    ): Promise<KiaanChatResponse> {
      const { data } = await apiClient.post<KiaanChatResponse>(
        '/api/kiaan/tools/karma-reset',
        { inputs, gita_verse: gitaVerse ?? null },
      );
      return data;
    },

    async relationshipCompass(
      inputs: RelationshipCompassInputs,
      gitaVerse?: KiaanGitaVerse | null,
    ): Promise<KiaanChatResponse> {
      const { data } = await apiClient.post<KiaanChatResponse>(
        '/api/kiaan/tools/relationship-compass',
        { inputs, gita_verse: gitaVerse ?? null },
      );
      return data;
    },

    async karmalytix(
      metadata: KarmaLytixMetadata,
      gitaVerse?: KiaanGitaVerse | null,
    ): Promise<KiaanChatResponse> {
      assertKarmaLytixSafe(metadata as Record<string, unknown>);
      const { data } = await apiClient.post<KiaanChatResponse>(
        '/api/kiaan/tools/karmalytix',
        { inputs: metadata, gita_verse: gitaVerse ?? null },
      );
      return data;
    },
  },

  /** Voice transcription — the audio companion flow calls this, then
   *  feeds the transcript into `kiaan.chat`. Implementation delegates to
   *  the existing `/api/kiaan/transcribe` route exposed via
   *  `api.voice.transcribe`. Kept here so voice callers import one
   *  namespace. */
  async transcribeVoice(audio: FormData): Promise<{ transcript: string; confidence: number }> {
    const { data } = await apiClient.post<{
      text?: string;
      transcript?: string;
      confidence?: number;
    }>('/api/kiaan/transcribe', audio, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return {
      transcript: data.transcript ?? data.text ?? '',
      confidence: data.confidence ?? 0,
    };
  },
} as const;

export type KiaanClient = typeof kiaan;
