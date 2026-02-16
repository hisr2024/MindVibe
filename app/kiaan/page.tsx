'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/**
 * KIAAN Hub Redirect
 * Redirects to KIAAN Chat as the main entry point.
 * Falls back to a manual link after a timeout.
 */
export default function KiaanHome() {
  const router = useRouter();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    // Redirect to KIAAN Chat - the primary KIAAN interface
    router.replace('/kiaan/chat');

    // Show fallback link if redirect hasn't completed after 3 seconds
    const timeout = setTimeout(() => setShowFallback(true), 3000);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center space-y-4">
        <div className="relative mx-auto h-12 w-12">
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-orange-500/20 border-t-orange-500" />
        </div>
        <p className="text-sm text-white/70">Opening KIAAN Chat...</p>
        {showFallback && (
          <Link
            href="/kiaan/chat"
            className="inline-block rounded-full bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-orange-500/20 transition hover:shadow-xl"
          >
            Go to KIAAN Chat
          </Link>
        )}
      </div>
    </div>
  );
}
