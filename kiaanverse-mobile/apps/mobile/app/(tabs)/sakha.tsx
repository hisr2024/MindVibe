/**
 * Sakha Tab — KIAAN AI Companion Chat
 *
 * Real-time chat interface for spiritual guidance.
 * Features cosmic gradient background and golden-accented chat bubbles.
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
import { LinearGradient } from 'expo-linear-gradient';
import { Send } from 'lucide-react-native';
import { Screen, Text, colors, spacing, radii, gradients } from '@kiaanverse/ui';
import { useSendChatMessage } from '@kiaanverse/api';
import { useTranslation } from '@kiaanverse/i18n';
import { useTheme } from '@kiaanverse/ui';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

// Stable timestamp for the initial welcome message (set once at module load).
const WELCOME_TIMESTAMP = Date.now();

export default function SakhaScreen(): React.JSX.Element {
  const { t } = useTranslation('kiaan');
  const { theme, isDark } = useTheme();
  const c = theme.colors;
  const sendMessage = useSendChatMessage();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: t('welcome'),
      timestamp: WELCOME_TIMESTAMP,
    },
  ]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    try {
      const result = await sendMessage.mutateAsync({ message: text, ...(sessionId ? { sessionId } : {}) });
      const response = result as { response: string; session_id: string };

      if (!sessionId) {
        setSessionId(response.session_id);
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.response,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: t('error'),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  }, [input, sessionId, sendMessage, t]);

  const mode = isDark ? 'dark' : 'light';

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';

    return (
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble,
        ]}
      >
        {isUser ? (
          <LinearGradient
            colors={[colors.alpha.goldMedium, colors.alpha.goldLight]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: radii.lg, borderBottomRightRadius: radii.sm }]}
          />
        ) : (
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: c.surfaceElevated,
                borderRadius: radii.lg,
                borderBottomLeftRadius: radii.sm,
              },
            ]}
          />
        )}
        <Text variant="body">{item.content}</Text>
      </View>
    );
  }, [c.surfaceElevated]);

  return (
    <Screen edges={['top', 'left', 'right']} gradient>
      <View style={styles.header}>
        <Text variant="h2">Sakha</Text>
        <Text variant="caption" color={c.textTertiary}>
          Your spiritual companion
        </Text>
      </View>

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

        {sendMessage.isPending ? (
          <View style={styles.typingIndicator}>
            <Text variant="caption" color={colors.primary[300]}>
              {t('thinking')}
            </Text>
          </View>
        ) : null}

        <View style={[styles.inputRow, { backgroundColor: c.surfaceElevated, borderTopColor: c.divider }]}>
          <TextInput
            style={[
              styles.textInput,
              { color: c.textPrimary, backgroundColor: c.inputBackground },
            ]}
            placeholder={t('placeholder')}
            placeholderTextColor={c.textTertiary}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={2000}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <Pressable
            onPress={handleSend}
            disabled={!input.trim() || sendMessage.isPending}
            style={[
              styles.sendButton,
              { opacity: input.trim() ? 1 : 0.4 },
            ]}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <Send size={20} color={c.accent} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
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
  messageBubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: radii.sm,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
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
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    maxHeight: 100,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.xl,
  },
  sendButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
