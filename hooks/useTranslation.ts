'use client';

import { useState, useEffect } from 'react';
import { defaultLocale, type Locale, getMessages } from '@/i18n';

type Messages = {
  common: any;
  kiaan: any;
  dashboard: any;
  features: any;
  navigation: any;
  errors: any;
};

let cachedMessages: Messages | null = null;
let cachedLocale: Locale | null = null;

export function useTranslation() {
  const [messages, setMessages] = useState<Messages | null>(cachedMessages);
  const [locale, setLocale] = useState<Locale>(cachedLocale || defaultLocale);
  const [isLoading, setIsLoading] = useState(!cachedMessages);

  useEffect(() => {
    // Load saved locale preference
    const savedLocale = (typeof window !== 'undefined' 
      ? localStorage.getItem('preferredLocale') 
      : null) as Locale;
    
    const currentLocale = savedLocale && savedLocale !== locale ? savedLocale : locale;

    // Only load if not cached or locale changed
    if (!cachedMessages || cachedLocale !== currentLocale) {
      setIsLoading(true);
      getMessages(currentLocale)
        .then((msgs) => {
          cachedMessages = msgs;
          cachedLocale = currentLocale;
          setMessages(msgs);
          setLocale(currentLocale);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load translations:', error);
          setIsLoading(false);
        });
    } else {
      setMessages(cachedMessages);
      setLocale(currentLocale);
    }

    // Listen for locale changes
    const handleLocaleChange = (event: CustomEvent) => {
      const newLocale = event.detail.locale as Locale;
      setLocale(newLocale);
      setIsLoading(true);
      getMessages(newLocale)
        .then((msgs) => {
          cachedMessages = msgs;
          cachedLocale = newLocale;
          setMessages(msgs);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Failed to load translations:', error);
          setIsLoading(false);
        });
    };

    window.addEventListener('localeChanged', handleLocaleChange as EventListener);
    return () => {
      window.removeEventListener('localeChanged', handleLocaleChange as EventListener);
    };
  }, [locale]);

  const t = (category: keyof Messages, key: string, params?: Record<string, string | number>): string => {
    if (!messages || !messages[category]) {
      return key;
    }

    const keys = key.split('.');
    let value: any = messages[category];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        return key;
      }
    }

    // Replace parameters if any
    if (typeof value === 'string' && params) {
      return value.replace(/\{(\w+)\}/g, (_, paramKey) => {
        return params[paramKey]?.toString() || `{${paramKey}}`;
      });
    }

    return typeof value === 'string' ? value : key;
  };

  return {
    t,
    locale,
    isLoading,
    messages,
  };
}
