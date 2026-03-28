/**
 * Viyoga — The Sacred Art of Letting Go
 *
 * Chat-based detachment guidance tool. Users share what they struggle
 * to release, and KIAAN responds with Gita-rooted wisdom on viyoga
 * (non-attachment). Messages are displayed as chat bubbles with
 * auto-scroll and a bottom input bar.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { Send } from 'lucide-react-native';
import {
  Screen,
  Text,
  GoldenHeader,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import { useViyogaChat } from '@kiaanverse/api';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const WELCOME_TIMESTAMP = Date.now();

export default function ViyogaScreen(): React.JSX.Element {
  const router = useRouter();
  const viyogaMutation = useViyogaChat();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Namaste. I am here to guide you through the sacred practice of Viyoga — non-attachment. ' +
        'Share what you are struggling to let go of, and together we will find the wisdom within.',
      timestamp: WELCOME_TIMESTAMP,
    },
  ]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || viyogaMutation.isPending) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const result = await viyogaMutation.mutateAsync({
        message: text,
        ...(sessionId ? { sessionId } : {}),
      });

      if (!sessionId && result.session_id) {
        setSessionId(result.session_id);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.message,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'The path to letting go sometimes pauses. Please try sharing again.',
          timestamp: Date.now(),
        },
      ]);
    }
  }, [input, sessionId, viyogaMutation]);

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => (
    <View
      style={[
        styles.bubble,
        item.role === 'user' ? styles.userBubble : styles.assistantBubble,
      ]}
    >
      <Text variant="body" color={colors.text.primary}>
        {item.content}
      </Text>
    </View>
  ), []);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <GoldenHeader title="Viyoga" onBack={() => router.back()} />

      <Animated.View entering={FadeInDown.duration(400)} style={styles.intro}>
        <Text variant="body" color={colors.text.secondary} align="center">
          The Sacred Art of Letting Go
        </Text>
        <Text variant="caption" color={colors.primary[300]} align="center">
          BG 2.47 — "You have a right to perform your duty, but not to the fruits of action."
        </Text>
      </Animated.View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />

        {viyogaMutation.isPending ? (
          <View style={styles.typingIndicator}>
            <Text variant="caption" color={colors.primary[300]}>
              Seeking wisdom...
            </Text>
          </View>
        ) : null}

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Share what you are holding onto..."
            placeholderTextColor={colors.text.muted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || viyogaMutation.isPending}
            style={[styles.sendButton, { opacity: input.trim() ? 1 : 0.4 }]}
            accessibilityLabel="Share message"
            accessibilityRole="button"
          >
            <Send size={20} color={colors.primary[500]} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.xxs,
  },
  chatContainer: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radii.lg,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: colors.alpha.goldMedium,
    borderBottomRightRadius: radii.sm,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: colors.background.surface,
    borderBottomLeftRadius: radii.sm,
  },
  typingIndicator: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.alpha.whiteLight,
    backgroundColor: colors.background.card,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 100,
    color: colors.text.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
    backgroundColor: colors.background.surface,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
