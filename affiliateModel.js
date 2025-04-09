import mongoose from 'mongoose';

// Schema for affiliate links created by experts
const affiliateLinkSchema = new mongoose.Schema({
  // Expert who created this affiliate link
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  // Unique code for this affiliate link
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  // What this affiliate link is for
  type: {
    type: String,
    enum: ['product', 'expert', 'bundle'],
    required: true
  },
  // Reference to the item being promoted (product, expert, bundle)
  itemId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'itemType'
  },
  // Model name for the referenced item
  itemType: {
    type: String,
    required: true,
    enum: ['Product', 'Expert', 'Bundle']
  },
  // Affiliate commission rate (percentage)
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 50, // Max 50% commission
    default: 10 // Default 10% commission
  },
  // Custom landing page URL (optional)
  customUrl: {
    type: String
  },
  // Tracking metrics
  clicks: {
    type: Number,
    default: 0
  },
  conversions: {
    type: Number,
    default: 0
  },
  revenue: {
    type: Number,
    default: 0
  },
  earnings: {
    type: Number,
    default: 0
  },
  // Dates
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expireAt: {
    type: Date,
    default: null // null means no expiration
  }
});

// Pre-save middleware to update updatedAt field
affiliateLinkSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to track a click on this affiliate link
affiliateLinkSchema.methods.trackClick = async function() {
  this.clicks += 1;
  return this.save();
};

// Method to track a conversion
affiliateLinkSchema.methods.trackConversion = async function(amount) {
  this.conversions += 1;
  this.revenue += amount;

  // Calculate earnings based on commission rate
  const earnings = amount * (this.commissionRate / 100);
  this.earnings += earnings;

  return this.save();
};

// Schema for tracking affiliate clicks and sessions
const affiliateTrackingSchema = new mongoose.Schema({
  // The affiliate link used
  affiliateLink: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AffiliateLink',
    required: true
  },
  // Session ID to track the user across site
  sessionId: {
    type: String,
    required: true
  },
  // User IP (hashed for privacy)
  ipHash: {
    type: String
  },
  // User agent info
  userAgent: {
    type: String
  },
  // Referrer URL
  referrer: {
    type: String
  },
  // First click timestamp
  firstClick: {
    type: Date,
    default: Date.now
  },
  // Last click timestamp
  lastClick: {
    type: Date,
    default: Date.now
  },
  // Number of clicks in this session
  clickCount: {
    type: Number,
    default: 1
  },
  // Whether this led to a conversion
  converted: {
    type: Boolean,
    default: false
  },
  // User ID (if conversion happened)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Conversion details
  conversion: {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order'
    },
    amount: {
      type: Number
    },
    date: {
      type: Date
    }
  }
});

// Schema for affiliate payout history
const affiliatePayoutSchema = new mongoose.Schema({
  // Expert ID for this payout
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  // Amount of the payout
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  // Status of the payout
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  // Payment method
  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'paypal', 'stripe', 'crypto', 'other'],
    required: true
  },
  // Transaction ID from payment processor
  transactionId: {
    type: String
  },
  // Payout notes
  notes: {
    type: String
  },
  // Period this payout covers
  periodStart: {
    type: Date,
    required: true
  },
  periodEnd: {
    type: Date,
    required: true
  },
  // Dates
  createdAt: {
    type: Date,
    default: Date.now
  },
  processedAt: {
    type: Date
  }
});

// Schema for affiliate program settings
const affiliateSettingsSchema = new mongoose.Schema({
  // Global commission rate (percentage) for the platform
  defaultCommissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 50,
    default: 10
  },
  // Cookie lifetime in days
  cookieLifetime: {
    type: Number,
    required: true,
    min: 1,
    max: 365,
    default: 30
  },
  // Minimum payout amount
  minimumPayout: {
    type: Number,
    required: true,
    min: 0,
    default: 50
  },
  // Whether the affiliate program is active
  isActive: {
    type: Boolean,
    default: true
  },
  // Terms and conditions
  termsAndConditions: {
    type: String,
    required: true
  },
  // Last updated
  updatedAt: {
    type: Date,
    default: Date.now
  },
  // Who updated
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Static method to get the current settings
affiliateSettingsSchema.statics.getCurrentSettings = async function() {
  // Retrieve the latest settings (should only be one document)
  let settings = await this.findOne().sort({ updatedAt: -1 });

  // If no settings exist, create default settings
  if (!settings) {
    settings = await this.create({
      defaultCommissionRate: 10,
      cookieLifetime: 30,
      minimumPayout: 50,
      isActive: true,
      termsAndConditions: 'Default affiliate program terms and conditions.'
    });
  }

  return settings;
};

// Create the models
const AffiliateLink = mongoose.model('AffiliateLink', affiliateLinkSchema);
const AffiliateTracking = mongoose.model('AffiliateTracking', affiliateTrackingSchema);
const AffiliatePayout = mongoose.model('AffiliatePayout', affiliatePayoutSchema);
const AffiliateSettings = mongoose.model('AffiliateSettings', affiliateSettingsSchema);

export {
  AffiliateLink,
  AffiliateTracking,
  AffiliatePayout,
  AffiliateSettings
};
