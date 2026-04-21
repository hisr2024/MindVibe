/**
 * Shlokas → Verse Detail
 *
 * Full ShlokaCard with Sanskrit + transliteration + meaning + chapter ref,
 * plus a DivineButton for "Ask Sakha about this verse" and a Share action.
 *
 * Data:
 *   GET /api/gita/verses/:chapter/:verse   (via useGitaVerseDetail)
 *   GET /api/gita/translations/:verse_id   (via useGitaTranslations)
 *
 * NOTE: verse-as-image share requires react-native-view-shot which is not
 * currently part of the workspace. Until that dep is added we fall back to
 * the built-in `Share` API with a formatted plain-text payload, which is
 * what the legacy verse detail screen already uses.
 *
 * Background: DivineScreenWrapper on mount.
 */

import React, { useCallback, useEffect } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Bookmark, BookmarkCheck, ChevronLeft, Share2, Sparkles } from 'lucide-react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  DivineButton,
  DivineScreenWrapper,
  GoldenDivider,
  OmLoader,
  ShlokaCard,
} from '@kiaanverse/ui';
import {
  useGitaTranslations,
  useGitaVerseDetail,
} from '@kiaanverse/api';
import { useGitaStore } from '@kiaanverse/store';

const GOLD = '#D4A017';
const GOLD_SOFT = 'rgba(212, 160, 23, 0.35)';
const TEXT_PRIMARY = '#F5F0E8';
const TEXT_SECONDARY = '#C8BFA8';
const TEXT_MUTED = '#7A7060';
const ICON_BG = 'rgba(212, 160, 23, 0.10)';

