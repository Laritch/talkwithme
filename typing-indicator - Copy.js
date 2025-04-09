/**
 * Enhanced Typing Indicator Module
 *
 * This module provides functionality for:
 * - Showing when users are typing in private and group chats
 * - Integration with rich text editor
 * - Multiple users typing states
 * - Debounced typing events
 */

class TypingIndicator {
  constructor(socket) {
    this.socket = socket;
    this.typingTimeout = 3000; // Time in ms before typing state expires
    this.typingUsers = new Map(); // Map of userIds to their typing status
    this.typingTimeouts = new Map(); // Map of userIds to their timeout functions
    this.isTyping = false; // Current user typing state
    this.typingThrottleTimeout = null; // For throttling typing events

    // Initialize the module
    this.init();
  }

  /**
   * Initialize the typing indicator
   */
  init() {
    if (!this.socket) {
      console.error('Socket not available for typing indicator');
      return;
    }

    // Create typing indicator elements
    this.createTypingIndicators();

    // Setup input listeners
    this.setupInputListeners();

    // Setup socket listeners
    this.setupSocketListeners();
  }

  /**
   * Create typing indicator elements
   */
  createTypingIndicators() {
    // Create private chat typing indicator
    const privateChatContainer = document.querySelector('.private-chat .chat-messages');
    if (privateChatContainer) {
      const indicatorContainer = document.createElement('div');
      indicatorContainer.className = 'typing-indicator-container';
      indicatorContainer.innerHTML = `
        <div class="typing-indicator" id="private-typing-indicator">
          <div class="typing-indicator-avatar">
            <img src="/uploads/default-avatar.png" alt="User Avatar" id="typing-user-avatar">
          </div>
          <div class="typing-indicator-text">
            <span class="typing-indicator-username" id="typing-username"></span>
            <span> is typing</span>
            <span class="typing-indicator-dots">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </span>
          </div>
        </div>
        <div class="typing-indicator multiple-typing" id="private-multiple-typing">
          Several people are typing...
        </div>
      `;

      // Add to message container
      privateChatContainer.appendChild(indicatorContainer);
    }

    // Create group chat typing indicator
    const groupChatContainer = document.querySelector('.group-chat .chat-messages');
    if (groupChatContainer) {
      const indicatorContainer = document.createElement('div');
      indicatorContainer.className = 'typing-indicator-container';
      indicatorContainer.innerHTML = `
        <div class="typing-indicator" id="group-typing-indicator">
          <div class="typing-indicator-avatar">
            <img src="/uploads/default-avatar.png" alt="User Avatar" id="group-typing-user-avatar">
          </div>
          <div class="typing-indicator-text">
            <span class="typing-indicator-username" id="group-typing-username"></span>
            <span> is typing</span>
            <span class="typing-indicator-dots">
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
              <span class="typing-dot"></span>
            </span>
          </div>
        </div>
        <div class="typing-indicator multiple-typing" id="group-multiple-typing">
          Several people are typing...
        </div>
      `;

      // Add to message container
      groupChatContainer.appendChild(indicatorContainer);
    }
  }

  /**
   * Setup input listeners for typing events
   */
  setupInputListeners() {
    // Private chat input
    const privateInput = document.getElementById('message-input');
    if (privateInput) {
      this.setupInputListener(privateInput, 'private');

      // For rich text editor, we need to listen to input events on the editor content area
      document.addEventListener('click', (event) => {
        // Check for editor content clicks to handle rich text editor
        const editorContent = event.target.closest('.editor-content');
        if (editorContent) {
          // Find the related message input this editor is for
          const parentContainer = editorContent.closest('.chat-input');
          if (parentContainer) {
            // Determine if it's private or group chat
            const chatType = parentContainer.closest('.private-chat') ? 'private' : 'group';
            this.setupEditorInputListener(editorContent, chatType);
          }
        }
      });
    }

    // Group chat input
    const groupInput = document.getElementById('group-message-input');
    if (groupInput) {
      this.setupInputListener(groupInput, 'group');
    }
  }

