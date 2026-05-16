import { redirect } from 'next/navigation'

/**
 * Redirect to the canonical Sambandh Dharma (Relationship Compass) page.
 * The unified and engine variants have been consolidated into
 * /tools/sambandh-dharma as the single source of truth.
 */
export default function SambandhDharmaUnifiedRedirect() {
  redirect('/tools/sambandh-dharma')
}
