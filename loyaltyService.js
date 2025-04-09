/**
 * Loyalty Service - Handles loyalty points, tiers, rewards, and referrals
 */

import Loyalty from '../models/loyaltyModel.js';
import User from '../models/userModel.js';
import Order from '../models/orderModel.js';

/**
 * Points earning rules
 */
const POINTS_CONFIG = {
  // Base points
  pointsPerDollar: 1,

  // Bonus points
  firstPurchaseBonus: 100,
  referralBonus: {
    referrer: 150,  // Points for the person referring
    referee: 100    // Points for the person being referred
  },
  productReviewBonus: 10,
  expertReviewBonus: 15,

  // Tier multipliers (multiply base points by these values)
  tierMultipliers: {
    bronze: 1.0,
    silver: 1.2,
    gold: 1.5,
    platinum: 2.0
  },

  // Points required to reach each tier
  tierThresholds: {
    bronze: 0,
    silver: 1000,
    gold: 5000,
    platinum: 15000
  }
};

/**
 * Reward definitions
 */
const REWARDS_CONFIG = {
  discountCodes: [
    {
      id: 'DISCOUNT5',
      name: '$5 OFF',
      description: '$5 off your next purchase',
      pointsCost: 200,
      value: 5,
      type: 'fixed'
    },
    {
      id: 'DISCOUNT10',
      name: '$10 OFF',
      description: '$10 off your next purchase',
      pointsCost: 400,
      value: 10,
      type: 'fixed'
    },
    {
      id: 'PERCENT10',
      name: '10% OFF',
      description: '10% off your next purchase',
      pointsCost: 500,
      value: 10,
      type: 'percentage'
    }
  ],
  freebies: [
    {
      id: 'FREE_CONSULT',
      name: 'Free 30-min Consultation',
      description: 'Get a free 30-minute consultation with an expert',
      pointsCost: 1500,
      type: 'service'
    }
  ],
  shipping: [
    {
      id: 'FREE_SHIPPING',
      name: 'Free Shipping',
      description: 'Free shipping on your next order',
      pointsCost: 300,
      type: 'shipping'
    }
  ]
};

/**
 * Get user's loyalty profile
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Loyalty profile
 */
export const getLoyaltyProfile = async (userId) => {
  try {
    let loyaltyProfile = await Loyalty.findOne({ userId }).populate({
      path: 'redeemHistory.rewardId'
    });

    // If no loyalty profile exists, create one
    if (!loyaltyProfile) {
      loyaltyProfile = await createLoyaltyProfile(userId);
    }

    // Calculate current tier
    const currentTier = calculateUserTier(loyaltyProfile.points);

    // Calculate points to next tier
    const nextTier = getNextTier(currentTier);
    const pointsToNextTier = nextTier ?
      POINTS_CONFIG.tierThresholds[nextTier] - loyaltyProfile.points : 0;

    // Calculate available rewards based on points
    const availableRewards = getAvailableRewards(loyaltyProfile.points);

    // Format the loyalty profile for response
    return {
      userId: loyaltyProfile.userId,
      referralCode: loyaltyProfile.referralCode,
      points: loyaltyProfile.points,
      lifetimePoints: loyaltyProfile.lifetimePoints,
      currentTier,
      nextTier,
      pointsToNextTier,
      tierProgress: calculateTierProgress(loyaltyProfile.points, currentTier, nextTier),
      redeemHistory: loyaltyProfile.redeemHistory,
      pointsHistory: loyaltyProfile.pointsHistory,
      joinDate: loyaltyProfile.createdAt,
      availableRewards,
      referrals: {
        count: loyaltyProfile.referrals.length,
        list: loyaltyProfile.referrals
      }
    };
  } catch (error) {
    console.error('Error in getLoyaltyProfile:', error);
    throw new Error('Failed to retrieve loyalty profile');
  }
};

/**
 * Create a new loyalty profile for a user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - New loyalty profile
 */
