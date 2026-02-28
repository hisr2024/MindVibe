/**
 * Social media sharing utilities
 */

export type SharePlatform = 'whatsapp' | 'telegram' | 'facebook' | 'instagram';

export interface ShareOptions {
  text: string;
  url?: string;
  anonymize?: boolean;
}

/**
 * Sanitize content for sharing by removing sensitive markers
 * Note: This is a basic implementation. For production use, consider:
 * - NLP-based entity recognition
 * - More comprehensive regex patterns
 * - External anonymization services
 */
export function sanitizeShareContent(text: string, anonymize: boolean = false): string {
  let sanitized = text.trim();

  // Remove potential sensitive markers or personal identifiers
  if (anonymize) {
    // Remove common age patterns (do this before name patterns)
    sanitized = sanitized.replace(/\b(i am|i'm|age)\s+\d{1,3}\s+(years old|year old|yo)\b/gi, '[age removed]');
    
    // Remove common personal markers
    sanitized = sanitized.replace(/\b(my name is|i am|i'm)\s+\w+/gi, '[name removed]');
    
    // Remove email addresses
    sanitized = sanitized.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[email removed]');
    
    // Remove phone numbers (basic patterns)
    sanitized = sanitized.replace(/\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[phone removed]');
  }

  return sanitized;
}

/**
 * Format content for sharing with MindVibe prefix
 */
export function formatShareContent(text: string, anonymize: boolean = false): string {
  const sanitized = sanitizeShareContent(text, anonymize);
  const prefix = 'Shared from MindVibe - KIAAN AI:\n\n';
  const suffix = '\n\n💙 Discover spiritual wellness with KIAAN at kiaanverse.com';

  return `${prefix}${sanitized}${suffix}`;
}

/**
 * Limit text to platform-specific character limits
 */
export function limitTextLength(text: string, platform: SharePlatform): string {
  const limits: Record<SharePlatform, number> = {
    whatsapp: 65536, // WhatsApp has a very high limit
    telegram: 4096,
    facebook: 63206,
    instagram: 2200, // For caption
  };

  const limit = limits[platform];
  if (text.length <= limit) return text;

  return text.slice(0, limit - 3) + '...';
}

/**
 * Share to WhatsApp
 */
export function shareToWhatsApp(text: string, anonymize: boolean = false): void {
  try {
    const formatted = formatShareContent(text, anonymize);
    const limited = limitTextLength(formatted, 'whatsapp');
    const encoded = encodeURIComponent(limited);

    // Detect if mobile or desktop
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    const url = isMobile
      ? `whatsapp://send?text=${encoded}`
      : `https://web.whatsapp.com/send?text=${encoded}`;

    window.open(url, '_blank');
  } catch (error) {
    console.error('Failed to share to WhatsApp:', error);
    throw new Error('Failed to open WhatsApp. Please try again.');
  }
}

/**
 * Share to Telegram
 */
export function shareToTelegram(text: string, anonymize: boolean = false): void {
  try {
    const formatted = formatShareContent(text, anonymize);
    const limited = limitTextLength(formatted, 'telegram');
    const encoded = encodeURIComponent(limited);

    const url = `https://t.me/share/url?text=${encoded}`;
    window.open(url, '_blank');
  } catch (error) {
    console.error('Failed to share to Telegram:', error);
    throw new Error('Failed to open Telegram. Please try again.');
  }
}

/**
 * Share to Facebook
 */
export function shareToFacebook(text: string, anonymize: boolean = false): void {
  try {
    const formatted = formatShareContent(text, anonymize);
    const limited = limitTextLength(formatted, 'facebook');
    const encoded = encodeURIComponent(limited);

    // Use a safe base URL instead of current origin
    const baseUrl = 'https://kiaanverse.com';
    
    // Facebook Share Dialog
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encoded}&u=${encodeURIComponent(baseUrl)}`;
    window.open(url, '_blank', 'width=600,height=400');
  } catch (error) {
    console.error('Failed to share to Facebook:', error);
    throw new Error('Failed to open Facebook. Please try again.');
  }
}

/**
 * Copy to clipboard for Instagram (Instagram doesn't support direct text sharing)
 */
export async function shareToInstagram(
  text: string,
  anonymize: boolean = false
): Promise<boolean> {
  const formatted = formatShareContent(text, anonymize);
  const limited = limitTextLength(formatted, 'instagram');

  try {
    await navigator.clipboard.writeText(limited);
    return true;
  } catch (error) {
    console.error('Failed to copy for Instagram:', error);
    return false;
  }
}

/**
 * Generic share handler with comprehensive error handling
 */
export async function shareContent(
  platform: SharePlatform,
  text: string,
  anonymize: boolean = false
): Promise<{ success: boolean; error?: string }> {
  try {
    switch (platform) {
      case 'whatsapp':
        shareToWhatsApp(text, anonymize);
        return { success: true };
      case 'telegram':
        shareToTelegram(text, anonymize);
        return { success: true };
      case 'facebook':
        shareToFacebook(text, anonymize);
        return { success: true };
      case 'instagram':
        const instagramSuccess = await shareToInstagram(text, anonymize);
        return {
          success: instagramSuccess,
          error: instagramSuccess ? undefined : 'Failed to copy text for Instagram. Please try again.'
        };
      default:
        return { success: false, error: 'Unsupported platform' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to share content';
    console.error(`Failed to share to ${platform}:`, error);
    return { success: false, error: errorMessage };
  }
}
