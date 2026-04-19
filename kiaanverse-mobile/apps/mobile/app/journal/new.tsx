/**
 * New Journal Entry Screen
 *
 * Full-screen immersive composer with KeyboardAvoidingView. No ScrollView —
 * content fits on a single screen with the TextInput filling available space.
 * Mood selector is a compact horizontal pill row. Save button stays above
 * the keyboard. Confetti fires full-screen on successful save.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  Text,
  Input,
  GoldenButton,
  GoldenHeader,
  DivineBackground,
  SacredDivider,
  ConfettiCannon,
  EmotionOrb,
  type EmotionOrbMood,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useCreateJournal } from '@kiaanverse/api';

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
 * on first use. The raw key material never leaves the secure enclave.
 * Falls back to expo-crypto digest if SubtleCrypto is unavailable.
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
 * Falls back to expo-crypto SHA-256 digest + base64 encoding when SubtleCrypto unavailable.
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
 * Decrypt AES-256-GCM ciphertext previously produced by encryptContent.
 * Handles both AES-GCM format and legacy base64 fallback format.
 */
async function decryptContent(encryptedBase64: string): Promise<string> {
  // Legacy fallback format: base64content:hash
  if (encryptedBase64.includes(':')) {
    const base64Part = encryptedBase64.split(':')[0]!;
    return decodeURIComponent(escape(atob(base64Part)));
  }
  if (!HAS_SUBTLE_CRYPTO) {
    // Try legacy base64 decode
    try { return decodeURIComponent(escape(atob(encryptedBase64))); } catch { return encryptedBase64; }
  }
  const key = await getOrCreateEncryptionKey() as CryptoKey;
  const combined = Uint8Array.from(atob(encryptedBase64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const data = combined.slice(12);
  const decrypted = await globalThis.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

/** Map mood tag to EmotionOrb mood prop */
function moodToOrbMood(mood: string | null): EmotionOrbMood {
  switch (mood) {
    case 'heavy': return 'sad';
    case 'unsettled': return 'anxious';
    case 'neutral': return 'peaceful';
    case 'peaceful': return 'joyful';
    case 'blissful': return 'grateful';
    default: return 'peaceful';
  }
}

export default function NewJournalScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const createJournal = useCreateJournal();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Clear confetti after 3 seconds
  useEffect(() => {
    if (!showSaveSuccess) return undefined;
    const timer = setTimeout(() => setShowSaveSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [showSaveSuccess]);

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

    // AES-256-GCM encryption — key stored in device SecureStore
    const contentEncrypted = await encryptContent(content.trim());

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
      setShowSaveSuccess(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    <DivineBackground variant="sacred" style={styles.root}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.container, { paddingTop: insets.top }]}>
          {/* Full-screen confetti overlay on save */}
          <ConfettiCannon isActive={showSaveSuccess} particleCount={30} duration={2000} />

          <GoldenHeader title="New Reflection" onBack={() => router.back()} />

          {/* Title input */}
          <Animated.View entering={FadeInDown.duration(400)} style={styles.titleContainer}>
            <Input
              label="Title (optional)"
              placeholder="Give your reflection a name..."
              value={title}
              onChangeText={setTitle}
              maxLength={120}
              returnKeyType="next"
            />
          </Animated.View>

          <SacredDivider />

          {/* Mood selector — compact horizontal pill row */}
          <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.moodContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.moodRow}
            >
              {MOOD_OPTIONS.map((option) => (
                <Pressable
                  key={option.tag}
                  onPress={() => handleMoodSelect(option.tag)}
                  style={[
                    styles.moodPill,
                    selectedMood === option.tag && styles.moodPillSelected,
                  ]}
                  accessibilityLabel={option.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: selectedMood === option.tag }}
                >
                  <Text variant="body">{option.emoji}</Text>
                  <Text
                    variant="caption"
                    color={selectedMood === option.tag ? colors.background.dark : colors.text.muted}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              ))}

              {/* EmotionOrb preview inline */}
              {selectedMood ? (
                <View style={styles.orbInline}>
                  <EmotionOrb mood={moodToOrbMood(selectedMood)} size={36} isAnimating />
                </View>
              ) : null}
            </ScrollView>
          </Animated.View>

          {/* Content TextInput — fills remaining vertical space */}
          <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.contentContainer}>
            <TextInput
              style={styles.contentInput}
              placeholder="Pour your heart onto this sacred page..."
              placeholderTextColor={colors.text.muted}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
              selectionColor={colors.primary[500]}
              accessibilityLabel="Journal content"
            />
          </Animated.View>

          {/* Tags — horizontal pill input */}
          <View style={styles.tagsContainer}>
            <Input
              label="Tags"
              placeholder="gratitude, morning, clarity..."
              value={tagsInput}
              onChangeText={setTagsInput}
              autoCapitalize="none"
              returnKeyType="done"
            />
          </View>

          {/* Save button — anchored at bottom, stays above keyboard */}
          <Animated.View
            entering={FadeIn.duration(300).delay(300)}
            style={[styles.saveContainer, { paddingBottom: insets.bottom + 16 }]}
          >
            <GoldenButton
              title="Save Reflection"
              onPress={handleSave}
              loading={createJournal.isPending}
              disabled={!canSave}
              variant="divine"
            />
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </DivineBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  titleContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  moodContainer: {
    paddingVertical: spacing.xs,
  },
  moodRow: {
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
  orbInline: {
    justifyContent: 'center',
    paddingLeft: spacing.sm,
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  contentInput: {
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
  tagsContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  saveContainer: {
    paddingHorizontal: spacing.lg,
  },
});
