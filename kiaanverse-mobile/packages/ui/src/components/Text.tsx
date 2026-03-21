/**
 * Themed Text component with typography preset support.
 */

import React from 'react';
import { Text as RNText, type TextProps as RNTextProps } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { textPresets, type TextPreset } from '../tokens/typography';

interface TextProps extends RNTextProps {
  variant?: TextPreset;
  color?: string;
  align?: 'left' | 'center' | 'right';
}

export function Text({
  variant = 'body',
  color,
  align,
  style,
  children,
  ...props
}: TextProps): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <RNText
      style={[
        textPresets[variant],
        { color: color ?? theme.colors.textPrimary },
        align && { textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}
