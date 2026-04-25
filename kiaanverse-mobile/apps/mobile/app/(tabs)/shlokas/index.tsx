/**
 * Sacred Tools Hub — slot 3 of the 5-doorway bottom bar.
 *
 * One doorway, every sacred instrument the user has at their disposal:
 *
 *   SACRED SCRIPTURES  — Bhagavad Gita (18-chapter browser)
 *   WISDOM TOOLS       — Ardha, Viyoga, Relationship Compass
 *   HEALING TOOLS      — Emotional Reset, Karma Reset
 *   SACRED PATHS       — Wisdom Rooms, Journeys (षड्रिपु — the inner
 *                        battlefield), Sacred Reflections
 *   SACRED SOUND       — KIAAN Vibe Player (full-width, elevated)
 *
 * The route file is still `shlokas/` so deep links of the form
 * `/shlokas/[chapter]/[verse]` keep resolving to the Gita verse view.
 *
 * Every card is a `ToolCard` (96 px) with a semantic left-accent stripe,
 * tinted icon bubble, Devanagari label, and one-line description. The
 * Gita browser card routes into `/shlokas/gita`; the Journeys card
 * routes into `/(tabs)/journeys` which opens the four-sub-tab षड्रिपु
 * Journeys hub (Today / Journeys / Battleground / Wisdom).
 *
 * Entrance choreography matches the Tools Dashboard pattern:
 *   - Each section (header + cards) is staggered by 100 ms.
 *   - Cards within a section stagger by an additional 60 ms per card.
 *   - Lotus-bloom easing at NATURAL duration.
 */

import React, { useCallback, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Screen, useDivineEntrance } from '@kiaanverse/ui';
import { useVibePlayerStore } from '@kiaanverse/store';

import {
  SectionHeader,
  ToolCard,
  VibePlayerCard,
} from '../../../components/tools';
import {
  ANGER_RED,
  DELUSION_PURPLE,
  DESIRE_AMBER,
  DIVINE_GOLD,
  GREED_GREEN,
  PEACOCK_TEAL,
} from '../../../components/tools/toolColors';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.65)';

const SECTION_STAGGER_MS = 100;
const CARD_STAGGER_MS = 60;

interface ToolDescriptor {
  readonly id: string;
  readonly name: string;
  readonly sanskrit: string;
  readonly description: string;
  readonly color: string;
  readonly icon: string;
  readonly route: string;
}

const SCRIPTURE_TOOLS: readonly ToolDescriptor[] = [
  {
    id: 'bhagavad-gita',
    name: 'Bhagavad Gita',
    sanskrit: 'भगवद्गीता',
    description: '18 chapters · 700 shlokas',
    color: DIVINE_GOLD,
    icon: '📜',
    route: '/(tabs)/shlokas/gita',
  },
];

// Order honours the user's spec: Ardha → Viyoga → Relationship Compass.
const WISDOM_TOOLS: readonly ToolDescriptor[] = [
  {
    id: 'ardha',
    name: 'Ardha',
    sanskrit: 'अर्थ',
    description: 'Reframe your perspective',
    color: DESIRE_AMBER,
    icon: '💡',
    route: '/tools/ardha',
  },
  {
    id: 'viyoga',
    name: 'Viyoga',
    sanskrit: 'वियोग',
    description: 'The art of letting go',
    color: PEACOCK_TEAL,
    icon: '🌊',
    route: '/tools/viyoga',
  },
  {
    id: 'relationship-compass',
    name: 'Relationship Compass',
    sanskrit: 'संबंध सूत्र',
    description: 'Dharma-guided clarity',
    color: GREED_GREEN,
    icon: '🧭',
    route: '/tools/relationship-compass',
  },
];

const HEALING_TOOLS: readonly ToolDescriptor[] = [
  {
    id: 'emotional-reset',
    name: 'Emotional Reset',
    sanskrit: 'भावनात्मक पुनर्स्थापना',
    description: 'Release and transform emotions',
    color: ANGER_RED,
    icon: '🔥',
    route: '/tools/emotional-reset',
  },
  {
    id: 'karma-reset',
    name: 'Karma Reset',
    sanskrit: 'कर्म पुनर्निर्धारण',
    description: 'Heal karmic patterns',
    color: DELUSION_PURPLE,
    icon: '☸',
    route: '/tools/karma-reset',
  },
];

