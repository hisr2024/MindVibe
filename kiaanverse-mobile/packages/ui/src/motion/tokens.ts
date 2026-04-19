/**
 * Sacred Motion Tokens — 1:1 parity with styles/divine.css on the web.
 *
 * Every duration and easing used by the mobile motion layer lives here so
 * that components never invent magic numbers. Names mirror the web
 * cubic-bezier aliases exactly (ease-divine-in, ease-divine-out,
 * lotus-bloom, peacock-shimmer).
 *
 * Reference (from web styles/divine.css):
 *   --ease-divine-in:      cubic-bezier(0.0, 0.8, 0.2, 1.0);
 *   --ease-divine-out:     cubic-bezier(0.16, 1.0, 0.3, 1.0);
 *   --ease-lotus-bloom:    cubic-bezier(0.22, 1.0, 0.36, 1.0);
 *   --ease-peacock:        cubic-bezier(0.33, 1.0, 0.68, 1.0);
 */

import { Easing } from 'react-native-reanimated';

/**
 * Reanimated 3 `Easing.bezier` returns an EasingFactoryFn (a thunk producing
 * the easing function). `withTiming`/`withDelay` both accept factory + plain
 * easing functions, so we preserve that type via ReturnType inference rather
 * than naming a single exported type from reanimated.
 */
type SacredEasing = ReturnType<typeof Easing.bezier>;

// ---------------------------------------------------------------------------
// Duration tokens (ms) — web-parity names.
// ---------------------------------------------------------------------------

/** 180ms — swift feedback (button press, chip tap, ripple). */
export const SWIFT = 180;

/** 200ms — exit animations (page leave, modal dismiss). */
export const EXIT = 200;

/** 320ms — divine entrance (screen + card enter). */
export const DIVINE = 320;

/** 320ms — natural card/element entrance (lotus-bloom easing). */
export const NATURAL = 320;

/** 350ms — modal slide-from-bottom (web parity). */
export const MODAL = 350;

/** 800ms — golden pulse expansion on milestones. */
export const PULSE = 800;

/** 180ms — tab crossfade. */
export const TAB_CROSSFADE = 180;

// ---------------------------------------------------------------------------
// Easing curves — worklet-safe cubic-bezier functions.
// ---------------------------------------------------------------------------

/** ease-divine-in — soft start, confident finish. */
export const easeDivineIn: SacredEasing = Easing.bezier(0.0, 0.8, 0.2, 1.0);

/** ease-divine-out — snappy start, rounded landing. */
export const easeDivineOut: SacredEasing = Easing.bezier(0.16, 1.0, 0.3, 1.0);

/** lotus-bloom — organic expansion, slightly overshoots feel. */
export const easeLotusBloom: SacredEasing = Easing.bezier(0.22, 1.0, 0.36, 1.0);

/** peacock-shimmer — smooth iridescent travel for golden pulse. */
export const easePeacockShimmer: SacredEasing = Easing.bezier(0.33, 1.0, 0.68, 1.0);

// ---------------------------------------------------------------------------
// Geometry constants referenced by motion hooks.
// ---------------------------------------------------------------------------

/** Translate distance (px) for page / card entrances. */
export const ENTRANCE_TRANSLATE_Y = 16;

/** Exit scale target for page leave (opacity 1→0, scale 1.0→1.03). */
export const EXIT_SCALE = 1.03;

/** Entrance scale start for page enter (opacity 0→1, scale 0.97→1.0). */
export const ENTER_SCALE_FROM = 0.97;

/** Scale-down on press (1.0 → 0.96). */
export const PRESS_SCALE = 0.96;

/** Golden pulse — scale range 0.5 → 2.0. */
export const PULSE_SCALE_FROM = 0.5;
export const PULSE_SCALE_TO = 2.0;

/** Golden pulse — opacity peak 0.6 → 0. */
export const PULSE_OPACITY_FROM = 0.6;

/** Golden pulse — ring count and delay between rings (ms). */
export const PULSE_RING_COUNT = 3;
export const PULSE_RING_DELAY = 120;
