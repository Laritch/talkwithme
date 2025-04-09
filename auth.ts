'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// User roles for our platform
export type UserRole = 'client' | 'expert' | 'admin';

// Verification methods
export type VerificationMethod = 'email' | 'sms' | 'authenticator' | 'video' | 'document';

// Verification status
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

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demonstration (in production this would come from an API)
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
  const [authState, setAuthState] = useState<AuthState>({
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
        // In production, this would check for a token and validate with an API
        // Since we're in a client component, we can use localStorage
        if (typeof window !== 'undefined') {
          const storedUser = localStorage.getItem('user');

          if (storedUser) {
            const user = JSON.parse(storedUser);
            setAuthState({
              user,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              verificationStep: 'complete',
              preferredVerificationMethod: user.verificationMethods?.[0] || 'email'
            });
          } else {
            setAuthState(prev => ({ ...prev, isLoading: false }));
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthState(prev => ({
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
      setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

      // In production, this would be an API call
      // Simulating a network request with setTimeout
      await new Promise(resolve => setTimeout(resolve, 500));

      // Find the user with the given email
      const user = MOCK_USERS.find(u => u.email === email);

      // Simulate authentication logic
      if (!user || password !== 'password') { // In this demo, all users have 'password' as their password
        throw new Error('Invalid email or password');
      }

      // Move to two-factor verification
      setAuthState(prev => ({
        ...prev,
        user,
        isLoading: false,
        verificationStep: 'twoFactor',
        preferredVerificationMethod: user.verificationMethods?.[0] || 'email'
      }));

    } catch (error) {
      console.error('Login error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }));
    }
  };

  // Verify identity function
  const verifyIdentity = async (code: string, method: VerificationMethod): Promise<boolean> => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // In production, this would be an API call to verify the code
      await new Promise(resolve => setTimeout(resolve, 700));

      // For demo purposes, any 6-digit code is valid
      const isValid = code.length === 6 || code === '123456';

      if (isValid) {
        // Update stored user with verification method used
        const updatedUser = {
          ...authState.user,
          lastVerificationMethod: method,
          lastVerified: new Date().toISOString()
        };

        // Store user in localStorage (in production use secure HTTP-only cookies)
        if (typeof window !== 'undefined') {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        // Set auth state to complete
        setAuthState(prev => ({
          ...prev,
          user: updatedUser as User,
          isAuthenticated: true,
          isLoading: false,
          verificationStep: 'complete'
        }));

        return true;
      }

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Invalid verification code'
      }));
      return false;
    } catch (error) {
      console.error('Verification error:', error);
      setAuthState(prev => ({
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
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // In production, this would be an API call to send a code via the selected method
      await new Promise(resolve => setTimeout(resolve, 500));

      // For demonstration purposes
      console.log(`Sending verification code via ${method} to ${recipient || 'user'}`);

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        preferredVerificationMethod: method
      }));
    } catch (error) {
      console.error('Send verification code error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to send verification code'
      }));
    }
  };

  // Update preferred verification method
  const updatePreferredVerificationMethod = (method: VerificationMethod) => {
    setAuthState(prev => ({
      ...prev,
      preferredVerificationMethod: method
    }));
  };

  // Register trusted device
  const registerTrustedDevice = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // In production, this would create a device fingerprint and store it server-side
      await new Promise(resolve => setTimeout(resolve, 700));

      const updatedUser = {
        ...authState.user,
        deviceTrusted: true
      };

      // Store updated user
      if (typeof window !== 'undefined') {
        localStorage.setItem('user', JSON.stringify(updatedUser));
      }

      setAuthState(prev => ({
        ...prev,
        user: updatedUser as User,
        isLoading: false
      }));
    } catch (error) {
      console.error('Register device error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to register device'
      }));
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true }));

      // In production, this would be an API call
      await new Promise(resolve => setTimeout(resolve, 300));

      // Clear user from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
      }

      // Reset auth state
      setAuthState({
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
      setAuthState(prev => ({
        ...prev,
        isLoading: false
      }));
    }
  };

  // Reset error
  const resetError = () => {
    setAuthState(prev => ({ ...prev, error: null }));
  };

  const contextValue = {
    ...authState,
    login,
    logout,
    resetError,
    verifyIdentity,
    updatePreferredVerificationMethod,
    registerTrustedDevice,
    sendVerificationCode
  };

  return (
    AuthContext.Provider({
      value: contextValue,
      children
    })
  );
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
