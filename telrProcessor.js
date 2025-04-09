/**
 * Telr Payment Processor
 *
 * Implementation of the Telr payment gateway specifically for
 * Middle East regions including UAE, Saudi Arabia, and Qatar.
 * Supports various payment methods including credit cards, Apple Pay,
 * Samsung Pay, and local payment options.
 */

import crypto from 'crypto';
import axios from 'axios';
import dotenv from 'dotenv';
import logger from '../../../utils/logger.js';
import { formatCurrency } from '../../../utils/paymentUtils.js';

dotenv.config();

// Telr API endpoints
const TELR_API_URL = process.env.TELR_API_URL || 'https://secure.telr.com/gateway';
const TELR_ORDER_ENDPOINT = `${TELR_API_URL}/order.json`;
const TELR_STATUS_ENDPOINT = `${TELR_API_URL}/status.json`;

class TelrProcessor {
  constructor() {
    this.storeId = process.env.TELR_STORE_ID;
    this.authKey = process.env.TELR_AUTH_KEY;
    this.testMode = process.env.NODE_ENV !== 'production';
    this.webhookUrl = process.env.TELR_WEBHOOK_URL;
  }

  /**
   * Create a checkout session with Telr
   * @param {Object} options - Checkout options
   * @returns {Promise<Object>} - Session details with checkout URL
   */
  async createCheckoutSession(options) {
    try {
      const {
        userId,
        items,
        currency = 'USD',
        paymentMethodId,
        couponCode,
        shippingAddress,
        billingAddress,
        metadata = {},
        returnUrl,
        cancelUrl,
        description
      } = options;

      // Validate inputs
      if (!userId) throw new Error('User ID is required');
      if (!items || items.length === 0) throw new Error('Items are required');

      // Extract expert and platform fee items if present
      const expertItems = items.filter(item => !item.type || item.type !== 'platform_fee');
      const platformFeeItems = items.filter(item => item.type === 'platform_fee');

      const isExpertPayment = !!metadata.expertId;
      const hasPlatformFee = platformFeeItems.length > 0;

      // Calculate total amount
      const amount = items.reduce((total, item) => {
        return total + (item.price * (item.quantity || 1));
      }, 0);

      // Calculate expert payment amount (excluding platform fees)
      const expertAmount = expertItems.reduce((total, item) => {
        return total + (item.price * (item.quantity || 1));
      }, 0);

      // Calculate platform fee amount
      const platformFeeAmount = platformFeeItems.reduce((total, item) => {
        return total + (item.price * (item.quantity || 1));
      }, 0);

      // Generate a unique transaction reference
      const transactionRef = `tx-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      // Prepare return URLs
      const returnUrlWithParams = `${returnUrl || process.env.PAYMENT_SUCCESS_URL}?ref=${transactionRef}`;
      const cancelUrlWithParams = `${cancelUrl || process.env.PAYMENT_CANCEL_URL}?ref=${transactionRef}`;

      // Prepare description based on payment type
      let paymentDescription = description;
      if (!paymentDescription) {
        if (isExpertPayment) {
          const expertName = metadata.expertName || "Expert";
          paymentDescription = `Payment to ${expertName}`;
          if (hasPlatformFee) {
            paymentDescription += ` (includes ${formatCurrency(platformFeeAmount, currency)} platform fee)`;
          }
        } else {
          paymentDescription = items.length === 1
            ? items[0].name
            : `${items[0].name} and ${items.length - 1} other item(s)`;
        }
      }

      // Prepare order payload
      const payload = {
        method: 'create',
        store: this.storeId,
        authkey: this.authKey,
        framed: 0, // Standard full screen payment page
        order: {
          ref: transactionRef,
          amount: amount.toFixed(2),
          currency: currency,
          description: paymentDescription,
          test: this.testMode ? '1' : '0',
          cart: {
            items: items.map(item => ({
              name: item.name,
              quantity: item.quantity || 1,
              price: (item.price).toFixed(2)
            }))
          }
        },
        return: {
          url: returnUrlWithParams,
          cancel_url: cancelUrlWithParams
        }
      };

      // Add customer details if available
      if (billingAddress) {
        payload.customer = {
          email: billingAddress.email,
          name: {
            title: billingAddress.title || '',
            first: billingAddress.firstName || billingAddress.name?.split(' ')[0] || '',
            last: billingAddress.lastName || billingAddress.name?.split(' ').slice(1).join(' ') || ''
          },
          address: {
            line1: billingAddress.line1 || billingAddress.address1 || '',
            city: billingAddress.city || '',
            region: billingAddress.state || billingAddress.region || '',
            country: billingAddress.countryCode || billingAddress.country || 'AE'
          },
          phone: billingAddress.phone || ''
        };
      }

      // Make API request to Telr to create the order
      const response = await axios.post(TELR_ORDER_ENDPOINT, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;

      // Validate response
      if (!result.order || !result.order.url) {
        throw new Error(result.error || 'Failed to create payment session');
      }

      // Return necessary details with payment component breakdowns
      return {
        sessionId: result.order.ref,
        processor: 'telr',
        url: result.order.url,
        amount: amount,
        currency: currency,
        status: 'pending',
        processorResponse: result,
        metadata: {
          ...metadata,
          transactionRef,
          isExpertPayment,
          expertAmount: isExpertPayment ? expertAmount : 0,
          platformFeeAmount: hasPlatformFee ? platformFeeAmount : 0,
          expertId: metadata.expertId || null,
          paymentType: metadata.paymentType || 'standard'
        }
      };
    } catch (error) {
      logger.error('Error creating Telr checkout session:', error);
      throw new Error(`Failed to create Telr checkout: ${error.message}`);
    }
  }

  /**
   * Check the status of a Telr payment
   * @param {string} sessionId - The session ID (order reference)
   * @returns {Promise<Object>} - Payment status
   */
  async checkPaymentStatus(sessionId) {
    try {
      const payload = {
        method: 'check',
        store: this.storeId,
        authkey: this.authKey,
        order: {
          ref: sessionId
        }
      };

      const response = await axios.post(TELR_STATUS_ENDPOINT, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;

      if (!result.order) {
        throw new Error(result.error || 'Failed to check payment status');
      }

      // Map Telr status to our system status
      const status = this.mapTelrStatus(result.order.status.code);

      return {
        status,
        processorStatus: result.order.status.code,
        transactionId: result.order.transaction?.ref || sessionId,
        amount: result.order.amount,
        currency: result.order.currency,
        processorResponse: result
      };
    } catch (error) {
      logger.error('Error checking Telr payment status:', error);
      throw new Error(`Failed to check payment status: ${error.message}`);
    }
  }

  /**
   * Map Telr status codes to our system status
   * @param {string} telrStatus - Telr status code
   * @returns {string} - Mapped status
   */
  mapTelrStatus(telrStatus) {
    const statusMap = {
      '1': 'pending',    // New order
      '2': 'pending',    // In progress (awaiting payment completion)
      '3': 'completed',  // Complete/Payment received
      '4': 'failed',     // Error/Payment failed
      '5': 'cancelled',  // Expired
      '7': 'refunded',   // Refunded
      '8': 'chargeback', // Chargeback
      '9': 'reserved',   // Reserved
      '0': 'unknown'     // Any other status
    };

    return statusMap[telrStatus] || 'unknown';
  }

  /**
   * Process a refund with Telr
   * @param {Object} options - Refund options
   * @returns {Promise<Object>} - Refund result
   */
  async processRefund(options) {
    try {
      const {
        transactionId,
        amount,
        reason,
        metadata = {}
      } = options;

      if (!transactionId) throw new Error('Transaction ID is required');
      if (!amount) throw new Error('Refund amount is required');

      const payload = {
        method: 'refund',
        store: this.storeId,
        authkey: this.authKey,
        refund: {
          transaction: transactionId,
          amount: amount.toFixed(2),
          note: reason || 'Refund requested by merchant'
        }
      };

      const response = await axios.post(`${TELR_API_URL}/process.json`, payload, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;

      if (!result.refund || !result.refund.status) {
        throw new Error(result.error || 'Failed to process refund');
      }

      return {
        success: result.refund.status === 'accepted',
        refundId: result.refund.ref || null,
        amount: amount,
        status: result.refund.status === 'accepted' ? 'completed' : 'failed',
        processorResponse: result
      };
    } catch (error) {
      logger.error('Error processing Telr refund:', error);
      throw new Error(`Failed to process refund: ${error.message}`);
    }
  }

  /**
   * Validate webhook payload from Telr
   * @param {Object} payload - Webhook payload
   * @param {Object} headers - Request headers
   * @returns {boolean} - Is valid
   */
  validateWebhook(payload, headers) {
    try {
      // Telr doesn't provide a signature in their webhooks
      // Instead, we verify the store ID and validate the presence of required fields

      if (!payload || !payload.order) {
        return false;
      }

      // Verify store ID
      if (payload.store !== this.storeId) {
        return false;
      }

      // Check essential fields
      if (!payload.order.ref || !payload.order.status) {
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error validating Telr webhook:', error);
      return false;
    }
  }

  /**
   * Parse webhook payload from Telr
   * @param {Object} payload - Webhook payload
   * @returns {Object} - Parsed webhook data
   */
  parseWebhook(payload) {
    try {
      if (!payload || !payload.order) {
        throw new Error('Invalid webhook payload');
      }

      const status = this.mapTelrStatus(payload.order.status.code);

      return {
        processor: 'telr',
        eventType: status,
        sessionId: payload.order.ref,
        transactionId: payload.order.transaction?.ref || payload.order.ref,
        amount: parseFloat(payload.order.amount),
        currency: payload.order.currency,
        status: status,
        metadata: {
          rawStatus: payload.order.status.code,
          statusText: payload.order.status.text
        },
        raw: payload
      };
    } catch (error) {
      logger.error('Error parsing Telr webhook:', error);
      throw new Error(`Failed to parse webhook: ${error.message}`);
    }
  }

  /**
   * Supported payment methods for Telr
   * @returns {string[]} - List of supported methods
   */
  getSupportedPaymentMethods() {
    return ['card', 'apple', 'samsung', 'mada', 'local'];
  }

  /**
   * Get processor display name
   * @returns {string} - Display name
   */
  getDisplayName() {
    return 'Telr Payment Gateway';
  }
}

export default TelrProcessor;
