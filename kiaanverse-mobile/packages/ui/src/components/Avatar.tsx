/**
 * Circular Avatar with image or fallback initials.
 */

import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { colors } from '../tokens/colors';

interface AvatarProps {
  uri?: string | undefined;
  name?: string | undefined;
  size?: number | undefined;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? '').toUpperCase();
}

export function Avatar({ uri, name = '', size = 40 }: AvatarProps): React.JSX.Element {
  const { theme } = useTheme();

  if (uri) {
    return (
      // Image alt-text is handled via accessibilityLabel on RN.
      <Image
        source={{ uri }}
        style={[
          styles.image,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
          },
        ]}
        accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.alpha.goldMedium,
        },
      ]}
      accessibilityLabel={name ? `${name}'s avatar` : 'User avatar'}
    >
      <Text
        style={[
          styles.initials,
          {
            fontSize: size * 0.4,
            color: theme.colors.accent,
          },
        ]}
      >
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    resizeMode: 'cover',
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontWeight: '600',
  },
});
