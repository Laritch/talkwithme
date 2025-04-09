'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { setCookie, deleteCookie, getCookie } from 'cookies-next';
import { User } from './userModel';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  twoFactorRequired: boolean;
  twoFactorVerified: boolean;
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  verifyTwoFactor: (token: string) => Promise<boolean>;
  setupTwoFactor: () => Promise<{ secret: string; qrCodeUrl: string }>;
  resetError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    twoFactorRequired: false,
    twoFactorVerified: false,
  });

  // Initialize - check if the user is already logged in
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if there's a token in cookies
        const token = getCookie('access_token');
        if (!token) {
          setAuthState(prev => ({ ...prev, isLoading: false }));
          return;
        }

        // Validate token with the API
        const response = await fetch('/api/auth/me', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setAuthState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            twoFactorRequired: data.twoFactorEnabled && !data.twoFactorVerified,
            twoFactorVerified: data.twoFactorVerified || false,
          });
        } else {
          // Token is invalid, clear it
          deleteCookie('access_token');
          setAuthState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize authentication',
        }));
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (username: string, password: string) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      if (data.requiresTwoFactor) {
        setAuthState({
          user: data.user,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          twoFactorRequired: true,
          twoFactorVerified: false,
        });
        return;
      }

      // Set the token in cookies
      setCookie('access_token', data.accessToken, {
        maxAge: 60 * 15, // 15 minutes
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });

      // Update auth state
      setAuthState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        twoFactorRequired: false,
        twoFactorVerified: true,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Authentication failed',
      }));
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      await fetch('/api/auth/logout', {
        method: 'POST',
      });

      // Clear the token
      deleteCookie('access_token');

      // Reset auth state
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        twoFactorRequired: false,
        twoFactorVerified: false,
      });
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
      }));
    }
  };

  // Verify two-factor authentication token
  const verifyTwoFactor = async (token: string): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch('/api/auth/verify-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, userId: authState.user?.id }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Two-factor verification failed');
      }

      // Set the token in cookies
      setCookie('access_token', data.accessToken, {
        maxAge: 60 * 15, // 15 minutes
        path: '/',
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      });

      // Update auth state
      setAuthState({
        user: data.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        twoFactorRequired: false,
        twoFactorVerified: true,
      });

      return true;
    } catch (error: any) {
      console.error('2FA verification error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Two-factor verification failed',
      }));
      return false;
    }
  };

  // Set up two-factor authentication
  const setupTwoFactor = async (): Promise<{ secret: string; qrCodeUrl: string }> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      const response = await fetch('/api/auth/setup-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set up two-factor authentication');
      }

      setAuthState(prev => ({ ...prev, isLoading: false }));

      return {
        secret: data.secret,
        qrCodeUrl: data.qrCodeUrl,
      };
    } catch (error: any) {
      console.error('2FA setup error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to set up two-factor authentication',
      }));
      throw error;
    }
  };

  // Reset error
  const resetError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const value = {
    ...authState,
    login,
    logout,
    verifyTwoFactor,
    setupTwoFactor,
    resetError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
