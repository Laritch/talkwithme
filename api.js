import axios from 'axios';

// Create an axios instance with base configuration
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'https://api.expertconnect.com/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for handling errors and token refresh
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Handle token expiration and refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh-token`,
          { refreshToken }
        );

        const { token } = response.data;
        localStorage.setItem('token', token);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // If refresh token is also invalid, log out the user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');

        // Redirect to login page (should be handled by the app's router)
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }

        return Promise.reject(refreshError);
      }
    }

    // Handle other errors
    return Promise.reject(error);
  }
);

// Authentication API
export const authAPI = {
  login: (credentials) => apiClient.post('/auth/login', credentials),
  register: (userData) => apiClient.post('/auth/register', userData),
  logout: () => apiClient.post('/auth/logout'),
  getCurrentUser: () => apiClient.get('/auth/me'),
  verifyEmail: (token) => apiClient.post(`/auth/verify-email`, { token }),
  resetPassword: (email) => apiClient.post('/auth/reset-password', { email }),
  setNewPassword: (token, password) => apiClient.post('/auth/set-password', { token, password }),
  updateProfile: (userData) => apiClient.put('/users/profile', userData),
  updatePassword: (passwordData) => apiClient.put('/users/password', passwordData),
  uploadProfilePicture: (formData) =>
    apiClient.post('/users/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),
  registerAsExpert: () => apiClient.post('/users/register-as-expert'),
  getNotifications: () => apiClient.get('/users/notifications'),
  markNotificationAsRead: (notificationId) =>
    apiClient.put(`/users/notifications/${notificationId}/read`)
};

// Experts API
export const expertAPI = {
  // Expert dashboard endpoints
  createProfile: (profileData) =>
    apiClient.post('/expert/profile', profileData),

  updateProfile: (profileData) =>
    apiClient.put('/expert/profile', profileData),

  publishProfile: () =>
    apiClient.post('/expert/profile/publish'),

  getExpertDashboard: () =>
    apiClient.get('/expert/dashboard'),

  getExpertProfile: () =>
    apiClient.get('/expert/profile'),

  uploadProfilePhoto: (formData) =>
    apiClient.post('/expert/profile/photo', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),

  uploadCredentials: (formData) =>
    apiClient.post('/expert/credentials', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),

  updateAvailability: (availabilityData) =>
    apiClient.put('/expert/availability', availabilityData),

  getSessions: (params) =>
    apiClient.get('/expert/sessions', { params }),

  getSession: (sessionId) =>
    apiClient.get(`/expert/sessions/${sessionId}`),

  updateSessionStatus: (sessionId, status) =>
    apiClient.put(`/expert/sessions/${sessionId}/status`, { status }),

  // Client endpoints
  getAllExperts: (params) =>
    apiClient.get('/experts', { params }),

  getExpert: (expertId) =>
    apiClient.get(`/experts/${expertId}`),

  bookSession: (expertId, sessionData) =>
    apiClient.post(`/experts/${expertId}/book`, sessionData),

  getClientSessions: () =>
    apiClient.get('/client/sessions'),

  getClientSession: (sessionId) =>
    apiClient.get(`/client/sessions/${sessionId}`),

  cancelSession: (sessionId) =>
    apiClient.post(`/client/sessions/${sessionId}/cancel`),

  // Search and filters
  searchExperts: (queryParams) =>
    apiClient.get('/experts/search', { params: queryParams }),

  getExpertCategories: () =>
    apiClient.get('/categories'),

  getRecommendedExperts: () =>
    apiClient.get('/experts/recommended'),

  getPopularExperts: () =>
    apiClient.get('/experts/popular'),

  getRelatedExperts: (expertId) =>
    apiClient.get(`/experts/${expertId}/related`),

  getExpertsByCategory: (categoryId, params) =>
    apiClient.get(`/categories/${categoryId}/experts`, { params }),

  getExpertsWithFilters: (filters) =>
    apiClient.get('/experts/filter', { params: filters })
};

// Analytics API
export const analyticsAPI = {
  // Expert analytics
  getExpertDashboardStats: () =>
    apiClient.get('/expert/analytics/dashboard'),

  getSessionAnalytics: (params) =>
    apiClient.get('/expert/analytics/sessions', { params }),

  getRevenueStats: (params) =>
    apiClient.get('/expert/analytics/revenue', { params }),

  getClientEngagement: () =>
    apiClient.get('/expert/analytics/engagement'),

  // Client analytics
  getClientSessionHistory: () =>
    apiClient.get('/client/analytics/sessions')
};

// Reviews API
export const reviewsAPI = {
  getExpertReviews: (expertId, params) =>
    apiClient.get(`/experts/${expertId}/reviews`, { params }),

  createReview: (expertId, reviewData) =>
    apiClient.post(`/experts/${expertId}/reviews`, reviewData),

  updateReview: (expertId, reviewId, reviewData) =>
    apiClient.put(`/experts/${expertId}/reviews/${reviewId}`, reviewData),

  deleteReview: (expertId, reviewId) =>
    apiClient.delete(`/experts/${expertId}/reviews/${reviewId}`)
};

// User API
export const userAPI = {
  updateProfile: (userData) =>
    apiClient.put('/users/profile', userData),

  updatePassword: (passwordData) =>
    apiClient.put('/users/password', passwordData),

  uploadProfilePicture: (formData) =>
    apiClient.post('/users/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),

  getNotifications: () =>
    apiClient.get('/users/notifications'),

  markNotificationAsRead: (notificationId) =>
    apiClient.put(`/users/notifications/${notificationId}/read`),

  getUnreadNotificationsCount: () =>
    apiClient.get('/users/notifications/unread/count'),

  getUserFavorites: () =>
    apiClient.get('/users/favorites'),

  addToFavorites: (expertId) =>
    apiClient.post('/users/favorites', { expertId }),

  removeFromFavorites: (expertId) =>
    apiClient.delete(`/users/favorites/${expertId}`),

  saveSearchHistory: (searchQuery) =>
    apiClient.post('/users/search-history', { query: searchQuery }),

  getSearchHistory: () =>
    apiClient.get('/users/search-history'),

  clearSearchHistory: () =>
    apiClient.delete('/users/search-history')
};

// Messaging API
export const messagingAPI = {
  getConversations: () =>
    apiClient.get('/messages/conversations'),

  getConversation: (conversationId) =>
    apiClient.get(`/messages/conversations/${conversationId}`),

  sendMessage: (conversationId, messageData) =>
    apiClient.post(`/messages/conversations/${conversationId}`, messageData),

  createConversation: (expertId) =>
    apiClient.post('/messages/conversations', { expertId }),

  uploadAttachment: (conversationId, formData) =>
    apiClient.post(`/messages/conversations/${conversationId}/attachment`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
};

// Notifications API
export const notificationsAPI = {
  getNotifications: (params) =>
    apiClient.get('/notifications', { params }),

  markAsRead: (notificationId) =>
    apiClient.put(`/notifications/${notificationId}/read`),

  markAllAsRead: () =>
    apiClient.put('/notifications/read-all'),

  getUnreadCount: () =>
    apiClient.get('/notifications/unread/count'),

  updateNotificationPreferences: (preferences) =>
    apiClient.put('/notifications/preferences', preferences)
};

// Products API
export const productsAPI = {
  // Expert product management
  getExpertProducts: () =>
    apiClient.get('/expert/products'),

  getExpertProduct: (productId) =>
    apiClient.get(`/expert/products/${productId}`),

  createProduct: (productData) =>
    apiClient.post('/expert/products', productData),

  updateProduct: (productId, productData) =>
    apiClient.put(`/expert/products/${productId}`, productData),

  deleteProduct: (productId) =>
    apiClient.delete(`/expert/products/${productId}`),

  uploadProductImage: (productId, formData) =>
    apiClient.post(`/expert/products/${productId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    }),

  // Client product browsing/purchasing
  getAllProducts: (params) =>
    apiClient.get('/products', { params }),

  getProduct: (productId) =>
    apiClient.get(`/products/${productId}`),

  getExpertShelf: (expertId) =>
    apiClient.get(`/experts/${expertId}/products`),

  searchProducts: (queryParams) =>
    apiClient.get('/products/search', { params: queryParams }),

  getProductsByCategory: (categoryId, params) =>
    apiClient.get(`/categories/${categoryId}/products`, { params }),

  getRecommendedProducts: () =>
    apiClient.get('/products/recommended'),

  // Product reviews
  getProductReviews: (productId, params) =>
    apiClient.get(`/products/${productId}/reviews`, { params }),

  createProductReview: (productId, reviewData) =>
    apiClient.post(`/products/${productId}/reviews`, reviewData),

  updateProductReview: (productId, reviewId, reviewData) =>
    apiClient.put(`/products/${productId}/reviews/${reviewId}`, reviewData),

  deleteProductReview: (productId, reviewId) =>
    apiClient.delete(`/products/${productId}/reviews/${reviewId}`)
};

