/**
 * Message Quoting System
 *
 * This module provides functionality for:
 * - Quoting existing messages within new messages
 * - Displaying quoted messages in a compact format
 * - Differentiating between quotes and replies
 */

class MessageQuoting {
  constructor(socket) {
    this.socket = socket;
    this.quotingMessageId = null;
    this.quotingMessageElement = null;
    this.quotingMessageText = null;
    this.quotingSender = null;

    // Initialize the module
    this.init();
  }

  /**
   * Initialize the quoting module
   */
  init() {
    if (!this.socket) {
      console.error('Socket not available for message quoting');
      return;
    }

    // Set up event delegation for quote-related actions
    this.setupEventListeners();

    // Set up socket listeners for quote-related events
    this.setupSocketListeners();
  }

  /**
   * Set up event listeners for quoting actions
   */
  setupEventListeners() {
    // Use event delegation to handle clicks on quote buttons
    document.addEventListener('click', (event) => {
      // Handle quote button clicks
      if (event.target.closest('.message-quote-btn')) {
        const messageElement = event.target.closest('.message');
        if (messageElement) {
          this.startQuoting(messageElement);
        }
      }

      // Handle cancel quote button
      else if (event.target.closest('.quote-cancel-btn')) {
        this.cancelQuoting();
      }

      // Handle jump to original quoted message
      else if (event.target.closest('.quoted-message')) {
        const quotedMessageElement = event.target.closest('.quoted-message');
        const originalId = quotedMessageElement.dataset.originalMessageId;
        if (originalId) {
          this.jumpToOriginalMessage(originalId);
        }
      }
    });
  }

  /**
   * Set up socket listeners for quote-related events
   */
  setupSocketListeners() {
    // We don't need any specific socket listeners for quoting
    // since quotes are sent as part of the normal message content
  }

  /**
   * Start quoting a message
   * @param {HTMLElement} messageElement - The message element to quote
   */
  startQuoting(messageElement) {
    const messageId = messageElement.dataset.messageId;
    const sender = messageElement.querySelector('.message-sender').textContent;

    // Get the message content
    let quoteContent = '';
    const contentElement = messageElement.querySelector('.message-content p');

    if (contentElement) {
      quoteContent = contentElement.textContent;
    } else {
      // Check if it's a file or image message
      const fileAttachment = messageElement.querySelector('.file-attachment');
      if (fileAttachment) {
        quoteContent = 'File attachment';
      }

      // Check if it's a voice message
      const voiceMessage = messageElement.querySelector('.voice-message-player');
      if (voiceMessage) {
        quoteContent = 'Voice message';
      }
    }

    // Store the quoting information
    this.quotingMessageId = messageId;
    this.quotingMessageElement = messageElement;
    this.quotingMessageText = quoteContent;
    this.quotingSender = sender;

    // Create quote preview in the chat input area
    this.createQuotePreview(messageElement);

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
   * Create a preview of the message being quoted in the input area
   * @param {HTMLElement} messageElement - The message element being quoted
   */
  createQuotePreview(messageElement) {
    // Find all active chat input areas (could be private or group chat)
    const inputAreas = document.querySelectorAll('.chat-input');

    inputAreas.forEach(inputArea => {
      // Remove any existing quote previews
      const existingPreview = inputArea.querySelector('.quote-preview');
      if (existingPreview) {
        existingPreview.remove();
      }

      // Create quote preview
      const quotePreview = document.createElement('div');
      quotePreview.className = 'quote-preview';

      // Truncate if too long
      let previewText = this.quotingMessageText;
      if (previewText && previewText.length > 65) {
        previewText = previewText.substring(0, 65) + '...';
      }

      // Create the preview HTML
      quotePreview.innerHTML = `
        <div class="quote-preview-content">
          <div class="quote-info">
            <span class="quote-icon"><i class="fas fa-quote-left"></i></span>
            <span class="quote-sender">${this.quotingSender}</span>
          </div>
          <p class="quote-preview-text">${previewText || 'Media content'}</p>
        </div>
        <button class="quote-cancel-btn">&times;</button>
      `;

      // Add to input area
      inputArea.insertBefore(quotePreview, inputArea.querySelector('.message-input-container'));
    });
  }

  /**
   * Cancel quoting a message
   */
  cancelQuoting() {
    // Remove quote preview from all input areas
    const quotePreviews = document.querySelectorAll('.quote-preview');
    quotePreviews.forEach(preview => preview.remove());

    // Reset quote state
    this.quotingMessageId = null;
    this.quotingMessageElement = null;
    this.quotingMessageText = null;
    this.quotingSender = null;
  }

  /**
   * Enhance message data with quote information
   * @param {Object} messageData - The message data being sent
   * @returns {Object} Enhanced message data with quote info
   */
  enhanceMessageData(messageData) {
    // If we're quoting a message, add the quote data
    if (this.quotingMessageId) {
      messageData.quotedMessageId = this.quotingMessageId;
      messageData.quotedText = this.quotingMessageText;
      messageData.quotedSender = this.quotingSender;

      // Clear quote state after sending
      this.cancelQuoting();
    }

    return messageData;
  }

  /**
   * Jump to the original quoted message
   * @param {string} messageId - The ID of the original message
   */
  jumpToOriginalMessage(messageId) {
    // Find the original message
    const originalMessage = document.querySelector(`.message[data-message-id="${messageId}"]`);

    if (originalMessage) {
      // Scroll to original message
      originalMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Highlight it briefly
      originalMessage.classList.add('highlight-message');
      setTimeout(() => {
        originalMessage.classList.remove('highlight-message');
      }, 2000);
    } else {
      // If we can't find it in the current view, we might need to load it
      console.log('Original message not found in current view');
      showNotification('Original message not found in current view', 'info');
    }
  }

  /**
   * Enhance the createMessageElement function to display quoted messages
   * @param {Function} originalCreateMessageElement - The original createMessageElement function
   * @returns {Function} Enhanced function with quote display support
   */
  enhanceCreateMessageElement(originalCreateMessageElement) {
    return (message, isCurrentUser) => {
      // Call the original function to create the base message element
      const messageElement = originalCreateMessageElement(message, isCurrentUser);

      // Add quote button to message actions
      const messageActions = messageElement.querySelector('.message-actions');
      if (messageActions) {
        const quoteButton = document.createElement('button');
        quoteButton.className = 'message-action-btn message-quote-btn';
        quoteButton.title = 'Quote this message';
        quoteButton.innerHTML = '<i class="fas fa-quote-right"></i>';

        // Add quote button to message actions
        messageActions.appendChild(quoteButton);
      }

      // If this message quotes another, add the quoted content
      if (message.quotedMessageId) {
        const messageContent = messageElement.querySelector('.message-content');
        if (messageContent && messageContent.firstChild) {
          // Create quoted message display
          const quotedMessageElement = document.createElement('div');
          quotedMessageElement.className = 'quoted-message';
          quotedMessageElement.dataset.originalMessageId = message.quotedMessageId;

          quotedMessageElement.innerHTML = `
            <div class="quoted-content">
              <div class="quoted-sender">${message.quotedSender}</div>
              <div class="quoted-text">${message.quotedText || 'Media content'}</div>
            </div>
          `;

          // Insert at beginning of message content, before the actual message text
          messageContent.insertBefore(quotedMessageElement, messageContent.firstChild);

          // Add click event to jump to original (handled by event delegation)
          quotedMessageElement.title = 'Click to see original message';
        }
      }

      return messageElement;
    };
  }
}
