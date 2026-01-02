/**
 * LanguageSettings Component
 * 
 * Allows users to manage their language preferences including:
 * - Preferred language selection
 * - Auto-translation toggle
 * - Save functionality
 */

'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/useLanguage';
import { SUPPORTED_LANGUAGES, getLanguagesByRegion } from '@/config/translation';

interface LanguageSettingsProps {
  onClose?: () => void;
  className?: string;
}

export function LanguageSettings({ onClose, className = '' }: LanguageSettingsProps) {
  const { language, setLanguage } = useLanguage();
  
  const [selectedLanguage, setSelectedLanguage] = useState<string>(language);
  const [autoTranslate, setAutoTranslate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Load saved preferences
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedAutoTranslate = localStorage.getItem('autoTranslate') === 'true';
      setAutoTranslate(savedAutoTranslate);
      setSelectedLanguage(language);
    }
  }, [language]);

  const handleLanguageChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLanguage(event.target.value);
  };

  const handleAutoTranslateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setAutoTranslate(event.target.checked);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveStatus('idle');

    try {
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('preferredLanguage', selectedLanguage);
        localStorage.setItem('autoTranslate', autoTranslate.toString());
      }

      // Update language context
      setLanguage(selectedLanguage);

      // Optionally save to backend API
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || '/api';
        await fetch(`${apiUrl}/translation/preferences`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            language: selectedLanguage,
            auto_translate: autoTranslate
          })
        });
      } catch (apiError) {
        // API save failed, but localStorage succeeded
        console.warn('Failed to save preferences to backend:', apiError);
      }

      setSaveStatus('success');
      
      // Close after successful save
      setTimeout(() => {
        onClose?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const languagesByRegion = getLanguagesByRegion();

  return (
    <div className={`bg-gradient-to-br from-orange-900/30 to-orange-800/20 border border-orange-500/30 rounded-2xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-orange-50 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-orange-400"
          >
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M2 12h20"></path>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
          </svg>
          Language Settings
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-orange-300 hover:text-orange-100 transition-colors"
            aria-label="Close language settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        )}
      </div>

      {/* Language Selection */}
      <div className="space-y-4">
        <div>
          <label htmlFor="language-select" className="block text-sm font-medium text-orange-100 mb-2">
            Preferred Language
          </label>
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={handleLanguageChange}
            className="w-full px-4 py-2 bg-black/40 border border-orange-500/30 rounded-lg text-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:border-orange-400"
            disabled={isSaving}
          >
            {Object.entries(languagesByRegion).map(([region, languages]) => (
              <optgroup key={region} label={region} className="bg-slate-900">
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.nativeName} ({lang.name})
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* Auto-translate Toggle */}
        <div className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-orange-500/20">
          <div>
            <label htmlFor="auto-translate" className="text-sm font-medium text-orange-50 cursor-pointer">
              Auto-translate messages
            </label>
            <p className="text-xs text-orange-200/60 mt-1">
              Automatically translate chat messages to your preferred language
            </p>
          </div>
          <div className="flex items-center">
            <input
              type="checkbox"
              id="auto-translate"
              checked={autoTranslate}
              onChange={handleAutoTranslateChange}
              disabled={isSaving}
              className="w-5 h-5 rounded border-orange-500/30 bg-black/40 text-orange-500 focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-200 text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {saveStatus === 'success' && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg text-green-200 text-sm flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            Settings saved successfully!
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-400/50 focus:ring-offset-2 focus:ring-offset-slate-900"
        >
          {isSaving ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </span>
          ) : (
            'Save Settings'
          )}
        </button>

        {/* Info Text */}
        <p className="text-xs text-orange-200/50 text-center">
          Your language preference will be saved locally and synced to your account
        </p>
      </div>
    </div>
  );
}

export default LanguageSettings;
