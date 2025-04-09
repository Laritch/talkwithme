/**
 * Subscription Service
 *
 * Handles subscription creation, management, and recurring billing
 * for credit card payments and other payment methods.
 */

import Subscription from '../models/subscriptionModel.js';
import User from '../models/userModel.js';
import PaymentMethod from '../models/paymentMethodModel.js';
import Transaction from '../models/transactionModel.js';
import PaymentFactory from './payment/paymentFactory.js';
import { getEnvVar } from '../utils/configUtils.js';
import EmailNotificationService from './emailNotificationService.js';
import LoyaltyService from './loyaltyService.js';

class SubscriptionService {
  constructor() {
    this.emailService = new EmailNotificationService();
    this.loyaltyService = new LoyaltyService();
  }

  /**
   * Create a new subscription
   * @param {Object} options - Subscription options
   * @returns {Promise<Object>} - Subscription details
   */
  async createSubscription(options) {
    const {
      userId,
      planId,
      planName,
      amount,
      currency = 'USD',
      interval = 'month',
      processorName,
      paymentMethodId,
      trialDays = 0,
      metadata = {}
    } = options;

    try {
      // Validate input
      if (!userId || !planId || !planName || !amount || !processorName || !paymentMethodId) {
        throw new Error('Missing required subscription parameters');
      }

      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get payment method
      const paymentMethod = await PaymentMethod.findOne({
        _id: paymentMethodId,
        userId
      });

      if (!paymentMethod) {
        throw new Error('Payment method not found');
      }

      // Get payment processor
      const processor = PaymentFactory.createProcessor(processorName);
      if (!processor) {
        throw new Error(`Payment processor ${processorName} not supported`);
      }

      // Calculate trial dates if applicable
      const now = new Date();
      let trialStart, trialEnd, currentPeriodStart, currentPeriodEnd;

      if (trialDays > 0) {
        trialStart = now;
        trialEnd = new Date(now.getTime() + (trialDays * 24 * 60 * 60 * 1000));
        currentPeriodStart = trialStart;
        currentPeriodEnd = trialEnd;
      } else {
        currentPeriodStart = now;
        currentPeriodEnd = this.calculateNextBillingDate(now, interval);
      }

      // Create subscription with processor
      const processorSubscription = await processor.createSubscription({
        customerId: user.processorCustomerId || await this.getOrCreateCustomerId(user, processorName),
        paymentMethodId: paymentMethod.processorPaymentId,
        planId,
        amount,
        currency,
        interval,
        trialDays,
        metadata: {
          userId: userId.toString(),
          planName,
          source: 'subscription_service'
        }
      });

      // Create subscription record in database
      const subscription = new Subscription({
        userId,
        planId,
        planName,
        status: trialDays > 0 ? 'trialing' : 'active',
        amount,
        currency,
        interval,
        currentPeriodStart,
        currentPeriodEnd,
        trialStart: trialDays > 0 ? trialStart : undefined,
        trialEnd: trialDays > 0 ? trialEnd : undefined,
        nextBillingDate: this.calculateNextBillingDate(currentPeriodEnd, interval),
        paymentDetails: {
          subscriptionId: processorSubscription.id,
          customerId: processorSubscription.customerId,
          paymentMethod: processorName
        },
        metadata
      });

      await subscription.save();

      // Send confirmation email
      await this.emailService.sendSubscriptionConfirmation(userId, {
        subscriptionId: subscription._id,
        planName,
        amount,
        interval,
        startDate: now,
        trialEnd: trialEnd || null,
        nextBillingDate: subscription.nextBillingDate
      });

      return {
        id: subscription._id,
        planId,
        planName,
        status: subscription.status,
        amount,
        currency,
        interval,
        currentPeriodStart,
        currentPeriodEnd,
        trialDays,
        nextBillingDate: subscription.nextBillingDate,
        processorSubscriptionId: processorSubscription.id
      };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  /**
   * Get subscription details
   * @param {string} subscriptionId - Subscription ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} - Subscription details
   */
  async getSubscription(subscriptionId, userId) {
    try {
      const subscription = await Subscription.findOne({
        _id: subscriptionId,
        userId
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Get invoice history
      const invoices = subscription.invoices || [];

      // Return subscription details
      return {
        id: subscription._id,
        planId: subscription.planId,
        planName: subscription.planName,
        status: subscription.status,
        amount: subscription.amount,
        currency: subscription.currency,
        interval: subscription.interval,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        canceledAt: subscription.canceledAt,
        trialStart: subscription.trialStart,
        trialEnd: subscription.trialEnd,
        lastPaymentDate: subscription.lastPaymentDate,
        nextBillingDate: subscription.nextBillingDate,
        invoices: invoices.map(invoice => ({
          id: invoice.invoiceId,
          amount: invoice.amount,
          date: invoice.date,
          status: invoice.status
        }))
      };
    } catch (error) {
      console.error('Error getting subscription:', error);
      throw error;
    }
  }

  /**
   * Get all subscriptions for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} - Array of subscription details
   */
  async getUserSubscriptions(userId) {
    try {
      const subscriptions = await Subscription.find({
        userId
      }).sort({ createdAt: -1 });

      return subscriptions.map(subscription => ({
        id: subscription._id,
        planId: subscription.planId,
        planName: subscription.planName,
        status: subscription.status,
        amount: subscription.amount,
        currency: subscription.currency,
        interval: subscription.interval,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        nextBillingDate: subscription.nextBillingDate,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
      }));
    } catch (error) {
      console.error('Error getting user subscriptions:', error);
      throw error;
    }
  }

  /**
   * Update subscription plan
   * @param {string} subscriptionId - Subscription ID
   * @param {string} userId - User ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} - Updated subscription
   */
  async updateSubscription(subscriptionId, userId, updateData) {
    const { planId, planName, amount, currency, interval } = updateData;

    try {
      // Get subscription
      const subscription = await Subscription.findOne({
        _id: subscriptionId,
        userId
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      // Get payment processor
      const processor = PaymentFactory.createProcessor(subscription.paymentDetails.paymentMethod);

      if (!processor) {
        throw new Error(`Payment processor ${subscription.paymentDetails.paymentMethod} not supported`);
      }

      // Update with processor
      const processorSubscription = await processor.updateSubscription(
        subscription.paymentDetails.subscriptionId,
        {
          planId: planId || subscription.planId,
          amount: amount || subscription.amount,
          currency: currency || subscription.currency,
          interval: interval || subscription.interval
        }
      );

      // Update local subscription
      subscription.planId = planId || subscription.planId;
      subscription.planName = planName || subscription.planName;
      subscription.amount = amount || subscription.amount;
      subscription.currency = currency || subscription.currency;
      subscription.interval = interval || subscription.interval;

      // Recalculate next billing date if interval changed
      if (interval && interval !== subscription.interval) {
        subscription.nextBillingDate = this.calculateNextBillingDate(
          subscription.currentPeriodEnd,
          interval
        );
      }

      await subscription.save();

      // Send update email
      await this.emailService.sendSubscriptionUpdated(userId, {
        subscriptionId: subscription._id,
        planName: subscription.planName,
        amount: subscription.amount,
        interval: subscription.interval,
        nextBillingDate: subscription.nextBillingDate,
        changes: Object.keys(updateData).join(', ')
      });

      return {
        id: subscription._id,
        planId: subscription.planId,
        planName: subscription.planName,
        status: subscription.status,
        amount: subscription.amount,
        currency: subscription.currency,
        interval: subscription.interval,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        nextBillingDate: subscription.nextBillingDate,
        processorSubscriptionId: processorSubscription.id
      };
    } catch (error) {
      console.error('Error updating subscription:', error);
      throw error;
    }
  }

  /**
   * Cancel a subscription
   * @param {string} subscriptionId - Subscription ID
   * @param {string} userId - User ID
   * @param {Object} options - Cancellation options
   * @returns {Promise<Object>} - Cancellation result
   */
  async cancelSubscription(subscriptionId, userId, options = {}) {
    const { immediate = false, reason = '' } = options;

    try {
      // Get subscription
      const subscription = await Subscription.findOne({
        _id: subscriptionId,
        userId
      });

      if (!subscription) {
        throw new Error('Subscription not found');
      }

      if (subscription.status === 'canceled') {
        return {
          id: subscription._id,
          status: 'canceled',
          message: 'Subscription already canceled'
        };
      }

      // Get payment processor
      const processor = PaymentFactory.createProcessor(subscription.paymentDetails.paymentMethod);

      if (!processor) {
        throw new Error(`Payment processor ${subscription.paymentDetails.paymentMethod} not supported`);
      }

      // Cancel with processor
      const cancelResult = await processor.cancelSubscription(
        subscription.paymentDetails.subscriptionId,
        { immediate }
      );

      // Update local subscription
      if (immediate) {
        subscription.status = 'canceled';
        subscription.canceledAt = new Date();
        subscription.cancelReason = reason;
      } else {
        subscription.cancelAtPeriodEnd = true;
        subscription.cancelReason = reason;
      }

      await subscription.save();

      // Send cancellation email
      await this.emailService.sendSubscriptionCanceled(userId, {
        subscriptionId: subscription._id,
        planName: subscription.planName,
        endDate: immediate ? new Date() : subscription.currentPeriodEnd,
        immediate,
        reason
      });

      return {
        id: subscription._id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        endDate: immediate ? new Date() : subscription.currentPeriodEnd,
        message: immediate ? 'Subscription canceled immediately' : 'Subscription will be canceled at the end of the billing period'
      };
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  /**
   * Process a subscription payment (typically called by webhook handlers)
   * @param {Object} paymentData - Payment data
   * @returns {Promise<Object>} - Processing result
   */
  async processSubscriptionPayment(paymentData) {
    const {
      subscriptionId,
      invoiceId,
      amount,
      status,
      processorName,
      paymentDate = new Date(),
      failureReason
    } = paymentData;

    try {
      // Find the subscription
      const subscription = await Subscription.findOne({
        'paymentDetails.subscriptionId': subscriptionId
      });

      if (!subscription) {
        throw new Error(`Subscription not found: ${subscriptionId}`);
      }

      // Check if we've already processed this invoice
      const existingInvoice = subscription.invoices.find(inv => inv.invoiceId === invoiceId);
      if (existingInvoice) {
        return {
          success: true,
          status: 'already_processed',
          subscriptionId: subscription._id,
          invoiceId
        };
      }

      // Create transaction record for successful payments
      let transaction;
      if (status === 'paid') {
        transaction = new Transaction({
          userId: subscription.userId,
          amount,
          currency: subscription.currency,
          status: 'succeeded',
          processor: processorName,
          processorTransactionId: invoiceId,
          description: `Subscription payment for ${subscription.planName}`,
          metadata: {
            subscriptionId: subscription._id.toString(),
            processorSubscriptionId: subscriptionId,
            invoiceId
          }
        });

        await transaction.save();

        // Process loyalty points
        await this.loyaltyService.processTransaction(transaction);
      }

      // Add invoice to subscription history
      subscription.invoices.push({
        invoiceId,
        amount,
        date: paymentDate,
        status: status === 'paid' ? 'paid' : 'failed',
        failureReason: status !== 'paid' ? failureReason : undefined
      });

      // Update subscription status
      if (status === 'paid') {
        subscription.status = 'active';
        subscription.lastPaymentDate = paymentDate;

        // Calculate next period dates
        subscription.currentPeriodStart = paymentDate;
        subscription.currentPeriodEnd = this.calculateNextBillingDate(paymentDate, subscription.interval);
        subscription.nextBillingDate = this.calculateNextBillingDate(subscription.currentPeriodEnd, subscription.interval);
      } else {
        subscription.status = 'past_due';
      }

      await subscription.save();

      // Send appropriate email notification
      if (status === 'paid') {
        await this.emailService.sendSubscriptionPaymentSuccess(subscription.userId, {
          subscriptionId: subscription._id,
          planName: subscription.planName,
          amount,
          date: paymentDate,
          nextBillingDate: subscription.nextBillingDate
        });
      } else {
        await this.emailService.sendSubscriptionPaymentFailed(subscription.userId, {
          subscriptionId: subscription._id,
          planName: subscription.planName,
          amount,
          date: paymentDate,
          reason: failureReason || 'Payment failed'
        });
      }

      return {
        success: true,
        status: status === 'paid' ? 'payment_succeeded' : 'payment_failed',
        subscriptionId: subscription._id,
        transactionId: transaction ? transaction._id : null,
        invoiceId
      };
    } catch (error) {
      console.error('Error processing subscription payment:', error);
      throw error;
    }
  }

  /**
   * Get or create a customer ID for a user with the specified processor
   * @param {Object} user - User object
   * @param {string} processorName - Payment processor name
   * @returns {Promise<string>} - Customer ID
   */
  async getOrCreateCustomerId(user, processorName) {
    try {
      // Check if user already has a customer ID for this processor
      if (user.processorCustomerId) {
        return user.processorCustomerId;
      }

      // Get payment processor
      const processor = PaymentFactory.createProcessor(processorName);
      if (!processor) {
        throw new Error(`Payment processor ${processorName} not supported`);
      }

      // Create customer with processor
      const customer = await processor.createCustomer({
        email: user.email,
        name: user.name || user.username,
        metadata: {
          userId: user._id.toString()
        }
      });

      // Update user with new customer ID
      user.processorCustomerId = customer.id;
      await user.save();

      return customer.id;
    } catch (error) {
      console.error('Error creating customer:', error);
      throw error;
    }
  }

  /**
   * Calculate the next billing date based on current date and interval
   * @param {Date} currentDate - Current date
   * @param {string} interval - Billing interval (day, week, month, year)
   * @returns {Date} - Next billing date
   */
  calculateNextBillingDate(currentDate, interval) {
    const date = new Date(currentDate);

    switch (interval) {
      case 'day':
        date.setDate(date.getDate() + 1);
        break;
      case 'week':
        date.setDate(date.getDate() + 7);
        break;
      case 'month':
        date.setMonth(date.getMonth() + 1);
        break;
      case 'year':
        date.setFullYear(date.getFullYear() + 1);
        break;
      default:
        date.setMonth(date.getMonth() + 1); // Default to monthly
    }

    return date;
  }
}

export default SubscriptionService;
