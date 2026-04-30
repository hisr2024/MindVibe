/**
 * SwordChakraIcon — Sword crossed with a chakra wheel for the Journeys
 * tab (षड्रिपु — the inner battlefield, six enemies of the self).
 *
 * The blade rises out of an 8-spoke dharma wheel: action grounded in
 * dharma. Outline style, strokeWidth 1.5. Designed to read at 24×24 next
 * to the other navigation glyphs (manuscript, lotus, gopuram, etc.).
 */

import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

export interface SwordChakraIconProps {
  readonly size?: number;
  readonly color?: string;
}

function SwordChakraIconComponent({
  size = 24,
  color = 'currentColor',
}: SwordChakraIconProps): React.JSX.Element {
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
      {/* Dharma chakra base — 8-spoke wheel centred at the foot of the blade. */}
      <Circle cx={12} cy={18} r={4} />
      <Circle cx={12} cy={18} r={1} />
      {/* 8 spokes */}
      <Line x1={12} y1={14} x2={12} y2={22} />
      <Line x1={8} y1={18} x2={16} y2={18} />
      <Line x1={9.2} y1={15.2} x2={14.8} y2={20.8} />
      <Line x1={14.8} y1={15.2} x2={9.2} y2={20.8} />

      {/* Sword guard (crossguard) — sits just above the wheel. */}
      <Line x1={9} y1={13} x2={15} y2={13} />

      {/* Sword blade — rises straight up to the top of the canvas. */}
      <Path d="M12 2 L13 12 H11 Z" />

      {/* Pommel knot — small loop where blade meets the chakra/grip. */}
      <Circle cx={12} cy={13.6} r={0.6} />
    </Svg>
  );
}

/** Sword + dharma-chakra icon for the Journeys (षड्रिपु) tab. */
export const SwordChakraIcon = React.memo(SwordChakraIconComponent);
