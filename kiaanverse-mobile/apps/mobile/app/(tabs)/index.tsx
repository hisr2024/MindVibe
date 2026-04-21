/**
 * Home Tab — The Sacred Court
 *
 * Six-zone cinematic home screen composed on top of the Divine design system.
 * Every element is alive — the OM breathes, the avatar aura pulses, the verse
 * reveals word by word, the streak flame flickers — but all animation runs on
 * the UI thread via Reanimated worklets so the JS thread stays free for user
 * interaction.
 *
 *   ZONE 1  Divine Header (this file)        ┐
 *   ZONE 2  Time-based Greeting Hero         │  staggered entrance
 *   ZONE 3  Daily Verse Card                 │  120ms between each
 *   ZONE 4  Tools Quick Rail                 │  zone, lotus-bloom
 *   ZONE 5  Sadhana Streak + Progress Ring   │  easing, NATURAL
 *   ZONE 6  KIAAN Vibe Mini Banner           ┘  duration (320ms)
 *
 * Particle field + aurora are rendered by DivineScreenWrapper at the
 * navigator level — every zone floats over the cosmic void.
 */

import React, { useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// @kiaanverse/ui — read packages/ui/src/index.ts first, use only what exists.
import {
  Screen,
  GoldenDivider,
  OmLoader,
  VerseRevelation,
  // The following are consumed by zones 4–6 (wired in Parts 3.4–3.6):
  // SacredCard, GlowCard, ShlokaCard, SacredProgressRing, DivineButton,
} from '@kiaanverse/ui';

// @kiaanverse/store
import { useAuthStore, useGitaStore } from '@kiaanverse/store';

// @kiaanverse/api — streak comes from the API (SadhanaStreak.current), not from
// the Zustand sadhanaStore (which only holds the in-flight ritual phase). The
// verse-of-the-day is resolved by useGitaStore + useGitaVerse(chapter, verse).
import { useGitaVerse, useSadhanaStreak } from '@kiaanverse/api';

// ── Design tokens ──────────────────────────────────────────────────────────
const GOLD = '#D4A017';
const GOLD_SHIMMER = 'rgba(245, 226, 122, 0.35)';
/** Gold at ~50% alpha — used for the Sanskrit sub-greeting. */
const GOLD_MUTED = '#D4A01780';
const COSMIC = '#050714';
const INDIGO = '#161A42';
const WHITE = '#F0EBE1';
const SECONDARY = '#C8BFA8';
const MUTED = '#7A7060';

/** Staggered zone entrance delays (ms) — spec §animation. */
const ZONE_DELAY = {
  greeting: 120,
  verse: 240,
  tools: 360,
  sadhana: 480,
  vibe: 560,
} as const;

/** ease-divine-in — soft start, confident finish. */
const easeDivineIn = Easing.bezier(0.0, 0.8, 0.2, 1.0);

// ── Time-based greeting helper ─────────────────────────────────────────────
/**
 * Resolve the muhurta-appropriate greeting.
 *
 * Windows (local time):
 *   03:30–05:30  Brahma Muhurta  · ब्रह्म मुहूर्त
 *   05:30–12:00  Namaste         · शुभ प्रभात
 *   12:00–17:00  Namaste         · शुभ मध्याह्न
 *   17:00–20:00  Shubh Sandhya   · शुभ संध्या
 *   20:00–03:30  Shubh Ratri     · शुभ रात्रि
 */
function getGreeting(): { readonly line1: string; readonly skt: string } {
  const now = new Date();
  const h = now.getHours() + now.getMinutes() / 60;
  if (h >= 3.5 && h < 5.5) {
    return { line1: 'Brahma Muhurta', skt: 'ब्रह्म मुहूर्त' };
  }
  if (h >= 5.5 && h < 12) {
    return { line1: 'Namaste', skt: 'शुभ प्रभात' };
  }
  if (h >= 12 && h < 17) {
    return { line1: 'Namaste', skt: 'शुभ मध्याह्न' };
  }
  if (h >= 17 && h < 20) {
    return { line1: 'Shubh Sandhya', skt: 'शुभ संध्या' };
  }
  return { line1: 'Shubh Ratri', skt: 'शुभ रात्रि' };
}

// ── OM Breathing — scale 1.0 → 1.06 → 1.0, opacity 0.6 → 1.0, 4s cycle ────
function OmBreath(): React.JSX.Element {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.7);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.06, {
          duration: 2000,
          easing: Easing.bezier(0.45, 0.05, 0.55, 0.95),
        }),
        withTiming(1.0, {
          duration: 2000,
          easing: Easing.bezier(0.45, 0.05, 0.55, 0.95),
        }),
      ),
      -1,
      false,
    );
    opacity.value = withRepeat(
      withSequence(
        withTiming(1.0, { duration: 2000 }),
        withTiming(0.6, { duration: 2000 }),
      ),
      -1,
      false,
    );
  }, [opacity, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View style={animStyle}>
      <Text style={s.omSymbol}>ॐ</Text>
    </Reanimated.View>
  );
}

