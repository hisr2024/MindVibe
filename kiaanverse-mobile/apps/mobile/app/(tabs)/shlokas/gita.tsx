/**
 * Shlokas — Bhagavad Gita Browser
 *
 * 1:1 port of kiaanverse.com/m/gita for native. Composition:
 *
 *   ┌──────────────────────────────────────────────────────────┐
 *   │ Header:  "भगवद गीता" (gold, Devanagari)                  │
 *   │          "Bhagavad Gita" (muted, Outfit)     [🔍 Search] │
 *   ├──────────────────────────────────────────────────────────┤
 *   │ Daily Verse — ShlokaCard with VerseRevelation            │
 *   │ "18 Chapters" section header + GoldenDivider             │
 *   │ 18 SacredCard rows (chapter circle + Sanskrit + English) │
 *   └──────────────────────────────────────────────────────────┘
 *
 * Background: DivineScreenWrapper (particle field + aurora).
 * Search overlay: full-screen lotus-bloom modal with debounced queries.
 * Offline-first: chapter catalog + daily verse cached for 24h.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ListRenderItem,
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Search, X } from 'lucide-react-native';

import {
  DivineScreenWrapper,
  GoldenDivider,
  OmLoader,
  SacredCard,
  ShlokaCard,
} from '@kiaanverse/ui';
import {
  useGitaChapters,
  useGitaSearchFull,
  useGitaVerseDetail,
  type GitaChapter,
  type GitaSearchResult,
} from '@kiaanverse/api';
import { useGitaStore } from '@kiaanverse/store';

// ---------------------------------------------------------------------------
// Design tokens (sourced from the web parity tokens used across the UI kit)
// ---------------------------------------------------------------------------

const GOLD = '#D4A017';
const GOLD_SOFT = 'rgba(212, 160, 23, 0.35)';
const GOLD_GLOW = 'rgba(212, 160, 23, 0.55)';
const TEXT_PRIMARY = '#F5F0E8';
const TEXT_SECONDARY = '#C8BFA8';
const TEXT_MUTED = '#7A7060';
const TEXT_TERTIARY = '#5F5545';
const SURFACE_OVERLAY = 'rgba(5, 7, 20, 0.88)';
const ICON_BG = 'rgba(212, 160, 23, 0.10)';

/** Sanskrit (Devanagari) names for each Gita chapter — the backend only
 *  returns transliterated names, so the screen supplies the canonical
 *  Devanagari so we never fall back to system text. */
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

const SEARCH_DEBOUNCE_MS = 300;
const SEARCH_MIN_CHARS = 3;

/** lotus-bloom easing — matches VerseRevelation + every sacred entrance. */
const lotusBloom = Easing.bezier(0.22, 1, 0.36, 1);

// ---------------------------------------------------------------------------
// Daily Verse card
// ---------------------------------------------------------------------------

/**
 * Daily Verse — featured ShlokaCard at the top of the screen.
 *
 * Reads the same vodChapter/vodVerse from gitaStore that the Home tab uses,
 * so the "verse of the day" is consistent across the app. On first mount we
 * trigger `refreshVerseOfTheDay()` inside a useEffect (never during render).
 */