export const createLoyaltyProfile = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate a unique referral code
    const referralCode = generateReferralCode(user.username || user.email);

    const newLoyaltyProfile = new Loyalty({
      userId,
      referralCode,
      points: 0,
      lifetimePoints: 0,
      redeemHistory: [],
      pointsHistory: [
        {
          points: 0,
          reason: 'Account creation',
          timestamp: new Date()
        }
      ],
      referrals: []
    });

    return await newLoyaltyProfile.save();
  } catch (error) {
    console.error('Error in createLoyaltyProfile:', error);
    throw new Error('Failed to create loyalty profile');
  }
};

/**
 * Calculate the user's current tier based on points
 * @param {number} points - User's current points
 * @returns {string} - Current tier
 */
export const calculateUserTier = (points) => {
  const tiers = Object.keys(POINTS_CONFIG.tierThresholds);

  // Start from the highest tier and work down
  for (let i = tiers.length - 1; i >= 0; i--) {
    const tier = tiers[i];
    if (points >= POINTS_CONFIG.tierThresholds[tier]) {
      return tier;
    }
  }

  // Default to bronze
  return 'bronze';
};

/**
 * Get the next tier for a user
 * @param {string} currentTier - User's current tier
 * @returns {string|null} - Next tier or null if already at highest tier
 */
export const getNextTier = (currentTier) => {
  const tiers = Object.keys(POINTS_CONFIG.tierThresholds);
  const currentIndex = tiers.indexOf(currentTier);

  if (currentIndex === -1 || currentIndex === tiers.length - 1) {
    return null; // Already at highest tier or tier not found
  }

  return tiers[currentIndex + 1];
};

/**
 * Calculate progress towards next tier as a percentage
 * @param {number} points - User's current points
 * @param {string} currentTier - User's current tier
 * @param {string|null} nextTier - User's next tier
 * @returns {number} - Progress percentage (0-100)
 */
export const calculateTierProgress = (points, currentTier, nextTier) => {
  if (!nextTier) return 100; // Already at highest tier

  const currentThreshold = POINTS_CONFIG.tierThresholds[currentTier];
  const nextThreshold = POINTS_CONFIG.tierThresholds[nextTier];
  const tierRange = nextThreshold - currentThreshold;
  const userProgress = points - currentThreshold;

  return Math.min(100, Math.floor((userProgress / tierRange) * 100));
};

/**
 * Get available rewards based on user's points
 * @param {number} points - User's current points
 * @returns {Array} - List of available rewards
 */
export const getAvailableRewards = (points) => {
  // Combine all reward types
  const allRewards = [
    ...REWARDS_CONFIG.discountCodes,
    ...REWARDS_CONFIG.freebies,
    ...REWARDS_CONFIG.shipping
  ];

  // Filter rewards based on point cost
  return allRewards.filter(reward => reward.pointsCost <= points);
};

/**
 * Add points to a user's loyalty account
 * @param {string} userId - User ID
 * @param {number} points - Points to add
 * @param {string} reason - Reason for points
 * @param {string} reference - Reference ID (optional, e.g. order ID)
 * @returns {Promise<Object>} - Updated loyalty profile
 */
export const addPoints = async (userId, points, reason, reference = null) => {
  try {
    let loyaltyProfile = await Loyalty.findOne({ userId });

    // If no loyalty profile exists, create one
    if (!loyaltyProfile) {
      loyaltyProfile = await createLoyaltyProfile(userId);
    }

    // Get the user's current tier before adding points
    const previousTier = calculateUserTier(loyaltyProfile.points);

    // Add points
    loyaltyProfile.points += points;
    loyaltyProfile.lifetimePoints += points;

    // Record the transaction
    loyaltyProfile.pointsHistory.push({
      points,
      reason,
      reference,
      timestamp: new Date()
    });

    await loyaltyProfile.save();

    // Check if user has moved up a tier
    const newTier = calculateUserTier(loyaltyProfile.points);
    const tierUpgrade = newTier !== previousTier;

    return {
      updatedProfile: loyaltyProfile,
      tierUpgrade,
      previousTier,
      newTier
    };
  } catch (error) {
    console.error('Error in addPoints:', error);
    throw new Error('Failed to add points');
  }
};

