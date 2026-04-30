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

import React, { useCallback, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

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

const USER_ID_KEY = 'sakha:user_id';

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

  // Stable userId per install. Real auth wires this from the existing
  // Kiaanverse auth context; for the standalone Sakha shell we generate
  // and pin a UUID per device on first launch.
  const [userId, setUserId] = React.useState<string | null>(null);
  useEffect(() => {
    (async () => {
      let uid = await SecureStore.getItemAsync(USER_ID_KEY);
      if (!uid) {
        uid = 'u-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
        await SecureStore.setItemAsync(USER_ID_KEY, uid);
      }
      setUserId(uid);
    })();
  }, []);

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

  const handleStart = useCallback(async () => {
    if (!userId) return;
    await audioFocus.acquire();
    await foregroundService.start();
    await session.start({ langHint: 'en', userRegion: 'GLOBAL' });
  }, [userId, audioFocus, foregroundService, session]);

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
