/**
 * Rich Text Editor Module
 *
 * This module provides advanced text formatting capabilities using TipTap
 * (under the hood, built on ProseMirror). It supports:
 * - Basic formatting (bold, italic, underline, code)
 * - Links
 * - Lists
 * - @mentions
 * - Text coloring
 * - Emojis
 * - Code blocks
 */

class RichTextEditor {
  constructor(socket) {
    this.socket = socket;
    this.editor = null;
    this.activeDropdown = null;
    this.editorContainers = new Map(); // Map of input containers to their editors

    // Initialize the module
    this.init();
  }

  /**
   * Initialize the rich text editor
   */
  init() {
    if (!window.tiptap) {
      this.loadTipTapDependencies().then(() => {
        this.upgradeMessageInputs();
        this.setupGlobalEvents();
      });
    } else {
      this.upgradeMessageInputs();
      this.setupGlobalEvents();
    }
  }

  /**
   * Load TipTap dependencies dynamically
   */
  async loadTipTapDependencies() {
    return new Promise((resolve) => {
      // Create a script to load TipTap from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@tiptap/core@2.1.12/dist/tiptap-core.umd.min.js';
      script.onload = () => {
        // Load additional extensions
        const extensions = [
          'https://cdn.jsdelivr.net/npm/@tiptap/extension-placeholder@2.1.12/dist/tiptap-extension-placeholder.umd.min.js',
          'https://cdn.jsdelivr.net/npm/@tiptap/starter-kit@2.1.12/dist/tiptap-starter-kit.umd.min.js',
          'https://cdn.jsdelivr.net/npm/@tiptap/extension-link@2.1.12/dist/tiptap-extension-link.umd.min.js',
          'https://cdn.jsdelivr.net/npm/@tiptap/extension-mention@2.1.12/dist/tiptap-extension-mention.umd.min.js',
          'https://cdn.jsdelivr.net/npm/@tiptap/extension-text-style@2.1.12/dist/tiptap-extension-text-style.umd.min.js',
          'https://cdn.jsdelivr.net/npm/@tiptap/extension-color@2.1.12/dist/tiptap-extension-color.umd.min.js',
        ];

        // Load all extensions in parallel
        let loaded = 0;
        extensions.forEach(url => {
          const extScript = document.createElement('script');
          extScript.src = url;
          extScript.onload = () => {
            loaded++;
            if (loaded === extensions.length) {
              resolve();
            }
          };
          document.head.appendChild(extScript);
        });
      };
      document.head.appendChild(script);
    });
  }

  /**
   * Upgrade all message input fields with rich text editor
   */
  upgradeMessageInputs() {
    const privateMessageInput = document.getElementById('message-input');
    const groupMessageInput = document.getElementById('group-message-input');

    if (privateMessageInput) {
      this.createEditorForInput(privateMessageInput, 'privateChat');
    }

    if (groupMessageInput) {
      this.createEditorForInput(groupMessageInput, 'groupChat');
    }
  }

