import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Define notification types
export const NOTIFICATION_TYPES = {
  COMPLIANCE_UPDATE: 'compliance_update',
  LICENSE_EXPIRY: 'license_expiry',
  REGULATORY_CHANGE: 'regulatory_change',
  GDPR_UPDATE: 'gdpr_update',
  HIPAA_UPDATE: 'hipaa_update',
  REGIONAL_RESTRICTION: 'regional_restriction',
  CREDENTIAL_VERIFICATION: 'credential_verification',
  DATA_BREACH: 'data_breach',
  PRIVACY_POLICY_UPDATE: 'privacy_policy_update',
  TERMS_UPDATE: 'terms_update',
  TIMEZONE_CONFLICT: 'timezone_conflict',
  AGE_VERIFICATION: 'age_verification',
  SYSTEM: 'system'
};

// Define notification priorities
export const NOTIFICATION_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

// Async thunk for fetching notifications
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async (_, { getState }) => {
    // In a real application, this would be an API call
    // For this demo, we'll simulate an API response
    const { userRegion } = getState().compliance;

    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate some mock notifications based on user's region
    return generateMockNotifications(userRegion);
  }
);

// Async thunk for marking a notification as read
export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId, { getState }) => {
    // In a real application, this would be an API call

    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));

    return notificationId;
  }
);

// Async thunk for dismissing a notification
export const dismissNotification = createAsyncThunk(
  'notifications/dismiss',
  async (notificationId, { getState }) => {
    // In a real application, this would be an API call

    // Simulate network request
    await new Promise(resolve => setTimeout(resolve, 500));

    return notificationId;
  }
);

// Helper function to generate mock notifications
const generateMockNotifications = (userRegion) => {
  const now = new Date();
  const notifications = [];

  // Always add a system notification
  notifications.push({
    id: 'not-1',
    type: NOTIFICATION_TYPES.SYSTEM,
    title: 'Welcome to Expert Connect',
    message: 'Thank you for using our platform! We\'ve updated our compliance system to better serve you.',
    timestamp: new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString(),
    read: false,
    dismissed: false,
    priority: NOTIFICATION_PRIORITIES.LOW,
    actionRequired: false,
    region: 'global',
    link: '/compliance'
  });

  // Add region-specific notifications
  if (userRegion === 'US') {
    notifications.push({
      id: 'not-us-1',
      type: NOTIFICATION_TYPES.HIPAA_UPDATE,
      title: 'HIPAA Compliance Update',
      message: 'New HIPAA guidance has been released for telemedicine consultations. Please review the updated requirements.',
      timestamp: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      read: false,
      dismissed: false,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      actionRequired: true,
      region: 'US',
      link: '/compliance/hipaa'
    });
  }

  if (userRegion === 'EU' || userRegion === 'DE' || userRegion === 'FR' || userRegion === 'ES' || userRegion === 'IT') {
    notifications.push({
      id: 'not-eu-1',
      type: NOTIFICATION_TYPES.GDPR_UPDATE,
      title: 'GDPR Cookie Requirements Updated',
      message: 'The EU has released new guidance on cookie consent mechanisms. Our platform has been updated to comply.',
      timestamp: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      read: false,
      dismissed: false,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      actionRequired: false,
      region: 'EU',
      link: '/compliance/gdpr'
    });
  }

  if (userRegion === 'UK') {
    notifications.push({
      id: 'not-uk-1',
      type: NOTIFICATION_TYPES.REGULATORY_CHANGE,
      title: 'UK Data Protection Update',
      message: 'Post-Brexit data protection regulations have been updated. Please review how this affects cross-border consultations.',
      timestamp: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      read: false,
      dismissed: false,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      actionRequired: true,
      region: 'UK',
      link: '/compliance/uk-regulations'
    });
  }

  if (userRegion === 'CA') {
    notifications.push({
      id: 'not-ca-1',
      type: NOTIFICATION_TYPES.REGULATORY_CHANGE,
      title: 'Canadian PIPEDA Updates',
      message: 'New PIPEDA compliance requirements are in effect for professional consulting services.',
      timestamp: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      dismissed: false,
      priority: NOTIFICATION_PRIORITIES.MEDIUM,
      actionRequired: false,
      region: 'CA',
      link: '/compliance/pipeda'
    });
  }

  // Add timezone notifications for all regions
  notifications.push({
    id: 'not-tz-1',
    type: NOTIFICATION_TYPES.TIMEZONE_CONFLICT,
    title: 'Cross-Region Time Zone Compliance',
    message: 'We\'ve enhanced our time zone detection to ensure compliance with business hours regulations across regions.',
    timestamp: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    dismissed: false,
    priority: NOTIFICATION_PRIORITIES.LOW,
    actionRequired: false,
    region: 'global',
    link: '/time-zone-demo'
  });

  return notifications;
};

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  highPriorityCount: 0,
  loading: false,
  error: null,
  lastFetched: null
};

// Create the notifications slice
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    clearAllNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
      state.highPriorityCount = 0;
    },

    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);

      // Update counters
      if (!action.payload.read) {
        state.unreadCount += 1;
      }

      if (action.payload.priority === NOTIFICATION_PRIORITIES.HIGH ||
          action.payload.priority === NOTIFICATION_PRIORITIES.CRITICAL) {
        state.highPriorityCount += 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.notifications = action.payload;
        state.loading = false;
        state.lastFetched = new Date().toISOString();

        // Calculate unread and high priority counts
        state.unreadCount = action.payload.filter(n => !n.read).length;
        state.highPriorityCount = action.payload.filter(n =>
          (n.priority === NOTIFICATION_PRIORITIES.HIGH ||
           n.priority === NOTIFICATION_PRIORITIES.CRITICAL) &&
          !n.dismissed
        ).length;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      // Mark as read
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification && !notification.read) {
          notification.read = true;
          state.unreadCount -= 1;
        }
      })

      // Dismiss notification
      .addCase(dismissNotification.fulfilled, (state, action) => {
        const notification = state.notifications.find(n => n.id === action.payload);
        if (notification) {
          notification.dismissed = true;

          // Update high priority count if needed
          if ((notification.priority === NOTIFICATION_PRIORITIES.HIGH ||
               notification.priority === NOTIFICATION_PRIORITIES.CRITICAL) &&
              !notification.dismissed) {
            state.highPriorityCount -= 1;
          }
        }
      });
  }
});

// Export actions
export const { clearAllNotifications, addNotification } = notificationsSlice.actions;

// Export selectors
export const selectAllNotifications = state => state.notifications.notifications;
export const selectUnreadNotifications = state => state.notifications.notifications.filter(n => !n.read);
export const selectUnreadCount = state => state.notifications.unreadCount;
export const selectHighPriorityCount = state => state.notifications.highPriorityCount;
export const selectIsLoading = state => state.notifications.loading;
export const selectError = state => state.notifications.error;

// Export the reducer
export default notificationsSlice.reducer;
