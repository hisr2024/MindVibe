/**
 * VoiceCompanionScreen — Sakha's main canvas.
 *
 * Layout (per spec):
 *   • Sacred geometry backdrop (slow rotation, RMS-glowing)
 *   • Shankha at center (RMS-driven sound waves during speaking)
 *   • Live transcript ticker above the conch (current partial)
 *   • Engine + mood + verse citation chip below
 *   • Suggested-next chips at bottom
 *   • Tap-to-start / tap-to-interrupt CTA
 *
 * This screen is the composition root for all 11 hooks from Part 9.
 * Logic stays in the hooks; this file just lays out the visuals and
 * wires hook outputs to props.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@kiaanverse/store';

import { Shankha } from '../../voice/components/Shankha';
import { SacredGeometry } from '../../voice/components/SacredGeometry';
import { Color, Spacing, Type } from '../../voice/lib/theme';
import {
  selectIsActive,
  selectVoiceState,
  useVoiceStore,
} from '../../voice/stores/voiceStore';
import { useVoiceSession } from '../../voice/hooks/useVoiceSession';
import { useStreamingPlayer } from '../../voice/hooks/useStreamingPlayer';
import { useAudioFocus } from '../../voice/hooks/useAudioFocus';
import { useForegroundService } from '../../voice/hooks/useForegroundService';
import { useCrisisHandler } from '../../voice/hooks/useCrisisHandler';
import {
  useToolInvocation,
  type ToolInvocationNavParams,
} from '../../voice/hooks/useToolInvocation';
import { useSakhaWakeWord } from '../../voice/hooks/useSakhaWakeWord';

export default function VoiceCompanionScreen() {
  const router = useRouter();
  const state = useVoiceStore(selectVoiceState);
  const isActive = useVoiceStore(selectIsActive);
  const partial = useVoiceStore((s) => s.partialTranscript);
  const engine = useVoiceStore((s) => s.currentEngine);
  const mood = useVoiceStore((s) => s.currentMood);
  const verse = useVoiceStore((s) => s.currentVerse);
  const suggested = useVoiceStore((s) => s.suggestedNext);
  const crisis = useVoiceStore((s) => s.crisis);
  const quota = useVoiceStore((s) => s.quota);
  const personaMismatch = useVoiceStore((s) => s.personaMismatch);
  const lastError = useVoiceStore((s) => s.lastError);

  // Authenticated user identity for the voice session. AuthGate (in
  // app/_layout.tsx) guarantees this screen only mounts when status
  // === 'authenticated' and isOnboarded === true, so user is non-null
  // by the time we get here in steady state — but during the
  // hydrate-then-mount transition there's a frame or two where
  // useAuthStore.user is still null. We hold off starting the voice
  // session until we have a real id by feeding 'pending' to
  // useVoiceSession, which short-circuits its quota pre-flight when
  // userId === 'pending'.
  //
  // Until v1.3.1 this screen pinned a per-device UUID in SecureStore
  // and used that as the user_id. That meant quota / telemetry /
  // crisis incidents tracked the device, not the account — sign-out
  // and sign-back-in on the same device kept hitting the same quota
  // bucket, and the same human across devices got disjoint quotas.
  // The migration is forward-only: anonymous device UUIDs that were
  // already written to SecureStore are simply ignored from this
  // version onward. No data loss because daily quotas reset anyway.
  const authUserId = useAuthStore((s) => s.user?.id ?? null);
  const userId = authUserId;

  const session = useVoiceSession(userId ?? 'pending');
  const audioFocus = useAudioFocus();
  const foregroundService = useForegroundService();
  // Crisis flow runs autonomously — just instantiating it wires up the
  // store subscription + heavy haptic + safety audio.
  useCrisisHandler();

  // Streaming player needs the raw socket — the session API doesn't
  // expose it directly, so for this scaffold we leave the prop null
  // (audio.chunk frames still flow once the underlying useWebSocket
  // listener attaches once a real WebSocket is exposed in Part 12).
  // The store's audioLevel still pumps via KiaanAudioPlayer.onAudioLevel.
  useStreamingPlayer({ socket: null, autoplay: true });

  const navigateForTool = useCallback(
    (href: string, params: ToolInvocationNavParams) => {
      router.push({ pathname: href, params: params as unknown as Record<string, string> });
    },
    [router],
  );
  useToolInvocation({ navigate: navigateForTool });

  // Wake-word hook. Subscribes to the SakhaVoiceWakeWord native event;
  // when the user says "Hey Sakha" the native side has already started
  // a turn (state → LISTENING) — we only need to start the WSS session
  // to feed the audio chunks. This is symmetric with the tap-to-begin
  // path: handleStart() vs. wake-word both end up at session.start().
  const wake = useSakhaWakeWord({
    onWake: () => {
      if (!userId) return;
      void (async () => {
        await audioFocus.acquire();
        await foregroundService.start();
        await session.start({ langHint: 'en', userRegion: 'GLOBAL' });
      })();
    },
  });

  // Quota gate — if quota check ran and can't start, jump to the sheet.
  // The quota / crisis / onboarding sheets live under
  // app/voice-companion/{quota,crisis,onboarding}.tsx — there is no
  // separate /voice subtree, so the path must be /voice-companion/...
  // (the older /voice/... paths produced "Unmatched Route" because
  // app/voice.tsx is a one-line redirect, not a directory).
  useEffect(() => {
    if (quota && !quota.canStartSession) {
      router.push('/voice-companion/quota');
    }
  }, [quota, router]);

  // Crisis gate — push the overlay
  useEffect(() => {
    if (crisis) router.push('/voice-companion/crisis');
  }, [crisis, router]);

  // Persona mismatch gate
  useEffect(() => {
    if (personaMismatch) {
      router.push('/voice-companion/onboarding');
    }
  }, [personaMismatch, router]);

  // Surface session-start errors in the bottomBar instead of crashing the
  // app. The previous shape called the three async operations one after
  // the other with NO try/catch, which meant any rejection (mic perm
  // SecurityException, FGS RemoteServiceException, WSS handshake
  // failure) became an unhandled Promise rejection. On older RN that
  // could escape the JS engine and terminate the app process — exactly
  // the symptom the user reported on first ship.
  const [startError, setStartError] = useState<string | null>(null);

  /**
   * Ensure the runtime permissions the voice session NEEDS are granted
   * before we touch any of the native machinery. The voice-companion
   * onboarding screen normally runs first and prompts for these, but
   * users who reach /voice-companion directly (via Sacred Tools tile,
   * deep link, or wake word) bypass onboarding entirely. Without this
   * gate, the native foreground service tries to construct an
   * AudioRecord on launch — and on Android 6+ that throws
   * SecurityException, which propagates outside the JNI bridge and
   * crashes the app process.
   *
   * RECORD_AUDIO is the must-have. POST_NOTIFICATIONS is required on
   * Android 13+ for the FGS notification to actually appear; without
   * it the OS kills the FGS within ~5 seconds anyway, so prompt
   * proactively.
   *
   * Returns true on success, false on user denial — the caller should
   * surface a clear message rather than barreling on into FGS.start().
   */
  const ensureVoicePermissions = useCallback(async (): Promise<boolean> => {
    // expo-av's Audio.requestPermissionsAsync handles RECORD_AUDIO
    // cross-platform and integrates with the manifest declaration.
    // It's idempotent — returns 'granted' instantly if already granted.
    const audio = await Audio.requestPermissionsAsync();
    if (audio.status !== 'granted') {
      return false;
    }

    // POST_NOTIFICATIONS is Android 13+ (API 33). Older Android grants
    // it implicitly. Skip on iOS entirely (different model).
    if (
      Platform.OS === 'android' &&
      typeof Platform.Version === 'number' &&
      Platform.Version >= 33
    ) {
      try {
        const result = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
        if (result !== PermissionsAndroid.RESULTS.GRANTED) {
          // We treat POST_NOTIFICATIONS as a soft requirement: the FGS
          // can technically launch without it, but the OS will kill it
          // within seconds because the persistent notification can't
          // render. Better to tell the user up-front.
          return false;
        }
      } catch (e) {
        // PermissionsAndroid throws on platforms that don't recognize
        // the permission constant. On Android 12 and below
        // POST_NOTIFICATIONS isn't a permission you can request —
        // treat that as success.
      }
    }

    return true;
  }, []);

  const handleStart = useCallback(async () => {
    if (!userId) return;
    setStartError(null);

    // 1. Permissions FIRST — never call into native FGS without them.
    const granted = await ensureVoicePermissions();
    if (!granted) {
      Alert.alert(
        'Microphone access needed',
        'Sakha needs microphone and notification access to listen and ' +
          'stay alive while you converse. Open Settings → Apps → ' +
          'Kiaanverse → Permissions to grant access, then tap "Tap to ' +
          'begin" again.',
      );
      setStartError('Microphone or notification permission denied');
      return;
    }

    // 2. Wrap the native start sequence in try/catch so any failure —
    //    audio-focus refusal, FGS launch denial, WSS handshake error —
    //    surfaces as a UI message rather than an unhandled rejection
    //    that the OS could escalate to a process crash.
    try {
      await audioFocus.acquire();
      await foregroundService.start();
      await session.start({ langHint: 'en', userRegion: 'GLOBAL' });
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      // eslint-disable-next-line no-console
      console.warn('[VoiceCompanion] start failed', e);
      setStartError(message);
      // Best-effort cleanup so we don't leave the FGS or audio focus
      // dangling after a partial start. Each cleanup call swallows its
      // own errors.
      try { await foregroundService.stop(); } catch {}
      try { await audioFocus.release(); } catch {}
    }
  }, [userId, audioFocus, foregroundService, session, ensureVoicePermissions]);

  const handleStop = useCallback(async () => {
    session.stop();
    await foregroundService.stop();
    await audioFocus.release();
  }, [session, foregroundService, audioFocus]);

  const stateLabel = useMemo(() => stateToLabel(state), [state]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.canvas}>
        <SacredGeometry size={360} />
        <Shankha size={170} />
      </View>

      <View style={styles.transcriptTicker} pointerEvents="none">
        {partial ? (
          <Text style={styles.partial} numberOfLines={2}>
            {partial}
          </Text>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        {engine ? <Chip label={engine} /> : null}
        {mood ? <Chip label={`${mood.label} · ${Math.round(mood.intensity * 100)}%`} /> : null}
        {verse ? <Chip label={verse.citation} accent /> : null}
      </View>

      <View style={styles.bottomBar}>
        <Text style={styles.stateLabel}>{stateLabel}</Text>
        {suggested.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.suggestedRow}>
            {suggested.map((s) => (
              <Chip key={s.action} label={s.label} accent />
            ))}
          </ScrollView>
        ) : null}
        {lastError ? <Text style={styles.errorText}>{lastError.message}</Text> : null}
        {startError ? <Text style={styles.errorText}>{startError}</Text> : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isActive ? 'Stop voice session' : 'Start voice session'}
          onPress={isActive ? handleStop : handleStart}
          style={[styles.primaryBtn, isActive ? styles.primaryBtnActive : null]}
        >
          <Text style={styles.primaryBtnText}>
            {isActive ? 'End session' : 'Tap to begin'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <View style={[styles.chip, accent ? styles.chipAccent : null]}>
      <Text style={[styles.chipText, accent ? styles.chipTextAccent : null]}>
        {label}
      </Text>
    </View>
  );
}

