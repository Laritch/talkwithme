import express from 'express';
import Group from '../models/groupModel.js';
import Message from '../models/messageModel.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @route GET /api/groups
 * @desc Get all groups for the current user
 * @access Private
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    // Find all groups where current user is a member
    const groups = await Group.find({ members: req.user._id })
      .populate('members', 'username profilePicture')
      .populate('creator', 'username profilePicture');

    res.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/groups/:id
 * @desc Get a specific group
 * @access Private
 */
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id)
      .populate('members', 'username profilePicture')
      .populate('creator', 'username profilePicture');

    // Check if group exists
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member of the group
    if (!group.members.some(member => member._id.toString() === req.user._id.toString())) {
      return res.status(403).json({ message: 'Not authorized to access this group' });
    }

    res.json(group);
  } catch (error) {
    console.error('Error fetching group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/groups
 * @desc Create a new group
 * @access Private
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, members } = req.body;

    // Ensure the creator is included in members
    const memberIds = [...new Set([...members, req.user._id.toString()])];

    // Create new group
    const newGroup = new Group({
      name,
      description,
      creator: req.user._id,
      members: memberIds,
      groupImage: req.body.groupImage || '/uploads/default-group.png'
    });

    // Save group
    await newGroup.save();

    // Populate members info
    await newGroup.populate('members', 'username profilePicture');
    await newGroup.populate('creator', 'username profilePicture');

    res.status(201).json(newGroup);
  } catch (error) {
    console.error('Error creating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route PUT /api/groups/:id
 * @desc Update a group
 * @access Private
 */
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, members, groupImage } = req.body;

    // Find group
    const group = await Group.findById(req.params.id);

    // Check if group exists
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the creator of the group
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to update this group' });
    }

    // Update group
    group.name = name || group.name;
    group.description = description || group.description;
    group.members = members || group.members;
    group.groupImage = groupImage || group.groupImage;

    // Save updated group
    await group.save();

    // Populate members info
    await group.populate('members', 'username profilePicture');
    await group.populate('creator', 'username profilePicture');

    res.json(group);
  } catch (error) {
    console.error('Error updating group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/groups/:id
 * @desc Delete a group
 * @access Private
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    // Find group
    const group = await Group.findById(req.params.id);

    // Check if group exists
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is the creator of the group
    if (group.creator.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this group' });
    }

    // Delete all messages associated with the group
    await Message.deleteMany({ groupId: req.params.id });

    // Delete group
    await group.deleteOne();

    res.json({ message: 'Group deleted successfully' });
  } catch (error) {
    console.error('Error deleting group:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route GET /api/groups/:id/messages
 * @desc Get all messages for a specific group
 * @access Private
 */
router.get('/:id/messages', authMiddleware, async (req, res) => {
  try {
    // Find group
    const group = await Group.findById(req.params.id);

    // Check if group exists
    if (!group) {
      return res.status(404).json({ message: 'Group not found' });
    }

    // Check if user is a member of the group
    if (!group.members.includes(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to access this group' });
    }

    // Find all messages for the group
    const messages = await Message.find({ groupId: req.params.id })
      .sort({ createdAt: 1 })
      .populate('sender', 'username profilePicture');

    res.json(messages);
  } catch (error) {
    console.error('Error fetching group messages:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
