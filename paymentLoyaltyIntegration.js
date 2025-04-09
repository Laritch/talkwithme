/**
 * Payment-Loyalty Integration Service
 *
 * Connects the Enhanced Payment Service with the Loyalty Service to provide
 * an integrated experience. Handles awarding loyalty points for
 * transactions and applying loyalty benefits to payments.
 */
import * as enhancedPaymentService from './enhancedPaymentService.js';
import * as loyaltyService from './loyaltyService.js';
import { CustomerLoyalty } from '../models/loyaltyModel.js';
import Order from '../models/orderModel.js';

/**
 * Process a payment with loyalty benefits
 * @param {Object} paymentDetails - Payment details
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Payment result with loyalty info
 */
export const processPaymentWithLoyalty = async (paymentDetails, userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    // Get client's loyalty information
    let clientLoyaltyInfo = await CustomerLoyalty.findOne({ userId });

    if (!clientLoyaltyInfo) {
      // Create a loyalty profile if one doesn't exist
      clientLoyaltyInfo = await loyaltyService.createLoyaltyProfile(userId);
    }

    // Apply any loyalty discounts or benefits
    const modifiedPaymentDetails = await applyLoyaltyBenefits(paymentDetails, clientLoyaltyInfo);

    // Process the payment
    const paymentResult = await enhancedPaymentService.processPayment(modifiedPaymentDetails);

    if (!paymentResult.success) {
      return paymentResult;
    }

    // Pre-calculate expected points (will be officially awarded when payment completes)
    const transactionInfo = {
      amount: modifiedPaymentDetails.amount,
      paymentType: modifiedPaymentDetails.paymentType || 'product'
    };

    const expectedPoints = enhancedPaymentService.calculateLoyaltyPoints(
      transactionInfo,
      { tier: clientLoyaltyInfo.tier }
    );

    // Store expected points information for later processing
    if (paymentDetails.orderId) {
      try {
        const order = await Order.findById(paymentDetails.orderId);
        if (order) {
          order.expectedLoyaltyPoints = expectedPoints;
          await order.save();
        }
      } catch (orderError) {
        console.error('Error updating order with expected loyalty points:', orderError);
        // Don't fail the payment if this fails
      }
    }

    return {
      ...paymentResult,
      loyalty: {
        expectedPoints,
        currentTier: clientLoyaltyInfo.tier,
        currentPoints: clientLoyaltyInfo.points,
        pointsRedeemed: modifiedPaymentDetails.pointsRedeemed || 0
      }
    };
  } catch (error) {
    console.error('Error in processPaymentWithLoyalty:', error);
    return {
      success: false,
      message: error.message || 'Failed to process payment with loyalty benefits'
    };
  }
};

/**
 * Apply loyalty benefits to a payment
 * @param {Object} paymentDetails - Original payment details
 * @param {Object} loyaltyInfo - Client's loyalty information
 * @returns {Promise<Object>} - Modified payment details
 */
