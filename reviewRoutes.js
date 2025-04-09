import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import Product from '../models/productModel.js';
import Order from '../models/orderModel.js';

const router = express.Router();

/**
 * @route   POST /api/reviews
 * @desc    Create a new product review
 * @access  Private
 */
router.post('/', protect, async (req, res) => {
  try {
    const { productId, rating, review } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ message: 'Product ID and rating are required' });
    }

    // Rating must be between 1 and 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user has purchased this product
    const hasPurchased = await Order.exists({
      userId: req.user._id,
      'items.productId': productId,
      status: { $in: ['completed', 'delivered'] }
    });

    if (!hasPurchased) {
      return res.status(403).json({
        message: 'You can only review products you have purchased'
      });
    }

    // Check if user has already reviewed this product
    const alreadyReviewed = product.reviews.find(
      r => r.userId.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({
        message: 'You have already reviewed this product'
      });
    }

    // Create the review
    const newReview = {
      userId: req.user._id,
      name: req.user.username || 'User',
      rating: Number(rating),
      review: review || '',
      createdAt: new Date()
    };

    // Add review to product
    product.reviews.push(newReview);

    // Update product rating
    product.rating.count = product.reviews.length;
    product.rating.average =
      product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      product.reviews.length;

    // Save the product
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review added successfully',
      review: newReview
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   PUT /api/reviews/:id
 * @desc    Update a product review
 * @access  Private
 */
router.put('/:id', protect, async (req, res) => {
  try {
    const { productId, rating, review } = req.body;

    if (!productId || !rating) {
      return res.status(400).json({ message: 'Product ID and rating are required' });
    }

    // Rating must be between 1 and 5
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find the review by ID and ensure it belongs to the user
    const reviewIndex = product.reviews.findIndex(
      r => r._id.toString() === req.params.id &&
           r.userId.toString() === req.user._id.toString()
    );

    if (reviewIndex === -1) {
      return res.status(404).json({
        message: 'Review not found or you are not authorized to update it'
      });
    }

    // Update the review
    product.reviews[reviewIndex].rating = Number(rating);
    if (review) {
      product.reviews[reviewIndex].review = review;
    }
    product.reviews[reviewIndex].updatedAt = new Date();

    // Update product rating
    product.rating.average =
      product.reviews.reduce((sum, review) => sum + review.rating, 0) /
      product.reviews.length;

    // Save the product
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      review: product.reviews[reviewIndex]
    });
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   DELETE /api/reviews/:id
 * @desc    Delete a product review
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: 'Product ID is required' });
    }

    // Find the product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Find the review by ID and ensure it belongs to the user
    const reviewIndex = product.reviews.findIndex(
      r => r._id.toString() === req.params.id &&
           r.userId.toString() === req.user._id.toString()
    );

    if (reviewIndex === -1) {
      return res.status(404).json({
        message: 'Review not found or you are not authorized to delete it'
      });
    }

    // Remove the review
    product.reviews.splice(reviewIndex, 1);

    // Update product rating
    product.rating.count = product.reviews.length;
    product.rating.average = product.reviews.length > 0
      ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
      : 0;

    // Save the product
    await product.save();

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reviews/product/:productId
 * @desc    Get all reviews for a product
 * @access  Public
 */
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;

    // Find the product
    const product = await Product.findById(productId)
      .populate('reviews.userId', 'username profilePicture');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({
      success: true,
      reviews: product.reviews,
      rating: product.rating
    });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route   GET /api/reviews/user
 * @desc    Get all reviews by the current user
 * @access  Private
 */
router.get('/user', protect, async (req, res) => {
  try {
    // Find all products with reviews by this user
    const products = await Product.find({
      'reviews.userId': req.user._id
    }).select('name reviews rating');

    // Extract reviews by this user from all products
    const userReviews = products.map(product => {
      const review = product.reviews.find(
        r => r.userId.toString() === req.user._id.toString()
      );

      return {
        productId: product._id,
        productName: product.name,
        reviewId: review._id,
        rating: review.rating,
        review: review.review,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      };
    });

    res.status(200).json({
      success: true,
      reviews: userReviews
    });
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
