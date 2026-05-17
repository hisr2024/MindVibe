import { redirect } from 'next/navigation'

/**
 * Redirect to the canonical Relationship Compass page.
 * The unified and engine variants have been consolidated into
 * /tools/relationship-compass as the single source of truth.
 */
export default function RelationshipCompassUnifiedRedirect() {
  redirect('/tools/relationship-compass')
}
