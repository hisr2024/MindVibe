/**
 * Tests for the unified dictation hook.
 *
 * We use React Testing Library's `renderHook` with the React 18
 * `act` helper. The hook never touches `react-native` directly so
 * it runs cleanly in jsdom.
 */

import { act, renderHook, waitFor } from '@testing-library/react';

import { useNativeOrFallbackDictation } from '../src/hooks/useNativeOrFallbackDictation';
import type {
  DictationResult,
  SpeechRecognizerBridge,
} from '../src/types';

function bridgeReturning(result: Partial<DictationResult>): SpeechRecognizerBridge {
  return {
    dictateOnce: jest.fn().mockResolvedValue(result),
    cancel: jest.fn().mockResolvedValue(undefined),
    isAvailable: jest.fn().mockResolvedValue(true),
  };
}

function bridgeRejecting(err: Error & { code?: string }): SpeechRecognizerBridge {
  return {
    dictateOnce: jest.fn().mockRejectedValue(err),
    cancel: jest.fn().mockResolvedValue(undefined),
    isAvailable: jest.fn().mockResolvedValue(true),
  };
}

function asNativeRegistry(bridge: SpeechRecognizerBridge) {
  return { SakhaVoice: bridge as unknown as Record<string, unknown> };
}

describe('useNativeOrFallbackDictation', () => {
  it('starts idle', () => {
    const { result } = renderHook(() => useNativeOrFallbackDictation());
    expect(result.current.state.tag).toBe('idle');
    expect(result.current.lastSource).toBeNull();
  });

  it('routes through the native bridge when available', async () => {
    const bridge = bridgeReturning({
      transcript: 'mujhe shanti chahiye',
      language: 'hi-IN',
    });
    const { result } = renderHook(() =>
      useNativeOrFallbackDictation({
        languageTag: 'hi-IN',
        bridgeDetectOptions: {
          nativeModules: asNativeRegistry(bridge),
          platformOS: 'android',
        },
      }),
    );
    await waitFor(() =>
      expect(result.current.state.tag).toBe('idle'),
    );
    let outcome: DictationResult | null = null;
    await act(async () => {
      outcome = await result.current.start();
    });
    expect(bridge.dictateOnce).toHaveBeenCalledWith('hi-IN');
    expect(outcome).not.toBeNull();
    expect(outcome!.transcript).toBe('mujhe shanti chahiye');
    expect(outcome!.source).toBe('native_android');
    expect(result.current.lastSource).toBe('native_android');
    expect(result.current.state.tag).toBe('idle');
  });

  it('falls back to REST when bridge rejects with a recoverable code', async () => {
    const bridge = bridgeRejecting(
      Object.assign(new Error('net down'), { code: 'NETWORK' }),
    );
    const restFallback = jest.fn().mockResolvedValue({
      transcript: 'i feel anxious',
      language: 'en-IN',
      source: 'rest_fallback' as const,
      latencyMs: 0,
    });
    const { result } = renderHook(() =>
      useNativeOrFallbackDictation({
        bridgeDetectOptions: {
          nativeModules: asNativeRegistry(bridge),
          platformOS: 'android',
        },
        restFallback,
      }),
    );
    let outcome: DictationResult | null = null;
    await act(async () => {
      outcome = await result.current.start();
    });
    expect(bridge.dictateOnce).toHaveBeenCalled();
    expect(restFallback).toHaveBeenCalled();
    expect(outcome!.transcript).toBe('i feel anxious');
    expect(outcome!.source).toBe('rest_fallback');
  });

  it('does NOT fall back when bridge rejects with PERMISSION_DENIED', async () => {
    const bridge = bridgeRejecting(
      Object.assign(new Error('mic denied'), { code: 'PERMISSION_DENIED' }),
    );
    const restFallback = jest.fn();
    const { result } = renderHook(() =>
      useNativeOrFallbackDictation({
        bridgeDetectOptions: {
          nativeModules: asNativeRegistry(bridge),
          platformOS: 'android',
        },
        restFallback,
      }),
    );
    await act(async () => {
      await result.current.start();
    });
    expect(restFallback).not.toHaveBeenCalled();
    expect(result.current.state.tag).toBe('error');
    expect(result.current.state.errorCode).toBe('PERMISSION_DENIED');
  });

  it('routes straight to REST when no bridge is registered', async () => {
    const restFallback = jest.fn().mockResolvedValue({
      transcript: 'web user input',
      language: 'en-US',
      source: 'rest_fallback' as const,
      latencyMs: 0,
    });
    const { result } = renderHook(() =>
      useNativeOrFallbackDictation({
        bridgeDetectOptions: {
          nativeModules: {},
          platformOS: 'web',
        },
        restFallback,
      }),
    );
    let outcome: DictationResult | null = null;
    await act(async () => {
      outcome = await result.current.start();
    });
    expect(restFallback).toHaveBeenCalled();
    expect(outcome!.source).toBe('rest_fallback');
  });

  it('errors when no bridge AND no restFallback', async () => {
    const { result } = renderHook(() =>
      useNativeOrFallbackDictation({
        bridgeDetectOptions: { nativeModules: {}, platformOS: 'web' },
      }),
    );
    await act(async () => {
      await result.current.start();
    });
    expect(result.current.state.tag).toBe('error');
    expect(result.current.state.errorCode).toBe('BRIDGE_UNAVAILABLE');
  });

  it('cancel() returns to idle and asks the bridge to stop', async () => {
    const bridge = bridgeReturning({ transcript: 'unused' });
    const { result } = renderHook(() =>
      useNativeOrFallbackDictation({
        bridgeDetectOptions: {
          nativeModules: asNativeRegistry(bridge),
          platformOS: 'android',
        },
      }),
    );
    await act(async () => {
      await result.current.cancel();
    });
    expect(result.current.state.tag).toBe('idle');
    expect(bridge.cancel).toHaveBeenCalled();
  });

  it('start() is a no-op when not idle (cannot stack turns)', async () => {
    let resolveNative: ((v: unknown) => void) | null = null;
    const bridge: SpeechRecognizerBridge = {
      dictateOnce: jest.fn(
        () => new Promise(resolve => { resolveNative = resolve; }),
      ),
      cancel: jest.fn().mockResolvedValue(undefined),
      isAvailable: jest.fn().mockResolvedValue(true),
    };
    const { result } = renderHook(() =>
      useNativeOrFallbackDictation({
        bridgeDetectOptions: {
          nativeModules: asNativeRegistry(bridge),
          platformOS: 'android',
        },
      }),
    );
    // First turn pending.
    let first: Promise<DictationResult | null>;
    await act(async () => {
      first = result.current.start();
      // Don't await — leave the bridge promise unresolved.
      await Promise.resolve();
    });
    expect(result.current.state.tag).toBe('listening');
    // Second start() while busy → must return null immediately.
    let second: DictationResult | null = null;
    await act(async () => {
      second = await result.current.start();
    });
    expect(second).toBeNull();
    expect(bridge.dictateOnce).toHaveBeenCalledTimes(1);
    // Resolve the first to clean up.
    await act(async () => {
      resolveNative?.({ transcript: 'done', language: 'en-IN' });
      await first;
    });
  });

  it('emits lifecycle events when an onEvent callback is provided', async () => {
    const events: string[] = [];
    const bridge = bridgeReturning({
      transcript: 'hi sakha',
      language: 'en-IN',
    });
    const { result } = renderHook(() =>
      useNativeOrFallbackDictation({
        bridgeDetectOptions: {
          nativeModules: asNativeRegistry(bridge),
          platformOS: 'android',
        },
        onEvent: e => events.push(e.kind),
      }),
    );
    await act(async () => {
      await result.current.start();
    });
    expect(events).toEqual(['started', 'resolved']);
  });
});
