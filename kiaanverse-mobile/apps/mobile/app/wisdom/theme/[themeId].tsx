/**
 * Wisdom → Theme Curation screen.
 *
 * Renders the curated Bhagavad Gita verse list for one of the six Explore-by-
 * Theme tiles on /wisdom (Inner Peace · Courage · Wisdom · Devotion · Right
 * Action · Letting Go). Verse refs come from the bundled themes.json mapping,
 * which is generated from the corpus's per-verse mental_health_applications
 * tags + chapter-level theme tags.
 *
 * Layout (top → bottom)
 *   • Header     Back arrow · Bell.
 *   • Title      Theme emoji + label, count badge.
 *   • Subtitle   Short curation note explaining the dharmic grouping.
 *   • Verse list Card per verse: chapter.verse stamp, Sanskrit (Devanagari),
 *                IAST transliteration, English translation. Tap → reader.
 *
 * Empty state: if the theme has no verses, surface a polite message and a
 * CTA to the full Gita browser — never a dead screen.
 *
 * Offline first: every verse loaded comes from the JS bundle (no network).
 */

import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  ListRenderItem,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bell, BookOpen, ChevronLeft, ChevronRight } from 'lucide-react-native';

import { DivineScreenWrapper } from '@kiaanverse/ui';
import { getLocalVersesByTheme, type LocalGitaVerse } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';

// ── Design tokens (mirrors wisdom/index.tsx so visual language stays one piece)
const GOLD = '#D4A017';
const GOLD_BRIGHT = '#E8B54A';
const GOLD_SOFT = 'rgba(212,160,23,0.15)';
const GOLD_BORDER = 'rgba(212,160,23,0.20)';
const TEXT_PRIMARY = '#F5F0E8';
const TEXT_SECONDARY = '#C8BFA8';
const TEXT_MUTED = '#7A7060';
const SURFACE_DIM = 'rgba(255,255,255,0.06)';
const SURFACE_BORDER = 'rgba(255,255,255,0.06)';

// ── Theme presentation — kept in sync with WISDOM_THEMES on wisdom/index.tsx
interface ThemePresentation {
  readonly emoji: string;
  readonly labelKey: string;
  readonly noteKey: string;
  readonly gradient: readonly [string, string];
  readonly border: string;
}

const THEME_PRESENTATION: Record<string, ThemePresentation> = {
  peace: {
    emoji: '🕊️',
    labelKey: 'wisdom.themeInnerPeace',
    noteKey: 'wisdom.themePeaceNote',
    gradient: ['rgba(20,184,166,0.18)', 'rgba(8,145,178,0.18)'],
    border: 'rgba(20,184,166,0.28)',
  },
  courage: {
    emoji: '🦁',
    labelKey: 'wisdom.themeCourage',
    noteKey: 'wisdom.themeCourageNote',
    gradient: ['rgba(212,164,76,0.18)', 'rgba(239,68,68,0.18)'],
    border: 'rgba(212,164,76,0.28)',
  },
  wisdom: {
    emoji: '🧘',
    labelKey: 'wisdom.themeWisdom',
    noteKey: 'wisdom.themeWisdomNote',
    gradient: ['rgba(168,85,247,0.18)', 'rgba(99,102,241,0.18)'],
    border: 'rgba(168,85,247,0.28)',
  },
  devotion: {
    emoji: '🙏',
    labelKey: 'wisdom.themeDevotion',
    noteKey: 'wisdom.themeDevotionNote',
    gradient: ['rgba(236,72,153,0.18)', 'rgba(244,63,94,0.18)'],
    border: 'rgba(236,72,153,0.28)',
  },
  action: {
    emoji: '⚡',
    labelKey: 'wisdom.themeRightAction',
    noteKey: 'wisdom.themeActionNote',
    gradient: ['rgba(212,164,76,0.18)', 'rgba(234,179,8,0.18)'],
    border: 'rgba(212,164,76,0.28)',
  },
  detachment: {
    emoji: '🍃',
    labelKey: 'wisdom.themeLettingGo',
    noteKey: 'wisdom.themeDetachmentNote',
    gradient: ['rgba(34,197,94,0.18)', 'rgba(16,185,129,0.18)'],
    border: 'rgba(34,197,94,0.28)',
  },
};

