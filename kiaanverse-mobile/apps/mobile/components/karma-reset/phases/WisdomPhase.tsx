/**
 * WisdomPhase — Sakha delivers personalized Gita wisdom.
 *
 * The most visually rich phase: dharmic mirror, shloka card, dharmic
 * counsel, karmic insight, action dharma cards, affirmation. Sections
 * reveal on a timed stagger so the user has a moment with each piece
 * before the next one appears.
 *
 * Mirrors `app/(mobile)/m/karma-reset/phases/WisdomPhase.tsx`.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useKarmaReset } from '../../../hooks/useKarmaReset';
import { DharmaMirrorCard } from '../DharmaMirrorCard';
import { KarmaShlokaCard } from '../KarmaShlokaCard';
import { ActionDharmaCards } from '../ActionDharmaCards';
import { WordReveal } from '../WordReveal';
import type {
  KarmaReflectionAnswer,
  KarmaResetContext,
  KarmaWisdomResponse,
} from '../types';
import { CATEGORY_COLORS } from '../types';

interface WisdomPhaseProps {
  context: KarmaResetContext;
  reflections: KarmaReflectionAnswer[];
  onComplete: (wisdom: KarmaWisdomResponse) => void;
  /** Exposed so the orchestrator can collect committed practices on finish. */
  onActionsChange?: (committed: string[]) => void;
}

const LOADING_MESSAGES = [
  'Receiving your karma with full presence...',
  'Searching the eternal wisdom of the Gita...',
  'Krishna speaks through the ages...',
  'Finding the verse that was written for this moment...',
];

