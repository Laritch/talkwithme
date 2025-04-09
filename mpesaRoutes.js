import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route POST /api/mpesa/initiate
 * @desc Initiate M-Pesa payment
 * @access Private
 */
router.post('/initiate', authMiddleware, async (req, res) => {
  try {
    const { amount, phoneNumber, description } = req.body;

    // Validate required fields
    if (!amount || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'Amount and phone number are required'
      });
    }

    // Here you would normally integrate with the M-Pesa API
    // For demonstration, we'll simulate a successful initiation

    const response = {
      success: true,
      message: 'M-Pesa payment initiated successfully',
      checkoutRequestID: `MCR-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      responseDescription: 'Success. Request accepted for processing'
    };

    res.json(response);
  } catch (error) {
    console.error('M-Pesa initiation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate M-Pesa payment',
      error: error.message
    });
  }
});

/**
 * @route POST /api/mpesa/callback
 * @desc Handle M-Pesa callback
 * @access Public - Called by M-Pesa
 */
router.post('/callback', async (req, res) => {
  try {
    const callbackData = req.body;

    // Log callback data for debugging
    console.log('M-Pesa callback received:', callbackData);

    // Normally process the callback data, update transaction status, etc.
    // For demonstration, we'll just acknowledge receipt

    res.json({
      success: true,
      message: 'Callback received'
    });
  } catch (error) {
    console.error('M-Pesa callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process M-Pesa callback',
      error: error.message
    });
  }
});

/**
 * @route GET /api/mpesa/check-status/:requestId
 * @desc Check status of M-Pesa payment
 * @access Private
 */
router.get('/check-status/:requestId', authMiddleware, async (req, res) => {
  try {
    const { requestId } = req.params;

    // Here you would normally query the M-Pesa API for status
    // For demonstration, we'll simulate a response

    // Random status: completed, pending, or failed
    const statuses = ['completed', 'pending', 'failed'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];

    res.json({
      success: true,
      requestId,
      status,
      message: `Transaction is ${status}`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('M-Pesa status check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check M-Pesa payment status',
      error: error.message
    });
  }
});

export default router;
