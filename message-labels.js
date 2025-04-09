/**
 * Message Labels System
 *
 * This module provides functionality for:
 * - Categorizing messages with custom labels
 * - Managing label sets with customizable colors
 * - Filtering messages by labels
 * - Organizing conversations by topic
 */

class MessageLabels {
  constructor(socket) {
    this.socket = socket;
    this.labels = [];
    this.localStorageKey = 'chat_message_labels';
    this.labeledMessages = new Map(); // messageId -> array of label ids
    this.labeledMessagesKey = 'chat_labeled_messages';

    // Initialize the module
    this.init();
  }

  /**
   * Initialize the labels module
   */
  init() {
    if (!this.socket) {
      console.error('Socket not available for message labels');
      return;
    }

    // Load labels and labeled messages from storage
    this.loadLabels();
    this.loadLabeledMessages();

    // Set up event delegation for label-related actions
    this.setupEventListeners();

    // Create labels management panel
    this.createLabelsPanel();
  }

  /**
   * Set up event listeners for label actions
   */
  setupEventListeners() {
    // Use event delegation to handle label-related actions
    document.addEventListener('click', (event) => {
      // Handle add label button click
      if (event.target.closest('.message-label-btn')) {
        const messageElement = event.target.closest('.message');
        if (messageElement) {
          this.showLabelSelector(messageElement);
        }
      }

      // Handle toggle labels panel button
      else if (event.target.closest('#labels-btn')) {
        this.toggleLabelsPanel();
      }

      // Handle add new label button
      else if (event.target.closest('#add-label-btn')) {
        this.showAddLabelForm();
      }

      // Handle label click in message (for filtering)
      else if (event.target.closest('.message-label')) {
        const label = event.target.closest('.message-label');
        const labelId = label.dataset.labelId;
        this.filterByLabel(labelId);
      }

      // Handle edit label button
      else if (event.target.closest('.edit-label-btn')) {
        const labelElement = event.target.closest('.label-item');
        if (labelElement) {
          const labelId = labelElement.dataset.labelId;
          this.showEditLabelForm(labelId);
        }
      }

      // Handle delete label button
      else if (event.target.closest('.delete-label-btn')) {
        const labelElement = event.target.closest('.label-item');
        if (labelElement) {
          const labelId = labelElement.dataset.labelId;
          this.confirmDeleteLabel(labelId);
        }
      }

      // Close label selector dropdown if clicking outside
      if (!event.target.closest('.label-selector') && !event.target.closest('.message-label-btn')) {
        const openSelectors = document.querySelectorAll('.label-selector:not(.hidden)');
        openSelectors.forEach(selector => selector.classList.add('hidden'));
      }
    });
  }

  /**
   * Load labels from local storage
   */
  loadLabels() {
    try {
      const storedLabels = localStorage.getItem(this.localStorageKey);
      if (storedLabels) {
        this.labels = JSON.parse(storedLabels);
      } else {
        // Create some default labels if none exist
        this.labels = [
          { id: 'important', name: 'Important', color: '#ef4444' },
          { id: 'work', name: 'Work', color: '#3b82f6' },
          { id: 'personal', name: 'Personal', color: '#10b981' },
          { id: 'todo', name: 'To-do', color: '#f59e0b' },
          { id: 'question', name: 'Question', color: '#8b5cf6' }
        ];
        this.saveLabels();
      }
    } catch (error) {
      console.error('Error loading labels from storage:', error);
      this.labels = [];
    }
  }

  /**
   * Load labeled messages from local storage
   */
  loadLabeledMessages() {
    try {
      const storedMessages = localStorage.getItem(this.labeledMessagesKey);
      if (storedMessages) {
        // Convert from stored object format to Map
        const messagesObj = JSON.parse(storedMessages);
        this.labeledMessages = new Map(Object.entries(messagesObj));
      }
    } catch (error) {
      console.error('Error loading labeled messages from storage:', error);
      this.labeledMessages = new Map();
    }
  }

  /**
   * Save labels to local storage
   */
  saveLabels() {
    try {
      localStorage.setItem(this.localStorageKey, JSON.stringify(this.labels));
    } catch (error) {
      console.error('Error saving labels to storage:', error);
    }
  }

