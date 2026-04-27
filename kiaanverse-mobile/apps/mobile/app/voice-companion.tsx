/**
 * Voice Companion (WSS pipeline) — alternative to /voice (SSE pipeline).
 *
 * Mounts the new WSS-based Sakha pipeline integrated from apps/sakha-mobile/
 * (PR #1654). Uses the kiaan-voice-v1 subprotocol against
 * /voice-companion/converse on the backend, with real ElevenLabs / Sarvam
 * streaming via the wired providers in backend/services/voice/.
 *
 * Coexists with /voice (PR #1635's SSE pipeline) so users / QA can A/B
 * both architectures within the same APK. The eventual cutover (deleting
 * voice.tsx + useSakhaVoice.ts + native/android/voice/sakha/*.kt) lives
 * in a follow-up PR once this route is validated against real keys.
 *
 * Auth: derives userId from the JWT 'sub' claim on the cached access
 * token. The WSS handler accepts userId in the query string per the
 * subprotocol handshake.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import {
  API_CONFIG,
  getCurrentAccessToken,
} from '@kiaanverse/api';

import { useVoiceSession } from '../voice/hooks/useVoiceSession';
import { useVoiceStore } from '../voice/stores/voiceStore';
import { useCrisisHandler } from '../voice/hooks/useCrisisHandler';
import { Shankha } from '../voice/components/Shankha';

const COSMIC_VOID = '#050714';
const DIVINE_GOLD = 'rgba(212, 160, 23, 1)';
const WHISPER_WHITE = 'rgba(245, 240, 220, 0.92)';

const PERSONA_VERSION = '1.0.0';

function decodeJwtSub(token: string | null): string | null {
  if (!token) return null;
  const segments = token.split('.');
  if (segments.length < 2) return null;
  try {
    const payload = segments[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = payload + '='.repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(
      typeof atob === 'function'
        ? atob(padded)
        : Buffer.from(padded, 'base64').toString('utf8'),
    );
    return typeof decoded.sub === 'string' ? decoded.sub : null;
  } catch {
    return null;
  }
}

function labelForState(state: string): string {
  switch (state) {
    case 'idle':
      return 'Tap to begin';
    case 'listening':
      return 'Sakha is listening…';
    case 'speaking':
      return '';
    case 'crisis':
      return '';
    case 'error':
      return 'A breath, then try again';
    case 'offline':
      return 'मौन में सखा (network paused)';
    default:
      return 'Preparing the space…';
  }
}

export default function VoiceCompanionScreen(): JSX.Element {
  const [userId, setUserId] = useState<string | null>(null);
  const state = useVoiceStore((s) => s.state);
  const transcript = useVoiceStore((s) => s.userTranscriptPartial);
  const responseText = useVoiceStore((s) => s.responseText);

  // Always mount the crisis handler — it auto-plays safety audio + stops
  // the player whenever a crisis frame arrives.
  useCrisisHandler();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getCurrentAccessToken();
      const sub = decodeJwtSub(token);
      if (!cancelled) setUserId(sub ?? 'anon');
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const session = useVoiceSession({
    apiBaseUrl: API_CONFIG.baseURL,
    userId: userId ?? 'anon',
    clientPersonaVersion: PERSONA_VERSION,
  });

  const onPress = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (state === 'idle') {
      void session.start({ langHint: 'en', userRegion: 'IN' });
    } else {
      session.stop();
    }
  }, [state, session]);

  if (Platform.OS !== 'android') {
    return (
      <View style={styles.unsupported}>
        <Text style={styles.unsupportedText}>
          Voice Companion is Android-only in this build.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Shankha />

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={labelForState(state)}
        onPress={onPress}
        style={({ pressed }) => [
          styles.tapTarget,
          pressed && styles.tapTargetPressed,
        ]}
      >
        <Text style={styles.label}>{labelForState(state)}</Text>
      </Pressable>

      {transcript ? (
        <Text style={styles.transcript} accessibilityLiveRegion="polite">
          {transcript}
        </Text>
      ) : null}
      {responseText ? (
        <Text style={styles.response} accessibilityLiveRegion="polite">
          {responseText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COSMIC_VOID,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  tapTarget: {
    marginTop: 32,
    paddingVertical: 18,
    paddingHorizontal: 36,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: DIVINE_GOLD,
  },
  tapTargetPressed: {
    opacity: 0.6,
  },
  label: {
    color: DIVINE_GOLD,
    fontSize: 16,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  transcript: {
    marginTop: 24,
    color: WHISPER_WHITE,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  response: {
    marginTop: 16,
    color: 'rgba(245, 240, 220, 0.75)',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 24,
    fontStyle: 'italic',
  },
  unsupported: {
    flex: 1,
    backgroundColor: COSMIC_VOID,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  unsupportedText: {
    color: WHISPER_WHITE,
    fontSize: 16,
    textAlign: 'center',
  },
});
