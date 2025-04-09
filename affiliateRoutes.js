import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  AffiliateLink,
  AffiliateSettings
} from '../models/affiliateModel.js';
import * as affiliateService from '../services/affiliateService.js';

const router = express.Router();

/**
 * @route   GET /api/affiliate/settings
 * @desc    Get affiliate program settings
 * @access  Public
 */
router.get('/settings', async (req, res) => {
  try {
    const settings = await AffiliateSettings.getCurrentSettings();

    // Filter out sensitive information for public view
    const publicSettings = {
      isActive: settings.isActive,
      defaultCommissionRate: settings.defaultCommissionRate,
      cookieLifetime: settings.cookieLifetime,
      termsAndConditions: settings.termsAndConditions
    };

    res.json(publicSettings);
  } catch (error) {
    console.error('Error fetching affiliate settings:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate settings' });
  }
});

/**
 * @route   POST /api/affiliate/track
 * @desc    Track affiliate link click
 * @access  Public
 */
router.post('/track', async (req, res) => {
  try {
    const { code, sessionId, ipAddress, userAgent, referrer } = req.body;

    if (!code || !sessionId) {
      return res.status(400).json({ message: 'Affiliate code and session ID are required' });
    }

    const result = await affiliateService.trackAffiliateClick(code, {
      sessionId,
      ipAddress,
      userAgent,
      referrer
    });

    res.json(result);
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to track affiliate click'
    });
  }
});

/**
 * @route   POST /api/affiliate/associate
 * @desc    Associate user with affiliate tracking
 * @access  Private
 */
router.post('/associate', protect, async (req, res) => {
  try {
    const { sessionId } = req.body;
    const userId = req.user._id;

    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID is required' });
    }

    const result = await affiliateService.associateUserWithTracking(userId, sessionId);

    res.json({
      success: true,
      associated: result !== null,
      count: result || 0
    });
  } catch (error) {
    console.error('Error associating user with affiliate tracking:', error);
    res.status(500).json({ message: 'Failed to associate user' });
  }
});

/**
 * @route   GET /api/affiliate/links
 * @desc    Get affiliate links for an expert
 * @access  Private
 */
router.get('/links', protect, async (req, res) => {
  try {
    const { type, status } = req.query;
    const expertId = req.user._id;

    const query = { expertId };
    if (type) query.type = type;
    if (status === 'active') query.expireAt = { $gt: new Date() };

    const links = await AffiliateLink.find(query).sort({ createdAt: -1 });

    res.json({ links });
  } catch (error) {
    console.error('Error fetching affiliate links:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate links' });
  }
});

/**
 * @route   POST /api/affiliate/links
 * @desc    Create a new affiliate link
 * @access  Private
 */
router.post('/links', protect, async (req, res) => {
  try {
    const {
      type,
      itemId,
      code,
      commissionRate,
      customUrl,
      expireAt
    } = req.body;

    if (!type || !itemId) {
      return res.status(400).json({ message: 'Type and item ID are required' });
    }

    // Determine the item type based on the type field
    let itemType;
    if (type === 'product') itemType = 'Product';
    else if (type === 'expert') itemType = 'Expert';
    else if (type === 'bundle') itemType = 'Bundle';
    else return res.status(400).json({ message: 'Invalid type' });

    const linkData = {
      expertId: req.user._id,
      type,
      itemId,
      itemType,
      code,
      commissionRate,
      customUrl,
      expireAt: expireAt || null
    };

    const affiliateLink = await affiliateService.createAffiliateLink(linkData);

    res.status(201).json({
      success: true,
      link: affiliateLink
    });
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    res.status(500).json({ message: 'Failed to create affiliate link' });
  }
});

/**
 * @route   GET /api/affiliate/links/:id
 * @desc    Get a specific affiliate link
 * @access  Private
 */
