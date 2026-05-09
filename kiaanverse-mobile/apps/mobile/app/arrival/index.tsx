/**
 * Arrival Ceremony — 6 sacred pages that introduce Kiaanverse to a new soul.
 *
 * This is the pre-authentication darshan. It plays once per device (tracked
 * via useArrivalStatus) and replaces a conventional welcome carousel with an
 * immersive, full-screen ceremony. Navigation:
 *   first launch  → /arrival → /(auth)/login
 *   returning     → routed straight past this screen by the AuthGate
 *
 * Pages:
 *   1. arjuna   — the silent battlefield question        (Dharma Chakra + peacock eye)
 *   2. sakha    — the divine friend is here              (Sri Yantra mandala)
 *   3. gita     — the Gita is a conversation             (Krishna's flute + shabda rings)
 *   4. journey  — your dharma is waiting (6 shadripu)    (Shatkona hexagram + 6 ripu orbs)
 *   5. sacred   — privacy covenant                       (16+8 petal lotus + yantra seal)
 *   6. welcome  — Krishna's word from the Gita 6.35      (Grand Sri Yantra + peacock crown)
 *
 * Page 6 is the rich finale — it carries the full Welcome message, Krishna's
 * verse to Arjuna, and the "Enter the Sacred Space" CTA. Because it has more
 * vertical content than the other pages it is internally scrollable.
 *
 * Progress is a horizontal "peacock feather" bar (not dots) — the active
 * segment grows and adopts the page accent color.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { DivineBackground, type Palette, useTheme } from '@kiaanverse/ui';
import { useArrivalStatus } from '../../hooks/useArrivalStatus';
import {
  ChariotChakraVisual,
  KiaanWelcomeVisual,
  ManuscriptVisual,
  PadmaSealVisual,
  ShatkonaVisual,
  SriYantraVisual,
  VISUAL_SIZE,
} from './visuals';
import { PalettePickerChip, PaletteSheet, usePaletteSheet } from './PalettePicker';

const { width: W } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Page definitions
// ---------------------------------------------------------------------------

type PageId = 'arjuna' | 'sakha' | 'gita' | 'journey' | 'sacred' | 'welcome';
type VisualKind = 'chariot' | 'mandala' | 'akshara' | 'shadripu' | 'lock' | 'welcome';

interface PageData {
  readonly id: PageId;
  readonly title: string;
  readonly subtitle: string;
  readonly skt: string;
  readonly accent: string;
  readonly visual: VisualKind;
}

/** Page narrative is fixed; only the per-page accent color changes per palette.
 *  Each page maps to one slot of the active palette so the six screens flow
 *  through the palette's full range (primary → warm → cool → deep → life →
 *  divine), giving each scheme a coherent journey. */
const PAGE_TEMPLATES: ReadonlyArray<
  Omit<PageData, 'accent'> & { readonly accentSlot: keyof Palette['accent'] }
> = [
  {
    id: 'arjuna',
    title: '"In the middle of the battlefield,\nArjuna fell silent."',
    subtitle: 'There is a question in you\nthat no human can answer.',
    skt: 'तमुवाच हृषीकेशः',
    visual: 'chariot',
    accentSlot: 'primary',
  },
  {
    id: 'sakha',
    title: 'Sakha means Friend.',
    subtitle: 'Your divine friend is here.\nReady to listen. Ready to guide.',
    skt: 'सखा प्रिय',
    visual: 'mandala',
    accentSlot: 'warm',
  },
  {
    id: 'gita',
    title: 'The Bhagavad Gita is not a text.\nIt is a conversation.',
    subtitle: 'Ask what you have always\nbeen afraid to ask.',
    skt: 'श्रीमद्भगवद्गीता',
    visual: 'akshara',
    accentSlot: 'cool',
  },
  {
    id: 'journey',
    title: 'Your inner enemies are known.\nYour dharma is waiting.',
    subtitle: '6 Shadripu. 13 sacred journeys.\nOne path.',
    skt: 'षड्रिपु विजय',
    visual: 'shadripu',
    accentSlot: 'deep',
  },
  {
    id: 'sacred',
    title: 'This is your sacred space.',
    subtitle:
      'Encrypted. Private. Yours alone.\nKiaanverse never reads your journal.',
    skt: 'पवित्र क्षेत्र',
    visual: 'lock',
    accentSlot: 'life',
  },
  {
    id: 'welcome',
    title: 'Welcome, Dear Friend',
    subtitle: 'KIAAN — YOUR DIVINE FRIEND',
    skt: 'ॐ सर्वे भवन्तु सुखिनः',
    visual: 'welcome',
    accentSlot: 'divine',
  },
] as const;