export default function WisdomThemeScreen(): React.JSX.Element {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { themeId: rawThemeId } = useLocalSearchParams<{ themeId: string }>();
  const themeId = String(rawThemeId ?? '');

  const presentation = THEME_PRESENTATION[themeId];
  const verses: ReadonlyArray<LocalGitaVerse> = useMemo(
    () => (presentation ? getLocalVersesByTheme(themeId) : []),
    [themeId, presentation],
  );

  const handleBack = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    if (router.canGoBack?.()) {
      router.back();
    } else {
      router.replace('/wisdom' as never);
    }
  }, [router]);

  const handleNotifications = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    router.push('/(app)/notifications' as never);
  }, [router]);

  const handleVersePress = useCallback(
    (verse: LocalGitaVerse) => {
      void Haptics.selectionAsync().catch(() => undefined);
      router.push(`/wisdom/verse/${verse.chapter}/${verse.verse}` as never);
    },
    [router],
  );

  const handleExploreAll = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    router.push('/(tabs)/shlokas/gita' as never);
  }, [router]);

  // Unknown theme — graceful fallback into the full Gita browser.
  if (!presentation) {
    return (
      <DivineScreenWrapper safeArea={false}>
        <ThemeHeader
          insetsTop={insets.top}
          onBack={handleBack}
          onBell={handleNotifications}
          backLabel={t('wisdom.backToWisdomA11y')}
          bellLabel={t('wisdom.openNotificationsA11y')}
        />
        <View style={[styles.emptyWrap, { paddingTop: insets.top + 80 }]}>
          <Text style={styles.emptyTitle}>{t('wisdom.themeUnknownTitle')}</Text>
          <Text style={styles.emptySubtitle}>
            {t('wisdom.themeUnknownSubtitle')}
          </Text>
          <Pressable
            onPress={handleExploreAll}
            style={({ pressed }) => [
              styles.exploreCta,
              pressed && { opacity: 0.85 },
            ]}
          >
            <BookOpen size={16} color={GOLD} />
            <Text style={styles.exploreCtaText}>
              {t('wisdom.exploreGitaTitle')}
            </Text>
          </Pressable>
        </View>
      </DivineScreenWrapper>
    );
  }

  const label = t(presentation.labelKey);
  const note = t(presentation.noteKey);

  const renderVerse: ListRenderItem<LocalGitaVerse> = ({ item, index }) => (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 8) * 30).duration(360)}
    >
      <Pressable
        onPress={() => handleVersePress(item)}
        accessibilityRole="button"
        accessibilityLabel={t('wisdom.openVerseA11y', {
          chapter: String(item.chapter),
          verse: String(item.verse),
        })}
        style={({ pressed }) => [
          styles.verseCard,
          { borderColor: presentation.border },
          pressed && { opacity: 0.85 },
        ]}
      >
        <LinearGradient
          colors={presentation.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.verseHeader}>
          <Text style={styles.verseRef}>
            {t('wisdom.chapterVerseRef', {
              chapter: String(item.chapter),
              verse: String(item.verse),
            })}
          </Text>
          <ChevronRight size={16} color={TEXT_MUTED} />
        </View>
        {item.sanskrit ? (
          <Text
            style={styles.sanskrit}
            accessibilityLanguage="sa"
            numberOfLines={2}
          >
            {item.sanskrit}
          </Text>
        ) : null}
        {item.transliteration ? (
          <Text style={styles.iast} numberOfLines={1}>
            {item.transliteration}
          </Text>
        ) : null}
        {item.english ? (
          <Text style={styles.english} numberOfLines={3}>
            {item.english}
          </Text>
        ) : (
          <Text style={styles.englishPending}>
            {t('wisdom.translationPending')}
          </Text>
        )}
      </Pressable>
    </Animated.View>
  );

  const keyExtractor = (item: LocalGitaVerse) => item.verseId;

  return (
    <DivineScreenWrapper safeArea={false}>
      <ThemeHeader
        insetsTop={insets.top}
        onBack={handleBack}
        onBell={handleNotifications}
        backLabel={t('wisdom.backToWisdomA11y')}
        bellLabel={t('wisdom.openNotificationsA11y')}
      />
      <FlatList
        data={verses}
        keyExtractor={keyExtractor}
        renderItem={renderVerse}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 120 },
        ]}
        ListHeaderComponent={
          <Animated.View entering={FadeIn.duration(380)} style={styles.titleBlock}>
            <View style={styles.emojiRow}>
              <Text style={styles.emoji}>{presentation.emoji}</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>
                  {t('wisdom.themeVerseCount', { count: String(verses.length) })}
                </Text>
              </View>
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {label}
            </Text>
            {note ? <Text style={styles.note}>{note}</Text> : null}
          </Animated.View>
        }
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>{t('wisdom.themeEmptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('wisdom.themeEmptySubtitle')}
            </Text>
            <Pressable
              onPress={handleExploreAll}
              style={({ pressed }) => [
                styles.exploreCta,
                pressed && { opacity: 0.85 },
              ]}
            >
              <BookOpen size={16} color={GOLD} />
              <Text style={styles.exploreCtaText}>
                {t('wisdom.exploreGitaTitle')}
              </Text>
            </Pressable>
          </View>
        }
        showsVerticalScrollIndicator={false}
        initialNumToRender={8}
        maxToRenderPerBatch={12}
        windowSize={9}
      />
    </DivineScreenWrapper>
  );
}

