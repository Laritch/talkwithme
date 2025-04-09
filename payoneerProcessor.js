/**
 * Payoneer Payment Processor
 *
 * Handles integration with Payoneer's API for:
 * - Direct payments to recipients
 * - Creating payouts
 * - Managing payment methods
 * - Handling refunds
 * - Account verification
 *
 * Implements all standard processor methods and Payoneer-specific features
 */

import axios from 'axios';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import User from '../../models/userModel.js';
import PaymentMethod from '../../models/paymentMethodModel.js';
import { formatCurrencyAmount } from '../../utils/transactionUtils.js';

class PayoneerProcessor {
  constructor() {
    // Environment-specific API base URLs
    this.baseUrls = {
      sandbox: 'https://api.sandbox.payoneer.com/v4',
      production: 'https://api.payoneer.com/v4'
    };

    // Get environment variables
    this.apiKey = process.env.PAYONEER_API_KEY;
    this.partnerId = process.env.PAYONEER_PARTNER_ID;
    this.secretKey = process.env.PAYONEER_SECRET_KEY;
    this.environment = process.env.PAYONEER_ENVIRONMENT || 'sandbox';

    // Validate configuration
    if (!this.apiKey || !this.partnerId || !this.secretKey) {
      console.warn('Payoneer configuration is incomplete. Some functions may not work properly.');
    }

    // Set base URL based on environment
    this.baseUrl = this.baseUrls[this.environment];

    // Configure HTTP client with default headers and timeout
    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Add request interceptor for authentication and idempotency
    this.client.interceptors.request.use(config => {
      // Add authorization header
      config.headers['Authorization'] = `Bearer ${this.apiKey}`;

      // Add partner ID
      config.headers['Payoneer-Partner-Id'] = this.partnerId;

      // Add idempotency key for POST requests to prevent duplicate transactions
      if (config.method === 'post') {
        config.headers['Idempotency-Key'] = config.headers['Idempotency-Key'] || uuidv4();
      }

      // Add signature for enhanced security
      const timestamp = Date.now().toString();
      config.headers['Payoneer-Request-Timestamp'] = timestamp;

      // Create signature using endpoint, timestamp, and request body
      const path = config.url.replace(this.baseUrl, '');
      const payload = JSON.stringify(config.data || {});
      const signatureData = `${path}:${timestamp}:${payload}`;
      const signature = crypto.createHmac('sha256', this.secretKey)
        .update(signatureData)
        .digest('hex');

      config.headers['Payoneer-Signature'] = signature;

      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      response => response,
      error => {
        // Format Payoneer API errors
        if (error.response && error.response.data) {
          const payoneerError = this.formatPayoneerError(error.response.data);
          return Promise.reject(payoneerError);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Check if the processor supports the specified payment method
   * @param {string} paymentMethod - Payment method name
   * @returns {boolean} - Whether this processor supports the payment method
   */
  supportsPaymentMethod(paymentMethod) {
    const supportedMethods = [
      'bank_transfer',
      'ach',
      'sepa',
      'payoneer_balance',
      'payoneer_card',
      'local_bank_transfer',
      'prepaid_card'
    ];

    return supportedMethods.includes(paymentMethod.toLowerCase());
  }

  /**
   * Check if the processor supports escrow functionality
   * @returns {boolean} - Whether escrow is supported
   */
  supportsEscrow() {
    // Payoneer does not natively support escrow functionality
    return false;
  }

  /**
   * Process a payment
   * @param {Object} options - Payment options
   * @returns {Promise<Object>} - Payment result
   */
  async processPayment(options) {
    const {
      paymentMethodId,
      amount,
      currency,
      description,
      metadata = {},
      customerId,
      receiptEmail,
      statementDescriptor
    } = options;

    try {
      // Fetch payment method details
      const paymentMethod = await PaymentMethod.findById(paymentMethodId);
      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }

      // Get recipient's Payoneer ID
      const userId = paymentMethod.userId;
      const user = await User.findById(userId);

      if (!user || !user.payoneerId) {
        throw new Error('User does not have a valid Payoneer account');
      }

      // Create payout
      const payoutResult = await this.client.post('/payouts', {
        payout_id: metadata.transactionId || uuidv4(),
        amount: {
          value: amount,
          currency
        },
        payee_id: user.payoneerId,
        description: description || 'Payment',
        client_reference_id: metadata.orderId || uuidv4(),
        statement_descriptor: statementDescriptor || 'Payment',
        metadata: {
          ...metadata,
          customerId
        }
      });

      // Format and return result
      return {
        id: payoutResult.data.payout_id,
        amount,
        currency,
        status: this.mapPayoneerStatus(payoutResult.data.status),
        processorName: 'payoneer',
        paymentMethodId,
        metadata: {
          ...metadata,
          payoneerResponseId: payoutResult.data.id,
          payeeId: user.payoneerId
        }
      };
    } catch (error) {
      console.error('Payoneer payment processing error:', error);
      throw {
        message: 'Failed to process payment with Payoneer',
        processorError: this.formatPayoneerError(error)
      };
    }
  }

  /**
   * Create a new payment method
   * @param {Object} options - Payment method options
   * @returns {Promise<Object>} - Created payment method details
   */
  async createPaymentMethod(options) {
    const {
      userId,
      type,
      paymentDetails,
      billingDetails,
      metadata = {}
    } = options;

    try {
      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Check if user has a Payoneer account or create one
      let payoneerId = user.payoneerId;

      if (!payoneerId) {
        // If no Payoneer ID exists for user, create one using Sign-up API
        // This is a simplified version - in reality, you'd redirect to Payoneer's onboarding
        const payoneerAccount = await this.client.post('/accounts', {
          account: {
            type: 'individual',
            email: user.email,
            name: {
              first_name: user.firstName || billingDetails.firstName,
              last_name: user.lastName || billingDetails.lastName
            },
            address: {
              country: billingDetails.country,
              state_province: billingDetails.state,
              city: billingDetails.city,
              postal_code: billingDetails.postalCode,
              street_address: billingDetails.addressLine1,
              street_address2: billingDetails.addressLine2
            }
          },
          client_reference_id: userId
        });

        payoneerId = payoneerAccount.data.account_id;

        // Update user with Payoneer ID
        await User.findByIdAndUpdate(userId, { payoneerId });
      }

      // For Payoneer, payment method is less traditional - we'll create a reference
      // to their Payoneer account or specific bank information they've added
      const paymentMethod = new PaymentMethod({
        userId,
        processor: 'payoneer',
        type: type || 'payoneer_balance',
        processorPaymentMethodId: paymentDetails.id || `payoneer_${Date.now()}`,
        isDefault: paymentDetails.isDefault || false,
        data: {
          payoneerId,
          nickname: paymentDetails.nickname || 'Payoneer Account',
          paymentType: type,
          last4: paymentDetails.last4 || 'N/A',
          ...paymentDetails
        },
        billingDetails,
        metadata
      });

      await paymentMethod.save();

      return {
        id: paymentMethod._id,
        type: paymentMethod.type,
        processor: 'payoneer',
        isDefault: paymentMethod.isDefault,
        data: {
          nickname: paymentMethod.data.nickname,
          paymentType: paymentMethod.data.paymentType,
          last4: paymentMethod.data.last4
        }
      };
    } catch (error) {
      console.error('Payoneer payment method creation error:', error);
      throw {
        message: 'Failed to create payment method with Payoneer',
        processorError: this.formatPayoneerError(error)
      };
    }
  }

  /**
   * Get payment method details
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Payment method details
   */
  async getPaymentMethod(options) {
    const { paymentMethodId } = options;

    try {
      const paymentMethod = await PaymentMethod.findById(paymentMethodId);

      if (!paymentMethod || paymentMethod.processor !== 'payoneer') {
        throw new Error('Payoneer payment method not found');
      }

      return {
        id: paymentMethod._id,
        type: paymentMethod.type,
        processor: 'payoneer',
        isDefault: paymentMethod.isDefault,
        data: {
          nickname: paymentMethod.data.nickname,
          paymentType: paymentMethod.data.paymentType,
          last4: paymentMethod.data.last4,
          ...paymentMethod.data
        },
        billingDetails: paymentMethod.billingDetails,
        metadata: paymentMethod.metadata
      };
    } catch (error) {
      console.error('Payoneer payment method retrieval error:', error);
      throw {
        message: 'Failed to retrieve payment method from Payoneer',
        processorError: this.formatPayoneerError(error)
      };
    }
  }

  /**
   * Update a payment method
   * @param {Object} options - Update options
   * @returns {Promise<Object>} - Updated payment method
   */
  async updatePaymentMethod(options) {
    const {
      paymentMethodId,
      updates,
      metadata
    } = options;

    try {
      // Find the payment method
      const paymentMethod = await PaymentMethod.findById(paymentMethodId);

      if (!paymentMethod || paymentMethod.processor !== 'payoneer') {
        throw new Error('Payoneer payment method not found');
      }

      // Update local record
      if (updates.billingDetails) {
        paymentMethod.billingDetails = {
          ...paymentMethod.billingDetails,
          ...updates.billingDetails
        };
      }

      if (updates.data) {
        paymentMethod.data = {
          ...paymentMethod.data,
          ...updates.data
        };
      }

      if (updates.isDefault !== undefined) {
        paymentMethod.isDefault = updates.isDefault;
      }

      if (metadata) {
        paymentMethod.metadata = {
          ...paymentMethod.metadata,
          ...metadata
        };
      }

      await paymentMethod.save();

      // If this payment method is set as default, update other payment methods
      if (updates.isDefault === true) {
        await PaymentMethod.updateMany(
          {
            userId: paymentMethod.userId,
            processor: 'payoneer',
            _id: { $ne: paymentMethodId }
          },
          { isDefault: false }
        );
      }

      return {
        id: paymentMethod._id,
        type: paymentMethod.type,
        processor: 'payoneer',
        isDefault: paymentMethod.isDefault,
        data: paymentMethod.data,
        billingDetails: paymentMethod.billingDetails,
        metadata: paymentMethod.metadata
      };
    } catch (error) {
      console.error('Payoneer payment method update error:', error);
      throw {
        message: 'Failed to update payment method with Payoneer',
        processorError: this.formatPayoneerError(error)
      };
    }
  }

  /**
   * Delete a payment method
   * @param {Object} options - Delete options
   * @returns {Promise<Object>} - Deletion result
   */
  async deletePaymentMethod(options) {
    const { paymentMethodId } = options;

    try {
      // Find the payment method
      const paymentMethod = await PaymentMethod.findById(paymentMethodId);

      if (!paymentMethod || paymentMethod.processor !== 'payoneer') {
        throw new Error('Payoneer payment method not found');
      }

      // Payoneer doesn't really have payment methods to delete in the traditional sense
      // We're just removing our reference to it

      await PaymentMethod.findByIdAndDelete(paymentMethodId);

      return {
        success: true,
        id: paymentMethodId,
        message: 'Payment method deleted successfully'
      };
    } catch (error) {
      console.error('Payoneer payment method deletion error:', error);
      throw {
        message: 'Failed to delete payment method with Payoneer',
        processorError: this.formatPayoneerError(error)
      };
    }
  }

  /**
   * Process a refund
   * @param {Object} options - Refund options
   * @returns {Promise<Object>} - Refund result
   */
  async refundPayment(options) {
    const {
      paymentId,
      amount,
      reason,
      metadata = {}
    } = options;

    try {
      // For Payoneer, refunds are typically handled as new payouts in the opposite direction
      // This is a simplified implementation

      // Get original payment details
      const originalPayment = await this.client.get(`/payouts/${paymentId}`);

      if (!originalPayment.data) {
        throw new Error('Original payment not found');
      }

      // Create refund payout
      const refundResult = await this.client.post('/payouts/refund', {
        original_payout_id: paymentId,
        refund_id: metadata.refundId || uuidv4(),
        amount: {
          value: amount || originalPayment.data.amount.value,
          currency: originalPayment.data.amount.currency
        },
        reason: reason || 'Customer request',
        metadata: {
          ...metadata,
          originalPaymentId: paymentId
        }
      });

      return {
        id: refundResult.data.refund_id,
        originalPaymentId: paymentId,
        amount: refundResult.data.amount.value,
        currency: refundResult.data.amount.currency,
        status: this.mapPayoneerStatus(refundResult.data.status),
        processorName: 'payoneer',
        metadata: {
          reason,
          ...metadata,
          payoneerResponseId: refundResult.data.id
        }
      };
    } catch (error) {
      console.error('Payoneer refund processing error:', error);
      throw {
        message: 'Failed to process refund with Payoneer',
        processorError: this.formatPayoneerError(error)
      };
    }
  }

  /**
   * Create a checkout session
   * @param {Object} options - Checkout options
   * @returns {Promise<Object>} - Checkout session details
   */
  async createCheckoutSession(options) {
    const {
      userId,
      items,
      currency,
      successUrl,
      cancelUrl,
      metadata = {}
    } = options;

    try {
      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Calculate total amount
      const totalAmount = items.reduce((sum, item) => {
        return sum + (item.price * (item.quantity || 1));
      }, 0);

      // Create a payment link for the user to complete
      const paymentLinkResult = await this.client.post('/payment-links', {
        payment_link_id: metadata.checkoutId || uuidv4(),
        amount: {
          value: totalAmount,
          currency
        },
        description: metadata.description || `Payment for ${items.length} items`,
        redirect_urls: {
          success_url: successUrl,
          cancel_url: cancelUrl
        },
        expires_at: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
        items: items.map(item => ({
          name: item.name,
          description: item.description,
          amount: {
            value: item.price,
            currency
          },
          quantity: item.quantity || 1
        })),
        metadata: {
          ...metadata,
          userId
        }
      });

      return {
        id: paymentLinkResult.data.payment_link_id,
        amount: totalAmount,
        currency,
        status: 'pending',
        redirectUrl: paymentLinkResult.data.url,
        processorName: 'payoneer',
        expiresAt: paymentLinkResult.data.expires_at,
        metadata: {
          ...metadata,
          payoneerResponseId: paymentLinkResult.data.id
        }
      };
    } catch (error) {
      console.error('Payoneer checkout session creation error:', error);
      throw {
        message: 'Failed to create checkout session with Payoneer',
        processorError: this.formatPayoneerError(error)
      };
    }
  }

  /**
   * Verify a payment
   * @param {Object} options - Verification options
   * @returns {Promise<Object>} - Verification result
   */
  async verifyPayment(options) {
    const { paymentId, metadata = {} } = options;

    try {
      // Get payment details from Payoneer
      const paymentResult = await this.client.get(`/payouts/${paymentId}`);

      if (!paymentResult.data) {
        throw new Error('Payment not found');
      }

      return {
        id: paymentResult.data.payout_id,
        amount: paymentResult.data.amount.value,
        currency: paymentResult.data.amount.currency,
        status: this.mapPayoneerStatus(paymentResult.data.status),
        processorName: 'payoneer',
        verified: paymentResult.data.status === 'PROCESSED',
        metadata: {
          ...metadata,
          payoneerResponseId: paymentResult.data.id
        }
      };
    } catch (error) {
      console.error('Payoneer payment verification error:', error);
      throw {
        message: 'Failed to verify payment with Payoneer',
        processorError: this.formatPayoneerError(error)
      };
    }
  }

  /**
   * Create a subscription
   * @param {Object} options - Subscription options
   * @returns {Promise<Object>} - Subscription details
   */
  async createSubscription(options) {
    // Payoneer doesn't directly support subscriptions through their API
    // This would typically be managed on your end with scheduled payouts
    throw {
      message: 'Subscriptions are not directly supported by Payoneer',
      processorError: {
        code: 'unsupported_operation',
        message: 'Payoneer does not support automatic subscriptions. Consider implementing scheduled payouts.'
      }
    };
  }

  /**
   * Cancel a subscription
   * @param {Object} options - Cancellation options
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelSubscription(options) {
    // As with creating subscriptions, cancelling is not applicable directly via Payoneer
    throw {
      message: 'Subscriptions are not directly supported by Payoneer',
      processorError: {
        code: 'unsupported_operation',
        message: 'Payoneer does not support automatic subscriptions.'
      }
    };
  }

  /**
   * Get a list of available payment methods for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - List of payment methods
   */
  async getPaymentMethods(userId) {
    try {
      // Find all payment methods for this user with Payoneer
      const paymentMethods = await PaymentMethod.find({
        userId,
        processor: 'payoneer'
      });

      return paymentMethods.map(method => ({
        id: method._id,
        type: method.type,
        processor: 'payoneer',
        isDefault: method.isDefault,
        data: {
          nickname: method.data.nickname,
          paymentType: method.data.paymentType,
          last4: method.data.last4
        }
      }));
    } catch (error) {
      console.error('Payoneer payment methods retrieval error:', error);
      throw {
        message: 'Failed to retrieve payment methods from Payoneer',
        processorError: this.formatPayoneerError(error)
      };
    }
  }

  /**
   * Format Payoneer error for consistent error handling
   * @param {Object} error - Error from Payoneer API
   * @returns {Object} - Formatted error object
   */
  formatPayoneerError(error) {
    if (!error) {
      return {
        code: 'unknown_error',
        message: 'An unknown error occurred with Payoneer'
      };
    }

    // Handle Axios error with response
    if (error.response && error.response.data) {
      const { data } = error.response;

      return {
        code: data.code || data.error || 'api_error',
        message: data.message || data.error_description || 'Payoneer API error',
        status: error.response.status,
        details: data.details || data
      };
    }

    // Handle Payoneer API error object
    if (error.code && error.message) {
      return {
        code: error.code,
        message: error.message,
        details: error.details || {}
      };
    }

    // Default format for unknown errors
    return {
      code: error.code || 'unknown_error',
      message: error.message || 'An unknown error occurred with Payoneer',
      details: error.details || error
    };
  }

  /**
   * Map Payoneer status to standard payment status
   * @param {string} payoneerStatus - Status from Payoneer API
   * @returns {string} - Standardized status
   */
  mapPayoneerStatus(payoneerStatus) {
    const statusMap = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'PROCESSED': 'succeeded',
      'CANCELLED': 'cancelled',
      'FAILED': 'failed',
      'REJECTED': 'failed'
    };

    return statusMap[payoneerStatus] || 'unknown';
  }

  /**
   * Convert amount to appropriate format for Payoneer API
   * @param {number} amount - Amount in standard format
   * @param {string} currency - Currency code
   * @returns {number} - Formatted amount
   */
  convertAmountForPayoneer(amount, currency) {
    // Payoneer accepts decimal amounts directly, unlike some processors that require cents
    return parseFloat(amount.toFixed(2));
  }

  /**
   * Format a display string for a payment method
   * @param {Object} paymentMethod - Payment method details
   * @returns {string} - Display string
   */
  formatPaymentMethodDisplay(paymentMethod) {
    if (!paymentMethod || !paymentMethod.data) {
      return 'Unknown payment method';
    }

    const { data } = paymentMethod;

    switch (paymentMethod.type) {
      case 'payoneer_balance':
        return 'Payoneer Balance';
      case 'bank_transfer':
        return `Bank Account (${data.bankName} ****${data.last4})`;
      case 'prepaid_card':
        return `Payoneer Card (****${data.last4})`;
      default:
        return data.nickname || 'Payoneer Account';
    }
  }
}

export default PayoneerProcessor;
