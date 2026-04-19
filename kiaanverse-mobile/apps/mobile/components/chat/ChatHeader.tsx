/**
 * ChatHeader — top bar of the Sakha chat screen.
 *
 * - Height: 64 + safeAreaInsets.top.
 * - Background: rgba(5,7,20,0.95) — matches DivineTabBar for visual cohesion.
 * - Left: a MandalaSpin (40 px) wrapped in a DivinePresenceIndicator that
 *   breathes continuously. When `streaming` is true, breathing intensity
 *   doubles (halo expands + opacity swells).
 * - Title: "Sakha" — CormorantGaramond-Italic 20 px #D4A017.
 * - Sub:   "The Paramatma is listening" — Outfit 11 px muted, italic.
 * - Right: voice/audio toggle + language selector (minimal sacred icons).
 * - Bottom border: thin golden divider (no center mark).
 *
 * On SAKHA response complete the parent can call `pulse()` on the ref to
 * fire a one-shot golden pulse that radiates from the mandala.
 */

import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
} from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path, Line, Circle as SvgCircle } from 'react-native-svg';

// Lazy-load MandalaSpin so missing versions don't crash the render.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let MandalaSpin: React.ComponentType<any> | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports, global-require
  MandalaSpin = require('@kiaanverse/ui').MandalaSpin ?? null;
} catch {
  MandalaSpin = null;
}

const GOLD = '#D4A017';
const GOLD_MUTED = 'rgba(212,160,23,0.4)';
const TEXT_MUTED = 'rgba(200,191,168,0.6)';
const BG = 'rgba(5,7,20,0.95)';
const HEADER_CONTENT_HEIGHT = 64;
const MANDALA_SIZE = 40;
const HALO_SIZE = 60;

/** Imperative handle so the parent can fire a one-shot golden pulse. */
export interface ChatHeaderHandle {
  /** Fire a single golden pulse radiating from the mandala. */
  readonly pulse: () => void;
}

export interface ChatHeaderProps {
  /** Whether Sakha is actively streaming a response (doubles the halo). */
  readonly streaming: boolean;
  /** Voice / TTS toggle handler. */
  readonly onToggleVoice?: () => void;
  /** Language selector handler. */
  readonly onOpenLanguage?: () => void;
  /** Whether voice output is currently enabled (drives icon tint). */
  readonly voiceEnabled?: boolean;
}

function MicIcon({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 2 a3 3 0 0 1 3 3 v6 a3 3 0 0 1 -6 0 v-6 a3 3 0 0 1 3 -3 Z" />
      <Path d="M6 11 a6 6 0 0 0 12 0" />
      <Line x1={12} y1={17} x2={12} y2={21} />
      <Line x1={9} y1={21} x2={15} y2={21} />
    </Svg>
  );
}

function GlobeIcon({ color }: { color: string }): React.JSX.Element {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <SvgCircle cx={12} cy={12} r={9} />
      <Line x1={3} y1={12} x2={21} y2={12} />
      <Path d="M12 3 a13 13 0 0 1 0 18 a13 13 0 0 1 0 -18" />
    </Svg>
  );
}