function DailyVerse(): React.JSX.Element {
  const refreshVerseOfTheDay = useGitaStore((s) => s.refreshVerseOfTheDay);
  useEffect(() => {
    refreshVerseOfTheDay();
  }, [refreshVerseOfTheDay]);

  const vodChapter = useGitaStore((s) => s.vodChapter);
  const vodVerse = useGitaStore((s) => s.vodVerse);

  // Iconic fallback (BG 2.47) before first refresh resolves.
  const chapter = vodChapter ?? 2;
  const verse = vodVerse ?? 47;

  const { data, isLoading, error } = useGitaVerseDetail(chapter, verse);
  const router = useRouter();

  if (isLoading || !data?.verse) {
    return (
      <Animated.View entering={FadeIn.duration(400)} style={styles.dailyLoading}>
        {error ? (
          <OmLoader size={56} label="The daily verse will return soon…" />
        ) : (
          <OmLoader size={56} />
        )}
      </Animated.View>
    );
  }

  const v = data.verse;
  const reference = `Bhagavad Gita ${v.chapter}.${v.verse}`;

  return (
    <Animated.View entering={FadeInDown.duration(500).springify()}>
      <Pressable
        onPress={() => router.push(`/(tabs)/shlokas/${v.chapter}/${v.verse}`)}
        accessibilityRole="button"
        accessibilityLabel={`Daily verse: ${reference}`}
      >
        <View style={styles.dailyWrap}>
          <Text style={styles.dailyLabel}>✦ Verse of the Day</Text>
          <ShlokaCard
            sanskrit={v.sanskrit}
            meaning={v.english}
            reference={reference}
            style={styles.dailyCard}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Chapter row
// ---------------------------------------------------------------------------

interface ChapterRowProps {
  readonly chapter: GitaChapter;
  readonly index: number;
  readonly onPress: (chapterId: number) => void;
}

function ChapterRow({ chapter, index, onPress }: ChapterRowProps): React.JSX.Element {
  const handlePress = useCallback(() => onPress(chapter.id), [chapter.id, onPress]);
  const sanskrit = CHAPTER_SANSKRIT_NAMES[chapter.id] ?? '';

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 35).duration(340).springify()}
    >
      <SacredCard
        onPress={handlePress}
        accessibilityLabel={`Chapter ${chapter.id}: ${chapter.title}, ${chapter.versesCount} verses`}
        contentStyle={styles.chapterBody}
      >
        <View style={styles.chapterRow}>
          {/* Chapter number circle */}
          <View style={styles.chapterCircle}>
            <Text style={styles.chapterNumber}>{chapter.id}</Text>
          </View>

          {/* Chapter names */}
          <View style={styles.chapterInfo}>
            <Text
              style={styles.chapterSanskrit}
              numberOfLines={1}
              allowFontScaling
              accessibilityLanguage="sa"
            >
              {sanskrit}
            </Text>
            <Text style={styles.chapterEnglish} numberOfLines={1}>
              {chapter.title}
            </Text>
          </View>

          {/* Verse count badge + chevron */}
          <View style={styles.chapterTrailing}>
            <View style={styles.versesBadge}>
              <Text style={styles.versesBadgeText}>{chapter.versesCount}</Text>
            </View>
            <ChevronRight size={16} color={TEXT_MUTED} />
          </View>
        </View>
      </SacredCard>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Search overlay
// ---------------------------------------------------------------------------

interface SearchOverlayProps {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSelectVerse: (chapter: number, verse: number) => void;
}

function SearchOverlay({
  visible,
  onClose,
  onSelectVerse,
}: SearchOverlayProps): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [input, setInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Slide-up animation — 350ms lotusBloom, parity with SacredBottomSheet.
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(visible ? 1 : 0, {
      duration: 350,
      easing: lotusBloom,
    });
  }, [visible, progress]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [
      {
        translateY: (1 - progress.value) * 40,
      },
    ],
  }));

  const handleChange = useCallback((text: string) => {
    setInput(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setKeyword(text.trim());
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  // Cleanup debounce on unmount / close, and reset input on close.
  useEffect(() => {
    if (!visible) {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      setInput('');
      setKeyword('');
    }
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [visible]);

  const isSearching = keyword.length >= SEARCH_MIN_CHARS;
  const { data, isLoading, isError } = useGitaSearchFull(keyword);
  const results: GitaSearchResult[] = data?.results ?? [];

  const renderResult = useCallback<ListRenderItem<GitaSearchResult>>(
    ({ item }) => {
      const v = item.verse;
      return (
        <Pressable
          onPress={() => {
            onSelectVerse(v.chapter, v.verse);
            onClose();
          }}
          accessibilityRole="button"
          accessibilityLabel={`Open verse ${v.chapter}.${v.verse}`}
          style={styles.resultItem}
        >
          <ShlokaCard
            sanskrit={v.sanskrit}
            meaning={v.english}
            reference={`Bhagavad Gita ${v.chapter}.${v.verse}`}
            revealDelay={0}
          />
        </Pressable>
      );
    },
    [onClose, onSelectVerse],
  );

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlayRoot, overlayStyle]}>
        <View style={[styles.overlayHeader, { paddingTop: insets.top + 10 }]}>
          <View style={styles.overlayInputWrap}>
            <Search size={18} color={TEXT_SECONDARY} />
            <TextInput
              value={input}
              onChangeText={handleChange}
              placeholder="Search verses, themes, words…"
              placeholderTextColor={TEXT_MUTED}
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
              returnKeyType="search"
              style={styles.overlayInput}
              accessibilityLabel="Search the Bhagavad Gita"
            />
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close search"
            hitSlop={12}
            style={styles.overlayClose}
          >
            <X size={22} color={TEXT_PRIMARY} />
          </Pressable>
        </View>

        <View style={styles.overlayBody}>
          {!isSearching ? (
            <View style={styles.emptyState}>
              <OmLoader size={48} />
              <Text style={styles.emptyTitle}>Searching the sacred texts…</Text>
              <Text style={styles.emptyHint}>
                Type at least {SEARCH_MIN_CHARS} characters to find verses by theme,
                Sanskrit keyword, or English translation.
              </Text>
            </View>
          ) : isLoading ? (
            <View style={styles.emptyState}>
              <OmLoader size={56} label="Reflecting on 700 verses…" />
            </View>
          ) : isError ? (
            <View style={styles.emptyState}>
              <Text style={styles.errorTitle}>Unable to search right now</Text>
              <Text style={styles.emptyHint}>
                Please check your connection and try again. Your previously viewed
                verses remain available offline.
              </Text>
            </View>
          ) : results.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyTitle}>No verses found</Text>
              <Text style={styles.emptyHint}>
                Try another keyword — e.g. &ldquo;dharma&rdquo;, &ldquo;karma&rdquo;,
                or &ldquo;surrender&rdquo;.
              </Text>
            </View>
          ) : (
            <FlatList
              data={results}
              renderItem={renderResult}
              keyExtractor={(item) => item.verse.verse_id}
              contentContainerStyle={styles.resultsContent}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              ItemSeparatorComponent={() => <View style={styles.resultSeparator} />}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>
      </Animated.View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ShlokasScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchOpen, setSearchOpen] = useState(false);

  const { data: chapters, isLoading, error, refetch } = useGitaChapters();

  const openChapter = useCallback(
    (chapterId: number) => {
      router.push(`/(tabs)/shlokas/${chapterId}`);
    },
    [router],
  );

  const openVerse = useCallback(
    (chapter: number, verse: number) => {
      router.push(`/(tabs)/shlokas/${chapter}/${verse}`);
    },
    [router],
  );

  const listHeader = useMemo(
    () => (
      <View style={styles.listHeader}>
        <DailyVerse />

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>18 Chapters</Text>
          <Text style={styles.sectionSub}>700 verses · the whole Gita</Text>
        </View>
        <GoldenDivider withGlyph style={styles.sectionDivider} />
      </View>
    ),
    [],
  );

  const renderChapter = useCallback<ListRenderItem<GitaChapter>>(
    ({ item, index }) => (
      <ChapterRow chapter={item} index={index} onPress={openChapter} />
    ),
    [openChapter],
  );

  const listEmpty = (
    <View style={styles.emptyState}>
      {isLoading ? (
        <OmLoader size={64} label="Opening the sacred text…" />
      ) : error ? (
        <>
          <Text style={styles.errorTitle}>Chapters are temporarily unavailable</Text>
          <Text style={styles.emptyHint}>
            Pull down to try again — your bookmarks remain safe offline.
          </Text>
          <Pressable onPress={() => void refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </>
      ) : null}
    </View>
  );

  return (
    <DivineScreenWrapper>
      {/* Header (not inside the scroll so the search action stays reachable) */}
      <View style={styles.header}>
        <View style={styles.headerTitles}>
          <Text
            style={styles.headerSanskrit}
            allowFontScaling
            accessibilityLanguage="sa"
          >
            भगवद गीता
          </Text>
          <Text style={styles.headerEnglish}>Bhagavad Gita</Text>
        </View>
        <Pressable
          onPress={() => setSearchOpen(true)}
          accessibilityRole="button"
          accessibilityLabel="Search verses"
          hitSlop={10}
          style={styles.searchIconButton}
        >
          <Search size={22} color={GOLD} />
        </Pressable>
      </View>

      <FlatList<GitaChapter>
        data={chapters ?? []}
        renderItem={renderChapter}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: insets.bottom + 96 },
        ]}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ItemSeparatorComponent={ChapterSeparator}
        showsVerticalScrollIndicator={false}
      />

      <SearchOverlay
        visible={searchOpen}
        onClose={() => setSearchOpen(false)}
        onSelectVerse={openVerse}
      />
    </DivineScreenWrapper>
  );
}

