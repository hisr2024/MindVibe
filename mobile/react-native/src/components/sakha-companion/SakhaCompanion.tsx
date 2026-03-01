/**
 * Sakha Spiritual Companion — Core Interaction Component
 *
 * Sakha ("Divine Friend") is MindVibe's distinguishing feature: a proactive,
 * emotion-aware spiritual companion that provides personalized Gita wisdom.
 *
 * This component handles:
 * - Text-based conversations with KIAAN backend
 * - Voice input/output toggle
 * - Emotion-aware greeting and responses
 * - Inline verse references with "play in Vibe Player" action
 * - Privacy toggle (on-device only vs cloud sync)
 * - Onboarding greeting flow
 *
 * IMPORTANT: This component consumes the KIAAN AI Ecosystem via API calls only.
 * It never modifies the KIAAN backend services directly.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  AccessibilityInfo,
} from 'react-native';
import Animated, {
  FadeInDown,
  FadeInUp,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';
import { colors, darkTheme, spacing, typography, radii, shadows } from '@theme/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SakhaMessageRole = 'user' | 'sakha' | 'system';

export interface SakhaMessage {
  id: string;
  role: SakhaMessageRole;
  content: string;
  timestamp: Date;
  /** Gita verse reference if the message contains wisdom */
  verseRef?: string;
  /** The emotion detected in the user's message */
  detectedEmotion?: string;
  /** Whether this message is still being streamed */
  isStreaming?: boolean;
}

export interface SakhaCompanionProps {
  /** Conversation messages */
  messages: SakhaMessage[];
  /** Whether Sakha is currently thinking */
  isThinking: boolean;
  /** Whether voice mode is active */
  isVoiceMode: boolean;
  /** Send a text message */
  onSendMessage: (text: string) => void;
  /** Toggle voice mode on/off */
  onToggleVoice: () => void;
  /** Play a verse in the Vibe Player */
  onPlayVerse: (verseRef: string) => void;
  /** Save a message to the journal */
  onSaveToJournal: (message: SakhaMessage) => void;
  /** Current theme */
  theme?: typeof darkTheme;
  /** Whether data stays on-device only */
  isLocalOnly: boolean;
  /** Toggle local-only mode */
  onToggleLocalOnly: () => void;
}

// ---------------------------------------------------------------------------
// Time-Aware Greeting Generator
// ---------------------------------------------------------------------------

function getTimeAwareGreeting(): { greeting: string; emoji: string } {
  const hour = new Date().getHours();

  if (hour >= 4 && hour < 7) {
    return { greeting: 'Sacred dawn, dear seeker', emoji: '🌅' };
  }
  if (hour >= 7 && hour < 12) {
    return { greeting: 'Good morning, dear friend', emoji: '☀️' };
  }
  if (hour >= 12 && hour < 17) {
    return { greeting: 'Peaceful afternoon', emoji: '🌤️' };
  }
  if (hour >= 17 && hour < 21) {
    return { greeting: 'Gentle evening, seeker', emoji: '🌙' };
  }
  return { greeting: 'Quiet night, dear soul', emoji: '✨' };
}

// ---------------------------------------------------------------------------
// Chat Bubble Component
// ---------------------------------------------------------------------------

interface ChatBubbleProps {
  message: SakhaMessage;
  theme: typeof darkTheme;
  onPlayVerse?: (verseRef: string) => void;
  onSaveToJournal?: (message: SakhaMessage) => void;
}

function ChatBubble({
  message,
  theme,
  onPlayVerse,
  onSaveToJournal,
}: ChatBubbleProps) {
  const isUser = message.role === 'user';
  const isSakha = message.role === 'sakha';

  return (
    <Animated.View
      entering={isUser ? FadeInUp.duration(250) : FadeInDown.duration(300)}
      style={[
        styles.bubbleContainer,
        isUser ? styles.bubbleContainerUser : styles.bubbleContainerSakha,
      ]}
      accessibilityRole="text"
      accessibilityLabel={`${isUser ? 'You' : 'Sakha'}: ${message.content}`}
    >
      {/* Sakha avatar */}
      {isSakha && (
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarEmoji}>🙏</Text>
        </View>
      )}

      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.bubbleUser, { backgroundColor: colors.gold[600] }]
            : [styles.bubbleSakha, { backgroundColor: theme.surfaceElevated }],
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? '#ffffff' : theme.textPrimary },
          ]}
        >
          {message.content}
        </Text>

        {/* Verse reference action */}
        {isSakha && message.verseRef && (
          <Pressable
            onPress={() => onPlayVerse?.(message.verseRef!)}
            style={styles.verseAction}
            accessibilityRole="button"
            accessibilityLabel={`Play Bhagavad Gita ${message.verseRef} in Vibe Player`}
          >
            <Text style={[styles.verseRefText, { color: colors.gold[400] }]}>
              📖 BG {message.verseRef}
            </Text>
            <Text style={[styles.versePlayText, { color: colors.gold[400] }]}>
              ▶ Play in Vibe Player
            </Text>
          </Pressable>
        )}

        {/* Save to journal action */}
        {isSakha && !message.isStreaming && (
          <Pressable
            onPress={() => onSaveToJournal?.(message)}
            style={styles.saveAction}
            accessibilityRole="button"
            accessibilityLabel="Save this insight to your journal"
          >
            <Text style={[styles.saveText, { color: theme.textTertiary }]}>
              📝 Save to journal
            </Text>
          </Pressable>
        )}

        {/* Timestamp */}
        <Text style={[styles.timestamp, { color: isUser ? 'rgba(255,255,255,0.6)' : theme.textTertiary }]}>
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Thinking Indicator (animated dots)
// ---------------------------------------------------------------------------

