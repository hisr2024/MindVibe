/**
 * Viyoga — Intro Screen
 *
 * "The Sacred Space of Longing"
 *
 * Golden tear drop breathes with a 2.4s sigh; title + subtitle fade up
 * over 800ms after a brief pause so the screen arrives gently. The only
 * action is "Enter this Space", which pushes into the separation-type
 * selector at /tools/viyoga/step1.
 */

import React, { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// ── Golden tear drop — breathing, glowing ────────────────────────────────

function TearDrop(): React.JSX.Element {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.8);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 2400, easing: Easing.bezier(0.45, 0.05, 0.55, 0.95) }),
        withTiming(1.0, { duration: 2400, easing: Easing.bezier(0.45, 0.05, 0.55, 0.95) }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 2400 }),
        withTiming(0.6, { duration: 2400 }),
      ),
      -1,
      false,
    );
  }, [scale, opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[s.tearWrap, animStyle]}>
      <View style={s.tearGlow} />
      <Text style={s.tearText}>💧</Text>
    </Animated.View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────

export default function ViyogaIntro(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const t = setTimeout(() => {
      opacity.value = withTiming(1, { duration: 800 });
      translateY.value = withTiming(0, { duration: 800 });
    }, 300);
    return () => clearTimeout(t);
  }, [opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const handleBegin = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/tools/viyoga/step1' as never);
  };

  return (
    <View style={[s.screen, { paddingTop: insets.top + 24 }]}>
      <Animated.View style={[s.content, animStyle]}>
        <TearDrop />

        <Text style={s.titleSkt}>वियोग</Text>
        <Text style={s.titleEng}>The Sacred Space of Longing</Text>
        <Text style={s.subtitle}>Even in separation, there is union</Text>
      </Animated.View>

      <View style={[s.footer, { paddingBottom: insets.bottom + 24 }]}>
        <TouchableOpacity
          style={s.beginBtn}
          onPress={handleBegin}
          accessibilityRole="button"
          accessibilityLabel="Enter this Space"
        >
          <Text style={s.beginText}>Enter this Space</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#030510',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  tearWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  tearGlow: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(212,160,23,0.08)',
  },
  tearText: {
    fontSize: 64,
  },
  titleSkt: {
    fontFamily: 'NotoSansDevanagari-Bold',
    fontSize: 42,
    color: '#D4A017',
    lineHeight: 42 * 1.6,
    textAlign: 'center',
  },
  titleEng: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 20,
    color: 'rgba(240,235,225,0.9)',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 15,
    color: 'rgba(240,235,225,0.45)',
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    width: '100%',
    paddingHorizontal: 24,
  },
  beginBtn: {
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.4)',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
  },
  beginText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 18,
    color: '#D4A017',
  },
});
