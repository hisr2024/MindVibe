/**
 * LotusGlyph — pure-SVG lotus illustration (पद्म) used for empty
 * states in Sacred Reflections.
 *
 * Why SVG and not the 🪷 emoji?
 *   • 🪷 (U+1FAB7) is a Unicode 14 codepoint (Sept 2021). Android 11
 *     and earlier render it as tofu, which is what the user reports
 *     as "the lotus is hiding".
 *   • An inline SVG renders identically on every Android, iOS, and
 *     web build, scales without aliasing, and accepts a tint colour
 *     so it can match each tab's accent (gold by default).
 *
 * Eight petals are drawn from the centre outward, ringed with a base
 * line of leaves and a glowing core. The whole glyph fits in a 1×1
 * viewBox so it can be scaled to any size with the `size` prop.
 */

import React from 'react';
import Svg, {
  Circle,
  Defs,
  Path,
  RadialGradient,
  Stop,
} from 'react-native-svg';

export interface LotusGlyphProps {
  /** Pixel size of the rendered glyph. Defaults to 56 (matches the
   *  previous fontSize: 56 used for the 🪷 emoji). */
  readonly size?: number;
  /** Petal stroke / fill colour. Defaults to Kiaanverse gold. */
  readonly color?: string;
  /** Soft halo behind the petals. Defaults to gold at 0.18. */
  readonly haloColor?: string;
}

const DEFAULT_COLOR = '#D4A017';
const DEFAULT_HALO = 'rgba(212, 160, 23, 0.18)';

function LotusGlyphComponent({
  size = 56,
  color = DEFAULT_COLOR,
  haloColor = DEFAULT_HALO,
}: LotusGlyphProps): React.JSX.Element {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      accessibilityRole="image"
      accessibilityLabel="Lotus"
    >
      <Defs>
        <RadialGradient id="lotusHalo" cx="50%" cy="55%" r="55%">
          <Stop offset="0%" stopColor={haloColor} stopOpacity={1} />
          <Stop offset="100%" stopColor={haloColor} stopOpacity={0} />
        </RadialGradient>
      </Defs>

      {/* Soft halo — the lotus's natural glow. */}
      <Circle cx={50} cy={56} r={46} fill="url(#lotusHalo)" />

      {/* Base water leaves — two flat strokes hugging the bottom. */}
      <Path
        d="M14 70 Q50 60 86 70"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        fill="none"
        opacity={0.55}
      />
      <Path
        d="M22 75 Q50 67 78 75"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        fill="none"
        opacity={0.4}
      />

      {/* Eight petals, drawn from the centre outward. Each petal is a
          symmetrical ogive — the dharmic almond shape used in mandalas. */}
      {/* Outer petals (4) */}
      <Path
        d="M50 22 Q42 42 50 60 Q58 42 50 22 Z"
        fill={color}
        opacity={0.95}
      />
      <Path
        d="M22 50 Q42 42 60 50 Q42 58 22 50 Z"
        fill={color}
        opacity={0.78}
      />
      <Path
        d="M78 50 Q58 42 40 50 Q58 58 78 50 Z"
        fill={color}
        opacity={0.78}
      />
      <Path
        d="M50 78 Q42 60 50 44 Q58 60 50 78 Z"
        fill={color}
        opacity={0.55}
      />

      {/* Inner petals (4 diagonals) */}
      <Path
        d="M30 30 Q40 46 50 50 Q46 40 30 30 Z"
        fill={color}
        opacity={0.7}
      />
      <Path
        d="M70 30 Q60 46 50 50 Q54 40 70 30 Z"
        fill={color}
        opacity={0.7}
      />
      <Path
        d="M30 70 Q40 54 50 50 Q46 60 30 70 Z"
        fill={color}
        opacity={0.5}
      />
      <Path
        d="M70 70 Q60 54 50 50 Q54 60 70 70 Z"
        fill={color}
        opacity={0.5}
      />

      {/* Central pistil — pure gold, the seed of awakening. */}
      <Circle cx={50} cy={50} r={4} fill={color} />
      <Circle cx={50} cy={50} r={1.5} fill="#FFFAEB" opacity={0.9} />
    </Svg>
  );
}

/** Eight-petal SVG lotus for Sacred Reflections empty states. */
export const LotusGlyph = React.memo(LotusGlyphComponent);
