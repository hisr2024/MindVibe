/**
 * PhaseCeremony — the container that renders one phase at a time and
 * performs the 1400 ms lotus-bloom transition when the phase changes.
 *
 * Transition choreography (total: 1400 ms):
 *   0–500 ms : outgoing phase exits — scale 1.0 → 1.06, opacity 1 → 0
 *   500–900 ms : brief all-black interlude holds the sankalpa
 *   900–1400 ms: incoming phase enters — scale 0.94 → 1.0, opacity 0 → 1
 *
 * The component takes a `phaseKey` (any stable identifier) and the
 * child node to render for that phase. When `phaseKey` changes, the
 * children currently on screen animate out and the new children animate
 * in. No intermediate state is leaked between phases — each receives a
 * fresh mount.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/** Total ceremony duration — 1.4 s of ceremonial hush between phases. */
export const CEREMONY_DURATION_MS = 1400;
const PHASE_OUT_MS = 500;
const INTERLUDE_MS = 400;
const PHASE_IN_MS = 500;

const LOTUS_BLOOM = Easing.bezier(0.22, 1, 0.36, 1);

export interface PhaseCeremonyProps {
  /** Identifier for the current phase — when it changes, ceremony fires. */
  readonly phaseKey: string;
  /** Children rendered for the current phase. */
  readonly children: React.ReactNode;
  /** Optional outer container style. */
  readonly style?: ViewStyle;
}

function PhaseCeremonyInner({
  phaseKey,
  children,
  style,
}: PhaseCeremonyProps): React.JSX.Element {
  // `rendered` is the phase currently mounted in the tree. We only swap
  // its content after the outgoing animation has finished, so the React
  // unmount happens AFTER the user has visually lost the prior screen.
  const [rendered, setRendered] = useState({ key: phaseKey, node: children });

  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (phaseKey === rendered.key) {
      // Child re-renders (e.g. timer tick) don't re-trigger the ceremony;
      // just mirror the node for the current phase.
      setRendered({ key: phaseKey, node: children });
      return;
    }

    // Outgoing: fade + tiny scale-up, then swap content mid-ceremony,
    // then bloom the incoming children back in.
    opacity.value = withSequence(
      withTiming(0, {
        duration: PHASE_OUT_MS,
        easing: Easing.in(Easing.ease),
      }),
      withDelay(
        INTERLUDE_MS,
        withTiming(1, { duration: PHASE_IN_MS, easing: LOTUS_BLOOM }),
      ),
    );
    scale.value = withSequence(
      withTiming(1.06, {
        duration: PHASE_OUT_MS,
        easing: Easing.in(Easing.ease),
      }),
      withDelay(
        INTERLUDE_MS,
        // Fresh bloom — shrink down and then scale up for the enter.
        withSequence(
          withTiming(0.94, { duration: 1 }),
          withTiming(1, { duration: PHASE_IN_MS, easing: LOTUS_BLOOM }),
        ),
      ),
    );

    // Swap the node after the outgoing + interlude — i.e. right before
    // the incoming animation begins.
    const swapId = setTimeout(() => {
      setRendered({ key: phaseKey, node: children });
    }, PHASE_OUT_MS + INTERLUDE_MS);

    return () => clearTimeout(swapId);
  }, [phaseKey, children, opacity, scale, rendered.key]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={[styles.root, style]}>
      <Animated.View key={rendered.key} style={[styles.fill, animatedStyle]}>
        {rendered.node}
      </Animated.View>
    </View>
  );
}

/** 1400 ms lotus-bloom phase transition wrapper. */
export const PhaseCeremony = React.memo(PhaseCeremonyInner);

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  fill: {
    flex: 1,
  },
});
