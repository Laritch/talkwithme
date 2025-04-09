import express from 'express';
import dotenv from 'dotenv';
import { paypalWebhooks } from '../webhooks/paypalWebhooks.js';

dotenv.config();

const router = express.Router();

/**
 * @route POST /api/webhooks/paypal
 * @desc Handle PayPal webhook events
 * @access Public (PayPal verifies the request)
 */
router.post('/', async (req, res) => {
  try {
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    const eventType = req.headers['paypal-event-type'];
    const webhookEvent = req.body;

    if (!webhookEvent) {
      return res.status(400).json({ message: 'No webhook data received' });
    }

    // Handle the webhook event
    const response = await paypalWebhooks.handleWebhook(webhookEvent, eventType, webhookId);

    res.json(response);
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;
