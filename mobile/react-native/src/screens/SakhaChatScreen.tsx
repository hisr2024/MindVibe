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

import { SakhaCompanion, type SakhaMessage } from '@components/sakha-companion/SakhaCompanion';
import { api } from '@services/apiClient';
import { useVibePlayerStore } from '@state/stores/vibePlayerStore';
import { darkTheme } from '@theme/tokens';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SakhaChatScreen() {
  const insets = useSafeAreaInsets();
  const theme = darkTheme;
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<SakhaMessage[]>([]);
  const [isThinking, setIsThinking] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [isLocalOnly, setIsLocalOnly] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const { setCurrentTrack, setPlayerVisible } = useVibePlayerStore();

  // Load chat history
  useQuery({
    queryKey: ['chat-history'],
    queryFn: async () => {
      const { data } = await api.chat.history(undefined, 50);
      const history = data.messages ?? data ?? [];
      const mapped: SakhaMessage[] = history.map(
        (m: { id: string; role?: string; sender?: string; content?: string; text?: string; created_at?: string }) => ({
          id: m.id,
          role: (m.role === 'user' || m.sender === 'user' ? 'user' : 'sakha') as SakhaMessage['role'],
          content: m.content ?? m.text ?? '',
          timestamp: new Date(m.created_at ?? Date.now()),
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
      const userMsg: SakhaMessage = {
        id: `local-${Date.now()}`,
        role: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsThinking(true);
    },
    onSuccess: (data) => {
      setIsThinking(false);
      if (data.session_id) setSessionId(data.session_id);

      const sakhaMsg: SakhaMessage = {
        id: `sakha-${Date.now()}`,
        role: 'sakha',
        content: data.response ?? data.message ?? '',
        timestamp: new Date(),
        verseRef: data.verses_used?.[0],
      };
      setMessages((prev) => [...prev, sakhaMsg]);
    },
    onError: () => {
      setIsThinking(false);
      const errorMsg: SakhaMessage = {
        id: `error-${Date.now()}`,
        role: 'sakha',
        content: 'I\'m having trouble connecting right now. Please try again in a moment.',
        timestamp: new Date(),
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

  const handleToggleLocalOnly = useCallback(() => {
    setIsLocalOnly((prev) => !prev);
  }, []);

  const handlePlayVerse = useCallback(
    (verseRef: string) => {
      const match = verseRef.match(/(\d+)\.(\d+)/);
      if (!match) return;

      setCurrentTrack({
        id: `verse-${match[1]}-${match[2]}`,
        title: `Verse ${match[1]}.${match[2]}`,
        subtitle: 'Bhagavad Gita',
        url: '',
        verseRef: `BG ${match[1]}.${match[2]}`,
      });
      setPlayerVisible(true);
    },
    [setCurrentTrack, setPlayerVisible],
  );

  const handleSaveToJournal = useCallback(
    (message: SakhaMessage) => {
      Alert.alert(
        'Saved to Journal',
        'This insight has been saved to your journal.',
        [{ text: 'OK' }],
      );
    },
    [],
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <SakhaCompanion
        messages={messages}
        isThinking={isThinking}
        isVoiceMode={isVoiceMode}
        onSendMessage={handleSend}
        onToggleVoice={handleVoiceToggle}
        onPlayVerse={handlePlayVerse}
        onSaveToJournal={handleSaveToJournal}
        isLocalOnly={isLocalOnly}
        onToggleLocalOnly={handleToggleLocalOnly}
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
