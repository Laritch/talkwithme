import mongoose from 'mongoose';

// Bundle items schema for products included in a bundle
const bundleItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  // Original price of this product
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  // Special price (if different from original) for this product in the bundle
  // If null, the normal price is used
  specialPrice: {
    type: Number,
    min: 0,
    default: null
  }
});

// Bundle schema
const bundleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  // This is the expert who created this bundle
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  // Bundle can include products from various experts
  items: [bundleItemSchema],
  // Bundle display image
  image: {
    type: String,
    default: 'https://same-assets.com/default-bundle.png'
  },
  // Additional images
  additionalImages: [{
    type: String
  }],
  // Original total price (sum of all items at their regular price)
  originalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  // Discounted bundle price
  price: {
    type: Number,
    required: true,
    min: 0
  },
  // Calculated discount percentage
  discountPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: function() {
      return this.originalPrice > 0
        ? Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100)
        : 0;
    }
  },
  // Tags for searching/filtering
  tags: [{
    type: String,
    lowercase: true,
    trim: true
  }],
  // Bundle category
  category: {
    type: String,
    required: true
  },
  // Whether this bundle is featured
  featured: {
    type: Boolean,
    default: false
  },
  // Bundle status
  status: {
    type: String,
    enum: ['draft', 'active', 'archived'],
    default: 'draft'
  },
  // Bundle availability period
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null // null means no end date
  },
  // Sales statistics
  salesCount: {
    type: Number,
    default: 0
  },
  // View count
  viewCount: {
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

// Pre-save hook to update timestamps and calculate prices
bundleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Generate slug if not provided
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // Calculate original price if not set
  if (!this.originalPrice || this.originalPrice === 0) {
    this.originalPrice = this.items.reduce((total, item) => {
      return total + (item.originalPrice * item.quantity);
    }, 0);
  }

  // Calculate discount percentage
  if (this.originalPrice > 0) {
    this.discountPercentage = Math.round(((this.originalPrice - this.price) / this.originalPrice) * 100);
  }

  next();
});

// Method to check if bundle is available
bundleSchema.methods.isAvailable = function() {
  // Check if bundle is active
  if (this.status !== 'active') {
    return false;
  }

  // Check dates
  const now = new Date();
  if (this.startDate && now < this.startDate) {
    return false;
  }
  if (this.endDate && now > this.endDate) {
    return false;
  }

  return true;
};

// Method to get bundle items with product details
bundleSchema.methods.getItemsWithDetails = async function() {
  await this.populate('items.productId', 'name images isDigital status stock');

  // Check if all products are still available
  const availableItems = this.items.filter(item => {
    const product = item.productId;
    return product && product.status === 'active' &&
           (!product.isDigital || product.stock > 0);
  });

  return availableItems;
};

// Static method to get featured bundles
bundleSchema.statics.getFeaturedBundles = async function(limit = 4) {
  return this.find({
    status: 'active',
    featured: true,
    $or: [
      { endDate: null },
      { endDate: { $gt: new Date() } }
    ],
    startDate: { $lte: new Date() }
  })
  .sort({ discountPercentage: -1 })
  .limit(limit)
  .populate('expertId', 'name profilePicture')
  .populate('items.productId', 'name images isDigital');
};

// Static method to get bundles by expert
bundleSchema.statics.getExpertBundles = async function(expertId, limit = 10) {
  return this.find({
    expertId,
    status: { $ne: 'archived' }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('items.productId', 'name images isDigital');
};

// Create a text index for searching
bundleSchema.index({
  name: 'text',
  description: 'text',
  tags: 'text'
});

const Bundle = mongoose.model('Bundle', bundleSchema);
export default Bundle;
