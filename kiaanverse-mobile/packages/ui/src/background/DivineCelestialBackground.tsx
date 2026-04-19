/**
 * DivineCelestialBackground — 108 sacred mala-particles drifting on the UI thread.
 *
 * This is a Skia port of the web's components/divine/DivineCelestialBackground.tsx
 * particle field. Every animation frame is computed by Reanimated worklets and
 * rendered by react-native-skia, so the JS thread sees zero animation load.
 *
 * Rendering pipeline (bottom → top):
 *   1. Solid background <View> (muhurta-coloured)
 *   2. Skia <Canvas> with 108 <Circle> particles
 *
 * Per-particle model:
 *   • colour chosen by weighted lottery (60% gold / 25% teal / 15% blue)
 *   • size  ∈ [0.5, 2.0] px, fixed for the particle's lifetime
 *   • opacity = base + sin(time * ω + φ) * amplitude   (individual breathing)
 *   • cy     = (startY - time * vy) mod screenHeight   (upward drift, wraps)
 *   • cx     = startX + sin(time * ωx + φx) * 12px     (Perlin-like sway)
 *   • occasional bloom: lower-frequency sine adds up to +0.3 opacity
 *
 * Accessibility / power hygiene:
 *   • AppState listener pauses all animation when the app is not active
 *   • AccessibilityInfo.isReduceMotionEnabled → 54 particles instead of 108
 *   • pointerEvents='none' everywhere — never blocks touch
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  AppState,
  type AppStateStatus,
  StyleSheet,
  View,
  useWindowDimensions,
  type ViewStyle,
} from 'react-native';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';
import {
  cancelAnimation,
  Easing,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import {
  PARTICLE_COLORS,
  PARTICLE_COLOR_WEIGHTS,
  PARTICLE_COUNT_FULL,
  PARTICLE_COUNT_REDUCED,
  PARTICLE_DURATION_MAX,
  PARTICLE_DURATION_MIN,
  PARTICLE_OPACITY_MAX,
  PARTICLE_OPACITY_MIN,
  PARTICLE_SIZE_MAX,
  PARTICLE_SIZE_MIN,
} from './tokens/background';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DivineCelestialBackgroundProps {
  /** Base opacity multiplier applied to every particle. Default 1.0. */
  readonly opacityMultiplier?: number | undefined;
  /** Solid background colour painted behind the Skia canvas. */
  readonly backgroundColor?: string | undefined;
  /** Override particle count (e.g. late-night 'ratri' → 54). */
  readonly particleCount?: number | undefined;
  /** Optional container style override. */
  readonly style?: ViewStyle | undefined;
}

/** Static per-particle parameters. Generated once from a seeded PRNG. */
interface ParticleParams {
  readonly colorHex: string;
  readonly size: number;
  readonly startX: number; // [0, 1] — fraction of screen width
  readonly startY: number; // [0, 1] — fraction of screen height
  readonly durationMs: number; // full vertical cycle duration
  readonly opacityBase: number;
  readonly opacityAmplitude: number;
  readonly breathPhase: number; // 0 – 2π, desync breathing
  readonly swayPhase: number;
  readonly swayAmplitude: number; // px, horizontal oscillation
  readonly bloomPhase: number; // desync bloom
}

// ---------------------------------------------------------------------------
// Deterministic PRNG so particle positions are stable across re-renders
// and match what appears on a companion platform.
// ---------------------------------------------------------------------------

function createRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    // Park-Miller minstd — matches the web component's star generator
    s = (s * 16807) % 2147483647;
    return (s & 0x7fffffff) / 2147483647;
  };
}

function pickColor(roll: number): string {
  if (roll < PARTICLE_COLOR_WEIGHTS.gold) return PARTICLE_COLORS.gold;
  if (roll < PARTICLE_COLOR_WEIGHTS.gold + PARTICLE_COLOR_WEIGHTS.peacockTeal) {
    return PARTICLE_COLORS.peacockTeal;
  }
  return PARTICLE_COLORS.krishnaBlue;
}

