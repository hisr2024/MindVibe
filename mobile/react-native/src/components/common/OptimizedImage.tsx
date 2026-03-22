/**
 * OptimizedImage — Performance-optimized image component
 *
 * Wraps expo-image with MindVibe project defaults:
 * - Memory + disk caching for fast subsequent loads
 * - Blurhash placeholder for smooth loading experience
 * - Cover content fit by default
 */

import React, { memo } from 'react';
import { Image, type ImageSource, type ImageStyle } from 'expo-image';
import type { StyleProp } from 'react-native';

// ---------------------------------------------------------------------------
// Default blurhash — warm golden tone matching MindVibe's divine theme
// ---------------------------------------------------------------------------

const DEFAULT_BLURHASH = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OptimizedImageProps {
  /** Image source — URL string or require() asset */
  source: ImageSource | string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** Additional styles */
  style?: StyleProp<ImageStyle>;
  /** Blurhash placeholder string (defaults to golden tone) */
  blurhash?: string;
  /** How the image fits its container (defaults to 'cover') */
  contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  /** Cache policy (defaults to 'memory-disk') */
  cachePolicy?: 'none' | 'disk' | 'memory' | 'memory-disk';
  /** Accessibility label for screen readers */
  accessibilityLabel?: string;
  /** Transition duration in ms (defaults to 200) */
  transition?: number;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function OptimizedImageInner({
  source,
  width,
  height,
  style,
  blurhash = DEFAULT_BLURHASH,
  contentFit = 'cover',
  cachePolicy = 'memory-disk',
  accessibilityLabel,
  transition = 200,
}: OptimizedImageProps) {
  return (
    <Image
      source={source}
      style={[{ width, height }, style]}
      contentFit={contentFit}
      cachePolicy={cachePolicy}
      placeholder={{ blurhash }}
      transition={transition}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="image"
    />
  );
}

OptimizedImageInner.displayName = 'OptimizedImage';

export const OptimizedImage = memo(OptimizedImageInner);

export default OptimizedImage;
