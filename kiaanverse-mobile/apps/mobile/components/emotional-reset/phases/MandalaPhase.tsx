/**
 * MandalaPhase — The Feeling Mandala (sacred emotion selection).
 *
 * The user taps one of six emotion petals, picks an intensity, and
 * optionally pours their heart into a short reflection. Submitting
 * advances to the Witness phase with the composed offering.
 *
 * Matches Phase 1 of the web flow.
 */

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FeelingMandala } from '../visuals/FeelingMandala';
import type { EmotionalState } from '../types';

interface MandalaPhaseProps {
  onOffer: (
    emotion: EmotionalState,
    intensity: number,
    context: string
  ) => void;
}

const CONTEXT_MAX = 500;

export function MandalaPhase({
  onOffer,
}: MandalaPhaseProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [emotion, setEmotion] = useState<EmotionalState | null>(null);
  const [intensity, setIntensity] = useState<number>(0);
  const [context, setContext] = useState<string>('');

  const canSubmit = emotion !== null && intensity > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 140 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.eyebrow}>The Paramatma is with you</Text>

        <FeelingMandala
          selectedEmotion={emotion}
          intensity={intensity}
          onSelectEmotion={(e) => {
            setEmotion(e);
            // Reset intensity when the emotion changes so the user
            // makes a conscious second choice, never defaulting.
            setIntensity(0);
          }}
          onSelectIntensity={setIntensity}
        />

        {canSubmit ? (
          <Animated.View
            entering={FadeInUp.duration(450)}
            style={styles.contextCard}
          >
            <Text style={styles.contextLabel}>
              Pour your heart here (optional)
            </Text>
            <TextInput
              value={context}
              onChangeText={(v) => setContext(v.slice(0, CONTEXT_MAX))}
              style={styles.contextInput}
              placeholder="Speak freely — this is sacred space"
              placeholderTextColor="rgba(237,232,220,0.35)"
              multiline
              maxLength={CONTEXT_MAX}
              textAlignVertical="top"
            />
            <Text style={styles.contextCount}>
              {context.length}/{CONTEXT_MAX}
            </Text>
          </Animated.View>
        ) : null}
      </ScrollView>

      {/* Sticky CTA */}
      {canSubmit ? (
        <View style={[styles.ctaRow, { paddingBottom: insets.bottom + 16 }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Offer to Sakha"
            onPress={() => {
              if (!emotion) return;
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onOffer(emotion, intensity, context.trim());
            }}
            style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
          >
            <LinearGradient
              colors={['#D4A017', '#F0C040']}
              style={styles.ctaGrad}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.ctaText}>🌺 Offer to Sakha</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingHorizontal: 20,
    gap: 20,
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 10,
    color: 'rgba(237,232,220,0.45)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  contextCard: {
    width: '100%',
    borderRadius: 20,
    padding: 14,
    backgroundColor: 'rgba(22,26,66,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    gap: 6,
  },
  contextLabel: {
    fontSize: 12,
    color: 'rgba(237,232,220,0.55)',
    fontStyle: 'italic',
  },
  contextInput: {
    minHeight: 100,
    fontSize: 15,
    color: '#EDE8DC',
    lineHeight: 22,
  },
  contextCount: {
    fontSize: 10,
    color: 'rgba(237,232,220,0.35)',
    alignSelf: 'flex-end',
    letterSpacing: 0.4,
  },
  ctaRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(5,7,20,0.85)',
  },
  cta: {
    borderRadius: 28,
    overflow: 'hidden',
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
