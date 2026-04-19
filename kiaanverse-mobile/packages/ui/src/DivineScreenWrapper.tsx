/**
 * DivineScreenWrapper — The Sacred Foundation for EVERY screen.
 *
 * Usage:
 *
 *   export default function SomeScreen() {
 *     return (
 *       <DivineScreenWrapper>
 *         <YourContent />
 *       </DivineScreenWrapper>
 *     );
 *   }
 *
 * Z-order (bottom → top):
 *
 *   1. SacredGradientBackground   (flat cosmos gradient)
 *   2. DivineCelestialBackground  (animated Skia particle field)
 *   3. children                   (your screen content, safe-area inset)
 *
 * Chrome:
 *   - StatusBar is translucent so the gradient flows under it.
 *   - `style="light"` by default — the cosmic bg is dark, so light
 *     status-bar glyphs keep gold/white UI legible from top-to-bottom.
 *   - Callers needing a light (non-cosmic) backdrop can override via
 *     the `statusBarStyle` prop.
 *
 * Safe area:
 *   - SafeAreaView from react-native-safe-area-context handles top,
 *     left, and right insets (bottom is owned by the tab bar / mini
 *     player in this app, so it's deliberately excluded by default).
 */

import React from 'react';
import { StyleSheet, View, type ViewStyle, type StyleProp } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar, type StatusBarStyle } from 'expo-status-bar';
import { DivineCelestialBackground } from './DivineCelestialBackground';
import { SacredGradientBackground } from './SacredGradientBackground';

export interface DivineScreenWrapperProps {
  readonly children: React.ReactNode;
  /**
   * Safe-area edges to respect. Omits `'bottom'` by default because
   * the global tab bar / mini-player manage that inset.
   * @default ['top', 'left', 'right']
   */
  readonly edges?: readonly Edge[];
  /**
   * StatusBar style. Default `'light'` (white glyphs) because the
   * cosmic gradient is dark.
   * @default 'light'
   */
  readonly statusBarStyle?: StatusBarStyle;
  /**
   * Disable the animated particle field for low-power or reduced-motion
   * contexts (respects user accessibility preference at call sites).
   * @default false
   */
  readonly disableParticles?: boolean;
  /**
   * Optional outer style — rarely needed; prefer wrapping children.
   */
  readonly style?: StyleProp<ViewStyle>;
  /**
   * Override the default safe-area content container style.
   */
  readonly contentStyle?: StyleProp<ViewStyle>;
}

const DEFAULT_EDGES: readonly Edge[] = ['top', 'left', 'right'];

function DivineScreenWrapperInner({
  children,
  edges = DEFAULT_EDGES,
  statusBarStyle = 'light',
  disableParticles = false,
  style,
  contentStyle,
}: DivineScreenWrapperProps): React.JSX.Element {
  return (
    <View style={[styles.root, style]}>
      {/* Layer 1 — cosmic gradient, full bleed */}
      <SacredGradientBackground />

      {/* Layer 2 — animated particle field, full bleed, non-interactive */}
      {!disableParticles ? <DivineCelestialBackground /> : null}

      {/* Layer 3 — translucent status bar lets the gradient bleed through */}
      <StatusBar style={statusBarStyle} translucent backgroundColor="transparent" />

      {/* Layer 4 — content respects safe-area insets */}
      <SafeAreaView
        edges={[...edges]}
        style={[styles.safeArea, contentStyle]}
      >
        {children}
      </SafeAreaView>
    </View>
  );
}

export const DivineScreenWrapper = React.memo(DivineScreenWrapperInner);

const styles = StyleSheet.create({
  root: {
    flex: 1,
    // Explicit fallback color prevents a single-frame white flash on
    // cold start before the gradient mounts on slower devices.
    backgroundColor: '#050714',
  },
  safeArea: {
    flex: 1,
  },
});
