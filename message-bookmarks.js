/**
 * Message Bookmarks System
 *
 * This module provides functionality for:
 * - Bookmarking important messages for quick reference
 * - Managing a list of bookmarked messages
 * - Navigating to bookmarked messages across chats
 */

class MessageBookmarks {
  constructor(socket) {
    this.socket = socket;
    this.bookmarks = [];
    this.localStorageKey = 'chat_bookmarks';

    // Initialize the module
    this.init();
  }

  /**
   * Initialize the bookmarks module
   */
  init() {
    if (!this.socket) {
      console.error('Socket not available for message bookmarks');
      return;
    }

    // Load bookmarks from storage
    this.loadBookmarks();

    // Set up event delegation for bookmark-related actions
    this.setupEventListeners();

    // Set up socket event listeners
    this.setupSocketListeners();

    // Create the bookmarks panel
    this.createBookmarksPanel();
  }

  /**
   * Set up event listeners for bookmark actions
   */
  setupEventListeners() {
    // Use event delegation to handle bookmark button clicks
    document.addEventListener('click', (event) => {
      // Handle bookmark button click
      if (event.target.closest('.message-bookmark-btn')) {
        const messageElement = event.target.closest('.message');
        if (messageElement) {
          this.toggleBookmark(messageElement);
        }
      }

      // Handle toggle bookmarks panel button
      else if (event.target.closest('#bookmarks-btn')) {
        this.toggleBookmarksPanel();
      }

      // Handle remove bookmark button
      else if (event.target.closest('.remove-bookmark-btn')) {
        const bookmarkItem = event.target.closest('.bookmark-item');
        if (bookmarkItem) {
          const messageId = bookmarkItem.dataset.messageId;
          this.removeBookmark(messageId);
        }
      }

      // Handle goto bookmark button
      else if (event.target.closest('.goto-bookmark-btn')) {
        const bookmarkItem = event.target.closest('.bookmark-item');
        if (bookmarkItem) {
          const messageId = bookmarkItem.dataset.messageId;
          this.navigateToBookmark(messageId);
        }
      }
    });
  }

  /**
   * Set up socket event listeners
   */
  setupSocketListeners() {
    // Listen for removed messages to update bookmarks accordingly
    this.socket.on('messageDeleted', (data) => {
      const { messageId } = data;
      this.removeBookmark(messageId);
    });
  }

