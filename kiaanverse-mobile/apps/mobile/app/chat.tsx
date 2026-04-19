/**
 * Chat Deep Link Redirect
 *
 * Redirects kiaanverse://chat → /(tabs)/sakha while forwarding any
 * `context` / `verseId` params so callers (e.g. the verse detail screen's
 * "Ask Sakha" button) can pre-fill the chat draft.
 */

import { Redirect, useLocalSearchParams } from 'expo-router';
import React from 'react';

export default function ChatRedirect(): React.JSX.Element {
  const params = useLocalSearchParams<{ context?: string; verseId?: string }>();

  const forward: Record<string, string> = {};
  if (typeof params.context === 'string' && params.context.length > 0) {
    forward.context = params.context;
  }
  if (typeof params.verseId === 'string' && params.verseId.length > 0) {
    forward.verseId = params.verseId;
  }

  return <Redirect href={{ pathname: '/(tabs)/sakha', params: forward }} />;
}
