/**
 * Verse Detail Screen
 *
 * Full Bhagavad Gita verse display with:
 * - Tabs: Translation | Word-by-Word | Commentary
 * - Large Sanskrit text with golden accent
 * - Audio pronunciation via expo-speech
 * - Share via React Native Share API
 * - "Ask Sakha" navigation to chat with verse context
 * - Bookmark/favorite via Zustand gitaStore
 * - Prev/next verse navigation (cross-chapter)
 * - Related verses section
 * - Loading, error, and empty states
 *
 * Deep link: kiaanverse://verse/:chapter/:verse
 */

import React, { useState, useCallback, useMemo } from 'react';
import { View, ScrollView, StyleSheet, Pressable, Share } from 'react-native';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import {
  Heart,
  Volume2,
  Share2,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import {
  Screen,
  Text,
  GoldenHeader,
  LoadingMandala,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useTheme } from '@kiaanverse/ui';
import {
  useGitaVerseDetail,
  useGitaTranslations,
  type GitaVerseReference,
} from '@kiaanverse/api';
import { useGitaStore } from '@kiaanverse/store';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Chapter verse counts (1-indexed) for prev/next navigation. */
const CHAPTER_VERSE_COUNTS: Record<number, number> = {
  1: 47, 2: 72, 3: 43, 4: 42, 5: 29, 6: 47, 7: 30, 8: 28, 9: 34,
  10: 42, 11: 55, 12: 20, 13: 35, 14: 27, 15: 20, 16: 24, 17: 28, 18: 78,
};

type TabKey = 'translation' | 'word-by-word' | 'commentary';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'translation', label: 'Translation' },
  { key: 'word-by-word', label: 'Word-by-Word' },
  { key: 'commentary', label: 'Commentary' },
];

// ---------------------------------------------------------------------------
// Tab Selector
// ---------------------------------------------------------------------------

