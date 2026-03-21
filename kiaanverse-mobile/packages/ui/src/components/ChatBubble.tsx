/**
 * ChatBubble — Conversational message bubble for the Sakha chat.
 *
 * Two styles based on role:
 * - user: Right-aligned, surface-elevated background, bottom-right corner sharp
 * - assistant: Left-aligned, card background + golden left border, bottom-left sharp
 *
 * Features:
 * - Word-by-word text reveal animation for AI responses
 * - Typing indicator with 3 bouncing golden dots
 */

import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useTheme } from '../theme/useTheme';
import { spacing } from '../tokens/spacing';
import { radii } from '../tokens/radii';
import { textPresets } from '../tokens/typography';
import { duration } from '../tokens/motion';
import { Text } from './Text';

/** Sender role for the message. */
export type ChatRole = 'user' | 'assistant';

/** Props for the ChatBubble component. */
export interface ChatBubbleProps {
  /** Who sent this message. */
  readonly role: ChatRole;
  /** Message text content. */
  readonly content: string;
  /** Show the typing indicator instead of content. @default false */
  readonly isTyping?: boolean;
  /** Animate word-by-word reveal (only for assistant role). @default false */
  readonly animated?: boolean;
  /** Unix timestamp for the message. */
  readonly timestamp?: number;
  /** Optional style override for the outer container. */
  readonly style?: ViewStyle;
  /** Test identifier for E2E testing. */
  readonly testID?: string;
}

// ---------------------------------------------------------------------------
// Typing Indicator (3 bouncing dots)
// ---------------------------------------------------------------------------

function BouncingDot({ delay, color }: { delay: number; color: string }): React.JSX.Element {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 300, easing: Easing.inOut(Easing.ease) }),
          withTiming(0, { duration: 300, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
        false,
      ),
    );
  }, [translateY, delay]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color },
        dotStyle,
      ]}
    />
  );
}

function TypingIndicator({ color }: { color: string }): React.JSX.Element {
  return (
    <View style={styles.typingRow} accessibilityLabel="Typing">
      <BouncingDot delay={0} color={color} />
      <BouncingDot delay={150} color={color} />
      <BouncingDot delay={300} color={color} />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Animated Word
// ---------------------------------------------------------------------------

function AnimatedWord({
  word,
  index,
  color,
}: {
  word: string;
  index: number;
  color: string;
}): React.JSX.Element {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      index * 40,
      withTiming(1, { duration: duration.fast, easing: Easing.out(Easing.ease) }),
    );
  }, [opacity, index]);

  const wordStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.Text style={[styles.word, { color }, wordStyle]}>
      {word}{' '}
    </Animated.Text>
  );
}

// ---------------------------------------------------------------------------
// ChatBubble
// ---------------------------------------------------------------------------

function ChatBubbleInner({
  role,
  content,
  isTyping = false,
  animated = false,
  timestamp,
  style,
  testID,
}: ChatBubbleProps): React.JSX.Element {
  const { theme } = useTheme();
  const c = theme.colors;

  const isUser = role === 'user';
  const bubbleBg = isUser ? c.surfaceElevated : c.card;
  const textColor = c.textPrimary;

  const words = useMemo(
    () => (animated && !isUser ? content.split(/\s+/).filter(Boolean) : []),
    [content, animated, isUser],
  );

  const bubbleStyle: ViewStyle = isUser
    ? {
        alignSelf: 'flex-end',
        backgroundColor: bubbleBg,
        borderBottomRightRadius: radii.sm,
      }
    : {
        alignSelf: 'flex-start',
        backgroundColor: bubbleBg,
        borderBottomLeftRadius: radii.sm,
        borderLeftWidth: 3,
        borderLeftColor: c.accent,
      };

  return (
    <View
      style={[
        styles.container,
        isUser ? styles.containerUser : styles.containerAssistant,
        style,
      ]}
      testID={testID}
      accessibilityRole="text"
    >
      <View style={[styles.bubble, bubbleStyle]}>
        {isTyping ? (
          <TypingIndicator color={c.accent} />
        ) : animated && words.length > 0 ? (
          <View style={styles.wordWrap}>
            {words.map((word, i) => (
              <AnimatedWord key={`${i}-${word}`} word={word} index={i} color={textColor} />
            ))}
          </View>
        ) : (
          <Text variant="body" color={textColor}>{content}</Text>
        )}
      </View>

      {timestamp !== undefined ? (
        <Text
          variant="caption"
          color={c.textTertiary}
          style={isUser ? styles.timestampRight : styles.timestampLeft}
        >
          {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      ) : null}
    </View>
  );
}

/** Chat message bubble with word-by-word animation and typing indicator. */
export const ChatBubble = React.memo(ChatBubbleInner);

const styles = StyleSheet.create({
  container: {
    maxWidth: '82%',
    marginVertical: spacing.xxs,
  },
  containerUser: {
    alignSelf: 'flex-end',
  },
  containerAssistant: {
    alignSelf: 'flex-start',
  },
  bubble: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  wordWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  word: {
    ...textPresets.body,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  typingRow: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: spacing.xxs,
    paddingHorizontal: spacing.xxs,
  },
  timestampRight: {
    textAlign: 'right',
    marginTop: 2,
    marginRight: spacing.xxs,
  },
  timestampLeft: {
    textAlign: 'left',
    marginTop: 2,
    marginLeft: spacing.xxs,
  },
});
