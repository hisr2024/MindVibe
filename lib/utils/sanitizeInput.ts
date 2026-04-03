/**
 * Shared input sanitization for sacred tools.
 *
 * Strips angle brackets and backslashes to prevent injection,
 * then truncates to the given character limit.
 */
export function sanitizeInput(input: string, maxLength = 2000): string {
  return input.replace(/[<>]/g, '').replace(/\\/g, '').slice(0, maxLength)
}