router.get('/links/:id', protect, async (req, res) => {
  try {
    const link = await AffiliateLink.findById(req.params.id);

    if (!link) {
      return res.status(404).json({ message: 'Affiliate link not found' });
    }

    // Check ownership
    if (link.expertId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to view this link' });
    }

    res.json({ link });
  } catch (error) {
    console.error('Error fetching affiliate link:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate link' });
  }
});

/**
 * @route   PUT /api/affiliate/links/:id
 * @desc    Update an affiliate link
 * @access  Private
 */
router.put('/links/:id', protect, async (req, res) => {
  try {
    const link = await AffiliateLink.findById(req.params.id);

    if (!link) {
      return res.status(404).json({ message: 'Affiliate link not found' });
    }

    // Check ownership
    if (link.expertId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this link' });
    }

    const {
      code,
      commissionRate,
      customUrl,
      expireAt
    } = req.body;

    // Update fields if provided
    if (code) link.code = code;
    if (commissionRate !== undefined) {
      // Validate commission rate
      const settings = await AffiliateSettings.getCurrentSettings();
      link.commissionRate = Math.min(commissionRate, 50);
    }
    if (customUrl !== undefined) link.customUrl = customUrl;
    if (expireAt !== undefined) link.expireAt = expireAt;

    await link.save();

    res.json({
      success: true,
      link
    });
  } catch (error) {
    console.error('Error updating affiliate link:', error);
    res.status(500).json({ message: 'Failed to update affiliate link' });
  }
});

/**
 * @route   DELETE /api/affiliate/links/:id
 * @desc    Delete an affiliate link
 * @access  Private
 */
router.delete('/links/:id', protect, async (req, res) => {
  try {
    const link = await AffiliateLink.findById(req.params.id);

    if (!link) {
      return res.status(404).json({ message: 'Affiliate link not found' });
    }

    // Check ownership
    if (link.expertId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this link' });
    }

    await link.remove();

    res.json({
      success: true,
      message: 'Affiliate link deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting affiliate link:', error);
    res.status(500).json({ message: 'Failed to delete affiliate link' });
  }
});

/**
 * @route   GET /api/affiliate/earnings
 * @desc    Get affiliate earnings for an expert
 * @access  Private
 */
router.get('/earnings', protect, async (req, res) => {
  try {
    const { startDate, endDate, status } = req.query;
    const expertId = req.user._id;

    const earnings = await affiliateService.getAffiliateEarnings(expertId, {
      startDate,
      endDate,
      status
    });

    res.json(earnings);
  } catch (error) {
    console.error('Error fetching affiliate earnings:', error);
    res.status(500).json({ message: 'Failed to fetch affiliate earnings' });
  }
});

/**
 * @route   PUT /api/affiliate/settings
 * @desc    Update affiliate program settings
 * @access  Admin
 */
router.put('/settings', protect, admin, async (req, res) => {
  try {
    const {
      defaultCommissionRate,
      cookieLifetime,
      minimumPayout,
      isActive,
      termsAndConditions
    } = req.body;

    const settings = await AffiliateSettings.getCurrentSettings();

    // Update settings if provided
    if (defaultCommissionRate !== undefined) {
      settings.defaultCommissionRate = Math.min(Math.max(defaultCommissionRate, 0), 50);
    }
    if (cookieLifetime !== undefined) {
      settings.cookieLifetime = Math.min(Math.max(cookieLifetime, 1), 365);
    }
    if (minimumPayout !== undefined) {
      settings.minimumPayout = Math.max(minimumPayout, 0);
    }
    if (isActive !== undefined) {
      settings.isActive = isActive;
    }
    if (termsAndConditions) {
      settings.termsAndConditions = termsAndConditions;
    }

    settings.updatedAt = new Date();
    settings.updatedBy = req.user._id;

    await settings.save();

    res.json({
      success: true,
      settings
    });
  } catch (error) {
    console.error('Error updating affiliate settings:', error);
    res.status(500).json({ message: 'Failed to update affiliate settings' });
  }
});

export default router;
