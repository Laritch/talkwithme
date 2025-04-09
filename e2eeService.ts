import nacl from 'tweetnacl';
import util from 'tweetnacl-util';

/**
 * Service for end-to-end encryption using TweetNaCl
 * TweetNaCl.js is a JavaScript port of the high-security cryptography library NaCl
 * https://tweetnacl.js.org/
 */
class E2EEService {
  /**
   * Generate a new keypair for encryption/decryption
   * @returns Object containing public and private (secret) keys
   */
  generateKeyPair() {
    const keyPair = nacl.box.keyPair();
    return {
      publicKey: util.encodeBase64(keyPair.publicKey),
      privateKey: util.encodeBase64(keyPair.secretKey),
    };
  }

  /**
   * Encrypt a message using the recipient's public key and sender's private key
   * @param message - The message to encrypt
   * @param recipientPublicKey - The recipient's public key (base64 encoded)
   * @param senderPrivateKey - The sender's private key (base64 encoded)
   * @returns Encrypted message data with nonce (both base64 encoded)
   */
  encryptMessage(
    message: string,
    recipientPublicKey: string,
    senderPrivateKey: string
  ) {
    // Decode base64 keys to Uint8Array
    const publicKeyUint8 = util.decodeBase64(recipientPublicKey);
    const privateKeyUint8 = util.decodeBase64(senderPrivateKey);

    // Convert message to Uint8Array
    const messageUint8 = util.decodeUTF8(message);

    // Generate a new random nonce for this message
    const nonce = nacl.randomBytes(nacl.box.nonceLength);

    // Encrypt the message
    const encryptedMessage = nacl.box(
      messageUint8,
      nonce,
      publicKeyUint8,
      privateKeyUint8
    );

    // Encode for transmission
    return {
      encryptedMessage: util.encodeBase64(encryptedMessage),
      nonce: util.encodeBase64(nonce),
    };
  }

  /**
   * Decrypt a message using the recipient's private key and sender's public key
   * @param encryptedMessage - The encrypted message (base64 encoded)
   * @param nonce - The nonce used for encryption (base64 encoded)
   * @param senderPublicKey - The sender's public key (base64 encoded)
   * @param recipientPrivateKey - The recipient's private key (base64 encoded)
   * @returns Decrypted message as a string
   */
  decryptMessage(
    encryptedMessage: string,
    nonce: string,
    senderPublicKey: string,
    recipientPrivateKey: string
  ) {
    // Decode base64 keys and message to Uint8Array
    const publicKeyUint8 = util.decodeBase64(senderPublicKey);
    const privateKeyUint8 = util.decodeBase64(recipientPrivateKey);
    const messageUint8 = util.decodeBase64(encryptedMessage);
    const nonceUint8 = util.decodeBase64(nonce);

    // Decrypt the message
    const decryptedMessage = nacl.box.open(
      messageUint8,
      nonceUint8,
      publicKeyUint8,
      privateKeyUint8
    );

    // Check if decryption was successful
    if (!decryptedMessage) {
      throw new Error('Failed to decrypt message');
    }

    // Convert from Uint8Array to UTF-8 string
    return util.encodeUTF8(decryptedMessage);
  }

  /**
   * Store keys securely in browser storage
   * @param userId - The user ID
   * @param keyPair - The keypair to store
   */
  storeKeys(userId: string, keyPair: { publicKey: string; privateKey: string }) {
    if (typeof window !== 'undefined') {
      // Store the keypair in localStorage - in a real app, you'd use a more secure method
      localStorage.setItem(`e2ee_keypair_${userId}`, JSON.stringify(keyPair));
    }
  }

  /**
   * Retrieve keys from browser storage
   * @param userId - The user ID
   * @returns The stored keypair
   */
  retrieveKeys(userId: string) {
    if (typeof window !== 'undefined') {
      const storedKeys = localStorage.getItem(`e2ee_keypair_${userId}`);

      if (storedKeys) {
        return JSON.parse(storedKeys) as { publicKey: string; privateKey: string };
      }
    }
    return null;
  }

  /**
   * Ensure the user has an encryption keypair, generate one if not
   * @param userId - The user ID
   * @returns The user's keypair
   */
  ensureUserHasKeys(userId: string) {
    let keyPair = this.retrieveKeys(userId);

    if (!keyPair) {
      // Generate new keypair
      keyPair = this.generateKeyPair();
      // Store it
      this.storeKeys(userId, keyPair);
    }

    return keyPair;
  }

  /**
   * Sign a message (for authenticity verification)
   * @param message - The message to sign
   * @param privateKey - The private key to sign with
   * @returns Signature as base64 string
   */
  signMessage(message: string, privateKey: string) {
    const keyPair = nacl.sign.keyPair.fromSecretKey(util.decodeBase64(privateKey));
    const messageUint8 = util.decodeUTF8(message);
    const signature = nacl.sign.detached(messageUint8, keyPair.secretKey);
    return util.encodeBase64(signature);
  }

  /**
   * Verify a message signature
   * @param message - The original message
   * @param signature - The signature to verify (base64 encoded)
   * @param publicKey - The signer's public key (base64 encoded)
   * @returns Whether the signature is valid
   */
  verifySignature(message: string, signature: string, publicKey: string) {
    const messageUint8 = util.decodeUTF8(message);
    const signatureUint8 = util.decodeBase64(signature);
    const publicKeyUint8 = util.decodeBase64(publicKey);

    return nacl.sign.detached.verify(messageUint8, signatureUint8, publicKeyUint8);
  }
}

// Export a singleton instance
export const e2eeService = new E2EEService();

// Type definitions for encrypted message
export interface EncryptedMessage {
  encryptedContent: string;
  nonce: string;
  signature: string;
  senderPublicKey: string;
  recipientId: string;
  timestamp: number;
  // Metadata that doesn't need to be encrypted
  metadata?: {
    messageId: string;
    messageType: 'text' | 'file' | 'image';
    senderName: string;
    hasAttachments: boolean;
  };
}
