/**
 * Message Threading System
 *
 * This module provides functionality for:
 * - Replying to specific messages
 * - Displaying message threads/replies
 * - Organizing related messages together
 * - Jumping to original messages in threads
 */

class MessageThreading {
  constructor(socket) {
    this.socket = socket;
    this.replyingTo = null;
    this.replyingToElement = null;

    // Initialize the module
    this.init();
  }

  /**
   * Initialize the threading module
   */
  init() {
    if (!this.socket) {
      console.error('Socket not available for message threading');
      return;
    }

    // Setup event delegation for thread-related actions
    this.setupEventListeners();

    // Setup socket event listeners for threading
    this.setupSocketListeners();
  }

  /**
   * Set up event listeners for threading actions
   */
  setupEventListeners() {
    // Use event delegation to handle clicks on reply buttons
    document.addEventListener('click', (event) => {
      // Handle reply button clicks
      if (event.target.closest('.message-reply-btn')) {
        const messageElement = event.target.closest('.message');
        if (messageElement) {
          this.startReply(messageElement);
        }
      }

      // Handle cancel reply button
      else if (event.target.closest('.reply-cancel-btn')) {
        this.cancelReply();
      }

      // Handle thread view toggle
      else if (event.target.closest('.thread-count')) {
        const messageElement = event.target.closest('.message');
        if (messageElement) {
          this.toggleThreadView(messageElement);
        }
      }

      // Handle jump to original message
      else if (event.target.closest('.reply-original-link')) {
        event.preventDefault();
        const messageElement = event.target.closest('.message');
        if (messageElement && messageElement.dataset.parentId) {
          this.jumpToOriginalMessage(messageElement.dataset.parentId);
        }
      }
    });
  }

  /**
   * Set up socket listeners for threading
   */
  setupSocketListeners() {
    // Listen for new replies
    this.socket.on('newReply', (data) => {
      this.handleNewReply(data);
    });

    // Listen for thread updates (such as counts)
    this.socket.on('threadUpdated', (data) => {
      this.updateThreadCount(data);
    });
  }

  /**
   * Start replying to a message
   * @param {HTMLElement} messageElement - The message element to reply to
   */
  startReply(messageElement) {
    const messageId = messageElement.dataset.messageId;
    const sender = messageElement.querySelector('.message-sender').textContent;

    // Store info about the message we're replying to
    this.replyingTo = messageId;
    this.replyingToElement = messageElement;

    // Create reply preview in the chat input area
    this.createReplyPreview(messageElement);

    // Focus the input field
    const activeChat = document.querySelector('.chat-active');
    if (activeChat) {
      const messageInput = activeChat.querySelector('.message-input');
      if (messageInput) {
        messageInput.focus();
      }
    }
  }

  /**
   * Create a preview of the message being replied to in the input area
   * @param {HTMLElement} messageElement - The message element being replied to
   */
  createReplyPreview(messageElement) {
    // Find all active chat input areas (could be private or group chat)
    const inputAreas = document.querySelectorAll('.chat-input');

    inputAreas.forEach(inputArea => {
      // Remove any existing reply previews
      const existingPreview = inputArea.querySelector('.reply-preview');
      if (existingPreview) {
        existingPreview.remove();
      }

      // Create reply preview
      const replyPreview = document.createElement('div');
      replyPreview.className = 'reply-preview';

      // Get info from the message being replied to
      const sender = messageElement.querySelector('.message-sender').textContent;
      let previewContent = '';

      // Try to get content based on message type
      const textContent = messageElement.querySelector('.message-content p');
      const fileAttachment = messageElement.querySelector('.file-attachment');
      const voiceMessage = messageElement.querySelector('.voice-message-player');

      if (textContent) {
        // For text messages, get a preview of the content
        previewContent = textContent.textContent;
        // Truncate if too long
        if (previewContent.length > 50) {
          previewContent = previewContent.substring(0, 50) + '...';
        }
      } else if (fileAttachment) {
        previewContent = 'File attachment';
      } else if (voiceMessage) {
        previewContent = 'Voice message';
      }

      // Create the preview HTML
      replyPreview.innerHTML = `
        <div class="reply-preview-content">
          <span class="reply-to-sender">Replying to ${sender}</span>
          <p class="reply-preview-text">${previewContent}</p>
        </div>
        <button class="reply-cancel-btn">&times;</button>
      `;

      // Add to input area
      inputArea.insertBefore(replyPreview, inputArea.querySelector('.message-input-container'));
    });
  }

