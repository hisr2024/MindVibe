/**
 * Sakha Voice Mode — primary voice screen.
 *
 * Mounts the native Sakha Voice manager (Android only) and renders a
 * minimal, breath-aware UI:
 *   - A breathing mandala that pulses with [state]
 *   - User's partial transcript as they speak
 *   - Sakha's streamed response as it arrives
 *   - Verse citation card when the persona quotes the Gita
 *   - One control: tap the mandala to speak / interrupt
 *
 * The screen deliberately renders nothing on iOS / Expo Go — the native
 * module is Android-only in this branch. Falls back to a "Use the Sakha chat
 * tab" message on unsupported platforms.
 *
 * Why not surface the FILTER_FAIL state directly? The persona spec says the
 * server falls back to a template tier — which the manager already speaks
 * (config.speakOnFilterFail = true). We just dim the mandala briefly so the
 * user feels the gentle handoff.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import {
  AccessibilityInfo,
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

import { useSakhaVoice } from '../hooks/useSakhaVoice';
import { HeroMandala } from '../components/chat/HeroMandala';
import { SubMandalaTexture } from '../components/chat/SubMandalaTexture';

const COSMIC_VOID = '#050714';
const DIVINE_GOLD = 'rgba(212, 160, 23, 1)';
const SOFT_GOLD = 'rgba(212, 160, 23, 0.65)';
const WHISPER_WHITE = 'rgba(245, 240, 220, 0.92)';

const labelForState = (state: string): string => {
  switch (state) {
    case 'IDLE':
      return 'Tap to speak with Sakha';
    case 'LISTENING':
      return 'Sakha is listening…';
    case 'TRANSCRIBING':
      return '';
    case 'REQUESTING':
      return 'Sakha is gathering the verse…';
    case 'SPEAKING':
      return '';
    case 'PAUSING':
      return '';
    case 'INTERRUPTED':
      return 'Yes — go on';
    case 'ERROR':
      return 'A breath, then try again';
    case 'UNINITIALIZED':
    case 'SHUTDOWN':
      return 'Preparing the space…';
    default:
      return '';
  }
};

export default function VoiceScreen(): JSX.Element {
  const sakha = useSakhaVoice({
    backendBaseUrl: API_CONFIG.baseURL,
    language: 'en',
    getAccessToken: async () => (await getCurrentAccessToken()) ?? null,
    debug: __DEV__,
  });

  const breathing = useMemo(
    () => sakha.state === 'LISTENING' || sakha.state === 'SPEAKING' || sakha.state === 'PAUSING',
    [sakha.state]
  );

  const onMandalaPress = useCallback(async () => {
    if (sakha.state === 'IDLE' || sakha.state === 'ERROR') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sakha.activate();
      return;
    }
    if (sakha.state === 'LISTENING') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await sakha.stopListening();
      return;
    }
    if (sakha.state === 'SPEAKING' || sakha.state === 'PAUSING') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Tap mid-utterance = barge in. The native manager will cancel + re-listen.
      await sakha.activate();
      return;
    }
    if (sakha.state === 'REQUESTING' || sakha.state === 'TRANSCRIBING') {
      await sakha.cancelTurn();
    }
  }, [sakha]);

  // Announce the verse citation to screen readers — the visual card is brief.
  useEffect(() => {
    if (!sakha.verseCited) return;
    const verseText = sakha.verseCited.sanskrit
      ? `Verse ${sakha.verseCited.reference}. ${sakha.verseCited.sanskrit}`
      : `Verse ${sakha.verseCited.reference}`;
    AccessibilityInfo.announceForAccessibility?.(verseText);
  }, [sakha.verseCited]);

  if (!sakha.available || Platform.OS !== 'android') {
    return (
      <View style={styles.container}>
        <Text style={styles.unavailable}>
          Sakha Voice mode is currently available on Android. Please use the
          Sakha chat tab on this device.
        </Text>
      </View>
    );
  }

  const stateLabel = labelForState(sakha.state);

  return (
    <View style={styles.container}>
      <SubMandalaTexture />

      <View style={styles.center}>
        <Pressable
          onPress={onMandalaPress}
          accessibilityRole="button"
          accessibilityLabel="Speak with Sakha"
          accessibilityHint="Tap to begin speaking. Tap again to stop."
          style={({ pressed }) => [
            styles.mandalaWrap,
            pressed && styles.mandalaPressed,
          ]}
        >
          <HeroMandala size={260} active={breathing} />
        </Pressable>

        {!!stateLabel && (
          <Text style={styles.stateLabel} accessibilityLiveRegion="polite">
            {stateLabel}
          </Text>
        )}
      </View>

      <View style={styles.transcriptBlock} pointerEvents="none">
        {!!sakha.partialTranscript && (
          <Text style={styles.partialText} numberOfLines={3}>
            {sakha.partialTranscript}
          </Text>
        )}
        {!!sakha.streamedText && (
          <Text style={styles.streamedText} numberOfLines={6}>
            {sakha.streamedText}
          </Text>
        )}
      </View>

      {!!sakha.verseCited && (
        <View style={styles.verseCard} accessibilityRole="text">
          <Text style={styles.verseRef}>Bhagavad Gita {sakha.verseCited.reference}</Text>
          {!!sakha.verseCited.sanskrit && (
            <Text style={styles.verseSanskrit}>{sakha.verseCited.sanskrit}</Text>
          )}
        </View>
      )}

      {!!sakha.lastError && sakha.state === 'ERROR' && (
        <Text style={styles.errorText}>{sakha.lastError.message}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COSMIC_VOID,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 80,
    paddingBottom: 64,
    paddingHorizontal: 24,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    width: '100%',
  },
  mandalaWrap: {
    width: 280,
    height: 280,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mandalaPressed: {
    opacity: 0.85,
  },
  stateLabel: {
    marginTop: 28,
    fontSize: 16,
    color: SOFT_GOLD,
    letterSpacing: 0.6,
    textAlign: 'center',
  },
  transcriptBlock: {
    minHeight: 80,
    width: '100%',
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  partialText: {
    fontSize: 16,
    color: 'rgba(245, 240, 220, 0.6)',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 8,
  },
  streamedText: {
    fontSize: 18,
    lineHeight: 28,
    color: WHISPER_WHITE,
    textAlign: 'center',
  },
  verseCard: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
    backgroundColor: 'rgba(212, 160, 23, 0.06)',
    alignItems: 'center',
    marginTop: 16,
  },
  verseRef: {
    fontSize: 13,
    color: DIVINE_GOLD,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  verseSanskrit: {
    fontSize: 17,
    color: WHISPER_WHITE,
    textAlign: 'center',
  },
  errorText: {
    color: 'rgba(255, 200, 200, 0.8)',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
  },
  unavailable: {
    color: WHISPER_WHITE,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 200,
  },
});
