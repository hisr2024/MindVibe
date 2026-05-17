/**
 * Tests for the native-bridge detection.
 *
 * The bridge layer is pure-function so the suite runs in plain jest
 * — no React Native, no Metro, no device.
 */

import { detectSpeechRecognizerBridge } from '../src/bridge';

describe('detectSpeechRecognizerBridge', () => {
  it('returns null when nativeModules registry is missing', () => {
    expect(
      detectSpeechRecognizerBridge({ nativeModules: undefined }),
    ).toBeNull();
  });

  it('returns null when SakhaVoice key is absent', () => {
    expect(
      detectSpeechRecognizerBridge({
        nativeModules: { SomeOtherModule: {} },
        platformOS: 'android',
      }),
    ).toBeNull();
  });

  it('returns null when SakhaVoice is an empty proxy', () => {
    // The native-modules surface on iOS / Expo Go is "an object that
    // exists but exposes no real methods". Feature-detect must reject.
    expect(
      detectSpeechRecognizerBridge({
        nativeModules: { SakhaVoice: {} },
        platformOS: 'android',
      }),
    ).toBeNull();
  });

  it('returns null when one required method is missing', () => {
    expect(
      detectSpeechRecognizerBridge({
        nativeModules: {
          SakhaVoice: {
            dictateOnce: () => Promise.resolve({}),
            cancel: () => Promise.resolve(),
            // isAvailable missing
          },
        },
        platformOS: 'android',
      }),
    ).toBeNull();
  });

  it('returns the bridge when every required method is callable', () => {
    const bridge = detectSpeechRecognizerBridge({
      nativeModules: {
        SakhaVoice: {
          dictateOnce: () => Promise.resolve({ transcript: '', language: null, source: 'native_android', latencyMs: 0 }),
          cancel: () => Promise.resolve(),
          isAvailable: () => Promise.resolve(true),
        },
      },
      platformOS: 'android',
    });
    expect(bridge).not.toBeNull();
    expect(typeof bridge!.dictateOnce).toBe('function');
    expect(typeof bridge!.cancel).toBe('function');
    expect(typeof bridge!.isAvailable).toBe('function');
  });

  it('respects the platformOS override (iOS forces null)', () => {
    expect(
      detectSpeechRecognizerBridge({
        nativeModules: {
          SakhaVoice: {
            dictateOnce: () => Promise.resolve({}),
            cancel: () => Promise.resolve(),
            isAvailable: () => Promise.resolve(true),
          },
        },
        platformOS: 'ios',
      }),
    ).toBeNull();
  });
});
