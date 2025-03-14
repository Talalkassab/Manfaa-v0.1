// Define the languages supported in the application
export const supportedLangs = ['en', 'ar'] as const;
export type Lang = (typeof supportedLangs)[number];

// Define locale settings
export const localeConfig: Record<Lang, LocaleConfig> = {
  en: {
    dir: 'ltr',
    code: 'en-US',
    name: 'English',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: 'h:mm A',
    currencyCode: 'SAR',
    currencyDisplay: 'symbol',
    currencySymbol: '﷼',
    weekStartsOn: 0, // Sunday
    decimalSeparator: '.',
    thousandSeparator: ',',
  },
  ar: {
    dir: 'rtl',
    code: 'ar-SA',
    name: 'العربية',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: 'h:mm A',
    currencyCode: 'SAR',
    currencyDisplay: 'symbol',
    currencySymbol: '﷼',
    weekStartsOn: 6, // Saturday
    decimalSeparator: '٫',
    thousandSeparator: '٬',
  },
};

// Locale config type
export interface LocaleConfig {
  dir: 'ltr' | 'rtl';
  code: string;
  name: string;
  dateFormat: string;
  timeFormat: string;
  currencyCode: string;
  currencyDisplay: 'symbol' | 'code' | 'name' | 'narrowSymbol';
  currencySymbol: string;
  weekStartsOn: 0 | 1 | 2 | 3 | 4 | 5 | 6; // 0 = Sunday, 1 = Monday, etc.
  decimalSeparator: string;
  thousandSeparator: string;
}

// Get locale settings by language code
export function getLocaleConfig(lang: Lang): LocaleConfig {
  return localeConfig[lang];
}

// Default language fallback
export const defaultLang: Lang = 'en';

// Get direction (ltr or rtl) by language
export function getDirection(lang: Lang): 'ltr' | 'rtl' {
  return localeConfig[lang].dir;
}

// Check if a language requires RTL
export function isRTL(lang: Lang): boolean {
  return getDirection(lang) === 'rtl';
}

// Get a number formatter for the language
export function getNumberFormatter(
  lang: Lang,
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const config = getLocaleConfig(lang);
  return new Intl.NumberFormat(config.code, options);
}

// Get a currency formatter for the language
export function getCurrencyFormatter(
  lang: Lang,
  options?: Intl.NumberFormatOptions
): Intl.NumberFormat {
  const config = getLocaleConfig(lang);
  return new Intl.NumberFormat(config.code, {
    style: 'currency',
    currency: config.currencyCode,
    currencyDisplay: config.currencyDisplay,
    ...options,
  });
}

// Get a date formatter for the language
export function getDateFormatter(
  lang: Lang,
  options?: Intl.DateTimeFormatOptions
): Intl.DateTimeFormat {
  const config = getLocaleConfig(lang);
  return new Intl.DateTimeFormat(config.code, options);
}

// Format date for display
export function formatDate(
  date: Date | string | number,
  lang: Lang,
  options?: Intl.DateTimeFormatOptions
): string {
  const dateObj = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  return getDateFormatter(lang, options).format(dateObj);
}

// Format currency for display
export function formatCurrency(
  amount: number,
  lang: Lang,
  options?: Intl.NumberFormatOptions
): string {
  return getCurrencyFormatter(lang, options).format(amount);
}

// Format number for display
export function formatNumber(
  number: number,
  lang: Lang,
  options?: Intl.NumberFormatOptions
): string {
  return getNumberFormatter(lang, options).format(number);
} 