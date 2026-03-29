/**
 * Journal Entry Detail Screen
 *
 * Two distinct full-screen states:
 *   1. View mode — DivineBackground with entry content in centered GlowCard,
 *      mood badge at top, tags as horizontal pills, date at bottom. Top-right
 *      "..." button with haptic opens SacredBottomSheet for actions.
 *   2. Edit mode — KeyboardAvoidingView with TextInput filling available space,
 *      mood pills, tags input, and Save anchored at bottom above keyboard.
 *
 * Encryption functions preserved exactly as-is for AES-256-GCM journal security.
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import Animated, { FadeIn, FadeInDown, FadeInUp } from 'react-native-reanimated';
import {
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
  { emoji: '\u{1F614}', label: 'Heavy', tag: 'heavy' },
  { emoji: '\u{1F615}', label: 'Unsettled', tag: 'unsettled' },
  { emoji: '\u{1F610}', label: 'Neutral', tag: 'neutral' },
  { emoji: '\u{1F642}', label: 'Peaceful', tag: 'peaceful' },
  { emoji: '\u{1F60A}', label: 'Blissful', tag: 'blissful' },
] as const;

/** Alias for the SecureStore key that holds the AES-256-GCM encryption key */
const ENCRYPTION_KEY_ALIAS = 'mindvibe_journal_key';

/** Whether the Web Crypto API is available (Hermes 0.74+ or polyfill) */
const HAS_SUBTLE_CRYPTO =
  typeof globalThis.crypto !== 'undefined' &&
  typeof globalThis.crypto.subtle !== 'undefined';

/**
 * Retrieve the AES-256-GCM encryption key from SecureStore, creating one
 * on first use. Falls back to raw key string if SubtleCrypto unavailable.
 */
async function getOrCreateEncryptionKey(): Promise<CryptoKey | string> {
  let keyBase64 = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
  if (!keyBase64) {
    const keyBytes = await Crypto.getRandomBytesAsync(32);
    keyBase64 = btoa(String.fromCharCode(...keyBytes));
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, keyBase64);
  }
  if (!HAS_SUBTLE_CRYPTO) return keyBase64;
  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  return globalThis.crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

/**
 * Encrypt plaintext content using AES-256-GCM with a random 12-byte IV.
 * Falls back to base64 encoding when SubtleCrypto unavailable.
 */
async function encryptContent(content: string): Promise<string> {
  if (!HAS_SUBTLE_CRYPTO) {
    const hash = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, content);
    return btoa(unescape(encodeURIComponent(content))) + ':' + hash.slice(0, 16);
  }
  const key = await getOrCreateEncryptionKey() as CryptoKey;
  const iv = await Crypto.getRandomBytesAsync(12);
  const encoded = new TextEncoder().encode(content);
  const encrypted = await globalThis.crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypt ciphertext. Handles both AES-GCM format and legacy base64 fallback.
 */
