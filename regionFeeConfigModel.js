/**
 * Region Fee Configuration Model
 *
 * Defines fee structures for experts based on regions, including
 * initial onboarding fees, transaction commissions, and other
 * region-specific fee settings.
 */

import mongoose from 'mongoose';

const commissionTierSchema = new mongoose.Schema({
  // Minimum earnings threshold for this tier (in local currency)
  minEarnings: {
    type: Number,
    required: true
  },
  // Commission percentage for this tier (e.g., 15.5 for 15.5%)
  commissionPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  // Additional fixed fee per transaction (in local currency)
  fixedFee: {
    type: Number,
    default: 0
  }
});

// Define the region fee history schema for tracking changes
const feeHistoryEntrySchema = new mongoose.Schema({
  // Timestamp when the change was made
  timestamp: {
    type: Date,
    default: Date.now
  },
  // User who made the change
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // User name for quick reference
  userName: {
    type: String
  },
  // Previous values
  previousValues: {
    type: mongoose.Schema.Types.Mixed
  },
  // New values
  newValues: {
    type: mongoose.Schema.Types.Mixed
  },
  // Change notes
  notes: {
    type: String
  }
}, {
  _id: true,
  timestamps: false
});

const regionFeeConfigSchema = new mongoose.Schema({
  // Region code (e.g., 'uae', 'saudi', 'qatar', 'us', 'eu')
  region: {
    type: String,
    required: true,
    unique: true
  },

  // Display name for the region
  displayName: {
    type: String,
    required: true
  },

  // Primary currency for this region
  currency: {
    type: String,
    required: true
  },

  // Initial onboarding fee for experts in this region
  initialFee: {
    type: Number,
    required: true,
    default: 0
  },

  // Whether the initial fee is waived for certain experts
  initialFeeWaivable: {
    type: Boolean,
    default: true
  },

  // Minimum payout amount in local currency
  minPayoutAmount: {
    type: Number,
    default: 50
  },

  // Base commission percentage for all transactions
  baseCommissionPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },

  // Whether to use tiered commission rates based on earnings
  useCommissionTiers: {
    type: Boolean,
    default: false
  },

  // Tiered commission rates (if useCommissionTiers is true)
  commissionTiers: [commissionTierSchema],

  // Additional fixed fee per transaction (in local currency)
  transactionFee: {
    type: Number,
    default: 0
  },

  // Fee for priority placement in search results
  featuredListingFee: {
    type: Number,
    default: 0
  },

  // Frequency of featured listing fee charges (monthly, yearly)
  featuredListingFrequency: {
    type: String,
    enum: ['once', 'daily', 'weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },

  // Whether to use the platform's subscription model
  useSubscription: {
    type: Boolean,
    default: true
  },

  // Subscription tiers specific to this region
  subscriptionTiers: [{
    name: String,
    monthlyPrice: Number,
    yearlyPrice: Number,
    commissionPercentage: Number,
    features: [String]
  }],

  // Special promotional rate (temporary discount)
  promotionalRate: {
    enabled: {
      type: Boolean,
      default: false
    },
    baseCommissionPercentage: {
      type: Number,
      min: 0,
      max: 100
    },
    startDate: Date,
    endDate: Date,
    description: String
  },

  // Custom payment methods available in this region
  paymentMethods: [{
    name: String,
    enabled: Boolean,
    additionalFee: Number,
    additionalFeeType: {
      type: String,
      enum: ['fixed', 'percentage'],
      default: 'fixed'
    }
  }],

  // Whether this fee configuration is active
  isActive: {
    type: Boolean,
    default: true
  },

  // Historical data to track changes over time
  history: [feeHistoryEntrySchema],

  // Performance metrics (calculated periodically from transaction data)
  performanceMetrics: {
    // Total number of experts in the region
    expertCount: {
      type: Number,
      default: 0
    },
    // Total revenue generated from the region in the last 30 days
    revenueLastMonth: {
      type: Number,
      default: 0
    },
    // Average revenue per expert in the last 30 days
    avgRevenuePerExpert: {
      type: Number,
      default: 0
    },
    // Total transaction volume in the last 30 days
    transactionVolume: {
      type: Number,
      default: 0
    },
    // Average transaction size
    avgTransactionSize: {
      type: Number,
      default: 0
    },
    // Average commission rate (factoring in tiers, promotions, etc.)
    effectiveCommissionRate: {
      type: Number,
      default: 0
    },
    // Date when metrics were last updated
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },

  // Notes for administrators
  adminNotes: {
    type: String
  }
}, {
  timestamps: true
});

// Add index for quick lookups by region
regionFeeConfigSchema.index({ region: 1 });

// Pre-save middleware to track changes
regionFeeConfigSchema.pre('findOneAndUpdate', async function(next) {
  try {
    const docToUpdate = await this.model.findOne(this.getQuery());
    if (!docToUpdate) return next();

    const updateData = this.getUpdate();

    // If $set exists, use that for changes
    const newValues = updateData.$set || updateData;

    // Extract the changed fields by comparing old and new values
    const changedFields = {};
    const previousValues = {};

    Object.keys(newValues).forEach(key => {
      // Skip history field to avoid infinite recursion
      if (key === 'history') return;

      // Compare values and track changes
      if (JSON.stringify(docToUpdate[key]) !== JSON.stringify(newValues[key])) {
        changedFields[key] = newValues[key];
        previousValues[key] = docToUpdate[key];
      }
    });

    // If there are changes, add them to history
    if (Object.keys(changedFields).length > 0) {
      // Get the userId from the options if available
      const userId = this.options?.userId;
      const userName = this.options?.userName || 'System';

      // Create a history entry
      const historyEntry = {
        timestamp: new Date(),
        userId,
        userName,
        previousValues,
        newValues: changedFields,
        notes: this.options?.notes || 'Updated fee configuration'
      };

      // Add to history array using $push
      if (!updateData.$push) {
        updateData.$push = {};
      }

      updateData.$push.history = historyEntry;
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Create and export the model
const RegionFeeConfig = mongoose.model('RegionFeeConfig', regionFeeConfigSchema);

export default RegionFeeConfig;
