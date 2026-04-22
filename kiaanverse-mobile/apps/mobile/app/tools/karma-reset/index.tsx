/**
 * Karma Reset — Expo Router entry.
 *
 * Single immersive screen that owns all six phases of the ritual
 * (entry → context → reflection → wisdom → sankalpa → seal). Gesture
 * navigation is disabled by the parent `_layout` so the user can't
 * accidentally swipe out mid-ceremony.
 *
 * All state, animation, API calls and navigation-at-completion live
 * in `<KarmaResetScreen>`; this file's only job is to render it.
 */

import React from 'react';
import { KarmaResetScreen } from '../../../components/karma-reset/KarmaResetScreen';

export default function KarmaResetRoute(): React.JSX.Element {
  return <KarmaResetScreen />;
}
