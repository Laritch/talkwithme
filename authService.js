import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { ApiError } from '../utils/errorHandler.js';
import { getEnvVar } from '../utils/configUtils.js';
import User from '../models/userModel.js';

// Environment variables with fallbacks
const JWT_SECRET = getEnvVar('JWT_SECRET', 'default_jwt_secret');
const JWT_EXPIRES_IN = getEnvVar('JWT_EXPIRES_IN', '1d');
const JWT_REFRESH_SECRET = getEnvVar('JWT_REFRESH_SECRET', 'default_refresh_secret');
const JWT_REFRESH_EXPIRES_IN = getEnvVar('JWT_REFRESH_EXPIRES_IN', '7d');

/**
 * Generate JWT token for authenticated user
 * @param {Object} user - User object with _id and isAdmin
 * @returns {Object} Access token and refresh token
 */
export const generateTokens = (user) => {
  // Payload for token
  const payload = {
    _id: user._id,
    username: user.username,
    email: user.email,
    isAdmin: user.isAdmin
  };

  // Generate access token
  const accessToken = jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );

  // Generate refresh token
  const refreshToken = jwt.sign(
    { _id: user._id },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN }
  );

  return {
    accessToken,
    refreshToken,
    expiresIn: JWT_EXPIRES_IN
  };
};

/**
 * Verify JWT token
 * @param {string} token - JWT token to verify
 * @returns {Object} Decoded token payload
 * @throws {ApiError} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Token has expired');
    }

    if (error.name === 'JsonWebTokenError') {
      throw ApiError.unauthorized('Invalid token');
    }

    throw ApiError.unauthorized('Failed to authenticate token');
  }
};

/**
 * Verify refresh token
 * @param {string} token - Refresh token to verify
 * @returns {Object} Decoded token payload
 * @throws {ApiError} If token is invalid or expired
 */
export const verifyRefreshToken = (token) => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      throw ApiError.unauthorized('Refresh token has expired. Please login again');
    }

    throw ApiError.unauthorized('Invalid refresh token. Please login again');
  }
};

/**
 * Refresh access token using refresh token
 * @param {string} refreshToken - Refresh token
 * @returns {Object} New access token and refresh token
 * @throws {ApiError} If refresh token is invalid
 */
export const refreshAccessToken = async (refreshToken) => {
  // Verify refresh token
  const decoded = verifyRefreshToken(refreshToken);

  // Find user by ID
  const user = await User.findById(decoded._id);

  if (!user) {
    throw ApiError.unauthorized('User not found');
  }

  if (user.status !== 'active') {
    throw ApiError.forbidden('User account is disabled');
  }

  // Generate new tokens
  return generateTokens(user);
};

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @returns {Object} New user and tokens
 * @throws {ApiError} If registration fails
 */
export const registerUser = async (userData) => {
  const { username, email, password } = userData;

  // Check if user already exists
  const existingUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existingUser) {
    if (existingUser.email === email) {
      throw ApiError.conflict('Email already in use');
    }
    throw ApiError.conflict('Username already in use');
  }

  // Create new user
  const user = new User({
    username,
    email,
    password,
    isVerified: false // User needs to verify email
  });

  // Generate verification token
  const verificationToken = user.generateVerificationToken();

  // Save user
  await user.save();

  // Generate tokens
  const tokens = generateTokens(user);

  // Return user data and tokens
  return {
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture
    },
    tokens,
    verificationToken // This would normally be sent via email
  };
};

/**
 * Login a user
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Object} User data and tokens
 * @throws {ApiError} If login fails
 */
export const loginUser = async (email, password) => {
  // Find user by email and include password for comparison
  const user = await User.findOne({ email }).select('+password +loginAttempts +lockUntil');

  // Check if user exists
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password');
  }

  // Check if account is locked
  if (user.isLocked()) {
    const lockTime = new Date(user.lockUntil);
    throw ApiError.forbidden(`Account locked. Try again after ${lockTime.toLocaleString()}`);
  }

  // Check if account is active
  if (user.status !== 'active') {
    throw ApiError.forbidden('Your account has been suspended. Please contact support.');
  }

  // Verify password
  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    // Increment login attempts
    await user.incrementLoginAttempts();

    // If account is now locked, return specific message
    if (user.loginAttempts + 1 >= 5) {
      throw ApiError.forbidden('Account locked due to too many failed attempts. Try again in 1 hour.');
    }

    throw ApiError.unauthorized('Invalid email or password');
  }

  // Reset login attempts if successful
  await user.resetLoginAttempts();

  // Update last login
  user.lastLogin = Date.now();
  await user.save();

  // Generate tokens
  const tokens = generateTokens(user);

  // Return user data and tokens
  return {
    user: {
      _id: user._id,
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      isVerified: user.isVerified,
      profilePicture: user.profilePicture
    },
    tokens
  };
};

/**
 * Verify user email
 * @param {string} token - Verification token
 * @returns {Object} Success message
 * @throws {ApiError} If verification fails
 */
export const verifyEmail = async (token) => {
  // Hash the token for comparison
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with this token
  const user = await User.findOne({
    verificationToken: hashedToken,
    verificationExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired verification token');
  }

  // Update user verification status
  user.isVerified = true;
  user.verificationToken = undefined;
  user.verificationExpires = undefined;

  await user.save();

  return { message: 'Email verified successfully' };
};

/**
 * Request password reset
 * @param {string} email - User email
 * @returns {Object} Reset token (normally sent via email)
 * @throws {ApiError} If user not found
 */
export const forgotPassword = async (email) => {
  // Find user by email
  const user = await User.findOne({ email });

  if (!user) {
    throw ApiError.notFound('No user with that email address');
  }

  // Generate and hash reset token
  const resetToken = user.generatePasswordResetToken();
  await user.save();

  // In a real app, we would send an email here
  return {
    message: 'Password reset token sent to your email',
    resetToken // This would normally be sent via email
  };
};

/**
 * Reset password using token
 * @param {string} token - Reset token
 * @param {string} newPassword - New password
 * @returns {Object} Success message
 * @throws {ApiError} If reset fails
 */
export const resetPassword = async (token, newPassword) => {
  // Hash the token for comparison
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with this token and valid expiration
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw ApiError.badRequest('Invalid or expired reset token');
  }

  // Update password
  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  await user.save();

  return { message: 'Password reset successfully' };
};

/**
 * Update user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Object} Success message
 * @throws {ApiError} If update fails
 */
export const updatePassword = async (userId, currentPassword, newPassword) => {
  // Find user by ID with password
  const user = await User.findById(userId).select('+password');

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);

  if (!isMatch) {
    throw ApiError.badRequest('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  return { message: 'Password updated successfully' };
};

export default {
  generateTokens,
  verifyToken,
  verifyRefreshToken,
  refreshAccessToken,
  registerUser,
  loginUser,
  verifyEmail,
  forgotPassword,
  resetPassword,
  updatePassword
};
