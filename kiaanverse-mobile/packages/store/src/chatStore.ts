/**
 * Chat Store — Zustand state for KIAAN Sakha chat UI.
 *
 * Manages:
 * - Current conversation messages (transient — refetched from backend)
 * - Streaming state for real-time AI responses
 * - Conversation session tracking
 * - Suggested follow-up prompts
 * - Unread message badge count
 *
 * Server data contract:
 * - Messages sent via useSendChatMessage() mutation (api.chat.send)
 * - History fetched via api.chat.history(sessionId)
 * - Sessions listed via api.chat.sessions()
 *
 * Persistence: Only conversationId and suggestedPrompts survive app restart.
 * Messages are transient — the backend is the source of truth.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import AsyncStorage from '@react-native-async-storage/async-storage';

// React Native/Expo global — always defined at runtime
declare const __DEV__: boolean;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single chat message in the KIAAN conversation. */
export interface ChatMessage {
  /** Unique message identifier */
  id: string;
  /** Who sent the message */
  role: 'user' | 'assistant';
  /** Message text content */
  content: string;
  /** ISO timestamp of when the message was created */
  timestamp: string;
  /** Delivery status */
  status: 'sending' | 'sent' | 'error';
}

interface ChatState {
  /** Messages in the current conversation (transient, not persisted) */
  messages: ChatMessage[];
  /** Whether an AI response is currently streaming */
  isStreaming: boolean;
  /** ID of the message being streamed (assistant message placeholder) */
  streamingMessageId: string | null;
  /** Accumulated text from the streaming response */
  currentStreamText: string;
  /** Backend session ID for the current conversation */
  conversationId: string | null;
  /** AI-suggested follow-up prompts */
  suggestedPrompts: string[];
  /** Number of unread messages (for badge display) */
  unreadCount: number;
}

interface ChatActions {
  /** Add a fully-formed message to the conversation */
  addMessage: (message: ChatMessage) => void;
  /** Update the streaming text accumulator (called on each SSE chunk) */
  updateStreamingText: (text: string) => void;
  /** Begin streaming an assistant response */
  startStreaming: (messageId: string) => void;
  /** Finish streaming — commit accumulated text to the message */
  finishStreaming: () => void;
  /** Clear all messages (e.g. when starting a new conversation) */
  clearMessages: () => void;
  /** Set the backend conversation/session ID */
  setConversationId: (id: string | null) => void;
  /** Replace suggested prompts */
  setSuggestedPrompts: (prompts: string[]) => void;
  /** Increment the unread badge count */
  incrementUnread: () => void;
  /** Reset the unread badge count to zero */
  resetUnread: () => void;
}

// ---------------------------------------------------------------------------
// Initial State
// ---------------------------------------------------------------------------

const initialState: ChatState = {
  messages: [],
  isStreaming: false,
  streamingMessageId: null,
  currentStreamText: '',
  conversationId: null,
  suggestedPrompts: [],
  unreadCount: 0,
};

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useChatStore = create<ChatState & ChatActions>()(
  devtools(
    persist(
      immer((set, get) => ({
        ...initialState,

        addMessage: (message: ChatMessage) => {
          set((state) => {
            state.messages.push(message);
          });
        },

        updateStreamingText: (text: string) => {
          set((state) => {
            state.currentStreamText = text;
          });
        },

        startStreaming: (messageId: string) => {
          set((state) => {
            state.isStreaming = true;
            state.streamingMessageId = messageId;
            state.currentStreamText = '';
          });
        },

        finishStreaming: () => {
          const { streamingMessageId, currentStreamText, messages } = get();
          if (!streamingMessageId) return;

          set((state) => {
            const messageIndex = state.messages.findIndex(
              (m) => m.id === streamingMessageId,
            );
            if (messageIndex !== -1) {
              const msg = state.messages[messageIndex];
              if (msg) {
                msg.content = currentStreamText;
                msg.status = 'sent';
              }
            } else {
              // Streaming message wasn't pre-added — create it now
              state.messages.push({
                id: streamingMessageId,
                role: 'assistant',
                content: currentStreamText,
                timestamp: new Date().toISOString(),
                status: 'sent',
              });
            }
            state.isStreaming = false;
            state.streamingMessageId = null;
            state.currentStreamText = '';
          });
        },

        clearMessages: () => {
          set((state) => {
            state.messages = [];
            state.isStreaming = false;
            state.streamingMessageId = null;
            state.currentStreamText = '';
            state.unreadCount = 0;
          });
        },

        setConversationId: (id: string | null) => {
          set((state) => {
            state.conversationId = id;
          });
        },

        setSuggestedPrompts: (prompts: string[]) => {
          set((state) => {
            state.suggestedPrompts = prompts;
          });
        },

        incrementUnread: () => {
          set((state) => {
            state.unreadCount += 1;
          });
        },

        resetUnread: () => {
          set((state) => {
            state.unreadCount = 0;
          });
        },
      })),
      {
        name: 'kiaanverse-chat',
        storage: createJSONStorage(() => AsyncStorage),
        // Only persist session tracking — messages are transient
        partialize: (state) => ({
          conversationId: state.conversationId,
          suggestedPrompts: state.suggestedPrompts,
        }),
      },
    ),
    {
      name: 'ChatStore',
      enabled: typeof __DEV__ !== 'undefined' && __DEV__,
    },
  ),
);
