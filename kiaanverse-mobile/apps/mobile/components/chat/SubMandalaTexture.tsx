/**
 * SubMandalaTexture — faint sacred-geometry backdrop for the chat scroll area.
 *
 * A 6-pointed star (two overlaid triangles — Shatkona) wrapped in three
 * concentric rings, drawn with @shopify/react-native-skia. The whole
 * piece renders at 4 % opacity: barely visible, yet it provides the
 * subtle sub-mandala depth the web chat has behind messages.
 *
 * Static — no animation, no re-draw per frame.
 */

import React, { useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Canvas, Circle, Path, Skia, Group } from '@shopify/react-native-skia';

/** Golden stroke color used for the mandala geometry. */
const GOLD = '#D4A017';
/** Overall opacity of the entire texture (per prompt: 0.04). */
const TEXTURE_OPACITY = 0.04;

export interface SubMandalaTextureProps {
  /** Override the diameter of the mandala (defaults to ~70 % of screen width). */
  readonly size?: number;
}

function SubMandalaTextureInner({
  size,
}: SubMandalaTextureProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const diameter = size ?? Math.min(width, height) * 0.75;
  const cx = width / 2;
  const cy = height / 2;
  const outerR = diameter / 2;
  const midR = outerR * 0.78;
  const innerR = outerR * 0.52;

  /** Build the Shatkona (6-pointed star) path once — two overlaid triangles. */
  const starPath = useMemo(() => {
    const path = Skia.Path.Make();
    const R = outerR * 0.85;

    // Upward triangle: vertices at -90°, 30°, 150°.
    const upAngles = [-Math.PI / 2, Math.PI / 6, (5 * Math.PI) / 6];
    upAngles.forEach((a, i) => {
      const x = cx + R * Math.cos(a);
      const y = cy + R * Math.sin(a);
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    path.close();

    // Downward triangle: vertices at 90°, -30°, -150° (210°).
    const downAngles = [Math.PI / 2, -Math.PI / 6, (7 * Math.PI) / 6];
    downAngles.forEach((a, i) => {
      const x = cx + R * Math.cos(a);
      const y = cy + R * Math.sin(a);
      if (i === 0) path.moveTo(x, y);
      else path.lineTo(x, y);
    });
    path.close();

    return path;
  }, [cx, cy, outerR]);

  return (
    <View
      style={styles.container}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Group opacity={TEXTURE_OPACITY}>
          {/* Concentric rings */}
          <Circle
            cx={cx}
            cy={cy}
            r={outerR}
            color={GOLD}
            style="stroke"
            strokeWidth={1}
          />
          <Circle
            cx={cx}
            cy={cy}
            r={midR}
            color={GOLD}
            style="stroke"
            strokeWidth={1}
          />
          <Circle
            cx={cx}
            cy={cy}
            r={innerR}
            color={GOLD}
            style="stroke"
            strokeWidth={1}
          />

          {/* 6-pointed Shatkona star */}
          <Path path={starPath} color={GOLD} style="stroke" strokeWidth={1} />

          {/* Center seed */}
          <Circle cx={cx} cy={cy} r={3} color={GOLD} />
        </Group>
      </Canvas>
    </View>
  );
}

/** Faint sacred-geometry backdrop for the chat scroll area. */
export const SubMandalaTexture = React.memo(SubMandalaTextureInner);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
