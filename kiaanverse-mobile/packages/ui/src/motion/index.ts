/**
 * Sacred Motion — unified public surface for all screen transitions,
 * pressable feedback, milestone pulses, and custom scroll chrome.
 *
 * Everything here mirrors the motion language used on kiaanverse.com/m/
 * (web styles/divine.css + Framer Motion configs). Components and screens
 * should prefer these hooks to hand-rolled Reanimated fragments so that
 * the motion vocabulary stays consistent across the app.
 */

export {
  DIVINE,
  NATURAL,
  EXIT,
  SWIFT,
  MODAL,
  PULSE,
  TAB_CROSSFADE,
  ENTRANCE_TRANSLATE_Y,
  ENTER_SCALE_FROM,
  EXIT_SCALE,
  PRESS_SCALE,
  PULSE_SCALE_FROM,
  PULSE_SCALE_TO,
  PULSE_OPACITY_FROM,
  PULSE_RING_COUNT,
  PULSE_RING_DELAY,
  easeDivineIn,
  easeDivineOut,
  easeLotusBloom,
  easePeacockShimmer,
} from './tokens';

export {
  useDivineEntrance,
  type UseDivineEntranceOptions,
  type UseDivineEntranceResult,
} from './useDivineEntrance';

export {
  useSacredPress,
  type UseSacredPressOptions,
  type UseSacredPressResult,
  type SacredPressHandlers,
  type HapticStyle,
} from './useSacredPress';

export {
  useGoldenPulse,
  type UseGoldenPulseOptions,
  type UseGoldenPulseResult,
} from './useGoldenPulse';

export {
  SacredScrollView,
  type SacredScrollViewProps,
} from './SacredScrollView';
