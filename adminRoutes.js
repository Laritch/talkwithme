import express from 'express';
import User from '../models/userModel.js';
import Message from '../models/messageModel.js';
import Group from '../models/groupModel.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

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
 * @route GET /api/admin/users
 * @desc Get all users (admin only)
 * @access Private/Admin
 */
router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/admin/messages
 * @desc Get all messages (admin only)
 * @access Private/Admin
 */
router.get('/messages', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .populate('sender', 'username profilePicture')
      .populate('recipient', 'username profilePicture');

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/admin/groups
 * @desc Get all groups (admin only)
 * @access Private/Admin
 */
router.get('/groups', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('members', 'username profilePicture')
      .populate('creator', 'username profilePicture');

    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route PUT /api/admin/users/:id
 * @desc Update user (admin only)
 * @access Private/Admin
 */
router.put('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, email, isAdmin } = req.body;

    // Find and update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      {
        username,
        email,
        isAdmin
      },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/admin/users/:id
 * @desc Delete user (admin only)
 * @access Private/Admin
 */
router.delete('/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Find user
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting admin users
    if (user.isAdmin) {
      return res.status(400).json({ message: 'Cannot delete admin users' });
    }

    // Delete user's messages
    await Message.deleteMany({ sender: req.params.id });

    // Remove user from groups
    await Group.updateMany(
      { members: req.params.id },
      { $pull: { members: req.params.id } }
    );

    // Delete groups created by the user
    const userGroups = await Group.find({ creator: req.params.id });
    for (const group of userGroups) {
      await Message.deleteMany({ groupId: group._id });
      await group.deleteOne();
    }

    // Delete user
    await user.deleteOne();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/admin/messages/:id
 * @desc Delete message (admin only)
 * @access Private/Admin
 */
router.delete('/messages/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    // Find and delete message
    const message = await Message.findByIdAndDelete(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/admin/stats
 * @desc Get system statistics (admin only)
 * @access Private/Admin
 */
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const userCount = await User.countDocuments();
    const messageCount = await Message.countDocuments();
    const groupCount = await Group.countDocuments();

    // Get user registration stats by month
    const userStats = await User.aggregate([
      {
        $group: {
          _id: {
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    // Get message stats by day
    const messageStats = await Message.aggregate([
      {
        $group: {
          _id: {
            day: { $dayOfMonth: '$createdAt' },
            month: { $month: '$createdAt' },
            year: { $year: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    res.json({
      userCount,
      messageCount,
      groupCount,
      userStats,
      messageStats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
