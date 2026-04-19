/**
 * DivineScreenWrapper — the universal divine frame for every screen.
 *
 * Layer stack (bottom → top):
 *   1. Solid muhurta-coloured background
 *   2. DivineCelestialBackground (Skia particle field)
 *   3. AuroraLayer (three drifting gradient forms)
 *   4. Optional SafeAreaView
 *   5. Screen children
 *
 * Because the background is mounted once per navigator (ideally at the root
 * layout), it persists across route changes and never flickers.
 *
 * Usage:
 *   <DivineScreenWrapper>
 *     <HomeScreen />
 *   </DivineScreenWrapper>
 */

import React from 'react';
import { StatusBar, StyleSheet, View, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { AuroraLayer } from './AuroraLayer';
import { DivineCelestialBackground } from './DivineCelestialBackground';
import { useTimeOfDay } from './useTimeOfDay';
import { TIME_OF_DAY_ATMOSPHERE } from './tokens/background';

export interface DivineScreenWrapperProps {
  readonly children: React.ReactNode;
  /** Wrap content in SafeAreaView with top/left/right edges. Default true. */
  readonly safeArea?: boolean | undefined;
  /** Safe-area edges (only used when `safeArea` is true). */
  readonly edges?: Edge[] | undefined;
  /** Container style override (applied to the outer wrapper). */
  readonly style?: ViewStyle | undefined;
  /** Child container style override. */
  readonly contentStyle?: ViewStyle | undefined;
  /** Manually force a muhurta (useful for screenshots / previews). */
  readonly forceTimeOfDay?: keyof typeof TIME_OF_DAY_ATMOSPHERE | undefined;
  /** Disable the aurora layer (unit tests, low-power mode). */
  readonly disableAurora?: boolean | undefined;
  /** Disable the particle field (unit tests, low-power mode). */
  readonly disableParticles?: boolean | undefined;
}

function DivineScreenWrapperComponent({
  children,
  safeArea = true,
  edges = ['top', 'left', 'right'],
  style,
  contentStyle,
  forceTimeOfDay,
  disableAurora = false,
  disableParticles = false,
}: DivineScreenWrapperProps): React.JSX.Element {
  const detected = useTimeOfDay();
  const timeOfDay = forceTimeOfDay ?? detected;
  const atmosphere = TIME_OF_DAY_ATMOSPHERE[timeOfDay];

  const content = safeArea ? (
    <SafeAreaView edges={edges} style={[styles.safeArea, contentStyle]}>
      {children}
    </SafeAreaView>
  ) : (
    <View style={[styles.safeArea, contentStyle]}>{children}</View>
  );

  return (
    <View style={[styles.container, style]}>
      <StatusBar
        translucent
        barStyle="light-content"
        backgroundColor="transparent"
      />

      {!disableParticles && (
        <DivineCelestialBackground
          backgroundColor={atmosphere.background}
          opacityMultiplier={atmosphere.opacityMultiplier}
          particleCount={atmosphere.particleCount}
        />
      )}

      {!disableAurora && (
        <AuroraLayer dominantAuroraKey={atmosphere.dominantAuroraKey} />
      )}

      {content}
    </View>
  );
}

export const DivineScreenWrapper = React.memo(DivineScreenWrapperComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#05050F',
  },
  safeArea: {
    flex: 1,
  },
});
