/**
 * Viyoga — Step 2: Details + CTA
 *
 * Collects the three answers the loading screen will hand to Sakha:
 *   - separated_from  (free text)
 *   - intensity       (Fresh | Present | Deep | Old | Eternal)
 *   - wish_to_say     (free text, gold-framed)
 *
 * The intensity "slider" is a custom 5-tick control — we don't depend on
 * @react-native-community/slider (not installed); instead we follow the
 * onboarding GitaFamiliarityStep pattern of pressable tick targets plus a
 * Reanimated thumb. This keeps the screen dependency-clean and matches the
 * rest of the sacred-flow UI.
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSacredFlow } from '@/hooks/useSacredFlow';

// ── Intensity points — exact copy from the kiaanverse screenshot ──────────
interface IntensityPoint {
  readonly value: number;
  readonly skt: string;
  readonly eng: string;
}

const INTENSITY_POINTS: readonly IntensityPoint[] = [
  { value: 0, skt: 'नव', eng: 'Fresh' },
  { value: 1, skt: 'उपस्थित', eng: 'Present' },
  { value: 2, skt: 'गहरा', eng: 'Deep' },
  { value: 3, skt: 'पुराना', eng: 'Old' },
  { value: 4, skt: 'शाश्वत', eng: 'Eternal' },
];

const DEFAULT_INTENSITY: IntensityPoint = INTENSITY_POINTS[2] ?? {
  value: 2,
  skt: 'गहरा',
  eng: 'Deep',
};

// ── Intensity slider — custom 5-point, gesture-free (tap-to-select) ───────

interface IntensitySliderProps {
  readonly value: number;
  readonly onChange: (value: number) => void;
}

function IntensitySlider({ value, onChange }: IntensitySliderProps): React.JSX.Element {
  const { width: screenWidth } = useWindowDimensions();
  // ScrollView paddingHorizontal is 20, and we give the slider room to breathe.
  const trackWidth = Math.max(screenWidth - 40 - 32, 120);
  const segmentWidth = trackWidth / (INTENSITY_POINTS.length - 1);

  const thumbX = useSharedValue(value * segmentWidth);

  useEffect(() => {
    thumbX.value = withSpring(value * segmentWidth, { damping: 20, stiffness: 200 });
  }, [value, segmentWidth, thumbX]);

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: thumbX.value }],
  }));

  const fillStyle = useAnimatedStyle(() => ({
    width: thumbX.value,
  }));

  const handleSelect = useCallback(
    (level: number) => {
      void Haptics.selectionAsync();
      onChange(level);
    },
    [onChange],
  );

  return (
    <View style={s.sliderWrap}>
      <View style={[s.track, { width: trackWidth }]}>
        <Animated.View style={[s.trackFill, fillStyle]} />
        <Animated.View style={[s.thumb, thumbStyle]} />

        {INTENSITY_POINTS.map((p) => (
          <Pressable
            key={p.value}
            onPress={() => handleSelect(p.value)}
            style={[s.tickTarget, { left: p.value * segmentWidth - 20 }]}
            accessibilityRole="adjustable"
            accessibilityLabel={p.eng}
            accessibilityValue={{ text: p.eng }}
          >
            <View style={[s.tick, p.value <= value && s.tickActive]} />
          </Pressable>
        ))}
      </View>

      <View style={[s.sliderLabels, { width: trackWidth }]}>
        {INTENSITY_POINTS.map((p, i) => (
          <View key={p.value} style={s.sliderLabel}>
            <Text style={[s.sliderSkt, value === i && s.sliderActive]}>{p.skt}</Text>
            <Text style={[s.sliderEng, value === i && s.sliderEngActive]}>{p.eng}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────────────────

export default function ViyogaStep2(): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { updateAnswer, status } = useSacredFlow('viyoga');

  const [separatedFrom, setSeparatedFrom] = useState('');
  const [intensity, setIntensity] = useState<number>(DEFAULT_INTENSITY.value);
  const [wishToSay, setWishToSay] = useState('');

  const currentPoint: IntensityPoint = INTENSITY_POINTS[intensity] ?? DEFAULT_INTENSITY;
  const canSubmit = separatedFrom.trim().length > 0 && wishToSay.trim().length > 0;
  const isCalling = status === 'calling';

  const handleSubmit = (): void => {
    if (!canSubmit || isCalling) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    updateAnswer('separated_from', separatedFrom.trim());
    updateAnswer('intensity', currentPoint.eng);
    updateAnswer('wish_to_say', wishToSay.trim());

    // The loading screen owns the Sakha call — we just hand control.
    router.push('/tools/viyoga/loading' as never);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#030510' }}
      keyboardVerticalOffset={0}
    >
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={s.question}>Who or what are you separated from?</Text>
        <TextInput
          style={s.textInput}
          value={separatedFrom}
          onChangeText={setSeparatedFrom}
          placeholder="A name, a place, a version of yourself..."
          placeholderTextColor="rgba(240,235,225,0.25)"
          autoCapitalize="words"
        />

        <Text style={s.question}>How far does this separation feel?</Text>
        <IntensitySlider value={intensity} onChange={setIntensity} />

        <Text style={s.wishQuestion}>What do you wish you could say to them?</Text>
        <TextInput
          style={[s.textInput, s.wishInput]}
          value={wishToSay}
          onChangeText={setWishToSay}
          placeholder="I wish..."
          placeholderTextColor="rgba(212,160,23,0.3)"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={[s.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity
          style={[s.ctaBtn, !canSubmit && s.ctaBtnOff]}
          onPress={handleSubmit}
          disabled={!canSubmit || isCalling}
          accessibilityRole="button"
          accessibilityLabel="Bring this to Sakha"
          accessibilityState={{ disabled: !canSubmit || isCalling }}
        >
          <LinearGradient
            colors={['#1B4FBB', '#0E7490']}
            style={s.ctaBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={s.ctaBtnText}>
              {isCalling ? 'Listening...' : 'Bring This to Sakha'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  question: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 18,
    color: 'rgba(240,235,225,0.85)',
    marginBottom: 12,
    lineHeight: 26,
  },
  wishQuestion: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 18,
    color: '#D4A017',
    marginBottom: 12,
    lineHeight: 26,
  },
  textInput: {
    backgroundColor: 'rgba(22,26,66,0.85)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: 'Outfit-Regular',
    color: '#F0EBE1',
    marginBottom: 24,
  },
  wishInput: {
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'CrimsonText-Italic',
    fontSize: 15,
    borderColor: 'rgba(212,160,23,0.4)',
  },

  // Slider
  sliderWrap: {
    alignItems: 'center',
    marginBottom: 24,
  },
  track: {
    height: 4,
    backgroundColor: 'rgba(212,160,23,0.2)',
    borderRadius: 2,
    justifyContent: 'center',
  },
  trackFill: {
    position: 'absolute',
    left: 0,
    height: 4,
    backgroundColor: '#D4A017',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    left: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#D4A017',
    borderWidth: 2,
    borderColor: '#030510',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  tickTarget: {
    position: 'absolute',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    top: -18,
  },
  tick: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(212,160,23,0.3)',
  },
  tickActive: {
    backgroundColor: '#D4A017',
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  sliderLabel: {
    alignItems: 'center',
    width: 56,
  },
  sliderSkt: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 10,
    color: 'rgba(240,235,225,0.4)',
    lineHeight: 20,
  },
  sliderEng: {
    fontFamily: 'Outfit-Regular',
    fontSize: 10,
    color: 'rgba(240,235,225,0.4)',
  },
  sliderActive: {
    color: '#D4A017',
  },
  sliderEngActive: {
    color: '#D4A017',
    fontFamily: 'Outfit-SemiBold',
  },

  // Footer
  footer: {
    paddingHorizontal: 20,
  },
  ctaBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  ctaBtnOff: {
    opacity: 0.4,
  },
  ctaBtnGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaBtnText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    color: '#fff',
  },
});
