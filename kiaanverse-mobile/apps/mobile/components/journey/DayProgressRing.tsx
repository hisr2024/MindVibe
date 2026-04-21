/**
 * DayProgressRing — Skia circular progress arc for the journey detail hero.
 *
 * Renders:
 *   - A faint background track (stroke ring in ripu color @ 14 % alpha).
 *   - A bright foreground arc (3.5 px stroke, round cap, in the ripu
 *     color) spanning 0 → 360° as the ratio of completed / total days.
 *   - Centered labels: the day count in CormorantGaramond-BoldItalic,
 *     "of N" in Outfit, and the ripu's Sanskrit name in its own color.
 *
 * The arc uses Skia's `Path.addArc()` which renders beautifully
 * anti-aliased at any screen density. We draw the final ratio directly
 * (no in-ring animation) because the surrounding hero already fades
 * in and a ring that "fills up" on every remount would distract from
 * the detail card's reveal.
 */

import React, { useMemo } from 'react';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';

import { NEUTRAL_ACCENT, ripuAlpha } from './ripus';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.7)';

export interface DayProgressRingProps {
  /** Completed step count (0 ≤ completed ≤ total). */
  readonly completed: number;
  /** Total days in the journey. */
  readonly total: number;
  /** Accent color for the arc + labels. @default NEUTRAL_ACCENT */
  readonly color?: string;
  /** Optional Sanskrit label rendered beneath the day count. */
  readonly sanskrit?: string;
  /** Outer diameter in points. @default 100 */
  readonly size?: number;
  /** Optional style override. */
  readonly style?: ViewStyle;
  /** Test identifier. */
  readonly testID?: string;
}

function DayProgressRingInner({
  completed,
  total,
  color = NEUTRAL_ACCENT,
  sanskrit,
  size = 100,
  style,
  testID,
}: DayProgressRingProps): React.JSX.Element {
  const safeTotal = Math.max(1, total);
  const ratio = Math.max(0, Math.min(1, completed / safeTotal));

  const stroke = 3.5;
  const radius = size / 2 - stroke;
  const cx = size / 2;
  const cy = size / 2;

  const trackPath = useMemo(() => {
    const p = Skia.Path.Make();
    p.addCircle(cx, cy, radius);
    return p;
  }, [cx, cy, radius]);

  // Foreground arc — sweep starts at -90° so "0%" sits at 12 o'clock.
  const arcPath = useMemo(() => {
    const p = Skia.Path.Make();
    if (ratio <= 0) return p;
    p.addArc(
      {
        x: cx - radius,
        y: cy - radius,
        width: radius * 2,
        height: radius * 2,
      },
      -90,
      360 * ratio,
    );
    return p;
  }, [cx, cy, radius, ratio]);

  const trackColor = ripuAlpha(color, 0.14);

  return (
    <View
      style={[styles.container, { width: size, height: size }, style]}
      testID={testID}
      accessibilityRole="progressbar"
      accessibilityLabel={`Day ${completed} of ${total}`}
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Path
          path={trackPath}
          color={trackColor}
          style="stroke"
          strokeWidth={stroke}
        />
        <Path
          path={arcPath}
          color={color}
          style="stroke"
          strokeWidth={stroke}
          strokeCap="round"
        />
      </Canvas>

      <View style={styles.labelWrap} pointerEvents="none">
        <Text style={styles.dayNumber} allowFontScaling={false}>
          {completed}
        </Text>
        <Text style={styles.dayOf} allowFontScaling={false}>
          of {total}
        </Text>
        {sanskrit ? (
          <Text
            style={[styles.sanskrit, { color }]}
            numberOfLines={1}
            allowFontScaling={false}
          >
            {sanskrit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

/** Skia circular progress ring, tinted per ripu. */
export const DayProgressRing = React.memo(DayProgressRingInner);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumber: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 28,
    color: SACRED_WHITE,
    lineHeight: 30,
    letterSpacing: 0.3,
  },
  dayOf: {
    fontFamily: 'Outfit-Regular',
    fontSize: 10,
    color: TEXT_MUTED,
    letterSpacing: 0.6,
    marginTop: 2,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 11,
    lineHeight: 18,
    marginTop: 2,
  },
});
