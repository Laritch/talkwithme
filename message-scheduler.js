/**
 * Message Scheduler Module
 *
 * This module provides functionality for:
 * - Scheduling messages to be sent at a specific time
 * - Managing scheduled messages
 * - Viewing scheduled messages
 * - Editing or canceling scheduled messages
 */

// Helper function to emit socket events with error handling
function emitWithErrorHandling(eventName, data, actionDescription) {
  try {
    socket.emit(eventName, data, (error) => {
      if (error) {
        console.error(`Error when trying to ${actionDescription}:`, error);
        showNotification(`Failed to ${actionDescription}: ${error.message}`, 'error');
      }
    });
  } catch (err) {
    console.error(`Exception when trying to ${actionDescription}:`, err);
    showNotification(`Failed to ${actionDescription}`, 'error');
  }
}

// Helper function to show notifications
function showNotification(message, type = 'info') {
  // Check if the notification system exists
  if (typeof window.showToast === 'function') {
    window.showToast(message, type);
    return;
  }

  // Create or get toast container
  let toastContainer = document.getElementById('toast-container');

  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  // Create toast
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  toastContainer.appendChild(toast);

  // Remove after animation completes
  setTimeout(() => {
    toast.remove();
  }, 3500);
}

class MessageScheduler {
  constructor(socket) {
    this.socket = socket;
    this.scheduledMessages = [];
    this.schedulerDialog = null;
    this.activeTimers = new Map(); // Map of message IDs to their timeout handles
    this.storageKey = 'chat_scheduled_messages';

    // Initialize the module
    this.init();
  }

  /**
   * Initialize the message scheduler
   */
  init() {
    if (!this.socket) {
      console.error('Socket not available for message scheduler');
      return;
    }

    // Create scheduler UI elements
    this.createSchedulerUI();

    // Load scheduled messages from storage
    this.loadScheduledMessages();

    // Setup event listeners
    this.setupEventListeners();

    // Start timers for scheduled messages
    this.startScheduledMessageTimers();

    // Check for pending messages on connect/reconnect
    this.setupConnectionHandlers();
  }

  /**
   * Create necessary UI elements for the scheduler
   */
  createSchedulerUI() {
    // Create scheduler button for input area
    this.addScheduleButton();

    // Create scheduler dialog
    this.createSchedulerDialog();

    // Add a scheduled messages tab/section to the sidebar
    this.addScheduledMessagesTab();
  }

  /**
   * Add schedule button to message input areas
   */
  addScheduleButton() {
    // Private chat schedule button
    const privateChatInputActions = document.querySelector('.private-chat .chat-input-actions');
    if (privateChatInputActions) {
      const scheduleButton = document.createElement('button');
      scheduleButton.className = 'schedule-button';
      scheduleButton.title = 'Schedule message';
      scheduleButton.setAttribute('data-chat-type', 'private');
      scheduleButton.innerHTML = '<i class="fas fa-clock"></i>';
      privateChatInputActions.appendChild(scheduleButton);
    }

    // Group chat schedule button
    const groupChatInputActions = document.querySelector('.group-chat .chat-input-actions');
    if (groupChatInputActions) {
      const scheduleButton = document.createElement('button');
      scheduleButton.className = 'schedule-button';
      scheduleButton.title = 'Schedule message';
      scheduleButton.setAttribute('data-chat-type', 'group');
      scheduleButton.innerHTML = '<i class="fas fa-clock"></i>';
      groupChatInputActions.appendChild(scheduleButton);
    }
  }

