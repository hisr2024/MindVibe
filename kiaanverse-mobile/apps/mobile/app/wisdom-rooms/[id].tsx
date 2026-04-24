/**
 * Wisdom Room Chat — real-time discussion in a guided wisdom room.
 *
 * Displays room topic, message history (inverted FlatList for chat),
 * sender names with host badges, timestamps, and a bottom input bar.
 * Auto-scrolls to the latest message. Header includes room name and
 * a "Leave Room" action.
 */

import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import {
  Screen,
  Text,
  GoldenHeader,
  Badge,
  colors,
  spacing,
  radii,
} from '@kiaanverse/ui';
import {
  useWisdomRoomMessages,
  useSendWisdomRoomMessage,
  useWisdomRooms,
  type WisdomRoomMessage,
} from '@kiaanverse/api';

export default function WisdomRoomChatScreen(): React.JSX.Element {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const roomId = id ?? '';

  const { data: rooms } = useWisdomRooms();
  const room = rooms?.find((r) => r.id === roomId);

  const { data: messages } = useWisdomRoomMessages(roomId);
  const sendMutation = useSendWisdomRoomMessage();

  const [input, setInput] = useState('');
  const flatListRef = useRef<FlatList<WisdomRoomMessage>>(null);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || !roomId) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    sendMutation.mutate(
      { roomId, content: text },
      { onSuccess: () => setInput('') }
    );
  }, [input, roomId, sendMutation]);

  const handleLeave = useCallback(() => {
    Alert.alert(
      'Leave Room',
      'Are you sure you want to leave this wisdom room?',
      [
        { text: 'Stay', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => router.back(),
        },
      ]
    );
  }, [router]);

  const renderMessage = useCallback(
    ({ item }: { item: WisdomRoomMessage }) => {
      const isHost = room?.hostName === item.senderName;
      return (
        <View style={[styles.messageBubble, isHost && styles.hostBubble]}>
          <View style={styles.messageHeader}>
            <Text
              variant="caption"
              color={isHost ? colors.primary[300] : colors.text.secondary}
            >
              {item.senderName}
            </Text>
            {isHost ? <Badge label="Host" /> : null}
          </View>
          <Text variant="body" color={colors.text.primary}>
            {item.content}
          </Text>
          <Text variant="caption" color={colors.text.muted}>
            {new Date(item.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
        </View>
      );
    },
    [room?.hostName]
  );

  const keyExtractor = useCallback((item: WisdomRoomMessage) => item.id, []);

  return (
    <Screen edges={['top', 'left', 'right']}>
      <GoldenHeader
        title={room?.topic ?? 'Wisdom Room'}
        onBack={() => router.back()}
      />

      {/* Topic and leave button */}
      <View style={styles.topicRow}>
        {room?.description ? (
          <Text
            variant="bodySmall"
            color={colors.text.secondary}
            style={styles.topicText}
            numberOfLines={2}
          >
            {room.description}
          </Text>
        ) : null}
        <Pressable onPress={handleLeave} style={styles.leaveButton}>
          <Text variant="caption" color={colors.semantic.error}>
            Leave
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.chatContainer}
        keyboardVerticalOffset={100}
      >
        <FlatList
          ref={flatListRef}
          data={messages ?? []}
          keyExtractor={keyExtractor}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() =>
            flatListRef.current?.scrollToEnd({ animated: true })
          }
        />

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            placeholder="Share your wisdom..."
            placeholderTextColor={colors.text.muted}
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={500}
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Pressable
            style={[styles.sendButton, { opacity: input.trim() ? 1 : 0.4 }]}
            onPress={handleSend}
            disabled={!input.trim() || sendMutation.isPending}
            accessibilityLabel="Send message"
            accessibilityRole="button"
          >
            <Text variant="label" color={colors.background.dark}>
              {sendMutation.isPending ? '...' : '\u{1F64F}'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  topicText: {
    flex: 1,
  },
  leaveButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.semantic.error,
  },
  chatContainer: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    gap: spacing.sm,
  },
  messageBubble: {
    backgroundColor: colors.background.card,
    borderRadius: radii.lg,
    padding: spacing.sm,
    gap: spacing.xxs,
    borderLeftWidth: 2,
    borderLeftColor: colors.alpha.whiteLight,
  },
  hostBubble: {
    borderLeftColor: colors.primary[500],
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.alpha.whiteLight,
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background.card,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.text.primary,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.alpha.whiteLight,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary[500],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