  /**
   * Cancel replying to a message
   */
  cancelReply() {
    // Remove reply preview from all input areas
    const replyPreviews = document.querySelectorAll('.reply-preview');
    replyPreviews.forEach(preview => preview.remove());

    // Reset reply state
    this.replyingTo = null;
    this.replyingToElement = null;
  }

  /**
   * Get the ID of the message being replied to, if any
   * @returns {string|null} The ID of the message being replied to, or null
   */
  getReplyingToId() {
    return this.replyingTo;
  }

  /**
   * Handle a new reply received from the server
   * @param {Object} data - The reply data
   */
  handleNewReply(data) {
    const { threadParentId, message } = data;

    // Update thread count for the original message
    this.updateThreadCount({
      messageId: threadParentId,
      count: data.threadCount || 1
    });

    // If thread view is open for this parent, add the reply
    const threadView = document.querySelector(`.thread-view[data-parent-id="${threadParentId}"]`);
    if (threadView) {
      // Add reply to thread view
      // Note: This would use the existing createMessageElement function
      // but we'd need to customize it for thread display
    }
  }

  /**
   * Toggle the thread view for a message
   * @param {HTMLElement} messageElement - The parent message element
   */
  toggleThreadView(messageElement) {
    const messageId = messageElement.dataset.messageId;

    // Check if thread view already exists
    let threadView = document.querySelector(`.thread-view[data-parent-id="${messageId}"]`);

    if (threadView) {
      // If it exists, toggle visibility
      threadView.classList.toggle('hidden');
    } else {
      // If it doesn't exist, create it and load replies
      this.createThreadView(messageElement);
    }
  }

  /**
   * Create a thread view for a message and load its replies
   * @param {HTMLElement} messageElement - The parent message element
   */
  createThreadView(messageElement) {
    const messageId = messageElement.dataset.messageId;

    // Create thread view container
    const threadView = document.createElement('div');
    threadView.className = 'thread-view';
    threadView.dataset.parentId = messageId;

    // Add loading indicator
    threadView.innerHTML = '<div class="thread-loading">Loading replies...</div>';

    // Insert after the parent message
    messageElement.insertAdjacentElement('afterend', threadView);

    // Request replies from server
    this.socket.emit('getThreadReplies', { messageId }, (response) => {
      if (response && response.error) {
        threadView.innerHTML = `<div class="thread-error">Error loading replies: ${response.error}</div>`;
        return;
      }

      const { replies } = response;

      if (!replies || replies.length === 0) {
        threadView.innerHTML = '<div class="thread-empty">No replies yet</div>';
        return;
      }

      // Clear loading indicator
      threadView.innerHTML = '';

      // Add heading
      const heading = document.createElement('div');
      heading.className = 'thread-heading';
      heading.innerHTML = `<h3>Replies (${replies.length})</h3>`;
      threadView.appendChild(heading);

      // Add replies container
      const repliesContainer = document.createElement('div');
      repliesContainer.className = 'thread-replies';
      threadView.appendChild(repliesContainer);

      // Add each reply
      // Here we would use the existing createMessageElement function
      // but customize it for thread display
      replies.forEach(reply => {
        // This is a placeholder - the actual implementation would
        // use the main app's createMessageElement function
        const replyElement = document.createElement('div');
        replyElement.className = 'message reply-message';
        replyElement.dataset.messageId = reply._id;
        replyElement.dataset.parentId = messageId;

        replyElement.innerHTML = `
          <div class="message-sender">${reply.sender.username}</div>
          <div class="message-content">
            <div class="reply-to-indicator">
              <i class="fas fa-reply"></i>
              <a href="#" class="reply-original-link">View original message</a>
            </div>
            <p>${reply.content}</p>
          </div>
          <div class="message-time">${formatTimestamp(reply.timestamp)}</div>
        `;

        repliesContainer.appendChild(replyElement);
      });
    });
  }

