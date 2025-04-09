import express from 'express';
import dotenv from 'dotenv';
import { stripeWebhooks } from '../webhooks/stripeWebhooks.js';

dotenv.config();

const router = express.Router();

/**
 * @route POST /api/webhooks/stripe
 * @desc Handle Stripe webhook events
 * @access Public (Stripe signs requests)
 */
router.post('/', async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];

    if (!sig) {
      return res.status(400).json({ message: 'Stripe signature missing' });
    }

    // The stripeWebhooks function will verify the signature and process the event
    const response = await stripeWebhooks.handleWebhook(req.rawBody, sig);

    res.json(response);
  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;
