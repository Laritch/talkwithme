import express from 'express';
import { authMiddleware } from '../middleware/authMiddleware.js';
import User from '../models/userModel.js';
import RegionFeeConfig from '../models/regionFeeConfigModel.js';

const router = express.Router();

// Admin middleware
const adminMiddleware = async (req, res, next) => {
  try {
    // Check if user exists and is an admin
    const user = await User.findById(req.user._id);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: 'Access denied: Admin privileges required' });
    }
    next();
  } catch (error) {
    console.error('Admin middleware error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * @route GET /api/admin/region-fees
 * @desc Get all region fee configurations
 * @access Private/Admin
 */
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const regionFees = await RegionFeeConfig.find();
    res.json(regionFees);
  } catch (error) {
    console.error('Error fetching region fees:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/admin/region-fees/:id
 * @desc Get region fee configuration by ID
 * @access Private/Admin
 */
router.get('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const regionFee = await RegionFeeConfig.findById(req.params.id);

    if (!regionFee) {
      return res.status(404).json({ message: 'Region fee configuration not found' });
    }

    res.json(regionFee);
  } catch (error) {
    console.error('Error fetching region fee configuration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/admin/region-fees
 * @desc Create new region fee configuration
 * @access Private/Admin
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      regionName,
      regionCode,
      baseFeePercentage,
      baseFeeFixed,
      currencyCode,
      processors,
      active
    } = req.body;

    // Check if region already exists
    const existingRegion = await RegionFeeConfig.findOne({ regionCode });
    if (existingRegion) {
      return res.status(400).json({ message: 'Region fee configuration already exists' });
    }

    // Create new region fee configuration
    const newRegionFee = new RegionFeeConfig({
      regionName,
      regionCode,
      baseFeePercentage,
      baseFeeFixed,
      currencyCode,
      processors,
      active: active !== undefined ? active : true
    });

    await newRegionFee.save();

    res.status(201).json(newRegionFee);
  } catch (error) {
    console.error('Error creating region fee configuration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route PUT /api/admin/region-fees/:id
 * @desc Update region fee configuration
 * @access Private/Admin
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const {
      regionName,
      regionCode,
      baseFeePercentage,
      baseFeeFixed,
      currencyCode,
      processors,
      active
    } = req.body;

    // Find and update region fee configuration
    const regionFee = await RegionFeeConfig.findById(req.params.id);

    if (!regionFee) {
      return res.status(404).json({ message: 'Region fee configuration not found' });
    }

    // Update fields
    if (regionName) regionFee.regionName = regionName;
    if (regionCode) regionFee.regionCode = regionCode;
    if (baseFeePercentage !== undefined) regionFee.baseFeePercentage = baseFeePercentage;
    if (baseFeeFixed !== undefined) regionFee.baseFeeFixed = baseFeeFixed;
    if (currencyCode) regionFee.currencyCode = currencyCode;
    if (processors) regionFee.processors = processors;
    if (active !== undefined) regionFee.active = active;

    await regionFee.save();

    res.json(regionFee);
  } catch (error) {
    console.error('Error updating region fee configuration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/admin/region-fees/:id
 * @desc Delete region fee configuration
 * @access Private/Admin
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Find and delete region fee configuration
    const regionFee = await RegionFeeConfig.findById(req.params.id);

    if (!regionFee) {
      return res.status(404).json({ message: 'Region fee configuration not found' });
    }

    await regionFee.deleteOne();

    res.json({ message: 'Region fee configuration deleted successfully' });
  } catch (error) {
    console.error('Error deleting region fee configuration:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
