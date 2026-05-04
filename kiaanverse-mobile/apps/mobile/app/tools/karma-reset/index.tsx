/**
 * Karma Reset — Expo Router entry.
 *
 * Single immersive screen that owns all six phases of the ritual
 * (entry → context → reflection → wisdom → sankalpa → seal). Gesture
 * navigation is disabled by the parent `_layout` so the user can't
 * accidentally swipe out mid-ceremony.
 *
 * All state, animation, API calls and navigation-at-completion live
 * in `<KarmaResetScreen>`; this file's only job is to render it.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { KarmaResetScreen } from '../../../components/karma-reset/KarmaResetScreen';
import { VoicePrefillBanner } from '../../../voice/components/VoicePrefillBanner';
import { useVoicePrefill } from '../../../voice/hooks/useVoicePrefill';

export default function KarmaResetRoute(): React.JSX.Element {
  const voice = useVoicePrefill<{
    pattern_summary?: string;
    duration_label?: string;
    mood_label?: string;
  }>('KARMA_RESET');

  const label =
    voice.prefill?.pattern_summary ??
    voice.prefill?.mood_label ??
    'the pattern you named';

  return (
    <View style={styles.root}>
      {voice.isVoicePrefilled && (
        <View style={styles.banner} pointerEvents="box-none">
          <VoicePrefillBanner label={label} onDismiss={voice.acknowledge} />
        </View>
      )}
      <KarmaResetScreen />
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
