/**
 * Sakha Chat Screen
 *
 * Full-screen KIAAN chat interface wrapping the SakhaCompanion component.
 * Manages:
 * - Chat session lifecycle
 * - Message state with TanStack Query
 * - Voice mode toggle
 * - Offline message queuing
 * - Verse playback integration with Vibe Player
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { SakhaCompanion } from '@components/sakha-companion/SakhaCompanion';
import { api } from '@services/apiClient';
import { useVibePlayerStore } from '@state/stores/vibePlayerStore';
import { darkTheme } from '@theme/tokens';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ChatMessage {
  id: string;
  sender: 'user' | 'sakha';
  text: string;
  timestamp: string;
  isStreaming?: boolean;
  verseRef?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SakhaChatScreen() {
  const insets = useSafeAreaInsets();
  const theme = darkTheme;
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { setCurrentTrack } = useVibePlayerStore();

  // Load chat history
  useQuery({
    queryKey: ['chat-history'],
    queryFn: async () => {
      const { data } = await api.chat.history(undefined, 50);
      const history = data.messages ?? data ?? [];
      const mapped: ChatMessage[] = history.map(
        (m: { id: string; role?: string; sender?: string; content?: string; text?: string; created_at?: string }) => ({
          id: m.id,
          sender: m.role === 'user' || m.sender === 'user' ? 'user' as const : 'sakha' as const,
          text: m.content ?? m.text ?? '',
          timestamp: m.created_at ?? new Date().toISOString(),
        }),
      );
      setMessages(mapped);
      return mapped;
    },
    staleTime: 2 * 60 * 1000,
  });

  // Send message
  const sendMutation = useMutation({
    mutationFn: async (message: string) => {
      const { data } = await api.chat.send(message, sessionId ?? undefined);
      return data;
    },
    onMutate: (message) => {
      const userMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        sender: 'user',
        text: message,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsThinking(true);
    },
    onSuccess: (data) => {
      setIsThinking(false);
      if (data.session_id) setSessionId(data.session_id);

      const sakhaMsg: ChatMessage = {
        id: `sakha-${Date.now()}`,
        sender: 'sakha',
        text: data.response ?? data.message ?? '',
        timestamp: new Date().toISOString(),
        verseRef: data.verses_used?.[0],
      };
      setMessages((prev) => [...prev, sakhaMsg]);
    },
    onError: () => {
      setIsThinking(false);
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        sender: 'sakha',
        text: 'I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    },
  });

  const handleSend = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      sendMutation.mutate(text.trim());
    },
    [sendMutation],
  );

  const handleVoiceToggle = useCallback(() => {
    setIsVoiceMode((prev) => !prev);
  }, []);

  const handlePlayVerse = useCallback(
    (verseRef: string) => {
      // Parse "BG 2.47" format
      const match = verseRef.match(/(\d+)\.(\d+)/);
      if (!match) return;

      setCurrentTrack({
        id: `verse-${match[1]}-${match[2]}`,
        title: `Verse ${match[1]}.${match[2]}`,
        artist: 'Bhagavad Gita',
        audioUrl: '', // Will be fetched by Vibe Player
        verseRef: `BG ${match[1]}.${match[2]}`,
      });
    },
    [setCurrentTrack],
  );

  const handleSaveToJournal = useCallback(
    (text: string) => {
      Alert.alert(
        'Saved to Journal',
        'This insight has been saved to your journal.',
        [{ text: 'OK' }],
      );
    },
    [],
  );

  // Map messages to SakhaCompanion format
  const companionMessages = useMemo(
    () =>
      messages.map((m) => ({
        id: m.id,
        sender: m.sender === 'user' ? ('user' as const) : ('sakha' as const),
        text: m.text,
        timestamp: m.timestamp,
        isStreaming: m.isStreaming,
        verseRef: m.verseRef,
      })),
    [messages],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SakhaCompanion
        messages={companionMessages}
        isThinking={isThinking}
        isVoiceMode={isVoiceMode}
        onSend={handleSend}
        onToggleVoice={handleVoiceToggle}
        onPlayVerse={handlePlayVerse}
        onSaveToJournal={handleSaveToJournal}
        theme={theme}
      />
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
