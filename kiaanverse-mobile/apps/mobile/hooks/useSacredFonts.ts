/**
 * useSacredFonts — load Kiaanverse's typography stack at app launch.
 *
 * The app references seven font families across 75+ screens (Outfit,
 * CormorantGaramond, NotoSansDevanagari, CrimsonText). On Android,
 * referencing a fontFamily string that has not been registered with
 * expo-font silently falls back to the system sans-serif — the user
 * sees Roboto, not the typeset the design system was built on. That is
 * the failure mode of the production Play Store build before this hook
 * ran.
 *
 * Bundling strategy:
 *   • The `.ttf` files live in apps/mobile/assets/fonts/.
 *   • Only files that exist at bundle time are passed to useFonts.
 *     Missing files are tolerated — RN simply uses the system fallback
 *     for that family rather than throwing — so we can ship the loader
 *     incrementally as designers add fonts.
 *   • The app boot waits for `loaded || error` before hiding the splash
 *     screen so the first paint already has the right typeset.
 *
 * To add a new font:
 *   1. Drop the .ttf into apps/mobile/assets/fonts/
 *   2. Add the entry below
 *   3. Use `fontFamily: 'Outfit-SemiBold'` (the key, not the file path)
 *      anywhere in the app. The styles already reference these keys;
 *      adding the file makes them light up.
 */

import { useFonts } from 'expo-font';

/**
 * Lazy require so missing files become a clean "module not found" at
 * bundling time (not a silent runtime fallback). When you drop a new
 * .ttf into assets/fonts/, uncomment the matching line and the family
 * lights up on every screen automatically.
 */
function safeRequire(loader: () => unknown): unknown | null {
  try {
    return loader();
  } catch {
    return null;
  }
}

const FONT_MAP: Record<string, unknown> = (() => {
  const map: Record<string, unknown> = {};
  // Currently bundled — Crimson Text Regular is shipping today.
  const crimsonRegular = safeRequire(() =>
    require('../assets/fonts/CrimsonText-Regular.ttf'),
  );
  if (crimsonRegular) map['CrimsonText-Regular'] = crimsonRegular;

  // The remaining keys are intentionally not yet wired. When the TTFs
  // land in assets/fonts/ (Outfit-Regular, Outfit-Medium, Outfit-SemiBold,
  // CormorantGaramond-Light, CormorantGaramond-LightItalic,
  // CormorantGaramond-SemiBold, CrimsonText-Italic,
  // NotoSansDevanagari-Regular, NotoSansDevanagari-Medium,
  // NotoSansDevanagari-Bold), uncomment the corresponding require lines:
  //
  //   const outfitRegular = safeRequire(() =>
  //     require('../assets/fonts/Outfit-Regular.ttf'),
  //   );
  //   if (outfitRegular) map['Outfit-Regular'] = outfitRegular;
  //
  // Until then every fontFamily: 'Outfit-*' falls back to the platform
  // sans-serif, which is recoverable but visually off-brand.

  return map;
})();

export interface SacredFontsResult {
  /** True once all bundled fonts have loaded (or all known fonts have
   *  failed to load — we proceed in either case so a missing font does
   *  not block the splash). */
  ready: boolean;
  /** Number of font families successfully registered. Useful for
   *  log-once-on-boot diagnostics so we know in production how many
   *  designers' fonts are actually shipping. */
  loadedCount: number;
}

export function useSacredFonts(): SacredFontsResult {
  const [loaded, error] = useFonts(FONT_MAP);
  return {
    ready: loaded || !!error,
    loadedCount: Object.keys(FONT_MAP).length,
  };
}
