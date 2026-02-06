/**
 * Legacy KIAAN Voice page - Redirects to the new Voice Companion v4
 *
 * The full voice companion experience is now at /voice-companion
 * with the immersive orb-centric Divine Friend interface.
 */

import { redirect } from 'next/navigation'

export default function KiaanVoicePage() {
  redirect('/voice-companion')
}
