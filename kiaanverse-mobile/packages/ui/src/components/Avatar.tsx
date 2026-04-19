/**
 * Circular Avatar with image or fallback initials.
 */

import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { useTheme } from '../theme/useTheme';
import { colors } from '../tokens/colors';

interface AvatarProps {
  /** Avatar image URL. Prefer `uri`; `imageUrl` is accepted for call-site
   *  parity with the web component. */
  uri?: string | undefined;
  imageUrl?: string | undefined;
  name?: string | undefined;
  size?: number;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]?.[0] ?? ''}${parts[1]?.[0] ?? ''}`.toUpperCase();
  }
  return (parts[0]?.slice(0, 2) ?? '').toUpperCase();
}

export function Avatar({ uri, imageUrl, name = '', size = 40 }: AvatarProps): React.JSX.Element {
  const { theme } = useTheme();
  const src = uri ?? imageUrl;

  if (src) {
    return (
      // eslint-disable-next-line jsx-a11y/alt-text -- React Native Image uses accessibilityLabel, not alt
      <Image
        source={{ uri: src }}
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
