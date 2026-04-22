/**
 * ContextPhase — "What happened?" input.
 *
 * The user picks a category, a weight, describes the situation in their
 * own words, optionally names who was involved, and picks a timeframe.
 * When all three required fields are filled (category, weight, ≥10 chars
 * description), a Proceed CTA fades in at the bottom.
 *
 * Mirrors `app/(mobile)/m/karma-reset/phases/ContextPhase.tsx`.
 */

import React, { useCallback, useMemo, useState } from 'react';
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
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { KarmaCategorySelector } from '../KarmaCategorySelector';
import { KarmaWeightSelector } from '../KarmaWeightSelector';
import type {
  KarmaCategory,
  KarmaResetContext,
  KarmaTimeframe,
  KarmaWeight,
} from '../types';
import { CATEGORY_COLORS } from '../types';

interface ContextPhaseProps {
  onComplete: (ctx: KarmaResetContext) => void;
}

const TIMEFRAMES: { id: KarmaTimeframe; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'recent', label: 'This week' },
  { id: 'ongoing', label: 'Ongoing' },
  { id: 'past', label: 'From the past' },
];

const WHO_OPTIONS: { id: 'self' | 'one_person' | 'group'; label: string }[] = [
  { id: 'self', label: 'Just me' },
  { id: 'one_person', label: 'One person' },
  { id: 'group', label: 'A group' },
];

function Chip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: isActive }}
      style={[
        styles.chip,
        {
          backgroundColor: isActive
            ? 'rgba(212,160,23,0.15)'
            : 'rgba(22,26,66,0.5)',
          borderColor: isActive
            ? 'rgba(212,160,23,0.5)'
            : 'rgba(255,255,255,0.06)',
        },
      ]}
    >
      <Text
        style={[
          styles.chipLabel,
          {
            color: isActive ? '#F0C040' : '#F0EBE1',
            fontWeight: isActive ? '500' : '400',
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function ContextPhase({
  onComplete,
}: ContextPhaseProps): React.JSX.Element {
  const [category, setCategory] = useState<KarmaCategory | null>(null);
  const [weight, setWeight] = useState<KarmaWeight | null>(null);
  const [description, setDescription] = useState('');
  const [timeframe, setTimeframe] = useState<KarmaTimeframe>('today');
  const [whoInvolved, setWhoInvolved] = useState<
    'self' | 'one_person' | 'group' | undefined
  >(undefined);

  const canProceed = useMemo(
    () =>
      category !== null && weight !== null && description.trim().length >= 10,
    [category, weight, description],
  );

  const handleSubmit = useCallback(() => {
    if (!canProceed || !category || !weight) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onComplete({
      category,
      weight,
      description: description.trim(),
      whoInvolved,
      timeframe,
    });
  }, [canProceed, category, weight, description, whoInvolved, timeframe, onComplete]);

  const wordCount = useMemo(
    () =>
      description
        .trim()
        .split(/\s+/)
        .filter(Boolean).length,
    [description],
  );

  const categoryColor = category ? CATEGORY_COLORS[category] : '#D4A017';

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Sacred header */}
        <View style={styles.header}>
          <Text style={styles.headerSanskrit}>दुःख-संयोग-वियोग</Text>
          <Text style={styles.headerEnglish}>
            Disconnection from suffering through conscious action
          </Text>
        </View>

        {/* Category */}
        <View style={styles.section}>
          <KarmaCategorySelector selected={category} onSelect={setCategory} />
        </View>

        {/* Weight */}
        <View style={styles.section}>
          <KarmaWeightSelector
            selected={weight}
            onSelect={setWeight}
            categoryColor={categoryColor}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>What happened? Speak freely.</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="In your own words... what action, thought, or situation are you examining?"
            placeholderTextColor="#6B6355"
            multiline
            maxLength={1000}
            textAlignVertical="top"
            style={styles.textarea}
            accessibilityLabel="Describe what happened"
          />
          <Text style={styles.wordCount}>✦ {wordCount} words</Text>
        </View>

        {/* Who involved */}
        <View style={styles.section}>
          <Text style={styles.label}>Who else was involved? (optional)</Text>
          <View style={styles.chipRow}>
            {WHO_OPTIONS.map((opt) => (
              <Chip
                key={opt.id}
                label={opt.label}
                isActive={whoInvolved === opt.id}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setWhoInvolved((prev) => (prev === opt.id ? undefined : opt.id));
                }}
              />
            ))}
          </View>
        </View>

        {/* Timeframe */}
        <View style={styles.section}>
          <Text style={styles.label}>When?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {TIMEFRAMES.map((tf) => (
              <Chip
                key={tf.id}
                label={tf.label}
                isActive={timeframe === tf.id}
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setTimeframe(tf.id);
                }}
              />
            ))}
          </ScrollView>
        </View>

        {/* Proceed */}
        {canProceed ? (
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={styles.proceedWrap}
          >
            <Pressable
              onPress={handleSubmit}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.proceed,
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.proceedEmoji}>🪷</Text>
              <Text style={styles.proceedLabel}>Bring This to Sakha</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 120,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 2,
  },
  headerSanskrit: {
    fontStyle: 'italic',
    fontSize: 10,
    color: '#6B6355',
  },
  headerEnglish: {
    fontSize: 10,
    color: '#6B6355',
  },
  section: {
    marginBottom: 28,
  },
  label: {
    fontSize: 11,
    color: '#6B6355',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  textarea: {
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.2)',
    borderRadius: 14,
    backgroundColor: 'rgba(22,26,66,0.5)',
    color: '#F0EBE1',
    padding: 14,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 110,
  },
  wordCount: {
    fontSize: 10,
    color: '#6B6355',
    textAlign: 'right',
    marginTop: 4,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipLabel: {
    fontSize: 13,
  },
  proceedWrap: {
    marginTop: 4,
  },
  proceed: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 28,
    backgroundColor: 'rgba(212,160,23,0.9)',
    shadowColor: '#D4A017',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 18,
    elevation: 8,
  },
  proceedEmoji: {
    fontSize: 16,
  },
  proceedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#050714',
    letterSpacing: 0.3,
  },
});
