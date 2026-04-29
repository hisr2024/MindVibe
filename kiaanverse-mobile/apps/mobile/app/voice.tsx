/**
 * Legacy Sakha Voice route — now redirects to the FINAL.2
 * VoiceCompanionScreen at /voice-companion.
 *
 * Kept as a redirect rather than deleted so existing deep links,
 * shortcuts, and Voice tab nav targets keep working without churn.
 *
 * The previous mandala-based implementation (HeroMandala +
 * useSakhaVoice SSE bridge) was the pre-FINAL.2 path. It's
 * superseded by the WSS-based companion at /voice-companion which
 * implements the FINAL.2 spec end-to-end (Shankha iconography,
 * single streaming pipe, Cobra VAD, crisis overlay, INPUT_TO_TOOL
 * carry timing, persona pinning).
 */

import { Redirect } from 'expo-router';

export default function VoiceLegacyRedirect(): JSX.Element {
  return <Redirect href="/voice-companion" />;
}
