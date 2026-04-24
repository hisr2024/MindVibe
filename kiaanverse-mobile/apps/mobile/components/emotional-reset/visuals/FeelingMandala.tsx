/**
 * FeelingMandala — Six-emotion sacred wheel.
 *
 * RN analogue of the web `<MobileFeelingMandala>`. Six petals (Anger, Fear,
 * Grief, Anxiety, Confusion, Despair) sit on a circle; tapping one selects
 * it and reveals a 1–5 intensity rail underneath. The selected petal swells
 * and takes on its glow color; the Sanskrit name animates in beneath.
 *
 * Implementation note: we use `react-native-svg` for the geometry because
 * Expo already depends on it for every other sacred wheel in the app, and
 * it cleanly handles transform origins without a full Skia scene graph.
 */

import React, { useMemo } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, G } from 'react-native-svg';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { EMOTIONS, type EmotionalState } from '../types';

interface FeelingMandalaProps {
  selectedEmotion: EmotionalState | null;
  intensity: number;
  onSelectEmotion: (e: EmotionalState) => void;
  onSelectIntensity: (i: number) => void;
}

export function FeelingMandala({
  selectedEmotion,
  intensity,
  onSelectEmotion,
  onSelectIntensity,
}: FeelingMandalaProps): React.JSX.Element {
  const { width } = useWindowDimensions();
  const size = Math.min(width - 32, 320);
  const cx = size / 2;
  const cy = size / 2;
  const petalR = size * 0.33;
  const petalSize = size * 0.16;

  const petals = useMemo(
    () =>
      EMOTIONS.map((emotion, i) => {
        const angle = (i / EMOTIONS.length) * Math.PI * 2 - Math.PI / 2;
        const x = cx + Math.cos(angle) * petalR;
        const y = cy + Math.sin(angle) * petalR;
        return { emotion, x, y };
      }),
    [cx, cy, petalR]
  );

  const intensityColor = selectedEmotion?.glowColor ?? '#D4A017';

  return (
    <View style={styles.root}>
      <View
        style={{
          width: size,
          height: size,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Sacred guide circle */}
        <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
          <G>
            <Circle
              cx={cx}
              cy={cy}
              r={petalR}
              stroke="rgba(212,160,23,0.18)"
              strokeWidth={1}
              fill="transparent"
            />
            <Circle
              cx={cx}
              cy={cy}
              r={petalR * 0.35}
              stroke="rgba(212,160,23,0.1)"
              strokeWidth={1}
              fill="transparent"
            />
          </G>
        </Svg>

        {/* Center label */}
        <View style={styles.centerLabel} pointerEvents="none">
          {selectedEmotion ? (
            <>
              <Text
                style={[
                  styles.centerLabelText,
                  { color: selectedEmotion.glowColor },
                ]}
              >
                {selectedEmotion.label}
              </Text>
              <Text
                style={[
                  styles.centerLabelSkt,
                  { color: selectedEmotion.glowColor },
                ]}
              >
                {selectedEmotion.sanskrit}
              </Text>
            </>
          ) : (
            <Text style={styles.centerPrompt}>What arises in you?</Text>
          )}
        </View>

        {/* Petals */}
        {petals.map(({ emotion, x, y }) => {
          const isSelected = selectedEmotion?.id === emotion.id;
          return (
            <Pressable
              key={emotion.id}
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onSelectEmotion(emotion);
              }}
              accessibilityRole="button"
              accessibilityLabel={`Select ${emotion.label} (${emotion.sanskrit})`}
              accessibilityState={{ selected: isSelected }}
              style={({ pressed }) => [
                styles.petal,
                {
                  width: petalSize,
                  height: petalSize,
                  borderRadius: petalSize / 2,
                  left: x - petalSize / 2,
                  top: y - petalSize / 2,
                  borderColor: isSelected
                    ? emotion.glowColor
                    : 'rgba(212,160,23,0.25)',
                  backgroundColor: isSelected
                    ? `${emotion.glowColor}22`
                    : 'rgba(255,255,255,0.04)',
                  transform: [
                    { scale: pressed ? 0.94 : isSelected ? 1.08 : 1 },
                  ],
                },
              ]}
            >
              <Text style={styles.petalEmoji}>{emotion.emoji}</Text>
              <Text
                style={[
                  styles.petalLabel,
                  isSelected && { color: emotion.glowColor },
                ]}
              >
                {emotion.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Intensity rail — appears only after an emotion is chosen */}
      {selectedEmotion ? (
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={styles.intensityBlock}
        >
          <Text style={styles.intensityPrompt}>How deep does it reach?</Text>
          <View style={styles.intensityRow}>
            {[1, 2, 3, 4, 5].map((n) => {
              const active = intensity === n;
              return (
                <Pressable
                  key={n}
                  accessibilityRole="button"
                  accessibilityLabel={`Intensity ${n} of 5`}
                  accessibilityState={{ selected: active }}
                  onPress={() => {
                    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelectIntensity(n);
                  }}
                  style={({ pressed }) => [
                    styles.intensityDot,
                    {
                      borderColor: active
                        ? intensityColor
                        : 'rgba(212,160,23,0.3)',
                      backgroundColor: active
                        ? `${intensityColor}33`
                        : 'rgba(255,255,255,0.04)',
                      transform: [{ scale: pressed ? 0.9 : 1 }],
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.intensityNum,
                      {
                        color: active
                          ? intensityColor
                          : 'rgba(237,232,220,0.55)',
                      },
                    ]}
                  >
                    {n}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          {intensity > 0 ? (
            <Animated.Text
              entering={FadeIn.duration(300)}
              style={styles.intensityHint}
            >
              {intensity <= 2
                ? 'A quiet ripple'
                : intensity <= 4
                  ? 'A strong current'
                  : 'A full storm'}
            </Animated.Text>
          ) : null}
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    alignItems: 'center',
    gap: 16,
  },
  centerLabel: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerLabelText: {
    fontSize: 22,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  centerLabelSkt: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.85,
  },
  centerPrompt: {
    fontSize: 13,
    color: 'rgba(237,232,220,0.55)',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  petal: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  petalEmoji: {
    fontSize: 18,
  },
  petalLabel: {
    fontSize: 10,
    color: 'rgba(237,232,220,0.75)',
    marginTop: 2,
    letterSpacing: 0.3,
  },
  intensityBlock: {
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  intensityPrompt: {
    fontSize: 13,
    color: 'rgba(237,232,220,0.6)',
    fontStyle: 'italic',
  },
  intensityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  intensityDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  intensityNum: {
    fontSize: 15,
    fontWeight: '600',
  },
  intensityHint: {
    fontSize: 11,
    color: 'rgba(237,232,220,0.45)',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});
