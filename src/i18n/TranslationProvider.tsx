'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Lang, supportedLangs, defaultLang, getLocaleConfig, getDirection } from './config';
import enTranslations from './translations/en';
import arTranslations from './translations/ar';

// Map of translations by language code
const translations = {
  en: enTranslations,
  ar: arTranslations,
};

// Type for the context value
type TranslationContextType = {
  t: (key: string, params?: Record<string, string>) => string;
  lang: Lang;
  setLang: (lang: Lang) => void;
  dir: 'ltr' | 'rtl';
  isRTL: boolean;
  supportedLangs: readonly Lang[];
};

// Create the context
const TranslationContext = createContext<TranslationContextType | null>(null);

// Provider props
interface TranslationProviderProps {
  children: React.ReactNode;
  initialLang?: Lang;
}

/**
 * Translation provider component
 * Provides translations and language control functions to the app
 */
export function TranslationProvider({
  children,
  initialLang = defaultLang,
}: TranslationProviderProps) {
  // State for the current language
  const [lang, setLangState] = useState<Lang>(initialLang);
  
  // Get direction based on language
  const dir = getDirection(lang);
  const isRTL = dir === 'rtl';
  
  // Effect to set HTML dir attribute when language changes
  useEffect(() => {
    // Set the dir attribute on the HTML tag
    document.documentElement.dir = dir;
    
    // Set the lang attribute on the HTML tag
    document.documentElement.lang = lang;
    
    // Store the language preference in localStorage
    localStorage.setItem('preferredLanguage', lang);
  }, [lang, dir]);
  
  // Effect to load language from localStorage on initial render
  useEffect(() => {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && supportedLangs.includes(savedLang as Lang)) {
      setLangState(savedLang as Lang);
    }
  }, []);
  
  // Function to set language
  const setLang = (newLang: Lang) => {
    if (supportedLangs.includes(newLang)) {
      setLangState(newLang);
    }
  };
  
  // Function to get a translation by key
  const t = (key: string, params?: Record<string, string>): string => {
    // Split the key by dots to navigate the translations object
    const keys = key.split('.');
    
    // Start with the full translations object for the current language
    let result: any = translations[lang];
    
    // Navigate through the keys
    for (const k of keys) {
      // If the key doesn't exist, return the key as fallback
      if (!result || !result[k]) {
        // Try to get the translation from the default language
        if (lang !== defaultLang) {
          let defaultResult = translations[defaultLang];
          for (const defaultK of keys) {
            if (!defaultResult || !defaultResult[defaultK]) {
              return key; // Not found in default language either
            }
            defaultResult = defaultResult[defaultK];
          }
          result = defaultResult;
          break;
        }
        return key; // Key not found
      }
      
      // Move to the next level
      result = result[k];
    }
    
    // If the result is an object, return the key
    if (typeof result === 'object') {
      return key;
    }
    
    // If we have params, replace placeholders in the translation
    if (params && typeof result === 'string') {
      return Object.entries(params).reduce((str, [paramKey, paramValue]) => {
        return str.replace(new RegExp(`{${paramKey}}`, 'g'), paramValue);
      }, result);
    }
    
    return result;
  };
  
  // Context value
  const contextValue: TranslationContextType = {
    t,
    lang,
    setLang,
    dir,
    isRTL,
    supportedLangs,
  };
  
  return (
    <TranslationContext.Provider value={contextValue}>
      {children}
    </TranslationContext.Provider>
  );
}

/**
 * Hook to use translations in components
 */
export function useTranslation() {
  const context = useContext(TranslationContext);
  
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  
  return context;
}

export default TranslationProvider; 