  /**
   * Setup input listener for a specific input element
   * @param {HTMLElement} inputElement - The input element to listen to
   * @param {string} chatType - The type of chat ('private' or 'group')
   */
  setupInputListener(inputElement, chatType) {
    // Use input event to catch all user inputs including paste
    inputElement.addEventListener('input', () => {
      // When input changes, send typing signal if not already typing
      if (!this.isTyping) {
        this.isTyping = true;
        this.sendTypingSignal(chatType, true);
      }

      // Debounce the typing stop signal
      this.debounceSendTypingStop(chatType);
    });

    // Handle focus out to immediately stop typing indicator
    inputElement.addEventListener('blur', () => {
      if (this.isTyping) {
        this.isTyping = false;
        this.sendTypingSignal(chatType, false);
      }
    });
  }

  /**
   * Setup input listener for rich text editor
   * @param {HTMLElement} editorElement - The editor element to listen to
   * @param {string} chatType - The type of chat ('private' or 'group')
   */
  setupEditorInputListener(editorElement, chatType) {
    // Check if we've already attached a listener
    if (editorElement.hasAttribute('data-typing-listener')) return;

    // Mark as having a listener
    editorElement.setAttribute('data-typing-listener', 'true');

    // Use input, keydown, and paste events to catch all types of input
    const events = ['input', 'keydown', 'paste'];

    events.forEach(eventType => {
      editorElement.addEventListener(eventType, () => {
        // When content changes, send typing signal if not already typing
        if (!this.isTyping) {
          this.isTyping = true;
          this.sendTypingSignal(chatType, true);
        }

        // Debounce the typing stop signal
        this.debounceSendTypingStop(chatType);
      });
    });

    // Handle blur to immediately stop typing indicator
    editorElement.addEventListener('blur', () => {
      if (this.isTyping) {
        this.isTyping = false;
        this.sendTypingSignal(chatType, false);
      }
    });
  }

  /**
   * Debounce the typing stop signal
   * @param {string} chatType - The type of chat ('private' or 'group')
   */
  debounceSendTypingStop(chatType) {
    // Clear previous timeout
    if (this.typingThrottleTimeout) {
      clearTimeout(this.typingThrottleTimeout);
    }

    // Set new timeout
    this.typingThrottleTimeout = setTimeout(() => {
      this.isTyping = false;
      this.sendTypingSignal(chatType, false);
    }, 2000); // 2 seconds after last input
  }

  /**
   * Send typing signal to other users
   * @param {string} chatType - The type of chat ('private' or 'group')
   * @param {boolean} isTyping - Whether user is typing or stopped typing
   */
  sendTypingSignal(chatType, isTyping) {
    if (!this.socket) return;

    if (chatType === 'private' && selectedUser) {
      this.socket.emit('typingPrivate', {
        recipientId: selectedUser._id,
        isTyping
      });
    } else if (chatType === 'group' && selectedGroup) {
      this.socket.emit('typingGroup', {
        groupId: selectedGroup._id,
        isTyping
      });
    }
  }