export const ChatHeader = forwardRef<ChatHeaderHandle, ChatHeaderProps>(
  function ChatHeader(
    { streaming, onToggleVoice, onOpenLanguage, voiceEnabled = false },
    ref,
  ) {
    const insets = useSafeAreaInsets();

    /** Always-on breathing: scale 1.0 → 1.08 → 1.0 (idle) or 1.16 (streaming). */
    const breath = useSharedValue(0);
    /** Opacity of the always-on halo (idle ≈ 0.35, streaming doubles to ≈ 0.7). */
    const haloOpacity = useSharedValue(0.35);
    /** One-shot pulse ring (0 → 1 → 0 in ~900 ms) triggered by `pulse()`. */
    const pulsePhase = useSharedValue(0);

    useEffect(() => {
      breath.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      );
    }, [breath]);

    useEffect(() => {
      haloOpacity.value = withTiming(streaming ? 0.7 : 0.35, {
        duration: 280,
        easing: Easing.out(Easing.ease),
      });
    }, [streaming, haloOpacity]);

    useImperativeHandle(ref, () => ({
      pulse: () => {
        pulsePhase.value = 0;
        pulsePhase.value = withSequence(
          withTiming(1, { duration: 450, easing: Easing.out(Easing.quad) }),
          withTiming(0, { duration: 450, easing: Easing.in(Easing.quad) }),
        );
      },
    }));

    const haloStyle = useAnimatedStyle(() => {
      // In idle mode the halo breathes from 1.0 → 1.08. In streaming it
      // swells to 1.16 to communicate heightened divine presence.
      const maxScale = streaming ? 1.16 : 1.08;
      const scale = 1 + breath.value * (maxScale - 1);
      return {
        opacity: haloOpacity.value,
        transform: [{ scale }],
      };
    });

    const pulseStyle = useAnimatedStyle(() => ({
      opacity: pulsePhase.value * 0.6,
      transform: [{ scale: 1 + pulsePhase.value * 1.2 }],
    }));

    const mandalaSpeed = streaming ? 'fast' : 'slow';

    const containerStyle = useMemo(
      () => [
        styles.container,
        { paddingTop: insets.top, height: HEADER_CONTENT_HEIGHT + insets.top },
      ],
      [insets.top],
    );

    return (
      <View style={containerStyle}>
        <View style={styles.row}>
          {/* Left: SakhaMandala + DivinePresenceIndicator */}
          <View style={styles.avatarWrap} pointerEvents="none">
            {/* Outer pulse ring (fires on SAKHA response complete). */}
            <Animated.View
              style={[styles.pulseRing, pulseStyle]}
              pointerEvents="none"
            />
            {/* Steady breathing halo — doubles intensity when streaming. */}
            <Animated.View style={[styles.halo, haloStyle]} pointerEvents="none" />
            <View style={styles.mandalaWrap}>
              {MandalaSpin ? (
                <MandalaSpin
                  size={MANDALA_SIZE}
                  speed={mandalaSpeed}
                  opacity={0.9}
                  color={GOLD}
                />
              ) : (
                <View style={styles.mandalaFallback} />
              )}
            </View>
          </View>

          {/* Title + subtitle */}
          <View style={styles.titleBlock}>
            <Animated.Text style={styles.title} numberOfLines={1}>
              Sakha
            </Animated.Text>
            <Animated.Text style={styles.subtitle} numberOfLines={1}>
              The Paramatma is listening
            </Animated.Text>
          </View>

          {/* Right: voice + language */}
          <View style={styles.actions}>
            <Pressable
              onPress={onToggleVoice}
              accessibilityRole="button"
              accessibilityLabel="Toggle voice output"
              hitSlop={8}
              style={styles.iconButton}
            >
              <MicIcon color={voiceEnabled ? GOLD : GOLD_MUTED} />
            </Pressable>
            <Pressable
              onPress={onOpenLanguage}
              accessibilityRole="button"
              accessibilityLabel="Change language"
              hitSlop={8}
              style={styles.iconButton}
            >
              <GlobeIcon color={GOLD_MUTED} />
            </Pressable>
          </View>
        </View>

        {/* Bottom golden divider — transparent → gold → transparent. */}
        <LinearGradient
          colors={['transparent', 'rgba(212,160,23,0.35)', 'transparent']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.divider}
        />
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: BG,
    justifyContent: 'flex-end',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: HEADER_CONTENT_HEIGHT,
    gap: 12,
  },
  avatarWrap: {
    width: MANDALA_SIZE,
    height: MANDALA_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halo: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    backgroundColor: 'rgba(212,160,23,0.25)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  pulseRing: {
    position: 'absolute',
    width: HALO_SIZE,
    height: HALO_SIZE,
    borderRadius: HALO_SIZE / 2,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  mandalaWrap: {
    width: MANDALA_SIZE,
    height: MANDALA_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mandalaFallback: {
    width: MANDALA_SIZE,
    height: MANDALA_SIZE,
    borderRadius: MANDALA_SIZE / 2,
    borderWidth: 1,
    borderColor: GOLD,
  },
  titleBlock: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: 20,
    color: GOLD,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    fontStyle: 'italic',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  divider: {
    height: 1,
    width: '100%',
  },
});
