/**
 * Canonical inventory of voice hooks across the MindVibe / Kiaanverse
 * repo, with consolidation status. Implements
 * IMPROVEMENT_ROADMAP.md P2 §13: a single source of truth that
 * documents what's canonical, what's dormant, and the target shape.
 *
 * This is a TS constant so the inventory survives codebase greps
 * better than a Markdown table — a `import { HOOK_INVENTORY } from
 * '@kiaanverse/voice-react'` in any test or migration script
 * surfaces the same facts.
 */

export type HookStatus =
  | 'canonical'
  | 'dormant_deprecated'
  | 'platform_specific'
  | 'replaced_by_shared';

export interface VoiceHookEntry {
  /** Hook function name. */
  name: string;
  /** Repo-relative path. */
  path: string;
  /** Which platform owns it. */
  platform: 'web' | 'mobile' | 'shared';
  status: HookStatus;
  /** Free-text explanation — what it does, why this status. */
  notes: string;
  /** When `status === 'replaced_by_shared'`, the
   * `@kiaanverse/voice-react` symbol that supersedes it. */
  replacedBy?: string;
}

/**
 * The inventory below is hand-curated. When you add a voice hook
 * anywhere in the repo, add it here and pick a status. Removing an
 * entry should happen ONLY when the file is actually deleted.
 */
