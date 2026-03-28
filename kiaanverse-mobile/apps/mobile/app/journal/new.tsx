/**
 * New Journal Entry Screen
 *
 * Composer for creating a new sacred reflection. Includes title, multiline
 * content, mood selector, tags, and encryption before saving.
 * Keyboard-aware layout ensures inputs remain visible.
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  Input,
  GoldenButton,
  GoldenHeader,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useCreateJournal } from '@kiaanverse/api';

const MOOD_OPTIONS = [
  { emoji: '😔', label: 'Heavy', tag: 'heavy' },
  { emoji: '😕', label: 'Unsettled', tag: 'unsettled' },
  { emoji: '😐', label: 'Neutral', tag: 'neutral' },
  { emoji: '🙂', label: 'Peaceful', tag: 'peaceful' },
  { emoji: '😊', label: 'Blissful', tag: 'blissful' },
] as const;

export default function NewJournalScreen(): React.JSX.Element {
  const router = useRouter();
  const createJournal = useCreateJournal();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');

  const handleMoodSelect = useCallback((tag: string) => {
    void Haptics.selectionAsync();
    setSelectedMood((prev) => (prev === tag ? null : tag));
  }, []);

  const handleSave = useCallback(async () => {
    if (content.trim().length === 0) {
      Alert.alert('Empty Reflection', 'Please write something before saving.');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Placeholder encryption — in production, use proper AES-256-GCM
    const contentEncrypted = btoa(
      unescape(encodeURIComponent(content.trim())),
    );

    const tags: string[] = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (selectedMood) {
      tags.unshift(selectedMood);
    }

    try {
      await createJournal.mutateAsync({
        content_encrypted: contentEncrypted,
        tags,
      });
      router.back();
    } catch {
      Alert.alert(
        'Could Not Save',
        'Your reflection could not be saved right now. Please try again.',
      );
    }
  }, [content, tagsInput, selectedMood, createJournal, router]);

  const canSave = content.trim().length > 0;

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={spacing.navHeight}
      >
        <GoldenHeader title="New Reflection" onBack={() => router.back()} />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Title (optional) */}
          <Input
            label="Title (optional)"
            placeholder="Give your reflection a name..."
            value={title}
            onChangeText={setTitle}
            maxLength={120}
            returnKeyType="next"
          />

          {/* Content */}
          <View style={styles.contentSection}>
            <Text variant="label" color={colors.text.secondary}>
              Reflection
            </Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Pour your heart onto this sacred page..."
              placeholderTextColor={colors.text.muted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
              selectionColor={colors.primary[500]}
            />
          </View>

          {/* Mood Selector */}
          <View style={styles.moodSection}>
            <Text variant="label" color={colors.text.secondary}>
              How does your spirit feel?
            </Text>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((option) => (
                <Pressable
                  key={option.tag}
                  onPress={() => handleMoodSelect(option.tag)}
                  style={[
                    styles.moodOption,
                    selectedMood === option.tag && styles.moodSelected,
                  ]}
                  accessibilityLabel={option.label}
                  accessibilityRole="button"
                >
                  <Text variant="h2" align="center">
                    {option.emoji}
                  </Text>
                  <Text variant="caption" color={colors.text.muted} align="center">
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Tags */}
          <Input
            label="Tags (comma-separated)"
            placeholder="gratitude, morning, clarity..."
            value={tagsInput}
            onChangeText={setTagsInput}
            autoCapitalize="none"
            returnKeyType="done"
          />

          {/* Save Button */}
          <View style={styles.saveContainer}>
            <GoldenButton
              title="Save Reflection"
              onPress={handleSave}
              loading={createJournal.isPending}
              disabled={!canSave}
              variant="divine"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.bottomInset,
    gap: spacing.lg,
  },
  contentSection: {
    gap: spacing.xs,
  },
  contentInput: {
    minHeight: 180,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    borderRadius: 12,
    backgroundColor: colors.background.card,
    color: colors.text.primary,
    fontSize: 16,
    lineHeight: 24,
    padding: spacing.md,
    paddingTop: spacing.md,
  },
  moodSection: {
    gap: spacing.sm,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  moodOption: {
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 12,
    minWidth: 56,
  },
  moodSelected: {
    backgroundColor: colors.alpha.goldLight,
    borderWidth: 1,
    borderColor: colors.primary[500],
  },
  saveContainer: {
    paddingTop: spacing.md,
  },
});
