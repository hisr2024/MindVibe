/**
 * LotusDialogIcon — overlapping lotus petals as a speech vessel (Chat tab).
 *
 * Three lotus petals arranged in a speech-bubble silhouette: one central
 * upward petal flanked by two side petals, all overlapping at a shared
 * base. A short tail drops to the lower-left to read as "dialogue" while
 * preserving the flower mandala form. Outline, strokeWidth 1.5 — matches
 * the visual language of the other sacred tab icons.
 */
import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export interface LotusDialogIconProps {
  readonly size?: number;
  readonly color?: string;
}

function LotusDialogIconComponent({
  size = 24,
  color = 'currentColor',
}: LotusDialogIconProps): React.JSX.Element {
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
      {/* Left petal — swept toward the center */}
      <Path d="M4.5 13 Q5 7.5 12 11 Q9 15 4.5 13 Z" />
      {/* Right petal — mirror of the left */}
      <Path d="M19.5 13 Q19 7.5 12 11 Q15 15 19.5 13 Z" />
      {/* Central petal rising above — the voice itself */}
      <Path d="M12 3.5 Q9 9 12 12 Q15 9 12 3.5 Z" />

      {/* Shared base — a gentle arc uniting the three petals */}
      <Path d="M6 13.25 Q12 15.5 18 13.25" />

      {/* Speech tail — lotus petal descending to the lower-left */}
      <Path d="M8 14.5 L6 18.75 L10.25 15.75" />

      {/* Three dots sit inside the vessel — the echo of conversation */}
      <Circle cx={9.5} cy={12.5} r={0.85} fill={color} stroke="none" />
      <Circle cx={12} cy={12.5} r={0.85} fill={color} stroke="none" />
      <Circle cx={14.5} cy={12.5} r={0.85} fill={color} stroke="none" />
    </Svg>
  );
}

/** Overlapping lotus petals as a dialogue vessel — Chat tab icon. */
export const LotusDialogIcon = React.memo(LotusDialogIconComponent);
