/**
 * Subscription Model
 *
 * Schema for recurring payment subscriptions
 */

import mongoose from 'mongoose';

const invoiceSchema = new mongoose.Schema({
  invoiceId: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['draft', 'open', 'paid', 'uncollectible', 'void', 'failed'],
    default: 'open'
  },
  failureReason: {
    type: String
  }
}, { _id: false });

const subscriptionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  planId: {
    type: String,
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['active', 'past_due', 'canceled', 'trialing', 'unpaid', 'paused', 'incomplete'],
    default: 'active'
  },
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'USD'
  },
  interval: {
    type: String,
    enum: ['day', 'week', 'month', 'year'],
    default: 'month'
  },
  currentPeriodStart: {
    type: Date,
    required: true
  },
  currentPeriodEnd: {
    type: Date,
    required: true
  },
  cancelAtPeriodEnd: {
    type: Boolean,
    default: false
  },
  canceledAt: {
    type: Date
  },
  cancelReason: {
    type: String
  },
  cancelNotificationSent: {
    type: Boolean,
    default: false
  },
  trialStart: {
    type: Date
  },
  trialEnd: {
    type: Date
  },
  lastPaymentDate: {
    type: Date
  },
  nextBillingDate: {
    type: Date
  },
  invoices: [invoiceSchema],
  paymentDetails: {
    subscriptionId: {
      type: String,
      required: true
    },
    customerId: {
      type: String
    },
    paymentMethod: {
      type: String,
      default: 'stripe'
    }
  },
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed,
    default: {}
  },
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
subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ 'paymentDetails.subscriptionId': 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

const Subscription = mongoose.model('Subscription', subscriptionSchema);

export default Subscription;
