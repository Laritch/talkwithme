/**
 * Transaction Model
 *
 * Schema for payment transactions in the system
 */

import mongoose from 'mongoose';

const refundDetailsSchema = new mongoose.Schema({
  refundId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'succeeded', 'failed'],
    default: 'pending'
  },
  reason: {
    type: String
  },
  refundedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true
  },
  // Expert payment specific fields
  expertPayment: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String
    },
    expertId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expert'
    }
  },
  // Platform fee specific fields
  platformFee: {
    amount: {
      type: Number,
      default: 0
    },
    currency: {
      type: String
    },
    originalAmount: { // Original amount before conversion
      type: Number
    },
    originalCurrency: { // Original currency before conversion
      type: String
    },
    exchangeRate: { // Exchange rate used if currency conversion was applied
      type: Number
    }
  },
  // Payment type
  paymentType: {
    type: String,
    enum: ['standard', 'expert', 'platform', 'subscription'],
    default: 'standard'
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'succeeded', 'failed', 'canceled'],
    default: 'pending'
  },
  processor: {
    type: String,
    enum: ['stripe', 'paypal', 'mpesa', 'adyen', 'razorpay', 'square'],
    required: true
  },
  processorTransactionId: {
    type: String,
    required: true
  },
  processorResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  paymentMethod: {
    type: String
  },
  paymentMethodId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentMethod'
  },
  description: {
    type: String
  },
  failureReason: {
    type: String
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
  refunded: {
    type: Boolean,
    default: false
  },
  refundDetails: {
    type: refundDetailsSchema
  },
  loyaltyPointsEarned: {
    type: Number,
    default: 0
  },
  loyaltyPointsRedeemed: {
    type: Number,
    default: 0
  },
  discounts: [{
    type: {
      type: String,
      enum: ['loyalty', 'promo', 'tier', 'affiliate'],
    },
    amount: Number,
    code: String,
    description: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Indexes for query optimization
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ processorTransactionId: 1 });
transactionSchema.index({ status: 1 });

// Create a compound index for advanced searches
transactionSchema.index({
  userId: 1,
  status: 1,
  processor: 1,
  createdAt: -1
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