export function WisdomPhase({
  context,
  reflections,
  onComplete,
  onActionsChange,
}: WisdomPhaseProps): React.JSX.Element {
  const { fetchWisdom, isLoadingWisdom } = useKarmaReset();
  const [wisdom, setWisdom] = useState<KarmaWisdomResponse | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const fetchedRef = useRef(false);

  const categoryColor = CATEGORY_COLORS[context.category];

  // Fetch wisdom once
  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    const load = async () => {
      const result = await fetchWisdom(context, reflections);
      setWisdom(result);
      void Haptics.notificationAsync(
        Haptics.NotificationFeedbackType.Success,
      );
    };
    void load();
  }, [context, reflections, fetchWisdom]);

  // Cycle loading messages every 800ms
  useEffect(() => {
    if (!isLoadingWisdom) return;
    const id = setInterval(() => {
      setLoadingMsg((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 800);
    return () => clearInterval(id);
  }, [isLoadingWisdom]);

  // Pulsing avatar glow during load
  const glow = useSharedValue(0);
  useEffect(() => {
    glow.value = withRepeat(
      withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [glow]);
  const avatarStyle = useAnimatedStyle(() => ({
    shadowOpacity: 0.15 + 0.15 * glow.value,
    shadowRadius: 24 + 24 * glow.value,
  }));

  const handleProceed = useCallback(() => {
    if (!wisdom) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete(wisdom);
  }, [wisdom, onComplete]);

  return (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Loading state */}
      {!wisdom ? (
        <Animated.View
          entering={FadeIn.duration(300)}
          style={styles.loadingColumn}
        >
          <Animated.View style={[styles.avatar, avatarStyle]}>
            <Text style={styles.avatarFace}>🙏</Text>
          </Animated.View>

          {/* Reflections recap */}
          <View style={styles.recapColumn}>
            {reflections.map((r, i) => (
              <View
                key={i}
                style={[
                  styles.recapRow,
                  { borderLeftColor: categoryColor },
                ]}
              >
                <Text numberOfLines={1} style={styles.recapText}>
                  {r.answer}
                </Text>
              </View>
            ))}
          </View>

          {isLoadingWisdom ? (
            <Animated.View
              entering={FadeIn.duration(300)}
              style={styles.loadingRow}
            >
              <Text style={styles.loadingText}>
                {LOADING_MESSAGES[loadingMsg]}
              </Text>
              <ActivityIndicator size="small" color="#D4A017" />
            </Animated.View>
          ) : null}
        </Animated.View>
      ) : (
        <Animated.View entering={FadeIn.duration(400)} style={styles.wisdomColumn}>
          {/* 1. Dharmic mirror */}
          <DharmaMirrorCard
            text={wisdom.dharmicMirror}
            category={context.category}
          />

          {/* 2. Shloka card */}
          <Animated.View entering={FadeIn.delay(800).duration(400)}>
            <KarmaShlokaCard
              sanskrit={wisdom.primaryShloka.sanskrit}
              transliteration={wisdom.primaryShloka.transliteration}
              english={wisdom.primaryShloka.english}
              chapter={wisdom.primaryShloka.chapter}
              verse={wisdom.primaryShloka.verse}
              chapterName={wisdom.primaryShloka.chapterName}
              category={context.category}
            />
          </Animated.View>

          {/* 3. Dharmic counsel — sentence reveal */}
          <Animated.View entering={FadeIn.delay(1600).duration(400)}>
            <WordReveal
              text={wisdom.dharmicCounsel}
              speed={60}
              startDelay={200}
              style={styles.counselText}
            />
          </Animated.View>

          {/* 4. Karmic insight */}
          <Animated.View
            entering={FadeInDown.delay(2400).duration(400)}
            style={[
              styles.insightCard,
              {
                backgroundColor: `${categoryColor}14`,
                borderLeftColor: categoryColor,
              },
            ]}
          >
            <Text style={styles.insightText}>{wisdom.karmicInsight}</Text>
          </Animated.View>

          {/* 5. Action Dharma cards */}
          <Animated.View entering={FadeIn.delay(3000).duration(400)}>
            <ActionDharmaCards
              actions={wisdom.actionDharma}
              onCommit={onActionsChange}
            />
          </Animated.View>

          {/* 6. Affirmation */}
          <Animated.View
            entering={FadeIn.delay(3800).duration(400)}
            style={styles.affirmationColumn}
          >
            <Text style={styles.affirmation}>{wisdom.affirmation}</Text>
            <Text style={styles.affirmationHint}>
              Hold this. Then seal your sankalpa.
            </Text>
          </Animated.View>

          {/* CTA */}
          <Animated.View entering={FadeInUp.delay(4500).duration(400)}>
            <Pressable
              onPress={handleProceed}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.cta,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.ctaLabel}>Seal My Sankalpa</Text>
              <Text style={styles.ctaArrow}>→</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 60,
  },
  loadingColumn: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 16,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.3)',
    backgroundColor: 'rgba(17,20,53,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
  },
  avatarFace: {
    fontSize: 28,
  },
  recapColumn: {
    width: '100%',
    gap: 6,
    marginTop: 10,
  },
  recapRow: {
    height: 52,
    paddingHorizontal: 12,
    justifyContent: 'center',
    borderLeftWidth: 3,
    borderRadius: 8,
    backgroundColor: 'rgba(22,26,66,0.4)',
  },
  recapText: {
    fontSize: 13,
    color: '#B8AE98',
    fontStyle: 'italic',
  },
  loadingRow: {
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: '#B8AE98',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  wisdomColumn: {
    gap: 20,
  },
  counselText: {
    color: '#F0EBE1',
    fontSize: 16,
    lineHeight: 30,
  },
  insightCard: {
    borderLeftWidth: 3,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  insightText: {
    fontStyle: 'italic',
    fontSize: 16,
    color: '#F0EBE1',
    lineHeight: 26,
  },
  affirmationColumn: {
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  affirmation: {
    fontStyle: 'italic',
    fontSize: 26,
    color: '#F0C040',
    textAlign: 'center',
    lineHeight: 38,
    textShadowColor: 'rgba(212,160,23,0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  affirmationHint: {
    fontSize: 10,
    color: '#6B6355',
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 28,
    backgroundColor: 'rgba(212,160,23,0.9)',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050714',
    letterSpacing: 0.3,
  },
  ctaArrow: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050714',
  },
});
