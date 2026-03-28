/**
 * KarmaPhaseTracker — 4-phase horizontal progress indicator.
 *
 * Shows circles connected by lines for each ritual phase.
 * Completed phases display a gold-filled circle with checkmark,
 * the active phase pulses, and upcoming phases are dimmed.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { Text, LotusProgress, colors, spacing } from '@kiaanverse/ui';

const PHASE_LABELS = ['Acknowledge', 'Understand', 'Release', 'Renew'] as const;

interface KarmaPhaseTrackerProps {
  readonly currentPhase: 1 | 2 | 3 | 4;
  readonly completedPhases: number[];
}

function PhaseCircle({
  index,
  isCompleted,
  isActive,
}: {
  index: number;
  isCompleted: boolean;
  isActive: boolean;
}): React.JSX.Element {
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        true,
      );
    } else {
      pulseScale.value = withTiming(1, { duration: 300 });
    }
  }, [isActive, pulseScale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const circleColor = isCompleted
    ? colors.primary[500]
    : isActive
      ? 'transparent'
      : colors.alpha.whiteLight;

  const borderColor = isCompleted || isActive ? colors.primary[500] : colors.alpha.whiteLight;

  return (
    <View style={styles.phaseItem}>
      <Animated.View
        style={[
          styles.circle,
          { backgroundColor: circleColor, borderColor },
          animatedStyle,
        ]}
      >
        {isCompleted ? (
          <Text variant="caption" color={colors.background.dark} align="center">
            ✓
          </Text>
        ) : (
          <Text
            variant="caption"
            color={isActive ? colors.primary[300] : colors.text.muted}
            align="center"
          >
            {index + 1}
          </Text>
        )}
      </Animated.View>
      <Text
        variant="caption"
        color={isCompleted || isActive ? colors.primary[300] : colors.text.muted}
        align="center"
      >
        {PHASE_LABELS[index]}
      </Text>
    </View>
  );
}

function ConnectorLine({ isFilled }: { isFilled: boolean }): React.JSX.Element {
  const width = useSharedValue(isFilled ? 1 : 0);

  useEffect(() => {
    width.value = withTiming(isFilled ? 1 : 0, { duration: 500 });
  }, [isFilled, width]);

  const fillStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as `${number}%`,
  }));

  return (
    <View style={styles.connector}>
      <Animated.View style={[styles.connectorFill, fillStyle]} />
    </View>
  );
}

export function KarmaPhaseTracker({
  currentPhase,
  completedPhases,
}: KarmaPhaseTrackerProps): React.JSX.Element {
  // Calculate lotus progress based on current phase
  const PHASE_PROGRESS_MAP: Record<number, number> = {
    1: 0.25,
    2: 0.5,
    3: 0.75,
    4: 1.0,
  };
  const phaseProgress = PHASE_PROGRESS_MAP[currentPhase] ?? 0;

  return (
    <View style={styles.outerContainer}>
      <View style={styles.container}>
        {PHASE_LABELS.map((_, index) => {
          const phaseNum = index + 1;
          const isCompleted = completedPhases.includes(phaseNum);
          const isActive = currentPhase === phaseNum;
          const showConnector = index < PHASE_LABELS.length - 1;
          const isConnectorFilled = completedPhases.includes(phaseNum);

          return (
            <React.Fragment key={phaseNum}>
              <PhaseCircle index={index} isCompleted={isCompleted} isActive={isActive} />
              {showConnector && <ConnectorLine isFilled={isConnectorFilled} />}
            </React.Fragment>
          );
        })}
      </View>
      <View style={styles.lotusContainer}>
        <LotusProgress progress={phaseProgress} size={60} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    alignItems: 'center',
    gap: spacing.md,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  lotusContainer: {
    alignItems: 'center',
  },
  phaseItem: {
    alignItems: 'center',
    gap: spacing.xs,
    width: 64,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: colors.alpha.whiteLight,
    marginTop: 15,
    borderRadius: 1,
    overflow: 'hidden',
  },
  connectorFill: {
    height: '100%',
    backgroundColor: colors.primary[500],
  },
});
