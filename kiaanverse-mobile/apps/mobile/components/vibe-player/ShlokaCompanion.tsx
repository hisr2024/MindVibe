/**
 * ShlokaCompanion — collapsible verse attached to a currently-playing track.
 *
 * When the track has an associated Gita verse, this component reveals it
 * beneath the playback controls. The companion is expanded while the
 * audio is playing and collapses (with a soft fade + height tween) the
 * moment the user pauses — signalling that the verse is meant to be
 * contemplated alongside the sound.
 *
 * We use a manual `maxHeight` Reanimated interpolation so the collapse
 * does not require `LayoutAnimation` (which misbehaves inside nested
 * scroll views on Android).
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ShlokaCard, type ShlokaCardProps } from '@kiaanverse/ui';

const GOLD = '#D4A017';
const TEXT_MUTED = 'rgba(200,191,168,0.6)';

export interface ShlokaCompanionProps extends ShlokaCardProps {
  /** Show (expanded) when true; hide (collapsed) when false. */
  readonly expanded: boolean;
  /** Estimated rendered height of the inner card — used to drive the
   *  collapse animation. @default 260 */
  readonly estimatedHeight?: number;
}

function ShlokaCompanionInner({
  expanded,
  estimatedHeight = 260,
  ...shlokaProps
}: ShlokaCompanionProps): React.JSX.Element {
  const progress = useSharedValue(expanded ? 1 : 0);

  useEffect(() => {
    progress.value = withTiming(expanded ? 1 : 0, {
      duration: 360,
      easing: Easing.inOut(Easing.ease),
    });
  }, [expanded, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    maxHeight: interpolate(progress.value, [0, 1], [0, estimatedHeight + 40]),
  }));

  return (
    <Animated.View style={[styles.wrap, animatedStyle]} pointerEvents={expanded ? 'auto' : 'none'}>
      <View style={styles.labelRow}>
        <View style={styles.labelBar} />
        <Text style={styles.label}>VERSE OF THIS MEDITATION</Text>
      </View>
      <ShlokaCard {...shlokaProps} />
    </Animated.View>
  );
}

/** Collapsible shloka card that matches the play/pause state of the audio. */
export const ShlokaCompanion = React.memo(ShlokaCompanionInner);

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
    width: '100%',
    gap: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  labelBar: {
    width: 2,
    height: 12,
    borderRadius: 1,
    backgroundColor: GOLD,
  },
  label: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 1.6,
  },
});
