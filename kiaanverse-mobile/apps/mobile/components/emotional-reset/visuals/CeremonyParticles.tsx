/**
 * CeremonyParticles — 108-particle sacred convergence.
 *
 * RN analogue of the web ceremony canvas. 108 particles spawn from screen
 * edges, spring toward center (converge), pause while the OM glyph forms,
 * then explode outward (burst) and float upward (float). The orchestrator
 * drives phase transitions via the `stage` prop; particle motion runs
 * entirely on the UI thread through Reanimated derived values.
 *
 * Skia's `Canvas` + `Circle` + `Paint` lets us animate 108 dots at 60fps
 * on mid-range Android without React re-renders.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import {
  Canvas,
  Circle,
  Group,
} from '@shopify/react-native-skia';
import {
  useSharedValue,
  withTiming,
  withDelay,
  Easing,
  useDerivedValue,
  cancelAnimation,
  type SharedValue,
} from 'react-native-reanimated';

export type CeremonyStage = 'converge' | 'om' | 'burst' | 'float' | 'done';

interface CeremonyParticlesProps {
  stage: CeremonyStage;
}

interface Particle {
  startX: number;
  startY: number;
  burstDx: number;
  burstDy: number;
  size: number;
  color: string;
  delay: number;
}

function seed(i: number, salt: number): number {
  // Deterministic pseudo-random per-particle so the pattern is stable.
  const x = Math.sin(i * 9.17 + salt * 3.31) * 43758.5453;
  return x - Math.floor(x);
}

export function CeremonyParticles({ stage }: CeremonyParticlesProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();
  const cx = width / 2;
  const cy = height / 2;

  const particles: Particle[] = useMemo(() => {
    return Array.from({ length: 108 }).map((_, i) => {
      const r1 = seed(i, 1);
      const r2 = seed(i, 2);
      const r3 = seed(i, 3);
      const edge = Math.floor(r1 * 4);

      let startX: number, startY: number;
      if (edge === 0)      { startX = r2 * width;  startY = -16; }
      else if (edge === 1) { startX = width + 16;  startY = r2 * height; }
      else if (edge === 2) { startX = r2 * width;  startY = height + 16; }
      else                 { startX = -16;         startY = r2 * height; }

      const angle = r3 * Math.PI * 2;
      const speed = 80 + r1 * 180;
      return {
        startX,
        startY,
        burstDx: Math.cos(angle) * speed,
        burstDy: Math.sin(angle) * speed,
        size: 1.5 + r2 * 2.5,
        color: r3 < 0.7 ? '#D4A017' : r3 < 0.9 ? '#06B6D4' : '#FDE68A',
        delay: i * 6,
      };
    });
  }, [width, height]);

  // Single shared progress value drives every particle; deriving positions
  // from progress + stage keeps memory + wakeups low.
  const convergeP = useSharedValue(0);   // 0 → 1 during "converge"
  const burstP = useSharedValue(0);      // 0 → 1 during "burst"
  const floatP = useSharedValue(0);      // 0 → 1 during "float"
  const alphaP = useSharedValue(1);

  useEffect(() => {
    if (stage === 'converge') {
      convergeP.value = 0;
      burstP.value = 0;
      floatP.value = 0;
      alphaP.value = 1;
      convergeP.value = withTiming(1, {
        duration: 1200,
        easing: Easing.out(Easing.cubic),
      });
    } else if (stage === 'om') {
      convergeP.value = withTiming(1, { duration: 100 });
    } else if (stage === 'burst') {
      burstP.value = withTiming(1, {
        duration: 600,
        easing: Easing.out(Easing.quad),
      });
    } else if (stage === 'float') {
      floatP.value = withTiming(1, {
        duration: 1800,
        easing: Easing.inOut(Easing.quad),
      });
      alphaP.value = withDelay(300, withTiming(0, { duration: 1500 }));
    } else if (stage === 'done') {
      alphaP.value = withTiming(0, { duration: 400 });
    }

    return () => {
      cancelAnimation(convergeP);
      cancelAnimation(burstP);
      cancelAnimation(floatP);
      cancelAnimation(alphaP);
    };
  }, [stage, convergeP, burstP, floatP, alphaP]);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {particles.map((p, i) => (
            <ParticleDot
              key={i}
              p={p}
              cx={cx}
              cy={cy}
              convergeP={convergeP}
              burstP={burstP}
              floatP={floatP}
              alphaP={alphaP}
            />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}

interface ParticleDotProps {
  p: Particle;
  cx: number;
  cy: number;
  convergeP: SharedValue<number>;
  burstP: SharedValue<number>;
  floatP: SharedValue<number>;
  alphaP: SharedValue<number>;
}

function ParticleDot({
  p,
  cx,
  cy,
  convergeP,
  burstP,
  floatP,
  alphaP,
}: ParticleDotProps): React.JSX.Element {
  const x = useDerivedValue(() => {
    const conv = Math.max(0, Math.min(1, convergeP.value));
    const bx = p.startX + (cx - p.startX) * conv;
    const burst = Math.max(0, Math.min(1, burstP.value));
    const withBurst = bx + p.burstDx * burst;
    const float = Math.max(0, Math.min(1, floatP.value));
    return withBurst + Math.sin(float * Math.PI * 2 + p.startX) * 8;
  }, [cx]);

  const y = useDerivedValue(() => {
    const conv = Math.max(0, Math.min(1, convergeP.value));
    const by = p.startY + (cy - p.startY) * conv;
    const burst = Math.max(0, Math.min(1, burstP.value));
    const withBurst = by + p.burstDy * burst;
    const float = Math.max(0, Math.min(1, floatP.value));
    // Float upward slowly
    return withBurst - float * 60;
  }, [cy]);

  const opacity = useDerivedValue(() => {
    return Math.max(0, Math.min(1, alphaP.value));
  });

  return <Circle cx={x} cy={y} r={p.size} color={p.color} opacity={opacity} />;
}
