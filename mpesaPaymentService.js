/**
 * M-Pesa Payment Integration Service
 *
 * Handles M-Pesa payment processing, including:
 * - STK Push for payment initiation
 * - Payment confirmation
 * - Transaction status checking
 * - Callback processing
 */

import axios from 'axios';
import moment from 'moment';
import dotenv from 'dotenv';
import { createHash } from 'crypto';

// Load environment variables
dotenv.config();

// M-Pesa API configuration
const MPESA_CONFIG = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passKey: process.env.MPESA_PASS_KEY,
  shortCode: process.env.MPESA_SHORT_CODE,
  callbackUrl: process.env.MPESA_CALLBACK_URL,
  baseUrl: process.env.MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke'
};

/**
 * Get M-Pesa access token
 * @returns {Promise<string>} - Access token for M-Pesa API
 */
const getAccessToken = async () => {
  try {
    // Base64 encode consumer key and secret
    const auth = Buffer.from(`${MPESA_CONFIG.consumerKey}:${MPESA_CONFIG.consumerSecret}`).toString('base64');

    // Make request to oauth endpoint
    const response = await axios.get(
      `${MPESA_CONFIG.baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      {
        headers: {
          Authorization: `Basic ${auth}`
        }
      }
    );

    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa access token error:', error);
    throw new Error('Failed to get M-Pesa access token');
  }
};

/**
 * Generate timestamp in M-Pesa format
 * @returns {string} - Formatted timestamp (YYYYMMDDHHmmss)
 */
const generateTimestamp = () => {
  return moment().format('YYYYMMDDHHmmss');
};

/**
 * Generate password for M-Pesa STK Push
 * @param {string} timestamp - Timestamp in YYYYMMDDHHmmss format
 * @returns {string} - Base64 encoded password
 */
const generatePassword = (timestamp) => {
  const password = `${MPESA_CONFIG.shortCode}${MPESA_CONFIG.passKey}${timestamp}`;
  return Buffer.from(password).toString('base64');
};

/**
 * Initiate STK Push to customer's phone
 * @param {Object} paymentDetails - Payment details
 * @returns {Promise<Object>} - STK Push result
 */
export const initiateSTKPush = async (paymentDetails) => {
  try {
    // Validate required fields
    if (!paymentDetails.phoneNumber || !paymentDetails.amount || !paymentDetails.accountReference) {
      throw new Error('Phone number, amount, and account reference are required');
    }

    // Clean and format phone number (remove leading 0 or +254 and add 254)
    let phoneNumber = paymentDetails.phoneNumber.toString().trim();
    if (phoneNumber.startsWith('+')) {
      phoneNumber = phoneNumber.substring(1);
    } else if (phoneNumber.startsWith('0')) {
      phoneNumber = `254${phoneNumber.substring(1)}`;
    } else if (!phoneNumber.startsWith('254')) {
      phoneNumber = `254${phoneNumber}`;
    }

    // Format amount as integer
    const amount = Math.round(parseFloat(paymentDetails.amount));
    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Get access token
    const accessToken = await getAccessToken();

    // Generate timestamp
    const timestamp = generateTimestamp();

    // Prepare request payload
    const requestData = {
      BusinessShortCode: MPESA_CONFIG.shortCode,
      Password: generatePassword(timestamp),
      Timestamp: timestamp,
      TransactionType: 'CustomerPayBillOnline',
      Amount: amount,
      PartyA: phoneNumber,
      PartyB: MPESA_CONFIG.shortCode,
      PhoneNumber: phoneNumber,
      CallBackURL: `${MPESA_CONFIG.callbackUrl}?orderId=${paymentDetails.orderId || ''}`,
      AccountReference: paymentDetails.accountReference,
      TransactionDesc: paymentDetails.description || 'Payment for services'
    };

    // Make request to STK Push API
    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}/mpesa/stkpush/v1/processrequest`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Return formatted response
    return {
      success: true,
      checkoutRequestId: response.data.CheckoutRequestID,
      merchantRequestId: response.data.MerchantRequestID,
      responseCode: response.data.ResponseCode,
      responseDescription: response.data.ResponseDescription,
      customerMessage: response.data.CustomerMessage
    };
  } catch (error) {
    console.error('M-Pesa STK Push error:', error);

    return {
      success: false,
      message: error.response?.data?.errorMessage || error.message || 'Failed to initiate M-Pesa payment'
    };
  }
};

/**
 * Check STK Push transaction status
 * @param {string} checkoutRequestId - Checkout request ID from STK Push
 * @returns {Promise<Object>} - Transaction status
 */
export const checkTransactionStatus = async (checkoutRequestId) => {
  try {
    // Get access token
    const accessToken = await getAccessToken();

    // Generate timestamp
    const timestamp = generateTimestamp();

    // Prepare request payload
    const requestData = {
      BusinessShortCode: MPESA_CONFIG.shortCode,
      Password: generatePassword(timestamp),
      Timestamp: timestamp,
      CheckoutRequestID: checkoutRequestId
    };

    // Make request to query transaction status
    const response = await axios.post(
      `${MPESA_CONFIG.baseUrl}/mpesa/stkpushquery/v1/query`,
      requestData,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    // Parse response
    if (response.data.ResponseCode === '0') {
      return {
        success: true,
        status: response.data.ResultCode === '0' ? 'SUCCESS' : 'FAILED',
        resultCode: response.data.ResultCode,
        resultDesc: response.data.ResultDesc
      };
    } else {
      return {
        success: false,
        message: response.data.ResponseDescription || 'Failed to check transaction status'
      };
    }
  } catch (error) {
    console.error('M-Pesa transaction status check error:', error);

    return {
      success: false,
      message: error.response?.data?.errorMessage || error.message || 'Failed to check transaction status'
    };
  }
};

/**
 * Process M-Pesa callback
 * @param {Object} callbackData - Callback data from M-Pesa
 * @returns {Object} - Processed callback result
 */
export const processCallback = (callbackData) => {
  try {
    // Extract required information from callback body
    const { Body } = callbackData;

    // Handle successful transaction
    if (Body.stkCallback.ResultCode === 0) {
      const callbackMetadata = Body.stkCallback.CallbackMetadata.Item;

      // Extract transaction details
      const amount = callbackMetadata.find(item => item.Name === 'Amount')?.Value;
      const mpesaReceiptNumber = callbackMetadata.find(item => item.Name === 'MpesaReceiptNumber')?.Value;
      const transactionDate = callbackMetadata.find(item => item.Name === 'TransactionDate')?.Value;
      const phoneNumber = callbackMetadata.find(item => item.Name === 'PhoneNumber')?.Value;

      return {
        success: true,
        checkoutRequestId: Body.stkCallback.CheckoutRequestID,
        merchantRequestId: Body.stkCallback.MerchantRequestID,
        resultCode: Body.stkCallback.ResultCode,
        resultDesc: Body.stkCallback.ResultDesc,
        amount,
        mpesaReceiptNumber,
        transactionDate,
        phoneNumber,
        status: 'COMPLETED'
      };
    } else {
      // Handle failed transaction
      return {
        success: false,
        checkoutRequestId: Body.stkCallback.CheckoutRequestID,
        merchantRequestId: Body.stkCallback.MerchantRequestID,
        resultCode: Body.stkCallback.ResultCode,
        resultDesc: Body.stkCallback.ResultDesc,
        status: 'FAILED'
      };
    }
  } catch (error) {
    console.error('M-Pesa callback processing error:', error);

    return {
      success: false,
      message: error.message || 'Failed to process M-Pesa callback',
      status: 'ERROR'
    };
  }
};

/**
 * Validate M-Pesa transaction
 * @param {string} phoneNumber - Phone number to validate
 * @param {number} amount - Amount to validate
 * @returns {Object} - Validation result
 */
export const validateTransaction = (phoneNumber, amount) => {
  // Validate phone number (Kenya format)
  const phoneRegex = /^(?:254|\+254|0)?(7[0-9]{8})$/;
  const isValidPhone = phoneRegex.test(phoneNumber);

  // Validate amount (M-Pesa min 1, max 150000)
  const isValidAmount = amount >= 1 && amount <= 150000;

  return {
    isValid: isValidPhone && isValidAmount,
    errors: {
      phoneNumber: !isValidPhone ? 'Invalid phone number format' : null,
      amount: !isValidAmount ? 'Amount must be between 1 and 150,000' : null
    }
  };
};

/**
 * Format M-Pesa transaction details for display
 * @param {Object} transaction - M-Pesa transaction details
 * @returns {Object} - Formatted transaction details
 */
export const formatTransactionDetails = (transaction) => {
  // Format transaction date (from format 20210615123456 to readable date)
  let formattedDate = transaction.transactionDate;
  if (transaction.transactionDate && typeof transaction.transactionDate === 'string' && transaction.transactionDate.length === 14) {
    const year = transaction.transactionDate.substring(0, 4);
    const month = transaction.transactionDate.substring(4, 6);
    const day = transaction.transactionDate.substring(6, 8);
    const hour = transaction.transactionDate.substring(8, 10);
    const minute = transaction.transactionDate.substring(10, 12);
    const second = transaction.transactionDate.substring(12, 14);

    formattedDate = `${day}/${month}/${year} ${hour}:${minute}:${second}`;
  }

  // Format phone number for display (254XXXXXXXXX to 07XXXXXXXX)
  let formattedPhone = transaction.phoneNumber;
  if (transaction.phoneNumber && typeof transaction.phoneNumber === 'string' && transaction.phoneNumber.startsWith('254')) {
    formattedPhone = `0${transaction.phoneNumber.substring(3)}`;
  }

  return {
    ...transaction,
    formattedDate,
    formattedPhone,
    paymentMethod: 'M-Pesa'
  };
};

export default {
  initiateSTKPush,
  checkTransactionStatus,
  processCallback,
  validateTransaction,
  formatTransactionDetails
};