/**
 * Redeem points for a reward
 * @param {string} userId - User ID
 * @param {string} rewardId - Reward ID
 * @returns {Promise<Object>} - Redemption result with coupon code
 */
export const redeemReward = async (userId, rewardId) => {
  try {
    const loyaltyProfile = await Loyalty.findOne({ userId });

    if (!loyaltyProfile) {
      throw new Error('Loyalty profile not found');
    }

    // Find the reward in our catalog
    const allRewards = [
      ...REWARDS_CONFIG.discountCodes,
      ...REWARDS_CONFIG.freebies,
      ...REWARDS_CONFIG.shipping
    ];

    const reward = allRewards.find(r => r.id === rewardId);

    if (!reward) {
      throw new Error('Reward not found');
    }

    // Check if user has enough points
    if (loyaltyProfile.points < reward.pointsCost) {
      throw new Error('Insufficient points');
    }

    // Generate a unique coupon code
    const couponCode = generateCouponCode(rewardId, userId);

    // Deduct points
    loyaltyProfile.points -= reward.pointsCost;

    // Record the redemption
    loyaltyProfile.redeemHistory.push({
      rewardId,
      pointsCost: reward.pointsCost,
      couponCode,
      redeemDate: new Date(),
      used: false
    });

    // Record the transaction in points history
    loyaltyProfile.pointsHistory.push({
      points: -reward.pointsCost,
      reason: `Redeemed ${reward.name}`,
      reference: rewardId,
      timestamp: new Date()
    });

    await loyaltyProfile.save();

    // Return the reward details with coupon code
    return {
      success: true,
      couponCode,
      reward: {
        ...reward,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      },
      pointsRemaining: loyaltyProfile.points
    };
  } catch (error) {
    console.error('Error in redeemReward:', error);
    throw new Error(error.message || 'Failed to redeem reward');
  }
};

/**
 * Add points for an order
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} - Points result
 */
export const processOrderPoints = async (orderId) => {
  try {
    const order = await Order.findById(orderId).populate('user');

    if (!order || !order.user) {
      throw new Error('Order or user not found');
    }

    const userId = order.user._id;

    // Get loyalty profile
    let loyaltyProfile = await Loyalty.findOne({ userId });

    // If no loyalty profile exists, create one
    if (!loyaltyProfile) {
      loyaltyProfile = await createLoyaltyProfile(userId);
    }

    // Calculate points based on order total
    const currentTier = calculateUserTier(loyaltyProfile.points);
    const tierMultiplier = POINTS_CONFIG.tierMultipliers[currentTier];

    // Base points calculation (rounded down)
    let basePoints = Math.floor(order.total * POINTS_CONFIG.pointsPerDollar * tierMultiplier);

    // Check if this is the user's first purchase
    const isFirstPurchase = order.user.orders && order.user.orders.length === 1;
    let bonusPoints = 0;
    let totalPoints = basePoints;

    // Add first purchase bonus if applicable
    if (isFirstPurchase) {
      bonusPoints += POINTS_CONFIG.firstPurchaseBonus;
      totalPoints += POINTS_CONFIG.firstPurchaseBonus;
    }

    // Add referral points if applicable
    if (order.referralCode) {
      await processReferralPoints(order.referralCode, userId, orderId);
    }

    // Add points to user's account
    await addPoints(
      userId,
      totalPoints,
      `Order #${order._id} ${bonusPoints ? `(includes ${bonusPoints} bonus points)` : ''}`,
      order._id
    );

    // Update order with points earned
    order.loyaltyPointsEarned = totalPoints;
    await order.save();

    return {
      userId,
      orderId,
      basePoints,
      bonusPoints,
      totalPoints,
      isFirstPurchase
    };
  } catch (error) {
    console.error('Error in processOrderPoints:', error);
    throw new Error('Failed to process order points');
  }
};

/**
 * Process referral points when a referred user makes a purchase
 * @param {string} referralCode - Referral code
 * @param {string} newUserId - New user ID (who was referred)
 * @param {string} orderId - Order ID
 * @returns {Promise<Object>} - Referral result
 */
