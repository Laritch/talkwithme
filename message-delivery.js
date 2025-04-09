/**
 * Message Delivery Tracking System
 *
 * This module enhances message delivery tracking with timestamps for:
 * - When a message was sent
 * - When it was delivered to the recipient's device
 * - When it was actually read by the recipient
 */

class MessageDeliveryTracker {
  constructor(socket) {
    this.socket = socket;

    // Initialize the tracking system
    this.init();
  }

  /**
   * Initialize the delivery tracking system
   */
  init() {
    if (!this.socket) {
      console.error('Socket not available for message delivery tracking');
      return;
    }

    // Listen for delivery status updates
    this.setupSocketListeners();

    // Add visibility change listener to mark messages as read when user views them
    this.setupVisibilityTracking();
  }

  /**
   * Setup socket listeners for delivery events
   */
  setupSocketListeners() {
    // Listen for message delivery confirmations
    this.socket.on('messageDelivered', (data) => {
      this.updateMessageDeliveryStatus(data.messageId, 'delivered', data.timestamp);
    });

    // Listen for message read confirmations
    this.socket.on('messageRead', (data) => {
      this.updateMessageDeliveryStatus(data.messageId, 'read', data.timestamp);
    });
  }

  /**
   * Track page visibility to mark messages as read when user sees them
   */
  setupVisibilityTracking() {
    let visibilityChangeEvent, hidden;

    // Different browsers use different visibility properties
    if (typeof document.hidden !== "undefined") {
      hidden = "hidden";
      visibilityChangeEvent = "visibilitychange";
    } else if (typeof document.msHidden !== "undefined") {
      hidden = "msHidden";
      visibilityChangeEvent = "msvisibilitychange";
    } else if (typeof document.webkitHidden !== "undefined") {
      hidden = "webkitHidden";
      visibilityChangeEvent = "webkitvisibilitychange";
    }

    // Add event listener for visibility changes
    document.addEventListener(visibilityChangeEvent, () => {
      if (!document[hidden]) {
        // When tab becomes visible, mark visible messages as read
        this.markVisibleMessagesAsRead();
      }
    }, false);

    // Also mark messages as read when the user scrolls
    const messagesContainer = document.getElementById('messages-container');
    if (messagesContainer) {
      messagesContainer.addEventListener('scroll', () => {
        // We use a debounce function to avoid firing too many events
        if (this.scrollTimeout) clearTimeout(this.scrollTimeout);

        this.scrollTimeout = setTimeout(() => {
          this.markVisibleMessagesAsRead();
        }, 100);
      });
    }

    // Group messages container
    const groupMessages = document.getElementById('group-messages');
    if (groupMessages) {
      groupMessages.addEventListener('scroll', () => {
        if (this.groupScrollTimeout) clearTimeout(this.groupScrollTimeout);

        this.groupScrollTimeout = setTimeout(() => {
          this.markVisibleMessagesAsRead();
        }, 100);
      });
    }
  }

  /**
   * Mark messages that are visible in the viewport as read
   */
  markVisibleMessagesAsRead() {
    // Only process if we have a socket connection
    if (!this.socket || !this.socket.connected) return;

    // Find currently active conversation
    const activeChat = this.getActiveChat();
    if (!activeChat) return;

    // Get all unread messages in the active conversation
    const unreadMessages = this.getUnreadMessages(activeChat);

    // Check which messages are visible
    const visibleMessages = this.filterVisibleMessages(unreadMessages);

    // Mark visible messages as read
    if (visibleMessages.length > 0) {
      this.markMessagesAsRead(visibleMessages);
    }
  }

  /**
   * Find the currently active chat container
   * @returns {Object|null} Active chat info or null if no chat is active
   */
  getActiveChat() {
    // Check if we're in a private chat
    const privateChat = document.getElementById('messages-container');
    if (privateChat && window.getComputedStyle(privateChat).display !== 'none') {
      // Find the recipient ID
      return {
        type: 'private',
        container: privateChat,
        recipientId: selectedUser ? selectedUser._id : null
      };
    }

    // Check if we're in a group chat
    const groupChat = document.getElementById('group-messages');
    if (groupChat && window.getComputedStyle(groupChat).display !== 'none') {
      return {
        type: 'group',
        container: groupChat,
        groupId: selectedGroup ? selectedGroup._id : null
      };
    }

    return null;
  }

  /**
   * Get all unread messages in the active conversation
   * @param {Object} activeChat - The active chat information
   * @returns {Array} Array of unread message elements
   */
  getUnreadMessages(activeChat) {
    if (!activeChat || !activeChat.container) return [];

    // For private chats, only mark messages from the other user
    if (activeChat.type === 'private' && activeChat.recipientId) {
      // Find messages from the other user that don't have a 'read' class
      const allMessages = activeChat.container.querySelectorAll('.message.received:not(.read)');
      return Array.from(allMessages);
    }

    // For group chats
    if (activeChat.type === 'group' && activeChat.groupId) {
      // In group chats, we only mark other users' messages as read
      const allMessages = activeChat.container.querySelectorAll('.message.received:not(.read)');
      return Array.from(allMessages);
    }

    return [];
  }

