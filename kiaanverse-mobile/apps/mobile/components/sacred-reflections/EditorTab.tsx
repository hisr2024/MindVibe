/**
 * Sacred Reflections — EDITOR tab (लेख).
 *
 * 1:1 Kiaanverse.com mobile parity: mood pills with Devanagari + emoji,
 * title line, multi-line body, dharmic tag chips, E2E encryption notice,
 * "Offer This Reflection" CTA. Body is AES-256-GCM encrypted on-device
 * (see utils/sacredReflectionEncryption) — the server only ever sees
 * ciphertext plus plaintext mood / tag metadata.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { VoicePrefillBanner } from '../../voice/components/VoicePrefillBanner';
import { useVoicePrefill } from '../../voice/hooks/useVoicePrefill';
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
  useVoiceRecorder,
} from '@kiaanverse/ui';
import { api, useCreateJournal } from '@kiaanverse/api';

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
import { WeeklyAssessment } from './WeeklyAssessment';
import { ShankhaVoiceInput } from '../../voice/components/ShankhaVoiceInput';

interface EditorTabProps {
  readonly onSaved: () => void;
}

/**
 * Build the moods[] + tags[] metadata the server will index.
 *
 * The backend's KarmaLytix pipeline (karmalytix_service._get_mood_data)
 * scans JournalEntry.mood_labels only; anything dropped into tags[] is
 * invisible to mood analytics. Prior to this split, mood was pushed into
 * the same tags bucket and dominant_mood was permanently None — that's
 * what shipped as the "broken" Sacred Mirror. We separate them here and
 * also keep the mood id in tags[] so the Browse filter (which filters on
 * plaintext tag strings) keeps working unchanged.
 */
export function buildMetadataPayload(opts: {
  mood: MoodId | null;
  userTags: readonly SacredTag[];
  timeOfDay: string;
}): { moods: string[]; tags: string[] } {
  const moods: string[] = opts.mood ? [opts.mood] : [];
  const tags: string[] = [];
  if (opts.mood) tags.push(opts.mood); // kept for BrowseTab filter compat
  tags.push(`time:${opts.timeOfDay}`);
  for (const tag of opts.userTags) {
    if (!tags.includes(tag)) tags.push(tag);
  }
  return { moods, tags };
}

// Transcription function bound to the KIAAN /api/kiaan/transcribe endpoint.
// Defined at module scope so the useVoiceRecorder hook receives a stable
// reference (its internal callbacks re-run when `transcribe` changes).
async function transcribeAudio(
  formData: FormData
): Promise<{ transcript: string; confidence: number }> {
  const { data } = await api.voice.transcribe(formData);
  return data;
}

