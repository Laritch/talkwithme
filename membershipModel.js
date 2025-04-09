import mongoose from 'mongoose';

// Membership tier schema
const membershipTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  commissionRate: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  description: {
    type: String,
    required: true
  },
  features: [String],
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update timestamp on save
membershipTierSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Expert membership schema
const expertMembershipSchema = new mongoose.Schema({
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  tierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipTier',
    required: true
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'bank_transfer', 'other'],
    required: true
  },
  paymentDetails: {
    type: Object
  },
  autoRenew: {
    type: Boolean,
    default: true
  },
  paymentHistory: [{
    amount: Number,
    date: Date,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    transactionId: String
  }]
});

// Client loyalty schema - tracks reduced commission rates for long-term client relationships
const clientLoyaltySchema = new mongoose.Schema({
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sessionCount: {
    type: Number,
    default: 0,
    min: 0
  },
  currentCommissionRate: {
    type: Number,
    required: true
  },
  baseCommissionRate: {
    type: Number,
    required: true
  },
  commissionReduction: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastSessionAt: {
    type: Date,
    default: null
  }
});

// Method to update after a session
clientLoyaltySchema.methods.updateAfterSession = async function() {
  this.sessionCount += 1;
  this.lastSessionAt = Date.now();

  // Calculate commission reduction based on session count
  if (this.sessionCount >= 50) {
    this.commissionReduction = 0.05; // 5% reduction after 50 sessions
  } else if (this.sessionCount >= 25) {
    this.commissionReduction = 0.04; // 4% reduction after 25 sessions
  } else if (this.sessionCount >= 10) {
    this.commissionReduction = 0.02; // 2% reduction after 10 sessions
  } else {
    this.commissionReduction = 0;
  }

  // Update current commission rate
  this.currentCommissionRate = Math.max(0.05, this.baseCommissionRate - this.commissionReduction);

  return this.save();
};

// Middleware to update loyalty tier when expert's membership tier changes
expertMembershipSchema.post('save', async function(doc) {
  try {
    // Get all loyalty relationships for this expert
    const ClientLoyalty = mongoose.model('ClientLoyalty');
    const loyalties = await ClientLoyalty.find({ expertId: doc.expertId });

    // Get the new base commission rate
    const MembershipTier = mongoose.model('MembershipTier');
    const tier = await MembershipTier.findById(doc.tierId);

    if (!tier) return;

    // Update the base and current commission rates for all loyalty relationships
    for (const loyalty of loyalties) {
      loyalty.baseCommissionRate = tier.commissionRate;
      loyalty.currentCommissionRate = Math.max(0.05, tier.commissionRate - loyalty.commissionReduction);
      await loyalty.save();
    }
  } catch (error) {
    console.error('Error updating loyalty relationships:', error);
  }
});

// Create models
const MembershipTier = mongoose.model('MembershipTier', membershipTierSchema);
const ExpertMembership = mongoose.model('ExpertMembership', expertMembershipSchema);
const ClientLoyalty = mongoose.model('ClientLoyalty', clientLoyaltySchema);

export { MembershipTier, ExpertMembership, ClientLoyalty };
