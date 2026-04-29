/**
 * ShankhaVoiceInput — TextInput with a Shankha (शङ्ख) voice-dictation
 * button on the right.
 *
 * Drop-in replacement for plain <TextInput /> on every tool screen
 * (Ardha, Viyoga, Relationship Compass, Karma Reset, Emotional Reset,
 * Sakha Chat). User taps the conch → Android SpeechRecognizer captures
 * one utterance → transcript appends to (or replaces, configurable)
 * the current value.
 *
 * Visual states (Shankha button):
 *   • idle       — soft warm glow, copper rim
 *   • listening  — three concentric pulse rings expanding from the mouth
 *   • resolving  — quick inward shimmer (recognizer returned; settling)
 *   • error      — dimmed, no animation, brief inline error text below
 *
 * The Shankha asset reused here is the inline SVG from
 * voice/components/Shankha.tsx — same conch silhouette, just smaller.
 * When the production Lottie bundle ships in Part 11 of the FINAL.2
 * spec, this component automatically inherits the upgrade because both
 * components import from the same path.
 *
 * Privacy: the captured transcript is returned to the screen via
 * onChangeText. This component does NOT log it. The screen decides
 * whether the text is mirrored anywhere (journal, journey, etc.).
 *
 * Accessibility:
 *   • Shankha button has accessibilityRole="button" and a label that
 *     reflects the current state.
 *   • Hit target is 48dp (per TalkBack guidance + Material spec).
 *   • Error messages are announced via accessibilityLiveRegion.
 */

import React, { useCallback } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useDictation, type DictationState } from '../hooks/useDictation';

const COSMIC_VOID = '#050714';
const DIVINE_GOLD = 'rgba(212, 160, 23, 1)';
const DIVINE_GOLD_DIM = 'rgba(212, 160, 23, 0.55)';
const ERROR_DIM = 'rgba(231, 90, 80, 0.9)';
const WHISPER_WHITE = 'rgba(245, 240, 220, 0.92)';
const SHANKHA_HIT = 48;
const SHANKHA_GLYPH = 28;

export interface ShankhaVoiceInputProps
  extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  /** Current text value. Controlled. */
  value: string;
  /** Called when the user types OR when dictation returns. */
  onChangeText: (text: string) => void;
  /**
   * How to merge a successful dictation transcript into the current
   * value:
   *   • 'append' (default) — concatenates with a leading space if
   *     `value` is non-empty. Best for free-text fields where the
   *     user may also type or dictate multiple times.
   *   • 'replace' — overwrites the field. Best for short single-
   *     sentence inputs (one-line questions, short tags).
   */
  dictationMode?: 'append' | 'replace';
  /**
   * BCP-47 language tag passed to the SpeechRecognizer.
   *   "en-IN" — Indian English (default for KIAANverse audience)
   *   "hi-IN" — Hindi (India)
   *   "en-US" — US English
   */
  language?: string;
  /** Fired when dictation fails (permission denied, network, etc.). */
  onDictationError?: (code: string, message: string) => void;
  /** Optional accessibility label override for the Shankha button. */
  shankhaAccessibilityLabel?: string;
  /** Optional style for the input wrapper. */
  containerStyle?: TextInputProps['style'];
}

