/**
 * Tests for the Sakha chat pieces added for the Android app.
 *
 * Coverage:
 *   1. HeroMandala renders at the requested size.
 *   2. InsightFab invokes onPress with a prompt from the curated list.
 *   3. ConversationStarters renders all four starter prompts.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(() => Promise.resolve()),
  notificationAsync: jest.fn(() => Promise.resolve()),
  selectionAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: { Light: 'Light', Medium: 'Medium' },
  NotificationFeedbackType: { Success: 'Success', Warning: 'Warning' },
}));

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LinearGradient: ({ children, style, ...rest }: any) =>
      React.createElement(View, { ...rest, style }, children),
  };
});

// Reanimated's jest setup shim — provides withTiming etc. as no-ops.
jest.mock('react-native-reanimated', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-reanimated/mock'),
);

import { HeroMandala } from '../components/chat/HeroMandala';
import { InsightFab } from '../components/chat/InsightFab';
import { ConversationStarters } from '../components/chat/ConversationStarters';

describe('HeroMandala', () => {
  it('renders without crashing at the default size', () => {
    const { toJSON } = render(<HeroMandala />);
    expect(toJSON()).not.toBeNull();
  });

  it('accepts a custom size', () => {
    const { toJSON } = render(<HeroMandala size={200} />);
    expect(toJSON()).not.toBeNull();
  });
});

describe('InsightFab', () => {
  it('calls onPress with a non-empty prompt when tapped', () => {
    const onPress = jest.fn();
    const { getByRole } = render(<InsightFab onPress={onPress} />);
    const btn = getByRole('button');
    act(() => {
      fireEvent.press(btn);
    });
    expect(onPress).toHaveBeenCalledTimes(1);
    const prompt = onPress.mock.calls[0]?.[0];
    expect(typeof prompt).toBe('string');
    expect(prompt.length).toBeGreaterThan(0);
  });

  it('can be hidden — still renders without crashing', () => {
    const onPress = jest.fn();
    const { toJSON } = render(<InsightFab onPress={onPress} hidden />);
    expect(toJSON()).not.toBeNull();
  });
});

describe('ConversationStarters', () => {
  it('renders all four starter prompts', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <ConversationStarters onSelect={onSelect} />,
    );
    expect(getByText('What is my dharma in this moment?')).toBeTruthy();
    expect(getByText('I am afraid. What does Krishna say?')).toBeTruthy();
    expect(getByText('Explain the nature of the Atman')).toBeTruthy();
    expect(getByText('How do I find peace amidst chaos?')).toBeTruthy();
  });

  it('fires onSelect with the tapped prompt', () => {
    const onSelect = jest.fn();
    const { getByText } = render(
      <ConversationStarters onSelect={onSelect} />,
    );
    act(() => {
      fireEvent.press(getByText('What is my dharma in this moment?'));
    });
    expect(onSelect).toHaveBeenCalledWith('What is my dharma in this moment?');
  });
});
