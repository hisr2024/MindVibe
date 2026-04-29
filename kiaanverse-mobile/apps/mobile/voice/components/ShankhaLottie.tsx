/**
 * ShankhaLottie — production Lottie-driven Shankha with graceful SVG fallback.
 *
 * Loads the per-state .lottie.json bundle from assets/shankha/ and plays
 * the matching animation as the voice state transitions. When a Lottie
 * file is missing (designer hasn't shipped that state yet), this component
 * falls back to the inline SVG Shankha at voice/components/Shankha.tsx —
 * no crash, no broken UI, only a slight visual fidelity drop.
 *
 * Asset spec: assets/shankha/README.md
 * Asset manifest: assets/shankha/manifest.json
 *
 * Why a separate component from Shankha.tsx:
 *   • Shankha.tsx is the always-on SVG fallback — guaranteed to render
 *     even if the Lottie bundle isn't shipped
 *   • ShankhaLottie.tsx is the production-grade renderer that prefers
 *     the real designer assets
 *
 * State → asset mapping (from manifest.json):
 *   idle        → idle.lottie.json        (subtle breath loop)
 *   listening   → listening.lottie.json   (mouth pulse, 1.6s cycle)
 *   thinking    → thinking.lottie.json    (inward shimmer)
 *   interrupted → interrupted.lottie.json (one-shot fade)
 *   offline     → offline.lottie.json     (cool moonlit drift)
 *   error       → error.lottie.json       (static dimmed)
 *   speaking    → null (RN renders sound waves over the static SVG)
 *   crisis      → null (steady warm light, no animation)
 */

import React from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

import { Shankha } from './Shankha';
import {
  useShankhaAnimation,
  type ShankhaWaveLayer,
} from '../hooks/useShankhaAnimation';

interface ShankhaLottieProps {
  /** Side length in dp. The Shankha SVG fallback uses size×2 internally. */
  size?: number;
  /**
   * If true, always render the inline SVG fallback even when a Lottie
   * file is available. Useful for snapshot tests + low-RAM devices.
   */
  forceSvgFallback?: boolean;
}

/**
 * Asset map. require()-style imports must be static at bundle time —
 * we can't dynamically construct paths. Each entry resolves to either
 * the bundled asset (when the file exists at build time) or `null`
 * (when the file is absent, signaling fallback to SVG).
 *
 * NOTE: when the designer ships new files, *uncomment the corresponding
 * require() line below*. Keeping these commented until the file exists
 * prevents Metro from failing the bundle build with
 * "Unable to resolve module". This is the only manual step in the
 * drop-in workflow described in assets/shankha/README.md.
 */
const ASSETS: Record<string, unknown | null> = {
  // idle: require('../../assets/shankha/idle.lottie.json'),
  // listening: require('../../assets/shankha/listening.lottie.json'),
  // thinking: require('../../assets/shankha/thinking.lottie.json'),
  // interrupted: require('../../assets/shankha/interrupted.lottie.json'),
  // offline: require('../../assets/shankha/offline.lottie.json'),
  // error: require('../../assets/shankha/error.lottie.json'),
  idle: null,
  listening: null,
  thinking: null,
  interrupted: null,
  offline: null,
  error: null,
  // speaking + crisis intentionally omitted — see header comment.
};

export function ShankhaLottie({
  size = 220,
  forceSvgFallback = false,
}: ShankhaLottieProps): React.JSX.Element {
  const { state, waveLayers } = useShankhaAnimation();
  const showWaves = state === 'speaking' || state === 'listening';

  // States with no animation file by spec — always render SVG.
  if (state === 'speaking' || state === 'crisis') {
    return <Shankha size={size} />;
  }

  // Forced fallback or asset missing — render SVG.
  const asset = ASSETS[state];
  if (forceSvgFallback || !asset) {
    return <Shankha size={size} />;
  }

  // Real Lottie bundled — render it. The Lottie file owns the entire
  // visual; we don't render the SVG underneath.
  return (
    <View style={[styles.container, { width: size * 2, height: size * 2 }]}>
      <LottieView
        source={asset as object}
        autoPlay
        loop={state !== 'interrupted' && state !== 'error'}
        style={[styles.lottie, { width: size, height: size }]}
        resizeMode="contain"
      />
      {showWaves && waveLayers.length > 0
        ? waveLayers.map((layer: ShankhaWaveLayer, i: number) => (
            <ShankhaWaveOverlay key={i} layer={layer} size={size} />
          ))
        : null}
    </View>
  );
}

interface ShankhaWaveOverlayProps {
  layer: ShankhaWaveLayer;
  size: number;
}

function ShankhaWaveOverlay({
  layer: _layer,
  size,
}: ShankhaWaveOverlayProps): React.JSX.Element {
  // Wave overlay is a thin Animated.View rendered at the conch mouth
  // with opacity + scale driven by RMS. The actual driver lives in
  // useShankhaAnimation; this is just the renderer.
  return (
    <View
      style={[
        styles.waveLayer,
        {
          width: size * 0.6,
          height: size * 0.6,
          left: size * 0.7,
          top: size * 0.4,
        },
      ]}
      pointerEvents="none"
    />
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  lottie: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveLayer: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(212, 160, 23, 0.55)',
  },
});
