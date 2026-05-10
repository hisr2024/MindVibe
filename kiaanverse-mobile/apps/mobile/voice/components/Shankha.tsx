/**
 * Shankha (शङ्ख) — Krishna's conch.
 *
 * Renders the canonical Shankha PNG asset (``assets/shankha/shankha-mandala.png``
 * — an ornate golden conch inside a circular mandala). The SVG-rendered
 * variant that lived here previously has been deleted per founder
 * directive; this component is now a thin wrapper around ``Image``.
 *
 * Mounts the three sound-wave layers from useShankhaAnimation
 * (Reanimated worklets) so the visual hooks up to actual ExoPlayer
 * RMS metering during ``speaking`` / ``listening`` states.
 *
 * The PNG asset itself includes the mandala backdrop, so the
 * Voice Companion screen no longer needs to render a separate
 * SacredGeometry component alongside it.
 */

import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import {
  useShankhaAnimation,
  type ShankhaWaveLayer,
} from '../hooks/useShankhaAnimation';
import { Color } from '../lib/theme';

interface ShankhaProps {
  size?: number;
}

// Static require so Metro bundles the asset.
const SHANKHA_IMAGE = require('../../assets/shankha/shankha-mandala.png');

export function Shankha({ size = 220 }: ShankhaProps) {
  const { state, waveLayers } = useShankhaAnimation();
  const showWaves = state === 'speaking' || state === 'listening';
  // The container is sized 2× the visible image so the expanding
  // sound-wave rings have room to grow without clipping.
  return (
    <View style={[styles.container, { width: size * 2, height: size * 2 }]}>
      {showWaves
        ? waveLayers.map((layer, i) => (
            <SoundWaveLayer key={i} layer={layer} size={size} />
          ))
        : null}
      <Image
        source={SHANKHA_IMAGE}
        style={{ width: size * 1.6, height: size * 1.6 }}
        resizeMode="contain"
        accessibilityLabel="Shankha — Krishna's conch"
      />
    </View>
  );
}

function SoundWaveLayer({ layer, size }: { layer: ShankhaWaveLayer; size: number }) {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: layer.scale.value }],
    opacity: layer.opacity.value,
  }));
  return (
    <Animated.View
      style={[
        styles.waveLayer,
        animatedStyle,
        { width: size * 1.7, height: size * 1.7, borderRadius: (size * 1.7) / 2 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveLayer: {
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: Color.divineGold,
    backgroundColor: 'transparent',
  },
});
