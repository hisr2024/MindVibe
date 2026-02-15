/**
 * Journey Engine page now redirects to the unified /journeys page
 * which combines both journey views into one divine experience.
 */

import { redirect } from 'next/navigation'

export default function JourneyEnginePage() {
  redirect('/journeys')
}
