import mongoose from 'mongoose';

const processorPreferenceSchema = new mongoose.Schema(
  {
    stripe: {
      type: Boolean,
      default: false
    },
    square: {
      type: Boolean,
      default: false
    },
    adyen: {
      type: Boolean,
      default: false
    },
    mpesa: {
      type: Boolean,
      default: false
    },
    razorpay: {
      type: Boolean,
      default: false
    }
  },
  { _id: false }
);

const paymentPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true
    },
    defaultCurrency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'KES', 'INR', 'NGN', 'ZAR', 'TZS', 'UGX', 'GHS', 'RWF']
    },
    savePaymentInfo: {
      type: Boolean,
      default: true
    },
    autoCurrency: {
      type: Boolean,
      default: true
    },
    // Map of region-specific processor preferences
    processors: {
      type: Map,
      of: processorPreferenceSchema,
      default: () => ({
        global: {
          stripe: true,
          square: false,
          adyen: false,
          mpesa: false,
          razorpay: false
        }
      })
    },
    // User's default payment method IDs for each processor
    defaultPaymentMethods: {
      type: Map,
      of: String,
      default: () => ({})
    },
    // Additional user preferences
    preferredPaymentTypes: {
      type: [String],
      enum: ['card', 'bank_account', 'mobile', 'wallet', 'upi'],
      default: ['card']
    },
    // Save checkout information for faster checkout
    saveCheckoutInfo: {
      type: Boolean,
      default: true
    },
    // Last used shipping address
    lastShippingAddress: {
      name: String,
      line1: String,
      line2: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String
    },
    // User's preferred language for payment pages
    language: {
      type: String,
      default: 'en'
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: function (doc, ret) {
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Set default processors based on region
paymentPreferenceSchema.methods.setDefaultProcessorsForRegion = function(region) {
  const defaultProcessors = {
    global: {
      stripe: true,
      square: false,
      adyen: false,
      mpesa: false,
      razorpay: false
    },
    us: {
      stripe: true,
      square: true,
      adyen: false,
      mpesa: false,
      razorpay: false
    },
    eu: {
      stripe: true,
      square: false,
      adyen: true,
      mpesa: false,
      razorpay: false
    },
    africa: {
      stripe: false,
      square: false,
      adyen: false,
      mpesa: true,
      razorpay: false
    },
    asia: {
      stripe: false,
      square: false,
      adyen: true,
      mpesa: false,
      razorpay: true
    }
  };

  if (defaultProcessors[region]) {
    this.processors.set(region, defaultProcessors[region]);
  }

  return this;
};

// Get preferred processor for a region
paymentPreferenceSchema.methods.getPreferredProcessor = function(region) {
  // Check if user has preferences for this region
  let regionProcessors = this.processors.get(region);

  // If no region-specific preferences, use global
  if (!regionProcessors) {
    regionProcessors = this.processors.get('global');
  }

  // If still nothing, use default global
  if (!regionProcessors) {
    return 'stripe';
  }

  // Find the first enabled processor
  for (const [processor, enabled] of Object.entries(regionProcessors)) {
    if (enabled) {
      return processor;
    }
  }

  // Default to stripe if nothing enabled
  return 'stripe';
};

// Get preferred payment type based on region
paymentPreferenceSchema.methods.getPreferredPaymentType = function(region) {
  // Return first from preferredPaymentTypes
  if (this.preferredPaymentTypes && this.preferredPaymentTypes.length > 0) {
    return this.preferredPaymentTypes[0];
  }

  // Default by region
  if (region === 'africa') {
    return 'mobile';
  } else if (region === 'india') {
    return 'upi';
  }

  return 'card';
};

const PaymentPreference = mongoose.model('PaymentPreference', paymentPreferenceSchema);

export default PaymentPreference;
