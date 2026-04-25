/**
 * Wisdom → Read More verse reader.
 *
 * Native parity twin of kiaanverse.com/m/kiaan-vibe/verse/[chapterVerse].
 *
 * Layout (top → bottom)
 *   • Header     Back arrow · "BG c.v" + chapter english name · Bell.
 *   • Sub-row    "BG c.v · CHAPTER SANSKRIT NAME (uppercase)" + ‹ › nav.
 *   • Sanskrit   Devanagari verse + verse number "c.v" stamp in gold.
 *   • IAST       Transliteration in italic warm-grey.
 *   • Meaning    English translation in serif body.
 *   • Voices     "LISTENING VOICE" label + 4 voice pills:
 *                  Krishna · Saraswati · Rishi · Nova
 *                Each pill changes the speech rate / locale on play.
 *   • Listen     Primary purple Listen button (TTS via expo-speech) +
 *                bookmark + share.
 *
 * Voice mapping
 *   The web build wires four distinct ElevenLabs / Sarvam personas. On
 *   device we don't have those voices available in the JS layer, so each
 *   voice maps to a unique (rate, language) tuple via expo-speech so the
 *   audio still sounds different. This matches what the web uses for its
 *   browser-SpeechSynthesis fallback.
 */

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Bell,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  Share2,
} from 'lucide-react-native';

import {
  DivineScreenWrapper,
  OmLoader,
  useSpeechOutput,
} from '@kiaanverse/ui';
import { useGitaVerse } from '@kiaanverse/api';
import { getLocalChapter, getLocalVerse } from '@kiaanverse/api';
import { useGitaStore } from '@kiaanverse/store';

// ── Tokens ────────────────────────────────────────────────────────────────
const GOLD = '#D4A017';
const GOLD_BRIGHT = '#E8B54A';
const GOLD_SOFT = 'rgba(212,160,23,0.12)';
const GOLD_BORDER = 'rgba(212,160,23,0.22)';
const TEXT_PRIMARY = '#F5F0E8';
const TEXT_SECONDARY = '#C8BFA8';
const TEXT_MUTED = '#7A7060';
const SURFACE_DIM = 'rgba(22,26,66,0.55)';
const PURPLE_BG = 'rgba(108,79,178,0.18)';
const PURPLE_BORDER = 'rgba(140,103,225,0.45)';
const PURPLE_TEXT = '#C4B5FD';

// ── Voice catalogue (mirrors GITA_STATS.voices on the web) ────────────────
interface VoiceConfig {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  /** TTS rate. expo-speech accepts 0.0–2.0, contemplative pacing under 1. */
  readonly speed: number;
  /** Locale hint passed to expo-speech. Different locales pick different
   *  device voices on Android, which is what makes the four pills audibly
   *  distinct in the absence of premium TTS. */
  readonly language: string;
  /** Pitch shift — Saraswati/Nova lean female, Krishna/Rishi lean male. */
  readonly pitch: number;
  /** Pill colour — chosen for accent only, not gender-coded. */
  readonly color: string;
}

// Note: tuple type — `[VoiceConfig, ...VoiceConfig[]]` — guarantees that
// `VOICES[0]` is always defined so the fallback in `selectedVoice` below
// narrows to `VoiceConfig` rather than `VoiceConfig | undefined`.
const VOICES: readonly [VoiceConfig, ...VoiceConfig[]] = [
  {
    id: 'divine-krishna',
    name: 'Krishna',
    description: 'The divine voice of the Paramatma',
    speed: 0.8,
    language: 'en-IN',
    pitch: 0.95,
    color: '#1B4FBB',
  },
  {
    id: 'divine-saraswati',
    name: 'Saraswati',
    description: 'The goddess of knowledge and sacred speech',
    speed: 0.82,
    language: 'hi-IN',
    pitch: 1.15,
    color: '#9D174D',
  },
  {
    id: 'sarvam-rishi',
    name: 'Rishi',
    description: 'The ancient sage — masculine, grounded',
    speed: 0.85,
    language: 'en-GB',
    pitch: 0.9,
    color: '#B45309',
  },
  {
    id: 'elevenlabs-nova',
    name: 'Nova',
    description: 'Clear and conversational — for newcomers',
    speed: 0.9,
    language: 'en-US',
    pitch: 1.05,
    color: '#0E7490',
  },
];

