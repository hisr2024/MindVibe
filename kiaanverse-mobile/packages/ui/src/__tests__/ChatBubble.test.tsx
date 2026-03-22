/**
 * ChatBubble — Component Tests
 *
 * Tests user vs assistant variants, text display, typing indicator,
 * and testID forwarding. Reanimated mocked in ./setup.tsx.
 */

import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatBubble } from '../components/ChatBubble';

describe('ChatBubble', () => {
  it('renders content text for user role', () => {
    const { getByText } = render(
      <ChatBubble role="user" content="How can I find peace?" />,
    );

    expect(getByText('How can I find peace?')).toBeTruthy();
  });

  it('renders content text for assistant role', () => {
    const { getByText } = render(
      <ChatBubble role="assistant" content="Through the path of dharma..." />,
    );

    expect(getByText('Through the path of dharma...')).toBeTruthy();
  });

  it('aligns user messages to the right', () => {
    const { getByText } = render(
      <ChatBubble role="user" content="User message" />,
    );

    const bubble = getByText('User message');
    // Walk up to the container with alignSelf
    const container = bubble.parent?.parent?.parent;
    const containerStyle = container?.props?.style;

    // Flatten style array and check for flex-end alignment
    const styles = Array.isArray(containerStyle)
      ? containerStyle.reduce((acc: Record<string, unknown>, s: Record<string, unknown> | undefined) => ({ ...acc, ...s }), {})
      : containerStyle;

    expect(styles?.alignSelf).toBe('flex-end');
  });

  it('aligns assistant messages to the left', () => {
    const { getByText } = render(
      <ChatBubble role="assistant" content="Assistant message" />,
    );

    const bubble = getByText('Assistant message');
    const container = bubble.parent?.parent?.parent;
    const containerStyle = container?.props?.style;

    const styles = Array.isArray(containerStyle)
      ? containerStyle.reduce((acc: Record<string, unknown>, s: Record<string, unknown> | undefined) => ({ ...acc, ...s }), {})
      : containerStyle;

    expect(styles?.alignSelf).toBe('flex-start');
  });

  it('shows typing indicator when isTyping is true', () => {
    const { queryByText, getByLabelText } = render(
      <ChatBubble role="assistant" content="" isTyping />,
    );

    // Typing indicator has accessibilityLabel="Typing"
    expect(getByLabelText('Typing')).toBeTruthy();

    // Content should not be visible (empty string anyway)
    expect(queryByText('Some content')).toBeNull();
  });

  it('hides typing indicator when isTyping is false', () => {
    const { queryByLabelText, getByText } = render(
      <ChatBubble role="assistant" content="Visible content" />,
    );

    expect(queryByLabelText('Typing')).toBeNull();
    expect(getByText('Visible content')).toBeTruthy();
  });

  it('forwards testID prop', () => {
    const { getByTestId } = render(
      <ChatBubble role="user" content="Hello" testID="chat-msg-1" />,
    );

    expect(getByTestId('chat-msg-1')).toBeTruthy();
  });

  it('sets accessibilityRole to text', () => {
    const { getByRole } = render(
      <ChatBubble role="user" content="Accessible" />,
    );

    expect(getByRole('text')).toBeTruthy();
  });

  it('renders timestamp when provided', () => {
    const timestamp = new Date('2026-03-22T10:30:00Z').getTime();
    const { getByText } = render(
      <ChatBubble role="user" content="Message" timestamp={timestamp} />,
    );

    // Exact format depends on locale but should contain time digits
    // getByText with a regex to match time format
    const timeElements = getByText(/\d{1,2}:\d{2}/);
    expect(timeElements).toBeTruthy();
  });

  it('does not render timestamp when not provided', () => {
    const { queryByText } = render(
      <ChatBubble role="user" content="No timestamp" />,
    );

    // Should not find any time-formatted text besides "No timestamp"
    expect(queryByText(/^\d{1,2}:\d{2}/)).toBeNull();
  });
});
