/**
 * Jest mock for @shopify/react-native-skia.
 *
 * Skia ships as ESM with native glue that Jest can't resolve in Node.
 * Tests never render the celestial background, so every Skia primitive
 * is stubbed to a passthrough component that ignores its props.
 */
import React from 'react';
import { View } from 'react-native';

const Passthrough: React.FC<{ children?: React.ReactNode }> = ({ children }) =>
  React.createElement(View, null, children ?? null);

const noop = () => undefined;
const nullFn = () => null;

export const Canvas = Passthrough;
export const Group = Passthrough;
export const Circle = Passthrough;
export const Rect = Passthrough;
export const Path = Passthrough;
export const Line = Passthrough;
export const Fill = Passthrough;
export const BlurMask = Passthrough;
export const RadialGradient = Passthrough;
export const LinearGradient = Passthrough;
export const SweepGradient = Passthrough;
export const Text = Passthrough;
export const Image = Passthrough;
export const Mask = Passthrough;
export const Shadow = Passthrough;
export const vec = (x = 0, y = 0) => ({ x, y });
export const Skia = {
  Path: { Make: nullFn },
  Color: nullFn,
  Matrix: nullFn,
};
export const useClock = () => ({ value: 0 });
export const useValue = (v: unknown) => ({ current: v });
export const useComputedValue = nullFn;
export const useDerivedValueOnJS = nullFn;
export const useSharedValueEffect = noop;
export const useImage = nullFn;
export const useFont = nullFn;
export const interpolate = (v: number) => v;
export const interpolateColors = (_v: number, _inp: number[], out: string[]) => out[0] ?? '#000';
export const mix = (v: number) => v;
