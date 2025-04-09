import { NextApiRequest, NextApiResponse } from 'next';
import webpush from 'web-push';

// VAPID keys should be generated only once and stored securely
// For demo purposes, we're generating them here
// In a real app, these should be in environment variables
const vapidKeys = webpush.generateVAPIDKeys();

// Configure web-push with our VAPID keys
webpush.setVapidDetails(
  'mailto:example@example.com', // Change this to your email
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Return the public key to the client
  return res.status(200).json({ publicKey: vapidKeys.publicKey });
}