function TabSelector({
  active,
  onChange,
}: {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <View style={styles.tabRow}>
      {TABS.map((tab) => {
        const isActive = tab.key === active;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onChange(tab.key)}
            style={[
              styles.tabPill,
              {
                backgroundColor: isActive ? colors.alpha.goldMedium : colors.alpha.whiteLight,
                borderColor: isActive ? colors.primary[500] : 'transparent',
              },
            ]}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
          >
            <Text
              variant="caption"
              color={isActive ? colors.primary[300] : c.textSecondary}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Action Bar
// ---------------------------------------------------------------------------

function ActionBar({
  verseId,
  sanskrit,
  english,
  chapter,
  verse,
}: {
  verseId: string;
  sanskrit: string;
  english: string;
  chapter: number;
  verse: number;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();
  const isBookmarked = useGitaStore((s) => s.bookmarkedVerseIds.includes(verseId));
  const toggleBookmark = useGitaStore((s) => s.toggleBookmark);

  const [isSpeaking, setIsSpeaking] = useState(false);

  const handleAudio = useCallback(async () => {
    if (isSpeaking) {
      Speech.stop();
      setIsSpeaking(false);
      return;
    }

    setIsSpeaking(true);
    Speech.speak(sanskrit, {
      language: 'sa',
      onDone: () => setIsSpeaking(false),
      onError: () => {
        setIsSpeaking(false);
        // Fallback: try Hindi if Sanskrit not supported
        Speech.speak(sanskrit, {
          language: 'hi',
          onDone: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      },
    });
  }, [sanskrit, isSpeaking]);

  const handleShare = useCallback(async () => {
    const shareText = [
      `Bhagavad Gita ${chapter}.${verse}`,
      '',
      sanskrit,
      '',
      english,
      '',
      '— From Kiaanverse',
    ].join('\n');

    try {
      await Share.share({
        message: shareText,
        title: `Bhagavad Gita ${chapter}.${verse}`,
      });
    } catch {
      // User cancelled or share failed — no action needed
    }
  }, [sanskrit, english, chapter, verse]);

  const handleAskSakha = useCallback(() => {
    router.push({
      pathname: '/chat',
      params: {
        context: `Bhagavad Gita ${chapter}.${verse}: ${english}`,
      },
    });
  }, [router, chapter, verse, english]);

  const handleBookmark = useCallback(() => {
    toggleBookmark(verseId);
  }, [toggleBookmark, verseId]);

  return (
    <View style={[styles.actionBar, { borderColor: c.cardBorder }]}>
      <Pressable
        onPress={handleAudio}
        style={styles.actionButton}
        accessibilityLabel={isSpeaking ? 'Stop audio' : 'Play Sanskrit audio'}
      >
        <Volume2
          size={22}
          color={isSpeaking ? colors.primary[500] : c.textSecondary}
        />
        <Text variant="caption" color={isSpeaking ? colors.primary[500] : c.textTertiary}>
          {isSpeaking ? 'Stop' : 'Listen'}
        </Text>
      </Pressable>

      <Pressable
        onPress={handleShare}
        style={styles.actionButton}
        accessibilityLabel="Share verse"
      >
        <Share2 size={20} color={c.textSecondary} />
        <Text variant="caption" color={c.textTertiary}>Share</Text>
      </Pressable>

      <Pressable
        onPress={handleAskSakha}
        style={styles.actionButton}
        accessibilityLabel="Ask Sakha about this verse"
      >
        <MessageCircle size={20} color={c.textSecondary} />
        <Text variant="caption" color={c.textTertiary}>Ask Sakha</Text>
      </Pressable>

      <Pressable
        onPress={handleBookmark}
        style={styles.actionButton}
        accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
      >
        <Heart
          size={20}
          color={isBookmarked ? colors.divine.lotus : c.textSecondary}
          fill={isBookmarked ? colors.divine.lotus : 'transparent'}
        />
        <Text
          variant="caption"
          color={isBookmarked ? colors.divine.lotus : c.textTertiary}
        >
          {isBookmarked ? 'Saved' : 'Save'}
        </Text>
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Related Verse Card
// ---------------------------------------------------------------------------

function RelatedVerseCard({
  item,
  onPress,
}: {
  item: GitaVerseReference;
  onPress: () => void;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;

  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      <View style={[styles.relatedCard, { backgroundColor: c.card, borderColor: c.cardBorder }]}>
        <Text variant="caption" color={colors.primary[300]}>
          {item.verse_id}
        </Text>
        <Text variant="bodySmall" color={c.textPrimary} numberOfLines={2}>
          {item.text}
        </Text>
        <Text variant="caption" color={c.textTertiary}>
          {item.theme.replace(/_/g, ' ')}
        </Text>
      </View>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Prev/Next Navigation
// ---------------------------------------------------------------------------

function PrevNextNav({
  chapter,
  verse,
}: {
  chapter: number;
  verse: number;
}): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;
  const router = useRouter();

  const prevVerse = useMemo(() => {
    if (verse > 1) return { chapter, verse: verse - 1 };
    if (chapter > 1) {
      const prevCh = chapter - 1;
      return { chapter: prevCh, verse: CHAPTER_VERSE_COUNTS[prevCh] ?? 1 };
    }
    return null;
  }, [chapter, verse]);

  const nextVerse = useMemo(() => {
    const maxVerse = CHAPTER_VERSE_COUNTS[chapter] ?? 999;
    if (verse < maxVerse) return { chapter, verse: verse + 1 };
    if (chapter < 18) return { chapter: chapter + 1, verse: 1 };
    return null;
  }, [chapter, verse]);

  const navigate = useCallback(
    (target: { chapter: number; verse: number }) => {
      router.replace(`/verse/${target.chapter}/${target.verse}`);
    },
    [router],
  );

  return (
    <View style={[styles.navBar, { borderColor: c.cardBorder }]}>
      {/* Previous */}
      <Pressable
        onPress={prevVerse ? () => navigate(prevVerse) : undefined}
        style={[styles.navButton, !prevVerse && styles.navButtonDisabled]}
        disabled={!prevVerse}
        accessibilityLabel={prevVerse ? `Previous: ${prevVerse.chapter}.${prevVerse.verse}` : 'No previous verse'}
      >
        <ChevronLeft
          size={20}
          color={prevVerse ? colors.primary[300] : c.textTertiary}
        />
        <Text
          variant="caption"
          color={prevVerse ? colors.primary[300] : c.textTertiary}
        >
          {prevVerse ? `${prevVerse.chapter}.${prevVerse.verse}` : '—'}
        </Text>
      </Pressable>

      {/* Current indicator */}
      <Text variant="label" color={c.textPrimary}>
        {chapter}.{verse}
      </Text>

      {/* Next */}
      <Pressable
        onPress={nextVerse ? () => navigate(nextVerse) : undefined}
        style={[styles.navButton, !nextVerse && styles.navButtonDisabled]}
        disabled={!nextVerse}
        accessibilityLabel={nextVerse ? `Next: ${nextVerse.chapter}.${nextVerse.verse}` : 'No next verse'}
      >
        <Text
          variant="caption"
          color={nextVerse ? colors.primary[300] : c.textTertiary}
        >
          {nextVerse ? `${nextVerse.chapter}.${nextVerse.verse}` : '—'}
        </Text>
        <ChevronRight
          size={20}
          color={nextVerse ? colors.primary[300] : c.textTertiary}
        />
      </Pressable>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function VerseDetailScreen(): React.JSX.Element {
  const { chapter, verse } = useLocalSearchParams<{ chapter: string; verse: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const c = theme.colors;

  const chapterNum = Number(chapter);
  const verseNum = Number(verse);
  const verseId = `${chapterNum}.${verseNum}`;

  const [activeTab, setActiveTab] = useState<TabKey>('translation');

  // Data hooks
  const { data, isLoading, error } = useGitaVerseDetail(chapterNum, verseNum);
  const { data: translations } = useGitaTranslations(verseId);

  // Bookmark state for header
  const isBookmarked = useGitaStore((s) => s.bookmarkedVerseIds.includes(verseId));
  const toggleBookmark = useGitaStore((s) => s.toggleBookmark);

  // Bookmark icon for header right action
  const bookmarkAction = (
    <Pressable
      onPress={() => toggleBookmark(verseId)}
      accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark verse'}
      hitSlop={8}
    >
      <Heart
        size={22}
        color={isBookmarked ? colors.divine.lotus : c.textSecondary}
        fill={isBookmarked ? colors.divine.lotus : 'transparent'}
      />
    </Pressable>
  );

  // ---------------------------------------------------------------------------
  // Render tab content
  // ---------------------------------------------------------------------------

  const renderTabContent = useCallback(() => {
    if (!data?.verse) return null;
    const v = data.verse;

    switch (activeTab) {
      case 'translation':
        return (
          <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
            {/* English */}
            <View style={styles.translationBlock}>
              <Text variant="caption" color={colors.primary[300]} style={styles.langLabel}>
                English
              </Text>
              <Text variant="body" color={c.textPrimary} style={styles.translationText}>
                {translations?.translations?.english ?? v.english}
              </Text>
            </View>

            {/* Hindi */}
            <View style={styles.translationBlock}>
              <Text variant="caption" color={colors.primary[300]} style={styles.langLabel}>
                Hindi
              </Text>
              <Text variant="body" color={c.textPrimary} style={styles.translationText}>
                {translations?.translations?.hindi ?? v.hindi}
              </Text>
            </View>

            {/* Theme & Principle */}
            {v.theme ? (
              <View style={styles.metaBlock}>
                <Text variant="caption" color={c.textTertiary}>
                  Theme: {v.theme.replace(/_/g, ' ')}
                </Text>
                {v.principle ? (
                  <Text variant="caption" color={c.textTertiary}>
                    Principle: {v.principle}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Animated.View>
        );

      case 'word-by-word':
        return (
          <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
            <Text variant="caption" color={colors.primary[300]} style={styles.langLabel}>
              Sanskrit with Transliteration
            </Text>
            {/* Display Sanskrit text with transliteration as word-by-word approximation */}
            <Text variant="body" color={c.textPrimary} style={styles.translationText}>
              {translations?.translations?.sanskrit ?? v.sanskrit}
            </Text>
            <View style={[styles.wordDivider, { backgroundColor: c.cardBorder }]} />
            <Text variant="caption" color={c.textTertiary} style={styles.wordHint}>
              Word-by-word meanings are derived from the transliteration and translation.
              For detailed word analysis, ask Sakha.
            </Text>
          </Animated.View>
        );

      case 'commentary':
        return (
          <Animated.View entering={FadeIn.duration(300)} style={styles.tabContent}>
            <Text variant="caption" color={colors.primary[300]} style={styles.langLabel}>
              Commentary
            </Text>
            <Text variant="body" color={c.textSecondary} style={styles.translationText}>
              Commentary for this verse is coming soon. In the meantime, you can ask Sakha for a
              deeper understanding of this verse.
            </Text>
          </Animated.View>
        );

      default:
        return null;
    }
  }, [activeTab, data, translations, c]);

  // ---------------------------------------------------------------------------
  // Loading / Error states
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <Screen>
        <GoldenHeader
          title={`Chapter ${chapter} · Verse ${verse}`}
          onBack={() => router.back()}
          testID="verse-detail-header"
        />
        <View style={styles.centerState}>
          <LoadingMandala size={80} />
          <Text variant="bodySmall" color={c.textSecondary} style={styles.stateText}>
            Loading verse...
          </Text>
        </View>
      </Screen>
    );
  }

  if (error || !data?.verse) {
    return (
      <Screen>
        <GoldenHeader
          title={`Chapter ${chapter} · Verse ${verse}`}
          onBack={() => router.back()}
          testID="verse-detail-header"
        />
        <View style={styles.centerState}>
          <Text variant="body" color={colors.semantic.error}>
            {error ? 'Unable to load verse' : `Verse ${chapter}:${verse} not found`}
          </Text>
          <Text variant="bodySmall" color={c.textSecondary} style={styles.stateText}>
            {error
              ? 'Please check your connection and try again'
              : 'This verse may not exist in the database yet'}
          </Text>
        </View>
      </Screen>
    );
  }

  const v = data.verse;

  return (
    <Screen>
      <GoldenHeader
        title={`Chapter ${chapter} · Verse ${verse}`}
        onBack={() => router.back()}
        rightAction={bookmarkAction}
        testID="verse-detail-header"
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Large Sanskrit text */}
        <Animated.View entering={FadeInDown.duration(500).springify()}>
          <View style={[styles.sanskritBlock, { borderColor: colors.alpha.goldMedium }]}>
            <Text
              style={[styles.largeSanskrit, { color: colors.primary[300] }]}
              accessibilityLabel={`Sanskrit: ${v.sanskrit}`}
            >
              {v.sanskrit}
            </Text>
          </View>
        </Animated.View>

        {/* Action Bar */}
        <ActionBar
          verseId={verseId}
          sanskrit={v.sanskrit}
          english={v.english}
          chapter={chapterNum}
          verse={verseNum}
        />

        {/* Tab Selector */}
        <TabSelector active={activeTab} onChange={setActiveTab} />

        {/* Tab Content */}
        {renderTabContent()}

        {/* Related Verses */}
        {data.related_verses.length > 0 ? (
          <View style={styles.relatedSection}>
            <Text variant="label" color={c.textSecondary} style={styles.relatedLabel}>
              Related Verses
            </Text>
            {data.related_verses.map((rv) => (
              <RelatedVerseCard
                key={rv.verse_id}
                item={rv}
                onPress={() =>
                  router.push(`/verse/${rv.chapter}/${rv.verse}`)
                }
              />
            ))}
          </View>
        ) : null}
      </ScrollView>

      {/* Prev/Next Navigation */}
      <PrevNextNav chapter={chapterNum} verse={verseNum} />
    </Screen>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  centerState: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  stateText: {
    marginTop: spacing.xs,
  },

  // Sanskrit block
  sanskritBlock: {
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    alignItems: 'center',
  },
  largeSanskrit: {
    fontSize: 24,
    lineHeight: 38,
    textAlign: 'center',
  },

  // Action bar
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.sm,
  },

  // Tabs
  tabRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  tabPill: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    alignItems: 'center',
  },

  // Tab content
  tabContent: {
    marginBottom: spacing.lg,
  },
  translationBlock: {
    marginBottom: spacing.md,
  },
  langLabel: {
    marginBottom: spacing.xxs,
  },
  translationText: {
    lineHeight: 24,
  },
  metaBlock: {
    gap: spacing.xxs,
    marginTop: spacing.sm,
  },
  wordDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: spacing.md,
  },
  wordHint: {
    fontStyle: 'italic',
    lineHeight: 20,
  },

  // Related verses
  relatedSection: {
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  relatedLabel: {
    marginBottom: spacing.xxs,
  },
  relatedCard: {
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
    gap: spacing.xxs,
  },

  // Prev/Next nav
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xxs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
});
