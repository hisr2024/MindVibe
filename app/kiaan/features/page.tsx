'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Redirect page for KIAAN Features
 * Redirects to KIAAN Chat as per requirements
 */
export default function FeaturesRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/kiaan/chat');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-orange-500 border-t-transparent mx-auto mb-4" />
        <p className="text-orange-100">Redirecting to KIAAN Chat...</p>
      </div>
    </div>
  );
}
