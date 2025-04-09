/**
 * Payoneer Webhook Handler
 *
 * Processes webhook events from Payoneer's API:
 * - Payment status changes
 * - Payout completions
 * - Account updates
 * - Security notifications
 *
 * Implements signature verification and event routing
 */

import crypto from 'crypto';
import Transaction from '../../models/transactionModel.js';
import PaymentMethod from '../../models/paymentMethodModel.js';
import User from '../../models/userModel.js';
import webhookHandler from '../webhookHandler.js';

// Create singleton instance
class PayoneerWebhookHandler {
  constructor() {
    this.webhookSecret = process.env.PAYONEER_WEBHOOK_SECRET;

    if (!this.webhookSecret) {
      console.warn('Payoneer webhook secret is not configured. Webhook signature verification will be disabled.');
    }
  }

  /**
   * Verify webhook signature from Payoneer
   * @param {Object} headers - HTTP headers from the request
   * @param {string} body - Raw body of the request
   * @returns {boolean} - Whether the signature is valid
   */
  verifySignature(headers, body) {
    if (!this.webhookSecret) {
      console.warn('Skipping Payoneer webhook signature verification due to missing secret');
      return true;
    }

    try {
      const signature = headers['payoneer-signature'];

      if (!signature) {
        console.error('Missing Payoneer signature header');
        return false;
      }

      // Extract timestamp and signatures from header
      const [timestamp, receivedHmac] = signature.split(',');
      const timestampValue = timestamp.split('=')[1];
      const signatureValue = receivedHmac.split('=')[1];

      // Check if the webhook is too old (5 minutes)
      const age = Math.floor(Date.now() / 1000) - parseInt(timestampValue);
      if (age > 300) {
        console.error('Payoneer webhook too old:', age, 'seconds');
        return false;
      }

      // Generate the expected signature
      const payload = `${timestampValue}.${body}`;
      const expectedSignature = crypto
        .createHmac('sha256', this.webhookSecret)
        .update(payload)
        .digest('hex');

      // Verify the signature using a secure comparison
      return crypto.timingSafeEqual(
        Buffer.from(signatureValue),
        Buffer.from(expectedSignature)
      );
    } catch (error) {
      console.error('Payoneer signature verification error:', error);
      return false;
    }
  }

  /**
   * Process a Payoneer webhook event
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} - Processing result
   */
  async processWebhook(event) {
    try {
      // Determine event type and route to appropriate handler
      const eventType = event.event_type;

      switch (eventType) {
        case 'payout.status.updated':
          return await this.handlePayoutStatusUpdate(event);

        case 'payment.status.updated':
          return await this.handlePaymentStatusUpdate(event);

        case 'account.updated':
          return await this.handleAccountUpdate(event);

        case 'account.linked':
          return await this.handleAccountLinked(event);

        case 'bank_account.added':
          return await this.handleBankAccountAdded(event);

        case 'card.status.updated':
          return await this.handleCardStatusUpdate(event);

        case 'payment_link.completed':
          return await this.handlePaymentLinkCompleted(event);

        case 'refund.status.updated':
          return await this.handleRefundStatusUpdate(event);

        default:
          console.warn(`Unhandled Payoneer webhook event type: ${eventType}`);
          return {
            status: 'ignored',
            message: `Event type ${eventType} is not handled`
          };
      }
    } catch (error) {
      console.error('Error processing Payoneer webhook:', error);
      throw error;
    }
  }

