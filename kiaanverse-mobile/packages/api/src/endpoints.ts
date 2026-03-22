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
      apiClient.get('/api/gita/search', { params: { keyword: query } }),
    /** Full search with pagination and filters */
    searchFull: (keyword: string, page?: number, pageSize?: number) =>
      apiClient.get('/api/gita/search', {
        params: { keyword, page: page ?? 1, page_size: pageSize ?? 10 },
      }),
    /** All translations for a specific verse */
    translations: (verseId: string) =>
      apiClient.get(`/api/gita/translations/${verseId}`),
  },

  /** Mood tracking */
  moods: {
    create: (mood: { score: number; state?: string; tags?: string[]; note?: string; date?: string }) =>
      apiClient.post('/api/moods', mood),
    history: (days?: number) =>
      apiClient.get('/api/moods/history', { params: { days: days ?? 30 } }),
    insights: () =>
      apiClient.get('/api/moods/insights'),
    microResponse: (score: number) =>
      apiClient.get('/api/moods/micro-response', { params: { score } }),
  },

  /** Karma tree */
  karma: {
    tree: () => apiClient.get('/api/karma/tree'),
    award: (action: string, points: number) =>
      apiClient.post('/api/karma/award', { action, points }),
  },

  /** Encrypted journal */
  journal: {
    list: () => apiClient.get('/api/journal/entries'),
    create: (entry: { content_encrypted: string; tags?: string[] }) =>
      apiClient.post('/api/journal/entries', entry),
    get: (entryId: string) =>
      apiClient.get(`/api/journal/entries/${entryId}`),
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
      apiClient.get(`/api/journeys/${journeyId}`),
    /** Complete a specific step */
    completeStepById: (journeyId: string, stepId: string) =>
      apiClient.post(`/api/journeys/${journeyId}/steps/${stepId}/complete`),
    /** User progress across all journeys */
    progress: () => apiClient.get('/api/journeys/progress'),
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
        '/api/voice/transcribe',
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
    step: (sessionId: string, stepData: Record<string, unknown>) =>
      apiClient.post('/api/emotional-reset/step', { session_id: sessionId, ...stepData }),
    complete: (sessionId: string) =>
      apiClient.post('/api/emotional-reset/complete', { session_id: sessionId }),
  },

  /** Analytics */
  analytics: {
    dashboard: () => apiClient.get('/analytics/dashboard'),
    moodTrends: () => apiClient.get('/analytics/mood-trends'),
    weeklyInsights: () => apiClient.get('/analytics/weekly-summary'),
    achievements: () => apiClient.get('/analytics/achievements'),
  },

  /** Subscriptions */
  subscriptions: {
    tiers: () => apiClient.get('/api/subscriptions/tiers'),
    current: () => apiClient.get('/api/subscriptions/current'),
    usage: () => apiClient.get('/api/subscriptions/usage'),
  },

  /** Sync (offline batch) */
  sync: {
    batch: (operations: Record<string, unknown>[]) =>
      apiClient.post('/sync/batch', { operations }),
    pull: (lastSyncTimestamp?: number) =>
      apiClient.post('/sync/pull', { since: lastSyncTimestamp }),
    status: () => apiClient.get('/sync/status'),
  },

  /** Divine Consciousness */
  divine: {
    greeting: () => apiClient.get('/divine/greeting'),
    affirmation: () => apiClient.get('/divine/affirmation'),
    breathingExercise: (pattern: string) =>
      apiClient.get(`/divine/breathing/${pattern}`),
    moodResponse: (mood: string) =>
      apiClient.post('/divine/mood-response', { mood }),
  },
} as const;