// Cart API
export const cartAPI = {
  getCart: () =>
    apiClient.get('/cart'),

  addToCart: (productId, quantity = 1) =>
    apiClient.post('/cart/items', { productId, quantity }),

  updateCartItem: (itemId, quantity) =>
    apiClient.put(`/cart/items/${itemId}`, { quantity }),

  removeFromCart: (itemId) =>
    apiClient.delete(`/cart/items/${itemId}`),

  clearCart: () =>
    apiClient.delete('/cart/items'),

  checkout: (paymentData) =>
    apiClient.post('/cart/checkout', paymentData)
};

// Loyalty Program API
export const loyaltyAPI = {
  // Client loyalty endpoints
  getClientLoyaltyStats: () =>
    apiClient.get('/client/loyalty'),

  getClientRewards: () =>
    apiClient.get('/client/loyalty/rewards'),

  redeemPoints: (rewardId) =>
    apiClient.post('/client/loyalty/redeem', { rewardId }),

  // Expert loyalty management endpoints
  getExpertLoyaltyProgram: () =>
    apiClient.get('/expert/loyalty'),

  updateLoyaltyProgram: (programData) =>
    apiClient.put('/expert/loyalty', programData),

  createReward: (rewardData) =>
    apiClient.post('/expert/loyalty/rewards', rewardData),

  updateReward: (rewardId, rewardData) =>
    apiClient.put(`/expert/loyalty/rewards/${rewardId}`, rewardData),

  deleteReward: (rewardId) =>
    apiClient.delete(`/expert/loyalty/rewards/${rewardId}`)
};

// Tips/Gifts API
export const tipsAPI = {
  // Client sending tips/gifts
  sendTip: (expertId, tipData) =>
    apiClient.post(`/experts/${expertId}/tips`, tipData),

  // Expert receiving tips
  getExpertTips: (params) =>
    apiClient.get('/expert/tips', { params }),

  // Set up tip preferences
  updateTipPreferences: (preferences) =>
    apiClient.put('/expert/tips/preferences', preferences)
};

// Translation API
export const translationAPI = {
  translateMessage: (text, targetLanguage) =>
    apiClient.post('/translation', { text, targetLanguage }),

  detectLanguage: (text) =>
    apiClient.post('/translation/detect', { text }),

  getSupportedLanguages: () =>
    apiClient.get('/translation/languages'),

  updateTranslationPreferences: (preferences) =>
    apiClient.put('/users/translation-preferences', preferences)
};

// ... existing code ... <default export>
export default apiClient;
