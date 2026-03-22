/**
 * Welcome Screen
 *
 * First screen users see. Shows brand identity and
 * navigation to login or signup.
 */

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown } from 'react-native-reanimated';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { darkTheme, typography, spacing, radii, colors } from '@theme/tokens';
import { useAccessibility } from '@hooks/useAccessibility';
import type { AuthStackParamList } from '@app-types/index';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const theme = darkTheme;
  const { isReduceMotionEnabled } = useAccessibility();

  const fade = (delay: number) =>
    isReduceMotionEnabled ? undefined : FadeInDown.delay(delay).duration(600);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top + spacing['5xl'],
          paddingBottom: insets.bottom + spacing['3xl'],
        },
      ]}
    >
      {/* Brand */}
      <Animated.View entering={fade(100)} style={styles.brandSection}>
        <Text style={[styles.logoEmoji]}>🕉️</Text>
        <Text style={[styles.logoText, { color: theme.accent }]}>MindVibe</Text>
        <Text style={[styles.tagline, { color: theme.textSecondary }]}>
          Spiritual Wellness{'\n'}Guided by Bhagavad Gita Wisdom
        </Text>
      </Animated.View>

      {/* Features */}
      <Animated.View entering={fade(300)} style={styles.features}>
        {[
          { emoji: '🧘', text: 'Guided spiritual journeys' },
          { emoji: '📖', text: '700 verses of Gita wisdom' },
          { emoji: '🤖', text: 'KIAAN AI companion' },
          { emoji: '🎵', text: 'Sacred audio meditations' },
        ].map(({ emoji, text }) => (
          <View key={text} style={styles.featureRow}>
            <Text style={styles.featureEmoji}>{emoji}</Text>
            <Text style={[styles.featureText, { color: theme.textPrimary }]}>{text}</Text>
          </View>
        ))}
      </Animated.View>

      {/* Actions */}
      <Animated.View entering={fade(500)} style={styles.actions}>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: theme.accent }]}
          onPress={() => navigation.navigate('Signup')}
          accessibilityRole="button"
          accessibilityLabel="Get started with a new account"
          accessibilityHint="Creates a new MindVibe account"
        >
          <Text style={styles.primaryButtonText}>Get Started</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: theme.accent }]}
          onPress={() => navigation.navigate('Login')}
          accessibilityRole="button"
          accessibilityLabel="Sign in to existing account"
          accessibilityHint="Sign into your existing account"
        >
          <Text style={[styles.secondaryButtonText, { color: theme.accent }]}>
            I have an account
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'space-between',
  },
  brandSection: {
    alignItems: 'center',
  },
  logoEmoji: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  logoText: {
    ...typography.h1,
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1.5,
  },
  tagline: {
    ...typography.body,
    textAlign: 'center',
    marginTop: spacing.md,
    lineHeight: 26,
  },
  features: {
    gap: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  featureEmoji: {
    fontSize: 28,
    width: 40,
    textAlign: 'center',
  },
  featureText: {
    ...typography.body,
    flex: 1,
  },
  actions: {
    gap: spacing.md,
  },
  primaryButton: {
    height: 56,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButtonText: {
    ...typography.label,
    color: colors.divine.black,
    fontSize: 17,
    fontWeight: '600',
  },
  secondaryButton: {
    height: 56,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  secondaryButtonText: {
    ...typography.label,
    fontSize: 17,
    fontWeight: '600',
  },
});
