import { redirect } from 'next/navigation'

/**
 * Redirect to the real account access page.
 * This page previously contained a static demo form with no actual authentication.
 */
export default function AccessFlow() {
  redirect('/account')
}
