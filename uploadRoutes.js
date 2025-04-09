import express from 'express';
import { upload } from '../middleware/uploadMiddleware.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const router = express.Router();

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Upload directory path
const uploadDir = path.join(__dirname, '../../public/uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

/**
 * @route POST /api/uploads/profile
 * @desc Upload profile picture
 * @access Private
 */
router.post('/profile', authMiddleware, upload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get file url
    const fileUrl = `/uploads/${req.file.filename}`;

    // Update user profile picture in database if needed
    // (This would typically be handled by the user routes)

    res.json({
      message: 'File uploaded successfully',
      fileUrl
    });
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/uploads/group
 * @desc Upload group image
 * @access Private
 */
router.post('/group', authMiddleware, upload.single('groupImage'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get file url
    const fileUrl = `/uploads/${req.file.filename}`;

    // Update group image in database if needed
    // (This would typically be handled by the group routes)

    res.json({
      message: 'File uploaded successfully',
      fileUrl
    });
  } catch (error) {
    console.error('Error uploading group image:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route POST /api/uploads/attachment
 * @desc Upload message attachment
 * @access Private
 */
router.post('/attachment', authMiddleware, upload.single('attachment'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Get file url
    const fileUrl = `/uploads/${req.file.filename}`;

    res.json({
      message: 'File uploaded successfully',
      fileUrl
    });
  } catch (error) {
    console.error('Error uploading attachment:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * @route DELETE /api/uploads/:filename
 * @desc Delete uploaded file
 * @access Private
 */
router.delete('/:filename', authMiddleware, async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(uploadDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Delete file
    fs.unlinkSync(filePath);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
