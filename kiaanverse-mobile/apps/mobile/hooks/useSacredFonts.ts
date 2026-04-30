/**
 * useSacredFonts — load Kiaanverse's typography stack at app launch.
 *
 * The app references seven font families across 75+ screens (Outfit,
 * CormorantGaramond, NotoSansDevanagari, CrimsonText). On Android,
 * referencing a fontFamily string that has not been registered with
 * expo-font silently falls back to the system sans-serif — the user
 * sees Roboto, not the typeset the design system was built on.
 *
 * Bundled today (≈ 2 MB total, embedded into the AAB):
 *   • Outfit-Regular / Medium / SemiBold        (UI, numerals, captions)
 *   • CormorantGaramond-Light / LightItalic /
 *     SemiBold                                  (headings, quotes)
 *   • NotoSansDevanagari-Regular / Medium /
 *     Bold                                      (Sanskrit / Hindi)
 *   • CrimsonText-Regular / Italic              (body text, sacred quotes)
 *
 * All TTFs live in apps/mobile/assets/fonts/ and are sourced from the
 * SIL Open Font License files distributed by Google Fonts. The app
 * boot waits for `loaded || error` before hiding the splash so the
 * first paint already has the right typeset. Missing files are tolerated
 * — RN falls back to the system font for that family rather than
 * throwing — so future additions can ship without changing this hook.
 */

import { useFonts } from 'expo-font';

/**
 * Lazy require so a missing file becomes a clean "module not found" at
 * bundling time rather than a silent runtime fallback. Wrapping each
 * require in a try/catch lets us register every family that ships
 * today and quietly skip any whose .ttf hasn't been added yet.
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

  const register = (key: string, loader: () => unknown): void => {
    const asset = safeRequire(loader);
    if (asset) map[key] = asset;
  };

  // Outfit — the workhorse UI family (numerals, captions, eyebrow text).
  register('Outfit-Regular', () =>
    require('../assets/fonts/Outfit-Regular.ttf'),
  );
  register('Outfit-Medium', () =>
    require('../assets/fonts/Outfit-Medium.ttf'),
  );
  register('Outfit-SemiBold', () =>
    require('../assets/fonts/Outfit-SemiBold.ttf'),
  );

  // Cormorant Garamond — display headings, ceremonial quotes, the
  // golden italic title style used across Sacred Reflections, the
  // Gita browser header, and ShlokaCard references.
  register('CormorantGaramond-Light', () =>
    require('../assets/fonts/CormorantGaramond-Light.ttf'),
  );
  register('CormorantGaramond-LightItalic', () =>
    require('../assets/fonts/CormorantGaramond-LightItalic.ttf'),
  );
  register('CormorantGaramond-SemiBold', () =>
    require('../assets/fonts/CormorantGaramond-SemiBold.ttf'),
  );

  // Noto Sans Devanagari — every Sanskrit and Hindi shloka, every
  // Devanagari section title, every chapter sanskrit name. Without
  // this the Devanagari renders via the platform font, which on most
  // Android devices is acceptable but lacks the proper conjunct
  // ligature shaping the design system was tested against.
  register('NotoSansDevanagari-Regular', () =>
    require('../assets/fonts/NotoSansDevanagari-Regular.ttf'),
  );
  register('NotoSansDevanagari-Medium', () =>
    require('../assets/fonts/NotoSansDevanagari-Medium.ttf'),
  );
  register('NotoSansDevanagari-Bold', () =>
    require('../assets/fonts/NotoSansDevanagari-Bold.ttf'),
  );

  // Crimson Text — body type for long-form sacred copy (privacy
  // policy, terms, journal entries). Regular was already shipping;
  // italic is added for emphasis.
  register('CrimsonText-Regular', () =>
    require('../assets/fonts/CrimsonText-Regular.ttf'),
  );
  register('CrimsonText-Italic', () =>
    require('../assets/fonts/CrimsonText-Italic.ttf'),
  );

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
