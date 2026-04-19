/**
 * ChatMandalasIcon — Lotus speech bubble for the Chat (Sakha) tab.
 *
 * A circular speech vessel with three nested dots (the echo of dialogue)
 * and a small teardrop tail rooted to the bottom-left, evoking a lotus
 * mandala opening in conversation. Outline style, strokeWidth 1.5.
 */

import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

export interface ChatMandalasIconProps {
  readonly size?: number;
  readonly color?: string;
}

function ChatMandalasIconComponent({
  size = 24,
  color = 'currentColor',
}: ChatMandalasIconProps): React.JSX.Element {
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
      {/* Outer mandala — the vessel of dialogue */}
      <Circle cx={12} cy={11} r={8} />

      {/* Speech tail — lotus petal descending to the lower-left */}
      <Path d="M8 15.25 L6 19.25 L11 16.75" />

      {/* Three nested points — the echo of conversation (dots render as
          tiny circles so they pick up the shared stroke/fill colour). */}
      <Circle cx={9} cy={11} r={0.9} fill={color} stroke="none" />
      <Circle cx={12} cy={11} r={0.9} fill={color} stroke="none" />
      <Circle cx={15} cy={11} r={0.9} fill={color} stroke="none" />
    </Svg>
  );
}

/** Lotus speech bubble icon for the Chat (Sakha) tab. */
export const ChatMandalasIcon = React.memo(ChatMandalasIconComponent);
