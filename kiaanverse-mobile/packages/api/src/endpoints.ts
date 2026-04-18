/**
 * Typed API Endpoints for Kiaanverse
 *
 * Mirrors the endpoint structure from MindVibe's apiClient.ts.
 * All endpoints are consumed via the shared axios client instance.
 */

import { apiClient } from './client';

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

  /** Karma tree */
  karma: {
    tree: () => apiClient.get('/api/karmic-tree/progress'),
    achievements: () => apiClient.get('/api/karmic-tree/achievements'),
    unlock: (achievementId: string) =>
      apiClient.post('/api/karmic-tree/unlock', { achievement_id: achievementId }),
  },

  /** Encrypted journal */
  journal: {
    list: () => apiClient.get('/api/journal/entries'),
    create: (entry: { content_encrypted: string; tags?: string[] }) =>
      apiClient.post('/api/journal/entries', entry),
    get: (entryId: string) =>
      apiClient.get(`/api/journal/entries/${entryId}`),
    update: (entryId: string, entry: { content_encrypted: string; tags?: string[] }) =>
      apiClient.put(`/api/journal/entries/${entryId}`, entry),
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
        ...(status !== undefined ? { params: { status } } : {}),
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
      ),
    currentStep: (journeyId: string) =>
      apiClient.get(
        `/api/journey-engine/journeys/${journeyId}/steps/current`,
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

  /** Voice input / transcription */
  voice: {
    transcribe: (formData: FormData) =>
      apiClient.post<{ transcript: string; confidence: number }>(
        '/api/kiaan/transcribe',
        formData,
      ),
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

  /** Sync (offline batch) */
  sync: {
    batch: (operations: Record<string, unknown>[]) =>
      apiClient.post('/api/sync/batch', { operations }),
    pull: (lastSyncTimestamp?: number) =>
      apiClient.post('/api/sync/pull', { since: lastSyncTimestamp }),
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
  /** Community — Wisdom circles and social features */
  community: {
    circles: () => apiClient.get('/api/community/circles'),
    circle: (circleId: string) => apiClient.get(`/api/community/circles/${circleId}`),
    joinCircle: (circleId: string) => apiClient.post(`/api/community/circles/${circleId}/join`),
    leaveCircle: (circleId: string) => apiClient.post(`/api/community/circles/${circleId}/leave`),
    posts: (circleId?: string, limit?: number, offset?: number) =>
      apiClient.get('/api/community/posts', { params: { circle_id: circleId, limit, offset } }),
    createPost: (content: string, circleId?: string, tags?: string[]) =>
      apiClient.post('/api/community/posts', { content, circle_id: circleId, tags }),
    reactToPost: (postId: string, reaction: string) =>
      apiClient.post(`/api/community/posts/${postId}/react`, { reaction }),
  },

  /** Wisdom Rooms — Guided group discussions */
  wisdomRooms: {
    list: () => apiClient.get('/api/wisdom/rooms'),
    join: (roomId: string) => apiClient.post(`/api/wisdom/rooms/${roomId}/join`),
    messages: (roomId: string, limit?: number, offset?: number) =>
      apiClient.get(`/api/wisdom/rooms/${roomId}/messages`, { params: { limit, offset } }),
    sendMessage: (roomId: string, content: string) =>
      apiClient.post(`/api/wisdom/rooms/${roomId}/messages`, { content }),
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
    guide: (question: string, context?: string) =>
      apiClient.post('/api/relationship-compass/guide', { question, context }),
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
    chat: (message: string, sessionId?: string) =>
      apiClient.post('/api/viyoga/chat', { message, session_id: sessionId }),
  },

  /** Ardha — Reframing and perspective tool */
  ardha: {
    reframe: (situation: string, perspective?: string) =>
      apiClient.post('/api/ardha/reframe', { situation, perspective }),
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

  /** Push notifications */
  notifications: {
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
