/**
 * Emotional Reset — Expo Router entry.
 *
 * Renders the 6-phase sacred ritual screen that mirrors
 * `app/(mobile)/m/emotional-reset/page.tsx` on the web.
 *
 * The original 4-step flow (breathing → emotion → intensity → situation →
 * wisdom) has been replaced by a phase-state machine (arrival → mandala →
 * witness → breath → integration → ceremony) that calls the dedicated
 * /api/emotional-reset/{start,step,complete} backend and supports crisis
 * detection. Gesture navigation is disabled by the parent `_layout` so
 * the user can't accidentally swipe out mid-ceremony.
 */

import React from 'react';
import { EmotionalResetScreen } from '../../../components/emotional-reset/EmotionalResetScreen';

export default function EmotionalResetRoute(): React.JSX.Element {
  return <EmotionalResetScreen />;
}
