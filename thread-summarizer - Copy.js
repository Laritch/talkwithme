/**
 * Thread Summarization System
 *
 * This module provides functionality for:
 * - Summarizing long conversation threads using AI
 * - Displaying concise overviews of complex discussions
 * - Extracting key points from multi-message exchanges
 */

class ThreadSummarizer {
  constructor(socket) {
    this.socket = socket;
    this.apiEndpoint = '/api/thread-summarize';
    this.summaryCache = new Map(); // Cache summaries to avoid redundant API calls

    // Initialize the module
    this.init();
  }

  /**
   * Initialize the thread summarizer
   */
  init() {
    if (!this.socket) {
      console.error('Socket not available for thread summarization');
      return;
    }

    // Set up event delegation for summarization-related actions
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for thread summarization
   */
  setupEventListeners() {
    // Use event delegation for summary request buttons
    document.addEventListener('click', (event) => {
      // Handle summarize button clicks
      if (event.target.closest('.thread-summarize-btn')) {
        const threadView = event.target.closest('.thread-view');
        const summaryBtn = event.target.closest('.thread-summarize-btn');

        if (threadView && !summaryBtn.classList.contains('loading')) {
          const parentId = threadView.dataset.parentId;
          if (parentId) {
            this.summarizeThread(parentId, threadView, summaryBtn);
          }
        }
      }

      // Handle toggle summary visibility
      else if (event.target.closest('.thread-summary-toggle')) {
        const summary = event.target.closest('.thread-summary-container');
        if (summary) {
          summary.classList.toggle('expanded');
          const toggle = summary.querySelector('.thread-summary-toggle');

          if (summary.classList.contains('expanded')) {
            toggle.innerHTML = 'Show less <i class="fas fa-chevron-up"></i>';
          } else {
            toggle.innerHTML = 'Show more <i class="fas fa-chevron-down"></i>';
          }
        }
      }
    });
  }

  /**
   * Summarize a thread
   * @param {string} threadParentId - The ID of the parent message
   * @param {HTMLElement} threadViewElement - The thread view element
   * @param {HTMLElement} summaryBtn - The summary button element
   */
  async summarizeThread(threadParentId, threadViewElement, summaryBtn) {
    // Check if we already have a cached summary
    if (this.summaryCache.has(threadParentId)) {
      this.displaySummary(threadViewElement, this.summaryCache.get(threadParentId));
      return;
    }

    // Show loading state
    summaryBtn.classList.add('loading');
    summaryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Summarizing...';

    try {
      // Collect all messages in the thread
      const messages = this.collectThreadMessages(threadViewElement);

      if (messages.length < 3) {
        summaryBtn.classList.remove('loading');
        summaryBtn.innerHTML = '<i class="fas fa-magic"></i> Summarize';
        showNotification('Thread is too short to summarize', 'info');
        return;
      }

      // Request summary from server
      const summary = await this.requestSummary(threadParentId, messages);

      // Cache the summary for future use
      this.summaryCache.set(threadParentId, summary);

      // Display the summary
      this.displaySummary(threadViewElement, summary);
    } catch (error) {
      console.error('Error summarizing thread:', error);
      showNotification('Failed to summarize thread', 'error');
    } finally {
      // Reset button state
      summaryBtn.classList.remove('loading');
      summaryBtn.innerHTML = '<i class="fas fa-magic"></i> Summarize';
    }
  }

  /**
   * Collect all messages in a thread for summarization
   * @param {HTMLElement} threadViewElement - The thread view element
   * @returns {Array} Array of message objects with sender and content
   */
  collectThreadMessages(threadViewElement) {
    const messages = [];

    // Get the parent message (outside the thread view)
    const parentId = threadViewElement.dataset.parentId;
    const parentMessage = document.querySelector(`.message[data-message-id="${parentId}"]`);

    if (parentMessage) {
      const sender = parentMessage.querySelector('.message-sender').textContent.trim();
      const contentEl = parentMessage.querySelector('.message-content p');

      if (contentEl) {
        messages.push({
          sender,
          content: contentEl.textContent.trim(),
          isParent: true
        });
      }
    }

    // Get all reply messages in the thread view
    const replyElements = threadViewElement.querySelectorAll('.message');

    replyElements.forEach(reply => {
      const sender = reply.querySelector('.message-sender').textContent.trim();
      const contentEl = reply.querySelector('.message-content p');

      if (contentEl) {
        messages.push({
          sender,
          content: contentEl.textContent.trim(),
          isParent: false
        });
      }
    });

    return messages;
  }

  /**
   * Request a summary from the server
   * @param {string} threadId - The ID of the thread
   * @param {Array} messages - Array of message objects to summarize
   * @returns {Object} The summary data
   */
  async requestSummary(threadId, messages) {
    try {
      // Create a promise to handle the socket response
      return new Promise((resolve, reject) => {
        this.socket.emit('summarizeThread', { threadId, messages }, (response) => {
          if (response && response.success) {
            resolve(response.summary);
          } else {
            reject(new Error(response?.error || 'Failed to generate summary'));
          }
        });

        // Set a timeout in case the server doesn't respond
        setTimeout(() => {
          reject(new Error('Request timed out'));
        }, 15000); // 15 seconds timeout
      });
    } catch (error) {
      console.error('Error requesting summary:', error);
      throw error;
    }
  }

  /**
   * Display a thread summary in the UI
   * @param {HTMLElement} threadViewElement - The thread view element
   * @param {Object} summary - The summary data
   */
  displaySummary(threadViewElement, summary) {
    // Check if summary already exists
    let summaryContainer = threadViewElement.querySelector('.thread-summary-container');

    if (!summaryContainer) {
      // Create new summary container
      summaryContainer = document.createElement('div');
      summaryContainer.className = 'thread-summary-container';

      // Insert at the top of the thread view, after the heading
      const heading = threadViewElement.querySelector('.thread-heading');
      if (heading) {
        heading.after(summaryContainer);
      } else {
        threadViewElement.prepend(summaryContainer);
      }
    }

    // Get summary content
    const { mainPoints, keyTakeaways, participants } = summary;

    // Create the summary HTML
    let summaryHtml = `
      <div class="thread-summary-header">
        <div class="summary-title">
          <i class="fas fa-robot"></i> AI Summary
        </div>
        <div class="summary-participants">
          ${participants} participated
        </div>
      </div>
      <div class="thread-summary-content">
        <div class="summary-main-points">
          <h4>Main Points</h4>
          <p>${mainPoints}</p>
        </div>
    `;

    // Add key takeaways if available
    if (keyTakeaways && keyTakeaways.length > 0) {
      summaryHtml += `
        <div class="summary-takeaways">
          <h4>Key Takeaways</h4>
          <ul>
      `;

      keyTakeaways.forEach(point => {
        summaryHtml += `<li>${point}</li>`;
      });

      summaryHtml += `
          </ul>
        </div>
      `;
    }

    summaryHtml += `</div>
      <button class="thread-summary-toggle">Show more <i class="fas fa-chevron-down"></i></button>
    `;

    // Set the content
    summaryContainer.innerHTML = summaryHtml;

    // Animate the summary appearance
    summaryContainer.style.opacity = '0';
    summaryContainer.style.transform = 'translateY(-10px)';

    setTimeout(() => {
      summaryContainer.style.opacity = '1';
      summaryContainer.style.transform = 'translateY(0)';
    }, 10);
  }

  /**
   * Enhance the thread view with summarization capability
   * @param {HTMLElement} threadView - The thread view to enhance
   */
  enhanceThreadView(threadView) {
    // Check if there's already a summarize button
    if (threadView.querySelector('.thread-summarize-btn')) {
      return;
    }

    // Get the heading element
    const heading = threadView.querySelector('.thread-heading');
    if (!heading) return;

    // Create summarize button
    const summarizeBtn = document.createElement('button');
    summarizeBtn.className = 'thread-summarize-btn';
    summarizeBtn.innerHTML = '<i class="fas fa-magic"></i> Summarize';
    summarizeBtn.title = 'Generate an AI summary of this thread';

    // Add the button to the heading
    heading.appendChild(summarizeBtn);
  }
}
