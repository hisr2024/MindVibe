/**
 * Home Tab — daily spiritual practice entry point.
 *
 * Composed from @kiaanverse/ui primitives and real state sources:
 *  - useGitaStore              → verse-of-the-day reference (persisted, 24 h)
 *  - useGitaVerse(chapter,v)   → verse content (offline-first TanStack cache)
 *  - useSadhanaStreak          → current streak count (API)
 *  - useSadhanaStore           → today's phase in the 6-step sadhana flow
 *  - useMoodStore              → whether today's mood was already logged
 *
 * Sections:
 *  1. GoldenHeader — time-of-day greeting (Brahma / Pratah / Madhyanha / Sandhya / Ratri)
 *  2. Daily Shloka card (OmLoader while loading)
 *  3. Streak ring + lotus bloom of sadhana progress
 *  4. Horizontal tool chips
 *  5. KIAAN Vibe Player mini-banner
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import {
  Screen,
  SacredCard,
  GlowCard,
  GoldenDivider,
  ShlokaCard,
  SacredProgressRing,
  GoldenHeader,
  LotusProgress,
  OmLoader,
  SacredChip,
} from '@kiaanverse/ui';
import {
  useMoodStore,
  useSadhanaStore,
  useGitaStore,
  type SadhanaPhase,
} from '@kiaanverse/store';
import { useTranslation } from '@kiaanverse/i18n';
import { useGitaVerse, useSadhanaStreak } from '@kiaanverse/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Sadhana phase order — mirrors the phaseOrder constant in sadhanaStore. */
const SADHANA_PHASE_ORDER: readonly SadhanaPhase[] = [
  'greeting',
  'mood_check',
  'verse_contemplation',
  'reflection',
  'intention',
  'complete',
] as const;

/** Fallback daily verse — BG 2.47 — used before the store hydrates. */
const FALLBACK_VOD = { chapter: 2, verse: 47 } as const;

// ---------------------------------------------------------------------------
// Greeting
// ---------------------------------------------------------------------------

interface Greeting {
  readonly titleKey: string;
  readonly titleFallback: string;
  readonly sanskritKey: string;
  readonly sanskritFallback: string;
}

