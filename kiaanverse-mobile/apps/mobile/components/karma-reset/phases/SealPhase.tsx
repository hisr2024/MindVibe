/**
 * SealPhase — Sacred completion ceremony.
 *
 * Sequence:
 *   - Mandala springs in.
 *   - t=900ms  : completion message reveals word-by-word.
 *   - t=1400ms : sankalpa recall appears between two golden threads.
 *   - t=1800ms : XP + streak seal renders.
 *   - t=3200ms : exit buttons fade in.
 *
 * The session is finalised via `finishSession` on mount; the ceremony
 * plays even if the API call fails (the hook returns a local fallback).
 *
 * Mirrors `app/(mobile)/m/karma-reset/phases/SealPhase.tsx`.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useKarmaReset } from '../../../hooks/useKarmaReset';
import { KarmaSealMandala } from '../visuals/KarmaSealMandala';
import { KarmaXPSeal } from '../KarmaXPSeal';
import { WordReveal } from '../WordReveal';
import type { KarmaResetSession } from '../types';

interface SealPhaseProps {
  session: KarmaResetSession;
  committedActions: string[];
}

export function SealPhase({
  session,
  committedActions,
}: SealPhaseProps): React.JSX.Element {
  const router = useRouter();
  const { finishSession } = useKarmaReset();

  const [showMessage, setShowMessage] = useState(false);
  const [showSankalpa, setShowSankalpa] = useState(false);
  const [showXP, setShowXP] = useState(false);
  const [showExit, setShowExit] = useState(false);
  const [xpAwarded, setXpAwarded] = useState(25);
  const [streakCount, setStreakCount] = useState(1);
  const completedRef = useRef(false);

  // Finish the session once — handles both happy path and fallback
  useEffect(() => {
    if (completedRef.current) return;
    completedRef.current = true;

    const complete = async () => {
      const result = await finishSession(
        session.sessionId,
        session.sankalpa?.sealed ?? false,
        committedActions,
      );
      setXpAwarded(result.xpAwarded);
      setStreakCount(result.streakCount);
    };
    void complete();
  }, [session, committedActions, finishSession]);

  // Staggered reveals
  useEffect(() => {
    const timers = [
      setTimeout(() => setShowMessage(true), 900),
      setTimeout(() => setShowSankalpa(true), 1400),
      setTimeout(() => setShowXP(true), 1800),
      setTimeout(() => setShowExit(true), 3200),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const handleReturn = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)');
  }, [router]);

  const handleJournal = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.replace('/journal');
  }, [router]);

  return (
    <View style={styles.root}>
      <KarmaSealMandala size={180} />

      {/* Completion message */}
      {showMessage ? (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.messageColumn}
        >
          <WordReveal
            text="Your karma has been met with dharma."
            speed={65}
            style={styles.message}
          />
          <Animated.Text
            entering={FadeIn.delay(600).duration(400)}
            style={styles.submessage}
          >
            You have acted with consciousness.
          </Animated.Text>
        </Animated.View>
      ) : null}

      {/* Sankalpa recall */}
      {showSankalpa && session.sankalpa ? (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.sankalpaRecall}
        >
          <View style={styles.threadLeft} />
          <Text numberOfLines={3} style={styles.sankalpaText}>
            {session.sankalpa.intentionText}
          </Text>
          <View style={styles.threadRight} />
        </Animated.View>
      ) : null}

      {/* XP + streak */}
      {showXP ? (
        <Animated.View
          entering={FadeInUp.duration(400)}
          style={styles.xpSection}
        >
          <KarmaXPSeal xpAwarded={xpAwarded} streakCount={streakCount} />
        </Animated.View>
      ) : null}

      {/* Exit options */}
      {showExit ? (
        <Animated.View
          entering={FadeIn.delay(300).duration(400)}
          style={styles.exitRow}
        >
          <Pressable
            onPress={handleReturn}
            accessibilityRole="button"
            accessibilityLabel="Return to Sakha"
            style={({ pressed }) => [
              styles.exitButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.exitLabel}>Return to Sakha</Text>
          </Pressable>
          <Pressable
            onPress={handleJournal}
            accessibilityRole="button"
            accessibilityLabel="Open Karma Journal"
            style={({ pressed }) => [
              styles.exitButton,
              pressed && { opacity: 0.7 },
            ]}
          >
            <Text style={styles.exitLabel}>Karma Journal</Text>
          </Pressable>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 20,
  },
  messageColumn: {
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  message: {
    fontSize: 17,
    color: '#F0EBE1',
    textAlign: 'center',
    lineHeight: 26,
  },
  submessage: {
    fontStyle: 'italic',
    fontSize: 16,
    color: '#B8AE98',
    textAlign: 'center',
  },
  sankalpaRecall: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
  },
  threadLeft: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(212,160,23,0.5)',
  },
  threadRight: {
    width: 40,
    height: 1,
    backgroundColor: 'rgba(212,160,23,0.5)',
  },
  sankalpaText: {
    fontStyle: 'italic',
    fontSize: 15,
    color: '#F0C040',
    lineHeight: 22,
    maxWidth: 280,
    textAlign: 'center',
    flexShrink: 1,
  },
  xpSection: {
    marginTop: 8,
  },
  exitRow: {
    flexDirection: 'row',
    gap: 12,
    maxWidth: 340,
    width: '100%',
  },
  exitButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  exitLabel: {
    fontSize: 13,
    color: '#D4A017',
  },
});
