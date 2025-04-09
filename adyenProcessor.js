/**
 * Adyen Payment Processor
 *
 * Implements Adyen payment processing functionality
 * for handling credit/debit cards and international payment methods
 */

import { Client, Config, CheckoutAPI } from '@adyen/api-library';
import { getEnvVar } from '../../../utils/configUtils.js';
import * as paymentUtils from '../../../utils/paymentUtils.js';

class AdyenProcessor {
  constructor() {
    this._initializeAdyenClient();
  }

  /**
   * Initialize Adyen client
   * @private
   */
  _initializeAdyenClient() {
    try {
      const apiKey = getEnvVar('ADYEN_API_KEY');
      const environment = getEnvVar('NODE_ENV') === 'production' ? 'LIVE' : 'TEST';
      const merchantAccount = getEnvVar('ADYEN_MERCHANT_ACCOUNT');

      const config = new Config();
      config.apiKey = apiKey;
      config.environment = environment;

      this.client = new Client({ config });
      this.checkout = new CheckoutAPI(this.client);
      this.merchantAccount = merchantAccount;
    } catch (error) {
      console.error('Error initializing Adyen client:', error);
      throw new Error('Failed to initialize Adyen client');
    }
  }

  /**
   * Process a direct payment
   * @param {Object} paymentDetails - Payment details
   * @returns {Promise<Object>} - Payment result
   */
  async processPayment(paymentDetails) {
    try {
      const { amount, currency, paymentMethodId, description, metadata = {} } = paymentDetails;

      // Validate payment details
      if (!amount || !currency || !paymentMethodId) {
        throw new Error('Missing required payment details');
      }

      // Create a payment
      const response = await this.checkout.payments({
        amount: {
          value: Math.round(amount * 100), // Convert to cents
          currency: currency.toUpperCase()
        },
        paymentMethod: JSON.parse(paymentMethodId), // Adyen expects a structured payment method object
        reference: metadata.orderId || `order-${Date.now()}`,
        merchantAccount: this.merchantAccount,
        shopperReference: metadata.userId || undefined,
        shopperEmail: metadata.email || undefined,
        shopperName: metadata.name ? {
          firstName: metadata.name.split(' ')[0],
          lastName: metadata.name.split(' ').slice(1).join(' ')
        } : undefined,
        returnUrl: metadata.returnUrl || `${process.env.APP_URL}/payment-result`,
        description,
        channel: 'Web',
        metadata: {
          userId: metadata.userId || '',
          source: metadata.source || 'api'
        }
      });

      // Handle different result types
      if (response.resultCode === 'Authorised' || response.resultCode === 'Received') {
        // Successful payment or payment pending
        return {
          id: response.pspReference,
          status: response.resultCode === 'Authorised' ? 'succeeded' : 'pending',
          amount: amount,
          currency: currency,
          processorResponse: {
            resultCode: response.resultCode,
            pspReference: response.pspReference,
            merchantReference: response.merchantReference,
            additionalData: response.additionalData
          }
        };
      } else if (response.resultCode === 'RedirectShopper') {
        // Redirect required for 3D Secure or other authentication methods
        return {
          id: response.pspReference,
          status: 'redirect_required',
          redirectUrl: response.redirect.url,
          redirectMethod: response.redirect.method,
          redirectData: response.redirect.data,
          amount: amount,
          currency: currency,
          processorResponse: {
            resultCode: response.resultCode,
            pspReference: response.pspReference
          }
        };
      } else {
        // Payment failed
        throw new Error(`Payment failed with resultCode: ${response.resultCode}`);
      }
    } catch (error) {
      console.error('Adyen payment processing error:', error);

      // Format error for consistent handling
      throw {
        message: 'Adyen payment processing failed',
        processorError: {
          code: error.statusCode || 'processing_error',
          message: error.message,
          adyenError: error.errorMessage || error.message
        }
      };
    }
  }

  /**
   * Complete a payment that required additional actions
   * @param {Object} options - Completion options
   * @returns {Promise<Object>} - Completion result
   */
  async completePayment(options) {
    try {
      const { paymentData, details } = options;

      if (!paymentData || !details) {
        throw new Error('Payment data and details are required');
      }

      // Submit details to complete payment
      const response = await this.checkout.paymentsDetails({
        paymentData,
        details
      });

      // Handle response
      return {
        id: response.pspReference,
        status: response.resultCode === 'Authorised' ? 'succeeded' : 'failed',
        processorResponse: {
          resultCode: response.resultCode,
          pspReference: response.pspReference,
          merchantReference: response.merchantReference,
          additionalData: response.additionalData
        }
      };
    } catch (error) {
      console.error('Adyen payment completion error:', error);
      throw {
        message: 'Failed to complete Adyen payment',
        processorError: {
          code: error.statusCode || 'processing_error',
          message: error.message,
          adyenError: error.errorMessage || error.message
        }
      };
    }
  }

