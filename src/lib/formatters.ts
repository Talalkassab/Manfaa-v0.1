/**
 * Utility functions for formatting values like currency, dates, etc.
 */

/**
 * Format a number or string as currency
 * @param value - The value to format as currency
 * @param locale - The locale to use (defaults to 'en-US')
 * @param currency - The currency code (defaults to 'SAR' for Saudi Riyal)
 * @returns Formatted currency string
 */
export function formatCurrency(
  value: number | string | undefined | null,
  locale = 'en-US',
  currency = 'SAR'
): string {
  if (value === undefined || value === null) return '';
  
  // Handle string values that may include currency symbols
  if (typeof value === 'string') {
    // Remove currency symbols and commas
    const cleanValue = value.replace(/[^\d.-]/g, '');
    if (!cleanValue || isNaN(Number(cleanValue))) return '';
    value = Number(cleanValue);
  }
  
  // Format with the specified locale and currency
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Format a date string
 * @param dateString - The date string to format
 * @param locale - The locale to use (defaults to 'en-US')
 * @param options - Date formatting options
 * @returns Formatted date string
 */
export function formatDate(
  dateString: string | Date | undefined | null,
  locale = 'en-US',
  options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }
): string {
  if (!dateString) return '';
  
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (error) {
    console.error('Error formatting date:', error);
    return '';
  }
}

/**
 * Format a number with commas and optional decimal places
 * @param value - The number to format
 * @param decimals - Number of decimal places (defaults to 0)
 * @param locale - The locale to use (defaults to 'en-US')
 * @returns Formatted number string
 */
export function formatNumber(
  value: number | string | undefined | null,
  decimals = 0,
  locale = 'en-US'
): string {
  if (value === undefined || value === null) return '';
  
  // Handle string values
  if (typeof value === 'string') {
    const cleanValue = value.replace(/[^\d.-]/g, '');
    if (!cleanValue || isNaN(Number(cleanValue))) return '';
    value = Number(cleanValue);
  }
  
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format a number as a percentage
 * @param value - The value to format as percentage (e.g., 0.25 for 25%)
 * @param decimals - Number of decimal places (defaults to 0)
 * @param locale - The locale to use (defaults to 'en-US')
 * @returns Formatted percentage string
 */
export function formatPercent(
  value: number | string | undefined | null,
  decimals = 0,
  locale = 'en-US'
): string {
  if (value === undefined || value === null) return '';
  
  // Handle string values
  if (typeof value === 'string') {
    // Remove percentage symbol and convert to number
    const cleanValue = value.replace(/%/g, '').trim();
    if (!cleanValue || isNaN(Number(cleanValue))) return '';
    // If the value includes a percentage sign, we assume it's already a percentage
    value = value.includes('%') ? Number(cleanValue) / 100 : Number(cleanValue);
  }
  
  return new Intl.NumberFormat(locale, {
    style: 'percent',
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

/**
 * Truncate text with ellipsis
 * @param text - The text to truncate
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateText(text: string | undefined | null, maxLength = 100): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}

/**
 * Format a phone number to a consistent pattern
 * @param phone - The phone number to format
 * @param countryCode - The country code (defaults to Saudi Arabia)
 * @returns Formatted phone number
 */
export function formatPhoneNumber(
  phone: string | undefined | null,
  countryCode = '+966'
): string {
  if (!phone) return '';
  
  // Remove non-numeric characters
  const numericPhone = phone.replace(/\D/g, '');
  
  // Handle Saudi Arabia format (9 digits without country code)
  if (numericPhone.length === 9) {
    return `${countryCode} ${numericPhone.substring(0, 2)} ${numericPhone.substring(2, 5)} ${numericPhone.substring(5)}`;
  }
  
  // Handle international format
  if (numericPhone.length >= 10) {
    // If starts with country code
    if (numericPhone.startsWith('966')) {
      const withoutCode = numericPhone.substring(3);
      return `+966 ${withoutCode.substring(0, 2)} ${withoutCode.substring(2, 5)} ${withoutCode.substring(5)}`;
    }
    
    // Generic format for other numbers
    return `${numericPhone.substring(0, 3)} ${numericPhone.substring(3, 6)} ${numericPhone.substring(6)}`;
  }
  
  // Return as is if not matching expected patterns
  return phone;
}

/**
 * Convert string to title case
 * @param text - The text to convert
 * @returns Title cased text
 */
export function toTitleCase(text: string | undefined | null): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
} 