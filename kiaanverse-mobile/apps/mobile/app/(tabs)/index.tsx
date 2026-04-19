/**
 * Home Tab — 1:1 port of the web /dashboard (app/dashboard/DashboardClient.tsx).
 *
 * Layer stack: DivineScreenWrapper (particle field + aurora + muhurta bg)
 * wraps a ScrollView with pull-to-refresh. Sections cascade in with
 * useDivineEntrance, 150 ms apart, matching the web's staggerChildren.
 *
 * Six sections:
 *   1. Header — time-based greeting + user name + Sanskrit sub + streak flame
 *   2. Daily Verse card (आज का श्लोक) — VerseRevelation entrance
 *   3. SAKHA quick-access — SakhaMandala + "Begin Dialogue" CTA
 *   4. Nitya Sadhana streak — flame + count + SacredProgressRing
 *   5. Mood check-in — 5 Sanskrit emotional states, horizontal scroll
 *   6. Current journey — chakra + progress bar + "Continue" CTA
 */

import React, { useCallback, useMemo, useState } from 'react';
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type TextStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { colors, DivineScreenWrapper } from '@kiaanverse/ui';
import { useAuthStore } from '@kiaanverse/store';
import {
  useJourneyDashboard,
  useCreateMood,
  useSadhanaStreak,
} from '@kiaanverse/api';

import { SacredCard } from '../../components/home/SacredCard';
import { SakhaMandala } from '../../components/home/SakhaMandala';
import { SacredProgressRing } from '../../components/home/SacredProgressRing';
import { VerseRevelation } from '../../components/home/VerseRevelation';
import { GoldenDivider } from '../../components/home/GoldenDivider';
import { DivineButton } from '../../components/home/DivineButton';
import { OmLoader } from '../../components/home/OmLoader';
import { useDivineEntrance } from '../../hooks/useDivineEntrance';
import { useGoldenPulse } from '../../hooks/useGoldenPulse';

// ---------------------------------------------------------------------------
// Static data (matches web /dashboard)
// ---------------------------------------------------------------------------

/** 5 Sanskrit emotional states — matches the web mood strip. */
const MOOD_OPTIONS = [
  { id: 'shanta', sanskrit: 'शान्त', english: 'Peace', icon: '☮️', score: 2 },
  { id: 'prema', sanskrit: 'प्रेम', english: 'Love', icon: '💛', score: 1 },
  { id: 'bhaya', sanskrit: 'भय', english: 'Fear', icon: '🌘', score: -1 },
  { id: 'krodha', sanskrit: 'क्रोध', english: 'Anger', icon: '🔥', score: -1 },
  { id: 'shoka', sanskrit: 'शोक', english: 'Sorrow', icon: '🌧️', score: -2 },
] as const;

/** Milestone streak counts that trigger a heavy haptic + golden bloom. */
const STREAK_MILESTONES = new Set([7, 21, 108]);

/** Fallback verse shown while the daily verse query is loading or empty. */
const FALLBACK_VERSE = {
  sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।',
  transliteration: 'karmaṇy-evādhikāras te mā phaleṣhu kadāchana',
  english: 'You have the right to perform your duty, but not to the fruits of action.',
  chapter: 2,
  verse: 47,
} as const;

// ---------------------------------------------------------------------------
// Greeting resolver (time-of-day matches the web dashboard exactly)
// ---------------------------------------------------------------------------

interface Greeting {
  readonly title: string;
  readonly sanskrit: string;
}

