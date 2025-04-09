import { useState, useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { ApolloProvider } from '@apollo/client';
import Head from 'next/head';
import { useRouter } from 'next/router';

import { store } from '../store';
import apolloClient from '../lib/apollo-client';
import { AuthProvider } from '../context/AuthContext';
import { initializeCartFromStorage } from '../store/slices/cartSlice';
import { setTheme } from '../store/slices/uiSlice';

// Import global styles
import '../styles/globals.css';

function MyApp({ Component, pageProps }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Initialize client-side state
  useEffect(() => {
    setMounted(true);

    // Initialize cart from localStorage
    store.dispatch(initializeCartFromStorage());

    // Initialize theme from localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      store.dispatch(setTheme(savedTheme));
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Use dark theme if user prefers dark mode
      store.dispatch(setTheme('dark'));
    }

    // Add event listener for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = (e) => {
      if (!localStorage.getItem('theme')) {
        // Only auto-switch if user hasn't explicitly chosen a theme
        store.dispatch(setTheme(e.matches ? 'dark' : 'light'));
      }
    };

    mediaQuery.addEventListener('change', handleThemeChange);

    return () => {
      mediaQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  // Handle route change events
  useEffect(() => {
    const handleRouteChangeStart = () => {
      // Add loading indicator or other route change logic
    };

    const handleRouteChangeComplete = () => {
      // Remove loading indicator or track page view
      window.scrollTo(0, 0);
    };

    router.events.on('routeChangeStart', handleRouteChangeStart);
    router.events.on('routeChangeComplete', handleRouteChangeComplete);

    return () => {
      router.events.off('routeChangeStart', handleRouteChangeStart);
      router.events.off('routeChangeComplete', handleRouteChangeComplete);
    };
  }, [router]);

  // Get layout if it exists
  const getLayout = Component.getLayout || ((page) => page);

  return (
    <ReduxProvider store={store}>
      <ApolloProvider client={apolloClient}>
        <AuthProvider>
          <Head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Education Platform</title>
          </Head>

          {/* Apply theme class to body */}
          {mounted && (
            <div className={store.getState().ui.theme === 'dark' ? 'dark' : ''}>
              {getLayout(<Component {...pageProps} />)}
            </div>
          )}
        </AuthProvider>
      </ApolloProvider>
    </ReduxProvider>
  );
}

export default MyApp;