export const applyLoyaltyBenefits = async (paymentDetails, loyaltyInfo) => {
  const modifiedDetails = { ...paymentDetails };

  // Apply expert tier commission benefit if applicable
  if (paymentDetails.expertId) {
    try {
      const expertLoyalty = await CustomerLoyalty.findOne({ userId: paymentDetails.expertId });
      if (expertLoyalty) {
        modifiedDetails.expertTier = expertLoyalty.tier;
      }
    } catch (error) {
      console.error('Error getting expert loyalty info:', error);
      // Don't fail if we can't get expert tier
    }
  }

  // Apply points redemption if specified
  if (paymentDetails.redeemPoints && loyaltyInfo.points > 0) {
    const pointsToRedeem = Math.min(
      paymentDetails.redeemPoints,
      loyaltyInfo.points,
      // Maximum 50% of purchase can be paid with points
      Math.floor(paymentDetails.amount * 50 * loyaltyService.POINTS_CONFIG.pointsPerDollar)
    );

    if (pointsToRedeem > 0) {
      // 100 points = $1 (adjust according to your actual conversion rate)
      const pointsValue = pointsToRedeem / 100;

      // Reduce the payment amount by the points value
      modifiedDetails.amount = Math.max(0, modifiedDetails.amount - pointsValue);
      modifiedDetails.pointsRedeemed = pointsToRedeem;
      modifiedDetails.pointsValue = pointsValue;

      // Deduct points from loyalty account
      await loyaltyService.addPoints(
        loyaltyInfo.userId,
        -pointsToRedeem,
        'Points redemption for purchase',
        paymentDetails.orderId || null
      );
    }
  }

  // Apply loyalty tier discount based on payment type
  if (loyaltyInfo.tier && paymentDetails.applyTierDiscount) {
    let discountRate = 0;

    switch (loyaltyInfo.tier) {
      case 'platinum':
        discountRate = 0.10; // 10% discount
        break;
      case 'gold':
        discountRate = 0.07; // 7% discount
        break;
      case 'silver':
        discountRate = 0.05; // 5% discount
        break;
      case 'bronze':
        discountRate = 0.03; // 3% discount
        break;
    }

    if (discountRate > 0) {
      const discountAmount = modifiedDetails.amount * discountRate;
      modifiedDetails.amount -= discountAmount;
      modifiedDetails.loyaltyDiscount = {
        rate: discountRate,
        amount: discountAmount
      };
    }
  }

  return modifiedDetails;
};

/**
 * Process loyalty points after payment completion
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} - Processing result
 */
export const processLoyaltyAfterPayment = async (orderId) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    // Skip if order is not paid or already processed loyalty
    if (order.paymentStatus !== 'completed' || order.loyaltyProcessed) {
      return {
        success: false,
        message: 'Order not eligible for loyalty processing'
      };
    }

    // Determine points to award
    let pointsToAward = order.expectedLoyaltyPoints;

    // If no points were pre-calculated, do it now
    if (!pointsToAward) {
      // Get client's loyalty info
      const clientLoyalty = await CustomerLoyalty.findOne({ userId: order.userId });

      if (!clientLoyalty) {
        // Create loyalty profile if it doesn't exist
        await loyaltyService.createLoyaltyProfile(order.userId);
      }

      // Calculate points based on order total
      const transactionInfo = {
        amount: order.totalAmount,
        paymentType: order.items.length > 1 ? 'bundle' : 'product'
      };

      pointsToAward = enhancedPaymentService.calculateLoyaltyPoints(
        transactionInfo,
        clientLoyalty
      );
    }

    if (pointsToAward > 0) {
      // Add points to client's account
      const pointsResult = await loyaltyService.addPoints(
        order.userId,
        pointsToAward,
        `Order #${order._id}`,
        order._id
      );

      // Update order with points info
      order.loyaltyPointsEarned = pointsToAward;
      order.loyaltyProcessed = true;
      await order.save();

      // Check for expert commissions and loyalty
      const expertItems = order.items.filter(item => item.expertId);
      if (expertItems.length > 0) {
        // Group items by expert
        const expertItemsMap = {};
        expertItems.forEach(item => {
          if (!expertItemsMap[item.expertId]) {
            expertItemsMap[item.expertId] = [];
          }
          expertItemsMap[item.expertId].push(item);
        });

        // Process each expert's commission and loyalty
        for (const expertId of Object.keys(expertItemsMap)) {
          const items = expertItemsMap[expertId];
          const expertTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

          // Award loyalty points to expert (50% of client points ratio)
          const expertPoints = Math.floor(
            (expertTotal / order.totalAmount) * pointsToAward * 0.5
          );

          if (expertPoints > 0) {
            await loyaltyService.addPoints(
              expertId,
              expertPoints,
              `Commission for Order #${order._id}`,
              order._id
            );
          }
        }
      }

      return {
        success: true,
        pointsEarned: pointsToAward,
        newTotal: pointsResult.updatedProfile.points,
        tierUpgrade: pointsResult.tierUpgrade,
        currentTier: pointsResult.newTier
      };
    }

    return {
      success: true,
      pointsEarned: 0,
      message: 'No points awarded for this order'
    };
  } catch (error) {
    console.error('Error processing loyalty after payment:', error);
    return {
      success: false,
      message: error.message || 'Failed to process loyalty points'
    };
  }
};

