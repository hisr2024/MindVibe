/**
 * Step 1: Welcome — "Meet Sakha, Your Divine Companion"
 *
 * Animated SakhaAvatar intro with a gentle breathing aura.
 * No skip option on this step — it's the entry point.
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Text, SakhaAvatar, GoldenButton, colors, spacing } from '@kiaanverse/ui';

interface WelcomeStepProps {
  readonly onNext: () => void;
}

export function WelcomeStep({ onNext }: WelcomeStepProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      <Animated.View entering={FadeInDown.duration(800).delay(200)} style={styles.avatarWrap}>
        <SakhaAvatar size={140} state="idle" name="Sakha" />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(600).delay(500)} style={styles.textWrap}>
        <Text variant="h1" align="center">
          Meet Sakha
        </Text>
        <Text variant="body" color={colors.text.secondary} align="center">
          Your divine companion on the path to inner peace, guided by the
          timeless wisdom of the Bhagavad Gita.
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(600).delay(800)} style={styles.ctaWrap}>
        <GoldenButton
          title="Begin Your Journey"
          variant="divine"
          onPress={onNext}
          testID="welcome-next"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.xxl,
  },
  avatarWrap: {
    alignItems: 'center',
  },
  textWrap: {
    gap: spacing.md,
    alignItems: 'center',
  },
  ctaWrap: {
    width: '100%',
  },
});