function ChapterSeparator(): React.JSX.Element {
  return <View style={styles.chapterSeparator} />;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  // Header --------------------------------------------------------------------
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  headerSanskrit: {
    fontFamily: 'NotoSansDevanagari-Bold',
    fontSize: 22,
    lineHeight: 30,
    color: GOLD,
    letterSpacing: 0.3,
  },
  headerEnglish: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_MUTED,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  searchIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: ICON_BG,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },

  // List --------------------------------------------------------------------
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  listHeader: {
    gap: 18,
  },

  // Daily verse --------------------------------------------------------------
  dailyWrap: {
    gap: 8,
    marginBottom: 10,
  },
  dailyLabel: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: GOLD,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  dailyCard: {
    borderColor: GOLD_GLOW,
    borderWidth: 1,
    shadowColor: GOLD,
    shadowOpacity: 0.2,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 0 },
    elevation: 8,
  },
  dailyLoading: {
    paddingVertical: 24,
    alignItems: 'center',
  },

  // Section header ----------------------------------------------------------
  sectionHeader: {
    marginTop: 6,
    gap: 2,
  },
  sectionTitle: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 20,
    lineHeight: 26,
    color: TEXT_PRIMARY,
    letterSpacing: 0.4,
  },
  sectionSub: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 0.6,
  },
  sectionDivider: {
    marginTop: 6,
    marginBottom: 2,
  },

  // Chapter row --------------------------------------------------------------
  chapterBody: {
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  chapterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  chapterCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(212, 160, 23, 0.08)',
  },
  chapterNumber: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 18,
    color: GOLD,
    lineHeight: 22,
  },
  chapterInfo: {
    flex: 1,
    gap: 2,
  },
  chapterSanskrit: {
    fontFamily: 'NotoSansDevanagari-Medium',
    fontSize: 15,
    lineHeight: 22,
    color: GOLD,
  },
  chapterEnglish: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    lineHeight: 18,
    color: TEXT_MUTED,
    letterSpacing: 0.3,
  },
  chapterTrailing: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  versesBadge: {
    minWidth: 30,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    backgroundColor: ICON_BG,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: GOLD_SOFT,
    alignItems: 'center',
  },
  versesBadgeText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: GOLD,
    letterSpacing: 0.4,
  },
  chapterSeparator: {
    height: 10,
  },

  // Empty / error / retry ----------------------------------------------------
  emptyState: {
    paddingVertical: 48,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 18,
    color: TEXT_PRIMARY,
    textAlign: 'center',
  },
  emptyHint: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
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

  // Search overlay ----------------------------------------------------------
  overlayRoot: {
    flex: 1,
    backgroundColor: SURFACE_OVERLAY,
  },
  overlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: GOLD_SOFT,
  },
  overlayInputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(22, 26, 66, 0.85)',
    borderWidth: 1,
    borderColor: GOLD_SOFT,
  },
  overlayInput: {
    flex: 1,
    color: TEXT_PRIMARY,
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    padding: 0,
  },
  overlayClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  overlayBody: {
    flex: 1,
  },
  resultsContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 48,
  },
  resultItem: {
    // ShlokaCard handles its own radius + border.
  },
  resultSeparator: {
    height: 12,
  },
});
