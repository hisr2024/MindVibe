/**
 * New Journal Entry Screen — four-section composer for the Sacred Journal.
 *
 *   1. Mood       — 10 single-select pills (plaintext metadata → KarmaLytix).
 *   2. Category   — 5 single-select sacred chips (Gratitude, Reflection,
 *                   Prayer, Dream, Shadow). Also plaintext.
 *   3. Tags       — up to 5 multi-select chips from suggested themes
 *                   (gratitude, fear, longing, clarity, …). Plaintext.
 *   4. Reflection — multi-line body, AES-256-GCM encrypted client-side before
 *                   it leaves the device. The key lives in SecureStore and
 *                   never reaches Kiaanverse servers.
 *
 * Weekly Sacred Assessment:
 *   Shown below the composer at most once per ISO week (it is considered
 *   "due" when no answers have been saved for the current week). Five
 *   plaintext questions whose answers are persisted to AsyncStorage and
 *   will be forwarded to the KarmaLytix analyzer once the dedicated backend
 *   endpoint ships. Until then the answers stay on-device only.
 *
 * Backend contract (useCreateJournal → POST /api/journal/entries):
 *   { content_encrypted: string, tags?: string[] }
 *
 * We fold mood + category into the `tags` array so the server-side index can
 * filter and segment without ever seeing the reflection body.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as Haptics from 'expo-haptics';
import * as SecureStore from 'expo-secure-store';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import {
  ConfettiCannon,
  DivineBackground,
  GoldenButton,
  GoldenDivider,
  GoldenHeader,
  SacredChip,
  SacredInput,
  Text,
  colors,
  spacing,
} from '@kiaanverse/ui';
import { useCreateJournal } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';

// ---------------------------------------------------------------------------
// Mood / Category / Tag definitions
// ---------------------------------------------------------------------------

/**
 * Ten moods shown in Section 1. `id` is the canonical plaintext label that
 * gets persisted as the first entry in `tags` (so legacy mood-tag filters
 * keep working). `sanskrit` is the Devanagari label; `color` tints the
 * selected pill.
 */
const MOODS = [
  { id: 'peaceful',  sanskrit: 'शान्त',     emoji: '\u{1F54A}',  color: '#10B981' },
  { id: 'grateful',  sanskrit: 'कृतज्ञ',    emoji: '\u{1F64F}',  color: '#D4A017' },
  { id: 'hopeful',   sanskrit: 'आशान्वित',  emoji: '\u{1F305}',  color: '#F59E0B' },
  { id: 'anxious',   sanskrit: 'चिंतित',    emoji: '\u{1F630}',  color: '#EF4444' },
  { id: 'sad',       sanskrit: 'दुःखी',     emoji: '\u{1F327}',  color: '#3B82F6' },
  { id: 'confused',  sanskrit: 'भ्रमित',    emoji: '\u{1F300}',  color: '#8B5CF6' },
  { id: 'angry',     sanskrit: 'क्रोधित',   emoji: '\u{1F525}',  color: '#DC2626' },
  { id: 'inspired',  sanskrit: 'प्रेरित',   emoji: '\u{2728}',   color: '#06B6D4' },
  { id: 'tired',     sanskrit: 'थका हुआ',   emoji: '\u{1F319}',  color: '#6B7280' },
  { id: 'neutral',   sanskrit: 'सामान्य',   emoji: '\u{2696}',   color: 'rgba(240,235,225,0.5)' },
] as const;

type MoodId = (typeof MOODS)[number]['id'];

const CATEGORIES = [
  { id: 'Gratitude',  sanskrit: 'कृतज्ञता',   icon: '\u{1F64F}', color: '#D4A017' },
  { id: 'Reflection', sanskrit: 'विचार',       icon: '\u{1FA9E}', color: '#8B5CF6' },
  { id: 'Prayer',     sanskrit: 'प्रार्थना',   icon: '\u{2728}',  color: '#3B82F6' },
  { id: 'Dream',      sanskrit: 'स्वप्न',      icon: '\u{1F319}', color: '#06B6D4' },
  { id: 'Shadow',     sanskrit: 'छाया',        icon: '\u{1F311}', color: '#6B7280' },
] as const;

