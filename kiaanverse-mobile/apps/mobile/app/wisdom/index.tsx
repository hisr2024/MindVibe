/**
 * Wisdom Landing — Native parity twin of kiaanverse.com/m/wisdom.
 *
 * Six composed sections, top to bottom:
 *
 *   1. Header           Large "Wisdom" title + bell (notifications).
 *   2. Today's Wisdom   Verse-of-the-day card (Sanskrit + translation +
 *                       commentary) with Heart / Copy / Share / Read More.
 *   3. Explore by Theme 6-tile 2-column grid of curated wisdom themes.
 *   4. Ask KIAAN        Single CTA → opens the Sakha chat with the verse
 *                       pre-loaded as conversational context.
 *   5. Wisdom Chat Rooms Single CTA → opens /wisdom-rooms.
 *   6. Explore the Gita Single CTA → opens /(tabs)/shlokas/gita.
 *
 * Data
 *   The verse-of-the-day is selected by gitaStore.refreshVerseOfTheDay()
 *   (deterministic per calendar day, persisted across launches). The full
 *   verse text comes from the bundled Gita corpus via useGitaVerse(), so
 *   the screen works offline and renders the real Sanskrit / IAST / English.
 *
 * Read More
 *   Pushes /wisdom/verse/[chapter]/[verse] — a dedicated reader with the
 *   listening voice picker + Listen button (TTS via expo-speech).
 */

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  BookOpen,
  Check,
  ChevronRight,
  Copy,
  Heart,
  Share2,
  Sparkles,
  Star,
  Users,
} from 'lucide-react-native';

import { DivineScreenWrapper, OmLoader } from '@kiaanverse/ui';
import { useGitaVerse } from '@kiaanverse/api';
import { useGitaStore } from '@kiaanverse/store';

/**
 * Optional clipboard support — `expo-clipboard` may not be linked in every
 * Expo build. Load it lazily and fall back to a silent no-op so the Copy
 * button never crashes when the module is missing.
 */
type ClipboardLike = { setStringAsync(text: string): Promise<void> };
let Clipboard: ClipboardLike | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires, global-require
  Clipboard = require('expo-clipboard') as ClipboardLike;
} catch {
  Clipboard = null;
}

// ── Design tokens (kept local to mirror the web Wisdom page exactly) ──────
const GOLD = '#D4A017';
const GOLD_BRIGHT = '#E8B54A';
const GOLD_SOFT = 'rgba(212,160,23,0.15)';
const GOLD_BORDER = 'rgba(212,160,23,0.20)';
const GOLD_TINT = 'rgba(212,160,23,0.10)';
const TEXT_PRIMARY = '#F5F0E8';
const TEXT_SECONDARY = '#C8BFA8';
const TEXT_MUTED = '#7A7060';
const SURFACE_DIM = 'rgba(255,255,255,0.06)';
const SURFACE_VOID = 'rgba(255,255,255,0.02)';
const SURFACE_BORDER = 'rgba(255,255,255,0.06)';

// Web parity fallback verse — matches FALLBACK_VERSE in
// app/(mobile)/m/wisdom/page.tsx so the screen never renders empty during
// the brief moment between mount and gitaStore hydration.
const FALLBACK = {
  chapter: 4,
  verse: 7,
  sanskrit:
    'यदा यदा हि धर्मस्य ग्लानिर्भवति भारत। अभ्युत्थानमधर्मस्य तदात्मानं सृजाम्यहम्॥',
  translation:
    'When injustice rises, so does the force that corrects it. Be part of that force.',
  commentary:
    'Whenever there is a decline of Dharma, O Arjuna, and an uprising of Adharma, then I incarnate myself. Let this courage live in you today.',
} as const;

// ── Wisdom themes (mirrors WISDOM_THEMES on the web) ──────────────────────
interface ThemeTile {
  readonly id: string;
  readonly label: string;
  readonly emoji: string;
  /** From / to colours for the linear background gradient. */
  readonly gradient: readonly string[];
  readonly border: string;
}

