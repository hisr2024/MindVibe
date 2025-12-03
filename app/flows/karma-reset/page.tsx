import { redirect } from 'next/navigation'

/**
 * Legacy Karma Reset flow page - redirects to unified /karma-reset
 * This page has been consolidated into the unified Karma Reset Ritual flow
 */
export default function KarmaResetFlow() {
  redirect('/karma-reset')
}
