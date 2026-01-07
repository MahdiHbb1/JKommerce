import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import './LanguageToggle.css';

const LanguageToggle = () => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <button 
      className="language-toggle"
      onClick={toggleLanguage}
      aria-label={`Switch to ${language === 'id' ? 'English' : 'Indonesian'}`}
      title={`Switch to ${language === 'id' ? 'English' : 'Indonesian'}`}
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
