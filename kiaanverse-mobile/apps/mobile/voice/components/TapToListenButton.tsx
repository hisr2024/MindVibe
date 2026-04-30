/**
 * TapToListenButton — Sakha conch button that reads any text aloud.
 *
 * Drop-in component to add anywhere a block of text deserves to be heard
 * (verses, journal entries, journey content, sadhana wisdom, karma reset
 * shloka cards, sacred reflection bodies, etc.). Visually mirrors the
 * Shankha button in ShankhaVoiceInput — same conch glyph, same cosmic-
 * void backdrop, same warm-gold accent — so the user reads "this
 * button = Sakha" consistently across the app.
 *
 * Two providers supported:
 *
 *   provider="system"  (default)
 *     Uses expo-speech → Android's system TTS engine. Pros:
 *       • Instant, no network, no latency budget
 *       • Free
 *       • Works offline
 *     Cons:
 *       • Generic system voice — not the Sakha persona
 *       • Sanskrit pronunciation often mangled
 *
 *   provider="sakha"
 *     Calls backend Sarvam (Indic) / ElevenLabs (English) TTS to get
 *     the actual Sakha voice. Pros:
 *       • The voice users trust — same persona as /voice-companion
 *       • Sanskrit handled correctly (Sarvam Devanagari support)
 *     Cons:
 *       • Network round-trip (~500–1500ms first byte)
 *       • Requires backend env vars set
 *       • Costs API credits
 *
 *   Recommendation: use "system" for journal entries, journey content,
 *   sadhana phase wisdom (where instant playback matters more than
 *   voice fidelity). Use "sakha" for Bhagavad Gita verse cards
 *   (where Sanskrit must be pronounced correctly and the persona must
 *   match the voice companion experience).
 *
 * Visual states:
 *   • idle     — soft warm conch, copper rim
 *   • loading  — inward shimmer (only relevant for provider="sakha"
 *                while waiting for backend response)
 *   • playing  — three-pulse wave from the conch mouth, gold rim brightens
 *   • error    — dimmed, no animation, brief inline error text
 *
 * Tap behavior:
 *   • Tap from idle → starts playback
 *   • Tap from playing → stops playback (component returns to idle)
 *   • Tap from loading → cancels the request
 *   • Tap from error → resets to idle (retry by tapping again)
 *
 * Privacy:
 *   The text passed to this component is sent to the TTS provider. For
 *   provider="system", that's the on-device Android TTS (no network).
 *   For provider="sakha", it's POSTed to the backend, which forwards
 *   to Sarvam / ElevenLabs. Don't pass user-private text (journal
 *   contents) to provider="sakha" without consent — system is the safe
 *   default for personal text.
 *
 * Accessibility:
 *   • accessibilityRole="button"
 *   • accessibilityState reflects playing/loading
 *   • accessibilityLabel: "Listen to Sakha read this aloud" / "Stop reading"
 *   • Hit target 48dp (TalkBack-friendly)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Speech from 'expo-speech';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

const DIVINE_GOLD = 'rgba(212, 160, 23, 1)';
const DIVINE_GOLD_DIM = 'rgba(212, 160, 23, 0.55)';
const ERROR_DIM = 'rgba(231, 90, 80, 0.9)';
const HIT = 48;
const GLYPH = 28;

type State = 'idle' | 'loading' | 'playing' | 'error';

export interface TapToListenButtonProps {
  /** Text to read aloud. Required. Pass the full block — line breaks honored. */
  text: string;
  /**
   * BCP-47 language tag. Defaults to 'en-IN' (Indian English) which
   * matches the persona's default register. Pass 'hi-IN' for Hindi
   * verse readings, 'sa' for Sanskrit (system TTS won't pronounce
   * Sanskrit well — use provider="sakha" for that).
   */
  language?: string;
  /**
   * Which TTS engine to use. "system" (default) is on-device, instant,
   * free. "sakha" calls the backend Sarvam/ElevenLabs pipeline for the
   * actual Sakha voice — adds network latency.
   */
  provider?: 'system' | 'sakha';
  /**
   * For provider="system" — speech rate (0.0–2.0). Default 0.85 for
   * contemplative pace. Honored only by system provider.
   */
  rate?: number;
  /** For provider="system" — pitch (0.5–2.0). Default 1.0. */
  pitch?: number;
  /**
   * Optional callback when playback ends (whether by completion or
   * the user tapping stop).
   */
  onEnd?: () => void;
  /** Optional error sink. */
  onError?: (code: string, message: string) => void;
  /** Optional accessibility label override. */
  accessibilityLabel?: string;
  /** Optional size override (in dp). Defaults to 48dp hit target. */
  size?: number;
}

