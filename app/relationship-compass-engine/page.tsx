import { redirect } from 'next/navigation'

/**
 * Redirect to the canonical Relationship Compass page.
 * The engine and unified variants have been consolidated into
 * /tools/relationship-compass as the single source of truth.
 */
export default function RelationshipCompassEngineRedirect() {
  redirect('/tools/relationship-compass')
}
