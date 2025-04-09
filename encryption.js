/**
 * Encryption Module for Enhanced Chat System
 * Provides end-to-end encryption for private chat messages
 * Uses the Web Crypto API with RSA-OAEP and AES-GCM
 */

// Store the user's key pair
let keyPair = null;
let publicKeyCache = {}; // Cache of other users' public keys

// Initialize encryption system
export const initEncryption = async () => {
  try {
    // Try to load keys from localStorage
    const savedKeyPair = localStorage.getItem('encryptionKeyPair');

    if (savedKeyPair) {
      // Import existing keys
      keyPair = await importKeyPair(JSON.parse(savedKeyPair));
      console.log('Loaded existing encryption keys');
    } else {
      // Generate new key pair if none exists
      keyPair = await generateKeyPair();

      // Export and save the keys
      const exportedKeys = await exportKeyPair(keyPair);
      localStorage.setItem('encryptionKeyPair', JSON.stringify(exportedKeys));
      console.log('Generated new encryption keys');
    }

    return true;
  } catch (error) {
    console.error('Encryption initialization failed:', error);
    return false;
  }
};

// Generate a new RSA key pair
const generateKeyPair = async () => {
  try {
    return await window.crypto.subtle.generateKey(
      {
        name: 'RSA-OAEP',
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]), // 65537
        hash: 'SHA-256'
      },
      true, // extractable
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Key generation failed:', error);
    throw error;
  }
};

// Export a key pair to JSON-serializable format
const exportKeyPair = async (keyPair) => {
  try {
    const publicKey = await window.crypto.subtle.exportKey(
      'spki',
      keyPair.publicKey
    );

    const privateKey = await window.crypto.subtle.exportKey(
      'pkcs8',
      keyPair.privateKey
    );

    return {
      publicKey: arrayBufferToBase64(publicKey),
      privateKey: arrayBufferToBase64(privateKey)
    };
  } catch (error) {
    console.error('Key export failed:', error);
    throw error;
  }
};

// Import a key pair from JSON format
const importKeyPair = async (exportedKeyPair) => {
  try {
    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      base64ToArrayBuffer(exportedKeyPair.publicKey),
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['encrypt']
    );

    const privateKey = await window.crypto.subtle.importKey(
      'pkcs8',
      base64ToArrayBuffer(exportedKeyPair.privateKey),
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['decrypt']
    );

    return { publicKey, privateKey };
  } catch (error) {
    console.error('Key import failed:', error);
    throw error;
  }
};

// Get the user's public key in exportable format
export const getPublicKey = async () => {
  if (!keyPair) {
    await initEncryption();
  }

  try {
    const exported = await window.crypto.subtle.exportKey(
      'spki',
      keyPair.publicKey
    );

    return arrayBufferToBase64(exported);
  } catch (error) {
    console.error('Public key export failed:', error);
    throw error;
  }
};

// Import someone else's public key
export const importPublicKey = async (publicKeyString) => {
  try {
    // Check if we've already imported this key
    if (publicKeyCache[publicKeyString]) {
      return publicKeyCache[publicKeyString];
    }

    const publicKey = await window.crypto.subtle.importKey(
      'spki',
      base64ToArrayBuffer(publicKeyString),
      {
        name: 'RSA-OAEP',
        hash: 'SHA-256'
      },
      true,
      ['encrypt']
    );

    // Cache the key for future use
    publicKeyCache[publicKeyString] = publicKey;

    return publicKey;
  } catch (error) {
    console.error('Public key import failed:', error);
    throw error;
  }
};

// Generate a one-time symmetric key for message encryption
const generateSymmetricKey = async () => {
  try {
    return await window.crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Symmetric key generation failed:', error);
    throw error;
  }
};

// Export a symmetric key to a format that can be encrypted with RSA
const exportSymmetricKey = async (key) => {
  try {
    const exported = await window.crypto.subtle.exportKey('raw', key);
    return exported;
  } catch (error) {
    console.error('Symmetric key export failed:', error);
    throw error;
  }
};

// Import a symmetric key
const importSymmetricKey = async (keyData) => {
  try {
    return await window.crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: 'AES-GCM',
        length: 256
      },
      false,
      ['decrypt']
    );
  } catch (error) {
    console.error('Symmetric key import failed:', error);
    throw error;
  }
};