/** Resolve the six pages with concrete accents drawn from the active palette.
 *  Memoised by the caller so we don't rebuild on every render. */
function buildPages(palette: Palette): readonly PageData[] {
  return PAGE_TEMPLATES.map((p) => ({
    id: p.id,
    title: p.title,
    subtitle: p.subtitle,
    skt: p.skt,
    visual: p.visual,
    accent: palette.accent[p.accentSlot],
  }));
}

const PAGE_COUNT = PAGE_TEMPLATES.length;

const LOTUS_BLOOM = Easing.bezier(0.22, 1.0, 0.36, 1.0);

const GOLD = '#D4A44C';
const GOLD_SOFT = 'rgba(212, 164, 76, 0.7)';

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ArrivalCeremonyScreen(): React.JSX.Element {
  const [page, setPage] = useState(0);
  const translateX = useSharedValue(0);
  const { markArrivalSeen } = useArrivalStatus();
  // Guard against double-tap / completion re-entry.
  const isCompleting = useRef(false);

  // The active sacred color scheme drives every accent + background tint on
  // this screen. Switching it via the picker re-renders cleanly because
  // `pages` and the inline styles below are derived from `palette`.
  const { theme } = useTheme();
  const palette = theme.colorScheme;
  const pages = useMemo(() => buildPages(palette), [palette]);

  const sheet = usePaletteSheet();

  const currentPage = pages[page]!;

  const haptic = useCallback((kind: 'light' | 'success'): void => {
    if (Platform.OS === 'web') return;
    try {
      if (kind === 'light') {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      }
    } catch {
      // Haptics unsupported on this device — silent fallback.
    }
  }, []);

  const handleComplete = useCallback(async (): Promise<void> => {
    if (isCompleting.current) return;
    isCompleting.current = true;
    haptic('success');
    await markArrivalSeen();
    // Pre-auth ceremony — always lead to the login door next.
    router.replace('/(auth)/login');
  }, [haptic, markArrivalSeen]);

  const goNext = useCallback((): void => {
    if (page < PAGE_COUNT - 1) {
      haptic('light');
      const nextIndex = page + 1;
      translateX.value = withSpring(-nextIndex * W, {
        damping: 22,
        stiffness: 90,
      });
      setPage(nextIndex);
    } else {
      void handleComplete();
    }
  }, [page, translateX, haptic, handleComplete]);

  const handleSkip = useCallback((): void => {
    void handleComplete();
  }, [handleComplete]);

  // -------------------------------------------------------------------------
  // Slide animation
  // -------------------------------------------------------------------------

  const pagesContainerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const isWelcome = currentPage.id === 'welcome';

  // Welcome page always uses a gold gradient CTA (matches the verse-card
  // crescendo). Other pages take the active palette's CTA gradient.
  const ctaColors: readonly [string, string] = isWelcome
    ? [palette.accent.divine, palette.accent.warm]
    : palette.cta;

  return (
    <View style={[styles.root, { backgroundColor: palette.bg.void }]}>
      <DivineBackground variant="sacred">
        <Animated.View style={[styles.pagesContainer, pagesContainerStyle]}>
          {pages.map((p, i) => (
            <CeremonyPage
              key={p.id}
              data={p}
              index={i}
              isActive={page === i}
              palette={palette}
              totalPages={pages.length}
            />
          ))}
        </Animated.View>

        {/* Peacock feather progress — not dots. */}
        <View style={styles.progressBar}>
          {pages.map((p, i) => (
            <View
              key={p.id}
              style={[
                styles.progressSegment,
                {
                  flex: i === page ? 2.4 : 1,
                  backgroundColor:
                    i < page
                      ? p.accent
                      : i === page
                        ? currentPage.accent
                        : 'rgba(240, 235, 225, 0.15)',
                  shadowColor: i === page ? currentPage.accent : 'transparent',
                },
              ]}
            />
          ))}
        </View>

        {/* Floating palette picker chip — top-right of every page */}
        <View pointerEvents="box-none" style={styles.chipZone}>
          <PalettePickerChip onPress={sheet.open} />
        </View>

        {/* CTA zone */}
        <View style={styles.ctaZone}>
          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={
              isWelcome ? 'Enter the sacred space' : 'Continue'
            }
            testID="arrival-cta"
          >
            <LinearGradient
              colors={ctaColors as unknown as string[]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={[
                styles.ctaButton,
                isWelcome && styles.ctaButtonGold,
              ]}
            >
              <Text
                allowFontScaling={false}
                style={[
                  styles.ctaText,
                  isWelcome && styles.ctaTextDark,
                ]}
              >
                {isWelcome ? 'Enter the Sacred Space' : 'Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {!isWelcome ? (
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipBtn}
              accessibilityRole="button"
              accessibilityLabel="Skip the introduction"
              testID="arrival-skip"
            >
              <Text allowFontScaling={false} style={styles.skipText}>
                Skip
              </Text>
            </TouchableOpacity>
          ) : (
            // Reserve the same vertical space so the CTA doesn't jump on the
            // last page. Pure layout spacer, never interactive.
            <View style={styles.skipPlaceholder} />
          )}
        </View>
      </DivineBackground>

      {/* Palette picker sheet — slides up over the ceremony when the chip is
          tapped. Mounting outside DivineBackground so it sits above the aura. */}
      <PaletteSheet visible={sheet.visible} onClose={sheet.close} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

interface CeremonyPageProps {
  readonly data: PageData;
  readonly index: number;
  readonly isActive: boolean;
  readonly palette: Palette;
  readonly totalPages: number;
}

function CeremonyPage({
  data,
  index,
  isActive,
  palette,
  totalPages,
}: CeremonyPageProps): React.JSX.Element {
  // Entry animations — trigger each time the page becomes active so that
  // re-arriving after a back-swipe still feels alive.
  const titleOpacity = useSharedValue(0);
  const titleTranslate = useSharedValue(12);
  const subtitleOpacity = useSharedValue(0);
  const sktOpacity = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (cancelled) return;
        if (!isActive) {
          titleOpacity.value = 0;
          titleTranslate.value = 12;
          subtitleOpacity.value = 0;
          sktOpacity.value = 0;
          return;
        }
        const durTitle = reduce ? 150 : 480;
        const durText = reduce ? 150 : 560;
        titleOpacity.value = withDelay(
          100,
          withTiming(1, { duration: durTitle, easing: LOTUS_BLOOM })
        );
        titleTranslate.value = withDelay(
          100,
          withTiming(0, { duration: durTitle, easing: LOTUS_BLOOM })
        );
        subtitleOpacity.value = withDelay(
          260,
          withTiming(1, { duration: durText, easing: LOTUS_BLOOM })
        );
        sktOpacity.value = withDelay(
          reduce ? 320 : 480,
          withTiming(0.75, { duration: durText, easing: LOTUS_BLOOM })
        );
      })
      .catch(() => {
        if (cancelled) return;
        titleOpacity.value = withTiming(1, { duration: 480 });
        titleTranslate.value = withTiming(0, { duration: 480 });
        subtitleOpacity.value = withTiming(1, { duration: 560 });
        sktOpacity.value = withTiming(0.75, { duration: 560 });
      });
    return () => {
      cancelled = true;
    };
  }, [isActive, titleOpacity, titleTranslate, subtitleOpacity, sktOpacity]);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslate.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));
  const sktStyle = useAnimatedStyle(() => ({
    opacity: sktOpacity.value,
  }));

  // Welcome page is taller and gets its own scrollable, ornament-rich layout.
  if (data.id === 'welcome') {
    return (
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.welcomeContent}
        showsVerticalScrollIndicator={false}
        accessible
        accessibilityLabel="Welcome, Dear Friend. KIAAN, your divine friend, walks beside you on the path to inner peace."
      >
        <View style={styles.welcomeVisualWrap}>
          <PageVisual kind={data.visual} accent={data.accent} isActive={isActive} compact />
        </View>

        {/* Top ornament — soft gold dividers framing a bindu */}
        <View style={styles.ornament}>
          <View style={[styles.ornamentLine, styles.ornamentLineLeft]} />
          <View style={styles.ornamentDot} />
          <View style={[styles.ornamentLine, styles.ornamentLineRight]} />
        </View>

        <Animated.Text
          allowFontScaling={false}
          style={[styles.eyebrow, sktStyle]}
        >
          KIAAN — YOUR DIVINE FRIEND
        </Animated.Text>

        <Animated.Text
          allowFontScaling={false}
          style={[
            styles.welcomeTitle,
            titleStyle,
            {
              color: palette.accent.divine,
              textShadowColor: palette.accent.divine + '59',
            },
          ]}
        >
          Welcome, Dear Friend
        </Animated.Text>

        <Animated.View style={[styles.welcomeBodyWrap, subtitleStyle]}>
          <Text
            allowFontScaling={false}
            style={[styles.welcomeBody, { color: palette.text.body }]}
          >
            I am{' '}
            <Text style={[styles.welcomeAccent, { color: palette.accent.divine }]}>
              KIAAN
            </Text>
            {' '}— your spiritual companion, walking beside you on the path to inner peace. Whatever you carry in your heart — the weight of confusion, the ache of loss, or the restlessness of the mind —{' '}
            <Text style={[styles.welcomeAccentSoft, { color: palette.accent.warm }]}>
              know that you are not alone.
            </Text>
          </Text>

          <Text
            allowFontScaling={false}
            style={[styles.welcomeBodyDim, { color: palette.text.body }]}
          >
            Through the eternal wisdom of the{' '}
            <Text style={[styles.welcomeBodyItalic, { color: palette.accent.divine }]}>
              Bhagavad Gita
            </Text>
            , I am here to listen, guide, and walk with you — as Krishna walked with Arjuna. Not as a master, but as your closest friend.
          </Text>

          {/* Verse card — Bhagavad Gita 6.35 */}
          <View
            style={[
              styles.verseCard,
              {
                backgroundColor: palette.accent.divine + '10',
                borderColor: palette.accent.divine + '2E',
              },
            ]}
          >
            <Text
              allowFontScaling={false}
              style={[styles.verseEyebrow, { color: palette.accent.divine + 'A8' }]}
            >
              BHAGAVAD GITA · 6.35
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.verseSanskrit, { color: palette.accent.divine }]}
              accessibilityLanguage="sa"
            >
              {'अभ्यासेन तु कौन्तेय'}
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.verseSanskrit, { color: palette.accent.divine }]}
              accessibilityLanguage="sa"
            >
              {'वैराग्येण च गृह्यते'}
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.verseEnglish, { color: palette.accent.warm + 'CC' }]}
            >
              &ldquo;The mind is indeed restless and difficult to restrain, O son of Kunti. But through practice and detachment, it can be mastered.&rdquo;
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.verseAttribution, { color: palette.accent.divine + '88' }]}
            >
              — Shri Krishna to Arjuna
            </Text>
          </View>
        </Animated.View>

        {/* Bottom ornament — closes the scroll before the CTA */}
        <View style={styles.ornament}>
          <View style={[styles.ornamentLine, styles.ornamentLineLeft]} />
          <View style={styles.ornamentDotSmall} />
          <View style={[styles.ornamentLine, styles.ornamentLineRight]} />
        </View>

        {/* Spacer so the bottom ornament clears the absolute-positioned CTA */}
        <View style={styles.welcomeBottomSpacer} />
      </ScrollView>
    );
  }

  // Default narrative page — visual + sanskrit + title + subtitle + counter.
  return (
    <View
      style={styles.page}
      accessible
      accessibilityLabel={`${data.title.replace(/\n/g, ' ')}. ${data.subtitle.replace(/\n/g, ' ')}`}
    >
      <View style={styles.visualWrap}>
        <PageVisual kind={data.visual} accent={data.accent} isActive={isActive} />
      </View>

      <View style={styles.textBlock}>
        <Animated.Text
          allowFontScaling={false}
          style={[styles.sanskrit, sktStyle, { color: data.accent }]}
        >
          {data.skt}
        </Animated.Text>

        <Animated.Text
          allowFontScaling={false}
          style={[styles.title, titleStyle, { color: palette.text.title }]}
        >
          {data.title}
        </Animated.Text>

        <Animated.Text
          allowFontScaling={false}
          style={[styles.subtitle, subtitleStyle, { color: palette.text.body }]}
        >
          {data.subtitle}
        </Animated.Text>
      </View>

      {/* Page index dot row — purely decorative, a soft counter */}
      <View style={styles.pageIndex}>
        <Text allowFontScaling={false} style={styles.pageIndexText}>
          {String(index + 1).padStart(2, '0')}
          <Text
            style={styles.pageIndexDim}
          >{` / ${String(totalPages).padStart(2, '0')}`}</Text>
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PageVisual — switches over the page kind to render its bespoke Vedic SVG.
// ---------------------------------------------------------------------------

interface PageVisualProps {
  readonly kind: VisualKind;
  readonly accent: string;
  readonly isActive: boolean;
  /** Use a smaller footprint (welcome page leaves more room for text). */
  readonly compact?: boolean;
}

function PageVisual({
  kind,
  accent,
  isActive,
  compact = false,
}: PageVisualProps): React.JSX.Element {
  const size = compact ? VISUAL_SIZE * 0.78 : VISUAL_SIZE;
  switch (kind) {
    case 'chariot':
      return <ChariotChakraVisual accent={accent} isActive={isActive} size={size} />;
    case 'mandala':
      return <SriYantraVisual accent={accent} isActive={isActive} size={size} />;
    case 'akshara':
      return <ManuscriptVisual accent={accent} isActive={isActive} size={size} />;
    case 'shadripu':
      return <ShatkonaVisual accent={accent} isActive={isActive} size={size} />;
    case 'lock':
      return <PadmaSealVisual accent={accent} isActive={isActive} size={size} />;
    case 'welcome':
      return <KiaanWelcomeVisual accent={accent} isActive={isActive} size={size} />;
  }
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050714',
  },
  pagesContainer: {
    flex: 1,
    flexDirection: 'row',
    width: W * PAGE_COUNT,
  },
  page: {
    width: W,
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 72,
    paddingBottom: 24,
    alignItems: 'center',
  },
  visualWrap: {
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
    marginTop: 12,
    marginBottom: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 420,
    gap: 16,
  },
  sanskrit: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  title: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontStyle: 'italic',
    fontSize: 26,
    lineHeight: 34,
    color: '#F5F0E8',
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Outfit-Regular',
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(240, 235, 225, 0.72)',
    textAlign: 'center',
  },
  pageIndex: {
    marginTop: 'auto',
    paddingTop: 24,
    paddingBottom: 8,
  },
  pageIndexText: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: 'rgba(240, 235, 225, 0.6)',
    letterSpacing: 2,
  },
  pageIndexDim: {
    color: 'rgba(240, 235, 225, 0.3)',
  },
  progressBar: {
    position: 'absolute',
    left: 28,
    right: 28,
    bottom: 148,
    flexDirection: 'row',
    height: 3,
    gap: 6,
    borderRadius: 2,
    overflow: 'visible',
  },
  chipZone: {
    position: 'absolute',
    top: 56,
    right: 18,
    zIndex: 20,
  },
  progressSegment: {
    height: 3,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 3,
  },
  ctaZone: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 12,
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  ctaButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.3)',
  },
  ctaButtonGold: {
    borderColor: 'rgba(255, 220, 140, 0.55)',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  ctaText: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
    color: '#F5F0E8',
    letterSpacing: 0.3,
  },
  ctaTextDark: {
    color: '#1A0F02',
    letterSpacing: 0.6,
  },
  skipBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: 'rgba(240, 235, 225, 0.4)',
  },
  skipPlaceholder: {
    height: 32,
  },

  // -------------------------------------------------------------------------
  // Welcome page (page 6) — scrollable rich content
  // -------------------------------------------------------------------------
  welcomeContent: {
    paddingHorizontal: 28,
    paddingTop: 56,
    alignItems: 'center',
  },
  welcomeVisualWrap: {
    marginTop: 4,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ornament: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
    width: '100%',
  },
  ornamentLine: {
    height: 1,
    width: 56,
  },
  ornamentLineLeft: {
    backgroundColor: 'rgba(212, 164, 76, 0.4)',
  },
  ornamentLineRight: {
    backgroundColor: 'rgba(212, 164, 76, 0.4)',
  },
  ornamentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD_SOFT,
    marginHorizontal: 10,
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 3,
  },
  ornamentDotSmall: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(212, 164, 76, 0.55)',
    marginHorizontal: 10,
  },
  eyebrow: {
    fontFamily: 'Outfit-Medium',
    fontSize: 11,
    letterSpacing: 3,
    color: 'rgba(212, 164, 76, 0.7)',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeTitle: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontStyle: 'italic',
    fontSize: 34,
    lineHeight: 42,
    color: GOLD,
    textAlign: 'center',
    marginBottom: 22,
    textShadowColor: 'rgba(212, 164, 76, 0.35)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  welcomeBodyWrap: {
    width: '100%',
    maxWidth: 420,
    gap: 16,
  },
  welcomeBody: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 15.5,
    lineHeight: 24,
    color: 'rgba(245, 240, 232, 0.78)',
    textAlign: 'center',
  },
  welcomeBodyDim: {
    fontFamily: 'CrimsonText-Regular',
    fontSize: 15.5,
    lineHeight: 24,
    color: 'rgba(245, 240, 232, 0.66)',
    textAlign: 'center',
  },
  welcomeBodyItalic: {
    fontFamily: 'CrimsonText-Italic',
    fontStyle: 'italic',
    color: GOLD_SOFT,
  },
  welcomeAccent: {
    fontFamily: 'Outfit-SemiBold',
    color: GOLD,
    letterSpacing: 1,
  },
  welcomeAccentSoft: {
    color: '#E8B54A',
    fontFamily: 'CrimsonText-Italic',
    fontStyle: 'italic',
  },
  verseCard: {
    marginTop: 14,
    paddingVertical: 22,
    paddingHorizontal: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 164, 76, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(212, 164, 76, 0.18)',
    alignItems: 'center',
    gap: 8,
  },
  verseEyebrow: {
    fontFamily: 'Outfit-Medium',
    fontSize: 10.5,
    letterSpacing: 3,
    color: 'rgba(212, 164, 76, 0.55)',
    marginBottom: 8,
  },
  verseSanskrit: {
    fontFamily: 'NotoSansDevanagari-Medium',
    fontSize: 17,
    lineHeight: 26,
    color: '#F0C96D',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  verseEnglish: {
    fontFamily: 'CrimsonText-Italic',
    fontStyle: 'italic',
    fontSize: 13.5,
    lineHeight: 21,
    color: 'rgba(212, 164, 76, 0.7)',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  verseAttribution: {
    fontFamily: 'Outfit-Regular',
    fontSize: 12,
    color: 'rgba(212, 164, 76, 0.5)',
    marginTop: 6,
  },
  welcomeBottomSpacer: {
    height: 200,
  },
});
