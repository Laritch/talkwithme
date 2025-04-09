/**
 * Escrow Transaction Model
 *
 * Tracks all escrow transactions in the system including their lifecycle,
 * status changes, and relationships to payment processors.
 */

import mongoose from 'mongoose';
const { Schema } = mongoose;

// Define timeline event schema for tracking status changes
const timelineEventSchema = new Schema({
  status: {
    type: String,
    required: true,
    enum: [
      'created',
      'pending',
      'funded',
      'partially_released',
      'released',
      'cancelled',
      'disputed',
      'refunded',
      'split',
      'expired'
    ]
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  note: {
    type: String
  },
  metadata: {
    type: Schema.Types.Mixed
  }
}, { _id: false });

// Define dispute schema for tracking disputes within escrow transactions
const disputeSchema = new Schema({
  openedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  openDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  reason: {
    type: String,
    required: true
  },
  evidence: {
    type: Schema.Types.Mixed,
    default: {}
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'under_review', 'resolved'],
    default: 'open'
  },
  resolution: {
    type: String,
    enum: ['release', 'refund', 'split']
  },
  resolvedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  resolveDate: {
    type: Date
  },
  splitRatio: {
    type: Number,
    min: 0,
    max: 1
  },
  processorDisputeId: {
    type: String
  }
}, { _id: false });

// Define release condition schema
const releaseConditionSchema = new Schema({
  type: {
    type: String,
    required: true,
    enum: ['time', 'approval', 'milestone', 'condition']
  },
  description: {
    type: String
  },
  value: {
    type: Schema.Types.Mixed
  },
  status: {
    type: String,
    enum: ['pending', 'met', 'failed'],
    default: 'pending'
  }
}, { _id: false });

// Main escrow transaction schema
const escrowTransactionSchema = new Schema({
  // Unique identifier for the escrow transaction (format: ESC-XXXXXXXX)
  escrowTransactionId: {
    type: String,
    required: true,
    unique: true
  },

  // Parties involved
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipientId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Transaction details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  },
  releasedAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  description: {
    type: String
  },

  // Status and type
  status: {
    type: String,
    required: true,
    enum: [
      'pending',         // Created but not funded
      'funded',          // Money is in escrow
      'partially_released', // Some funds released
      'released',        // All funds released
      'cancelled',       // Transaction cancelled
      'disputed',        // In dispute
      'refunded',        // Refunded to sender
      'split',           // Funds split between parties
      'expired'          // Transaction expired
    ],
    default: 'pending'
  },
  escrowType: {
    type: String,
    required: true,
    enum: ['standard', 'milestone', 'conditional'],
    default: 'standard'
  },

  // Payment processor details
  processor: {
    type: String,
    required: true
  },
  processorTransactionId: {
    type: String,
    required: true
  },
  processorEscrowId: {
    type: String
  },
  processorTransferId: {
    type: String
  },
  processorRefundId: {
    type: String
  },

  // Release conditions
  releaseConditions: {
    type: [releaseConditionSchema],
    default: []
  },

  // Dispute information (if any)
  dispute: {
    type: disputeSchema
  },

  // Timeline for tracking status changes
  timeline: {
    type: [timelineEventSchema],
    default: []
  },

  // Expiry details
  expiryDate: {
    type: Date
  },

  // Additional metadata
  metadata: {
    type: Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
escrowTransactionSchema.index({ escrowTransactionId: 1 });
escrowTransactionSchema.index({ senderId: 1 });
escrowTransactionSchema.index({ recipientId: 1 });
escrowTransactionSchema.index({ status: 1 });
escrowTransactionSchema.index({ createdAt: 1 });
escrowTransactionSchema.index({ 'dispute.openDate': 1 });

// Method to check if the escrow has expired
escrowTransactionSchema.methods.hasExpired = function() {
  return this.expiryDate && new Date() > this.expiryDate;
};

// Virtual fields
escrowTransactionSchema.virtual('isPending').get(function() {
  return this.status === 'pending';
});

escrowTransactionSchema.virtual('isFunded').get(function() {
  return this.status === 'funded';
});

escrowTransactionSchema.virtual('isDisputed').get(function() {
  return this.status === 'disputed';
});

escrowTransactionSchema.virtual('isCompleted').get(function() {
  return ['released', 'cancelled', 'refunded', 'split', 'expired'].includes(this.status);
});

escrowTransactionSchema.virtual('remainingAmount').get(function() {
  return Math.max(0, this.amount - (this.releasedAmount || 0));
});

const EscrowTransaction = mongoose.model('EscrowTransaction', escrowTransactionSchema);

export default EscrowTransaction;
