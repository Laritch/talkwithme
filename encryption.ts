/**
 * Encryption Utility for Client-Side
 * Mock implementation for the demo app
 */

import crypto from 'crypto';
import CryptoJS from 'crypto-js';

// In a production environment, these should be stored in environment variables
const ENCRYPTION_KEY = 'secure-payment-system-encryption-key-32';
const IV_LENGTH = 16; // For AES, this is always 16 bytes

// Obfuscate card number for display (e.g., **** **** **** 1234)
export const obfuscateCardNumber = (cardNumber: string): string => {
  if (!cardNumber || cardNumber.length < 4) {
    return '****';
  }

  const last4 = cardNumber.slice(-4);
  const masked = '*'.repeat(cardNumber.length - 4);

  // Format as **** **** **** 1234
  if (cardNumber.length >= 16) {
    return `${masked.slice(0, 4)} ${masked.slice(4, 8)} ${masked.slice(8, 12)} ${last4}`;
  }

  return masked + last4;
};

export const encryptionUtils = {
  // Encrypt data using Node.js crypto (server-side)
  encrypt: (text: string): string => {
    // Generate a random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);

    // Create cipher using the encryption key and IV
    const cipher = crypto.createCipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION_KEY),
      iv
    );

    // Encrypt the text
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    // Combine IV and encrypted data and return as base64 string
    return Buffer.from(iv.toString('hex') + ':' + encrypted).toString('base64');
  },

  // Decrypt data using Node.js crypto (server-side)
  decrypt: (encryptedText: string): string => {
    try {
      // Get the IV and encrypted text
      const parts = Buffer.from(encryptedText, 'base64').toString().split(':');
      const iv = Buffer.from(parts[0], 'hex');
      const encryptedData = parts[1];

      // Create decipher using the encryption key and IV
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(ENCRYPTION_KEY),
        iv
      );

      // Decrypt the text
      let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
      decrypted += decipher.final('utf8');

      return decrypted;
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  },

  // Hash a value (one-way, for storing passwords)
  hash: (text: string): string => {
    return crypto.createHash('sha256').update(text).digest('hex');
  },

  // Hash with salt (more secure for passwords)
  hashWithSalt: (text: string): { hash: string; salt: string } => {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto
      .pbkdf2Sync(text, salt, 1000, 64, 'sha512')
      .toString('hex');
    return { hash, salt };
  },

  // Verify a hash with salt
  verifyHash: (text: string, hash: string, salt: string): boolean => {
    const hashVerify = crypto
      .pbkdf2Sync(text, salt, 1000, 64, 'sha512')
      .toString('hex');
    return hash === hashVerify;
  },

  // Client-side encryption using CryptoJS (for browser use)
  clientEncrypt: (text: string, key: string): string => {
    return CryptoJS.AES.encrypt(text, key).toString();
  },

  // Client-side decryption using CryptoJS (for browser use)
  clientDecrypt: (encryptedText: string, key: string): string => {
    const bytes = CryptoJS.AES.decrypt(encryptedText, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  },
};
