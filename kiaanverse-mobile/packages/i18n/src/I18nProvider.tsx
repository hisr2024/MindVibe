/**
 * I18n Provider
 *
 * Wraps the app with locale context. Provides the `t()` translation
 * function and locale state management.
 */

import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { Locale, TranslationNamespace, TranslationMessages } from './types';
import { defaultLocale } from './locales';
import { loadMessages, getDefaultMessages } from './loadMessages';

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  isLoading: boolean;
}

export const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  t: (key) => key,
  isLoading: false,
});

interface I18nProviderProps {
  initialLocale?: Locale;
  namespaces?: TranslationNamespace[];
  onLocaleChange?: (locale: Locale) => void;
  children: React.ReactNode;
}

export function I18nProvider({
  initialLocale = defaultLocale,
  namespaces = ['common', 'navigation', 'errors'],
  onLocaleChange,
  children,
}: I18nProviderProps): React.JSX.Element {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const [messages, setMessages] = useState<Record<string, TranslationMessages>>(() => {
    // Initialize with default English messages synchronously
    const initial: Record<string, TranslationMessages> = {};
    for (const ns of namespaces) {
      initial[ns] = getDefaultMessages(ns);
    }
    return initial;
  });
  const [isLoading, setIsLoading] = useState(false);

  const loadAllNamespaces = useCallback(async (targetLocale: Locale) => {
    setIsLoading(true);
    const loaded: Record<string, TranslationMessages> = {};
    const results = await Promise.all(
      namespaces.map(async (ns) => {
        const msgs = await loadMessages(targetLocale, ns);
        return { ns, msgs };
      }),
    );
    for (const { ns, msgs } of results) {
      loaded[ns] = msgs;
    }
    setMessages(loaded);
    setIsLoading(false);
  }, [namespaces]);

  useEffect(() => {
    let cancelled = false;
    // Async loader setState inside useEffect — required to hydrate translations after mount.
    loadAllNamespaces(locale).then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [locale, loadAllNamespaces]);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    onLocaleChange?.(newLocale);
  }, [onLocaleChange]);

  const t = useCallback((key: string, params?: Record<string, string>): string => {
    // Key format: "namespace.key" or "namespace.nested.key"
    const dotIndex = key.indexOf('.');
    if (dotIndex === -1) return key;

    const ns = key.slice(0, dotIndex);
    const messageKey = key.slice(dotIndex + 1);

    const nsMessages = messages[ns];
    if (!nsMessages) return key;

    // Handle nested keys (one level)
    const nestedDotIndex = messageKey.indexOf('.');
    let value: string | undefined;

    if (nestedDotIndex !== -1) {
      const parentKey = messageKey.slice(0, nestedDotIndex);
      const childKey = messageKey.slice(nestedDotIndex + 1);
      const parent = nsMessages[parentKey];
      if (typeof parent === 'object' && parent !== null) {
        value = parent[childKey];
      }
    } else {
      const msg = nsMessages[messageKey];
      if (typeof msg === 'string') {
        value = msg;
      }
    }

    if (!value) return key;

    // Interpolate params: {{paramName}}
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (_, paramKey: string) => params[paramKey] ?? `{{${paramKey}}}`);
    }

    return value;
  }, [messages]);

  const value = useMemo<I18nContextValue>(
    () => ({ locale, setLocale, t, isLoading }),
    [locale, setLocale, t, isLoading],
  );

  return (
    <I18nContext.Provider value={value}>
      {children}
    </I18nContext.Provider>
  );
}
