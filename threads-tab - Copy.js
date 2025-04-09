/**
 * Threads Tab System
 *
 * This module provides functionality for:
 * - Displaying a centralized view of all conversation threads
 * - Allowing quick navigation between active discussions
 * - Tracking and organizing threads across different chats
 */

class ThreadsTab {
  constructor(socket) {
    this.socket = socket;
    this.activeThreads = new Map(); // Map of threadId -> thread data
    this.isThreadsLoaded = false;

    // Initialize the module
    this.init();
  }

  /**
   * Initialize the threads tab
   */
  init() {
    if (!this.socket) {
      console.error('Socket not available for threads tab');
      return;
    }

    // Set up the threads tab UI
    this.createThreadsTab();

    // Set up event listeners
    this.setupEventListeners();

    // Set up socket listeners for thread updates
    this.setupSocketListeners();
  }

  /**
   * Create the threads tab UI elements
   */
  createThreadsTab() {
    // Add the threads tab to the navigation
    const tabsContainer = document.querySelector('.tabs');

    if (!tabsContainer) return;

    // Check if threads tab already exists
    if (tabsContainer.querySelector('#threads-tab')) return;

    // Create threads tab
    const threadsTab = document.createElement('li');
    threadsTab.id = 'threads-tab';
    threadsTab.className = 'tab';
    threadsTab.innerHTML = '<i class="fas fa-comments"></i> Threads';

    // Add tab to container
    tabsContainer.appendChild(threadsTab);

    // Create threads section
    const contentArea = document.querySelector('.chat-content');

    if (!contentArea) return;

    // Check if threads section already exists
    if (document.getElementById('threads-section')) return;

    // Create threads section
    const threadsSection = document.createElement('div');
    threadsSection.id = 'threads-section';
    threadsSection.className = 'chat-section hidden';

    threadsSection.innerHTML = `
      <div class="section-header">
        <h2>Active Threads</h2>
        <div class="section-actions">
          <button class="refresh-threads-btn" title="Refresh threads">
            <i class="fas fa-sync-alt"></i>
          </button>
        </div>
      </div>
      <div class="threads-filters">
        <div class="filter-options">
          <button class="filter-btn active" data-filter="all">All</button>
          <button class="filter-btn" data-filter="direct">Direct Messages</button>
          <button class="filter-btn" data-filter="group">Group Chats</button>
        </div>
        <div class="threads-search">
          <input type="text" placeholder="Search threads..." id="threads-search-input">
          <i class="fas fa-search"></i>
        </div>
      </div>
      <div class="threads-list-container">
        <div class="threads-list" id="threads-list">
          <div class="threads-loading">
            <i class="fas fa-spinner fa-spin"></i> Loading threads...
          </div>
        </div>
      </div>
    `;

    // Add section to content area
    contentArea.appendChild(threadsSection);
  }

