/**
 * Clipboard utility functions for copy-paste functionality
 */

export interface CopyOptions {
  preserveFormatting?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Copy text to clipboard with support for formatted text
 * @param text - The text to copy
 * @param options - Copy options
 * @returns Promise<boolean> - Success status
 */
export async function copyToClipboard(
  text: string,
  options: CopyOptions = {}
): Promise<boolean> {
  const { preserveFormatting = true, onSuccess, onError } = options;

  try {
    // Modern Clipboard API (preferred)
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      onSuccess?.();
      return true;
    }

    // Fallback for older browsers
    // Note: document.execCommand('copy') is deprecated but kept as fallback
    // Consider using Clipboard API polyfill for better compatibility
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (successful) {
        onSuccess?.();
        return true;
      } else {
        throw new Error('Failed to copy text');
      }
    } catch (err) {
      document.body.removeChild(textArea);
      throw err;
    }
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Copy failed');
    onError?.(err);
    return false;
  }
}

/**
 * Check if clipboard API is available
 */
export function isClipboardSupported(): boolean {
  return !!(
    navigator.clipboard ||
    (document.queryCommandSupported && document.queryCommandSupported('copy'))
  );
}
