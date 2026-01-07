import { useLanguage } from '../context/LanguageContext';
import { translations } from '../data/translations';

/**
 * Custom hook for accessing translations
 * @returns {Object} Object with t function and language info
 */
export const useTranslation = () => {
  const { language, toggleLanguage, isIndonesian, isEnglish } = useLanguage();

  /**
   * Get translation for a given key
   * @param {string} key - Translation key (e.g., 'nav.home', 'product.addToCart')
   * @param {Object} params - Optional parameters for interpolation
   * @returns {string} Translated text
   */
  const t = (key, params = {}) => {
    const keys = key.split('.');
    let value = translations[language];

    // Navigate through nested object
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        console.warn(`Translation missing for key: ${key} in language: ${language}`);
        return key; // Return key if translation not found
      }
    }

    // Interpolate parameters if any
    if (typeof value === 'string' && Object.keys(params).length > 0) {
      return value.replace(/\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey] !== undefined ? params[paramKey] : match;
      });
    }

    return value;
  };

  /**
   * Format currency based on language
   * @param {number} amount - Amount to format
   * @returns {string} Formatted currency string
   */
  const formatCurrency = (amount) => {
    if (isIndonesian) {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount);
    } else {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(amount).replace('IDR', 'IDR ');
    }
  };

  /**
   * Format date based on language
   * @param {Date|string} date - Date to format
   * @returns {string} Formatted date string
   */
  const formatDate = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    if (isIndonesian) {
      return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'long',
        year: 'numeric'
      }).format(dateObj);
    } else {
      return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: '2-digit',
        year: 'numeric'
      }).format(dateObj);
    }
  };

  /**
   * Format number based on language
   * @param {number} number - Number to format
   * @returns {string} Formatted number string
   */
  const formatNumber = (number) => {
    if (isIndonesian) {
      return new Intl.NumberFormat('id-ID').format(number);
    } else {
      return new Intl.NumberFormat('en-US').format(number);
    }
  };

  /**
   * Get localized product field (name, description, etc.)
   * @param {Object} product - Product object
   * @param {string} field - Field name (e.g., 'name', 'description')
   * @returns {string} Localized field value
   */
  const getLocalizedField = (product, field) => {
    if (!product || !product[field]) return '';
    
    // If field is an object with language keys
    if (typeof product[field] === 'object' && product[field][language]) {
      return product[field][language];
    }
    
    // If field is a simple string, return as is
    return product[field];
  };

  return {
    t,
    language,
    isIndonesian,
    isEnglish,
    toggleLanguage,
    formatCurrency,
    formatDate,
    formatNumber,
    getLocalizedField
  };
};

export default useTranslation;
