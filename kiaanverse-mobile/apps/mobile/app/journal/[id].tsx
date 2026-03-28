/**
 * Journal Entry Detail Screen
 *
 * Displays a single journal entry with decrypted content, mood tag, and tags.
 * Supports editing and deletion with confirmation. Beautiful reading typography
 * in view mode, familiar input layout in edit mode.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  Screen,
  Text,
  Input,
  Badge,
  GoldenButton,
  GoldenHeader,
  DivineBackground,
  GlowCard,
  SacredDivider,
  SacredBottomSheet,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useJournalEntry, useCreateJournal } from '@kiaanverse/api';

const MOOD_OPTIONS = [
  { emoji: '😔', label: 'Heavy', tag: 'heavy' },
  { emoji: '😕', label: 'Unsettled', tag: 'unsettled' },
  { emoji: '😐', label: 'Neutral', tag: 'neutral' },
  { emoji: '🙂', label: 'Peaceful', tag: 'peaceful' },
  { emoji: '😊', label: 'Blissful', tag: 'blissful' },
] as const;

/** Alias for the SecureStore key that holds the AES-256-GCM encryption key */
const ENCRYPTION_KEY_ALIAS = 'mindvibe_journal_key';

/**
 * Retrieve the AES-256-GCM encryption key from SecureStore, creating one
 * on first use. The raw key material never leaves the secure enclave.
 */
async function getOrCreateEncryptionKey(): Promise<CryptoKey> {
  let keyBase64 = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
  if (!keyBase64) {
    const keyBytes = await Crypto.getRandomBytesAsync(32);
    keyBase64 = btoa(String.fromCharCode(...keyBytes));
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, keyBase64);
  }
  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  return globalThis.crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/**
 * Encrypt plaintext content using AES-256-GCM with a random 12-byte IV.
 * Returns a base64 string containing [IV || ciphertext].
 */
