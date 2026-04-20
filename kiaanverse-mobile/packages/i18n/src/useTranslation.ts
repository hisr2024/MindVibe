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

export function useTranslation(defaultNamespace?: TranslationNamespace) {
  const context = useContext(I18nContext);

  const t = useCallback(
    (
      key: string,
      defaultValueOrParams?: string | Record<string, string>,
      maybeParams?: Record<string, string>,
    ): string => {
      const params =
        typeof defaultValueOrParams === 'object' ? defaultValueOrParams : maybeParams;
      const fallback =
        typeof defaultValueOrParams === 'string' ? defaultValueOrParams : undefined;
      const fullKey =
        defaultNamespace && !key.includes('.') ? `${defaultNamespace}.${key}` : key;
      const translated = context.t(fullKey, params);
      // If translation returned the raw key (missing translation) and a
      // fallback was provided, use the fallback instead.
      return translated === fullKey && fallback !== undefined ? fallback : translated;
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
