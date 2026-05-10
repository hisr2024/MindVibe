/**
 * Message loading for i18n.
 *
 * Locale bundles live as JSON under `src/messages/<locale>/<namespace>.json`
 * and are referenced via static `require()` so Metro inlines them into the
 * Android AAB (and iOS bundle). Locales without a bundled translation for a
 * given namespace fall back to English silently.
 *
 * Adding a new locale: drop the JSON files under `src/messages/<code>/` and
 * register the locale in the `bundles` map below. Adding a new namespace:
 * register it in the per-locale entry plus the English fallback row.
 */

import type { Locale, TranslationNamespace, TranslationMessages } from './types';

// English (canonical source of truth — every namespace must exist here)
import enCommon from './messages/en/common.json';
import enAuth from './messages/en/auth.json';
import enHome from './messages/en/home.json';
import enKiaan from './messages/en/kiaan.json';
import enNavigation from './messages/en/navigation.json';
import enErrors from './messages/en/errors.json';
import enJourneys from './messages/en/journeys.json';
import enDashboard from './messages/en/dashboard.json';
import enFeatures from './messages/en/features.json';
import enDivine from './messages/en/divine.json';
import enJournal from './messages/en/journal.json';
import enAnalytics from './messages/en/analytics.json';

// Hindi
import hiCommon from './messages/hi/common.json';
import hiAuth from './messages/hi/auth.json';
import hiHome from './messages/hi/home.json';
import hiKiaan from './messages/hi/kiaan.json';
import hiNavigation from './messages/hi/navigation.json';
import hiErrors from './messages/hi/errors.json';
import hiJourneys from './messages/hi/journeys.json';

// Sanskrit
import saCommon from './messages/sa/common.json';
import saAuth from './messages/sa/auth.json';
import saHome from './messages/sa/home.json';
import saKiaan from './messages/sa/kiaan.json';
import saNavigation from './messages/sa/navigation.json';
import saErrors from './messages/sa/errors.json';
import saJourneys from './messages/sa/journeys.json';

// Tamil
import taCommon from './messages/ta/common.json';
import taAuth from './messages/ta/auth.json';
import taHome from './messages/ta/home.json';
import taKiaan from './messages/ta/kiaan.json';
import taNavigation from './messages/ta/navigation.json';
import taErrors from './messages/ta/errors.json';
import taJourneys from './messages/ta/journeys.json';

// Telugu
import teCommon from './messages/te/common.json';
import teAuth from './messages/te/auth.json';
import teHome from './messages/te/home.json';
import teKiaan from './messages/te/kiaan.json';
import teNavigation from './messages/te/navigation.json';
import teErrors from './messages/te/errors.json';
import teJourneys from './messages/te/journeys.json';

// Bengali
import bnCommon from './messages/bn/common.json';
import bnAuth from './messages/bn/auth.json';
import bnHome from './messages/bn/home.json';
import bnKiaan from './messages/bn/kiaan.json';
import bnNavigation from './messages/bn/navigation.json';
import bnErrors from './messages/bn/errors.json';
import bnJourneys from './messages/bn/journeys.json';

// Marathi
import mrCommon from './messages/mr/common.json';
import mrAuth from './messages/mr/auth.json';
import mrHome from './messages/mr/home.json';
import mrKiaan from './messages/mr/kiaan.json';
import mrNavigation from './messages/mr/navigation.json';
import mrErrors from './messages/mr/errors.json';
import mrJourneys from './messages/mr/journeys.json';

// Gujarati
import guCommon from './messages/gu/common.json';
import guAuth from './messages/gu/auth.json';
import guHome from './messages/gu/home.json';
import guKiaan from './messages/gu/kiaan.json';
import guNavigation from './messages/gu/navigation.json';
import guErrors from './messages/gu/errors.json';
import guJourneys from './messages/gu/journeys.json';

// Kannada
import knCommon from './messages/kn/common.json';
import knAuth from './messages/kn/auth.json';
import knHome from './messages/kn/home.json';
import knKiaan from './messages/kn/kiaan.json';
import knNavigation from './messages/kn/navigation.json';
import knErrors from './messages/kn/errors.json';
import knJourneys from './messages/kn/journeys.json';

