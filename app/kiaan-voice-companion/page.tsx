import { redirect } from 'next/navigation'

/**
 * Redirect to the canonical Companion page.
 * The voice companion experience has been consolidated into /companion
 * as the single source of truth for the KIAAN companion interface.
 */
export default function KiaanVoiceCompanionRedirect() {
  redirect('/companion')
}
