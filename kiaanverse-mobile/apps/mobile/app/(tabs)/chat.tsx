/**
 * Sakha Tab — The Divine Dialogue
 *
 * Kurukshetra rendered in light: the most sacred conversation on earth.
 *
 * Composition:
 *   ┌────────────────────────────────────────────────────────────┐
 *   │ ChatHeader                                                 │
 *   │  SakhaMandala + DivinePresenceIndicator halo · Sakha ·     │
 *   │  "परमात्मा is listening" | "Reflecting on dharma…"         │
 *   ├────────────────────────────────────────────────────────────┤
 *   │ DivineBackground particle field (screen gradient)          │
 *   │ SubMandalaTexture (Skia, ~4 % opacity, static)             │
 *   │                                                            │
 *   │  ┌──── FlatList of messages ────┐                          │
 *   │  │ UserMessage (right, Krishna-aura)                       │
 *   │  │ SakhaMessage (left, gold accent, word-by-word reveal)   │
 *   │  │ TypingIndicator (3 gold dots + rotating ॐ)              │
 *   │  └──────────────────────────────┘                          │
 *   │                                                            │
 *   │  …or, when empty: 80-px SakhaMandala + कहिए + 4 chips      │
 *   ├────────────────────────────────────────────────────────────┤
 *   │ ChatInput — [VoiceBtn | SacredInput | SendBtn]             │
 *   └────────────────────────────────────────────────────────────┘
 *
 * Streaming lifecycle is driven by `useSakhaStream`: tokens arrive over SSE
 * (XHR for React-Native compatibility), the SakhaMessage reveals them
 * word-by-word, and a golden shimmer + header pulse fire on completion.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { DivineBackground, SakhaMandala } from '@kiaanverse/ui';

import {
  ChatHeader,
  ChatInput,
  ConversationStarters,
  SakhaMessage,
  SubMandalaTexture,
  TypingIndicator,
  UserMessage,
  useSakhaStream,
  type ChatHeaderHandle,
  type SakhaStreamMessage,
} from '../../components/chat';

const TEXT_MUTED = 'rgba(200,191,168,0.75)';
const GOLD = '#D4A017';

export default function SakhaScreen(): React.JSX.Element {
  const headerRef = useRef<ChatHeaderHandle>(null);
  const listRef = useRef<FlatList<SakhaStreamMessage>>(null);

  const [draft, setDraft] = React.useState('');
  const [voiceEnabled, setVoiceEnabled] = React.useState(false);

  const { messages, streaming, send, reset, onStreamCompleted } =
    useSakhaStream();

  // Deep-link: a pre-filled context prompt (e.g. "Explain BG 2.47: …").
  // We only apply a given context string once — spurious re-renders with the
  // same value must not clobber the user's in-flight draft.
  const params = useLocalSearchParams<{ context?: string }>();
  const lastAppliedContextRef = useRef<string>('');
  useEffect(() => {
    const context = params.context;
    if (typeof context !== 'string' || context.length === 0) return;
    if (lastAppliedContextRef.current === context) return;
    lastAppliedContextRef.current = context;
    setDraft(context);
  }, [params.context]);

  // When the stream ends, fire the header's one-shot golden pulse.
  useEffect(() => {
    onStreamCompleted(() => {
      headerRef.current?.pulse();
    });
    return () => onStreamCompleted(null);
  }, [onStreamCompleted]);

  // Auto-scroll to the latest message as content grows.
  const scrollToEnd = useCallback(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, []);

  const handleSubmit = useCallback(() => {
    const text = draft.trim();
    if (!text || streaming) return;
    setDraft('');
    void send(text);
  }, [draft, streaming, send]);

  const handleStarter = useCallback(
    (prompt: string) => {
      if (streaming) return;
      setDraft('');
      void send(prompt);
    },
    [streaming, send],
  );

  const handleClearConversation = useCallback(() => {
    reset();
    setDraft('');
  }, [reset]);

  const handleToggleVoice = useCallback(() => {
    setVoiceEnabled((v) => !v);
  }, []);

  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<SakhaStreamMessage>) => {
      if (item.role === 'user') {
        return <UserMessage id={item.id} text={item.text} />;
      }
      return (
        <SakhaMessage
          id={item.id}
          text={item.text}
          isStreaming={item.isStreaming === true}
        />
      );
    },
    [],
  );

  const keyExtractor = useCallback((m: SakhaStreamMessage) => m.id, []);

  const isEmpty = messages.length === 0;

  // Show the typing indicator only while we're waiting on the very first
  // token of the assistant reply — once text has begun to stream the
  // SakhaMessage bubble carries the blinking cursor itself.
  const showTypingIndicator = useMemo(() => {
    if (!streaming) return false;
    const last = messages[messages.length - 1];
    return !!last && last.role === 'assistant' && last.text.length === 0;
  }, [streaming, messages]);

  return (
    <DivineBackground variant="cosmic" style={styles.root}>
      {/* Faint Sri-Yantra-style sub-mandala behind the chat scroll area. */}
      <SubMandalaTexture />

      <ChatHeader
        ref={headerRef}
        streaming={streaming}
        voiceEnabled={voiceEnabled}
        onToggleVoice={handleToggleVoice}
        onClearConversation={handleClearConversation}
      />

      {/* On both platforms we rely on `padding` — matches the spec's
          "behavior='padding' on Android" guidance so the ChatInput always
          floats above the keyboard rather than getting covered. */}
      <KeyboardAvoidingView
        style={styles.body}
        behavior="padding"
        keyboardVerticalOffset={0}
      >
        {isEmpty ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyMandalaWrap}>
              <SakhaMandala size={80} active={false} />
            </View>
            <Text
              style={styles.emptyKahiye}
              accessibilityRole="header"
              accessibilityLabel="Speak. What would you like to explore?"
            >
              कहिए
            </Text>
            <Text style={styles.emptyQuestion}>
              What would you like to explore?
            </Text>
            <View style={styles.startersWrap}>
              <ConversationStarters onSelect={handleStarter} />
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContent}
            keyboardDismissMode="interactive"
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={scrollToEnd}
            ListFooterComponent={
              showTypingIndicator ? <TypingIndicator /> : null
            }
            // Sub-mandala is drawn behind the list; keep the scroll view
            // transparent so it stays visible through the scroll area.
            style={styles.list}
          />
        )}

        <ChatInput
          value={draft}
          onChangeText={setDraft}
          onSubmit={handleSubmit}
          disabled={streaming}
        />
      </KeyboardAvoidingView>
    </DivineBackground>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  list: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 8,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  emptyMandalaWrap: {
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyKahiye: {
    fontFamily: 'NotoSansDevanagari-Regular',
    fontSize: 24,
    color: GOLD,
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  emptyQuestion: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 15,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 24,
  },
  startersWrap: {
    width: '100%',
    // ConversationStarters uses flex:1 internally to center itself; give
    // it an explicit minimum height so it can render inside this
    // centered empty-state column without collapsing.
    minHeight: 260,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
});