export const processReferralPoints = async (referralCode, newUserId, orderId) => {
  try {
    // Find the referring user by referral code
    const referrerProfile = await Loyalty.findOne({ referralCode });

    if (!referrerProfile) {
      throw new Error('Invalid referral code');
    }

    const referrerId = referrerProfile.userId;

    // Make sure the referrer and new user are different
    if (referrerId.toString() === newUserId.toString()) {
      throw new Error('Cannot refer yourself');
    }

    // Check if this referral has already been processed
    const existingReferral = referrerProfile.referrals.find(
      ref => ref.referredUser.toString() === newUserId.toString()
    );

    if (existingReferral) {
      return { success: false, message: 'Referral already processed' };
    }

    // Add referral record to referrer's profile
    referrerProfile.referrals.push({
      referredUser: newUserId,
      orderId,
      date: new Date()
    });

    // Add points to referrer
    await addPoints(
      referrerId,
      POINTS_CONFIG.referralBonus.referrer,
      `Referral bonus for new user`,
      newUserId
    );

    // Add points to the new user (who was referred)
    await addPoints(
      newUserId,
      POINTS_CONFIG.referralBonus.referee,
      `Sign-up referral bonus`,
      referrerId
    );

    await referrerProfile.save();

    return {
      success: true,
      referrerId,
      newUserId,
      referrerPoints: POINTS_CONFIG.referralBonus.referrer,
      refereePoints: POINTS_CONFIG.referralBonus.referee
    };
  } catch (error) {
    console.error('Error in processReferralPoints:', error);
    throw new Error(error.message || 'Failed to process referral');
  }
};

/**
 * Add bonus points for product or expert reviews
 * @param {string} userId - User ID
 * @param {string} reviewId - Review ID
 * @param {string} reviewType - Type of review ('product' or 'expert')
 * @returns {Promise<Object>} - Updated points
 */
export const addReviewPoints = async (userId, reviewId, reviewType) => {
  try {
    // Determine points based on review type
    const points = reviewType === 'expert'
      ? POINTS_CONFIG.expertReviewBonus
      : POINTS_CONFIG.productReviewBonus;

    // Add points
    const result = await addPoints(
      userId,
      points,
      `${reviewType === 'expert' ? 'Expert' : 'Product'} review bonus`,
      reviewId
    );

    return {
      success: true,
      points,
      newTotalPoints: result.updatedProfile.points
    };
  } catch (error) {
    console.error('Error in addReviewPoints:', error);
    throw new Error('Failed to add review bonus points');
  }
};

/**
 * Generate a unique referral code for a user
 * @param {string} identifier - User identifier (username or email)
 * @returns {string} - Unique referral code
 */
const generateReferralCode = (identifier) => {
  // Extract the first part of the email or use the username
  const namePart = identifier.split('@')[0].replace(/[^a-zA-Z0-9]/g, '');

  // Get first 5 chars (or pad if shorter)
  const prefix = (namePart.substring(0, 5) + 'REFER').substring(0, 5).toUpperCase();

  // Add random suffix
  const randomPart = Math.floor(10000 + Math.random() * 90000);

  return `${prefix}${randomPart}`;
};

/**
 * Generate a unique coupon code for a reward redemption
 * @param {string} rewardId - Reward ID
 * @param {string} userId - User ID
 * @returns {string} - Unique coupon code
 */
const generateCouponCode = (rewardId, userId) => {
  // Get a short version of the reward ID
  const rewardPrefix = rewardId.replace(/[^A-Z0-9]/g, '').substring(0, 4);

  // Add timestamp
  const timestamp = Date.now().toString().substring(7);

  // Add user-specific part (last 4 chars of userId)
  const userPart = userId.toString().substring(userId.length - 4);

  return `${rewardPrefix}-${timestamp}-${userPart}`;
};

export default {
  getLoyaltyProfile,
  createLoyaltyProfile,
  addPoints,
  redeemReward,
  processOrderPoints,
  processReferralPoints,
  addReviewPoints,
  POINTS_CONFIG,
  REWARDS_CONFIG
};
