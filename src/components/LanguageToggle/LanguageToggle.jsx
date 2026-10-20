import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import './LanguageToggle.css';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();
  const { t } = useTranslation();
  const label = language === 'id'
    ? t('common.switchToEnglish')
    : t('common.switchToIndonesian');

  return (
    <button 
      className="language-toggle"
      onClick={toggleLanguage}
      aria-label={label}
      title={label}
    >
      <div className="language-toggle-content">
        <span className={`language-option ${language === 'id' ? 'active' : ''}`}>
          ID
        </span>
        <span className="language-separator">|</span>
        <span className={`language-option ${language === 'en' ? 'active' : ''}`}>
          EN
        </span>
      </div>
    </button>
  );
};

export default LanguageToggle;
