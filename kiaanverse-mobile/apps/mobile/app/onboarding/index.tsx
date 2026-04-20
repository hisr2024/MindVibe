/**
 * Onboarding Flow — 5-step swipeable experience
 *
 * Steps:
 * 1. Welcome — meet Sakha (animated avatar intro)
 * 2. Purpose — multi-select spiritual goals
 * 3. Gita Familiarity — slider (never read → scholar)
 * 4. Daily Practice — time picker for daily reminder
 * 5. Ready — golden CTA + notification permission
 *
 * Features:
 * - Animated horizontal slide transitions (Reanimated)
 * - PanGestureHandler for swipe navigation
 * - Progress dots at top
 * - Back = previous step (not router back)
 * - Skip option on steps 2–4
 * - Persists answers to Zustand + POST /user/preferences
 */

import React, { useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import { Screen, colors, spacing } from '@kiaanverse/ui';
import {
  useOnboardingStore,
  useAuthStore,
  useUserPreferencesStore,
} from '@kiaanverse/store';

import { api } from '@kiaanverse/api';
import {
  registerPushToken,
  scheduleDailyVerse,
  scheduleStreakAlert,
} from '../../services/notificationService';

import { WelcomeStep } from './steps/WelcomeStep';
import { PurposeStep } from './steps/PurposeStep';
import { GitaFamiliarityStep } from './steps/GitaFamiliarityStep';
import { DailyPracticeStep } from './steps/DailyPracticeStep';
import { ReadyStep } from './steps/ReadyStep';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TOTAL_STEPS = 5;
const SWIPE_THRESHOLD = 50;

// ---------------------------------------------------------------------------
// Progress Dots
// ---------------------------------------------------------------------------

function ProgressDots({ current, total }: { current: number; total: number }): React.JSX.Element {
  return (
    <View style={styles.dotsRow}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            i === current && styles.dotActive,
            i < current && styles.dotCompleted,
          ]}
          accessibilityLabel={`Step ${i + 1} of ${total}${i === current ? ', current' : ''}`}
        />
      ))}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function OnboardingScreen(): React.JSX.Element {
  const { width: _screenWidth } = useWindowDimensions();
  const router = useRouter();

  const {
    currentStep,
    answers,
    setAnswer,
    nextStep,
    prevStep,
    complete,
  } = useOnboardingStore();
  const { completeOnboarding } = useAuthStore();
  const { setNotifications } = useUserPreferencesStore();

  // Slide animation offset
  const translateX = useSharedValue(0);

  // -----------------------------------------------------------------------
  // Navigation helpers
  // -----------------------------------------------------------------------

  const goNext = useCallback(() => {
    if (currentStep >= TOTAL_STEPS - 1) return;
    // Slide out left, then snap to next step
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    nextStep();
  }, [currentStep, nextStep, translateX]);

  const goPrev = useCallback(() => {
    if (currentStep <= 0) return;
    translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
    prevStep();
  }, [currentStep, prevStep, translateX]);

  // -----------------------------------------------------------------------
  // Swipe gesture
  // -----------------------------------------------------------------------

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((event) => {
      // Clamp: don't let user swipe right past first step or left past last
      if (currentStep === 0 && event.translationX > 0) {
        translateX.value = event.translationX * 0.3; // rubber-band
      } else if (currentStep === TOTAL_STEPS - 1 && event.translationX < 0) {
        translateX.value = event.translationX * 0.3;
      } else {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX < -SWIPE_THRESHOLD && currentStep < TOTAL_STEPS - 1) {
        // Swipe left → next step
        runOnJS(goNext)();
      } else if (event.translationX > SWIPE_THRESHOLD && currentStep > 0) {
        // Swipe right → previous step
        runOnJS(goPrev)();
      } else {
        // Snap back
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  // -----------------------------------------------------------------------
  // Step-specific callbacks
  // -----------------------------------------------------------------------

  const handlePurposeToggle = useCallback(
    (id: string) => {
      const current = answers.purposes ?? [];
      const updated = current.includes(id)
        ? current.filter((p) => p !== id)
        : [...current, id];
      setAnswer('purposes', updated);
    },
    [answers.purposes, setAnswer],
  );

  const handleGitaChange = useCallback(
    (value: number) => {
      setAnswer('gitaFamiliarity', value);
    },
    [setAnswer],
  );

  const handlePracticeTimeChange = useCallback(
    (time: string) => {
      setAnswer('dailyPracticeTime', time);
    },
    [setAnswer],
  );

  const handleComplete = useCallback(
    (notificationsEnabled: boolean) => {
      setAnswer('notificationsEnabled', notificationsEnabled);

      // Update user preferences store
      if (answers.dailyPracticeTime) {
        setNotifications({
          dailyReminder: true,
          reminderTime: answers.dailyPracticeTime,
        });
      }
      if (notificationsEnabled) {
        setNotifications({ dailyReminder: true });
      }

      complete();
      completeOnboarding();

      // Register push token and schedule initial notifications (fire-and-forget)
      if (notificationsEnabled) {
        void (async () => {
          try {
            await registerPushToken();

            const timeStr = answers.dailyPracticeTime ?? '08:00';
            const [hourStr, minuteStr] = timeStr.split(':');
            const hour = parseInt(hourStr ?? '8', 10);
            const minute = parseInt(minuteStr ?? '0', 10);
            await scheduleDailyVerse(hour, minute);
            await scheduleStreakAlert();

            // Sync notification preferences to backend
            await api.notifications.updatePreferences({
              push_enabled: true,
              daily_checkin_reminder: true,
              journey_step_reminder: true,
              streak_encouragement: true,
              weekly_reflection: true,
            });
          } catch {
            // Non-critical — notifications will be retried on next app launch
          }
        })();
      }

      router.replace('/(tabs)');
    },
    [
      answers.dailyPracticeTime,
      complete,
      completeOnboarding,
      router,
      setAnswer,
      setNotifications,
    ],
  );

  // -----------------------------------------------------------------------
  // Render current step
  // -----------------------------------------------------------------------

  function renderStep(): React.JSX.Element {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={goNext} />;
      case 1:
        return (
          <PurposeStep
            selected={answers.purposes ?? []}
            onToggle={handlePurposeToggle}
            onNext={goNext}
            onSkip={goNext}
          />
        );
      case 2:
        return (
          <GitaFamiliarityStep
            value={answers.gitaFamiliarity ?? 0}
            onChange={handleGitaChange}
            onNext={goNext}
            onSkip={goNext}
          />
        );
      case 3:
        return (
          <DailyPracticeStep
            value={answers.dailyPracticeTime ?? '08:00'}
            onChange={handlePracticeTimeChange}
            onNext={goNext}
            onSkip={goNext}
          />
        );
      case 4:
        return <ReadyStep onComplete={handleComplete} />;
      default:
        return <WelcomeStep onNext={goNext} />;
    }
  }

  return (
    <Screen>
      <View style={styles.container}>
        <ProgressDots current={currentStep} total={TOTAL_STEPS} />

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.stepContainer, animatedStyle]}>
            {renderStep()}
          </Animated.View>
        </GestureDetector>
      </View>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: spacing.xl,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.alpha.whiteLight,
  },
  dotActive: {
    width: 24,
    backgroundColor: colors.primary[500],
    borderRadius: 4,
  },
  dotCompleted: {
    backgroundColor: colors.primary[700],
  },
  stepContainer: {
    flex: 1,
  },
});
