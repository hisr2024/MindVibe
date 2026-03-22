/**
 * useAudioPlayer — Sacred audio effects for Kiaanverse Sakha chat.
 *
 * Manages three sound types via expo-av Audio.Sound:
 *   - Ambient: Soft devotional drone (looping, toggleable)
 *   - Chime: Notification on incoming Sakha message
 *   - Whoosh: Send sound on message dispatch
 *
 * Audio session config:
 *   - Ducks other audio (lowers volume of music apps)
 *   - Respects iOS silent switch (playsInSilentModeIOS: false)
 *   - No background playback (staysActiveInBackground: false)
 *
 * All Sound objects are unloaded on unmount to prevent memory leaks.
 */

import { useRef, useCallback, useEffect } from 'react';
import { Audio, type AVPlaybackStatus } from 'expo-av';
import { AppState, type AppStateStatus } from 'react-native';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UseAudioPlayerReturn {
  /** Start looping ambient drone. No-op if already playing. */
  playAmbient: () => Promise<void>;
  /** Stop ambient drone and unload. */
  stopAmbient: () => Promise<void>;
  /** Play a short notification chime (non-blocking). */
  playChime: () => Promise<void>;
  /** Play a send whoosh sound (non-blocking). */
  playWhoosh: () => Promise<void>;
  /** Whether the ambient track is currently playing. */
  isAmbientPlaying: boolean;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Bundled asset references for audio files.
 * In production these would be require() calls to local assets.
 * For now we use URI placeholders that can be swapped with real assets.
 *
 * To use bundled assets, replace with:
 *   require('../../../apps/mobile/assets/audio/ambient-drone.mp3')
 */
const AUDIO_ASSETS = {
  ambient: 'ambient-drone',
  chime: 'chime',
  whoosh: 'whoosh',
} as const;

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAudioPlayer(): UseAudioPlayerReturn {
  const ambientRef = useRef<Audio.Sound | null>(null);
  const isAmbientPlayingRef = useRef(false);
  const isMountedRef = useRef(true);
  const isConfiguredRef = useRef(false);

  // ─── Configure audio session once ───────────────────────────────────
  const configureAudioSession = useCallback(async () => {
    if (isConfiguredRef.current) return;
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: false,      // Respect iOS silent switch
        staysActiveInBackground: false,    // No background audio
        shouldDuckAndroid: true,           // Duck other apps' audio
      });
      isConfiguredRef.current = true;
    } catch (error) {
      // Audio config may fail in simulators — log and continue
      if (__DEV__) {
        console.warn('[useAudioPlayer] Audio session config failed:', error);
      }
    }
  }, []);

  // ─── Play a one-shot sound effect ───────────────────────────────────
  const playOneShot = useCallback(
    async (_assetName: string, volume: number = 1.0) => {
      if (!isMountedRef.current) return;
      await configureAudioSession();

      let sound: Audio.Sound | null = null;
      try {
        // Create a new Sound instance for the one-shot effect.
        // In production, replace with the actual asset require().
        // For now, we synthesize a minimal silence as a placeholder
        // so the hook structure is fully functional without crashing.
        const { sound: created } = await Audio.Sound.createAsync(
          // Placeholder: 0.1s of silence. Replace with real asset:
          // require(`../../../apps/mobile/assets/audio/${assetName}.mp3`)
          { uri: 'asset:///silence.mp3' },
          { shouldPlay: true, volume, isLooping: false },
        );
        sound = created;

        // Auto-unload after playback finishes to prevent memory leaks
        sound.setOnPlaybackStatusUpdate((status: AVPlaybackStatus) => {
          if (status.isLoaded && status.didJustFinish) {
            sound?.unloadAsync().catch(() => {});
          }
        });
      } catch {
        // Sound file missing or playback failed — fail silently
        // This is expected in dev before audio assets are added
        sound?.unloadAsync().catch(() => {});
      }
    },
    [configureAudioSession],
  );

  // ─── Ambient: looping devotional drone ──────────────────────────────
  const playAmbient = useCallback(async () => {
    if (isAmbientPlayingRef.current || !isMountedRef.current) return;
    await configureAudioSession();

    try {
      // Unload any previous instance
      if (ambientRef.current) {
        await ambientRef.current.unloadAsync().catch(() => {});
        ambientRef.current = null;
      }

      const { sound } = await Audio.Sound.createAsync(
        // Replace with real asset:
        // require('../../../apps/mobile/assets/audio/ambient-drone.mp3')
        { uri: 'asset:///silence.mp3' },
        {
          shouldPlay: true,
          isLooping: true,
          volume: 0.15, // Soft background volume
        },
      );

      if (!isMountedRef.current) {
        await sound.unloadAsync();
        return;
      }

      ambientRef.current = sound;
      isAmbientPlayingRef.current = true;
    } catch {
      // Asset not found or playback failed
      isAmbientPlayingRef.current = false;
    }
  }, [configureAudioSession]);

  const stopAmbient = useCallback(async () => {
    if (ambientRef.current) {
      try {
        await ambientRef.current.stopAsync();
        await ambientRef.current.unloadAsync();
      } catch {
        // Already unloaded or stopped
      }
      ambientRef.current = null;
    }
    isAmbientPlayingRef.current = false;
  }, []);

  // ─── One-shot sounds ────────────────────────────────────────────────
  const playChime = useCallback(
    () => playOneShot(AUDIO_ASSETS.chime, 0.6),
    [playOneShot],
  );

  const playWhoosh = useCallback(
    () => playOneShot(AUDIO_ASSETS.whoosh, 0.5),
    [playOneShot],
  );

  // ─── Pause ambient when app goes to background ─────────────────────
  useEffect(() => {
    const handleAppState = async (nextState: AppStateStatus) => {
      if (!ambientRef.current) return;

      try {
        if (nextState === 'active') {
          // Resume when foregrounded
          const status = await ambientRef.current.getStatusAsync();
          if (status.isLoaded && !status.isPlaying) {
            await ambientRef.current.playAsync();
          }
        } else {
          // Pause when backgrounded
          const status = await ambientRef.current.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await ambientRef.current.pauseAsync();
          }
        }
      } catch {
        // Sound was unloaded between check and action
      }
    };

    const subscription = AppState.addEventListener('change', handleAppState);
    return () => subscription.remove();
  }, []);

  // ─── Cleanup on unmount ─────────────────────────────────────────────
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Fire-and-forget cleanup for ambient sound
      ambientRef.current?.unloadAsync().catch(() => {});
      ambientRef.current = null;
      isAmbientPlayingRef.current = false;
    };
  }, []);

  return {
    playAmbient,
    stopAmbient,
    playChime,
    playWhoosh,
    isAmbientPlaying: isAmbientPlayingRef.current,
  };
}
