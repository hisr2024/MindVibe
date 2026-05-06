/**
 * 🟡 DEPRECATED (2025-11) — see voice-companion/index.tsx header for context.
 *
 * This hook (and the other WSS-coupled hooks in this directory:
 * useStreamingPlayer, useRecorder, useAudioFocus, useForegroundService,
 * useToolInvocation, useCrisisHandler, useBargeIn, useWebSocket,
 * useShankhaAnimation, useVAD, useVoicePrefill) is no longer wired
 * into the main voice-companion flow. It powered the WSS+Sarvam+
 * ElevenLabs pipeline that ran from PR #1635 through commit
 * 410220f5. The Option-2 convergence (commit on this branch) replaced
 * the pipeline with the simpler chat-style stack:
 *
 *   useDictation (= SpeechRecognizer) +
 *   useSakhaStream (= /api/chat) +
 *   expo-speech (= TextToSpeech)
 *
 * which is identical to what kiaanverse.com mobile uses on Chrome/Android.
 *
 * The hook is preserved (not deleted) as DORMANT INFRASTRUCTURE for a
 * future "Premium Voice" tier that re-enables Sarvam Indic + ElevenLabs
 * English for paying users. The 22 Kotlin files at
 * apps/mobile/native/android/src/main/java/com/mindvibe/kiaan/voice/*
 * + the backend's /voice-companion/converse WSS endpoint are
 * preserved in parallel for the same reason.
 *
 * Sibling routes that still import this (quota.tsx, crisis.tsx,
 * transcript.tsx, onboarding.tsx) are no longer reachable from
 * /voice-companion/index.tsx after the rewrite — they're dormant
 * routes that the router can still resolve if anyone deep-links them.
 *
 * DO NOT extend or refactor this file. If you need to add voice
 * functionality, add it via the chat-pattern stack instead. If you
 * need to bring this hook back to life for a premium tier:
 *   1. Wire VoiceCompanionScreen to opt into this hook based on a
 *      user-tier check.
 *   2. Re-enable the FGS plugin in app.config.ts plugins[].
 *   3. Re-enable the backend WSS route registration.
 *   4. Re-add the permissions back to manifest (POST_NOTIFICATIONS
 *      is still there from the earlier permission-gate PR).
 *
 * ─────────────────────────────────────────────────────────────────
 *
 * useVoiceSession — top-level orchestration hook.
 *
 * Owns the full session lifecycle:
 *   1. Pre-flight: GET /api/voice/quota + GET /api/voice/persona-version
 *      • If quota.can_start_session is false → set state to 'idle' with quota
 *        view; let the UI render the upgrade sheet (Part 10).
 *      • If persona-version mismatch → set state to 'error', flag mismatch.
 *   2. Open WSS via useWebSocket
 *   3. Send ClientStartFrame
 *   4. Hand off control to useRecorder + useStreamingPlayer + useBargeIn
 *
 * The other 10 hooks are composed by the VoiceCompanionScreen (Part 10),
 * not by this hook. This file is intentionally thin — its job is just
 * to manage the connect/disconnect contract.
 */

import { useCallback, useMemo, useRef } from 'react';
import Constants from 'expo-constants';
import axios from 'axios';
import { useVoiceStore, type QuotaView } from '../stores/voiceStore';
import { useWebSocket } from './useWebSocket';

interface VoiceQuotaResponse {
  user_id: string;
  tier: 'free' | 'bhakta' | 'sadhak' | 'siddha';
  minutes_used_today: number;
  cap_minutes_per_day: number | null;
  minutes_remaining_today: number | null;
  can_start_session: boolean;
  reason: string;
  persona_version: string;
}

interface VoicePersonaVersionResponse {
  persona_version: string;
  schema_version: string;
  subprotocol: string;
}

export interface VoiceSessionAPI {
  start: (opts?: { langHint?: string; userRegion?: string }) => Promise<void>;
  stop: () => void;
  send: ReturnType<typeof useWebSocket>['send'];
  isOpen: ReturnType<typeof useWebSocket>['isOpen'];
}

