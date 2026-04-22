/**
 * GitaBrowser — 18-chapter Bhagavad Gita grid embedded inside the Vibe
 * Player's "Gita" tab.
 *
 * Rather than duplicating the full shlokas stack (search, daily verse,
 * verse detail) inside the Vibe Player, this surface is intentionally
 * lightweight: it lists the 18 chapters with their Sanskrit + English
 * names and verse count, and tapping a chapter navigates into the
 * existing `/(tabs)/shlokas/{chapter}` stack for the full verse reader.
 *
 * The verse-count numbers are canonical (the backend's MeditationVerseDB
 * matches them) and the Sanskrit names are the same list already used by
 * `app/(tabs)/shlokas/index.tsx` so the two surfaces never disagree.
 */

import React, { useCallback } from 'react';
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

interface ChapterRow {
  readonly num: number;
  readonly english: string;
  readonly sanskrit: string;
  readonly verses: number;
}

const CHAPTERS: ReadonlyArray<ChapterRow> = [
  { num: 1,  english: 'Arjuna Vishada Yoga',     sanskrit: 'अर्जुन विषाद योग',              verses: 47 },
  { num: 2,  english: 'Sankhya Yoga',            sanskrit: 'सांख्य योग',                    verses: 72 },
  { num: 3,  english: 'Karma Yoga',              sanskrit: 'कर्म योग',                       verses: 43 },
  { num: 4,  english: 'Jnana Karma Sanyasa Yoga', sanskrit: 'ज्ञान कर्म संन्यास योग',        verses: 42 },
  { num: 5,  english: 'Karma Sanyasa Yoga',      sanskrit: 'कर्म संन्यास योग',              verses: 29 },
  { num: 6,  english: 'Dhyana Yoga',             sanskrit: 'आत्म संयम योग',                 verses: 47 },
  { num: 7,  english: 'Jnana Vijnana Yoga',      sanskrit: 'ज्ञान विज्ञान योग',              verses: 30 },
  { num: 8,  english: 'Aksara Brahma Yoga',      sanskrit: 'अक्षर ब्रह्म योग',              verses: 28 },
  { num: 9,  english: 'Raja Vidya Yoga',         sanskrit: 'राज विद्या राज गुह्य योग',       verses: 34 },
  { num: 10, english: 'Vibhuti Yoga',            sanskrit: 'विभूति योग',                    verses: 42 },
  { num: 11, english: 'Vishvarupa Darshana Yoga', sanskrit: 'विश्वरूप दर्शन योग',            verses: 55 },
  { num: 12, english: 'Bhakti Yoga',             sanskrit: 'भक्ति योग',                      verses: 20 },
  { num: 13, english: 'Kshetra Kshetrajna Yoga', sanskrit: 'क्षेत्र क्षेत्रज्ञ विभाग योग',   verses: 35 },
  { num: 14, english: 'Gunatraya Vibhaga Yoga',  sanskrit: 'गुणत्रय विभाग योग',             verses: 27 },
  { num: 15, english: 'Purushottama Yoga',       sanskrit: 'पुरुषोत्तम योग',                verses: 20 },
  { num: 16, english: 'Daivasura Sampad Yoga',   sanskrit: 'दैवासुर संपद विभाग योग',         verses: 24 },
  { num: 17, english: 'Shraddhatraya Yoga',      sanskrit: 'श्रद्धात्रय विभाग योग',          verses: 28 },
  { num: 18, english: 'Moksha Sanyasa Yoga',     sanskrit: 'मोक्ष संन्यास योग',              verses: 78 },
];

const GOLD = '#D4A017';
const GOLD_SOFT = 'rgba(212,160,23,0.22)';
const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.65)';
const CARD_BG = 'rgba(17,20,53,0.65)';

function ChapterCard({
  row,
  onPress,
}: {
  row: ChapterRow;
  onPress: (n: number) => void;
}): React.JSX.Element {
  const handlePress = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    onPress(row.num);
  }, [row.num, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      style={styles.card}
      accessibilityRole="button"
      accessibilityLabel={`Open chapter ${row.num}, ${row.english}, ${row.verses} verses`}
    >
      <View style={styles.numBadge}>
        <Text style={styles.numText}>{row.num}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardSanskrit} numberOfLines={1}>
          {row.sanskrit}
        </Text>
        <Text style={styles.cardEnglish} numberOfLines={1}>
          {row.english}
        </Text>
        <Text style={styles.cardMeta}>{row.verses} verses</Text>
      </View>
    </Pressable>
  );
}

export function GitaBrowser(): React.JSX.Element {
  const router = useRouter();

  const handleChapterPress = useCallback(
    (num: number) => {
      // Route into the existing shlokas stack — the `href:null` tab entry
      // in `(tabs)/_layout.tsx` keeps the route valid even though Shlokas
      // is no longer visible in the bottom bar.
      router.push(`/(tabs)/shlokas/${num}` as never);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<ChapterRow>) => (
      <ChapterCard row={item} onPress={handleChapterPress} />
    ),
    [handleChapterPress],
  );

  const keyExtractor = useCallback((item: ChapterRow) => String(item.num), []);

  return (
    <FlatList
      data={CHAPTERS}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.headerTitle}>श्रीमद्भगवद्गीता</Text>
          <Text style={styles.headerEnglish}>Bhagavad Gita</Text>
          <Text style={styles.headerMeta}>18 Chapters · 700 Verses</Text>
        </View>
      }
      ItemSeparatorComponent={Separator}
    />
  );
}

function Separator(): React.JSX.Element {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 48,
  },
  header: {
    paddingTop: 4,
    paddingBottom: 14,
    gap: 4,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 22,
    color: GOLD,
    letterSpacing: 0.4,
  },
  headerEnglish: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 16,
    color: SACRED_WHITE,
  },
  headerMeta: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    letterSpacing: 0.4,
    marginTop: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: CARD_BG,
  },
  numBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: 'rgba(212,160,23,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numText: {
    fontFamily: 'CormorantGaramond-Bold',
    fontSize: 18,
    color: GOLD,
  },
  cardBody: {
    flex: 1,
    gap: 2,
  },
  cardSanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 15,
    color: GOLD,
  },
  cardEnglish: {
    fontFamily: 'CormorantGaramond-Regular',
    fontSize: 14,
    color: SACRED_WHITE,
  },
  cardMeta: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
    marginTop: 2,
  },
  separator: {
    height: 10,
  },
});
