import React, { useState, useEffect } from 'react';
import { toggleOfflineMode, getOfflineMode, syncPendingTranslations } from '../i18n/TranslationService';
import { clearServiceWorkerCache } from '../serviceWorkerRegistration';
import {
  initializeNotifications,
  requestNotificationPermission,
  isNotificationSupported,
  checkNotificationPermission,
  showNotification
} from '../notifications/NotificationManager';
import './OfflineManager.css';

/**
 * OfflineManager Component
 *
 * Provides UI for managing offline mode and cache
 * Automatically detects network status changes
 */
const OfflineManager = () => {
  const [isOffline, setIsOffline] = useState(false);
  const [networkStatus, setNetworkStatus] = useState(navigator.onLine);
  const [cacheStats, setCacheStats] = useState({
    translationCount: 0,
    lastUpdated: null
  });
  const [isManualMode, setIsManualMode] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [pendingTranslations, setPendingTranslations] = useState(0);

  // Initialize offline state and notifications
  useEffect(() => {
    const offlineMode = getOfflineMode();
    setIsOffline(offlineMode);
    setIsManualMode(offlineMode !== !navigator.onLine);

    // Setup event listeners for online/offline events
    const handleOnline = () => {
      setNetworkStatus(true);

      // If not in manual mode, automatically disable offline mode
      if (!isManualMode) {
        setIsOffline(false);
        toggleOfflineMode(false);

        showStatusNotification('You are back online! Automatic translations enabled.');
      }
    };

    const handleOffline = () => {
      setNetworkStatus(false);

      // If not in manual mode, automatically enable offline mode
      if (!isManualMode) {
        setIsOffline(true);
        toggleOfflineMode(true);

        showStatusNotification('Network connection lost. Offline mode enabled.');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load cache statistics
    loadCacheStats();

    // Initialize notifications
    initializeNotifications().then(permission => {
      setNotificationPermission(permission);
    });

    // Load pending translations
    loadPendingTranslations();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isManualMode]);

  // Load translation cache statistics from localStorage
  const loadCacheStats = () => {
    try {
      // Calculate translations in memory
      const cacheKeys = JSON.parse(localStorage.getItem('translationCacheKeys') || '[]');
      const lastUpdated = localStorage.getItem('translationCacheLastUpdated');

      setCacheStats({
        translationCount: cacheKeys.length,
        lastUpdated: lastUpdated ? new Date(parseInt(lastUpdated)) : null
      });
    } catch (error) {
      console.error('Failed to load cache statistics:', error);
    }
  };

  // Load pending translations count
  const loadPendingTranslations = () => {
    try {
      const pendingTranslations = JSON.parse(localStorage.getItem('pendingTranslations') || '[]');
      setPendingTranslations(pendingTranslations.length);
    } catch (error) {
      console.error('Failed to load pending translations:', error);
    }
  };

  // Toggle offline mode manually
  const handleToggleOfflineMode = () => {
    const newOfflineState = !isOffline;
    setIsOffline(newOfflineState);
    setIsManualMode(true);
    toggleOfflineMode(newOfflineState);

    showStatusNotification(
      newOfflineState
        ? 'Offline mode enabled. Using cached translations only.'
        : 'Online mode enabled. Using live translations.'
    );
  };

  // Clear translation cache
  const handleClearCache = async () => {
    try {
      // Clear browser cache through service worker
      await clearServiceWorkerCache();

      // Clear localStorage cache entries
      const cacheKeys = JSON.parse(localStorage.getItem('translationCacheKeys') || '[]');
      cacheKeys.forEach(key => {
        localStorage.removeItem(`translation_${key}`);
      });
      localStorage.removeItem('translationCacheKeys');

      // Reload cache stats
      loadCacheStats();

      showStatusNotification('Translation cache cleared successfully.');
    } catch (error) {
      console.error('Failed to clear cache:', error);
      showStatusNotification('Failed to clear cache. Please try again.');
    }
  };

  // Auto sync translations when back online
  const handleSync = () => {
    if (!networkStatus) {
      showStatusNotification('Cannot sync while offline. Please connect to a network first.');
      return;
    }

    // Request sync through service worker
    syncPendingTranslations()
      .then(success => {
        if (success) {
          showStatusNotification('Translations synchronized successfully.');
          loadPendingTranslations(); // Refresh pending translations count
        } else {
          showStatusNotification('Some translations failed to sync. Please try again later.');
        }
      })
      .catch(error => {
        console.error('Sync failed:', error);
        showStatusNotification('Sync failed. Please try again later.');
      });
  };

  // Request notification permission
  const handleRequestNotificationPermission = async () => {
    const permission = await requestNotificationPermission();
    setNotificationPermission(permission);

    if (permission === 'granted') {
      showStatusNotification('Notification permission granted.');
    } else {
      showStatusNotification('Notification permission denied. You won\'t receive offline sync notifications.');
    }
  };

  // Helper to show status notifications
  const showStatusNotification = (message) => {
    setNotificationMessage(message);
    setShowNotification(true);

    // Auto-hide after 3 seconds
    setTimeout(() => {
      setShowNotification(false);
    }, 3000);
  };

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'Never';

    return date.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="offline-manager">
      <div className="offline-header">
        <h3>Offline Mode Manager</h3>
        <div className={`network-status ${networkStatus ? 'online' : 'offline'}`}>
          {networkStatus ? 'Online' : 'Offline'}
        </div>
      </div>

      <div className="offline-controls">
        <div className="offline-toggle">
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={isOffline}
              onChange={handleToggleOfflineMode}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-label">
            {isOffline ? 'Offline Mode Active' : 'Online Mode Active'}
          </span>
          {isManualMode && (
            <span className="manual-indicator">Manual</span>
          )}
        </div>

        <div className="cache-stats">
          <div className="stat-item">
            <span className="stat-label">Cached Translations:</span>
            <span className="stat-value">{cacheStats.translationCount}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Last Updated:</span>
            <span className="stat-value">{formatDate(cacheStats.lastUpdated)}</span>
          </div>
          {pendingTranslations > 0 && (
            <div className="stat-item pending">
              <span className="stat-label">Pending Translations:</span>
              <span className="stat-value pending">{pendingTranslations}</span>
            </div>
          )}
        </div>

        <div className="notification-permission">
          <div className="permission-status">
            <span className="permission-label">Notifications:</span>
            <span className={`permission-value ${notificationPermission}`}>
              {notificationPermission === 'granted' ? 'Enabled' :
               notificationPermission === 'denied' ? 'Blocked' : 'Not enabled'}
            </span>
          </div>

          {isNotificationSupported() && notificationPermission !== 'granted' && (
            <button
              className="permission-btn"
              onClick={handleRequestNotificationPermission}
            >
              {notificationPermission === 'denied'
                ? 'Notification permissions blocked in browser settings'
                : 'Enable Notifications'}
            </button>
          )}

          {!isNotificationSupported() && (
            <div className="not-supported">
              Your browser doesn't support notifications
            </div>
          )}
        </div>

        <div className="action-buttons">
          <button
            className="clear-cache-btn"
            onClick={handleClearCache}
          >
            Clear Cache
          </button>

          <button
            className="sync-btn"
            onClick={handleSync}
            disabled={!networkStatus || pendingTranslations === 0}
          >
            {pendingTranslations > 0
              ? `Sync ${pendingTranslations} Translations`
              : 'No Pending Translations'}
          </button>
        </div>
      </div>

      {showNotification && (
        <div className="status-notification">
          {notificationMessage}
        </div>
      )}
    </div>
  );
};

export default OfflineManager;
