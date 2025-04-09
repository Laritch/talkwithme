/**
 * Enhanced Payment Service
 *
 * Integrates with Stripe and PayPal for payment processing and connects
 * with the loyalty system.
 */
import dotenv from 'dotenv';
import Stripe from 'stripe';
import axios from 'axios';
import Order from '../models/orderModel.js';
import { CustomerLoyalty } from '../models/loyaltyModel.js';
import * as loyaltyService from './loyaltyService.js';

dotenv.config();

// Initialize payment processors
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

// PayPal configuration
const PAYPAL_BASE_URL = process.env.PAYPAL_SANDBOX ?
  'https://api-m.sandbox.paypal.com' :
  'https://api-m.paypal.com';
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET = process.env.PAYPAL_SECRET;

// Payment status constants
const PAYMENT_STATUS = {
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  CAPTURED: 'captured',
  COMPLETED: 'completed',
  REFUNDED: 'refunded',
  DISPUTED: 'disputed',
  FAILED: 'failed'
};

/**
 * Commission rate configuration
 */
const COMMISSION_RATES = {
  default: 0.15, // 15%
  newExpert: 0.25,
  silverExpert: 0.18,
  goldExpert: 0.15,
  platinumExpert: 0.10,
  bundle: 0.12,
  subscriptionDiscount: 0.05 // 5% discount for subscribers
};

/**
 * Calculate commission rate based on payment type and loyalty tiers
 * @param {string} paymentType - Type of payment
 * @param {string} expertTier - Expert's loyalty tier
 * @param {boolean} isSubscriber - Whether the client has a subscription
 * @returns {number} - Calculated commission rate
 */
const calculateCommissionRate = (paymentType, expertTier, isSubscriber = false) => {
  let baseRate = COMMISSION_RATES.default;

  // Adjust based on payment type
  if (paymentType === 'bundle') {
    baseRate = COMMISSION_RATES.bundle;
  }

  // Adjust based on expert tier
  if (expertTier) {
    switch (expertTier.toLowerCase()) {
      case 'platinum':
        baseRate = COMMISSION_RATES.platinumExpert;
        break;
      case 'gold':
        baseRate = COMMISSION_RATES.goldExpert;
        break;
      case 'silver':
        baseRate = COMMISSION_RATES.silverExpert;
        break;
      case 'new':
        baseRate = COMMISSION_RATES.newExpert;
        break;
    }
  }

  // Apply subscriber discount if applicable
  if (isSubscriber) {
    baseRate -= COMMISSION_RATES.subscriptionDiscount;
  }

  // Ensure commission is never negative
  return Math.max(0, baseRate);
};

/**
 * Get PayPal access token
 * @returns {Promise<string>} PayPal access token
 */
const getPayPalAccessToken = async () => {
  try {
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
    const response = await axios({
      method: 'post',
      url: `${PAYPAL_BASE_URL}/v1/oauth2/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      data: 'grant_type=client_credentials'
    });

    return response.data.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    throw new Error('Failed to authenticate with PayPal');
  }
};

/**
 * Create a payment intent with Stripe
 * @param {Object} orderData - Order data including amount, currency, customer info
 * @returns {Object} Stripe payment intent object
 */
export const createStripePaymentIntent = async (orderData) => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(orderData.amount * 100), // Stripe requires amount in cents
      currency: orderData.currency || 'usd',
      metadata: {
        orderId: orderData.orderId,
        userId: orderData.userId.toString()
      },
      receipt_email: orderData.customer?.email
    });

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
      transactionId: paymentIntent.id
    };
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    return {
      success: false,
      message: `Payment processing failed: ${error.message}`
    };
  }
};

/**
 * Create a PayPal order
 * @param {Object} orderData - Order data including amount, currency, etc.
 * @returns {Object} PayPal order object
 */
export const createPayPalOrder = async (orderData) => {
  try {
    const accessToken = await getPayPalAccessToken();

    const payload = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: orderData.currency || 'USD',
          value: orderData.amount.toString()
        },
        reference_id: orderData.orderId,
        description: orderData.description || 'Order payment'
      }],
      application_context: {
        brand_name: 'Expert Chat System',
        landing_page: 'BILLING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.APP_URL}/api/ecommerce/paypal/capture`,
        cancel_url: `${process.env.APP_URL}/checkout`
      }
    };

    const response = await axios({
      method: 'post',
      url: `${PAYPAL_BASE_URL}/v2/checkout/orders`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      data: payload
    });

    return {
      success: true,
      orderId: response.data.id,
      status: response.data.status,
      links: response.data.links,
      approvalUrl: response.data.links.find(link => link.rel === 'approve').href,
      transactionId: response.data.id
    };
  } catch (error) {
    console.error('PayPal order creation error:', error);
    return {
      success: false,
      message: `PayPal payment processing failed: ${error.message}`
    };
  }
};

