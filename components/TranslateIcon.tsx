'use client';

interface TranslateIconProps {
  className?: string;
  label?: string;
}

/**
 * Translation Available Indicator
 * Shows where auto-translation is available or may be needed
 */
export function TranslateIcon({ className = '', label = 'Translation available' }: TranslateIconProps) {
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 px-2 py-1 text-xs text-sky-200/90 border border-sky-400/20 ${className}`}
      title={label}
      aria-label={label}
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
        />
      </svg>
      <span className="text-[10px] font-medium">Auto-translate</span>
    </div>
  );
}
