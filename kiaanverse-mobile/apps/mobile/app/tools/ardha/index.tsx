/**
 * Ardha — Input screen.
 *
 * 1:1 adaptation of kiaanverse.com/m/ardha: gold Devanagari crown title,
 * BG 2.16 anchor quote, a single "thought to reframe" card with scrollable
 * starter chips, a blue→teal "Reframe with ARDHA" CTA, and a collapsed
 * reference list of the 5 ARDHA pillars beneath. Submitting the thought
 * navigates to `./result` with the full structured response.
 *
 * The chat-bubble screen that used to live here has been replaced — the
 * new result screen renders the 5-pillar accordion instead.
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  DivineBackground,
  GoldenHeader,
  MandalaSpin,
  Text,
  colors,
  fontFamily,
  radii,
  spacing,
} from '@kiaanverse/ui';
import {
  ARDHA_SECTIONS,
  isApiError,
  isAuthError,
  isOfflineError,
  useArdhaStructuredReframe,
} from '@kiaanverse/api';

/** Starter chips — exact from kiaanverse.com/m/ardha, in visible order. */
const STARTER_CHIPS: readonly string[] = [
  'I always fail at...',
  'Nobody cares about...',
  "I'm not good enough...",
  'Everything goes wrong...',
  'I always mess up...',
  'Nobody understands me...',
];

/** Rotating loader lines shown under the spinning mandala. */
const LOADING_LINES: readonly string[] = [
  'Distinguishing Atman from Prakriti...',
  'Scanning Raga-Dvesha patterns...',
  'Aligning with Dharma...',
  'Balancing Hrdaya Samatvam...',
  'Preparing Arpana...',
];

/** ARDHA pillars shown in the reference accordion under the CTA. */
const PILLAR_SUMMARY = ARDHA_SECTIONS.filter(
  (s) => s.key !== 'gita_verse' && s.key !== 'compliance_check',
);

