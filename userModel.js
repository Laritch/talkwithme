import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters'],
    maxlength: [30, 'Username cannot exceed 30 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't return password in query results by default
  },
  profilePicture: {
    type: String,
    default: '/uploads/default-avatar.png'
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  verificationExpires: Date,
  resetPasswordToken: String,
  resetPasswordExpires: Date,
  lastLogin: Date,
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date
}, {
  timestamps: true // Adds createdAt and updatedAt fields
});

/**
 * Pre-save hook to hash password before saving user
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it's modified or new
  if (!this.isModified('password')) return next();

  try {
    // Generate a salt
    const salt = await bcrypt.genSalt(10);
    // Hash the password with the salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Method to compare password for login
 * @param {string} candidatePassword - Password to compare
 * @returns {Promise<boolean>} Whether password matches
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Method to check if user account is locked
 * @returns {boolean} Whether account is locked
 */
userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

/**
 * Method to increment login attempts and lock account if needed
 * @returns {Promise<void>}
 */
userSchema.methods.incrementLoginAttempts = async function() {
  // Reset login attempts if lock has expired
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $set: { loginAttempts: 1 },
      $unset: { lockUntil: 1 }
    });
  }

  // Otherwise increment login attempts
  const updates = { $inc: { loginAttempts: 1 } };

  // Lock the account if we've reached max attempts (5)
  if (this.loginAttempts + 1 >= 5) {
    updates.$set = {
      lockUntil: Date.now() + 1 * 60 * 60 * 1000 // Lock for 1 hour
    };
  }

  return this.updateOne(updates);
};

/**
 * Method to generate password reset token
 * @returns {string} Reset token
 */
userSchema.methods.generatePasswordResetToken = function() {
  // Generate a random token
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Hash the token and set it on the user
  this.resetPasswordToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set token expiry (30 minutes)
  this.resetPasswordExpires = Date.now() + 30 * 60 * 1000;

  return resetToken;
};

/**
 * Method to generate verification token
 * @returns {string} Verification token
 */
userSchema.methods.generateVerificationToken = function() {
  // Generate a random token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Hash the token and set it on the user
  this.verificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex');

  // Set token expiry (24 hours)
  this.verificationExpires = Date.now() + 24 * 60 * 60 * 1000;

  return verificationToken;
};

/**
 * Method to reset login attempts
 * @returns {Promise<void>}
 */
userSchema.methods.resetLoginAttempts = function() {
  return this.updateOne({
    $set: { loginAttempts: 0 },
    $unset: { lockUntil: 1 }
  });
};

// Create a User model from the schema
const User = mongoose.model('User', userSchema);

export default User;
