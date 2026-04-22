/**
 * CeremonyPhase — The final sacred completion ceremony.
 *
 * This is the screen captured in the Kiaanverse.com mobile screenshot:
 *
 *   "Your offering has been received. The Atman within you is untouched."
 *
 *        ✨
 *
 *   EMOTIONAL RESET COMPLETE
 *   Duration: 2 min   Anger → Peace
 *
 *   [ Return to Sakha ]
 *
 * Sequence on mount (matches web):
 *   t=0     : 108 Skia particles spawn from edges → converge on center.
 *   t=1200  : OM glyph blooms at center (haptic: heavy).
 *   t=1700  : particles burst outward.
 *   t=2000  : particles drift up and fade; message reveals word-by-word.
 *   t=3800  : sparkle + stats + "Return to Sakha" button fade in.
 *
 * The backend session is completed lazily in the background — if the
 * network call fails the ceremony still plays so the user never sees a
 * broken ending.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CeremonyParticles,
  type CeremonyStage,
} from '../visuals/CeremonyParticles';
import { WordReveal } from '../WordReveal';
import type { EmotionalState, AIResponse } from '../types';

interface CeremonyPhaseProps {
  emotion: EmotionalState;
  response: AIResponse | null;
  sessionId: string | null;
  durationMinutes: number;
  /** Fired when session completion has been requested on the backend. */
  completeSession: (sessionId: string) => Promise<void>;
  /** Tapped the "Return to Sakha" button. */
  onReturn: () => void;
}

export function CeremonyPhase({
  emotion,
  response,
  sessionId,
  durationMinutes,
  completeSession,
  onReturn,
}: CeremonyPhaseProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [stage, setStage] = useState<CeremonyStage>('converge');
  const [showMessage, setShowMessage] = useState(false);
  const [messageRevealed, setMessageRevealed] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const fired = useRef(false);

  // OM glyph animation
  const omScale = useSharedValue(0);
  const omOpacity = useSharedValue(0);
  const omStyle = useAnimatedStyle(() => ({
    transform: [{ scale: omScale.value }],
    opacity: omOpacity.value,
  }));

  // Fire-and-forget backend completion, exactly once.
  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    if (!sessionId) return;
    completeSession(sessionId).catch(() => {
      // Ceremony plays regardless of API success — the user never
      // sees a failed ending for something as sacred as this.
    });
  }, [sessionId, completeSession]);

  // Staged choreography
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    // Particles already start at 'converge' on mount.
    timers.push(setTimeout(() => {
      setStage('om');
      omScale.value = withSpring(1, { damping: 9, stiffness: 120 });
      omOpacity.value = withTiming(1, { duration: 260 });
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 1200));

    timers.push(setTimeout(() => {
      setStage('burst');
      omScale.value = withTiming(2, { duration: 500, easing: Easing.out(Easing.cubic) });
      omOpacity.value = withTiming(0, { duration: 500 });
    }, 1700));

    timers.push(setTimeout(() => {
      setStage('float');
      setShowMessage(true);
    }, 2100));

    timers.push(setTimeout(() => {
      setShowSummary(true);
    }, 3800));

    timers.push(setTimeout(() => {
      setStage('done');
    }, 5200));

    return () => timers.forEach(clearTimeout);
  }, [omScale, omOpacity]);

  const handleReturn = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onReturn();
  }, [onReturn]);

  const durationLabel = `${Math.max(1, Math.round(durationMinutes))} min`;

  return (
    <View style={styles.root}>
      {/* Particles behind everything */}
      <CeremonyParticles stage={stage} />

      {/* OM glyph — blooms at center during the `om` stage */}
      <View
        style={[
          styles.omWrap,
          { top: height / 2 - 40, left: width / 2 - 40 },
        ]}
        pointerEvents="none"
      >
        <Animated.Text style={[styles.om, omStyle]}>ॐ</Animated.Text>
      </View>

      {/* Message column */}
      <View style={styles.messageCol}>
        {showMessage ? (
          <View style={styles.messageInner}>
            <WordReveal
              text="Your offering has been received. The Atman within you is untouched."
              speed={80}
              style={styles.messageText}
              onComplete={() => setMessageRevealed(true)}
            />
            {messageRevealed && response?.shloka?.translation ? (
              <Animated.Text
                entering={FadeIn.delay(400).duration(500)}
                style={styles.shlokaQuote}
              >
                “{response.shloka.translation}”
              </Animated.Text>
            ) : null}
          </View>
        ) : null}

        {/* Summary + sparkle + CTA (the screen in the screenshot) */}
        {showSummary ? (
          <Animated.View
            entering={FadeIn.duration(500)}
            style={[styles.summaryCol, { paddingBottom: insets.bottom + 16 }]}
          >
            <Animated.View
              entering={FadeIn.duration(400)}
              style={styles.sparkleWrap}
            >
              <View style={styles.sparkleCircle}>
                <Text style={styles.sparkle}>✨</Text>
              </View>
            </Animated.View>

            <Text style={styles.completeEyebrow}>EMOTIONAL RESET COMPLETE</Text>

            <View style={styles.statsRow}>
              <Text style={styles.stat}>Duration: {durationLabel}</Text>
              <Text style={styles.stat}>
                {emotion.label}  →  Peace
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Return to Sakha"
              onPress={handleReturn}
              style={({ pressed }) => [
                styles.returnBtn,
                pressed && { opacity: 0.7 },
              ]}
            >
              <Text style={styles.returnText}>Return to Sakha</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050714',
  },
  omWrap: {
    position: 'absolute',
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  om: {
    fontSize: 64,
    color: '#D4A017',
    textShadowColor: 'rgba(212,160,23,0.55)',
    textShadowRadius: 24,
  },
  messageCol: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    zIndex: 10,
  },
  messageInner: {
    alignItems: 'center',
    gap: 14,
    maxWidth: 360,
  },
  messageText: {
    fontSize: 20,
    lineHeight: 30,
    color: '#EDE8DC',
    textAlign: 'center',
  },
  shlokaQuote: {
    fontSize: 15,
    color: '#D4A017',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCol: {
    alignItems: 'center',
    gap: 12,
    marginTop: 36,
  },
  sparkleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
    backgroundColor: 'rgba(212,160,23,0.1)',
    shadowColor: '#D4A017',
    shadowOpacity: 0.3,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    elevation: 6,
  },
  sparkle: {
    fontSize: 28,
  },
  completeEyebrow: {
    fontSize: 10,
    color: 'rgba(237,232,220,0.55)',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 2,
  },
  stat: {
    fontSize: 11,
    color: 'rgba(237,232,220,0.7)',
    letterSpacing: 0.3,
  },
  returnBtn: {
    marginTop: 20,
    paddingHorizontal: 36,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#D4A017',
  },
  returnText: {
    fontSize: 14,
    color: '#D4A017',
    letterSpacing: 0.3,
  },
});
