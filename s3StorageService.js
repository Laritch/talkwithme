import AWS from 'aws-sdk';
import multer from 'multer';
import multerS3 from 'multer-s3';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import logger from '../utils/logger.js';

/**
 * S3 Storage Service for webinar recordings and materials
 */
class S3StorageService {
  constructor() {
    // Initialize AWS S3 with credentials from environment variables
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || 'us-east-1'
    });

    this.bucketName = process.env.AWS_S3_BUCKET_NAME || 'webinar-recordings';

    // Validate required environment variables
    this.isConfigured = this._validateConfig();

    if (!this.isConfigured) {
      logger.warn('S3StorageService is not properly configured. Recordings will be stored locally.');
    } else {
      logger.info('S3StorageService initialized successfully.');
    }
  }

  /**
   * Validate AWS configuration
   * @returns {boolean} - Whether the service is properly configured
   */
  _validateConfig() {
    return !!(
      process.env.AWS_ACCESS_KEY_ID &&
      process.env.AWS_SECRET_ACCESS_KEY &&
      process.env.AWS_S3_BUCKET_NAME
    );
  }

  /**
   * Get multer storage configuration for S3
   * @param {string} folder - The folder in S3 to store files in
   * @returns {Object} - Multer storage configuration
   */
  getS3Storage(folder = 'recordings') {
    if (!this.isConfigured) {
      // Fall back to local storage if S3 is not configured
      return multer.diskStorage({
        destination: (req, file, cb) => {
          cb(null, 'uploads/webinar-recordings/');
        },
        filename: (req, file, cb) => {
          const uniqueFileName = `${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
          cb(null, uniqueFileName);
        }
      });
    }

    return multerS3({
      s3: this.s3,
      bucket: this.bucketName,
      acl: 'private', // Private access, will need signed URLs to access
      contentType: multerS3.AUTO_CONTENT_TYPE,
      key: (req, file, cb) => {
        const webinarId = req.params.id || 'unknown';
        const uniqueFileName = `${folder}/${webinarId}/${Date.now()}-${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueFileName);
      },
      metadata: (req, file, cb) => {
        cb(null, {
          fieldName: file.fieldname,
          webinarId: req.params.id || 'unknown',
          uploadedBy: req.user ? req.user.id : 'anonymous',
          originalName: file.originalname
        });
      }
    });
  }

  /**
   * Generate a signed URL for accessing a private S3 object
   * @param {string} key - S3 object key
   * @param {number} expiresIn - URL expiration time in seconds (default: 24 hours)
   * @returns {Promise<string>} - Signed URL
   */
  async getSignedUrl(key, expiresIn = 86400) {
    if (!this.isConfigured) {
      // For local storage, return the local path
      // In a real app, this would be a route that serves the file
      return `/api/webinars/recordings/${path.basename(key)}`;
    }

    return new Promise((resolve, reject) => {
      this.s3.getSignedUrl('getObject', {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn
      }, (err, url) => {
        if (err) {
          logger.error(`Error generating signed URL: ${err}`);
          reject(err);
        } else {
          resolve(url);
        }
      });
    });
  }

  /**
   * Upload a buffer to S3
   * @param {Buffer} buffer - File buffer
   * @param {string} key - S3 object key
   * @param {string} contentType - File MIME type
   * @returns {Promise<Object>} - Upload result
   */
  async uploadBuffer(buffer, key, contentType = 'application/octet-stream') {
    if (!this.isConfigured) {
      throw new Error('S3 storage is not configured');
    }

    const params = {
      Bucket: this.bucketName,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: 'private'
    };

    try {
      const result = await this.s3.upload(params).promise();
      logger.info(`File uploaded successfully to ${result.Location}`);
      return result;
    } catch (error) {
      logger.error(`Error uploading file to S3: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a file from S3
   * @param {string} key - S3 object key
   * @returns {Promise<Object>} - Delete result
   */
  async deleteFile(key) {
    if (!this.isConfigured) {
      // For local storage, file deletion would be handled differently
      return { success: true, message: 'Local file deletion not implemented' };
    }

    const params = {
      Bucket: this.bucketName,
      Key: key
    };

    try {
      const result = await this.s3.deleteObject(params).promise();
      logger.info(`File deleted successfully: ${key}`);
      return result;
    } catch (error) {
      logger.error(`Error deleting file from S3: ${error}`);
      throw error;
    }
  }

  /**
   * List all files in a folder
   * @param {string} prefix - Folder prefix in S3
   * @returns {Promise<Array>} - Array of file objects
   */
  async listFiles(prefix) {
    if (!this.isConfigured) {
      // For local storage, would need to read directory contents
      return [];
    }

    const params = {
      Bucket: this.bucketName,
      Prefix: prefix
    };

    try {
      const result = await this.s3.listObjectsV2(params).promise();
      return result.Contents || [];
    } catch (error) {
      logger.error(`Error listing files from S3: ${error}`);
      throw error;
    }
  }
}

// Create and export a singleton instance
const s3StorageService = new S3StorageService();
export default s3StorageService;