// ── Header bar ─────────────────────────────────────────────────────────────
interface ThemeHeaderProps {
  readonly insetsTop: number;
  readonly onBack: () => void;
  readonly onBell: () => void;
  readonly backLabel: string;
  readonly bellLabel: string;
}

function ThemeHeader({
  insetsTop,
  onBack,
  onBell,
  backLabel,
  bellLabel,
}: ThemeHeaderProps): React.JSX.Element {
  return (
    <View style={[styles.header, { paddingTop: insetsTop + 8 }]}>
      <Pressable
        onPress={onBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        style={styles.headerBtn}
      >
        <ChevronLeft size={24} color={TEXT_PRIMARY} />
      </Pressable>
      <Pressable
        onPress={onBell}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={bellLabel}
        style={styles.headerBtn}
      >
        <Bell size={22} color={TEXT_PRIMARY} />
      </Pressable>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
  },
  titleBlock: {
    paddingBottom: 16,
  },
  emojiRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  emoji: {
    fontSize: 44,
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: GOLD_SOFT,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  countBadgeText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 11,
    letterSpacing: 1,
    color: GOLD_BRIGHT,
  },
  title: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: 36,
    lineHeight: 42,
    color: TEXT_PRIMARY,
    marginBottom: 8,
  },
  note: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_SECONDARY,
  },
  verseCard: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
  },
  verseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  verseRef: {
    fontFamily: 'Outfit-Medium',
    fontSize: 12,
    letterSpacing: 1,
    color: GOLD,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 15,
    lineHeight: 26,
    fontStyle: 'italic',
    color: GOLD_BRIGHT,
  },
  iast: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_SECONDARY,
  },
  english: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_PRIMARY,
    marginTop: 4,
  },
  englishPending: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    fontStyle: 'italic',
    color: TEXT_MUTED,
    marginTop: 4,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 64,
    gap: 12,
  },
  emptyTitle: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: 28,
    lineHeight: 32,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    marginBottom: 12,
  },
  exploreCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: GOLD_SOFT,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },
  exploreCtaText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 14,
    color: GOLD,
  },
});
