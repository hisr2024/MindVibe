'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useHapticFeedback } from '@/hooks';
import { useLanguage } from '@/hooks/useLanguage';

/**
 * KiaanFooter – Om floating action button with quick-access tool links popup.
 *
 * When the user taps the Om button a compact popup appears with links to
 * the four core spiritual tools: Viyoga, Ardha, KIAAN Chat, and
 * Relationship Compass. Tap outside or press Escape to dismiss.
 */

// Tool links shown inside the popup
const TOOL_LINKS = [
  {
    id: 'viyoga',
    icon: '🎯',
    label: 'Viyoga',
    description: 'Release attachment',
    href: '/tools/viyog',
    gradient: 'from-cyan-400/25 to-blue-500/25',
    border: 'border-cyan-500/20 hover:border-cyan-400/40',
  },
  {
    id: 'ardha',
    icon: '🔄',
    label: 'Ardha',
    description: 'Reframe thoughts',
    href: '/ardha',
    gradient: 'from-amber-400/25 to-yellow-500/25',
    border: 'border-amber-500/20 hover:border-amber-400/40',
  },
  {
    id: 'kiaan-chat',
    icon: '💬',
    label: 'KIAAN Chat',
    description: 'Talk it through',
    href: '/kiaan/chat',
    gradient: 'from-blue-400/25 to-purple-500/25',
    border: 'border-blue-500/20 hover:border-blue-400/40',
  },
  {
    id: 'relationship-compass',
    icon: '🧭',
    label: 'Relationship Compass',
    description: 'Relational clarity',
    href: '/tools/relationship-compass',
    gradient: 'from-rose-400/25 to-orange-500/25',
    border: 'border-rose-500/20 hover:border-rose-400/40',
  },
] as const;

// Animation variants for the popup panel
const popupVariants = {
  hidden: {
    opacity: 0,
    scale: 0.9,
    y: 16,
    transition: {
      type: 'spring' as const,
      stiffness: 450,
      damping: 35,
    },
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 28,
    },
  },
};

// Stagger animation for links
const listVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring' as const, stiffness: 400, damping: 28 },
  },
};

// FAB animation variants
const fabVariants = {
  rest: {
    scale: 1,
    boxShadow: '0 8px 30px rgba(255, 115, 39, 0.35)',
  },
  hover: {
    scale: 1.08,
    boxShadow: '0 12px 40px rgba(255, 115, 39, 0.5)',
  },
  tap: {
    scale: 0.92,
    boxShadow: '0 4px 20px rgba(255, 115, 39, 0.25)',
  },
};

export function KiaanFooter() {
  const pathname = usePathname();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const popupRef = useRef<HTMLDivElement>(null);
  const { triggerHaptic } = useHapticFeedback();

  // Close when pressing Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) setIsOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  // Close when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    // Small delay so the opening click doesn't immediately close it
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClick);
    };
  }, [isOpen]);

  const handleToggle = useCallback(() => {
    setIsOpen((prev) => !prev);
    triggerHaptic(isOpen ? 'light' : 'medium');
  }, [isOpen, triggerHaptic]);

  const handleLinkClick = useCallback(() => {
    triggerHaptic('selection');
    setIsOpen(false);
  }, [triggerHaptic]);

  // Hide on the dedicated KIAAN chat page
  if (pathname === '/kiaan/chat') return null;

  return (
    <div
      ref={popupRef}
      className="fixed bottom-[calc(88px+env(safe-area-inset-bottom,0px))] left-3 z-[60] p-2 md:bottom-8 md:left-8 md:p-0"
    >
      {/* Popup panel */}
      <AnimatePresence mode="wait">
        {isOpen && (
          <motion.div
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="mb-3 w-[260px] overflow-hidden rounded-[20px] border border-orange-500/25 bg-gradient-to-b from-slate-900/[0.98] via-slate-900/95 to-slate-950/[0.98] shadow-2xl shadow-black/40 backdrop-blur-xl md:mb-4 md:w-[280px] md:rounded-[24px]"
          >
            {/* Top glow accent */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />

            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
              <div>
                <h3 className="text-sm font-semibold text-orange-50">
                  {t('navigation.spiritual_tools.title', 'Spiritual Tools')}
                </h3>
                <p className="text-[10px] text-orange-100/50 mt-0.5">Quick access</p>
              </div>
              <motion.button
                onClick={() => setIsOpen(false)}
                className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-orange-100/60 hover:bg-white/10 hover:text-orange-50 transition-colors"
                aria-label="Close"
                whileTap={{ scale: 0.9 }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </motion.button>
            </div>

            {/* Tool links */}
            <motion.div
              className="p-3 space-y-1.5"
              variants={listVariants}
              initial="hidden"
              animate="visible"
            >
              {TOOL_LINKS.map((tool) => (
                <motion.div key={tool.id} variants={itemVariants}>
                  <Link
                    href={tool.href}
                    onClick={handleLinkClick}
                    className={`group flex items-center gap-3 rounded-xl border bg-gradient-to-r ${tool.gradient} ${tool.border} px-3 py-2.5 transition-all active:scale-[0.97]`}
                  >
                    <span className="text-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                      {tool.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-orange-50 group-hover:text-white transition-colors truncate">
                        {tool.label}
                      </p>
                      <p className="text-[10px] text-orange-100/60 truncate">
                        {tool.description}
                      </p>
                    </div>
                    <svg
                      className="w-4 h-4 text-orange-400/30 group-hover:text-orange-400/70 group-hover:translate-x-0.5 transition-all flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button – OM Icon */}
      <motion.button
        onClick={handleToggle}
        variants={fabVariants}
        initial="rest"
        whileHover="hover"
        whileTap="tap"
        animate={
          isOpen
            ? 'rest'
            : {
                boxShadow: [
                  '0 8px 30px rgba(255, 115, 39, 0.35)',
                  '0 12px 40px rgba(255, 115, 39, 0.5)',
                  '0 8px 30px rgba(255, 115, 39, 0.35)',
                ],
                transition: {
                  boxShadow: {
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  },
                },
              }
        }
        className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 via-orange-400 to-amber-500 shadow-lg transition-all md:h-16 md:w-16"
        aria-label={isOpen ? 'Close tools menu' : 'Open tools menu'}
        aria-expanded={isOpen}
      >
        {/* Inner glow ring */}
        <motion.span
          className="absolute inset-0 rounded-full"
          animate={{ boxShadow: 'inset 0 0 20px rgba(255, 255, 255, 0.2)' }}
        />

        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.svg
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="h-6 w-6 text-white md:h-7 md:w-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </motion.svg>
          ) : (
            <motion.div
              key="open"
              initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="text-2xl md:text-3xl"
            >
              🕉️
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}

export default KiaanFooter;
