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
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (err) {
      setError(err.message || 'Sign out failed');
    }
  };

  if (!isSupabaseConfigured) {
    return (
      <div className="account-page">
        <PageMeta
          title="Account"
          description="Manage your account settings and preferences."
        />
        <div className="container">
          <div className="account-container">
            <h1>{t('nav.account')}</h1>
            <p className="auth-not-configured">
              Authentication is not configured. Please set up Supabase to enable account features.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="account-page">
        <PageMeta
          title="My Account"
          description="View your account details and order history."
        />
        <div className="container">
          <div className="account-container">
            <h1>{t('nav.account')}</h1>
            <div className="account-details">
              <div className="account-info">
                <h2>Profile Information</h2>
                <p><strong>Email:</strong> {user.email}</p>
                <p><strong>User ID:</strong> {user.id}</p>
              </div>
              
              <div className="account-actions">
                <Button variant="outline" size="large" onClick={handleSignOut}>
                  Sign Out
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
        title={isLoginMode ? 'Sign In' : 'Sign Up'}
        description={isLoginMode ? 'Sign in to your account' : 'Create a new account'}
      />
      <div className="container">
        <div className="account-container">
          <h1>{isLoginMode ? 'Sign In' : 'Create Account'}</h1>
          
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
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
              <label htmlFor="password">Password</label>
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
            
            {error && <p className="error-message">{error}</p>}
            
            <Button 
              variant="primary" 
              size="large" 
              type="submit" 
              fullWidth
              disabled={loading}
            >
              {loading ? 'Processing...' : (isLoginMode ? 'Sign In' : 'Create Account')}
            </Button>
          </form>
          
          <p className="auth-switch">
            {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
            <button 
              type="button" 
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setError('');
              }}
              className="link-button"
            >
              {isLoginMode ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Account;
