/**
 * Email Notification Service
 *
 * Handles sending email notifications for payment events, including:
 * - Payment confirmations
 * - Subscription confirmations and renewals
 * - Payment refunds
 * - Dispute notifications
 * - Subscription cancellations
 */

import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import handlebars from 'handlebars';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Notification types
export const NOTIFICATION_TYPES = {
  PAYMENT_CONFIRMATION: 'payment_confirmation',
  SUBSCRIPTION_CONFIRMATION: 'subscription_confirmation',
  SUBSCRIPTION_RENEWAL: 'subscription_renewal',
  SUBSCRIPTION_CANCELED: 'subscription_canceled',
  PAYMENT_REFUND: 'payment_refund',
  DISPUTE_CREATED: 'dispute_created',
  DISPUTE_RESOLVED: 'dispute_resolved',
  PAYMENT_FAILED: 'payment_failed',
  PAYMENT_METHOD_ADDED: 'payment_method_added',
  PAYMENT_METHOD_EXPIRED: 'payment_method_expired'
};

// Create email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Template cache
const templates = {};

/**
 * Load email template from file
 * @param {string} templateName - Name of the template to load
 * @returns {Function} - Compiled Handlebars template
 */
const loadTemplate = (templateName) => {
  if (templates[templateName]) {
    return templates[templateName];
  }

  const templatePath = path.join(__dirname, '../templates/emails', `${templateName}.hbs`);
  const templateSource = fs.readFileSync(templatePath, 'utf8');
  const template = handlebars.compile(templateSource);

  // Cache the template
  templates[templateName] = template;

  return template;
};

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: USD)
 * @returns {string} - Formatted currency string
 */
const formatCurrency = (amount, currency = 'USD') => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
};

/**
 * Format date in user-friendly format
 * @param {string|Date} date - Date to format
 * @returns {string} - Formatted date string
 */
const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

/**
 * Send email notification
 * @param {string} recipientEmail - Recipient email address
 * @param {string} notificationType - Type of notification
 * @param {Object} data - Data to include in the notification
 * @returns {Promise<Object>} - Sending result
 */
export const sendNotification = async (recipientEmail, notificationType, data) => {
  try {
    if (!recipientEmail) {
      throw new Error('Recipient email is required');
    }

    // Default data with formatting helpers
    const templateData = {
      ...data,
      formatCurrency: (amount, currency) => formatCurrency(amount, currency),
      formatDate: (date) => formatDate(date),
      currentYear: new Date().getFullYear(),
      appName: process.env.APP_NAME || 'Expert Chat System',
      appUrl: process.env.APP_URL || 'https://expertchatsystem.com'
    };

    // Get email content based on notification type
    const { subject, template } = getEmailContent(notificationType, templateData);

    // Load and render template
    const htmlContent = loadTemplate(template)(templateData);

    // Send email
    const result = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'Expert Chat System'}" <${process.env.EMAIL_FROM_ADDRESS || 'notifications@expertchatsystem.com'}>`,
      to: recipientEmail,
      subject,
      html: htmlContent
    });

    console.log(`Email sent to ${recipientEmail}: ${notificationType}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Email notification error:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Get email content configuration based on notification type
 * @param {string} notificationType - Type of notification
 * @param {Object} data - Notification data
 * @returns {Object} - Email subject and template name
 */
const getEmailContent = (notificationType, data) => {
  switch (notificationType) {
    case NOTIFICATION_TYPES.PAYMENT_CONFIRMATION:
      return {
        subject: `Payment Confirmation - Order #${data.orderId}`,
        template: 'payment-confirmation'
      };

    case NOTIFICATION_TYPES.SUBSCRIPTION_CONFIRMATION:
      return {
        subject: `Subscription Confirmation - ${data.planName}`,
        template: 'subscription-confirmation'
      };

    case NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL:
      return {
        subject: `Subscription Renewal - ${data.planName}`,
        template: 'subscription-renewal'
      };

    case NOTIFICATION_TYPES.SUBSCRIPTION_CANCELED:
      return {
        subject: `Subscription Canceled - ${data.planName}`,
        template: 'subscription-canceled'
      };

    case NOTIFICATION_TYPES.PAYMENT_REFUND:
      return {
        subject: `Refund Confirmation - Order #${data.orderId}`,
        template: 'payment-refund'
      };

    case NOTIFICATION_TYPES.DISPUTE_CREATED:
      return {
        subject: `Dispute Opened - Order #${data.orderId}`,
        template: 'dispute-created'
      };

    case NOTIFICATION_TYPES.DISPUTE_RESOLVED:
      return {
        subject: `Dispute Resolved - Order #${data.orderId}`,
        template: 'dispute-resolved'
      };

    case NOTIFICATION_TYPES.PAYMENT_FAILED:
      return {
        subject: 'Payment Failed',
        template: 'payment-failed'
      };

    case NOTIFICATION_TYPES.PAYMENT_METHOD_ADDED:
      return {
        subject: 'Payment Method Added',
        template: 'payment-method-added'
      };

    case NOTIFICATION_TYPES.PAYMENT_METHOD_EXPIRED:
      return {
        subject: 'Payment Method Expiring Soon',
        template: 'payment-method-expired'
      };

    default:
      throw new Error(`Unknown notification type: ${notificationType}`);
  }
};

/**
 * Send payment confirmation email
 * @param {Object} options - Payment details
 * @returns {Promise<Object>} - Sending result
 */
export const sendPaymentConfirmation = async ({ email, orderId, amount, items, date, paymentMethod }) => {
  return sendNotification(email, NOTIFICATION_TYPES.PAYMENT_CONFIRMATION, {
    orderId,
    amount,
    items,
    date,
    paymentMethod
  });
};