  /**
   * Set up global event listeners
   */
  setupGlobalEvents() {
    // Close dropdowns when clicking outside
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.editor-dropdown') && !event.target.closest('.has-dropdown')) {
        this.closeAllDropdowns();
      }
    });

    // Set up keyboard event listeners globally
    document.addEventListener('keydown', (event) => {
      // Handle closing dropdowns with escape
      if (event.key === 'Escape') {
        this.closeAllDropdowns();
      }
    });
  }

  /**
   * Create a rich text editor for a specific input field
   * @param {HTMLElement} inputElement - The original input element to replace
   * @param {string} context - The context ('privateChat' or 'groupChat')
   */
  createEditorForInput(inputElement, context) {
    // If we already created an editor for this input, return
    if (this.editorContainers.has(inputElement)) {
      return;
    }

    // Create the rich text editor container
    const editorContainer = document.createElement('div');
    editorContainer.className = 'rich-text-editor';

    // Create toolbar
    const toolbar = this.createToolbar();
    editorContainer.appendChild(toolbar);

    // Create editor content area
    const editorContent = document.createElement('div');
    editorContent.className = 'editor-content';
    editorContainer.appendChild(editorContent);

    // Hide the original input
    inputElement.style.display = 'none';

    // Insert the editor before the input
    inputElement.parentNode.insertBefore(editorContainer, inputElement);

    // Store the relationship between input and editor container
    this.editorContainers.set(inputElement, {
      container: editorContainer,
      content: editorContent,
      context
    });

    // Initialize TipTap
    this.initializeTipTap(editorContent, inputElement, context);
  }

  /**
   * Create the rich text editor toolbar
   * @returns {HTMLElement} The toolbar element
   */
  createToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'editor-toolbar';

    // Text style group
    const textGroup = document.createElement('div');
    textGroup.className = 'editor-toolbar-group';

    textGroup.innerHTML = `
      <button class="editor-button" data-command="bold" title="Bold (Ctrl+B)">
        <i class="fas fa-bold"></i>
      </button>
      <button class="editor-button" data-command="italic" title="Italic (Ctrl+I)">
        <i class="fas fa-italic"></i>
      </button>
      <button class="editor-button" data-command="underline" title="Underline (Ctrl+U)">
        <i class="fas fa-underline"></i>
      </button>
      <button class="editor-button" data-command="strike" title="Strikethrough">
        <i class="fas fa-strikethrough"></i>
      </button>
      <button class="editor-button" data-command="code" title="Code">
        <i class="fas fa-code"></i>
      </button>
      <button class="editor-button has-dropdown" data-dropdown="color" title="Text color">
        <i class="fas fa-palette"></i>
        <div class="editor-dropdown" id="color-dropdown">
          <div class="color-picker">
            <div class="color-option" style="background-color: #000000" data-color="#000000"></div>
            <div class="color-option" style="background-color: #DB2777" data-color="#DB2777"></div>
            <div class="color-option" style="background-color: #EA580C" data-color="#EA580C"></div>
            <div class="color-option" style="background-color: #FACC15" data-color="#FACC15"></div>
            <div class="color-option" style="background-color: #84CC16" data-color="#84CC16"></div>
            <div class="color-option" style="background-color: #10B981" data-color="#10B981"></div>
            <div class="color-option" style="background-color: #06B6D4" data-color="#06B6D4"></div>
            <div class="color-option" style="background-color: #3B82F6" data-color="#3B82F6"></div>
            <div class="color-option" style="background-color: #8B5CF6" data-color="#8B5CF6"></div>
            <div class="color-option" style="background-color: #E879F9" data-color="#E879F9"></div>
            <div class="color-option" style="background-color: #A1A1AA" data-color="#A1A1AA"></div>
            <div class="color-option" style="background-color: #FFFFFF" data-color="#FFFFFF"></div>
          </div>
        </div>
      </button>
    `;

    // Lists and structure group
    const listGroup = document.createElement('div');
    listGroup.className = 'editor-toolbar-group';

    listGroup.innerHTML = `
      <button class="editor-button" data-command="bulletList" title="Bullet List">
        <i class="fas fa-list-ul"></i>
      </button>
      <button class="editor-button" data-command="orderedList" title="Numbered List">
        <i class="fas fa-list-ol"></i>
      </button>
      <button class="editor-button" data-command="blockquote" title="Blockquote">
        <i class="fas fa-quote-right"></i>
      </button>
    `;

    // Insert group
    const insertGroup = document.createElement('div');
    insertGroup.className = 'editor-toolbar-group';

    insertGroup.innerHTML = `
      <button class="editor-button" data-command="link" title="Add Link (Ctrl+K)">
        <i class="fas fa-link"></i>
      </button>
      <button class="editor-button" data-command="mention" title="Mention (@)">
        <i class="fas fa-at"></i>
      </button>
      <button class="editor-button has-dropdown" data-dropdown="emoji" title="Insert Emoji">
        <i class="far fa-smile"></i>
        <div class="editor-dropdown" id="emoji-dropdown">
          <div class="editor-dropdown-item" data-emoji="👍">👍 Thumbs Up</div>
          <div class="editor-dropdown-item" data-emoji="❤️">❤️ Heart</div>
          <div class="editor-dropdown-item" data-emoji="😊">😊 Smile</div>
          <div class="editor-dropdown-item" data-emoji="😂">😂 Laugh</div>
          <div class="editor-dropdown-item" data-emoji="🔥">🔥 Fire</div>
          <div class="editor-dropdown-item" data-emoji="⚡">⚡ Lightning</div>
          <div class="editor-dropdown-item" data-emoji="🎉">🎉 Party</div>
          <div class="editor-dropdown-item" data-emoji="👀">👀 Eyes</div>
        </div>
      </button>
    `;

    // Add all groups to toolbar
    toolbar.appendChild(textGroup);
    toolbar.appendChild(listGroup);
    toolbar.appendChild(insertGroup);

    // Add event listeners to all toolbar buttons
    toolbar.querySelectorAll('.editor-button').forEach(button => {
      // Handle dropdowns
      if (button.dataset.dropdown) {
        button.addEventListener('click', (event) => {
          event.preventDefault();
          event.stopPropagation();
          this.toggleDropdown(button);
        });
      } else {
        // Handle regular command buttons
        button.addEventListener('click', (event) => {
          event.preventDefault();
          this.executeCommand(button.dataset.command);
        });
      }
    });

    // Add event listeners for color picker
    toolbar.querySelectorAll('.color-option').forEach(color => {
      color.addEventListener('click', () => {
        this.executeCommand('textColor', { color: color.dataset.color });
        this.closeAllDropdowns();
      });
    });

    // Add event listeners for emoji picker
    toolbar.querySelectorAll('[data-emoji]').forEach(emojiOption => {
      emojiOption.addEventListener('click', () => {
        this.executeCommand('emoji', { emoji: emojiOption.dataset.emoji });
        this.closeAllDropdowns();
      });
    });

    return toolbar;
  }

  /**
   * Toggle a dropdown in the toolbar
   * @param {HTMLElement} button - The button that controls the dropdown
   */
  toggleDropdown(button) {
    const dropdownId = button.dataset.dropdown + '-dropdown';
    const dropdown = button.querySelector(`#${dropdownId}`);

    if (!dropdown) return;

    // Close any open dropdowns first
    this.closeAllDropdowns();

    // Toggle this dropdown
    dropdown.classList.toggle('show');
    this.activeDropdown = dropdown.classList.contains('show') ? dropdown : null;
  }

  /**
   * Close all open dropdowns
   */
  closeAllDropdowns() {
    document.querySelectorAll('.editor-dropdown.show').forEach(dropdown => {
      dropdown.classList.remove('show');
    });
    this.activeDropdown = null;
  }

  /**
   * Initialize TipTap editor
   * @param {HTMLElement} editorElement - The editor element
   * @param {HTMLElement} inputElement - The original input element
   * @param {string} context - The context ('privateChat' or 'groupChat')
   */
  initializeTipTap(editorElement, inputElement, context) {
    // Create placeholder text
    const placeholderText = context === 'privateChat'
      ? 'Type a message...'
      : 'Type a message to the group...';

    // Create editor instance
    if (window.tiptap) {
      const { Editor } = window.tiptap;
      const StarterKit = window.StarterKitPackage.default;
      const Placeholder = window.PlaceholderPackage.default;
      const Link = window.LinkPackage.default;
      const Mention = window.MentionPackage.default;
      const TextStyle = window.TextStylePackage.default;
      const Color = window.ColorPackage.default;

      // Create new editor
      this.editor = new Editor({
        element: editorElement,
        extensions: [
          StarterKit,
          Placeholder.configure({
            placeholder: placeholderText,
            emptyEditorClass: 'editor-placeholder',
          }),
          Link.configure({
            openOnClick: false,
            HTMLAttributes: {
              rel: 'noopener noreferrer',
              target: '_blank',
            },
          }),
          Mention.configure({
            HTMLAttributes: {
              class: 'editor-mention',
            },
          }),
          TextStyle,
          Color,
        ],
        onUpdate: ({ editor }) => {
          // Sync content to hidden input field
          inputElement.value = editor.getHTML();

          // If input is empty, reset the editor
          if (!editor.getText().trim()) {
            inputElement.value = '';
          }

          // Trigger input event on the original input for compatibility
          const event = new Event('input', { bubbles: true });
          inputElement.dispatchEvent(event);
        },
        onSelectionUpdate: ({ editor }) => {
          this.updateActiveStyles(editor);
        },
      });

      // Set up keyboard events for the editor
      editorElement.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) {
          event.preventDefault();

          // If the editor has content, submit the message
          if (this.editor.getText().trim()) {
            // Trigger appropriate send function based on context
            if (context === 'privateChat') {
              sendPrivateMessage();
            } else if (context === 'groupChat') {
              sendGroupMessage();
            }

            // Clear the editor
            this.editor.commands.clearContent();
          }
        }
      });
    }
  }

  /**
   * Execute a command in the editor
   * @param {string} command - The command to execute
   * @param {Object} params - Additional parameters for the command
   */
  executeCommand(command, params = {}) {
    if (!this.editor) return;

    switch (command) {
      case 'bold':
        this.editor.chain().focus().toggleBold().run();
        break;
      case 'italic':
        this.editor.chain().focus().toggleItalic().run();
        break;
      case 'underline':
        this.editor.chain().focus().toggleUnderline().run();
        break;
      case 'strike':
        this.editor.chain().focus().toggleStrike().run();
        break;
      case 'code':
        this.editor.chain().focus().toggleCode().run();
        break;
      case 'bulletList':
        this.editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        this.editor.chain().focus().toggleOrderedList().run();
        break;
      case 'blockquote':
        this.editor.chain().focus().toggleBlockquote().run();
        break;
      case 'textColor':
        this.editor.chain().focus().setColor(params.color).run();
        break;
      case 'link':
        const url = prompt('Enter link URL:');
        if (url) {
          this.editor.chain().focus().setLink({ href: url }).run();
        }
        break;
      case 'emoji':
        this.editor.chain().focus().insertContent(params.emoji).run();
        break;
      case 'mention':
        this.editor.chain().focus().insertContent('@').run();
        break;
    }

    // Update active button states
    this.updateActiveStyles(this.editor);
  }

  /**
   * Update the active styles in the toolbar based on current selection
   * @param {Object} editor - The TipTap editor instance
   */
  updateActiveStyles(editor) {
    if (!editor) return;

    const commands = ['bold', 'italic', 'underline', 'strike', 'code', 'bulletList', 'orderedList', 'blockquote'];

    commands.forEach(cmd => {
      const button = document.querySelector(`.editor-button[data-command="${cmd}"]`);
      if (button) {
        if (editor.isActive(cmd)) {
          button.classList.add('is-active');
        } else {
          button.classList.remove('is-active');
        }
      }
    });
  }

  /**
   * Get the HTML content from the editor
   * @returns {string} The HTML content
   */
  getContent() {
    if (!this.editor) return '';
    return this.editor.getHTML();
  }

  /**
   * Clear the editor content
   */
  clearContent() {
    if (this.editor) {
      this.editor.commands.clearContent();
    }
  }

  /**
   * Process a message before sending to handle rich text features
   * @param {Object} messageData - The message data object
   * @returns {Object} The enhanced message data
   */
  enhanceMessageData(messageData) {
    // If message has rich content, store it in the richContent field
    if (messageData.content && messageData.content.includes('<')) {
      // This is rich content
      messageData.richContent = messageData.content;

      // Extract plain text for compatibility with non-rich clients
      messageData.content = this.stripHtml(messageData.content);
    }

    return messageData;
  }

  /**
   * Strip HTML tags from a string
   * @param {string} html - The HTML string
   * @returns {string} Plain text without HTML tags
   */
  stripHtml(html) {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  }

  /**
   * Enhance the createMessageElement function to display rich text content
   * @param {Function} originalCreateMessageElement - The original createMessageElement function
   * @returns {Function} Enhanced function with rich text support
   */
  enhanceCreateMessageElement(originalCreateMessageElement) {
    return (message, isCurrentUser) => {
      // Call the original function to create the base message element
      const messageElement = originalCreateMessageElement(message, isCurrentUser);

      // Check if the message has rich content
      if (message.richContent) {
        const contentEl = messageElement.querySelector('.message-content p');
        if (contentEl) {
          // Replace the plain text content with rich content
          contentEl.innerHTML = message.richContent;

          // Add rich-text class to the message for styling
          messageElement.classList.add('rich-text-message');
        }
      }

      return messageElement;
    };
  }
}
