/**
 * Sakha Chat tab — the primary spiritual-dialogue surface.
 *
 * Layout (top → bottom):
 *   1. ChatHeader       – breathing mandala + "Sakha" / "Paramatma is listening"
 *   2. SubMandalaTexture – faint sacred-geometry backdrop behind the scroll area
 *   3a. Empty state      – HeroMandala + hero prompt + ConversationStarters
 *   3b. Messages list    – alternating UserMessage / SakhaMessage + TypingIndicator
 *   4. ChatInput        – voice/text composer with send pulse
 *
 * Data flow:
 *   - `useSakhaStream` owns the SSE lifecycle (POST → token stream → done).
 *   - On stream completion we fire a golden pulse on the header, persist the
 *     conversation snapshot to AsyncStorage (so the tab survives a cold kill
 *     without losing context), and let the caller draft again.
 *   - When the device is offline (NetInfo says so) we short-circuit the
 *     send and surface a compassionate placeholder without a failed POST.
 *   - The session_id returned on the first frame is threaded back on the
 *     next send so the backend can keep conversational context.
 *
 * Accessibility: every control has an `accessibilityRole` + label. The FAB
 * is hidden (opacity-fade, `pointerEvents="none"`) while streaming so the
 * user can't double-send.
 */

'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  View,
  type ListRenderItemInfo,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as Speech from 'expo-speech';

import { useDictation } from '../../voice/hooks/useDictation';

import {
  ChatHeader,
  type ChatHeaderHandle,
  ChatInput,
  ConversationStarters,
  HeroMandala,
  SakhaMessage,
  TypingIndicator,
  UserMessage,
  useSakhaStream,
  type SakhaStreamMessage,
} from '../../components/chat/index';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

/** AsyncStorage key that keeps the last conversation so it survives cold kills. */
const CONVERSATION_CACHE_KEY = 'sakha_chat_conversation_v1';
/** Max number of messages we keep in the persisted snapshot. */
const MAX_CACHED_MESSAGES = 60;

/**
 * Height of the custom DivineTabBar's content (safe-area bottom is added on
 * top inside the tab bar itself). The tab bar is `position: absolute, bottom:
 * 0` so it overlays tab screens; we reserve this space on the chat root so
 * the ChatInput sits above it instead of being covered by the Home /
 * Sakha / Shlokas row.
 *
 * Must stay in sync with `TAB_BAR_HEIGHT` in components/navigation/DivineTabBar.tsx.
 */
const TAB_BAR_CONTENT_HEIGHT = 64;

interface CachedConversation {
  readonly sessionId: string | null;
  readonly messages: SakhaStreamMessage[];
}

const HERO_PROMPT_EN = 'What weighs upon your heart?';

const OFFLINE_BANNER_TEXT =
  'You appear to be offline. I will listen as soon as the connection returns.';