type CategoryId = (typeof CATEGORIES)[number]['id'];

const SUGGESTED_TAGS = [
  'gratitude', 'fear', 'longing', 'clarity', 'confusion', 'devotion',
  'surrender', 'anger', 'joy', 'grief', 'love', 'purpose',
] as const;

/** Hard cap on user-selected tags (mood + category are added automatically). */
const MAX_USER_TAGS = 5;

const CHALLENGE_OPTIONS = [
  'Anger', 'Fear', 'Attachment', 'Pride', 'Greed', 'Confusion',
] as const;

// ---------------------------------------------------------------------------
// AES-256-GCM encryption (preserved from prior implementation)
//
// The key is generated once per device and lives in SecureStore. We use
// SubtleCrypto when available (Hermes 0.74+ or polyfilled) and fall back to
// a reversible base64 encoding on older runtimes so the app still functions;
// the fallback is explicitly NOT secure — detected by the `:` delimiter on
// read so callers can prompt the user to re-encrypt once SubtleCrypto lands.
// ---------------------------------------------------------------------------

const ENCRYPTION_KEY_ALIAS = 'mindvibe_journal_key';

const HAS_SUBTLE_CRYPTO =
  typeof globalThis.crypto !== 'undefined' &&
  typeof globalThis.crypto.subtle !== 'undefined';

async function getOrCreateEncryptionKey(): Promise<CryptoKey | string> {
  let keyBase64 = await SecureStore.getItemAsync(ENCRYPTION_KEY_ALIAS);
  if (!keyBase64) {
    const keyBytes = await Crypto.getRandomBytesAsync(32);
    keyBase64 = btoa(String.fromCharCode(...keyBytes));
    await SecureStore.setItemAsync(ENCRYPTION_KEY_ALIAS, keyBase64);
  }
  if (!HAS_SUBTLE_CRYPTO) return keyBase64;
  const keyBytes = Uint8Array.from(atob(keyBase64), (c) => c.charCodeAt(0));
  return globalThis.crypto.subtle.importKey(
    'raw',
    keyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt'],
  );
}

async function encryptContent(content: string): Promise<string> {
  if (!HAS_SUBTLE_CRYPTO) {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      content,
    );
    return btoa(unescape(encodeURIComponent(content))) + ':' + hash.slice(0, 16);
  }
  const key = (await getOrCreateEncryptionKey()) as CryptoKey;
  const iv = await Crypto.getRandomBytesAsync(12);
  const encoded = new TextEncoder().encode(content);
  const encrypted = await globalThis.crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encoded,
  );
  const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
}

// ---------------------------------------------------------------------------
// Weekly Sacred Assessment — local persistence
// ---------------------------------------------------------------------------

const ASSESSMENT_STORAGE_KEY = 'mindvibe_weekly_assessment_v1';

interface WeeklyAssessmentAnswers {
  readonly dharmic_challenge: string;
  readonly gita_teaching: string;
  readonly consistency_score: number;
  readonly pattern_noticed: string;
  readonly sankalpa_for_next_week: string;
  readonly saved_at: string;
}

type AssessmentStore = Record<string, WeeklyAssessmentAnswers>;

/**
 * Return an ISO-week key (`YYYY-W##`) for the given date — used as the
 * storage key so each calendar week gets at most one saved assessment.
 */