function resolveGreeting(now: Date = new Date()): Greeting {
  const minutes = now.getHours() * 60 + now.getMinutes();
  // 03:30 – 05:30 → Brahma Muhurta
  if (minutes >= 3 * 60 + 30 && minutes < 5 * 60 + 30) {
    return { title: 'Brahma Muhurta', sanskrit: 'ब्रह्म मुहूर्त' };
  }
  // 05:30 – 12:00 → Namaste (शुभ प्रभात)
  if (minutes >= 5 * 60 + 30 && minutes < 12 * 60) {
    return { title: 'Namaste', sanskrit: 'शुभ प्रभात' };
  }
  // 12:00 – 17:00 → Namaste (शुभ मध्याह्न)
  if (minutes >= 12 * 60 && minutes < 17 * 60) {
    return { title: 'Namaste', sanskrit: 'शुभ मध्याह्न' };
  }
  // 17:00 – 20:00 → Shubh Sandhya
  if (minutes >= 17 * 60 && minutes < 20 * 60) {
    return { title: 'Shubh Sandhya', sanskrit: 'संध्या वंदन' };
  }
  // 20:00 – 03:30 → Shubh Ratri
  return { title: 'Shubh Ratri', sanskrit: 'शुभ रात्रि' };
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function HomeScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const { data: dashboard, refetch, isRefetching } = useJourneyDashboard();
  const { data: streak } = useSadhanaStreak();
  const createMood = useCreateMood();

  const [selectedMoodId, setSelectedMoodId] = useState<string | null>(null);

  const greeting = useMemo(() => resolveGreeting(), []);
  const firstName = user?.name?.split(' ')[0] ?? 'Sakha';

  const currentStreak = streak?.current ?? 0;
  const activeJourney = dashboard?.activeJourneys?.[0];
  const journeyProgress = activeJourney
    ? Math.max(0, Math.min(1, activeJourney.completedSteps / activeJourney.durationDays))
    : 0;

  // Today's practice completion — if there's a streak today, assume 100%,
  // otherwise show the fractional progress from the streak week view.
  const todayRingProgress = useMemo(() => {
    const today = streak?.thisWeek?.at(-1);
    if (today === true) return 1;
    if (!streak) return 0;
    const done = streak.thisWeek?.filter(Boolean).length ?? 0;
    return done / 7;
  }, [streak]);

  const flamePulse = useGoldenPulse({ continuous: true, cycleMs: 2000 });

  const handleMoodSelect = useCallback(
    (option: (typeof MOOD_OPTIONS)[number]) => {
      setSelectedMoodId(option.id);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      createMood.mutate({ score: option.score });
    },
    [createMood],
  );

  const handleSakhaTap = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(tabs)/chat');
  }, [router]);

  const handleJourneyContinue = useCallback(() => {
    if (!activeJourney) {
      router.push('/journey');
      return;
    }
    router.push(`/journey/${activeJourney.id}`);
  }, [activeJourney, router]);

  // Fire milestone haptic when entering a milestone streak.
  React.useEffect(() => {
    if (STREAK_MILESTONES.has(currentStreak)) {
      flamePulse.trigger();
    }
    // trigger is stable via useCallback in the hook
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStreak]);

  // Staggered section entrances.
  const headerEntrance = useDivineEntrance({ index: 0 });
  const verseEntrance = useDivineEntrance({ index: 1 });
  const sakhaEntrance = useDivineEntrance({ index: 2 });
  const streakEntrance = useDivineEntrance({ index: 3 });
  const moodEntrance = useDivineEntrance({ index: 4 });
  const journeyEntrance = useDivineEntrance({ index: 5 });

  return (
    <DivineScreenWrapper>
      <ScrollView
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: 72 + insets.bottom },
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={() => void refetch()}
            tintColor="transparent"
            colors={['transparent']}
            progressBackgroundColor="transparent"
            progressViewOffset={0}
          />
        }
      >
        {isRefetching && <OmLoader active size={36} />}

        {/* ───────────────────────── 1. Header ───────────────────────── */}
        <Animated.View style={[styles.headerRow, headerEntrance]}>
          <View style={styles.headerLeft}>
            <Text style={styles.greetingTitle} numberOfLines={1}>
              {greeting.title}
            </Text>
            <Text style={styles.userName} numberOfLines={1}>
              {firstName}
            </Text>
            <Text style={styles.greetingSanskrit}>{greeting.sanskrit}</Text>
          </View>

          <View style={styles.headerRight}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              style={styles.bellButton}
              onPress={() => router.push('/settings')}
              hitSlop={10}
            >
              <Text style={styles.bellGlyph}>🔔</Text>
            </Pressable>
            {currentStreak > 0 && (
              <Animated.View style={[styles.streakBadge, flamePulse.style]}>
                <Text style={styles.streakFlame}>🔥</Text>
                <Text style={styles.streakCount}>{currentStreak}</Text>
              </Animated.View>
            )}
          </View>
        </Animated.View>

        {/* ─────────────────── 2. Daily Verse Card ─────────────────── */}
        <Animated.View style={[styles.section, verseEntrance]}>
          <SacredCard fullWidth>
            <Text style={styles.eyebrow}>आज का श्लोक</Text>

            <VerseRevelation
              sanskrit={FALLBACK_VERSE.sanskrit}
              delay={300}
              style={styles.verseSanskrit}
            />

            <GoldenDivider />

            <Text style={styles.verseTransliteration}>
              {FALLBACK_VERSE.transliteration}
            </Text>
            <Text style={styles.verseEnglish}>{FALLBACK_VERSE.english}</Text>

            <Text style={styles.verseRef}>
              Bhagavad Gita — Ch. {FALLBACK_VERSE.chapter} · V. {FALLBACK_VERSE.verse}
            </Text>
          </SacredCard>
        </Animated.View>

        {/* ─────────────────── 3. SAKHA Quick-Access ─────────────────── */}
        <Animated.View style={[styles.section, sakhaEntrance]}>
          <SacredCard fullWidth onPress={handleSakhaTap}>
            <View style={styles.sakhaRow}>
              <View style={styles.sakhaAccent} />
              <SakhaMandala size={56} active={false} />
              <View style={styles.sakhaText}>
                <Text style={styles.sectionTitle}>Dialogue with Sakha</Text>
                <Text style={styles.sectionSub}>Your divine companion awaits</Text>
              </View>
            </View>
            <View style={styles.sakhaCta}>
              <DivineButton
                title="Begin Dialogue"
                onPress={handleSakhaTap}
                variant="primary"
              />
            </View>
          </SacredCard>
        </Animated.View>

        {/* ─────────────────── 4. Nitya Sadhana Streak ─────────────────── */}
        <Animated.View style={[styles.section, streakEntrance]}>
          <SacredCard fullWidth>
            <View style={styles.streakCardRow}>
              <Animated.View style={[styles.streakFlameWrap, flamePulse.style]}>
                <Text style={styles.streakLargeFlame}>🔥</Text>
              </Animated.View>

              <View style={styles.streakCenter}>
                <Text style={styles.streakNumber}>{currentStreak}</Text>
                <Text style={styles.streakLabel}>Days of Sacred Practice</Text>
              </View>

              <SacredProgressRing progress={todayRingProgress} size={80}>
                <Text style={styles.ringPct}>
                  {Math.round(todayRingProgress * 100)}%
                </Text>
              </SacredProgressRing>
            </View>
          </SacredCard>
        </Animated.View>

        {/* ─────────────────── 5. Mood Check-In ─────────────────── */}
        <Animated.View style={[styles.section, moodEntrance]}>
          <Text style={styles.moodHeader}>How is your inner state?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.moodRow}
          >
            {MOOD_OPTIONS.map((option) => {
              const isSelected = selectedMoodId === option.id;
              return (
                <SacredCard
                  key={option.id}
                  compact
                  selected={isSelected}
                  onPress={() => handleMoodSelect(option)}
                  accessibilityLabel={`${option.english} (${option.sanskrit})`}
                  style={styles.moodChip}
                >
                  <View style={styles.moodInner}>
                    <Text style={styles.moodIcon}>{option.icon}</Text>
                    <Text style={styles.moodSanskrit}>{option.sanskrit}</Text>
                    <Text style={styles.moodEnglish}>{option.english}</Text>
                    {isSelected && <Text style={styles.moodCheck}>✓</Text>}
                  </View>
                </SacredCard>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* ─────────────────── 6. Current Journey ─────────────────── */}
        <Animated.View style={[styles.section, journeyEntrance]}>
          <SacredCard fullWidth>
            <View style={styles.journeyHeader}>
              <Text style={styles.journeyChakra}>☸️</Text>
              <View style={styles.journeyTitleCol}>
                <Text style={styles.journeyTitle}>
                  {activeJourney?.title ?? 'Begin Your First Journey'}
                </Text>
                {activeJourney ? (
                  <Text style={styles.journeyDay}>
                    Day {activeJourney.currentDay} of {activeJourney.durationDays}
                  </Text>
                ) : (
                  <Text style={styles.journeyDay}>A sacred path awaits</Text>
                )}
              </View>
            </View>

            <JourneyProgressBar progress={journeyProgress} />

            <View style={styles.journeyCta}>
              <DivineButton
                title={activeJourney ? "Continue Today's Practice" : 'Explore Journeys'}
                onPress={handleJourneyContinue}
                variant="secondary"
              />
            </View>
          </SacredCard>
        </Animated.View>
      </ScrollView>
    </DivineScreenWrapper>
  );
}

// ---------------------------------------------------------------------------
// JourneyProgressBar — gold fill that lotus-blooms from 0 on mount (800ms).
// Uses scaleX so we never touch the layout width during animation.
// ---------------------------------------------------------------------------

function JourneyProgressBar({ progress }: { progress: number }): React.JSX.Element {
  const clamped = Math.max(0, Math.min(1, progress));
  const [trackWidth, setTrackWidth] = useState(0);
  const fillWidth = useSharedValue(0);

  React.useEffect(() => {
    fillWidth.value = 0;
    fillWidth.value = withTiming(clamped * trackWidth, {
      duration: 800,
      easing: Easing.out(Easing.cubic),
    });
  }, [clamped, trackWidth, fillWidth]);

  const fillStyle = useAnimatedStyle(() => ({
    width: fillWidth.value,
  }));

  return (
    <View
      style={styles.progressTrack}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.progressFill, fillStyle]} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const TEXT_PRIMARY = colors.text.primary;
const TEXT_SECONDARY = colors.text.secondary;
const TEXT_MUTED = colors.text.muted;
const BRIGHT_GOLD = '#F5E27A';
const GOLD_MID = '#D4A017';
const GOLD_SUB = 'rgba(212, 160, 23, 0.5)';

const baseSanskrit: TextStyle = {
  fontFamily: 'NotoSansDevanagari-Regular',
  color: TEXT_PRIMARY,
};

const baseSerif: TextStyle = {
  fontFamily: 'CormorantGaramond-Italic',
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    gap: 20,
  },

  // -------------------------- header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerLeft: {
    flex: 1,
    paddingRight: 12,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  greetingTitle: {
    ...baseSerif,
    fontSize: 28,
    color: TEXT_PRIMARY,
    lineHeight: 34,
  },
  userName: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 32,
    color: BRIGHT_GOLD,
    lineHeight: 38,
  },
  greetingSanskrit: {
    ...baseSanskrit,
    fontSize: 13,
    color: GOLD_SUB,
    marginTop: 4,
  },
  bellButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.alpha.goldLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background.card,
  },
  bellGlyph: {
    fontSize: 16,
    color: GOLD_MID,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.alpha.goldMedium,
    borderWidth: 1,
    borderColor: colors.alpha.goldStrong,
  },
  streakFlame: { fontSize: 14 },
  streakCount: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 18,
    color: BRIGHT_GOLD,
  },

  // -------------------------- generic section
  section: {
    alignSelf: 'stretch',
  },
  sectionTitle: {
    ...baseSerif,
    fontSize: 20,
    color: TEXT_PRIMARY,
    lineHeight: 26,
  },
  sectionSub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: TEXT_MUTED,
    marginTop: 2,
  },

  // -------------------------- daily verse
  eyebrow: {
    fontFamily: 'Outfit-Medium',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: TEXT_MUTED,
    marginBottom: 10,
  },
  verseSanskrit: {
    marginBottom: 4,
  },
  verseTransliteration: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    color: TEXT_SECONDARY,
    lineHeight: 22,
  },
  verseEnglish: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: TEXT_PRIMARY,
    lineHeight: 14 * 1.7,
    marginTop: 8,
  },
  verseRef: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    textAlign: 'right',
    marginTop: 14,
  },

  // -------------------------- sakha card
  sakhaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sakhaAccent: {
    position: 'absolute',
    left: -20,
    top: -20,
    bottom: -20,
    width: 2,
    backgroundColor: GOLD_MID,
    opacity: 0.7,
  },
  sakhaText: {
    flex: 1,
  },
  sakhaCta: {
    marginTop: 14,
  },

  // -------------------------- streak card
  streakCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  streakFlameWrap: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.alpha.goldLight,
  },
  streakLargeFlame: {
    fontSize: 28,
  },
  streakCenter: {
    flex: 1,
    alignItems: 'flex-start',
  },
  streakNumber: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 42,
    color: GOLD_MID,
    lineHeight: 46,
  },
  streakLabel: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  ringPct: {
    fontFamily: 'Outfit-Medium',
    fontSize: 13,
    color: GOLD_MID,
  },

  // -------------------------- mood strip
  moodHeader: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 16,
    color: TEXT_PRIMARY,
    marginBottom: 10,
  },
  moodRow: {
    gap: 10,
    paddingRight: 20,
  },
  moodChip: {
    minWidth: 76,
  },
  moodInner: {
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  moodIcon: {
    fontSize: 20,
  },
  moodSanskrit: {
    ...baseSanskrit,
    fontFamily: 'NotoSansDevanagari-Bold',
    fontSize: 13,
    color: GOLD_MID,
  },
  moodEnglish: {
    fontFamily: 'Outfit-Regular',
    fontSize: 10,
    color: TEXT_MUTED,
  },
  moodCheck: {
    position: 'absolute',
    top: -4,
    right: -4,
    color: GOLD_MID,
    fontSize: 14,
    fontWeight: '700',
  },

  // -------------------------- journey card
  journeyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  journeyChakra: {
    fontSize: 28,
  },
  journeyTitleCol: {
    flex: 1,
  },
  journeyTitle: {
    ...baseSerif,
    fontSize: 18,
    color: TEXT_PRIMARY,
  },
  journeyDay: {
    fontFamily: 'Outfit-Medium',
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(212, 160, 23, 0.1)',
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD_MID,
  },
  journeyCta: {
    marginTop: 14,
  },
});
