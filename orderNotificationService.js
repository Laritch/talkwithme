import emailService from './emailService.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Product from '../models/productModel.js';
import Expert from '../models/expertModel.js';

/**
 * Sends an order confirmation email to the customer
 * @param {string} orderId - The order ID
 */
export const sendOrderConfirmationEmail = async (orderId) => {
  try {
    // Fetch order details
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Get user details
    const user = await User.findById(order.userId);
    if (!user) {
      throw new Error(`User not found for order: ${orderId}`);
    }

    // Format order items
    const formattedItems = order.items.map(item => {
      const price = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(item.price);

      const total = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(item.price * item.quantity);

      return `${item.name} - ${price} x ${item.quantity} = ${total}`;
    }).join('\n');

    // Format order summary
    const subtotal = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(order.subtotal);

    const tax = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(order.tax);

    const shipping = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(order.shippingCost);

    const total = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(order.totalAmount);

    const orderSummary = `
Order Number: ${order.orderNumber}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Status: ${order.status.toUpperCase()}

Items:
${formattedItems}

Subtotal: ${subtotal}
Tax: ${tax}
Shipping: ${shipping}
Total: ${total}

Payment Method: ${order.paymentMethod.replace('_', ' ').toUpperCase()}
Payment Status: ${order.paymentStatus.toUpperCase()}

${order.isDigitalOnly ?
  'Your digital products will be available in your account.' :
  `Shipping Address:
${order.shippingDetails.fullName}
${order.shippingDetails.addressLine1}
${order.shippingDetails.addressLine2 ? order.shippingDetails.addressLine2 + '\n' : ''}
${order.shippingDetails.city}, ${order.shippingDetails.state} ${order.shippingDetails.postalCode}
${order.shippingDetails.country}`}

Thank you for your purchase!
If you have any questions, please contact us.
    `;

    // Send confirmation email
    await emailService.sendOrderConfirmationEmail({
      customerEmail: user.email,
      orderId: order.orderNumber,
      orderSummary
    });

    console.log(`Order confirmation email sent for order: ${order.orderNumber}`);

    // Send notification to each expert
    const expertIds = [...new Set(order.items.map(item => item.expertId.toString()))];
    for (const expertId of expertIds) {
      await sendExpertOrderNotification(order, expertId);
    }

    return true;
  } catch (error) {
    console.error('Error sending order confirmation email:', error);
    return false;
  }
};

/**
 * Sends a shipping confirmation email to the customer
 * @param {string} orderId - The order ID
 * @param {Object} trackingInfo - Tracking information
 */
export const sendShippingConfirmationEmail = async (orderId, trackingInfo) => {
  try {
    // Fetch order details
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Get user details
    const user = await User.findById(order.userId);
    if (!user) {
      throw new Error(`User not found for order: ${orderId}`);
    }

    // Generate estimated delivery date (5-7 business days from now)
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + 5 + Math.floor(Math.random() * 3)); // 5-7 days

    const estimatedDelivery = deliveryDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Send shipping email
    await emailService.sendShippingUpdateEmail({
      customerEmail: user.email,
      trackingNumber: trackingInfo.trackingNumber,
      estimatedDelivery,
      orderNumber: order.orderNumber
    });

    console.log(`Shipping confirmation email sent for order: ${order.orderNumber}`);
    return true;
  } catch (error) {
    console.error('Error sending shipping confirmation email:', error);
    return false;
  }
};

/**
 * Sends a digital product delivery email to the customer
 * @param {string} orderId - The order ID
 * @param {string} productId - The product ID
 * @param {string} downloadUrl - The download URL
 */
