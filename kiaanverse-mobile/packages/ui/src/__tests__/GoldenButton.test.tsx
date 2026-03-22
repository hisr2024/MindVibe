/**
 * GoldenButton — Component Tests
 *
 * Tests rendering, press handling, disabled/loading states, and variants.
 * Reanimated + Haptics are mocked in ./setup.tsx.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { GoldenButton } from '../components/GoldenButton';

describe('GoldenButton', () => {
  const onPress = jest.fn();

  beforeEach(() => {
    onPress.mockClear();
  });

  it('renders the title text', () => {
    const { getByText } = render(
      <GoldenButton title="Start Journey" onPress={onPress} />,
    );

    expect(getByText('Start Journey')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const { getByText } = render(
      <GoldenButton title="Begin" onPress={onPress} />,
    );

    fireEvent.press(getByText('Begin'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('does not call onPress when disabled', () => {
    const { getByText } = render(
      <GoldenButton title="Disabled" onPress={onPress} disabled />,
    );

    fireEvent.press(getByText('Disabled'));

    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows ActivityIndicator when loading', () => {
    const { queryByText, UNSAFE_getByType } = render(
      <GoldenButton title="Loading" onPress={onPress} loading />,
    );

    // Title should not be visible
    expect(queryByText('Loading')).toBeNull();

    // ActivityIndicator should be rendered
    const { ActivityIndicator } = require('react-native');
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();
  });

  it('does not call onPress when loading', () => {
    const { UNSAFE_getByType } = render(
      <GoldenButton title="Loading" onPress={onPress} loading />,
    );

    const { ActivityIndicator } = require('react-native');
    const spinner = UNSAFE_getByType(ActivityIndicator);

    // Try pressing the parent (loading disables the button)
    fireEvent.press(spinner);

    expect(onPress).not.toHaveBeenCalled();
  });

  it('forwards testID prop', () => {
    const { getByTestId } = render(
      <GoldenButton title="Test" onPress={onPress} testID="golden-btn" />,
    );

    expect(getByTestId('golden-btn')).toBeTruthy();
  });

  it('sets accessibilityRole to button', () => {
    const { getByRole } = render(
      <GoldenButton title="Action" onPress={onPress} />,
    );

    expect(getByRole('button')).toBeTruthy();
  });

  it('sets accessibilityState disabled when disabled', () => {
    const { getByRole } = render(
      <GoldenButton title="Disabled" onPress={onPress} disabled />,
    );

    const button = getByRole('button');
    expect(button.props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  describe('variants', () => {
    const variants = ['primary', 'secondary', 'ghost', 'divine'] as const;

    variants.forEach((variant) => {
      it(`renders ${variant} variant without crashing`, () => {
        const { getByText } = render(
          <GoldenButton
            title={`${variant} button`}
            onPress={onPress}
            variant={variant}
          />,
        );

        expect(getByText(`${variant} button`)).toBeTruthy();
      });
    });
  });
});