export function useVoiceSession(userId: string): VoiceSessionAPI {
  const { apiBaseUrl, personaVersion: clientPersonaVersion } =
    (Constants.expoConfig?.extra ?? {}) as {
      apiBaseUrl?: string;
      personaVersion?: string;
    };
  const baseUrl = apiBaseUrl || 'https://mindvibe-api.onrender.com';

  const sessionIdRef = useRef<string | null>(null);
  const setQuota = useVoiceStore((s) => s.setQuota);
  const setPersonaMismatch = useVoiceStore((s) => s.setPersonaMismatch);
  const beginSession = useVoiceStore((s) => s.beginSession);
  const endSession = useVoiceStore((s) => s.endSession);
  const applyError = useVoiceStore((s) => s.applyError);

  const ws = useWebSocket({ baseUrl, userId });

  const start = useCallback(
    async ({ langHint = 'en', userRegion = 'GLOBAL' } = {}) => {
      try {
        // ── 1. Pre-flight quota ─────────────────────────────────────
        const quotaResp = await axios.get<VoiceQuotaResponse>(
          `${baseUrl}/api/voice/quota`,
          { params: { user_id: userId, tier: 'sadhak' }, timeout: 5000 },
        );
        const q: QuotaView = {
          tier: quotaResp.data.tier,
          capMinutesPerDay: quotaResp.data.cap_minutes_per_day,
          minutesUsedToday: quotaResp.data.minutes_used_today,
          minutesRemainingToday: quotaResp.data.minutes_remaining_today,
          canStartSession: quotaResp.data.can_start_session,
          reason: quotaResp.data.reason,
        };
        setQuota(q);

        if (!q.canStartSession) {
          // UI renders VoiceQuotaSheet from this store state — don't open WSS.
          return;
        }

        // ── 2. Pre-flight persona-version ───────────────────────────
        const personaResp = await axios.get<VoicePersonaVersionResponse>(
          `${baseUrl}/api/voice/persona-version`,
          { timeout: 5000 },
        );
        if (personaResp.data.persona_version !== clientPersonaVersion) {
          setPersonaMismatch(true);
          applyError({
            code: 'PERSONA_VERSION_MISMATCH',
            message:
              `Server persona ${personaResp.data.persona_version} ` +
              `≠ client ${clientPersonaVersion}. Please update the app.`,
            recoverable: false,
          });
          return;
        }

        // ── 3. Begin store session ──────────────────────────────────
        const sid =
          'sess-' + Date.now().toString(36) + '-' +
          Math.random().toString(36).slice(2, 10);
        sessionIdRef.current = sid;
        beginSession({ sessionId: sid, langHint, userRegion, quota: q });

        // ── 4. Open WSS ─────────────────────────────────────────────
        ws.connect();

        // Wait briefly for the open event before sending start frame.
        // useWebSocket.send returns false until the socket is OPEN.
        const tries = 20;
        for (let i = 0; i < tries; i += 1) {
          if (ws.isOpen()) break;
          await new Promise((r) => setTimeout(r, 50));
        }
        if (!ws.isOpen()) {
          applyError({
            code: 'WS_OPEN_TIMEOUT',
            message: 'Could not open the voice connection. Please retry.',
            recoverable: true,
          });
          return;
        }

        ws.send({
          type: 'start',
          session_id: sid,
          lang_hint: langHint,
          persona_version: clientPersonaVersion ?? '1.0.0',
          render_mode: 'voice',
          delivery_channel: 'voice_android',
          user_region: userRegion,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'preflight failed';
        applyError({
          code: 'PREFLIGHT_FAILED',
          message,
          recoverable: true,
        });
      }
    },
    [
      baseUrl, userId, clientPersonaVersion,
      setQuota, setPersonaMismatch, beginSession, applyError, ws,
    ],
  );

  const stop = useCallback(() => {
    ws.disconnect();
    endSession();
    sessionIdRef.current = null;
  }, [ws, endSession]);

  return useMemo(
    () => ({ start, stop, send: ws.send, isOpen: ws.isOpen }),
    [start, stop, ws.send, ws.isOpen],
  );
}
