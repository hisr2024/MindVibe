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
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
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
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { DivineBackground, type Palette, useTheme } from '@kiaanverse/ui';
import { useTranslation } from '@kiaanverse/i18n';
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
import {
  InlinePaletteSwatches,
  PalettePickerChip,
  PaletteSheet,
  usePaletteSheet,
} from './PalettePicker';

// Use integer pixel widths everywhere on this slider. `Dimensions.get` returns
// a fractional value on many Android devices (e.g. 411.42857) — when that
// fractional W feeds both the page width AND the per-page translateX, Yoga
// rounds the actual rendered widths but the translateX uses the unrounded
// number, so each page lands a fraction of a pixel off. Over 5 transitions
// the drift compounds into a visible right-shift on later pages. Rounding W
// to an integer eliminates the mismatch.
const W = Math.round(Dimensions.get('window').width);

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
 *  divine), giving each scheme a coherent journey.
 *
 *  `titleKey` / `subtitleKey` resolve at render via `t()` from the `arrival`
 *  namespace. `skt` stays literal Devanagari across all locales (brand-fixed
 *  Sanskrit invocations). */
const PAGE_TEMPLATES: ReadonlyArray<
  Omit<PageData, 'accent' | 'title' | 'subtitle'> & {
    readonly titleKey: string;
    readonly subtitleKey: string;
    readonly accentSlot: keyof Palette['accent'];
  }
> = [
  {
    id: 'arjuna',
    titleKey: 'page1Title',
    subtitleKey: 'page1Subtitle',
    skt: 'तमुवाच हृषीकेशः',
    visual: 'chariot',
    accentSlot: 'primary',
  },
  {
    id: 'sakha',
    titleKey: 'page2Title',
    subtitleKey: 'page2Subtitle',
    skt: 'सखा प्रिय',
    visual: 'mandala',
    accentSlot: 'warm',
  },
  {
    id: 'gita',
    titleKey: 'page3Title',
    subtitleKey: 'page3Subtitle',
    skt: 'श्रीमद्भगवद्गीता',
    visual: 'akshara',
    accentSlot: 'cool',
  },
  {
    id: 'journey',
    titleKey: 'page4Title',
    subtitleKey: 'page4Subtitle',
    skt: 'षड्रिपु विजय',
    visual: 'shadripu',
    accentSlot: 'deep',
  },
  {
    id: 'sacred',
    titleKey: 'page5Title',
    subtitleKey: 'page5Subtitle',
    skt: 'पवित्र क्षेत्र',
    visual: 'lock',
    accentSlot: 'life',
  },
  {
    id: 'welcome',
    titleKey: 'page6Title',
    subtitleKey: 'page6Subtitle',
    skt: 'ॐ सर्वे भवन्तु सुखिनः',
    visual: 'welcome',
    accentSlot: 'divine',
  },
] as const;

/** Resolve the six pages with concrete accents drawn from the active palette,
 *  plus locale-resolved title + subtitle from the `arrival` namespace. */