export function EditorTab({ onSaved }: EditorTabProps): React.JSX.Element {
  const createJournal = useCreateJournal();
  const [mood, setMood] = useState<MoodId | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [selectedTags, setSelectedTags] = useState<SacredTag[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  // Voice → Sacred Reflections: when Sakha routes the user here from a
  // dictated reflection, seed the body (and optionally append a verse
  // reference). Allowed fields per tool-prefill-contracts.ts:
  // ['prefill_text', 'verse_ref', 'mood_label', 'source'].
  const voice = useVoicePrefill<{
    prefill_text?: string;
    verse_ref?: string;
    mood_label?: string;
    source?: string;
  }>('SACRED_REFLECTIONS');

  useEffect(() => {
    if (!voice.prefill) return;
    const text = voice.prefill.prefill_text?.trim();
    const verse = voice.prefill.verse_ref?.trim();
    if (text && body.length === 0) {
      const seeded = verse ? `${text}\n\n— ${verse}` : text;
      setBody(seeded);
    }
    // Single-shot seed on first arrival; subsequent edits stay the
    // user's. Run only when the carried text changes (i.e. a fresh
    // voice navigation), not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.prefill?.prefill_text, voice.prefill?.verse_ref]);

  const voiceLabel =
    voice.prefill?.prefill_text?.slice(0, 40) ??
    voice.prefill?.verse_ref ??
    'today\'s reflection';

  const {
    startRecording,
    stopRecording,
    cancelRecording,
    isRecording,
    status: voiceStatus,
    durationSeconds,
    error: voiceError,
  } = useVoiceRecorder({ transcribe: transcribeAudio });

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

  // ---- Voice dictation: tap to start, tap again to stop+transcribe ----
  const handleVoicePress = useCallback(async () => {
    if (voiceStatus === 'transcribing') return;
    if (isRecording) {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      const result = await stopRecording();
      if (result && result.transcript) {
        // Append — never replace — so the user's typed reflection is safe.
        setBody((prev) => {
          const sep = prev.trim().length === 0 ? '' : '\n\n';
          return `${prev}${sep}${result.transcript}`;
        });
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } else if (voiceError) {
        Alert.alert('Voice unavailable', voiceError);
      }
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await startRecording();
  }, [isRecording, voiceStatus, voiceError, startRecording, stopRecording]);

  // Cancel any in-flight recording if the component unmounts mid-flow —
  // the hook itself already unloads on unmount, this is just belt-and-braces.
  React.useEffect(() => {
    return () => {
      if (isRecording) void cancelRecording();
    };
  }, [cancelRecording, isRecording]);

  const handleOffer = useCallback(async () => {
    if (!mood) {
      Alert.alert('How do you feel?', 'Please select your current mood first.');
      return;
    }
    if (body.trim().length === 0) {
      Alert.alert(
        'Sacred space awaits',
        'Let the words come. Write your reflection before offering it.'
      );
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
      const { moods, tags } = buildMetadataPayload({
        mood,
        userTags: selectedTags,
        timeOfDay: getWritingTimeOfDay(now.getHours()),
      });
      // week tag helps KarmaLytix group reflections without the server
      // decoding the date client-side.
      tags.push(`week:${getIsoWeekKey(now)}`);

      await createJournal.mutateAsync({
        content_encrypted: ciphertext,
        moods,
        tags,
      });

      setMood(null);
      setTitle('');
      setBody('');
      setSelectedTags([]);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved();
    } catch (err) {
      Alert.alert(
        'Could not offer reflection',
        err instanceof Error ? err.message : 'Please try again in a moment.'
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  }, [mood, title, body, selectedTags, createJournal, onSaved]);

  const wordCount =
    body.trim().length === 0 ? 0 : body.trim().split(/\s+/).length;

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={80}
    >
      {voice.isVoicePrefilled && (
        <VoicePrefillBanner label={voiceLabel} onDismiss={voice.acknowledge} />
      )}
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ---- Mood prompt ---- */}
        <Text
          variant="label"
          color={colors.primary[500]}
          style={styles.sectionLabel}
        >
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
        <ShankhaVoiceInput
          value={title}
          onChangeText={setTitle}
          placeholder={COPY.titlePlaceholder}
          style={styles.titleInput}
          maxLength={120}
          returnKeyType="next"
          dictationMode="append"
          />
        <View style={styles.titleUnderline} />

        {/* ---- Body ---- */}
        <View style={styles.bodyWrap}>
          <ShankhaVoiceInput
            value={body}
            onChangeText={setBody}
            placeholder={COPY.bodyPlaceholder}
            style={styles.bodyInput}
            multiline
            maxLength={10_000}
            dictationMode="append"
            />
          {/* Voice mic affordance — tap once to start, again to stop &
              transcribe. The transcript is appended to the body so anything
              already typed survives. Visually mirrors the Kiaanverse.com
              microphone bubble but the tap action is fully live. */}
          <Pressable
            style={[
              styles.micButton,
              isRecording && styles.micButtonActive,
              voiceStatus === 'transcribing' && styles.micButtonBusy,
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isRecording
                ? 'Stop recording and transcribe'
                : voiceStatus === 'transcribing'
                  ? 'Transcribing your reflection'
                  : 'Start voice dictation'
            }
            accessibilityState={{ busy: voiceStatus === 'transcribing' }}
            disabled={voiceStatus === 'transcribing'}
            onPress={handleVoicePress}
          >
            <Text style={styles.micIcon}>
              {isRecording ? '■' : '\u{1F399}\u{FE0F}'}
            </Text>
          </Pressable>
        </View>

        <Text
          variant="caption"
          color={colors.text.muted}
          style={styles.wordCount}
        >
          {isRecording
            ? `\u{1F534} Recording · ${durationSeconds}s — tap ■ to stop`
            : voiceStatus === 'transcribing'
              ? '\u{1F4AC} Transcribing your words…'
              : wordCount === 0
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
                  color={
                    isActive ? colors.background.dark : colors.text.secondary
                  }
                >
                  #{tag}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ---- Encryption notice ---- */}
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.encryptionBanner}
        >
          <Text style={styles.lockIcon}>{'\u{1F512}'}</Text>
          <Text
            variant="caption"
            color={colors.text.secondary}
            style={styles.encryptionText}
          >
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

        {/* ---- Weekly Sacred Assessment (appears once per ISO week) ---- */}
        <WeeklyAssessment />
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
  micButtonActive: {
    backgroundColor: colors.semantic.error,
    borderColor: colors.semantic.error,
  },
  micButtonBusy: {
    backgroundColor: colors.alpha.goldLight,
    borderColor: colors.primary[500],
    opacity: 0.7,
  },
  micIcon: { fontSize: 18, color: colors.text.primary },
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
