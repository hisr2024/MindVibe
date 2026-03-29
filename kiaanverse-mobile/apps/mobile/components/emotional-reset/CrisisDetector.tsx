/**
 * CrisisDetector — Safety overlay shown when emotional intensity is dangerously
 * high (>= 9) or crisis keywords are detected in user input.
 *
 * Displays calming reassurance, emergency helpline numbers, and options to
 * speak with the Sakha companion or dismiss and continue. The overlay uses
 * a semi-transparent dark backdrop with gentle fade-in animation.
 *
 * This component prioritizes user safety above all feature considerations.
 */

import React from 'react';
import { View, StyleSheet, Linking, ScrollView } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Text, GoldenButton, colors, spacing, radii } from '@kiaanverse/ui';

// ---------------------------------------------------------------------------
// Types & Data
// ---------------------------------------------------------------------------

interface CrisisDetectorProps {
  /** Callback to dismiss the overlay and continue with the reset flow. */
  readonly onDismiss: () => void;
}

interface Helpline {
  readonly name: string;
  readonly number: string;
  readonly description: string;
}

/** Emergency helplines — configurable per region in production. */
const HELPLINES: readonly Helpline[] = [
  {
    name: 'iCall',
    number: '9152987821',
    description: 'Psychosocial helpline (Mon-Sat, 8am-10pm)',
  },
  {
    name: 'Vandrevala Foundation',
    number: '18602662345',
    description: '24/7 mental health support',
  },
  {
    name: 'AASRA',
    number: '9820466726',
    description: 'Crisis intervention (24/7)',
  },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CrisisDetector({ onDismiss }: CrisisDetectorProps): React.JSX.Element {
  const router = useRouter();

  const handleCall = (number: string): void => {
    Linking.openURL(`tel:${number}`);
  };

  const handleTalkToSakha = (): void => {
    onDismiss();
    router.push('/chat');
  };

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.overlay}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.delay(200).duration(500)} style={styles.card}>
          {/* Reassurance header */}
          <Text variant="h2" color={colors.divine.aura} align="center">
            You Are Not Alone
          </Text>
          <Text
            variant="body"
            color={colors.text.secondary}
            align="center"
            style={styles.message}
          >
            What you are feeling is intense, and that is okay. You are seen, you
            are heard, and support is available right now.
          </Text>

          {/* Breathing suggestion */}
          <View style={styles.breathingCard}>
            <Text variant="bodySmall" color={colors.primary[300]} align="center">
              Take a slow breath in... hold... and release. You are safe in this moment.
            </Text>
          </View>

          {/* Helplines */}
          <Text variant="label" color={colors.text.primary} style={styles.sectionTitle}>
            Reach Out for Support
          </Text>
          {HELPLINES.map((helpline) => (
            <Pressable
              key={helpline.number}
              onPress={() => handleCall(helpline.number)}
              style={styles.helplineRow}
              accessibilityRole="button"
              accessibilityLabel={`Call ${helpline.name} at ${helpline.number}`}
            >
              <View style={styles.helplineInfo}>
                <Text variant="label" color={colors.text.primary}>
                  {helpline.name}
                </Text>
                <Text variant="caption" color={colors.text.muted}>
                  {helpline.description}
                </Text>
              </View>
              <Text variant="body" color={colors.primary[500]}>
                {helpline.number}
              </Text>
            </Pressable>
          ))}

          {/* Actions */}
          <GoldenButton
            title="Talk to Sakha"
            onPress={handleTalkToSakha}
            style={styles.sakhaButton}
            testID="crisis-sakha-btn"
          />
          <Pressable
            onPress={onDismiss}
            style={styles.dismissButton}
            accessibilityRole="button"
            accessibilityLabel="Dismiss and continue"
          >
            <Text variant="bodySmall" color={colors.text.muted} align="center">
              I'm Okay, Continue
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    zIndex: 100,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xxl,
  },
  card: {
    backgroundColor: colors.background.card,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    padding: spacing.xl,
    shadowColor: colors.divine.aura,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  message: {
    marginTop: spacing.md,
    lineHeight: 24,
  },
  breathingCard: {
    marginTop: spacing.lg,
    backgroundColor: colors.alpha.goldLight,
    borderRadius: radii.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
  },
  sectionTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  helplineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.alpha.whiteLight,
  },
  helplineInfo: {
    flex: 1,
    marginRight: spacing.md,
  },
  sakhaButton: {
    marginTop: spacing.xl,
  },
  dismissButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.sm,
  },
});
