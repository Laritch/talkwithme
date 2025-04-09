import React, { useState, useEffect } from 'react';
import { getOfflineMode, toggleOfflineMode } from '../i18n/TranslationService';
import './OfflineIndicator.css';

/**
 * OfflineIndicator Component
 *
 * Displays the current online/offline status and allows users to manually
 * switch to offline mode to save data or work without an internet connection.
 */
const OfflineIndicator = () => {
  // Track offline mode and network status
  const [isOfflineMode, setIsOfflineMode] = useState(getOfflineMode());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showDetails, setShowDetails] = useState(false);

  // Update state when offline mode changes
  const handleToggleOfflineMode = () => {
    const newOfflineState = toggleOfflineMode();
    setIsOfflineMode(newOfflineState);
  };

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Keep track of offline mode changes
    const checkOfflineMode = () => {
      const currentOfflineMode = getOfflineMode();
      if (currentOfflineMode !== isOfflineMode) {
        setIsOfflineMode(currentOfflineMode);
      }
    };

    // Check periodically (in case it was changed from another component)
    const intervalId = setInterval(checkOfflineMode, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [isOfflineMode]);

  return (
    <div
      className={`offline-indicator ${!isOnline || isOfflineMode ? 'active' : ''}`}
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="status-icon">
        {!isOnline ? '📶' : isOfflineMode ? '📴' : '🌐'}
      </div>

      <div className="status-text">
        {!isOnline
          ? 'No Connection'
          : isOfflineMode
            ? 'Offline Mode'
            : 'Online'}
      </div>

      {showDetails && (
        <div className="offline-details">
          <div className="details-content">
            <p className="details-status">
              <strong>Network Status:</strong> {isOnline ? 'Connected' : 'Disconnected'}
            </p>
            <p className="details-mode">
              <strong>Offline Mode:</strong> {isOfflineMode ? 'Enabled' : 'Disabled'}
            </p>
            <p className="details-description">
              {isOfflineMode
                ? 'When offline mode is enabled, translations will use cached results only.'
                : 'Enable offline mode to work without an internet connection.'}
            </p>

            {isOnline && (
              <button
                className="toggle-offline-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  handleToggleOfflineMode();
                }}
              >
                {isOfflineMode ? 'Disable Offline Mode' : 'Enable Offline Mode'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;
