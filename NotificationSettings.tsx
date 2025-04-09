import React, { useEffect, useState } from 'react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPushNotifications,
  unsubscribeFromPushNotifications,
  showNotification,
} from '@/lib/notification/notificationService';

// Helper to convert PermissionStatus to a friendlier string
const permissionStatusText = (status: NotificationPermission): string => {
  switch (status) {
    case 'granted':
      return 'Allowed';
    case 'denied':
      return 'Blocked';
    case 'default':
      return 'Not decided';
    default:
      return 'Unknown';
  }
};

const NotificationSettings: React.FC = () => {
  const [supported, setSupported] = useState<boolean>(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [vapidPublicKey, setVapidPublicKey] = useState<string | null>(null);

  // Check if notifications are supported and get current permission on mount
  useEffect(() => {
    const isSupported = isNotificationSupported();
    setSupported(isSupported);

    if (isSupported) {
      setPermission(getNotificationPermission());

      // Check for existing push subscription
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.pushManager.getSubscription().then((sub) => {
            setSubscription(sub);
          });
        });
      }
    }
  }, []);

  // Handle requesting notification permission
  const handleRequestPermission = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await requestNotificationPermission();
      setPermission(result);

      if (result === 'granted') {
        // Request was successful, subscribe to push notifications
        await handleSubscribe();
      }
    } catch (err) {
      setError('Error requesting notification permission');
      console.error('Error requesting permission:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle subscribing to push notifications
  const handleSubscribe = async () => {
    if (!supported || permission !== 'granted') {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Get the service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Get or fetch the VAPID public key
      let publicKey = vapidPublicKey;
      if (!publicKey) {
        // In a real app, you would fetch this from your server
        // For demo, we'll use a hardcoded key (same as the one in the API)
        publicKey = 'BHANIRjnLRGxmrLwQW8VN-OYxQ6sgtIYqXMg27HsxjGVXqc-QsA9i5_iW_T2_Y9T-_v4OYp9wKxP_D-wjJxuXSY';
        setVapidPublicKey(publicKey);
      }

      // Subscribe to push notifications
      const newSubscription = await subscribeToPushNotifications(registration, publicKey);
      setSubscription(newSubscription);

      // Show a test notification
      showNotification('Notifications Enabled', {
        body: 'You will now receive notifications from the Instructor Chat System.',
        icon: '/icons/icon-192x192.png',
      });
    } catch (err) {
      setError('Error subscribing to push notifications');
      console.error('Error subscribing:', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle unsubscribing from push notifications
  const handleUnsubscribe = async () => {
    if (!subscription) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const registration = await navigator.serviceWorker.ready;
      const success = await unsubscribeFromPushNotifications(registration);

      if (success) {
        setSubscription(null);
      } else {
        setError('Failed to unsubscribe from push notifications');
      }
    } catch (err) {
      setError('Error unsubscribing from push notifications');
      console.error('Error unsubscribing:', err);
    } finally {
      setLoading(false);
    }
  };

  // Send a test notification
  const handleSendTestNotification = () => {
    showNotification('Test Notification', {
      body: 'This is a test notification from the Instructor Chat System.',
      icon: '/icons/icon-192x192.png',
    });
  };

  if (!supported) {
    return (
      <div className="notification-settings">
        <div className="notification-status not-supported">
          <h3>Push Notifications</h3>
          <p>Your browser does not support push notifications.</p>
        </div>

        <style jsx>{`
          .notification-settings {
            padding: 1.5rem;
            background-color: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          .notification-status {
            text-align: center;
          }

          .not-supported {
            color: #718096;
          }

          h3 {
            margin-top: 0;
            margin-bottom: 1rem;
            font-size: 1.25rem;
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className="notification-settings">
      <h3>Push Notifications</h3>

      <div className="notification-status">
        <div className={`status-badge ${permission}`}>
          {permissionStatusText(permission)}
        </div>
        <p className="status-text">
          {permission === 'granted' ?
            'You will receive notifications from this app.' :
            permission === 'denied' ?
              'Notifications are blocked. Please update your browser settings to allow notifications.' :
              'Enable notifications to receive updates from this app.'}
        </p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="action-buttons">
        {permission === 'default' && (
          <button
            className="primary-button"
            onClick={handleRequestPermission}
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Enable Notifications'}
          </button>
        )}

        {permission === 'granted' && (
          <>
            {subscription ? (
              <>
                <button
                  className="secondary-button"
                  onClick={handleSendTestNotification}
                  disabled={loading}
                >
                  Send Test Notification
                </button>
                <button
                  className="danger-button"
                  onClick={handleUnsubscribe}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Disable Notifications'}
                </button>
              </>
            ) : (
              <button
                className="primary-button"
                onClick={handleSubscribe}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Subscribe to Notifications'}
              </button>
            )}
          </>
        )}
      </div>

      <style jsx>{`
        .notification-settings {
          padding: 1.5rem;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        h3 {
          margin-top: 0;
          margin-bottom: 1.5rem;
          font-size: 1.25rem;
          color: #2c3e50;
        }

        .notification-status {
          margin-bottom: 1.5rem;
          text-align: center;
        }

        .status-badge {
          display: inline-block;
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          margin-bottom: 0.75rem;
        }

        .status-badge.granted {
          background-color: #48bb78;
          color: white;
        }

        .status-badge.denied {
          background-color: #f56565;
          color: white;
        }

        .status-badge.default {
          background-color: #edf2f7;
          color: #4a5568;
        }

        .status-text {
          color: #4a5568;
          margin: 0;
        }

        .error-message {
          margin: 1rem 0;
          padding: 0.75rem;
          background-color: #fed7d7;
          color: #c53030;
          border-radius: 4px;
          font-size: 0.875rem;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        button {
          padding: 0.75rem 1rem;
          border-radius: 4px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .primary-button {
          background-color: #2c3e50;
          color: white;
          border: none;
        }

        .primary-button:hover:not(:disabled) {
          background-color: #1a202c;
        }

        .secondary-button {
          background-color: #e2e8f0;
          color: #4a5568;
          border: none;
        }

        .secondary-button:hover:not(:disabled) {
          background-color: #cbd5e0;
        }

        .danger-button {
          background-color: white;
          color: #e53e3e;
          border: 1px solid #e53e3e;
        }

        .danger-button:hover:not(:disabled) {
          background-color: #fff5f5;
        }
      `}</style>
    </div>
  );
};

export default NotificationSettings;
