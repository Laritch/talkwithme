import mongoose from 'mongoose';

const paymentMethodSchema = new mongoose.Schema(
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
    processorPaymentId: {
      type: String,
      required: true
    },
    type: {
      type: String,
      required: true,
      enum: ['card', 'bank_account', 'mobile', 'wallet', 'upi'],
      index: true
    },
    // For cards
    brand: {
      type: String,
      default: null
    },
    last4: {
      type: String,
      default: null
    },
    expMonth: {
      type: Number,
      default: null
    },
    expYear: {
      type: Number,
      default: null
    },
    // For mobile payments like M-Pesa
    phoneNumber: {
      type: String,
      default: null
    },
    // For bank accounts
    bankName: {
      type: String,
      default: null
    },
    accountHolderName: {
      type: String,
      default: null
    },
    accountType: {
      type: String,
      enum: ['checking', 'savings', null],
      default: null
    },
    // Common fields
    isDefault: {
      type: Boolean,
      default: false
    },
    billingDetails: {
      name: {
        type: String,
        default: null
      },
      email: {
        type: String,
        default: null
      },
      phone: {
        type: String,
        default: null
      },
      address: {
        line1: {
          type: String,
          default: null
        },
        line2: {
          type: String,
          default: null
        },
        city: {
          type: String,
          default: null
        },
        state: {
          type: String,
          default: null
        },
        postalCode: {
          type: String,
          default: null
        },
        country: {
          type: String,
          default: null
        }
      }
    },
    // Processor-specific metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        // Sanitize sensitive data
        if (ret.metadata) {
          delete ret.metadata.rawResponse;
        }
        return ret;
      }
    }
  }
);

// Compound index for user's payment methods
paymentMethodSchema.index({ userId: 1, processor: 1, processorPaymentId: 1 }, { unique: true });

// Method to format the payment method for client-side use
paymentMethodSchema.methods.formatForClient = function() {
  const formatted = {
    id: this._id,
    processor: this.processor,
    type: this.type,
    isDefault: this.isDefault,
    createdAt: this.createdAt
  };

  // Add type-specific details
  if (this.type === 'card') {
    formatted.brand = this.brand;
    formatted.last4 = this.last4;
    formatted.expMonth = this.expMonth;
    formatted.expYear = this.expYear;
  } else if (this.type === 'bank_account') {
    formatted.bankName = this.bankName;
    formatted.accountHolderName = this.accountHolderName;
    formatted.accountType = this.accountType;
    formatted.last4 = this.last4;
  } else if (this.type === 'mobile') {
    formatted.phoneNumber = this.phoneNumber;
  }

  return formatted;
};

const PaymentMethod = mongoose.model('PaymentMethod', paymentMethodSchema);

export default PaymentMethod;
