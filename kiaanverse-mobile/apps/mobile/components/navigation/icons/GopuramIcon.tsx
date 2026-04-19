/**
 * GopuramIcon — South-Indian temple gopuram silhouette for the Home tab.
 *
 * Three-tiered curved roof layers above a rectangular base entrance,
 * rendered as an outline with strokeWidth 1.5.
 */

import React from 'react';
import Svg, { Path, Line } from 'react-native-svg';

export interface GopuramIconProps {
  readonly size?: number;
  readonly color?: string;
}

function GopuramIconComponent({
  size = 24,
  color = 'currentColor',
}: GopuramIconProps): React.JSX.Element {
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
      {/* Spire finial (kalasha) */}
      <Path d="M12 1.75 V4" />
      <Path d="M10.5 4 H13.5" />

      {/* Top tier — narrow curved roof */}
      <Path d="M9.5 4 Q12 6 14.5 4 L13.5 7 H10.5 Z" />

      {/* Middle tier — wider curved roof */}
      <Path d="M8 7.5 Q12 10 16 7.5 L14.5 11 H9.5 Z" />

      {/* Base tier — widest curved roof */}
      <Path d="M6 11.5 Q12 14 18 11.5 L16.5 15 H7.5 Z" />

      {/* Temple base body */}
      <Path d="M7 15 V22 H17 V15" />

      {/* Entrance doorway (arched) */}
      <Path d="M10 22 V18 Q12 16.5 14 18 V22" />

      {/* Decorative horizontal band on base */}
      <Line x1={7} y1={18.25} x2={10} y2={18.25} />
      <Line x1={14} y1={18.25} x2={17} y2={18.25} />
    </Svg>
  );
}

/** Temple gopuram silhouette icon for Home tab. */
export const GopuramIcon = React.memo(GopuramIconComponent);