const WISDOM_THEMES: readonly ThemeTile[] = [
  {
    id: 'peace',
    label: 'Inner Peace',
    emoji: '🕊️',
    gradient: ['rgba(20,184,166,0.18)', 'rgba(8,145,178,0.18)'],
    border: 'rgba(20,184,166,0.28)',
  },
  {
    id: 'courage',
    label: 'Courage',
    emoji: '🦁',
    gradient: ['rgba(212,164,76,0.18)', 'rgba(239,68,68,0.18)'],
    border: 'rgba(212,164,76,0.28)',
  },
  {
    id: 'wisdom',
    label: 'Wisdom',
    emoji: '🧘',
    gradient: ['rgba(168,85,247,0.18)', 'rgba(99,102,241,0.18)'],
    border: 'rgba(168,85,247,0.28)',
  },
  {
    id: 'devotion',
    label: 'Devotion',
    emoji: '🙏',
    gradient: ['rgba(236,72,153,0.18)', 'rgba(244,63,94,0.18)'],
    border: 'rgba(236,72,153,0.28)',
  },
  {
    id: 'action',
    label: 'Right Action',
    emoji: '⚡',
    gradient: ['rgba(212,164,76,0.18)', 'rgba(234,179,8,0.18)'],
    border: 'rgba(212,164,76,0.28)',
  },
  {
    id: 'detachment',
    label: 'Letting Go',
    emoji: '🍃',
    gradient: ['rgba(34,197,94,0.18)', 'rgba(16,185,129,0.18)'],
    border: 'rgba(34,197,94,0.28)',
  },
];

