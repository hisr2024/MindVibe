/**
 * ChatInput — bottom composer for the Sakha chat screen.
 *
 * Layout: [VoiceButton | SacredInput (flex:1) | SendButton]
 * - Container: 60 px + safeAreaInsets.bottom, rgba(5,7,20,0.95).
 * - Top border: transparent → gold → transparent GoldenDivider (1 px).
 * - Voice button: 44 px circle, 1 px border rgba(212,160,23,0.2), mic SVG.
 * - Sacred input: flex-1 dark field, italic placeholder "Ask Sakha anything…".
 * - Send button: 44 px circle, Krishna-aura LinearGradient + white lotus-arrow.
 *   - Disabled: opacity 0.3.
 *   - Press: scale 0.9 → 1.0, ImpactFeedbackStyle.Light haptic, one-shot
 *     golden pulse ring radiates from the button.
 *
 * KeyboardAvoidingView handling is performed by the parent screen so this
 * component stays reusable.
 */

import React, { useCallback, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type NativeSyntheticEvent,
  type TextInputSubmitEditingEventData,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const GOLD = '#D4A017';
const BG = 'rgba(5,7,20,0.95)';
const FIELD_BG = 'rgba(19,26,61,0.6)';
const TEXT_PRIMARY = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.5)';
const INPUT_HEIGHT = 44;
const ROW_HEIGHT = 60;

const KRISHNA_AURA: readonly [string, string, string] = [
  'rgba(27,79,187,0.95)',
  'rgba(66,41,155,0.9)',
  'rgba(212,160,23,0.75)',
];

function MicIcon({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2 a3 3 0 0 1 3 3 v6 a3 3 0 0 1 -6 0 v-6 a3 3 0 0 1 3 -3 Z" />
      <Path d="M6 11 a6 6 0 0 0 12 0" />
      <Line x1={12} y1={17} x2={12} y2={21} />
      <Line x1={9} y1={21} x2={15} y2={21} />
    </Svg>
  );
}

/** Lotus-tipped arrow: a leaf-shaped head with two petal accents. */
function LotusArrow({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      {/* Stem */}
      <Line x1={4} y1={20} x2={14} y2={10} />
      {/* Arrowhead — leaf silhouette */}
      <Path d="M20 4 L10 6 L14 10 L18 14 L20 4 Z" fill={color} />
      {/* Lotus petals at the tail */}
      <Circle cx={5} cy={19} r={1.2} fill={color} />
    </Svg>
  );
}

export interface ChatInputProps {
  /** Current draft text. */
  readonly value: string;
  /** Text-change handler. */
  readonly onChangeText: (text: string) => void;
  /** Submit handler — called when the user taps send or submits the field. */
  readonly onSubmit: () => void;
  /** Voice-input handler (STT wiring lives in the parent). */
  readonly onPressVoice?: () => void;
  /** Externally disable sending (e.g. while streaming). */
  readonly disabled?: boolean;
  /** Placeholder override. @default 'Ask Sakha anything…' */
  readonly placeholder?: string;
}

function ChatInputInner({
  value,
  onChangeText,
  onSubmit,
  onPressVoice,
  disabled = false,
  placeholder = 'Ask Sakha anything…',
}: ChatInputProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [focused, setFocused] = useState(false);

  const canSend = value.trim().length > 0 && !disabled;

  const pressScale = useSharedValue(1);
  /** 0 → 1 → 0 one-shot pulse fired on send. */
  const pulse = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    if (!canSend) return;
    pressScale.value = withTiming(0.9, { duration: 80 });
  }, [canSend, pressScale]);

  const handlePressOut = useCallback(() => {
    pressScale.value = withSpring(1.0, { damping: 14, stiffness: 260, mass: 0.7 });
  }, [pressScale]);

  const handleSend = useCallback(() => {
    if (!canSend) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    pulse.value = 0;
    pulse.value = withSequence(
      withTiming(1, { duration: 220, easing: Easing.out(Easing.quad) }),
      withTiming(0, { duration: 380, easing: Easing.in(Easing.quad) }),
    );
    onSubmit();
  }, [canSend, onSubmit, pulse]);

  const handleSubmitEditing = useCallback(
    (_e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) => handleSend(),
    [handleSend],
  );

  const sendButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
    opacity: canSend ? 1 : 0.3,
  }));

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: pulse.value * 0.7,
    transform: [{ scale: 1 + pulse.value * 0.9 }],
  }));

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: insets.bottom,
          height: ROW_HEIGHT + insets.bottom,
        },
      ]}
    >
      {/* Top golden divider */}
      <LinearGradient
        colors={['transparent', 'rgba(212,160,23,0.35)', 'transparent']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.divider}
      />

      <View style={styles.row}>
        <Pressable
          onPress={onPressVoice}
          accessibilityRole="button"
          accessibilityLabel="Voice input"
          style={styles.voiceButton}
          hitSlop={6}
        >
          <MicIcon color={GOLD} />
        </Pressable>

        <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder={placeholder}
            placeholderTextColor={TEXT_MUTED}
            style={styles.textInput}
            multiline={false}
            returnKeyType="send"
            onSubmitEditing={handleSubmitEditing}
            editable={!disabled}
            maxLength={2000}
            accessibilityLabel="Message Sakha"
          />
        </View>

        <View style={styles.sendWrap}>
          {/* Golden pulse ring (fires on send). */}
          <Animated.View
            pointerEvents="none"
            style={[styles.sendPulse, pulseStyle]}
          />

          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleSend}
            disabled={!canSend}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !canSend }}
            hitSlop={6}
          >
            <Animated.View style={[styles.sendButton, sendButtonStyle]}>
              <LinearGradient
                colors={KRISHNA_AURA as unknown as string[]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <LotusArrow color="#FFFFFF" />
            </Animated.View>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/** Bottom composer with voice, text field, and send button. */
export const ChatInput = React.memo(ChatInputInner);

const styles = StyleSheet.create({
  container: {
    backgroundColor: BG,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    height: ROW_HEIGHT,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,160,23,0.04)',
  },
  inputWrap: {
    flex: 1,
    height: INPUT_HEIGHT,
    borderRadius: 22,
    backgroundColor: FIELD_BG,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.12)',
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  inputWrapFocused: {
    borderColor: 'rgba(212,160,23,0.35)',
  },
  textInput: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontFamily: 'Outfit-Regular',
    fontSize: 15,
    // iOS italic placeholder is controlled via fontStyle on the component;
    // Android honors placeholderTextColor but not placeholder font style,
    // so we leave the TextInput upright for both.
    padding: 0,
    ...Platform.select({
      android: { textAlignVertical: 'center' },
      default: {},
    }),
  },
  sendWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPulse: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: GOLD,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