export default function VerseDetailScreen(): React.JSX.Element {
  const { chapter, verse } = useLocalSearchParams<{
    chapter: string;
    verse: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const chapterNum = Number(chapter);
  const verseNum = Number(verse);
  const paramsValid =
    Number.isInteger(chapterNum) &&
    Number.isInteger(verseNum) &&
    chapterNum > 0 &&
    verseNum > 0;

  const verseId = paramsValid ? `${chapterNum}.${verseNum}` : '';

  const addRecentlyViewed = useGitaStore((s) => s.addRecentlyViewed);
  const toggleBookmark = useGitaStore((s) => s.toggleBookmark);
  const isBookmarked = useGitaStore((s) =>
    verseId.length > 0 && s.bookmarkedVerseIds.includes(verseId),
  );

  const { data, isLoading, error, refetch } = useGitaVerseDetail(
    paramsValid ? chapterNum : 0,
    paramsValid ? verseNum : 0,
  );
  const { data: translations } = useGitaTranslations(verseId);

  useEffect(() => {
    if (paramsValid) addRecentlyViewed({ chapter: chapterNum, verse: verseNum });
  }, [addRecentlyViewed, chapterNum, paramsValid, verseNum]);

  const handleToggleBookmark = useCallback(() => {
    if (!paramsValid || verseId.length === 0) return;
    void Haptics.impactAsync(
      isBookmarked
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium,
    ).catch(() => {
      // Haptics unavailable (simulator / tests) — silent.
    });
    toggleBookmark(verseId);
  }, [isBookmarked, paramsValid, toggleBookmark, verseId]);

  const handleShare = useCallback(async () => {
    if (!data?.verse) return;
    const v = data.verse;
    const reference = `Bhagavad Gita ${v.chapter}.${v.verse}`;
    const translit = translations?.translations?.transliteration?.trim() ?? '';
    const message = [
      reference,
      '',
      v.sanskrit,
      translit,
      '',
      v.english,
      '',
      '— Shared from Kiaanverse',
    ]
      .filter((l) => l !== undefined)
      .join('\n');

    try {
      await Share.share({ message, title: reference });
    } catch {
      // User cancelled or share sheet failed — no state to roll back.
    }
  }, [data, translations]);

  const handleAskSakha = useCallback(() => {
    if (!data?.verse) return;
    const v = data.verse;
    const reference = `Bhagavad Gita ${v.chapter}.${v.verse}`;
    const prefill = [
      `Please explain ${reference}:`,
      '',
      v.sanskrit,
      '',
      v.english,
    ].join('\n');

    // Push directly to the Chat tab (the visible Sakha screen) with the
    // pre-filled context. The chat screen listens to `context` on mount.
    router.push({
      pathname: '/(tabs)/chat',
      params: { context: prefill, verseId: `${v.chapter}.${v.verse}` },
    });
  }, [data, router]);

  if (!paramsValid) {
    return (
      <DivineScreenWrapper>
        <Header title="Unknown verse" onBack={() => router.back()} />
        <View style={styles.state}>
          <Text style={styles.errorTitle}>Verse reference is invalid</Text>
          <Text style={styles.stateHint}>
            A valid verse looks like 2.47. Please return to the chapter and
            choose a verse from the list.
          </Text>
        </View>
      </DivineScreenWrapper>
    );
  }

  if (isLoading && !data) {
    return (
      <DivineScreenWrapper>
        <Header
          title={`Chapter ${chapterNum} · Verse ${verseNum}`}
          onBack={() => router.back()}
        />
        <View style={styles.state}>
          <OmLoader size={72} label="Unveiling the verse…" />
        </View>
      </DivineScreenWrapper>
    );
  }

  if ((error && !data) || !data?.verse) {
    return (
      <DivineScreenWrapper>
        <Header
          title={`Chapter ${chapterNum} · Verse ${verseNum}`}
          onBack={() => router.back()}
        />
        <View style={styles.state}>
          <Text style={styles.errorTitle}>Unable to open this verse</Text>
          <Text style={styles.stateHint}>
            Please check your connection. Previously viewed verses remain
            available offline.
          </Text>
          <Pressable onPress={() => void refetch()} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </DivineScreenWrapper>
    );
  }

  const v = data.verse;
  const translit = translations?.translations?.transliteration ?? '';
  const reference = `Bhagavad Gita ${v.chapter}.${v.verse}`;

  return (
    <DivineScreenWrapper>
      <Header
        title={reference}
        subtitle={v.theme ? v.theme.replace(/_/g, ' ') : undefined}
        onBack={() => router.back()}
        isBookmarked={isBookmarked}
        onToggleBookmark={handleToggleBookmark}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 48 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(520).springify()}>
          {translit ? (
            <ShlokaCard
              sanskrit={v.sanskrit}
              transliteration={translit}
              meaning={v.english}
              reference={reference}
            />
          ) : (
            <ShlokaCard
              sanskrit={v.sanskrit}
              meaning={v.english}
              reference={reference}
            />
          )}
        </Animated.View>

        {v.hindi ? (
          <Animated.View
            entering={FadeIn.delay(200).duration(400)}
            style={styles.hindiBlock}
          >
            <Text style={styles.hindiLabel}>Hindi</Text>
            <Text
              style={styles.hindiText}
              accessibilityLanguage="hi"
              allowFontScaling
            >
              {v.hindi}
            </Text>
          </Animated.View>
        ) : null}

        {v.principle ? (
          <Animated.View entering={FadeIn.delay(260).duration(400)}>
            <GoldenDivider style={styles.divider} />
            <View style={styles.principleBlock}>
              <Text style={styles.principleLabel}>Principle</Text>
              <Text style={styles.principleText}>{v.principle}</Text>
            </View>
          </Animated.View>
        ) : null}

        <Animated.View
          entering={FadeIn.delay(320).duration(400)}
          style={styles.ctaRow}
        >
          <DivineButton
            title="Ask Sakha about this verse"
            onPress={handleAskSakha}
            variant="primary"
            leftAccessory={<Sparkles size={18} color="#FFFFFF" />}
            accessibilityLabel={`Ask Sakha about ${reference}`}
          />
        </Animated.View>

        <Animated.View
          entering={FadeIn.delay(360).duration(400)}
          style={styles.ctaRow}
        >
          <DivineButton
            title="Share verse"
            onPress={handleShare}
            variant="secondary"
            leftAccessory={<Share2 size={16} color={GOLD} />}
            accessibilityLabel="Share this verse"
          />
        </Animated.View>

        {data.related_verses.length > 0 ? (
          <Animated.View entering={FadeIn.delay(420).duration(400)}>
            <GoldenDivider withGlyph style={styles.divider} />
            <Text style={styles.relatedLabel}>Related verses</Text>
            <View style={styles.relatedList}>
              {data.related_verses.map((r) => (
                <Pressable
                  key={r.verse_id}
                  onPress={() =>
                    router.push(`/(tabs)/shlokas/${r.chapter}/${r.verse}`)
                  }
                  accessibilityRole="button"
                  accessibilityLabel={`Open verse ${r.chapter}.${r.verse}`}
                  style={styles.relatedCard}
                >
                  <Text style={styles.relatedRef}>{r.verse_id}</Text>
                  {r.sanskrit ? (
                    <Text
                      style={styles.relatedSanskrit}
                      numberOfLines={1}
                      accessibilityLanguage="sa"
                    >
                      {r.sanskrit}
                    </Text>
                  ) : null}
                  <Text style={styles.relatedText} numberOfLines={2}>
                    {r.text}
                  </Text>
                </Pressable>
              ))}
            </View>
          </Animated.View>
        ) : null}
      </ScrollView>
    </DivineScreenWrapper>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

interface HeaderProps {
  readonly title: string;
  readonly subtitle?: string | undefined;
  readonly onBack: () => void;
  readonly isBookmarked?: boolean;
  readonly onToggleBookmark?: () => void;
}

function Header({
  title,
  subtitle,
  onBack,
  isBookmarked,
  onToggleBookmark,
}: HeaderProps): React.JSX.Element {
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
      {onToggleBookmark ? (
        <Pressable
          onPress={onToggleBookmark}
          accessibilityRole="button"
          accessibilityLabel={isBookmarked ? 'Remove bookmark' : 'Bookmark this verse'}
          accessibilityState={{ selected: isBookmarked ?? false }}
          hitSlop={12}
          style={styles.backButton}
        >
          {isBookmarked ? (
            <BookmarkCheck size={20} color={GOLD} fill={GOLD} />
          ) : (
            <Bookmark size={20} color={GOLD} />
          )}
        </Pressable>
      ) : (
        <View style={styles.headerSpacer} />
      )}
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
    fontSize: 18,
    lineHeight: 22,
    color: TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 0.4,
    textTransform: 'capitalize',
  },
  headerSpacer: {
    width: 40,
  },

  // Body --------------------------------------------------------------------
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
    gap: 16,
  },

  hindiBlock: {
    paddingHorizontal: 6,
    gap: 4,
  },
  hindiLabel: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: GOLD,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  hindiText: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 15,
    lineHeight: 26,
    color: TEXT_PRIMARY,
  },

  divider: {
    marginVertical: 4,
  },

  principleBlock: {
    paddingHorizontal: 6,
    gap: 4,
  },
  principleLabel: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: GOLD,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  principleText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
    lineHeight: 22,
    color: TEXT_SECONDARY,
  },

  ctaRow: {
    paddingHorizontal: 2,
  },

  // Related -----------------------------------------------------------------
  relatedLabel: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: TEXT_MUTED,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 8,
  },
  relatedList: {
    gap: 10,
  },
  relatedCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: GOLD_SOFT,
    backgroundColor: 'rgba(22, 26, 66, 0.55)',
    padding: 14,
    gap: 4,
  },
  relatedRef: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: GOLD,
    letterSpacing: 0.6,
  },
  relatedSanskrit: {
    fontFamily: 'NotoSansDevanagari-Medium',
    fontSize: 13,
    lineHeight: 20,
    color: GOLD,
  },
  relatedText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_PRIMARY,
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
