/**
 * @kiaanverse/theme — Divine Token Foundation
 *
 * The single source of truth for every color, font, measurement, and
 * motion curve in the Kiaanverse mobile app. Depends only on
 * `react-native-reanimated` (for Easing curves); no React Native UI
 * code, so it can be consumed by web, Skia, or native modules alike.
 *
 *   import { colors, fontFamily, spacing, easing } from '@kiaanverse/theme';
 */

export {
  colors,
  cosmosGradient,
  cosmosGradientLocations,
  particlePalette,
  type Colors,
  type CosmosGradient,
} from './colors';

export {
  fontFamily,
  fontSize,
  lineHeight,
  letterSpacing,
  textPresets,
  type FontFamilyName,
  type FontFamily,
  type FontSize,
  type LineHeight,
  type LetterSpacing,
  type TextPreset,
} from './typography';

export {
  spacing,
  radii,
  shadows,
  type Spacing,
  type SpacingKey,
  type Radii,
  type RadiiKey,
  type Shadows,
  type ShadowKey,
} from './spacing';

export {
  duration,
  spring,
  easing,
  accessibility,
  particleField,
  type Duration,
  type DurationKey,
  type Spring,
  type SpringKey,
  type Easing,
  type EasingKey,
  type ParticleField,
} from './animations';
