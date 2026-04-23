/**
 * SacredTransition — deprecated animation wrapper, now a passthrough.
 *
 * The prior implementation faded + scaled children on every mount /
 * visibility flip, which made tab entries and phase swaps feel like
 * re-loading screens. Per product direction ("make the app intuitive
 * and fluid — no transitions, no re-loads"), the wrapper is kept for
 * API compatibility but renders children immediately with no animation.
 *
 * Existing call sites (journal tab, emotional-reset step runner) keep
 * working unchanged. When `isVisible` is `false` the subtree unmounts
 * via `null` — same observable contract as before, minus the 300–600 ms
 * choreography that triggered the "Entering sacred space" feel.
 */

import React from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';

/** Props for the SacredTransition component. */
export interface SacredTransitionProps {
  /** Content to wrap. Rendered immediately when `isVisible` is true. */
  readonly children: React.ReactNode;
  /** Whether the content should be visible. When false, children are unmounted. */
  readonly isVisible: boolean;
  /** Optional container style override. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

function SacredTransitionComponent({
  children,
  isVisible,
  style,
  testID,
}: SacredTransitionProps): React.JSX.Element | null {
  if (!isVisible) return null;
  return (
    <View style={[styles.container, style]} testID={testID}>
      {children}
    </View>
  );
}

/** Passthrough wrapper — no animation, no re-entry flash. */
export const SacredTransition = React.memo(SacredTransitionComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
