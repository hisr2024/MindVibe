/**
 * Arrival Ceremony — 5 sacred pages that introduce Kiaanverse to a new soul.
 *
 * This is the pre-authentication darshan. It plays once per device (tracked
 * via useArrivalStatus) and replaces a conventional welcome carousel with an
 * immersive, full-screen ceremony. Navigation:
 *   first launch  → /arrival → /(auth)/login
 *   returning     → routed straight past this screen by the AuthGate
 *
 * Pages:
 *   1. arjuna   — the silent battlefield question
 *   2. sakha    — the divine friend is here
 *   3. gita     — the Gita is a conversation
 *   4. journey  — your dharma is waiting (6 shadripu)
 *   5. sacred   — privacy covenant
 *
 * Progress is a horizontal "peacock feather" bar (not dots) — the active
 * segment grows and adopts the page accent color.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Dimensions,
  Platform,
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
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { DivineBackground } from '@kiaanverse/ui';
import { useArrivalStatus } from '../../hooks/useArrivalStatus';

const { width: W } = Dimensions.get('window');

// ---------------------------------------------------------------------------
// Page definitions
// ---------------------------------------------------------------------------

type PageId = 'arjuna' | 'sakha' | 'gita' | 'journey' | 'sacred';

interface PageData {
  readonly id: PageId;
  readonly title: string;
  readonly subtitle: string;
  readonly skt: string;
  readonly accent: string;
  readonly visual: 'chariot' | 'mandala' | 'akshara' | 'shadripu' | 'lock';
}

const PAGES: readonly PageData[] = [
  {
    id: 'arjuna',
    title: '"In the middle of the battlefield,\nArjuna fell silent."',
    subtitle: 'There is a question in you\nthat no human can answer.',
    skt: 'तमुवाच हृषीकेशः',
    accent: '#1B4FBB',
    visual: 'chariot',
  },
  {
    id: 'sakha',
    title: 'Sakha means Friend.',
    subtitle: 'Your divine friend is here.\nReady to listen. Ready to guide.',
    skt: 'सखा प्रिय',
    accent: '#D4A017',
    visual: 'mandala',
  },
  {
    id: 'gita',
    title: 'The Bhagavad Gita is not a text.\nIt is a conversation.',
    subtitle: 'Ask what you have always\nbeen afraid to ask.',
    skt: 'श्रीमद्भगवद्गीता',
    accent: '#06B6D4',
    visual: 'akshara',
  },
  {
    id: 'journey',
    title: 'Your inner enemies are known.\nYour dharma is waiting.',
    subtitle: '6 Shadripu. 13 sacred journeys.\nOne path.',
    skt: 'षड्रिपु विजय',
    accent: '#8B5CF6',
    visual: 'shadripu',
  },
  {
    id: 'sacred',
    title: 'This is your sacred space.',
    subtitle:
      'Encrypted. Private. Yours alone.\nKiaanverse never reads your journal.',
    skt: 'पवित्र क्षेत्र',
    accent: '#10B981',
    visual: 'lock',
  },
] as const;

const LOTUS_BLOOM = Easing.bezier(0.22, 1.0, 0.36, 1.0);

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ArrivalCeremonyScreen(): React.JSX.Element {
  const [page, setPage] = useState(0);
  const translateX = useSharedValue(0);
  const { markArrivalSeen } = useArrivalStatus();
  // Guard against double-tap / completion re-entry.
  const isCompleting = useRef(false);

  const currentPage = PAGES[page]!;

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
    if (page < PAGES.length - 1) {
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

  return (
    <View style={styles.root}>
      <DivineBackground variant="sacred">
        <Animated.View style={[styles.pagesContainer, pagesContainerStyle]}>
          {PAGES.map((p, i) => (
            <CeremonyPage key={p.id} data={p} index={i} isActive={page === i} />
          ))}
        </Animated.View>

        {/* Peacock feather progress — not dots. */}
        <View style={styles.progressBar}>
          {PAGES.map((p, i) => (
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

        {/* CTA zone */}
        <View style={styles.ctaZone}>
          <TouchableOpacity
            onPress={goNext}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel={
              page < PAGES.length - 1 ? 'Continue' : 'Begin your journey'
            }
            testID="arrival-cta"
          >
            <LinearGradient
              colors={['#1B4FBB', '#0E7490']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <Text allowFontScaling={false} style={styles.ctaText}>
                {page < PAGES.length - 1 ? 'Continue' : 'Begin Your Journey'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {page < PAGES.length - 1 ? (
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
}

function CeremonyPage({
  data,
  index,
  isActive,
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

  return (
    <View
      style={styles.page}
      accessible
      accessibilityLabel={`${data.title.replace(/\n/g, ' ')}. ${data.subtitle.replace(/\n/g, ' ')}`}
    >
      <View style={styles.visualWrap}>
        <PageVisual
          kind={data.visual}
          accent={data.accent}
          isActive={isActive}
        />
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
          style={[styles.title, titleStyle]}
        >
          {data.title}
        </Animated.Text>

        <Animated.Text
          allowFontScaling={false}
          style={[styles.subtitle, subtitleStyle]}
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
          >{` / ${String(PAGES.length).padStart(2, '0')}`}</Text>
        </Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// PageVisual — a simple, token-only visual per page kind. These replace the
// Skia Canvas illustrations: they're accent-colored concentric rings, arranged
// differently per page, with independent breathing animations that stay on
// the UI thread. Visually consistent with SakhaMandala + OmLoader language.
// ---------------------------------------------------------------------------

interface PageVisualProps {
  readonly kind: PageData['visual'];
  readonly accent: string;
  readonly isActive: boolean;
}

function PageVisual({
  kind,
  accent,
  isActive,
}: PageVisualProps): React.JSX.Element {
  const pulse = useSharedValue(0.9);
  const rotate = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduce) => {
        if (cancelled || reduce || !isActive) return;
        pulse.value = withRepeat(
          withSequence(
            withTiming(1.08, { duration: 1800, easing: LOTUS_BLOOM }),
            withTiming(0.92, { duration: 1800, easing: LOTUS_BLOOM })
          ),
          -1,
          false
        );
        rotate.value = withRepeat(
          withTiming(360, { duration: 36000, easing: Easing.linear }),
          -1,
          false
        );
      })
      .catch(() => {
        // Accessibility probe unavailable — stay static.
      });
    return () => {
      cancelled = true;
    };
  }, [isActive, pulse, rotate]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));
  const rotateStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotate.value}deg` }],
  }));

  const rings = VISUAL_LAYOUT[kind];
  return (
    <Animated.View style={[styles.visual, pulseStyle]}>
      <Animated.View style={[StyleSheet.absoluteFill, rotateStyle]}>
        {rings.map((r, i) => (
          <View
            key={`ring-${i}`}
            style={[
              styles.ring,
              {
                width: r.size,
                height: r.size,
                borderRadius: r.size / 2,
                borderColor: accent,
                borderWidth: r.stroke,
                opacity: r.opacity,
                top: (VISUAL_SIZE - r.size) / 2 + (r.offsetY ?? 0),
                left: (VISUAL_SIZE - r.size) / 2 + (r.offsetX ?? 0),
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Central gold core — anchors the eye. */}
      <View
        style={[
          styles.core,
          {
            backgroundColor: accent,
            shadowColor: accent,
          },
        ]}
      />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Visual layouts — each page gets a distinct ring composition so the five
// screens feel different while sharing a design language.
// ---------------------------------------------------------------------------

const VISUAL_SIZE = 220;

interface RingSpec {
  size: number;
  stroke: number;
  opacity: number;
  offsetX?: number;
  offsetY?: number;
}

const VISUAL_LAYOUT: Record<PageData['visual'], readonly RingSpec[]> = {
  // Chariot — a single grounded wheel with a rising horizon line above.
  chariot: [
    { size: 140, stroke: 2, opacity: 0.65 },
    { size: 80, stroke: 1, opacity: 0.4 },
    { size: 200, stroke: 0.8, opacity: 0.18 },
  ],
  // Mandala — three concentric golden auras.
  mandala: [
    { size: 200, stroke: 1, opacity: 0.35 },
    { size: 150, stroke: 1.5, opacity: 0.55 },
    { size: 100, stroke: 2, opacity: 0.8 },
  ],
  // Akshara — asymmetric scatter suggesting Sanskrit syllables in space.
  akshara: [
    { size: 120, stroke: 1.2, opacity: 0.55, offsetX: -36 },
    { size: 80, stroke: 1, opacity: 0.45, offsetX: 52, offsetY: -30 },
    { size: 140, stroke: 0.8, opacity: 0.3, offsetY: 28 },
  ],
  // Shadripu — a hexagonal suggestion with 6 orbs via stacked rings at angles.
  shadripu: [
    { size: 180, stroke: 1, opacity: 0.35 },
    { size: 120, stroke: 1.5, opacity: 0.55 },
    { size: 60, stroke: 2, opacity: 0.85 },
  ],
  // Lock — tight concentric rings evoking a sealed vault.
  lock: [
    { size: 130, stroke: 2, opacity: 0.7 },
    { size: 100, stroke: 1.5, opacity: 0.55 },
    { size: 70, stroke: 1, opacity: 0.4 },
  ],
} as const;

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
    width: W * PAGES.length,
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
  visual: {
    width: VISUAL_SIZE,
    height: VISUAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  core: {
    width: 10,
    height: 10,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 10,
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
    fontFamily: 'CormorantGaramond-Italic',
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
  ctaText: {
    fontSize: 17,
    fontFamily: 'Outfit-SemiBold',
    color: '#F5F0E8',
    letterSpacing: 0.3,
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
});
