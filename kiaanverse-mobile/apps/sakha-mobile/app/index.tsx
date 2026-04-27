/**
 * App root — redirect straight into the voice canvas.
 *
 * The placeholder this file used to render in Part 7 has moved into
 * the canvas itself (Part 10b). First-launch users get routed via the
 * onboarding flow when they tap "Begin" on the canvas.
 */

import { Redirect } from 'expo-router';

export default function Root() {
  return <Redirect href="/voice" />;
}
