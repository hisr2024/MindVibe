/**
 * ChakraColumnIcon — Ascending chakra column for the Journeys tab.
 *
 * Five circles stacked vertically with diameters increasing from bottom
 * (root) to top (crown), echoing the spiritual journey upward through
 * the chakras. Outline style, strokeWidth 1.5.
 */

import React from 'react';
import Svg, { Circle } from 'react-native-svg';

export interface ChakraColumnIconProps {
  readonly size?: number;
  readonly color?: string;
}

/**
 * Chakra layout (top → bottom) tuned for a 24×24 viewBox:
 * - Crown:     cy=3.25  r=2.25
 * - Third-eye: cy=7.5   r=1.9
 * - Throat:    cy=11.5  r=1.6
 * - Heart:     cy=15    r=1.3
 * - Root:      cy=18.25 r=1.0
 *
 * Each circle's vertical spacing is slightly greater than the next
 * circle's diameter so they don't visually collide.
 */
const CHAKRAS: readonly { cy: number; r: number }[] = [
  { cy: 3.25, r: 2.25 },
  { cy: 7.5, r: 1.9 },
  { cy: 11.5, r: 1.6 },
  { cy: 15, r: 1.3 },
  { cy: 18.25, r: 1.0 },
];

function ChakraColumnIconComponent({
  size = 24,
  color = 'currentColor',
}: ChakraColumnIconProps): React.JSX.Element {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {CHAKRAS.map((c, i) => (
        <Circle key={i} cx={12} cy={c.cy} r={c.r} />
      ))}
    </Svg>
  );
}

/** Ascending chakra column icon for Journeys tab. */
export const ChakraColumnIcon = React.memo(ChakraColumnIconComponent);