// ── Avatar with divine-breath aura + streak flame badge ───────────────────
function UserAvatar({
  initial,
  streak,
}: {
  readonly initial: string;
  readonly streak: number;
}): React.JSX.Element {
  const auraScale = useSharedValue(1);
  const auraOpacity = useSharedValue(0.3);

  React.useEffect(() => {
    auraScale.value = withRepeat(
      withSequence(
        withTiming(1.12, {
          duration: 2000,
          easing: Easing.bezier(0.45, 0.05, 0.55, 0.95),
        }),
        withTiming(1.0, {
          duration: 2000,
          easing: Easing.bezier(0.45, 0.05, 0.55, 0.95),
        }),
      ),
      -1,
      false,
    );
    auraOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2000 }),
        withTiming(0.2, { duration: 2000 }),
      ),
      -1,
      false,
    );
  }, [auraOpacity, auraScale]);

  const auraStyle = useAnimatedStyle(() => ({
    transform: [{ scale: auraScale.value }],
    opacity: auraOpacity.value,
  }));

  return (
    <View style={s.avatarContainer}>
      {/* Gold breathing aura behind avatar */}
      <Reanimated.View style={[s.avatarAura, auraStyle]} pointerEvents="none" />
      {/* Avatar circle */}
      <View style={s.avatar}>
        <Text style={s.avatarInitial}>{initial}</Text>
      </View>
      {/* Streak flame badge — only when streak is active */}
      {streak > 0 ? (
        <View style={s.streakBadge}>
          <Text style={s.streakBadgeText}>🔥</Text>
        </View>
      ) : null}
    </View>
  );
}

// ── ZONE 1: DIVINE HEADER ─────────────────────────────────────────────────
function DivineHeader(): React.JSX.Element {
  const user = useAuthStore((st) => st.user);
  const { data: streakData } = useSadhanaStreak();
  const streak = streakData?.current ?? 0;
  const initial = (user?.name ?? 'S').charAt(0).toUpperCase();
  const insets = useSafeAreaInsets();

  const openProfile = (): void => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    router.push('/(tabs)/profile');
  };

  return (
    <View style={[s.header, { paddingTop: insets.top + 8 }]}>
      <View style={s.headerRow}>
        {/* Left: OM breathing */}
        <OmBreath />

        {/* Center: Wordmark — Sanskrit OM glyph + Cormorant italic wordmark */}
        <View style={s.wordmark} pointerEvents="none">
          <Text style={s.wordmarkText} numberOfLines={1}>
            <Text style={s.wordmarkOm}>ॐ </Text>
            Kiaanverse
          </Text>
        </View>

        {/* Right: Avatar with streak badge */}
        <TouchableOpacity
          onPress={openProfile}
          accessibilityRole="button"
          accessibilityLabel="Open profile"
          hitSlop={8}
        >
          <UserAvatar initial={initial} streak={streak} />
        </TouchableOpacity>
      </View>

      {/* Gold gradient divider — sits directly below the header row */}
      <GoldenDivider />
    </View>
  );
}

