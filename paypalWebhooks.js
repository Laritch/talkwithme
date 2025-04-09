/**
 * PayPal Webhook Handler
 *
 * Processes PayPal IPN (Instant Payment Notification) events
 * and updates orders, transactions, and subscriptions accordingly
 */

import crypto from 'crypto';
import fetch from 'node-fetch';
import querystring from 'querystring';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Transaction from '../models/transactionModel.js';
import Subscription from '../models/subscriptionModel.js';
import CheckoutSession from '../models/checkoutSessionModel.js';
import * as emailNotificationService from '../services/emailNotificationService.js';
import * as paymentLoyaltyIntegration from '../services/paymentLoyaltyIntegration.js';
import { getEnvVar } from '../utils/configUtils.js';

// PayPal IPN verification URLs
const SANDBOX_VERIFY_URL = 'https://ipnpb.sandbox.paypal.com/cgi-bin/webscr';
const LIVE_VERIFY_URL = 'https://ipnpb.paypal.com/cgi-bin/webscr';

/**
 * Verify the IPN message is authentic and from PayPal
 * @param {Object} ipnData - Raw IPN data from PayPal
 * @returns {Promise<boolean>} - Whether the IPN is valid
 */
export async function verifyPayPalIPN(ipnData) {
  try {
    // Add cmd=_notify-validate to the payload
    const verificationBody = Object.assign({}, ipnData, { cmd: '_notify-validate' });

    // Determine the verification URL based on environment
    const verifyURL = process.env.NODE_ENV === 'production' ? LIVE_VERIFY_URL : SANDBOX_VERIFY_URL;

    // Send verification request to PayPal
    const response = await fetch(verifyURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: querystring.stringify(verificationBody)
    });

    const responseText = await response.text();

    // If PayPal responds with VERIFIED, the IPN is valid
    return responseText === 'VERIFIED';
  } catch (error) {
    console.error('PayPal IPN verification error:', error);
    return false;
  }
}

/**
 * Process PayPal IPN webhook events
 * @param {Object} ipnData - The IPN data from PayPal
 * @returns {Promise<Object>} - Processing result
 */
