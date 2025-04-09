import mongoose from 'mongoose';

const checkoutSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    processor: {
      type: String,
      required: true,
      enum: ['stripe', 'square', 'adyen', 'mpesa', 'razorpay'],
      index: true
    },
    processorCheckoutId: {
      type: String,
      required: true
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'cancelled', 'expired'],
      default: 'pending',
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    currency: {
      type: String,
      required: true,
      default: 'USD'
    },
    items: {
      type: Array,
      default: []
    },
    couponCode: {
      type: String,
      default: null
    },
    paymentMethodId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PaymentMethod',
      default: null
    },
    discountAmount: {
      type: Number,
      default: 0
    },
    taxAmount: {
      type: Number,
      default: 0
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    transactionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Transaction',
      default: null
    },
    shippingInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    billingInfo: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    expiresAt: {
      type: Date,
      default: function() {
        // Default expiration - 1 hour from creation
        const now = new Date();
        return new Date(now.getTime() + 60 * 60 * 1000);
      }
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        // Remove sensitive data
        if (ret.metadata) {
          delete ret.metadata.rawResponse;
        }
        return ret;
      }
    }
  }
);

// Index for finding active sessions
checkoutSessionSchema.index({ status: 1, expiresAt: 1 });

// Index for processor checkout ID
checkoutSessionSchema.index({ processor: 1, processorCheckoutId: 1 }, { unique: true });

/**
 * Check if session is expired
 */
checkoutSessionSchema.methods.isExpired = function() {
  return this.expiresAt && this.expiresAt < new Date();
};

/**
 * Mark the session as completed with order and transaction details
 */
checkoutSessionSchema.methods.markCompleted = async function(orderId, transactionId) {
  this.status = 'completed';
  this.orderId = orderId;
  this.transactionId = transactionId;
  return this.save();
};

/**
 * Mark the session as failed with error details
 */
checkoutSessionSchema.methods.markFailed = async function(errorDetails) {
  this.status = 'failed';
  this.metadata.error = errorDetails;
  return this.save();
};

/**
 * Calculate total amount (including tax, discounts)
 */
checkoutSessionSchema.methods.calculateTotal = function() {
  return this.amount + this.taxAmount - this.discountAmount;
};

const CheckoutSession = mongoose.model('CheckoutSession', checkoutSessionSchema);

export default CheckoutSession;
