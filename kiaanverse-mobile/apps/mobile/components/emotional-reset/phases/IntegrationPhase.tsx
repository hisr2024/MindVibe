/**
 * IntegrationPhase — Personalised wisdom + journal + affirmation talisman.
 *
 * Closes the reflective arc: shows the emotional-journey summary, saves
 * the shloka to the sacred library, offers a private journal, and
 * anchors the closing affirmation as a talisman card before the user
 * taps "Complete Sacred Reset".
 *
 * Mirrors Phase 4 of the web flow.
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AIResponse, EmotionalState } from '../types';

interface IntegrationPhaseProps {
  emotion: EmotionalState;
  intensity: number;
  response: AIResponse | null;
  onComplete: (journalEntry: string) => void;
}

export function IntegrationPhase({
  emotion,
  intensity,
  response,
  onComplete,
}: IntegrationPhaseProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [journal, setJournal] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.root}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 120 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Journey summary card */}
        <View style={styles.summaryCard}>
          <View
            style={[
              styles.summaryDot,
              {
                borderColor: `${emotion.glowColor}80`,
                backgroundColor: `${emotion.glowColor}20`,
              },
            ]}
          >
            <Text style={styles.summaryEmoji}>{emotion.emoji}</Text>
          </View>
          <View style={styles.summaryBody}>
            <Text style={styles.summaryEyebrow}>Your emotional journey</Text>
            <Text style={[styles.summaryLine, { color: emotion.glowColor }]}>
              {emotion.label} ({emotion.sanskrit}) · Intensity {intensity}/5
            </Text>
          </View>
        </View>

        {/* Saved shloka */}
        {response?.shloka?.translation ? (
          <View style={styles.shlokaCard}>
            <View style={styles.shlokaHeader}>
              <Text style={styles.shlokaSavedLabel}>
                Saved to Sacred Library
              </Text>
              <Text style={styles.shlokaBookmark}>🔖</Text>
            </View>
            <Text style={styles.shlokaText}>
              “{response.shloka.translation}”
            </Text>
            {response.shloka.reference ? (
              <Text style={styles.shlokaRef}>{response.shloka.reference}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Private journal */}
        <View style={styles.journalBlock}>
          <Text style={styles.journalLabel}>What arose for you?</Text>
          <ShankhaVoiceInput
            value={journal}
            onChangeText={setJournal}
            style={styles.journalInput}
            placeholder="Your sacred journal awaits…"
            multiline
            dictationMode="append"
            />
          <Text style={styles.journalHint}>This stays private and sacred</Text>
        </View>

        {/* Affirmation talisman */}
        {response?.affirmation ? (
          <View style={styles.talisman}>
            <Text style={styles.talismanOm}>ॐ</Text>
            <Text style={styles.talismanText}>“{response.affirmation}”</Text>
            <Text style={styles.talismanHint}>Carry this today</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky completion CTA */}
      <View style={[styles.ctaRow, { paddingBottom: insets.bottom + 16 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Complete sacred reset"
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onComplete(journal.trim());
          }}
          style={({ pressed }) => [styles.cta, pressed && { opacity: 0.85 }]}
        >
          <LinearGradient
            colors={['#D4A017', '#F0C040']}
            style={styles.ctaGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.ctaText}>Complete Sacred Reset</Text>
          </LinearGradient>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20, gap: 16 },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    backgroundColor: 'rgba(22,26,66,0.6)',
  },
  summaryDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  summaryEmoji: { fontSize: 16 },
  summaryBody: { flex: 1 },
  summaryEyebrow: {
    fontSize: 10,
    color: 'rgba(237,232,220,0.5)',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  summaryLine: {
    fontSize: 14,
    marginTop: 2,
  },
  shlokaCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.25)',
    backgroundColor: 'rgba(22,26,66,0.85)',
    gap: 6,
  },
  shlokaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shlokaSavedLabel: {
    fontSize: 10,
    color: '#D4A017',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  shlokaBookmark: { fontSize: 14 },
  shlokaText: {
    fontSize: 15,
    color: '#F0C040',
    fontStyle: 'italic',
    lineHeight: 24,
  },
  shlokaRef: {
    fontSize: 10,
    color: 'rgba(237,232,220,0.4)',
    textAlign: 'right',
  },
  journalBlock: { gap: 8 },
  journalLabel: {
    fontSize: 16,
    color: '#D4A017',
    fontStyle: 'italic',
  },
  journalInput: {
    minHeight: 130,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    backgroundColor: 'rgba(5,7,20,0.5)',
    color: '#EDE8DC',
    fontSize: 15,
    lineHeight: 22,
  },
  journalHint: {
    fontSize: 11,
    color: 'rgba(237,232,220,0.35)',
    fontStyle: 'italic',
  },
  talisman: {
    alignItems: 'center',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.5)',
    backgroundColor: 'rgba(5,7,20,0.9)',
    gap: 6,
  },
  talismanOm: {
    fontSize: 14,
    color: 'rgba(237,232,220,0.4)',
  },
  talismanText: {
    fontSize: 18,
    color: '#D4A017',
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 28,
    textShadowColor: 'rgba(212,160,23,0.2)',
    textShadowRadius: 14,
  },
  talismanHint: {
    fontSize: 10,
    color: 'rgba(237,232,220,0.4)',
    letterSpacing: 0.3,
  },
  ctaRow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'rgba(5,7,20,0.88)',
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
