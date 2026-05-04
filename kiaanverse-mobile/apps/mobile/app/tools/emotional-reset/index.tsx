/**
 * Emotional Reset — Expo Router entry.
 *
 * Renders the 6-phase sacred ritual screen that mirrors
 * `app/(mobile)/m/emotional-reset/page.tsx` on the web.
 *
 * The original 4-step flow (breathing → emotion → intensity → situation →
 * wisdom) has been replaced by a phase-state machine (arrival → mandala →
 * witness → breath → integration → ceremony) that calls the dedicated
 * /api/emotional-reset/{start,step,complete} backend and supports crisis
 * detection. Gesture navigation is disabled by the parent `_layout` so
 * the user can't accidentally swipe out mid-ceremony.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { EmotionalResetScreen } from '../../../components/emotional-reset/EmotionalResetScreen';
import { VoicePrefillBanner } from '../../../voice/components/VoicePrefillBanner';
import { useVoicePrefill } from '../../../voice/hooks/useVoicePrefill';

export default function EmotionalResetRoute(): React.JSX.Element {
  // Banner-only prefill: the 6-phase ritual has no single text input
  // to seed, so we surface the visible-confirmation ribbon and let
  // the ritual phases pick up `mood_label` / `trigger_summary` /
  // `intensity` in a follow-up. Showing the banner upholds the
  // INPUT_TO_TOOL "no silent prefill" contract today.
  const voice = useVoicePrefill<{
    mood_label?: string;
    trigger_summary?: string;
    intensity?: number;
  }>('EMOTIONAL_RESET');

  const label =
    voice.prefill?.trigger_summary ??
    voice.prefill?.mood_label ??
    'your reflection';

  return (
    <View style={styles.root}>
      {voice.isVoicePrefilled && (
        <View style={styles.banner} pointerEvents="box-none">
          <VoicePrefillBanner label={label} onDismiss={voice.acknowledge} />
        </View>
      )}
      <EmotionalResetScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  banner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
});