const DEFAULT_VOICE_ID = 'divine-krishna';

// ── Chapter metadata (1:1 mirror of GITA_MOBILE_CHAPTERS in
// lib/kiaan-vibe/gita-library.ts on the web) ─────────────────────────────
//
// The bundled Gita corpus stores chapter names like "The Yoga of Knowledge
// and Renunciation". The web Wisdom reader uses a hand-curated short
// English title ("Knowledge & Renunciation") and the IAST chapter
// transliteration ("Jnana Karma Sannyas Yoga") for the header sub-row. We
// embed the same table so the native screen renders identical text instead
// of an ad-hoc derivation from the corpus name.
interface ChapterMeta {
  readonly transliteration: string;
  readonly english: string;
}

const CHAPTER_META: Record<number, ChapterMeta> = {
  1: { transliteration: 'Arjuna Vishada Yoga', english: "Arjuna's Dejection" },
  2: { transliteration: 'Sankhya Yoga', english: 'Transcendental Knowledge' },
  3: { transliteration: 'Karma Yoga', english: 'Path of Action' },
  4: { transliteration: 'Jnana Karma Sannyas Yoga', english: 'Knowledge & Renunciation' },
  5: { transliteration: 'Karma Sannyas Yoga', english: 'Renunciation of Action' },
  6: { transliteration: 'Atma Samyama Yoga', english: 'Self-Mastery through Meditation' },
  7: { transliteration: 'Jnana Vijnana Yoga', english: 'Knowledge of the Absolute' },
  8: { transliteration: 'Aksara Brahma Yoga', english: 'Attaining the Supreme' },
  9: { transliteration: 'Raja Vidya Raja Guhya Yoga', english: 'The Royal Knowledge' },
  10: { transliteration: 'Vibhuti Yoga', english: 'Divine Manifestations' },
  11: { transliteration: 'Vishwarupa Darsana Yoga', english: 'The Universal Form' },
  12: { transliteration: 'Bhakti Yoga', english: 'Path of Devotion' },
  13: { transliteration: 'Kshetra Yoga', english: 'Field & Knower of Field' },
  14: { transliteration: 'Guna Traya Yoga', english: 'The Three Modes of Nature' },
  15: { transliteration: 'Purushottama Yoga', english: 'The Supreme Person' },
  16: { transliteration: 'Daivasura Yoga', english: 'Divine & Demonic Qualities' },
  17: { transliteration: 'Shraddha Traya Yoga', english: 'Three Types of Faith' },
  18: { transliteration: 'Moksha Sannyas Yoga', english: 'Liberation Through Renunciation' },
};

