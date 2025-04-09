import dotenv from 'dotenv';
import Stripe from 'stripe';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import Cart from '../models/cartModel.js';

dotenv.config();

// Initialize Stripe with API key from environment variables
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

/**
 * Creates a payment intent with Stripe
 * @param {Object} orderData - Order data including amount and metadata
 * @returns {Object} Stripe payment intent object
 */
export const createPaymentIntent = async (orderData) => {
  if (!stripe) {
    throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.');
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(orderData.totalAmount * 100), // Stripe requires amount in cents
      currency: 'usd',
      metadata: {
        orderId: orderData.orderId,
        userId: orderData.userId.toString()
      }
    });

    return paymentIntent;
  } catch (error) {
    console.error('Stripe payment intent error:', error);
    throw new Error(`Payment processing failed: ${error.message}`);
  }
};

/**
 * Process the checkout for the user's cart
 * @param {string} userId - User ID
 * @param {Object} paymentDetails - Payment details
 * @param {Object} shippingDetails - Shipping details
 * @param {Object} orderOptions - Additional order options
 * @returns {Object} Created order with payment intent
 */
export const processCheckout = async (userId, paymentDetails, shippingDetails, orderOptions = {}) => {
  try {
    // Get the user's cart
    const cart = await Cart.getCart(userId);

    if (!cart || cart.items.length === 0) {
      throw new Error('Your cart is empty');
    }

    // Validate items in cart are still available
    for (const item of cart.items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        throw new Error(`Product ${item.name} is no longer available`);
      }

      if (!product.isDigital && !product.isInStock()) {
        throw new Error(`Product ${product.name} is out of stock`);
      }

      if (product.isInStock() && product.stock < item.quantity) {
        throw new Error(`Only ${product.stock} of ${product.name} are available`);
      }
    }

    // Create new order from cart
    const order = new Order({
      userId,
      items: cart.items.map(item => ({
        productId: item.productId,
        expertId: item.expertId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        isDigital: item.isDigital
      })),
      subtotal: cart.totalPrice,
      totalAmount: cart.totalPrice + (orderOptions.shippingCost || 0) + (orderOptions.tax || 0) - (orderOptions.discount || 0),
      paymentMethod: paymentDetails.paymentMethod,
      shippingDetails,
      shippingCost: orderOptions.shippingCost || 0,
      tax: orderOptions.tax || 0,
      discount: orderOptions.discount || 0,
      discountCode: orderOptions.discountCode,
      isDigitalOnly: cart.items.every(item => item.isDigital),
      notes: orderOptions.notes
    });

    // Save order to get orderId
    await order.save();

    // For Stripe payment, create a payment intent
    let paymentIntent = null;
    if (paymentDetails.paymentMethod === 'stripe' || paymentDetails.paymentMethod === 'credit_card') {
      paymentIntent = await createPaymentIntent({
        totalAmount: order.totalAmount,
        orderId: order._id.toString(),
        userId: userId
      });

      // Update order with payment intent id
      order.paymentDetails = {
        transactionId: paymentIntent.id,
        paymentProvider: 'stripe'
      };
      await order.save();
    }

    // Update product stock for physical items
    for (const item of cart.items) {
      if (!item.isDigital) {
        const product = await Product.findById(item.productId);
        await product.updateStock(item.quantity);
      }
    }

    // Clear the cart after successful checkout
    await cart.clearCart();

    return {
      order,
      paymentIntent: paymentIntent ? {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      } : null
    };
  } catch (error) {
    console.error('Checkout processing error:', error);
    throw error;
  }
};

/**
 * Confirms a payment and updates the order status
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {boolean} succeeded - Whether payment succeeded
 * @returns {Object} Updated order
 */
