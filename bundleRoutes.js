import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import Bundle from '../models/bundleModel.js';
import Product from '../models/productModel.js';
import Cart from '../models/cartModel.js';

const router = express.Router();

/**
 * @route   GET /api/bundles
 * @desc    Get all bundles
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      category,
      expert: expertId,
      featured,
      limit = 20,
      page = 1,
      sort = 'createdAt',
      search
    } = req.query;

    const query = { status: 'active' };

    // Add filters if provided
    if (category) query.category = category;
    if (expertId) query.expertId = expertId;
    if (featured === 'true') query.featured = true;

    // Add text search if provided
    if (search) {
      query.$text = { $search: search };
    }

    // Ensure bundles are currently available
    query.$or = [
      { endDate: null },
      { endDate: { $gt: new Date() } }
    ];
    query.startDate = { $lte: new Date() };

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Determine sort order
    let sortOptions = {};
    if (sort === 'price-asc') {
      sortOptions = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOptions = { price: -1 };
    } else if (sort === 'discount') {
      sortOptions = { discountPercentage: -1 };
    } else if (sort === 'popularity') {
      sortOptions = { salesCount: -1 };
    } else {
      sortOptions = { createdAt: -1 }; // Default sort by newest
    }

    // Execute query with pagination and sorting
    const bundles = await Bundle.find(query)
      .populate('expertId', 'name profilePicture')
      .populate('items.productId', 'name images isDigital')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalBundles = await Bundle.countDocuments(query);

    res.json({
      bundles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalBundles,
        pages: Math.ceil(totalBundles / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching bundles:', error);
    res.status(500).json({ message: 'Failed to fetch bundles' });
  }
});

/**
 * @route   GET /api/bundles/featured
 * @desc    Get featured bundles
 * @access  Public
 */
router.get('/featured', async (req, res) => {
  try {
    const { limit = 4 } = req.query;
    const featuredBundles = await Bundle.getFeaturedBundles(parseInt(limit));

    res.json({ bundles: featuredBundles });
  } catch (error) {
    console.error('Error fetching featured bundles:', error);
    res.status(500).json({ message: 'Failed to fetch featured bundles' });
  }
});

/**
 * @route   GET /api/bundles/:slug
 * @desc    Get bundle by slug
 * @access  Public
 */
router.get('/:slug', async (req, res) => {
  try {
    const bundle = await Bundle.findOne({
      slug: req.params.slug,
      status: 'active'
    })
    .populate('expertId', 'name profilePicture rating bio')
    .populate('items.productId');

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Increment view count
    bundle.viewCount += 1;
    await bundle.save();

    // Check if bundle is available (based on dates)
    const isAvailable = bundle.isAvailable();

    // Get detailed bundle items with availability
    const bundleItems = await bundle.getItemsWithDetails();

    // Calculate availability status
    const allItemsAvailable = bundleItems.length === bundle.items.length;

    res.json({
      bundle: {
        ...bundle.toObject(),
        items: bundleItems,
        isAvailable: isAvailable && allItemsAvailable
      }
    });
  } catch (error) {
    console.error('Error fetching bundle:', error);
    res.status(500).json({ message: 'Failed to fetch bundle' });
  }
});

/**
 * @route   POST /api/bundles
 * @desc    Create a new bundle
 * @access  Private (Expert)
 */
router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      description,
      items,
      price,
      category,
      tags,
      image,
      additionalImages,
      featured,
      startDate,
      endDate,
      status
    } = req.body;

    // Validation
    if (!name || !description || !items || !items.length || !price || !category) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug already exists
    const existingBundle = await Bundle.findOne({ slug });
    if (existingBundle) {
      return res.status(400).json({ message: 'A bundle with this name already exists' });
    }

    // Validate products and add pricing
    const validatedItems = [];
    let originalTotalPrice = 0;

    for (const item of items) {
      const product = await Product.findById(item.productId);

      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      if (product.status !== 'active') {
        return res.status(400).json({ message: `Product is not available: ${product.name}` });
      }

      const quantity = item.quantity || 1;
      const originalPrice = product.price;
      const specialPrice = item.specialPrice || null;

      validatedItems.push({
        productId: product._id,
        quantity,
        originalPrice,
        specialPrice
      });

      originalTotalPrice += originalPrice * quantity;
    }

    // Create new bundle
    const bundle = new Bundle({
      name,
      slug,
      description,
      expertId: req.user._id,
      items: validatedItems,
      originalPrice: originalTotalPrice,
      price,
      category,
      tags: tags || [],
      image: image || 'https://same-assets.com/default-bundle.png',
      additionalImages: additionalImages || [],
      featured: featured || false,
      status: status || 'draft',
      startDate: startDate || new Date(),
      endDate: endDate || null
    });

    const savedBundle = await bundle.save();

    res.status(201).json({
      success: true,
      bundle: savedBundle
    });
  } catch (error) {
    console.error('Error creating bundle:', error);
    res.status(500).json({ message: 'Failed to create bundle' });
  }
});

