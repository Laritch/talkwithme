/**
 * Square Payment Processor
 *
 * Implements Square payment processing functionality
 * for handling credit and debit card payments
 */

import { Client, Environment } from 'square';
import crypto from 'crypto';
import { getEnvVar } from '../../../utils/configUtils.js';
import * as paymentUtils from '../../../utils/paymentUtils.js';

class SquareProcessor {
  constructor() {
    this._initializeSquareClient();
  }

  /**
   * Initialize Square client
   * @private
   */
  _initializeSquareClient() {
    try {
      const accessToken = getEnvVar('SQUARE_ACCESS_TOKEN');
      const environment = getEnvVar('NODE_ENV') === 'production'
        ? Environment.Production
        : Environment.Sandbox;

      this.client = new Client({
        accessToken,
        environment
      });

      this.locationId = getEnvVar('SQUARE_LOCATION_ID');
      this.appId = getEnvVar('SQUARE_APPLICATION_ID');
    } catch (error) {
      console.error('Error initializing Square client:', error);
      throw new Error('Failed to initialize Square client');
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

      // Prepare idempotency key for the request to prevent duplicate payments
      const idempotencyKey = metadata.idempotencyKey || crypto.randomUUID();

      // Create a payment
      const { result } = await this.client.paymentsApi.createPayment({
        sourceId: paymentMethodId,
        idempotencyKey,
        amountMoney: {
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toUpperCase()
        },
        locationId: this.locationId,
        note: description || 'Payment for Expert Chat services',
        customerId: metadata.customerId,
        referenceId: metadata.orderId || metadata.referenceId
      });

      const payment = result.payment;

      // Process the result
      return {
        id: payment.id,
        status: payment.status === 'COMPLETED' ? 'succeeded' : 'pending',
        amount: payment.amountMoney.amount / 100, // Convert back to dollars
        currency: payment.amountMoney.currency,
        processorResponse: {
          orderId: payment.orderId,
          receiptUrl: payment.receiptUrl,
          cardDetails: payment.cardDetails
        }
      };
    } catch (error) {
      console.error('Square payment processing error:', error);

      // Format error for consistent handling
      throw {
        message: 'Square payment processing failed',
        processorError: {
          code: error.code || 'processing_error',
          message: error.errors?.[0]?.detail || error.message,
          category: error.errors?.[0]?.category
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
    try {
      const { userId, customerId, paymentToken, billingDetails } = options;

      if (!paymentToken) {
        throw new Error('Payment token is required');
      }

      // Square doesn't store payment methods directly like Stripe
      // Instead we would create a customer card on file
      let squareCustomerId = customerId;

      // If no customer ID provided, create a new customer or find existing
      if (!squareCustomerId) {
        squareCustomerId = await this._getOrCreateCustomer(userId, billingDetails);
      }

      // Create a card on file for the customer
      const { result } = await this.client.cardsApi.createCard({
        idempotencyKey: crypto.randomUUID(),
        sourceId: paymentToken,
        card: {
          customerId: squareCustomerId,
          billingAddress: billingDetails?.address ? {
            addressLine1: billingDetails.address.line1,
            addressLine2: billingDetails.address.line2,
            locality: billingDetails.address.city,
            administrativeDistrictLevel1: billingDetails.address.state,
            postalCode: billingDetails.address.postalCode,
            country: billingDetails.address.country
          } : undefined,
          cardholderName: billingDetails?.name
        }
      });

      const card = result.card;

      // Return standardized payment method object
      return {
        id: card.id,
        type: 'card',
        brand: card.cardBrand.toLowerCase(),
        last4: card.last4,
        expiryMonth: card.expMonth,
        expiryYear: card.expYear,
        customerId: card.customerId
      };
    } catch (error) {
      console.error('Square create payment method error:', error);
      throw {
        message: 'Failed to create Square payment method',
        processorError: {
          code: error.code || 'invalid_request',
          message: error.errors?.[0]?.detail || error.message
        }
      };
    }
  }

  /**
   * Delete a payment method
   * @param {string} paymentMethodId - Payment method ID
   * @returns {Promise<Object>} - Deletion result
   */
  async deletePaymentMethod(paymentMethodId) {
    try {
      const { result } = await this.client.cardsApi.disableCard(paymentMethodId);
      return { deleted: true };
    } catch (error) {
      console.error('Square delete payment method error:', error);
      throw {
        message: 'Failed to delete Square payment method',
        processorError: {
          code: error.code || 'invalid_request',
          message: error.errors?.[0]?.detail || error.message
        }
      };
    }
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
      const { result } = await this.client.refundsApi.refundPayment({
        idempotencyKey: metadata.idempotencyKey || crypto.randomUUID(),
        paymentId: transactionId,
        amountMoney: {
          amount: amount ? Math.round(amount * 100) : undefined, // Convert to cents
          currency: metadata.currency?.toUpperCase() || 'USD'
        },
        reason: reason || 'Requested by customer'
      });

      const refund = result.refund;

      return {
        id: refund.id,
        status: refund.status === 'COMPLETED' ? 'succeeded' : 'pending',
        amount: refund.amountMoney.amount / 100, // Convert back to dollars
        currency: refund.amountMoney.currency,
        processorResponse: refund
      };
    } catch (error) {
      console.error('Square refund error:', error);
      throw {
        message: 'Square refund failed',
        processorError: {
          code: error.code || 'refund_error',
          message: error.errors?.[0]?.detail || error.message
        }
      };
    }
  }

  /**
   * Create a checkout
   * @param {Object} options - Checkout options
   * @returns {Promise<Object>} - Checkout session details
   */
  async createCheckoutSession(options) {
    try {
      const {
        userId,
        items,
        currency = 'USD',
        successUrl,
        cancelUrl,
        metadata = {}
      } = options;

      if (!items || items.length === 0) {
        throw new Error('Items are required for checkout');
      }

      // Convert items to Square line items
      const lineItems = items.map(item => ({
        quantity: item.quantity.toString() || '1',
        basePriceMoney: {
          amount: Math.round(item.price * 100), // Convert to cents
          currency: currency.toUpperCase()
        },
        name: item.name,
        note: item.description
      }));

      // Create a checkout link
      const { result } = await this.client.checkoutApi.createPaymentLink({
        idempotencyKey: metadata.idempotencyKey || crypto.randomUUID(),
        checkoutOptions: {
          merchantSupportEmail: metadata.supportEmail || 'support@expertchat.com',
          askForShippingAddress: false,
          redirectUrl: successUrl,
          ...(metadata.appFeeMoney ? {
            appFeeMoney: {
              amount: Math.round(metadata.appFeeMoney * 100),
              currency: currency.toUpperCase()
            }
          } : {})
        },
        prePopulatedData: {
          buyerEmail: metadata.email
        },
        order: {
          locationId: this.locationId,
          lineItems,
          referenceId: metadata.orderId || userId.toString(),
          metadata: {
            userId: userId.toString(),
            source: metadata.source || 'api'
          }
        }
      });

      const paymentLink = result.paymentLink;

      return {
        id: paymentLink.id,
        redirectUrl: paymentLink.url,
        amount: paymentLink.orderTemplates[0].order.totalMoney.amount / 100, // Convert back to dollars
        currency: paymentLink.orderTemplates[0].order.totalMoney.currency
      };
    } catch (error) {
      console.error('Square checkout error:', error);
      throw {
        message: 'Square checkout creation failed',
        processorError: {
          code: error.code || 'checkout_error',
          message: error.errors?.[0]?.detail || error.message
        }
      };
    }
  }

  /**
   * Get checkout status
   * @param {string} checkoutId - Checkout ID
   * @returns {Promise<Object>} - Checkout status
   */
  async getCheckoutStatus(checkoutId) {
    try {
      // Square doesn't provide a direct way to check payment link status
      // We would need to implement a webhook to handle this
      // For now, return a placeholder
      return {
        status: 'pending',
        message: 'Square payment link status needs to be tracked via webhook'
      };
    } catch (error) {
      console.error('Error getting Square checkout status:', error);
      throw error;
    }
  }

  /**
   * Create a customer
   * @param {Object} options - Customer options
   * @returns {Promise<Object>} - Customer details
   */
  async createCustomer(options) {
    try {
      const { email, name, phone, metadata = {} } = options;

      const { result } = await this.client.customersApi.createCustomer({
        emailAddress: email,
        givenName: name ? name.split(' ')[0] : undefined,
        familyName: name ? name.split(' ').slice(1).join(' ') : undefined,
        phoneNumber: phone,
        referenceId: metadata.userId,
        note: metadata.note
      });

      const customer = result.customer;

      return {
        id: customer.id,
        email: customer.emailAddress,
        name: `${customer.givenName || ''} ${customer.familyName || ''}`.trim()
      };
    } catch (error) {
      console.error('Square create customer error:', error);
      throw {
        message: 'Failed to create Square customer',
        processorError: {
          code: error.code || 'invalid_request',
          message: error.errors?.[0]?.detail || error.message
        }
      };
    }
  }

  /**
   * Get or create a customer
   * @param {string} userId - User ID
   * @param {Object} billingDetails - Billing details
   * @returns {Promise<string>} - Customer ID
   * @private
   */
  async _getOrCreateCustomer(userId, billingDetails = {}) {
    try {
      // Search for existing customer by reference ID (userId)
      const { result: searchResult } = await this.client.customersApi.searchCustomers({
        query: {
          filter: {
            referenceId: {
              exact: userId.toString()
            }
          }
        }
      });

      // If customer found, return ID
      if (searchResult.customers && searchResult.customers.length > 0) {
        return searchResult.customers[0].id;
      }

      // Otherwise create a new customer
      const { result: createResult } = await this.client.customersApi.createCustomer({
        emailAddress: billingDetails.email,
        givenName: billingDetails.name ? billingDetails.name.split(' ')[0] : undefined,
        familyName: billingDetails.name ? billingDetails.name.split(' ').slice(1).join(' ') : undefined,
        phoneNumber: billingDetails.phone,
        referenceId: userId.toString(),
        note: 'Created via Expert Chat payment system'
      });

      return createResult.customer.id;
    } catch (error) {
      console.error('Error getting or creating Square customer:', error);
      throw error;
    }
  }
}

export default SquareProcessor;
