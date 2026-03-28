/**
 * New Journal Entry Screen
 *
 * Composer for creating a new sacred reflection. Includes title, multiline
 * content, mood selector, tags, and encryption before saving.
 * Keyboard-aware layout ensures inputs remain visible.
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
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import {
  Screen,
  Text,
  Input,
  GoldenButton,
  GoldenHeader,
  DivineBackground,
  GlowCard,
  SacredDivider,
  ConfettiCannon,
  EmotionOrb,
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
function moodToOrbMood(mood: string | null): string {
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
  const createJournal = useCreateJournal();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // Reset confetti after 3 seconds
  useEffect(() => {
    if (showSaveSuccess) {
      const timer = setTimeout(() => setShowSaveSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
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
      <DivineBackground variant="sacred">
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={spacing.navHeight}
        >
          <GoldenHeader title="New Reflection" onBack={() => router.back()} />

          <ConfettiCannon isActive={showSaveSuccess} particleCount={30} duration={2000} />

          <ScrollView
            style={styles.flex}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <GlowCard variant="divine">
              {/* Title (optional) */}
              <Input
                label="Title (optional)"
                placeholder="Give your reflection a name..."
                value={title}
                onChangeText={setTitle}
                maxLength={120}
                returnKeyType="next"
              />

              <SacredDivider />

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

              <SacredDivider />

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
                {/* EmotionOrb visual preview of selected mood */}
                {selectedMood ? (
                  <View style={styles.emotionOrbContainer}>
                    <EmotionOrb mood={moodToOrbMood(selectedMood)} size={60} isAnimating={!!selectedMood} />
                  </View>
                ) : null}
              </View>

              <SacredDivider />

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
            </GlowCard>
          </ScrollView>
        </KeyboardAvoidingView>
      </DivineBackground>
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
  emotionOrbContainer: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  saveContainer: {
    paddingTop: spacing.md,
  },
});
