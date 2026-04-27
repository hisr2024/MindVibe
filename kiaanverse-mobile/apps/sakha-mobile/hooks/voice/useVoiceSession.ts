/**
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
import { useVoiceStore, type QuotaView } from '../../stores/voiceStore';
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
