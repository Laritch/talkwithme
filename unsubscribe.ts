import { NextApiRequest, NextApiResponse } from 'next';
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
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({ error: 'Invalid unsubscription data' });
    }

    // Read current subscriptions
    const subscriptions = readSubscriptions();

    // Filter out the subscription to remove
    const updatedSubscriptions = subscriptions.filter(
      sub => sub.endpoint !== endpoint
    );

    // Update the subscriptions file
    writeSubscriptions(updatedSubscriptions);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Unsubscription error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
