import { createContext, useContext, useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { fetchUserProfile, logout as logoutAction } from '../store/slices/userSlice';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Check for token in localStorage on initial load
    const storedToken = localStorage.getItem('token');

    if (storedToken) {
      setToken(storedToken);
      // Fetch user profile with the stored token
      dispatch(fetchUserProfile())
        .unwrap()
        .catch(error => {
          setAuthError(error);
          // If token is invalid, clear it
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, [dispatch]);

  // Set up axios interceptor for adding token to requests
  useEffect(() => {
    // This would be implemented if using axios
    // axios.interceptors.request.use(
    //   config => {
    //     if (token) {
    //       config.headers.Authorization = `Bearer ${token}`;
    //     }
    //     return config;
    //   },
    //   error => Promise.reject(error)
    // );

    // Set up fetch interceptor manually since fetch doesn't have built-in interceptors
    const originalFetch = window.fetch;
    window.fetch = async (url, config = {}) => {
      // Don't add auth headers to external URLs or login/register endpoints
      if (
        (typeof url === 'string' && (url.startsWith('http') || url.includes('/auth/login') || url.includes('/auth/register'))) ||
        !token
      ) {
        return originalFetch(url, config);
      }

      // Clone the config and add authorization header
      const authConfig = {
        ...config,
        headers: {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        },
      };

      try {
        // Attempt the fetch with auth header
        const response = await originalFetch(url, authConfig);

        // If we get a 401 Unauthorized, the token might be expired
        if (response.status === 401) {
          // Clear auth state and redirect to login
          dispatch(logoutAction());
          setToken(null);
          setAuthError('Your session has expired. Please log in again.');

          // Return the original response
          return response;
        }

        return response;
      } catch (error) {
        return Promise.reject(error);
      }
    };

    // Cleanup function to restore original fetch
    return () => {
      window.fetch = originalFetch;
    };
  }, [token, dispatch]);

  const logout = () => {
    dispatch(logoutAction());
    setToken(null);
    setAuthError(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        authError,
        setAuthError,
        token,
        setToken,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
