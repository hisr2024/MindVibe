/**
 * DivineTabBar — Kiaanverse bottom tab bar (5 sacred doorways).
 *
 * Tab order:
 *   Home · Sakha · Shlokas · Journal · Profile
 *
 * Slot 3 is now the Shlokas Sacred Hub (scriptures + every sacred tool
 * + Wisdom Rooms + Sacred Reflections + KIAAN Vibe Player). Its glyph is
 * the ManuscriptIcon — the scroll carries the "sacred utterance" meaning
 * that anchors the hub. The Journal tab takes the ChakraColumnIcon (the
 * seven stacked chakras read as an inward ascent through one's own
 * reflections). Journeys is still a full route; it's reached from Home's
 * "Browse Sacred Catalog" CTA rather than occupying tab-bar real estate.
 *
 * Visual specification:
 * - Dark navy background: rgba(5,7,20,0.97).
 * - Gold horizontal gradient border line at the top (transparent → gold →
 *   transparent) — echoes the web divine-threshold border.
 * - 24 × 24 outline SVG glyphs for each tab.
 * - Active state: icon tints gold (#D4A017), label fades in in gold, and a
 *   4 px gold dot appears ABOVE the icon (matches the web marker).
 * - Inactive state: icon rendered at opacity 0.38, label hidden.
 * - Sacred-spring micro-interactions (~180 ms bounce + settle).
 * - Haptic impact on tab switch.
 *
 * Drop-in for expo-router:
 * ```tsx
 * <Tabs tabBar={(props) => <DivineTabBar {...props} />} />
 * ```
 */

import React, { useCallback, useEffect } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { GopuramIcon } from './icons/GopuramIcon';
import { LotusDialogIcon } from './icons/LotusDialogIcon';
import { ManuscriptIcon } from './icons/ManuscriptIcon';
import { ChakraColumnIcon } from './icons/ChakraColumnIcon';
import { MeditatorIcon } from './icons/MeditatorIcon';

// ---------------------------------------------------------------------------
// Palette
// ---------------------------------------------------------------------------

const ACTIVE_COLOR = '#D4A017';
const INACTIVE_COLOR = 'rgba(240,235,225,0.35)';
const BACKGROUND_COLOR = 'rgba(5,7,20,0.97)';
const GLOW_COLOR = 'rgba(212,160,23,0.08)';

// ---------------------------------------------------------------------------
// Tab definition — single source of truth for label + icon.
// ---------------------------------------------------------------------------

type SacredIcon = React.ComponentType<{ size?: number; color?: string }>;

interface SacredTab {
  /** Route name as declared in app/(tabs)/_layout.tsx. */
  readonly name: string;
  /** Fallback label if the screen's `title` option is missing. */
  readonly label: string;
  /** 24 × 24 outline glyph. */
  readonly Icon: SacredIcon;
}

const TABS: ReadonlyArray<SacredTab> = [
  { name: 'index', label: 'Home', Icon: GopuramIcon },
  { name: 'chat', label: 'Sakha', Icon: LotusDialogIcon },
  // Manuscript glyph = scroll of shlokas; the Shlokas Hub opens to every
  // sacred scripture and instrument so the written-word metaphor fits.
  { name: 'shlokas', label: 'Shlokas', Icon: ManuscriptIcon },
  // ChakraColumn's seven stacked chakras read as an inward ascent — a
  // fitting cue for the reflection-and-journal practice of Sacred
  // Reflections (the Journal tab's content).
  { name: 'journal', label: 'Journal', Icon: ChakraColumnIcon },
  { name: 'profile', label: 'Profile', Icon: MeditatorIcon },
] as const;

/**
 * Gold-with-peacock gradient colour stops for the top border. The blue
 * shoulders echo the Krishna-aura gradient used by primary CTAs and make
 * the central gold hotspot read as a threshold, not just a hairline.
 */
const TOP_BORDER_COLORS: readonly [string, string, string, string, string] = [
  'transparent',
  'rgba(27,79,187,0.35)',
  'rgba(212,160,23,0.7)',
  'rgba(27,79,187,0.35)',
  'transparent',
];