/**
 * Capture a PayPal payment
 * @param {string} orderId - PayPal order ID
 * @returns {Object} Capture result
 */
export const capturePayPalPayment = async (orderId) => {
  try {
    const accessToken = await getPayPalAccessToken();

    const response = await axios({
      method: 'post',
      url: `${PAYPAL_BASE_URL}/v2/checkout/orders/${orderId}/capture`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });

    return {
      success: true,
      captureId: response.data.purchase_units[0].payments.captures[0].id,
      status: response.data.status,
      transactionId: response.data.id
    };
  } catch (error) {
    console.error('PayPal payment capture error:', error);
    return {
      success: false,
      message: `Failed to capture PayPal payment: ${error.message}`
    };
  }
};

/**
 * Process payment using the appropriate payment processor
 * @param {Object} paymentDetails - Payment details
 * @returns {Object} Payment result
 */
export const processPayment = async (paymentDetails) => {
  try {
    const { paymentMethod, amount, currency, orderId, userId, customer } = paymentDetails;

    switch (paymentMethod) {
      case 'stripe':
      case 'credit_card':
        return await createStripePaymentIntent({
          amount,
          currency,
          orderId,
          userId,
          customer
        });

      case 'paypal':
        return await createPayPalOrder({
          amount,
          currency,
          orderId,
          description: `Order #${orderId}`,
          customer
        });

      default:
        // Simulate a successful payment for other methods
        return {
          success: true,
          transactionId: `manual_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          status: PAYMENT_STATUS.AUTHORIZED
        };
    }
  } catch (error) {
    console.error('Payment processing error:', error);
    return {
      success: false,
      message: error.message || 'Payment processing failed'
    };
  }
};

/**
 * Process a subscription payment
 * @param {Object} subscriptionDetails - Subscription details
 * @returns {Object} Subscription result
 */
export const processSubscription = async (subscriptionDetails) => {
  try {
    const { userId, planId, amount, interval, paymentMethod, paymentDetails } = subscriptionDetails;

    if (!userId || !planId || !amount || amount <= 0) {
      throw new Error('Invalid subscription details');
    }

    let subscriptionResult;

    // Create subscription with appropriate payment processor
    if (paymentMethod === 'stripe' || paymentMethod === 'credit_card') {
      if (!stripe) {
        throw new Error('Stripe is not configured');
      }

      // Create a customer if we don't have one yet
      let customerId = paymentDetails.customerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: paymentDetails.email,
          metadata: {
            userId: userId.toString()
          }
        });
        customerId = customer.id;
      }

      // Create the subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${planId} Subscription`,
            },
            unit_amount: Math.round(amount * 100),
            recurring: {
              interval: interval || 'month'
            }
          }
        }],
        metadata: {
          userId: userId.toString(),
          planId
        },
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent']
      });

      subscriptionResult = {
        success: true,
        subscriptionId: subscription.id,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret,
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      };
    } else if (paymentMethod === 'paypal') {
      // For PayPal subscriptions - in a real implementation, this would use PayPal's subscription API
      // This is a simplified version
      subscriptionResult = {
        success: true,
        subscriptionId: `paypal_sub_${Date.now()}`,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + (interval === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000)
      };
    } else {
      // Generic subscription
      subscriptionResult = {
        success: true,
        subscriptionId: `manual_sub_${Date.now()}`,
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + (interval === 'year' ? 365 : 30) * 24 * 60 * 60 * 1000)
      };
    }

    // Store subscription in your database
    // This would be implemented based on your data model

    return subscriptionResult;
  } catch (error) {
    console.error('Subscription processing error:', error);
    return {
      success: false,
      message: error.message || 'Subscription processing failed'
    };
  }
};

