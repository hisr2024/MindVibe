/**
 * Tests for ToastContainer — verifies it renders from the uiStore toast queue,
 * auto-dismisses after duration, and supports tap-to-dismiss.
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';

// Mock safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Store mock state
let mockToastQueue: Array<{
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}> = [];
const mockRemoveToast = jest.fn();

jest.mock('@kiaanverse/store', () => ({
  useUiStore: (selector: (state: Record<string, unknown>) => unknown) =>
    selector({
      toastQueue: mockToastQueue,
      removeToast: mockRemoveToast,
    }),
}));

import { ToastContainer } from '../components/common/Toast';

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  mockToastQueue = [];
});

afterEach(() => {
  jest.useRealTimers();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ToastContainer', () => {
  it('renders nothing when queue is empty', () => {
    mockToastQueue = [];
    const { toJSON } = render(<ToastContainer />);
    expect(toJSON()).toBeNull();
  });

  it('renders toast message when queue has an item', () => {
    mockToastQueue = [
      { id: 'toast-1', message: 'Journey complete!', type: 'success' },
    ];

    const { getByText } = render(<ToastContainer />);
    expect(getByText('Journey complete!')).toBeTruthy();
  });

  it('renders only the first toast from the queue', () => {
    mockToastQueue = [
      { id: 'toast-1', message: 'First toast', type: 'info' },
      { id: 'toast-2', message: 'Second toast', type: 'error' },
    ];

    const { getByText, queryByText } = render(<ToastContainer />);
    expect(getByText('First toast')).toBeTruthy();
    expect(queryByText('Second toast')).toBeNull();
  });

  it('auto-dismisses after default duration (3000ms)', () => {
    mockToastQueue = [
      { id: 'toast-1', message: 'Auto dismiss me', type: 'info' },
    ];

    render(<ToastContainer />);

    expect(mockRemoveToast).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockRemoveToast).toHaveBeenCalledWith('toast-1');
  });

  it('auto-dismisses after custom duration', () => {
    mockToastQueue = [
      { id: 'toast-2', message: 'Custom duration', type: 'warning', duration: 5000 },
    ];

    render(<ToastContainer />);

    act(() => {
      jest.advanceTimersByTime(3000);
    });

    expect(mockRemoveToast).not.toHaveBeenCalled();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(mockRemoveToast).toHaveBeenCalledWith('toast-2');
  });

  it('dismisses on tap', () => {
    mockToastQueue = [
      { id: 'toast-3', message: 'Tap to dismiss', type: 'error' },
    ];

    const { getByText } = render(<ToastContainer />);

    fireEvent.press(getByText('Tap to dismiss'));

    expect(mockRemoveToast).toHaveBeenCalledWith('toast-3');
  });

  it('has correct accessibility role', () => {
    mockToastQueue = [
      { id: 'toast-4', message: 'Accessible toast', type: 'success' },
    ];

    const { getByRole } = render(<ToastContainer />);
    expect(getByRole('alert')).toBeTruthy();
  });
});
