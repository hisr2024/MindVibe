/**
 * Chat Store — Unit Test Stubs
 *
 * Tests for KIAAN Sakha chat state management.
 */

import { useChatStore, type ChatMessage } from '../chatStore';

// Helper to reset store between tests
function resetStore() {
  useChatStore.setState({
    messages: [],
    isStreaming: false,
    streamingMessageId: null,
    currentStreamText: '',
    conversationId: null,
    suggestedPrompts: [],
    unreadCount: 0,
  });
}

describe('useChatStore', () => {
  beforeEach(() => {
    resetStore();
  });

  describe('initial state', () => {
    it('should initialize with empty messages', () => {
      const state = useChatStore.getState();
      expect(state.messages).toEqual([]);
      expect(state.isStreaming).toBe(false);
      expect(state.streamingMessageId).toBeNull();
      expect(state.currentStreamText).toBe('');
      expect(state.conversationId).toBeNull();
      expect(state.suggestedPrompts).toEqual([]);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('addMessage', () => {
    it('should add a message to the list', () => {
      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello Sakha',
        timestamp: new Date().toISOString(),
        status: 'sent',
      };

      useChatStore.getState().addMessage(message);

      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.messages[0]).toEqual(message);
    });

    it('should append multiple messages in order', () => {
      const msg1: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'First',
        timestamp: new Date().toISOString(),
        status: 'sent',
      };
      const msg2: ChatMessage = {
        id: 'msg-2',
        role: 'assistant',
        content: 'Second',
        timestamp: new Date().toISOString(),
        status: 'sent',
      };

      useChatStore.getState().addMessage(msg1);
      useChatStore.getState().addMessage(msg2);

      const state = useChatStore.getState();
      expect(state.messages).toHaveLength(2);
      expect(state.messages[0]?.id).toBe('msg-1');
      expect(state.messages[1]?.id).toBe('msg-2');
    });
  });

  describe('streaming', () => {
    it('should start streaming', () => {
      useChatStore.getState().startStreaming('stream-1');

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(true);
      expect(state.streamingMessageId).toBe('stream-1');
      expect(state.currentStreamText).toBe('');
    });

    it('should update streaming text', () => {
      useChatStore.getState().startStreaming('stream-1');
      useChatStore.getState().updateStreamingText('Hello ');
      useChatStore.getState().updateStreamingText('Hello world');

      expect(useChatStore.getState().currentStreamText).toBe('Hello world');
    });

    it('should finish streaming and commit text to message', () => {
      const placeholder: ChatMessage = {
        id: 'stream-1',
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        status: 'sending',
      };

      useChatStore.getState().addMessage(placeholder);
      useChatStore.getState().startStreaming('stream-1');
      useChatStore.getState().updateStreamingText('Completed response');
      useChatStore.getState().finishStreaming();

      const state = useChatStore.getState();
      expect(state.isStreaming).toBe(false);
      expect(state.streamingMessageId).toBeNull();
      expect(state.currentStreamText).toBe('');
      expect(state.messages[0]?.content).toBe('Completed response');
      expect(state.messages[0]?.status).toBe('sent');
    });
  });

  describe('clearMessages', () => {
    it('should clear all messages and reset streaming state', () => {
      useChatStore.getState().addMessage({
        id: 'msg-1',
        role: 'user',
        content: 'Test',
        timestamp: new Date().toISOString(),
        status: 'sent',
      });
      useChatStore.getState().incrementUnread();

      useChatStore.getState().clearMessages();

      const state = useChatStore.getState();
      expect(state.messages).toEqual([]);
      expect(state.isStreaming).toBe(false);
      expect(state.unreadCount).toBe(0);
    });
  });

  describe('conversationId', () => {
    it('should set and clear conversation ID', () => {
      useChatStore.getState().setConversationId('session-123');
      expect(useChatStore.getState().conversationId).toBe('session-123');

      useChatStore.getState().setConversationId(null);
      expect(useChatStore.getState().conversationId).toBeNull();
    });
  });

  describe('suggestedPrompts', () => {
    it('should set suggested prompts', () => {
      useChatStore.getState().setSuggestedPrompts(['How can I find peace?', 'Tell me about karma']);
      expect(useChatStore.getState().suggestedPrompts).toEqual([
        'How can I find peace?',
        'Tell me about karma',
      ]);
    });
  });

  describe('unreadCount', () => {
    it('should increment unread count', () => {
      useChatStore.getState().incrementUnread();
      useChatStore.getState().incrementUnread();
      expect(useChatStore.getState().unreadCount).toBe(2);
    });

    it('should reset unread count', () => {
      useChatStore.getState().incrementUnread();
      useChatStore.getState().incrementUnread();
      useChatStore.getState().resetUnread();
      expect(useChatStore.getState().unreadCount).toBe(0);
    });
  });
});
