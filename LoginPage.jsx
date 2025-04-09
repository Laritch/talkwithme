import React, { useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import './LoginPage.css';

/**
 * LoginPage Component
 *
 * Provides a login form for users to authenticate.
 * Includes sample credentials for easy testing.
 */
const LoginPage = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Sample user credentials for easy testing
  const sampleCredentials = [
    { role: 'Admin', email: 'admin@example.com', password: 'admin123' },
    { role: 'Expert', email: 'expert@example.com', password: 'expert123' },
    { role: 'Client', email: 'client@example.com', password: 'client123' }
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    // Simple validation
    if (!email || !password) {
      setError('Please enter both email and password');
      setIsLoading(false);
      return;
    }

    // Attempt login
    const success = login(email, password);

    if (success) {
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } else {
      setError('Invalid email or password');
      setIsLoading(false);
    }
  };

  // Quick login function for sample users
  const quickLogin = (sampleEmail, samplePassword) => {
    setEmail(sampleEmail);
    setPassword(samplePassword);

    setTimeout(() => {
      login(sampleEmail, samplePassword);
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    }, 100);
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="app-logo">Resource Library</div>
          <h1>Sign In</h1>
          <p>Log in to access the resource library and expert communication system</p>
        </div>

        {error && (
          <div className="login-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="quick-login-section">
          <h3>Sample Users (for testing)</h3>
          <div className="sample-users">
            {sampleCredentials.map((cred, index) => (
              <div className="sample-user" key={index}>
                <div className="user-role">{cred.role}</div>
                <div className="user-email">{cred.email}</div>
                <button
                  className="quick-login-btn"
                  onClick={() => quickLogin(cred.email, cred.password)}
                >
                  Quick Login
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