  /**
   * Filter messages to only those currently visible in the viewport
   * @param {Array} messages - Array of message elements
   * @returns {Array} Array of visible message elements
   */
  filterVisibleMessages(messages) {
    return messages.filter(msg => {
      // Check if the message is in the viewport
      const rect = msg.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    });
  }

  /**
   * Mark messages as read and notify the server
   * @param {Array} messages - Array of message elements to mark as read
   */
  markMessagesAsRead(messages) {
    // No messages to mark
    if (!messages || messages.length === 0) return;

    // Only proceed if we have a socket connection
    if (!this.socket || !this.socket.connected) return;

    // Get message IDs and add 'read' class
    const messageIds = messages.map(msg => {
      const messageId = msg.dataset.messageId;

      // Add 'read' class to mark as processed
      msg.classList.add('read');

      return messageId;
    }).filter(id => id); // Remove any undefined IDs

    // Notify server about read messages
    if (messageIds.length > 0) {
      this.socket.emit('markMessagesAsRead', {
        messageIds,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Update the UI to reflect a message's delivery status
   * @param {string} messageId - The message ID
   * @param {string} status - The delivery status ('sent', 'delivered', 'read')
   * @param {string} timestamp - ISO string timestamp of the status change
   */
  updateMessageDeliveryStatus(messageId, status, timestamp) {
    if (!messageId) return;

    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (!messageElement) return;

    // Format the timestamp for display
    const displayTime = this.formatTimestamp(timestamp);

    // Find or create the status element
    let statusElement = messageElement.querySelector('.read-status');
    if (!statusElement) {
      statusElement = document.createElement('div');
      statusElement.classList.add('read-status');
      messageElement.querySelector('.message-content')?.appendChild(statusElement);
    }

    // Update the status based on the current delivery state
    switch (status) {
      case 'sent':
        statusElement.innerHTML = '<i class="fas fa-check"></i>';
        statusElement.title = `Sent: ${displayTime}`;
        break;

      case 'delivered':
        statusElement.innerHTML = '<i class="fas fa-check"></i>';
        statusElement.title = `Delivered: ${displayTime}`;
        break;

      case 'read':
        statusElement.innerHTML = '<i class="fas fa-check-double"></i>';
        statusElement.title = `Read: ${displayTime}`;
        // Also update the detailed delivery info if it exists
        const deliveryInfo = messageElement.querySelector('.delivery-info');
        if (deliveryInfo) {
          deliveryInfo.innerHTML = `Read: ${displayTime}`;
        }
        break;
    }

    // Add the appropriate status class
    statusElement.classList.remove('status-sent', 'status-delivered', 'status-read');
    statusElement.classList.add(`status-${status}`);
  }

  /**
   * Format a timestamp for display
   * @param {string} timestamp - ISO string timestamp
   * @returns {string} Formatted timestamp string
   */
  formatTimestamp(timestamp) {
    try {
      const date = new Date(timestamp);

      // For today, show just the time
      const today = new Date();
      if (date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }

      // For yesterday, show "Yesterday" and time
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.getDate() === yesterday.getDate() &&
          date.getMonth() === yesterday.getMonth() &&
          date.getFullYear() === yesterday.getFullYear()) {
        return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      // For this week, show day of week and time
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      if (date >= thisWeekStart) {
        return `${daysOfWeek[date.getDay()]}, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
      }

      // Otherwise, show full date
      return date.toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: today.getFullYear() !== date.getFullYear() ? 'numeric' : undefined
      }) + ', ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return timestamp || 'Unknown time';
    }
  }

  /**
   * Enhance the createMessageElement function to add detailed delivery info
   * @param {Function} createMessageElement - Original create message function
   * @returns {Function} Enhanced create message function
   */
  enhanceCreateMessageElement(createMessageElement) {
    return (message) => {
      // Call the original function
      const messageElement = createMessageElement(message);

      // Only add detailed delivery info for sent messages
      if (message.sender && message.sender._id === currentUser?._id) {
        // Add a more detailed delivery info section
        const deliveryInfo = document.createElement('div');
        deliveryInfo.className = 'delivery-info';

        // Set initial status based on message state
        if (message.readBy && message.readBy.length > 0) {
          deliveryInfo.innerHTML = `Read: ${this.formatTimestamp(message.readBy[0].readAt)}`;
        } else if (message.deliveredAt) {
          deliveryInfo.innerHTML = `Delivered: ${this.formatTimestamp(message.deliveredAt)}`;
        } else {
          deliveryInfo.innerHTML = `Sent: ${this.formatTimestamp(message.createdAt)}`;
        }

        // Add to message
        const messageContent = messageElement.querySelector('.message-content');
        if (messageContent) {
          messageContent.appendChild(deliveryInfo);
        }
      }

      return messageElement;
    };
  }
}

// Export the MessageDeliveryTracker class
window.MessageDeliveryTracker = MessageDeliveryTracker;
