import {
  AffiliateLink,
  AffiliateTracking,
  AffiliatePayout,
  AffiliateSettings
} from '../models/affiliateModel.js';
import Order from '../models/orderModel.js';
import crypto from 'crypto';

/**
 * Generate a unique affiliate code
 * @param {string} prefix - Optional prefix for the code
 * @returns {string} Unique affiliate code
 */
export const generateAffiliateCode = (prefix = '') => {
  const randomPart = crypto.randomBytes(4).toString('hex').toUpperCase();
  return prefix ? `${prefix}-${randomPart}` : randomPart;
};

/**
 * Create a new affiliate link
 * @param {Object} data - Affiliate link data
 * @returns {Object} Created affiliate link
 */
export const createAffiliateLink = async (data) => {
  try {
    // Generate a unique code if not provided
    if (!data.code) {
      let prefix = '';
      if (data.type === 'product') prefix = 'P';
      if (data.type === 'expert') prefix = 'E';
      if (data.type === 'bundle') prefix = 'B';

      data.code = generateAffiliateCode(prefix);
    }

    // Get settings to validate commission rate
    const settings = await AffiliateSettings.getCurrentSettings();

    // Validate commission rate against max allowed
    if (!data.commissionRate) {
      data.commissionRate = settings.defaultCommissionRate;
    } else if (data.commissionRate > 50) {
      data.commissionRate = 50; // Cap at 50%
    }

    // Create the affiliate link
    const affiliateLink = new AffiliateLink(data);
    await affiliateLink.save();

    return affiliateLink;
  } catch (error) {
    console.error('Error creating affiliate link:', error);
    throw error;
  }
};

/**
 * Track a click on an affiliate link
 * @param {string} code - Affiliate link code
 * @param {Object} tracking - Tracking data (sessionId, ipAddress, userAgent, referrer)
 * @returns {Object} Tracking information
 */
export const trackAffiliateClick = async (code, tracking) => {
  try {
    // Find the affiliate link
    const affiliateLink = await AffiliateLink.findOne({ code });

    if (!affiliateLink) {
      throw new Error('Affiliate link not found');
    }

    // Check if link has expired
    if (affiliateLink.expireAt && new Date() > affiliateLink.expireAt) {
      throw new Error('Affiliate link has expired');
    }

    // Update click count on the affiliate link
    await affiliateLink.trackClick();

    // Hash the IP address for privacy
    let ipHash = null;
    if (tracking.ipAddress) {
      ipHash = crypto
        .createHash('sha256')
        .update(tracking.ipAddress)
        .digest('hex');
    }

    // Check if we already have a tracking entry for this session
    let trackingEntry = await AffiliateTracking.findOne({
      affiliateLink: affiliateLink._id,
      sessionId: tracking.sessionId
    });

    if (trackingEntry) {
      // Update existing tracking
      trackingEntry.lastClick = new Date();
      trackingEntry.clickCount += 1;
      if (tracking.userAgent) trackingEntry.userAgent = tracking.userAgent;
      if (tracking.referrer) trackingEntry.referrer = tracking.referrer;

      await trackingEntry.save();
    } else {
      // Create new tracking entry
      trackingEntry = await AffiliateTracking.create({
        affiliateLink: affiliateLink._id,
        sessionId: tracking.sessionId,
        ipHash,
        userAgent: tracking.userAgent,
        referrer: tracking.referrer,
        firstClick: new Date(),
        lastClick: new Date()
      });
    }

    return {
      success: true,
      trackingId: trackingEntry._id,
      redirectUrl: affiliateLink.customUrl || null
    };
  } catch (error) {
    console.error('Error tracking affiliate click:', error);
    throw error;
  }
};

/**
 * Check and associate a user with affiliate tracking
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID from cookie
 */
export const associateUserWithTracking = async (userId, sessionId) => {
  try {
    if (!sessionId || !userId) return null;

    // Find tracking entries for this session
    const trackingEntries = await AffiliateTracking.find({
      sessionId,
      userId: { $exists: false } // Only update entries that don't have a user yet
    });

    if (trackingEntries.length === 0) return null;

    // Associate user with all tracking entries for this session
    await AffiliateTracking.updateMany(
      { sessionId, userId: { $exists: false } },
      { $set: { userId } }
    );

    return trackingEntries.length;
  } catch (error) {
    console.error('Error associating user with tracking:', error);
    return null;
  }
};

/**
 * Process affiliate commission for an order
 * @param {string} orderId - Order ID
 * @param {string} userId - User ID
 * @param {string} sessionId - Session ID from cookie
 * @returns {Object} Processing result
 */