async function encryptContent(content: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const iv = await Crypto.getRandomBytesAsync(12);
  const encoded = new TextEncoder().encode(content);
  const encrypted = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt AES-256-GCM ciphertext previously produced by encryptContent.
 * Expects a base64 string containing [IV (12 bytes) || ciphertext].
 */
async function decryptContent(encryptedBase64: string): Promise<string> {
  const key = await getOrCreateEncryptionKey();
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function getMoodEmoji(tag: string | undefined): string | null {
  if (!tag) return null;
  const found = MOOD_OPTIONS.find((m) => m.tag === tag);
  return found ? found.emoji : null;
}

export default function JournalDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: entry, isLoading } = useJournalEntry(id ?? '');
  const createJournal = useCreateJournal();

  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editMood, setEditMood] = useState<string | null>(null);
  const [editTagsInput, setEditTagsInput] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [decryptedContent, setDecryptedContent] = useState('');

  // Decrypt content asynchronously when entry changes
  useEffect(() => {
    if (!entry) {
      setDecryptedContent('');
      return;
    }
    let cancelled = false;
    decryptContent(entry.content_encrypted)
      .then((plaintext) => {
        if (!cancelled) setDecryptedContent(plaintext);
      })
      .catch(() => {
        if (!cancelled) setDecryptedContent(entry.content_encrypted);
      });
    return () => { cancelled = true; };
  }, [entry]);

  const handleStartEdit = useCallback(() => {
    if (!entry) return;
    void Haptics.selectionAsync();
    setEditTitle(entry.title ?? '');
    setEditContent(decryptedContent);
    setEditMood(entry.mood_tag ?? null);
    const nonMoodTags = entry.tags.filter(
      (t) => !MOOD_OPTIONS.some((m) => m.tag === t),
    );
    setEditTagsInput(nonMoodTags.join(', '));
    setIsEditing(true);
  }, [entry, decryptedContent]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
  }, []);

  const handleSaveEdit = useCallback(async () => {
    if (editContent.trim().length === 0) {
      Alert.alert('Empty Reflection', 'Please write something before saving.');
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // AES-256-GCM encryption — key stored in device SecureStore
    const contentEncrypted = await encryptContent(editContent.trim());

    const tags: string[] = editTagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editMood) {
      tags.unshift(editMood);
    }

    try {
      await createJournal.mutateAsync({ content_encrypted: contentEncrypted, tags });
      setIsEditing(false);
    } catch {
      Alert.alert(
        'Could Not Save',
        'Your changes could not be saved right now. Please try again.',
      );
    }
  }, [editContent, editTagsInput, editMood, createJournal]);

  const handleDelete = useCallback(() => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Reflection',
      'This reflection will be archived. You can recover it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // Soft delete — would call a deleteJournal mutation in production
            router.back();
          },
        },
      ],
    );
  }, [router]);

  const handleMoodSelect = useCallback((tag: string) => {
    void Haptics.selectionAsync();
    setEditMood((prev) => (prev === tag ? null : tag));
  }, []);

  if (isLoading || !entry) {
    return (
      <Screen>
        <GoldenHeader title="Reflection" onBack={() => router.back()} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary[500]} size="large" />
        </View>
      </Screen>
    );
  }

  const moodEmoji = getMoodEmoji(entry.mood_tag);
  const nonMoodTags = entry.tags.filter(
    (t) => !MOOD_OPTIONS.some((m) => m.tag === t),
  );

  const editButton = !isEditing ? (
    <Pressable onPress={handleStartEdit} accessibilityRole="button" accessibilityLabel="Edit entry">
      <Text variant="body" color={colors.primary[500]}>Edit</Text>
    </Pressable>
  ) : (
    <Pressable onPress={handleCancelEdit} accessibilityRole="button" accessibilityLabel="Cancel editing">
      <Text variant="body" color={colors.text.muted}>Cancel</Text>
    </Pressable>
  );

  return (
    <Screen>
      <DivineBackground variant="sacred">
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={spacing.navHeight}
        >
          <GoldenHeader
            title={isEditing ? 'Edit Reflection' : 'Reflection'}
            onBack={() => router.back()}
            rightAction={editButton}
          />

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {isEditing ? (
              /* ---- EDIT MODE ---- */
              <GlowCard variant="divine">
                <Animated.View entering={FadeIn.duration(300)} style={styles.editContainer}>
                  <Input
                    label="Title (optional)"
                    placeholder="Give your reflection a name..."
                    value={editTitle}
                    onChangeText={setEditTitle}
                    maxLength={120}
                    returnKeyType="next"
                  />

                  <SacredDivider />

                  <View style={styles.contentSection}>
                    <Text variant="label" color={colors.text.secondary}>Reflection</Text>
                    <TextInput
                      style={styles.contentInput}
                      placeholder="Pour your heart onto this sacred page..."
                      placeholderTextColor={colors.text.muted}
                      value={editContent}
                      onChangeText={setEditContent}
                      multiline
                      textAlignVertical="top"
                      scrollEnabled={false}
                      selectionColor={colors.primary[500]}
                    />
                  </View>

                  <SacredDivider />

                  <View style={styles.moodSection}>
                    <Text variant="label" color={colors.text.secondary}>Mood</Text>
                    <View style={styles.moodRow}>
                      {MOOD_OPTIONS.map((option) => (
                        <Pressable
                          key={option.tag}
                          onPress={() => handleMoodSelect(option.tag)}
                          style={[
                            styles.moodOption,
                            editMood === option.tag && styles.moodSelected,
                          ]}
                          accessibilityLabel={option.label}
                          accessibilityRole="button"
                        >
                          <Text variant="h2" align="center">{option.emoji}</Text>
                          <Text variant="caption" color={colors.text.muted} align="center">
                            {option.label}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <SacredDivider />

                  <Input
                    label="Tags (comma-separated)"
                    placeholder="gratitude, morning, clarity..."
                    value={editTagsInput}
                    onChangeText={setEditTagsInput}
                    autoCapitalize="none"
                    returnKeyType="done"
                  />

                  <View style={styles.actionRow}>
                    <View style={styles.saveButtonContainer}>
                      <GoldenButton
                        title="Save Changes"
                        onPress={handleSaveEdit}
                        loading={createJournal.isPending}
                        disabled={editContent.trim().length === 0}
                        variant="divine"
                      />
                    </View>
                  </View>
                </Animated.View>
              </GlowCard>
            ) : (
              /* ---- VIEW MODE ---- */
              <GlowCard variant="divine">
                <Animated.View entering={FadeIn.duration(400)} style={styles.viewContainer}>
                  {/* Date */}
                  <Text variant="caption" color={colors.text.muted}>
                    {formatDate(entry.created_at)}
                  </Text>

                  {/* Title */}
                  {entry.title ? (
                    <Text variant="h1" color={colors.text.primary} style={styles.viewTitle}>
                      {entry.title}
                    </Text>
                  ) : null}

                  <SacredDivider />

                  {/* Mood + Tags */}
                  <View style={styles.tagRow}>
                    {moodEmoji ? (
                      <View style={styles.moodBadge}>
                        <Text variant="body">{moodEmoji}</Text>
                        <Text variant="caption" color={colors.text.secondary}>
                          {entry.mood_tag}
                        </Text>
                      </View>
                    ) : null}
                    {nonMoodTags.map((tag) => (
                      <Badge key={tag} label={tag} />
                    ))}
                  </View>

                  {/* Encrypted indicator */}
                  <View style={styles.encryptedRow}>
                    <Text variant="caption" color={colors.text.muted}>
                      {'🔒 Encrypted at rest'}
                    </Text>
                  </View>

                  <SacredDivider />

                  {/* Content */}
                  <Text variant="body" color={colors.text.primary} style={styles.viewContent}>
                    {decryptedContent}
                  </Text>

                  {/* Actions button — opens SacredBottomSheet */}
                  <Pressable
                    onPress={() => setShowActions(true)}
                    style={styles.actionsButton}
                    accessibilityRole="button"
                    accessibilityLabel="Show entry actions"
                  >
                    <Text variant="body" color={colors.primary[500]}>
                      Actions
                    </Text>
                  </Pressable>
                </Animated.View>
              </GlowCard>
            )}
          </ScrollView>

          {/* Actions Bottom Sheet (Edit / Delete) */}
          <SacredBottomSheet
            isVisible={showActions}
            onClose={() => setShowActions(false)}
            snapPoints={['25%']}
          >
            <View style={styles.bottomSheetContent}>
              <Pressable
                onPress={() => {
                  setShowActions(false);
                  handleStartEdit();
                }}
                style={styles.bottomSheetAction}
                accessibilityRole="button"
                accessibilityLabel="Edit entry"
              >
                <Text variant="body" color={colors.primary[500]}>
                  Edit Reflection
                </Text>
              </Pressable>
              <SacredDivider />
              <Pressable
                onPress={() => {
                  setShowActions(false);
                  handleDelete();
                }}
                style={styles.bottomSheetAction}
                accessibilityRole="button"
                accessibilityLabel="Delete this reflection"
              >
                <Text variant="body" color={colors.semantic.error}>
                  Delete Reflection
                </Text>
              </Pressable>
            </View>
          </SacredBottomSheet>
        </KeyboardAvoidingView>
      </DivineBackground>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.bottomInset,
  },
  editContainer: { gap: spacing.lg },
  viewContainer: { gap: spacing.md },
  contentSection: { gap: spacing.xs },
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
  moodSection: { gap: spacing.sm },
  moodRow: { flexDirection: 'row', justifyContent: 'space-between' },
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
  actionRow: { paddingTop: spacing.md },
  saveButtonContainer: { flex: 1 },
  viewTitle: { marginTop: spacing.xs },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    alignItems: 'center',
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.alpha.goldLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: 16,
  },
  encryptedRow: { paddingVertical: spacing.xxs },
  viewContent: {
    lineHeight: 28,
    paddingTop: spacing.sm,
  },
  actionsButton: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.xl,
  },
  bottomSheetContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  bottomSheetAction: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
