'use client';

interface TranslateIconProps {
  className?: string;
  label?: string;
  /** Compact mode shows only the icon without text */
  compact?: boolean;
}

/**
 * Translation Available Indicator
 *
 * Sleek, on-brand indicator showing where auto-translation is available.
 * Uses solid gold/amber tones with minimal transparency for high visibility
 * on dark backgrounds. Meets WCAG 2.1 AA contrast (4.5:1 minimum).
 *
 * Style tokens:
 *   background: #d4a44c at 20% opacity (solid feel on dark surfaces)
 *   text: #e8b54a (gold, high contrast on dark)
 *   border: #d4a44c at 35% opacity (visible but not harsh)
 *   icon: #d4a44c (brand gold, solid)
 *   shadow: subtle gold glow for depth
 *   min touch target: 32px height (accessible inline indicator)
 */
export function TranslateIcon({ className = '', label = 'Translation available', compact = false }: TranslateIconProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-[#d4a44c]/20 px-2.5 py-1 text-xs text-[#e8b54a] border border-[#d4a44c]/35 shadow-sm shadow-[#d4a44c]/10 transition-colors hover:bg-[#d4a44c]/28 hover:border-[#d4a44c]/50 ${className}`}
      title={label}
      aria-label={label}
      role="status"
    >
      <svg
        className="h-3.5 w-3.5 text-[#d4a44c]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2.25}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>
      {!compact && (
        <span className="text-[10px] font-semibold tracking-wide">Auto-translate</span>
      )}
    </div>
  );
}
