/**
 * Tests for ErrorBoundary — verifies it catches render errors,
 * shows the golden fallback card, and supports retry + custom fallback.
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../components/common/ErrorBoundary';

// Mock errorTracking to verify Sentry calls
const mockCaptureError = jest.fn();
const mockBreadcrumb = jest.fn();

jest.mock('../services/errorTracking', () => ({
  captureError: (...args: unknown[]) => mockCaptureError(...args),
  breadcrumb: (...args: unknown[]) => mockBreadcrumb(...args),
}));

// Suppress React error boundary console noise in tests
beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: a component that throws on demand
// ---------------------------------------------------------------------------

let shouldThrow = false;

function ThrowingChild(): React.JSX.Element {
  if (shouldThrow) {
    throw new Error('Render explosion');
  }
  return <Text>Child content</Text>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ErrorBoundary', () => {
  beforeEach(() => {
    shouldThrow = false;
  });

  it('renders children when no error occurs', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <Text>Hello</Text>
      </ErrorBoundary>,
    );

    expect(getByText('Hello')).toBeTruthy();
  });

  it('renders fallback card when child throws', () => {
    shouldThrow = true;

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText(/moment of turbulence/)).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('sends error to Sentry via captureError', () => {
    shouldThrow = true;

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(mockCaptureError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ boundary: 'ErrorBoundary' }),
    );
  });

  it('adds a breadcrumb when error is caught', () => {
    shouldThrow = true;

    render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(mockBreadcrumb).toHaveBeenCalledWith(
      'ErrorBoundary caught render error',
      expect.objectContaining({ errorMessage: 'Render explosion' }),
    );
  });

  it('recovers when retry button is pressed', () => {
    shouldThrow = true;

    const { getByText } = render(
      <ErrorBoundary>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    // Verify fallback is showing
    expect(getByText('Something went wrong')).toBeTruthy();

    // Stop throwing so retry succeeds
    shouldThrow = false;

    fireEvent.press(getByText('Try Again'));

    // Children should render again
    expect(getByText('Child content')).toBeTruthy();
  });

  it('renders custom fallback when provided', () => {
    shouldThrow = true;

    const customFallback = ({ error, retry }: { error: Error; retry: () => void }) => (
      <>
        <Text>Custom: {error.message}</Text>
        <Text onPress={retry}>Custom retry</Text>
      </>
    );

    const { getByText, queryByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowingChild />
      </ErrorBoundary>,
    );

    expect(getByText('Custom: Render explosion')).toBeTruthy();
    expect(queryByText('Something went wrong')).toBeNull();
  });
});