export const confirmPayment = async (paymentIntentId, succeeded = true) => {
  try {
    // Find order by payment intent ID
    const order = await Order.findOne({
      'paymentDetails.transactionId': paymentIntentId
    });

    if (!order) {
      throw new Error('Order not found for this payment');
    }

    if (succeeded) {
      // Mark order as paid
      await order.markAsPaid({
        transactionId: paymentIntentId,
        paymentProvider: 'stripe',
        status: 'completed'
      });

      // Handle digital product delivery
      if (order.isDigitalOnly) {
        for (const item of order.items) {
          if (item.isDigital) {
            // Generate download URL for digital product
            const downloadUrl = await generateDigitalDownloadUrl(item.productId, order._id, order.userId);

            // Mark digital item as delivered
            await order.markDigitalItemDelivered(item.productId, downloadUrl);
          }
        }
      }
    } else {
      // Mark payment as failed
      order.paymentStatus = 'failed';
      await order.save();
    }

    return order;
  } catch (error) {
    console.error('Payment confirmation error:', error);
    throw error;
  }
};

/**
 * Generates a secure download URL for digital products
 * @param {string} productId - Product ID
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @returns {string} Secure download URL
 */
export const generateDigitalDownloadUrl = async (productId, orderId, userId) => {
  // In a real implementation, this would generate a signed URL with limited validity
  // For now, we'll just create a placeholder URL structure
  return `/api/download/${productId}/${orderId}/${userId}/${Date.now()}`;
};

/**
 * Processes a refund for an order
 * @param {string} orderId - Order ID
 * @param {Object} refundOptions - Refund options
 * @returns {Object} Refund result
 */
export const processRefund = async (orderId, refundOptions = {}) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    if (!['completed', 'delivered', 'shipped', 'processing'].includes(order.status)) {
      throw new Error(`Cannot refund order with status: ${order.status}`);
    }

    // Process refund through Stripe if that was the payment method
    if (order.paymentMethod === 'stripe' || order.paymentMethod === 'credit_card') {
      if (!stripe) {
        throw new Error('Stripe is not configured. Please set STRIPE_SECRET_KEY in your environment variables.');
      }

      const refundAmount = refundOptions.amount
        ? Math.round(refundOptions.amount * 100)
        : Math.round(order.totalAmount * 100);

      const refund = await stripe.refunds.create({
        payment_intent: order.paymentDetails.transactionId,
        amount: refundAmount,
        reason: refundOptions.reason || 'requested_by_customer'
      });

      // Update order status
      order.status = 'refunded';
      order.paymentStatus = 'refunded';
      order.notes = order.notes
        ? `${order.notes}\nRefund processed: ${refundOptions.reason || 'Customer request'}`
        : `Refund processed: ${refundOptions.reason || 'Customer request'}`;

      await order.save();

      return {
        success: true,
        refund,
        order
      };
    } else {
      // For other payment methods, just update the order status
      order.status = 'refunded';
      order.paymentStatus = 'refunded';
      order.notes = order.notes
        ? `${order.notes}\nRefund processed: ${refundOptions.reason || 'Customer request'}`
        : `Refund processed: ${refundOptions.reason || 'Customer request'}`;

      await order.save();

      return {
        success: true,
        order
      };
    }
  } catch (error) {
    console.error('Refund processing error:', error);
    throw error;
  }
};

/**
 * Calculates order summary including taxes and shipping
 * @param {Object} cart - User's cart
 * @param {Object} shippingDetails - Shipping details for tax calculation
 * @returns {Object} Order summary
 */
export const calculateOrderSummary = async (cart, shippingDetails = {}) => {
  const subtotal = cart.totalPrice;

  // Calculate tax (simplified - in production would use tax API)
  const taxRate = 0.08; // 8% tax rate
  const taxAmount = subtotal * taxRate;

  // Calculate shipping cost (simplified - in production would use shipping API)
  let shippingCost = 0;

  // Only calculate shipping if there are physical items
  const hasPhysicalItems = cart.items.some(item => !item.isDigital);

  if (hasPhysicalItems) {
    shippingCost = 5.99; // Base shipping cost

    // Add weight-based shipping
    const totalItems = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    if (totalItems > 10) {
      shippingCost += 10;
    } else if (totalItems > 5) {
      shippingCost += 5;
    }
  }

  const totalAmount = subtotal + taxAmount + shippingCost;

  return {
    subtotal,
    taxAmount,
    shippingCost,
    totalAmount
  };
};

export default {
  processCheckout,
  confirmPayment,
  processRefund,
  calculateOrderSummary,
  generateDigitalDownloadUrl
};
