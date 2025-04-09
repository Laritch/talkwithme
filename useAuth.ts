import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { LoginCredentials, RegistrationData, User, UserUpdateData } from '../types/auth';
import authService from '../services/authService';

/**
 * Authentication hook return type
 */
interface UseAuth {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<boolean>;
  register: (data: RegistrationData) => Promise<boolean>;
  logout: () => Promise<void>;
  updateProfile: (data: UserUpdateData) => Promise<boolean>;
  verifyEmail: (token: string) => Promise<boolean>;
  requestPasswordReset: (email: string) => Promise<boolean>;
  resetPassword: (token: string, newPassword: string, confirmPassword: string) => Promise<boolean>;
  clearError: () => void;
}

/**
 * Custom hook for authentication
 *
 * @returns Authentication state and operations
 */
export function useAuth(): UseAuth {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch the current user on mount
  useEffect(() => {
    const fetchCurrentUser = async () => {
      setIsLoading(true);
      try {
        const isAuthUser = await authService.isAuthenticated();
        if (isAuthUser) {
          const response = await authService.getCurrentUser();
          if (response.success && response.data) {
            setUser(response.data);
            setIsAuthenticated(true);
          } else {
            setUser(null);
            setIsAuthenticated(false);
          }
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCurrentUser();
  }, []);

  /**
   * Login with email and password
   */
  const login = useCallback(async (credentials: LoginCredentials): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.login(credentials);

      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(response.error?.message || 'Login failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Register a new user
   */
  const register = useCallback(async (data: RegistrationData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.register(data);

      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      } else {
        setError(response.error?.message || 'Registration failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Logout the current user
   */
  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      await authService.logout();
      setUser(null);
      setIsAuthenticated(false);

      // Redirect to login page
      router.push('/login');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  /**
   * Update user profile
   */
  const updateProfile = useCallback(async (data: UserUpdateData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.updateProfile(data);

      if (response.success && response.data) {
        setUser(response.data);
        return true;
      } else {
        setError(response.error?.message || 'Failed to update profile');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Verify email with token
   */
  const verifyEmail = useCallback(async (token: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.verifyEmail({ token });

      if (response.success) {
        return true;
      } else {
        setError(response.error?.message || 'Email verification failed');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Request password reset
   */
  const requestPasswordReset = useCallback(async (email: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.requestPasswordReset({ email });

      if (response.success) {
        return true;
      } else {
        setError(response.error?.message || 'Failed to request password reset');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Reset password with token
   */
  const resetPassword = useCallback(async (
    token: string,
    newPassword: string,
    confirmPassword: string
  ): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.resetPassword({
        token,
        newPassword,
        confirmPassword,
      });

      if (response.success) {
        return true;
      } else {
        setError(response.error?.message || 'Failed to reset password');
        return false;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    user,
    isLoading,
    isAuthenticated,
    error,
    login,
    register,
    logout,
    updateProfile,
    verifyEmail,
    requestPasswordReset,
    resetPassword,
    clearError,
  };
}
