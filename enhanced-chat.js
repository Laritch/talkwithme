/**
 * Enhanced Chat System - Main JavaScript
 *
 * This script manages all the interactive functionality of the chat interface
 * including real-time messaging, UI interactions, translations, and more.
 */

document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const sidebar = document.querySelector('.sidebar');
    const chatArea = document.querySelector('.chat-area');
    const infoPanel = document.querySelector('.info-panel');
    const mobileToggleBtn = document.querySelector('.mobile-toggle');
    const chatDetailElements = document.querySelectorAll('.chat-info h2, .chat-participants');
    const closePanelBtn = document.querySelector('.close-panel-btn');
    const navButtons = document.querySelectorAll('.nav-btn');
    const searchInput = document.querySelector('.search-input');
    const composerInput = document.querySelector('.composer-input');
    const sendBtn = document.querySelector('.send-btn');
    const searchModalContainer = document.getElementById('searchModal');
    const modalOverlay = document.querySelector('.modal-overlay');
    const closeModalBtn = document.querySelector('.close-modal-btn');
    const searchHeaderBtn = document.querySelector('.chat-actions .action-btn:first-child');
    const conversationItems = document.querySelectorAll('.conversation-item');
    const filterPills = document.querySelectorAll('.filter-pill');
    const showOriginalBtns = document.querySelectorAll('.show-original-btn');
    const mediaTabButtons = document.querySelectorAll('.media-tab');
    const messageActionBtns = document.querySelectorAll('.message-action-btn');

    // Simulated data
    const currentUser = {
        id: 'user-1',
        name: 'Alex Johnson',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50&h=50&crop=faces&auto=format&fit=crop'
    };

    // State
    let lastMessageTime = new Date();
    let isTyping = false;
    let typingTimeout = null;
    let currentConversation = 'channel-1';
    let currentView = 'channels';
    let infoPanelActive = window.innerWidth > 1200;
    let activeMobileNav = false;

    // Initialize UI
    initUI();

    /**
     * Initialize the user interface and event listeners
     */
    function initUI() {
        // Show info panel by default on larger screens
        if (window.innerWidth > 1200) {
            infoPanel.style.display = 'flex';
        } else {
            infoPanel.style.display = 'none';
        }

        // Mobile menu toggle
        if (mobileToggleBtn) {
            mobileToggleBtn.addEventListener('click', toggleMobileNav);
        }

        // Close info panel
        if (closePanelBtn) {
            closePanelBtn.addEventListener('click', toggleInfoPanel);
        }

        // Navigation buttons
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                navButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentView = btn.dataset.view;
                updateConversationList(currentView);
            });
        });

        // Search input
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
            searchInput.addEventListener('keydown', e => {
                if (e.key === 'Escape') {
                    searchInput.value = '';
                    handleSearch();
                }
            });
        }

        // Message composer
        if (composerInput) {
            composerInput.addEventListener('input', handleTyping);
            composerInput.addEventListener('keydown', handleMessageInputKeydown);

            // Auto-resize textarea
            composerInput.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = (this.scrollHeight) + 'px';
            });
        }

        // Send button
        if (sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
        }

        // Search modal
        if (searchHeaderBtn) {
            searchHeaderBtn.addEventListener('click', () => {
                searchModalContainer.classList.add('active');
            });
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                searchModalContainer.classList.remove('active');
            });
        }

        if (modalOverlay) {
            modalOverlay.addEventListener('click', () => {
                searchModalContainer.classList.remove('active');
            });
        }

        // Conversation items
        conversationItems.forEach(item => {
            item.addEventListener('click', () => {
                conversationItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');
                currentConversation = item.dataset.id;
                updateChatHeader(item);
                loadMessages(currentConversation);
            });
        });

        // Filter pills
        filterPills.forEach(pill => {
            pill.addEventListener('click', () => {
                filterPills.forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                filterConversations(pill.textContent.trim().toLowerCase());
            });
        });

        // Translation buttons
        showOriginalBtns.forEach(btn => {
            btn.addEventListener('click', toggleTranslation);
        });

        // Media tabs
        mediaTabButtons.forEach(tab => {
            tab.addEventListener('click', () => {
                mediaTabButtons.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                // Would load different media based on the selected tab
            });
        });

        // Message actions
        messageActionBtns.forEach(btn => {
            if (btn.querySelector('i.fa-smile')) {
                btn.addEventListener('click', showEmojiPicker);
            } else if (btn.querySelector('i.fa-reply')) {
                btn.addEventListener('click', replyToMessage);
            }
        });

        // Simulate receiving a message after 5 seconds
        setTimeout(() => {
            receiveMessage({
                id: 'msg-' + Date.now(),
                sender: {
                    id: 'user-elena',
                    name: 'Elena García',
                    avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=50&h=50&crop=faces&auto=format&fit=crop'
                },
                text: 'I think we can improve the UI by changing the color scheme to be more accessible.',
                timestamp: new Date(),
                isTranslated: false
            });
        }, 5000);

        // Initialize end-to-end encryption
        initEncryption();
    }

    /**
     * Toggle mobile navigation
     */
    function toggleMobileNav() {
        activeMobileNav = !activeMobileNav;

        if (activeMobileNav) {
            sidebar.classList.add('active');
        } else {
            sidebar.classList.remove('active');
        }
    }

    /**
     * Toggle info panel visibility
     */
    function toggleInfoPanel() {
        infoPanelActive = !infoPanelActive;

        if (window.innerWidth <= 1200) {
            infoPanel.classList.toggle('active', infoPanelActive);
        } else {
            infoPanel.style.display = infoPanelActive ? 'flex' : 'none';
        }
    }

    /**
     * Handle typing in the message input
     */
    function handleTyping() {
        if (!isTyping) {
            isTyping = true;
            // In a real app, send typing indicator to the server
            console.log('User started typing...');
        }

        clearTimeout(typingTimeout);

        typingTimeout = setTimeout(() => {
            isTyping = false;
            // In a real app, send stopped typing to the server
            console.log('User stopped typing...');
        }, 1000);
    }

    /**
     * Handle keydown in the message input
     */
    function handleMessageInputKeydown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    /**
     * Handle search input
     */
    function handleSearch() {
        const query = searchInput.value.toLowerCase();
        // In a real app, this would search through messages and conversations
        console.log('Searching for:', query);
    }

    /**
     * Send a message
     */
    function sendMessage() {
        const text = composerInput.value.trim();

        if (!text) return;

        const messageId = 'msg-' + Date.now();
        const timestamp = new Date();

        // Create message object
        const message = {
            id: messageId,
            sender: currentUser,
            text: text,
            timestamp: timestamp
        };

        // Add message to UI
        addMessageToUI(message);

        // Clear input
        composerInput.value = '';
        composerInput.style.height = 'auto';

        // Reset typing
        clearTimeout(typingTimeout);
        isTyping = false;

        // In a real app, send message to server
        console.log('Sending message:', message);

        // Simulate receiving a response after 1-3 seconds
        const responseDelay = Math.random() * 2000 + 1000;
        setTimeout(() => {
            // Show typing indicator
            showTypingIndicator({
                id: 'user-michael',
                name: 'Michael Chen',
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=30&h=30&crop=faces&auto=format&fit=crop'
            });

            // Then show the message after a short delay
            setTimeout(() => {
                hideTypingIndicator();

                receiveMessage({
                    id: 'msg-' + Date.now(),
                    sender: {
                        id: 'user-michael',
                        name: 'Michael Chen',
                        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=50&h=50&crop=faces&auto=format&fit=crop'
                    },
                    text: 'Great point! Let me review the changes you suggested.',
                    timestamp: new Date(),
                    isTranslated: false
                });
            }, 1500);
        }, responseDelay);
    }

    /**
     * Add a message to the UI
     */
    function addMessageToUI(message) {
        const messageList = document.querySelector('.message-list');
        const messageEl = document.createElement('div');
        messageEl.className = 'message';
        messageEl.dataset.id = message.id;

        // Format time
        const formattedTime = formatTime(message.timestamp);

        // Check if we need a new date separator
        const needsDateSeparator = checkIfNeedsDateSeparator(message.timestamp);
        if (needsDateSeparator) {
            const separator = document.createElement('div');
            separator.className = 'date-separator';
            separator.innerHTML = `<span>${formatDate(message.timestamp)}</span>`;
            messageList.appendChild(separator);
        }

        // HTML for the message
        messageEl.innerHTML = `
            <div class="message-avatar">
                <img src="${message.sender.avatar}" alt="${message.sender.name}">
            </div>
            <div class="message-content">
                <div class="message-sender">
                    <span class="sender-name">${message.sender.name}</span>
                    <span class="message-time">${formattedTime}</span>
                </div>
                <div class="message-text">
                    ${message.text}
                </div>
                <div class="message-actions">
                    <button class="message-action-btn">
                        <i class="fas fa-smile"></i>
                    </button>
                    <button class="message-action-btn">
                        <i class="fas fa-reply"></i>
                    </button>
                    <button class="message-action-btn">
                        <i class="fas fa-ellipsis-h"></i>
                    </button>
                </div>
            </div>
        `;

        // Add message to list
        messageList.appendChild(messageEl);

        // Scroll to bottom
        messageList.scrollTop = messageList.scrollHeight;

        // Add event listeners to message actions
        const reactionBtn = messageEl.querySelector('.message-action-btn:first-child');
        const replyBtn = messageEl.querySelector('.message-action-btn:nth-child(2)');

        if (reactionBtn) {
            reactionBtn.addEventListener('click', showEmojiPicker);
        }

        if (replyBtn) {
            replyBtn.addEventListener('click', replyToMessage);
        }

        // Update last message time
        lastMessageTime = message.timestamp;
    }

    /**
     * Receive a message from another user
     */
    function receiveMessage(message) {
        // Translate message if needed
        if (message.isTranslated) {
            translateMessage(message);
        } else {
            // 20% chance to simulate a message that needs translation
            if (Math.random() < 0.2 && message.sender.id === 'user-elena') {
                message.originalText = message.text;
                message.text = 'Creo que podemos mejorar la UI cambiando la paleta de colores para que sea más accesible.';
                message.isTranslated = true;
                translateMessage(message);
                return;
            }

            addMessageToUI(message);
        }

        // Update conversation list
        updateLastMessage(message);
    }

    /**
     * Translate a message
     */
    function translateMessage(message) {
        // Simulate translation delay
        setTimeout(() => {
            const messageList = document.querySelector('.message-list');
            const messageEl = document.createElement('div');
            messageEl.className = 'message translated';
            messageEl.dataset.id = message.id;

            // Format time
            const formattedTime = formatTime(message.timestamp);

            // Check if we need a new date separator
            const needsDateSeparator = checkIfNeedsDateSeparator(message.timestamp);
            if (needsDateSeparator) {
                const separator = document.createElement('div');
                separator.className = 'date-separator';
                separator.innerHTML = `<span>${formatDate(message.timestamp)}</span>`;
                messageList.appendChild(separator);
            }

            // HTML for the translated message
            messageEl.innerHTML = `
                <div class="message-avatar">
                    <img src="${message.sender.avatar}" alt="${message.sender.name}">
                </div>
                <div class="message-content">
                    <div class="message-sender">
                        <span class="sender-name">${message.sender.name}</span>
                        <span class="message-time">${formattedTime}</span>
                    </div>
                    <div class="message-text">
                        <div class="original-message">
                            ${message.text}
                        </div>
                        <div class="translated-message">
                            <div class="translation-info">
                                <span>Translated from Spanish</span>
                                <button class="show-original-btn">Show original</button>
                            </div>
                            ${message.originalText}
                        </div>
                    </div>
                    <div class="message-actions">
                        <button class="message-action-btn">
                            <i class="fas fa-smile"></i>
                        </button>
                        <button class="message-action-btn">
                            <i class="fas fa-reply"></i>
                        </button>
                        <button class="message-action-btn">
                            <i class="fas fa-ellipsis-h"></i>
                        </button>
                    </div>
                </div>
            `;

            // Add message to list
            messageList.appendChild(messageEl);

            // Scroll to bottom
            messageList.scrollTop = messageList.scrollHeight;

            // Add event listeners
            const showOriginalBtn = messageEl.querySelector('.show-original-btn');
            if (showOriginalBtn) {
                showOriginalBtn.addEventListener('click', toggleTranslation);
            }

            // Add event listeners to message actions
            const reactionBtn = messageEl.querySelector('.message-action-btn:first-child');
            const replyBtn = messageEl.querySelector('.message-action-btn:nth-child(2)');

            if (reactionBtn) {
                reactionBtn.addEventListener('click', showEmojiPicker);
            }

            if (replyBtn) {
                replyBtn.addEventListener('click', replyToMessage);
            }

            // Update last message time
            lastMessageTime = message.timestamp;
        }, 800); // Simulate translation delay
    }

    /**
     * Toggle between original and translated message
     */
    function toggleTranslation() {
        const messageEl = this.closest('.message');
        const originalMessage = messageEl.querySelector('.original-message');
        const translatedMessage = messageEl.querySelector('.translated-message');

        if (originalMessage.style.display === 'block') {
            originalMessage.style.display = 'none';
            translatedMessage.style.display = 'block';
            this.textContent = 'Show original';
        } else {
            originalMessage.style.display = 'block';
            translatedMessage.style.display = 'none';
            this.textContent = 'Show translation';
        }
    }

    /**
     * Show emoji picker for reaction
     */
    function showEmojiPicker() {
        const messageEl = this.closest('.message');

        // In a real app, this would show an emoji picker
        // For this demo, just add a random reaction
        const emojis = ['👍', '❤️', '😊', '🎉', '👏', '🔥', '😂', '🚀'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        addReaction(messageEl, randomEmoji);
    }

    /**
     * Add a reaction to a message
     */
    function addReaction(messageEl, emoji) {
        let reactionsContainer = messageEl.querySelector('.message-reactions');

        if (!reactionsContainer) {
            reactionsContainer = document.createElement('div');
            reactionsContainer.className = 'message-reactions';
            messageEl.querySelector('.message-content').appendChild(reactionsContainer);
        }

        // Check if reaction already exists
        const existingReaction = Array.from(reactionsContainer.querySelectorAll('.reaction')).find(
            r => r.querySelector('.emoji').textContent === emoji
        );

        if (existingReaction) {
            // Increment count
            const countEl = existingReaction.querySelector('.count');
            const currentCount = parseInt(countEl.textContent, 10);
            countEl.textContent = (currentCount + 1).toString();
        } else {
            // Add new reaction
            const reactionEl = document.createElement('div');
            reactionEl.className = 'reaction';
            reactionEl.innerHTML = `
                <span class="emoji">${emoji}</span>
                <span class="count">1</span>
            `;
            reactionsContainer.appendChild(reactionEl);
        }
    }

    /**
     * Reply to a message
     */
    function replyToMessage() {
        const messageEl = this.closest('.message');
        const senderName = messageEl.querySelector('.sender-name').textContent;
        const messageText = messageEl.querySelector('.message-text').textContent.trim();

        // Set focus to composer and add reply template
        composerInput.focus();
        composerInput.value = `@${senderName} `;

        // Trigger auto-resize
        const event = new Event('input');
        composerInput.dispatchEvent(event);
    }

    /**
     * Show typing indicator
     */
    function showTypingIndicator(user) {
        const messagesContainer = document.querySelector('.messages-container');
        let typingIndicator = document.querySelector('.typing-indicator');

        if (!typingIndicator) {
            typingIndicator = document.createElement('div');
            typingIndicator.className = 'typing-indicator';
            typingIndicator.innerHTML = `
                <div class="typing-avatar">
                    <img src="${user.avatar}" alt="${user.name}">
                </div>
                <div class="typing-text">
                    ${user.name} is typing...
                </div>
            `;
            messagesContainer.appendChild(typingIndicator);
        } else {
            // Update existing indicator
            typingIndicator.innerHTML = `
                <div class="typing-avatar">
                    <img src="${user.avatar}" alt="${user.name}">
                </div>
                <div class="typing-text">
                    ${user.name} is typing...
                </div>
            `;
            typingIndicator.style.display = 'flex';
        }

        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    /**
     * Hide typing indicator
     */
    function hideTypingIndicator() {
        const typingIndicator = document.querySelector('.typing-indicator');
        if (typingIndicator) {
            typingIndicator.style.display = 'none';
        }
    }

    /**
     * Update conversation list with new message
     */
    function updateLastMessage(message) {
        const conversationItem = document.querySelector(`.conversation-item[data-id="${currentConversation}"]`);
        if (conversationItem) {
            const lastMessageEl = conversationItem.querySelector('.conversation-last-message');
            if (lastMessageEl) {
                lastMessageEl.textContent = `${message.sender.name}: ${message.text.substring(0, 30)}${message.text.length > 30 ? '...' : ''}`;
            }

            const timeEl = conversationItem.querySelector('.conversation-time');
            if (timeEl) {
                timeEl.textContent = formatTime(message.timestamp);
            }
        }
    }

    /**
     * Update chat header based on selected conversation
     */
    function updateChatHeader(conversationItem) {
        const conversationName = conversationItem.querySelector('.conversation-name').textContent;
        const chatName = document.querySelector('.chat-name');

        if (chatName) {
            chatName.textContent = conversationName;
        }
    }

    /**
     * Load messages for a conversation
     */
    function loadMessages(conversationId) {
        // In a real app, this would load messages from the server
        console.log('Loading messages for:', conversationId);

        // Simulate clearing messages and loading new ones
        const messageList = document.querySelector('.message-list');
        messageList.innerHTML = '';

        // Reset last message time
        lastMessageTime = new Date();
    }

    /**
     * Update conversation list based on current view
     */
    function updateConversationList(view) {
        // In a real app, this would load different conversation types
        console.log('Updating conversation list for view:', view);
    }

    /**
     * Filter conversations based on category
     */
    function filterConversations(category) {
        // In a real app, this would filter the conversation list
        console.log('Filtering conversations by category:', category);
    }

    /**
     * Check if we need a new date separator
     */
    function checkIfNeedsDateSeparator(timestamp) {
        const lastDate = lastMessageTime.toDateString();
        const currentDate = new Date(timestamp).toDateString();

        return lastDate !== currentDate;
    }

    /**
     * Format timestamp to time string
     */
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    /**
     * Format timestamp to date string
     */
    function formatDate(timestamp) {
        const date = new Date(timestamp);
        const today = new Date().toDateString();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return date.toLocaleDateString();
        }
    }

    /**
     * Initialize end-to-end encryption (simulation)
     */
    function initEncryption() {
        console.log('Initializing end-to-end encryption');
        // In a real app, this would initialize actual encryption

        // Simulate key exchange
        setTimeout(() => {
            console.log('Encryption keys exchanged successfully');
        }, 1000);
    }

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.innerWidth > 1200) {
            infoPanel.style.display = infoPanelActive ? 'flex' : 'none';
            infoPanel.classList.remove('active');

            if (activeMobileNav) {
                sidebar.classList.remove('active');
                activeMobileNav = false;
            }
        } else {
            infoPanel.style.display = 'none';
            infoPanel.classList.toggle('active', infoPanelActive);
        }
    });
});
