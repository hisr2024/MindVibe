/**
 * Chat Deep Link Redirect
 *
 * Redirects kiaanverse://chat → /(tabs)/sakha
 */

import { Redirect } from 'expo-router';

export default function ChatRedirect() {
  return <Redirect href="/(tabs)/sakha" />;
}