  /**
   * Create the scheduler dialog
   */
  createSchedulerDialog() {
    // Check if the dialog already exists
    if (document.getElementById('schedule-dialog')) return;

    // Create dialog container
    const dialog = document.createElement('div');
    dialog.id = 'schedule-dialog';
    dialog.className = 'schedule-dialog';

    dialog.innerHTML = `
      <div class="schedule-dialog-content">
        <div class="schedule-dialog-header">
          <div class="schedule-dialog-title">Schedule Message</div>
          <button class="schedule-dialog-close">&times;</button>
        </div>
        <div class="schedule-dialog-body">
          <div class="schedule-preview">
            <div class="schedule-preview-label">Message Preview</div>
            <div class="schedule-preview-content" id="schedule-preview-content"></div>
          </div>
          <div class="schedule-form-group">
            <label class="schedule-form-label">Select Date and Time</label>
            <div class="schedule-datetime-container">
              <input type="date" class="schedule-form-input" id="schedule-date">
              <input type="time" class="schedule-form-input" id="schedule-time">
            </div>
            <div class="schedule-form-help">When should this message be sent?</div>
            <div class="schedule-quick-times">
              <button class="schedule-quick-time-btn" data-time="15">In 15 minutes</button>
              <button class="schedule-quick-time-btn" data-time="60">In 1 hour</button>
              <button class="schedule-quick-time-btn" data-time="120">In 2 hours</button>
              <button class="schedule-quick-time-btn" data-time="1440">Tomorrow</button>
            </div>
          </div>
        </div>
        <div class="schedule-dialog-footer">
          <button class="schedule-cancel-btn">Cancel</button>
          <button class="schedule-submit-btn" disabled>Schedule Message</button>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(dialog);

    // Store reference
    this.schedulerDialog = dialog;

    // Initialize date/time inputs with current values
    const now = new Date();
    const dateInput = document.getElementById('schedule-date');
    const timeInput = document.getElementById('schedule-time');

    if (dateInput) {
      dateInput.valueAsDate = now;
      dateInput.min = now.toISOString().split('T')[0]; // Set min date to today
    }

    if (timeInput) {
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      timeInput.value = `${hours}:${minutes}`;
    }
  }

  /**
   * Add a tab for scheduled messages to the sidebar
   */
  addScheduledMessagesTab() {
    // Find the tabs container (in sidebar)
    const sidebarUserList = document.querySelector('.user-list');
    if (!sidebarUserList) return;

    // Check if tab already exists
    if (document.getElementById('scheduled-messages-tab')) return;

    // Create scheduled messages tab
    const tab = document.createElement('div');
    tab.id = 'scheduled-messages-tab';
    tab.className = 'scheduled-messages-tab';

    tab.innerHTML = `
      <i class="fas fa-clock"></i>
      <span class="scheduled-messages-tab-label">Scheduled Messages</span>
      <span class="scheduled-messages-count" id="scheduled-messages-count">0</span>
    `;

    // Add to sidebar
    sidebarUserList.appendChild(tab);

    // Create scheduled messages list (initially hidden)
    const listContainer = document.createElement('div');
    listContainer.id = 'scheduled-messages-container';
    listContainer.className = 'scheduled-messages-list';
    listContainer.style.display = 'none';

    // Add list to sidebar
    sidebarUserList.appendChild(listContainer);
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Schedule button click
    document.addEventListener('click', (event) => {
      // Handle schedule button click
      if (event.target.closest('.schedule-button')) {
        const button = event.target.closest('.schedule-button');
        const chatType = button.getAttribute('data-chat-type');
        this.showScheduleDialog(chatType);
      }

      // Handle close dialog button
      else if (event.target.closest('.schedule-dialog-close')) {
        this.hideScheduleDialog();
      }

      // Handle cancel button
      else if (event.target.closest('.schedule-cancel-btn')) {
        this.hideScheduleDialog();
      }

      // Handle submit button
      else if (event.target.closest('.schedule-submit-btn')) {
        this.scheduleMessage();
      }

      // Handle quick time buttons
      else if (event.target.closest('.schedule-quick-time-btn')) {
        const button = event.target.closest('.schedule-quick-time-btn');
        const minutes = parseInt(button.getAttribute('data-time'));
        this.setQuickTime(minutes);
      }

      // Handle scheduled messages tab click
      else if (event.target.closest('#scheduled-messages-tab')) {
        this.toggleScheduledMessagesList();
      }

      // Handle edit scheduled message button
      else if (event.target.closest('.scheduled-message-action-btn.edit')) {
        const button = event.target.closest('.scheduled-message-action-btn.edit');
        const messageId = button.closest('.scheduled-message-item').getAttribute('data-message-id');
        event.stopPropagation(); // Prevent item click from firing
        this.editScheduledMessage(messageId);
      }

      // Handle delete scheduled message button
      else if (event.target.closest('.scheduled-message-action-btn.delete')) {
        const button = event.target.closest('.scheduled-message-action-btn.delete');
        const messageId = button.closest('.scheduled-message-item').getAttribute('data-message-id');
        event.stopPropagation(); // Prevent item click from firing
        this.deleteScheduledMessage(messageId);
      }

      // Handle scheduled message item click
      else if (event.target.closest('.scheduled-message-item')) {
        const item = event.target.closest('.scheduled-message-item');
        const messageId = item.getAttribute('data-message-id');
        this.viewScheduledMessage(messageId);
      }
    });

    // Listen for date/time input changes
    const dateInput = document.getElementById('schedule-date');
    const timeInput = document.getElementById('schedule-time');

    if (dateInput) {
      dateInput.addEventListener('change', () => this.validateScheduleDateTime());
    }

    if (timeInput) {
      timeInput.addEventListener('input', () => this.validateScheduleDateTime());
    }

    // Handle outside clicks to close dialog
    this.schedulerDialog.addEventListener('click', (event) => {
      if (event.target === this.schedulerDialog) {
        this.hideScheduleDialog();
      }
    });

    // Listen for escape key to close dialog
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && this.schedulerDialog && !this.schedulerDialog.classList.contains('hidden')) {
        this.hideScheduleDialog();
      }
    });
  }

  /**
   * Set up connection handlers for scheduled messages
   */
  setupConnectionHandlers() {
    // Check for pending messages when reconnecting
    this.socket.on('connect', () => {
      this.checkPendingScheduledMessages();
    });
  }

  /**
   * Load scheduled messages from storage
   */
  loadScheduledMessages() {
    try {
      const storedMessages = localStorage.getItem(this.storageKey);
      if (storedMessages) {
        this.scheduledMessages = JSON.parse(storedMessages);
        // Update count
        this.updateScheduledMessagesCount();
      }
    } catch (error) {
      console.error('Error loading scheduled messages:', error);
      this.scheduledMessages = [];
    }
  }

  /**
   * Save scheduled messages to storage
   */
  saveScheduledMessages() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.scheduledMessages));
    } catch (error) {
      console.error('Error saving scheduled messages:', error);
    }
  }

  /**
   * Start timers for all scheduled messages
   */
  startScheduledMessageTimers() {
    // Clear any existing timers
    this.activeTimers.forEach((timer) => clearTimeout(timer));
    this.activeTimers.clear();

    // Start new timers for each scheduled message
    this.scheduledMessages.forEach((message) => {
      this.startMessageTimer(message);
    });
  }

  /**
   * Start a timer for a specific scheduled message
   * @param {Object} message - The scheduled message
   */
  startMessageTimer(message) {
    const now = Date.now();
    const delay = message.scheduledTime - now;

    // If the scheduled time is in the past, send immediately
    if (delay <= 0) {
      this.sendScheduledMessage(message);
      return;
    }

    // Set a timer for future messages
    const timer = setTimeout(() => {
      this.sendScheduledMessage(message);
    }, delay);

    // Store the timer reference
    this.activeTimers.set(message.id, timer);
  }

  /**
   * Send a scheduled message when its time comes
   * @param {Object} message - The scheduled message
   */
  sendScheduledMessage(message) {
    // Remove the timer
    if (this.activeTimers.has(message.id)) {
      this.activeTimers.delete(message.id);
    }

    // Check if we need to change the chat context
    let needToSwitchContext = false;

    if (message.chatType === 'private' && (!selectedUser || selectedUser._id !== message.recipient)) {
      needToSwitchContext = true;
      // TODO: Switch to private chat with this user
    } else if (message.chatType === 'group' && (!selectedGroup || selectedGroup._id !== message.group)) {
      needToSwitchContext = true;
      // TODO: Switch to group chat with this group
    }

    // Create the message data
    let messageData = {};

    if (message.chatType === 'private') {
      messageData = {
        recipientId: message.recipient,
        content: message.content,
        attachment: message.attachment,
        richContent: message.richContent
      };

      // Send message
      emitWithErrorHandling('sendPrivateMessage', messageData, 'send private message');
    } else if (message.chatType === 'group') {
      messageData = {
        groupId: message.group,
        content: message.content,
        attachment: message.attachment,
        richContent: message.richContent
      };

      // Send message
      emitWithErrorHandling('sendGroupMessage', messageData, 'send group message');
    }

    // Show notification
    showNotification('Scheduled message sent', 'success');

    // Remove the message from scheduled messages
    this.removeScheduledMessage(message.id);
  }

  /**
   * Check for any pending scheduled messages that should have been sent
   */
  checkPendingScheduledMessages() {
    const now = Date.now();
    const pendingMessages = this.scheduledMessages.filter(msg => msg.scheduledTime <= now);

    // Send all pending messages
    pendingMessages.forEach(message => {
      this.sendScheduledMessage(message);
    });
  }

  /**
   * Show the schedule dialog
   * @param {string} chatType - The type of chat ('private' or 'group')
   */
  showScheduleDialog(chatType) {
    if (!this.schedulerDialog) return;

    // Store current chat type
    this.schedulerDialog.setAttribute('data-chat-type', chatType);

    // Get message content
    let messageContent = '';
    let previewContent = '';

    if (chatType === 'private') {
      const inputElement = document.getElementById('message-input');
      if (inputElement) {
        messageContent = inputElement.value.trim();
      }

      // Check for rich text editor content
      if (richTextEditor) {
        const editorContent = richTextEditor.getContent();
        if (editorContent) {
          previewContent = editorContent;
        }
      }
    } else if (chatType === 'group') {
      const inputElement = document.getElementById('group-message-input');
      if (inputElement) {
        messageContent = inputElement.value.trim();
      }

      // Check for rich text editor content
      if (richTextEditor) {
        const editorContent = richTextEditor.getContent();
        if (editorContent) {
          previewContent = editorContent;
        }
      }
    }

    // If message is empty, don't show dialog
    if (!messageContent && !previewContent) {
      showNotification('Please enter a message to schedule', 'info');
      return;
    }

    // Update preview content
    const previewElement = document.getElementById('schedule-preview-content');
    if (previewElement) {
      if (previewContent) {
        previewElement.innerHTML = previewContent;
      } else {
        previewElement.textContent = messageContent;
      }
    }

    // Show dialog
    this.schedulerDialog.classList.add('active');

    // Focus date input
    const dateInput = document.getElementById('schedule-date');
    if (dateInput) {
      dateInput.focus();
    }

    // Validate schedule date/time
    this.validateScheduleDateTime();
  }

  /**
   * Hide the schedule dialog
   */
  hideScheduleDialog() {
    if (!this.schedulerDialog) return;

    // Hide dialog
    this.schedulerDialog.classList.remove('active');

    // Clear quick time selection
    document.querySelectorAll('.schedule-quick-time-btn.active').forEach(btn => {
      btn.classList.remove('active');
    });
  }

  /**
   * Set a quick time using the buttons
   * @param {number} minutes - Minutes from now to schedule the message
   */
  setQuickTime(minutes) {
    // Clear active state from all buttons
    document.querySelectorAll('.schedule-quick-time-btn.active').forEach(btn => {
      btn.classList.remove('active');
    });

    // Set active state on clicked button
    document.querySelector(`.schedule-quick-time-btn[data-time="${minutes}"]`).classList.add('active');

    // Calculate the target date and time
    const targetDate = new Date();
    targetDate.setMinutes(targetDate.getMinutes() + minutes);

    // Update date input
    const dateInput = document.getElementById('schedule-date');
    if (dateInput) {
      const dateString = targetDate.toISOString().split('T')[0];
      dateInput.value = dateString;
    }

    // Update time input
    const timeInput = document.getElementById('schedule-time');
    if (timeInput) {
      const hours = String(targetDate.getHours()).padStart(2, '0');
      const mins = String(targetDate.getMinutes()).padStart(2, '0');
      timeInput.value = `${hours}:${mins}`;
    }

    // Validate the new date/time
    this.validateScheduleDateTime();
  }

  /**
   * Validate the selected schedule date and time
   */
  validateScheduleDateTime() {
    const dateInput = document.getElementById('schedule-date');
    const timeInput = document.getElementById('schedule-time');
    const submitButton = document.querySelector('.schedule-submit-btn');

    if (!dateInput || !timeInput || !submitButton) return;

    const selectedDate = new Date(dateInput.value);
    const [hours, minutes] = timeInput.value.split(':').map(Number);

    selectedDate.setHours(hours, minutes, 0, 0);

    const now = new Date();

    // Check if the selected date/time is in the future
    const isValid = selectedDate > now;

    // Enable/disable submit button
    submitButton.disabled = !isValid;

    // Add warning if invalid
    if (!isValid) {
      timeInput.classList.add('invalid');
    } else {
      timeInput.classList.remove('invalid');
    }
  }

  /**
   * Schedule a message to be sent at the specified time
   */
  scheduleMessage() {
    const dateInput = document.getElementById('schedule-date');
    const timeInput = document.getElementById('schedule-time');

    if (!dateInput || !timeInput) return;

    // Get selected date and time
    const selectedDate = new Date(dateInput.value);
    const [hours, minutes] = timeInput.value.split(':').map(Number);

    selectedDate.setHours(hours, minutes, 0, 0);

    // Get chat type and message content
    const chatType = this.schedulerDialog.getAttribute('data-chat-type');
    let messageContent = '';
    let richContent = null;
    let attachmentData = null;

    if (chatType === 'private') {
      const inputElement = document.getElementById('message-input');
      if (inputElement) {
        messageContent = inputElement.value.trim();
      }

      // Check for rich text editor content
      if (richTextEditor) {
        richContent = richTextEditor.getContent();
      }

      // Check for attachment
      if (window.attachmentData) {
        attachmentData = window.attachmentData;
      }
    } else if (chatType === 'group') {
      const inputElement = document.getElementById('group-message-input');
      if (inputElement) {
        messageContent = inputElement.value.trim();
      }

      // Check for rich text editor content
      if (richTextEditor) {
        richContent = richTextEditor.getContent();
      }

      // Check for attachment
      if (window.groupAttachmentData) {
        attachmentData = window.groupAttachmentData;
      }
    }

    // Generate a unique ID for the scheduled message
    const messageId = 'scheduled_' + Date.now() + '_' + Math.random().toString(36).substring(2, 10);

    // Create scheduled message object
    const scheduledMessage = {
      id: messageId,
      content: messageContent,
      richContent: richContent,
      attachment: attachmentData,
      scheduledTime: selectedDate.getTime(),
      chatType: chatType,
      recipient: chatType === 'private' ? selectedUser?._id : null,
      recipientName: chatType === 'private' ? selectedUser?.username : null,
      group: chatType === 'group' ? selectedGroup?._id : null,
      groupName: chatType === 'group' ? selectedGroup?.name : null,
      created: Date.now()
    };

    // Add to scheduled messages
    this.scheduledMessages.push(scheduledMessage);

    // Save to storage
    this.saveScheduledMessages();

    // Start timer for this message
    this.startMessageTimer(scheduledMessage);

    // Update scheduled messages count
    this.updateScheduledMessagesCount();

    // Update scheduled messages list if visible
    if (document.getElementById('scheduled-messages-container').style.display !== 'none') {
      this.renderScheduledMessagesList();
    }

    // Hide dialog
    this.hideScheduleDialog();

    // Clear input field and attachment data
    if (chatType === 'private') {
      const inputElement = document.getElementById('message-input');
      if (inputElement) {
        inputElement.value = '';
      }

      // Clear rich text editor
      if (richTextEditor) {
        richTextEditor.clearContent();
      }

      // Clear attachment data
      window.attachmentData = null;
      const attachments = document.getElementById('attachments');
      if (attachments) {
        attachments.innerHTML = '';
      }
    } else if (chatType === 'group') {
      const inputElement = document.getElementById('group-message-input');
      if (inputElement) {
        inputElement.value = '';
      }

      // Clear rich text editor
      if (richTextEditor) {
        richTextEditor.clearContent();
      }

      // Clear attachment data
      window.groupAttachmentData = null;
      const attachments = document.getElementById('group-attachments');
      if (attachments) {
        attachments.innerHTML = '';
      }
    }

    // Show notification
    showNotification(`Message scheduled for ${this.formatScheduledTime(selectedDate)}`, 'success');
  }

  /**
   * Toggle the scheduled messages list visibility
   */
  toggleScheduledMessagesList() {
    const container = document.getElementById('scheduled-messages-container');
    if (!container) return;

    const isVisible = container.style.display !== 'none';

    if (isVisible) {
      container.style.display = 'none';
    } else {
      // Update the list before showing
      this.renderScheduledMessagesList();
      container.style.display = 'block';
    }
  }

  /**
   * Update the scheduled messages count display
   */
  updateScheduledMessagesCount() {
    const countElement = document.getElementById('scheduled-messages-count');
    if (countElement) {
      countElement.textContent = this.scheduledMessages.length;
    }
  }

  /**
   * Render the scheduled messages list
   */
  renderScheduledMessagesList() {
    const container = document.getElementById('scheduled-messages-container');
    if (!container) return;

    // Clear current list
    container.innerHTML = '';

    // Sort messages by scheduled time (earliest first)
    const sortedMessages = [...this.scheduledMessages].sort((a, b) => a.scheduledTime - b.scheduledTime);

    // Check if there are no scheduled messages
    if (sortedMessages.length === 0) {
      container.innerHTML = '<div class="scheduled-message-empty">No scheduled messages</div>';
      return;
    }

    // Add each scheduled message to the list
    sortedMessages.forEach(message => {
      const item = document.createElement('div');
      item.className = 'scheduled-message-item';
      item.setAttribute('data-message-id', message.id);

      const scheduledTime = new Date(message.scheduledTime);
      const formattedTime = this.formatScheduledTime(scheduledTime);

      // Create content preview
      let previewText = message.content || '';
      if (previewText.length > 40) {
        previewText = previewText.substring(0, 40) + '...';
      }

      // If rich content is present, strip HTML for preview
      if (message.richContent) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = message.richContent;
        previewText = tempDiv.textContent;
        if (previewText.length > 40) {
          previewText = previewText.substring(0, 40) + '...';
        }
      }

      // Create recipient/group display
      const recipientDisplay = message.chatType === 'private'
        ? `To: ${message.recipientName || 'Unknown user'}`
        : `To: ${message.groupName || 'Unknown group'}`;

      item.innerHTML = `
        <div class="scheduled-message-header">
          <div class="scheduled-message-recipient">${recipientDisplay}</div>
          <div class="scheduled-message-time">
            <i class="fas fa-clock"></i> ${formattedTime}
          </div>
        </div>
        <div class="scheduled-message-preview">${previewText}</div>
        <div class="scheduled-message-actions">
          <button class="scheduled-message-action-btn edit">Edit</button>
          <button class="scheduled-message-action-btn delete">Delete</button>
        </div>
      `;

      container.appendChild(item);
    });
  }

  /**
   * Format a date for display
   * @param {Date} date - The date to format
   * @returns {string} Formatted date string
   */
  formatScheduledTime(date) {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.getDate() === now.getDate() &&
                    date.getMonth() === now.getMonth() &&
                    date.getFullYear() === now.getFullYear();

    const isTomorrow = date.getDate() === tomorrow.getDate() &&
                       date.getMonth() === tomorrow.getMonth() &&
                       date.getFullYear() === tomorrow.getFullYear();

    const hours = date.getHours();
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;

    const timeStr = `${hour12}:${minutes} ${ampm}`;

    if (isToday) {
      return `Today at ${timeStr}`;
    } else if (isTomorrow) {
      return `Tomorrow at ${timeStr}`;
    } else {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      return `${month} ${day} at ${timeStr}`;
    }
  }

  /**
   * View details of a scheduled message
   * @param {string} messageId - The ID of the scheduled message
   */
  viewScheduledMessage(messageId) {
    const message = this.scheduledMessages.find(msg => msg.id === messageId);
    if (!message) return;

    // TODO: Show message details in a modal/popover
    console.log('Viewing message:', message);

    // For now, just show a notification with the scheduled time
    const scheduledTime = new Date(message.scheduledTime);
    showNotification(`Message scheduled for ${this.formatScheduledTime(scheduledTime)}`, 'info');
  }

  /**
   * Edit a scheduled message
   * @param {string} messageId - The ID of the scheduled message
   */
  editScheduledMessage(messageId) {
    const message = this.scheduledMessages.find(msg => msg.id === messageId);
    if (!message) return;

    // TODO: Open the schedule dialog with the message details pre-filled
    console.log('Editing message:', message);

    // For now, just show a notification
    showNotification('Editing scheduled messages will be available soon', 'info');
  }

  /**
   * Delete a scheduled message
   * @param {string} messageId - The ID of the scheduled message
   */
  deleteScheduledMessage(messageId) {
    // Find the message index
    const index = this.scheduledMessages.findIndex(msg => msg.id === messageId);
    if (index === -1) return;

    // Confirm deletion
    if (confirm('Are you sure you want to delete this scheduled message?')) {
      this.removeScheduledMessage(messageId);

      // Show notification
      showNotification('Scheduled message deleted', 'success');
    }
  }

  /**
   * Remove a scheduled message by ID
   * @param {string} messageId - The ID of the scheduled message to remove
   */
  removeScheduledMessage(messageId) {
    // Clear any active timer
    if (this.activeTimers.has(messageId)) {
      clearTimeout(this.activeTimers.get(messageId));
      this.activeTimers.delete(messageId);
    }

    // Remove from scheduled messages array
    this.scheduledMessages = this.scheduledMessages.filter(msg => msg.id !== messageId);

    // Save to storage
    this.saveScheduledMessages();

    // Update count
    this.updateScheduledMessagesCount();

    // Update list if visible
    const container = document.getElementById('scheduled-messages-container');
    if (container && container.style.display !== 'none') {
      this.renderScheduledMessagesList();
    }
  }

  /**
   * Enhance the createMessageElement function to handle scheduled messages
   * @param {Function} original - The original createMessageElement function
   * @returns {Function} Enhanced function
   */
  enhanceCreateMessageElement(original) {
    return (message, isPrivate, showActions = true) => {
      // Get the message element from the original function
      const messageElement = original(message, isPrivate, showActions);

      // Check if this is a scheduled message (can be identified by a property or message type)
      if (message.scheduled === true || message.scheduledTime) {
        // Add a class to the message element
        messageElement.classList.add('scheduled');

        // Add scheduled indicator if it doesn't exist
        if (!messageElement.querySelector('.scheduled-indicator')) {
          const scheduledTime = message.scheduledTime ? new Date(message.scheduledTime) : null;
          const formattedTime = scheduledTime ? this.formatScheduledTime(scheduledTime) : 'Unknown time';

          const indicator = document.createElement('div');
          indicator.className = 'scheduled-indicator';
          indicator.innerHTML = `<i class="fas fa-clock"></i> Scheduled: ${formattedTime}`;

          // Find message footer or create one
          let footer = messageElement.querySelector('.message-footer');
          if (!footer) {
            footer = document.createElement('div');
            footer.className = 'message-footer';
            messageElement.appendChild(footer);
          }

          footer.appendChild(indicator);
        }
      }

      return messageElement;
    };
  }
}
