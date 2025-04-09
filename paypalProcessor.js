/**
 * PayPal Payment Processor
 *
 * Implements PayPal payment processing functionality
 * using the PayPal REST API.
 */

import paypal from '@paypal/checkout-server-sdk';
import { getEnvVar } from '../../../utils/configUtils.js';
import * as paymentUtils from '../../../utils/paymentUtils.js';

class PayPalProcessor {
  constructor() {
    this._initializePayPalClient();
  }

  /**
   * Initialize PayPal SDK client
   * @private
   */
  _initializePayPalClient() {
    try {
      const clientId = getEnvVar('PAYPAL_CLIENT_ID');
      const clientSecret = getEnvVar('PAYPAL_CLIENT_SECRET');
      const environment = getEnvVar('NODE_ENV') === 'production'
        ? new paypal.core.LiveEnvironment(clientId, clientSecret)
        : new paypal.core.SandboxEnvironment(clientId, clientSecret);

      this.client = new paypal.core.PayPalHttpClient(environment);
    } catch (error) {
      console.error('Error initializing PayPal client:', error);
      throw new Error('Failed to initialize PayPal client');
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

      // Set up the payment details
      const orderRequest = new paypal.orders.OrdersCreateRequest();
      orderRequest.prefer('return=representation');
      orderRequest.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: {
            currency_code: currency.toUpperCase(),
            value: amount.toFixed(2)
          },
          description: description || 'Payment for Expert Chat services'
        }],
        payment_source: {
          token: {
            id: paymentMethodId,
            type: 'PAYMENT_METHOD_TOKEN'
          }
        },
        application_context: {
          shipping_preference: 'NO_SHIPPING'
        },
        custom_id: metadata.userId || '',
        soft_descriptor: 'ExpertChat'
      });

      // Create and capture the order
      const orderResponse = await this.client.execute(orderRequest);

      if (orderResponse.statusCode !== 201) {
        throw new Error(`PayPal order creation failed: ${orderResponse.statusCode}`);
      }

      // Capture the payment
      const captureRequest = new paypal.orders.OrdersCaptureRequest(orderResponse.result.id);
      captureRequest.requestBody({});

      const captureResponse = await this.client.execute(captureRequest);

      if (captureResponse.statusCode !== 201) {
        throw new Error(`PayPal order capture failed: ${captureResponse.statusCode}`);
      }

      // Process the result
      const result = captureResponse.result;
      const capture = result.purchase_units[0].payments.captures[0];

      return {
        id: result.id,
        status: capture.status === 'COMPLETED' ? 'succeeded' : 'pending',
        amount: parseFloat(capture.amount.value),
        currency: capture.amount.currency_code,
        processorResponse: {
          captureId: capture.id,
          payerEmail: result.payer?.email_address,
          payerId: result.payer?.payer_id
        }
      };
    } catch (error) {
      console.error('PayPal payment processing error:', error);

      // Format error for consistent handling
      throw {
        message: 'PayPal payment processing failed',
        processorError: {
          code: error.details?.[0]?.issue || 'processing_error',
          message: error.details?.[0]?.description || error.message,
          paypalDebugId: error.debug_id
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
      const { userId, type, paymentToken, billingDetails } = options;

      if (!paymentToken) {
        throw new Error('Payment token is required');
      }

      // PayPal doesn't have a separate payment method saving API,
      // we just return the token as the payment method
      return {
        id: paymentToken,
        type: 'paypal',
        brand: 'paypal',
        last4: '', // PayPal doesn't expose card details
        email: billingDetails?.email || '',
        payerId: billingDetails?.payerId || ''
      };
    } catch (error) {
      console.error('PayPal create payment method error:', error);
      throw {
        message: 'Failed to create PayPal payment method',
        processorError: {
          code: error.details?.[0]?.issue || 'invalid_request',
          message: error.details?.[0]?.description || error.message
        }
      };
    }
  }

  /**
   * Delete a payment method
   * @param {string} paymentMethodId - Payment method ID to delete
   * @returns {Promise<Object>} - Deletion result
   */
  async deletePaymentMethod(paymentMethodId) {
    // PayPal doesn't have a separate payment method deletion API
    // Tokens are managed on PayPal's side
    return { deleted: true };
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

      // Create refund request
      const refundRequest = new paypal.payments.CapturesRefundRequest(transactionId);

      // Add amount if specified
      if (amount) {
        refundRequest.requestBody({
          amount: {
            value: amount.toFixed(2),
            currency_code: metadata.currency || 'USD'
          },
          note_to_payer: reason || 'Refund for Expert Chat services'
        });
      } else {
        // Full refund
        refundRequest.requestBody({
          note_to_payer: reason || 'Refund for Expert Chat services'
        });
      }

      // Execute refund
      const refundResponse = await this.client.execute(refundRequest);

      if (refundResponse.statusCode !== 201) {
        throw new Error(`PayPal refund failed: ${refundResponse.statusCode}`);
      }

      const result = refundResponse.result;

      return {
        id: result.id,
        status: result.status === 'COMPLETED' ? 'succeeded' : 'pending',
        amount: parseFloat(result.amount.value),
        currency: result.amount.currency_code,
        processorResponse: result
      };
    } catch (error) {
      console.error('PayPal refund error:', error);
      throw {
        message: 'PayPal refund failed',
        processorError: {
          code: error.details?.[0]?.issue || 'refund_error',
          message: error.details?.[0]?.description || error.message,
          paypalDebugId: error.debug_id
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
        successUrl = `${process.env.APP_URL}/checkout/success`,
        cancelUrl = `${process.env.APP_URL}/checkout/cancel`,
        metadata = {}
      } = options;

      if (!items || items.length === 0) {
        throw new Error('Items are required for checkout');
      }

      // Calculate total amount from items
      const amount = items.reduce((total, item) => {
        return total + (item.price * (item.quantity || 1));
      }, 0);

      // Create order request
      const orderRequest = new paypal.orders.OrdersCreateRequest();
      orderRequest.prefer('return=representation');

      // Format purchase units from items
      const purchaseUnits = [{
        amount: {
          currency_code: currency.toUpperCase(),
          value: amount.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: currency.toUpperCase(),
              value: amount.toFixed(2)
            }
          }
        },
        items: items.map(item => ({
          name: item.name,
          quantity: item.quantity || 1,
          unit_amount: {
            currency_code: currency.toUpperCase(),
            value: item.price.toFixed(2)
          }
        })),
        description: 'Expert Chat services'
      }];

      // Set request body
      orderRequest.requestBody({
        intent: 'CAPTURE',
        purchase_units: purchaseUnits,
        application_context: {
          brand_name: 'Expert Chat',
          landing_page: 'BILLING',
          shipping_preference: 'NO_SHIPPING',
          user_action: 'PAY_NOW',
          return_url: successUrl,
          cancel_url: cancelUrl
        },
        custom_id: userId || ''
      });

      // Create order
      const orderResponse = await this.client.execute(orderRequest);

      if (orderResponse.statusCode !== 201) {
        throw new Error(`PayPal order creation failed: ${orderResponse.statusCode}`);
      }

      const result = orderResponse.result;

      // Get approval URL for client
      const approvalUrl = result.links.find(link => link.rel === 'approve').href;

      return {
        id: result.id,
        redirectUrl: approvalUrl,
        clientSecret: result.id, // PayPal doesn't have a client secret, but use the order ID
        amount: amount,
        currency: currency,
        processor: 'paypal'
      };
    } catch (error) {
      console.error('PayPal checkout session error:', error);
      throw {
        message: 'PayPal checkout session creation failed',
        processorError: {
          code: error.details?.[0]?.issue || 'checkout_error',
          message: error.details?.[0]?.description || error.message,
          paypalDebugId: error.debug_id
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
      // Get order details
      const request = new paypal.orders.OrdersGetRequest(checkoutId);
      const response = await this.client.execute(request);

      if (response.statusCode !== 200) {
        throw new Error(`PayPal order status check failed: ${response.statusCode}`);
      }

      const result = response.result;

      // Determine status
      let status = 'pending';
      if (result.status === 'COMPLETED') {
        status = 'completed';
      } else if (result.status === 'APPROVED') {
        status = 'pending';
      } else if (result.status === 'VOIDED' || result.status === 'CANCELLED') {
        status = 'cancelled';
      }

      return {
        status,
        orderId: result.id,
        transactionId: result.purchase_units[0]?.payments?.captures?.[0]?.id
      };
    } catch (error) {
      console.error('PayPal checkout status error:', error);
      throw {
        message: 'Failed to get checkout status',
        processorError: {
          code: error.details?.[0]?.issue || 'status_check_error',
          message: error.details?.[0]?.description || error.message,
          paypalDebugId: error.debug_id
        }
      };
    }
  }

  /**
   * Complete a checkout (after user returns from PayPal)
   * @param {Object} options - Options for completing checkout
   * @returns {Promise<Object>} - Completion result
   */
  async completeCheckout(options) {
    try {
      const { checkoutId } = options;

      if (!checkoutId) {
        throw new Error('Checkout ID is required');
      }

      // Capture the order
      const captureRequest = new paypal.orders.OrdersCaptureRequest(checkoutId);
      captureRequest.requestBody({});

      const captureResponse = await this.client.execute(captureRequest);

      if (captureResponse.statusCode !== 201) {
        throw new Error(`PayPal order capture failed: ${captureResponse.statusCode}`);
      }

      const result = captureResponse.result;
      const capture = result.purchase_units[0].payments.captures[0];

      return {
        success: true,
        transactionId: capture.id,
        orderId: result.id,
        amount: parseFloat(capture.amount.value),
        currency: capture.amount.currency_code,
        status: capture.status === 'COMPLETED' ? 'succeeded' : 'pending'
      };
    } catch (error) {
      console.error('PayPal complete checkout error:', error);
      throw {
        message: 'Failed to complete checkout',
        processorError: {
          code: error.details?.[0]?.issue || 'capture_error',
          message: error.details?.[0]?.description || error.message,
          paypalDebugId: error.debug_id
        }
      };
    }
  }
}

export default PayPalProcessor;