/**
 * Process a refund
 * @param {string} orderId - Order ID
 * @param {Object} refundOptions - Refund options
 * @returns {Object} Refund result
 */
export const processRefund = async (orderId, refundOptions = {}) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (!['completed', 'delivered', 'shipped', 'processing'].includes(order.status)) {
      throw new Error(`Cannot refund order with status: ${order.status}`);
    }

    let refundResult;

    // Process refund through appropriate payment processor
    if (order.paymentMethod === 'stripe' || order.paymentMethod === 'credit_card') {
      if (!stripe) {
        throw new Error('Stripe is not configured');
      }

      const refundAmount = refundOptions.amount
        ? Math.round(refundOptions.amount * 100)
        : Math.round(order.totalAmount * 100);

      const refund = await stripe.refunds.create({
        payment_intent: order.paymentDetails.transactionId,
        amount: refundAmount,
        reason: refundOptions.reason || 'requested_by_customer'
      });

      refundResult = {
        success: true,
        refundId: refund.id,
        amount: refundAmount / 100
      };
    } else if (order.paymentMethod === 'paypal') {
      // For PayPal refunds - in real implementation this would use PayPal's refund API
      // This is a simplified version
      refundResult = {
        success: true,
        refundId: `paypal_refund_${Date.now()}`,
        amount: refundOptions.amount || order.totalAmount
      };
    } else {
      // Generic refund
      refundResult = {
        success: true,
        refundId: `manual_refund_${Date.now()}`,
        amount: refundOptions.amount || order.totalAmount
      };
    }

    // Update order status
    order.status = 'refunded';
    order.paymentStatus = 'refunded';
    order.notes = order.notes
      ? `${order.notes}\nRefund processed: ${refundOptions.reason || 'Customer request'}`
      : `Refund processed: ${refundOptions.reason || 'Customer request'}`;

    await order.save();

    // Handle loyalty points reversal
    if (order.loyaltyPointsEarned) {
      try {
        const loyaltyProfile = await CustomerLoyalty.findOne({ userId: order.userId });

        if (loyaltyProfile) {
          // Calculate the percentage of order being refunded
          const refundPercentage = refundOptions.amount ?
            Math.min(1, refundOptions.amount / order.totalAmount) : 1;

          // Calculate points to deduct
          const pointsToDeduct = Math.floor(order.loyaltyPointsEarned * refundPercentage);

          if (pointsToDeduct > 0) {
            await loyaltyService.addPoints(
              order.userId,
              -pointsToDeduct,
              `Refund adjustment for order #${order._id}`,
              refundResult.refundId
            );
          }
        }
      } catch (loyaltyError) {
        console.error('Error processing loyalty points for refund:', loyaltyError);
        // Don't fail the refund if loyalty processing fails
      }
    }

    return {
      success: true,
      refund: refundResult,
      order
    };
  } catch (error) {
    console.error('Refund processing error:', error);
    return {
      success: false,
      message: error.message || 'Refund processing failed'
    };
  }
};

/**
 * Create a dispute for a transaction
 * @param {string} orderId - Order ID
 * @param {Object} disputeDetails - Dispute information
 * @returns {Object} Dispute result
 */