  /**
   * Handle payout status update events
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} - Processing result
   */
  async handlePayoutStatusUpdate(event) {
    const { payout_id, status, amount, description, metadata } = event.data;

    try {
      // Find the transaction in our system
      const transaction = await Transaction.findOne({
        'processorData.payoutId': payout_id,
        processor: 'payoneer'
      });

      if (!transaction) {
        console.warn(`Payoneer transaction not found for payout: ${payout_id}`);
        return {
          status: 'warning',
          message: 'Transaction not found in our system'
        };
      }

      // Update the transaction status
      const previousStatus = transaction.status;
      transaction.status = this.mapPayoneerStatusToInternal(status);
      transaction.processorData = {
        ...transaction.processorData,
        payoneerStatus: status,
        statusUpdatedAt: new Date()
      };

      // Add a transaction history entry
      transaction.history.push({
        status: transaction.status,
        timestamp: new Date(),
        note: `Status changed from ${previousStatus} to ${transaction.status}`,
        processor: 'payoneer',
        processorData: {
          eventType: 'payout.status.updated',
          payoutId: payout_id,
          payoneerStatus: status
        }
      });

      await transaction.save();

      // Notify the webhook handler of the status change
      await webhookHandler.notifyTransactionStatusChanged({
        transactionId: transaction._id,
        previousStatus,
        newStatus: transaction.status,
        processor: 'payoneer',
        processorTransactionId: payout_id,
        amount: amount.value,
        currency: amount.currency,
        metadata
      });

      return {
        status: 'success',
        message: 'Payout status updated',
        transaction: {
          id: transaction._id,
          status: transaction.status,
          previousStatus
        }
      };
    } catch (error) {
      console.error('Error handling Payoneer payout status update:', error);
      throw error;
    }
  }

  /**
   * Handle payment status update events
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} - Processing result
   */
  async handlePaymentStatusUpdate(event) {
    const { payment_id, status, amount, description, metadata } = event.data;

    try {
      // Find the transaction in our system
      const transaction = await Transaction.findOne({
        'processorData.paymentId': payment_id,
        processor: 'payoneer'
      });

      if (!transaction) {
        console.warn(`Payoneer transaction not found for payment: ${payment_id}`);
        return {
          status: 'warning',
          message: 'Transaction not found in our system'
        };
      }

      // Update the transaction status
      const previousStatus = transaction.status;
      transaction.status = this.mapPayoneerStatusToInternal(status);
      transaction.processorData = {
        ...transaction.processorData,
        payoneerStatus: status,
        statusUpdatedAt: new Date()
      };

      // Add a transaction history entry
      transaction.history.push({
        status: transaction.status,
        timestamp: new Date(),
        note: `Status changed from ${previousStatus} to ${transaction.status}`,
        processor: 'payoneer',
        processorData: {
          eventType: 'payment.status.updated',
          paymentId: payment_id,
          payoneerStatus: status
        }
      });

      await transaction.save();

      // Notify the webhook handler of the status change
      await webhookHandler.notifyTransactionStatusChanged({
        transactionId: transaction._id,
        previousStatus,
        newStatus: transaction.status,
        processor: 'payoneer',
        processorTransactionId: payment_id,
        amount: amount.value,
        currency: amount.currency,
        metadata
      });

      return {
        status: 'success',
        message: 'Payment status updated',
        transaction: {
          id: transaction._id,
          status: transaction.status,
          previousStatus
        }
      };
    } catch (error) {
      console.error('Error handling Payoneer payment status update:', error);
      throw error;
    }
  }

  /**
   * Handle account update events
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} - Processing result
   */
  async handleAccountUpdate(event) {
    const { account_id, status, account_type, email } = event.data;

    try {
      // Find the user with this Payoneer ID
      const user = await User.findOne({ payoneerId: account_id });

      if (!user) {
        console.warn(`User not found for Payoneer account: ${account_id}`);
        return {
          status: 'warning',
          message: 'User not found in our system'
        };
      }

      // Update user's Payoneer account status
      user.payoneerAccountStatus = status;

      // Record this update in user's activity log
      if (user.activityLog) {
        user.activityLog.push({
          type: 'payoneer_account_update',
          timestamp: new Date(),
          details: {
            accountId: account_id,
            status,
            accountType: account_type
          }
        });
      }

      await user.save();

      return {
        status: 'success',
        message: 'Account status updated',
        user: {
          id: user._id,
          payoneerId: account_id,
          payoneerStatus: status
        }
      };
    } catch (error) {
      console.error('Error handling Payoneer account update:', error);
      throw error;
    }
  }

