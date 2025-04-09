import React, { createContext, useState, useContext, useEffect } from 'react';

// Sample users with roles
const sampleUsers = {
  'admin@example.com': {
    id: 'admin-1',
    email: 'admin@example.com',
    name: 'Admin User',
    role: 'admin',
    avatar: '👩‍💼',
    password: 'admin123' // In a real app, this would be hashed
  },
  'expert@example.com': {
    id: 'expert-1',
    email: 'expert@example.com',
    name: 'Jan de Vries',
    role: 'expert',
    avatar: '👨‍🚀',
    password: 'expert123'
  },
  'client@example.com': {
    id: 'client-1',
    email: 'client@example.com',
    name: 'Alex Johnson',
    role: 'client',
    avatar: '👨‍💻',
    password: 'client123'
  }
};

// Create auth context
const AuthContext = createContext();

/**
 * AuthProvider Component
 * Manages authentication state and provides login/logout functionality
 */
export const AuthProvider = ({ children }) => {
  // Get initial auth state from localStorage
  const getInitialAuthState = () => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      try {
        return { user: JSON.parse(savedUser), isAuthenticated: true };
      } catch (error) {
        console.error('Error parsing saved user:', error);
        return { user: null, isAuthenticated: false };
      }
    }
    return { user: null, isAuthenticated: false };
  };

  const [authState, setAuthState] = useState(getInitialAuthState);

  // Save auth state to localStorage when it changes
  useEffect(() => {
    if (authState.isAuthenticated && authState.user) {
      localStorage.setItem('currentUser', JSON.stringify(authState.user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [authState]);

  /**
   * Login function
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {boolean} - Whether login was successful
   */
  const login = (email, password) => {
    const user = sampleUsers[email];

    if (user && user.password === password) {
      // Remove the password before storing user data
      const { password, ...userWithoutPassword } = user;
      setAuthState({
        user: userWithoutPassword,
        isAuthenticated: true
      });
      return true;
    }

    return false;
  };

  /**
   * Logout function
   */
  const logout = () => {
    setAuthState({
      user: null,
      isAuthenticated: false
    });
  };

  /**
   * Check if user has a specific role
   * @param {string} role - Role to check
   * @returns {boolean} - Whether user has the role
   */
  const hasRole = (role) => {
    return authState.isAuthenticated && authState.user && authState.user.role === role;
  };

  /**
   * Check if user is an admin
   * @returns {boolean} - Whether user is an admin
   */
  const isAdmin = () => {
    return hasRole('admin');
  };

  /**
   * Check if user is an expert
   * @returns {boolean} - Whether user is an expert
   */
  const isExpert = () => {
    return hasRole('expert');
  };

  /**
   * Check if user is a client
   * @returns {boolean} - Whether user is a client
   */
  const isClient = () => {
    return hasRole('client');
  };

  // Context value
  const contextValue = {
    user: authState.user,
    isAuthenticated: authState.isAuthenticated,
    login,
    logout,
    hasRole,
    isAdmin,
    isExpert,
    isClient
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * Custom hook to use the auth context
 * @returns {Object} The auth context
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