export const createDispute = async (orderId, disputeDetails) => {
  try {
    const { reason, evidence, userId } = disputeDetails;

    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // Verify user owns the order
    if (order.userId.toString() !== userId.toString()) {
      throw new Error('Unauthorized to dispute this order');
    }

    // Check if dispute is within window (e.g., 30 days)
    const disputeWindowDays = 30;
    const orderDate = order.createdAt;
    const currentDate = new Date();
    const daysSinceOrder = (currentDate - orderDate) / (1000 * 60 * 60 * 24);

    if (daysSinceOrder > disputeWindowDays) {
      throw new Error(`Dispute window has expired (${disputeWindowDays} days)`);
    }

    // Create dispute record
    const disputeId = `disp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

    // Update order with dispute details
    order.status = 'disputed';
    order.paymentStatus = 'disputed';
    order.dispute = {
      id: disputeId,
      reason,
      evidence,
      status: 'pending',
      createdAt: new Date()
    };

    await order.save();

    return {
      success: true,
      disputeId,
      orderId,
      status: 'pending'
    };
  } catch (error) {
    console.error('Dispute creation error:', error);
    return {
      success: false,
      message: error.message || 'Failed to create dispute'
    };
  }
};

/**
 * Resolve a dispute
 * @param {string} orderId - Order ID
 * @param {string} resolution - Resolution decision ('customer' or 'merchant')
 * @param {string} notes - Resolution notes
 * @returns {Object} Resolution result
 */
export const resolveDispute = async (orderId, resolution, notes = '') => {
  try {
    const order = await Order.findById(orderId);

    if (!order || !order.dispute) {
      throw new Error('Dispute not found');
    }

    if (order.dispute.status !== 'pending') {
      throw new Error('Dispute has already been resolved');
    }

    // Update dispute status
    order.dispute.status = 'resolved';
    order.dispute.resolution = resolution;
    order.dispute.resolutionNotes = notes;
    order.dispute.resolvedAt = new Date();

    // Handle resolution outcomes
    if (resolution === 'customer') {
      // Process refund if in favor of customer
      const refundResult = await processRefund(orderId, {
        reason: 'dispute_resolved'
      });

      if (!refundResult.success) {
        throw new Error(refundResult.message || 'Failed to process refund for dispute');
      }
    } else {
      // In favor of merchant - update order status
      order.status = 'completed';
      order.paymentStatus = 'completed';
    }

    await order.save();

    return {
      success: true,
      disputeId: order.dispute.id,
      resolution,
      status: order.status
    };
  } catch (error) {
    console.error('Dispute resolution error:', error);
    return {
      success: false,
      message: error.message || 'Failed to resolve dispute'
    };
  }
};

/**
 * Calculate loyalty points for a transaction
 * @param {Object} transaction - Transaction details
 * @param {Object} clientLoyaltyInfo - Client's loyalty information
 * @returns {number} - Points to award
 */
export const calculateLoyaltyPoints = (transaction, clientLoyaltyInfo) => {
  // Get configuration from loyalty service
  const { POINTS_CONFIG } = loyaltyService;

  // Base points calculation
  const basePoints = Math.floor(transaction.amount * POINTS_CONFIG.pointsPerDollar);

  // Get multiplier based on transaction type
  let multiplier = 1.0;
  switch (transaction.paymentType) {
    case 'service':
      multiplier = 1.2; // 20% bonus for services
      break;
    case 'bundle':
      multiplier = 1.5; // 50% bonus for bundles
      break;
    case 'subscription':
      multiplier = 2.0; // 100% bonus for subscriptions
      break;
  }

  // Apply tier multiplier if available
  if (clientLoyaltyInfo && clientLoyaltyInfo.tier) {
    multiplier *= POINTS_CONFIG.tierMultipliers[clientLoyaltyInfo.tier] || 1.0;
  }

  // Calculate final points
  return Math.floor(basePoints * multiplier);
};

export default {
  processPayment,
  processSubscription,
  processRefund,
  createDispute,
  resolveDispute,
  calculateLoyaltyPoints,
  calculateCommissionRate,
  PAYMENT_STATUS,
  COMMISSION_RATES
};
