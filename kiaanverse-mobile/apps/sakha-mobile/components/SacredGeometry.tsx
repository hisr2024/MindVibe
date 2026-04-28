/**
 * SacredGeometry — slow-rotating mandala-style backdrop behind the
 * Shankha. Sets the cinematic stage without competing for attention.
 *
 * Per spec: subtle, divine, never cartoonish. Keep it geometric (not
 * pictorial) and very low opacity so the Shankha + sound waves are
 * always the focal point.
 *
 * Synchronized with the Shankha sound-wave amplitude — when Sakha
 * speaks, the mandala glows slightly brighter on the same RMS curve.
 */

import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { useVoiceStore } from '../stores/voiceStore';
import { Color } from '../lib/theme';

interface SacredGeometryProps {
  size?: number;
}

export function SacredGeometry({ size = 360 }: SacredGeometryProps) {
  const audioLevel = useVoiceStore((s) => s.audioLevel);
  const state = useVoiceStore((s) => s.state);
  const rotation = useSharedValue(0);
  const glow = useSharedValue(0.18);

  // Slow continuous rotation (60s for full revolution)
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 60_000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [rotation]);

  // Synchronize glow with Sakha's voice
  useEffect(() => {
    if (state === 'speaking') {
      glow.value = withTiming(0.18 + 0.22 * audioLevel, { duration: 60 });
    } else if (state === 'listening') {
      glow.value = withTiming(0.22, { duration: 600 });
    } else {
      glow.value = withTiming(0.12, { duration: 600 });
    }
  }, [state, audioLevel, glow]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
    opacity: glow.value,
  }));

  const center = size / 2;
  const r1 = size * 0.45;
  const r2 = size * 0.36;
  const r3 = size * 0.27;

  return (
    <View
      pointerEvents="none"
      style={[styles.wrap, { width: size, height: size }]}
    >
      <Animated.View style={containerStyle}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <Defs>
            <LinearGradient id="aura" x1="0" y1="0" x2="1" y2="1">
              <Stop offset="0%" stopColor={Color.divineGold} stopOpacity="0.7" />
              <Stop offset="100%" stopColor={Color.divineGoldDim} stopOpacity="0.2" />
            </LinearGradient>
          </Defs>
          {/* Outer ring */}
          <Circle
            cx={center}
            cy={center}
            r={r1}
            stroke="url(#aura)"
            strokeWidth={1.2}
            fill="none"
          />
          {/* Mandala petals — 12-fold symmetry */}
          <G>
            {Array.from({ length: 12 }, (_, i) => i).map((i) => {
              const angle = (i * Math.PI) / 6;
              const x1 = center + Math.cos(angle) * r3;
              const y1 = center + Math.sin(angle) * r3;
              const x2 = center + Math.cos(angle) * r1;
              const y2 = center + Math.sin(angle) * r1;
              return (
                <Path
                  key={i}
                  d={`M ${x1} ${y1} L ${x2} ${y2}`}
                  stroke={Color.divineGold}
                  strokeOpacity={0.5}
                  strokeWidth={0.8}
                />
              );
            })}
          </G>
          {/* Middle ring */}
          <Circle
            cx={center}
            cy={center}
            r={r2}
            stroke={Color.divineGold}
            strokeOpacity={0.55}
            strokeWidth={0.8}
            fill="none"
          />
          {/* Inner ring (closest to Shankha) */}
          <Circle
            cx={center}
            cy={center}
            r={r3}
            stroke={Color.divineGold}
            strokeOpacity={0.7}
            strokeWidth={1}
            fill="none"
          />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
