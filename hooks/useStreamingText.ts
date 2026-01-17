/**
 * Streaming Text Hook
 * Provides typing effect animation for text streaming
 */

import { useState, useEffect, useCallback } from 'react';

interface UseStreamingTextOptions {
  speed?: number; // characters per second
  onComplete?: () => void;
}

export function useStreamingText(fullText: string, options: UseStreamingTextOptions = {}) {
  const { speed = 30, onComplete } = options;
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (!fullText) {
      setDisplayedText('');
      setIsComplete(false);
      return;
    }

    let currentIndex = 0;
    setDisplayedText('');
    setIsComplete(false);

    const interval = setInterval(() => {
      currentIndex++;
      setDisplayedText(fullText.slice(0, currentIndex));

      if (currentIndex >= fullText.length) {
        clearInterval(interval);
        setIsComplete(true);
        onComplete?.();
      }
    }, 1000 / speed);

    return () => clearInterval(interval);
  }, [fullText, speed, onComplete]);

  const skipToEnd = useCallback(() => {
    setDisplayedText(fullText);
    setIsComplete(true);
    onComplete?.();
  }, [fullText, onComplete]);

  return {
    displayedText,
    isComplete,
    skipToEnd,
  };
}

/**
 * Alternative streaming function (for advanced use cases)
 * 
 * Character-by-character streaming function that can be used
 * for custom implementations where you need more control over
 * the streaming process.
 * 
 * @example
 * ```tsx
 * const controller = new AbortController();
 * await streamText(
 *   "Hello World",
 *   (chunk) => setDisplayText(chunk),
 *   { speed: 30, signal: controller.signal }
 * );
 * ```
 */
export async function streamText(
  text: string,
  callback: (chunk: string) => void,
  options: { speed?: number; signal?: AbortSignal } = {}
): Promise<void> {
  const { speed = 30, signal } = options;
  const delay = 1000 / speed;

  for (let i = 0; i <= text.length; i++) {
    if (signal?.aborted) {
      break;
    }
    
    callback(text.slice(0, i));
    
    if (i < text.length) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
