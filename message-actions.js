/**
 * Message Actions Module
 *
 * This module provides functionality for additional message actions:
 * - Editing messages
 * - Deleting messages
 * - Forwarding messages
 * - Pinning messages
 */

class MessageActions {
  constructor(socket) {
    this.socket = socket;
    this.editingMessageId = null;
    this.editingMessageElement = null;
    this.originalMessageContent = null;

    // Initialize
    this.init();
  }

  /**
   * Initialize message actions
   */
  init() {
    if (!this.socket) {
      console.error('Socket not available for message actions');
      return;
    }

    // Set up event delegation for message actions
    this.setupEventListeners();

    // Set up socket event listeners
    this.setupSocketListeners();
  }

  /**
   * Set up event listeners for message actions
   */
  setupEventListeners() {
    // Use event delegation to handle clicks on message action buttons
    document.addEventListener('click', (event) => {
      // Handle edit button clicks
      if (event.target.closest('.message-edit-btn')) {
        const messageElement = event.target.closest('.message');
        if (messageElement) {
          this.startEditing(messageElement);
        }
      }

      // Handle delete button clicks
      else if (event.target.closest('.message-delete-btn')) {
        const messageElement = event.target.closest('.message');
        if (messageElement) {
          this.confirmDelete(messageElement);
        }
      }

      // Handle forward button clicks
      else if (event.target.closest('.message-forward-btn')) {
        const messageElement = event.target.closest('.message');
        if (messageElement) {
          this.showForwardDialog(messageElement);
        }
      }

      // Handle pin button clicks
      else if (event.target.closest('.message-pin-btn')) {
        const messageElement = event.target.closest('.message');
        if (messageElement) {
          this.togglePinMessage(messageElement);
        }
      }

      // Handle cancel edit button
      else if (event.target.closest('.edit-cancel-btn')) {
        this.cancelEditing();
      }

      // Handle save edit button
      else if (event.target.closest('.edit-save-btn')) {
        this.saveEdit();
      }
    });

    // Handle keyboard events for editing
    document.addEventListener('keydown', (event) => {
      // If we're editing a message
      if (this.editingMessageId) {
        // Escape key cancels editing
        if (event.key === 'Escape') {
          this.cancelEditing();
        }
        // Enter without shift saves the edit
        else if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();
          this.saveEdit();
        }
      }
    });
  }

  /**
   * Set up socket event listeners
   */
  setupSocketListeners() {
    // Listen for message edit updates
    this.socket.on('messageEdited', (data) => {
      this.updateEditedMessage(data);
    });

    // Listen for message delete events
    this.socket.on('messageDeleted', (data) => {
      this.removeDeletedMessage(data);
    });

    // Listen for message pin events
    this.socket.on('messagePinned', (data) => {
      this.updatePinnedMessage(data, true);
    });

    // Listen for message unpin events
    this.socket.on('messageUnpinned', (data) => {
      this.updatePinnedMessage(data, false);
    });
  }

  /**
   * Start editing a message
   * @param {HTMLElement} messageElement - The message element to edit
   */
  startEditing(messageElement) {
    // Check if we're already editing a message
    if (this.editingMessageId) {
      this.cancelEditing();
    }

    // Get message ID and content
    const messageId = messageElement.dataset.messageId;
    const messageContent = messageElement.querySelector('.message-content p');

    // Only allow editing text messages
    if (!messageContent) {
      showNotification('Only text messages can be edited', 'warning');
      return;
    }

    // Save original state
    this.editingMessageId = messageId;
    this.editingMessageElement = messageElement;
    this.originalMessageContent = messageContent.textContent;

    // Create edit field
    const editContainer = document.createElement('div');
    editContainer.className = 'message-edit-container';

    // Textarea for editing
    const textarea = document.createElement('textarea');
    textarea.className = 'message-edit-textarea';
    textarea.value = this.originalMessageContent;
    textarea.rows = 3;
    textarea.autofocus = true;

    // Buttons for actions
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'message-edit-buttons';

    const cancelButton = document.createElement('button');
    cancelButton.className = 'edit-cancel-btn';
    cancelButton.innerHTML = 'Cancel';

    const saveButton = document.createElement('button');
    saveButton.className = 'edit-save-btn';
    saveButton.innerHTML = 'Save';

    // Add elements
    buttonContainer.appendChild(cancelButton);
    buttonContainer.appendChild(saveButton);
    editContainer.appendChild(textarea);
    editContainer.appendChild(buttonContainer);

    // Replace content with edit field
    messageContent.style.display = 'none';
    messageElement.querySelector('.message-content').appendChild(editContainer);

    // Focus the textarea
    setTimeout(() => textarea.focus(), 0);

    // Add editing class
    messageElement.classList.add('editing');
  }

  /**
   * Cancel editing and revert to original message
   */
  cancelEditing() {
    if (!this.editingMessageElement) return;

    // Get message content element
    const messageContent = this.editingMessageElement.querySelector('.message-content p');
    if (messageContent) {
      // Show original content
      messageContent.style.display = '';
    }

    // Remove edit container
    const editContainer = this.editingMessageElement.querySelector('.message-edit-container');
    if (editContainer) {
      editContainer.remove();
    }

    // Remove editing class
    this.editingMessageElement.classList.remove('editing');

    // Reset editing state
    this.editingMessageId = null;
    this.editingMessageElement = null;
    this.originalMessageContent = null;
  }

  /**
   * Save edited message
   */
  saveEdit() {
    if (!this.editingMessageElement || !this.editingMessageId) return;

    // Get new content
    const textarea = this.editingMessageElement.querySelector('.message-edit-textarea');
    if (!textarea) return;

    const newContent = textarea.value.trim();

    // Don't save if content is empty or unchanged
    if (!newContent || newContent === this.originalMessageContent) {
      this.cancelEditing();
      return;
    }

    // Emit update event
    if (this.socket) {
      // Determine message type (private or group)
      const isGroupMessage = this.editingMessageElement.dataset.groupId ? true : false;

      if (isGroupMessage) {
        this.socket.emit('editGroupMessage', {
          messageId: this.editingMessageId,
          newContent,
          groupId: this.editingMessageElement.dataset.groupId
        }, (response) => {
          if (response && response.error) {
            showNotification('Failed to edit message: ' + response.error, 'error');
            this.cancelEditing();
          }
        });
      } else {
        this.socket.emit('editMessage', {
          messageId: this.editingMessageId,
          newContent
        }, (response) => {
          if (response && response.error) {
            showNotification('Failed to edit message: ' + response.error, 'error');
            this.cancelEditing();
          }
        });
      }
    }

    // Optimistically update the UI
    const messageContent = this.editingMessageElement.querySelector('.message-content p');
    if (messageContent) {
      messageContent.textContent = newContent;
      messageContent.style.display = '';
    }

    // Add edited indicator if not already present
    if (!this.editingMessageElement.querySelector('.message-edited-indicator')) {
      const editedIndicator = document.createElement('span');
      editedIndicator.className = 'message-edited-indicator';
      editedIndicator.textContent = '(edited)';
      messageContent.parentNode.appendChild(editedIndicator);
    }

    // Remove edit container
    const editContainer = this.editingMessageElement.querySelector('.message-edit-container');
    if (editContainer) {
      editContainer.remove();
    }

    // Remove editing class
    this.editingMessageElement.classList.remove('editing');

    // Reset editing state
    this.editingMessageId = null;
    this.editingMessageElement = null;
    this.originalMessageContent = null;
  }

  /**
   * Update an edited message in the UI
   * @param {Object} data - Data about the edited message
   */
  updateEditedMessage(data) {
    const { messageId, newContent, editedAt } = data;

    // Find message element
    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (!messageElement) return;

    // Update content
    const messageContent = messageElement.querySelector('.message-content p');
    if (messageContent) {
      messageContent.textContent = newContent;
    }

    // Add edited indicator if not already present
    if (!messageElement.querySelector('.message-edited-indicator')) {
      const editedIndicator = document.createElement('span');
      editedIndicator.className = 'message-edited-indicator';
      editedIndicator.textContent = '(edited)';

      // Format edited time if available
      if (editedAt) {
        const formattedTime = new Date(editedAt).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        });
        editedIndicator.title = `Edited at ${formattedTime}`;
      }

      // Add indicator after content
      messageContent.parentNode.appendChild(editedIndicator);
    }
  }

  /**
   * Display delete confirmation dialog
   * @param {HTMLElement} messageElement - The message element to delete
   */
  confirmDelete(messageElement) {
    const messageId = messageElement.dataset.messageId;

    // Create confirmation dialog
    const confirmDialog = document.createElement('div');
    confirmDialog.className = 'confirmation-dialog';
    confirmDialog.innerHTML = `
      <div class="confirmation-content">
        <p>Are you sure you want to delete this message?</p>
        <div class="confirmation-buttons">
          <button class="cancel-btn">Cancel</button>
          <button class="confirm-btn">Delete</button>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(confirmDialog);

    // Add event listeners
    confirmDialog.querySelector('.cancel-btn').addEventListener('click', () => {
      confirmDialog.remove();
    });

    confirmDialog.querySelector('.confirm-btn').addEventListener('click', () => {
      this.deleteMessage(messageElement);
      confirmDialog.remove();
    });

    // Close when clicking outside
    confirmDialog.addEventListener('click', (e) => {
      if (e.target === confirmDialog) {
        confirmDialog.remove();
      }
    });
  }

  /**
   * Delete a message
   * @param {HTMLElement} messageElement - The message element to delete
   */
  deleteMessage(messageElement) {
    const messageId = messageElement.dataset.messageId;

    // Determine message type (private or group)
    const isGroupMessage = messageElement.dataset.groupId ? true : false;

    // Emit delete event
    if (this.socket) {
      if (isGroupMessage) {
        this.socket.emit('deleteGroupMessage', {
          messageId,
          groupId: messageElement.dataset.groupId
        }, (response) => {
          if (response && response.error) {
            showNotification('Failed to delete message: ' + response.error, 'error');
          } else {
            // Optimistically update UI
            this.removeMessageElement(messageElement);
          }
        });
      } else {
        this.socket.emit('deleteMessage', {
          messageId
        }, (response) => {
          if (response && response.error) {
            showNotification('Failed to delete message: ' + response.error, 'error');
          } else {
            // Optimistically update UI
            this.removeMessageElement(messageElement);
          }
        });
      }
    }
  }

  /**
   * Remove a message element from the UI
   * @param {HTMLElement} messageElement - The message element to remove
   */
  removeMessageElement(messageElement) {
    // Add deleted class for animation
    messageElement.classList.add('deleted');

    // Remove after animation
    setTimeout(() => {
      if (messageElement.parentNode) {
        messageElement.parentNode.removeChild(messageElement);
      }
    }, 300);
  }

  /**
   * Remove a deleted message from the UI
   * @param {Object} data - Data about the deleted message
   */
  removeDeletedMessage(data) {
    const { messageId } = data;

    // Find message element
    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (messageElement) {
      this.removeMessageElement(messageElement);
    }
  }

  /**
   * Show dialog to forward a message
   * @param {HTMLElement} messageElement - The message element to forward
   */
  showForwardDialog(messageElement) {
    const messageId = messageElement.dataset.messageId;

    // Get message content for preview
    let messageContent = '';
    const contentElement = messageElement.querySelector('.message-content p');

    if (contentElement) {
      messageContent = contentElement.textContent;
    } else {
      // Check if it's a file or image message
      const fileAttachment = messageElement.querySelector('.file-attachment');
      if (fileAttachment) {
        messageContent = 'File attachment';
      }

      // Check if it's a voice message
      const voiceMessage = messageElement.querySelector('.voice-message-player');
      if (voiceMessage) {
        messageContent = 'Voice message';
      }
    }

    // Create forward dialog
    const forwardDialog = document.createElement('div');
    forwardDialog.className = 'forward-dialog';
    forwardDialog.innerHTML = `
      <div class="forward-content">
        <div class="forward-header">
          <h3>Forward Message</h3>
          <button class="close-forward">&times;</button>
        </div>
        <div class="forward-message-preview">
          <p>${messageContent}</p>
        </div>
        <div class="forward-to-section">
          <h4>Forward to:</h4>
          <div class="forward-search">
            <input type="text" placeholder="Search for users or groups" id="forward-search-input">
          </div>
          <div class="forward-recipients" id="forward-recipients">
            <div class="forward-loading">Loading contacts...</div>
          </div>
        </div>
        <div class="forward-actions">
          <button class="forward-cancel-btn">Cancel</button>
          <button class="forward-send-btn" disabled>Forward</button>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(forwardDialog);

    // Populate recipients
    this.loadForwardRecipients(messageId, forwardDialog);

    // Add event listeners
    forwardDialog.querySelector('.close-forward').addEventListener('click', () => {
      forwardDialog.remove();
    });

    forwardDialog.querySelector('.forward-cancel-btn').addEventListener('click', () => {
      forwardDialog.remove();
    });

    // Forward search functionality
    const searchInput = forwardDialog.querySelector('#forward-search-input');
    searchInput.addEventListener('input', () => {
      this.filterForwardRecipients(searchInput.value, forwardDialog);
    });

    // Close when clicking outside
    forwardDialog.addEventListener('click', (e) => {
      if (e.target === forwardDialog) {
        forwardDialog.remove();
      }
    });

    // Handle send button
    const sendButton = forwardDialog.querySelector('.forward-send-btn');
    sendButton.addEventListener('click', () => {
      this.forwardMessage(messageId, forwardDialog);
    });
  }

  /**
   * Load recipients for forwarding
   * @param {string} messageId - The message ID to forward
   * @param {HTMLElement} dialogElement - The forward dialog element
   */
  loadForwardRecipients(messageId, dialogElement) {
    const recipientsContainer = dialogElement.querySelector('#forward-recipients');

    // Request contacts from server
    if (this.socket) {
      this.socket.emit('getForwardRecipients', {}, (response) => {
        if (response && response.error) {
          recipientsContainer.innerHTML = `<div class="forward-error">Error loading contacts: ${response.error}</div>`;
          return;
        }

        // Process the contacts
        this.renderForwardRecipients(response, recipientsContainer, dialogElement, messageId);
      });
    } else {
      recipientsContainer.innerHTML = '<div class="forward-error">Cannot load contacts: No connection</div>';
    }
  }

  /**
   * Render recipients for forwarding
   * @param {Object} data - The recipients data
   * @param {HTMLElement} container - The container for recipients
   * @param {HTMLElement} dialogElement - The forward dialog element
   * @param {string} messageId - The message ID to forward
   */
  renderForwardRecipients(data, container, dialogElement, messageId) {
    const { users, groups } = data;

    // Clear container
    container.innerHTML = '';

    // Track selected recipients
    const selectedRecipients = {
      users: [],
      groups: []
    };

    // Update send button state
    const updateSendButton = () => {
      const sendButton = dialogElement.querySelector('.forward-send-btn');
      sendButton.disabled = selectedRecipients.users.length === 0 && selectedRecipients.groups.length === 0;
    };

    // Render users section
    if (users && users.length > 0) {
      const usersSection = document.createElement('div');
      usersSection.className = 'forward-section';
      usersSection.innerHTML = '<h5>Users</h5>';

      const usersList = document.createElement('div');
      usersList.className = 'forward-list';

      users.forEach(user => {
        const userItem = document.createElement('div');
        userItem.className = 'forward-item';
        userItem.dataset.id = user._id;
        userItem.dataset.type = 'user';

        userItem.innerHTML = `
          <img src="${user.profilePicture || '/uploads/default-avatar.png'}" alt="${user.username}" class="forward-avatar">
          <span class="forward-name">${user.username}</span>
          <div class="forward-checkbox"></div>
        `;

        // Toggle selection on click
        userItem.addEventListener('click', () => {
          userItem.classList.toggle('selected');

          if (userItem.classList.contains('selected')) {
            selectedRecipients.users.push(user._id);
          } else {
            const index = selectedRecipients.users.indexOf(user._id);
            if (index !== -1) {
              selectedRecipients.users.splice(index, 1);
            }
          }

          updateSendButton();
        });

        usersList.appendChild(userItem);
      });

      usersSection.appendChild(usersList);
      container.appendChild(usersSection);
    }

    // Render groups section
    if (groups && groups.length > 0) {
      const groupsSection = document.createElement('div');
      groupsSection.className = 'forward-section';
      groupsSection.innerHTML = '<h5>Groups</h5>';

      const groupsList = document.createElement('div');
      groupsList.className = 'forward-list';

      groups.forEach(group => {
        const groupItem = document.createElement('div');
        groupItem.className = 'forward-item';
        groupItem.dataset.id = group._id;
        groupItem.dataset.type = 'group';

        groupItem.innerHTML = `
          <img src="${group.avatar || '/uploads/default-group.png'}" alt="${group.name}" class="forward-avatar">
          <span class="forward-name">${group.name}</span>
          <div class="forward-checkbox"></div>
        `;

        // Toggle selection on click
        groupItem.addEventListener('click', () => {
          groupItem.classList.toggle('selected');

          if (groupItem.classList.contains('selected')) {
            selectedRecipients.groups.push(group._id);
          } else {
            const index = selectedRecipients.groups.indexOf(group._id);
            if (index !== -1) {
              selectedRecipients.groups.splice(index, 1);
            }
          }

          updateSendButton();
        });

        groupsList.appendChild(groupItem);
      });

      groupsSection.appendChild(groupsList);
      container.appendChild(groupsSection);
    }

    // Save selected recipients for later use
    dialogElement.selectedRecipients = selectedRecipients;

    // No contacts
    if ((!users || users.length === 0) && (!groups || groups.length === 0)) {
      container.innerHTML = '<div class="forward-empty">No contacts found to forward to</div>';
    }
  }

  /**
   * Filter forward recipients by search term
   * @param {string} searchTerm - The search term
   * @param {HTMLElement} dialogElement - The forward dialog element
   */
  filterForwardRecipients(searchTerm, dialogElement) {
    const searchLower = searchTerm.toLowerCase();
    const items = dialogElement.querySelectorAll('.forward-item');

    items.forEach(item => {
      const name = item.querySelector('.forward-name').textContent.toLowerCase();
      if (name.includes(searchLower) || searchTerm === '') {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });

    // Show/hide sections based on visible items
    const sections = dialogElement.querySelectorAll('.forward-section');
    sections.forEach(section => {
      const visibleItems = section.querySelectorAll('.forward-item[style=""]').length;
      if (visibleItems === 0) {
        section.style.display = 'none';
      } else {
        section.style.display = '';
      }
    });
  }

  /**
   * Forward a message to selected recipients
   * @param {string} messageId - The message ID to forward
   * @param {HTMLElement} dialogElement - The forward dialog element
   */
  forwardMessage(messageId, dialogElement) {
    const selectedRecipients = dialogElement.selectedRecipients;

    if (!selectedRecipients ||
        (selectedRecipients.users.length === 0 && selectedRecipients.groups.length === 0)) {
      showNotification('Please select at least one recipient', 'warning');
      return;
    }

    // Emit forward event
    if (this.socket) {
      this.socket.emit('forwardMessage', {
        messageId,
        userIds: selectedRecipients.users,
        groupIds: selectedRecipients.groups
      }, (response) => {
        if (response && response.error) {
          showNotification('Failed to forward message: ' + response.error, 'error');
        } else {
          showNotification('Message forwarded successfully', 'success');
          // Close dialog
          dialogElement.remove();
        }
      });
    }
  }

  /**
   * Toggle pin status for a message
   * @param {HTMLElement} messageElement - The message element to pin/unpin
   */
  togglePinMessage(messageElement) {
    const messageId = messageElement.dataset.messageId;
    const isPinned = messageElement.classList.contains('pinned');

    // Determine if it's a group message
    const isGroupMessage = messageElement.dataset.groupId ? true : false;
    const groupId = messageElement.dataset.groupId;

    // Emit pin/unpin event
    if (this.socket) {
      if (isPinned) {
        // Unpin message
        if (isGroupMessage) {
          this.socket.emit('unpinGroupMessage', {
            messageId,
            groupId
          }, (response) => {
            if (response && response.error) {
              showNotification('Failed to unpin message: ' + response.error, 'error');
            } else {
              // Optimistically update UI
              this.updatePinnedMessage({ messageId }, false);
            }
          });
        } else {
          this.socket.emit('unpinMessage', {
            messageId
          }, (response) => {
            if (response && response.error) {
              showNotification('Failed to unpin message: ' + response.error, 'error');
            } else {
              // Optimistically update UI
              this.updatePinnedMessage({ messageId }, false);
            }
          });
        }
      } else {
        // Pin message
        if (isGroupMessage) {
          this.socket.emit('pinGroupMessage', {
            messageId,
            groupId
          }, (response) => {
            if (response && response.error) {
              showNotification('Failed to pin message: ' + response.error, 'error');
            } else {
              // Optimistically update UI
              this.updatePinnedMessage({ messageId }, true);
            }
          });
        } else {
          this.socket.emit('pinMessage', {
            messageId
          }, (response) => {
            if (response && response.error) {
              showNotification('Failed to pin message: ' + response.error, 'error');
            } else {
              // Optimistically update UI
              this.updatePinnedMessage({ messageId }, true);
            }
          });
        }
      }
    }
  }

  /**
   * Update the UI for a pinned/unpinned message
   * @param {Object} data - Data about the message
   * @param {boolean} isPinned - Whether the message is pinned or unpinned
   */
  updatePinnedMessage(data, isPinned) {
    const { messageId } = data;

    // Find message element
    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (!messageElement) return;

    if (isPinned) {
      // Add pinned class
      messageElement.classList.add('pinned');

      // Add pin indicator if not already present
      if (!messageElement.querySelector('.message-pin-indicator')) {
        const pinIndicator = document.createElement('div');
        pinIndicator.className = 'message-pin-indicator';
        pinIndicator.innerHTML = '<i class="fas fa-thumbtack"></i>';

        // Get message content element to prepend indicator
        const messageContent = messageElement.querySelector('.message-content');
        if (messageContent) {
          messageContent.prepend(pinIndicator);
        }

        // Also add a global pinned message banner at the top of the chat
        this.addPinnedMessageBanner(messageElement);
      }
    } else {
      // Remove pinned class
      messageElement.classList.remove('pinned');

      // Remove pin indicator
      const pinIndicator = messageElement.querySelector('.message-pin-indicator');
      if (pinIndicator) {
        pinIndicator.remove();
      }

      // Remove pinned message banner if this was the pinned message
      this.updatePinnedMessageBanners();
    }
  }

  /**
   * Add a banner at the top of the chat for a pinned message
   * @param {HTMLElement} messageElement - The pinned message element
   */
  addPinnedMessageBanner(messageElement) {
    // Determine which chat container we're in
    let chatContainer;
    const isGroupMessage = messageElement.dataset.groupId ? true : false;

    if (isGroupMessage) {
      chatContainer = document.getElementById('group-messages');
    } else {
      chatContainer = document.getElementById('messages-container');
    }

    if (!chatContainer) return;

    // Remove any existing pinned message banners
    const existingBanners = chatContainer.querySelectorAll('.pinned-message-banner');
    existingBanners.forEach(banner => banner.remove());

    // Get message content
    let messageContent = '';
    const contentElement = messageElement.querySelector('.message-content p');

    if (contentElement) {
      messageContent = contentElement.textContent;
    } else {
      // Handle other types of messages
      if (messageElement.querySelector('.file-attachment')) {
        messageContent = 'File attachment';
      } else if (messageElement.querySelector('.voice-message-player')) {
        messageContent = 'Voice message';
      }
    }

    // Get sender name
    const senderName = messageElement.querySelector('.message-sender')?.textContent || 'User';

    // Create banner
    const banner = document.createElement('div');
    banner.className = 'pinned-message-banner';
    banner.dataset.messageId = messageElement.dataset.messageId;

    banner.innerHTML = `
      <div class="pinned-message-icon">
        <i class="fas fa-thumbtack"></i>
      </div>
      <div class="pinned-message-content">
        <div class="pinned-message-header">
          <span class="pinned-message-label">Pinned message</span>
          <span class="pinned-message-sender">${senderName}</span>
        </div>
        <div class="pinned-message-text">${messageContent}</div>
      </div>
      <button class="pinned-message-close">&times;</button>
    `;

    // Add to chat container
    chatContainer.prepend(banner);

    // Add event listener to scroll to message when clicked
    banner.addEventListener('click', (e) => {
      if (!e.target.closest('.pinned-message-close')) {
        this.scrollToMessage(messageElement);
      }
    });

    // Add event listener to unpin message
    banner.querySelector('.pinned-message-close').addEventListener('click', () => {
      this.togglePinMessage(messageElement);
    });
  }

  /**
   * Update all pinned message banners
   */
  updatePinnedMessageBanners() {
    // Find all pinned messages
    const pinnedMessages = document.querySelectorAll('.message.pinned');

    // Remove all existing banners
    const banners = document.querySelectorAll('.pinned-message-banner');
    banners.forEach(banner => banner.remove());

    // Add banners for all pinned messages
    pinnedMessages.forEach(message => {
      this.addPinnedMessageBanner(message);
    });
  }

  /**
   * Scroll to a message
   * @param {HTMLElement} messageElement - The message element to scroll to
   */
  scrollToMessage(messageElement) {
    if (!messageElement) return;

    // Add highlight class
    messageElement.classList.add('highlight-message');

    // Scroll into view
    messageElement.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });

    // Remove highlight after animation
    setTimeout(() => {
      messageElement.classList.remove('highlight-message');
    }, 2000);
  }

  /**
   * Enhance the createMessageElement function to add message actions
   * @param {Function} createMessageElementFn - Original create message function
   * @returns {Function} Enhanced function that adds message actions
   */
  enhanceCreateMessageElement(createMessageElementFn) {
    return (message) => {
      // Call the original function
      const messageElement = createMessageElementFn(message);

      // Only add actions to your own messages
      if (message.sender && message.sender._id === currentUser?._id) {
        // Add actions button
        const messageContent = messageElement.querySelector('.message-content');
        if (messageContent) {
          // Create message actions container if it doesn't exist
          let actionsContainer = messageElement.querySelector('.message-actions');
          if (!actionsContainer) {
            actionsContainer = document.createElement('div');
            actionsContainer.className = 'message-actions';
            messageContent.appendChild(actionsContainer);
          }

          // Add edit button
          const editButton = document.createElement('button');
          editButton.className = 'action-btn message-edit-btn';
          editButton.innerHTML = '<i class="fas fa-edit"></i>';
          editButton.title = 'Edit';
          actionsContainer.appendChild(editButton);

          // Add delete button
          const deleteButton = document.createElement('button');
          deleteButton.className = 'action-btn message-delete-btn';
          deleteButton.innerHTML = '<i class="fas fa-trash"></i>';
          deleteButton.title = 'Delete';
          actionsContainer.appendChild(deleteButton);
        }
      }

      // Add forward and pin buttons to all messages
      const messageContent = messageElement.querySelector('.message-content');
      if (messageContent) {
        // Create message actions container if it doesn't exist
        let actionsContainer = messageElement.querySelector('.message-actions');
        if (!actionsContainer) {
          actionsContainer = document.createElement('div');
          actionsContainer.className = 'message-actions';
          messageContent.appendChild(actionsContainer);
        }

        // Add forward button
        const forwardButton = document.createElement('button');
        forwardButton.className = 'action-btn message-forward-btn';
        forwardButton.innerHTML = '<i class="fas fa-share"></i>';
        forwardButton.title = 'Forward';
        actionsContainer.appendChild(forwardButton);

        // Add pin button
        const pinButton = document.createElement('button');
        pinButton.className = 'action-btn message-pin-btn';
        pinButton.innerHTML = '<i class="fas fa-thumbtack"></i>';
        pinButton.title = 'Pin';
        actionsContainer.appendChild(pinButton);
      }

      // If message is pinned, add pin indicator
      if (message.isPinned) {
        messageElement.classList.add('pinned');

        const pinIndicator = document.createElement('div');
        pinIndicator.className = 'message-pin-indicator';
        pinIndicator.innerHTML = '<i class="fas fa-thumbtack"></i>';

        if (messageContent) {
          messageContent.prepend(pinIndicator);
        }
      }

      // Add group ID to message element if it's a group message
      if (message.group && message.group._id) {
        messageElement.dataset.groupId = message.group._id;
      }

      return messageElement;
    };
  }
}

// Export the MessageActions class
window.MessageActions = MessageActions;
