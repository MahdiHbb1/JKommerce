import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import Button from '../../components/Button/Button';
import PageMeta from '../../components/Seo/PageMeta';
import './Account.css';

const Account = () => {
  const { user, signIn, signUp, signOut, isSupabaseConfigured } = useAuth();
  const { t } = useTranslation();

  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const getAuthErrorKey = (message = '') => {
    if (/invalid login credentials/i.test(message)) {
      return 'account.invalidCredentials';
    }
    if (/email not confirmed/i.test(message)) {
      return 'account.emailNotConfirmed';
    }
    if (/user already registered/i.test(message)) {
      return 'account.userExists';
    }
    if (/password should be at least/i.test(message)) {
      return 'account.passwordTooShort';
    }
    return 'account.authFailed';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginMode) {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (err) {
      setError(t(getAuthErrorKey(err.message)));
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      setError(t('account.signOutFailed'));
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="account-page">
        <PageMeta
          title={t('account.title')}
          description={t('account.metaDescription')}
        />
        <div className="container">
          <div className="account-container">
            <h1>{t('account.title')}</h1>
            <p className="auth-not-configured">{t('account.notConfigured')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="account-page">
        <PageMeta
          title={t('account.title')}
          description={t('account.metaDescription')}
        />
        <div className="container">
          <div className="account-container">
            <h1>{t('nav.account')}</h1>
            <div className="account-details">
              <div className="account-info">
                <h2>{t('account.profileTitle')}</h2>
                <p>
                  <strong>{t('account.emailLabel')}:</strong> {user.email}
                </p>
                <p>
                  <strong>{t('account.userIdLabel')}:</strong> {user.id}
                </p>
              </div>

              {error && (
                <p className="error-message" role="alert">
                  {error}
                </p>
              )}

              <div className="account-actions">
                <Button variant="outline" size="large" onClick={handleSignOut}>
                  {t('account.signOut')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <PageMeta
        title={isLoginMode ? t('account.signIn') : t('account.createAccount')}
        description={t('account.metaDescription')}
      />
      <div className="container">
        <div className="account-container">
          <h1>{isLoginMode ? t('account.signIn') : t('account.createAccount')}</h1>

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">{t('account.emailLabel')}</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('account.passwordLabel')}</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete={isLoginMode ? 'current-password' : 'new-password'}
                minLength={6}
              />
            </div>

            {error && (
              <p className="error-message" role="alert">
                {error}
              </p>
            )}

            <Button
              variant="primary"
              size="large"
              type="submit"
              fullWidth
              disabled={loading}
            >
              {loading ? t('account.processing') : (isLoginMode ? t('account.signIn') : t('account.createAccount'))}
            </Button>
          </form>

          <p className="auth-switch">
            {isLoginMode
              ? t('account.switchToSignUp')
              : t('account.switchToSignIn')}{' '}
            <button
              type="button"
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError('');
              }}
              className="link-button"
            >
              {isLoginMode ? t('account.signUp') : t('account.signIn')}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Account;
