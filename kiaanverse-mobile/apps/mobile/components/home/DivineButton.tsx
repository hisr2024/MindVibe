/**
 * DivineButton — gold gradient CTA button matching the web /dashboard style.
 *
 * Wraps the existing GoldenButton from @kiaanverse/ui so the Home screen
 * uses a single, ceremonial button component with two clear variants:
 *   · primary  → solid gold gradient (Begin Dialogue)
 *   · secondary → outlined gold (Continue Today's Practice)
 */

import React from 'react';
import { type ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { GoldenButton } from '@kiaanverse/ui';

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
  accessibilityHint,
}: DivineButtonProps): React.JSX.Element {
  const handlePress = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <GoldenButton
      title={title}
      onPress={handlePress}
      variant={variant === 'primary' ? 'divine' : 'secondary'}
      {...(disabled !== undefined ? { disabled } : {})}
      {...(style !== undefined ? { style } : {})}
      {...(accessibilityHint !== undefined ? { accessibilityHint } : {})}
    />
  );
}
