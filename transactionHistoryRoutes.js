import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/transactions
 * @desc Get user's transaction history
 * @access Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, type } = req.query;

    // Here you would normally fetch transactions from a database
    // For demonstration, we'll return mock transactions

    // Generate some mock transactions
    const transactions = [];
    for (let i = 0; i < 20; i++) {
      // Random status: completed, pending, or failed
      const statuses = ['completed', 'pending', 'failed', 'refunded'];
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

      // Random type: payment, refund, or subscription
      const types = ['payment', 'refund', 'subscription'];
      const randomType = types[Math.floor(Math.random() * types.length)];

      // Random processor: stripe, paypal, or mpesa
      const processors = ['stripe', 'paypal', 'mpesa'];
      const randomProcessor = processors[Math.floor(Math.random() * processors.length)];

      // Random amount between 10 and 1000
      const randomAmount = parseFloat((Math.random() * 990 + 10).toFixed(2));

      // Random date within the last month
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));

      transactions.push({
        id: `txn_${Date.now() - i * 1000}_${Math.floor(Math.random() * 10000)}`,
        amount: randomAmount,
        currency: 'USD',
        processor: randomProcessor,
        paymentMethod: randomProcessor === 'mpesa' ? 'mobile_money' : 'card',
        status: randomStatus,
        type: randomType,
        description: `${randomType === 'refund' ? 'Refund for' : 'Payment for'} service #${1000 + i}`,
        date: randomDate.toISOString()
      });
    }

    // Filter transactions based on query parameters
    let filteredTransactions = [...transactions];

    if (status) {
      filteredTransactions = filteredTransactions.filter(t => t.status === status);
    }

    if (type) {
      filteredTransactions = filteredTransactions.filter(t => t.type === type);
    }

    // Sort transactions by date (newest first)
    filteredTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Paginate transactions
    const startIndex = (parseInt(page) - 1) * parseInt(limit);
    const endIndex = startIndex + parseInt(limit);
    const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

    res.json({
      success: true,
      transactions: paginatedTransactions,
      pagination: {
        total: filteredTransactions.length,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(filteredTransactions.length / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transactions',
      error: error.message
    });
  }
});

/**
 * @route GET /api/transactions/:id
 * @desc Get specific transaction details
 * @access Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    // Here you would normally fetch the transaction from a database
    // For demonstration, we'll return a mock transaction

    // Generate a random transaction for the provided ID
    const statuses = ['completed', 'pending', 'failed', 'refunded'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    const types = ['payment', 'refund', 'subscription'];
    const randomType = types[Math.floor(Math.random() * types.length)];

    const processors = ['stripe', 'paypal', 'mpesa'];
    const randomProcessor = processors[Math.floor(Math.random() * processors.length)];

    const randomAmount = parseFloat((Math.random() * 990 + 10).toFixed(2));

    // Generate a date within the last month
    const randomDate = new Date();
    randomDate.setDate(randomDate.getDate() - Math.floor(Math.random() * 30));

    const transaction = {
      id,
      amount: randomAmount,
      currency: 'USD',
      processor: randomProcessor,
      paymentMethod: randomProcessor === 'mpesa' ? 'mobile_money' : 'card',
      status: randomStatus,
      type: randomType,
      description: `${randomType === 'refund' ? 'Refund for' : 'Payment for'} service`,
      date: randomDate.toISOString(),
      // Additional details for a specific transaction
      receiptUrl: `https://example.com/receipts/${id}`,
      metadata: {
        customerId: `cust_${Math.floor(Math.random() * 100000)}`,
        orderId: `ord_${Math.floor(Math.random() * 100000)}`
      }
    };

    res.json({
      success: true,
      transaction
    });
  } catch (error) {
    console.error('Error fetching transaction details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction details',
      error: error.message
    });
  }
});

export default router;