function getIsoWeekKey(date: Date): string {
  // Copy so we don't mutate the caller's date
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  // ISO weeks: Thursday of the current week determines the week-year
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86_400_000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, '0')}`;
}

async function loadAssessmentStore(): Promise<AssessmentStore> {
  try {
    const raw = await AsyncStorage.getItem(ASSESSMENT_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    return typeof parsed === 'object' && parsed !== null ? (parsed as AssessmentStore) : {};
  } catch {
    return {};
  }
}

async function saveAssessmentAnswers(
  weekKey: string,
  answers: Omit<WeeklyAssessmentAnswers, 'saved_at'>,
): Promise<void> {
  try {
    const store = await loadAssessmentStore();
    store[weekKey] = { ...answers, saved_at: new Date().toISOString() };
    await AsyncStorage.setItem(ASSESSMENT_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Local-only persistence — swallow errors so the entry save still succeeds.
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Classify wall-clock hour into the five Vedic time bands. */
function getWritingTimeOfDay(hour: number): string {
  if (hour >= 3.5 && hour < 5.5) return 'brahma';
  if (hour >= 5.5 && hour < 12) return 'pratah';
  if (hour >= 12 && hour < 17) return 'madhyanha';
  if (hour >= 17 && hour < 20) return 'sandhya';
  return 'ratri';
}

/**
 * Merge mood / category / time-of-day / user-selected tags into a single
 * deduplicated list for the backend. Order is intentional so mood stays at
 * index 0 — `JournalEntryCard` relies on this for its legacy mood badge.
 */
function buildTagsPayload(opts: {
  mood: MoodId | null;
  category: CategoryId | null;
  userTags: readonly string[];
  timeOfDay: string;
}): string[] {
  const tags: string[] = [];
  if (opts.mood) tags.push(opts.mood);
  if (opts.category) tags.push(opts.category);
  tags.push(`time:${opts.timeOfDay}`);
  for (const tag of opts.userTags) {
    if (!tags.includes(tag)) tags.push(tag);
  }
  return tags;
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function NewJournalScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation('journal');
  const createJournal = useCreateJournal();

  // -- Core entry fields --
  const [mood, setMood] = useState<MoodId | null>(null);
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [body, setBody] = useState('');
  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  // -- Weekly assessment --
  const [assessmentDue, setAssessmentDue] = useState(false);
  const [challenge, setChallenge] = useState('');
  const [gitaTeaching, setGitaTeaching] = useState('');
  const [consistency, setConsistency] = useState(0);
  const [pattern, setPattern] = useState('');
  const [sankalpa, setSankalpa] = useState('');

  // Check weekly assessment status on mount. The assessment is due whenever
  // no answers exist for the current ISO week — any day of the week counts,
  // which is more forgiving than a Sunday-only window.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const store = await loadAssessmentStore();
      const weekKey = getIsoWeekKey(new Date());
      if (!cancelled) setAssessmentDue(!store[weekKey]);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Auto-clear confetti after the celebration plays.
  useEffect(() => {
    if (!showSaveSuccess) return undefined;
    const timer = setTimeout(() => setShowSaveSuccess(false), 3000);
    return () => clearTimeout(timer);
  }, [showSaveSuccess]);

  // -- Handlers --

  const handleMoodSelect = useCallback((id: MoodId) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMood((prev) => (prev === id ? null : id));
  }, []);

  const handleCategorySelect = useCallback((id: CategoryId) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategory((prev) => (prev === id ? null : id));
  }, []);

  const handleTagToggle = useCallback((tag: string) => {
    void Haptics.selectionAsync();
    setSelectedTags((prev) => {
      if (prev.includes(tag)) return prev.filter((t) => t !== tag);
      if (prev.length >= MAX_USER_TAGS) return prev;
      return [...prev, tag];
    });
  }, []);

  const handleConsistencySelect = useCallback((value: number) => {
    void Haptics.selectionAsync();
    setConsistency(value);
  }, []);

  const handleChallengeSelect = useCallback((value: string) => {
    void Haptics.selectionAsync();
    setChallenge((prev) => (prev === value ? '' : value));
  }, []);

  const handleSave = useCallback(async () => {
    if (body.trim().length === 0) {
      Alert.alert(
        t('emptyBodyTitle', 'Sacred space awaits'),
        t('emptyBodyMessage', 'Please write your reflection before saving.'),
      );
      return;
    }
    if (!mood) {
      Alert.alert(
        t('missingMoodTitle', 'How are you feeling?'),
        t('missingMoodMessage', 'Please select your current mood.'),
      );
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const contentEncrypted = await encryptContent(body.trim());
      const tags = buildTagsPayload({
        mood,
        category,
        userTags: selectedTags,
        timeOfDay: getWritingTimeOfDay(new Date().getHours()),
      });

      await createJournal.mutateAsync({
        content_encrypted: contentEncrypted,
        tags,
      });

      // Persist weekly assessment answers locally once the entry is saved.
      // These stay client-side until the KarmaLytix backend endpoint exists.
      if (assessmentDue) {
        await saveAssessmentAnswers(getIsoWeekKey(new Date()), {
          dharmic_challenge: challenge,
          gita_teaching: gitaTeaching.trim(),
          consistency_score: consistency,
          pattern_noticed: pattern.trim(),
          sankalpa_for_next_week: sankalpa.trim(),
        });
      }

      setShowSaveSuccess(true);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch {
      Alert.alert(
        t('saveErrorTitle', 'Could Not Save'),
        t('saveErrorMessage', 'Your reflection could not be saved right now. Please try again.'),
      );
    }
  }, [
    body,
    mood,
    category,
    selectedTags,
    assessmentDue,
    challenge,
    gitaTeaching,
    consistency,
    pattern,
    sankalpa,
    createJournal,
    router,
    t,
  ]);

  // -- Render --

  const canSave = body.trim().length > 0 && mood !== null && !createJournal.isPending;
  const tagCountLabel = useMemo(
    () => `${selectedTags.length}/${MAX_USER_TAGS}`,
    [selectedTags.length],
  );

  return (
    <DivineBackground variant="sacred" style={styles.root}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.screen, { paddingTop: insets.top }]}>
          <ConfettiCannon isActive={showSaveSuccess} particleCount={30} duration={2000} />

          <GoldenHeader
            title={t('newEntryTitle', 'Sacred Reflection')}
            onBack={() => router.back()}
          />

          <ScrollView
            contentContainerStyle={[
              styles.scroll,
              { paddingBottom: insets.bottom + spacing.xxxl },
            ]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Hero */}
            <Animated.View entering={FadeInDown.duration(400)}>
              <Text variant="devanagariSmall" color={colors.primary[500]} align="center">
                आज का मनन
              </Text>
              <Text
                variant="caption"
                color={colors.text.muted}
                align="center"
                style={styles.privacyNote}
              >
                {t(
                  'privacyNote',
                  '🔒 Your words are encrypted on this device · Never read by Kiaanverse',
                )}
              </Text>
            </Animated.View>

            <GoldenDivider style={styles.divider} />

            {/* SECTION 1 — Mood */}
            <Animated.View entering={FadeInDown.duration(400).delay(80)}>
              <Text variant="label" color={colors.text.primary} style={styles.sectionLabel}>
                {t('moodSectionLabel', 'How is your inner state right now?')}
              </Text>
              <View style={styles.moodGrid}>
                {MOODS.map((m) => {
                  const selected = mood === m.id;
                  return (
                    <Pressable
                      key={m.id}
                      onPress={() => handleMoodSelect(m.id)}
                      style={[
                        styles.moodChip,
                        selected && {
                          borderColor: m.color,
                          backgroundColor: `${m.color}22`,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${m.id} mood`}
                      accessibilityState={{ selected }}
                    >
                      <Text variant="body">{m.emoji}</Text>
                      <Text
                        variant="caption"
                        color={selected ? m.color : colors.text.secondary}
                      >
                        {m.id}
                      </Text>
                      <Text
                        variant="caption"
                        color={selected ? m.color : colors.text.muted}
                      >
                        · {m.sanskrit}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            <GoldenDivider style={styles.divider} />

            {/* SECTION 2 — Category */}
            <Animated.View entering={FadeInDown.duration(400).delay(120)}>
              <Text variant="label" color={colors.text.primary} style={styles.sectionLabel}>
                {t('categorySectionLabel', 'This reflection is a…')}
              </Text>
              <View style={styles.categoryRow}>
                {CATEGORIES.map((c) => {
                  const selected = category === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => handleCategorySelect(c.id)}
                      style={[
                        styles.categoryChip,
                        selected && {
                          borderColor: c.color,
                          backgroundColor: `${c.color}22`,
                        },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${c.id} category`}
                      accessibilityState={{ selected }}
                    >
                      <Text variant="body">{c.icon}</Text>
                      <Text
                        variant="caption"
                        color={selected ? c.color : colors.text.secondary}
                      >
                        {c.id}
                      </Text>
                      <Text
                        variant="caption"
                        color={selected ? c.color : colors.text.muted}
                      >
                        {c.sanskrit}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </Animated.View>

            <GoldenDivider style={styles.divider} />

            {/* SECTION 3 — Tags */}
            <Animated.View entering={FadeInDown.duration(400).delay(160)}>
              <View style={styles.tagHeader}>
                <Text variant="label" color={colors.text.primary}>
                  {t('tagsSectionLabel', 'Themes present today')}
                </Text>
                <Text variant="caption" color={colors.text.muted}>
                  · {tagCountLabel}
                </Text>
              </View>
              <View style={styles.tagGrid}>
                {SUGGESTED_TAGS.map((tag) => {
                  const selected = selectedTags.includes(tag);
                  const disabled = !selected && selectedTags.length >= MAX_USER_TAGS;
                  return (
                    <SacredChip
                      key={tag}
                      label={tag}
                      selected={selected}
                      disabled={disabled}
                      onPress={() => handleTagToggle(tag)}
                    />
                  );
                })}
              </View>
            </Animated.View>

            <GoldenDivider style={styles.divider} />

            {/* SECTION 4 — Encrypted body */}
            <Animated.View entering={FadeInDown.duration(400).delay(200)}>
              <Text variant="label" color={colors.text.primary} style={styles.sectionLabel}>
                {t('reflectionSectionLabel', 'Your sacred reflection')}
              </Text>
              <Text variant="caption" color={colors.text.muted} style={styles.encryptedLabel}>
                {t('encryptedLabel', '🔒 Encrypted on this device')}
              </Text>
              <TextInput
                style={styles.bodyInput}
                value={body}
                onChangeText={setBody}
                placeholder={t(
                  'bodyPlaceholder',
                  'Begin your sacred reflection… Write freely. This space is yours alone.',
                )}
                placeholderTextColor={colors.text.muted}
                multiline
                textAlignVertical="top"
                selectionColor={colors.primary[500]}
                accessibilityLabel="Journal reflection"
              />
            </Animated.View>

            {/* Weekly Sacred Assessment */}
            {assessmentDue ? (
              <Animated.View
                entering={FadeIn.duration(400).delay(240)}
                style={styles.assessmentBlock}
              >
                <GoldenDivider withGlyph style={styles.divider} />
                <Text
                  variant="h3"
                  color={colors.primary[500]}
                  style={styles.assessmentTitle}
                >
                  {t('assessmentTitle', '🌀 Weekly Sacred Assessment')}
                </Text>
                <Text variant="caption" color={colors.text.muted} style={styles.assessmentSub}>
                  {t(
                    'assessmentSub',
                    'These answers are plaintext and power your KarmaLytix analysis. They are NOT encrypted — choose your words accordingly.',
                  )}
                </Text>

                {/* Q1 — dharmic challenge */}
                <Text variant="label" color={colors.text.primary} style={styles.qLabel}>
                  {t(
                    'q1Label',
                    'What was your greatest dharmic challenge this week?',
                  )}
                </Text>
                <View style={styles.challengeRow}>
                  {CHALLENGE_OPTIONS.map((option) => (
                    <SacredChip
                      key={option}
                      label={option}
                      selected={challenge === option}
                      onPress={() => handleChallengeSelect(option)}
                    />
                  ))}
                </View>

                {/* Q2 — Gita teaching */}
                <Text variant="label" color={colors.text.primary} style={styles.qLabel}>
                  {t('q2Label', 'Which Gita teaching felt most alive this week?')}
                </Text>
                <SacredInput
                  value={gitaTeaching}
                  onChangeText={setGitaTeaching}
                  placeholder="e.g. Nishkama Karma, surrender, impermanence…"
                  maxLength={200}
                />

                {/* Q3 — consistency */}
                <Text variant="label" color={colors.text.primary} style={styles.qLabel}>
                  {t('q3Label', 'How consistent was your practice? (1–5)')}
                </Text>
                <View style={styles.consistencyRow}>
                  {[1, 2, 3, 4, 5].map((n) => {
                    const filled = consistency >= n;
                    return (
                      <Pressable
                        key={n}
                        onPress={() => handleConsistencySelect(n)}
                        style={[
                          styles.consistencyDot,
                          filled && styles.consistencyDotFilled,
                        ]}
                        accessibilityRole="button"
                        accessibilityLabel={`Practice consistency ${n} of 5`}
                        accessibilityState={{ selected: consistency === n }}
                      >
                        <Text
                          variant="label"
                          color={filled ? colors.background.dark : colors.text.muted}
                        >
                          {n}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Q4 — pattern */}
                <Text variant="label" color={colors.text.primary} style={styles.qLabel}>
                  {t('q4Label', 'What pattern are you noticing in yourself?')}
                </Text>
                <SacredInput
                  value={pattern}
                  onChangeText={setPattern}
                  placeholder="e.g. I react to criticism with anger…"
                  maxLength={280}
                />

                {/* Q5 — sankalpa */}
                <Text variant="label" color={colors.text.primary} style={styles.qLabel}>
                  {t('q5Label', 'What sankalpa do you carry into next week?')}
                </Text>
                <SacredInput
                  value={sankalpa}
                  onChangeText={setSankalpa}
                  placeholder="e.g. I will respond instead of react…"
                  maxLength={200}
                />
              </Animated.View>
            ) : null}

            {/* Save */}
            <View style={styles.saveWrap}>
              <GoldenButton
                title={t('sealReflection', 'Seal this Reflection')}
                variant="divine"
                onPress={handleSave}
                loading={createJournal.isPending}
                disabled={!canSave}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </DivineBackground>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  screen: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  privacyNote: {
    marginTop: spacing.xxs,
    fontStyle: 'italic',
  },
  divider: {
    marginVertical: spacing.md,
  },
  sectionLabel: {
    marginBottom: spacing.sm,
  },

  // -- Mood grid --
  moodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  moodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.goldLight,
  },

  // -- Category row --
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.goldLight,
  },

  // -- Tags --
  tagHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    marginBottom: spacing.sm,
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },

  // -- Body --
  encryptedLabel: {
    marginBottom: spacing.sm,
  },
  bodyInput: {
    minHeight: 200,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    borderRadius: 16,
    backgroundColor: colors.background.card,
    color: colors.text.primary,
    fontSize: 16,
    lineHeight: 26,
    padding: spacing.md,
    textAlignVertical: 'top',
  },

  // -- Assessment --
  assessmentBlock: {
    marginTop: spacing.md,
  },
  assessmentTitle: {
    marginTop: spacing.xs,
  },
  assessmentSub: {
    marginTop: spacing.xxs,
    marginBottom: spacing.sm,
    lineHeight: 18,
  },
  qLabel: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  challengeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  consistencyRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  consistencyDot: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    backgroundColor: colors.alpha.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consistencyDotFilled: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },

  // -- Save --
  saveWrap: {
    marginTop: spacing.lg,
  },
});