export const sendDigitalProductEmail = async (orderId, productId, downloadUrl) => {
  try {
    // Fetch order details
    const order = await Order.findById(orderId);
    if (!order) {
      throw new Error(`Order not found: ${orderId}`);
    }

    // Get user details
    const user = await User.findById(order.userId);
    if (!user) {
      throw new Error(`User not found for order: ${orderId}`);
    }

    // Get product details
    const product = await Product.findById(productId);
    if (!product) {
      throw new Error(`Product not found: ${productId}`);
    }

    // Prepare email content
    const subject = `Your Digital Download - ${product.name}`;
    const body = `
Dear ${user.username},

Thank you for your purchase of "${product.name}"!

Your digital download is now ready. Please click the link below to access your product:

${downloadUrl}

Order Number: ${order.orderNumber}
Purchase Date: ${new Date(order.createdAt).toLocaleDateString()}

This download link is tied to your account and should not be shared.

If you have any questions or need assistance, please don't hesitate to contact us.

Thank you for shopping with us!

Best regards,
The Expert Chat System Team
    `;

    // Send email
    const mailOptions = {
      from: `"Enhanced Chat System" <${process.env.EMAIL_FROM || 'noreply@chat.com'}>`,
      to: user.email,
      subject,
      text: body,
    };

    await emailService.sendEmail(mailOptions);
    console.log(`Digital product email sent for product: ${product.name} in order: ${order.orderNumber}`);
    return true;
  } catch (error) {
    console.error('Error sending digital product email:', error);
    return false;
  }
};

/**
 * Sends an order notification to the expert for their products in the order
 * @param {Object} order - The order object
 * @param {string} expertId - The expert ID
 */
export const sendExpertOrderNotification = async (order, expertId) => {
  try {
    // Get expert details
    const expert = await Expert.findById(expertId);
    if (!expert) {
      throw new Error(`Expert not found: ${expertId}`);
    }

    // Filter items for this expert
    const expertItems = order.items.filter(item =>
      item.expertId.toString() === expertId.toString()
    );

    if (expertItems.length === 0) {
      throw new Error(`No items for expert ${expertId} in order ${order._id}`);
    }

    // Format expert items
    const formattedItems = expertItems.map(item => {
      const price = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(item.price);

      const total = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(item.price * item.quantity);

      const commission = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(item.commissionAmount);

      const payout = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(item.expertPayoutAmount);

      return `${item.name} - ${price} x ${item.quantity} = ${total} (Payout: ${payout}, Commission: ${commission})`;
    }).join('\n');

    // Calculate totals for this expert
    const totalSales = expertItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    const totalCommission = expertItems.reduce((total, item) => total + item.commissionAmount, 0);
    const totalPayout = expertItems.reduce((total, item) => total + item.expertPayoutAmount, 0);

    const formattedTotalSales = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(totalSales);

    const formattedTotalCommission = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(totalCommission);

    const formattedTotalPayout = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(totalPayout);

    // Prepare email content
    const subject = `New Order Notification - Order #${order.orderNumber}`;
    const body = `
Dear ${expert.name},

Congratulations! You have received a new order.

Order Number: ${order.orderNumber}
Date: ${new Date(order.createdAt).toLocaleDateString()}
Status: ${order.status.toUpperCase()}

Your Items in this Order:
${formattedItems}

Order Summary for Your Items:
Total Sales: ${formattedTotalSales}
Platform Commission: ${formattedTotalCommission}
Your Payout: ${formattedTotalPayout}

${expertItems.some(item => !item.isDigital) ?
  'Please prepare to ship the physical products in this order.' :
  'All items in this order are digital products.'}

You can view the full order details in your expert dashboard.

Thank you for being a part of our platform!

Best regards,
The Expert Chat System Team
    `;

    // Send email
    const mailOptions = {
      from: `"Enhanced Chat System" <${process.env.EMAIL_FROM || 'noreply@chat.com'}>`,
      to: expert.email,
      subject,
      text: body,
    };

    await emailService.sendEmail(mailOptions);
    console.log(`Expert order notification sent to: ${expert.email} for order: ${order.orderNumber}`);
    return true;
  } catch (error) {
    console.error('Error sending expert order notification:', error);
    return false;
  }
};

export default {
  sendOrderConfirmationEmail,
  sendShippingConfirmationEmail,
  sendDigitalProductEmail,
  sendExpertOrderNotification
};
