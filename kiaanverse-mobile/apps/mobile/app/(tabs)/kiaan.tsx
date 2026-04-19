/**
 * Kiaan / Sakha Chat Screen — 1:1 port of the web /m/chat experience.
 *
 * Composition:
 *
 *   ┌─────────────────────────────────────────────────────┐
 *   │ ChatHeader (fixed at top)                           │
 *   ├─────────────────────────────────────────────────────┤
 *   │ DivineBackground (cosmic aura)                      │
 *   │   └── SubMandalaTexture (Skia Shatkona, 4% opacity) │
 *   │       └── inverted FlatList of messages             │
 *   │            • ConversationStarters on empty state    │
 *   │            • SakhaMessage / UserMessage per entry   │
 *   │            • TypingIndicator while streaming        │
 *   ├─────────────────────────────────────────────────────┤
 *   │ ChatInput (fixed at bottom, keyboard-aware)         │
 *   └─────────────────────────────────────────────────────┘
 *
 * Streaming lifecycle:
 *   1. User taps a SacredChip or sends text.
 *   2. useSakhaStream appends the user message + an empty assistant shell,
 *      sets streaming=true, opens XHR SSE pipe.
 *   3. ChatHeader DivinePresenceIndicator intensifies (halo opacity doubles).
 *   4. As each `{ word, done }` arrives, the assistant message grows and
 *      SakhaMessage's VerseRevelation fades new words in (60 ms stagger).
 *   5. On `{done:true}` / EOF, ChatHeader fires a one-shot golden pulse
 *      (via ref.pulse()) 1500 ms after stream end, streaming flips false,
 *      and the assistant message renders a one-shot completion shimmer.
 *   6. On error, the assistant bubble shows the compassionate fallback
 *      "My connection to the cosmic network wavered…"
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  View,
  type ListRenderItem,
} from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { DivineBackground } from '@kiaanverse/ui';

import {
  ChatHeader,
  type ChatHeaderHandle,
  SubMandalaTexture,
  UserMessage,
  SakhaMessage,
  TypingIndicator,
  ChatInput,
  ConversationStarters,
  useSakhaStream,
  type SakhaStreamMessage,
} from '../../components/chat';

/** SecureStore key that the auth store uses for the access JWT.
 *  Must match packages/store/src/authStore.ts ACCESS_TOKEN_KEY. */
const ACCESS_TOKEN_KEY = 'kiaanverse_access_token';

/** Delay between stream end and the golden-pulse radiate in the header. */
const STREAM_END_PULSE_DELAY_MS = 1500;

export default function KiaanChatScreen(): React.JSX.Element {
  const [draft, setDraft] = React.useState('');
  const [voiceEnabled, setVoiceEnabled] = React.useState(false);
  const headerRef = useRef<ChatHeaderHandle>(null);
  const listRef = useRef<FlatList<SakhaStreamMessage>>(null);
  const pulseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  }, []);

  const {
    messages,
    streaming,
    send,
    onStreamCompleted,
  } = useSakhaStream({ getAccessToken });

  // Golden pulse from the header fires 1.5 s after the stream ends.
  useEffect(() => {
    onStreamCompleted(() => {
      if (pulseTimeoutRef.current) clearTimeout(pulseTimeoutRef.current);
      pulseTimeoutRef.current = setTimeout(() => {
        headerRef.current?.pulse();
      }, STREAM_END_PULSE_DELAY_MS);
    });
    return () => {
      onStreamCompleted(null);
      if (pulseTimeoutRef.current) {
        clearTimeout(pulseTimeoutRef.current);
        pulseTimeoutRef.current = null;
      }
    };
  }, [onStreamCompleted]);

  const handleSend = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void send(text);
  }, [draft, send]);

  const handleSelectStarter = useCallback(
    (prompt: string) => {
      setDraft('');
      void send(prompt);
    },
    [send],
  );

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled((prev) => !prev);
  }, []);

  /** Inverted list needs messages newest-first. */
  const invertedData = useMemo(() => {
    return [...messages].reverse();
  }, [messages]);

  const renderItem = useCallback<ListRenderItem<SakhaStreamMessage>>(
    ({ item }) => {
      if (item.role === 'user') {
        return <UserMessage id={item.id} text={item.text} />;
      }
      return (
        <SakhaMessage
          id={item.id}
          text={item.text}
          isStreaming={item.isStreaming}
        />
      );
    },
    [],
  );

  const keyExtractor = useCallback((m: SakhaStreamMessage) => m.id, []);

  const ListHeader = useCallback(() => {
    // Rendered at the visual bottom of an inverted list.
    if (!streaming) return null;
    return (
      <View style={styles.typingSlot}>
        <TypingIndicator />
      </View>
    );
  }, [streaming]);

  const hasMessages = messages.length > 0;

  return (
    <View style={styles.root}>
      <DivineBackground variant="cosmic">
        <ChatHeader
          ref={headerRef}
          streaming={streaming}
          voiceEnabled={voiceEnabled}
          onToggleVoice={handleToggleVoice}
        />

        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
          keyboardVerticalOffset={0}
        >
          <View style={styles.body}>
            {/* Static sacred-geometry texture behind the scroll area. */}
            <SubMandalaTexture />

            {hasMessages ? (
              <FlatList
                ref={listRef}
                data={invertedData}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                inverted
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={ListHeader}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <ConversationStarters onSelect={handleSelectStarter} />
            )}
          </View>

          <ChatInput
            value={draft}
            onChangeText={setDraft}
            onSubmit={handleSend}
            disabled={streaming}
          />
        </KeyboardAvoidingView>
      </DivineBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#050714',
  },
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  listContent: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 16,
    gap: 6,
  },
  typingSlot: {
    paddingVertical: 6,
    paddingLeft: 6,
  },
});