export async function processPayPalWebhook(ipnData) {
  try {
    // Verify the IPN message is authentic from PayPal
    const isVerified = await verifyPayPalIPN(ipnData);

    if (!isVerified) {
      console.error('PayPal IPN validation failed');
      return { success: false, message: 'IPN validation failed' };
    }

    // Log the event for debugging
    console.log('Processing PayPal IPN:', ipnData.txn_type || ipnData.payment_status);

    // Determine the type of notification and route to appropriate handler
    const eventType = ipnData.txn_type || ipnData.payment_status;

    switch (eventType) {
      case 'web_accept':
      case 'cart':
      case 'express_checkout':
      case 'Completed':
        return handlePaymentCompleted(ipnData);

      case 'subscr_signup':
      case 'subscr_payment':
        return handleSubscriptionPayment(ipnData);

      case 'subscr_cancel':
      case 'subscr_eot':
        return handleSubscriptionCancellation(ipnData);

      case 'subscr_failed':
        return handleFailedSubscriptionPayment(ipnData);

      case 'Refunded':
      case 'refund':
      case 'partial_refund':
        return handleRefund(ipnData);

      case 'Reversed':
      case 'adjustment':
      case 'dispute':
        return handleDispute(ipnData);

      default:
        console.log(`Unhandled PayPal IPN event type: ${eventType}`);
        return { success: true, message: `Unhandled event type: ${eventType}` };
    }
  } catch (error) {
    console.error('Error processing PayPal webhook:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Handle completed payment notification
 * @param {Object} ipnData - The IPN data from PayPal
 * @returns {Promise<Object>} - Processing result
 */
async function handlePaymentCompleted(ipnData) {
  try {
    const {
      txn_id, // PayPal transaction ID
      custom, // Custom data field (we store userId or orderId here)
      payment_gross, // Payment amount
      mc_gross, // Merchant payment amount
      mc_currency, // Payment currency
      payer_email, // Customer email
      payment_status,
      item_number, // Optional order or item identifier
      invoice // Optional invoice number
    } = ipnData;

    // Check status is actually completed
    if (payment_status !== 'Completed') {
      return { success: true, message: `Ignored payment with status: ${payment_status}` };
    }

    const amount = parseFloat(payment_gross || mc_gross);
    const currency = mc_currency;

    let order;
    let userId;
    let checkoutSession;

    // Try to find the order or checkout session from custom data
    if (custom) {
      if (custom.startsWith('order_')) {
        const orderId = custom.replace('order_', '');
        order = await Order.findById(orderId);
      } else if (custom.startsWith('checkout_')) {
        const checkoutId = custom.replace('checkout_', '');
        checkoutSession = await CheckoutSession.findById(checkoutId);
      } else if (custom.startsWith('user_')) {
        userId = custom.replace('user_', '');
      } else {
        // Try to parse as an order ID directly
        order = await Order.findById(custom);
      }
    }

    // If we didn't find the order by custom field, try item_number or invoice
    if (!order && (item_number || invoice)) {
      order = await Order.findOne({
        $or: [
          { 'paymentDetails.invoiceNumber': invoice },
          { 'paymentDetails.itemNumber': item_number },
          { orderNumber: item_number || invoice }
        ]
      });
    }

    // If we found a checkout session, get the order from it
    if (checkoutSession && !order) {
      order = await Order.findById(checkoutSession.orderId);
      userId = checkoutSession.userId;
    }

    // If we have an order, update it
    if (order) {
      // Update order status
      order.paymentStatus = 'completed';

      // Update the status based on digital or physical product
      if (order.isDigitalOnly) {
        order.status = 'delivered';
      } else {
        order.status = 'processing';
      }

      // Record transaction details
      if (!order.paymentDetails) {
        order.paymentDetails = {};
      }

      order.paymentDetails.transactionId = txn_id;
      order.paymentDetails.processorTransactionId = txn_id;
      order.paymentDetails.paymentMethod = 'paypal';
      order.paymentDetails.paymentProcessor = 'paypal';
      order.paymentDetails.paidAmount = amount;
      order.paymentDetails.currency = currency;
      order.paymentDetails.payerEmail = payer_email;
      order.paymentDetails.paymentDate = new Date();

      await order.save();

      // Process loyalty points if applicable
      try {
        await paymentLoyaltyIntegration.processLoyaltyAfterPayment(order._id);
      } catch (loyaltyError) {
        console.error('Error processing loyalty after PayPal payment:', loyaltyError);
      }

      // Send confirmation email
      try {
        const user = await User.findById(order.userId);

        if (user && user.email) {
          // Format items for email
          const items = order.items.map(item => ({
            name: item.name,
            quantity: item.quantity,
            price: item.price
          }));

          await emailNotificationService.sendPaymentConfirmation({
            email: user.email,
            orderId: order._id.toString(),
            amount: order.totalAmount,
            items,
            date: new Date(),
            paymentMethod: 'paypal',
            loyaltyPoints: order.loyaltyPointsEarned
          });
        }
      } catch (emailError) {
        console.error('Error sending PayPal payment confirmation email:', emailError);
      }

      return {
        success: true,
        message: 'Payment completed and order updated',
        orderId: order._id
      };
    } else {
      // If no order was found, create a standalone transaction record
      const transaction = new Transaction({
        userId,
        amount,
        currency,
        status: 'succeeded',
        processor: 'paypal',
        processorTransactionId: txn_id,
        paymentMethod: 'paypal',
        description: 'PayPal payment',
        metadata: {
          payerEmail: payer_email,
          paypalInvoice: invoice,
          customData: custom
        }
      });

      await transaction.save();

      return {
        success: true,
        message: 'Payment completed and transaction recorded',
        transactionId: transaction._id
      };
    }
  } catch (error) {
    console.error('Error handling PayPal payment completion:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Handle subscription payment notification
 * @param {Object} ipnData - The IPN data from PayPal
 * @returns {Promise<Object>} - Processing result
 */
async function handleSubscriptionPayment(ipnData) {
  try {
    const {
      txn_id,
      subscr_id,
      custom,
      mc_gross,
      mc_currency,
      payer_email,
      payment_status,
      recurring
    } = ipnData;

    // Only process completed payments
    if (payment_status && payment_status !== 'Completed') {
      return { success: true, message: `Ignored subscription payment with status: ${payment_status}` };
    }

    // Look up the subscription
    let subscription = await Subscription.findOne({
      'processorData.subscriptionId': subscr_id
    });

    let userId;

    // Try to extract user from custom field if subscription not found
    if (!subscription && custom) {
      if (custom.startsWith('user_')) {
        userId = custom.replace('user_', '');
        subscription = await Subscription.findOne({
          userId,
          processor: 'paypal'
        });
      }
    }

    if (subscription) {
      // Update subscription details
      subscription.status = 'active';
      subscription.lastPaymentDate = new Date();
      subscription.paymentHistory.push({
        transactionId: txn_id,
        amount: parseFloat(mc_gross),
        currency: mc_currency,
        date: new Date(),
        status: 'succeeded'
      });

      await subscription.save();

      // Create transaction record
      const transaction = new Transaction({
        userId: subscription.userId,
        amount: parseFloat(mc_gross),
        currency: mc_currency,
        status: 'succeeded',
        processor: 'paypal',
        processorTransactionId: txn_id,
        paymentMethod: 'paypal',
        description: 'PayPal subscription payment',
        metadata: {
          subscriptionId: subscription._id,
          processorSubscriptionId: subscr_id,
          payerEmail: payer_email,
          isRecurring: !!recurring
        }
      });

      await transaction.save();

      // Send subscription renewal email
      try {
        const user = await User.findById(subscription.userId);

        if (user && user.email) {
          await emailNotificationService.sendSubscriptionRenewalConfirmation({
            email: user.email,
            subscriptionId: subscription._id.toString(),
            planName: subscription.planName,
            amount: parseFloat(mc_gross),
            nextBillingDate: subscription.nextBillingDate,
            date: new Date()
          });
        }
      } catch (emailError) {
        console.error('Error sending PayPal subscription renewal email:', emailError);
      }

      return {
        success: true,
        message: 'Subscription payment processed',
        subscriptionId: subscription._id
      };
    }

    // No subscription found, create a generic transaction
    const transaction = new Transaction({
      userId,
      amount: parseFloat(mc_gross),
      currency: mc_currency,
      status: 'succeeded',
      processor: 'paypal',
      processorTransactionId: txn_id,
      paymentMethod: 'paypal',
      description: 'PayPal subscription payment (unmatched)',
      metadata: {
        processorSubscriptionId: subscr_id,
        payerEmail: payer_email,
        isRecurring: !!recurring,
        customData: custom
      }
    });

    await transaction.save();

    return {
      success: true,
      message: 'Subscription payment recorded as transaction',
      transactionId: transaction._id
    };
  } catch (error) {
    console.error('Error handling PayPal subscription payment:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Handle subscription cancellation notification
 * @param {Object} ipnData - The IPN data from PayPal
 * @returns {Promise<Object>} - Processing result
 */
async function handleSubscriptionCancellation(ipnData) {
  try {
    const { subscr_id, custom } = ipnData;

    // Look up the subscription
    let subscription = await Subscription.findOne({
      'processorData.subscriptionId': subscr_id
    });

    if (!subscription && custom) {
      // Try to extract user from custom field if subscription not found
      if (custom.startsWith('user_')) {
        const userId = custom.replace('user_', '');
        subscription = await Subscription.findOne({
          userId,
          processor: 'paypal'
        });
      }
    }

    if (subscription) {
      // Update subscription status
      subscription.status = ipnData.txn_type === 'subscr_eot' ? 'expired' : 'canceled';
      subscription.canceledAt = new Date();

      await subscription.save();

      // Send cancellation email
      try {
        const user = await User.findById(subscription.userId);

        if (user && user.email) {
          await emailNotificationService.sendSubscriptionCancellationConfirmation({
            email: user.email,
            subscriptionId: subscription._id.toString(),
            planName: subscription.planName,
            date: new Date()
          });
        }
      } catch (emailError) {
        console.error('Error sending PayPal subscription cancellation email:', emailError);
      }

      return {
        success: true,
        message: 'Subscription cancellation processed',
        subscriptionId: subscription._id
      };
    }

    return {
      success: true,
      message: 'No matching subscription found for cancellation',
      subscriptionId: subscr_id
    };
  } catch (error) {
    console.error('Error handling PayPal subscription cancellation:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Handle failed subscription payment notification
 * @param {Object} ipnData - The IPN data from PayPal
 * @returns {Promise<Object>} - Processing result
 */
async function handleFailedSubscriptionPayment(ipnData) {
  try {
    const { subscr_id, custom, mc_gross, mc_currency } = ipnData;

    // Look up the subscription
    let subscription = await Subscription.findOne({
      'processorData.subscriptionId': subscr_id
    });

    if (!subscription && custom) {
      // Try to extract user from custom field if subscription not found
      if (custom.startsWith('user_')) {
        const userId = custom.replace('user_', '');
        subscription = await Subscription.findOne({
          userId,
          processor: 'paypal'
        });
      }
    }

    if (subscription) {
      // Update subscription details
      subscription.paymentHistory.push({
        amount: parseFloat(mc_gross),
        currency: mc_currency,
        date: new Date(),
        status: 'failed'
      });

      // Don't mark the subscription as inactive yet, PayPal will retry
      subscription.lastPaymentError = {
        date: new Date(),
        errorType: 'payment_failed',
        message: 'PayPal subscription payment failed'
      };

      await subscription.save();

      // Send payment failure email
      try {
        const user = await User.findById(subscription.userId);

        if (user && user.email) {
          await emailNotificationService.sendSubscriptionPaymentFailureNotification({
            email: user.email,
            subscriptionId: subscription._id.toString(),
            planName: subscription.planName,
            amount: parseFloat(mc_gross),
            date: new Date()
          });
        }
      } catch (emailError) {
        console.error('Error sending PayPal subscription payment failure email:', emailError);
      }

      return {
        success: true,
        message: 'Failed subscription payment recorded',
        subscriptionId: subscription._id
      };
    }

    return {
      success: true,
      message: 'No matching subscription found for failed payment',
      subscriptionId: subscr_id
    };
  } catch (error) {
    console.error('Error handling PayPal failed subscription payment:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Handle refund notification
 * @param {Object} ipnData - The IPN data from PayPal
 * @returns {Promise<Object>} - Processing result
 */
async function handleRefund(ipnData) {
  try {
    const {
      parent_txn_id, // Original transaction ID that was refunded
      txn_id, // Refund transaction ID
      mc_gross, // Refund amount (negative)
      mc_currency // Currency
    } = ipnData;

    if (!parent_txn_id) {
      return { success: false, message: 'Missing parent transaction ID for refund' };
    }

    // Find the original transaction
    const transaction = await Transaction.findOne({
      processorTransactionId: parent_txn_id
    });

    if (transaction) {
      // Update the transaction
      transaction.refunded = true;
      transaction.refundDetails = {
        refundId: txn_id,
        amount: Math.abs(parseFloat(mc_gross)), // Convert negative to positive
        status: 'succeeded',
        reason: 'Refund received from PayPal',
        refundedAt: new Date()
      };

      await transaction.save();

      // Find associated order if it exists
      const order = await Order.findOne({
        'paymentDetails.transactionId': transaction._id
      });

      if (order) {
        // Update order status
        order.status = 'refunded';
        order.paymentStatus = 'refunded';

        if (!order.refundDetails) {
          order.refundDetails = [];
        }

        order.refundDetails.push({
          refundId: txn_id,
          amount: Math.abs(parseFloat(mc_gross)),
          currency: mc_currency,
          status: 'succeeded',
          date: new Date(),
          processor: 'paypal'
        });

        await order.save();

        // Send refund email
        try {
          const user = await User.findById(order.userId);

          if (user && user.email) {
            await emailNotificationService.sendRefundConfirmation({
              email: user.email,
              orderId: order._id.toString(),
              amount: Math.abs(parseFloat(mc_gross)),
              reason: 'Refund processed by PayPal',
              date: new Date()
            });
          }
        } catch (emailError) {
          console.error('Error sending PayPal refund email:', emailError);
        }

        return {
          success: true,
          message: 'Refund processed and order updated',
          orderId: order._id,
          transactionId: transaction._id
        };
      }

      return {
        success: true,
        message: 'Refund processed and transaction updated',
        transactionId: transaction._id
      };
    }

    // No matching transaction found, create a refund record
    const refundTransaction = new Transaction({
      amount: Math.abs(parseFloat(mc_gross)),
      currency: mc_currency,
      status: 'refund',
      processor: 'paypal',
      processorTransactionId: txn_id,
      paymentMethod: 'paypal',
      description: 'PayPal refund (unmatched)',
      metadata: {
        originalTransactionId: parent_txn_id,
        refundEvent: true
      }
    });

    await refundTransaction.save();

    return {
      success: true,
      message: 'Refund recorded as transaction (no matching original transaction)',
      transactionId: refundTransaction._id
    };
  } catch (error) {
    console.error('Error handling PayPal refund:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Handle dispute/chargeback notification
 * @param {Object} ipnData - The IPN data from PayPal
 * @returns {Promise<Object>} - Processing result
 */
async function handleDispute(ipnData) {
  try {
    const {
      parent_txn_id, // Original transaction ID
      txn_id, // Dispute transaction ID
      reason_code, // Dispute reason
      case_id, // PayPal case ID
      mc_gross, // Disputed amount
      mc_currency // Currency
    } = ipnData;

    if (!parent_txn_id) {
      return { success: false, message: 'Missing parent transaction ID for dispute' };
    }

    // Find the original transaction
    const transaction = await Transaction.findOne({
      processorTransactionId: parent_txn_id
    });

    if (transaction) {
      // Update the transaction with dispute information
      transaction.disputed = true;
      transaction.disputeDetails = {
        disputeId: case_id || txn_id,
        amount: Math.abs(parseFloat(mc_gross)),
        status: 'needs_response',
        reason: reason_code || 'PayPal dispute',
        openedAt: new Date()
      };

      await transaction.save();

      // Find associated order if it exists
      const order = await Order.findOne({
        'paymentDetails.transactionId': transaction._id
      });

      if (order) {
        // Update order status
        order.status = 'disputed';

        if (!order.disputeDetails) {
          order.disputeDetails = {};
        }

        order.disputeDetails = {
          disputeId: case_id || txn_id,
          amount: Math.abs(parseFloat(mc_gross)),
          currency: mc_currency,
          status: 'needs_response',
          reason: reason_code || 'PayPal dispute',
          openedAt: new Date()
        };

        await order.save();

        // Send admin notification email about dispute
        try {
          await emailNotificationService.sendAdminAlertEmail({
            subject: 'PayPal Dispute Received',
            message: `A PayPal dispute has been received for order #${order._id}.
                     Case ID: ${case_id || txn_id},
                     Reason: ${reason_code || 'Not specified'},
                     Amount: ${Math.abs(parseFloat(mc_gross))} ${mc_currency}`,
            priority: 'high'
          });
        } catch (emailError) {
          console.error('Error sending PayPal dispute admin alert:', emailError);
        }

        return {
          success: true,
          message: 'Dispute processed and order updated',
          orderId: order._id,
          transactionId: transaction._id
        };
      }

      return {
        success: true,
        message: 'Dispute processed and transaction updated',
        transactionId: transaction._id
      };
    }

    // No matching transaction found, create a dispute record
    const disputeTransaction = new Transaction({
      amount: Math.abs(parseFloat(mc_gross)),
      currency: mc_currency,
      status: 'disputed',
      processor: 'paypal',
      processorTransactionId: txn_id,
      paymentMethod: 'paypal',
      description: 'PayPal dispute (unmatched)',
      disputed: true,
      disputeDetails: {
        disputeId: case_id || txn_id,
        amount: Math.abs(parseFloat(mc_gross)),
        status: 'needs_response',
        reason: reason_code || 'PayPal dispute',
        openedAt: new Date()
      },
      metadata: {
        originalTransactionId: parent_txn_id,
        disputeEvent: true
      }
    });

    await disputeTransaction.save();

    // Send admin notification email about unmatched dispute
    try {
      await emailNotificationService.sendAdminAlertEmail({
        subject: 'Unmatched PayPal Dispute Received',
        message: `A PayPal dispute has been received but no matching transaction was found.
                 Original Transaction ID: ${parent_txn_id},
                 Case ID: ${case_id || txn_id},
                 Reason: ${reason_code || 'Not specified'},
                 Amount: ${Math.abs(parseFloat(mc_gross))} ${mc_currency}`,
        priority: 'high'
      });
    } catch (emailError) {
      console.error('Error sending PayPal unmatched dispute admin alert:', emailError);
    }

    return {
      success: true,
      message: 'Dispute recorded as transaction (no matching original transaction)',
      transactionId: disputeTransaction._id
    };
  } catch (error) {
    console.error('Error handling PayPal dispute:', error);
    return { success: false, message: error.message };
  }
}
