import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import Product from '../models/productModel.js';
import Cart from '../models/cartModel.js';
import Order from '../models/orderModel.js';
import PromoCode from '../models/promoCodeModel.js';
import { CustomerLoyalty } from '../models/loyaltyModel.js';
import * as paymentService from '../services/paymentService.js';
import * as loyaltyService from '../services/loyaltyService.js';

const router = express.Router();

// Get all products
router.get('/products', async (req, res) => {
  // ... existing code
});

// Find and update the checkout endpoint to handle promo codes
/**
 * @route   POST /checkout
 * @desc    Process checkout and create order
 * @access  Private
 */
router.post('/checkout', protect, async (req, res) => {
  try {
    const {
      items,
      shippingDetails,
      paymentMethod,
      paymentDetails,
      promoCode,
      loyaltyRewardCode
    } = req.body;

    if (!items || !items.length || !shippingDetails || !paymentMethod) {
      return res.status(400).json({ message: 'Required checkout information missing' });
    }

    // Get user's cart
    const cart = await Cart.findOne({ userId: req.user._id });
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // Validate cart items against requested items
    const validItems = [];
    let subtotal = 0;
    let isDigitalOnly = true;

    // Get all products at once to avoid multiple DB queries
    const productIds = items.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });
    const productsMap = products.reduce((map, product) => {
      map[product._id.toString()] = product;
      return map;
    }, {});

    // Validate and process each item
    for (const item of items) {
      const product = productsMap[item.productId];

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      if (product.status !== 'active') {
        return res.status(400).json({ message: `Product is not available: ${product.name}` });
      }

      if (item.quantity <= 0) {
        return res.status(400).json({ message: `Invalid quantity for product: ${product.name}` });
      }

      const validItem = {
        productId: product._id,
        expertId: product.expertId,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        isDigital: product.isDigital,
        commissionRate: product.commissionRate || 0.15,
        commissionAmount: (product.price * item.quantity) * (product.commissionRate || 0.15),
        expertPayoutAmount: (product.price * item.quantity) * (1 - (product.commissionRate || 0.15))
      };

      validItems.push(validItem);
      subtotal += product.price * item.quantity;

      // Check if we have any physical products
      if (!product.isDigital) {
        isDigitalOnly = false;
      }
    }

    // Calculate shipping cost (only if physical products)
    let shippingCost = 0;
    if (!isDigitalOnly) {
      // Basic shipping calculation
      shippingCost = 5.99; // Base shipping
      if (subtotal > 50) {
        shippingCost = 0; // Free shipping for orders over $50
      }
    }

    // Calculate tax
    const taxRate = 0.07; // 7% tax rate
    const tax = subtotal * taxRate;

    // Initial order total
    let totalAmount = subtotal + tax + shippingCost;

    // Create order object
    const order = new Order({
      userId: req.user._id,
      items: validItems,
      subtotal,
      tax,
      shippingCost,
      totalAmount,
      paymentMethod,
      paymentDetails: {
        ...paymentDetails,
        paymentProvider: paymentMethod
      },
      shippingDetails,
      isDigitalOnly
    });

    // Apply promo code if provided
    if (promoCode) {
      try {
        const promoCodeObj = await PromoCode.findOne({ code: promoCode.toUpperCase(), isActive: true });

        if (promoCodeObj) {
          // Validate promo code
          const productIds = validItems.map(item => item.productId);
          const categoryIds = products.map(p => p.category);

          const validation = await promoCodeObj.isValidFor(
            req.user._id,
            subtotal,
            productIds,
            categoryIds
          );

          if (validation.valid) {
            // Calculate discount
            const discountResult = promoCodeObj.calculateDiscount(subtotal, validItems);

            // Apply discount to order
            if (discountResult.isFreeShipping) {
              order.applyDiscount({
                code: promoCodeObj.code,
                type: 'freeShipping',
                value: shippingCost,
                description: promoCodeObj.description,
                promoCodeId: promoCodeObj._id
              });
            } else if (discountResult.discountAmount > 0) {
              order.applyDiscount({
                code: promoCodeObj.code,
                type: promoCodeObj.type,
                value: promoCodeObj.type === 'percentage' ? promoCodeObj.value : discountResult.discountAmount,
                description: promoCodeObj.description,
                promoCodeId: promoCodeObj._id
              });
            }

            // Record usage after order is successfully placed (move this after payment if needed)
            await promoCodeObj.recordUsage(
              req.user._id,
              subtotal,
              discountResult.discountAmount + (discountResult.isFreeShipping ? shippingCost : 0)
            );
          }
        }
      } catch (error) {
        console.error('Error applying promo code:', error);
        // Don't fail the checkout, just log the error
      }
    }

    // Apply loyalty reward if provided
    if (loyaltyRewardCode) {
      try {
        const loyaltyProfile = await CustomerLoyalty.findOne({ userId: req.user._id });

        if (loyaltyProfile) {
          const rewardIndex = loyaltyProfile.availableRewards.findIndex(
            r => r.code === loyaltyRewardCode && !r.isUsed && r.expiry > new Date()
          );

          if (rewardIndex !== -1) {
            const reward = loyaltyProfile.availableRewards[rewardIndex];

            // Apply reward to order
            if (reward.type === 'freeShipping') {
              order.applyDiscount({
                code: reward.code,
                type: 'freeShipping',
                value: shippingCost,
                description: 'Loyalty Reward - Free Shipping',
                loyaltyRewardId: reward._id
              });
            } else if (reward.type === 'discount') {
              const discountAmount = subtotal * (reward.value / 100);
              order.applyDiscount({
                code: reward.code,
                type: 'percentage',
                value: reward.value,
                description: `Loyalty Reward - ${reward.value}% Discount`,
                loyaltyRewardId: reward._id
              });
            }

            // Mark reward as used
            await loyaltyProfile.useReward(loyaltyRewardCode);
          }
        }
      } catch (error) {
        console.error('Error applying loyalty reward:', error);
        // Don't fail the checkout, just log the error
      }
    }

    // Process payment
    const paymentResult = await paymentService.processPayment({
      amount: order.totalAmount,
      currency: 'usd',
      paymentMethodId: paymentDetails.paymentMethodId,
      description: `Order ${order.orderNumber}`,
      customer: {
        name: shippingDetails.fullName,
        email: req.user.email,
        userId: req.user._id
      }
    });

    if (!paymentResult.success) {
      return res.status(400).json({ message: paymentResult.message });
    }

    // Update order with payment information
    await order.markAsPaid({
      transactionId: paymentResult.transactionId,
      paymentProvider: paymentMethod,
      lastFour: paymentDetails.lastFour || 'N/A'
    });

    // Clear the cart
    cart.items = [];
    await cart.save();

    // Add points to user's loyalty account if applicable
    try {
      const pointsEarned = await loyaltyService.processOrderLoyaltyPoints(order._id);

      // Include points information in response
      res.status(201).json({
        success: true,
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          isDigitalOnly: order.isDigitalOnly,
          createdAt: order.createdAt
        },
        payment: {
          success: true,
          transactionId: paymentResult.transactionId
        },
        loyalty: pointsEarned ? {
          pointsEarned: pointsEarned.pointsEarned,
          newBalance: pointsEarned.loyalty.points
        } : null
      });
    } catch (loyaltyError) {
      console.error('Error processing loyalty points:', loyaltyError);

      // Still return success even if loyalty points failed
      res.status(201).json({
        success: true,
        order: {
          _id: order._id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          status: order.status,
          isDigitalOnly: order.isDigitalOnly,
          createdAt: order.createdAt
        },
        payment: {
          success: true,
          transactionId: paymentResult.transactionId
        }
      });
    }
  } catch (error) {
    console.error('Error processing checkout:', error);
    res.status(500).json({ message: 'Failed to process checkout' });
  }
});

export default router;
