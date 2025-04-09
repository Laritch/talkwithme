// Notification Service for Web Push API Integration

// Check if browser supports notifications
export const checkNotificationSupport = (): boolean => {
  return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<string> => {
  if (!checkNotificationSupport()) {
    throw new Error('Notifications are not supported in this browser');
  }

  const permission = await Notification.requestPermission();
  return permission;
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (): Promise<PushSubscription | null> => {
  try {
    if (!checkNotificationSupport()) {
      console.warn('Push notifications not supported');
      return null;
    }

    const permission = await requestNotificationPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // Get the service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Get the push subscription
    let subscription = await registration.pushManager.getSubscription();

    // If no subscription exists, create one
    if (!subscription) {
      // Get public key from the server
      const response = await fetch('/api/notifications/publicKey');
      const { publicKey } = await response.json();

      // Convert public key to Uint8Array
      const applicationServerKey = urlBase64ToUint8Array(publicKey);

      // Create a new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey
      });

      // Send the subscription to the server
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription }),
      });
    }

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    return null;
  }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  try {
    if (!checkNotificationSupport()) {
      return false;
    }

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      return true;
    }

    // Unsubscribe from push manager
    const success = await subscription.unsubscribe();

    if (success) {
      // Remove subscription from the server
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint: subscription.endpoint }),
      });
    }

    return success;
  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    return false;
  }
};

// Display a notification
export const showNotification = async (
  title: string,
  options: NotificationOptions = {}
): Promise<void> => {
  try {
    if (!checkNotificationSupport()) {
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    // Set default notification options
    const defaultOptions: NotificationOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      tag: 'ins-cht-sys-notification',
      renotify: true,
      data: {
        dateOfArrival: Date.now(),
      },
      actions: [
        {
          action: 'open',
          title: 'Open',
        },
        {
          action: 'close',
          title: 'Close',
        },
      ],
    };

    await registration.showNotification(title, { ...defaultOptions, ...options });
  } catch (error) {
    console.error('Error showing notification:', error);
  }
};

// Helper function to convert base64 to Uint8Array
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
};
