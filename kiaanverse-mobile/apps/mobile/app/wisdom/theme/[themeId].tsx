/**
 * Wisdom → Theme detail screen.
 *
 * Lands here from the six mood-ring tiles on the Wisdom landing page
 * (Inner Peace, Courage, Wisdom, Devotion, Right Action, Letting Go).
 * Renders the curated Bhagavad Gita verse list for the selected theme —
 * Sanskrit + IAST transliteration + English translation, each card
 * tappable to push into the full verse reader.
 *
 * Verses are looked up synchronously from the bundled local corpus via
 * `getLocalVerse` so the screen renders the full list in one frame.
 * Unknown theme ids redirect back to the landing page.
 *
 * Translations route through the existing `wisdom` i18n namespace for
 * the header label + tagline; the theme tagline + sanskrit name live
 * in `curatedThemes.ts` as editorial copy (intentionally English-only
 * for now — the same pattern the rest of the Wisdom strings follow
 * until per-locale theme copy is authored).
 */

import React, { useCallback, useMemo } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';

import { DivineScreenWrapper } from '@kiaanverse/ui';
import { getLocalVerse, type LocalGitaVerse } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';

import {
  THEME_VERSE_REFS,
  WISDOM_THEME_META,
  asWisdomThemeId,
  type WisdomThemeId,
} from './curatedThemes';

const TEXT_PRIMARY = '#F5F0E8';
const TEXT_MUTED = 'rgba(240,235,225,0.62)';
const GOLD = '#D4A017';
const CARD_BG = 'rgba(17,20,53,0.62)';
const CARD_BORDER = 'rgba(212,160,23,0.22)';

interface ResolvedVerse {
  readonly chapter: number;
  readonly verse: number;
  readonly verseId: string;
  readonly sanskrit: string;
  readonly transliteration: string;
  readonly english: string;
}

function asResolved(v: LocalGitaVerse | undefined): ResolvedVerse | null {
  if (!v) return null;
  return {
    chapter: v.chapter,
    verse: v.verse,
    verseId: v.verseId,
    sanskrit: v.sanskrit,
    transliteration: v.transliteration,
    english: v.english,
  };
}

export default function WisdomThemeScreen(): React.JSX.Element {
  const { themeId: rawThemeId } = useLocalSearchParams<{ themeId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  const themeId = asWisdomThemeId(rawThemeId);
  // Unknown route — quietly bounce back. We don't render anything for the
  // few frames before navigation completes; DivineScreenWrapper keeps the
  // particle field consistent so the back-pop feels instant.
  if (!themeId) {
    router.replace('/wisdom');
    return <DivineScreenWrapper safeArea={false} />;
  }

  const meta = WISDOM_THEME_META[themeId];
  const refs = THEME_VERSE_REFS[themeId];

  const verses = useMemo<readonly ResolvedVerse[]>(
    () =>
      refs
        .map((ref) => asResolved(getLocalVerse(ref.chapter, ref.verse)))
        .filter((v): v is ResolvedVerse => v !== null),
    [refs],
  );

  const handleBack = useCallback(() => {
    void Haptics.selectionAsync().catch(() => undefined);
    router.back();
  }, [router]);

  const handleOpenVerse = useCallback(
    (chapter: number, verse: number) => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
        () => undefined,
      );
      router.push(`/wisdom/verse/${chapter}/${verse}` as never);
    },
    [router],
  );

  const themeLabel = t(meta.labelKey);

  return (
    <DivineScreenWrapper safeArea={false}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Back to Wisdom"
          hitSlop={12}
          style={styles.backBtn}
        >
          <ChevronLeft size={22} color={TEXT_PRIMARY} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 80 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(360)} style={styles.titleBlock}>
          <Text style={styles.themeEmoji}>{meta.emoji}</Text>
          <Text style={styles.themeSanskrit} allowFontScaling={false}>
            {meta.sanskrit}
          </Text>
          <Text style={styles.themeTitle}>{themeLabel}</Text>
          <Text style={styles.themeTagline}>{meta.tagline}</Text>
          <Text style={styles.versesCount}>
            {verses.length} curated verses
          </Text>
        </Animated.View>

        <View style={styles.cardStack}>
          {verses.map((v, idx) => (
            <Animated.View
              key={v.verseId}
              entering={FadeInDown.delay(80 + idx * 30).duration(320)}
            >
              <Pressable
                onPress={() => handleOpenVerse(v.chapter, v.verse)}
                accessibilityRole="button"
                accessibilityLabel={`Open Bhagavad Gita ${v.chapter}.${v.verse}`}
                style={({ pressed }) => [
                  styles.card,
                  pressed && { opacity: 0.85 },
                ]}
              >
                <LinearGradient
                  colors={['rgba(212,160,23,0.06)', 'rgba(17,20,53,0)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardHeader}>
                  <Text style={styles.cardRef} allowFontScaling={false}>
                    BG {v.chapter}.{v.verse}
                  </Text>
                  <ChevronRight size={16} color={GOLD} />
                </View>
                {v.sanskrit ? (
                  <Text style={styles.sanskrit} numberOfLines={3}>
                    {v.sanskrit}
                  </Text>
                ) : null}
                {v.transliteration ? (
                  <Text style={styles.translit} numberOfLines={2}>
                    {v.transliteration}
                  </Text>
                ) : null}
                <Text style={styles.english} numberOfLines={4}>
                  {v.english}
                </Text>
              </Pressable>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </DivineScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,20,53,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.22)',
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  titleBlock: {
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 22,
  },
  themeEmoji: {
    fontSize: 44,
  },
  themeSanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 18,
    color: GOLD,
    letterSpacing: 0.5,
  },
  themeTitle: {
    fontFamily: 'CormorantGaramond-BoldItalic',
    fontSize: 30,
    color: TEXT_PRIMARY,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  themeTagline: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    color: TEXT_MUTED,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
    paddingHorizontal: 12,
  },
  versesCount: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 10,
    color: TEXT_MUTED,
    letterSpacing: 1.8,
    marginTop: 6,
  },
  cardStack: {
    gap: 12,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: CARD_BG,
    padding: 16,
    overflow: 'hidden',
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardRef: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 11,
    color: GOLD,
    letterSpacing: 1.4,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 16,
    color: TEXT_PRIMARY,
    lineHeight: 26,
  },
  translit: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: TEXT_MUTED,
    lineHeight: 18,
  },
  english: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 14,
    color: TEXT_PRIMARY,
    lineHeight: 20,
  },
});
