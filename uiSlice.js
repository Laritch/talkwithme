import { createSlice } from '@reduxjs/toolkit';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: 'light',
    sidebarOpen: false,
    activeModals: {},
    notifications: [],
    searchQuery: '',
    filters: {
      priceRange: [0, 1000],
      ratings: null,
      level: null,
      duration: null,
      language: null,
    },
    sortOption: 'relevance', // relevance, popularity, newest, price-low-high, price-high-low, ratings
  },
  reducers: {
    toggleTheme: (state) => {
      state.theme = state.theme === 'light' ? 'dark' : 'light';
      // Also store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', state.theme);
      }
    },
    setTheme: (state, action) => {
      state.theme = action.payload;
      // Also store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', action.payload);
      }
    },
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarState: (state, action) => {
      state.sidebarOpen = action.payload;
    },
    openModal: (state, action) => {
      const { modalId, data } = action.payload;
      state.activeModals[modalId] = { isOpen: true, data };
    },
    closeModal: (state, action) => {
      const modalId = action.payload;
      if (state.activeModals[modalId]) {
        state.activeModals[modalId].isOpen = false;
      }
    },
    closeAllModals: (state) => {
      Object.keys(state.activeModals).forEach(modalId => {
        state.activeModals[modalId].isOpen = false;
      });
    },
    addNotification: (state, action) => {
      const { id, type, message, autoClose = true, duration = 5000 } = action.payload;
      state.notifications.push({
        id: id || Date.now().toString(),
        type, // 'success', 'error', 'warning', 'info'
        message,
        autoClose,
        duration,
        createdAt: Date.now(),
      });
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        notification => notification.id !== action.payload
      );
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilter: (state, action) => {
      const { filterName, value } = action.payload;
      state.filters[filterName] = value;
    },
    resetFilters: (state) => {
      state.filters = {
        priceRange: [0, 1000],
        ratings: null,
        level: null,
        duration: null,
        language: null,
      };
    },
    setSortOption: (state, action) => {
      state.sortOption = action.payload;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  toggleSidebar,
  setSidebarState,
  openModal,
  closeModal,
  closeAllModals,
  addNotification,
  removeNotification,
  clearAllNotifications,
  setSearchQuery,
  setFilter,
  resetFilters,
  setSortOption,
} = uiSlice.actions;

export default uiSlice.reducer;
