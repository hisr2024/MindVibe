/**
 * ManuscriptIcon — Open manuscript / scroll with lotus decoration
 * for the Gita tab.
 *
 * A V-shaped open book with a central spine and a simple 5-petal
 * lotus crowning the top center. Outline style, strokeWidth 1.5.
 */

import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

export interface ManuscriptIconProps {
  readonly size?: number;
  readonly color?: string;
}

function ManuscriptIconComponent({
  size = 24,
  color = 'currentColor',
}: ManuscriptIconProps): React.JSX.Element {
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
      {/* Lotus atop the manuscript — 5 petals */}
      {/* Center petal */}
      <Path d="M12 1.5 Q11.25 3 12 4.5 Q12.75 3 12 1.5 Z" />
      {/* Left outer petal */}
      <Path d="M9.5 2.5 Q9.25 4 10.75 4.75 Q11 3.25 9.5 2.5 Z" />
      {/* Right outer petal */}
      <Path d="M14.5 2.5 Q14.75 4 13.25 4.75 Q13 3.25 14.5 2.5 Z" />
      {/* Small base leaves */}
      <Path d="M10 4.75 Q12 5.5 14 4.75" />

      {/* Open book: left page */}
      <Path d="M3.5 7 Q7.5 6.25 11.5 8 V21 Q7.5 19.25 3.5 20 Z" />

      {/* Open book: right page */}
      <Path d="M20.5 7 Q16.5 6.25 12.5 8 V21 Q16.5 19.25 20.5 20 Z" />

      {/* Text lines on left page */}
      <Line x1={5.25} y1={10} x2={9.75} y2={10.75} />
      <Line x1={5.25} y1={12.5} x2={9.75} y2={13.25} />
      <Line x1={5.25} y1={15} x2={9.75} y2={15.75} />

      {/* Text lines on right page */}
      <Line x1={14.25} y1={10.75} x2={18.75} y2={10} />
      <Line x1={14.25} y1={13.25} x2={18.75} y2={12.5} />
      <Line x1={14.25} y1={15.75} x2={18.75} y2={15} />
    </Svg>
  );
}

/** Open manuscript with lotus icon for Gita tab. */
export const ManuscriptIcon = React.memo(ManuscriptIconComponent);