/**
 * @route   PUT /api/bundles/:id
 * @desc    Update a bundle
 * @access  Private (Expert)
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id);

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Verify ownership
    if (bundle.expertId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this bundle' });
    }

    const {
      name,
      description,
      items,
      price,
      category,
      tags,
      image,
      additionalImages,
      featured,
      startDate,
      endDate,
      status
    } = req.body;

    // Update basic fields
    if (name) {
      bundle.name = name;
      // Update slug if name changes
      bundle.slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    }

    if (description) bundle.description = description;
    if (price) bundle.price = price;
    if (category) bundle.category = category;
    if (tags) bundle.tags = tags;
    if (image) bundle.image = image;
    if (additionalImages) bundle.additionalImages = additionalImages;
    if (featured !== undefined) bundle.featured = featured;
    if (startDate) bundle.startDate = startDate;
    if (endDate) bundle.endDate = endDate;
    if (status) bundle.status = status;

    // Update items if provided
    if (items && items.length > 0) {
      // Validate products and add pricing
      const validatedItems = [];
      let originalTotalPrice = 0;

      for (const item of items) {
        const product = await Product.findById(item.productId);

        if (!product) {
          return res.status(404).json({ message: `Product not found: ${item.productId}` });
        }

        if (product.status !== 'active') {
          return res.status(400).json({ message: `Product is not available: ${product.name}` });
        }

        const quantity = item.quantity || 1;
        const originalPrice = product.price;
        const specialPrice = item.specialPrice || null;

        validatedItems.push({
          productId: product._id,
          quantity,
          originalPrice,
          specialPrice
        });

        originalTotalPrice += originalPrice * quantity;
      }

      bundle.items = validatedItems;
      bundle.originalPrice = originalTotalPrice;
    }

    const updatedBundle = await bundle.save();

    res.json({
      success: true,
      bundle: updatedBundle
    });
  } catch (error) {
    console.error('Error updating bundle:', error);
    res.status(500).json({ message: 'Failed to update bundle' });
  }
});

/**
 * @route   DELETE /api/bundles/:id
 * @desc    Delete a bundle (set to archived)
 * @access  Private (Expert)
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const bundle = await Bundle.findById(req.params.id);

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found' });
    }

    // Verify ownership
    if (bundle.expertId.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this bundle' });
    }

    // Instead of deleting, mark as archived
    bundle.status = 'archived';
    await bundle.save();

    res.json({
      success: true,
      message: 'Bundle archived successfully'
    });
  } catch (error) {
    console.error('Error archiving bundle:', error);
    res.status(500).json({ message: 'Failed to archive bundle' });
  }
});

/**
 * @route   POST /api/bundles/:id/add-to-cart
 * @desc    Add all bundle items to cart
 * @access  Private
 */
router.post('/:id/add-to-cart', protect, async (req, res) => {
  try {
    const bundle = await Bundle.findOne({
      _id: req.params.id,
      status: 'active'
    }).populate('items.productId');

    if (!bundle) {
      return res.status(404).json({ message: 'Bundle not found or unavailable' });
    }

    // Check if bundle is available
    if (!bundle.isAvailable()) {
      return res.status(400).json({ message: 'This bundle is no longer available' });
    }

    // Check if all products in the bundle are available
    const bundleItems = await bundle.getItemsWithDetails();
    if (bundleItems.length !== bundle.items.length) {
      return res.status(400).json({ message: 'Some products in this bundle are no longer available' });
    }

    // Get user's cart
    const cart = await Cart.getCart(req.user._id);

    // Clear cart if requested
    if (req.body.clearCart) {
      await cart.clearCart();
    }

    // Add each bundle item to cart with special pricing
    for (const item of bundle.items) {
      const product = item.productId;
      const quantity = item.quantity;

      // If the bundle has special pricing for this product, use it
      if (item.specialPrice) {
        // Create a custom price override
        await cart.addItem(product, quantity, {
          priceOverride: item.specialPrice,
          bundleId: bundle._id,
          bundleName: bundle.name
        });
      } else {
        // Otherwise use regular pricing
        await cart.addItem(product, quantity, {
          bundleId: bundle._id,
          bundleName: bundle.name
        });
      }
    }

    // Increment bundle sales count
    bundle.salesCount += 1;
    await bundle.save();

    res.json({
      success: true,
      message: 'Bundle added to cart',
      cart
    });
  } catch (error) {
    console.error('Error adding bundle to cart:', error);
    res.status(500).json({ message: 'Failed to add bundle to cart' });
  }
});

/**
 * @route   GET /api/bundles/expert/my-bundles
 * @desc    Get bundles created by the logged-in expert
 * @access  Private (Expert)
 */
router.get('/expert/my-bundles', protect, async (req, res) => {
  try {
    const { status, limit = 20, page = 1 } = req.query;
    const query = { expertId: req.user._id };

    if (status) {
      query.status = status;
    }

    // Calculate pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Execute query with pagination
    const bundles = await Bundle.find(query)
      .populate('items.productId', 'name images status')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const totalBundles = await Bundle.countDocuments(query);

    res.json({
      bundles,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalBundles,
        pages: Math.ceil(totalBundles / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching expert bundles:', error);
    res.status(500).json({ message: 'Failed to fetch bundles' });
  }
});

export default router;