function ThinkingIndicator({ theme }: { theme: typeof darkTheme }) {
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.3);
  const opacity3 = useSharedValue(0.3);

  useEffect(() => {
    opacity1.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(0.3, { duration: 400 }),
      ),
      -1,
    );
    // Stagger the other dots
    setTimeout(() => {
      opacity2.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
      );
    }, 150);
    setTimeout(() => {
      opacity3.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 400 }),
          withTiming(0.3, { duration: 400 }),
        ),
        -1,
      );
    }, 300);
  }, [opacity1, opacity2, opacity3]);

  const dot1Style = useAnimatedStyle(() => ({ opacity: opacity1.value }));
  const dot2Style = useAnimatedStyle(() => ({ opacity: opacity2.value }));
  const dot3Style = useAnimatedStyle(() => ({ opacity: opacity3.value }));

  return (
    <View
      style={styles.thinkingContainer}
      accessibilityLabel="Sakha is thinking"
      accessibilityRole="progressbar"
    >
      <View style={styles.avatarContainer}>
        <Text style={styles.avatarEmoji}>🙏</Text>
      </View>
      <View style={[styles.thinkingBubble, { backgroundColor: theme.surfaceElevated }]}>
        <Animated.View style={[styles.thinkingDot, { backgroundColor: colors.gold[400] }, dot1Style]} />
        <Animated.View style={[styles.thinkingDot, { backgroundColor: colors.gold[400] }, dot2Style]} />
        <Animated.View style={[styles.thinkingDot, { backgroundColor: colors.gold[400] }, dot3Style]} />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Voice Orb (animated indicator for voice mode)
// ---------------------------------------------------------------------------

function VoiceOrb({ isActive, theme }: { isActive: boolean; theme: typeof darkTheme }) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (isActive) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 800 }),
          withTiming(1, { duration: 800 }),
        ),
        -1,
      );
    } else {
      scale.value = withTiming(1, { duration: 300 });
    }
  }, [isActive, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[styles.voiceOrb, shadows.glowStrong, animatedStyle]}
      accessibilityLabel={isActive ? 'Voice mode active. Listening.' : 'Voice mode inactive'}
    >
      <Text style={styles.voiceOrbIcon}>{isActive ? '🎙️' : '🎤'}</Text>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Privacy Toggle Component
// ---------------------------------------------------------------------------

interface PrivacyToggleProps {
  isLocalOnly: boolean;
  onToggle: () => void;
  theme: typeof darkTheme;
}

function PrivacyToggle({ isLocalOnly, onToggle, theme }: PrivacyToggleProps) {
  return (
    <Pressable
      onPress={onToggle}
      style={styles.privacyToggle}
      accessibilityRole="switch"
      accessibilityState={{ checked: isLocalOnly }}
      accessibilityLabel={
        isLocalOnly
          ? 'Conversations stored on device only. Tap to enable cloud sync.'
          : 'Conversations synced to cloud. Tap to switch to device-only.'
      }
    >
      <Text style={[styles.privacyIcon]}>
        {isLocalOnly ? '🔒' : '☁️'}
      </Text>
      <Text style={[styles.privacyText, { color: theme.textTertiary }]}>
        {isLocalOnly ? 'On-device only' : 'Cloud sync'}
      </Text>
    </Pressable>
  );
}

// ---------------------------------------------------------------------------
// Main Sakha Companion Component
// ---------------------------------------------------------------------------