  /**
   * Set up event listeners for threads tab
   */
  setupEventListeners() {
    // Handle threads tab click
    const threadsTab = document.getElementById('threads-tab');

    if (threadsTab) {
      threadsTab.addEventListener('click', () => {
        this.showThreadsTab();
      });
    }

    // Handle refresh button click
    const refreshBtn = document.querySelector('.refresh-threads-btn');

    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadThreads();
      });
    }

    // Handle filter buttons
    const filterBtns = document.querySelectorAll('.filter-btn');

    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active filter
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Apply filter
        this.filterThreads(btn.dataset.filter);
      });
    });

    // Handle search input
    const searchInput = document.getElementById('threads-search-input');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        this.searchThreads(searchInput.value);
      });
    }
  }

  /**
   * Set up socket listeners for thread updates
   */
  setupSocketListeners() {
    // Listen for new replies to threads
    this.socket.on('newReply', (data) => {
      this.updateThreadData(data.threadParentId, data);
    });

    // Listen for thread count updates
    this.socket.on('threadUpdated', (data) => {
      this.updateThreadCount(data.messageId, data.count);
    });

    // Listen for threads data
    this.socket.on('threadsList', (data) => {
      this.displayThreads(data.threads);
    });
  }

  /**
   * Show the threads tab and load threads if needed
   */
  showThreadsTab() {
    // Hide all other sections
    document.querySelectorAll('.chat-section').forEach(section => {
      section.classList.add('hidden');
    });

    // Show threads section
    const threadsSection = document.getElementById('threads-section');
    if (threadsSection) {
      threadsSection.classList.remove('hidden');
    }

    // Load threads if not already loaded
    if (!this.isThreadsLoaded) {
      this.loadThreads();
    }
  }

  /**
   * Load all threads from the server
   */
  loadThreads() {
    const threadsList = document.getElementById('threads-list');

    if (!threadsList) return;

    // Show loading indicator
    threadsList.innerHTML = `
      <div class="threads-loading">
        <i class="fas fa-spinner fa-spin"></i> Loading threads...
      </div>
    `;

    // Request threads from server
    this.socket.emit('getThreads', {}, (response) => {
      if (response && response.error) {
        threadsList.innerHTML = `
          <div class="threads-error">
            Error loading threads: ${response.error}
          </div>
        `;
        return;
      }

      this.isThreadsLoaded = true;

      if (!response.threads || response.threads.length === 0) {
        threadsList.innerHTML = `
          <div class="threads-empty">
            No active threads found
          </div>
        `;
        return;
      }

      // Process and display threads
      this.displayThreads(response.threads);
    });
  }

  /**
   * Display threads in the UI
   * @param {Array} threads - Array of thread data objects
   */
  displayThreads(threads) {
    const threadsList = document.getElementById('threads-list');

    if (!threadsList) return;

    // Clear current list
    threadsList.innerHTML = '';

    // Update our local threads storage
    threads.forEach(thread => {
      this.activeThreads.set(thread.parentId, thread);
    });

    // Sort threads by last activity (most recent first)
    const sortedThreads = [...this.activeThreads.values()].sort((a, b) => {
      return new Date(b.lastActivity) - new Date(a.lastActivity);
    });

    // Display each thread
    sortedThreads.forEach(thread => {
      const threadItem = this.createThreadListItem(thread);
      threadsList.appendChild(threadItem);
    });
  }

  /**
   * Create a thread list item element
   * @param {Object} thread - Thread data object
   * @returns {HTMLElement} The thread list item element
   */
  createThreadListItem(thread) {
    const threadItem = document.createElement('div');
    threadItem.className = 'thread-item';
    threadItem.dataset.threadId = thread.parentId;
    threadItem.dataset.type = thread.isGroupThread ? 'group' : 'direct';

    // Format the timestamp
    const timeAgo = this.formatTimeAgo(new Date(thread.lastActivity));

    // Create the content
    threadItem.innerHTML = `
      <div class="thread-item-avatar">
        <img src="${thread.avatarUrl || '/uploads/default-avatar.png'}" alt="">
      </div>
      <div class="thread-item-content">
        <div class="thread-item-header">
          <div class="thread-item-title">${thread.title}</div>
          <div class="thread-item-time">${timeAgo}</div>
        </div>
        <div class="thread-item-snippet">${thread.snippet}</div>
        <div class="thread-item-meta">
          <span class="thread-replies-count">
            <i class="fas fa-comment-dots"></i> ${thread.replyCount} ${thread.replyCount === 1 ? 'reply' : 'replies'}
          </span>
          <span class="thread-participants">
            <i class="fas fa-users"></i> ${thread.participantCount} participants
          </span>
        </div>
      </div>
    `;

    // Add click handler to navigate to the thread
    threadItem.addEventListener('click', () => {
      this.navigateToThread(thread);
    });

    return threadItem;
  }

  /**
   * Update thread data when new activity occurs
   * @param {string} threadId - The thread parent ID
   * @param {Object} data - New thread data
   */
  updateThreadData(threadId, data) {
    const thread = this.activeThreads.get(threadId);

    if (thread) {
      // Update thread data
      thread.lastActivity = new Date();
      thread.replyCount = data.threadCount || thread.replyCount + 1;

      if (data.message && data.message.content) {
        thread.snippet = data.message.content.length > 80
          ? data.message.content.substring(0, 80) + '...'
          : data.message.content;
      }

      // If threads tab is currently visible, update the display
      if (!document.getElementById('threads-section').classList.contains('hidden')) {
        this.displayThreads([...this.activeThreads.values()]);
      }
    }
  }

  /**
   * Update thread count for a specific thread
   * @param {string} threadId - The thread parent ID
   * @param {number} count - The new reply count
   */
  updateThreadCount(threadId, count) {
    const thread = this.activeThreads.get(threadId);

    if (thread) {
      thread.replyCount = count;

      // Update UI if needed
      const threadItem = document.querySelector(`.thread-item[data-thread-id="${threadId}"]`);

      if (threadItem) {
        const countElement = threadItem.querySelector('.thread-replies-count');

        if (countElement) {
          countElement.innerHTML = `
            <i class="fas fa-comment-dots"></i> ${count} ${count === 1 ? 'reply' : 'replies'}
          `;
        }
      }
    }
  }

  /**
   * Filter threads by type
   * @param {string} filter - The filter type ('all', 'direct', or 'group')
   */
  filterThreads(filter) {
    const threadItems = document.querySelectorAll('.thread-item');

    threadItems.forEach(item => {
      if (filter === 'all' || item.dataset.type === filter) {
        item.style.display = '';
      } else {
        item.style.display = 'none';
      }
    });

    // Show empty message if no visible threads
    const visibleThreads = document.querySelectorAll('.thread-item[style=""]').length;

    const threadsEmpty = document.querySelector('.threads-empty');
    const noThreadsElement = document.querySelector('.no-threads-match');

    if (visibleThreads === 0) {
      if (threadsEmpty) {
        // Already showing the empty message
        return;
      }

      if (noThreadsElement) {
        noThreadsElement.style.display = '';
        return;
      }

      // Create empty message
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'no-threads-match';
      emptyMessage.innerHTML = `No ${filter === 'all' ? '' : filter} threads found`;

      const threadsList = document.getElementById('threads-list');
      if (threadsList) {
        threadsList.appendChild(emptyMessage);
      }
    } else {
      // Hide empty message if it exists
      if (noThreadsElement) {
        noThreadsElement.style.display = 'none';
      }
    }
  }

  /**
   * Search threads by keyword
   * @param {string} query - The search query
   */
  searchThreads(query) {
    const threadItems = document.querySelectorAll('.thread-item');
    const searchLower = query.toLowerCase();

    threadItems.forEach(item => {
      // Get the title and snippet
      const title = item.querySelector('.thread-item-title').textContent.toLowerCase();
      const snippet = item.querySelector('.thread-item-snippet').textContent.toLowerCase();

      // Check if the thread matches the search
      if (title.includes(searchLower) || snippet.includes(searchLower) || query === '') {
        // Show the thread if it passes the current filter
        const currentFilter = document.querySelector('.filter-btn.active').dataset.filter;

        if (currentFilter === 'all' || item.dataset.type === currentFilter) {
          item.style.display = '';
        }
      } else {
        // Hide the thread
        item.style.display = 'none';
      }
    });

    // Show empty message if no visible threads
    const visibleThreads = document.querySelectorAll('.thread-item[style=""]').length;

    const threadsEmpty = document.querySelector('.threads-empty');
    const noThreadsElement = document.querySelector('.no-threads-match');

    if (visibleThreads === 0) {
      if (threadsEmpty) {
        // Already showing the empty message
        return;
      }

      if (noThreadsElement) {
        noThreadsElement.style.display = '';
        return;
      }

      // Create empty message
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'no-threads-match';
      emptyMessage.innerHTML = 'No threads match your search';

      const threadsList = document.getElementById('threads-list');
      if (threadsList) {
        threadsList.appendChild(emptyMessage);
      }
    } else {
      // Hide empty message if it exists
      if (noThreadsElement) {
        noThreadsElement.style.display = 'none';
      }
    }
  }

  /**
   * Navigate to a specific thread
   * @param {Object} thread - Thread data object
   */
  navigateToThread(thread) {
    // Determine context (group or direct message)
    if (thread.isGroupThread) {
      // Navigate to group chat
      this.socket.emit('getGroupById', { groupId: thread.contextId }, (response) => {
        if (response && response.success) {
          const group = response.group;

          // Select the group (assuming the group selection function exists)
          if (typeof selectGroup === 'function') {
            selectGroup(group);

            // Navigate to the thread parent message and expand it
            setTimeout(() => {
              const parentMessage = document.querySelector(`.message[data-message-id="${thread.parentId}"]`);

              if (parentMessage) {
                parentMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Highlight the parent message
                parentMessage.classList.add('highlight-thread');
                setTimeout(() => {
                  parentMessage.classList.remove('highlight-thread');
                }, 2000);

                // Toggle thread view if it exists
                const threadCount = parentMessage.querySelector('.thread-count');
                if (threadCount) {
                  // Only expand if thread is collapsed
                  const existingThreadView = document.querySelector(`.thread-view[data-parent-id="${thread.parentId}"]`);
                  if (!existingThreadView || existingThreadView.classList.contains('hidden')) {
                    threadCount.click();
                  }
                }
              }
            }, 500);
          }
        } else {
          showNotification('Could not load the group for this thread', 'error');
        }
      });
    } else {
      // Navigate to direct message chat
      this.socket.emit('getUserById', { userId: thread.contextId }, (response) => {
        if (response && response.success) {
          const user = response.user;

          // Select the user (assuming the selectUser function exists)
          if (typeof selectUser === 'function') {
            selectUser(user);

            // Navigate to the thread parent message and expand it
            setTimeout(() => {
              const parentMessage = document.querySelector(`.message[data-message-id="${thread.parentId}"]`);

              if (parentMessage) {
                parentMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Highlight the parent message
                parentMessage.classList.add('highlight-thread');
                setTimeout(() => {
                  parentMessage.classList.remove('highlight-thread');
                }, 2000);

                // Toggle thread view if it exists
                const threadCount = parentMessage.querySelector('.thread-count');
                if (threadCount) {
                  // Only expand if thread is collapsed
                  const existingThreadView = document.querySelector(`.thread-view[data-parent-id="${thread.parentId}"]`);
                  if (!existingThreadView || existingThreadView.classList.contains('hidden')) {
                    threadCount.click();
                  }
                }
              }
            }, 500);
          }
        } else {
          showNotification('Could not load the user for this thread', 'error');
        }
      });
    }
  }

  /**
   * Format timestamp as time ago string
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
}
