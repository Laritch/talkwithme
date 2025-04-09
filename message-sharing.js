/**
 * Message Link Sharing System
 *
 * This module provides functionality for:
 * - Generating shareable links to specific messages
 * - Navigating to messages via links
 * - Sharing messages across different chats
 */

class MessageSharing {
  constructor(socket) {
    this.socket = socket;
    this.baseUrl = window.location.origin;

    // Initialize the module
    this.init();
  }

  /**
   * Initialize the message sharing module
   */
  init() {
    if (!this.socket) {
      console.error('Socket not available for message sharing');
      return;
    }

    // Set up event delegation for sharing-related actions
    this.setupEventListeners();

    // Listen for URL parameters on page load to handle direct message links
    this.handleDirectMessageLinks();
  }

  /**
   * Set up event listeners for message sharing
   */
  setupEventListeners() {
    // Use event delegation to handle clicks on share buttons
    document.addEventListener('click', (event) => {
      if (event.target.closest('.message-share-btn')) {
        const messageElement = event.target.closest('.message');
        if (messageElement) {
          this.showShareOptions(messageElement);
        }
      }
    });
  }

  /**
   * Show sharing options for a message
   * @param {HTMLElement} messageElement - The message element to share
   */
  showShareOptions(messageElement) {
    const messageId = messageElement.dataset.messageId;

    // Create shareable link
    const messageLink = this.generateMessageLink(messageId);

    // Create share dialog
    const shareDialog = document.createElement('div');
    shareDialog.className = 'share-dialog';

    shareDialog.innerHTML = `
      <div class="share-content">
        <div class="share-header">
          <h3>Share Message</h3>
          <button class="close-share">&times;</button>
        </div>
        <div class="share-options">
          <div class="share-link-container">
            <label for="share-link">Message Link</label>
            <div class="share-link-input">
              <input type="text" id="share-link" value="${messageLink}" readonly>
              <button class="copy-link-btn" title="Copy link">
                <i class="fas fa-copy"></i>
              </button>
            </div>
          </div>
          <div class="share-to-section">
            <h4>Share to chat:</h4>
            <div class="share-search">
              <input type="text" placeholder="Search for users or groups" id="share-search-input">
            </div>
            <div class="share-recipients" id="share-recipients">
              <div class="share-loading">Loading contacts...</div>
            </div>
          </div>
        </div>
        <div class="share-actions">
          <button class="share-cancel-btn">Cancel</button>
          <button class="share-send-btn" disabled>Share</button>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(shareDialog);

    // Add event listeners for dialog
    this.setupShareDialogListeners(shareDialog, messageId);

    // Load share recipients
    this.loadShareRecipients(messageId, shareDialog);
  }

  /**
   * Set up event listeners for the share dialog
   * @param {HTMLElement} dialog - The share dialog element
   * @param {string} messageId - The ID of the message being shared
   */
  setupShareDialogListeners(dialog, messageId) {
    // Close button
    const closeBtn = dialog.querySelector('.close-share');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        dialog.remove();
      });
    }

    // Cancel button
    const cancelBtn = dialog.querySelector('.share-cancel-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        dialog.remove();
      });
    }

    // Copy link button
    const copyBtn = dialog.querySelector('.copy-link-btn');
    const linkInput = dialog.querySelector('#share-link');

    if (copyBtn && linkInput) {
      copyBtn.addEventListener('click', () => {
        linkInput.select();
        document.execCommand('copy');

        // Show feedback
        copyBtn.innerHTML = '<i class="fas fa-check"></i>';
        copyBtn.classList.add('copied');

        setTimeout(() => {
          copyBtn.innerHTML = '<i class="fas fa-copy"></i>';
          copyBtn.classList.remove('copied');
        }, 2000);

        showNotification('Link copied to clipboard', 'success');
      });
    }

    // Share button
    const shareBtn = dialog.querySelector('.share-send-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        this.shareMessageToRecipients(messageId, dialog);
      });
    }

    // Search input
    const searchInput = dialog.querySelector('#share-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.filterShareRecipients(searchInput.value, dialog);
      });
    }

    // Close when clicking outside
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }

  /**
   * Generate a shareable link for a message
   * @param {string} messageId - The ID of the message to share
   * @returns {string} The shareable link
   */
  generateMessageLink(messageId) {
    // Create a link with the message ID as a parameter
    let context = '';

    // If we're in a group, add group context
    if (window.selectedGroup) {
      context = `&groupId=${window.selectedGroup._id}`;
    }
    // If we're in a private chat, add user context
    else if (window.selectedUser) {
      context = `&userId=${window.selectedUser._id}`;
    }

    return `${this.baseUrl}/chat.html?messageId=${messageId}${context}`;
  }

  /**
   * Handle direct links to messages from URL parameters
   */
  handleDirectMessageLinks() {
    const urlParams = new URLSearchParams(window.location.search);
    const messageId = urlParams.get('messageId');

    if (messageId) {
      // We have a direct message link
      const groupId = urlParams.get('groupId');
      const userId = urlParams.get('userId');

      // Load the appropriate context first
      if (groupId) {
        this.loadGroupContext(groupId, messageId);
      } else if (userId) {
        this.loadUserContext(userId, messageId);
      } else {
        // Just try to find the message in the current context
        setTimeout(() => {
          this.highlightLinkedMessage(messageId);
        }, 1000); // Wait for messages to load
      }
    }
  }

  /**
   * Load group context for a direct message link
   * @param {string} groupId - The ID of the group
   * @param {string} messageId - The ID of the message to highlight
   */
  loadGroupContext(groupId, messageId) {
    // Request group information
    this.socket.emit('getGroupById', { groupId }, (response) => {
      if (response && response.success) {
        const group = response.group;

        // Select the group (assuming the group selection function exists)
        if (typeof selectGroup === 'function') {
          selectGroup(group);

          // Wait for messages to load then highlight the target message
          setTimeout(() => {
            this.highlightLinkedMessage(messageId);
          }, 1000);
        } else {
          console.error('selectGroup function not available');
        }
      } else {
        showNotification('Could not load the group for this message', 'error');
      }
    });
  }

  /**
   * Load user context for a direct message link
   * @param {string} userId - The ID of the user
   * @param {string} messageId - The ID of the message to highlight
   */
  loadUserContext(userId, messageId) {
    // Request user information
    this.socket.emit('getUserById', { userId }, (response) => {
      if (response && response.success) {
        const user = response.user;

        // Select the user (assuming the selectUser function exists)
        if (typeof selectUser === 'function') {
          selectUser(user);

          // Wait for messages to load then highlight the target message
          setTimeout(() => {
            this.highlightLinkedMessage(messageId);
          }, 1000);
        } else {
          console.error('selectUser function not available');
        }
      } else {
        showNotification('Could not load the user for this message', 'error');
      }
    });
  }

  /**
   * Highlight a message that was linked directly
   * @param {string} messageId - The ID of the message to highlight
   */
  highlightLinkedMessage(messageId) {
    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);

    if (messageElement) {
      // Scroll to the message
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add a highlight effect
      messageElement.classList.add('highlight-linked-message');

      // Remove the highlight after a few seconds
      setTimeout(() => {
        messageElement.classList.remove('highlight-linked-message');
      }, 5000);

      showNotification('Viewing shared message', 'info');
    } else {
      showNotification('Could not find the shared message', 'error');
    }
  }

  /**
   * Load recipients for message sharing
   * @param {string} messageId - The ID of the message being shared
   * @param {HTMLElement} dialogElement - The share dialog element
   */
  loadShareRecipients(messageId, dialogElement) {
    const recipientsContainer = dialogElement.querySelector('#share-recipients');
    if (!recipientsContainer) return;

    // Request contacts from server
    this.socket.emit('getContacts', {}, (response) => {
      if (response && response.error) {
        recipientsContainer.innerHTML = `<div class="share-error">Error loading contacts: ${response.error}</div>`;
        return;
      }

      const { users, groups } = response;

      // Container for the selected recipients
      const selectedRecipients = {
        users: [],
        groups: []
      };

      // Update share button state
      const updateShareButton = () => {
        const shareButton = dialogElement.querySelector('.share-send-btn');
        if (shareButton) {
          const hasRecipients = selectedRecipients.users.length > 0 || selectedRecipients.groups.length > 0;
          shareButton.disabled = !hasRecipients;
        }
      };

      // Clear loading indicator
      recipientsContainer.innerHTML = '';

      const container = document.createElement('div');

      // Add users section
      if (users && users.length > 0) {
        const usersSection = document.createElement('div');
        usersSection.className = 'share-section';
        usersSection.innerHTML = '<h5>Users</h5>';

        const usersList = document.createElement('div');
        usersList.className = 'share-list';

        users.forEach(user => {
          // Skip current user
          if (user._id === window.currentUser._id) return;

          const userItem = document.createElement('div');
          userItem.className = 'share-item';
          userItem.dataset.userId = user._id;

          userItem.innerHTML = `
            <div class="share-item-avatar">
              <img src="${user.profilePicture || '/uploads/default-avatar.png'}" alt="${user.username}">
            </div>
            <div class="share-item-info">
              <div class="share-name">${user.username}</div>
              <div class="share-status">${user.status || 'offline'}</div>
            </div>
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

            updateShareButton();
          });

          usersList.appendChild(userItem);
        });

        usersSection.appendChild(usersList);
        container.appendChild(usersSection);
      }

      // Add groups section
      if (groups && groups.length > 0) {
        const groupsSection = document.createElement('div');
        groupsSection.className = 'share-section';
        groupsSection.innerHTML = '<h5>Groups</h5>';

        const groupsList = document.createElement('div');
        groupsList.className = 'share-list';

        groups.forEach(group => {
          const groupItem = document.createElement('div');
          groupItem.className = 'share-item';
          groupItem.dataset.groupId = group._id;

          groupItem.innerHTML = `
            <div class="share-item-avatar">
              <img src="${group.avatar || '/uploads/default-group.png'}" alt="${group.name}">
            </div>
            <div class="share-item-info">
              <div class="share-name">${group.name}</div>
              <div class="share-members">${group.members.length} members</div>
            </div>
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

            updateShareButton();
          });

          groupsList.appendChild(groupItem);
        });

        groupsSection.appendChild(groupsList);
        container.appendChild(groupsSection);
      }

      recipientsContainer.appendChild(container);

      // Store selected recipients for sharing
      dialogElement.selectedRecipients = selectedRecipients;

      // Update share button initial state
      updateShareButton();

      // If no contacts found
      if ((!users || users.length === 0) && (!groups || groups.length === 0)) {
        recipientsContainer.innerHTML = '<div class="share-empty">No contacts found to share with</div>';
      }
    });
  }

  /**
   * Filter share recipients by search term
   * @param {string} searchTerm - The search term
   * @param {HTMLElement} dialogElement - The share dialog element
   */
  filterShareRecipients(searchTerm, dialogElement) {
    const searchLower = searchTerm.toLowerCase();
    const items = dialogElement.querySelectorAll('.share-item');

    items.forEach(item => {
      const name = item.querySelector('.share-name').textContent.toLowerCase();
      if (name.includes(searchLower) || searchTerm === '') {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });

    // Show/hide sections based on visible items
    const sections = dialogElement.querySelectorAll('.share-section');
    sections.forEach(section => {
      const visibleItems = section.querySelectorAll('.share-item[style=""]').length;
      if (visibleItems === 0) {
        section.style.display = 'none';
      } else {
        section.style.display = '';
      }
    });
  }

  /**
   * Share a message to selected recipients
   * @param {string} messageId - The ID of the message being shared
   * @param {HTMLElement} dialogElement - The share dialog element
   */
  shareMessageToRecipients(messageId, dialogElement) {
    const selectedRecipients = dialogElement.selectedRecipients;

    if (!selectedRecipients ||
        (selectedRecipients.users.length === 0 && selectedRecipients.groups.length === 0)) {
      showNotification('Please select at least one recipient', 'warning');
      return;
    }

    // Request the original message content
    this.socket.emit('getMessageById', { messageId }, (response) => {
      if (response && response.error) {
        showNotification('Failed to share message: ' + response.error, 'error');
        return;
      }

      const originalMessage = response.message;
      if (!originalMessage) {
        showNotification('Message not found', 'error');
        return;
      }

      // Generate share link
      const shareLink = this.generateMessageLink(messageId);

      // Create share content with link
      const shareContent = `Shared message: ${shareLink}`;

      // Share to each selected user
      selectedRecipients.users.forEach(userId => {
        this.socket.emit('sendPrivateMessage', {
          recipientId: userId,
          content: shareContent
        });
      });

      // Share to each selected group
      selectedRecipients.groups.forEach(groupId => {
        this.socket.emit('sendGroupMessage', {
          groupId,
          content: shareContent
        });
      });

      // Show success notification
      showNotification('Message shared successfully', 'success');

      // Close dialog
      dialogElement.remove();
    });
  }

  /**
   * Enhance the createMessageElement function to handle shared message links
   * @param {Function} originalCreateMessageElement - The original createMessageElement function
   * @returns {Function} Enhanced function with share link handling
   */
  enhanceCreateMessageElement(originalCreateMessageElement) {
    return (message, isCurrentUser) => {
      // Call the original function to create the base message element
      const messageElement = originalCreateMessageElement(message, isCurrentUser);

      // Add share button to message actions
      const messageActions = messageElement.querySelector('.message-actions');
      if (messageActions) {
        const shareButton = document.createElement('button');
        shareButton.className = 'message-action-btn message-share-btn';
        shareButton.title = 'Share this message';
        shareButton.innerHTML = '<i class="fas fa-share-alt"></i>';

        // Add share button to message actions
        messageActions.appendChild(shareButton);
      }

      // If the message content contains a shared message link, make it clickable
      if (message.content) {
        const messageContent = messageElement.querySelector('.message-content p');
        if (messageContent) {
          // Check for shared message links
          const linkPattern = new RegExp(`Shared message: (${window.location.origin}/chat\\.html\\?messageId=[a-f0-9]+(&groupId=[a-f0-9]+|&userId=[a-f0-9]+)?)`, 'i');
          const match = message.content.match(linkPattern);

          if (match) {
            // Extract the link
            const link = match[1];

            // Replace the text with a clickable link
            messageContent.innerHTML = message.content.replace(
              linkPattern,
              `Shared message: <a href="${link}" class="shared-message-link" target="_blank">View shared message</a>`
            );

            // Add click handler to handle navigation
            const sharedLinks = messageContent.querySelectorAll('.shared-message-link');
            sharedLinks.forEach(sharedLink => {
              sharedLink.addEventListener('click', (e) => {
                e.preventDefault();

                // Extract messageId from URL
                const url = new URL(sharedLink.href);
                const params = new URLSearchParams(url.search);
                const messageId = params.get('messageId');
                const groupId = params.get('groupId');
                const userId = params.get('userId');

                // Handle the link based on context
                if (groupId) {
                  this.loadGroupContext(groupId, messageId);
                } else if (userId) {
                  this.loadUserContext(userId, messageId);
                } else {
                  this.highlightLinkedMessage(messageId);
                }
              });
            });
          }
        }
      }

      return messageElement;
    };
  }
}
