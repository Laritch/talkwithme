/**
 * Offline Mode Handler
 *
 * This module manages:
 * 1. Connection state detection and management
 * 2. Message syncing when connection is restored
 * 3. UI updates for offline/online state
 * 4. Integration with message cache
 */

class OfflineHandler {
  constructor(socket) {
    this.socket = socket;
    this.isOnline = navigator.onLine;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 5000; // 5 seconds
    this.reconnectTimer = null;
    this.pendingMessages = [];

    // Start monitoring connection status
    this.setupConnectionMonitoring();
  }

  /**
   * Initialize event listeners for network status
   */
  setupConnectionMonitoring() {
    // Listen for browser online/offline events
    window.addEventListener('online', () => this.handleOnline());
    window.addEventListener('offline', () => this.handleOffline());

    // Setup socket connection listeners
    if (this.socket) {
      this.socket.on('connect', () => this.handleSocketConnect());
      this.socket.on('disconnect', () => this.handleSocketDisconnect());
      this.socket.on('connect_error', (error) => this.handleConnectionError(error));
    }
  }

  /**
   * Handle browser online event
   */
  handleOnline() {
    console.log('Browser reports online status');
    this.isOnline = true;
    this.showConnectionStatus('online');

    // Try to reconnect socket if needed
    if (this.socket && !this.socket.connected) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle browser offline event
   */
  handleOffline() {
    console.log('Browser reports offline status');
    this.isOnline = false;
    this.showConnectionStatus('offline');

    // Clear any pending reconnect attempts
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
  }

  /**
   * Handle socket successful connection
   */
  handleSocketConnect() {
    console.log('Socket connected successfully');
    this.reconnectAttempts = 0;
    this.showConnectionStatus('online');

    // Sync any pending messages
    this.syncPendingMessages();
  }

  /**
   * Handle socket disconnection
   */
  handleSocketDisconnect() {
    console.log('Socket disconnected');
    this.showConnectionStatus('connecting');

    // Only attempt reconnect if browser reports online
    if (this.isOnline) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle connection errors
   */
  handleConnectionError(error) {
    console.error('Socket connection error:', error);
    this.showConnectionStatus('error');

    // Only attempt reconnect if browser reports online
    if (this.isOnline) {
      this.attemptReconnect();
    }
  }

  /**
   * Attempt to reconnect the socket
   */
  attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      this.showConnectionStatus('failed');
      return;
    }

    this.reconnectAttempts++;
    console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    // Clear any existing timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    // Set timeout for next attempt
    this.reconnectTimer = setTimeout(() => {
      if (this.socket) {
        this.socket.connect();
      }
    }, this.reconnectInterval);
  }

  /**
   * Update UI to show connection status
   */
  showConnectionStatus(status) {
    // Remove any existing status indicators
    const existingIndicator = document.getElementById('connection-status');
    if (existingIndicator) {
      existingIndicator.remove();
    }

    // Create status indicator based on current state
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'connection-status';

    switch (status) {
      case 'online':
        statusIndicator.className = 'connection-status online';
        statusIndicator.innerHTML = '<i class="fas fa-wifi"></i> Connected';

        // Auto-hide after 3 seconds
        setTimeout(() => {
          statusIndicator.classList.add('hiding');
          setTimeout(() => {
            if (statusIndicator.parentElement) {
              statusIndicator.remove();
            }
          }, 500);
        }, 3000);
        break;

      case 'offline':
        statusIndicator.className = 'connection-status offline';
        statusIndicator.innerHTML = '<i class="fas fa-wifi-slash"></i> Offline Mode';
        break;

      case 'connecting':
        statusIndicator.className = 'connection-status connecting';
        statusIndicator.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Reconnecting...';
        break;

      case 'error':
        statusIndicator.className = 'connection-status error';
        statusIndicator.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Connection Error';
        break;

      case 'failed':
        statusIndicator.className = 'connection-status failed';
        statusIndicator.innerHTML =
          '<i class="fas fa-exclamation-circle"></i> Connection Failed ' +
          '<button class="retry-btn">Retry</button>';

        // Add retry button functionality
        setTimeout(() => {
          const retryBtn = statusIndicator.querySelector('.retry-btn');
          if (retryBtn) {
            retryBtn.addEventListener('click', () => {
              this.reconnectAttempts = 0;
              this.attemptReconnect();
              this.showConnectionStatus('connecting');
            });
          }
        }, 0);
        break;
    }

    // Add to document
    document.body.appendChild(statusIndicator);
  }