  /**
   * Handle account linked events
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} - Processing result
   */
  async handleAccountLinked(event) {
    const { account_id, status, user_id, email } = event.data;

    try {
      // Use the client reference ID (user_id) to find our user
      const user = await User.findById(user_id);

      if (!user) {
        console.warn(`User not found for client reference: ${user_id}`);
        return {
          status: 'warning',
          message: 'User not found in our system'
        };
      }

      // Update user with Payoneer ID
      user.payoneerId = account_id;
      user.payoneerAccountStatus = status;

      // Record this in user's activity log
      if (user.activityLog) {
        user.activityLog.push({
          type: 'payoneer_account_linked',
          timestamp: new Date(),
          details: {
            accountId: account_id,
            status
          }
        });
      }

      await user.save();

      return {
        status: 'success',
        message: 'Account linked to user',
        user: {
          id: user._id,
          payoneerId: account_id,
          payoneerStatus: status
        }
      };
    } catch (error) {
      console.error('Error handling Payoneer account linked:', error);
      throw error;
    }
  }

  /**
   * Handle bank account added events
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} - Processing result
   */
  async handleBankAccountAdded(event) {
    const { account_id, bank_account, user_id } = event.data;

    try {
      // Find the user with this Payoneer ID
      const user = await User.findOne({ payoneerId: account_id });

      if (!user) {
        console.warn(`User not found for Payoneer account: ${account_id}`);
        return {
          status: 'warning',
          message: 'User not found in our system'
        };
      }

      // Create a new payment method for this bank account
      const paymentMethod = new PaymentMethod({
        userId: user._id,
        processor: 'payoneer',
        type: 'bank_transfer',
        processorPaymentMethodId: bank_account.id,
        isDefault: false, // Default to false, user can set as default later
        data: {
          payoneerId: account_id,
          bankName: bank_account.bank_name,
          accountType: bank_account.account_type,
          last4: bank_account.account_number ? bank_account.account_number.slice(-4) : 'N/A',
          nickname: `${bank_account.bank_name} Account`,
          currency: bank_account.currency,
          country: bank_account.country
        },
        billingDetails: {
          name: user.name,
          email: user.email,
          country: bank_account.country
        },
        metadata: {
          addedVia: 'payoneer_webhook',
          timestamp: new Date()
        }
      });

      await paymentMethod.save();

      return {
        status: 'success',
        message: 'Bank account added as payment method',
        paymentMethod: {
          id: paymentMethod._id,
          type: paymentMethod.type,
          processorId: bank_account.id
        }
      };
    } catch (error) {
      console.error('Error handling Payoneer bank account added:', error);
      throw error;
    }
  }

  /**
   * Handle card status update events
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} - Processing result
   */
  async handleCardStatusUpdate(event) {
    const { account_id, card_id, status } = event.data;

    try {
      // Find the payment method for this card
      const paymentMethod = await PaymentMethod.findOne({
        processor: 'payoneer',
        type: 'prepaid_card',
        'data.cardId': card_id
      });

      if (!paymentMethod) {
        console.warn(`Payment method not found for Payoneer card: ${card_id}`);
        return {
          status: 'warning',
          message: 'Payment method not found in our system'
        };
      }

      // Update card status
      paymentMethod.data.status = status;
      paymentMethod.data.statusUpdatedAt = new Date();

      // If card is inactive, mark as not default
      if (status !== 'ACTIVE' && paymentMethod.isDefault) {
        paymentMethod.isDefault = false;
      }

      await paymentMethod.save();

      return {
        status: 'success',
        message: 'Card status updated',
        paymentMethod: {
          id: paymentMethod._id,
          type: paymentMethod.type,
          status
        }
      };
    } catch (error) {
      console.error('Error handling Payoneer card status update:', error);
      throw error;
    }
  }