/** Base height of the tab bar content (safe-area inset is added on top). */
const TAB_BAR_HEIGHT = 64;
/** Active indicator dot diameter. */
const DOT_SIZE = 4;
/** Distance between the dot's bottom edge and the icon's top edge. */
const DOT_GAP = 4;

// ---------------------------------------------------------------------------
// DivineTabBar
// ---------------------------------------------------------------------------

export function DivineTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const insets = useSafeAreaInsets();

  const handlePress = useCallback(
    (route: { key: string; name: string }, isFocused: boolean) => {
      // Haptic fires in TabItem synchronously with the press-scale spring so
      // the bounce and the thump land on the same frame. We keep navigation
      // here so the event plumbing stays in one place.
      const event = navigation.emit({
        type: 'tabPress',
        target: route.key,
        canPreventDefault: true,
      });
      if (isFocused || event.defaultPrevented) return;
      navigation.navigate(route.name);
    },
    [navigation],
  );

  const handleLongPress = useCallback(
    (route: { key: string }) => {
      navigation.emit({ type: 'tabLongPress', target: route.key });
    },
    [navigation],
  );

  return (
    <View
      style={[styles.container, { paddingBottom: insets.bottom }]}
      accessibilityRole="tablist"
    >
      {/* Gold horizontal gradient line — matches kiaanverse.com. */}
      <LinearGradient
        colors={TOP_BORDER_COLORS as unknown as string[]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.topBorder}
      />

      <View style={styles.row}>
        {TABS.map((tab, tabIndex) => {
          // Locate the matching route in the navigator state; if a tab
          // screen isn't registered (e.g. during route transitions) skip it.
          const route = state.routes.find((r) => r.name === tab.name);
          if (!route) return null;

          const routeIndex = state.routes.indexOf(route);
          const isFocused = state.index === routeIndex;
          const { options } = descriptors[route.key] ?? {};
          const label =
            typeof options?.tabBarLabel === 'string'
              ? options.tabBarLabel
              : typeof options?.title === 'string'
                ? options.title
                : tab.label;

          return (
            <TabItem
              key={route.key}
              label={label}
              Icon={tab.Icon}
              isFocused={isFocused}
              onPress={() => handlePress(route, isFocused)}
              onLongPress={() => handleLongPress(route)}
              routeName={tab.name}
              testID={`tab-${tab.name}`}
              // Hint to TabItem that the first render should not animate in.
              initialIndex={tabIndex}
            />
          );
        })}
      </View>
    </View>
  );
}

export default DivineTabBar;

// ---------------------------------------------------------------------------
// TabItem — single pressable tab with dot + icon + label.
// ---------------------------------------------------------------------------

interface TabItemProps {
  readonly label: string;
  readonly Icon: SacredIcon;
  readonly isFocused: boolean;
  readonly onPress: () => void;
  readonly onLongPress?: () => void;
  readonly routeName: string;
  readonly testID?: string;
  readonly initialIndex: number;
}

