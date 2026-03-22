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
    (key: string, params?: Record<string, string>): string => {
      // If key doesn't contain a dot and a default namespace is provided, prefix it
      if (defaultNamespace && !key.includes('.')) {
        return context.t(`${defaultNamespace}.${key}`, params);
      }
      return context.t(key, params);
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
