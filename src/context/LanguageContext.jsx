import { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Load from localStorage or default to English
    try {
      const savedLang = localStorage.getItem('janoerkoening_language');
      return savedLang || 'en';
    } catch (error) {
      console.error('Error loading language from localStorage:', error);
      return 'en';
    }
  });

  // Save language preference to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('janoerkoening_language', language);
      // Update document language attribute
      document.documentElement.lang = language;
    } catch (error) {
      console.error('Error saving language to localStorage:', error);
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'id' ? 'en' : 'id');
  };

  const setLanguagePreference = (lang) => {
    if (lang === 'id' || lang === 'en') {
      setLanguage(lang);
    }
  };

  const value = {
    language,
    toggleLanguage,
    setLanguagePreference,
    isIndonesian: language === 'id',
    isEnglish: language === 'en'
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