function generateParticles(count: number, seed = 108): ParticleParams[] {
  const rng = createRng(seed);
  const out: ParticleParams[] = [];
  for (let i = 0; i < count; i += 1) {
    const colorHex = pickColor(rng());
    const size = PARTICLE_SIZE_MIN + rng() * (PARTICLE_SIZE_MAX - PARTICLE_SIZE_MIN);
    const startX = rng();
    const startY = rng();
    const durationMs =
      PARTICLE_DURATION_MIN + rng() * (PARTICLE_DURATION_MAX - PARTICLE_DURATION_MIN);

    const opacityBase =
      PARTICLE_OPACITY_MIN + rng() * (PARTICLE_OPACITY_MAX - PARTICLE_OPACITY_MIN);
    // keep peak inside [0.04, 0.22] after bloom by budgeting amplitude
    const opacityAmplitude = 0.015 + rng() * 0.035;
    const breathPhase = rng() * Math.PI * 2;
    const swayPhase = rng() * Math.PI * 2;
    const swayAmplitude = 6 + rng() * 10; // 6–16px gentle drift
    const bloomPhase = rng() * Math.PI * 2;

    out.push({
      colorHex,
      size,
      startX,
      startY,
      durationMs,
      opacityBase,
      opacityAmplitude,
      breathPhase,
      swayPhase,
      swayAmplitude,
      bloomPhase,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Per-particle subcomponent — owns its own derived values so the parent
// doesn't call hooks in a loop that could change length across renders.
// ---------------------------------------------------------------------------

interface ParticleProps {
  readonly params: ParticleParams;
  readonly time: SharedValue<number>; // ms since mount (monotonic, pausable)
  readonly width: number;
  readonly height: number;
  readonly opacityMultiplier: SharedValue<number>;
}

function ParticleDot({
  params,
  time,
  width,
  height,
  opacityMultiplier,
}: ParticleProps): React.JSX.Element {
  const {
    size,
    startX,
    startY,
    durationMs,
    opacityBase,
    opacityAmplitude,
    breathPhase,
    swayPhase,
    swayAmplitude,
    bloomPhase,
    colorHex,
  } = params;

  // Vertical: upward drift, wraps at top. rise = 1.2 * height so each cycle
  // travels slightly more than the screen, keeping the field dense.
  const cy = useDerivedValue(() => {
    'worklet';
    const progress = (time.value % durationMs) / durationMs; // 0 → 1
    const raw = startY * height - progress * height * 1.2;
    // wrap to [0, height]
    const wrapped = ((raw % height) + height) % height;
    return wrapped;
  }, [durationMs, startY, height]);

  // Horizontal: gentle lateral sway around startX.
  const cx = useDerivedValue(() => {
    'worklet';
    const t = time.value / 1000;
    const base = startX * width;
    return base + Math.sin(t * 0.6 + swayPhase) * swayAmplitude;
  }, [startX, width, swayPhase, swayAmplitude]);

  // Opacity: base + sine breathing + slow bloom envelope.
  const opacity = useDerivedValue(() => {
    'worklet';
    const t = time.value / 1000;
    const breath = Math.sin(t * 1.2 + breathPhase) * opacityAmplitude;
    // Bloom: every ~35s a gentle 0–0.08 additive glow
    const bloomRaw = Math.sin(t * 0.18 + bloomPhase);
    const bloom = bloomRaw > 0.85 ? (bloomRaw - 0.85) * 0.55 : 0;
    const o = (opacityBase + breath + bloom) * opacityMultiplier.value;
    return o < 0 ? 0 : o > 1 ? 1 : o;
  }, [opacityBase, opacityAmplitude, breathPhase, bloomPhase]);

  return (
    <Circle cx={cx} cy={cy} r={size} color={colorHex} opacity={opacity} />
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

/** Length of one pass through the virtual master clock before it loops. */
const CLOCK_PERIOD_MS = 600_000; // 10 minutes — long enough to avoid seams

function DivineCelestialBackgroundComponent({
  opacityMultiplier = 1,
  backgroundColor = '#050510',
  particleCount,
  style,
}: DivineCelestialBackgroundProps): React.JSX.Element {
  const { width, height } = useWindowDimensions();

  // --- Reduced-motion detection ---
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled().then((v: boolean) => {
      if (mounted) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (v: boolean) => {
        if (mounted) setReduceMotion(v);
      },
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  const effectiveCount =
    particleCount ??
    (reduceMotion ? PARTICLE_COUNT_REDUCED : PARTICLE_COUNT_FULL);

  // Regenerate only when count changes (stable across width/height updates).
  const particles = useMemo(
    () => generateParticles(effectiveCount),
    [effectiveCount],
  );

  // --- Master clock (shared value) — UI-thread monotonic ms counter ---
  const time = useSharedValue(0);
  const opacityMultiplierSv = useSharedValue(opacityMultiplier);
  useEffect(() => {
    opacityMultiplierSv.value = opacityMultiplier;
  }, [opacityMultiplier, opacityMultiplierSv]);

  // Keep track of last pause point so resume is seamless
  const pausedAtRef = useRef<number | null>(null);

  const startClock = (fromMs: number) => {
    time.value = fromMs;
    time.value = withRepeat(
      withTiming(fromMs + CLOCK_PERIOD_MS, {
        duration: CLOCK_PERIOD_MS,
        easing: Easing.linear,
      }),
      -1,
      false,
    );
  };

  useEffect(() => {
    startClock(0);
    return () => cancelAnimation(time);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- AppState: pause when backgrounded, resume on foreground ---
  useEffect(() => {
    const onChange = (state: AppStateStatus) => {
      if (state === 'active') {
        const resumeFrom = pausedAtRef.current ?? time.value;
        pausedAtRef.current = null;
        startClock(resumeFrom);
      } else {
        pausedAtRef.current = time.value;
        cancelAnimation(time);
      }
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View
      pointerEvents="none"
      style={[styles.container, { backgroundColor }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Canvas style={StyleSheet.absoluteFill}>
        <Group>
          {particles.map((p, i) => (
            <ParticleDot
              key={`p-${i}`}
              params={p}
              time={time}
              width={width}
              height={height}
              opacityMultiplier={opacityMultiplierSv}
            />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}

export const DivineCelestialBackground = React.memo(
  DivineCelestialBackgroundComponent,
);

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
    overflow: 'hidden',
  },
});
