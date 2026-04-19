/**
 * DivineButton — Krishna Aura gradient CTA for the Home screen.
 *
 * Delegates to the shared DivineButton in @kiaanverse/ui so the "Begin
 * Dialogue" and "Continue Today's Practice" CTAs render with the sacred
 * blue → purple → gold LinearGradient (primary) or the outlined-gold pill
 * (secondary), with haptics and spring press animation built in.
 */

import React from 'react';
import { type ViewStyle } from 'react-native';
import { DivineButton as UiDivineButton } from '@kiaanverse/ui';

export interface DivineButtonProps {
  readonly title: string;
  readonly onPress: () => void;
  readonly variant?: 'primary' | 'secondary' | undefined;
  readonly disabled?: boolean | undefined;
  readonly style?: ViewStyle | undefined;
  readonly accessibilityHint?: string | undefined;
}

export function DivineButton({
  title,
  onPress,
  variant = 'primary',
  disabled,
  style,
}: DivineButtonProps): React.JSX.Element {
  return (
    <UiDivineButton
      title={title}
      onPress={onPress}
      variant={variant}
      {...(disabled !== undefined ? { disabled } : {})}
      {...(style !== undefined ? { style } : {})}
    />
  );
}