// Malayalam
import mlCommon from './messages/ml/common.json';
import mlAuth from './messages/ml/auth.json';
import mlHome from './messages/ml/home.json';
import mlKiaan from './messages/ml/kiaan.json';
import mlNavigation from './messages/ml/navigation.json';
import mlErrors from './messages/ml/errors.json';
import mlJourneys from './messages/ml/journeys.json';

// Punjabi
import paCommon from './messages/pa/common.json';
import paAuth from './messages/pa/auth.json';
import paHome from './messages/pa/home.json';
import paKiaan from './messages/pa/kiaan.json';
import paNavigation from './messages/pa/navigation.json';
import paErrors from './messages/pa/errors.json';
import paJourneys from './messages/pa/journeys.json';

// German
import deCommon from './messages/de/common.json';
import deAuth from './messages/de/auth.json';
import deHome from './messages/de/home.json';
import deKiaan from './messages/de/kiaan.json';
import deNavigation from './messages/de/navigation.json';
import deErrors from './messages/de/errors.json';
import deJourneys from './messages/de/journeys.json';

// French
import frCommon from './messages/fr/common.json';
import frAuth from './messages/fr/auth.json';
import frHome from './messages/fr/home.json';
import frKiaan from './messages/fr/kiaan.json';
import frNavigation from './messages/fr/navigation.json';
import frErrors from './messages/fr/errors.json';
import frJourneys from './messages/fr/journeys.json';

// Spanish
import esCommon from './messages/es/common.json';
import esAuth from './messages/es/auth.json';
import esHome from './messages/es/home.json';
import esKiaan from './messages/es/kiaan.json';
import esNavigation from './messages/es/navigation.json';
import esErrors from './messages/es/errors.json';
import esJourneys from './messages/es/journeys.json';

// Italian
import itCommon from './messages/it/common.json';
import itAuth from './messages/it/auth.json';
import itHome from './messages/it/home.json';
import itKiaan from './messages/it/kiaan.json';
import itNavigation from './messages/it/navigation.json';
import itErrors from './messages/it/errors.json';
import itJourneys from './messages/it/journeys.json';

// Portuguese
import ptCommon from './messages/pt/common.json';
import ptAuth from './messages/pt/auth.json';
import ptHome from './messages/pt/home.json';
import ptKiaan from './messages/pt/kiaan.json';
import ptNavigation from './messages/pt/navigation.json';
import ptErrors from './messages/pt/errors.json';
import ptJourneys from './messages/pt/journeys.json';

type LocaleBundle = Partial<Record<TranslationNamespace, TranslationMessages>>;

/**
 * English bundle is exhaustive over every namespace the app uses, even when
 * the namespace has no copy yet (empty object). This guarantees the fallback
 * lookup never misses, so the t() helper never returns the raw key in prod.
 */
const enBundle: Record<TranslationNamespace, TranslationMessages> = {
  common: enCommon,
  auth: enAuth,
  home: enHome,
  kiaan: enKiaan,
  navigation: enNavigation,
  errors: enErrors,
  journeys: enJourneys,
  dashboard: enDashboard,
  features: enFeatures,
  divine: enDivine,
  journal: enJournal,
  analytics: enAnalytics,
  // Namespaces still pending content — empty objects keep the type
  // exhaustive without shipping copy. The t() helper falls back to the
  // key string for these until the bundles land.
  tools: {},
  'emotional-reset': {},
  'karma-reset': {},
  sadhana: {},
  community: {},
  'vibe-player': {},
  settings: {},
};

/**
 * Per-locale bundles. Every locale not listed here, or every namespace not
 * present within a listed locale, falls back to the English bundle.
 */
