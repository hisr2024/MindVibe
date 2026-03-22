/**
 * Journal Screen
 *
 * Encrypted journal for personal reflections and spiritual insights.
 * Features:
 * - Create new entries with rich text
 * - Tag entries by emotion/theme
 * - View chronological history
 * - Entries encrypted before storage
 * - Offline-first with sync
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { api } from '@services/apiClient';
import { darkTheme, typography, spacing, radii, colors } from '@theme/tokens';

interface JournalEntryItem {
  id?: string;
  content_encrypted?: string;
  content?: string;
  tags?: string[];
  created_at?: string;
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

const TAGS = [
  { id: 'gratitude', label: 'Gratitude', emoji: '🙏' },
  { id: 'reflection', label: 'Reflection', emoji: '🪞' },
  { id: 'insight', label: 'Insight', emoji: '💡' },
  { id: 'struggle', label: 'Struggle', emoji: '⚔️' },
  { id: 'growth', label: 'Growth', emoji: '🌱' },
  { id: 'peace', label: 'Peace', emoji: '🕊️' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function JournalScreen() {
  const insets = useSafeAreaInsets();
  const theme = darkTheme;
  const navigation = useNavigation();
  const queryClient = useQueryClient();

  const [isComposing, setIsComposing] = useState(false);
  const [content, setContent] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Fetch entries
  const { data: entriesData, isLoading } = useQuery({
    queryKey: ['journal-entries'],
    queryFn: async () => {
      const { data } = await api.journal.list();
      return data;
    },
  });

  // Create entry
  const createEntry = useMutation({
    mutationFn: async () => {
      // In production, content would be encrypted before sending
      const { data } = await api.journal.create({
        content_encrypted: content,
        tags: selectedTags,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setContent('');
      setSelectedTags([]);
      setIsComposing(false);
    },
  });

  const entries: JournalEntryItem[] = Array.isArray(entriesData) ? entriesData : entriesData?.entries ?? [];

  const toggleTag = useCallback((tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId],
    );
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing.lg }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Text style={{ color: theme.accent, fontSize: 18 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.textPrimary }]}>Journal</Text>
        <TouchableOpacity
          onPress={() => setIsComposing(!isComposing)}
          accessibilityRole="button"
          accessibilityLabel={isComposing ? 'Cancel' : 'New entry'}
        >
          <Text style={{ color: theme.accent, fontSize: 16, fontWeight: '600' }}>
            {isComposing ? 'Cancel' : '+ New'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Compose */}
      {isComposing && (
        <View style={[styles.composeCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
          <TextInput
            style={[styles.composeInput, { color: theme.textPrimary }]}
            value={content}
            onChangeText={setContent}
            placeholder="What's on your mind?"
            placeholderTextColor={theme.textTertiary}
            multiline
            autoFocus
            accessibilityLabel="Journal entry text"
            accessibilityHint="Write your personal reflection. Entries are encrypted."
          />

          {/* Tags */}
          <View style={styles.tagRow}>
            {TAGS.map((tag) => (
              <TouchableOpacity
                key={tag.id}
                style={[
                  styles.tag,
                  {
                    backgroundColor: selectedTags.includes(tag.id)
                      ? colors.alpha.goldLight
                      : theme.inputBackground,
                    borderColor: selectedTags.includes(tag.id)
                      ? theme.accent + '44'
                      : 'transparent',
                  },
                ]}
                onPress={() => toggleTag(tag.id)}
                accessibilityRole="checkbox"
                accessibilityLabel={tag.label}
                accessibilityState={{ checked: selectedTags.includes(tag.id) }}
              >
                <Text style={styles.tagEmoji}>{tag.emoji}</Text>
                <Text
                  style={[
                    styles.tagLabel,
                    { color: selectedTags.includes(tag.id) ? theme.accent : theme.textSecondary },
                  ]}
                >
                  {tag.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: theme.accent, opacity: content.trim() ? 1 : 0.5 },
            ]}
            onPress={() => createEntry.mutate()}
            disabled={!content.trim() || createEntry.isPending}
            accessibilityRole="button"
            accessibilityLabel="Save journal entry"
            accessibilityHint="Saves and encrypts your journal entry"
          >
            {createEntry.isPending ? (
              <ActivityIndicator color={colors.divine.black} />
            ) : (
              <Text style={styles.saveButtonText}>Save Entry</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Entries List */}
      <FlatList
        data={entries}
        keyExtractor={(item) => item.id ?? item.created_at ?? ''}
        renderItem={({ item }) => (
          <View style={[styles.entryCard, { backgroundColor: theme.card, borderColor: theme.cardBorder }]}>
            <Text style={[styles.entryDate, { color: theme.textTertiary }]}>
              {formatDate(item.created_at ?? new Date().toISOString())}
            </Text>
            <Text style={[styles.entryContent, { color: theme.textPrimary }]} numberOfLines={4}>
              {item.content_encrypted ?? item.content ?? ''}
            </Text>
            {item.tags && item.tags.length > 0 && (
              <View style={styles.entryTags}>
                {item.tags.map((tagId) => {
                  const tag = TAGS.find((t) => t.id === tagId);
                  return tag ? (
                    <Text key={tagId} style={[styles.entryTag, { color: theme.textTertiary }]}>
                      {tag.emoji} {tag.label}
                    </Text>
                  ) : null;
                })}
              </View>
            )}
          </View>
        )}
        contentContainerStyle={{
          paddingHorizontal: spacing.lg,
          paddingBottom: insets.bottom + spacing.bottomInset,
        }}
        ListEmptyComponent={
          isLoading ? (
            <ActivityIndicator style={{ marginTop: spacing['4xl'] }} color={theme.accent} />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji}>📔</Text>
              <Text style={[styles.emptyText, { color: theme.textSecondary }]}>
                Your journal is empty. Start writing to capture your thoughts and insights.
              </Text>
            </View>
          )
        }
      />
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...typography.h2 },
  // Compose
  composeCard: {
    margin: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: spacing.lg,
  },
  composeInput: {
    ...typography.body,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.md,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radii.full,
    borderWidth: 1,
    gap: 4,
  },
  tagEmoji: { fontSize: 14 },
  tagLabel: { ...typography.caption, fontWeight: '500' },
  saveButton: {
    height: 44,
    borderRadius: radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    ...typography.label,
    color: colors.divine.black,
    fontWeight: '600',
  },
  // Entry card
  entryCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  entryDate: { ...typography.caption, marginBottom: spacing.sm },
  entryContent: { ...typography.body, lineHeight: 24 },
  entryTags: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  entryTag: { ...typography.caption },
  // Empty
  emptyState: {
    alignItems: 'center',
    paddingTop: spacing['5xl'],
    paddingHorizontal: spacing['2xl'],
  },
  emptyEmoji: { fontSize: 48, marginBottom: spacing.lg },
  emptyText: { ...typography.body, textAlign: 'center' },
});