function stateToLabel(s: ReturnType<typeof selectVoiceState>): string {
  switch (s) {
    case 'idle': return 'Tap to begin';
    case 'listening': return 'I am here, listening';
    case 'thinking': return '…';
    case 'speaking': return 'Sakha speaks';
    case 'interrupted': return 'I hear you';
    case 'offline': return 'Reconnecting…';
    case 'crisis': return 'You are not alone';
    case 'error': return 'Something went wrong';
    default: return '';
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Color.cosmicVoid,
    paddingHorizontal: Spacing.md,
  },
  canvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transcriptTicker: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  partial: {
    ...Type.body,
    color: Color.textSecondary,
    textAlign: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.md,
  },
  bottomBar: {
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  stateLabel: {
    ...Type.caption,
    color: Color.textTertiary,
    marginBottom: Spacing.md,
  },
  suggestedRow: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  primaryBtn: {
    backgroundColor: Color.divineGoldDim,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: 999,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryBtnActive: {
    backgroundColor: Color.divineGold,
  },
  primaryBtnText: {
    ...Type.body,
    color: Color.cosmicVoid,
    fontWeight: '600',
  },
  errorText: {
    ...Type.caption,
    color: Color.errorRed,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: 999,
    backgroundColor: Color.cosmicVoidSoft,
    borderWidth: 1,
    borderColor: Color.divider,
  },
  chipAccent: {
    borderColor: Color.divineGoldDim,
    backgroundColor: 'rgba(212, 160, 23, 0.06)',
  },
  chipText: {
    ...Type.caption,
    color: Color.textSecondary,
  },
  chipTextAccent: {
    color: Color.divineGoldBright,
  },
});
