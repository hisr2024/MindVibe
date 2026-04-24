/**
 * Tools Dashboard — The Armory of Dharmic Transformation
 *
 * Every sacred instrument the user has at their disposal, arranged into
 * four temples:
 *
 *   HEALING TOOLS  — restorative emotional + karmic work.
 *   WISDOM TOOLS   — reframing, detachment, relational dharma.
 *   KARMA INSIGHTS — reflections on one's own karmic pattern.
 *   SACRED SOUND   — the KIAAN Vibe Player, larger + more elevated.
 *
 * Each tool is a `ToolCard` (96 px) with a semantic-color left stripe,
 * a tinted icon bubble, an Outfit-SemiBold name, a Devanagari label in
 * the tool's color, and a one-line description. Pressing a card fires a
 * Light haptic + a colored ripple from the press origin + a scale
 * feedback (0.97 → 1.0) before navigating.
 *
 * Entrance choreography:
 *   - Each section (header + its cards) is staggered by 100 ms.
 *   - Cards within a section stagger by an additional 60 ms per card.
 *   - All entrances use lotus-bloom easing at NATURAL duration so the
 *     armory reveals itself the way a mandala is drawn: ring by ring.
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
} from '../../components/tools';
import {
  ANGER_RED,
  DELUSION_PURPLE,
  DESIRE_AMBER,
  DIVINE_GOLD,
  GREED_GREEN,
  PEACOCK_TEAL,
} from '../../components/tools/toolColors';

const SACRED_WHITE = '#F5F0E8';
const TEXT_MUTED = 'rgba(200,191,168,0.65)';

/**
 * Inter-section stagger (ms). The spec calls for 0 / 100 / 200 / 300 ms
 * between section headers — these are passed to useDivineEntrance as the
 * delay for each section block.
 */
const SECTION_STAGGER_MS = 100;

/** Extra per-card stagger inside a section (60 ms per card). */
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

const INSIGHT_TOOLS: readonly ToolDescriptor[] = [
  {
    id: 'karmalytix',
    name: 'KarmaLytix',
    sanskrit: 'कर्म विश्लेषण',
    description: 'Patterns in your practice',
    color: DIVINE_GOLD,
    icon: '🪞',
    route: '/analytics',
  },
  {
    id: 'karma-footprint',
    name: 'Karma Footprint',
    sanskrit: 'कर्म पदचिह्न',
    description: 'Track your karmic ripples',
    color: DIVINE_GOLD,
    icon: '👣',
    route: '/karma-footprint',
  },
  {
    id: 'karma-tree',
    name: 'Karma Tree',
    sanskrit: 'कर्म वृक्ष',
    description: 'Your living dharma canopy',
    color: GREED_GREEN,
    icon: '🌳',
    route: '/wellness/karma',
  },
];

export default function ToolsDashboardScreen(): React.JSX.Element {
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
        { title: 'Healing Tools', tools: HEALING_TOOLS },
        { title: 'Wisdom Tools', tools: WISDOM_TOOLS },
        { title: 'Karma Insights', tools: INSIGHT_TOOLS },
      ] as const,
    []
  );

  // Section index 3 is reserved for Sacred Sound (VibePlayer) — so the
  // delay chain is 0, 100, 200, 300 ms exactly per the spec.
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
            Instruments for transformation, clarity, and inner peace
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

/**
 * A single dashboard section: header + its list of ToolCards, with each
 * child staggered by CARD_STAGGER_MS after the header has entered.
 */
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

/**
 * Thin wrapper that applies the shared divine-entrance (opacity 0→1 +
 * translateY 16→0, lotus-bloom, NATURAL duration). Extracted so both the
 * section headers and the cards share an identical entrance curve.
 */
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
