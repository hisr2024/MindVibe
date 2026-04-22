/**
 * ArrivalPhase — Entry ritual, transition into sacred space.
 *
 * Mirrors Phase 0 of the web flow: a sacred ripple followed by an OM
 * loader that reads "Entering sacred space…" Auto-advances after a short
 * delay so users never feel stuck on a loading screen.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { OmLoader } from '@kiaanverse/ui';

interface ArrivalPhaseProps {
  onComplete: () => void;
}

export function ArrivalPhase({ onComplete }: ArrivalPhaseProps): React.JSX.Element {
  useEffect(() => {
    const t = setTimeout(onComplete, 1600);
    return () => clearTimeout(t);
  }, [onComplete]);

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.root}>
      <View style={styles.loaderWrap}>
        <OmLoader size={64} label="Entering sacred space…" />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderWrap: {
    alignItems: 'center',
    gap: 12,
  },
});
