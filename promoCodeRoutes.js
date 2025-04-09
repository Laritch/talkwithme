import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import PromoCode from '../models/promoCodeModel.js';
import Product from '../models/productModel.js';
import User from '../models/userModel.js';

const router = express.Router();

/**
 * @route   POST /api/promo-codes
 * @desc    Create a new promo code
 * @access  Admin only
 */
router.post('/', protect, admin, async (req, res) => {
  try {
    const {
      code,
      description,
      type,
      value,
      minPurchase,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      userType,
      eligibleUsers,
      categories,
      products,
      isActive
    } = req.body;

    // Validation
    if (!code || !description || !type || value === undefined || !endDate) {
      return res.status(400).json({ message: 'Required fields missing' });
    }

    // Check if code already exists
    const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
    if (existingCode) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }

    // Create new promo code
    const promoCode = new PromoCode({
      code: code.toUpperCase(),
      description,
      type,
      value,
      minPurchase: minPurchase || 0,
      maxDiscount: type === 'percentage' ? maxDiscount : null,
      startDate: startDate || new Date(),
      endDate,
      usageLimit,
      perUserLimit: perUserLimit || 1,
      userType: userType || 'all',
      eligibleUsers: eligibleUsers || [],
      categories: categories || [],
      products: products || [],
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user._id
    });

    const savedPromoCode = await promoCode.save();
    res.status(201).json(savedPromoCode);
  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(500).json({ message: 'Failed to create promo code' });
  }
});

/**
 * @route   GET /api/promo-codes
 * @desc    Get all promo codes (admin) or promo codes created by expert
 * @access  Admin
 */
router.get('/', protect, admin, async (req, res) => {
  try {
    const { active, page = 1, limit = 20 } = req.query;

    const query = {};
    if (active === 'true') query.isActive = true;
    if (active === 'false') query.isActive = false;

    // Pagination
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };

    const promoCodes = await PromoCode.find(query)
      .skip((options.page - 1) * options.limit)
      .limit(options.limit)
      .sort(options.sort);

    const total = await PromoCode.countDocuments(query);

    res.json({
      promoCodes,
      pagination: {
        page: options.page,
        limit: options.limit,
        total,
        pages: Math.ceil(total / options.limit)
      }
    });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ message: 'Failed to fetch promo codes' });
  }
});

/**
 * @route   GET /api/promo-codes/:id
 * @desc    Get a specific promo code
 * @access  Admin
 */
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id)
      .populate('products', 'name price')
      .populate('eligibleUsers', 'username email');

    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    res.json(promoCode);
  } catch (error) {
    console.error('Error fetching promo code:', error);
    res.status(500).json({ message: 'Failed to fetch promo code' });
  }
});

/**
 * @route   PUT /api/promo-codes/:id
 * @desc    Update a promo code
 * @access  Admin
 */
router.put('/:id', protect, admin, async (req, res) => {
  try {
    const {
      code,
      description,
      type,
      value,
      minPurchase,
      maxDiscount,
      startDate,
      endDate,
      usageLimit,
      perUserLimit,
      userType,
      eligibleUsers,
      categories,
      products,
      isActive
    } = req.body;

    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    // Check if new code already exists
    if (code && code.toUpperCase() !== promoCode.code) {
      const existingCode = await PromoCode.findOne({ code: code.toUpperCase() });
      if (existingCode) {
        return res.status(400).json({ message: 'Promo code already exists' });
      }
      promoCode.code = code.toUpperCase();
    }

    // Update fields if provided
    if (description) promoCode.description = description;
    if (type) promoCode.type = type;
    if (value !== undefined) promoCode.value = value;
    if (minPurchase !== undefined) promoCode.minPurchase = minPurchase;
    if (maxDiscount !== undefined) promoCode.maxDiscount = maxDiscount;
    if (startDate) promoCode.startDate = startDate;
    if (endDate) promoCode.endDate = endDate;
    if (usageLimit !== undefined) promoCode.usageLimit = usageLimit;
    if (perUserLimit !== undefined) promoCode.perUserLimit = perUserLimit;
    if (userType) promoCode.userType = userType;
    if (eligibleUsers) promoCode.eligibleUsers = eligibleUsers;
    if (categories) promoCode.categories = categories;
    if (products) promoCode.products = products;
    if (isActive !== undefined) promoCode.isActive = isActive;

    const updatedPromoCode = await promoCode.save();
    res.json(updatedPromoCode);
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({ message: 'Failed to update promo code' });
  }
});

/**
 * @route   DELETE /api/promo-codes/:id
 * @desc    Delete a promo code
 * @access  Admin
 */
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const promoCode = await PromoCode.findById(req.params.id);

    if (!promoCode) {
      return res.status(404).json({ message: 'Promo code not found' });
    }

    await promoCode.remove();
    res.json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({ message: 'Failed to delete promo code' });
  }
});

/**
 * @route   GET /api/promo-codes/validate/:code
 * @desc    Validate a promo code for the current user and cart
 * @access  Private
 */
router.post('/validate', protect, async (req, res) => {
  try {
    const { code, cartTotal, productIds, categoryIds } = req.body;

    if (!code || !cartTotal) {
      return res.status(400).json({ message: 'Code and cart total are required' });
    }

    const promoCode = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });

    if (!promoCode) {
      return res.status(404).json({ valid: false, message: 'Invalid promo code' });
    }

    const userId = req.user._id;

    // Check if code is valid for this user and cart
    const validationResult = await promoCode.isValidFor(
      userId,
      cartTotal,
      productIds || [],
      categoryIds || []
    );

    if (!validationResult.valid) {
      return res.status(400).json(validationResult);
    }

    // Calculate discount
    const items = req.body.items || [];
    const discountResult = promoCode.calculateDiscount(cartTotal, items);

    res.json({
      valid: true,
      message: validationResult.message,
      promoCode: {
        _id: promoCode._id,
        code: promoCode.code,
        type: promoCode.type,
        value: promoCode.value,
        description: promoCode.description
      },
      discount: discountResult
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ valid: false, message: 'Failed to validate promo code' });
  }
});

/**
 * @route   POST /api/promo-codes/apply
 * @desc    Apply a promo code to an order
 * @access  Private
 */
router.post('/apply', protect, async (req, res) => {
  try {
    const { code, orderId, orderAmount, discountAmount } = req.body;

    if (!code || !orderId || !orderAmount || discountAmount === undefined) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const promoCode = await PromoCode.findOne({ code: code.toUpperCase(), isActive: true });

    if (!promoCode) {
      return res.status(404).json({ success: false, message: 'Invalid promo code' });
    }

    // Record usage
    await promoCode.recordUsage(req.user._id, orderAmount, discountAmount);

    res.json({
      success: true,
      message: 'Promo code applied successfully',
      promoCode: {
        _id: promoCode._id,
        code: promoCode.code,
        type: promoCode.type,
        value: promoCode.value
      }
    });
  } catch (error) {
    console.error('Error applying promo code:', error);
    res.status(500).json({ success: false, message: 'Failed to apply promo code' });
  }
});

export default router;