  /**
   * Update the thread count for a message
   * @param {Object} data - Data containing messageId and count
   */
  updateThreadCount(data) {
    const { messageId, count } = data;

    // Find message element
    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (!messageElement) return;

    // Find or create thread count element
    let threadCount = messageElement.querySelector('.thread-count');

    if (count > 0) {
      if (!threadCount) {
        // Create thread count indicator
        threadCount = document.createElement('div');
        threadCount.className = 'thread-count';

        // Add after message content
        const messageActions = messageElement.querySelector('.message-actions');
        if (messageActions) {
          messageActions.before(threadCount);
        } else {
          messageElement.appendChild(threadCount);
        }
      }

      // Update count text
      threadCount.innerHTML = `
        <i class="fas fa-comments"></i>
        <span>${count} ${count === 1 ? 'reply' : 'replies'}</span>
      `;
    } else if (threadCount) {
      // If count is 0 and element exists, remove it
      threadCount.remove();
    }
  }

  /**
   * Jump to the original message from a reply
   * @param {string} parentId - The ID of the parent message
   */
  jumpToOriginalMessage(parentId) {
    // Find the original message
    const parentMessage = document.querySelector(`.message[data-message-id="${parentId}"]`);

    if (parentMessage) {
      // Scroll to parent message
      parentMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Highlight it briefly
      parentMessage.classList.add('highlight-message');
      setTimeout(() => {
        parentMessage.classList.remove('highlight-message');
      }, 2000);
    } else {
      // If we can't find it in the current view, we might need to load it
      // This would depend on how the chat history is loaded
      console.log('Original message not found in current view');
    }
  }

  /**
   * Enhance the createMessageElement function to add threading support
   * @param {Function} originalCreateMessageElement - The original createMessageElement function
   * @returns {Function} Enhanced function with threading support
   */
  enhanceCreateMessageElement(originalCreateMessageElement) {
    return (message, isCurrentUser) => {
      // Call the original function to create the base message element
      const messageElement = originalCreateMessageElement(message, isCurrentUser);

      // Add reply button to message actions
      const messageActions = messageElement.querySelector('.message-actions');
      if (messageActions) {
        const replyButton = document.createElement('button');
        replyButton.className = 'message-action-btn message-reply-btn';
        replyButton.title = 'Reply to this message';
        replyButton.innerHTML = '<i class="fas fa-reply"></i>';

        // Add reply button as the first option in message actions
        messageActions.prepend(replyButton);
      }

      // If this is a reply, add parent reference
      if (message.parentId) {
        messageElement.dataset.parentId = message.parentId;

        // Add reply indicator
        const messageContent = messageElement.querySelector('.message-content');
        if (messageContent) {
          const replyIndicator = document.createElement('div');
          replyIndicator.className = 'reply-to-indicator';
          replyIndicator.innerHTML = `
            <i class="fas fa-reply"></i>
            <a href="#" class="reply-original-link">View original message</a>
          `;

          // Insert at beginning of message content
          messageContent.insertBefore(replyIndicator, messageContent.firstChild);
        }
      }

      // If this message has replies, add thread count
      if (message.threadCount && message.threadCount > 0) {
        this.updateThreadCount({
          messageId: message._id,
          count: message.threadCount
        });
      }

      return messageElement;
    };
  }

  /**
   * Hook into the send message process to handle replies
   * @param {Object} messageData - The message data being sent
   * @returns {Object} Enhanced message data with threading info
   */
  enhanceMessageData(messageData) {
    // If we're replying to a message, add the parentId
    if (this.replyingTo) {
      messageData.parentId = this.replyingTo;

      // Clear reply state after sending
      this.cancelReply();
    }

    return messageData;
  }
}

// Helper function to format timestamps (should match the main app)
function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleString([], {
    hour: '2-digit',
    minute: '2-digit',
    month: 'short',
    day: 'numeric'
  });
}
