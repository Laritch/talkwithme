/**
 * Stripe Payment Processor
 *
 * Implements Stripe payment processing functionality
 * for handling credit and debit card payments
 */

import Stripe from 'stripe';
import { getEnvVar } from '../../../utils/configUtils.js';
import * as paymentUtils from '../../../utils/paymentUtils.js';

class StripeProcessor {
  constructor() {
    this._initializeStripeClient();
  }

  /**
   * Initialize Stripe client
   * @private
   */
  _initializeStripeClient() {
    try {
      const apiKey = getEnvVar('STRIPE_SECRET_KEY');
      this.client = new Stripe(apiKey, {
        apiVersion: '2023-10-16',
        maxNetworkRetries: 3
      });
    } catch (error) {
      console.error('Error initializing Stripe client:', error);
      throw new Error('Failed to initialize Stripe client');
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

      // Create a payment intent
      const paymentIntent = await this.client.paymentIntents.create({
        amount: Math.round(amount * 100), // Stripe requires amount in cents
        currency: currency.toLowerCase(),
        payment_method: paymentMethodId,
        description: description || 'Payment for Expert Chat services',
        confirm: true,
        metadata: {
          userId: metadata.userId || '',
          source: metadata.source || 'api'
        }
      });

      // Process the result
      return {
        id: paymentIntent.id,
        status: paymentIntent.status === 'succeeded' ? 'succeeded' : 'pending',
        amount: paymentIntent.amount / 100, // Convert back to dollars
        currency: paymentIntent.currency,
        processorResponse: {
          chargeId: paymentIntent.latest_charge,
          paymentMethodId: paymentIntent.payment_method
        }
      };
    } catch (error) {
      console.error('Stripe payment processing error:', error);

      // Format error for consistent handling
      throw {
        message: 'Stripe payment processing failed',
        processorError: {
          code: error.code || 'processing_error',
          message: error.message,
          stripeErrorType: error.type
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

      // If token is already a payment method, just verify it
      if (paymentToken.startsWith('pm_')) {
        const paymentMethod = await this.client.paymentMethods.retrieve(paymentToken);

        return {
          id: paymentMethod.id,
          type: paymentMethod.type,
          brand: paymentMethod.card?.brand || 'unknown',
          last4: paymentMethod.card?.last4 || '****',
          expiryMonth: paymentMethod.card?.exp_month,
          expiryYear: paymentMethod.card?.exp_year
        };
      }

      // Create payment method from token
      const paymentMethod = await this.client.paymentMethods.create({
        type: type || 'card',
        card: {
          token: paymentToken
        },
        billing_details: billingDetails ? {
          name: billingDetails.name,
          email: billingDetails.email,
          phone: billingDetails.phone,
          address: billingDetails.address ? {
            line1: billingDetails.address.line1,
            line2: billingDetails.address.line2,
            city: billingDetails.address.city,
            state: billingDetails.address.state,
            postal_code: billingDetails.address.postalCode,
            country: billingDetails.address.country
          } : undefined
        } : undefined
      });

      return {
        id: paymentMethod.id,
        type: paymentMethod.type,
        brand: paymentMethod.card?.brand || 'unknown',
        last4: paymentMethod.card?.last4 || '****',
        expiryMonth: paymentMethod.card?.exp_month,
        expiryYear: paymentMethod.card?.exp_year
      };
    } catch (error) {
      console.error('Stripe create payment method error:', error);
      throw {
        message: 'Failed to create Stripe payment method',
        processorError: {
          code: error.code || 'invalid_request',
          message: error.message
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
    try {
      const paymentMethod = await this.client.paymentMethods.detach(paymentMethodId);
      return { deleted: true };
    } catch (error) {
      console.error('Stripe delete payment method error:', error);
      throw {
        message: 'Failed to delete Stripe payment method',
        processorError: {
          code: error.code || 'invalid_request',
          message: error.message
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

      const refundParams = {
        payment_intent: transactionId,
        metadata: {
          ...metadata,
          reason: reason || 'customer_requested'
        }
      };

      // Add amount if specified (partial refund)
      if (amount) {
        refundParams.amount = Math.round(amount * 100); // Stripe requires amount in cents
      }

      // Execute refund
      const refund = await this.client.refunds.create(refundParams);

      return {
        id: refund.id,
        status: refund.status === 'succeeded' ? 'succeeded' : 'pending',
        amount: refund.amount / 100, // Convert back to dollars
        currency: refund.currency,
        processorResponse: refund
      };
    } catch (error) {
      console.error('Stripe refund error:', error);
      throw {
        message: 'Stripe refund failed',
        processorError: {
          code: error.code || 'refund_error',
          message: error.message
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
        paymentMethodId,
        successUrl = `${process.env.APP_URL}/checkout/success`,
        cancelUrl = `${process.env.APP_URL}/checkout/cancel`,
        couponCode,
        metadata = {}
      } = options;

      if (!items || items.length === 0) {
        throw new Error('Items are required for checkout');
      }

      // Create line items for Stripe
      const lineItems = items.map(item => ({
        price_data: {
          currency: currency.toLowerCase(),
          product_data: {
            name: item.name,
            description: item.description,
            images: item.images || []
          },
          unit_amount: Math.round(item.price * 100) // Stripe requires amount in cents
        },
        quantity: item.quantity || 1
      }));

      // Create the session
      const session = await this.client.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: metadata.email,
        client_reference_id: userId,
        metadata: {
          userId,
          source: metadata.source || 'api',
          couponCode: couponCode || ''
        }
      });

      return {
        id: session.id,
        redirectUrl: session.url,
        clientSecret: session.client_secret,
        amount: session.amount_total / 100, // Convert back to dollars
        currency: session.currency
      };
    } catch (error) {
      console.error('Stripe checkout error:', error);
      throw {
        message: 'Stripe checkout creation failed',
        processorError: {
          code: error.code || 'checkout_error',
          message: error.message
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
    try {
      const session = await this.client.checkout.sessions.retrieve(sessionId);

      let status = 'pending';
      if (session.payment_status === 'paid') {
        status = 'completed';
      } else if (session.status === 'expired' || session.status === 'canceled') {
        status = 'cancelled';
      }

      return {
        status,
        transactionId: session.payment_intent,
        orderId: session.client_reference_id
      };
    } catch (error) {
      console.error('Error getting Stripe checkout status:', error);
      throw error;
    }
  }

  /**
   * Complete a checkout (for redirect-based flows)
   * @param {Object} options - Completion options
   * @returns {Promise<Object>} - Completion result
   */
  async completeCheckout(options) {
    try {
      const { checkoutId, additionalData = {} } = options;

      const session = await this.client.checkout.sessions.retrieve(checkoutId);

      if (session.payment_status !== 'paid') {
        throw new Error('Payment has not been completed');
      }

      return {
        success: true,
        transactionId: session.payment_intent,
        status: 'completed',
        amount: session.amount_total / 100,
        currency: session.currency,
        customerId: session.customer,
        paymentMethodId: session.payment_method
      };
    } catch (error) {
      console.error('Error completing Stripe checkout:', error);
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
      const { email, name, metadata = {} } = options;

      if (!email) {
        throw new Error('Email is required for customer creation');
      }

      const customer = await this.client.customers.create({
        email,
        name,
        metadata
      });

      return {
        id: customer.id,
        email: customer.email,
        name: customer.name
      };
    } catch (error) {
      console.error('Stripe create customer error:', error);
      throw {
        message: 'Failed to create Stripe customer',
        processorError: {
          code: error.code || 'invalid_request',
          message: error.message
        }
      };
    }
  }

  /**
   * Create a subscription
   * @param {Object} options - Subscription options
   * @returns {Promise<Object>} - Subscription details
   */
  async createSubscription(options) {
    try {
      const {
        customerId,
        paymentMethodId,
        planId,
        amount,
        currency,
        interval,
        trialDays = 0,
        metadata = {}
      } = options;

      if (!customerId || !paymentMethodId) {
        throw new Error('Customer ID and payment method ID are required');
      }

      // Ensure the payment method is attached to the customer
      await this.client.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      // Set as default payment method
      await this.client.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Check if product exists or create it
      let productId;
      try {
        const product = await this.client.products.retrieve(planId);
        productId = product.id;
      } catch (error) {
        // Create a new product
        const newProduct = await this.client.products.create({
          id: planId,
          name: metadata.planName || 'Subscription Plan',
          metadata: {
            planId,
            source: 'subscription_service'
          }
        });
        productId = newProduct.id;
      }

      // Check if price exists or create it
      let priceId;
      try {
        // Search for a matching price
        const prices = await this.client.prices.list({
          product: productId,
          active: true,
          limit: 100
        });

        const matchingPrice = prices.data.find(price =>
          price.unit_amount === Math.round(amount * 100) &&
          price.currency === currency.toLowerCase() &&
          price.recurring?.interval === interval
        );

        if (matchingPrice) {
          priceId = matchingPrice.id;
        } else {
          throw new Error('No matching price found');
        }
      } catch (error) {
        // Create a new price
        const newPrice = await this.client.prices.create({
          product: productId,
          unit_amount: Math.round(amount * 100),
          currency: currency.toLowerCase(),
          recurring: {
            interval: interval || 'month'
          },
          metadata: {
            planId,
            source: 'subscription_service'
          }
        });
        priceId = newPrice.id;
      }

      // Create subscription
      const subscriptionData = {
        customer: customerId,
        items: [{ price: priceId }],
        metadata: {
          ...metadata,
          source: 'subscription_service'
        },
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent']
      };

      // Add trial if specified
      if (trialDays > 0) {
        subscriptionData.trial_period_days = trialDays;
      }

      const subscription = await this.client.subscriptions.create(subscriptionData);

      return {
        id: subscription.id,
        status: subscription.status,
        customerId,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      };
    } catch (error) {
      console.error('Stripe create subscription error:', error);
      throw {
        message: 'Failed to create Stripe subscription',
        processorError: {
          code: error.code || 'subscription_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Update a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} options - Update options
   * @returns {Promise<Object>} - Updated subscription details
   */
  async updateSubscription(subscriptionId, options) {
    try {
      const { planId, amount, currency, interval } = options;

      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      // Get current subscription
      const currentSubscription = await this.client.subscriptions.retrieve(subscriptionId);

      let updateParams = {};
      let needsPriceUpdate = false;

      // If we're changing the price (amount, currency, interval)
      if (amount || currency || interval) {
        needsPriceUpdate = true;

        // Get the current product
        const currentItem = currentSubscription.items.data[0];
        const currentPrice = await this.client.prices.retrieve(currentItem.price.id);
        const productId = currentPrice.product;

        // Try to find an existing price that matches the new criteria
        let newPriceId;
        try {
          const prices = await this.client.prices.list({
            product: productId,
            active: true,
            limit: 100
          });

          const matchingPrice = prices.data.find(price =>
            price.unit_amount === Math.round((amount || currentPrice.unit_amount / 100) * 100) &&
            price.currency === (currency || currentPrice.currency).toLowerCase() &&
            price.recurring?.interval === (interval || currentPrice.recurring.interval)
          );

          if (matchingPrice) {
            newPriceId = matchingPrice.id;
          } else {
            throw new Error('No matching price found');
          }
        } catch (error) {
          // Create a new price
          const newPrice = await this.client.prices.create({
            product: productId,
            unit_amount: Math.round((amount || currentPrice.unit_amount / 100) * 100),
            currency: (currency || currentPrice.currency).toLowerCase(),
            recurring: {
              interval: interval || currentPrice.recurring.interval
            },
            metadata: {
              source: 'subscription_service'
            }
          });
          newPriceId = newPrice.id;
        }

        // Update the subscription with the new price
        updateParams.items = [{
          id: currentItem.id,
          price: newPriceId
        }];
      }

      // If plan ID changed (but not amount/currency/interval), update metadata
      if (planId && !needsPriceUpdate) {
        updateParams.metadata = {
          ...currentSubscription.metadata,
          planId
        };
      }

      // Only update if we have changes
      if (Object.keys(updateParams).length === 0) {
        return {
          id: currentSubscription.id,
          status: currentSubscription.status,
          currentPeriodStart: new Date(currentSubscription.current_period_start * 1000),
          currentPeriodEnd: new Date(currentSubscription.current_period_end * 1000),
          cancelAtPeriodEnd: currentSubscription.cancel_at_period_end
        };
      }

      // Update the subscription
      const updatedSubscription = await this.client.subscriptions.update(
        subscriptionId,
        updateParams
      );

      return {
        id: updatedSubscription.id,
        status: updatedSubscription.status,
        currentPeriodStart: new Date(updatedSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(updatedSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: updatedSubscription.cancel_at_period_end
      };
    } catch (error) {
      console.error('Stripe update subscription error:', error);
      throw {
        message: 'Failed to update Stripe subscription',
        processorError: {
          code: error.code || 'subscription_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {Object} options - Cancellation options
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelSubscription(subscriptionId, options = {}) {
    try {
      const { immediate = false } = options;

      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      let cancellation;

      if (immediate) {
        // Cancel immediately
        cancellation = await this.client.subscriptions.cancel(subscriptionId);
      } else {
        // Cancel at period end
        cancellation = await this.client.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true
        });
      }

      return {
        id: cancellation.id,
        status: cancellation.status,
        cancelAtPeriodEnd: cancellation.cancel_at_period_end,
        cancelAt: cancellation.cancel_at ? new Date(cancellation.cancel_at * 1000) : null
      };
    } catch (error) {
      console.error('Stripe cancel subscription error:', error);
      throw {
        message: 'Failed to cancel Stripe subscription',
        processorError: {
          code: error.code || 'subscription_error',
          message: error.message
        }
      };
    }
  }

  /**
   * Get a subscription
   * @param {string} subscriptionId - Subscription ID
   * @returns {Promise<Object>} - Subscription details
   */
  async getSubscription(subscriptionId) {
    try {
      if (!subscriptionId) {
        throw new Error('Subscription ID is required');
      }

      const subscription = await this.client.subscriptions.retrieve(subscriptionId, {
        expand: ['customer', 'default_payment_method']
      });

      return {
        id: subscription.id,
        status: subscription.status,
        customerId: subscription.customer.id,
        currentPeriodStart: new Date(subscription.current_period_start * 1000),
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        cancelAt: subscription.cancel_at ? new Date(subscription.cancel_at * 1000) : null,
        defaultPaymentMethod: subscription.default_payment_method?.id || null
      };
    } catch (error) {
      console.error('Stripe get subscription error:', error);
      throw {
        message: 'Failed to get Stripe subscription',
        processorError: {
          code: error.code || 'subscription_error',
          message: error.message
        }
      };
    }
  }
}

export default StripeProcessor;
