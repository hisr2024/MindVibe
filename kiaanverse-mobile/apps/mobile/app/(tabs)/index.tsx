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
import * as Haptics from 'expo-haptics';
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';

// @kiaanverse/ui — read packages/ui/src/index.ts first, use only what exists.
import {
  Screen,
  GoldenDivider,
  // The following are consumed by zones 3–6 (wired in Parts 3.3–3.6):
  // OmLoader, SacredCard, GlowCard, ShlokaCard, SacredProgressRing, DivineButton,
} from '@kiaanverse/ui';

// @kiaanverse/store
import { useAuthStore } from '@kiaanverse/store';

// @kiaanverse/api — streak comes from the API (SadhanaStreak.current), not from
// the Zustand sadhanaStore (which only holds the in-flight ritual phase).
import { useSadhanaStreak } from '@kiaanverse/api';

// ── Design tokens ──────────────────────────────────────────────────────────
const GOLD = '#D4A017';
const COSMIC = '#050714';
const INDIGO = '#161A42';
const WHITE = '#F0EBE1';

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
        {/* ZONE 2 — Greeting Hero (Part 3.2) */}
        {/* TODO: <GreetingHero /> */}

        {/* ZONE 3 — Daily Verse Card (Part 3.3) */}
        {/* TODO: <DailyVerseCard /> */}

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
