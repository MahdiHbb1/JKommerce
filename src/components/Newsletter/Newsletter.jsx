import { useState } from 'react';
import { useTranslation } from '../../hooks/useTranslation';
import './Newsletter.css';

const Newsletter = () => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(''); // '', 'success', 'error'
  const [message, setMessage] = useState('');

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setStatus('error');
      setMessage(t('validation.emailRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setStatus('error');
      setMessage(t('validation.emailInvalid'));
      return;
    }

    // Simulate subscription (no backend)
    setStatus('success');
    setMessage(t('footer.newsletterSuccess'));
    setEmail('');

    // Reset status after 5 seconds
    setTimeout(() => {
      setStatus('');
      setMessage('');
    }, 5000);
  };

  return (
    <div className="newsletter">
      <div className="newsletter-content">
        <div className="newsletter-text">
          <h3>{t('footer.newsletter')}</h3>
          <p>{t('footer.newsletterDesc')}</p>
        </div>
        
        <form onSubmit={handleSubmit} className="newsletter-form">
          <div className="input-wrapper">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t('footer.emailPlaceholder')}
              className={`newsletter-input ${status === 'error' ? 'error' : ''}`}
              disabled={status === 'success'}
            />
            <button 
              type="submit" 
              className="newsletter-btn"
              disabled={status === 'success'}
            >
              {t('footer.subscribe')}
            </button>
          </div>
          
          {message && (
            <div className={`newsletter-message ${status}`}>
              {status === 'success' ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                </svg>
              )}
              <span>{message}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Newsletter;
