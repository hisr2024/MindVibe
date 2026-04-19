/**
 * Post Composer Screen
 *
 * Compose a new community post with content, optional circle selection,
 * tag chips, and character limit indicator. "Share Wisdom" button submits
 * the post and navigates back on success.
 */

import React, { useState, useCallback, useMemo } from 'react';
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
import { useCreatePost, useCommunityCircles } from '@kiaanverse/api';

const MAX_CHARS = 500;

export default function ComposeScreen(): React.JSX.Element {
  const router = useRouter();
  const createPost = useCreatePost();
  const { data: circles } = useCommunityCircles();

  const [content, setContent] = useState('');
  const [selectedCircleId, setSelectedCircleId] = useState<string | undefined>(undefined);
  const [tagsInput, setTagsInput] = useState('');

  const charsRemaining = MAX_CHARS - content.length;
  const isOverLimit = charsRemaining < 0;
  const canSubmit = content.trim().length > 0 && !isOverLimit;

  const charCountColor = useMemo(() => {
    if (isOverLimit) return colors.semantic.error;
    if (charsRemaining < 50) return colors.semantic.warning;
    return colors.text.muted;
  }, [charsRemaining, isOverLimit]);

  const handleContentChange = useCallback((text: string) => {
    setContent(text);
  }, []);

  const handleCircleSelect = useCallback((circleId: string) => {
    void Haptics.selectionAsync();
    setSelectedCircleId((prev) => (prev === circleId ? undefined : circleId));
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const tags: string[] = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    try {
      await createPost.mutateAsync({
        content: content.trim(),
        ...(selectedCircleId !== undefined ? { circle_id: selectedCircleId } : {}),
        ...(tags.length > 0 ? { tags } : {}),
      });
      router.back();
    } catch {
      Alert.alert(
        'Could Not Post',
        'Your wisdom could not be shared right now. Please try again.',
      );
    }
  }, [canSubmit, content, selectedCircleId, tagsInput, createPost, router]);

  const availableCircles = useMemo(
    () => (circles ?? []).filter((c) => c.isJoined),
    [circles],
  );

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={spacing.navHeight}
      >
        <GoldenHeader title="Share Wisdom" onBack={() => router.back()} />

        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Content Input */}
          <View style={styles.contentSection}>
            <Text variant="label" color={colors.text.secondary}>
              What wisdom would you like to share?
            </Text>
            <TextInput
              style={styles.contentInput}
              placeholder="Share your thoughts, insights, or a question..."
              placeholderTextColor={colors.text.muted}
              value={content}
              onChangeText={handleContentChange}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
              selectionColor={colors.primary[500]}
              maxLength={MAX_CHARS + 20}
            />
            <Text variant="caption" color={charCountColor} style={styles.charCount}>
              {charsRemaining} characters remaining
            </Text>
          </View>

          {/* Circle Selector */}
          {availableCircles.length > 0 ? (
            <View style={styles.circleSection}>
              <Text variant="label" color={colors.text.secondary}>
                Post to Circle (optional)
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.circleRow}
              >
                {availableCircles.map((circle) => (
                  <Pressable
                    key={circle.id}
                    onPress={() => handleCircleSelect(circle.id)}
                    style={[
                      styles.circleChip,
                      selectedCircleId === circle.id && styles.circleChipActive,
                    ]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: selectedCircleId === circle.id }}
                  >
                    <Text
                      variant="caption"
                      color={
                        selectedCircleId === circle.id
                          ? colors.background.dark
                          : colors.text.secondary
                      }
                    >
                      {circle.name}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Tags */}
          <Input
            label="Tags (comma-separated)"
            placeholder="wisdom, meditation, gratitude..."
            value={tagsInput}
            onChangeText={setTagsInput}
            autoCapitalize="none"
            returnKeyType="done"
          />

          {/* Submit */}
          <View style={styles.submitContainer}>
            <GoldenButton
              title="Share Wisdom"
              onPress={handleSubmit}
              loading={createPost.isPending}
              disabled={!canSubmit}
              variant="divine"
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.bottomInset,
    gap: spacing.lg,
  },
  contentSection: {
    gap: spacing.xs,
  },
  contentInput: {
    minHeight: 160,
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
  charCount: {
    textAlign: 'right',
  },
  circleSection: {
    gap: spacing.xs,
  },
  circleRow: {
    gap: spacing.xs,
  },
  circleChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.goldLight,
  },
  circleChipActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  submitContainer: {
    paddingTop: spacing.md,
  },
});
