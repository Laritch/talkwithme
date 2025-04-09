import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // User authentication state
  isAuthenticated: false,
  userId: null,
  email: null,

  // User profile information
  profile: {
    firstName: '',
    lastName: '',
    displayName: '',
    profileImage: '',
    phoneNumber: '',
    profession: '',
    specialization: '',
    bio: ''
  },

  // User preferences
  preferences: {
    // Override automatically detected settings
    overrideRegion: false,
    preferredRegion: null,
    overrideLanguage: false,
    preferredLanguage: null,

    // Notification preferences
    emailNotifications: true,
    pushNotifications: true,
    smsNotifications: false,

    // Display preferences
    darkMode: false,
    compactView: false,
    showExpertTimezone: true,

    // Privacy preferences
    shareProfileWithExperts: true,
    shareContactInfo: false,
    allowCookies: true,
    allowAnalytics: true,
    allowMarketing: false
  },

  // Settings loading state
  settingsLoading: false,
  settingsError: null
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true;
      state.userId = action.payload.userId;
      state.email = action.payload.email;
    },

    logout: (state) => {
      return initialState;
    },

    updateProfile: (state, action) => {
      state.profile = {
        ...state.profile,
        ...action.payload
      };
    },

    setRegionPreference: (state, action) => {
      state.preferences.overrideRegion = true;
      state.preferences.preferredRegion = action.payload;
    },

    clearRegionPreference: (state) => {
      state.preferences.overrideRegion = false;
      state.preferences.preferredRegion = null;
    },

    setLanguagePreference: (state, action) => {
      state.preferences.overrideLanguage = true;
      state.preferences.preferredLanguage = action.payload;
    },

    clearLanguagePreference: (state) => {
      state.preferences.overrideLanguage = false;
      state.preferences.preferredLanguage = null;
    },

    updateNotificationPreferences: (state, action) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload
      };
    },

    updateDisplayPreferences: (state, action) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload
      };
    },

    updatePrivacyPreferences: (state, action) => {
      state.preferences = {
        ...state.preferences,
        ...action.payload
      };
    },

    setSettingsLoading: (state, action) => {
      state.settingsLoading = action.payload;
    },

    setSettingsError: (state, action) => {
      state.settingsError = action.payload;
    }
  }
});

export const {
  login,
  logout,
  updateProfile,
  setRegionPreference,
  clearRegionPreference,
  setLanguagePreference,
  clearLanguagePreference,
  updateNotificationPreferences,
  updateDisplayPreferences,
  updatePrivacyPreferences,
  setSettingsLoading,
  setSettingsError
} = userSlice.actions;

export default userSlice.reducer;