export default function ChatScreen(): React.JSX.Element {
  const listRef = useRef<FlatList<SakhaStreamMessage>>(null);
  const headerRef = useRef<ChatHeaderHandle | null>(null);
  const { isOnline } = useNetworkStatus();

  const [input, setInput] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const {
    messages,
    streaming,
    error,
    sessionId,
    send,
    abort,
    reset,
    restore,
    onStreamCompleted,
  } = useSakhaStream();

  // ── Persistence: restore the last session on mount. ───────────────────────
  // Earlier versions of this code wrote the cache but NEVER restored it.
  // The hook exposed no setter, so the comment in the previous block read
  // "we just mark restored and leave the in-memory list empty" — meaning
  // user force-quit + relaunch always saw an empty chat tab even though
  // their last 30 messages were sitting in AsyncStorage.
  // Now useSakhaStream exposes `restore()` (added 2025-11) and we wire it
  // here on initial mount.
  const [restored, setRestored] = useState(false);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CONVERSATION_CACHE_KEY);
        if (!cancelled && raw) {
          const parsed = JSON.parse(raw) as CachedConversation;
          if (Array.isArray(parsed?.messages) && parsed.messages.length > 0) {
            // Re-inject the cached messages into the hook's in-memory
            // state. The hook's `restore` method no-ops if a stream is
            // currently in flight or if messages are already present,
            // so this is safe even if the user navigates away + back
            // in quick succession. The cache also still feeds analytics
            // through the existing persistence write below.
            restore(parsed.messages);
          }
        }
      } catch {
        /* non-fatal: cache unavailable */
      } finally {
        if (!cancelled) setRestored(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // restore is intentionally omitted from deps — useCallback keeps it
    // referentially stable across renders, but adding it would cause
    // this hydration effect to re-run on every render (defeating the
    // mount-only intent of `[]`).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Persistence: save the last N messages whenever they change. ───────────
  useEffect(() => {
    if (!restored) return;
    const snapshot: CachedConversation = {
      sessionId,
      messages: messages.slice(-MAX_CACHED_MESSAGES),
    };
    AsyncStorage.setItem(
      CONVERSATION_CACHE_KEY,
      JSON.stringify(snapshot)
    ).catch(() => {
      /* best-effort — safe to ignore when storage is full */
    });
  }, [messages, sessionId, restored]);

  // ── When a stream completes, fire the golden header pulse. ────────────────
  useEffect(() => {
    onStreamCompleted(() => {
      headerRef.current?.pulse();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Read Sakha's final response aloud via Android's native
      // TextToSpeech (the same engine kiaanverse.com Chrome uses
      // through the SpeechSynthesis API). expo-speech wraps
      // android.speech.tts.TextToSpeech directly, so this is the
      // exact cross-platform parity the user asked for.
      //
      // Auto-speak removed (per user request 2025-11): chat responses
      // should NOT play automatically. The user reads at their own
      // pace; they tap the Listen button on a specific message bubble
      // (see SakhaMessage's MessageActionBar) when they want to hear
      // it. This matches kiaanverse.com mobile behavior — chat is for
      // considered messages + reading, voice-companion is for fluid
      // conversation. Auto-listen still fires on /voice-companion.
    });
    return () => {
      onStreamCompleted(null);
      // Clean up any in-flight speech when the chat tab unmounts —
      // catches the case where the user tapped Listen on a message,
      // started playback, then navigated away mid-utterance.
      Speech.stop();
    };
  }, [onStreamCompleted]);

  // ── Auto-scroll on new content. ───────────────────────────────────────────
  useEffect(() => {
    if (messages.length === 0) return;
    // Defer a tick so the new bubble has measured.
    const timer = setTimeout(() => {
      listRef.current?.scrollToEnd({ animated: true });
    }, 60);
    return () => clearTimeout(timer);
  }, [messages]);

  // ── Send flow ─────────────────────────────────────────────────────────────
  const handleSend = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || streaming) return;

      if (!isOnline) {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Warning
        );
        return;
      }

      setInput('');
      await send(trimmed);
    },
    [isOnline, send, streaming]
  );

  const handleSubmit = useCallback(() => {
    void handleSend(input);
  }, [handleSend, input]);

  const handleStarterSelect = useCallback(
    (prompt: string) => {
      void handleSend(prompt);
    },
    [handleSend]
  );

  const handleClearConversation = useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    abort();
    reset();
    AsyncStorage.removeItem(CONVERSATION_CACHE_KEY).catch(() => {
      /* non-fatal */
    });
  }, [abort, reset]);

  // ── Voice dictation (STT) ─────────────────────────────────────────────
  // Wires the chat composer's mic button to Android's native
  // SpeechRecognizer via SakhaDictation (the same engine Chrome's Web
  // Speech API uses on Android — kiaanverse.com mobile parity). On
  // success the captured transcript appends to the current `input`
  // state so the user can edit before sending OR submit immediately.
  // On error we surface the message inline + clear the listening state.
  const dictation = useDictation({
    // 'en-IN' picks up Indian English by default — same locale Sarvam
    // uses on the WSS path. Users speaking other Indian languages can
    // still get reasonable results because SpeechRecognizer falls back
    // to whatever the system language is set to.
    language: 'en-IN',
    onTranscript: (transcript) => {
      // Append (don't replace) so a partially-typed message isn't
      // wiped if the user tapped the mic mid-thought. Trim leading
      // whitespace if input was empty.
      setInput((current) =>
        current.trim() ? `${current.trim()} ${transcript}` : transcript,
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    },
    onError: (code, message) => {
      // eslint-disable-next-line no-console
      console.warn('[chat] dictation error', code, message);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    },
  });

  const handleToggleVoice = useCallback(() => {
    // If a dictation is already in flight, the user tapping again
    // is best treated as a no-op — useDictation guards internally
    // against double-start. We still flip the visual indicator so
    // the user gets immediate feedback.
    void Haptics.selectionAsync();
    setVoiceEnabled(true);
    void dictation.start();
  }, [dictation]);

  // Reflect actual dictation state in the visual `voiceEnabled` flag so
  // the mic button's UI tracks reality (idle vs listening vs resolving).
  useEffect(() => {
    if (dictation.state.tag === 'idle' || dictation.state.tag === 'error') {
      setVoiceEnabled(false);
    } else {
      setVoiceEnabled(true);
    }
  }, [dictation.state.tag]);

  // "Go deeper" follow-up handler — fires when the user taps the
  // conversation-mode pill on a Sakha message bubble. Sends the
  // follow-up prompt as a NEW user turn so the LLM has the prior
  // context server-side and can take the topic further.
  //
  // We pass the prompt through handleSend (not direct send) so the
  // online + streaming guards still apply — taps fired during a
  // network drop or while a previous response is still streaming
  // are swallowed by the same safeguards.
  const handleAskFollowUp = useCallback(
    (followUpPrompt: string) => {
      void handleSend(followUpPrompt);
    },
    [handleSend],
  );

  // ── Rendering helpers ────────────────────────────────────────────────────
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
          onAskFollowUp={handleAskFollowUp}
        />
      );
    },
    [handleAskFollowUp]
  );

  const keyExtractor = useCallback((item: SakhaStreamMessage) => item.id, []);

  const hasMessages = messages.length > 0;

  // Show the typing indicator only when streaming AND we have not yet
  // received the first token (i.e. the assistant bubble is still empty).
  const showTypingIndicator = useMemo(() => {
    if (!streaming) return false;
    const last = messages[messages.length - 1];
    return last?.role === 'assistant' && last.text.length === 0;
  }, [streaming, messages]);

  return (
    <View style={styles.root}>
      <ChatHeader
        ref={headerRef}
        streaming={streaming}
        onToggleVoice={handleToggleVoice}
        onClearConversation={handleClearConversation}
        voiceEnabled={voiceEnabled}
      />

      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <View style={styles.body}>
          {hasMessages ? (
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              // Tune virtualization for chat: typical session has 60+
              // cached messages, each is variable-height markdown +
              // verse cards. windowSize=10 keeps ~5 screens of
              // mounted rows; initialNumToRender=20 hides the
              // "popping in" effect when you tap the tab on a session
              // with history. removeClippedSubviews keeps offscreen
              // rows out of the native view hierarchy on Android, where
              // ScrollView memory pressure is the worst.
              windowSize={10}
              initialNumToRender={20}
              maxToRenderPerBatch={10}
              removeClippedSubviews={Platform.OS === 'android'}
              onContentSizeChange={() => {
                listRef.current?.scrollToEnd({ animated: true });
              }}
              ListFooterComponent={
                showTypingIndicator ? (
                  <View style={styles.typingWrap}>
                    <TypingIndicator />
                  </View>
                ) : null
              }
            />
          ) : (
            <View style={styles.empty}>
              <HeroMandala size={160} active={streaming} />
              <Text style={styles.heroPrompt} accessibilityRole="header">
                {HERO_PROMPT_EN}
              </Text>
              <View style={styles.startersWrap}>
                <ConversationStarters onSelect={handleStarterSelect} />
              </View>
            </View>
          )}

          {/* Offline banner — subtle, does not block the UI. */}
          {!isOnline && (
            <View
              style={[styles.offlineBanner, { bottom: 12 }]}
              accessibilityLiveRegion="polite"
              accessibilityLabel={OFFLINE_BANNER_TEXT}
            >
              <Text style={styles.offlineText}>{OFFLINE_BANNER_TEXT}</Text>
            </View>
          )}

          {/* Error toast — shown after a failed stream. */}
          {error && isOnline && !streaming && (
            <View
              style={[styles.offlineBanner, { bottom: 12 }]}
              accessibilityLiveRegion="polite"
            >
              <Text style={styles.offlineText}>{error}</Text>
            </View>
          )}

        </View>

        <ChatInput
          value={input}
          onChangeText={setInput}
          onSubmit={handleSubmit}
          onPressVoice={handleToggleVoice}
          disabled={streaming || !isOnline}
        />
      </KeyboardAvoidingView>
    </View>
  );
}

const GOLD = '#D4A017';
const BG = '#050714';
const TEXT_MUTED = 'rgba(200,191,168,0.78)';

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: BG,
    // Reserve room for the DivineTabBar that's `position: absolute, bottom:
    // 0`. Without this the ChatInput renders behind the tab bar and users
    // have nowhere to type.
    paddingBottom: TAB_BAR_CONTENT_HEIGHT,
  },
  keyboardAvoider: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
    paddingHorizontal: 12,
    gap: 8,
  },
  typingWrap: {
    paddingHorizontal: 12,
    paddingTop: 4,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 16,
  },
  heroPrompt: {
    fontFamily: 'CormorantGaramond-LightItalic',
    fontSize: 22,
    color: TEXT_MUTED,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 4,
  },
  startersWrap: {
    width: '100%',
    minHeight: 220,
    alignItems: 'stretch',
    justifyContent: 'center',
  },
  offlineBanner: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: 'rgba(22,26,66,0.96)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,23,0.35)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    shadowColor: GOLD,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  offlineText: {
    fontFamily: 'CrimsonText-Italic',
    fontSize: 13,
    color: '#F5F0E8',
    lineHeight: 18,
  },
});
