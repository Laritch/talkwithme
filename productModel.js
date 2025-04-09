import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discountPrice: {
    type: Number,
    min: 0,
    default: 0
  },
  category: {
    type: String,
    required: true,
    enum: ['Book', 'Course', 'Template', 'Tool', 'Subscription', 'Other']
  },
  subcategory: {
    type: String,
    trim: true
  },
  images: [
    {
      url: String,
      alt: String
    }
  ],
  stock: {
    type: Number,
    required: true,
    min: 0,
    default: 1
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  digitalFileUrl: {
    type: String
  },
  isPhysical: {
    type: Boolean,
    default: true
  },
  weight: {
    type: Number,
    default: 0 // in grams
  },
  dimensions: {
    length: Number,
    width: Number,
    height: Number
  },
  sku: {
    type: String,
    unique: true,
    sparse: true
  },
  isbn: {
    type: String,
    unique: true,
    sparse: true
  },
  tags: [String],
  featured: {
    type: Boolean,
    default: false
  },
  rating: {
    average: {
      type: Number,
      default: 0
    },
    count: {
      type: Number,
      default: 0
    }
  },
  reviews: [
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
      },
      review: String,
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  status: {
    type: String,
    enum: ['active', 'draft', 'archived', 'out_of_stock'],
    default: 'active'
  },
  commissionRate: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.15 // 15% commission by default
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
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Method to check if product is in stock
productSchema.methods.isInStock = function() {
  return this.stock > 0 && this.status === 'active';
};

// Method to calculate discounted price
productSchema.methods.getPrice = function() {
  if (this.discountPrice && this.discountPrice > 0 && this.discountPrice < this.price) {
    return this.discountPrice;
  }
  return this.price;
};

// Method to update product stock
productSchema.methods.updateStock = async function(quantity) {
  if (this.isDigital) {
    return true; // Digital products don't need stock management
  }

  if (this.stock >= quantity) {
    this.stock -= quantity;

    // Automatically update status to out_of_stock if stock reaches 0
    if (this.stock === 0) {
      this.status = 'out_of_stock';
    }

    await this.save();
    return true;
  }

  return false;
};

// Static method to find featured products
productSchema.statics.getFeaturedProducts = function(limit = 8) {
  return this.find({ featured: true, status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('expertId', 'name profilePicture rating');
};

// Static method to find products by expert
productSchema.statics.getExpertProducts = function(expertId, limit = 20) {
  return this.find({ expertId, status: 'active' })
    .sort({ createdAt: -1 })
    .limit(limit);
};

// Add indexes for better query performance
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ expertId: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ featured: 1, status: 1 });

const Product = mongoose.model('Product', productSchema);

export default Product;
