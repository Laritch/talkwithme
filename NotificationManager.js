/**
 * NotificationManager
 *
 * Handles browser notifications for the translation application,
 * including permission requests, creating notifications, and tracking notification state.
 */

// Check if browser supports notifications
const isNotificationSupported = () => {
  return 'Notification' in window;
};

// Check if notifications are permitted
const checkNotificationPermission = () => {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
};

// Request notification permission
const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.warn('Browser does not support notifications');
    return 'denied';
  }

  if (Notification.permission === 'granted') {
    return 'granted';
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  return Notification.permission;
};

// Show browser notification
const showNotification = (title, options = {}) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    console.warn('Notifications not supported or permission not granted');
    return null;
  }

  try {
    // Default options
    const defaultOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: false,
      silent: false
    };

    // Merge with provided options
    const mergedOptions = { ...defaultOptions, ...options };

    // Create and return notification
    const notification = new Notification(title, mergedOptions);

    // Add default event listeners
    notification.onclick = mergedOptions.onClick || (() => {
      window.focus();
      notification.close();
    });

    notification.onclose = mergedOptions.onClose || (() => {
      console.log('Notification closed');
    });

    notification.onerror = mergedOptions.onError || ((error) => {
      console.error('Notification error:', error);
    });

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
};

// Show translation sync notification
const showTranslationSyncNotification = (count) => {
  return showNotification('Translation Sync Complete', {
    body: `${count} translation${count !== 1 ? 's' : ''} synchronized successfully.`,
    icon: '/favicon.ico',
    requireInteraction: false,
    data: {
      type: 'translation_sync',
      count,
      timestamp: new Date().toISOString()
    },
    onClick: () => {
      window.focus();
      // Navigate to history page if applicable
      if (window.location.pathname !== '/history') {
        // Use URL params to signal we're coming from a notification
        window.location.href = '/?action=history&source=notification';
      }
    }
  });
};

// Show offline mode notification
const showOfflineModeNotification = (isOffline) => {
  if (isOffline) {
    return showNotification('Offline Mode Activated', {
      body: 'You are now working offline. Changes will be synchronized when you reconnect.',
      icon: '/favicon.ico',
      requireInteraction: false,
      data: {
        type: 'offline_mode',
        status: 'active',
        timestamp: new Date().toISOString()
      }
    });
  } else {
    return showNotification('Back Online', {
      body: 'You are now back online. Your changes will be synchronized.',
      icon: '/favicon.ico',
      requireInteraction: false,
      data: {
        type: 'offline_mode',
        status: 'inactive',
        timestamp: new Date().toISOString()
      },
      onClick: () => {
        window.focus();
        // Trigger sync if service worker is active
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.ready.then(registration => {
            if ('sync' in registration) {
              registration.sync.register('sync-translations');
            }
          });
        }
      }
    });
  }
};

// Show translation error notification
const showTranslationErrorNotification = (errorMessage) => {
  return showNotification('Translation Error', {
    body: errorMessage || 'An error occurred during translation.',
    icon: '/favicon.ico',
    requireInteraction: true,
    data: {
      type: 'translation_error',
      timestamp: new Date().toISOString()
    }
  });
};

// Show document translation complete notification
const showDocumentTranslationNotification = (documentName) => {
  return showNotification('Document Translation Complete', {
    body: `Translation of "${documentName}" is complete and ready for download.`,
    icon: '/favicon.ico',
    requireInteraction: true,
    data: {
      type: 'document_translation',
      documentName,
      timestamp: new Date().toISOString()
    }
  });
};

// Check if notification is supported and request permission if needed
const initializeNotifications = async () => {
  if (isNotificationSupported()) {
    if (Notification.permission === 'default') {
      await requestNotificationPermission();
    }

    return Notification.permission;
  }

  return 'denied';
};

// Export notification functions
export {
  isNotificationSupported,
  checkNotificationPermission,
  requestNotificationPermission,
  showNotification,
  showTranslationSyncNotification,
  showOfflineModeNotification,
  showTranslationErrorNotification,
  showDocumentTranslationNotification,
  initializeNotifications
};
