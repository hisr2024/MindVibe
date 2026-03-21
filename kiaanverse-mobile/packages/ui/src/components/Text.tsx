/**
 * Themed Text component with typography variant support.
 */

import React from 'react';
import { Text as RNText, type TextProps as RNTextProps, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { typography, type TypographyVariant } from '../tokens/typography';

interface TextProps extends RNTextProps {
  variant?: TypographyVariant;
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
  const variantStyle = typography[variant];

  return (
    <RNText
      style={[
        variantStyle,
        { color: color ?? theme.textPrimary },
        align && { textAlign: align },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
}
