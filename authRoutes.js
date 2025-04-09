import express from 'express';
import { asyncHandler } from '../utils/errorHandler.js';
import { validate, schemas } from '../middleware/validationMiddleware.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/authMiddleware.js';
import * as authService from '../services/authService.js';
import logger from '../utils/logger.js';

const router = express.Router();

/**
 * @route POST /api/auth/register
 * @desc Register a new user
 * @access Public
 */
router.post(
  '/register',
  validate(schemas.registerUser),
  asyncHandler(async (req, res) => {
    const result = await authService.registerUser(req.body);

    // Log successful registration
    logger.info('User registered successfully', {
      userId: result.user._id,
      username: result.user.username,
      email: result.user.email
    });

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: result.user,
      tokens: result.tokens,
      // In a real app, we wouldn't send this token in the response
      // Instead, we'd email it to the user
      verificationToken: result.verificationToken
    });
  })
);

/**
 * @route POST /api/auth/login
 * @desc Login a user
 * @access Public
 */
router.post(
  '/login',
  validate(schemas.loginUser),
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.loginUser(email, password);

    // Log successful login
    logger.info('User logged in successfully', {
      userId: result.user._id,
      username: result.user.username,
      email: result.user.email
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: result.user,
      tokens: result.tokens
    });
  })
);

/**
 * @route POST /api/auth/refresh-token
 * @desc Refresh access token using refresh token
 * @access Public
 */
router.post(
  '/refresh-token',
  validate(schemas.refreshToken),
  asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshAccessToken(refreshToken);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      tokens
    });
  })
);

/**
 * @route GET /api/auth/verify-email/:token
 * @desc Verify user email with token
 * @access Public
 */
router.get(
  '/verify-email/:token',
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const result = await authService.verifyEmail(token);

    res.json({
      success: true,
      message: result.message
    });
  })
);

/**
 * @route POST /api/auth/forgot-password
 * @desc Request password reset email
 * @access Public
 */
router.post(
  '/forgot-password',
  validate(schemas.forgotPassword),
  asyncHandler(async (req, res) => {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);

    // Log password reset request
    logger.info('Password reset requested', { email });

    res.json({
      success: true,
      message: 'Password reset instructions sent to your email',
      // In a real app, we wouldn't send this token in the response
      // Instead, we'd email it to the user
      resetToken: result.resetToken
    });
  })
);

/**
 * @route POST /api/auth/reset-password/:token
 * @desc Reset password with token
 * @access Public
 */
router.post(
  '/reset-password/:token',
  validate(schemas.resetPassword),
  asyncHandler(async (req, res) => {
    const { token } = req.params;
    const { password } = req.body;
    const result = await authService.resetPassword(token, password);

    res.json({
      success: true,
      message: result.message
    });
  })
);

/**
 * @route POST /api/auth/change-password
 * @desc Change user password
 * @access Private
 */
router.post(
  '/change-password',
  authMiddleware,
  validate(schemas.changePassword),
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const result = await authService.updatePassword(
      req.user._id,
      currentPassword,
      newPassword
    );

    // Log password change
    logger.info('User changed password', {
      userId: req.user._id,
      username: req.user.username
    });

    res.json({
      success: true,
      message: result.message
    });
  })
);

/**
 * @route GET /api/auth/me
 * @desc Get current user profile
 * @access Private
 */
router.get(
  '/me',
  authMiddleware,
  asyncHandler(async (req, res) => {
    res.json({
      success: true,
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        isAdmin: req.user.isAdmin,
        isVerified: req.user.isVerified,
        profilePicture: req.user.profilePicture,
        status: req.user.status,
        createdAt: req.user.createdAt
      }
    });
  })
);

/**
 * @route POST /api/auth/logout
 * @desc Log out user (client-side)
 * @access Private
 */
router.post(
  '/logout',
  optionalAuthMiddleware,
  asyncHandler(async (req, res) => {
    // JWT is stateless, so we can't invalidate the token on the server
    // This endpoint is mainly for logging purposes

    if (req.user) {
      logger.info('User logged out', {
        userId: req.user._id,
        username: req.user.username
      });

      // In a real app with token blacklisting, we would invalidate the token here
    }

    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  })
);

export default router;
