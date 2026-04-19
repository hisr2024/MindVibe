/**
 * Shlokas → Chapter Detail
 *
 * Lists every verse in a chapter as a compact ShlokaCard (Sanskrit first line
 * + English preview). Tapping a verse opens the full VerseDetail screen.
 *
 * Data:
 *   GET /api/gita/chapters/:id → name, summary, verse_count, verses[]
 * Background: DivineScreenWrapper (particles persist across route changes).
 */

import React, { useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DivineScreenWrapper,
  GoldenDivider,
  OmLoader,
  ShlokaCard,
} from '@kiaanverse/ui';
import {
  useGitaChapterDetail,
  type GitaVerseSummary,
} from '@kiaanverse/api';

const GOLD = '#D4A017';
const GOLD_SOFT = 'rgba(212, 160, 23, 0.35)';
const TEXT_PRIMARY = '#F5F0E8';
const TEXT_SECONDARY = '#C8BFA8';
const TEXT_MUTED = '#7A7060';
const ICON_BG = 'rgba(212, 160, 23, 0.10)';

/** Canonical Devanagari chapter names (same map as shlokas/index.tsx). */
const CHAPTER_SANSKRIT_NAMES: Record<number, string> = {
  1: 'अर्जुन विषाद योग',
  2: 'सांख्य योग',
  3: 'कर्म योग',
  4: 'ज्ञान कर्म संन्यास योग',
  5: 'कर्म संन्यास योग',
  6: 'आत्म संयम योग',
  7: 'ज्ञान विज्ञान योग',
  8: 'अक्षर ब्रह्म योग',
  9: 'राज विद्या राज गुह्य योग',
  10: 'विभूति योग',
  11: 'विश्वरूप दर्शन योग',
  12: 'भक्ति योग',
  13: 'क्षेत्र क्षेत्रज्ञ विभाग योग',
  14: 'गुणत्रय विभाग योग',
  15: 'पुरुषोत्तम योग',
  16: 'दैवासुर संपद विभाग योग',
  17: 'श्रद्धात्रय विभाग योग',
  18: 'मोक्ष संन्यास योग',
};

interface VerseRowProps {
  readonly verse: GitaVerseSummary;
  readonly index: number;
  readonly onPress: (chapter: number, verse: number) => void;
}

function VerseRow({ verse, index, onPress }: VerseRowProps): React.JSX.Element {
  const handlePress = useCallback(
    () => onPress(verse.chapter, verse.verse),
    [onPress, verse.chapter, verse.verse],
  );

  return (
    <Animated.View
      entering={FadeInDown.delay(Math.min(index, 12) * 25).duration(300).springify()}
    >
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`Verse ${verse.chapter}.${verse.verse}`}
      >
        <ShlokaCard
          sanskrit={verse.sanskrit ?? ''}
          meaning={verse.preview}
          reference={`${verse.chapter}.${verse.verse}`}
          revealDelay={0}
        />
      </Pressable>
    </Animated.View>
  );
}