export default function ReadMoreVerseScreen(): React.JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { chapter, verse } = useLocalSearchParams<{
    chapter: string;
    verse: string;
  }>();

  const chapterNum = Number(chapter);
  const verseNum = Number(verse);
  const paramsValid =
    Number.isInteger(chapterNum) &&
    Number.isInteger(verseNum) &&
    chapterNum > 0 &&
    verseNum > 0;

  const verseId = paramsValid ? `${chapterNum}.${verseNum}` : '';

  // ── Store ───────────────────────────────────────────────────────────────
  const addRecentlyViewed = useGitaStore((s) => s.addRecentlyViewed);
  const toggleBookmark = useGitaStore((s) => s.toggleBookmark);
  const isBookmarked = useGitaStore(
    (s) => verseId.length > 0 && s.bookmarkedVerseIds.includes(verseId),
  );

  // ── Verse data (offline-first via the bundled corpus) ───────────────────
  const { data: verseData, isLoading } = useGitaVerse(
    paramsValid ? chapterNum : 0,
    paramsValid ? verseNum : 0,
  );

  /**
   * Chapter metadata is needed for the sub-header ("BG 4.38 · JNANA KARMA
   * SANNYAS YOGA") and the navigation arrows (verseCount). The local
   * corpus already has chapter sanskrit + english names for all 18
   * chapters and is synchronous, so we don't need an extra hook.
   */
  const chapterMeta = useMemo(
    () => (paramsValid ? getLocalChapter(chapterNum) : undefined),
    [chapterNum, paramsValid],
  );

  /**
   * If the verse query hasn't returned yet, fall back to the bundled
   * corpus directly so the screen still paints content immediately. The
   * useGitaVerse hook reads from the same corpus, so this is just a
   * shortcut, not a divergent code path.
   */
  const fallbackVerse = useMemo(
    () => (paramsValid ? getLocalVerse(chapterNum, verseNum) : undefined),
    [chapterNum, paramsValid, verseNum],
  );

  // Add to recently-viewed once on mount per chapter/verse.
  useEffect(() => {
    if (paramsValid)
      addRecentlyViewed({ chapter: chapterNum, verse: verseNum });
  }, [addRecentlyViewed, chapterNum, paramsValid, verseNum]);

  // ── Voice picker state ──────────────────────────────────────────────────
  const [selectedVoiceId, setSelectedVoiceId] =
    useState<string>(DEFAULT_VOICE_ID);
  const selectedVoice =
    VOICES.find((v) => v.id === selectedVoiceId) ?? VOICES[0];

  const { speak, stop, isSpeaking } = useSpeechOutput({
    rate: selectedVoice.speed,
    pitch: selectedVoice.pitch,
    language: selectedVoice.language,
  });

  // Stop any ongoing playback if the user switches voices mid-utterance —
  // expo-speech will otherwise queue and the caller can't tell which voice
  // is "active" any more.
  const handleSelectVoice = useCallback(
    (voiceId: string) => {
      void Haptics.selectionAsync().catch(() => undefined);
      stop();
      setSelectedVoiceId(voiceId);
    },
    [stop],
  );

  // ── Resolved verse content ──────────────────────────────────────────────
  const sanskrit = verseData?.sanskrit ?? fallbackVerse?.sanskrit ?? '';
  const transliteration =
    verseData?.transliteration ?? fallbackVerse?.transliteration ?? '';
  const translation = verseData?.translation ?? fallbackVerse?.english ?? '';

  // Curated chapter metadata mirrors the web Wisdom reader exactly. Falls
  // back to the bundled corpus name only if a chapter index is somehow
  // missing from the table (shouldn't happen — all 18 are present).
  const curatedMeta = CHAPTER_META[chapterNum];
  const chapterEnglish =
    curatedMeta?.english ??
    chapterMeta?.nameEnglish?.replace(/^The Yoga of\s+/i, '') ??
    `Chapter ${chapterNum}`;
  const chapterUpperLatin = useMemo(
    () => (curatedMeta?.transliteration ?? '').toUpperCase(),
    [curatedMeta],
  );
  const chapterSanskritName = chapterMeta?.nameSanskrit ?? '';

  // ── Listen ──────────────────────────────────────────────────────────────
  const handleListen = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => undefined,
    );
    if (isSpeaking) {
      stop();
      return;
    }
    // The Sanskrit verse is the primary audio target; if the device's
    // Devanagari TTS is unavailable expo-speech will fall through to the
    // English translation so the user always hears something meaningful.
    const utterance = sanskrit.length > 0 ? sanskrit : translation;
    if (utterance.length === 0) return;
    speak(utterance);
  }, [isSpeaking, sanskrit, speak, stop, translation]);

  // ── Bookmark / share ────────────────────────────────────────────────────
  const handleBookmark = useCallback(() => {
    if (!paramsValid) return;
    void Haptics.impactAsync(
      isBookmarked
        ? Haptics.ImpactFeedbackStyle.Light
        : Haptics.ImpactFeedbackStyle.Medium,
    ).catch(() => undefined);
    toggleBookmark(verseId);
  }, [isBookmarked, paramsValid, toggleBookmark, verseId]);

  const handleShare = useCallback(async () => {
    if (!paramsValid) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(
      () => undefined,
    );
    const message = [
      `Bhagavad Gita ${chapterNum}.${verseNum}`,
      '',
      sanskrit,
      transliteration,
      '',
      translation,
      '',
      '— Shared from Kiaanverse',
    ]
      .filter((line) => line !== undefined)
      .join('\n');
    try {
      await Share.share({
        message,
        title: `BG ${chapterNum}.${verseNum}`,
      });
    } catch {
      // User cancelled the share sheet — no rollback needed.
    }
  }, [
    chapterNum,
    paramsValid,
    sanskrit,
    transliteration,
    translation,
    verseNum,
  ]);

  // ── Navigation between verses ───────────────────────────────────────────
  const goToVerse = useCallback(
    (delta: -1 | 1) => {
      if (!chapterMeta) return;
      let newChapter = chapterNum;
      let newVerse = verseNum + delta;

      if (newVerse < 1) {
        const prev = getLocalChapter(chapterNum - 1);
        if (!prev) return;
        newChapter = prev.chapter;
        newVerse = prev.verseCount;
      } else if (newVerse > chapterMeta.verseCount) {
        const next = getLocalChapter(chapterNum + 1);
        if (!next) return;
        newChapter = next.chapter;
        newVerse = 1;
      }

      void Haptics.selectionAsync().catch(() => undefined);
      stop();
      router.replace(`/wisdom/verse/${newChapter}/${newVerse}` as never);
    },
    [chapterMeta, chapterNum, router, stop, verseNum],
  );

  // ── Empty / error states ────────────────────────────────────────────────
  if (!paramsValid) {
    return (
      <DivineScreenWrapper>
        <Header
          title="Verse"
          insetTop={insets.top}
          onBack={() => router.back()}
          onBell={() => router.push('/(app)/notifications' as never)}
        />
        <View style={styles.stateBox}>
          <Text style={styles.stateTitle}>Verse reference is invalid</Text>
          <Text style={styles.stateBody}>
            A valid verse looks like 4.38. Return to Wisdom and tap a verse to
            open it.
          </Text>
        </View>
      </DivineScreenWrapper>
    );
  }

  if (isLoading && !sanskrit) {
    return (
      <DivineScreenWrapper>
        <Header
          title={`BG ${chapterNum}.${verseNum}`}
          subtitle={chapterEnglish}
          insetTop={insets.top}
          onBack={() => router.back()}
          onBell={() => router.push('/(app)/notifications' as never)}
        />
        <View style={styles.stateBox}>
          <OmLoader size={64} label="Unveiling the verse…" />
        </View>
      </DivineScreenWrapper>
    );
  }

  return (
    <DivineScreenWrapper>
      <Header
        title={`BG ${chapterNum}.${verseNum}`}
        subtitle={chapterEnglish}
        insetTop={insets.top}
        onBack={() => router.back()}
        onBell={() => router.push('/(app)/notifications' as never)}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Sub-header row: chapter ref + nav arrows */}
        <View style={styles.subHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.subRef} numberOfLines={1}>
              {`BG ${chapterNum}.${verseNum}`}
              {chapterUpperLatin
                ? `  ·  ${chapterUpperLatin}`
                : chapterSanskritName
                  ? `  ·  ${chapterSanskritName}`
                  : ''}
            </Text>
          </View>
          <View style={styles.navArrows}>
            <NavArrow
              onPress={() => goToVerse(-1)}
              accessibilityLabel="Previous verse"
              icon={<ChevronLeft size={18} color={GOLD} />}
            />
            <NavArrow
              onPress={() => goToVerse(1)}
              accessibilityLabel="Next verse"
              icon={<ChevronRight size={18} color={GOLD} />}
            />
          </View>
        </View>

        {/* Sanskrit body */}
        {sanskrit ? (
          <Animated.View
            entering={FadeInDown.duration(420)}
            style={styles.sanskritBlock}
          >
            <Text
              style={styles.sanskrit}
              accessibilityLanguage="sa"
              allowFontScaling
            >
              {sanskrit}
            </Text>
            <Text style={styles.verseStamp}>{`${chapterNum}.${verseNum}`}</Text>
          </Animated.View>
        ) : null}

        <Divider />

        {/* Transliteration */}
        {transliteration ? (
          <Animated.View entering={FadeIn.delay(160).duration(360)}>
            <Text style={styles.translit}>{transliteration}</Text>
          </Animated.View>
        ) : null}

        <Divider />

        {/* Translation */}
        {translation ? (
          <Animated.View entering={FadeIn.delay(220).duration(360)}>
            <Text style={styles.translation}>{translation}</Text>
          </Animated.View>
        ) : null}

        {/* Listening voice picker */}
        <Animated.View
          entering={FadeIn.delay(280).duration(360)}
          style={styles.voiceSection}
        >
          <Text style={styles.voiceLabel}>LISTENING VOICE</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.voiceRow}
          >
            {VOICES.map((voice) => {
              const selected = voice.id === selectedVoiceId;
              return (
                <Pressable
                  key={voice.id}
                  onPress={() => handleSelectVoice(voice.id)}
                  style={[
                    styles.voicePill,
                    selected
                      ? {
                          backgroundColor: voice.color + '22',
                          borderColor: voice.color + '88',
                        }
                      : null,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`${voice.name} voice`}
                  accessibilityState={{ selected }}
                >
                  <Text
                    style={[
                      styles.voicePillText,
                      selected
                        ? { color: voice.color, fontWeight: '600' }
                        : null,
                    ]}
                  >
                    {voice.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.voiceDescription}>{selectedVoice.description}</Text>
          <Text style={styles.voiceNote}>
            {`${selectedVoice.name}'s voice is set to ${selectedVoice.speed.toFixed(2).replace(/0$/, '')}× for sacred reverence`}
          </Text>
        </Animated.View>

        {/* Listen + bookmark + share */}
        <Animated.View
          entering={FadeIn.delay(340).duration(360)}
          style={styles.actionRow}
        >
          <Pressable
            onPress={handleListen}
            style={({ pressed }) => [
              styles.listenBtn,
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={isSpeaking ? 'Stop listening' : 'Listen'}
          >
            <LinearGradient
              colors={['rgba(140,103,225,0.30)', 'rgba(108,79,178,0.20)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {isSpeaking ? (
              <Pause size={18} color={PURPLE_TEXT} fill={PURPLE_TEXT} />
            ) : (
              <Play size={18} color={PURPLE_TEXT} fill={PURPLE_TEXT} />
            )}
            <Text style={styles.listenText}>
              {isSpeaking ? 'Stop' : 'Listen'}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleBookmark}
            style={({ pressed }) => [
              styles.iconBtn,
              isBookmarked && {
                backgroundColor: GOLD_SOFT,
                borderColor: GOLD_BORDER,
              },
              pressed && { opacity: 0.8 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={
              isBookmarked ? 'Remove bookmark' : 'Bookmark verse'
            }
            accessibilityState={{ selected: isBookmarked }}
          >
            {isBookmarked ? (
              <BookmarkCheck size={20} color={GOLD} fill={GOLD} />
            ) : (
              <Bookmark size={20} color={TEXT_SECONDARY} />
            )}
          </Pressable>

          <Pressable
            onPress={handleShare}
            style={({ pressed }) => [
              styles.iconBtn,
              pressed && { opacity: 0.8 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Share verse"
          >
            <Share2 size={20} color={TEXT_SECONDARY} />
          </Pressable>
        </Animated.View>
      </ScrollView>
    </DivineScreenWrapper>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────

interface HeaderProps {
  readonly title: string;
  readonly subtitle?: string;
  readonly insetTop: number;
  readonly onBack: () => void;
  readonly onBell: () => void;
}

function Header({
  title,
  subtitle,
  insetTop,
  onBack,
  onBell,
}: HeaderProps): React.JSX.Element {
  return (
    <View style={[styles.header, { paddingTop: insetTop + 8 }]}>
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go back"
        hitSlop={12}
        style={styles.headerBtn}
      >
        <ChevronLeft size={22} color={TEXT_PRIMARY} />
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

      <Pressable
        onPress={onBell}
        accessibilityRole="button"
        accessibilityLabel="Open notifications"
        hitSlop={12}
        style={styles.headerBtn}
      >
        <Bell size={20} color={TEXT_PRIMARY} />
      </Pressable>
    </View>
  );
}

function NavArrow({
  onPress,
  icon,
  accessibilityLabel,
}: {
  readonly onPress: () => void;
  readonly icon: React.ReactNode;
  readonly accessibilityLabel: string;
}): React.JSX.Element {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      style={({ pressed }) => [
        styles.navArrow,
        pressed && { opacity: 0.7 },
      ]}
    >
      {icon}
    </Pressable>
  );
}

function Divider(): React.JSX.Element {
  return (
    <LinearGradient
      colors={['transparent', 'rgba(212,160,23,0.30)', 'transparent']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.divider}
    />
  );
}

// ── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 8,
    gap: 8,
  },
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  headerTitle: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 20,
    color: TEXT_PRIMARY,
  },
  headerSubtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: '#9FB7C7',
    letterSpacing: 0.4,
  },

  // Sub-header
  scroll: {
    paddingHorizontal: 20,
    gap: 18,
  },
  subHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  subRef: {
    fontFamily: 'Outfit-Medium',
    fontSize: 11,
    letterSpacing: 1.4,
    color: GOLD,
  },
  navArrows: {
    flexDirection: 'row',
    gap: 8,
  },
  navArrow: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GOLD_SOFT,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
  },

  // Sanskrit
  sanskritBlock: {
    gap: 6,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontStyle: 'italic',
    fontSize: 22,
    lineHeight: 40,
    color: GOLD_BRIGHT,
  },
  verseStamp: {
    fontFamily: 'CormorantGaramond-SemiBoldItalic',
    fontSize: 22,
    color: GOLD,
    marginTop: 6,
  },

  // Divider
  divider: {
    height: 1,
    width: '100%',
  },

  // Transliteration
  translit: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    lineHeight: 24,
    color: TEXT_SECONDARY,
  },

  // Translation
  translation: {
    fontFamily: 'Outfit-Regular',
    fontSize: 15,
    lineHeight: 26,
    color: TEXT_PRIMARY,
  },

  // Voice section
  voiceSection: {
    gap: 10,
  },
  voiceLabel: {
    fontFamily: 'Outfit-Medium',
    fontSize: 11,
    letterSpacing: 1.4,
    color: TEXT_MUTED,
  },
  voiceRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  voicePill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GOLD_BORDER,
    backgroundColor: 'transparent',
  },
  voicePillText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    color: TEXT_SECONDARY,
  },
  voiceDescription: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: TEXT_SECONDARY,
    marginTop: 4,
  },
  voiceNote: {
    fontFamily: 'Outfit-Regular',
    fontSize: 11,
    color: TEXT_MUTED,
  },

  // Listen + actions
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listenBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PURPLE_BG,
    borderWidth: 1,
    borderColor: PURPLE_BORDER,
    overflow: 'hidden',
  },
  listenText: {
    fontFamily: 'Outfit-SemiBold',
    fontSize: 15,
    color: PURPLE_TEXT,
    letterSpacing: 0.4,
  },
  iconBtn: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: SURFACE_DIM,
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.15)',
  },

  // States
  stateBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  stateTitle: {
    fontFamily: 'CormorantGaramond-SemiBold',
    fontSize: 18,
    color: '#E57373',
    textAlign: 'center',
  },
  stateBody: {
    fontFamily: 'Outfit-Regular',
    fontSize: 13,
    lineHeight: 20,
    color: TEXT_SECONDARY,
    textAlign: 'center',
  },
});
