/**
 * Test Transaction Data
 *
 * This script generates mock transaction data for testing the transaction history page
 * with various payment processors and transaction types.
 */

// Mock data generation for transaction history testing
const testTransactionData = {
  /**
   * Generate mock transactions with different payment processors
   * @param {number} count - Number of transactions to generate
   * @returns {Array} - Array of transaction objects
   */
  generateMockTransactions(count = 10) {
    const transactions = [];

    const processors = [
      { name: 'stripe', methods: ['card', 'apple', 'google'] },
      { name: 'mpesa', methods: ['mpesa'] },
      { name: 'square', methods: ['card', 'apple', 'google'] },
      { name: 'adyen', methods: ['card', 'paypal', 'apple'] },
      { name: 'razorpay', methods: ['card', 'bank'] }
    ];

    const transactionTypes = ['order', 'subscription'];
    const statuses = ['completed', 'pending', 'failed', 'refunded'];
    const currencies = ['USD', 'EUR', 'GBP', 'KES', 'INR', 'NGN', 'ZAR'];

    // Generate random transactions
    for (let i = 0; i < count; i++) {
      // Pick random processor
      const processor = processors[Math.floor(Math.random() * processors.length)];
      // Pick random method from the processor's supported methods
      const paymentMethod = processor.methods[Math.floor(Math.random() * processor.methods.length)];
      // Random transaction type
      const type = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      // Random status
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      // Random currency
      const currency = currencies[Math.floor(Math.random() * currencies.length)];
      // Random amount between 10 and 200
      const amount = Math.floor(Math.random() * 190) + 10;
      // Random date in the last 60 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 60));

      // Create transaction object
      const transaction = {
        id: `tx_${Math.random().toString(36).substring(2, 10)}`,
        type,
        description: type === 'order'
          ? `Order #${Math.floor(Math.random() * 10000)}`
          : `Subscription Payment: Expert Membership`,
        amount,
        currency,
        status,
        paymentMethod,
        processor: processor.name,
        date: date.toISOString(),
        refunded: status === 'refunded',
        loyaltyPointsEarned: Math.floor(amount * 0.1),
        items: []
      };

      // Add processor-specific details
      if (processor.name === 'mpesa') {
        transaction.processorDetails = {
          mpesaReference: `MPE${Math.floor(Math.random() * 1000000)}`,
          phoneNumber: `+254${Math.floor(Math.random() * 90000000) + 10000000}`
        };
      } else if (processor.name === 'square') {
        transaction.processorDetails = {
          orderId: `sqr_${Math.random().toString(36).substring(2, 10)}`,
          locationId: `L${Math.floor(Math.random() * 100000000)}`
        };
      } else if (processor.name === 'adyen') {
        transaction.processorDetails = {
          pspReference: `PSP${Math.floor(Math.random() * 10000000000)}`,
          merchantReference: `M${Math.floor(Math.random() * 1000000)}`
        };
      } else if (processor.name === 'razorpay') {
        transaction.processorDetails = {
          razorpayId: `rzp_${Math.random().toString(36).substring(2, 10)}`,
          contactId: `cont_${Math.random().toString(36).substring(2, 8)}`
        };
      }

      // Add random items for orders
      if (type === 'order') {
        const itemCount = Math.floor(Math.random() * 3) + 1;
        for (let j = 0; j < itemCount; j++) {
          transaction.items.push({
            id: `item_${Math.random().toString(36).substring(2, 10)}`,
            name: `Expert Session ${Math.floor(Math.random() * 100)}`,
            quantity: Math.floor(Math.random() * 2) + 1,
            price: Math.floor(Math.random() * 50) + 20
          });
        }
      }

      // Add refund details if refunded
      if (status === 'refunded') {
        const refundDate = new Date(date);
        refundDate.setDate(refundDate.getDate() + Math.floor(Math.random() * 5) + 1);

        transaction.refundDetails = {
          refundId: `ref_${Math.random().toString(36).substring(2, 10)}`,
          refundedAt: refundDate.toISOString(),
          reason: ['Customer request', 'Duplicate charge', 'Fraudulent', 'Service unavailable'][Math.floor(Math.random() * 4)]
        };
      }

      transactions.push(transaction);
    }

    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date) - new Date(a.date));

    return transactions;
  },

  /**
   * Insert mock data for testing
   * Warning: This should only be used in development/testing
   */
  insertMockDataForTesting() {
    // Generate 15 random transactions
    const transactions = this.generateMockTransactions(15);

    console.log('Generated mock transactions for testing:', transactions);

    // Mock the API response
    const originalFetch = window.fetch;

    // Override fetch for transaction history API
    window.fetch = function(url, options) {
      if (url.includes('/api/transactions') && !url.includes('/receipt')) {
        // If it's a specific transaction request
        if (url.match(/\/api\/transactions\/[a-zA-Z0-9_]+$/)) {
          const txId = url.split('/').pop();
          const transaction = transactions.find(tx => tx.id === txId);

          if (transaction) {
            return Promise.resolve({
              ok: true,
              json: () => Promise.resolve({
                success: true,
                transaction
              })
            });
          }
        }
        // If it's a transaction list request
        else {
          // Parse query params to handle filtering
          const urlObj = new URL(url, window.location.origin);
          const params = Object.fromEntries(urlObj.searchParams);

          let filteredTransactions = [...transactions];

          // Apply filters
          if (params.paymentMethod) {
            filteredTransactions = filteredTransactions.filter(tx =>
              tx.paymentMethod === params.paymentMethod || tx.processor === params.paymentMethod
            );
          }

          if (params.type) {
            filteredTransactions = filteredTransactions.filter(tx => tx.type === params.type);
          }

          if (params.status) {
            filteredTransactions = filteredTransactions.filter(tx => tx.status === params.status);
          }

          if (params.startDate) {
            const startDate = new Date(params.startDate);
            filteredTransactions = filteredTransactions.filter(tx => new Date(tx.date) >= startDate);
          }

          if (params.endDate) {
            const endDate = new Date(params.endDate);
            endDate.setHours(23, 59, 59, 999); // End of day
            filteredTransactions = filteredTransactions.filter(tx => new Date(tx.date) <= endDate);
          }

          // Pagination
          const page = parseInt(params.page) || 1;
          const limit = parseInt(params.limit) || 10;
          const startIndex = (page - 1) * limit;
          const endIndex = startIndex + limit;
          const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);

          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
              success: true,
              transactions: paginatedTransactions,
              pagination: {
                page,
                limit,
                totalPages: Math.ceil(filteredTransactions.length / limit),
                totalTransactions: filteredTransactions.length
              }
            })
          });
        }
      }

      // For receipt downloads, create a dummy blob
      if (url.includes('/api/transactions') && url.includes('/receipt')) {
        const dummyPdfBlob = new Blob(['Dummy PDF content'], { type: 'application/pdf' });
        return Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(dummyPdfBlob)
        });
      }

      // For all other requests, use the original fetch
      return originalFetch(url, options);
    };

    console.log('✅ Mock data inserted and APIs overridden for testing');
  }
};

// Auto-activate test mode if test=true in URL params
if (window.location.search.includes('test=true')) {
  document.addEventListener('DOMContentLoaded', function() {
    testTransactionData.insertMockDataForTesting();
    console.log('Test mode activated via URL parameter');

    // Add a test mode indicator
    const testBadge = document.createElement('div');
    testBadge.style.position = 'fixed';
    testBadge.style.top = '10px';
    testBadge.style.right = '10px';
    testBadge.style.backgroundColor = '#f97316';
    testBadge.style.color = 'white';
    testBadge.style.padding = '5px 10px';
    testBadge.style.borderRadius = '4px';
    testBadge.style.fontSize = '12px';
    testBadge.style.fontWeight = 'bold';
    testBadge.style.zIndex = '9999';
    testBadge.textContent = 'TEST MODE';
    document.body.appendChild(testBadge);
  });
}

// Export for use in console or other scripts
window.testTransactionData = testTransactionData;