// ── Gold shimmer sweep — sweeps once on mount, then every 8 seconds ───────
function GoldShimmer({
  children,
}: {
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const translateX = useSharedValue(-200);

  React.useEffect(() => {
    const sweep = (): void => {
      translateX.value = -200;
      translateX.value = withTiming(400, {
        duration: 1200,
        easing: Easing.bezier(0.25, 0.1, 0.0, 1.0),
      });
    };
    sweep();
    const interval = setInterval(sweep, 8000);
    return () => clearInterval(interval);
  }, [translateX]);

  const shimmerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View style={s.shimmerClip}>
      {children}
      {/* Shimmer overlay — 120px wide gradient sweeping across the text. */}
      <Reanimated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, shimmerStyle]}
      >
        <LinearGradient
          colors={['transparent', GOLD_SHIMMER, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={s.shimmerGradient}
        />
      </Reanimated.View>
    </View>
  );
}

// ── ZONE 2: Greeting Hero ─────────────────────────────────────────────────
function GreetingHero(): React.JSX.Element {
  const user = useAuthStore((st) => st.user);
  const { line1, skt } = getGreeting();

  // Staggered entrance — Zone 2 enters 120ms after Zone 1.
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  React.useEffect(() => {
    opacity.value = withDelay(
      ZONE_DELAY.greeting,
      withTiming(1, { duration: 500, easing: easeDivineIn }),
    );
    translateY.value = withDelay(
      ZONE_DELAY.greeting,
      withTiming(0, { duration: 500, easing: easeDivineIn }),
    );
  }, [opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Reanimated.View style={[s.greetingZone, animStyle]}>
      {/* Line 1: Muhurta greeting */}
      <Text style={s.greetingLine1}>{line1}</Text>

      {/* Line 2: User name with sweeping gold shimmer */}
      <GoldShimmer>
        <Text style={s.greetingName}>
          {user?.name ?? 'Sacred Seeker'}
        </Text>
      </GoldShimmer>

      {/* Line 3: Sanskrit translation at 50% gold */}
      <Text style={s.greetingSkt}>{skt}</Text>
    </Reanimated.View>
  );
}

// ── ZONE 3: Daily Verse Card ──────────────────────────────────────────────
/** Fallback verse while the gitaStore finishes hydrating (BG 2.47). */
const FALLBACK_VOD = { chapter: 2, verse: 47 } as const;

function DailyVerseCard(): React.JSX.Element {
  // Verse-of-the-day reference lives in the persisted gitaStore. Derive the
  // chapter/verse eagerly with a fallback so the API hook always has real
  // inputs — avoids a conditional-hook trap on first launch.
  const vodChapter = useGitaStore((st) => st.vodChapter);
  const vodVerse = useGitaStore((st) => st.vodVerse);
  const refreshVerseOfTheDay = useGitaStore((st) => st.refreshVerseOfTheDay);
  const bookmarkedVerseIds = useGitaStore((st) => st.bookmarkedVerseIds);
  const toggleBookmark = useGitaStore((st) => st.toggleBookmark);

  React.useEffect(() => {
    // Idempotent — no-op if vodDate matches today. Safe to call on every mount.
    refreshVerseOfTheDay();
  }, [refreshVerseOfTheDay]);

  const chapter = vodChapter ?? FALLBACK_VOD.chapter;
  const verseNum = vodVerse ?? FALLBACK_VOD.verse;
  const { data: verse, isLoading } = useGitaVerse(chapter, verseNum);

  const isBookmarked = verse ? bookmarkedVerseIds.includes(verse.id) : false;

  // Zone 3 entrance — 240ms stagger after Zone 1.
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);

  React.useEffect(() => {
    opacity.value = withDelay(
      ZONE_DELAY.verse,
      withTiming(1, { duration: 500, easing: easeDivineIn }),
    );
    translateY.value = withDelay(
      ZONE_DELAY.verse,
      withTiming(0, { duration: 500, easing: easeDivineIn }),
    );
  }, [opacity, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const askSakha = (): void => {
    if (!verse) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    router.push({
      pathname: '/(tabs)/chat',
      params: {
        preload: `Tell me more about Bhagavad Gita ${verse.chapter}.${verse.verse}`,
      },
    });
  };

  const bookmark = (): void => {
    if (!verse) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    toggleBookmark(verse.id);
  };

  return (
    <Reanimated.View style={[s.verseCardWrapper, animStyle]}>
      {/* 2px gold shimmer top edge — transparent → gold → transparent. */}
      <LinearGradient
        colors={[
          'transparent',
          'rgba(212,160,23,0.4)',
          'rgba(240,192,64,0.8)',
          'rgba(212,160,23,0.4)',
          'transparent',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.verseCardTopBar}
      />

      <View style={s.verseCardBody}>
        {/* Label — "Today's Shloka" in Devanagari */}
        <Text style={s.verseLabel}>आज का श्लोक</Text>

        {isLoading || !verse ? (
          <View style={s.verseLoader}>
            <OmLoader size={36} />
          </View>
        ) : (
          <>
            {/* Sanskrit — word-by-word reveal on the UI thread via
                VerseRevelation (shared package primitive). 80ms stagger,
                300ms delay before the first word lifts in. */}
            <VerseRevelation
              text={verse.sanskrit}
              textStyle={s.verseSanskrit}
              containerStyle={s.verseSanskritFlow}
              delay={300}
              staggerMs={80}
            />

            {/* Gold divider with centered lotus mark ✦ */}
            <View style={s.verseDividerRow}>
              <View style={s.verseDividerLine} />
              <Text style={s.verseDividerLotus}>✦</Text>
              <View style={s.verseDividerLine} />
            </View>

            <Text style={s.verseTranslit}>{verse.transliteration}</Text>
            <Text style={s.verseMeaning}>{verse.translation}</Text>
            <Text style={s.verseRef}>
              {`Bhagavad Gita — Ch. ${verse.chapter} · V. ${verse.verse}`}
            </Text>

            <View style={s.verseActions}>
              <TouchableOpacity
                style={s.verseAskBtn}
                onPress={askSakha}
                accessibilityRole="button"
                accessibilityLabel="Ask Sakha about this verse"
              >
                <Text style={s.verseAskBtnText}>Ask Sakha →</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={s.verseBookmarkBtn}
                onPress={bookmark}
                accessibilityRole="button"
                accessibilityLabel={
                  isBookmarked ? 'Remove bookmark' : 'Bookmark this verse'
                }
                accessibilityState={{ selected: isBookmarked }}
              >
                <Text style={s.verseBookmarkIcon}>
                  {isBookmarked ? '🔖' : '🏷️'}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Reanimated.View>
  );
}

// ── MAIN SCREEN ───────────────────────────────────────────────────────────
export default function HomeScreen(): React.JSX.Element {
  const scrollRef = useRef<ScrollView>(null);

  return (
    <Screen>
      {/* ZONE 1: Header — fixed, outside the scroll view. */}
      <DivineHeader />

      {/* Scrollable content — Zones 2–6 fill in Parts 3.2–3.6 */}
      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* ZONE 2 — Greeting Hero */}
        <GreetingHero />

        {/* ZONE 3 — Daily Verse Card */}
        <DailyVerseCard />

        {/* ZONE 4 — Tools Quick Rail (Part 3.4) */}
        {/* TODO: <ToolsRail /> */}

        {/* ZONE 5 — Sadhana Streak (Part 3.5) */}
        {/* TODO: <SadhanaStreakCard /> */}

        {/* ZONE 6 — KIAAN Vibe Banner (Part 3.6) */}
        {/* TODO: <KiaanVibeBanner /> */}

        {/* Bottom padding above the tab bar */}
        <View style={s.bottomSpacer} />
      </ScrollView>
    </Screen>
  );
}

// ── STYLES ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  // Header
  header: {
    paddingHorizontal: 20,
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  omSymbol: {
    fontFamily: 'NotoSansDevanagari-Bold',
    fontSize: 18,
    color: GOLD,
    lineHeight: 28,
  },
  wordmark: {
    flex: 1,
    alignItems: 'center',
  },
  wordmarkText: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 20,
    color: WHITE,
    // 0.08em at 20px = 1.6pt
    letterSpacing: 1.6,
  },
  wordmarkOm: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 20,
    color: WHITE,
  },

  // Avatar
  avatarContainer: {
    position: 'relative',
    width: 44,
    height: 44,
  },
  avatarAura: {
    position: 'absolute',
    top: -6,
    left: -6,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: GOLD,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: INDIGO,
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 18,
    color: GOLD,
  },
  streakBadge: {
    position: 'absolute',
    bottom: -2,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COSMIC,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: GOLD,
  },
  streakBadgeText: {
    fontSize: 10,
  },

  // Zone 2 — Greeting Hero
  greetingZone: {
    marginTop: 16,
    marginBottom: 20,
    // Left-aligned, paddingH matches the 20 in the spec (ScrollView content
    // is 16; the extra 4 aligns the left edge with the header OM glyph).
    paddingHorizontal: 4,
  },
  greetingLine1: {
    fontFamily: 'CormorantGaramond-Italic',
    fontSize: 34,
    color: WHITE,
    lineHeight: 40,
  },
  greetingName: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 34,
    color: GOLD,
    lineHeight: 40,
  },
  greetingSkt: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 13,
    color: GOLD_MUTED,
    // Devanagari glyphs need ~2x line-height for clean matra rendering.
    lineHeight: 26,
    marginTop: 4,
  },

  // Shimmer overlay for the user name
  shimmerClip: {
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  shimmerGradient: {
    flex: 1,
    width: 120,
  },

  // Zone 3 — Daily Verse Card
  verseCardWrapper: {
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(22,26,66,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.12)',
  },
  verseCardTopBar: {
    height: 2,
  },
  verseCardBody: {
    padding: 16,
  },
  verseLabel: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 10,
    color: MUTED,
    // 0.15em at 10px = 1.5pt
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  verseSanskritFlow: {
    marginBottom: 4,
  },
  verseSanskrit: {
    fontFamily: 'NotoSansDevanagari-Bold',
    fontSize: 16,
    color: GOLD,
    // Devanagari needs 2.0x line-height for matra clearance.
    lineHeight: 32,
    fontWeight: '700',
  },
  verseDividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    gap: 8,
  },
  verseDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(212,160,23,0.3)',
  },
  verseDividerLotus: {
    fontSize: 10,
    color: GOLD,
  },
  verseTranslit: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    color: SECONDARY,
    // 1.8x line-height keeps the italic IAST breathing room.
    lineHeight: 25,
    marginBottom: 6,
  },
  verseMeaning: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    color: WHITE,
    lineHeight: 24,
    marginBottom: 8,
  },
  verseRef: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: MUTED,
    textAlign: 'right',
    marginBottom: 12,
  },
  verseActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verseAskBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
  },
  verseAskBtnText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 13,
    color: GOLD,
  },
  verseBookmarkBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verseBookmarkIcon: {
    fontSize: 18,
  },
  verseLoader: {
    paddingVertical: 24,
    alignItems: 'center',
  },

  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  bottomSpacer: {
    height: 100,
  },
});
