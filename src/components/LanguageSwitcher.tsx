'use client';

import React from 'react';
import { useTranslation } from '@/i18n/TranslationProvider';
import { Lang } from '@/i18n/config';

interface LanguageSwitcherProps {
  className?: string;
  type?: 'dropdown' | 'toggle' | 'button';
}

/**
 * Language switcher component
 * Allows users to switch between supported languages
 */
export default function LanguageSwitcher({
  className = '',
  type = 'dropdown'
}: LanguageSwitcherProps) {
  const { lang, setLang, t, supportedLangs } = useTranslation();
  
  // Toggle between languages (for simple two-language case)
  const toggleLanguage = () => {
    const newLang = lang === 'en' ? 'ar' : 'en';
    setLang(newLang as Lang);
  };
  
  // Handle language change from dropdown
  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLang(e.target.value as Lang);
  };

  // Dropdown style language switcher
  if (type === 'dropdown') {
    return (
      <div className={`language-switcher ${className}`}>
        <select
          value={lang}
          onChange={handleLanguageChange}
          className="p-2 rounded border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label={t('settings.language')}
        >
          {supportedLangs.map((langCode) => (
            <option key={langCode} value={langCode}>
              {t(`settings.languages.${langCode}`)}
            </option>
          ))}
        </select>
      </div>
    );
  }
  
  // Simple toggle between English and Arabic
  if (type === 'toggle') {
    return (
      <div className={`language-switcher-toggle ${className}`}>
        <button
          onClick={toggleLanguage}
          className={`px-3 py-1 rounded-full transition-colors ${
            lang === 'en' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
          aria-label={t('settings.language')}
        >
          EN
        </button>
        <button
          onClick={toggleLanguage}
          className={`px-3 py-1 rounded-full transition-colors ${
            lang === 'ar' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-700'
          }`}
          aria-label={t('settings.language')}
        >
          AR
        </button>
      </div>
    );
  }
  
  // Simple button that toggles between languages
  return (
    <button
      onClick={toggleLanguage}
      className={`language-switcher-button ${className} px-4 py-2 rounded bg-gray-100 hover:bg-gray-200 transition-colors`}
      aria-label={t('settings.language')}
    >
      {lang === 'en' ? 'العربية' : 'English'}
    </button>
  );
} 