export default function WisdomLandingScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // ── Verse-of-the-day from the persisted gitaStore. ──────────────────────
  const vodChapter = useGitaStore((s) => s.vodChapter);
  const vodVerse = useGitaStore((s) => s.vodVerse);
  const refreshVerseOfTheDay = useGitaStore((s) => s.refreshVerseOfTheDay);
  const bookmarkedVerseIds = useGitaStore((s) => s.bookmarkedVerseIds);
  const toggleBookmark = useGitaStore((s) => s.toggleBookmark);

  useEffect(() => {
    // Idempotent — no-op if vodDate matches today.
    refreshVerseOfTheDay();
  }, [refreshVerseOfTheDay]);

  const chapter = vodChapter ?? FALLBACK.chapter;
  const verseNum = vodVerse ?? FALLBACK.verse;
  const { data: verse, isLoading } = useGitaVerse(chapter, verseNum);

  const sanskrit = verse?.sanskrit ?? FALLBACK.sanskrit;
  const translation = verse?.translation ?? FALLBACK.translation;
  // The local corpus does not ship per-verse commentary; show the
  // translation in both slots when no commentary is available, matching the
  // web page's fallback when the API omits the `commentary` field.
  const commentary = verse?.translation ?? FALLBACK.commentary;
  const verseId = verse?.id ?? `${chapter}.${verseNum}`;
  const isFavorited = bookmarkedVerseIds.includes(verseId);

  // ── Local UI state ──────────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleFavorite = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    toggleBookmark(verseId);
  }, [toggleBookmark, verseId]);

  const handleCopy = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    const text = `"${translation}"\n\n— Bhagavad Gita ${chapter}.${verseNum}`;
    if (Clipboard) {
      await Clipboard.setStringAsync(text).catch(() => undefined);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [chapter, translation, verseNum]);

  const handleShare = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    const message = [
      sanskrit,
      '',
      `"${translation}"`,
      '',
      `— Bhagavad Gita ${chapter}.${verseNum}`,
      '— Shared from Kiaanverse',
    ].join('\n');
    try {
      await Share.share({ message, title: 'Today’s Wisdom' });
    } catch {
      // User cancelled or share sheet failed.
    }
  }, [chapter, sanskrit, translation, verseNum]);

  const handleReadMore = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    router.push(`/wisdom/verse/${chapter}/${verseNum}` as never);
  }, [chapter, router, verseNum]);

  const handleThemePress = useCallback(
    (themeId: string) => {
      void Haptics.selectionAsync().catch(() => undefined);
      // Themes don't yet have dedicated curated lists — surface a polite
      // teaser and route into the chapter browser so the journey continues.
      Alert.alert(
        'Coming soon',
        `Curated ${themeId.replace(/^./, (c) => c.toUpperCase())} verses will arrive in the next release. Opening the Bhagavad Gita browser instead.`,
        [
          {
            text: 'Continue',
            onPress: () => router.push('/(tabs)/shlokas/gita' as never),
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
    },
    [router],
  );

  const handleAskKiaan = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    router.push({
      pathname: '/(tabs)/chat',
      params: {
        preload: `Tell me more about Bhagavad Gita ${chapter}.${verseNum}`,
        context: [
          `Please explain Bhagavad Gita ${chapter}.${verseNum}:`,
          '',
          sanskrit,
          '',
          translation,
        ].join('\n'),
        verseId: `${chapter}.${verseNum}`,
      },
    });
  }, [chapter, sanskrit, translation, verseNum, router]);

  const handleOpenRooms = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    router.push('/wisdom-rooms' as never);
  }, [router]);

  const handleExploreGita = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    router.push('/(tabs)/shlokas/gita' as never);
  }, [router]);

  const handleNotifications = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    router.push('/(app)/notifications' as never);
  }, [router]);

  return (
    <DivineScreenWrapper safeArea={false}>
      {/* ── Header — large "Wisdom" title + bell ─────────────────────── */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 8 },
        ]}
      >
        <Pressable
          onPress={handleNotifications}
          accessibilityRole="button"
          accessibilityLabel="Open notifications"
          hitSlop={12}
          style={styles.bellButton}
        >
          <Bell size={22} color={TEXT_PRIMARY} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Large title (drawn into the scroll so it scrolls away gracefully). */}
        <Text style={styles.title} accessibilityRole="header">
          Wisdom
        </Text>

        {/* ── 1. Today's Wisdom card ─────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(420)}
          style={styles.todayCard}
        >
          <LinearGradient
            colors={[
              'rgba(212,164,76,0.10)',
              'rgba(212,164,76,0.05)',
              'rgba(20,184,166,0.10)',
            ]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Header row */}
          <View style={styles.todayHeader}>
            <View style={styles.todayLabelRow}>
              <Star size={14} color={GOLD} />
              <Text style={styles.todayLabel}>TODAY&apos;S WISDOM</Text>
            </View>
            <Text style={styles.todayRef}>
              {`Chapter ${chapter}, Verse ${verseNum}`}
            </Text>
          </View>

          {isLoading && !verse ? (
            <View style={styles.loaderRow}>
              <OmLoader size={48} />
            </View>
          ) : (
            <>
              {/* Sanskrit verse */}
              {sanskrit ? (
                <Text
                  style={styles.sanskrit}
                  accessibilityLanguage="sa"
                  allowFontScaling
                >
                  {sanskrit}
                </Text>
              ) : null}

              {/* Translation in quotes */}
              <Text style={styles.translation}>
                {`“${translation}”`}
              </Text>

              {/* Commentary */}
              <Text style={styles.commentary}>{commentary}</Text>

              {/* Action row */}
              <View style={styles.actionRow}>
                <ActionButton
                  onPress={handleFavorite}
                  active={isFavorited}
                  activeBg="rgba(236,72,153,0.20)"
                  accessibilityLabel={
                    isFavorited ? 'Remove from favorites' : 'Add to favorites'
                  }
                >
                  <Heart
                    size={16}
                    color={isFavorited ? '#F472B6' : TEXT_SECONDARY}
                    fill={isFavorited ? '#F472B6' : 'transparent'}
                  />
                </ActionButton>

                <ActionButton
                  onPress={handleCopy}
                  accessibilityLabel="Copy verse"
                >
                  {copied ? (
                    <Check size={16} color="#34D399" />
                  ) : (
                    <Copy size={16} color={TEXT_SECONDARY} />
                  )}
                </ActionButton>

                <ActionButton
                  onPress={handleShare}
                  accessibilityLabel="Share verse"
                >
                  <Share2 size={16} color={TEXT_SECONDARY} />
                </ActionButton>

                <View style={{ flex: 1 }} />

                <Pressable
                  onPress={handleReadMore}
                  style={styles.readMoreBtn}
                  accessibilityRole="button"
                  accessibilityLabel="Open the full verse reader"
                >
                  <BookOpen size={14} color={GOLD} />
                  <Text style={styles.readMoreText}>Read More</Text>
                </Pressable>
              </View>
            </>
          )}
        </Animated.View>

        {/* ── 2. Explore by Theme ─────────────────────────────────────── */}
        <Animated.View entering={FadeIn.delay(120).duration(380)}>
          <Text style={styles.sectionLabel}>Explore by Theme</Text>
          <View style={styles.themeGrid}>
            {WISDOM_THEMES.map((theme, idx) => (
              <Animated.View
                key={theme.id}
                entering={FadeInDown.delay(180 + idx * 40).duration(360)}
                style={styles.themeCell}
              >
                <Pressable
                  onPress={() => handleThemePress(theme.id)}
                  style={({ pressed }) => [
                    styles.themeTile,
                    { borderColor: theme.border },
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${theme.label} verses`}
                >
                  <LinearGradient
                    colors={[...theme.gradient]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  <Text style={styles.themeEmoji}>{theme.emoji}</Text>
                  <Text style={styles.themeLabel}>{theme.label}</Text>
                </Pressable>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ── 3. Ask KIAAN ────────────────────────────────────────────── */}
        <Animated.View entering={FadeIn.delay(280).duration(380)}>
          <CtaRow
            onPress={handleAskKiaan}
            iconBg="rgba(168,85,247,0.20)"
            iconBorder="rgba(168,85,247,0.28)"
            tint="rgba(168,85,247,0.10)"
            border="rgba(168,85,247,0.28)"
            icon={<Sparkles size={20} color="#C084FC" />}
            title="Ask KIAAN"
            subtitle="Get personalized wisdom for your situation"
          />
        </Animated.View>

        {/* ── 4. Wisdom Chat Rooms ────────────────────────────────────── */}
        <Animated.View entering={FadeIn.delay(340).duration(380)}>
          <CtaRow
            onPress={handleOpenRooms}
            iconBg="rgba(212,164,76,0.20)"
            iconBorder="rgba(212,164,76,0.32)"
            tint="rgba(212,164,76,0.10)"
            border="rgba(212,164,76,0.28)"
            icon={<Users size={20} color={GOLD} />}
            title="Wisdom Chat Rooms"
            subtitle="Join live community conversations"
          />
        </Animated.View>

        {/* ── 5. Explore the Bhagavad Gita ────────────────────────────── */}
        <Animated.View entering={FadeIn.delay(400).duration(380)}>
          <CtaRow
            onPress={handleExploreGita}
            iconBg="rgba(20,184,166,0.20)"
            iconBorder="rgba(20,184,166,0.32)"
            tint={SURFACE_VOID}
            border={SURFACE_BORDER}
            icon={<BookOpen size={20} color="#2DD4BF" />}
            title="Explore the Bhagavad Gita"
            subtitle="700+ verses across 18 chapters"
          />
        </Animated.View>
      </ScrollView>
    </DivineScreenWrapper>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

interface ActionButtonProps {
  readonly onPress: () => void;
  readonly children: React.ReactNode;
  readonly active?: boolean;
  readonly activeBg?: string;
  readonly accessibilityLabel: string;
}

function ActionButton({
  onPress,
  children,
  active = false,
  activeBg,
  accessibilityLabel,
}: ActionButtonProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ pressed }) => [
        styles.actionBtn,
        active && activeBg ? { backgroundColor: activeBg } : undefined,
        pressed && { opacity: 0.7 },
      ]}
    >
      {children}
    </Pressable>
  );
}

interface CtaRowProps {
  readonly onPress: () => void;
  readonly icon: React.ReactNode;
  readonly title: string;
  readonly subtitle: string;
  readonly iconBg: string;
  readonly iconBorder: string;
  readonly tint: string;
  readonly border: string;
}

function CtaRow({
  onPress,
  icon,
  title,
  subtitle,
  iconBg,
  iconBorder,
  tint,
  border,
}: CtaRowProps): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ctaRow,
        { backgroundColor: tint, borderColor: border },
        pressed && { opacity: 0.85 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${subtitle}`}
    >
      <View
        style={[
          styles.ctaIconWrap,
          { backgroundColor: iconBg, borderColor: iconBorder },
        ]}
      >
        {icon}
      </View>
      <View style={styles.ctaTextWrap}>
        <Text style={styles.ctaTitle}>{title}</Text>
        <Text style={styles.ctaSubtitle}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color={TEXT_MUTED} />
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scroll
  scrollContent: {
    paddingHorizontal: 16,
    gap: 22,
  },
  title: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: 44,
    lineHeight: 52,
    color: TEXT_PRIMARY,
    marginTop: 4,
    marginBottom: 4,
  },

  // Today's Wisdom card
  todayCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    padding: 18,
  },
  todayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  todayLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  todayLabel: {
    fontFamily: 'Outfit-Medium',
    fontSize: 11,
    letterSpacing: 1.4,
    color: GOLD,
  },
  todayRef: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 16,
    lineHeight: 30,
    fontStyle: 'italic',
    color: GOLD_BRIGHT,
    marginBottom: 12,
  },
  translation: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 16,
    lineHeight: 24,
    color: TEXT_PRIMARY,
    marginBottom: 10,
  },
  commentary: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_SECONDARY,
    marginBottom: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE_DIM,
  },
  readMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: GOLD_SOFT,
  },
  readMoreText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 13,
    color: GOLD,
  },
  loaderRow: {
    paddingVertical: 36,
    alignItems: 'center',
  },

  // Section label
  sectionLabel: {
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
    color: TEXT_MUTED,
    marginBottom: 12,
  },

  // Themes
  themeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  themeCell: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  themeTile: {
    overflow: 'hidden',
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    minHeight: 92,
    justifyContent: 'flex-end',
  },
  themeEmoji: {
    fontSize: 26,
    marginBottom: 6,
  },
  themeLabel: {
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
    color: TEXT_PRIMARY,
  },

  // CTA rows (Ask KIAAN / Wisdom Rooms / Explore Gita)
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: GOLD_TINT,
  },
  ctaIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  ctaTextWrap: {
    flex: 1,
    gap: 2,
  },
  ctaTitle: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 14,
    color: TEXT_PRIMARY,
  },
  ctaSubtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
  },
});
