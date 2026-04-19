/**
 * @kiaanverse/ui — Living Background System
 *
 * The universal cosmic backdrop for every Kiaanverse screen. Faithfully ports
 * the web's DivineCelestialBackground to React Native + Skia while animating
 * entirely on the UI thread.
 */

export {
  DivineCelestialBackground,
  type DivineCelestialBackgroundProps,
} from './DivineCelestialBackground';

export { AuroraLayer, type AuroraLayerProps, type AuroraKey } from './AuroraLayer';

export {
  DivineScreenWrapper,
  type DivineScreenWrapperProps,
} from './DivineScreenWrapper';

export { useTimeOfDay, resolveTimeOfDay } from './useTimeOfDay';

export {
  PARTICLE_COUNT_FULL,
  PARTICLE_COUNT_REDUCED,
  PARTICLE_COLORS,
  PARTICLE_COLOR_WEIGHTS,
  AURORA_LAYERS,
  TIME_OF_DAY_ATMOSPHERE,
  TIME_OF_DAY_POLL_INTERVAL,
  type TimeOfDay,
} from './tokens/background';
