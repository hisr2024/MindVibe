'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * KIAAN Hub Redirect
 * Redirects to KIAAN Chat as the main entry point
 */
export default function KiaanHome() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to KIAAN Chat - the primary KIAAN interface
    router.replace('/kiaan/chat');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center space-y-4">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto" />
        <p className="text-orange-100">Opening KIAAN Chat...</p>
      </div>
    </div>
  );
}