function buildPages(
  palette: Palette,
  t: (key: string) => string
): readonly PageData[] {
  return PAGE_TEMPLATES.map((p) => ({
    id: p.id,
    title: t(p.titleKey),
    subtitle: t(p.subtitleKey),
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
  const { t } = useTranslation('arrival');
  const [page, setPage] = useState(0);
  // Native FlatList paging — replaces the previous `Animated.View` +
  // `withTiming(-page * W)` approach. Math.round + withTiming were both
  // mathematically correct, yet the rendered slider on the user's device
  // still drifted right on later pages. Switching to the platform's
  // pagingEnabled FlatList offloads alignment to native code which snaps
  // to integer pixel boundaries deterministically — there is no layer of
  // RN/Yoga/Reanimated math that can introduce sub-pixel residue here.
  const listRef = useRef<FlatList<PageData>>(null);
  const { markArrivalSeen } = useArrivalStatus();
  // Guard against double-tap / completion re-entry.
  const isCompleting = useRef(false);

  // The active sacred color scheme drives every accent + background tint on
  // this screen. Switching it via the picker re-renders cleanly because
  // `pages` and the inline styles below are derived from `palette`.
  const { theme } = useTheme();
  const palette = theme.colorScheme;
  const pages = useMemo(() => buildPages(palette, t), [palette, t]);

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
      // Native FlatList scroll — animated paging that always lands exactly
      // on integer-pixel page boundaries. No translateX residue.
      listRef.current?.scrollToOffset({ offset: nextIndex * W, animated: true });
      setPage(nextIndex);
    } else {
      void handleComplete();
    }
  }, [page, haptic, handleComplete]);

  const handleSkip = useCallback((): void => {
    void handleComplete();
  }, [handleComplete]);

  // -------------------------------------------------------------------------
  // Page state sync — keeps `page` in sync with manual swipes (if/when the
  // FlatList ever permits horizontal gesture; currently it does via default
  // Android paging, on iOS too). Uses `Math.round(offsetX / W)` so a
  // half-swipe lands on the nearest page.
  // -------------------------------------------------------------------------

  const handleMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>): void => {
      const newIndex = Math.round(e.nativeEvent.contentOffset.x / W);
      if (newIndex !== page && newIndex >= 0 && newIndex < PAGE_COUNT) {
        setPage(newIndex);
      }
    },
    [page]
  );

  // FlatList per-item layout: tells the list every item is exactly W wide
  // so initial render + scrollToOffset are both pixel-perfect (no measure
  // pass that could produce fractional widths).
  const getItemLayout = useCallback(
    (_data: ArrayLike<PageData> | null | undefined, index: number) => ({
      length: W,
      offset: W * index,
      index,
    }),
    []
  );

  const renderPage = useCallback(
    ({ item, index }: { item: PageData; index: number }) => (
      <CeremonyPage
        data={item}
        index={index}
        isActive={page === index}
        palette={palette}
        totalPages={pages.length}
      />
    ),
    [page, palette, pages.length]
  );

  const keyExtractor = useCallback((item: PageData) => item.id, []);

  const isWelcome = currentPage.id === 'welcome';

  // Welcome page always uses a gold gradient CTA (matches the verse-card
  // crescendo). Other pages take the active palette's CTA gradient.
  const ctaColors: readonly [string, string] = isWelcome
    ? [palette.accent.divine, palette.accent.warm]
    : palette.cta;

  return (
    <View style={[styles.root, { backgroundColor: palette.bg.void }]}>
      <DivineBackground variant="sacred">
        <FlatList
          ref={listRef}
          data={pages}
          renderItem={renderPage}
          keyExtractor={keyExtractor}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          getItemLayout={getItemLayout}
          onMomentumScrollEnd={handleMomentumScrollEnd}
          // The Continue button drives navigation; manual swiping is allowed
          // as a bonus but isn't the primary path. `decelerationRate=fast`
          // makes a stray swipe snap immediately to the next page.
          decelerationRate="fast"
          // Render every page up front (only 6) so the visuals' breathing
          // animations are warm when the user advances to them.
          initialNumToRender={PAGE_COUNT}
          windowSize={PAGE_COUNT}
          removeClippedSubviews={false}
        />

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
              isWelcome ? t('ctaEnterSacredSpaceA11y') : t('ctaContinueA11y')
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
                {isWelcome ? t('ctaEnterSacredSpace') : t('ctaContinue')}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {!isWelcome ? (
            <TouchableOpacity
              onPress={handleSkip}
              style={styles.skipBtn}
              accessibilityRole="button"
              accessibilityLabel={t('skipButtonA11y')}
              testID="arrival-skip"
            >
              <Text allowFontScaling={false} style={styles.skipText}>
                {t('skipButton')}
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
  const { t } = useTranslation('arrival');
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

  // Welcome page is taller and gets its own scrollable layout. Padding lives
  // on the contentContainer only — applying it on both `style` and
  // `contentContainerStyle` doubles it on Android and pushes lines off the
  // right edge, which is what caused the earlier overflow.
  if (data.id === 'welcome') {
    return (
      <ScrollView
        style={styles.welcomeScroll}
        contentContainerStyle={styles.welcomeContent}
        showsVerticalScrollIndicator={false}
        accessible
        accessibilityLabel={t('welcomeA11y')}
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
          {t('welcomeEyebrow')}
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
          {t('page6Title')}
        </Animated.Text>

        <Animated.View style={[styles.welcomeBodyWrap, subtitleStyle]}>
          <Text
            allowFontScaling={false}
            style={[styles.welcomeBody, { color: palette.text.body }]}
          >
            {t('welcomeIntroPart1')}
            <Text style={[styles.welcomeAccent, { color: palette.accent.divine }]}>
              {t('welcomeIntroBrand')}
            </Text>
            {t('welcomeIntroPart2')}
            <Text style={[styles.welcomeAccentSoft, { color: palette.accent.warm }]}>
              {t('welcomeIntroEmphasis')}
            </Text>
          </Text>

          <Text
            allowFontScaling={false}
            style={[styles.welcomeBodyDim, { color: palette.text.body }]}
          >
            {t('welcomeBodyPart1')}
            <Text style={[styles.welcomeBodyItalic, { color: palette.accent.divine }]}>
              {t('welcomeBodyGita')}
            </Text>
            {t('welcomeBodyPart2')}
          </Text>

          {/* Verse card — Bhagavad Gita 6.35, crisp single-line translation */}
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
              {t('verseEyebrow')}
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.verseSanskrit, { color: palette.accent.divine }]}
              accessibilityLanguage="sa"
            >
              {'अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते'}
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.verseEnglish, { color: palette.accent.warm + 'CC' }]}
            >
              {t('verseEnglish')}
            </Text>
            <Text
              allowFontScaling={false}
              style={[styles.verseAttribution, { color: palette.accent.divine + '88' }]}
            >
              {t('verseAttribution')}
            </Text>
          </View>
        </Animated.View>

        {/* Bottom ornament — closes the scroll before the CTA */}
        <View style={styles.ornament}>
          <View style={[styles.ornamentLine, styles.ornamentLineLeft]} />
          <View style={styles.ornamentDotSmall} />
          <View style={[styles.ornamentLine, styles.ornamentLineRight]} />
        </View>

        {/* Inline palette swatch row — makes the color options visible right
            on the welcome page (so the user sees the choices before tapping
            the chip). Each swatch is itself tappable and applies the palette
            immediately, so this row IS the picker for users who never spot
            the floating chip in the corner. */}
        <View style={styles.paletteRow}>
          <Text allowFontScaling={false} style={styles.paletteRowLabel}>
            {t('paletteRowLabel')}
          </Text>
          <View style={styles.paletteRowSwatches}>
            <InlinePaletteSwatches activeId={palette.id} />
          </View>
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
  // Round so the compact welcome-page visual gets an integer width too —
  // 220 * 0.78 = 171.6, which Yoga would round to 172 for the View while
  // the SVG drew at 171.6, leaving a 0.4px asymmetry between the visual's
  // bounding box and its rendered geometry.
  const size = compact ? Math.round(VISUAL_SIZE * 0.78) : VISUAL_SIZE;
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
  page: {
    // Each page is exactly W wide (= integer device pixels via Math.round).
    // Vertical fill comes from FlatList's default alignSelf:'stretch' on
    // horizontal items — `flex:1` was removed because in a row context it
    // is `flexGrow:1` in main axis, which can race with `width:W` on Yoga
    // and produce sub-pixel render widths. Explicit width + no flexGrow
    // gives the most predictable native paging.
    width: W,
    height: '100%',
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
    // Devanagari needs ~1.7x line-height to clear matras above (शिरोरेखा)
    // and below (्, ु, ृ) the consonant. The previous 22pt line-height
    // clipped the lower matras on most Android devices.
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 17,
    lineHeight: 32,
    letterSpacing: 0.3,
    textAlign: 'center',
    paddingVertical: 4,
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
  /** ScrollView outer frame — width-locked to a single page slot. Same
   *  `height:'100%'` (instead of `flex:1`) treatment as `styles.page` so
   *  the welcome page's ScrollView never races with FlatList's horizontal
   *  flexGrow inside the row container. */
  welcomeScroll: {
    width: W,
    height: '100%',
  },
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
    // Same Devanagari descender allowance as `sanskrit` — both vowel signs
    // and the upper bar must clear in a single line so a long shloka like
    // "अभ्यासेन तु कौन्तेय वैराग्येण च गृह्यते" (which has ृ, ौ, ्य) renders cleanly.
    fontFamily: 'NotoSansDevanagari-Medium',
    fontSize: 18,
    lineHeight: 34,
    color: '#F0C96D',
    letterSpacing: 0.5,
    textAlign: 'center',
    paddingVertical: 4,
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
  paletteRow: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 6,
    gap: 12,
  },
  paletteRowLabel: {
    fontFamily: 'Outfit-Medium',
    fontSize: 10.5,
    letterSpacing: 3,
    color: 'rgba(212, 164, 76, 0.7)',
    textAlign: 'center',
  },
  paletteRowSwatches: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
});