/**
 * Process a subscription with loyalty benefits
 * @param {Object} subscriptionDetails - Subscription details
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Subscription result with loyalty info
 */
export const processSubscriptionWithLoyalty = async (subscriptionDetails, userId) => {
  if (!userId) {
    throw new Error('User ID is required');
  }

  try {
    // Get client's loyalty information
    let clientLoyaltyInfo = await CustomerLoyalty.findOne({ userId });

    if (!clientLoyaltyInfo) {
      clientLoyaltyInfo = await loyaltyService.createLoyaltyProfile(userId);
    }

    // Apply tier discount if applicable
    const tierDiscount = getSubscriptionTierDiscount(clientLoyaltyInfo.tier);
    let discountedAmount = subscriptionDetails.amount;

    if (tierDiscount > 0) {
      discountedAmount *= (1 - tierDiscount);
      subscriptionDetails.originalAmount = subscriptionDetails.amount;
      subscriptionDetails.amount = discountedAmount;
      subscriptionDetails.discount = {
        rate: tierDiscount,
        amount: subscriptionDetails.originalAmount - discountedAmount
      };
    }

    // Process the subscription
    const subscriptionResult = await enhancedPaymentService.processSubscription({
      ...subscriptionDetails,
      userId
    });

    if (!subscriptionResult.success) {
      return subscriptionResult;
    }

    // Calculate loyalty points for subscription
    const pointsToAward = enhancedPaymentService.calculateLoyaltyPoints(
      {
        amount: discountedAmount,
        paymentType: 'subscription'
      },
      { tier: clientLoyaltyInfo.tier }
    );

    // Add loyalty points
    if (pointsToAward > 0) {
      await loyaltyService.addPoints(
        userId,
        pointsToAward,
        `Subscription: ${subscriptionDetails.planId}`,
        subscriptionResult.subscriptionId
      );
    }

    return {
      ...subscriptionResult,
      loyalty: {
        pointsAwarded: pointsToAward,
        tierDiscount: tierDiscount > 0 ? (tierDiscount * 100) + '%' : null,
        currentTier: clientLoyaltyInfo.tier,
        currentPoints: clientLoyaltyInfo.points + pointsToAward
      }
    };
  } catch (error) {
    console.error('Error in processSubscriptionWithLoyalty:', error);
    return {
      success: false,
      message: error.message || 'Failed to process subscription with loyalty benefits'
    };
  }
};

/**
 * Get subscription discount based on loyalty tier
 * @param {string} tier - Loyalty tier
 * @returns {number} - Discount rate (0-1)
 */
const getSubscriptionTierDiscount = (tier) => {
  switch (tier.toLowerCase()) {
    case 'platinum': return 0.20; // 20% discount
    case 'gold': return 0.15;     // 15% discount
    case 'silver': return 0.10;   // 10% discount
    case 'bronze': return 0.05;   // 5% discount
    default: return 0;
  }
};

/**
 * Get all available loyalty rewards for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Available rewards
 */
export const getAvailableLoyaltyRewards = async (userId) => {
  try {
    const loyaltyProfile = await loyaltyService.getLoyaltyProfile(userId);

    if (!loyaltyProfile) {
      return {
        success: false,
        message: 'Loyalty profile not found'
      };
    }

    return {
      success: true,
      rewards: loyaltyProfile.availableRewards,
      points: loyaltyProfile.points,
      tier: loyaltyProfile.currentTier
    };
  } catch (error) {
    console.error('Error getting available loyalty rewards:', error);
    return {
      success: false,
      message: error.message || 'Failed to get loyalty rewards'
    };
  }
};

export default {
  processPaymentWithLoyalty,
  processSubscriptionWithLoyalty,
  processLoyaltyAfterPayment,
  getAvailableLoyaltyRewards,
  applyLoyaltyBenefits
};
