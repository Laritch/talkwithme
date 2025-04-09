import mongoose from 'mongoose';

// Loyalty tier schema - defines the different tiers customers can achieve
const loyaltyTierSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  minPoints: {
    type: Number,
    required: true,
    min: 0
  },
  discountPercentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100,
    default: 0
  },
  freeShipping: {
    type: Boolean,
    default: false
  },
  birthdayBonus: {
    type: Number,
    default: 0
  },
  extraPoints: {
    type: Number,
    default: 1 // Multiplier for points earned (1 = normal, 2 = double, etc.)
  },
  color: {
    type: String,
    default: '#4a6cf7'
  },
  icon: {
    type: String,
    default: 'star'
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

// Pre-save hook to update the updatedAt field
loyaltyTierSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Customer loyalty schema - tracks customer's loyalty status and points
const customerLoyaltySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  points: {
    type: Number,
    default: 0,
    min: 0
  },
  totalPointsEarned: {
    type: Number,
    default: 0,
    min: 0
  },
  tierId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoyaltyTier'
  },
  purchaseCount: {
    type: Number,
    default: 0,
    min: 0
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  lastPurchaseDate: {
    type: Date,
    default: null
  },
  birthday: {
    type: Date,
    default: null
  },
  referralCode: {
    type: String,
    unique: true,
    sparse: true
  },
  referredBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  referralCount: {
    type: Number,
    default: 0
  },
  availableRewards: [{
    type: {
      type: String,
      enum: ['discount', 'freeShipping', 'freeProduct', 'birthdayBonus'],
      required: true
    },
    value: {
      type: Number,
      required: true
    },
    code: {
      type: String,
      required: true
    },
    expiry: {
      type: Date,
      required: true
    },
    isUsed: {
      type: Boolean,
      default: false
    },
    usedAt: {
      type: Date,
      default: null
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update the updatedAt field
customerLoyaltySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to add points
customerLoyaltySchema.methods.addPoints = async function(points, reason = 'purchase') {
  // Get current tier
  const LoyaltyTier = mongoose.model('LoyaltyTier');
  const currentTier = await LoyaltyTier.findById(this.tierId);

  // Calculate points with tier multiplier
  let pointsToAdd = points;
  if (currentTier && currentTier.extraPoints > 1) {
    pointsToAdd = Math.floor(points * currentTier.extraPoints);
  }

  // Update points
  this.points += pointsToAdd;
  this.totalPointsEarned += pointsToAdd;

  // Update tier if needed
  await this.updateTier();

  // Create a point transaction record
  const PointTransaction = mongoose.model('PointTransaction');
  await PointTransaction.create({
    userId: this.userId,
    points: pointsToAdd,
    type: 'earn',
    reason,
    balance: this.points
  });

  await this.save();
  return this;
};

// Method to use points
customerLoyaltySchema.methods.usePoints = async function(points, reason = 'discount') {
  if (points > this.points) {
    throw new Error('Not enough points');
  }

  // Update points
  this.points -= points;

  // Create a point transaction record
  const PointTransaction = mongoose.model('PointTransaction');
  await PointTransaction.create({
    userId: this.userId,
    points: points,
    type: 'spend',
    reason,
    balance: this.points
  });

  await this.save();
  return this;
};

// Method to update tier based on points
customerLoyaltySchema.methods.updateTier = async function() {
  const LoyaltyTier = mongoose.model('LoyaltyTier');
  const tiers = await LoyaltyTier.find().sort({ minPoints: -1 }); // Get all tiers, highest first

  // Find the highest tier the customer qualifies for
  for (const tier of tiers) {
    if (this.points >= tier.minPoints) {
      // Only update if it's a different tier
      if (!this.tierId || this.tierId.toString() !== tier._id.toString()) {
        this.tierId = tier._id;

        // Create a tier change transaction
        const PointTransaction = mongoose.model('PointTransaction');
        await PointTransaction.create({
          userId: this.userId,
          points: 0,
          type: 'tier',
          reason: `Upgraded to ${tier.name}`,
          balance: this.points
        });
      }
      return;
    }
  }
};

// Method to generate a referral code
customerLoyaltySchema.methods.generateReferralCode = async function() {
  if (this.referralCode) {
    return this.referralCode;
  }

  const User = mongoose.model('User');
  const user = await User.findById(this.userId);

  if (!user) {
    throw new Error('User not found');
  }

  // Generate a referral code based on username
  let code = user.username.substring(0, 5).toUpperCase();
  code += Math.floor(10000 + Math.random() * 90000).toString().substring(0, 5);

  this.referralCode = code;
  await this.save();

  return code;
};

// Method to add a reward
customerLoyaltySchema.methods.addReward = async function(rewardType, value, expiryDays = 30) {
  const code = `${rewardType.substring(0, 3).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + expiryDays);

  this.availableRewards.push({
    type: rewardType,
    value,
    code,
    expiry,
    isUsed: false
  });

  await this.save();
  return code;
};

// Method to use a reward
customerLoyaltySchema.methods.useReward = async function(code) {
  const rewardIndex = this.availableRewards.findIndex(r => r.code === code && !r.isUsed && r.expiry > new Date());

  if (rewardIndex === -1) {
    throw new Error('Reward not found or expired');
  }

  this.availableRewards[rewardIndex].isUsed = true;
  this.availableRewards[rewardIndex].usedAt = new Date();

  await this.save();
  return this.availableRewards[rewardIndex];
};

// Points transaction schema - tracks points earned/spent
const pointTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  points: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['earn', 'spend', 'tier', 'expire', 'adjustment'],
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  balance: {
    type: Number,
    required: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create models
const LoyaltyTier = mongoose.model('LoyaltyTier', loyaltyTierSchema);
const CustomerLoyalty = mongoose.model('CustomerLoyalty', customerLoyaltySchema);
const PointTransaction = mongoose.model('PointTransaction', pointTransactionSchema);

export { LoyaltyTier, CustomerLoyalty, PointTransaction };
