/**
 * Transaction Utility Functions
 *
 * Utilities for working with transactions, escrow operations,
 * and unique identifier generation.
 */

import crypto from 'crypto';

/**
 * Generate a unique transaction ID with a specified prefix
 * @param {string} type - Type of transaction (payment, escrow, refund, etc.)
 * @returns {string} - Unique transaction ID
 */
export const generateTransactionId = (type = 'txn') => {
  const prefix = getTransactionPrefix(type);
  const timestamp = Date.now().toString().slice(-6);
  const random = crypto.randomBytes(4).toString('hex').toUpperCase();

  return `${prefix}${timestamp}${random}`;
};

/**
 * Get the prefix for a transaction type
 * @param {string} type - Type of transaction
 * @returns {string} - Prefix for the transaction ID
 */
const getTransactionPrefix = (type) => {
  const prefixes = {
    payment: 'PAY-',
    subscription: 'SUB-',
    refund: 'REF-',
    escrow: 'ESC-',
    transfer: 'TRF-',
    dispute: 'DSP-',
    default: 'TXN-'
  };

  return prefixes[type.toLowerCase()] || prefixes.default;
};

/**
 * Calculate escrow fee based on the transaction amount and fee structure
 * @param {number} amount - Transaction amount
 * @param {Object} feeStructure - Fee structure configuration
 * @returns {Object} - Fee details
 */
export const calculateEscrowFee = (amount, feeStructure) => {
  // Default fee structure if none provided
  const defaultFeeStructure = {
    percentage: 2.5,
    fixedFee: 0.30,
    minFee: 1,
    maxFee: 100
  };

  const fee = feeStructure || defaultFeeStructure;

  // Calculate fee based on percentage and fixed amount
  let calculatedFee = (amount * fee.percentage / 100) + fee.fixedFee;

  // Apply min/max constraints
  calculatedFee = Math.max(fee.minFee, Math.min(fee.maxFee, calculatedFee));

  return {
    amount: calculatedFee,
    percentage: fee.percentage,
    fixedFee: fee.fixedFee
  };
};

/**
 * Calculate the release date for a time-based escrow
 * @param {number} holdDays - Number of days to hold funds in escrow
 * @returns {Date} - Release date
 */
export const calculateReleaseDate = (holdDays = 14) => {
  const releaseDate = new Date();
  releaseDate.setDate(releaseDate.getDate() + holdDays);
  return releaseDate;
};

/**
 * Check if an escrow transaction has expired
 * @param {Date} expiryDate - Expiry date of the escrow
 * @returns {boolean} - Whether the escrow has expired
 */
export const hasEscrowExpired = (expiryDate) => {
  return expiryDate && new Date() > expiryDate;
};

/**
 * Create a hash signature for verifying escrow operation authenticity
 * @param {string} escrowId - Escrow transaction ID
 * @param {string} action - Action being performed (fund, release, etc.)
 * @param {string} secret - Secret key for signing
 * @returns {string} - Hash signature
 */
export const createEscrowOperationSignature = (escrowId, action, secret) => {
  const data = `${escrowId}:${action}:${Date.now()}`;
  return crypto.createHmac('sha256', secret)
    .update(data)
    .digest('hex');
};

/**
 * Verify an escrow operation signature
 * @param {string} signature - The signature to verify
 * @param {string} escrowId - Escrow transaction ID
 * @param {string} action - Action being performed
 * @param {string} secret - Secret key for verification
 * @param {number} maxAgeMs - Maximum age of the signature in milliseconds
 * @returns {boolean} - Whether the signature is valid
 */
export const verifyEscrowOperationSignature = (signature, escrowId, action, secret, maxAgeMs = 60000) => {
  // This is a simplified implementation that doesn't check timestamp
  // In a real implementation, you would parse the timestamp from the data
  // and verify that the signature isn't too old

  const data = `${escrowId}:${action}:${Date.now()}`;
  const expectedSignature = crypto.createHmac('sha256', secret)
    .update(data)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
};

/**
 * Format an amount for display with currency symbol
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (USD, EUR, etc.)
 * @returns {string} - Formatted amount with currency symbol
 */
export const formatCurrencyAmount = (amount, currency = 'USD') => {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  } catch (error) {
    // Fallback for unsupported currencies
    return `${currency} ${amount.toFixed(2)}`;
  }
};

export default {
  generateTransactionId,
  calculateEscrowFee,
  calculateReleaseDate,
  hasEscrowExpired,
  createEscrowOperationSignature,
  verifyEscrowOperationSignature,
  formatCurrencyAmount
};
