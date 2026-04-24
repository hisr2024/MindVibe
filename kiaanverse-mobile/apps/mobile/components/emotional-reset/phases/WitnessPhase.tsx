/**
 * WitnessPhase — Sakha receives the offering.
 *
 * Shows the word-by-word witness reveal, the shloka card, the reflection,
 * and the closing affirmation — or, if the backend flagged the user's
 * input as a crisis signal, a supportive safety panel that never
 * advances to breathing.
 *
 * Mirrors Phase 2 of the web flow. Loading, error and crisis states are
 * handled in-panel so the ceremony space is never broken.
 */

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OmLoader } from '@kiaanverse/ui';
import { WordReveal } from '../WordReveal';
import type { AIResponse, EmotionalState } from '../types';

interface WitnessPhaseProps {
  emotion: EmotionalState;
  intensity: number;
  loading: boolean;
  response: AIResponse | null;
  /** Non-empty when backend signalled crisis_detected. */
  crisis: string | null;
  error: string | null;
  onContinue: () => void;
  onExit: () => void;
}

export function WitnessPhase({
  emotion,
  intensity,
  loading,
  response,
  crisis,
  error,
  onContinue,
  onExit,
}: WitnessPhaseProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 140 },
      ]}
    >
      {/* Sakha receiving avatar */}
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <Text style={styles.avatarGlyph}>🙏</Text>
        </View>
        <Text style={styles.emotionLine}>
          {emotion.label} ({emotion.sanskrit}) · Intensity {intensity}/5
        </Text>
      </View>

      {/* Loading — "Sakha is receiving your offering…" */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <OmLoader size={48} label="Sakha is receiving your offering…" />
        </View>
      ) : null}

      {/* Error banner (flow still continues with fallback below) */}
      {!loading && error && !crisis ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {/* Crisis panel — safety first; never advance */}
      {!loading && crisis ? (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.crisisCard}
        >
          <Text style={styles.crisisEyebrow}>You are not alone</Text>
          <Text style={styles.crisisBody}>{crisis}</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Return to Sakha"
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onExit();
            }}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={['#D4A017', '#F0C040']}
              style={styles.ctaGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.ctaText}>Return to Sakha</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      ) : null}

      {/* Normal response */}
      {!loading && !crisis && response ? (
        <View style={styles.responseCol}>
          <WordReveal
            text={response.witness}
            speed={60}
            style={styles.witness}
          />

          {response.shloka.sanskrit ? (
            <Animated.View
              entering={FadeInUp.delay(600).duration(500)}
              style={styles.shlokaCard}
            >
              <View style={styles.shlokaTopBorder} />
              <Text style={styles.shlokaSanskrit}>
                {response.shloka.sanskrit}
              </Text>
              {response.shloka.transliteration ? (
                <Text style={styles.shlokaTransliteration}>
                  {response.shloka.transliteration}
                </Text>
              ) : null}
              <Text style={styles.shlokaTranslation}>
                {response.shloka.translation}
              </Text>
              {response.shloka.reference ? (
                <Text style={styles.shlokaRef}>
                  {response.shloka.reference}
                </Text>
              ) : null}
            </Animated.View>
          ) : null}

          {response.reflection ? (
            <Animated.Text
              entering={FadeIn.delay(1200).duration(500)}
              style={styles.reflection}
            >
              {response.reflection}
            </Animated.Text>
          ) : null}

          {response.affirmation ? (
            <Animated.Text
              entering={FadeIn.delay(1800).duration(500)}
              style={styles.affirmation}
            >
              “{response.affirmation}”
            </Animated.Text>
          ) : null}

          <Animated.View entering={FadeIn.delay(2400).duration(400)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Begin sacred breathing"
              onPress={() => {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onContinue();
              }}
              style={({ pressed }) => [
                styles.cta,
                pressed && { opacity: 0.85 },
              ]}
            >
              <LinearGradient
                colors={['#D4A017', '#F0C040']}
                style={styles.ctaGrad}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.ctaText}>Begin Sacred Breathing</Text>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    gap: 18,
  },
  avatarWrap: {
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212,160,23,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
    shadowColor: '#D4A017',
    shadowOpacity: 0.25,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 0 },
  },
  avatarGlyph: { fontSize: 30 },
  emotionLine: {
    fontSize: 13,
    color: 'rgba(237,232,220,0.6)',
    letterSpacing: 0.3,
  },
  loadingWrap: { alignItems: 'center', paddingVertical: 32 },
  errorBanner: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.35)',
    backgroundColor: 'rgba(249,115,22,0.08)',
  },
  errorText: {
    color: '#F97316',
    fontSize: 12,
  },
  crisisCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(249,115,22,0.4)',
    backgroundColor: 'rgba(22,26,66,0.9)',
    gap: 12,
  },
  crisisEyebrow: {
    fontSize: 10,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: '#F97316',
  },
  crisisBody: {
    fontSize: 15,
    color: '#EDE8DC',
    lineHeight: 24,
  },
  responseCol: {
    gap: 18,
  },
  witness: {
    fontSize: 17,
    lineHeight: 28,
    color: '#EDE8DC',
  },
  shlokaCard: {
    borderRadius: 18,
    padding: 18,
    backgroundColor: 'rgba(22,26,66,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.25)',
    gap: 6,
  },
  shlokaTopBorder: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 0,
    height: 2,
    backgroundColor: 'rgba(212,160,23,0.45)',
    borderRadius: 1,
  },
  shlokaSanskrit: {
    fontSize: 18,
    color: '#F0C040',
    textAlign: 'center',
    fontStyle: 'italic',
    textShadowColor: 'rgba(212,160,23,0.35)',
    textShadowRadius: 10,
  },
  shlokaTransliteration: {
    fontSize: 12,
    color: 'rgba(237,232,220,0.55)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  shlokaTranslation: {
    fontSize: 14,
    color: '#EDE8DC',
    textAlign: 'center',
    lineHeight: 22,
  },
  shlokaRef: {
    fontSize: 10,
    color: 'rgba(237,232,220,0.45)',
    textAlign: 'right',
    marginTop: 4,
  },
  reflection: {
    fontSize: 15,
    color: 'rgba(237,232,220,0.75)',
    lineHeight: 26,
    fontStyle: 'italic',
  },
  affirmation: {
    fontSize: 19,
    color: '#D4A017',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 28,
    marginTop: 4,
    textShadowColor: 'rgba(212,160,23,0.25)',
    textShadowRadius: 14,
  },
  cta: {
    borderRadius: 28,
    overflow: 'hidden',
    marginTop: 6,
  },
  ctaGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  ctaText: {
    color: '#050714',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
