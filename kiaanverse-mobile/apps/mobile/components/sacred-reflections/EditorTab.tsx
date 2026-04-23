/**
 * Sacred Reflections — EDITOR tab (लेख).
 *
 * 1:1 Kiaanverse.com mobile parity: mood pills with Devanagari + emoji,
 * title line, multi-line body, dharmic tag chips, E2E encryption notice,
 * "Offer This Reflection" CTA. Body is AES-256-GCM encrypted on-device
 * (see utils/sacredReflectionEncryption) — the server only ever sees
 * ciphertext plus plaintext mood / tag metadata.
 */

import React, { useCallback, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  GoldenButton,
  Text,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useCreateJournal } from '@kiaanverse/api';

import {
  COPY,
  MAX_USER_TAGS,
  MOODS,
  SACRED_TAGS,
  type MoodId,
  type SacredTag,
} from './constants';
import {
  encryptReflection,
  getIsoWeekKey,
  getWritingTimeOfDay,
} from '../../utils/sacredReflectionEncryption';

interface EditorTabProps {
  readonly onSaved: () => void;
}

/**
 * Merge mood / time-of-day / user tags into the plaintext metadata payload
 * the server will index. Mood stays first so legacy filters keep working.
 */
function buildTagsPayload(opts: {
  mood: MoodId | null;
  userTags: readonly SacredTag[];
  timeOfDay: string;
}): string[] {
  const tags: string[] = [];
  if (opts.mood) tags.push(opts.mood);
  tags.push(`time:${opts.timeOfDay}`);
  for (const tag of opts.userTags) {
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

export function EditorTab({ onSaved }: EditorTabProps): React.JSX.Element {
  const createJournal = useCreateJournal();
  const [mood, setMood] = useState<MoodId | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<SacredTag[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleMoodPress = useCallback((id: MoodId) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMood((prev) => (prev === id ? null : id));
  }, []);

  const handleTagPress = useCallback((tag: SacredTag) => {
    void Haptics.selectionAsync();
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_USER_TAGS) return prev;
      return [...prev, tag];
    });
  }, []);

  const handleOffer = useCallback(async () => {
    if (!mood) {
      Alert.alert('How do you feel?', 'Please select your current mood first.');
      return;
    }
    if (body.trim().length === 0) {
      Alert.alert('Sacred space awaits', 'Let the words come. Write your reflection before offering it.');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsSaving(true);
    try {
      const now = new Date();
      const payload = title.trim()
        ? `${title.trim()}\n\n${body.trim()}`
        : body.trim();
      const ciphertext = await encryptReflection(payload);
      const tags = buildTagsPayload({
        mood,
        userTags: selectedTags,
        timeOfDay: getWritingTimeOfDay(now.getHours()),
      });
      // week tag helps KarmaLytix group reflections without the server
      // decoding the date client-side.
      tags.push(`week:${getIsoWeekKey(now)}`);

      await createJournal.mutateAsync({ content_encrypted: ciphertext, tags });

      setMood(null);
      setTitle('');
      setBody('');
      setSelectedTags([]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
    } catch (err) {
      Alert.alert(
        'Could not offer reflection',
        err instanceof Error ? err.message : 'Please try again in a moment.',
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  }, [mood, title, body, selectedTags, createJournal, onSaved]);

  const wordCount = body.trim().length === 0
    ? 0
    : body.trim().split(/\s+/).length;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Mood prompt ---- */}
        <Text variant="label" color={colors.primary[500]} style={styles.sectionLabel}>
          {COPY.moodPrompt}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.moodRow}
        >
          {MOODS.map((m) => {
            const isActive = mood === m.id;
            return (
              <Pressable
                key={m.id}
                onPress={() => handleMoodPress(m.id)}
                style={[
                  styles.moodChip,
                  isActive && {
                    borderColor: m.color,
                    backgroundColor: `${m.color}22`,
                  },
                ]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
                accessibilityLabel={`Mood ${m.label}`}
              >
                <Text style={styles.moodEmoji}>{m.emoji}</Text>
                <Text
                  variant="caption"
                  color={isActive ? m.color : colors.primary[500]}
                  style={styles.moodSanskrit}
                >
                  {m.sanskrit}
                </Text>
                <Text
                  variant="caption"
                  color={isActive ? colors.text.primary : colors.text.secondary}
                  style={styles.moodLabel}
                >
                  {m.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ---- Title ---- */}
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={COPY.titlePlaceholder}
          placeholderTextColor={colors.text.muted}
          style={styles.titleInput}
          maxLength={120}
          returnKeyType="next"
        />
        <View style={styles.titleUnderline} />

        {/* ---- Body ---- */}
        <View style={styles.bodyWrap}>
          <TextInput
            value={body}
            onChangeText={setBody}
            placeholder={COPY.bodyPlaceholder}
            placeholderTextColor={colors.text.muted}
            style={styles.bodyInput}
            multiline
            textAlignVertical="top"
            maxLength={10_000}
          />
          {/* Voice mic affordance — hookup to /api/kiaan/transcribe comes in
              a later step; visually matches the Kiaanverse.com web UI. */}
          <Pressable
            style={styles.micButton}
            accessibilityRole="button"
            accessibilityLabel="Voice dictation (coming soon)"
            onPress={() =>
              Alert.alert('Voice coming soon', 'Voice dictation will arrive in the next release.')
            }
          >
            <Text style={styles.micIcon}>{'\u{1F399}\u{FE0F}'}</Text>
          </Pressable>
        </View>

        <Text variant="caption" color={colors.text.muted} style={styles.wordCount}>
          {wordCount === 0
            ? 'Begin writing...'
            : `✨ ${wordCount} word${wordCount === 1 ? '' : 's'} offered`}
        </Text>

        {/* ---- Tag chips ---- */}
        <View style={styles.tagGrid}>
          {SACRED_TAGS.map((tag) => {
            const isActive = selectedTags.includes(tag);
            return (
              <Pressable
                key={tag}
                onPress={() => handleTagPress(tag)}
                style={[styles.tagChip, isActive && styles.tagChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  variant="caption"
                  color={isActive ? colors.background.dark : colors.text.secondary}
                >
                  #{tag}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ---- Encryption notice ---- */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.encryptionBanner}>
          <Text style={styles.lockIcon}>{'\u{1F512}'}</Text>
          <Text variant="caption" color={colors.text.secondary} style={styles.encryptionText}>
            {COPY.encryptionNotice}
          </Text>
        </Animated.View>

        {/* ---- CTA ---- */}
        <GoldenButton
          title={isSaving ? 'Offering...' : COPY.ctaOffer}
          onPress={handleOffer}
          disabled={isSaving}
          style={styles.cta}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
    gap: spacing.sm,
  },
  sectionLabel: {
    letterSpacing: 1.5,
    marginBottom: spacing.xs,
  },
  moodRow: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    paddingRight: spacing.lg,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.blackLight,
    gap: spacing.xs,
  },
  moodEmoji: { fontSize: 16 },
  moodSanskrit: { fontSize: 13 },
  moodLabel: { letterSpacing: 1 },
  titleInput: {
    fontSize: 22,
    fontStyle: 'italic',
    color: colors.text.primary,
    paddingVertical: spacing.sm,
  },
  titleUnderline: {
    height: 1,
    backgroundColor: colors.alpha.goldMedium,
    marginBottom: spacing.md,
  },
  bodyWrap: {
    position: 'relative',
    minHeight: 180,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.blackLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  bodyInput: {
    fontSize: 17,
    lineHeight: 26,
    fontStyle: 'italic',
    color: colors.text.primary,
    minHeight: 150,
    paddingRight: 48, // leave room for mic FAB
  },
  micButton: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alpha.krishnaSoft,
    borderWidth: 1,
    borderColor: colors.divine.krishna,
  },
  micIcon: { fontSize: 18 },
  wordCount: {
    paddingVertical: spacing.xs,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  tagChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: 'transparent',
  },
  tagChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  encryptionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    marginTop: spacing.md,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.goldLight,
  },
  lockIcon: { fontSize: 14 },
  encryptionText: { flex: 1, lineHeight: 18 },
  cta: {
    marginTop: spacing.lg,
  },
});