/**
 * Send expert payment notification
 * @param {Object} expert - Expert user object or { email, name }
 * @param {Object} paymentDetails - Payment details
 */
export const sendExpertPaymentNotification = async (expert, paymentDetails) => {
  try {
    const { amount, currency, platformFee, transactionId, date, isExpertPayment } = paymentDetails;

    // Calculate net amount (after platform fee)
    const netAmount = platformFee ? amount - platformFee : amount;

    // Format date
    const formattedDate = new Date(date).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

    // Get expert email and name
    const expertEmail = expert.email;
    const expertName = expert.name || 'Expert';

    const emailData = {
      to: expertEmail,
      subject: 'You Have Received a Payment',
      html: `
        <h1>Payment Received</h1>
        <p>Dear ${expertName},</p>
        <p>You have received a payment from a client.</p>
        <p>Gross Amount: ${formatCurrency(amount, currency)}</p>
        ${platformFee ? `<p>Platform Fee: ${formatCurrency(platformFee, currency)}</p>` : ''}
        <p>Net Amount: ${formatCurrency(netAmount, currency)}</p>
        <p>Transaction ID: ${transactionId}</p>
        <p>Transaction Date: ${formattedDate}</p>
        <p>The payment has been processed and will be reflected in your earnings.</p>
        <p>Thank you for your services!</p>
      `
    };

    await sendNotification(expertEmail, NOTIFICATION_TYPES.PAYMENT_CONFIRMATION, emailData);
    console.log(`Expert payment notification sent to ${expertEmail}`);
  } catch (error) {
    console.error('Error sending expert payment notification:', error);
  }
};

/**
 * Send subscription confirmation email
 * @param {Object} options - Subscription details
 * @returns {Promise<Object>} - Sending result
 */
export const sendSubscriptionConfirmation = async ({ email, subscriptionId, planName, amount, interval, startDate, nextBillingDate }) => {
  return sendNotification(email, NOTIFICATION_TYPES.SUBSCRIPTION_CONFIRMATION, {
    subscriptionId,
    planName,
    amount,
    interval,
    startDate,
    nextBillingDate
  });
};

/**
 * Send subscription renewal notification
 * @param {Object} options - Renewal details
 * @returns {Promise<Object>} - Sending result
 */
export const sendSubscriptionRenewal = async ({ email, subscriptionId, planName, amount, nextBillingDate }) => {
  return sendNotification(email, NOTIFICATION_TYPES.SUBSCRIPTION_RENEWAL, {
    subscriptionId,
    planName,
    amount,
    nextBillingDate
  });
};

/**
 * Send subscription canceled notification
 * @param {Object} options - Cancellation details
 * @returns {Promise<Object>} - Sending result
 */
export const sendSubscriptionCanceled = async ({ email, subscriptionId, planName, endDate }) => {
  return sendNotification(email, NOTIFICATION_TYPES.SUBSCRIPTION_CANCELED, {
    subscriptionId,
    planName,
    endDate
  });
};

/**
 * Send payment refund notification
 * @param {Object} options - Refund details
 * @returns {Promise<Object>} - Sending result
 */
export const sendRefundNotification = async ({ email, orderId, amount, reason, date }) => {
  return sendNotification(email, NOTIFICATION_TYPES.PAYMENT_REFUND, {
    orderId,
    amount,
    reason,
    date
  });
};

/**
 * Send dispute created notification
 * @param {Object} options - Dispute details
 * @returns {Promise<Object>} - Sending result
 */
export const sendDisputeCreatedNotification = async ({ email, orderId, amount, reason, date }) => {
  return sendNotification(email, NOTIFICATION_TYPES.DISPUTE_CREATED, {
    orderId,
    amount,
    reason,
    date
  });
};

/**
 * Send dispute resolved notification
 * @param {Object} options - Resolution details
 * @returns {Promise<Object>} - Sending result
 */
export const sendDisputeResolvedNotification = async ({ email, orderId, resolution, notes, date }) => {
  return sendNotification(email, NOTIFICATION_TYPES.DISPUTE_RESOLVED, {
    orderId,
    resolution,
    notes,
    date
  });
};

/**
 * Send payment failed notification
 * @param {Object} options - Failed payment details
 * @returns {Promise<Object>} - Sending result
 */
export const sendPaymentFailedNotification = async ({ email, amount, reason, paymentMethod }) => {
  return sendNotification(email, NOTIFICATION_TYPES.PAYMENT_FAILED, {
    amount,
    reason,
    paymentMethod
  });
};

/**
 * Send payment method added notification
 * @param {Object} options - Payment method details
 * @returns {Promise<Object>} - Sending result
 */
export const sendPaymentMethodAddedNotification = async ({ email, cardType, last4, expiryDate }) => {
  return sendNotification(email, NOTIFICATION_TYPES.PAYMENT_METHOD_ADDED, {
    cardType,
    last4,
    expiryDate
  });
};

/**
 * Send payment method expiring notification
 * @param {Object} options - Expiring payment method details
 * @returns {Promise<Object>} - Sending result
 */
export const sendPaymentMethodExpiringNotification = async ({ email, cardType, last4, expiryDate }) => {
  return sendNotification(email, NOTIFICATION_TYPES.PAYMENT_METHOD_EXPIRED, {
    cardType,
    last4,
    expiryDate
  });
};

export default {
  sendNotification,
  sendPaymentConfirmation,
  sendExpertPaymentNotification,
  sendSubscriptionConfirmation,
  sendSubscriptionRenewal,
  sendSubscriptionCanceled,
  sendRefundNotification,
  sendDisputeCreatedNotification,
  sendDisputeResolvedNotification,
  sendPaymentFailedNotification,
  sendPaymentMethodAddedNotification,
  sendPaymentMethodExpiringNotification,
  NOTIFICATION_TYPES
};