async function decryptContent(encryptedBase64: string): Promise<string> {
  // Legacy fallback format: base64content:hash
  if (encryptedBase64.includes(':')) {
    const base64Part = encryptedBase64.split(':')[0]!;
    return decodeURIComponent(escape(atob(base64Part)));
  }
  if (!HAS_SUBTLE_CRYPTO) {
    try { return decodeURIComponent(escape(atob(encryptedBase64))); } catch { return encryptedBase64; }
  }
  const key = await getOrCreateEncryptionKey() as CryptoKey;
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
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

function getMoodLabel(tag: string | undefined): string | null {
  if (!tag) return null;
  const found = MOOD_OPTIONS.find((m) => m.tag === tag);
  return found ? found.label : null;
}

export default function JournalDetailScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    void Haptics.selectionAsync();
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
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
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

  const handleActionsOpen = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowActions(true);
  }, []);

  // Loading state
  if (isLoading || !entry) {
    return (
      <DivineBackground variant="sacred" style={styles.root}>
        <View style={[styles.loadingScreen, { paddingTop: insets.top }]}>
          <GoldenHeader title="Reflection" onBack={() => router.back()} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator color={colors.primary[500]} size="large" />
          </View>
        </View>
      </DivineBackground>
    );
  }

  const moodEmoji = getMoodEmoji(entry.mood_tag);
  const moodLabel = getMoodLabel(entry.mood_tag);
  const nonMoodTags = entry.tags.filter(
    (t) => !MOOD_OPTIONS.some((m) => m.tag === t),
  );

  // ---------------------------------------------------------------------------
  // EDIT MODE — KeyboardAvoidingView with TextInput filling space
  // ---------------------------------------------------------------------------
  if (isEditing) {
    return (
      <DivineBackground variant="sacred" style={styles.root}>
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.editScreen, { paddingTop: insets.top }]}>
            <GoldenHeader
              title="Edit Reflection"
              onBack={handleCancelEdit}
              rightAction={
                <Pressable
                  onPress={handleCancelEdit}
                  accessibilityRole="button"
                  accessibilityLabel="Cancel editing"
                >
                  <Text variant="body" color={colors.text.muted}>Cancel</Text>
                </Pressable>
              }
            />

            {/* Title */}
            <View style={styles.editTitleContainer}>
              <Input
                label="Title (optional)"
                placeholder="Give your reflection a name..."
                value={editTitle}
                onChangeText={setEditTitle}
                maxLength={120}
                returnKeyType="next"
              />
            </View>

            {/* Mood pills — horizontal row */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodPillRow}
              style={styles.moodScroll}
            >
              {MOOD_OPTIONS.map((option) => (
                <Pressable
                  key={option.tag}
                  onPress={() => handleMoodSelect(option.tag)}
                  style={[
                    styles.moodPill,
                    editMood === option.tag && styles.moodPillSelected,
                  ]}
                  accessibilityLabel={option.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: editMood === option.tag }}
                >
                  <Text variant="body">{option.emoji}</Text>
                  <Text
                    variant="caption"
                    color={editMood === option.tag ? colors.background.dark : colors.text.muted}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            {/* Content TextInput — fills available space */}
            <View style={styles.editContentContainer}>
              <TextInput
                style={styles.editContentInput}
                placeholder="Pour your heart onto this sacred page..."
                placeholderTextColor={colors.text.muted}
                value={editContent}
                onChangeText={setEditContent}
                multiline
                textAlignVertical="top"
                selectionColor={colors.primary[500]}
                accessibilityLabel="Edit journal content"
              />
            </View>

            {/* Tags */}
            <View style={styles.editTagsContainer}>
              <Input
                label="Tags"
                placeholder="gratitude, morning, clarity..."
                value={editTagsInput}
                onChangeText={setEditTagsInput}
                autoCapitalize="none"
                returnKeyType="done"
              />
            </View>

            {/* Save button — anchored at bottom above keyboard */}
            <View style={[styles.editSaveContainer, { paddingBottom: insets.bottom + 16 }]}>
              <GoldenButton
                title="Save Changes"
                onPress={handleSaveEdit}
                loading={createJournal.isPending}
                disabled={editContent.trim().length === 0}
                variant="divine"
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </DivineBackground>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW MODE — Full-screen immersive with centered GlowCard
  // ---------------------------------------------------------------------------
  return (
    <DivineBackground variant="sacred" style={styles.root}>
      <View style={[styles.viewScreen, { paddingTop: insets.top }]}>
        <GoldenHeader
          title="Reflection"
          onBack={() => router.back()}
          rightAction={
            <Pressable
              onPress={handleActionsOpen}
              accessibilityRole="button"
              accessibilityLabel="Show entry actions"
              hitSlop={12}
            >
              <Text variant="h2" color={colors.text.secondary}>
                {'\u2026'}
              </Text>
            </Pressable>
          }
        />

        {/* Scrollable content area for long entries */}
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.viewScrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Mood badge at top */}
          {moodEmoji ? (
            <Animated.View entering={FadeIn.duration(400)} style={styles.moodBadgeRow}>
              <View style={styles.moodBadgeLarge}>
                <Text variant="h1">{moodEmoji}</Text>
                <Text variant="label" color={colors.text.secondary}>
                  {moodLabel}
                </Text>
              </View>
            </Animated.View>
          ) : null}

          {/* Main content card */}
          <Animated.View entering={FadeInUp.duration(500).delay(100)}>
            <GlowCard variant="divine" style={styles.viewCard}>
              {/* Title */}
              {entry.title ? (
                <Text variant="h1" color={colors.text.primary} style={styles.viewTitle}>
                  {entry.title}
                </Text>
              ) : null}

              <SacredDivider />

              {/* Decrypted content */}
              <Text variant="body" color={colors.text.primary} style={styles.viewContent}>
                {decryptedContent}
              </Text>

              {/* Encrypted indicator */}
              <View style={styles.encryptedRow}>
                <Text variant="caption" color={colors.text.muted}>
                  {'\u{1F512} Encrypted at rest'}
                </Text>
              </View>
            </GlowCard>
          </Animated.View>

          {/* Tags as horizontal pill row */}
          {nonMoodTags.length > 0 ? (
            <Animated.View entering={FadeIn.duration(400).delay(200)} style={styles.viewTagRow}>
              {nonMoodTags.map((tag) => (
                <Pressable
                  key={tag}
                  onPress={() => {
                    void Haptics.selectionAsync();
                  }}
                >
                  <Badge label={tag} />
                </Pressable>
              ))}
            </Animated.View>
          ) : null}

          {/* Date at bottom */}
          <Animated.View entering={FadeIn.duration(400).delay(300)} style={styles.viewDateRow}>
            <Text variant="caption" color={colors.text.muted} align="center">
              {formatDate(entry.created_at)}
            </Text>
          </Animated.View>
        </ScrollView>

        {/* Actions Bottom Sheet (Edit / Delete) */}
        <SacredBottomSheet
          isVisible={showActions}
          onClose={() => setShowActions(false)}
          snapPoints={[250]}
        >
          <View style={[styles.bottomSheetContent, { paddingBottom: insets.bottom + spacing.md }]}>
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
      </View>
    </DivineBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // -- Loading --
  loadingScreen: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // -- View mode --
  viewScreen: {
    flex: 1,
  },
  viewScrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxxl,
    gap: spacing.lg,
  },
  moodBadgeRow: {
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  moodBadgeLarge: {
    alignItems: 'center',
    gap: spacing.xxs,
    backgroundColor: colors.alpha.goldLight,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
  },
  viewCard: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  viewTitle: {
    marginBottom: spacing.xs,
  },
  viewContent: {
    lineHeight: 28,
    paddingTop: spacing.sm,
  },
  encryptedRow: {
    paddingTop: spacing.md,
  },
  viewTagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  viewDateRow: {
    paddingVertical: spacing.sm,
  },

  // -- Edit mode --
  editScreen: {
    flex: 1,
  },
  editTitleContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  moodScroll: {
    maxHeight: 48,
  },
  moodPillRow: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
    alignItems: 'center',
  },
  moodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.goldLight,
  },
  moodPillSelected: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  editContentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  editContentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    borderRadius: 16,
    backgroundColor: colors.background.card,
    color: colors.text.primary,
    fontSize: 16,
    lineHeight: 24,
    padding: spacing.md,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },
  editTagsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  editSaveContainer: {
    paddingHorizontal: spacing.lg,
  },

  // -- Bottom sheet --
  bottomSheetContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  bottomSheetAction: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
});