export function ShankhaVoiceInput({
  value,
  onChangeText,
  dictationMode = 'append',
  language = 'en-IN',
  onDictationError,
  shankhaAccessibilityLabel,
  containerStyle,
  style,
  multiline,
  ...rest
}: ShankhaVoiceInputProps): React.JSX.Element {
  const onTranscript = useCallback(
    (transcript: string) => {
      if (dictationMode === 'replace' || !value.trim()) {
        onChangeText(transcript);
      } else {
        onChangeText(`${value.trimEnd()} ${transcript}`);
      }
    },
    [value, onChangeText, dictationMode],
  );

  const { start, state } = useDictation({
    language,
    onTranscript,
    onError: onDictationError,
  });

  const labelByState = stateLabel(state);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        style={[styles.input, multiline && styles.inputMultiline, style]}
        multiline={multiline}
        placeholderTextColor="rgba(245, 240, 220, 0.45)"
        {...rest}
      />
      <Pressable
        onPress={() => {
          void start();
        }}
        disabled={state.tag === 'listening' || state.tag === 'resolving'}
        accessibilityRole="button"
        accessibilityLabel={shankhaAccessibilityLabel ?? labelByState}
        accessibilityState={{
          busy: state.tag === 'listening' || state.tag === 'resolving',
          disabled: state.tag === 'listening' || state.tag === 'resolving',
        }}
        style={styles.shankhaHit}
        hitSlop={8}
      >
        <ShankhaGlyph state={state} />
      </Pressable>
      {state.tag === 'error' && state.errorMessage ? (
        <Text
          style={styles.error}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {state.errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Shankha glyph — small inline SVG conch with state-driven pulse animation
// ────────────────────────────────────────────────────────────────────────────

interface ShankhaGlyphProps {
  state: DictationState;
}

function ShankhaGlyph({ state }: ShankhaGlyphProps): React.JSX.Element {
  const pulse = useSharedValue(0);

  React.useEffect(() => {
    if (state.tag === 'listening') {
      // Three-pulse sequence loops while listening — synchronized with
      // the larger Shankha on /voice-companion when speaking, just at
      // 0.4× scale so it doesn't dominate a TextInput row.
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700 }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      );
    } else {
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [state.tag, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.7 - pulse.value * 0.7,
    transform: [{ scale: 1 + pulse.value * 0.6 }],
  }));

  const tint =
    state.tag === 'error'
      ? ERROR_DIM
      : state.tag === 'idle'
        ? DIVINE_GOLD
        : DIVINE_GOLD_DIM;

  return (
    <View style={styles.glyphContainer}>
      {state.tag === 'listening' ? (
        <Animated.View style={[styles.pulseRing, ringStyle]} />
      ) : null}
      <Svg width={SHANKHA_GLYPH} height={SHANKHA_GLYPH} viewBox="0 0 64 64">
        <Defs>
          <LinearGradient id="conch" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(245, 240, 220, 0.95)" />
            <Stop offset="100%" stopColor="rgba(212, 160, 23, 0.55)" />
          </LinearGradient>
        </Defs>
        {/* Stylized conch silhouette — three-quarter angle, mouth at right */}
        <Path
          d="M14 40
             C 14 22, 26 12, 38 14
             C 50 16, 54 28, 50 38
             C 48 44, 42 48, 36 48
             C 32 48, 28 46, 26 42
             C 24 38, 24 34, 26 32
             L 22 30
             L 18 36
             Z"
          fill="url(#conch)"
          stroke={tint}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
        {/* Mouth opening — a small ellipse that catches the warm glow */}
        <Path
          d="M 44 22 Q 50 28 48 36"
          stroke={tint}
          strokeWidth={1}
          fill="none"
          strokeLinecap="round"
        />
      </Svg>
    </View>
  );
}

function stateLabel(state: DictationState): string {
  switch (state.tag) {
    case 'idle':
      return 'Tap to dictate with Sakha';
    case 'listening':
      return 'Sakha is listening — speak now';
    case 'resolving':
      return 'Settling';
    case 'error':
      return state.errorMessage ?? 'Dictation failed';
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(15, 18, 36, 0.55)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.18)',
    paddingLeft: 14,
    paddingRight: 4,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    color: WHISPER_WHITE,
    fontSize: 16,
    paddingVertical: 12,
    paddingRight: 8,
  },
  inputMultiline: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  shankhaHit: {
    width: SHANKHA_HIT,
    height: SHANKHA_HIT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphContainer: {
    width: SHANKHA_GLYPH + 12,
    height: SHANKHA_GLYPH + 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: SHANKHA_GLYPH + 8,
    height: SHANKHA_GLYPH + 8,
    borderRadius: (SHANKHA_GLYPH + 8) / 2,
    borderWidth: 1.2,
    borderColor: DIVINE_GOLD,
  },
  error: {
    position: 'absolute',
    bottom: -18,
    left: 14,
    fontSize: 11,
    color: ERROR_DIM,
  },
  // Cosmic-void backdrop reused so this component reads on the same
  // dark cards used across the tools.
  _scaleBackdrop: { backgroundColor: COSMIC_VOID } as never,
});
