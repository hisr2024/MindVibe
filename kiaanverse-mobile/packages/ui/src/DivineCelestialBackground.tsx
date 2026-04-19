/**
 * DivineCelestialBackground — The Sacred Particle Field
 *
 * A full-screen Skia canvas that renders the living cosmos of Kiaanverse:
 *
 *   • 35 gold motes (rgba(212,160,23,0.30))
 *   • 15 peacock motes (rgba(14,116,144,0.25))
 *   • 4 larger glow orbs that breathe (scale 0.8 ↔ 1.2 over 8s)
 *
 * Every particle drifts independently on the UI thread using
 * Reanimated 3 `withRepeat(withSequence(withTiming(...)))`. The JS thread
 * is never woken — the Skia <Circle> nodes read SharedValue props directly
 * through Skia's Reanimated integration (enabled by default in v1+).
 *
 * Performance contract:
 *   ─ 60fps on Pixel 7 / Galaxy S23 (verified via Android profiler)
 *   ─ pointerEvents="none" — never intercepts touch
 *   ─ position: absolute over the gradient, below children
 *
 * Consumers normally do NOT mount this directly — use DivineScreenWrapper.
 */

import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { Canvas, Circle, Group } from '@shopify/react-native-skia';
import {
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import { colors, easing, particleField } from '@kiaanverse/theme';

// ---------------------------------------------------------------------------
// Deterministic pseudo-random — seeded so the field is stable across renders
// ---------------------------------------------------------------------------

/**
 * Mulberry32 — small, fast, good-enough PRNG with a fixed seed so the
 * particle field looks identical on every mount (no jarring reshuffle on
 * screen transitions). Good distribution for uniform-random placement.
 */
function createRng(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randBetween(rng: () => number, min: number, max: number): number {
  return min + rng() * (max - min);
}

// ---------------------------------------------------------------------------
// Seed shape — one per particle, precomputed once
// ---------------------------------------------------------------------------

interface ParticleSeed {
  readonly id: number;
  readonly x0: number;
  readonly y0: number;
  readonly radius: number;
  readonly opacity: number;
  readonly color: string;
  readonly driftX: number;
  readonly driftY: number;
  readonly durationMs: number;
  /** Phase offset so particles don't drift in unison. */
  readonly phaseMs: number;
}

interface GlowOrbSeed {
  readonly id: number;
  readonly cx: number;
  readonly cy: number;
  readonly baseRadius: number;
  readonly opacity: number;
  readonly color: string;
  readonly phaseMs: number;
}

function buildParticleSeeds(
  width: number,
  height: number,
  seed: number,
): readonly ParticleSeed[] {
  const rng = createRng(seed);
  const seeds: ParticleSeed[] = [];

  for (let i = 0; i < particleField.totalCount; i += 1) {
    const isGold = i < particleField.goldCount;
    seeds.push({
      id: i,
      x0: rng() * width,
      y0: rng() * height,
      radius: randBetween(rng, particleField.minRadius, particleField.maxRadius),
      opacity: randBetween(rng, particleField.minOpacity, particleField.maxOpacity),
      color: isGold ? colors.alpha.goldParticle : colors.alpha.peacockParticle,
      driftX: randBetween(rng, -particleField.driftX, particleField.driftX),
      driftY: randBetween(rng, -particleField.driftY, particleField.driftY),
      durationMs: randBetween(
        rng,
        particleField.minDriftDuration,
        particleField.maxDriftDuration,
      ),
      // Spread phases over the full drift duration to avoid synchronized drift.
      phaseMs: rng() * particleField.maxDriftDuration,
    });
  }
  return seeds;
}

function buildGlowOrbSeeds(
  width: number,
  height: number,
  seed: number,
): readonly GlowOrbSeed[] {
  const rng = createRng(seed + 1);
  const orbs: GlowOrbSeed[] = [];
  for (let i = 0; i < particleField.glowOrbCount; i += 1) {
    const isGold = i % 2 === 0;
    orbs.push({
      id: i,
      cx: randBetween(rng, width * 0.15, width * 0.85),
      cy: randBetween(rng, height * 0.15, height * 0.85),
      baseRadius: randBetween(
        rng,
        particleField.glowOrbMinRadius,
        particleField.glowOrbMaxRadius,
      ),
      opacity: randBetween(
        rng,
        particleField.glowOrbMinOpacity,
        particleField.glowOrbMaxOpacity,
      ),
      color: isGold ? colors.gold.aura : colors.peacock.primary,
      phaseMs: rng() * particleField.glowOrbBreathMs,
    });
  }
  return orbs;
}

// ---------------------------------------------------------------------------
// DriftingParticle — one animated Skia circle, fully UI-thread
// ---------------------------------------------------------------------------

interface DriftingParticleProps {
  readonly seed: ParticleSeed;
}

function DriftingParticle({ seed }: DriftingParticleProps): React.JSX.Element {
  // Reanimated SharedValues — mutations stay on the UI thread, Skia reads
  // them directly via its Reanimated integration (no JS bridge hop).
  const cx: SharedValue<number> = useSharedValue(seed.x0);
  const cy: SharedValue<number> = useSharedValue(seed.y0);

  useEffect(() => {
    // Lead-in half-cycle offsets each particle by a unique phase so the
    // field never looks like it's drifting in unison. After the lead-in,
    // withRepeat(reverse=true) ping-pongs between +drift and -drift.
    const leadInX = seed.durationMs * 0.5 + seed.phaseMs * 0.2;
    const leadInY = seed.durationMs * 0.55 + seed.phaseMs * 0.15;

    cx.value = withSequence(
      withTiming(seed.x0 + seed.driftX, {
        duration: leadInX,
        easing: easing.divineBreath,
      }),
      withRepeat(
        withTiming(seed.x0 - seed.driftX, {
          duration: seed.durationMs,
          easing: easing.divineBreath,
        }),
        -1,
        true,
      ),
    );

    cy.value = withSequence(
      withTiming(seed.y0 + seed.driftY, {
        duration: leadInY,
        easing: easing.divineBreath,
      }),
      withRepeat(
        withTiming(seed.y0 - seed.driftY, {
          duration: seed.durationMs * 1.1,
          easing: easing.divineBreath,
        }),
        -1,
        true,
      ),
    );
    // seed is stable per mount; shared values intentionally animate once.
  }, [seed, cx, cy]);

  return (
    <Circle cx={cx} cy={cy} r={seed.radius} color={seed.color} opacity={seed.opacity} />
  );
}

// ---------------------------------------------------------------------------
// BreathingGlowOrb — large faint orb that gently pulses scale 0.8 ↔ 1.2
// ---------------------------------------------------------------------------

interface BreathingGlowOrbProps {
  readonly seed: GlowOrbSeed;
}

function BreathingGlowOrb({ seed }: BreathingGlowOrbProps): React.JSX.Element {
  const radius: SharedValue<number> = useSharedValue(
    seed.baseRadius * particleField.glowOrbScaleMin,
  );

  useEffect(() => {
    const half = particleField.glowOrbBreathMs / 2;
    // Lead-in offsets each orb's first inhale by its phase so they never
    // breathe in lockstep — creates the shimmer of a living atmosphere.
    radius.value = withSequence(
      withTiming(seed.baseRadius * particleField.glowOrbScaleMax, {
        duration: half + seed.phaseMs,
        easing: easing.divineBreath,
      }),
      withRepeat(
        withTiming(seed.baseRadius * particleField.glowOrbScaleMin, {
          duration: half,
          easing: easing.divineBreath,
        }),
        -1,
        true,
      ),
    );
  }, [seed, radius]);

  return (
    <Circle cx={seed.cx} cy={seed.cy} r={radius} color={seed.color} opacity={seed.opacity} />
  );
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

export interface DivineCelestialBackgroundProps {
  /**
   * Optional override for the canvas size. Defaults to full window.
   * Used by tests and storybook snapshots to pin dimensions.
   */
  readonly width?: number;
  readonly height?: number;
  /**
   * PRNG seed. Change only if a screen needs a visually distinct field;
   * leave default for app-wide consistency.
   * @default 42
   */
  readonly seed?: number;
}

function DivineCelestialBackgroundInner({
  width: widthProp,
  height: heightProp,
  seed = 42,
}: DivineCelestialBackgroundProps): React.JSX.Element {
  const window = useWindowDimensions();
  const width = widthProp ?? window.width;
  const height = heightProp ?? window.height;

  const particleSeeds = useMemo(
    () => buildParticleSeeds(width, height, seed),
    [width, height, seed],
  );
  const orbSeeds = useMemo(
    () => buildGlowOrbSeeds(width, height, seed),
    [width, height, seed],
  );

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Canvas style={StyleSheet.absoluteFill}>
        {/* Glow orbs render beneath the motes so motes float above them. */}
        <Group>
          {orbSeeds.map((s) => (
            <BreathingGlowOrb key={`orb-${s.id}`} seed={s} />
          ))}
        </Group>
        <Group>
          {particleSeeds.map((s) => (
            <DriftingParticle key={`p-${s.id}`} seed={s} />
          ))}
        </Group>
      </Canvas>
    </View>
  );
}

export const DivineCelestialBackground = React.memo(DivineCelestialBackgroundInner);
