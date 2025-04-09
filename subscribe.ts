import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// In a real app, you would use a database to store subscriptions
// For demo purposes, we'll use a JSON file
const SUBSCRIPTIONS_FILE = path.resolve(process.cwd(), 'subscriptions.json');

// Helper to ensure the subscriptions file exists
const ensureSubscriptionsFile = () => {
  if (!fs.existsSync(SUBSCRIPTIONS_FILE)) {
    fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify([]));
  }
};

// Helper to read subscriptions
const readSubscriptions = () => {
  ensureSubscriptionsFile();
  const data = fs.readFileSync(SUBSCRIPTIONS_FILE, 'utf8');
  return JSON.parse(data);
};

// Helper to write subscriptions
const writeSubscriptions = (subscriptions: any[]) => {
  ensureSubscriptionsFile();
  fs.writeFileSync(SUBSCRIPTIONS_FILE, JSON.stringify(subscriptions, null, 2));
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: 'Invalid subscription data' });
    }

    // Read current subscriptions
    const subscriptions = readSubscriptions();

    // Check if subscription already exists
    const exists = subscriptions.some(sub =>
      sub.endpoint === subscription.endpoint
    );

    if (!exists) {
      // Add new subscription
      subscriptions.push(subscription);
      writeSubscriptions(subscriptions);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Subscription error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