  /**
   * Handle payment link completed events
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} - Processing result
   */
  async handlePaymentLinkCompleted(event) {
    const { payment_link_id, status, amount, payout_id, metadata } = event.data;

    try {
      // Find the transaction in our system
      const transaction = await Transaction.findOne({
        'processorData.paymentLinkId': payment_link_id,
        processor: 'payoneer'
      });

      if (!transaction) {
        console.warn(`Transaction not found for Payoneer payment link: ${payment_link_id}`);
        return {
          status: 'warning',
          message: 'Transaction not found in our system'
        };
      }

      // Update transaction with payout ID and status
      transaction.status = this.mapPayoneerStatusToInternal(status);
      transaction.processorData = {
        ...transaction.processorData,
        payoutId: payout_id,
        payoneerStatus: status,
        completedAt: new Date()
      };

      // Add transaction history entry
      transaction.history.push({
        status: transaction.status,
        timestamp: new Date(),
        note: 'Payment link completed',
        processor: 'payoneer',
        processorData: {
          eventType: 'payment_link.completed',
          paymentLinkId: payment_link_id,
          payoutId: payout_id,
          payoneerStatus: status
        }
      });

      await transaction.save();

      // Notify webhook handler
      await webhookHandler.notifyPaymentCompleted({
        transactionId: transaction._id,
        status: transaction.status,
        processor: 'payoneer',
        processorTransactionId: payout_id,
        amount: amount.value,
        currency: amount.currency,
        metadata: metadata || {}
      });

      return {
        status: 'success',
        message: 'Payment link completed',
        transaction: {
          id: transaction._id,
          status: transaction.status,
          payoutId: payout_id
        }
      };
    } catch (error) {
      console.error('Error handling Payoneer payment link completed:', error);
      throw error;
    }
  }

  /**
   * Handle refund status update events
   * @param {Object} event - Webhook event data
   * @returns {Promise<Object>} - Processing result
   */
  async handleRefundStatusUpdate(event) {
    const { refund_id, status, amount, original_payout_id } = event.data;

    try {
      // Find the refund transaction
      const refundTransaction = await Transaction.findOne({
        'processorData.refundId': refund_id,
        type: 'refund',
        processor: 'payoneer'
      });

      if (!refundTransaction) {
        console.warn(`Refund transaction not found: ${refund_id}`);
        return {
          status: 'warning',
          message: 'Refund transaction not found in our system'
        };
      }

      // Update refund status
      const previousStatus = refundTransaction.status;
      refundTransaction.status = this.mapPayoneerStatusToInternal(status);
      refundTransaction.processorData = {
        ...refundTransaction.processorData,
        payoneerStatus: status,
        statusUpdatedAt: new Date()
      };

      // Add history entry
      refundTransaction.history.push({
        status: refundTransaction.status,
        timestamp: new Date(),
        note: `Refund status changed from ${previousStatus} to ${refundTransaction.status}`,
        processor: 'payoneer',
        processorData: {
          eventType: 'refund.status.updated',
          refundId: refund_id,
          originalPayoutId: original_payout_id,
          payoneerStatus: status
        }
      });

      await refundTransaction.save();

      // Notify webhook handler
      await webhookHandler.notifyRefundStatusChanged({
        refundId: refundTransaction._id,
        originalTransactionId: refundTransaction.originalTransactionId,
        previousStatus,
        newStatus: refundTransaction.status,
        processor: 'payoneer',
        processorRefundId: refund_id,
        amount: amount.value,
        currency: amount.currency
      });

      return {
        status: 'success',
        message: 'Refund status updated',
        refund: {
          id: refundTransaction._id,
          status: refundTransaction.status,
          previousStatus
        }
      };
    } catch (error) {
      console.error('Error handling Payoneer refund status update:', error);
      throw error;
    }
  }

  /**
   * Map Payoneer status to internal system status
   * @param {string} payoneerStatus - Status from Payoneer
   * @returns {string} - Internal status
   */
  mapPayoneerStatusToInternal(payoneerStatus) {
    const statusMap = {
      'PENDING': 'pending',
      'PROCESSING': 'processing',
      'PROCESSED': 'succeeded',
      'COMPLETED': 'succeeded',
      'CANCELLED': 'cancelled',
      'FAILED': 'failed',
      'REJECTED': 'failed',
      'ON_HOLD': 'on_hold'
    };

    return statusMap[payoneerStatus] || 'unknown';
  }
}

export default new PayoneerWebhookHandler();
