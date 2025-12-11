/**
 * Color Utilities
 * Helper functions for color manipulation
 */

/**
 * Converts a hex color to hex with opacity
 * @param color - Hex color (e.g., '#ff7327')
 * @param opacity - Opacity value 0-1
 * @returns Hex color with opacity (e.g., '#ff7327ff')
 */
export function hexWithOpacity(color: string, opacity: number): string {
  const opacityHex = Math.floor(opacity * 255)
    .toString(16)
    .padStart(2, '0');
  return `${color}${opacityHex}`;
}

/**
 * Converts RGB to hex
 */
export function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

/**
 * Parses a hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}