export function SakhaCompanion({
  messages,
  isThinking,
  isVoiceMode,
  onSendMessage,
  onToggleVoice,
  onPlayVerse,
  onSaveToJournal,
  theme = darkTheme,
  isLocalOnly,
  onToggleLocalOnly,
}: SakhaCompanionProps) {
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);
  const greeting = getTimeAwareGreeting();

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed) return;
    onSendMessage(trimmed);
    setInputText('');
    AccessibilityInfo.announceForAccessibility('Message sent');
  }, [inputText, onSendMessage]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const renderMessage = useCallback(
    ({ item }: { item: SakhaMessage }) => (
      <ChatBubble
        message={item}
        theme={theme}
        onPlayVerse={onPlayVerse}
        onSaveToJournal={onSaveToJournal}
      />
    ),
    [theme, onPlayVerse, onSaveToJournal],
  );

  const ListHeader = useCallback(
    () => (
      <View style={styles.greetingContainer}>
        <Text style={styles.greetingEmoji}>{greeting.emoji}</Text>
        <Text style={[styles.greetingText, { color: theme.textPrimary }]}>
          {greeting.greeting}
        </Text>
        <Text style={[styles.greetingSubtext, { color: theme.textSecondary }]}>
          {"I am Sakha, your spiritual companion. Share what's on your mind, and I'll offer wisdom from the Bhagavad Gita to guide your path."}
        </Text>
        <PrivacyToggle
          isLocalOnly={isLocalOnly}
          onToggle={onToggleLocalOnly}
          theme={theme}
        />
      </View>
    ),
    [greeting, theme, isLocalOnly, onToggleLocalOnly],
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Message list */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={messages.length === 0 ? ListHeader : undefined}
        contentContainerStyle={styles.messageList}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          isThinking ? <ThinkingIndicator theme={theme} /> : null
        }
      />

      {/* Voice mode overlay */}
      {isVoiceMode && (
        <View style={styles.voiceModeOverlay}>
          <VoiceOrb isActive={true} theme={theme} />
          <Text style={[styles.voiceModeText, { color: theme.textPrimary }]}>
            Speak to Sakha...
          </Text>
          <Pressable
            onPress={onToggleVoice}
            style={styles.voiceModeCancel}
            accessibilityRole="button"
            accessibilityLabel="Stop voice mode"
          >
            <Text style={[styles.voiceModeCancelText, { color: theme.textSecondary }]}>
              Tap to stop
            </Text>
          </Pressable>
        </View>
      )}

      {/* Input bar */}
      {!isVoiceMode && (
        <View style={[styles.inputBar, { backgroundColor: theme.surface }]}>
          {/* Voice toggle */}
          <Pressable
            onPress={onToggleVoice}
            style={styles.voiceButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Switch to voice mode"
          >
            <Text style={styles.voiceButtonIcon}>🎤</Text>
          </Pressable>

          {/* Text input */}
          <TextInput
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            placeholder="Share what's on your mind..."
            placeholderTextColor={theme.textTertiary}
            style={[
              styles.input,
              {
                backgroundColor: theme.inputBackground,
                borderColor: theme.inputBorder,
                color: theme.textPrimary,
              },
            ]}
            multiline
            maxLength={2000}
            returnKeyType="send"
            blurOnSubmit
            accessibilityLabel="Message input"
            accessibilityHint="Type your message to Sakha"
          />

          {/* Send button */}
          <Pressable
            onPress={handleSend}
            disabled={!inputText.trim()}
            style={[
              styles.sendButton,
              {
                backgroundColor: inputText.trim()
                  ? colors.gold[500]
                  : theme.inputBackground,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !inputText.trim() }}
          >
            <Text
              style={[
                styles.sendIcon,
                {
                  color: inputText.trim()
                    ? colors.divine.void
                    : theme.textTertiary,
                },
              ]}
            >
              ↑
            </Text>
          </Pressable>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },

  // Greeting
  greetingContainer: {
    alignItems: 'center',
    paddingVertical: spacing['5xl'],
    paddingHorizontal: spacing.xl,
  },
  greetingEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  greetingText: {
    ...typography.h2,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  greetingSubtext: {
    ...typography.body,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },

  // Bubbles
  bubbleContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    maxWidth: '85%',
  },
  bubbleContainerUser: {
    alignSelf: 'flex-end',
  },
  bubbleContainerSakha: {
    alignSelf: 'flex-start',
  },
  avatarContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(212, 164, 76, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
    marginTop: spacing.xs,
  },
  avatarEmoji: {
    fontSize: 16,
  },
  bubble: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxWidth: '100%',
    flexShrink: 1,
  },
  bubbleUser: {
    borderBottomRightRadius: radii.xs,
  },
  bubbleSakha: {
    borderBottomLeftRadius: radii.xs,
  },
  bubbleText: {
    ...typography.body,
  },

  // Verse action
  verseAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 164, 76, 0.15)',
  },
  verseRefText: {
    ...typography.label,
  },
  versePlayText: {
    ...typography.caption,
  },

  // Save action
  saveAction: {
    marginTop: spacing.sm,
  },
  saveText: {
    ...typography.caption,
  },

  // Timestamp
  timestamp: {
    ...typography.caption,
    fontSize: 11,
    marginTop: spacing.xs,
    alignSelf: 'flex-end',
  },

  // Thinking indicator
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  thinkingBubble: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    borderBottomLeftRadius: radii.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  thinkingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Voice mode
  voiceModeOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 5, 7, 0.9)',
    zIndex: 50,
  },
  voiceOrb: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.gold[500],
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  voiceOrbIcon: {
    fontSize: 40,
  },
  voiceModeText: {
    ...typography.h3,
    marginBottom: spacing.xl,
  },
  voiceModeCancel: {
    padding: spacing.lg,
  },
  voiceModeCancelText: {
    ...typography.label,
  },

  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
    gap: spacing.sm,
  },
  voiceButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    maxHeight: 120,
    ...typography.body,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    fontSize: 20,
    fontWeight: '700',
  },

  // Privacy toggle
  privacyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.full,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  privacyIcon: {
    fontSize: 14,
  },
  privacyText: {
    ...typography.caption,
  },
});

export default SakhaCompanion;
