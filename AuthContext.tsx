import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define types for users and auth context
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'client' | 'expert' | 'admin';
  isVerified: boolean;
  profilePicture?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  error: string | null;
  clearError: () => void;
}

interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role: 'client' | 'expert';
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  register: async () => ({ success: false }),
  logout: () => {},
  error: null,
  clearError: () => {},
});

// Hook to use the auth context
export const useAuth = () => useContext(AuthContext);

interface AuthProviderProps {
  children: ReactNode;
}

// Provider component that wraps the app and provides auth context
export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check for existing authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Check for token in localStorage
        const token = localStorage.getItem('authToken');

        if (!token) {
          setIsLoading(false);
          return;
        }

        // In a real app, validate token with server
        // For now, we'll simulate a valid token check
        const userData = JSON.parse(localStorage.getItem('user') || 'null');

        if (userData) {
          setUser(userData);
        }
      } catch (err) {
        console.error('Auth check error:', err);
        // Clear any invalid tokens
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Login function
  const login = async (credentials: LoginCredentials) => {
    setError(null);
    setIsLoading(true);

    try {
      // In a real app, send request to API
      // For now, simulate API call with mock users
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network delay

      // Mock validation (would be server-side in real app)
      if (!credentials.email || !credentials.password) {
        throw new Error('Email and password are required');
      }

      // Mock users for demo
      const mockUsers = [
        {
          id: 'usr-1',
          email: 'client@example.com',
          password: 'password',
          username: 'TestClient',
          role: 'client',
          isVerified: true,
          profilePicture: '/uploads/default-avatar.png'
        },
        {
          id: 'usr-2',
          email: 'expert@example.com',
          password: 'password',
          username: 'TestExpert',
          role: 'expert',
          isVerified: true,
          profilePicture: '/uploads/default-avatar.png'
        },
        {
          id: 'usr-3',
          email: 'admin@example.com',
          password: 'password',
          username: 'AdminUser',
          role: 'admin',
          isVerified: true,
          profilePicture: '/uploads/default-avatar.png'
        }
      ];

      // Find user and check password (in a real app, this would be done by the server)
      const mockUser = mockUsers.find(user => user.email === credentials.email);

      if (!mockUser || mockUser.password !== credentials.password) {
        throw new Error('Invalid email or password');
      }

      // Remove password from user object
      const { password, ...userWithoutPassword } = mockUser;

      // Store auth data
      const mockToken = `mock-token-${Date.now()}`;
      localStorage.setItem('authToken', mockToken);

      if (credentials.rememberMe) {
        localStorage.setItem('user', JSON.stringify(userWithoutPassword));
      } else {
        sessionStorage.setItem('user', JSON.stringify(userWithoutPassword));
      }

      setUser(userWithoutPassword as User);

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to login';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Register function
  const register = async (userData: RegisterData) => {
    setError(null);
    setIsLoading(true);

    try {
      // In a real app, send request to API
      // For now, simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network delay

      // Mock validation (would be server-side in real app)
      if (!userData.email || !userData.password || !userData.username) {
        throw new Error('All fields are required');
      }

      // Mock new user creation
      const newUser = {
        id: `usr-${Date.now()}`,
        username: userData.username,
        email: userData.email,
        role: userData.role,
        isVerified: false,
        profilePicture: '/uploads/default-avatar.png'
      };

      // In a real app, we would not store the user until email verification
      // For demo purposes, we auto-log in the new user
      setUser(newUser);

      // Store auth data
      const mockToken = `mock-token-${Date.now()}`;
      localStorage.setItem('authToken', mockToken);
      localStorage.setItem('user', JSON.stringify(newUser));

      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    setUser(null);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
  };

  // Clear error
  const clearError = () => {
    setError(null);
  };

  // Context value
  const contextValue = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