export default function ArdhaInputScreen(): React.JSX.Element {
  const router = useRouter();
  const reframe = useArdhaStructuredReframe();

  const [thought, setThought] = useState('');
  const [loadingIdx, setLoadingIdx] = useState(0);
  const loadingTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  const canSubmit = thought.trim().length > 0 && !reframe.isPending;

  const handleChip = useCallback((seed: string) => {
    Haptics.selectionAsync();
    setThought(seed.replace(/\.\.\.$/, ' '));
  }, []);

  const handleSubmit = useCallback(async () => {
    const text = thought.trim();
    if (!text || reframe.isPending) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    let idx = 0;
    setLoadingIdx(0);
    loadingTimer.current = setInterval(() => {
      idx = (idx + 1) % LOADING_LINES.length;
      setLoadingIdx(idx);
    }, 1800);

    try {
      const result = await reframe.mutateAsync({ thought: text });
      router.push({
        pathname: '/tools/ardha/result',
        params: { payload: JSON.stringify(result) },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[Ardha] reframe failed', err);
    } finally {
      if (loadingTimer.current) {
        clearInterval(loadingTimer.current);
        loadingTimer.current = null;
      }
    }
  }, [thought, reframe, router]);

  const errorMessage = reframe.error ? formatError(reframe.error) : null;

  return (
    <DivineBackground variant="cosmic" style={styles.root}>
      <GoldenHeader title="Ardha" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(500)} style={styles.crown}>
          <Text style={styles.sanskrit} accessibilityLabel="Ardha">
            अर्ध
          </Text>
          <Text style={styles.english}>Ardha</Text>
          <Text style={styles.tagline}>
            Atma-Reframing through Dharma &amp; Higher Awareness
          </Text>
          <View style={styles.divider} />
          <Text style={styles.quote}>
            “The unreal has no existence, and the real never ceases to be.”
          </Text>
          <Text style={styles.quoteRef}>Bhagavad Gita 2.16</Text>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(500).delay(100)}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <Text style={styles.cardHeaderLabel}>Share the thought to reframe</Text>
            <View style={styles.bulbBadge}>
              <Text style={styles.bulb}>💡</Text>
            </View>
          </View>

          <TextInput
            style={styles.input}
            value={thought}
            onChangeText={setThought}
            placeholder={
              'Type a thought that troubles you... ARDHA will\nsee through the distortion to the truth beneath.'
            }
            placeholderTextColor="rgba(212,160,23,0.35)"
            multiline
            textAlignVertical="top"
            editable={!reframe.isPending}
            maxLength={2000}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
            style={styles.chipsScroll}
          >
            {STARTER_CHIPS.map((chip) => (
              <Pressable
                key={chip}
                onPress={() => handleChip(chip)}
                style={({ pressed }) => [
                  styles.chip,
                  pressed && styles.chipPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Use starter phrase: ${chip}`}
              >
                <Text style={styles.chipText}>{chip}</Text>
              </Pressable>
            ))}
          </ScrollView>

          <Pressable
            onPress={handleSubmit}
            disabled={!canSubmit}
            style={({ pressed }) => [
              styles.cta,
              !canSubmit && styles.ctaDisabled,
              pressed && canSubmit && styles.ctaPressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Reframe with Ardha"
          >
            <LinearGradient
              colors={['#1B4FBB', '#0E7490']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {reframe.isPending ? (
                <View style={styles.ctaLoadingRow}>
                  <ActivityIndicator color={colors.raw.white} size="small" />
                  <Text style={styles.ctaText}>ARDHA is reflecting...</Text>
                </View>
              ) : (
                <Text style={styles.ctaText}>Reframe with ARDHA</Text>
              )}
            </LinearGradient>
          </Pressable>

          {reframe.isPending ? (
            <View style={styles.loadingBlock}>
              <MandalaSpin
                size={96}
                speed="slow"
                color={colors.primary[500]}
                opacity={0.35}
              />
              <Text style={styles.loadingLine}>{LOADING_LINES[loadingIdx]}</Text>
            </View>
          ) : null}

          {errorMessage ? (
            <Text style={styles.errorLine} accessibilityLiveRegion="polite">
              {errorMessage}
            </Text>
          ) : null}
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(500).delay(150)}
          style={styles.pillarsBlock}
        >
          <View style={styles.pillarsHeaderRow}>
            <View style={styles.pillarsDot} />
            <Text style={styles.pillarsHeader}>ARDHA's 5 Pillars</Text>
          </View>
          <View style={styles.pillarsCard}>
            {PILLAR_SUMMARY.map((pillar, index) => (
              <View
                key={pillar.key}
                style={[
                  styles.pillarRow,
                  index < PILLAR_SUMMARY.length - 1 && styles.pillarRowDivider,
                ]}
              >
                <View style={styles.pillarBadge}>
                  <Text style={styles.pillarBadgeText}>{pillar.badge}</Text>
                </View>
                <Text style={styles.pillarName}>{pillar.label}</Text>
                <Text style={styles.pillarSanskrit}>({pillar.sanskrit})</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.duration(500).delay(200)}
          style={styles.cbtBlock}
        >
          <Text style={styles.cbtTitle}>ARDHA vs CBT</Text>
          <Text style={styles.cbtBody}>
            CBT corrects <Text style={styles.italic}>distorted thinking</Text>.
            ARDHA corrects <Text style={styles.italic}>mistaken identity</Text>.
            Where CBT strengthens the functional ego, ARDHA loosens
            ego-identification toward inner freedom through right action.
          </Text>
          <View style={styles.cbtFlow}>
            <Text style={styles.cbtFlowText}>
              Atma Distinction → Raga-Dvesha Scan → Dharma Alignment →
              Hrdaya Samatvam → Arpana
            </Text>
          </View>
        </Animated.View>
      </ScrollView>
    </DivineBackground>
  );
}

function formatError(err: unknown): string {
  if (isAuthError(err)) return 'Your session has expired. Please sign in again.';
  if (isOfflineError(err))
    return 'The network is unreachable. Check your connection and try once more.';
  if (isApiError(err) && err.statusCode >= 500)
    return 'ARDHA is waking from deep meditation. Please try again in a moment.';
  if (err instanceof Error && err.message) return `ARDHA could not reframe: ${err.message}`;
  return 'ARDHA could not reframe right now. Please try again.';
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: {
    paddingBottom: spacing.xxl,
  },
  crown: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  sanskrit: {
    fontFamily: fontFamily.devanagariMedium,
    fontSize: 56,
    color: colors.primary[500],
    lineHeight: 72,
  },
  english: {
    fontFamily: fontFamily.divineItalic,
    fontSize: 22,
    color: colors.primary[500],
    marginTop: spacing.xxs,
  },
  tagline: {
    fontFamily: fontFamily.scriptureItalic,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 22,
  },
  divider: {
    height: 1,
    width: 64,
    backgroundColor: colors.alpha.goldStrong,
    marginVertical: spacing.md,
  },
  quote: {
    fontFamily: fontFamily.scriptureItalic,
    fontSize: 14,
    color: 'rgba(240,235,225,0.75)',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
  },
  quoteRef: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    color: colors.text.muted,
    marginTop: spacing.xxs,
  },
  card: {
    marginHorizontal: spacing.md,
    backgroundColor: 'rgba(22,26,66,0.92)',
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    borderRadius: radii.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  cardHeaderLabel: {
    fontFamily: fontFamily.body,
    fontSize: 14,
    color: colors.text.primary,
  },
  bulbBadge: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.alpha.goldMedium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulb: { fontSize: 18 },
  input: {
    minHeight: 110,
    backgroundColor: 'rgba(5,7,20,0.5)',
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
    borderRadius: radii.md,
    padding: spacing.md,
    fontFamily: fontFamily.scriptureItalic,
    fontSize: 15,
    lineHeight: 22,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  chipsScroll: { marginBottom: spacing.md },
  chipsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.alpha.goldMedium,
  },
  chipPressed: {
    backgroundColor: colors.alpha.goldLight,
    borderColor: colors.alpha.goldStrong,
  },
  chipText: {
    fontFamily: fontFamily.body,
    fontSize: 12,
    color: colors.primary[300],
  },
  cta: { borderRadius: radii.xl, overflow: 'hidden' },
  ctaDisabled: { opacity: 0.5 },
  ctaPressed: { opacity: 0.85 },
  ctaGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaLoadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ctaText: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    color: colors.raw.white,
    letterSpacing: 0.3,
  },
  loadingBlock: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  loadingLine: {
    fontFamily: fontFamily.scriptureItalic,
    fontSize: 14,
    color: colors.text.secondary,
    textAlign: 'center',
  },
  errorLine: {
    marginTop: spacing.sm,
    fontFamily: fontFamily.body,
    fontSize: 13,
    color: colors.semantic.error,
    textAlign: 'center',
  },
  pillarsBlock: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  pillarsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  pillarsDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary[500],
  },
  pillarsHeader: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.primary[500],
  },
  pillarsCard: {
    backgroundColor: 'rgba(22,26,66,0.85)',
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  pillarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
  },
  pillarRowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.alpha.goldLight,
  },
  pillarBadge: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.alpha.goldStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillarBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.primary[500],
  },
  pillarName: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.text.primary,
  },
  pillarSanskrit: {
    fontFamily: fontFamily.scriptureItalic,
    fontSize: 12,
    color: colors.text.muted,
  },
  cbtBlock: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  cbtTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 11,
    letterSpacing: 1.2,
    color: colors.primary[700],
    marginBottom: spacing.xs,
  },
  cbtBody: {
    fontFamily: fontFamily.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.text.secondary,
  },
  italic: { fontFamily: fontFamily.scriptureItalic },
  cbtFlow: {
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
    borderRadius: radii.md,
    padding: spacing.sm,
  },
  cbtFlowText: {
    fontFamily: fontFamily.body,
    fontSize: 11,
    lineHeight: 18,
    color: colors.primary[700],
  },
});