// Sacred Paths — the long-form practices of community, the inner
// battlefield, and reflection. Order mirrors the user's spec:
// Wisdom Rooms → Journeys → Sacred Reflections.
const PATH_TOOLS: readonly ToolDescriptor[] = [
  {
    id: 'wisdom-rooms',
    name: 'Wisdom Rooms',
    sanskrit: 'ज्ञान कक्ष',
    description: 'Sacred circles of seekers',
    color: GREED_GREEN,
    icon: '🏛',
    route: '/wisdom-rooms',
  },
  {
    id: 'journeys',
    name: 'Journeys',
    sanskrit: 'षड्रिपु',
    description: 'The inner battlefield · 6 enemies',
    color: ANGER_RED,
    icon: '⚔️',
    route: '/(tabs)/journeys',
  },
  {
    id: 'sacred-reflections',
    name: 'Sacred Reflections',
    sanskrit: 'पवित्र चिन्तन',
    description: 'Encrypted journal & insights',
    color: DIVINE_GOLD,
    icon: '🪷',
    route: '/journal',
  },
];

export default function SacredToolsHubScreen(): React.JSX.Element {
  const router = useRouter();

  const currentTrack = useVibePlayerStore((s) => s.currentTrack);
  const isPlaying = useVibePlayerStore((s) => s.isPlaying);
  const togglePlay = useVibePlayerStore((s) => s.togglePlay);

  const handleToolPress = useCallback(
    (route: string) => {
      router.push(route as never);
    },
    [router]
  );

  const handleOpenVibePlayer = useCallback(() => {
    router.push('/vibe-player' as never);
  }, [router]);

  const sections = useMemo(
    () =>
      [
        { title: 'Sacred Scriptures', tools: SCRIPTURE_TOOLS },
        { title: 'Wisdom Tools', tools: WISDOM_TOOLS },
        { title: 'Healing Tools', tools: HEALING_TOOLS },
        { title: 'Sacred Paths', tools: PATH_TOOLS },
      ] as const,
    []
  );

  // Sacred Sound (Vibe Player) is the final section and gets the last
  // entrance slot so the delay chain stays in step with the four sections
  // above it.
  const vibePlayerDelay = SECTION_STAGGER_MS * sections.length;

  return (
    <Screen scroll={false} gradient edges={['top', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            Sacred Tools
          </Text>
          <Text style={styles.subtitle}>
            Every scripture and instrument for inner transformation
          </Text>
        </View>

        {sections.map((section, sectionIndex) => (
          <ToolSection
            key={section.title}
            title={section.title}
            tools={section.tools}
            sectionDelay={sectionIndex * SECTION_STAGGER_MS}
            onToolPress={handleToolPress}
          />
        ))}

        {/* SACRED SOUND — full-width KIAAN Vibe card. */}
        <AnimatedEntrance delay={vibePlayerDelay}>
          <SectionHeader title="Sacred Sound" />
        </AnimatedEntrance>
        <AnimatedEntrance delay={vibePlayerDelay + CARD_STAGGER_MS}>
          <View style={styles.vibeWrap}>
            <VibePlayerCard
              trackName={currentTrack?.title ?? null}
              isPlaying={isPlaying}
              onOpenPlayer={handleOpenVibePlayer}
              onTogglePlay={togglePlay}
            />
          </View>
        </AnimatedEntrance>
      </ScrollView>
    </Screen>
  );
}

interface ToolSectionProps {
  readonly title: string;
  readonly tools: readonly ToolDescriptor[];
  readonly sectionDelay: number;
  readonly onToolPress: (route: string) => void;
}

function ToolSection({
  title,
  tools,
  sectionDelay,
  onToolPress,
}: ToolSectionProps): React.JSX.Element {
  return (
    <View style={styles.section}>
      <AnimatedEntrance delay={sectionDelay}>
        <SectionHeader title={title} />
      </AnimatedEntrance>
      <View style={styles.cardStack}>
        {tools.map((tool, cardIndex) => (
          <AnimatedEntrance
            key={tool.id}
            delay={sectionDelay + (cardIndex + 1) * CARD_STAGGER_MS}
          >
            <ToolCard
              name={tool.name}
              sanskrit={tool.sanskrit}
              description={tool.description}
              color={tool.color}
              icon={tool.icon}
              onPress={() => onToolPress(tool.route)}
            />
          </AnimatedEntrance>
        ))}
      </View>
    </View>
  );
}

function AnimatedEntrance({
  delay,
  children,
}: {
  readonly delay: number;
  readonly children: React.ReactNode;
}): React.JSX.Element {
  const { animatedStyle } = useDivineEntrance({ delay });
  return <Animated.View style={animatedStyle}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 48,
    paddingHorizontal: 0,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 12,
    gap: 6,
  },
  title: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: 28,
    color: SACRED_WHITE,
    letterSpacing: 0.4,
  },
  subtitle: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 14,
    color: TEXT_MUTED,
  },
  section: {
    marginBottom: 12,
  },
  cardStack: {
    paddingHorizontal: 16,
    gap: 10,
  },
  vibeWrap: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
});
