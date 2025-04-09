'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Types for our authentication system
export type UserRole = 'client' | 'expert' | 'admin';
export type VerificationMethod = 'email' | 'sms' | 'authenticator' | 'video' | 'document';
export type VerificationStatus = 'unverified' | 'pending' | 'verified';

// User interface
export interface User {
  id: string;
  username: string;
  email: string;
  name: string;
  role: UserRole;
  profileImage?: string;
  verificationMethods?: VerificationMethod[];
  identityVerified?: VerificationStatus;
  locationVerified?: VerificationStatus;
  deviceTrusted?: boolean;
  lastLogin?: {
    time: string;
    ip: string;
    device: string;
    location?: string;
  };
}

// Auth state interface
interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  verificationStep: 'credentials' | 'twoFactor' | 'complete' | null;
  preferredVerificationMethod: VerificationMethod;
}

// Auth context interface
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetError: () => void;
  verifyIdentity: (code: string, method: VerificationMethod) => Promise<boolean>;
  updatePreferredVerificationMethod: (method: VerificationMethod) => void;
  registerTrustedDevice: () => Promise<void>;
  sendVerificationCode: (method: VerificationMethod, recipient?: string) => Promise<void>;
}

// Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demonstration
const MOCK_USERS: User[] = [
  {
    id: '1',
    username: 'client1',
    email: 'client@example.com',
    name: 'Client User',
    role: 'client',
    profileImage: 'https://ui-avatars.com/api/?name=Client+User&background=0D8ABC&color=fff',
    verificationMethods: ['email', 'sms'],
    identityVerified: 'verified',
    locationVerified: 'verified',
    deviceTrusted: true,
    lastLogin: {
      time: '2023-06-05T10:30:00Z',
      ip: '192.168.1.1',
      device: 'Chrome on Windows',
      location: 'New York, USA'
    }
  },
  {
    id: '2',
    username: 'expert1',
    email: 'expert@example.com',
    name: 'Dr. Sarah Johnson',
    role: 'expert',
    profileImage: 'https://ui-avatars.com/api/?name=Sarah+Johnson&background=8A2BE2&color=fff',
    verificationMethods: ['email', 'sms', 'authenticator', 'video'],
    identityVerified: 'verified',
    locationVerified: 'verified',
    deviceTrusted: true,
    lastLogin: {
      time: '2023-06-04T15:45:00Z',
      ip: '192.168.1.2',
      device: 'Firefox on MacOS',
      location: 'Boston, USA'
    }
  },
  {
    id: '3',
    username: 'admin1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    profileImage: 'https://ui-avatars.com/api/?name=Admin+User&background=FF5733&color=fff',
    verificationMethods: ['email', 'authenticator'],
    identityVerified: 'verified',
    locationVerified: 'verified',
    deviceTrusted: true,
    lastLogin: {
      time: '2023-06-05T09:15:00Z',
      ip: '192.168.1.3',
      device: 'Safari on MacOS',
      location: 'San Francisco, USA'
    }
  }
];

// Provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
    verificationStep: null,
    preferredVerificationMethod: 'email'
  });

  const router = useRouter();

  // Initialize - check if the user is already logged in
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for user in localStorage
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');

          if (storedUser) {
            const user = JSON.parse(storedUser);
            setState({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              verificationStep: 'complete',
              preferredVerificationMethod: user.verificationMethods?.[0] || 'email'
            });
          } else {
            setState(prev => ({ ...prev, isLoading: false }));
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to initialize authentication'
        }));
      }
    };

    initializeAuth();
  }, []);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Simulate network request
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find the user with the given email
      const user = MOCK_USERS.find(u => u.email === email);

      // Simulate authentication logic
      if (!user || password !== 'password') {
        throw new Error('Invalid email or password');
      }

      // Move to two-factor verification
      setState(prev => ({
        ...prev,
        user,
        isLoading: false,
        verificationStep: 'twoFactor',
        preferredVerificationMethod: user.verificationMethods?.[0] || 'email'
      }));

    } catch (error) {
      console.error('Login error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));
    }
  };

  // Verify identity function
  const verifyIdentity = async (code: string, method: VerificationMethod): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Simulate API call to verify code
      await new Promise(resolve => setTimeout(resolve, 700));

      // For demo purposes, any 6-digit code is valid
      const isValid = code.length === 6 || code === '123456';

      if (isValid) {
        // Update stored user with verification method used
        const updatedUser = {
          ...state.user,
          lastVerificationMethod: method,
          lastVerified: new Date().toISOString()
        };

        // Store user in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // Set auth state to complete
        setState(prev => ({
          ...prev,
          user: updatedUser as User,
          isAuthenticated: true,
          isLoading: false,
          verificationStep: 'complete'
        }));

        // Redirect based on user role
        if (updatedUser.role === 'admin') {
          router.push('/admin');
        } else if (updatedUser.role === 'expert') {
          router.push('/expert/dashboard');
        } else {
          router.push('/dashboard');
        }

        return true;
      }

      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Invalid verification code'
      }));
      return false;
    } catch (error) {
      console.error('Verification error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      }));
      return false;
    }
  };

  // Send verification code function
  const sendVerificationCode = async (method: VerificationMethod, recipient?: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Simulate sending verification code
      await new Promise(resolve => setTimeout(resolve, 500));

      // For demonstration purposes
      console.log(`Sending verification code via ${method} to ${recipient || 'user'}`);

      setState(prev => ({
        ...prev,
        isLoading: false,
        preferredVerificationMethod: method
      }));
    } catch (error) {
      console.error('Send verification code error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send verification code'
      }));
    }
  };

  // Update preferred verification method
  const updatePreferredVerificationMethod = (method: VerificationMethod) => {
    setState(prev => ({
      ...prev,
      preferredVerificationMethod: method
    }));
  };

  // Register trusted device
  const registerTrustedDevice = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Simulate registering device
      await new Promise(resolve => setTimeout(resolve, 700));

      const updatedUser = {
        ...state.user,
        deviceTrusted: true
      };

      // Store updated user
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setState(prev => ({
        ...prev,
        user: updatedUser as User,
        isLoading: false
      }));
    } catch (error) {
      console.error('Register device error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to register device'
      }));
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true }));

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300));

      // Clear user from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }

      // Reset auth state
      setState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        verificationStep: null,
        preferredVerificationMethod: 'email'
      });

      // Redirect to home page
      router.push('/');
    } catch (error) {
      console.error('Logout error:', error);
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  };

  // Reset error
  const resetError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  // Create context value
  const value = {
    ...state,
    login,
    logout,
    resetError,
    verifyIdentity,
    updatePreferredVerificationMethod,
    registerTrustedDevice,
    sendVerificationCode
  };

  // Return provider
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
