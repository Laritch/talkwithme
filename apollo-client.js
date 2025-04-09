import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { persistCache, LocalStorageWrapper } from 'apollo3-cache-persist';

// Http link for GraphQL API
const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL || '/api/graphql',
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`
      );
    });
  }
  if (networkError) {
    console.error(`[Network error]: ${networkError}`);
  }
});

// Auth link to add token to requests
const authLink = setContext((_, { headers }) => {
  // Get the token from localStorage
  let token;
  if (typeof window !== 'undefined') {
    token = localStorage.getItem('token');
  }

  // Return the headers to the context
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Cache config with type policies for better cache behavior
const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        // Merge course lists instead of replacing
        courses: {
          keyArgs: ['category', 'search'],
          merge(existing = { items: [] }, incoming) {
            // If it's a new page or a new query, replace everything
            if (!incoming.page || incoming.page === 1) {
              return incoming;
            }

            // Otherwise, merge the new items with the existing ones
            return {
              ...incoming,
              items: [...existing.items, ...incoming.items],
            };
          },
        },

        // Always replace search results
        searchCourses: {
          keyArgs: ['query'],
          merge: (_, incoming) => incoming,
        },
      },
    },

    // Add unique identifiers for Course type
    Course: {
      keyFields: ['id'],
    },

    // Add unique identifiers for User type
    User: {
      keyFields: ['id'],
    },
  },
});

// Initialize cache persistence to localStorage
if (typeof window !== 'undefined') {
  persistCache({
    cache,
    storage: new LocalStorageWrapper(window.localStorage),
    maxSize: 2097152, // 2MB
    debug: process.env.NODE_ENV === 'development',
  }).catch((error) => {
    console.error('Error initializing cache persistence:', error);
  });
}

// Create Apollo Client
const client = new ApolloClient({
  link: authLink.concat(errorLink).concat(httpLink),
  cache,
  connectToDevTools: process.env.NODE_ENV === 'development',
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network',
      errorPolicy: 'all',
    },
    query: {
      fetchPolicy: 'cache-first',
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default client;
