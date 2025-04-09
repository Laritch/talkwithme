import express from 'express';
import Message from '../models/messageModel.js';
import User from '../models/userModel.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/messages/public
 * @desc Get all public messages
 * @access Private
 */
router.get('/public', authMiddleware, async (req, res) => {
  try {
    const messages = await Message.find({ private: false })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('sender', 'username profilePicture');

    res.json(messages);
  } catch (error) {
    console.error('Error fetching public messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/messages/private/:userId
 * @desc Get private messages between current user and specified user
 * @access Private
 */
router.get('/private/:userId', authMiddleware, async (req, res) => {
  try {
    const currentUserId = req.user._id;
    const otherUserId = req.params.userId;

    // Validate the other user exists
    const otherUser = await User.findById(otherUserId);
    if (!otherUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find messages where current user is sender and other user is recipient,
    // or where current user is recipient and other user is sender
    const messages = await Message.find({
      private: true,
      $or: [
        { sender: currentUserId, recipient: otherUserId },
        { sender: otherUserId, recipient: currentUserId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profilePicture');

    res.json(messages);
  } catch (error) {
    console.error('Error fetching private messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/messages
 * @desc Create a new message
 * @access Private
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { content, recipient, private: isPrivate, attachmentUrl } = req.body;

    // Create new message
    const newMessage = new Message({
      content,
      sender: req.user._id,
      recipient: isPrivate ? recipient : null,
      private: isPrivate,
      attachmentUrl
    });

    // Save message
    await newMessage.save();

    // Populate sender info
    await newMessage.populate('sender', 'username profilePicture');

    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Error creating message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/messages/:id
 * @desc Delete a message
 * @access Private
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    // Check if message exists
    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the sender
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    // Delete message
    await message.deleteOne();

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