function resolveGreeting(now: Date = new Date()): Greeting {
  const minutes = now.getHours() * 60 + now.getMinutes();
  // Brahma Muhurta: 03:30 – 05:30
  if (minutes >= 3 * 60 + 30 && minutes < 5 * 60 + 30) {
    return {
      titleKey: 'greetings.brahma',
      titleFallback: 'Brahma Muhurta',
      sanskritKey: 'greetings.brahmaSanskrit',
      sanskritFallback: 'ब्रह्म मुहूर्त',
    };
  }
  // Pratah: 05:30 – 12:00
  if (minutes >= 5 * 60 + 30 && minutes < 12 * 60) {
    return {
      titleKey: 'greetings.pratah',
      titleFallback: 'Shubh Prabhat',
      sanskritKey: 'greetings.pratahSanskrit',
      sanskritFallback: 'शुभ प्रभात',
    };
  }
  // Madhyanha: 12:00 – 17:00
  if (minutes >= 12 * 60 && minutes < 17 * 60) {
    return {
      titleKey: 'greetings.madhyanha',
      titleFallback: 'Shubh Madhyanha',
      sanskritKey: 'greetings.madhyanhaSanskrit',
      sanskritFallback: 'शुभ मध्याह्न',
    };
  }
  // Sandhya: 17:00 – 20:00
  if (minutes >= 17 * 60 && minutes < 20 * 60) {
    return {
      titleKey: 'greetings.sandhya',
      titleFallback: 'Shubh Sandhya',
      sanskritKey: 'greetings.sandhyaSanskrit',
      sanskritFallback: 'संध्या वंदन',
    };
  }
  // Ratri: 20:00 – 03:30
  return {
    titleKey: 'greetings.ratri',
    titleFallback: 'Shubh Ratri',
    sanskritKey: 'greetings.ratriSanskrit',
    sanskritFallback: 'शुभ रात्रि',
  };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const { t } = useTranslation('home');

  // Stores (Zustand) — pick narrow slices to minimize re-renders.
  const loggedToday = useMoodStore((s) => s.loggedToday);
  const currentPhase = useSadhanaStore((s) => s.phase);
  const vodChapter = useGitaStore((s) => s.vodChapter);
  const vodVerse = useGitaStore((s) => s.vodVerse);
  const refreshVerseOfTheDay = useGitaStore((s) => s.refreshVerseOfTheDay);

  // Ensure the verse-of-the-day is selected for today (no-op if fresh).
  useEffect(() => {
    refreshVerseOfTheDay();
  }, [refreshVerseOfTheDay]);

  // Resolve verse ref — gitaStore persists async, so fall back until ready.
  const chapter = vodChapter ?? FALLBACK_VOD.chapter;
  const verse = vodVerse ?? FALLBACK_VOD.verse;

  // API queries
  const { data: streak } = useSadhanaStreak();
  const { data: verseData, isLoading: verseLoading } = useGitaVerse(chapter, verse);

  const currentStreak = streak?.current ?? 0;

  // Greeting
  const greeting = useMemo(() => resolveGreeting(), []);
  const greetingTitle = t(greeting.titleKey, greeting.titleFallback);
  const greetingSanskrit = t(greeting.sanskritKey, greeting.sanskritFallback);

  // Sadhana phase → 0..1 progress driving the lotus bloom.
  const phaseProgress = useMemo(() => {
    const idx = SADHANA_PHASE_ORDER.indexOf(currentPhase);
    if (idx < 0) return 0;
    return (idx + 1) / SADHANA_PHASE_ORDER.length;
  }, [currentPhase]);

  const tools = useMemo(
    () => [
      { label: t('tools.emotionalReset', 'Emotional Reset'), route: '/tools/emotional-reset' },
      { label: t('tools.ardha', 'Ardha Reframe'), route: '/tools/ardha' },
      { label: t('tools.karmaReset', 'Karma Reset'), route: '/tools/karma-reset' },
      { label: t('tools.viyoga', 'Viyoga Guide'), route: '/tools/viyoga' },
      { label: t('tools.allTools', 'All Tools'), route: '/tools' },
    ] as const,
    [t],
  );

  const goTo = useCallback(
    (route: string, style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
      void Haptics.impactAsync(style).catch(() => {
        // Haptics unavailable (simulator / tests) — silent.
      });
      router.push(route as never);
    },
    [router],
  );

  return (
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* 1. Greeting ---------------------------------------------------- */}
        <GoldenHeader title={greetingTitle} />
        <Text style={styles.greetingSanskrit}>{greetingSanskrit}</Text>

        {/* 2. Daily verse ------------------------------------------------- */}
        <View style={styles.section}>
          {verseLoading || !verseData ? (
            <View style={styles.verseLoader}>
              <OmLoader size={48} label={t('loadingVerse', 'Revealing today\'s verse…')} />
            </View>
          ) : (
            <ShlokaCard
              sanskrit={verseData.sanskrit}
              {...(verseData.transliteration
                ? { transliteration: verseData.transliteration }
                : {})}
              meaning={verseData.translation}
              reference={`Bhagavad Gita ${verseData.chapter}.${verseData.verse}`}
            />
          )}
        </View>

        <GoldenDivider style={styles.divider} />

        {/* 3. Streak + Sadhana progress ---------------------------------- */}
        <SacredCard style={styles.sadhanaCard}>
          <View style={styles.sadhanaRow}>
            <SacredProgressRing
              progress={phaseProgress}
              size={88}
              label={currentStreak}
              caption={t('dayStreak', 'day streak')}
            />
            <View style={styles.sadhanaRight}>
              <LotusProgress progress={phaseProgress} size={96} />
              <Text style={styles.phaseLabel}>
                {t(
                  `sadhana.phase.${currentPhase}`,
                  currentPhase.replace(/_/g, ' '),
                )}
              </Text>
            </View>
          </View>
          {loggedToday ? (
            <Text style={styles.loggedHint}>
              {t('moodLogged', 'Mood logged for today')}
            </Text>
          ) : null}
        </SacredCard>

        {/* 4. Tool chips ------------------------------------------------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.toolsScroll}
          contentContainerStyle={styles.toolsRow}
        >
          {tools.map((tool) => (
            <SacredChip
              key={tool.route}
              label={tool.label}
              onPress={() => goTo(tool.route)}
            />
          ))}
        </ScrollView>

        {/* 5. KIAAN Vibe mini-banner ------------------------------------ */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('vibePlayer.title', 'KIAAN Vibe Player')}
          onPress={() => goTo('/vibe-player', Haptics.ImpactFeedbackStyle.Medium)}
          style={styles.vibePressable}
        >
          <GlowCard variant="golden">
            <View style={styles.vibeRow}>
              <Text style={styles.vibeGlyph}>🎵</Text>
              <View style={styles.vibeText}>
                <Text style={styles.vibeTitle}>
                  {t('vibePlayer.title', 'KIAAN Vibe Player')}
                </Text>
                <Text style={styles.vibeSubtitle}>
                  {t('vibePlayer.subtitle', 'Sacred sound journeys for inner stillness')}
                </Text>
              </View>
              <Text style={styles.vibeChevron}>›</Text>
            </View>
          </GlowCard>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const GOLD = '#D4A017';
const GOLD_SUB = 'rgba(212, 160, 23, 0.55)';
const TEXT_MUTED = '#7A7060';
const TEXT_PRIMARY = '#F5F0E8';

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
    gap: 16,
  },
  greetingSanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 13,
    color: GOLD_SUB,
    textAlign: 'center',
    marginTop: -4,
  },

  section: {
    alignSelf: 'stretch',
  },
  verseLoader: {
    alignItems: 'center',
    paddingVertical: 24,
  },

  divider: {
    marginVertical: 4,
  },

  sadhanaCard: {
    alignSelf: 'stretch',
  },
  sadhanaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  sadhanaRight: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  phaseLabel: {
    fontFamily: 'Outfit-Medium',
    fontSize: 12,
    color: GOLD,
    textTransform: 'capitalize',
    letterSpacing: 0.4,
  },
  loggedHint: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 12,
    letterSpacing: 0.3,
  },

  toolsScroll: {
    alignSelf: 'stretch',
  },
  toolsRow: {
    gap: 8,
    paddingVertical: 4,
    paddingRight: 16,
  },

  vibePressable: {
    alignSelf: 'stretch',
  },
  vibeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  vibeGlyph: {
    fontSize: 28,
  },
  vibeText: {
    flex: 1,
  },
  vibeTitle: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 18,
    color: TEXT_PRIMARY,
  },
  vibeSubtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  vibeChevron: {
    fontSize: 22,
    color: GOLD,
    fontWeight: '700',
  },
});
