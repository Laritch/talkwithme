import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as loyaltyService from '../services/loyaltyService.js';

const router = express.Router();

/**
 * @route   GET /api/loyalty/profile
 * @desc    Get user's loyalty profile
 * @access  Private
 */
router.get('/profile', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const loyaltyDetails = await loyaltyService.getLoyaltyTierDetails(userId);
    res.json(loyaltyDetails);
  } catch (error) {
    console.error('Error fetching loyalty profile:', error);
    res.status(500).json({ message: 'Failed to fetch loyalty profile' });
  }
});

/**
 * @route   GET /api/loyalty/history
 * @desc    Get user's loyalty point history
 * @access  Private
 */
router.get('/history', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { limit = 20 } = req.query;
    const transactions = await loyaltyService.getPointTransactionHistory(userId, parseInt(limit));
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching loyalty history:', error);
    res.status(500).json({ message: 'Failed to fetch loyalty history' });
  }
});

/**
 * @route   GET /api/loyalty/referral-code
 * @desc    Get or generate user's referral code
 * @access  Private
 */
router.get('/referral-code', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const referralCode = await loyaltyService.getReferralCode(userId);
    res.json({ referralCode });
  } catch (error) {
    console.error('Error getting referral code:', error);
    res.status(500).json({ message: 'Failed to get referral code' });
  }
});

/**
 * @route   POST /api/loyalty/apply-referral
 * @desc    Apply a referral code
 * @access  Private
 */
router.post('/apply-referral', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { referralCode } = req.body;

    if (!referralCode) {
      return res.status(400).json({ message: 'Referral code is required' });
    }

    const result = await loyaltyService.processReferral(userId, referralCode);
    res.json(result);
  } catch (error) {
    console.error('Error applying referral code:', error);
    res.status(500).json({ message: 'Failed to apply referral code' });
  }
});

/**
 * @route   POST /api/loyalty/redeem-points
 * @desc    Redeem points for a reward
 * @access  Private
 */
router.post('/redeem-points', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { rewardType, pointsCost } = req.body;

    if (!rewardType || !pointsCost) {
      return res.status(400).json({ message: 'Reward type and points cost are required' });
    }

    // Get loyalty profile
    const loyalty = await loyaltyService.getOrCreateLoyaltyProfile(userId);

    // Check if user has enough points
    if (loyalty.points < pointsCost) {
      return res.status(400).json({
        message: 'Not enough points',
        currentPoints: loyalty.points,
        pointsNeeded: pointsCost
      });
    }

    // Use points
    await loyalty.usePoints(pointsCost, `Redeemed for ${rewardType} reward`);

    // Generate reward based on type
    let rewardValue = 0;
    let expiryDays = 30;

    switch (rewardType) {
      case 'discount5':
        rewardValue = 5;
        break;
      case 'discount10':
        rewardValue = 10;
        break;
      case 'discount15':
        rewardValue = 15;
        break;
      case 'discount20':
        rewardValue = 20;
        break;
      case 'freeShipping':
        rewardValue = 100;
        break;
      case 'birthdayBonus':
        rewardValue = 500;
        expiryDays = 14;
        break;
      default:
        return res.status(400).json({ message: 'Invalid reward type' });
    }

    // Add reward to user's account
    const rewardCode = await loyalty.addReward(
      rewardType === 'freeShipping' ? 'freeShipping' : 'discount',
      rewardValue,
      expiryDays
    );

    res.json({
      success: true,
      message: 'Points successfully redeemed',
      reward: {
        type: rewardType,
        value: rewardValue,
        code: rewardCode,
        expiresIn: expiryDays
      },
      remainingPoints: loyalty.points
    });
  } catch (error) {
    console.error('Error redeeming points:', error);
    res.status(500).json({ message: 'Failed to redeem points' });
  }
});

/**
 * @route   GET /api/loyalty/rewards
 * @desc    Get user's available rewards
 * @access  Private
 */
router.get('/rewards', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const loyalty = await loyaltyService.getOrCreateLoyaltyProfile(userId);

    // Filter out used or expired rewards
    const availableRewards = loyalty.availableRewards.filter(
      reward => !reward.isUsed && reward.expiry > new Date()
    );

    res.json(availableRewards);
  } catch (error) {
    console.error('Error fetching rewards:', error);
    res.status(500).json({ message: 'Failed to fetch rewards' });
  }
});

/**
 * @route   POST /api/loyalty/apply-reward
 * @desc    Apply a reward to an order
 * @access  Private
 */
router.post('/apply-reward', protect, async (req, res) => {
  try {
    const userId = req.user._id;
    const { rewardCode, orderDetails } = req.body;

    if (!rewardCode || !orderDetails) {
      return res.status(400).json({ message: 'Reward code and order details are required' });
    }

    const result = await loyaltyService.applyRewardToOrder(userId, rewardCode, orderDetails);
    res.json(result);
  } catch (error) {
    console.error('Error applying reward:', error);
    res.status(500).json({ message: 'Failed to apply reward' });
  }
});

/**
 * @route   GET /api/loyalty/tiers
 * @desc    Get all loyalty tiers
 * @access  Public
 */
router.get('/tiers', async (req, res) => {
  try {
    const tiers = await loyaltyService.getAllLoyaltyTiers();
    res.json(tiers);
  } catch (error) {
    console.error('Error fetching loyalty tiers:', error);
    res.status(500).json({ message: 'Failed to fetch loyalty tiers' });
  }
});

export default router;