export const processAffiliateCommission = async (orderId, userId, sessionId) => {
  try {
    // Check if this is a valid order
    const order = await Order.findById(orderId);
    if (!order || order.paymentStatus !== 'completed') {
      throw new Error('Order not found or payment not completed');
    }

    // Find tracking entries for this user and session
    const settings = await AffiliateSettings.getCurrentSettings();
    const cookieLifetimeMs = settings.cookieLifetime * 24 * 60 * 60 * 1000;
    const cutoffDate = new Date(Date.now() - cookieLifetimeMs);

    const trackingQuery = {
      $or: [
        { userId },
        { sessionId }
      ],
      lastClick: { $gte: cutoffDate },
      converted: false
    };

    // Find the most recent click
    const trackingEntry = await AffiliateTracking.findOne(trackingQuery)
      .sort({ lastClick: -1 })
      .populate('affiliateLink');

    if (!trackingEntry || !trackingEntry.affiliateLink) {
      // No valid affiliate tracking found
      return {
        success: false,
        message: 'No valid affiliate tracking found'
      };
    }

    const affiliateLink = trackingEntry.affiliateLink;

    // Check if the affiliate link matches items in this order
    const orderItems = order.items;
    let matchFound = false;
    let commissionAmount = 0;
    let totalAmount = 0;

    if (affiliateLink.type === 'product') {
      // Look for this product in the order
      const matchingItems = orderItems.filter(item =>
        item.productId.toString() === affiliateLink.itemId.toString()
      );

      if (matchingItems.length > 0) {
        matchFound = true;
        // Calculate the commission on these items
        totalAmount = matchingItems.reduce((sum, item) =>
          sum + (item.price * item.quantity), 0
        );
        commissionAmount = totalAmount * (affiliateLink.commissionRate / 100);
      }
    } else if (affiliateLink.type === 'expert') {
      // Look for products from this expert
      const matchingItems = orderItems.filter(item =>
        item.expertId.toString() === affiliateLink.itemId.toString()
      );

      if (matchingItems.length > 0) {
        matchFound = true;
        // Calculate the commission on these items
        totalAmount = matchingItems.reduce((sum, item) =>
          sum + (item.price * item.quantity), 0
        );
        commissionAmount = totalAmount * (affiliateLink.commissionRate / 100);
      }
    } else if (affiliateLink.type === 'bundle') {
      // Check if this order is for a bundle
      if (order.isBundle && order.bundleId &&
          order.bundleId.toString() === affiliateLink.itemId.toString()) {
        matchFound = true;
        // Calculate commission on the entire order
        totalAmount = order.subtotal;
        commissionAmount = totalAmount * (affiliateLink.commissionRate / 100);
      }
    }

    if (!matchFound) {
      return {
        success: false,
        message: 'No matching items found in order for this affiliate link'
      };
    }

    // Mark tracking as converted
    trackingEntry.converted = true;
    trackingEntry.userId = userId;
    trackingEntry.conversion = {
      orderId: order._id,
      amount: totalAmount,
      date: new Date()
    };
    await trackingEntry.save();

    // Track conversion on affiliate link
    await affiliateLink.trackConversion(totalAmount);

    // Add affiliate commission to order
    order.affiliateId = affiliateLink.expertId;
    order.affiliateCommission = commissionAmount;
    await order.save();

    return {
      success: true,
      message: 'Affiliate commission processed successfully',
      affiliation: {
        affiliateId: affiliateLink.expertId,
        commission: commissionAmount,
        trackingId: trackingEntry._id
      }
    };
  } catch (error) {
    console.error('Error processing affiliate commission:', error);
    throw error;
  }
};

/**
 * Get affiliate earnings for an expert
 * @param {string} expertId - Expert ID
 * @param {Object} options - Filter options (startDate, endDate, status)
 * @returns {Object} Earnings data
 */
export const getAffiliateEarnings = async (expertId, options = {}) => {
  try {
    const { startDate, endDate } = options;
    const query = { expertId };

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    // Get all affiliate links created by this expert
    const affiliateLinks = await AffiliateLink.find(query);

    const linkIds = affiliateLinks.map(link => link._id);

    // Get conversion statistics
    const conversions = await AffiliateTracking.find({
      affiliateLink: { $in: linkIds },
      converted: true
    }).populate('conversion.orderId');

    // Calculate total earnings, link activity, etc.
    const totalEarnings = affiliateLinks.reduce((sum, link) => sum + link.earnings, 0);
    const totalRevenue = affiliateLinks.reduce((sum, link) => sum + link.revenue, 0);
    const totalClicks = affiliateLinks.reduce((sum, link) => sum + link.clicks, 0);
    const totalConversions = affiliateLinks.reduce((sum, link) => sum + link.conversions, 0);

    // Get payouts
    const payouts = await AffiliatePayout.find({
      expertId,
      ...(options.status ? { status: options.status } : {})
    }).sort({ createdAt: -1 });

    const pendingPayout = totalEarnings - payouts.reduce((sum, payout) =>
      sum + (payout.status === 'completed' ? payout.amount : 0), 0
    );

    return {
      links: affiliateLinks,
      stats: {
        totalEarnings,
        pendingPayout,
        totalRevenue,
        totalClicks,
        totalConversions,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0
      },
      payouts,
      recentConversions: conversions.slice(0, 10)
    };
  } catch (error) {
    console.error('Error getting affiliate earnings:', error);
    throw error;
  }
};

export default {
  generateAffiliateCode,
  createAffiliateLink,
  trackAffiliateClick,
  associateUserWithTracking,
  processAffiliateCommission,
  getAffiliateEarnings
};
