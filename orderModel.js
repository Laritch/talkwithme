import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  digitalDelivered: {
    type: Boolean,
    default: false
  },
  digitalDownloadUrl: {
    type: String
  },
  commissionRate: {
    type: Number,
    required: true,
    default: 0.15 // Default 15% commission rate
  },
  commissionAmount: {
    type: Number,
    required: true,
    default: function() {
      return this.price * this.quantity * this.commissionRate;
    }
  },
  expertPayoutAmount: {
    type: Number,
    required: true,
    default: function() {
      return (this.price * this.quantity) - this.commissionAmount;
    }
  }
});

const shippingDetailsSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  addressLine1: {
    type: String,
    required: true
  },
  addressLine2: {
    type: String
  },
  city: {
    type: String,
    required: true
  },
  state: {
    type: String,
    required: true
  },
  country: {
    type: String,
    required: true
  },
  postalCode: {
    type: String,
    required: true
  },
  phoneNumber: {
    type: String,
    required: true
  }
});

// Enhanced to store more details about discounts
const discountSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['percentage', 'fixed', 'freeShipping', 'loyalty', 'bundle'],
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  // Reference to promo code if applicable
  promoCodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PromoCode'
  },
  // Reference to loyalty reward if applicable
  loyaltyRewardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'CustomerLoyalty.availableRewards'
  }
});

const orderSchema = new mongoose.Schema({
  orderNumber: {
    type: String,
    required: true,
    unique: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Expert associated with the order (if applicable)
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert'
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  tax: {
    type: Number,
    default: 0
  },
  shippingCost: {
    type: Number,
    default: 0
  },
  originalShippingCost: {
    type: Number,
    default: 0
  },
  // Updated to use the new discount schema
  discounts: [discountSchema],
  discount: {
    type: Number,
    default: 0
  },
  // Deprecated - use discounts array instead
  discountCode: {
    type: String
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card', 'paypal', 'stripe', 'bank_transfer', 'crypto', 'other'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentDetails: {
    transactionId: String,
    paymentProvider: String,
    paymentDate: Date,
    lastFour: String // Last 4 digits of credit card
  },
  shippingDetails: shippingDetailsSchema,
  isDigitalOnly: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String
  },
  // For bundle orders, reference the bundle
  bundleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bundle'
  },
  // For tracking whether this was a bundle purchase
  isBundle: {
    type: Boolean,
    default: false
  },
  // For affiliate tracking
  affiliateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert'
  },
  affiliateCommission: {
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
  },
  completedAt: {
    type: Date
  }
});

// Pre-save hook to generate order number and update timestamps
orderSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Generate order number on first save
  if (!this.orderNumber) {
    // Format: ORD-YYYYMMDD-XXXXX (where XXXXX is a random number)
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 90000) + 10000; // 5-digit random number

    this.orderNumber = `ORD-${year}${month}${day}-${random}`;
  }

  // Mark as completed if all digital items are delivered and no physical items exist
  if (this.isDigitalOnly) {
    const allDigitalDelivered = this.items.every(item => !item.isDigital || item.digitalDelivered);
    if (allDigitalDelivered && this.status !== 'completed' && this.paymentStatus === 'completed') {
      this.status = 'completed';
      this.completedAt = Date.now();
    }
  }

  next();
});

// Virtual field for experts included in this order
orderSchema.virtual('experts', {
  ref: 'Expert',
  localField: 'items.expertId',
  foreignField: '_id'
});

// Method to add a discount to the order
orderSchema.methods.applyDiscount = function(discountData) {
  // Calculate new total with this discount
  let newDiscount = this.discount;

  if (discountData.type === 'percentage') {
    newDiscount += this.subtotal * (discountData.value / 100);
  } else if (discountData.type === 'fixed') {
    newDiscount += discountData.value;
  } else if (discountData.type === 'freeShipping') {
    this.originalShippingCost = this.shippingCost;
    this.shippingCost = 0;
  }

  // Add to discounts array
  this.discounts.push(discountData);

  // Update total discount amount
  this.discount = newDiscount;

  // Update total amount
  this.totalAmount = this.subtotal + this.tax + this.shippingCost - this.discount;

  // Ensure total doesn't go negative
  if (this.totalAmount < 0) {
    this.totalAmount = 0;
  }

  return this;
};