// Encrypt a message for a specific recipient
export const encryptMessage = async (message, recipientPublicKeyString) => {
  if (!message) return message;

  try {
    // Import the recipient's public key if not cached
    const recipientPublicKey = await importPublicKey(recipientPublicKeyString);

    // Generate a random symmetric key for this message
    const symmetricKey = await generateSymmetricKey();
    const exportedSymKey = await exportSymmetricKey(symmetricKey);

    // Encrypt the symmetric key with the recipient's public key
    const encryptedSymKey = await window.crypto.subtle.encrypt(
      {
        name: 'RSA-OAEP'
      },
      recipientPublicKey,
      exportedSymKey
    );

    // Generate a random IV for AES-GCM
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // Encrypt the message with the symmetric key
    const messageBytes = new TextEncoder().encode(message);
    const encryptedMessage = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      symmetricKey,
      messageBytes
    );

    // Combine everything into a single package
    return {
      encryptedKey: arrayBufferToBase64(encryptedSymKey),
      iv: arrayBufferToBase64(iv),
      encryptedMessage: arrayBufferToBase64(encryptedMessage),
      isEncrypted: true
    };
  } catch (error) {
    console.error('Message encryption failed:', error);
    // Return the original message on failure
    return {
      content: message,
      isEncrypted: false,
      error: error.message
    };
  }
};

// Decrypt a message sent to us
export const decryptMessage = async (encryptedPackage) => {
  if (!encryptedPackage || !encryptedPackage.isEncrypted) {
    return encryptedPackage;
  }

  try {
    // Ensure we have our key pair
    if (!keyPair) {
      await initEncryption();
    }

    // Extract the encrypted parts
    const encryptedKey = base64ToArrayBuffer(encryptedPackage.encryptedKey);
    const iv = base64ToArrayBuffer(encryptedPackage.iv);
    const encryptedMessage = base64ToArrayBuffer(encryptedPackage.encryptedMessage);

    // Decrypt the symmetric key
    const decryptedKeyBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'RSA-OAEP'
      },
      keyPair.privateKey,
      encryptedKey
    );

    // Import the symmetric key
    const symmetricKey = await importSymmetricKey(decryptedKeyBuffer);

    // Decrypt the message
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      symmetricKey,
      encryptedMessage
    );

    // Convert the decrypted buffer to text
    const decryptedMessage = new TextDecoder().decode(decryptedBuffer);

    return decryptedMessage;
  } catch (error) {
    console.error('Message decryption failed:', error);
    return {
      content: '[Decryption failed]',
      error: error.message
    };
  }
};

// Helper function to convert ArrayBuffer to Base64 string
const arrayBufferToBase64 = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary);
};

// Helper function to convert Base64 string to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
  const binaryString = window.atob(base64);
  const bytes = new Uint8Array(binaryString.length);

  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  return bytes.buffer;
};

// Generate a key fingerprint for display
export const getKeyFingerprint = async (publicKeyString) => {
  try {
    const keyBuffer = base64ToArrayBuffer(publicKeyString);
    const hashBuffer = await window.crypto.subtle.digest('SHA-1', keyBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));

    // Format as hex pairs with colons (like SSH fingerprints)
    return hashArray
      .map(b => b.toString(16).padStart(2, '0'))
      .join(':')
      .toUpperCase()
      .substring(0, 40); // Take first 40 chars for brevity
  } catch (error) {
    console.error('Fingerprint generation failed:', error);
    return 'Unknown key';
  }
};

// Function to display encryption status
export const getEncryptionStatusHTML = async (publicKey) => {
  try {
    const fingerprint = await getKeyFingerprint(publicKey);

    return `
      <div class="encryption-status">
        <i class="fas fa-lock"></i>
        <span>End-to-end encrypted</span>
        <div class="key-fingerprint" title="Public key fingerprint">
          <small>${fingerprint}</small>
        </div>
      </div>
    `;
  } catch (error) {
    console.error('Encryption status error:', error);
    return '';
  }
};

export default {
  initEncryption,
  getPublicKey,
  encryptMessage,
  decryptMessage,
  getKeyFingerprint,
  getEncryptionStatusHTML
};