export const HOOK_INVENTORY: readonly VoiceHookEntry[] = [
  // ── Web (Next.js, repo root /hooks) ─────────────────────────────
  {
    name: 'useVoiceInput',
    path: 'hooks/useVoiceInput.ts',
    platform: 'web',
    status: 'canonical',
    notes:
      'Web Speech API tier 1, MediaRecorder tier 2. 505 LOC. Owns ' +
      'browser-side STT; no native bridge involvement.',
  },
  {
    name: 'useVoiceOutput',
    path: 'hooks/useVoiceOutput.ts',
    platform: 'web',
    status: 'canonical',
    notes: 'Browser SpeechSynthesis output. Web-only.',
  },
  {
    name: 'useWakeWord',
    path: 'hooks/useWakeWord.ts',
    platform: 'web',
    status: 'canonical',
    notes: 'Web wake-word detector. Web-only.',
  },
  {
    name: 'useHandsFreeMode',
    path: 'hooks/useHandsFreeMode.ts',
    platform: 'web',
    status: 'canonical',
    notes:
      'Composes useVoiceInput + useVoiceOutput for continuous voice ' +
      'sessions in the browser.',
  },
  {
    name: 'useVoiceActivityDetection',
    path: 'hooks/useVoiceActivityDetection.ts',
    platform: 'web',
    status: 'dormant_deprecated',
    notes:
      'Defined but not imported by any active component as of audit ' +
      '(AUDIT_VOICE_COMPANION.md). Either wire it into useVoiceInput ' +
      'or delete.',
  },

  // ── Mobile (kiaanverse-mobile/apps/mobile/voice/hooks) ───────────
  {
    name: 'useDictation',
    path: 'kiaanverse-mobile/apps/mobile/voice/hooks/useDictation.ts',
    platform: 'mobile',
    status: 'replaced_by_shared',
    notes:
      'Two-tier dictation (native SakhaVoice → REST fallback). The ' +
      'native-bridge detection + JS fallback logic now lives in the ' +
      'shared package; this hook should re-export from it once the ' +
      'mobile package.json gets @kiaanverse/voice-react as a workspace ' +
      'dependency.',
    replacedBy: 'useNativeOrFallbackDictation',
  },
  {
    name: 'useRecorder',
    path: 'kiaanverse-mobile/apps/mobile/voice/hooks/useRecorder.ts',
    platform: 'mobile',
    status: 'canonical',
    notes:
      'Low-level Expo Audio recorder. Mobile-specific. Stays in apps/mobile.',
  },
  {
    name: 'useStreamingPlayer',
    path: 'kiaanverse-mobile/apps/mobile/voice/hooks/useStreamingPlayer.ts',
    platform: 'mobile',
    status: 'canonical',
    notes: 'Native opus playback via KiaanAudioPlayer TurboModule.',
  },
  {
    name: 'useBargeIn',
    path: 'kiaanverse-mobile/apps/mobile/voice/hooks/useBargeIn.ts',
    platform: 'mobile',
    status: 'canonical',
    notes: 'WSS interrupt frame emission on user audio detection.',
  },
  {
    name: 'useCrisisHandler',
    path: 'kiaanverse-mobile/apps/mobile/voice/hooks/useCrisisHandler.ts',
    platform: 'mobile',
    status: 'canonical',
    notes:
      'Routes crisis frames to helpline UX. Mobile-specific (Linking + ' +
      'native dialer).',
  },
  {
    name: 'useSakhaWakeWord',
    path: 'kiaanverse-mobile/apps/mobile/voice/hooks/useSakhaWakeWord.ts',
    platform: 'mobile',
    status: 'canonical',
    notes:
      'Wraps KiaanWakeWordDetector Kotlin module. Mobile-only by ' +
      'construction.',
  },
  {
    name: 'useForegroundService',
    path: 'kiaanverse-mobile/apps/mobile/voice/hooks/useForegroundService.ts',
    platform: 'mobile',
    status: 'canonical',
    notes: 'Android FGS lifecycle wrapper.',
  },
  {
    name: 'useAudioFocus',
    path: 'kiaanverse-mobile/apps/mobile/voice/hooks/useAudioFocus.ts',
    platform: 'mobile',
    status: 'canonical',
    notes: 'AudioManager.requestAudioFocus wrapper.',
  },
  {
    name: 'useToolInvocation',
    path: 'kiaanverse-mobile/apps/mobile/voice/hooks/useToolInvocation.ts',
    platform: 'mobile',
    status: 'canonical',
    notes: 'Mobile-side six-sacred-tools dispatcher.',
  },
  {
    name: 'useShankhaAnimation',
    path: 'kiaanverse-mobile/apps/mobile/voice/hooks/useShankhaAnimation.ts',
    platform: 'mobile',
    status: 'canonical',
    notes: 'Reanimated wrapper for the Shankha visual.',
  },
  {
    name: 'useVoiceSession',
    path: 'kiaanverse-mobile/apps/mobile/voice/hooks/useVoiceSession.ts',
    platform: 'mobile',
    status: 'dormant_deprecated',
    notes:
      'Marked DEPRECATED 2025-11 in source. WSS+Sarvam+ElevenLabs ' +
      'pipeline replaced by chat-style stack. Delete once all ' +
      'imports are gone.',
  },
  {
    name: 'useVoicePrefill',
    path: 'kiaanverse-mobile/apps/mobile/voice/hooks/useVoicePrefill.ts',
    platform: 'mobile',
    status: 'dormant_deprecated',
    notes:
      'Tied to the deprecated useVoiceSession. Delete with that one.',
  },

  // ── Shared (kiaanverse-mobile/packages) ──────────────────────────
  {
    name: 'useVoiceRecorder',
    path: 'kiaanverse-mobile/packages/ui/src/hooks/useVoiceRecorder.ts',
    platform: 'shared',
    status: 'canonical',
    notes:
      'UI-package recorder primitive used by both mobile screens and ' +
      'the storybook. Distinct from apps/mobile/voice/hooks/useRecorder.',
  },
  {
    name: 'useNativeOrFallbackDictation',
    path:
      'kiaanverse-mobile/packages/voice-react/src/hooks/useNativeOrFallbackDictation.ts',
    platform: 'shared',
    status: 'canonical',
    notes:
      'NEW (this package): single STT hook that detects the native ' +
      'SakhaVoice bridge at construction and falls back to a caller-' +
      'supplied REST transport when absent. Replaces useDictation.',
  },
];

/** Helper: every hook the inventory lists as dormant + deprecated.
 * Use in the housekeeping script when you decide to actually delete. */
export function dormantDeprecatedHooks(): readonly VoiceHookEntry[] {
  return HOOK_INVENTORY.filter(h => h.status === 'dormant_deprecated');
}
