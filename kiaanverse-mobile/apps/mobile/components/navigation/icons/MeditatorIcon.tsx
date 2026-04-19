/**
 * MeditatorIcon — Seated meditator silhouette for the Profile tab.
 *
 * Simple figure in lotus pose (padmasana): circular head, torso with
 * shoulders, crossed legs forming a base triangle, and hands resting
 * in gyan mudra. Outline style, strokeWidth 1.5.
 */

import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export interface MeditatorIconProps {
  readonly size?: number;
  readonly color?: string;
}

function MeditatorIconComponent({
  size = 24,
  color = 'currentColor',
}: MeditatorIconProps): React.JSX.Element {
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
      {/* Head */}
      <Circle cx={12} cy={4.5} r={2.25} />

      {/* Shoulders + torso: curves down from neck to hip line */}
      <Path d="M8 10 Q12 7.75 16 10 L15 15 H9 Z" />

      {/* Arms resting on knees (hands in mudra) */}
      <Path d="M8.5 11.5 Q5.5 14 6.75 17" />
      <Path d="M15.5 11.5 Q18.5 14 17.25 17" />

      {/* Hands — small circles (gyan mudra) */}
      <Circle cx={6.75} cy={17.25} r={0.85} />
      <Circle cx={17.25} cy={17.25} r={0.85} />

      {/* Crossed legs — lotus base triangle */}
      <Path d="M9 15 L4 20.25 H20 L15 15" />

      {/* Suggestion of crossed ankles at base center */}
      <Path d="M10.5 20.25 Q12 18.75 13.5 20.25" />
    </Svg>
  );
}

/** Seated meditator silhouette icon for Profile tab. */
export const MeditatorIcon = React.memo(MeditatorIconComponent);