export function TapToListenButton({
  text,
  language = 'en-IN',
  provider = 'system',
  rate = 0.85,
  pitch = 1.0,
  onEnd,
  onError,
  accessibilityLabel,
  size = HIT,
}: TapToListenButtonProps): React.JSX.Element {
  const [state, setState] = useState<State>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const cancelRef = useRef(false);

  // Cleanup on unmount — never leave a Speech session running.
  useEffect(() => {
    return () => {
      cancelRef.current = true;
      Speech.stop().catch(() => {});
    };
  }, []);

  const handleTap = useCallback(async () => {
    // Tap-to-cancel from loading or playing.
    if (state === 'playing' || state === 'loading') {
      cancelRef.current = true;
      Speech.stop().catch(() => {});
      setState('idle');
      onEnd?.();
      return;
    }
    // Tap-to-reset from error.
    if (state === 'error') {
      setState('idle');
      setErrorMsg(null);
      return;
    }

    // Tap from idle → start playback.
    cancelRef.current = false;
    if (provider === 'system') {
      setState('playing');
      Speech.speak(text, {
        language,
        rate,
        pitch,
        onDone: () => {
          if (cancelRef.current) return;
          setState('idle');
          onEnd?.();
        },
        onStopped: () => {
          setState('idle');
          onEnd?.();
        },
        onError: (err) => {
          const code = 'TTS_SYSTEM_ERROR';
          const message = (err as Error)?.message ?? 'System TTS error';
          setState('error');
          setErrorMsg(message);
          onError?.(code, message);
        },
      });
      return;
    }

    // provider === "sakha" — call backend. Lazy-import to avoid
    // pulling axios into bundles that only use system TTS.
    setState('loading');
    try {
      const audioUrl = await synthesizeSakhaTts(text, language);
      if (cancelRef.current) return;
      // The audio URL is played through the same KiaanAudioPlayer the
      // voice companion uses (lazy import to avoid coupling).
      const { playOnce } = await import(
        '../lib/native/KiaanAudioPlayerHelper'
      );
      setState('playing');
      await playOnce(audioUrl, () => {
        if (cancelRef.current) return;
        setState('idle');
        onEnd?.();
      });
    } catch (e) {
      const code = (e as { code?: string })?.code ?? 'TTS_SAKHA_ERROR';
      const message = (e as Error)?.message ?? 'Sakha TTS failed';
      setState('error');
      setErrorMsg(message);
      onError?.(code, message);
    }
  }, [state, text, language, provider, rate, pitch, onEnd, onError]);

  const label =
    accessibilityLabel ??
    (state === 'playing' ? 'Stop reading' : 'Listen to Sakha read this aloud');

  return (
    <View style={styles.wrap}>
      <Pressable
        onPress={() => {
          void handleTap();
        }}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{
          busy: state === 'loading' || state === 'playing',
        }}
        style={[styles.hit, { width: size, height: size }]}
        hitSlop={8}
      >
        <ShankhaListenGlyph state={state} />
      </Pressable>
      {state === 'error' && errorMsg ? (
        <Text
          style={styles.errorText}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          {errorMsg}
        </Text>
      ) : null}
    </View>
  );
}

// ─── Glyph (matches ShankhaVoiceInput's visual language) ──────────────

interface GlyphProps {
  state: State;
}

function ShankhaListenGlyph({ state }: GlyphProps): React.JSX.Element {
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (state === 'playing') {
      pulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 700 }),
          withTiming(0, { duration: 0 }),
        ),
        -1,
        false,
      );
    } else if (state === 'loading') {
      pulse.value = withRepeat(
        withTiming(0.4, { duration: 600 }),
        -1,
        true,
      );
    } else {
      pulse.value = withTiming(0, { duration: 200 });
    }
  }, [state, pulse]);

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.7 - pulse.value * 0.7,
    transform: [{ scale: 1 + pulse.value * 0.6 }],
  }));

  const tint =
    state === 'error'
      ? ERROR_DIM
      : state === 'idle'
        ? DIVINE_GOLD
        : DIVINE_GOLD_DIM;

  return (
    <View style={styles.glyphContainer}>
      {state === 'playing' || state === 'loading' ? (
        <Animated.View style={[styles.pulseRing, ringStyle]} />
      ) : null}
      <Svg width={GLYPH} height={GLYPH} viewBox="0 0 64 64">
        <Defs>
          <LinearGradient id="conchListen" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="rgba(245, 240, 220, 0.95)" />
            <Stop offset="100%" stopColor="rgba(212, 160, 23, 0.55)" />
          </LinearGradient>
        </Defs>
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
          fill="url(#conchListen)"
          stroke={tint}
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
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

// ─── Sakha-voice TTS lazy helper (only loads when provider="sakha") ──

async function synthesizeSakhaTts(
  text: string,
  language: string,
): Promise<string> {
  // POST to backend /api/voice-companion/synthesize which routes to
  // Sarvam (Indic) or ElevenLabs (English) per language. Returns the
  // URL of a cached .opus blob the audio player can stream.
  const Constants = (await import('expo-constants')).default;
  const baseUrl =
    (Constants.expoConfig?.extra as { apiBaseUrl?: string })?.apiBaseUrl ??
    'https://mindvibe-api.onrender.com';
  const axios = (await import('axios')).default;
  const resp = await axios.post<{ audio_url: string }>(
    `${baseUrl}/api/voice-companion/synthesize`,
    { text, language },
    { timeout: 12_000 },
  );
  return resp.data.audio_url;
}

// ─── Styles ────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  hit: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  glyphContainer: {
    width: GLYPH + 12,
    height: GLYPH + 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: GLYPH + 8,
    height: GLYPH + 8,
    borderRadius: (GLYPH + 8) / 2,
    borderWidth: 1.2,
    borderColor: DIVINE_GOLD,
  },
  errorText: {
    marginTop: 4,
    fontSize: 11,
    color: ERROR_DIM,
  },
});