  /**
   * Queue a message to be sent once connection is restored
   * @param {String} type - 'private' or 'group'
   * @param {Object} messageData - Message data to be sent
   * @returns {Promise<number>} Promise that resolves with tempId
   */
  async queueMessage(type, messageData) {
    if (!window.messageCache) {
      console.error('Message cache not available');
      return null;
    }

    try {
      // Create a message object with type info
      const unsentMessage = {
        type,
        ...messageData,
        status: 'pending'
      };

      // Store in unsent messages store
      const tempId = await window.messageCache.storeUnsentMessage(unsentMessage);

      // Also create a UI version of the message for immediate display
      const clientMessage = {
        _id: `temp-${tempId}`,
        content: messageData.content,
        sender: { _id: messageData.senderId },
        createdAt: new Date().toISOString(),
        isPrivate: type === 'private',
        isPending: true,
        tempId
      };

      if (type === 'private') {
        clientMessage.recipient = { _id: messageData.recipientId };
      } else if (type === 'group') {
        clientMessage.group = { _id: messageData.groupId };
      }

      // Store the client message in the cache too
      await window.messageCache.storeMessage(clientMessage);

      return {
        tempId,
        clientMessage
      };
    } catch (error) {
      console.error('Error queuing message:', error);
      return null;
    }
  }

  /**
   * Sync unsent messages when connection is restored
   */
  async syncPendingMessages() {
    if (!window.messageCache || !this.socket || !this.socket.connected) {
      return;
    }

    try {
      // Get all unsent messages
      const unsentMessages = await window.messageCache.getUnsentMessages();

      if (unsentMessages.length === 0) {
        return;
      }

      console.log(`Syncing ${unsentMessages.length} pending messages...`);

      // Process them one by one
      for (const message of unsentMessages) {
        try {
          if (message.type === 'private') {
            // Send private message
            this.socket.emit('sendMessage', {
              recipientId: message.recipientId,
              content: message.content,
              attachment: message.attachment
            }, async (response) => {
              if (response && !response.error) {
                // Message sent successfully
                // Update the temp message in the cache with the real message ID
                const tempMessageId = `temp-${message.tempId}`;
                const messageElement = document.querySelector(`.message[data-message-id="${tempMessageId}"]`);
                if (messageElement) {
                  messageElement.classList.remove('pending');
                  messageElement.dataset.messageId = response.messageId;
                }

                // Remove from unsent store
                await window.messageCache.removeUnsentMessage(message.tempId);
              }
            });
          } else if (message.type === 'group') {
            // Send group message
            this.socket.emit('sendGroupMessage', {
              groupId: message.groupId,
              content: message.content,
              attachment: message.attachment
            }, async (response) => {
              if (response && !response.error) {
                // Message sent successfully
                // Update the temp message in the UI
                const tempMessageId = `temp-${message.tempId}`;
                const messageElement = document.querySelector(`.message[data-message-id="${tempMessageId}"]`);
                if (messageElement) {
                  messageElement.classList.remove('pending');
                  messageElement.dataset.messageId = response.messageId;
                }

                // Remove from unsent store
                await window.messageCache.removeUnsentMessage(message.tempId);
              }
            });
          }
        } catch (error) {
          console.error(`Error syncing message ${message.tempId}:`, error);
        }
      }
    } catch (error) {
      console.error('Error syncing pending messages:', error);
    }
  }

  /**
   * Check if we're currently online
   * @returns {Boolean} Connection status
   */
  isConnected() {
    return this.isOnline && this.socket && this.socket.connected;
  }
}

// Expose to window for access from other scripts
window.OfflineHandler = OfflineHandler;
