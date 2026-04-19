/**
 * Hook to access translations from I18nContext.
 *
 * Usage:
 *   const { t, locale, setLocale } = useTranslation();
 *   t('common.loading')  // "Loading..."
 *   t('auth.login')      // "Sign In"
 */

import { useContext, useCallback } from 'react';
import { I18nContext } from './I18nProvider';
import type { TranslationNamespace } from './types';

/** Second argument to t() — either an interpolation map or a string fallback
 *  used when the key is missing (mirrors the i18next default-value API). */
type TFallbackOrParams = Record<string, string> | string;

export function useTranslation(defaultNamespace?: TranslationNamespace) {
  const context = useContext(I18nContext);

  const t = useCallback(
    (key: string, fallbackOrParams?: TFallbackOrParams): string => {
      const isFallback = typeof fallbackOrParams === 'string';
      const params = isFallback ? undefined : fallbackOrParams;
      const fullKey = defaultNamespace && !key.includes('.')
        ? `${defaultNamespace}.${key}`
        : key;
      const translated = context.t(fullKey, params);
      // If the provider returned the key unchanged (our convention for "not
      // found"), fall back to the caller-supplied English string so screens
      // never show raw keys to the user.
      if (isFallback && translated === fullKey) {
        return fallbackOrParams;
      }
      return translated;
    },
    [context, defaultNamespace],
  );

  return {
    t,
    locale: context.locale,
    setLocale: context.setLocale,
    isLoading: context.isLoading,
  };
}
