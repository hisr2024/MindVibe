/**
 * Typed API Endpoints for Kiaanverse
 *
 * Mirrors the endpoint structure from MindVibe's apiClient.ts.
 * All endpoints are consumed via the shared axios client instance.
 */

import { apiClient } from './client';

// ---------------------------------------------------------------------------
// Journal schema adapters
//
// The backend expects an EncryptedPayload object (ciphertext + iv + salt +
// algorithm), but the mobile side produces a single base64 string with the
// IV prepended (encryptContent in apps/mobile/app/journal/new.tsx). These
// helpers pack/unpack between the two shapes so the on-the-wire payload
// satisfies the Pydantic validator without leaking any plaintext.
//
// Our convention — `algorithm: 'AES-GCM-v1-iv-prefixed'` — signals to
// future readers that the `ciphertext` field carries `iv || ciphertext`
// concatenated and the standalone `iv` field is intentionally empty.
// ---------------------------------------------------------------------------

interface _EncryptedPayloadShape {
  ciphertext: string;
  iv: string;
  salt: string;
  auth_tag?: string | null;
  algorithm: string;
  key_version?: string | null;
}

function _packJournalEntry(entry: {
  content_encrypted: string;
  moods?: string[];
  tags?: string[];
}): Record<string, unknown> {
  const encryptedContent: _EncryptedPayloadShape = {
    ciphertext: entry.content_encrypted,
    iv: '',
    salt: '',
    algorithm: 'AES-GCM-v1-iv-prefixed',
  };
  return {
    content: encryptedContent,
    // Backend's KarmaLytix pipeline (services/karmalytix_service.py) scans
    // JournalEntry.mood_labels *only* for dominant-mood inference. Passing
    // moods through the same `tags` bucket the Editor used to produce
    // silently nulled out mood_labels and degraded the Sacred Mirror to an
    // empty-state output. Splitting here is the minimal fix that keeps the
    // existing Editor call sites working while restoring the contract.
    moods: entry.moods ?? [],
    tags: entry.tags ?? [],
    client_updated_at: new Date().toISOString(),
  };
}

