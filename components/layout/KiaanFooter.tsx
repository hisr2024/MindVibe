'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * KIAAN Footer Component
 * Persistent footer across KIAAN ecosystem with quick access to all modules
 */

interface KiaanModule {
  id: string;
  label: string;
  href: string;
  icon: string;
  color: string;
}

const kiaanModules: KiaanModule[] = [
  {
    id: 'chat',
    label: 'Chat',
    href: '/kiaan/chat',
    icon: '💬',
    color: 'from-orange-500 to-amber-500'
  },
  {
    id: 'ardha',
    label: 'Ardha',
    href: '/ardha',
    icon: '🧘',
    color: 'from-teal-500 to-emerald-500'
  },
  {
    id: 'viyoga',
    label: 'Viyoga',
    href: '/viyog',
    icon: '💔',
    color: 'from-blue-500 to-indigo-500'
  },
  {
    id: 'emotional-reset',
    label: 'Reset',
    href: '/emotional-reset',
    icon: '🔄',
    color: 'from-pink-500 to-rose-500'
  },
  {
    id: 'karma-reset',
    label: 'Karma',
    href: '/karma-footprint',
    icon: '⚖️',
    color: 'from-purple-500 to-violet-500'
  },
  {
    id: 'daily-analysis',
    label: 'Daily',
    href: '/kiaan/daily-analysis',
    icon: '📊',
    color: 'from-cyan-500 to-blue-500'
  },
  {
    id: 'reflections',
    label: 'Reflections',
    href: '/sacred-reflections',
    icon: '📖',
    color: 'from-amber-500 to-orange-500'
  },
];

export function KiaanFooter() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  // Only render on KIAAN-related pages
  const shouldShow = pathname?.startsWith('/kiaan') || 
                     pathname?.startsWith('/ardha') || 
                     pathname?.startsWith('/viyog') ||
                     pathname?.startsWith('/emotional-reset') ||
                     pathname?.startsWith('/karma-footprint') ||
                     pathname?.startsWith('/sacred-reflections');

  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    if (!mounted) return;

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY < lastScrollY || currentScrollY < 50) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, mounted]);

  if (!mounted || !shouldShow) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.footer
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="fixed bottom-0 left-0 right-0 z-40 hidden md:block"
        >
          <div className="mx-auto max-w-6xl px-4 pb-4">
            <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-slate-900/95 backdrop-blur-xl shadow-2xl shadow-orange-500/10">
              <div className="flex items-center justify-between px-6 py-4">
                {/* KIAAN Branding */}
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-amber-300 shadow-lg">
                    <span className="text-sm font-bold text-slate-900">K</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-orange-50">KIAAN Ecosystem</h3>
                    <p className="text-xs text-orange-100/60">Quick access to all modules</p>
                  </div>
                </div>

                {/* Module Quick Access */}
                <div className="flex items-center gap-2">
                  {kiaanModules.map((module) => {
                    const isActive = pathname === module.href || pathname?.startsWith(module.href + '/');
                    
                    return (
                      <Link
                        key={module.id}
                        href={module.href}
                        className={`group relative flex flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all ${
                          isActive
                            ? 'bg-white/10 shadow-lg'
                            : 'hover:bg-white/5'
                        }`}
                        title={module.label}
                      >
                        <span className="text-lg" role="img" aria-label={module.label}>
                          {module.icon}
                        </span>
                        <span className={`text-[10px] font-medium ${
                          isActive ? 'text-orange-50' : 'text-orange-100/70 group-hover:text-orange-50'
                        }`}>
                          {module.label}
                        </span>
                        
                        {/* Active indicator */}
                        {isActive && (
                          <motion.div
                            layoutId="activeModule"
                            className={`absolute -bottom-1 left-1/2 h-1 w-8 -translate-x-1/2 rounded-full bg-gradient-to-r ${module.color}`}
                            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                          />
                        )}
                      </Link>
                    );
                  })}
                </div>

                {/* Toggle Button */}
                <button
                  onClick={() => setIsVisible(false)}
                  className="rounded-lg p-2 text-orange-100/60 hover:bg-white/5 hover:text-orange-50 transition-all"
                  aria-label="Hide footer"
                  title="Hide footer (will reappear on scroll)"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </motion.footer>
      )}
    </AnimatePresence>
  );
}

export default KiaanFooter;
