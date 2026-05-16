import { redirect } from 'next/navigation'

/**
 * Redirect to the canonical Sambandh Dharma (Relationship Compass) page.
 * The engine and unified variants have been consolidated into
 * /tools/sambandh-dharma as the single source of truth.
 */
export default function SambandhDharmaEngineRedirect() {
  redirect('/tools/sambandh-dharma')
}
