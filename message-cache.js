/**
 * Message Cache System
 *
 * This module provides functionality to store and retrieve messages locally
 * when the user is offline or experiencing connection issues.
 *
 * It uses IndexedDB to store messages and supports:
 * - Storing private and group messages
 * - Retrieving messages by conversation/group
 * - Persisting unsent messages
 * - Syncing messages when back online
 */

// Database configuration
const DB_NAME = 'chat_message_cache';
const DB_VERSION = 1;
const MESSAGES_STORE = 'messages';
const UNSENT_STORE = 'unsent_messages';

// Initialize the database
class MessageCache {
  constructor() {
    this.db = null;
    this.isInitialized = false;
    this.initPromise = this.initDatabase();
  }

  /**
   * Initializes the IndexedDB database
   * @returns {Promise} Promise that resolves when DB is initialized
   */
  async initDatabase() {
    if (this.isInitialized) {
      return Promise.resolve(this.db);
    }

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Error opening message cache database:', event.target.error);
        reject(event.target.error);
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.isInitialized = true;
        console.log('Message cache database initialized');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store for messages
        if (!db.objectStoreNames.contains(MESSAGES_STORE)) {
          const messagesStore = db.createObjectStore(MESSAGES_STORE, { keyPath: '_id' });
          // Create indexes for efficient retrieval
          messagesStore.createIndex('conversationId', 'conversationId', { unique: false });
          messagesStore.createIndex('groupId', 'groupId', { unique: false });
          messagesStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Create object store for unsent messages
        if (!db.objectStoreNames.contains(UNSENT_STORE)) {
          const unsentStore = db.createObjectStore(UNSENT_STORE, {
            keyPath: 'tempId',
            autoIncrement: true
          });
          unsentStore.createIndex('type', 'type', { unique: false }); // 'private' or 'group'
          unsentStore.createIndex('recipientId', 'recipientId', { unique: false });
          unsentStore.createIndex('groupId', 'groupId', { unique: false });
        }
      };
    });
  }

  /**
   * Stores a message in the cache
   * @param {Object} message - The message to store
   * @returns {Promise} Promise that resolves when message is stored
   */
  async storeMessage(message) {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);

      // Add conversation or group ID for indexing
      const enhancedMessage = { ...message };
      if (message.isPrivate) {
        // For private messages, create a conversationId from sender and recipient IDs
        const participantIds = [
          message.sender._id,
          message.recipient ? message.recipient._id : message.recipientId
        ].sort();
        enhancedMessage.conversationId = participantIds.join('-');
      }

      const request = store.put(enhancedMessage);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error('Error storing message:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Store multiple messages at once
   * @param {Array} messages - Array of messages to store
   * @returns {Promise} Promise that resolves when all messages are stored
   */
  async storeMessages(messages) {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);

      let count = 0;

      transaction.oncomplete = () => {
        resolve(count);
      };

      transaction.onerror = (event) => {
        console.error('Error storing messages batch:', event.target.error);
        reject(event.target.error);
      };

      // Process each message
      messages.forEach(message => {
        // Add conversation or group ID for indexing
        const enhancedMessage = { ...message };
        if (message.isPrivate) {
          // For private messages, create a conversationId from sender and recipient IDs
          const participantIds = [
            message.sender._id,
            message.recipient ? message.recipient._id : message.recipientId
          ].sort();
          enhancedMessage.conversationId = participantIds.join('-');
        }

        const request = store.put(enhancedMessage);

        request.onsuccess = () => {
          count++;
        };
      });
    });
  }

  /**
   * Get private messages for a conversation
   * @param {string} userId - Current user ID
   * @param {string} otherUserId - Other participant ID
   * @returns {Promise} Promise that resolves with messages array
   */
  async getPrivateMessages(userId, otherUserId) {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const participantIds = [userId, otherUserId].sort();
      const conversationId = participantIds.join('-');

      const transaction = this.db.transaction([MESSAGES_STORE], 'readonly');
      const store = transaction.objectStore(MESSAGES_STORE);
      const index = store.index('conversationId');

      const request = index.getAll(conversationId);

      request.onsuccess = () => {
        const messages = request.result || [];
        // Sort by creation time
        messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        resolve(messages);
      };

      request.onerror = (event) => {
        console.error('Error retrieving private messages:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Get messages for a group
   * @param {string} groupId - Group ID
   * @returns {Promise} Promise that resolves with group messages array
   */
  async getGroupMessages(groupId) {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([MESSAGES_STORE], 'readonly');
      const store = transaction.objectStore(MESSAGES_STORE);
      const index = store.index('groupId');

      const request = index.getAll(groupId);

      request.onsuccess = () => {
        const messages = request.result || [];
        // Sort by creation time
        messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        resolve(messages);
      };

      request.onerror = (event) => {
        console.error('Error retrieving group messages:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Store an unsent message to be sent when connection is restored
   * @param {Object} message - The message object to store
   * @returns {Promise} Promise that resolves with the generated tempId
   */
  async storeUnsentMessage(message) {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([UNSENT_STORE], 'readwrite');
      const store = transaction.objectStore(UNSENT_STORE);

      const unsentMessage = {
        ...message,
        pendingSync: true,
        createdAt: new Date().toISOString()
      };

      const request = store.add(unsentMessage);

      request.onsuccess = (event) => {
        // Return the temp ID so it can be tracked
        resolve(event.target.result);
      };

      request.onerror = (event) => {
        console.error('Error storing unsent message:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Get all unsent messages that need to be synced
   * @returns {Promise} Promise that resolves with array of unsent messages
   */
  async getUnsentMessages() {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([UNSENT_STORE], 'readonly');
      const store = transaction.objectStore(UNSENT_STORE);

      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };

      request.onerror = (event) => {
        console.error('Error retrieving unsent messages:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Remove an unsent message after it's been successfully sent
   * @param {number} tempId - Temporary ID of the unsent message
   * @returns {Promise} Promise that resolves when message is removed
   */
  async removeUnsentMessage(tempId) {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([UNSENT_STORE], 'readwrite');
      const store = transaction.objectStore(UNSENT_STORE);

      const request = store.delete(tempId);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error('Error removing unsent message:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Clear all messages for a conversation
   * @param {string} userId - Current user ID
   * @param {string} otherUserId - Other participant ID
   * @returns {Promise} Promise that resolves when messages are cleared
   */
  async clearConversation(userId, otherUserId) {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const participantIds = [userId, otherUserId].sort();
      const conversationId = participantIds.join('-');

      const transaction = this.db.transaction([MESSAGES_STORE], 'readwrite');
      const store = transaction.objectStore(MESSAGES_STORE);
      const index = store.index('conversationId');

      const request = index.openCursor(conversationId);

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = (event) => {
        console.error('Error clearing conversation:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  /**
   * Clear all cached data - useful for logout or data reset
   * @returns {Promise} Promise that resolves when all data is cleared
   */
  async clearAllData() {
    await this.initPromise;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([MESSAGES_STORE, UNSENT_STORE], 'readwrite');

      transaction.oncomplete = () => {
        resolve();
      };

      transaction.onerror = (event) => {
        console.error('Error clearing all data:', event.target.error);
        reject(event.target.error);
      };

      // Clear both object stores
      transaction.objectStore(MESSAGES_STORE).clear();
      transaction.objectStore(UNSENT_STORE).clear();
    });
  }
}

// Create and export a singleton instance
const messageCache = new MessageCache();
