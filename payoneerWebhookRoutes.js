/**
 * Payoneer Webhook Routes
 *
 * Handles incoming webhook requests from Payoneer:
 * - Validates request signatures
 * - Processes events
 * - Returns appropriate responses
 */

import express from 'express';
import payoneerWebhooks from './payoneerWebhooks.js';
import webhookHandler from '../webhookHandler.js';

const router = express.Router();

/**
 * @route POST /api/webhooks/payoneer
 * @desc Process Payoneer webhook events
 * @access Public
 */
router.post('/', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    // Get the raw request body for signature verification
    const rawBody = req.body.toString('utf8');

    // Validate webhook signature
    if (!payoneerWebhooks.verifySignature(req.headers, rawBody)) {
      console.error('Invalid Payoneer webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Parse the webhook payload
    const webhookData = JSON.parse(rawBody);

    // Log the incoming webhook (for debugging or audit)
    console.log(`Received Payoneer webhook: ${webhookData.event_type}`);

    // Process the webhook event
    const result = await payoneerWebhooks.processWebhook(webhookData);

    // Notify the general webhook handler of the processed event
    await webhookHandler.recordWebhookEvent({
      processor: 'payoneer',
      eventType: webhookData.event_type,
      eventId: webhookData.id,
      timestamp: new Date(),
      payload: webhookData,
      processingResult: result
    });

    // Return a 200 response to acknowledge receipt
    res.status(200).json({
      status: 'success',
      message: 'Webhook processed successfully',
      result
    });
  } catch (error) {
    console.error('Error processing Payoneer webhook:', error);

    // Always return a 200 response to prevent Payoneer from retrying
    // But include error details in the response
    res.status(200).json({
      status: 'error',
      message: 'Error processing webhook',
      error: error.message
    });

    // Log the error for internal tracking
    await webhookHandler.recordWebhookError({
      processor: 'payoneer',
      timestamp: new Date(),
      headers: req.headers,
      error: {
        message: error.message,
        stack: error.stack
      }
    }).catch(logError => {
      console.error('Failed to log webhook error:', logError);
    });
  }
});

/**
 * @route GET /api/webhooks/payoneer/health
 * @desc Health check endpoint for Payoneer webhook configuration
 * @access Public
 */
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    processor: 'payoneer',
    timestamp: new Date(),
    environment: process.env.NODE_ENV,
    message: 'Payoneer webhook endpoint is operational'
  });
});

export default router;