export default function ChapterDetailScreen(): React.JSX.Element {
  const { chapter } = useLocalSearchParams<{ chapter: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const chapterId = Number(chapter);
  const validChapter = Number.isInteger(chapterId) && chapterId >= 1 && chapterId <= 18;

  const { data, isLoading, error, refetch } = useGitaChapterDetail(
    validChapter ? chapterId : 0,
  );

  const openVerse = useCallback(
    (ch: number, v: number) => {
      router.push(`/(tabs)/shlokas/${ch}/${v}`);
    },
    [router],
  );

  const sanskritName = useMemo(
    () => (validChapter ? CHAPTER_SANSKRIT_NAMES[chapterId] ?? '' : ''),
    [chapterId, validChapter],
  );

  const renderVerse = useCallback<ListRenderItem<GitaVerseSummary>>(
    ({ item, index }) => <VerseRow verse={item} index={index} onPress={openVerse} />,
    [openVerse],
  );

  const listHeader = useMemo(() => {
    if (!data) return null;
    return (
      <View style={styles.summaryBlock}>
        {sanskritName ? (
          <Text
            style={styles.summarySanskrit}
            allowFontScaling
            accessibilityLanguage="sa"
          >
            {sanskritName}
          </Text>
        ) : null}
        <Text style={styles.summaryTitle}>{data.name}</Text>
        <Text style={styles.summaryMeta}>
          Chapter {data.chapter} — {data.verse_count} verses
        </Text>
        {data.summary ? (
          <Text style={styles.summaryBody}>{data.summary}</Text>
        ) : null}
        <GoldenDivider style={styles.divider} />
      </View>
    );
  }, [data, sanskritName]);

  if (!validChapter) {
    return (
      <DivineScreenWrapper>
        <ChapterHeader
          title="Unknown chapter"
          onBack={() => router.back()}
        />
        <View style={styles.state}>
          <Text style={styles.errorTitle}>Chapter not found</Text>
          <Text style={styles.stateHint}>
            The Bhagavad Gita has 18 chapters — please pick one from 1 to 18.
          </Text>
        </View>
      </DivineScreenWrapper>
    );
  }

  return (
    <DivineScreenWrapper>
      <ChapterHeader
        title={data?.name ?? `Chapter ${chapterId}`}
        subtitle={data ? `${data.verse_count} verses` : undefined}
        onBack={() => router.back()}
      />

      {isLoading && !data ? (
        <View style={styles.state}>
          <OmLoader size={64} label="Opening the chapter…" />
        </View>
      ) : error && !data ? (
        <View style={styles.state}>
          <Text style={styles.errorTitle}>This chapter is temporarily unavailable</Text>
          <Text style={styles.stateHint}>
            Your offline cache will be used when available. You can try again below.
          </Text>
          <Pressable onPress={() => void refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList<GitaVerseSummary>
          data={data?.verses ?? []}
          renderItem={renderVerse}
          keyExtractor={(v) => v.verse_id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + 96 },
          ]}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={VerseSeparator}
          ListEmptyComponent={
            <View style={styles.state}>
              <Text style={styles.stateHint}>
                No verses have been loaded yet for this chapter.
              </Text>
            </View>
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </DivineScreenWrapper>
  );
}

function VerseSeparator(): React.JSX.Element {
  return <View style={styles.verseSeparator} />;
}

interface ChapterHeaderProps {
  readonly title: string;
  readonly subtitle?: string | undefined;
  readonly onBack: () => void;
}

function ChapterHeader({ title, subtitle, onBack }: ChapterHeaderProps): React.JSX.Element {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={12}
        style={styles.backButton}
      >
        <ChevronLeft size={22} color={GOLD} />
      </Pressable>
      <View style={styles.headerTitles}>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.headerSpacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ICON_BG,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 20,
    lineHeight: 24,
    color: TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 0.4,
  },
  headerSpacer: {
    width: 40,
  },

  // List --------------------------------------------------------------------
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 0,
  },
  verseSeparator: {
    height: 10,
  },

  // Summary -----------------------------------------------------------------
  summaryBlock: {
    paddingVertical: 10,
    gap: 4,
  },
  summarySanskrit: {
    fontFamily: 'NotoSansDevanagari-Medium',
    fontSize: 18,
    lineHeight: 26,
    color: GOLD,
  },
  summaryTitle: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 17,
    lineHeight: 22,
    color: TEXT_PRIMARY,
    marginTop: 2,
  },
  summaryMeta: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  summaryBody: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_SECONDARY,
    marginTop: 8,
  },
  divider: {
    marginTop: 16,
    marginBottom: 8,
  },

  // State -------------------------------------------------------------------
  state: {
    flex: 1,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    gap: 12,
  },
  stateHint: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    maxWidth: 320,
  },
  errorTitle: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 18,
    color: '#E57373',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: ICON_BG,
  },
  retryText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: GOLD,
    letterSpacing: 0.6,
  },
});
