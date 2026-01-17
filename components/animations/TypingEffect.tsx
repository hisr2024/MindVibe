/**
 * Typing Effect Component
 * Animates text with a typing effect
 */

'use client';

import { useStreamingText } from '@/hooks/useStreamingText';

interface TypingEffectProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  className?: string;
  showCursor?: boolean;
}

export function TypingEffect({
  text,
  speed = 30,
  onComplete,
  className = '',
  showCursor = false,
}: TypingEffectProps) {
  const { displayedText, isComplete } = useStreamingText(text, { speed, onComplete });

  return (
    <span className={className}>
      {displayedText}
      {showCursor && !isComplete && (
        <span className="inline-block w-0.5 h-4 ml-0.5 bg-current animate-pulse" />
      )}
    </span>
  );
}
