import express from 'express';
import dotenv from 'dotenv';
import { telrWebhooks } from '../webhooks/telrWebhooks.js';

dotenv.config();

const router = express.Router();

/**
 * @route POST /api/webhooks/telr
 * @desc Handle Telr webhook events
 * @access Public (Telr verifies the request)
 */
router.post('/', async (req, res) => {
  try {
    const webhookData = req.body;

    if (!webhookData) {
      return res.status(400).json({ message: 'No webhook data received' });
    }

    // Handle the webhook event
    const response = await telrWebhooks.handleWebhook(webhookData);

    res.json(response);
  } catch (error) {
    console.error('Telr webhook error:', error);
    res.status(400).json({ message: error.message });
  }
});

export default router;
