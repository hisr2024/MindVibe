/**
 * Onboarding Flow
 *
 * Multi-step onboarding:
 * 1. Language selection
 * 2. Interests / spiritual goals
 * 3. Notification permission
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, Pressable, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Text, Button, Divider, colors, spacing, radii } from '@kiaanverse/ui';
import { useOnboardingStore, useAuthStore, useUserPreferencesStore } from '@kiaanverse/store';
import { locales, type Locale } from '@kiaanverse/i18n';

const INTERESTS = [
  { id: 'meditation', label: 'Meditation', emoji: '🧘' },
  { id: 'gita-study', label: 'Gita Study', emoji: '📖' },
  { id: 'emotional-wellness', label: 'Emotional Wellness', emoji: '💛' },
  { id: 'mindfulness', label: 'Mindfulness', emoji: '🌿' },
  { id: 'anger-management', label: 'Anger Management', emoji: '🔥' },
  { id: 'self-discipline', label: 'Self-Discipline', emoji: '⚡' },
  { id: 'relationships', label: 'Relationships', emoji: '🤝' },
  { id: 'inner-peace', label: 'Inner Peace', emoji: '🕊️' },
] as const;

export default function OnboardingScreen(): React.JSX.Element {
  const router = useRouter();
  const { currentStep, answers, setAnswer, nextStep, prevStep, complete } = useOnboardingStore();
  const { completeOnboarding } = useAuthStore();
  const { setLocale } = useUserPreferencesStore();

  const handleComplete = useCallback(() => {
    if (answers.locale) {
      setLocale(answers.locale);
    }
    complete();
    completeOnboarding();
    router.replace('/(tabs)/home');
  }, [answers.locale, complete, completeOnboarding, setLocale, router]);

  const handleLocaleSelect = useCallback((code: string) => {
    setAnswer('locale', code);
  }, [setAnswer]);

  const handleInterestToggle = useCallback((interestId: string) => {
    const current = answers.interests ?? [];
    const updated = current.includes(interestId)
      ? current.filter((i) => i !== interestId)
      : [...current, interestId];
    setAnswer('interests', updated);
  }, [answers.interests, setAnswer]);

  return (
    <Screen scroll>
      <View style={styles.container}>
        {/* Progress dots */}
        <View style={styles.progressDots}>
          {[0, 1, 2].map((step) => (
            <View
              key={step}
              style={[
                styles.dot,
                step === currentStep && styles.dotActive,
                step < currentStep && styles.dotCompleted,
              ]}
            />
          ))}
        </View>

        {currentStep === 0 ? (
          <View style={styles.stepContainer}>
            <Text variant="h1" align="center">Choose Your Language</Text>
            <Text variant="bodySmall" color={colors.divine.muted} align="center">
              You can change this later in settings
            </Text>
            <FlatList
              data={locales.slice(0, 12)}
              keyExtractor={(item) => item.code}
              numColumns={2}
              scrollEnabled={false}
              contentContainerStyle={styles.localeGrid}
              columnWrapperStyle={styles.localeRow}
              renderItem={({ item }) => (
                <Pressable
                  onPress={() => handleLocaleSelect(item.code)}
                  style={[
                    styles.localeOption,
                    answers.locale === item.code && styles.localeSelected,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: answers.locale === item.code }}
                >
                  <Text variant="label">{item.nativeName}</Text>
                  <Text variant="caption" color={colors.divine.muted}>{item.name}</Text>
                </Pressable>
              )}
            />
            <Button title="Next" onPress={nextStep} />
          </View>
        ) : currentStep === 1 ? (
          <View style={styles.stepContainer}>
            <Text variant="h1" align="center">What Interests You?</Text>
            <Text variant="bodySmall" color={colors.divine.muted} align="center">
              Select all that resonate with you
            </Text>
            <View style={styles.interestGrid}>
              {INTERESTS.map((interest) => {
                const selected = (answers.interests ?? []).includes(interest.id);
                return (
                  <Pressable
                    key={interest.id}
                    onPress={() => handleInterestToggle(interest.id)}
                    style={[
                      styles.interestOption,
                      selected && styles.interestSelected,
                    ]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: selected }}
                  >
                    <Text variant="h3" align="center">{interest.emoji}</Text>
                    <Text variant="caption" align="center">{interest.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={styles.buttonRow}>
              <Button title="Back" variant="ghost" onPress={prevStep} />
              <Button title="Next" onPress={nextStep} />
            </View>
          </View>
        ) : (
          <View style={styles.stepContainer}>
            <Text variant="h1" align="center">Stay Connected</Text>
            <Text variant="body" color={colors.divine.muted} align="center">
              Get daily spiritual reminders, journey updates, and wisdom from the Gita.
            </Text>
            <View style={styles.notificationPreview}>
              <Text variant="sacred" color={colors.gold[400]} align="center">
                "The soul is neither born, nor does it ever die."
              </Text>
              <Text variant="caption" color={colors.divine.muted} align="center">
                — Bhagavad Gita 2.20
              </Text>
            </View>
            <Button
              title="Enable Notifications"
              onPress={() => {
                setAnswer('notificationsEnabled', true);
                handleComplete();
              }}
            />
            <Button
              title="Maybe Later"
              variant="ghost"
              onPress={() => {
                setAnswer('notificationsEnabled', false);
                handleComplete();
              }}
            />
            <Button title="Back" variant="ghost" onPress={prevStep} />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing['4xl'],
    gap: spacing.xl,
  },
  progressDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.alpha.whiteLight,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.gold[500],
  },
  dotCompleted: {
    backgroundColor: colors.gold[700],
  },
  stepContainer: {
    gap: spacing.xl,
  },
  localeGrid: {
    gap: spacing.md,
  },
  localeRow: {
    gap: spacing.md,
  },
  localeOption: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
    gap: 2,
  },
  localeSelected: {
    borderColor: colors.gold[500],
    backgroundColor: colors.alpha.goldLight,
  },
  interestGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  interestOption: {
    width: '47%',
    padding: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
    alignItems: 'center',
    gap: spacing.xs,
  },
  interestSelected: {
    borderColor: colors.gold[500],
    backgroundColor: colors.alpha.goldLight,
  },
  notificationPreview: {
    padding: spacing['2xl'],
    gap: spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'center',
  },
});
