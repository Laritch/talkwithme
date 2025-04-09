import mongoose from 'mongoose';

// Promo code schema
const promoCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'freeShipping'],
    required: true
  },
  value: {
    type: Number,
    required: true,
    min: 0
  },
  minPurchase: {
    type: Number,
    default: 0,
    min: 0
  },
  maxDiscount: {
    type: Number,
    default: null
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  usageLimit: {
    type: Number,
    default: null // null means unlimited
  },
  usedCount: {
    type: Number,
    default: 0
  },
  perUserLimit: {
    type: Number,
    default: 1
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Which users can use this promo code
  userType: {
    type: String,
    enum: ['all', 'new', 'existing', 'specific'],
    default: 'all'
  },
  // For specific user types, store eligible user IDs
  eligibleUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Product categories this code applies to (empty means all)
  categories: [{
    type: String
  }],
  // Specific products this code applies to (empty means all)
  products: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  }],
  // Expert who created this promo code (null for admin-created codes)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    default: null
  },
  // For tracking user usage
  usageHistory: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    usedAt: {
      type: Date,
      default: Date.now
    },
    orderAmount: {
      type: Number,
      required: true
    },
    discountAmount: {
      type: Number,
      required: true
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

// Pre-save middleware to update updatedAt
promoCodeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if promo code is valid for a user and order
promoCodeSchema.methods.isValidFor = async function(userId, orderAmount, productIds = [], categoryIds = []) {
  // Check if code is active
  if (!this.isActive) {
    return { valid: false, message: 'This promo code is inactive.' };
  }

  // Check dates
  const now = new Date();
  if (now < this.startDate || now > this.endDate) {
    return { valid: false, message: 'This promo code has expired or is not yet active.' };
  }

  // Check usage limit
  if (this.usageLimit !== null && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'This promo code has reached its usage limit.' };
  }

  // Check minimum purchase
  if (orderAmount < this.minPurchase) {
    return {
      valid: false,
      message: `Minimum purchase amount of $${this.minPurchase.toFixed(2)} required.`
    };
  }

  // Check user eligibility
  if (this.userType === 'specific' && !this.eligibleUsers.includes(userId)) {
    return { valid: false, message: 'This promo code is not available for your account.' };
  }

  // Check per-user limit
  const userUsageCount = this.usageHistory.filter(
    record => record.userId.toString() === userId.toString()
  ).length;

  if (userUsageCount >= this.perUserLimit) {
    return {
      valid: false,
      message: `You've already used this promo code the maximum number of times.`
    };
  }

  // Check product and category restrictions
  if (this.products.length > 0 && !productIds.some(id => this.products.includes(id))) {
    return {
      valid: false,
      message: 'This promo code is not applicable to the items in your cart.'
    };
  }

  if (this.categories.length > 0 && !categoryIds.some(cat => this.categories.includes(cat))) {
    return {
      valid: false,
      message: 'This promo code is not applicable to the items in your cart.'
    };
  }

  // If we've passed all checks, the code is valid
  return { valid: true, message: 'Promo code applied successfully!' };
};

// Method to calculate discount amount
promoCodeSchema.methods.calculateDiscount = function(subtotal, items = []) {
  let applicableAmount = subtotal;

  // If there are product or category restrictions, calculate applicable amount
  if (this.products.length > 0 || this.categories.length > 0) {
    applicableAmount = items.reduce((sum, item) => {
      const productMatch = this.products.length === 0 ||
                           this.products.includes(item.productId);
      const categoryMatch = this.categories.length === 0 ||
                           this.categories.includes(item.category);

      return sum + (productMatch || categoryMatch ? item.price * item.quantity : 0);
    }, 0);
  }

  let discountAmount = 0;

  switch (this.type) {
    case 'percentage':
      discountAmount = applicableAmount * (this.value / 100);
      // Apply max discount if set
      if (this.maxDiscount !== null && discountAmount > this.maxDiscount) {
        discountAmount = this.maxDiscount;
      }
      break;
    case 'fixed':
      discountAmount = Math.min(this.value, applicableAmount);
      break;
    case 'freeShipping':
      // This is handled in the order calculation
      discountAmount = 0;
      break;
  }

  return {
    discountAmount,
    applicableAmount,
    isFreeShipping: this.type === 'freeShipping'
  };
};

// Record usage of promo code
promoCodeSchema.methods.recordUsage = async function(userId, orderAmount, discountAmount) {
  this.usedCount += 1;

  this.usageHistory.push({
    userId,
    usedAt: new Date(),
    orderAmount,
    discountAmount
  });

  await this.save();
  return this;
};

const PromoCode = mongoose.model('PromoCode', promoCodeSchema);
export default PromoCode;
