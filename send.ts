import type { NextApiRequest, NextApiResponse } from 'next';
import webpush from 'web-push';

// Use the same VAPID keys as in the subscribe endpoint
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BHANIRjnLRGxmrLwQW8VN-OYxQ6sgtIYqXMg27HsxjGVXqc-QsA9i5_iW_T2_Y9T-_v4OYp9wKxP_D-wjJxuXSY';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || 'uNaAzYEYjChyNfRf_KBjX_P-_OsDxIhPVWqrWNTqpLk';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:contact@example.com';

// Initialize web-push with our VAPID keys
webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// In a real app, you would store subscriptions in a database
// Here we'll just use a simple Map to simulate storage
// This should be shared with the subscribe endpoint in a real app
// But for demo purposes, we'll just initialize it here
const subscriptions = new Map<string, any>();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests for sending notifications
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // This would be protected by authentication in a real app
  // For demonstration, we'll allow all requests
  try {
    const {
      title,
      body,
      icon = '/icons/icon-192x192.png',
      badge = '/icons/icon-72x72.png',
      tag,
      data,
      actions,
      userId
    } = req.body;

    if (!title || !body) {
      return res.status(400).json({ error: 'Missing required notification content' });
    }

    const payload = JSON.stringify({
      notification: {
        title,
        body,
        icon,
        badge,
        tag,
        data,
        actions,
        vibrate: [100, 50, 100],
        requireInteraction: true,
      }
    });

    // In a real app, you would query your database for subscriptions
    // For demonstration, we'll pretend we found a subscription
    const demoSubscription = {
      endpoint: 'https://fcm.googleapis.com/fcm/send/demo-subscription',
      expirationTime: null,
      keys: {
        p256dh: 'BNn_zZ-2Dw70Zn9xqfpRa7Z4pKDBx0O-NDF4AeNVzWO1xkENtlj4BxVRw95-nNwK8jx_bvGLCzKKIJTvLZ4p_RI',
        auth: 'demo-auth-secret',
      },
    };

    let successCount = 0;
    let failureCount = 0;

    // In a real app, you would iterate through subscriptions in your database
    // For demonstration, we'll just use our demo subscription
    try {
      // In a production environment, this would actually send the notification
      // For demo purposes, we'll just simulate success

      // Uncomment this in a production environment with real subscribers
      // await webpush.sendNotification(demoSubscription, payload);

      console.log('Notification sent successfully:', {
        title,
        body,
        subscription: 'demo-subscription',
      });

      successCount++;
    } catch (error) {
      console.error('Error sending notification:', error);
      failureCount++;

      // In a real app, you might want to remove invalid subscriptions
      // if (error.statusCode === 410) {
      //   // Gone - subscription is no longer valid
      //   subscriptions.delete(subscriptionId);
      // }
    }

    return res.status(200).json({
      success: true,
      sent: successCount,
      failed: failureCount,
    });
  } catch (error) {
    console.error('Error processing notification request:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
