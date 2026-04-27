/**
 * Sakha voice — Zustand store (single source of truth).
 *
 * The 11 voice hooks all read/write through this store rather than
 * passing props or context — that way the WSS lifecycle, audio
 * lifecycle, and UI state are atomic (one selector update triggers
 * one render) and the Shankha animation worklet has a single place
 * to subscribe.
 *
 * Mirrors the spec's VoiceStore interface verbatim plus the
 * extra fields the Part 5 WSS frame protocol surfaces (engine,
 * verse, suggested_next, tool_invocation, persona_version, etc.).
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type {
  HelplineEntry,
  ServerEngineFrame,
  ServerToolInvocationFrame,
  SuggestedNextItem,
  VerseSnapshot,
} from '../lib/wss-types';

// ─── State enum ──────────────────────────────────────────────────────────

export type VoiceState =
  | 'idle'         // not connected; tap-to-start
  | 'listening'    // VAD active, capturing audio, streaming chunks
  | 'thinking'     // end_of_speech sent, awaiting first delta
  | 'speaking'     // audio playing, RMS-driven sound waves animating
  | 'interrupted'  // user barge-in mid-speaking; player faded, returning to listening
  | 'offline'      // WSS dropped; offline silence clip + reconnect attempts
  | 'error'        // unrecoverable; user must tap to retry
  | 'crisis';      // crisis frame received; full-screen overlay non-dismissible

// ─── Sub-shapes ──────────────────────────────────────────────────────────

export interface MoodView {
  label: string;
  intensity: number; // 0..1
  trend: 'rising' | 'falling' | 'steady' | string;
}

export interface CrisisView {
  incidentId: string;
  helpline: HelplineEntry[];
  audioUrl: string;
  region: string;
  language: string;
}

export interface ToolInvocationView {
  tool: string;
  action: 'NAVIGATE' | 'INPUT_TO_TOOL';
  inputPayload: Record<string, unknown> | null;
  carryId: string | null;
  confidence: number;
}

export interface QuotaView {
  tier: 'free' | 'bhakta' | 'sadhak' | 'siddha';
  capMinutesPerDay: number | null;
  minutesUsedToday: number;
  minutesRemainingToday: number | null;
  canStartSession: boolean;
  reason: string;
}

// ─── Store shape ─────────────────────────────────────────────────────────

export interface VoiceStore {
  // ── Lifecycle ─────────────────────────────
  state: VoiceState;
  sessionId: string | null;
  conversationId: string | null;
  langHint: string;
  userRegion: string;

  // ── Persona / schema (mirrors backend pin) ─
  personaVersion: string;
  schemaVersion: string;
  personaMismatch: boolean;

  // ── Quota ─────────────────────────────────
  quota: QuotaView | null;

  // ── Live turn state ───────────────────────
  partialTranscript: string;
  finalTranscript: string;
  responseText: string; // accumulated text.delta content for THIS turn

  currentEngine: ServerEngineFrame['selected'] | null;
  currentMood: MoodView | null;
  currentVerse: VerseSnapshot | null;

  // ── UX surfaces ───────────────────────────
  suggestedNext: SuggestedNextItem[];
  pendingToolInvocation: ToolInvocationView | null;
  crisis: CrisisView | null;

  // ── Audio metering (60Hz from KiaanAudioPlayer) ─
  audioLevel: number; // 0..1 — drives Shankha amplitude

  // ── Telemetry the Done frame brings back ──
  cacheHit: boolean;
  tierUsed: 'openai' | 'local_llm' | 'template' | 'verse_only' | null;
  firstAudioByteMs: number | null;
  totalMs: number | null;

  // ── Errors ────────────────────────────────
  lastError: { code: string; message: string; recoverable: boolean } | null;

  // ─── Actions ──────────────────────────────────────────
  setState: (s: VoiceState) => void;
  beginSession: (init: {
    sessionId: string;
    langHint: string;
    userRegion: string;
    quota: QuotaView | null;
  }) => void;
  endSession: () => void;
  resetTurn: () => void;

  // Frame absorption (called by useWebSocket per server frame)
  applyTranscriptPartial: (text: string, isFinal: boolean) => void;
  applyEngine: (engine: ServerEngineFrame['selected']) => void;
  applyMood: (m: MoodView) => void;
  applyVerse: (v: VerseSnapshot) => void;
  applyTextDelta: (content: string) => void;
  applyAudioLevel: (rms: number) => void;
  applyCrisis: (c: CrisisView) => void;
  applyToolInvocation: (t: ToolInvocationView) => void;
  applySuggestedNext: (items: SuggestedNextItem[]) => void;
  applyDone: (d: {
    conversationId: string;
    cacheHit: boolean;
    tierUsed: NonNullable<VoiceStore['tierUsed']>;
    firstAudioByteMs: number | null;
    totalMs: number;
  }) => void;
  applyFilterFailed: (
    reason: string,
    fallingBackTo: 'template' | 'verse_only',
  ) => void;
  applyError: (e: { code: string; message: string; recoverable: boolean }) => void;

  // UX actions
  acknowledgeCrisis: () => void;
  consumeToolInvocation: () => ToolInvocationView | null;

  // Persona/version/quota updates
  setPersonaMismatch: (mismatch: boolean) => void;
  setQuota: (q: QuotaView | null) => void;

  // Test-only
  reset: () => void;
}

// ─── Initial state ───────────────────────────────────────────────────────

const INITIAL: Pick<
  VoiceStore,
  | 'state' | 'sessionId' | 'conversationId' | 'langHint' | 'userRegion'
  | 'personaVersion' | 'schemaVersion' | 'personaMismatch'
  | 'quota'
  | 'partialTranscript' | 'finalTranscript' | 'responseText'
  | 'currentEngine' | 'currentMood' | 'currentVerse'
  | 'suggestedNext' | 'pendingToolInvocation' | 'crisis'
  | 'audioLevel' | 'cacheHit' | 'tierUsed' | 'firstAudioByteMs' | 'totalMs'
  | 'lastError'
> = {
  state: 'idle',
  sessionId: null,
  conversationId: null,
  langHint: 'en',
  userRegion: 'GLOBAL',
  personaVersion: '1.0.0',
  schemaVersion: '1.0.0',
  personaMismatch: false,
  quota: null,
  partialTranscript: '',
  finalTranscript: '',
  responseText: '',
  currentEngine: null,
  currentMood: null,
  currentVerse: null,
  suggestedNext: [],
  pendingToolInvocation: null,
  crisis: null,
  audioLevel: 0,
  cacheHit: false,
  tierUsed: null,
  firstAudioByteMs: null,
  totalMs: null,
  lastError: null,
};

// ─── Store ───────────────────────────────────────────────────────────────

export const useVoiceStore = create<VoiceStore>()(
  subscribeWithSelector((set, get) => ({
    ...INITIAL,

    setState: (s) => set({ state: s }),

    beginSession: ({ sessionId, langHint, userRegion, quota }) => set({
      ...INITIAL,
      state: 'listening',
      sessionId,
      langHint,
      userRegion,
      quota,
    }),

    endSession: () => set({ ...INITIAL }),

    resetTurn: () => set({
      partialTranscript: '',
      finalTranscript: '',
      responseText: '',
      currentEngine: null,
      currentMood: null,
      currentVerse: null,
      suggestedNext: [],
      pendingToolInvocation: null,
      audioLevel: 0,
      cacheHit: false,
      tierUsed: null,
      firstAudioByteMs: null,
      totalMs: null,
      lastError: null,
    }),

    applyTranscriptPartial: (text, isFinal) => set(
      isFinal
        ? { finalTranscript: text, partialTranscript: text, state: 'thinking' }
        : { partialTranscript: text },
    ),

    applyEngine: (engine) => set({ currentEngine: engine }),

    applyMood: (m) => set({ currentMood: m }),

    applyVerse: (v) => set({ currentVerse: v }),

    applyTextDelta: (content) =>
      set((prev) => ({ responseText: prev.responseText + content })),

    applyAudioLevel: (rms) => {
      // Only update state→speaking on the first non-trivial audio frame.
      // The shankha worklet reads audioLevel directly so we always set it.
      const cur = get();
      if (cur.state === 'thinking' && rms > 0.001) {
        set({ audioLevel: rms, state: 'speaking' });
      } else {
        set({ audioLevel: rms });
      }
    },

    applyCrisis: (c) => set({ crisis: c, state: 'crisis' }),

    applyToolInvocation: (t) => set({ pendingToolInvocation: t }),

    applySuggestedNext: (items) => set({ suggestedNext: items }),

    applyDone: ({ conversationId, cacheHit, tierUsed, firstAudioByteMs, totalMs }) =>
      set({
        conversationId,
        cacheHit,
        tierUsed,
        firstAudioByteMs,
        totalMs,
        state: 'listening', // ready for next turn
      }),

    applyFilterFailed: (reason, fallingBackTo) =>
      set({
        lastError: {
          code: 'FILTER_FAILED',
          message: `${reason} — falling back to ${fallingBackTo}`,
          recoverable: true,
        },
      }),

    applyError: (e) =>
      set({
        lastError: e,
        state: e.recoverable ? get().state : 'error',
      }),

    acknowledgeCrisis: () => set({ crisis: null, state: 'idle' }),

    consumeToolInvocation: () => {
      const t = get().pendingToolInvocation;
      if (t) set({ pendingToolInvocation: null });
      return t;
    },

    setPersonaMismatch: (mismatch) =>
      set({ personaMismatch: mismatch, state: mismatch ? 'error' : get().state }),

    setQuota: (q) => set({ quota: q }),

    reset: () => set({ ...INITIAL }),
  })),
);

// ─── Selectors (memoized, used by hooks/screens) ─────────────────────────

export const selectVoiceState = (s: VoiceStore): VoiceState => s.state;
export const selectAudioLevel = (s: VoiceStore): number => s.audioLevel;
export const selectIsActive = (s: VoiceStore): boolean =>
  s.state === 'listening' ||
  s.state === 'thinking' ||
  s.state === 'speaking' ||
  s.state === 'interrupted';
export const selectCrisis = (s: VoiceStore): CrisisView | null => s.crisis;
export const selectPendingToolInvocation = (
  s: VoiceStore,
): ToolInvocationView | null => s.pendingToolInvocation;