  /**
   * Save labeled messages to local storage
   */
  saveLabeledMessages() {
    try {
      // Convert Map to object for JSON serialization
      const messagesObj = Object.fromEntries(this.labeledMessages);
      localStorage.setItem(this.labeledMessagesKey, JSON.stringify(messagesObj));
    } catch (error) {
      console.error('Error saving labeled messages to storage:', error);
    }
  }

  /**
   * Create the labels management panel UI
   */
  createLabelsPanel() {
    // Check if panel already exists
    if (document.getElementById('labels-panel')) return;

    // Create the toggle button in the header
    const header = document.querySelector('.header');
    if (header) {
      const labelsBtn = document.createElement('button');
      labelsBtn.id = 'labels-btn';
      labelsBtn.className = 'header-btn';
      labelsBtn.innerHTML = '<i class="fas fa-tags"></i>';
      labelsBtn.title = 'Message Labels';

      // Add to header
      const userMenu = header.querySelector('.user-menu');
      if (userMenu) {
        userMenu.insertBefore(labelsBtn, userMenu.firstChild);
      }
    }

    // Create the labels panel
    const labelsPanel = document.createElement('div');
    labelsPanel.id = 'labels-panel';
    labelsPanel.className = 'side-panel hidden';

    labelsPanel.innerHTML = `
      <div class="panel-header">
        <h3>Message Labels</h3>
        <button class="close-panel-btn"><i class="fas fa-times"></i></button>
      </div>
      <div class="panel-actions">
        <button id="add-label-btn" class="primary-btn">
          <i class="fas fa-plus"></i> New Label
        </button>
      </div>
      <div class="panel-filter">
        <button class="filter-btn active" data-filter="all">All Messages</button>
        <div class="filter-labels-container"></div>
      </div>
      <div class="panel-content">
        <div id="labels-list" class="labels-list"></div>
      </div>
    `;

    // Add to body
    document.body.appendChild(labelsPanel);

    // Add event listeners for panel interaction
    const closeBtn = labelsPanel.querySelector('.close-panel-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        labelsPanel.classList.add('hidden');
      });
    }

    // Populate labels list
    this.updateLabelsPanel();
  }

  /**
   * Update the labels panel with current labels
   */
  updateLabelsPanel() {
    const labelsList = document.getElementById('labels-list');
    if (!labelsList) return;

    // Clear current list
    labelsList.innerHTML = '';

    if (this.labels.length === 0) {
      labelsList.innerHTML = '<div class="no-labels">No labels created</div>';
      return;
    }

    // Create label items
    this.labels.forEach(label => {
      const labelItem = document.createElement('div');
      labelItem.className = 'label-item';
      labelItem.dataset.labelId = label.id;

      // Count messages with this label
      const count = this.countMessagesWithLabel(label.id);

      labelItem.innerHTML = `
        <div class="label-color-preview" style="background-color: ${label.color}"></div>
        <div class="label-info">
          <div class="label-name">${label.name}</div>
          <div class="label-count">${count} message${count !== 1 ? 's' : ''}</div>
        </div>
        <div class="label-actions">
          <button class="edit-label-btn" title="Edit label">
            <i class="fas fa-pen"></i>
          </button>
          <button class="delete-label-btn" title="Delete label">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      `;

      labelsList.appendChild(labelItem);
    });

    // Update filter buttons
    this.updateFilterButtons();
  }

  /**
   * Update filter buttons in the labels panel
   */
  updateFilterButtons() {
    const container = document.querySelector('.filter-labels-container');
    if (!container) return;

    // Clear current buttons
    container.innerHTML = '';

    // Add filter button for each label
    this.labels.forEach(label => {
      const button = document.createElement('button');
      button.className = 'filter-btn label-filter-btn';
      button.dataset.labelId = label.id;
      button.innerHTML = `
        <span class="label-color" style="background-color: ${label.color}"></span>
        ${label.name}
      `;

      button.addEventListener('click', () => {
        // Deactivate all buttons
        document.querySelectorAll('.filter-btn').forEach(btn => {
          btn.classList.remove('active');
        });

        // Activate this button
        button.classList.add('active');

        // Apply filter
        this.filterByLabel(label.id);
      });

      container.appendChild(button);
    });
  }

  /**
   * Toggle the labels panel visibility
   */
  toggleLabelsPanel() {
    const labelsPanel = document.getElementById('labels-panel');
    if (labelsPanel) {
      labelsPanel.classList.toggle('hidden');

      // Update list when opening panel
      if (!labelsPanel.classList.contains('hidden')) {
        this.updateLabelsPanel();
      }
    }
  }

  /**
   * Show label selector for a message
   * @param {HTMLElement} messageElement - The message element to label
   */
  showLabelSelector(messageElement) {
    const messageId = messageElement.dataset.messageId;

    // Check if selector already exists and is visible
    let selector = messageElement.querySelector('.label-selector');
    if (selector && !selector.classList.contains('hidden')) {
      selector.classList.add('hidden');
      return;
    }

    // Remove any existing selectors
    document.querySelectorAll('.label-selector').forEach(s => {
      s.classList.add('hidden');
    });

    // Create selector if it doesn't exist
    if (!selector) {
      selector = document.createElement('div');
      selector.className = 'label-selector hidden';

      // Get message labels
      const messageLabels = this.getMessageLabels(messageId);

      // Add labels to selector
      this.labels.forEach(label => {
        const labelOption = document.createElement('div');
        labelOption.className = 'label-option';

        // Check if message already has this label
        const isSelected = messageLabels.includes(label.id);

        labelOption.innerHTML = `
          <label class="label-checkbox">
            <input type="checkbox" value="${label.id}" ${isSelected ? 'checked' : ''}>
            <span class="label-color" style="background-color: ${label.color}"></span>
            <span class="label-name">${label.name}</span>
          </label>
        `;

        // Add event listener for checkbox change
        const checkbox = labelOption.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) {
            this.addLabelToMessage(messageId, label.id);
          } else {
            this.removeLabelFromMessage(messageId, label.id);
          }
        });

        selector.appendChild(labelOption);
      });

      // Add to message
      const messageActions = messageElement.querySelector('.message-actions');
      if (messageActions) {
        messageActions.parentNode.insertBefore(selector, messageActions.nextSibling);
      } else {
        messageElement.appendChild(selector);
      }
    }

    // Show selector
    selector.classList.remove('hidden');
  }

  /**
   * Show the form to add a new label
   */
  showAddLabelForm() {
    // Check if form already exists
    if (document.getElementById('label-form')) {
      document.getElementById('label-form').remove();
    }

    // Create form
    const form = document.createElement('div');
    form.id = 'label-form';
    form.className = 'label-form';

    // Generate random color for new label
    const randomColor = this.getRandomColor();

    form.innerHTML = `
      <div class="form-header">
        <h3>Add New Label</h3>
        <button type="button" class="close-form-btn"><i class="fas fa-times"></i></button>
      </div>
      <div class="form-content">
        <div class="form-group">
          <label for="label-name">Label Name</label>
          <input type="text" id="label-name" placeholder="Enter label name" required>
        </div>
        <div class="form-group">
          <label for="label-color">Color</label>
          <input type="color" id="label-color" value="${randomColor}">
        </div>
        <div class="form-actions">
          <button type="button" class="cancel-btn">Cancel</button>
          <button type="button" class="save-btn">Save Label</button>
        </div>
      </div>
    `;

    // Add to panel
    const panelContent = document.querySelector('#labels-panel .panel-content');
    if (panelContent) {
      panelContent.appendChild(form);
    } else {
      document.body.appendChild(form);
    }

    // Add event listeners
    const closeBtn = form.querySelector('.close-form-btn');
    const cancelBtn = form.querySelector('.cancel-btn');
    const saveBtn = form.querySelector('.save-btn');

    closeBtn.addEventListener('click', () => form.remove());
    cancelBtn.addEventListener('click', () => form.remove());

    saveBtn.addEventListener('click', () => {
      const name = document.getElementById('label-name').value.trim();
      const color = document.getElementById('label-color').value;

      if (name) {
        this.addLabel(name, color);
        form.remove();
      }
    });

    // Focus input
    setTimeout(() => {
      document.getElementById('label-name').focus();
    }, 0);
  }

  /**
   * Show the form to edit an existing label
   * @param {string} labelId - The ID of the label to edit
   */
  showEditLabelForm(labelId) {
    // Find the label
    const label = this.labels.find(l => l.id === labelId);
    if (!label) return;

    // Check if form already exists
    if (document.getElementById('label-form')) {
      document.getElementById('label-form').remove();
    }

    // Create form
    const form = document.createElement('div');
    form.id = 'label-form';
    form.className = 'label-form';

    form.innerHTML = `
      <div class="form-header">
        <h3>Edit Label</h3>
        <button type="button" class="close-form-btn"><i class="fas fa-times"></i></button>
      </div>
      <div class="form-content">
        <div class="form-group">
          <label for="label-name">Label Name</label>
          <input type="text" id="label-name" value="${label.name}" placeholder="Enter label name" required>
        </div>
        <div class="form-group">
          <label for="label-color">Color</label>
          <input type="color" id="label-color" value="${label.color}">
        </div>
        <div class="form-actions">
          <button type="button" class="cancel-btn">Cancel</button>
          <button type="button" class="update-btn">Update Label</button>
        </div>
      </div>
    `;

    // Add to panel
    const panelContent = document.querySelector('#labels-panel .panel-content');
    if (panelContent) {
      panelContent.appendChild(form);
    } else {
      document.body.appendChild(form);
    }

    // Add event listeners
    const closeBtn = form.querySelector('.close-form-btn');
    const cancelBtn = form.querySelector('.cancel-btn');
    const updateBtn = form.querySelector('.update-btn');

    closeBtn.addEventListener('click', () => form.remove());
    cancelBtn.addEventListener('click', () => form.remove());

    updateBtn.addEventListener('click', () => {
      const name = document.getElementById('label-name').value.trim();
      const color = document.getElementById('label-color').value;

      if (name) {
        this.updateLabel(labelId, name, color);
        form.remove();
      }
    });

    // Focus input
    setTimeout(() => {
      document.getElementById('label-name').focus();
    }, 0);
  }

  /**
   * Show confirmation dialog for deleting a label
   * @param {string} labelId - The ID of the label to delete
   */
  confirmDeleteLabel(labelId) {
    // Find the label
    const label = this.labels.find(l => l.id === labelId);
    if (!label) return;

    // Check if dialog already exists
    if (document.getElementById('confirm-dialog')) {
      document.getElementById('confirm-dialog').remove();
    }

    // Create dialog
    const dialog = document.createElement('div');
    dialog.id = 'confirm-dialog';
    dialog.className = 'confirm-dialog';

    dialog.innerHTML = `
      <div class="dialog-content">
        <div class="dialog-header">
          <h3>Delete Label</h3>
        </div>
        <div class="dialog-body">
          <p>Are you sure you want to delete the label "${label.name}"?</p>
          <p>This will remove the label from all messages.</p>
        </div>
        <div class="dialog-actions">
          <button type="button" class="cancel-btn">Cancel</button>
          <button type="button" class="delete-btn">Delete Label</button>
        </div>
      </div>
    `;

    // Add to body
    document.body.appendChild(dialog);

    // Add event listeners
    const cancelBtn = dialog.querySelector('.cancel-btn');
    const deleteBtn = dialog.querySelector('.delete-btn');

    cancelBtn.addEventListener('click', () => dialog.remove());

    deleteBtn.addEventListener('click', () => {
      this.deleteLabel(labelId);
      dialog.remove();
    });

    // Add backdrop click to cancel
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) {
        dialog.remove();
      }
    });
  }

  /**
   * Add a new label
   * @param {string} name - The name of the label
   * @param {string} color - The color of the label (hex code)
   */
  addLabel(name, color) {
    // Generate ID from name (lowercase, replace spaces with dashes)
    const id = name.toLowerCase().replace(/\s+/g, '-') + '-' + Date.now().toString(36);

    // Add to labels array
    this.labels.push({ id, name, color });

    // Save to storage
    this.saveLabels();

    // Update UI
    this.updateLabelsPanel();

    // Show notification
    showNotification(`Label "${name}" created`, 'success');
  }

  /**
   * Update an existing label
   * @param {string} labelId - The ID of the label to update
   * @param {string} name - The new name for the label
   * @param {string} color - The new color for the label
   */
  updateLabel(labelId, name, color) {
    // Find the label
    const labelIndex = this.labels.findIndex(l => l.id === labelId);
    if (labelIndex === -1) return;

    // Update label
    this.labels[labelIndex].name = name;
    this.labels[labelIndex].color = color;

    // Save to storage
    this.saveLabels();

    // Update UI
    this.updateLabelsPanel();

    // Update label on all messages
    this.updateLabelDisplay();

    // Show notification
    showNotification(`Label "${name}" updated`, 'success');
  }

  /**
   * Delete a label
   * @param {string} labelId - The ID of the label to delete
   */
  deleteLabel(labelId) {
    // Find the label
    const labelIndex = this.labels.findIndex(l => l.id === labelId);
    if (labelIndex === -1) return;

    const labelName = this.labels[labelIndex].name;

    // Remove label from array
    this.labels.splice(labelIndex, 1);

    // Remove label from all messages
    this.labeledMessages.forEach((labels, messageId) => {
      const updatedLabels = labels.filter(id => id !== labelId);
      if (updatedLabels.length === 0) {
        this.labeledMessages.delete(messageId);
      } else {
        this.labeledMessages.set(messageId, updatedLabels);
      }
    });

    // Save to storage
    this.saveLabels();
    this.saveLabeledMessages();

    // Update UI
    this.updateLabelsPanel();

    // Update label display on messages
    this.updateLabelDisplay();

    // Show notification
    showNotification(`Label "${labelName}" deleted`, 'info');
  }

  /**
   * Add a label to a message
   * @param {string} messageId - The ID of the message
   * @param {string} labelId - The ID of the label to add
   */
  addLabelToMessage(messageId, labelId) {
    // Get current labels for this message
    let messageLabels = this.labeledMessages.get(messageId) || [];

    // Check if label is already applied
    if (messageLabels.includes(labelId)) return;

    // Add label
    messageLabels.push(labelId);

    // Update map
    this.labeledMessages.set(messageId, messageLabels);

    // Save to storage
    this.saveLabeledMessages();

    // Update label display on message
    this.updateMessageLabels(messageId);
  }

  /**
   * Remove a label from a message
   * @param {string} messageId - The ID of the message
   * @param {string} labelId - The ID of the label to remove
   */
  removeLabelFromMessage(messageId, labelId) {
    // Get current labels for this message
    let messageLabels = this.labeledMessages.get(messageId) || [];

    // Remove label
    messageLabels = messageLabels.filter(id => id !== labelId);

    // Update map
    if (messageLabels.length === 0) {
      this.labeledMessages.delete(messageId);
    } else {
      this.labeledMessages.set(messageId, messageLabels);
    }

    // Save to storage
    this.saveLabeledMessages();

    // Update label display on message
    this.updateMessageLabels(messageId);
  }

  /**
   * Get labels for a message
   * @param {string} messageId - The ID of the message
   * @returns {Array} Array of label IDs
   */
  getMessageLabels(messageId) {
    return this.labeledMessages.get(messageId) || [];
  }

  /**
   * Update label display on a specific message
   * @param {string} messageId - The ID of the message
   */
  updateMessageLabels(messageId) {
    const messageElement = document.querySelector(`.message[data-message-id="${messageId}"]`);
    if (!messageElement) return;

    // Find or create labels container
    let labelsContainer = messageElement.querySelector('.message-labels');
    if (!labelsContainer) {
      labelsContainer = document.createElement('div');
      labelsContainer.className = 'message-labels';

      // Insert after message content
      const messageContent = messageElement.querySelector('.message-content');
      if (messageContent) {
        messageContent.after(labelsContainer);
      } else {
        messageElement.appendChild(labelsContainer);
      }
    }

    // Clear existing labels
    labelsContainer.innerHTML = '';

    // Get message labels
    const messageLabels = this.getMessageLabels(messageId);

    // If no labels, hide container
    if (messageLabels.length === 0) {
      labelsContainer.classList.add('hidden');
      return;
    }

    // Show container
    labelsContainer.classList.remove('hidden');

    // Add labels
    messageLabels.forEach(labelId => {
      const label = this.labels.find(l => l.id === labelId);
      if (!label) return;

      const labelElement = document.createElement('span');
      labelElement.className = 'message-label';
      labelElement.dataset.labelId = label.id;
      labelElement.style.backgroundColor = label.color;
      labelElement.textContent = label.name;

      labelsContainer.appendChild(labelElement);
    });
  }

  /**
   * Update label display on all messages
   */
  updateLabelDisplay() {
    // Update all messages with labels
    this.labeledMessages.forEach((labels, messageId) => {
      this.updateMessageLabels(messageId);
    });
  }

  /**
   * Count messages with a specific label
   * @param {string} labelId - The ID of the label
   * @returns {number} The count of messages with the label
   */
  countMessagesWithLabel(labelId) {
    let count = 0;
    this.labeledMessages.forEach((labels) => {
      if (labels.includes(labelId)) {
        count++;
      }
    });
    return count;
  }

  /**
   * Filter messages by label
   * @param {string} labelId - The ID of the label to filter by, or 'all' for all messages
   */
  filterByLabel(labelId) {
    // Get all message containers
    const messageContainers = [
      document.getElementById('messages-container'),
      document.getElementById('group-messages')
    ].filter(Boolean);

    if (messageContainers.length === 0) return;

    // Reset any existing filter classes
    document.querySelectorAll('.filtering-labels').forEach(el => {
      el.classList.remove('filtering-labels');
    });

    // If 'all', show all messages
    if (labelId === 'all') {
      document.querySelectorAll('.message').forEach(message => {
        message.style.display = '';
      });

      // Update filter buttons
      document.querySelectorAll('.filter-btn').forEach(btn => {
        if (btn.dataset.filter === 'all') {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      });

      return;
    }

    // Add filtering class to message containers
    messageContainers.forEach(container => {
      container.classList.add('filtering-labels');
    });

    // Show messages with label, hide others
    document.querySelectorAll('.message').forEach(message => {
      const messageId = message.dataset.messageId;
      const messageLabels = this.getMessageLabels(messageId);

      if (messageLabels.includes(labelId)) {
        message.style.display = '';
      } else {
        message.style.display = 'none';
      }
    });

    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
      if (btn.dataset.labelId === labelId) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Get label info
    const label = this.labels.find(l => l.id === labelId);
    if (label) {
      showNotification(`Showing messages labeled "${label.name}"`, 'info');
    }
  }

  /**
   * Reset label filtering to show all messages
   */
  resetLabelFilter() {
    this.filterByLabel('all');
  }

  /**
   * Generate a random color for a new label
   * @returns {string} A random hex color
   */
  getRandomColor() {
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
      '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
      '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
      '#ec4899', '#f43f5e'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  /**
   * Enhance the createMessageElement function with label support
   * @param {Function} originalCreateMessageElement - The original createMessageElement function
   * @returns {Function} Enhanced function with label support
   */
  enhanceCreateMessageElement(originalCreateMessageElement) {
    return (message, isCurrentUser) => {
      // Call the original function to create the base message element
      const messageElement = originalCreateMessageElement(message, isCurrentUser);

      // Add label button to message actions
      const messageActions = messageElement.querySelector('.message-actions');
      if (messageActions) {
        const labelButton = document.createElement('button');
        labelButton.className = 'message-action-btn message-label-btn';
        labelButton.title = 'Add labels';
        labelButton.innerHTML = '<i class="fas fa-tag"></i>';

        // Add label button to message actions
        messageActions.appendChild(labelButton);
      }

      // If message has labels, display them
      if (message._id) {
        this.updateMessageLabels(message._id);
      }

      return messageElement;
    };
  }
}
