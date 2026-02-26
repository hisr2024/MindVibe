import { redirect } from 'next/navigation';

/**
 * KIAAN Hub Redirect
 * Server-side redirect to KIAAN Chat — instant, no client-side JS needed.
 * Previously used a client-side router.replace() which showed a loading
 * spinner and added ~500ms+ of unnecessary delay.
 */
export default function KiaanHome() {
  redirect('/kiaan/chat');
}