function _unpackJournalEntry(raw: unknown): {
  id: string;
  content_encrypted: string;
  moods: string[];
  tags: string[];
  mood_tag?: string;
  created_at: string;
  updated_at?: string;
} {
  const row = (raw ?? {}) as Record<string, unknown>;
  const encryptedContent = row.encrypted_content as
    | _EncryptedPayloadShape
    | Record<string, unknown>
    | undefined;
  const ciphertext =
    (encryptedContent && (encryptedContent as _EncryptedPayloadShape).ciphertext) ?? '';
  const tags = Array.isArray(row.tags) ? (row.tags as string[]) : [];
  const moods = Array.isArray(row.moods) ? (row.moods as string[]) : [];
  const result: {
    id: string;
    content_encrypted: string;
    moods: string[];
    tags: string[];
    mood_tag?: string;
    created_at: string;
    updated_at?: string;
  } = {
    id: String(row.id ?? ''),
    content_encrypted: String(ciphertext),
    moods,
    tags,
    created_at: String(row.created_at ?? new Date().toISOString()),
  };
  if (moods[0] !== undefined) result.mood_tag = moods[0];
  if (row.updated_at) result.updated_at = String(row.updated_at);
  return result;
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      apiClient.post('/api/auth/login', { email, password }),
    signup: (email: string, password: string, name: string) =>
      apiClient.post('/api/auth/signup', { email, password, name }),
    refresh: (refreshToken: string) =>
      apiClient.post('/api/auth/refresh', { refresh_token: refreshToken }),
    logout: () => apiClient.post('/api/auth/logout'),
  },

  /** KIAAN chat — Sakha companion */
  chat: {
    send: (message: string, sessionId?: string) =>
      apiClient.post('/api/chat/message', { message, session_id: sessionId }),
    history: (sessionId?: string, limit?: number, offset?: number) =>
      apiClient.get('/api/chat/history', {
        params: { session_id: sessionId, limit, offset },
      }),
    sessions: () => apiClient.get('/api/chat/sessions'),
  },

  /** Bhagavad Gita verses */
  gita: {
    chapters: () => apiClient.get('/api/gita/chapters'),
    chapter: (chapterId: number) =>
      apiClient.get(`/api/gita/chapters/${chapterId}`),
    verse: (chapter: number, verse: number) =>
      apiClient.get(`/api/gita/verses/${chapter}/${verse}`),
    search: (query: string) =>
      apiClient.get('/api/gita/search', { params: { q: query } }),
    /** Full search with pagination and filters */
    searchFull: (keyword: string, page?: number, pageSize?: number) =>
      apiClient.get('/api/gita/search', {
        params: { q: keyword, page: page ?? 1, page_size: pageSize ?? 10 },
      }),
    /** All translations for a specific verse */
    translations: (verseId: string) =>
      apiClient.get(`/api/gita/translations/${verseId}`),
  },

  /** Mood tracking */
  moods: {
    create: (mood: { score: number; state?: string; tags?: string[]; note?: string; date?: string }) =>
      apiClient.post('/api/moods', mood),
    microResponse: (score: number) =>
      apiClient.get('/api/moods/micro-response', { params: { score } }),
  },

  /** Karma tree.
   *  Backend POST /api/karmic-tree/unlock expects { unlockable_key, source? }.
   *  The mobile caller passes the achievement key as a single string, so we
   *  rename on the wire. */
  karma: {
    tree: () => apiClient.get('/api/karmic-tree/progress'),
    achievements: () => apiClient.get('/api/karmic-tree/achievements'),
    unlock: (achievementId: string) =>
      apiClient.post('/api/karmic-tree/unlock', {
        unlockable_key: achievementId,
        source: 'mobile',
      }),
  },

  /** Encrypted journal.
   *  Backend schema (backend/schemas/journal.py):
   *    JournalEntryCreate {
   *      entry_id?, title?: EncryptedPayload,
   *      content: EncryptedPayload { ciphertext, iv, salt, auth_tag?, algorithm, key_version? },
   *      moods?, tags?, search_tokens?, client_updated_at: datetime  ← REQUIRED
   *    }
   *  Mobile produces an opaque single-string ciphertext with the IV
   *  prepended (see apps/mobile/app/journal/new.tsx encryptContent). We
   *  adapt the wire format so the backend validator passes while the
   *  bytes stay end-to-end opaque to the server. */
  journal: {
    list: async () => {
      // Backend returns a bare array; wrap it so the UI keeps its
      // JournalListResponse { entries, total } contract.
      const res = await apiClient.get<Array<Record<string, unknown>>>(
        '/api/journal/entries',
      );
      const entries = (res.data ?? []).map(_unpackJournalEntry);
      return { ...res, data: { entries, total: entries.length } };
    },
    create: async (entry: {
      content_encrypted: string;
      moods?: string[];
      tags?: string[];
    }) => {
      const payload = _packJournalEntry(entry);
      const res = await apiClient.post<Record<string, unknown>>(
        '/api/journal/entries',
        payload,
      );
      return { ...res, data: _unpackJournalEntry(res.data) };
    },
    get: async (entryId: string) => {
      const res = await apiClient.get<Record<string, unknown>>(
        `/api/journal/entries/${entryId}`,
      );
      return { ...res, data: _unpackJournalEntry(res.data) };
    },
    update: async (
      entryId: string,
      entry: {
        content_encrypted: string;
        moods?: string[];
        tags?: string[];
      },
    ) => {
      const payload = _packJournalEntry(entry);
      const res = await apiClient.put<Record<string, unknown>>(
        `/api/journal/entries/${entryId}`,
        payload,
      );
      return { ...res, data: _unpackJournalEntry(res.data) };
    },
    remove: (entryId: string) =>
      apiClient.delete(`/api/journal/entries/${entryId}`),
  },

  /** Journey engine */
  journeys: {
    templates: () => apiClient.get('/api/journey-engine/templates'),
    template: (templateId: string) =>
      apiClient.get(`/api/journey-engine/templates/${templateId}`),
    list: (status?: string) =>
      apiClient.get('/api/journey-engine/journeys', {
        // Backend (routes/journey_engine.py) expects `status_filter`, not
        // `status`. Sending the wrong key silently disables the filter.
        ...(status !== undefined ? { params: { status_filter: status } } : {}),
      }),
    get: (journeyId: string) =>
      apiClient.get(`/api/journey-engine/journeys/${journeyId}`),
    start: (templateId: string) =>
      apiClient.post('/api/journey-engine/journeys', {
        template_id: templateId,
      }),
    completeStep: (journeyId: string, dayIndex: number) =>
      apiClient.post(
        `/api/journey-engine/journeys/${journeyId}/steps/${dayIndex}/complete`,
        // Backend declares `request: CompleteStepRequest` as a required
        // body parameter (even though all its fields are optional). An
        // empty object keeps FastAPI happy without sending a reflection.
        {},
      ),
    currentStep: (journeyId: string) =>
      apiClient.get(
        `/api/journey-engine/journeys/${journeyId}/steps/current`,
      ),
    step: (journeyId: string, dayIndex: number) =>
      apiClient.get(
        `/api/journey-engine/journeys/${journeyId}/steps/${dayIndex}`,
      ),
    pause: (journeyId: string) =>
      apiClient.post(`/api/journey-engine/journeys/${journeyId}/pause`),
    resume: (journeyId: string) =>
      apiClient.post(`/api/journey-engine/journeys/${journeyId}/resume`),
    /** Full journey detail with steps */
    detail: (journeyId: string) =>
      apiClient.get(`/api/journey-engine/journeys/${journeyId}`),
    dashboard: () => apiClient.get('/api/journey-engine/dashboard'),
    enemies: () => apiClient.get('/api/journey-engine/enemies'),
    enemyProgress: (enemy: string) =>
      apiClient.get(`/api/journey-engine/enemies/${enemy}`),
  },

  /** Audio / TTS */
  audio: {
    synthesize: (text: string, voiceType?: string, language?: string) =>
      apiClient.post(
        '/api/voice/synthesize',
        { text, voice_type: voiceType, language },
        { responseType: 'arraybuffer' },
      ),
  },

  /** Voice input / transcription.
   *  Backend responds with { text, language, confidence, duration, ... }.
   *  We normalise to { transcript, confidence } so UI hooks
   *  (useVoiceRecorder) can consume a stable shape. */
  voice: {
    transcribe: async (formData: FormData) => {
      const res = await apiClient.post<{
        text?: string;
        transcript?: string;
        confidence?: number;
      }>('/api/kiaan/transcribe', formData);
      return {
        ...res,
        data: {
          transcript: res.data.transcript ?? res.data.text ?? '',
          confidence: res.data.confidence ?? 0,
        },
      };
    },
  },

  /** User profile */
  profile: {
    me: () => apiClient.get('/api/auth/me'),
    get: () => apiClient.get('/api/profile'),
    update: (data: Record<string, unknown>) =>
      apiClient.post('/api/profile', data),
  },

  /** Emotional Reset */
  emotionalReset: {
    start: (emotion: string, intensity: number) =>
      apiClient.post('/api/emotional-reset/start', { emotion, intensity }),
    /** Fetch step-specific data (verses, affirmations, breathing patterns) */
    getStep: (sessionId: string, stepNumber: number) =>
      apiClient.get(`/api/emotional-reset/step/${stepNumber}`, { params: { session_id: sessionId } }),
    step: (sessionId: string, stepData: Record<string, unknown>) =>
      apiClient.post('/api/emotional-reset/step', { session_id: sessionId, ...stepData }),
    complete: (sessionId: string) =>
      apiClient.post('/api/emotional-reset/complete', { session_id: sessionId }),
  },

  /** Analytics */
  analytics: {
    dashboard: () => apiClient.get('/api/analytics/dashboard'),
    moodTrends: (days?: number) => apiClient.get('/api/analytics/mood-trends', { params: { days } }),
    weeklyInsights: () => apiClient.get('/api/analytics/weekly-summary'),
    achievements: () => apiClient.get('/api/analytics/achievements'),
    // KarmaLytix Sacred Mirror (PROMPT 4 surface). The structured
    // six-section reflection (mirror / pattern / gita_echo / growth_edge
    // / blessing / dynamic_wisdom) arrives nested inside
    // ``patterns_detected``. When the user has fewer than 3 entries this
    // week the backend returns ``insufficient_data: true`` with the
    // remaining count — it never 404s.
    karmaLytixWeeklyReport: () =>
      apiClient.get('/api/analytics/weekly-report'),
    karmaLytixGenerate: (forceRegenerate: boolean = false) =>
      apiClient.post('/api/analytics/generate', {
        force_regenerate: forceRegenerate,
      }),
    karmaLytixHistory: (limit: number = 12) =>
      apiClient.get('/api/analytics/history', { params: { limit } }),
  },

  /** Subscriptions */
  subscriptions: {
    tiers: () => apiClient.get('/api/subscriptions/tiers'),
    current: () => apiClient.get('/api/subscriptions/current'),
    usage: () => apiClient.get('/api/subscriptions/usage'),
    /** Verify mobile IAP receipt and activate subscription */
    verify: (receipt: string, platform: 'ios' | 'android', productId: string) =>
      apiClient.post<{
        valid: boolean;
        tier: string;
        expires_at: string | null;
        error?: string;
      }>('/api/subscription/verify', {
        receipt,
        platform,
        product_id: productId,
      }),
  },

  /** Sync (offline batch).
   *  Backend SyncBatchRequest expects `{ items: SyncItem[], last_sync_timestamp? }`
   *  and /pull expects `{ last_sync_timestamp: datetime, entity_types: [...] }`.
   *  We translate on the wire so the queue-flush path (callers supply a bare
   *  operations array; we also accept a plain timestamp for pull). */
  sync: {
    batch: (operations: Record<string, unknown>[]) =>
      apiClient.post('/api/sync/batch', { items: operations }),
    pull: (lastSyncTimestamp?: number | string | null) => {
      const iso =
        typeof lastSyncTimestamp === 'number'
          ? new Date(lastSyncTimestamp).toISOString()
          : (lastSyncTimestamp ?? new Date(0).toISOString());
      return apiClient.post('/api/sync/pull', {
        last_sync_timestamp: iso,
        entity_types: ['mood', 'journal', 'journey_progress'],
      });
    },
    status: () => apiClient.get('/api/sync/status'),
  },

  /** Divine Consciousness */
  divine: {
    greeting: () => apiClient.get('/api/divine/greeting'),
    affirmation: () => apiClient.get('/api/divine/affirmation'),
    breathingExercise: (pattern: string) =>
      apiClient.get(`/api/divine/breathing/${pattern}`),
    moodResponse: (mood: string) =>
      apiClient.post('/api/divine/mood-response', { mood }),
  },
  /** Community — Wisdom circles and social features.
   *  Backend exposes posts scoped to a circle only — there is no global
   *  feed endpoint, so `posts` requires a circleId. Call sites that want
   *  a cross-circle feed must aggregate client-side. */
  community: {
    circles: () => apiClient.get('/api/community/circles'),
    circle: (circleId: string) => apiClient.get(`/api/community/circles/${circleId}`),
    joinCircle: (circleId: string) => apiClient.post(`/api/community/circles/${circleId}/join`),
    leaveCircle: (circleId: string) => apiClient.post(`/api/community/circles/${circleId}/leave`),
    posts: (circleId: string, limit?: number, offset?: number) =>
      apiClient.get(`/api/community/circles/${circleId}/posts`, {
        params: { limit, offset },
      }),
    createPost: (content: string, circleId?: string, tags?: string[]) =>
      apiClient.post('/api/community/posts', { content, circle_id: circleId, tags }),
    reactToPost: (postId: string, reaction: string) =>
      apiClient.post(`/api/community/posts/${postId}/react`, { reaction }),
  },

  /** Wisdom Rooms — Guided group discussions.
   *  The backend mounts the chat-rooms router at `/api/rooms` (not under
   *  `/api/wisdom/rooms`, which belongs to the wisdom-guide router and has
   *  no `/rooms` sub-tree). All read endpoints map cleanly; message send
   *  is WebSocket-only on the backend (`/api/rooms/{id}/ws`), so the REST
   *  POST is a stub that will be implemented once the WS bridge lands. */
  wisdomRooms: {
    list: () => apiClient.get('/api/rooms'),
    join: (roomId: string) => apiClient.post(`/api/rooms/${roomId}/join`),
    leave: (roomId: string) => apiClient.post(`/api/rooms/${roomId}/leave`),
    messages: (roomId: string, limit?: number, offset?: number) =>
      apiClient.get(`/api/rooms/${roomId}/messages`, { params: { limit, offset } }),
    /** TODO(backend): POST /api/rooms/{id}/messages does not exist yet —
     *  messages are sent over the `/api/rooms/{id}/ws` WebSocket. */
    sendMessage: (_roomId: string, _content: string) =>
      Promise.reject(
        new Error('Sending via REST is not supported — use WebSocket at /api/rooms/{id}/ws'),
      ),
  },

  /** Sadhana — Daily sacred practice */
  sadhana: {
    daily: () => apiClient.get('/api/sadhana/daily'),
    complete: (data: { mood_score?: number; verse_id?: string; reflection?: string; intention?: string }) =>
      apiClient.post('/api/sadhana/complete', data),
    history: (limit?: number) =>
      apiClient.get('/api/sadhana/history', { params: { limit } }),
    streak: () => apiClient.get('/api/sadhana/streak'),
  },

  /** Relationship Compass — Dharma-guided relationship clarity */
  relationship: {
    // Backend (routes/relationship_compass.py) reads `conflict` (not
    // `question`) and accepts an optional `relationship_type` /
    // `analysis_mode`. Sending the wrong key triggers a 400 because the
    // backend rejects empty conflict text.
    guide: (question: string, context?: string) =>
      apiClient.post('/api/relationship-compass/guide', {
        conflict: question,
        context: context ?? '',
        relationship_type: 'romantic',
        analysis_mode: 'standard',
      }),
  },

  /** Karma Footprint — Track karmic ripples and impact */
  karmaFootprint: {
    analyze: () => apiClient.get('/api/karma-footprint/analyze'),
    log: (action: string, impact: string) =>
      apiClient.post('/api/karma-footprint/log', { action, impact }),
  },

  /** Karma Reset — 4-phase sacred healing ritual */
  karmaReset: {
    start: (pattern: string) =>
      apiClient.post('/api/karma-reset/start', { pattern }),
    step: (sessionId: string, phase: number, data: Record<string, unknown>) =>
      apiClient.post('/api/karma-reset/step', { session_id: sessionId, phase, ...data }),
    complete: (sessionId: string) =>
      apiClient.post('/api/karma-reset/complete', { session_id: sessionId }),
  },

  /** Viyoga — Detachment and letting-go tool */
  viyoga: {
    // Backend (routes/viyoga.py) reads `sessionId` in camelCase, plus
    // `mode` and `secularMode` for the v4.0 enhanced pipeline. The
    // previous snake_case `session_id` was silently dropped, so every
    // turn started a brand-new conversation on the server.
    chat: (message: string, sessionId?: string) =>
      apiClient.post('/api/viyoga/chat', {
        message,
        sessionId: sessionId ?? '',
        mode: 'full',
        secularMode: true,
      }),
  },

  /** Ardha — Reframing and perspective tool */
  ardha: {
    // Backend (routes/ardha.py) reads `thought` (not `situation`) and
    // requires it non-empty; sending `situation` produced
    // 400 "thought is required". `depth` defaults to "quick" but we send
    // it explicitly so the server picks the right Gita pipeline.
    reframe: (situation: string, _perspective?: string) =>
      apiClient.post('/api/ardha/reframe', {
        thought: situation,
        depth: 'quick',
      }),
    /**
     * Structured reframe call used by the 2-screen Ardha flow
     * (tools/ardha/index.tsx → tools/ardha/result.tsx). Returns the full
     * backend payload — raw `response`, `ardha_analysis`, `compliance`,
     * `sources` — so the client can parse it into the 5-pillar accordion.
     *
     * `sessionId` opts the caller into the backend's session memory
     * (routes/ardha.py stores up to 10 turns under that id) so a follow-up
     * reframe can build on the previous one.
     */
    reframeStructured: (
      thought: string,
      opts?: { depth?: 'quick' | 'deep' | 'quantum'; sessionId?: string },
    ) =>
      apiClient.post('/api/ardha/reframe', {
        thought,
        depth: opts?.depth ?? 'quick',
        ...(opts?.sessionId ? { sessionId: opts.sessionId } : {}),
      }),
  },

  /** Meditation tracks for Vibe Player */
  meditation: {
    tracks: (category?: string) =>
      apiClient.get('/api/meditation/tracks', { params: { category } }),
    track: (trackId: string) => apiClient.get(`/api/meditation/tracks/${trackId}`),
  },

  /** Deep Insights — Advanced analytics */
  deepInsights: {
    summary: () => apiClient.get('/api/analytics/deep-insights'),
    gunaBalance: () => apiClient.get('/api/analytics/guna-balance'),
    emotionalPatterns: (days?: number) =>
      apiClient.get('/api/analytics/emotional-patterns', { params: { days } }),
  },

  /** User settings */
  settings: {
    get: () => apiClient.get('/api/profile/settings'),
    update: (settings: Record<string, unknown>) =>
      apiClient.put('/api/profile/settings', settings),
  },

  /** Push notifications.
   *  The web-push /subscribe/unsubscribe endpoints accept Web Push
   *  subscription objects ({ endpoint, keys }) — feeding them Expo push
   *  tokens "works" in the sense that it returns 201, but the backend
   *  can never deliver via Web Push because the endpoint isn't a real
   *  push URL. The correct endpoint for mobile is /api/user/push-token.
   *  `registerExpoPushToken` below talks to that route; the older
   *  `subscribe`/`unsubscribe` are kept for web-push callers only. */
  notifications: {
    /** Register an Expo Push token for this device. Mobile-only. */
    registerExpoPushToken: (token: string, platform: 'ios' | 'android') =>
      apiClient.post('/api/user/push-token', { token, platform }),
    subscribe: (token: string, deviceName?: string, platform?: string) =>
      apiClient.post('/api/notifications/subscribe', {
        endpoint: token,
        device_name: deviceName,
        ...(platform !== undefined && { platform }),
      }),
    unsubscribe: (token: string) =>
      apiClient.post('/api/notifications/unsubscribe', { endpoint: token }),
    inbox: (limit?: number, offset?: number) =>
      apiClient.get('/api/notifications/inbox', { params: { limit, offset } }),
    markRead: (notificationId: string) =>
      apiClient.post(`/api/notifications/${notificationId}/read`),
    getPreferences: () =>
      apiClient.get('/api/notifications/preferences'),
    updatePreferences: (prefs: {
      push_enabled?: boolean;
      email_enabled?: boolean;
      daily_checkin_reminder?: boolean;
      journey_step_reminder?: boolean;
      streak_encouragement?: boolean;
      weekly_reflection?: boolean;
      community_activity?: boolean;
      quiet_hours_start?: number | null;
      quiet_hours_end?: number | null;
    }) =>
      apiClient.put('/api/notifications/preferences', prefs),
  },

  /** GDPR Privacy (Art. 15/17/20) */
  privacy: {
    status: () => apiClient.get('/api/v1/privacy/status'),
    requestExport: () =>
      apiClient.post('/api/v1/privacy/export'),
    downloadExport: (token: string) =>
      apiClient.get('/api/v1/privacy/export', {
        params: { token },
        responseType: 'arraybuffer',
      }),
    requestDeletion: (reason?: string) =>
      apiClient.post('/api/v1/privacy/delete', { confirm: true, reason }),
    cancelDeletion: () =>
      apiClient.post('/api/v1/privacy/delete/cancel'),
  },
} as const;