  /**
   * Setup socket listeners for typing events
   */
  setupSocketListeners() {
    // Private chat typing indicator
    this.socket.on('userTyping', (data) => {
      const { userId, username, profilePicture, isTyping } = data;

      if (isTyping) {
        // Add to typing users
        this.typingUsers.set(userId, {
          username,
          profilePicture
        });

        // Clear existing timeout if any
        if (this.typingTimeouts.has(userId)) {
          clearTimeout(this.typingTimeouts.get(userId));
        }

        // Set new timeout to clear typing status
        const timeout = setTimeout(() => {
          this.typingUsers.delete(userId);
          this.updateTypingIndicator('private');
        }, this.typingTimeout);

        this.typingTimeouts.set(userId, timeout);
      } else {
        // User stopped typing, remove from typing users
        this.typingUsers.delete(userId);

        // Clear timeout
        if (this.typingTimeouts.has(userId)) {
          clearTimeout(this.typingTimeouts.get(userId));
          this.typingTimeouts.delete(userId);
        }
      }

      // Update indicator UI
      this.updateTypingIndicator('private');
    });

    // Group chat typing indicator
    this.socket.on('groupTyping', (data) => {
      const { userId, username, profilePicture, groupId, isTyping } = data;

      // Only process if we're in this group
      if (!selectedGroup || selectedGroup._id !== groupId) return;

      if (isTyping) {
        // Add to typing users
        this.typingUsers.set(userId, {
          username,
          profilePicture,
          groupId
        });

        // Clear existing timeout if any
        if (this.typingTimeouts.has(userId)) {
          clearTimeout(this.typingTimeouts.get(userId));
        }

        // Set new timeout to clear typing status
        const timeout = setTimeout(() => {
          this.typingUsers.delete(userId);
          this.updateTypingIndicator('group');
        }, this.typingTimeout);

        this.typingTimeouts.set(userId, timeout);
      } else {
        // User stopped typing, remove from typing users
        this.typingUsers.delete(userId);

        // Clear timeout
        if (this.typingTimeouts.has(userId)) {
          clearTimeout(this.typingTimeouts.get(userId));
          this.typingTimeouts.delete(userId);
        }
      }

      // Update indicator UI
      this.updateTypingIndicator('group');
    });

    // When a new message arrives, clear typing indicator for that user
    this.socket.on('newMessage', (message) => {
      if (this.typingUsers.has(message.sender._id)) {
        this.typingUsers.delete(message.sender._id);

        // Clear timeout
        if (this.typingTimeouts.has(message.sender._id)) {
          clearTimeout(this.typingTimeouts.get(message.sender._id));
          this.typingTimeouts.delete(message.sender._id);
        }

        // Update indicator UI
        this.updateTypingIndicator('private');
      }
    });

    // When a new group message arrives, clear typing indicator for that user
    this.socket.on('newGroupMessage', (message) => {
      if (this.typingUsers.has(message.sender._id)) {
        this.typingUsers.delete(message.sender._id);

        // Clear timeout
        if (this.typingTimeouts.has(message.sender._id)) {
          clearTimeout(this.typingTimeouts.get(message.sender._id));
          this.typingTimeouts.delete(message.sender._id);
        }

        // Update indicator UI
        this.updateTypingIndicator('group');
      }
    });
  }

  /**
   * Update typing indicator UI
   * @param {string} chatType - The type of chat ('private' or 'group')
   */
  updateTypingIndicator(chatType) {
    // Get relevant elements
    const singleIndicator = document.getElementById(`${chatType}-typing-indicator`);
    const multipleIndicator = document.getElementById(`${chatType}-multiple-typing`);
    const usernameEl = document.getElementById(`${chatType}-typing-username`);
    const avatarEl = document.getElementById(`${chatType}-typing-user-avatar`);

    if (!singleIndicator || !multipleIndicator) return;

    // Filter typing users for the current chat context
    let typingUsersInContext = [];

    if (chatType === 'private' && selectedUser) {
      // For private chat, only show typing indicator for selected user
      typingUsersInContext = Array.from(this.typingUsers.entries())
        .filter(([userId]) => userId === selectedUser._id)
        .map(([_, userData]) => userData);
    } else if (chatType === 'group' && selectedGroup) {
      // For group chat, show typing indicators for users in the selected group
      typingUsersInContext = Array.from(this.typingUsers.entries())
        .filter(([_, userData]) => !userData.groupId || userData.groupId === selectedGroup._id)
        .map(([_, userData]) => userData);
    }

    // Hide both indicators by default
    singleIndicator.classList.remove('active');
    multipleIndicator.classList.remove('active');

    // No one is typing
    if (typingUsersInContext.length === 0) {
      return;
    }

    // One person is typing
    if (typingUsersInContext.length === 1) {
      const typingUser = typingUsersInContext[0];

      // Update single user indicator
      if (usernameEl) usernameEl.textContent = typingUser.username;
      if (avatarEl) avatarEl.src = typingUser.profilePicture || '/uploads/default-avatar.png';

      // Show single indicator
      singleIndicator.classList.add('active');
    }
    // Multiple people are typing
    else {
      // Show multiple indicator
      multipleIndicator.classList.add('active');
    }

    // Scroll to bottom to show typing indicator
    this.scrollChatToBottom(chatType);
  }

  /**
   * Scroll chat to bottom to show typing indicator
   * @param {string} chatType - The type of chat ('private' or 'group')
   */
  scrollChatToBottom(chatType) {
    const messageContainer = document.querySelector(
      chatType === 'private' ? '.private-chat .messages-container' : '.group-chat .messages-container'
    );

    if (messageContainer) {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    }
  }
}
