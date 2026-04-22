/**
 * KarmaXPSeal — XP counter + streak lotus row.
 *
 * The XP number animates from 0 → xpAwarded with a cubic ease-out so it
 * feels like a deceleration, not a linear tick. After 1.4s the streak
 * lotus row pops in; after 2.2s the "saved to journal" note fades
 * through a 3s in/out.
 *
 * Mirrors `app/(mobile)/m/karma-reset/components/KarmaXPSeal.tsx`.
 */

import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  FadeIn,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withSequence,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

interface KarmaXPSealProps {
  xpAwarded: number;
  streakCount: number;
}

export function KarmaXPSeal({
  xpAwarded,
  streakCount,
}: KarmaXPSealProps): React.JSX.Element {
  const [displayXP, setDisplayXP] = useState(0);
  const [showStreak, setShowStreak] = useState(false);
  const [showJournalSave, setShowJournalSave] = useState(false);

  // Cubic ease-out XP counter
  useEffect(() => {
    let frame = 0;
    const totalFrames = 60;
    const id = setInterval(() => {
      frame += 1;
      const eased = 1 - Math.pow(1 - frame / totalFrames, 3);
      setDisplayXP(Math.round(eased * xpAwarded));
      if (frame >= totalFrames) {
        clearInterval(id);
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      }
    }, 1200 / totalFrames);
    return () => clearInterval(id);
  }, [xpAwarded]);

  useEffect(() => {
    const t1 = setTimeout(() => setShowStreak(true), 1400);
    const t2 = setTimeout(() => setShowJournalSave(true), 2200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  // Card entrance: spring from scale 0.9, y=30
  const cardScale = useSharedValue(0.9);
  const cardY = useSharedValue(30);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    cardOpacity.value = withTiming(1, { duration: 300 });
    cardY.value = withSpring(0, { damping: 20, stiffness: 200 });
    cardScale.value = withSpring(1, { damping: 20, stiffness: 200 });
  }, [cardScale, cardY, cardOpacity]);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [
      { translateY: cardY.value },
      { scale: cardScale.value },
    ],
  }));

  // Journal-save fade-in then fade-out on a 3s cycle
  const journalOpacity = useSharedValue(0);
  useEffect(() => {
    if (showJournalSave) {
      journalOpacity.value = withSequence(
        withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) }),
        withDelay(
          1800,
          withTiming(0, { duration: 600, easing: Easing.in(Easing.ease) }),
        ),
      );
    }
  }, [showJournalSave, journalOpacity]);

  const journalStyle = useAnimatedStyle(() => ({
    opacity: journalOpacity.value,
  }));

  const lotusCount = Math.min(streakCount, 7);

  return (
    <View style={styles.container}>
      {/* XP card */}
      <Animated.View style={[styles.xpCard, cardStyle]}>
        <Animated.Text style={styles.xpLabel}>✦ Dharmic Offering</Animated.Text>
        <Animated.Text style={styles.xpNumber}>+{displayXP} XP</Animated.Text>
      </Animated.View>

      {/* Streak lotus row */}
      {showStreak ? (
        <Animated.View
          entering={FadeInUp.duration(500)}
          style={styles.streak}
        >
          <Animated.Text style={styles.streakLabel}>
            {streakCount} {streakCount === 1 ? 'Day' : 'Days'} of Dharmic Clarity
          </Animated.Text>
          <View style={styles.lotusRow}>
            {Array.from({ length: lotusCount }).map((_, i) => (
              <Animated.Text
                key={i}
                entering={FadeIn.delay(i * 80).duration(300)}
                style={styles.lotus}
              >
                🪷
              </Animated.Text>
            ))}
            {streakCount > 7 ? (
              <Animated.Text style={styles.lotusPlus}>+</Animated.Text>
            ) : null}
          </View>
        </Animated.View>
      ) : null}

      {/* Journal save toast */}
      {showJournalSave ? (
        <Animated.Text style={[styles.journalSave, journalStyle]}>
          ✦ Saved to your Karma Journal
        </Animated.Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
  },
  xpCard: {
    backgroundColor: 'rgba(17,20,53,0.98)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    borderTopWidth: 2,
    borderTopColor: 'rgba(212,160,23,0.5)',
    borderRadius: 24,
    paddingVertical: 24,
    paddingHorizontal: 32,
    alignItems: 'center',
    maxWidth: 260,
    shadowColor: '#050714',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.8,
    shadowRadius: 60,
    elevation: 12,
  },
  xpLabel: {
    fontSize: 10,
    color: '#D4A017',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  xpNumber: {
    fontSize: 52,
    fontWeight: '300',
    color: '#F0C040',
    textShadowColor: 'rgba(212,160,23,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
    lineHeight: 60,
  },
  streak: {
    alignItems: 'center',
    gap: 8,
  },
  streakLabel: {
    fontSize: 14,
    color: '#B8AE98',
  },
  lotusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lotus: {
    fontSize: 18,
    color: '#D4A017',
  },
  lotusPlus: {
    fontSize: 12,
    color: '#D4A017',
  },
  journalSave: {
    fontSize: 11,
    color: '#D4A017',
    textAlign: 'center',
  },
});
