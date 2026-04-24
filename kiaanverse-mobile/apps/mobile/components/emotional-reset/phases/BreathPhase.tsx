/**
 * BreathPhase — The Breath Ritual.
 *
 * Immersive full-bleed pranayama session. Pattern is chosen by the
 * intensity the user entered in Phase 1 (mandala). A skip link appears
 * after 5s in case the user wants to move forward.
 *
 * Mirrors Phase 3 of the web flow.
 */

import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BreathMandala } from '../visuals/BreathMandala';
import { breathPatternForIntensity } from '../types';

interface BreathPhaseProps {
  intensity: number;
  onComplete: () => void;
}

export function BreathPhase({
  intensity,
  onComplete,
}: BreathPhaseProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [showSkip, setShowSkip] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), 5000);
    return () => clearTimeout(t);
  }, []);

  const pattern = breathPatternForIntensity(intensity);

  return (
    <View
      style={[
        styles.root,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <Text style={styles.eyebrow}>Sacred Breath Purification</Text>

      <BreathMandala
        pattern={pattern}
        rounds={4}
        onComplete={() => {
          void Haptics.notificationAsync(
            Haptics.NotificationFeedbackType.Success
          );
          onComplete();
        }}
      />

      {showSkip ? (
        <Animated.View entering={FadeIn.duration(400)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip breathing"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onComplete();
            }}
            style={({ pressed }) => [styles.skip, pressed && { opacity: 0.6 }]}
          >
            <Text style={styles.skipText}>Skip breathing</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 28,
    paddingHorizontal: 20,
  },
  eyebrow: {
    fontSize: 10,
    color: 'rgba(237,232,220,0.45)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  skip: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 12,
    color: 'rgba(237,232,220,0.45)',
    letterSpacing: 0.3,
  },
});
