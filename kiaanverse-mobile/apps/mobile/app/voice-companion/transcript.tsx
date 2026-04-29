/**
 * VoiceTranscriptOverlay — post-turn slide-up sheet.
 *
 * Shows after Sakha's reply finishes (state goes back to listening).
 * User can tap to expand:
 *   • Sanskrit (verbatim)
 *   • English / Hindi translation
 *   • Sakha's full response text
 *   • Save-to-journal CTA → /tools/sacred-reflections with prefill
 *
 * Per spec: never auto-pop full screen. Slide up modally only when
 * the user requests it; otherwise the canvas stays clean for the
 * next turn.
 */

import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Color, Spacing, Type } from '../../voice/lib/theme';
import { useVoiceStore } from '../../voice/stores/voiceStore';

export default function VoiceTranscriptOverlay() {
  const router = useRouter();
  const verse = useVoiceStore((s) => s.currentVerse);
  const responseText = useVoiceStore((s) => s.responseText);
  const finalTranscript = useVoiceStore((s) => s.finalTranscript);
  const engine = useVoiceStore((s) => s.currentEngine);
  const mood = useVoiceStore((s) => s.currentMood);

  const cleanedResponseText = useMemo(
    () => responseText.replace(/<pause:[a-z]+>/g, '  '),
    [responseText],
  );

  const handleSaveToJournal = () => {
    router.push({
      pathname: '/tools/sacred-reflections',
      params: {
        source: 'voice_companion',
        prefill_text: cleanedResponseText.slice(0, 800),
        verse_ref: verse?.citation ?? '',
      },
    });
  };

  return (
    <SafeAreaView style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close transcript"
        style={styles.dismissArea}
        onPress={() => router.back()}
      />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.label}>You said</Text>
          <Text style={styles.userText}>{finalTranscript || '—'}</Text>

          {verse ? (
            <>
              <Text style={[styles.label, styles.labelSpaced]}>From the Bhagavad Gita</Text>
              <Text style={styles.citation}>{verse.citation}</Text>
              <Text style={styles.sanskrit}>{verse.text_sa}</Text>
              <Text style={styles.translation}>{verse.text_en}</Text>
              {verse.text_hi ? (
                <Text style={styles.translationHi}>{verse.text_hi}</Text>
              ) : null}
            </>
          ) : null}

          <Text style={[styles.label, styles.labelSpaced]}>Sakha said</Text>
          <Text style={styles.responseText}>{cleanedResponseText || '—'}</Text>

          {(engine || mood) ? (
            <View style={styles.metaRow}>
              {engine ? <Text style={styles.metaText}>engine · {engine}</Text> : null}
              {mood ? (
                <Text style={styles.metaText}>
                  mood · {mood.label} ({Math.round(mood.intensity * 100)}%)
                </Text>
              ) : null}
            </View>
          ) : null}
        </ScrollView>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Save to Sacred Reflections journal"
          style={styles.cta}
          onPress={handleSaveToJournal}
        >
          <Text style={styles.ctaText}>Save to journal</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'rgba(5, 7, 20, 0.7)' },
  dismissArea: { flex: 1 },
  sheet: {
    backgroundColor: Color.cosmicVoidSoft,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Spacing.lg,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 48, height: 4, borderRadius: 2,
    backgroundColor: Color.divider,
    marginTop: Spacing.sm, marginBottom: Spacing.md,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
  },
  label: {
    ...Type.micro,
    color: Color.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1.4,
    marginBottom: Spacing.xs,
  },
  labelSpaced: { marginTop: Spacing.lg },
  userText: { ...Type.body, color: Color.textPrimary },
  citation: {
    ...Type.caption,
    color: Color.divineGoldBright,
    marginBottom: Spacing.sm,
  },
  sanskrit: {
    ...Type.sanskrit,
    color: Color.shankhaCream,
    marginBottom: Spacing.md,
  },
  translation: {
    ...Type.hero,
    color: Color.textPrimary,
    marginBottom: Spacing.sm,
  },
  translationHi: {
    ...Type.body,
    color: Color.textSecondary,
    fontStyle: 'italic',
  },
  responseText: { ...Type.body, color: Color.textPrimary },
  metaRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  metaText: { ...Type.micro, color: Color.textTertiary },
  cta: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Color.divineGoldDim,
    borderRadius: 999,
    alignItems: 'center',
  },
  ctaText: { ...Type.body, color: Color.cosmicVoid, fontWeight: '600' },
});