function TabItemInner({
  label,
  Icon,
  isFocused,
  onPress,
  onLongPress,
  testID,
}: TabItemProps): React.JSX.Element {
  /** Whole-tab press bounce (1.0 → 0.88 → 1.0). */
  const pressScale = useSharedValue(1);
  /** Icon scale: rests at 1.0, pops to 1.12 on activation. */
  const iconScale = useSharedValue(1);
  /** Indicator dot: scales from 0 → 1.2 → 1.0 with a gold overshoot. */
  const dotScale = useSharedValue(isFocused ? 1 : 0);
  /** Dot opacity — matches dot visibility without blocking the spring. */
  const dotOpacity = useSharedValue(isFocused ? 1 : 0);
  /** Radial glow behind the icon, 32px, 8%-gold. */
  const glowOpacity = useSharedValue(isFocused ? 1 : 0);
  /** Active label fades in synchronously with the dot. */
  const labelOpacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    if (isFocused) {
      // Icon pops once on activation, then rests.
      iconScale.value = withSequence(
        withTiming(1.12, { duration: 200, easing: Easing.out(Easing.quad) }),
        withSpring(1.0, { damping: 14, stiffness: 160, mass: 0.9 }),
      );
      // Indicator overshoots then settles — the "opening of the threshold".
      dotScale.value = withSequence(
        withTiming(1.2, { duration: 180, easing: Easing.out(Easing.cubic) }),
        withSpring(1.0, { damping: 10, stiffness: 180, mass: 0.8 }),
      );
      dotOpacity.value = withTiming(1, { duration: 180 });
      glowOpacity.value = withTiming(1, { duration: 300 });
      labelOpacity.value = withTiming(1, { duration: 200 });
    } else {
      iconScale.value = withTiming(1.0, { duration: 200 });
      dotScale.value = withTiming(0, { duration: 150 });
      dotOpacity.value = withTiming(0, { duration: 150 });
      glowOpacity.value = withTiming(0, { duration: 200 });
      labelOpacity.value = withTiming(0, { duration: 150 });
    }
  }, [isFocused, iconScale, dotScale, dotOpacity, glowOpacity, labelOpacity]);

  const handlePressIn = useCallback(() => {
    // Tap-feedback bounce. We run it in onPress rather than in the navigate
    // path so even blocked taps (already-focused tab) still give a hint of
    // response to the user.
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
    pressScale.value = withSequence(
      withSpring(0.88, { damping: 12, stiffness: 200, mass: 0.7 }),
      withSpring(1.0, { damping: 10, stiffness: 150, mass: 0.8 }),
    );
  }, [pressScale]);

  const tabAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pressScale.value }],
  }));

  const iconAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const dotAnimatedStyle = useAnimatedStyle(() => ({
    opacity: dotOpacity.value,
    transform: [{ scale: dotScale.value }],
  }));

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
  }));

  const glowAnimatedStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  // Icon colour is swapped on the JS thread — Reanimated can't interpolate
  // rgba ↔ hex without the colour plugin, and the focus transitions are
  // already carried visually by the dot / label / glow values.
  const iconColor = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onLongPress={onLongPress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
      testID={testID}
      hitSlop={8}
    >
      <Animated.View style={[styles.tabInner, tabAnimatedStyle]}>
        {/* Reserved slot above the icon — keeps layout height stable. */}
        <View style={styles.dotSlot} pointerEvents="none">
          <Animated.View style={[styles.dot, dotAnimatedStyle]} />
        </View>

        {/* Icon + glow underlay. Glow sits behind the glyph via absolute
            positioning in a square slot so it never resizes as the icon
            scales — the glow is a steady aura, not a shadow. */}
        <View style={styles.iconSlot} pointerEvents="none">
          <Animated.View style={[styles.iconGlow, glowAnimatedStyle]} />
          <Animated.View style={iconAnimatedStyle}>
            <Icon size={22} color={iconColor} />
          </Animated.View>
        </View>

        <View style={styles.labelSlot} pointerEvents="none">
          <Animated.Text
            numberOfLines={1}
            style={[styles.label, labelAnimatedStyle]}
          >
            {label}
          </Animated.Text>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const TabItem = React.memo(TabItemInner);

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    backgroundColor: BACKGROUND_COLOR,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.5,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
      default: {},
    }),
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  row: {
    flexDirection: 'row',
    height: TAB_BAR_HEIGHT,
    alignItems: 'stretch',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 4,
  },
  tabInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotSlot: {
    height: DOT_SIZE + DOT_GAP,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: ACTIVE_COLOR,
    shadowColor: ACTIVE_COLOR,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
  iconSlot: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlow: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GLOW_COLOR,
    // A soft outer halo on iOS; Android's elevation draws ring-like shadows
    // on solid surfaces, so we skip it there.
    ...Platform.select({
      ios: {
        shadowColor: ACTIVE_COLOR,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      default: {},
    }),
  },
  labelSlot: {
    height: 12,
    marginTop: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 9,
    fontFamily: Platform.select({
      ios: 'Outfit-Medium',
      android: 'Outfit-Medium',
      default: 'Outfit-Medium',
    }),
    fontWeight: '500',
    color: ACTIVE_COLOR,
    letterSpacing: 0.2,
  },
});
