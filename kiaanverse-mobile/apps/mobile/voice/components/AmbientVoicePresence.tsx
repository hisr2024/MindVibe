/**
 * AmbientVoicePresence — root-level mount that makes Sakha ambient.
 *
 * Without this component the voice companion only existed when the
 * user navigated to /voice-companion. Sakha could see, but couldn't
 * be summoned from anywhere else. This component fixes that by:
 *
 *   1. Mounting the "Hey Sakha" wake-word listener at the root of
 *      the authenticated app shell so the user can speak from any
 *      screen they're allowed to be voice-active on.
 *
 *   2. Rendering a floating action button (VoiceFab) that taps to
 *      route into /voice-companion, with a long-press to toggle the
 *      wake-word preference inline (no settings detour).
 *
 *   3. Suppressing both surfaces on routes where voice would be
 *      hostile (auth, arrival, onboarding, the voice routes
 *      themselves — see useRouteSuppressesAmbientVoice for the
 *      exact list and rationale).
 *
 *   4. Honouring an opt-in preference (useWakeWordPreference). The
 *      wake-word recognizer is OFF by default; the user must
 *      explicitly turn it on. The FAB is always visible (when not
 *      suppressed) so summoning Sakha by tap is always one gesture
 *      away even when wake-word is off.
 *
 * Mount it ONCE inside the AuthGate's children so it sits above the
 * Stack but inside the authentication boundary:
 *
 *   <AuthGate>
 *     <Stack>...</Stack>
 *     <AmbientVoicePresence />
 *   </AuthGate>
 *
 * The component returns null on suppressed routes — it never tries
 * to wrap or modify the route tree, only sit beside it.
 *
 * Battery / privacy notes:
 *   • The wake-word recognizer is paused automatically by the
 *     native side while a turn is in progress, so we don't have to
 *     reconcile state across the WSS lifecycle.
 *   • When the route changes to a suppressed segment, we explicitly
 *     `disable()` the recognizer rather than relying on unmount —
 *     route changes don't always unmount this component (it sits
 *     above Stack), so leaving the recognizer armed during /(auth)
 *     would be a privacy leak.
 *   • If `isAvailable` is false (iOS, or Android pre-Picovoice
 *     install), we render the FAB only. No native call, no error.
 */

import { useRouter } from 'expo-router';
import React, { useCallback, useEffect } from 'react';
import { Alert } from 'react-native';

import { useSakhaWakeWord } from '../hooks/useSakhaWakeWord';
import { useRouteSuppressesAmbientVoice } from '../hooks/useRouteSuppressesAmbientVoice';
import { useWakeWordPreference } from '../hooks/useWakeWordPreference';
import { VoiceFab } from './VoiceFab';

export interface AmbientVoicePresenceProps {
  /** Distance to lift the FAB above the safe-area bottom (e.g. tab
   *  bar height). Default 24. */
  tabBarLift?: number;
  /** Override the route used when the user taps the FAB or the
   *  wake-word fires. Defaults to the canonical voice companion. */
  voiceRoute?: string;
}

export function AmbientVoicePresence({
  tabBarLift,
  voiceRoute = '/voice-companion',
}: AmbientVoicePresenceProps = {}): React.JSX.Element | null {
  const router = useRouter();
  const suppressed = useRouteSuppressesAmbientVoice();
  const { enabled: prefEnabled, hydrated, setEnabled } =
    useWakeWordPreference();

  // Wake-word handler — navigate to voice-companion with a marker so
  // the destination knows the session was initiated by voice (it can
  // skip the "tap to listen" intro and dive straight into a turn).
  const handleWake = useCallback(() => {
    router.push({
      pathname: voiceRoute,
      params: { awakened: '1' },
    });
  }, [router, voiceRoute]);

  const wake = useSakhaWakeWord({ onWake: handleWake });

  // Reconcile the native recognizer with (preference × suppression).
  // We re-evaluate on every change to either input — leaving stale
  // state means either a privacy leak (recognizer armed on a
  // suppressed route) or a dead UX (user turned it on but nothing
  // is listening).
  useEffect(() => {
    if (!hydrated) return;
    if (!wake.isAvailable) return;
    const shouldListen = prefEnabled && !suppressed;
    if (shouldListen && !wake.enabled) {
      void wake.enable();
    } else if (!shouldListen && wake.enabled) {
      void wake.disable();
    }
  }, [hydrated, prefEnabled, suppressed, wake.isAvailable, wake.enabled, wake]);

  // Long-press the FAB to flip the wake-word preference. Surfaced
  // here (instead of buried in Settings) because the discovery
  // story for ambient voice depends on the gesture being one hop
  // from the FAB itself.
  const handleLongPress = useCallback(() => {
    if (!wake.isAvailable) {
      Alert.alert(
        'Hey Sakha unavailable',
        'The wake-word listener is only supported on Android right now. Tap the lotus to summon Sakha by hand.',
      );
      return;
    }
    const next = !prefEnabled;
    Alert.alert(
      next ? 'Turn on “Hey Sakha”?' : 'Turn off “Hey Sakha”?',
      next
        ? 'Sakha will quietly listen for the phrase “Hey Sakha” and open the voice companion when it hears you. Microphone access is required; voice content stays on-device until you speak the wake word.'
        : 'Sakha will stop listening for the wake phrase. You can still tap the lotus to summon the voice companion any time.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: next ? 'Turn on' : 'Turn off',
          style: next ? 'default' : 'destructive',
          onPress: () => {
            void setEnabled(next);
          },
        },
      ],
    );
  }, [prefEnabled, setEnabled, wake.isAvailable]);

  const handleTap = useCallback(() => {
    router.push(voiceRoute);
  }, [router, voiceRoute]);

  if (suppressed) return null;

  return (
    <VoiceFab
      onPress={handleTap}
      onLongPress={handleLongPress}
      listening={wake.enabled}
      tabBarLift={tabBarLift}
    />
  );
}
