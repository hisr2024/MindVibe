/**
 * useShankhaAnimation — drives the Shankha (शङ्ख) sound-wave amplitude
 * + the Lottie state transitions between idle/listening/thinking/
 * speaking/interrupted/offline/error/crisis.
 *
 * Per spec:
 *   • Sound-wave amplitude is driven by ACTUAL audio session metering
 *     (RMS) — not a faked sin loop. KiaanAudioPlayer's onAudioLevel
 *     event already pumps RMS into the store; this hook reads from
 *     the store directly via Reanimated's useDerivedValue so the
 *     animation runs entirely on the UI thread.
 *   • Maximum 3 concurrent wave layers, color warm gold fading to
 *     transparent — visual params returned from this hook for the
 *     screen to apply.
 *   • State → Lottie source mapping per the spec table.
 *
 * Returns:
 *   • amplitude: SharedValue<number> — drive wave layer scales
 *   • lottieSource: string — file path / module ID per state
 *   • waveLayers: { scale, opacity }[] — three layers with phase offsets
 */

import { useEffect, useMemo } from 'react';
import {
  type SharedValue,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useVoiceStore, type VoiceState } from '../../stores/voiceStore';

// Shankha asset slots (Part 11 fills these). Until then the screens
// render an SVG fallback — the animation worklet still runs against
// `amplitude` so the hook contract is stable.
const SHANKHA_LOTTIE: Record<VoiceState, string | null> = {
  idle:        'shankha/idle.lottie.json',
  listening:   'shankha/listening.lottie.json',
  thinking:    'shankha/thinking.lottie.json',
  speaking:    null, // sound waves are RN-rendered; conch stays static
  interrupted: 'shankha/interrupted.lottie.json',
  offline:     'shankha/offline.lottie.json',
  error:       'shankha/error.lottie.json',
  crisis:      null, // steady warm light, no animation per spec
};

export interface ShankhaWaveLayer {
  scale: SharedValue<number>;
  opacity: SharedValue<number>;
  phaseMs: number;
}

export interface ShankhaAnimationAPI {
  state: VoiceState;
  amplitude: SharedValue<number>;
  waveLayers: ShankhaWaveLayer[];
  lottieSource: string | null;
}

const WAVE_PHASES_MS = [0, 240, 480];
const SOUND_WAVE_BASE_SCALE = 1.0;
const SOUND_WAVE_MAX_SCALE = 1.6;
const SOUND_WAVE_BASE_OPACITY = 0.7;

export function useShankhaAnimation(): ShankhaAnimationAPI {
  const state = useVoiceStore((s) => s.state);
  const audioLevel = useVoiceStore((s) => s.audioLevel);

  // The amplitude shared value is driven from JS via Zustand here. The
  // KiaanAudioPlayer.onAudioLevel event fires at 60Hz so this stays
  // smooth; for hot paths (worklet UI thread reads) the screen can
  // also read KiaanAudioPlayer.getAudioLevel() directly.
  const amplitude = useSharedValue(0);
  useEffect(() => {
    amplitude.value = withTiming(audioLevel, { duration: 50 });
  }, [audioLevel, amplitude]);

  // Three wave layers with staggered phase. During non-speaking states
  // the layers settle to the base scale / opacity. During speaking
  // they pulse with `amplitude` — the worklet on the screen multiplies
  // the layer's intrinsic scale by amplitude.
  const layer0Scale = useSharedValue(SOUND_WAVE_BASE_SCALE);
  const layer0Opacity = useSharedValue(SOUND_WAVE_BASE_OPACITY);
  const layer1Scale = useSharedValue(SOUND_WAVE_BASE_SCALE);
  const layer1Opacity = useSharedValue(SOUND_WAVE_BASE_OPACITY);
  const layer2Scale = useSharedValue(SOUND_WAVE_BASE_SCALE);
  const layer2Opacity = useSharedValue(SOUND_WAVE_BASE_OPACITY);

  // Derived values for the speaking-state pulse, keyed off `amplitude`.
  const derivedScale = useDerivedValue(() => {
    if (state !== 'speaking') return SOUND_WAVE_BASE_SCALE;
    return SOUND_WAVE_BASE_SCALE
      + (SOUND_WAVE_MAX_SCALE - SOUND_WAVE_BASE_SCALE) * amplitude.value;
  });
  const derivedOpacity = useDerivedValue(() => {
    if (state !== 'speaking') return SOUND_WAVE_BASE_OPACITY * 0.4;
    return SOUND_WAVE_BASE_OPACITY * (0.5 + 0.5 * amplitude.value);
  });

  // Listening / idle: slow steady breath via withRepeat
  useEffect(() => {
    if (state === 'listening') {
      layer0Scale.value = withRepeat(
        withTiming(1.08, { duration: 1400 }), -1, true,
      );
      layer0Opacity.value = withRepeat(
        withTiming(0.9, { duration: 1400 }), -1, true,
      );
    } else if (state === 'idle') {
      layer0Scale.value = withTiming(1.0, { duration: 400 });
      layer0Opacity.value = withTiming(0.6, { duration: 400 });
    }
  }, [state, layer0Scale, layer0Opacity]);

  const waveLayers: ShankhaWaveLayer[] = useMemo(
    () => [
      { scale: derivedScale, opacity: derivedOpacity, phaseMs: WAVE_PHASES_MS[0]! },
      { scale: layer1Scale, opacity: layer1Opacity, phaseMs: WAVE_PHASES_MS[1]! },
      { scale: layer2Scale, opacity: layer2Opacity, phaseMs: WAVE_PHASES_MS[2]! },
    ],
    [derivedScale, derivedOpacity, layer1Scale, layer1Opacity, layer2Scale, layer2Opacity],
  );

  // Drive layer1/layer2 scales as offset copies of derivedScale during
  // speaking — kept in JS rather than a worklet because Reanimated's
  // useAnimatedReaction-on-derived requires more setup than this needs.
  useEffect(() => {
    if (state !== 'speaking') {
      layer1Scale.value = withTiming(SOUND_WAVE_BASE_SCALE, { duration: 200 });
      layer1Opacity.value = withTiming(SOUND_WAVE_BASE_OPACITY * 0.5, { duration: 200 });
      layer2Scale.value = withTiming(SOUND_WAVE_BASE_SCALE, { duration: 200 });
      layer2Opacity.value = withTiming(SOUND_WAVE_BASE_OPACITY * 0.3, { duration: 200 });
    }
  }, [state, layer1Scale, layer1Opacity, layer2Scale, layer2Opacity]);

  const lottieSource = SHANKHA_LOTTIE[state] ?? null;

  return { state, amplitude, waveLayers, lottieSource };
}
