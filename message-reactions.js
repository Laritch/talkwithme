/**
 * Message Reactions System
 *
 * This module provides functionality for users to react to messages with emojis.
 * Features:
 * - Add/remove reactions to messages
 * - Display reactions on messages
 * - Show who reacted with which emoji
 */

class MessageReactions {
  constructor(socket) {
    this.socket = socket;
    this.emojiPicker = null;
    this.currentMessageElement = null;
    this.currentMessageId = null;
    this.commonEmojis = ['👍', '👎', '❤️', '😂', '😮', '😢', '🎉', '🙏'];

    // Initialize the module
    this.init();
  }

  /**
   * Initialize the reactions module
   */
  init() {
    // Setup socket event listeners
    this.setupSocketListeners();

    // Create emoji picker
    this.createEmojiPicker();

    // Add event delegation for reaction buttons
    document.addEventListener('click', (event) => {
      // Check if clicked on a reaction button
      if (event.target.closest('.reaction-btn')) {
        const messageElement = event.target.closest('.message');
        if (messageElement) {
          this.showReactionPicker(messageElement);
        }
      }

      // Check if clicked on an emoji in the picker
      if (event.target.classList.contains('emoji-option')) {
        const emoji = event.target.textContent;
        this.addReaction(this.currentMessageId, emoji);
        this.hideEmojiPicker();
      }

      // Check if clicked on an existing reaction
      if (event.target.closest('.reaction-item')) {
        const reactionItem = event.target.closest('.reaction-item');
        const messageElement = reactionItem.closest('.message');
        const emoji = reactionItem.dataset.emoji;

        if (messageElement && emoji) {
          const messageId = messageElement.dataset.messageId;
          // Toggle reaction
          if (reactionItem.classList.contains('user-reacted')) {
            this.removeReaction(messageId, emoji);
          } else {
            this.addReaction(messageId, emoji);
          }
        }
      }

      // Close the emoji picker when clicking outside
      if (this.emojiPicker &&
          !this.emojiPicker.contains(event.target) &&
          !event.target.closest('.reaction-btn')) {
        this.hideEmojiPicker();
      }
    });
  }

  /**
   * Setup socket event listeners
   */
  setupSocketListeners() {
    if (!this.socket) return;

    // Listen for reaction updates
    this.socket.on('messageReactionUpdate', (data) => {
      this.updateMessageReactions(data.messageId, data.reactions);
    });
  }

  /**
   * Create the emoji picker element
   */
  createEmojiPicker() {
    if (this.emojiPicker) return;

    // Create emoji picker container
    this.emojiPicker = document.createElement('div');
    this.emojiPicker.className = 'emoji-reaction-picker';
    this.emojiPicker.style.display = 'none';

    // Add common emoji options
    this.commonEmojis.forEach(emoji => {
      const emojiOption = document.createElement('div');
      emojiOption.className = 'emoji-option';
      emojiOption.textContent = emoji;
      this.emojiPicker.appendChild(emojiOption);
    });

    // Add emoji picker to the document
    document.body.appendChild(this.emojiPicker);
  }

  /**
   * Show the reaction picker for a message
   * @param {HTMLElement} messageElement - The message element
   */
  showReactionPicker(messageElement) {
    if (!this.emojiPicker) return;

    this.currentMessageElement = messageElement;
    this.currentMessageId = messageElement.dataset.messageId;

    // Get the position of the reaction button
    const reactionBtn = messageElement.querySelector('.reaction-btn');
    if (!reactionBtn) return;

    const rect = reactionBtn.getBoundingClientRect();

    // Position the emoji picker above the reaction button
    this.emojiPicker.style.left = `${rect.left}px`;
    this.emojiPicker.style.top = `${rect.top - this.emojiPicker.offsetHeight - 10}px`;
    this.emojiPicker.style.display = 'flex';

    // If the picker would go off the top of the screen, position it below the button
    if (parseFloat(this.emojiPicker.style.top) < 10) {
      this.emojiPicker.style.top = `${rect.bottom + 10}px`;
    }
  }

  /**
   * Hide the emoji picker
   */
  hideEmojiPicker() {
    if (this.emojiPicker) {
      this.emojiPicker.style.display = 'none';
      this.currentMessageElement = null;
      this.currentMessageId = null;
    }
  }