  /**
   * Create a payment method
   * @param {Object} options - Payment method options
   * @returns {Promise<Object>} - Payment method details
   */
  async createPaymentMethod(options) {
    // Adyen doesn't support saving payment methods via API like Stripe
    // This would typically be handled via the frontend with tokenization
    throw new Error('Adyen payment methods must be tokenized via the frontend');
  }

  /**
   * Delete a payment method
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} - Deletion result
   */
  async deletePaymentMethod(paymentMethodId) {
    // Adyen doesn't support deleting tokenized cards via API in the same way as Stripe
    throw new Error('Adyen payment methods cannot be deleted via API');
  }

  /**
   * Refund a payment
   * @param {Object} options - Refund options
   * @returns {Promise<Object>} - Refund result
   */
  async refundPayment(options) {
    try {
      const { transactionId, amount, reason, metadata = {} } = options;

      if (!transactionId) {
        throw new Error('Transaction ID is required');
      }

      // Create refund
      const response = await this.checkout.refunds({
        merchantAccount: this.merchantAccount,
        modificationAmount: {
          value: Math.round(amount * 100), // Convert to cents
          currency: metadata.currency?.toUpperCase() || 'USD'
        },
        reference: metadata.refundReference || `refund-${Date.now()}`,
        originalReference: transactionId,
        merchantRefundReason: reason
      });

      return {
        id: response.pspReference,
        status: response.response === '[refund-received]' ? 'succeeded' : 'pending',
        amount: amount,
        currency: metadata.currency || 'USD',
        processorResponse: response
      };
    } catch (error) {
      console.error('Adyen refund error:', error);
      throw {
        message: 'Adyen refund failed',
        processorError: {
          code: error.statusCode || 'refund_error',
          message: error.message,
          adyenError: error.errorMessage || error.message
        }
      };
    }
  }

  /**
   * Create a checkout session
   * @param {Object} options - Checkout options
   * @returns {Promise<Object>} - Checkout session details
   */
  async createCheckoutSession(options) {
    try {
      const {
        userId,
        items,
        currency,
        successUrl,
        cancelUrl,
        metadata = {}
      } = options;

      if (!items || items.length === 0) {
        throw new Error('Items are required for checkout');
      }

      // Calculate total amount from items
      const total = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

      // Create a session with list of payment methods available
      const response = await this.checkout.sessions({
        amount: {
          value: Math.round(total * 100), // Convert to cents
          currency: currency.toUpperCase()
        },
        countryCode: metadata.countryCode || 'US', // Default to US
        merchantAccount: this.merchantAccount,
        reference: metadata.orderId || `order-${Date.now()}`,
        returnUrl: successUrl || `${process.env.APP_URL}/payment-result`,
        shopperLocale: metadata.locale || 'en-US',
        shopperReference: userId ? userId.toString() : undefined,
        shopperEmail: metadata.email || undefined,
        storePaymentMethod: metadata.storePaymentMethod || false,
        lineItems: items.map(item => ({
          quantity: item.quantity || 1,
          amountIncludingTax: Math.round(item.price * 100),
          description: item.name,
          id: item.id || `item-${Date.now()}`
        })),
        metadata: {
          userId: userId ? userId.toString() : '',
          source: metadata.source || 'api'
        }
      });

      return {
        id: response.id,
        sessionData: response.sessionData,
        redirectUrl: null, // Adyen doesn't provide a direct redirect URL, handled by frontend
        clientSecret: null, // Not applicable for Adyen
        amount: total,
        currency: currency
      };
    } catch (error) {
      console.error('Adyen checkout session error:', error);
      throw {
        message: 'Adyen checkout session creation failed',
        processorError: {
          code: error.statusCode || 'session_error',
          message: error.message,
          adyenError: error.errorMessage || error.message
        }
      };
    }
  }

  /**
   * Get the status of a checkout session
   * @param {string} sessionId - Checkout session ID
   * @returns {Promise<Object>} - Checkout status details
   */
  async getCheckoutStatus(sessionId) {
    // Adyen doesn't provide a direct API for getting session status
    // This would typically be handled via webhooks
    return {
      status: 'unknown',
      message: 'Adyen session status must be tracked via webhooks'
    };
  }
}

export default AdyenProcessor;
