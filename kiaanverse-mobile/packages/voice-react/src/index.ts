/**
 * @kiaanverse/voice-react — shared voice contracts + hooks.
 *
 * Implements IMPROVEMENT_ROADMAP.md P2 §13: the single source of
 * truth for voice surfaces consumed by both `app/` (Next.js web)
 * and `kiaanverse-mobile/apps/mobile/` (Expo React Native).
 *
 * Honest scope at v0.1.0
 * ----------------------
 * This package ships:
 *   - Shared TYPE contracts (DictationResult, SpeechRecognizerBridge,
 *     VoiceLifecycleEvent) — single source of truth for the wire
 *     shapes both platforms speak.
 *   - The native-bridge ADAPTER (`detectSpeechRecognizerBridge`) +
 *     a JS-side STT hook (`useNativeOrFallbackDictation`) that runs
 *     in tests and on web without React Native.
 *   - Documented inventory of existing voice hooks across the repo
 *     (`HOOK_INVENTORY` in `src/inventory.ts`) — which is canonical,
 *     which is dormant, what the migration target shape is.
 *
 * What this package does NOT yet do:
 *   - Hold the React-Native-specific hook bodies. Those depend on
 *     `react-native` and `expo-av` imports that resolve only inside
 *     `apps/mobile/`. Moving them here is a build-system task that
 *     wants to land on a branch tested against EAS Build — see
 *     `MIGRATION.md` in this directory for the sequencing.
 */

export * from './bridge';
export * from './inventory';
export * from './hooks/useNativeOrFallbackDictation';
export * from './types';
