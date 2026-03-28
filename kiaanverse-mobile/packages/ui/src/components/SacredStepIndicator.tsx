/**
 * SacredStepIndicator — Horizontal step progress with golden styling.
 *
 * A row of circles connected by lines representing journey steps.
 * Completed steps glow gold, the active step pulses, and upcoming
 * steps remain dim outlines. The connecting line fills gold up to
 * the current step.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '../tokens/colors';
import { spacing } from '../tokens/spacing';
import { duration } from '../tokens/motion';

/** Props for the SacredStepIndicator component. */
export interface SacredStepIndicatorProps {
  /** Total number of steps in the journey. */
  readonly totalSteps: number;
  /** Zero-indexed current active step. */
  readonly currentStep: number;
  /** Array of zero-indexed step indices that are completed. */
  readonly completedSteps: number[];
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

/** Diameter of each step circle in points. */
const CIRCLE_SIZE = 28;
/** Height of the connecting line between circles. */
const LINE_HEIGHT = 3;

/**
 * Inner active step dot with pulsing glow animation.
 * Separated so the Reanimated hook lives in its own component scope.
 */
function ActivePulse({ size }: { readonly size: number }): React.JSX.Element {
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(1);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.35, { duration: duration.sacred, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: duration.sacred, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
    pulseOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: duration.sacred, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.0, { duration: duration.sacred, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [pulseScale, pulseOpacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size + 10,
          height: size + 10,
          borderRadius: (size + 10) / 2,
          backgroundColor: colors.alpha.goldMedium,
        },
        animatedStyle,
      ]}
    />
  );
}

function SacredStepIndicatorComponent({
  totalSteps,
  currentStep,
  completedSteps,
  style,
  testID,
}: SacredStepIndicatorProps): React.JSX.Element {
  const completedSet = new Set(completedSteps);

  return (
    <View
      style={[styles.container, style]}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${currentStep + 1} of ${totalSteps}`}
      accessibilityValue={{ min: 0, max: totalSteps, now: currentStep + 1 }}
    >
      {Array.from({ length: totalSteps }, (_, i) => {
        const isCompleted = completedSet.has(i);
        const isActive = i === currentStep;
        const isUpcoming = !isCompleted && !isActive;
        const isLineCompleted = i < currentStep;

        return (
          <React.Fragment key={`step-${i}`}>
            {/* Step circle */}
            <View style={styles.stepWrapper}>
              {isActive && <ActivePulse size={CIRCLE_SIZE} />}
              <View
                style={[
                  styles.circle,
                  isCompleted && styles.circleCompleted,
                  isActive && styles.circleActive,
                  isUpcoming && styles.circleUpcoming,
                ]}
              >
                {isCompleted && <View style={styles.checkmark} />}
                {isActive && <View style={styles.activeDot} />}
              </View>
            </View>

            {/* Connecting line (not after last step) */}
            {i < totalSteps - 1 && (
              <View style={styles.lineWrapper}>
                <View style={styles.lineBackground} />
                {isLineCompleted && <View style={styles.lineFilled} />}
              </View>
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

/** Horizontal step progress indicator with golden styling and pulse animation. */
export const SacredStepIndicator = React.memo(SacredStepIndicatorComponent);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  stepWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    width: CIRCLE_SIZE + 14,
    height: CIRCLE_SIZE + 14,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleCompleted: {
    backgroundColor: colors.primary[500],
    borderWidth: 2,
    borderColor: colors.primary[300],
  },
  circleActive: {
    backgroundColor: colors.primary[700],
    borderWidth: 2,
    borderColor: colors.primary[500],
  },
  circleUpcoming: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.alpha.goldMedium,
  },
  checkmark: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background.dark,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[300],
  },
  lineWrapper: {
    flex: 1,
    height: LINE_HEIGHT,
    minWidth: 16,
    maxWidth: 40,
  },
  lineBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.alpha.goldLight,
    borderRadius: LINE_HEIGHT / 2,
  },
  lineFilled: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.primary[500],
    borderRadius: LINE_HEIGHT / 2,
  },
});
