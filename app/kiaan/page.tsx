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
          <div className="absolute inset-0 animate-spin rounded-full border-4 border-[#d4a44c]/20 border-t-[#d4a44c]" />
        </div>
        <p className="text-sm text-[#d4a44c]/60">Opening KIAAN Chat...</p>
        {showFallback && (
          <Link
            href="/kiaan/chat"
            className="kiaan-btn-golden inline-block rounded-full px-6 py-2.5 text-sm font-semibold shadow-lg shadow-[#d4a44c]/15 transition hover:shadow-xl"
          >
            Go to KIAAN Chat
          </Link>
        )}
      </div>
    </div>
  );
}