// Method to mark order as paid
orderSchema.methods.markAsPaid = async function(paymentDetails) {
  this.paymentStatus = 'completed';
  this.paymentDetails = {
    ...this.paymentDetails,
    ...paymentDetails,
    paymentDate: new Date()
  };

  // Change status to processing for orders with physical items or to completed for digital-only orders
  if (this.isDigitalOnly) {
    const allDigitalDelivered = this.items.every(item => !item.isDigital || item.digitalDelivered);
    this.status = allDigitalDelivered ? 'completed' : 'processing';

    if (allDigitalDelivered) {
      this.completedAt = Date.now();
    }
  } else {
    this.status = 'processing';
  }

  return this.save();
};

// Method to mark an order as shipped
orderSchema.methods.markAsShipped = async function(trackingInfo) {
  if (this.isDigitalOnly) {
    return false; // Can't ship a digital-only order
  }

  this.status = 'shipped';
  this.shippingDetails = {
    ...this.shippingDetails,
    trackingNumber: trackingInfo.trackingNumber,
    shippingProvider: trackingInfo.shippingProvider,
    shippedAt: new Date()
  };

  return this.save();
};

// Method to mark an order as delivered
orderSchema.methods.markAsDelivered = async function() {
  this.status = 'delivered';
  this.completedAt = Date.now();
  return this.save();
};

// Method to mark a digital item as delivered
orderSchema.methods.markDigitalItemDelivered = async function(productId, downloadUrl) {
  const itemIndex = this.items.findIndex(
    item => item.productId.toString() === productId.toString() && item.isDigital
  );

  if (itemIndex === -1) {
    return false;
  }

  this.items[itemIndex].digitalDelivered = true;
  this.items[itemIndex].digitalDownloadUrl = downloadUrl;

  // Check if all digital items are now delivered
  const allDigitalDelivered = this.items.every(item => !item.isDigital || item.digitalDelivered);

  if (allDigitalDelivered && this.isDigitalOnly && this.paymentStatus === 'completed') {
    this.status = 'completed';
    this.completedAt = Date.now();
  }

  return this.save();
};

// Static method to calculate total sales for an expert
orderSchema.statics.calculateExpertSales = async function(expertId, period = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);

  const result = await this.aggregate([
    {
      $match: {
        'items.expertId': mongoose.Types.ObjectId(expertId),
        status: { $in: ['completed', 'delivered', 'shipped'] },
        createdAt: { $gte: startDate }
      }
    },
    { $unwind: '$items' },
    {
      $match: {
        'items.expertId': mongoose.Types.ObjectId(expertId)
      }
    },
    {
      $group: {
        _id: null,
        totalSales: { $sum: { $multiply: ['$items.price', '$items.quantity'] } },
        totalCommission: { $sum: '$items.commissionAmount' },
        totalPayout: { $sum: '$items.expertPayoutAmount' },
        itemCount: { $sum: '$items.quantity' },
        orderCount: { $addToSet: '$_id' }
      }
    },
    {
      $project: {
        _id: 0,
        totalSales: 1,
        totalCommission: 1,
        totalPayout: 1,
        itemCount: 1,
        orderCount: { $size: '$orderCount' }
      }
    }
  ]);

  return result.length > 0 ? result[0] : {
    totalSales: 0,
    totalCommission: 0,
    totalPayout: 0,
    itemCount: 0,
    orderCount: 0
  };
};

const Order = mongoose.model('Order', orderSchema);

export default Order;
