import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
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
  // Original price of the product
  originalPrice: {
    type: Number
  },
  // Actual price used for this item (might be discounted for bundles)
  price: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  isDigital: {
    type: Boolean,
    default: false
  },
  // Bundle information if this item is part of a bundle
  bundleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Bundle'
  },
  bundleName: {
    type: String
  },
  // Affiliate information if applicable
  affiliateId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert'
  }
});

const cartSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  totalPrice: {
    type: Number,
    required: true,
    default: 0
  },
  totalItems: {
    type: Number,
    required: true,
    default: 0
  },
  // Active promo code
  promoCode: {
    type: String
  },
  // Active loyalty reward code
  loyaltyRewardCode: {
    type: String
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

// Pre-save hook to update the cart totals
cartSchema.pre('save', function(next) {
  this.updatedAt = Date.now();

  // Calculate cart totals
  let totalPrice = 0;
  let totalItems = 0;

  this.items.forEach(item => {
    totalPrice += item.price * item.quantity;
    totalItems += item.quantity;
  });

  this.totalPrice = totalPrice;
  this.totalItems = totalItems;

  next();
});

// Method to add an item to the cart
cartSchema.methods.addItem = async function(product, quantity = 1, options = {}) {
  const existingItemIndex = this.items.findIndex(
    item => item.productId.toString() === product._id.toString()
  );

  const productPrice = options.priceOverride ||
                       (product.getPrice ? product.getPrice() : product.price);

  if (existingItemIndex > -1) {
    // Update existing item quantity
    this.items[existingItemIndex].quantity += quantity;

    // Update price if this is a bundle override
    if (options.priceOverride) {
      this.items[existingItemIndex].price = options.priceOverride;

      // Add bundle info if provided
      if (options.bundleId) {
        this.items[existingItemIndex].bundleId = options.bundleId;
        this.items[existingItemIndex].bundleName = options.bundleName;
      }
    }

    // Add affiliate info if provided
    if (options.affiliateId) {
      this.items[existingItemIndex].affiliateId = options.affiliateId;
    }
  } else {
    // Add new item
    const newItem = {
      productId: product._id,
      quantity,
      originalPrice: product.price,
      price: productPrice,
      name: product.name,
      image: product.images && product.images.length > 0 ? product.images[0] : null,
      expertId: product.expertId,
      isDigital: product.isDigital
    };

    // Add bundle info if provided
    if (options.bundleId) {
      newItem.bundleId = options.bundleId;
      newItem.bundleName = options.bundleName;
    }

    // Add affiliate info if provided
    if (options.affiliateId) {
      newItem.affiliateId = options.affiliateId;
    }

    this.items.push(newItem);
  }

  return this.save();
};

// Method to update item quantity
cartSchema.methods.updateItemQuantity = async function(productId, quantity) {
  const existingItemIndex = this.items.findIndex(
    item => item.productId.toString() === productId.toString()
  );

  if (existingItemIndex === -1) {
    return false;
  }

  if (quantity <= 0) {
    // Remove the item if quantity is 0 or negative
    this.items.splice(existingItemIndex, 1);
  } else {
    // Update the quantity
    this.items[existingItemIndex].quantity = quantity;
  }

  return this.save();
};

// Method to remove an item from the cart
cartSchema.methods.removeItem = async function(productId) {
  const existingItemIndex = this.items.findIndex(
    item => item.productId.toString() === productId.toString()
  );

  if (existingItemIndex === -1) {
    return false;
  }

  this.items.splice(existingItemIndex, 1);
  return this.save();
};

// Method to clear the cart
cartSchema.methods.clearCart = async function() {
  this.items = [];
  this.promoCode = null;
  this.loyaltyRewardCode = null;
  return this.save();
};

// Method to apply a promo code
cartSchema.methods.applyPromoCode = async function(code) {
  this.promoCode = code;
  return this.save();
};

// Method to apply a loyalty reward code
cartSchema.methods.applyLoyaltyReward = async function(code) {
  this.loyaltyRewardCode = code;
  return this.save();
};

// Method to remove promo code
cartSchema.methods.removePromoCode = async function() {
  this.promoCode = null;
  return this.save();
};

// Method to remove loyalty reward code
cartSchema.methods.removeLoyaltyReward = async function() {
  this.loyaltyRewardCode = null;
  return this.save();
};

// Static method to get or create a cart for a user
cartSchema.statics.getCart = async function(userId) {
  let cart = await this.findOne({ userId }).populate('items.productId');

  if (!cart) {
    cart = new this({
      userId,
      items: [],
      totalPrice: 0,
      totalItems: 0
    });
    await cart.save();
  }

  return cart;
};

const Cart = mongoose.model('Cart', cartSchema);

export default Cart;