  /**
   * Create the bookmarks panel UI
   */
  createBookmarksPanel() {
    // Check if panel already exists
    if (document.getElementById('bookmarks-panel')) return;

    // Create the toggle button in the header
    const header = document.querySelector('.header');
    if (header) {
      const bookmarksBtn = document.createElement('button');
      bookmarksBtn.id = 'bookmarks-btn';
      bookmarksBtn.className = 'header-btn';
      bookmarksBtn.innerHTML = '<i class="fas fa-bookmark"></i>';
      bookmarksBtn.title = 'Bookmarks';

      // Add notification count if there are bookmarks
      if (this.bookmarks.length > 0) {
        bookmarksBtn.innerHTML += `<span class="bookmark-count">${this.bookmarks.length}</span>`;
      }

      // Add to header
      const userMenu = header.querySelector('.user-menu');
      if (userMenu) {
        userMenu.insertBefore(bookmarksBtn, userMenu.firstChild);
      }
    }

    // Create the bookmarks panel
    const bookmarksPanel = document.createElement('div');
    bookmarksPanel.id = 'bookmarks-panel';
    bookmarksPanel.className = 'side-panel hidden';

    bookmarksPanel.innerHTML = `
      <div class="panel-header">
        <h3>Bookmarks</h3>
        <button class="close-panel-btn"><i class="fas fa-times"></i></button>
      </div>
      <div class="panel-search">
        <input type="text" placeholder="Search bookmarks..." id="bookmark-search">
        <i class="fas fa-search"></i>
      </div>
      <div class="panel-content">
        <div class="bookmarks-list" id="bookmarks-list"></div>
      </div>
    `;

    // Add to body
    document.body.appendChild(bookmarksPanel);

    // Add event listeners for panel interaction
    const closeBtn = bookmarksPanel.querySelector('.close-panel-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        bookmarksPanel.classList.add('hidden');
      });
    }

    const searchInput = bookmarksPanel.querySelector('#bookmark-search');
    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.filterBookmarks(searchInput.value);
      });
    }

    // Populate bookmarks list
    this.updateBookmarksList();
  }

  /**
   * Load bookmarks from local storage
   */
  loadBookmarks() {
    try {
      const storedBookmarks = localStorage.getItem(this.localStorageKey);
      if (storedBookmarks) {
        this.bookmarks = JSON.parse(storedBookmarks);
      }
    } catch (error) {
      console.error('Error loading bookmarks from storage:', error);
      this.bookmarks = [];
    }
  }

  /**
   * Save bookmarks to local storage
   */
  saveBookmarks() {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.bookmarks));

      // Update bookmark count on button
      const bookmarksBtn = document.getElementById('bookmarks-btn');
      if (bookmarksBtn) {
        let countElement = bookmarksBtn.querySelector('.bookmark-count');

        if (this.bookmarks.length > 0) {
          if (!countElement) {
            countElement = document.createElement('span');
            countElement.className = 'bookmark-count';
            bookmarksBtn.appendChild(countElement);
          }
          countElement.textContent = this.bookmarks.length;
        } else if (countElement) {
          countElement.remove();
        }
      }
    } catch (error) {
      console.error('Error saving bookmarks to storage:', error);
    }
  }

  /**
   * Toggle bookmark for a message
   * @param {HTMLElement} messageElement - The message element to bookmark/unbookmark
   */
  toggleBookmark(messageElement) {
    const messageId = messageElement.dataset.messageId;
    const isBookmarked = messageElement.classList.contains('bookmarked');

    if (isBookmarked) {
      // Remove bookmark
      this.removeBookmark(messageId);
    } else {
      // Add bookmark
      this.addBookmark(messageElement);
    }
  }

  /**
   * Add a bookmark
   * @param {HTMLElement} messageElement - The message element to bookmark
   */
  addBookmark(messageElement) {
    const messageId = messageElement.dataset.messageId;

    // Check if already bookmarked
    if (this.bookmarks.some(bookmark => bookmark.messageId === messageId)) {
      return;
    }

    // Extract message data
    const sender = messageElement.querySelector('.message-sender').textContent.trim();
    const contentEl = messageElement.querySelector('.message-content p');
    const timeEl = messageElement.querySelector('.message-time');

    let content = '';
    if (contentEl) {
      content = contentEl.textContent.trim();
    }

    let timestamp = new Date().toISOString();
    if (timeEl) {
      // Try to parse the time, but use current time as fallback
      try {
        timestamp = new Date(timeEl.title || timeEl.textContent).toISOString();
      } catch (e) {
        console.error('Error parsing message time:', e);
      }
    }

    // Determine context (group or direct)
    const groupId = messageElement.dataset.groupId;
    const contextId = groupId || (messageElement.dataset.userId || '');
    const contextType = groupId ? 'group' : 'direct';

    // Create bookmark object
    const bookmark = {
      messageId,
      sender,
      content: content.length > 100 ? content.substring(0, 100) + '...' : content,
      timestamp,
      bookmarkedAt: new Date().toISOString(),
      contextId,
      contextType,
      labels: []
    };

    // Add to bookmarks array
    this.bookmarks.push(bookmark);

    // Save to storage
    this.saveBookmarks();

    // Mark message as bookmarked
    messageElement.classList.add('bookmarked');

    // Update bookmarks list
    this.updateBookmarksList();

    // Show notification
    showNotification('Message bookmarked', 'success');
  }

  /**
   * Remove a bookmark
   * @param {string} messageId - The ID of the message to unbookmark
   */
  removeBookmark(messageId) {
    // Find index of bookmark
    const index = this.bookmarks.findIndex(bookmark => bookmark.messageId === messageId);

    if (index === -1) return;

    // Remove from array
    this.bookmarks.splice(index, 1);

    // Save to storage
    this.saveBookmarks();

    // Remove bookmark class from message if it exists in DOM
    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (messageElement) {
      messageElement.classList.remove('bookmarked');
    }

    // Update bookmarks list
    this.updateBookmarksList();

    // Show notification
    showNotification('Bookmark removed', 'info');
  }

  /**
   * Update the bookmarks list UI
   */
  updateBookmarksList() {
    const bookmarksList = document.getElementById('bookmarks-list');
    if (!bookmarksList) return;

    // Clear current list
    bookmarksList.innerHTML = '';

    if (this.bookmarks.length === 0) {
      bookmarksList.innerHTML = '<div class="no-bookmarks">No bookmarks saved</div>';
      return;
    }

    // Sort bookmarks by bookmark time (newest first)
    const sortedBookmarks = [...this.bookmarks].sort((a, b) =>
      new Date(b.bookmarkedAt) - new Date(a.bookmarkedAt)
    );

    // Create bookmark items
    sortedBookmarks.forEach(bookmark => {
      const bookmarkItem = document.createElement('div');
      bookmarkItem.className = 'bookmark-item';
      bookmarkItem.dataset.messageId = bookmark.messageId;
      bookmarkItem.dataset.contextType = bookmark.contextType;
      bookmarkItem.dataset.contextId = bookmark.contextId;

      // Format time
      const bookmarkTime = this.formatTimeAgo(new Date(bookmark.bookmarkedAt));

      // Create item HTML
      bookmarkItem.innerHTML = `
        <div class="bookmark-content">
          <div class="bookmark-header">
            <div class="bookmark-sender">${bookmark.sender}</div>
            <div class="bookmark-time" title="${new Date(bookmark.timestamp).toLocaleString()}">
              ${bookmarkTime}
            </div>
          </div>
          <div class="bookmark-text">${bookmark.content}</div>
          <div class="bookmark-labels" id="labels-${bookmark.messageId}">
            ${bookmark.labels.map(label =>
              `<span class="bookmark-label" style="background-color: ${label.color}">${label.name}</span>`
            ).join('')}
          </div>
        </div>
        <div class="bookmark-actions">
          <button class="goto-bookmark-btn" title="Go to message">
            <i class="fas fa-arrow-right"></i>
          </button>
          <button class="remove-bookmark-btn" title="Remove bookmark">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      bookmarksList.appendChild(bookmarkItem);
    });
  }

  /**
   * Toggle the bookmarks panel visibility
   */
  toggleBookmarksPanel() {
    const bookmarksPanel = document.getElementById('bookmarks-panel');
    if (bookmarksPanel) {
      bookmarksPanel.classList.toggle('hidden');

      // Update list when opening panel
      if (!bookmarksPanel.classList.contains('hidden')) {
        this.updateBookmarksList();
      }
    }
  }

  /**
   * Navigate to a bookmarked message
   * @param {string} messageId - The ID of the bookmarked message
   */
  navigateToBookmark(messageId) {
    // Find the bookmark
    const bookmark = this.bookmarks.find(b => b.messageId === messageId);
    if (!bookmark) return;

    // Determine if we need to change context (switch to different chat)
    if (bookmark.contextType === 'group') {
      // Group context
      this.socket.emit('getGroupById', { groupId: bookmark.contextId }, (response) => {
        if (response && response.success) {
          // Select group
          if (typeof selectGroup === 'function') {
            selectGroup(response.group);

            // Wait for messages to load, then highlight the message
            setTimeout(() => {
              this.highlightMessage(messageId);
            }, 500);
          }
        } else {
          showNotification('Could not find the group for this bookmark', 'error');
        }
      });
    } else {
      // Direct message context
      this.socket.emit('getUserById', { userId: bookmark.contextId }, (response) => {
        if (response && response.success) {
          // Select user
          if (typeof selectUser === 'function') {
            selectUser(response.user);

            // Wait for messages to load, then highlight the message
            setTimeout(() => {
              this.highlightMessage(messageId);
            }, 500);
          }
        } else {
          showNotification('Could not find the user for this bookmark', 'error');
        }
      });
    }

    // Hide bookmarks panel
    const bookmarksPanel = document.getElementById('bookmarks-panel');
    if (bookmarksPanel) {
      bookmarksPanel.classList.add('hidden');
    }
  }

  /**
   * Highlight a message in the current view
   * @param {string} messageId - The ID of the message to highlight
   */
  highlightMessage(messageId) {
    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);

    if (messageElement) {
      // Scroll to message
      messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Add highlight effect
      messageElement.classList.add('highlight-bookmarked');
      setTimeout(() => {
        messageElement.classList.remove('highlight-bookmarked');
      }, 3000);
    } else {
      showNotification('Could not find the bookmarked message', 'error');
    }
  }

  /**
   * Filter bookmarks by search term
   * @param {string} query - The search query
   */
  filterBookmarks(query) {
    const bookmarkItems = document.querySelectorAll('.bookmark-item');
    const searchLower = query.toLowerCase();

    bookmarkItems.forEach(item => {
      const sender = item.querySelector('.bookmark-sender').textContent.toLowerCase();
      const content = item.querySelector('.bookmark-text').textContent.toLowerCase();

      if (sender.includes(searchLower) || content.includes(searchLower) || query === '') {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });

    // Show no results message if needed
    const bookmarksList = document.getElementById('bookmarks-list');
    const visibleItems = document.querySelectorAll('.bookmark-item[style=""]').length;

    if (visibleItems === 0 && bookmarksList) {
      const noResults = bookmarksList.querySelector('.no-results');

      if (!noResults) {
        const messageElement = document.createElement('div');
        messageElement.className = 'no-results';
        messageElement.textContent = 'No matching bookmarks found';
        bookmarksList.appendChild(messageElement);
      }
    } else {
      const noResults = bookmarksList?.querySelector('.no-results');
      if (noResults) {
        noResults.remove();
      }
    }
  }

  /**
   * Format a date as a relative time string
   * @param {Date} date - The date to format
   * @returns {string} Formatted time ago string
   */
  formatTimeAgo(date) {
    const now = new Date();
    const diff = Math.floor((now - date) / 1000); // Difference in seconds

    if (diff < 60) {
      return 'just now';
    } else if (diff < 3600) {
      const minutes = Math.floor(diff / 60);
      return `${minutes}m ago`;
    } else if (diff < 86400) {
      const hours = Math.floor(diff / 3600);
      return `${hours}h ago`;
    } else if (diff < 604800) {
      const days = Math.floor(diff / 86400);
      return `${days}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  /**
   * Add a label to a bookmarked message
   * @param {string} messageId - The ID of the bookmarked message
   * @param {string} labelName - The name of the label
   * @param {string} labelColor - The color of the label
   */
  addLabel(messageId, labelName, labelColor) {
    // Find the bookmark
    const bookmark = this.bookmarks.find(b => b.messageId === messageId);
    if (!bookmark) return;

    // Check if label already exists
    if (bookmark.labels.some(label => label.name === labelName)) {
      return;
    }

    // Add label
    bookmark.labels.push({
      name: labelName,
      color: labelColor
    });

    // Save bookmarks
    this.saveBookmarks();

    // Update UI
    this.updateBookmarksList();

    // Update specific label container if it exists
    const labelContainer = document.getElementById(`labels-${messageId}`);
    if (labelContainer) {
      const labelElement = document.createElement('span');
      labelElement.className = 'bookmark-label';
      labelElement.style.backgroundColor = labelColor;
      labelElement.textContent = labelName;
      labelContainer.appendChild(labelElement);
    }
  }

  /**
   * Enhance the createMessageElement function with bookmark support
   * @param {Function} originalCreateMessageElement - The original createMessageElement function
   * @returns {Function} Enhanced function with bookmark support
   */
  enhanceCreateMessageElement(originalCreateMessageElement) {
    return (message, isCurrentUser) => {
      // Call the original function to create the base message element
      const messageElement = originalCreateMessageElement(message, isCurrentUser);

      // Add bookmark button to message actions
      const messageActions = messageElement.querySelector('.message-actions');
      if (messageActions) {
        const bookmarkButton = document.createElement('button');
        bookmarkButton.className = 'message-action-btn message-bookmark-btn';
        bookmarkButton.title = 'Bookmark this message';
        bookmarkButton.innerHTML = '<i class="fas fa-bookmark"></i>';

        // Add bookmark button to message actions
        messageActions.appendChild(bookmarkButton);
      }

      // Check if message is already bookmarked
      if (this.bookmarks.some(bookmark => bookmark.messageId === message._id)) {
        messageElement.classList.add('bookmarked');
      }

      return messageElement;
    };
  }
}