const bundles: Partial<Record<Locale, LocaleBundle>> = {
  en: enBundle,
  hi: {
    common: hiCommon,
    auth: hiAuth,
    home: hiHome,
    kiaan: hiKiaan,
    navigation: hiNavigation,
    errors: hiErrors,
    journeys: hiJourneys,
  },
  sa: {
    common: saCommon,
    auth: saAuth,
    home: saHome,
    kiaan: saKiaan,
    navigation: saNavigation,
    errors: saErrors,
    journeys: saJourneys,
  },
  ta: {
    common: taCommon,
    auth: taAuth,
    home: taHome,
    kiaan: taKiaan,
    navigation: taNavigation,
    errors: taErrors,
    journeys: taJourneys,
  },
  te: {
    common: teCommon,
    auth: teAuth,
    home: teHome,
    kiaan: teKiaan,
    navigation: teNavigation,
    errors: teErrors,
    journeys: teJourneys,
  },
  bn: {
    common: bnCommon,
    auth: bnAuth,
    home: bnHome,
    kiaan: bnKiaan,
    navigation: bnNavigation,
    errors: bnErrors,
    journeys: bnJourneys,
  },
  mr: {
    common: mrCommon,
    auth: mrAuth,
    home: mrHome,
    kiaan: mrKiaan,
    navigation: mrNavigation,
    errors: mrErrors,
    journeys: mrJourneys,
  },
  gu: {
    common: guCommon,
    auth: guAuth,
    home: guHome,
    kiaan: guKiaan,
    navigation: guNavigation,
    errors: guErrors,
    journeys: guJourneys,
  },
  kn: {
    common: knCommon,
    auth: knAuth,
    home: knHome,
    kiaan: knKiaan,
    navigation: knNavigation,
    errors: knErrors,
    journeys: knJourneys,
  },
  ml: {
    common: mlCommon,
    auth: mlAuth,
    home: mlHome,
    kiaan: mlKiaan,
    navigation: mlNavigation,
    errors: mlErrors,
    journeys: mlJourneys,
  },
  pa: {
    common: paCommon,
    auth: paAuth,
    home: paHome,
    kiaan: paKiaan,
    navigation: paNavigation,
    errors: paErrors,
    journeys: paJourneys,
  },
  de: {
    common: deCommon,
    auth: deAuth,
    home: deHome,
    kiaan: deKiaan,
    navigation: deNavigation,
    errors: deErrors,
    journeys: deJourneys,
  },
  fr: {
    common: frCommon,
    auth: frAuth,
    home: frHome,
    kiaan: frKiaan,
    navigation: frNavigation,
    errors: frErrors,
    journeys: frJourneys,
  },
  es: {
    common: esCommon,
    auth: esAuth,
    home: esHome,
    kiaan: esKiaan,
    navigation: esNavigation,
    errors: esErrors,
    journeys: esJourneys,
  },
  it: {
    common: itCommon,
    auth: itAuth,
    home: itHome,
    kiaan: itKiaan,
    navigation: itNavigation,
    errors: itErrors,
    journeys: itJourneys,
  },
  pt: {
    common: ptCommon,
    auth: ptAuth,
    home: ptHome,
    kiaan: ptKiaan,
    navigation: ptNavigation,
    errors: ptErrors,
    journeys: ptJourneys,
  },
};

const messageCache = new Map<string, TranslationMessages>();

function resolveMessages(
  locale: Locale,
  namespace: TranslationNamespace,
): TranslationMessages {
  const localeBundle = bundles[locale];
  const localeMessages = localeBundle?.[namespace];
  if (localeMessages) return localeMessages;
  // enBundle is exhaustive over TranslationNamespace, but
  // `noUncheckedIndexedAccess` widens the lookup to `| undefined`. The
  // empty-object fallback keeps the return type honest — t() already
  // returns the raw key when no string is found, so an empty namespace
  // degrades gracefully.
  return enBundle[namespace] ?? {};
}

export async function loadMessages(
  locale: Locale,
  namespace: TranslationNamespace,
): Promise<TranslationMessages> {
  const cacheKey = `${locale}:${namespace}`;
  const cached = messageCache.get(cacheKey);
  if (cached) return cached;

  const messages = resolveMessages(locale, namespace);
  messageCache.set(cacheKey, messages);
  return messages;
}

export function getDefaultMessages(namespace: TranslationNamespace): TranslationMessages {
  return enBundle[namespace] ?? {};
}

/** Locales that ship at least one translated namespace bundle. */
export const translatedLocales: readonly Locale[] = Object.keys(bundles) as Locale[];
