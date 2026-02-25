'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

/**
 * Offline Page
 * Displayed when the user is offline and the requested page is not cached
 */
export default function OfflinePage() {
  const handleRetry = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <main className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
      {/* Background gradients */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-20 top-10 h-80 w-80 rounded-full bg-gradient-to-br from-[#c8943a]/20 via-[#ff9933]/10 to-transparent blur-3xl" />
        <div className="absolute bottom-10 right-0 h-96 w-96 rounded-full bg-gradient-to-tr from-[#ff9933]/15 via-[#d4a44c]/8 to-transparent blur-[120px]" />
      </div>

      <motion.div
        className="relative mx-auto max-w-md space-y-6 text-center px-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Offline Icon */}
        <motion.div
          className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#d4a44c]/20 to-[#d4a44c]/10 border border-[#d4a44c]/30"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <svg
            className="h-12 w-12 text-[#d4a44c]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3l18 18"
            />
          </svg>
        </motion.div>

        {/* Message */}
        <div className="space-y-2">
          <h1 className="text-2xl font-light text-[#f5f0e8] md:text-3xl">
            You&apos;re Offline
          </h1>
          <p className="text-base text-[#f5f0e8]/70">
            It looks like you&apos;ve lost your internet connection. Some features may not be available until you reconnect.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <motion.button
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#d4a44c] via-[#ff9933] to-[#e8b54a] px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-[#d4a44c]/25"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            Try Again
          </motion.button>

          <Link href="/">
            <motion.div
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#d4a44c]/30 bg-white/5 px-5 py-3 text-sm font-semibold text-[#f5f0e8]"
              whileHover={{ scale: 1.05, borderColor: 'rgba(251, 146, 60, 0.5)' }}
              whileTap={{ scale: 0.95 }}
            >
              Go Home
            </motion.div>
          </Link>
        </div>

        {/* Tip */}
        <motion.div
          className="rounded-2xl border border-[#d4a44c]/20 bg-[#d4a44c]/5 p-4 text-left"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-xs text-[#f5f0e8]/70">
            <span className="font-medium text-[#e8b54a]">Tip:</span> Previously viewed pages may still be available from cache. Try navigating to a page you&apos;ve visited before.
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}
