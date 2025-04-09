'use client';

import { type Session, type Expert, User } from '../types';

// This is a simplified payment service for the consulting platform
// In a real implementation, this would connect to Stripe or another payment processor

export interface PaymentIntent {
  id: string;
  clientSecret: string;
  amount: number;
  status: 'requires_payment_method' | 'requires_confirmation' | 'succeeded' | 'canceled' | 'processing';
  created: number;
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account' | 'wallet';
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
  isDefault: boolean;
}

export interface OrderDetails {
  sessionId: string;
  expertId: string;
  clientId: string;
  amount: number;
  description: string;
  metadata?: Record<string, string>;
}

export interface OrderSummary {
  subtotal: number;
  taxAmount: number;
  processingFee: number;
  discount: number;
  totalAmount: number;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  error?: string;
  order?: {
    id: string;
    status: string;
  };
}

// Mock database for saved payment methods
const savedPaymentMethods: Record<string, PaymentMethod[]> = {};

// Mock database for payment intents
const paymentIntents: Record<string, PaymentIntent> = {};

/**
 * Creates a payment intent for a consulting session
 */
export const createPaymentIntent = async (orderDetails: OrderDetails): Promise<PaymentIntent> => {
  try {
    // In a real implementation, this would call the Stripe API
    const paymentIntentId = `pi_${Math.random().toString(36).substring(2, 15)}`;

    const paymentIntent: PaymentIntent = {
      id: paymentIntentId,
      clientSecret: `${paymentIntentId}_secret_${Math.random().toString(36).substring(2, 10)}`,
      amount: orderDetails.amount,
      status: 'requires_payment_method',
      created: Date.now(),
    };

    // Store the payment intent in our mock database
    paymentIntents[paymentIntentId] = paymentIntent;

    return paymentIntent;
  } catch (error) {
    console.error('Payment intent creation error:', error);
    throw new Error('Failed to create payment intent');
  }
};

/**
 * Confirms a payment intent
 */
export const confirmPayment = async (paymentIntentId: string, paymentMethodId: string): Promise<PaymentResult> => {
  try {
    // In a real implementation, this would call the Stripe API
    const paymentIntent = paymentIntents[paymentIntentId];

    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    // Simulate payment processing
    paymentIntent.status = 'succeeded';

    // Return success result
    return {
      success: true,
      paymentIntentId,
      order: {
        id: `order_${Math.random().toString(36).substring(2, 10)}`,
        status: 'paid',
      },
    };
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return {
      success: false,
      error: 'Payment failed to process',
    };
  }
};

/**
 * Saves a payment method for future use
 */
export const savePaymentMethod = (userId: string, paymentMethod: Omit<PaymentMethod, 'isDefault'>): PaymentMethod => {
  // Initialize user's payment methods array if it doesn't exist
  if (!savedPaymentMethods[userId]) {
    savedPaymentMethods[userId] = [];
  }

  // Check if this should be the default
  const isDefault = savedPaymentMethods[userId].length === 0;

  // Create the payment method
  const newPaymentMethod: PaymentMethod = {
    ...paymentMethod,
    isDefault,
  };

  // Save it to our mock database
  savedPaymentMethods[userId].push(newPaymentMethod);

  return newPaymentMethod;
};

/**
 * Gets a user's saved payment methods
 */
export const getUserPaymentMethods = (userId: string): PaymentMethod[] => {
  return savedPaymentMethods[userId] || [];
};

/**
 * Sets a payment method as default
 */
export const setDefaultPaymentMethod = (userId: string, paymentMethodId: string): PaymentMethod[] => {
  const userMethods = savedPaymentMethods[userId] || [];

  // Update default status
  const updatedMethods = userMethods.map(method => ({
    ...method,
    isDefault: method.id === paymentMethodId,
  }));

  // Save back to our mock database
  savedPaymentMethods[userId] = updatedMethods;

  return updatedMethods;
};

/**
 * Removes a payment method
 */
export const removePaymentMethod = (userId: string, paymentMethodId: string): PaymentMethod[] => {
  const userMethods = savedPaymentMethods[userId] || [];

  // Filter out the method to remove
  const updatedMethods = userMethods.filter(method => method.id !== paymentMethodId);

  // If we removed the default method, set a new default
  if (updatedMethods.length > 0 && !updatedMethods.some(method => method.isDefault)) {
    updatedMethods[0].isDefault = true;
  }

  // Save back to our mock database
  savedPaymentMethods[userId] = updatedMethods;

  return updatedMethods;
};

/**
 * Calculates a price summary for a session
 */
export const calculateSessionPrice = (session: Session, expert: Expert): OrderSummary => {
  // Base price from expert's rate
  const subtotal = expert.hourlyRate * (session.durationMinutes / 60);

  // Calculate tax (e.g., 8%)
  const taxRate = 0.08;
  const taxAmount = subtotal * taxRate;

  // Platform processing fee (e.g., 5%)
  const processingFeeRate = 0.05;
  const processingFee = subtotal * processingFeeRate;

  // Apply discount if applicable
  const discount = session.discountApplied || 0;

  // Calculate total
  const totalAmount = subtotal + taxAmount + processingFee - discount;

  return {
    subtotal,
    taxAmount,
    processingFee,
    discount,
    totalAmount,
  };
};

/**
 * Processes a refund
 */
export const processRefund = async (paymentIntentId: string, amount?: number): Promise<PaymentResult> => {
  try {
    // In a real implementation, this would call the Stripe API
    const paymentIntent = paymentIntents[paymentIntentId];

    if (!paymentIntent) {
      throw new Error('Payment intent not found');
    }

    // Mark the payment intent as refunded in our mock database
    paymentIntent.status = 'canceled';

    return {
      success: true,
      paymentIntentId,
      order: {
        id: `refund_${Math.random().toString(36).substring(2, 10)}`,
        status: 'refunded',
      },
    };
  } catch (error) {
    console.error('Refund processing error:', error);
    return {
      success: false,
      error: 'Refund failed to process',
    };
  }
};

export default {
  createPaymentIntent,
  confirmPayment,
  savePaymentMethod,
  getUserPaymentMethods,
  setDefaultPaymentMethod,
  removePaymentMethod,
  calculateSessionPrice,
  processRefund,
};