  /**
   * Add a reaction to a message
   * @param {string} messageId - The message ID
   * @param {string} emoji - The emoji to react with
   */
  addReaction(messageId, emoji) {
    if (!this.socket || !messageId || !emoji) return;

    // Emit reaction event
    this.socket.emit('addReaction', {
      messageId,
      emoji
    }, (response) => {
      if (response && response.error) {
        console.error('Error adding reaction:', response.error);
        showNotification('Failed to add reaction', 'error');
      }
    });

    // Update UI optimistically
    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (messageElement) {
      // Check if reactions container exists, create if not
      let reactionsContainer = messageElement.querySelector('.message-reactions');
      if (!reactionsContainer) {
        reactionsContainer = document.createElement('div');
        reactionsContainer.className = 'message-reactions';
        messageElement.appendChild(reactionsContainer);
      }

      // Check if this emoji reaction already exists
      let reactionItem = reactionsContainer.querySelector(`.reaction-item[data-emoji="${emoji}"]`);

      if (reactionItem) {
        // If reaction exists, increment the count
        const countElement = reactionItem.querySelector('.reaction-count');
        if (countElement) {
          const currentCount = parseInt(countElement.textContent, 10) || 0;
          countElement.textContent = currentCount + 1;
        }

        // Mark as user-reacted
        reactionItem.classList.add('user-reacted');
      } else {
        // Create new reaction item
        reactionItem = document.createElement('div');
        reactionItem.className = 'reaction-item user-reacted';
        reactionItem.dataset.emoji = emoji;
        reactionItem.innerHTML = `
          <span class="reaction-emoji">${emoji}</span>
          <span class="reaction-count">1</span>
        `;
        reactionsContainer.appendChild(reactionItem);
      }
    }
  }

  /**
   * Remove a reaction from a message
   * @param {string} messageId - The message ID
   * @param {string} emoji - The emoji to remove
   */
  removeReaction(messageId, emoji) {
    if (!this.socket || !messageId || !emoji) return;

    // Emit remove reaction event
    this.socket.emit('removeReaction', {
      messageId,
      emoji
    }, (response) => {
      if (response && response.error) {
        console.error('Error removing reaction:', response.error);
        showNotification('Failed to remove reaction', 'error');
      }
    });

    // Update UI optimistically
    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (messageElement) {
      const reactionItem = messageElement.querySelector(`.reaction-item[data-emoji="${emoji}"]`);
      if (reactionItem) {
        const countElement = reactionItem.querySelector('.reaction-count');
        if (countElement) {
          const currentCount = parseInt(countElement.textContent, 10) || 0;

          if (currentCount <= 1) {
            // If this was the only reaction, remove the item
            reactionItem.remove();

            // If this was the last reaction, remove the container
            const reactionsContainer = messageElement.querySelector('.message-reactions');
            if (reactionsContainer && reactionsContainer.children.length === 0) {
              reactionsContainer.remove();
            }
          } else {
            // Otherwise decrement the count
            countElement.textContent = currentCount - 1;
            // Remove user-reacted class
            reactionItem.classList.remove('user-reacted');
          }
        }
      }
    }
  }

  /**
   * Update message reactions display based on server data
   * @param {string} messageId - The message ID
   * @param {Object} reactions - Reactions data from server
   */
  updateMessageReactions(messageId, reactions) {
    if (!messageId || !reactions) return;

    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (!messageElement) return;

    // Remove existing reactions
    const existingReactions = messageElement.querySelector('.message-reactions');
    if (existingReactions) {
      existingReactions.remove();
    }

    // If no reactions, return
    if (Object.keys(reactions).length === 0) return;

    // Create reactions container
    const reactionsContainer = document.createElement('div');
    reactionsContainer.className = 'message-reactions';

    // Get current user ID
    const currentUserId = currentUser ? currentUser._id : null;

    // Add each reaction
    Object.entries(reactions).forEach(([emoji, users]) => {
      if (users.length === 0) return;

      const reactionItem = document.createElement('div');
      reactionItem.className = 'reaction-item';
      reactionItem.dataset.emoji = emoji;

      // Check if current user has reacted with this emoji
      const userReacted = currentUserId && users.some(user => user._id === currentUserId);
      if (userReacted) {
        reactionItem.classList.add('user-reacted');
      }

      // Create tooltip with user names
      const usernames = users.map(user => user.username).join(', ');
      reactionItem.title = usernames;

      reactionItem.innerHTML = `
        <span class="reaction-emoji">${emoji}</span>
        <span class="reaction-count">${users.length}</span>
      `;

      reactionsContainer.appendChild(reactionItem);
    });

    // Add reactions container to message
    messageElement.appendChild(reactionsContainer);
  }

  /**
   * Update the createMessageElement function to add reaction button
   * @param {Function} createMessageElement - The original createMessageElement function
   * @returns {Function} Enhanced createMessageElement function
   */
  enhanceCreateMessageElement(createMessageElement) {
    return (message) => {
      // Call the original function
      const messageElement = createMessageElement(message);

      // Add reaction button
      const messageContent = messageElement.querySelector('.message-content');
      if (messageContent) {
        const messageActions = document.createElement('div');
        messageActions.className = 'message-actions';

        const reactionButton = document.createElement('button');
        reactionButton.className = 'action-btn reaction-btn';
        reactionButton.innerHTML = '<i class="far fa-smile"></i>';
        reactionButton.title = 'Add reaction';

        messageActions.appendChild(reactionButton);
        messageContent.appendChild(messageActions);
      }

      // Add reactions if message has any
      if (message.reactions && Object.keys(message.reactions).length > 0) {
        this.updateMessageReactions(message._id, message.reactions);
      }

      return messageElement;
    };
  }
}

// Export the MessageReactions class
window.MessageReactions = MessageReactions;
