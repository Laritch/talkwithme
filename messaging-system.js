// Messaging System JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeMessaging();
    initializeNewMessageModal();
});

// Initialize messaging functionality
function initializeMessaging() {
    // Toggle conversation selection
    const conversations = document.querySelectorAll('.conversation');
    conversations.forEach(conversation => {
        conversation.addEventListener('click', function() {
            // Remove active class from all conversations
            conversations.forEach(c => c.classList.remove('active'));

            // Add active class to clicked conversation
            this.classList.add('active');

            // Get conversation ID for future API calls
            const conversationId = this.getAttribute('data-id');

            // Mark as read (remove unread badge)
            const unreadBadge = this.querySelector('.meta-badge.unread');
            if (unreadBadge) {
                unreadBadge.remove();
            }

            // In a real application, fetch conversation data
            console.log(`Selected conversation: ${conversationId}`);

            // Update mobile view to show message panel on small screens
            if (window.innerWidth < 768) {
                document.querySelector('.conversations-sidebar').classList.remove('active');
                document.querySelector('.message-panel').style.display = 'flex';
            }
        });
    });

    // Initialize conversation filters
    const filterButtons = document.querySelectorAll('.filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Remove active class from all filter buttons
            filterButtons.forEach(btn => btn.classList.remove('active'));

            // Add active class to clicked button
            this.classList.add('active');

            // Get filter type
            const filterType = this.getAttribute('data-filter');

            // Filter conversations
            filterConversations(filterType);
        });
    });

    // Initialize search functionality
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            searchConversations(searchTerm);
        });
    }

    // Initialize message composer
    const messageTextarea = document.querySelector('.composer-input textarea');
    const sendButton = document.querySelector('.btn-send');

    if (messageTextarea && sendButton) {
        // Auto-resize textarea
        messageTextarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = (this.scrollHeight) + 'px';
            if (this.scrollHeight > 150) {
                this.style.height = '150px';
            }
        });

        // Allow sending with Enter (but Shift+Enter for new line)
        messageTextarea.addEventListener('keydown', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });

        // Send button click
        sendButton.addEventListener('click', sendMessage);
    }

    // Initialize client sidebar toggle for mobile
    const clientInfoToggle = document.querySelector('.conversation-actions button[title="View Profile"]');
    if (clientInfoToggle) {
        clientInfoToggle.addEventListener('click', function() {
            const clientSidebar = document.querySelector('.client-sidebar');
            clientSidebar.classList.toggle('active');
        });
    }

    // Close client sidebar on mobile
    const sidebarCloseBtn = document.querySelector('.sidebar-close-mobile .btn-icon');
    if (sidebarCloseBtn) {
        sidebarCloseBtn.addEventListener('click', function() {
            document.querySelector('.client-sidebar').classList.remove('active');
        });
    }

    // Mobile navigation
    const mobileToggle = document.querySelector('.message-header:before');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', function() {
            document.querySelector('.conversations-sidebar').classList.add('active');
            document.querySelector('.message-panel').style.display = 'none';
        });
    }

    // Save client notes
    const saveNotesBtn = document.querySelector('.notes-editor .btn');
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', function() {
            const notes = document.querySelector('.notes-editor textarea').value;
            // In a real application, save to API
            console.log('Saving notes:', notes);
            alert('Notes saved successfully');
        });
    }
}

// Filter conversations based on filter type
function filterConversations(filterType) {
    const conversations = document.querySelectorAll('.conversation');

    conversations.forEach(conversation => {
        const hasUnread = conversation.querySelector('.meta-badge.unread') !== null;
        const isBooked = conversation.querySelector('.meta-item i.fa-calendar-check') !== null;

        switch(filterType) {
            case 'unread':
                conversation.style.display = hasUnread ? 'flex' : 'none';
                break;
            case 'bookings':
                conversation.style.display = isBooked ? 'flex' : 'none';
                break;
            case 'archived':
                // In this demo, we don't have archived conversations
                conversation.style.display = 'none';
                break;
            case 'all':
            default:
                conversation.style.display = 'flex';
                break;
        }
    });
}

// Search conversations based on search term
function searchConversations(searchTerm) {
    const conversations = document.querySelectorAll('.conversation');

    if (searchTerm === '') {
        conversations.forEach(conversation => {
            conversation.style.display = 'flex';
        });
        return;
    }

    conversations.forEach(conversation => {
        const name = conversation.querySelector('.conversation-header h3').textContent.toLowerCase();
        const preview = conversation.querySelector('.conversation-preview p').textContent.toLowerCase();

        if (name.includes(searchTerm) || preview.includes(searchTerm)) {
            conversation.style.display = 'flex';
        } else {
            conversation.style.display = 'none';
        }
    });
}

// Send a new message
function sendMessage() {
    const messageTextarea = document.querySelector('.composer-input textarea');
    const messageText = messageTextarea.value.trim();

    if (messageText === '') return;

    // Create a new message element
    const messageHistory = document.querySelector('.message-history');
    const newMessage = document.createElement('div');
    newMessage.className = 'message sent';

    // Current time for message timestamp
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    newMessage.innerHTML = `
        <div class="message-content">
            <div class="message-bubble">
                <p>${formatMessageText(messageText)}</p>
            </div>
            <div class="message-time">${timeString}</div>
        </div>
    `;

    // Add the new message to the chat
    messageHistory.appendChild(newMessage);

    // Clear textarea and reset height
    messageTextarea.value = '';
    messageTextarea.style.height = 'auto';

    // Scroll to bottom
    messageHistory.scrollTop = messageHistory.scrollHeight;

    // In a real application, send to API
    console.log('Sending message:', messageText);

    // Simulate a response after a short delay
    setTimeout(() => {
        simulateResponse();
    }, 2000);
}

// Format message text (handle line breaks, links, etc.)
function formatMessageText(text) {
    // Convert line breaks to <br>
    text = text.replace(/\n/g, '<br>');

    // Convert URLs to clickable links
    text = text.replace(
        /(https?:\/\/[^\s]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    return text;
}

// Simulate a response message
function simulateResponse() {
    const messageHistory = document.querySelector('.message-history');
    const newMessage = document.createElement('div');
    newMessage.className = 'message received';

    // Current time for message timestamp
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const responses = [
        "Thanks for the information! I'll review it and get back to you.",
        "Got it! Looking forward to our call tomorrow.",
        "Perfect, I'll prepare some materials for our session.",
        "Great! I'm excited to help you with your business goals.",
        "Thanks for sharing those details. I'll tailor my approach to your specific needs."
    ];

    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    newMessage.innerHTML = `
        <div class="message-avatar">
            <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330" alt="Emily Davis">
        </div>
        <div class="message-content">
            <div class="message-bubble">
                <p>${randomResponse}</p>
            </div>
            <div class="message-time">${timeString}</div>
        </div>
    `;

    // Add the new message to the chat
    messageHistory.appendChild(newMessage);

    // Scroll to bottom
    messageHistory.scrollTop = messageHistory.scrollHeight;
}

// New message modal functionality
function initializeNewMessageModal() {
    const newMessageBtn = document.getElementById('new-message-btn');
    const modal = document.getElementById('new-message-modal');
    const closeModalBtn = modal.querySelector('.close-modal');

    // Open modal
    newMessageBtn.addEventListener('click', function() {
        modal.style.display = 'flex';
    });

    // Close modal
    closeModalBtn.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    // Close when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Template responses
    const templateButtons = document.querySelectorAll('.template-option');
    const messageBody = document.getElementById('message-body');

    templateButtons.forEach(button => {
        button.addEventListener('click', function() {
            const templateType = this.textContent;
            let templateText = '';

            switch(templateType) {
                case 'Introduction':
                    templateText = "Hello! I'm [Your Name], a [Your Specialty] expert. I noticed you're interested in my services based on my [Case Study/Profile]. I'd be happy to discuss how I can help you achieve similar results for your business. Let me know if you'd like to schedule a call to discuss your specific needs.";
                    break;
                case 'Follow-up':
                    templateText = "Hi there! I wanted to follow up on our previous conversation about [Topic]. I'm still available to help with [Specific Challenge] and would love to continue our discussion. Let me know if you're still interested or if you have any questions.";
                    break;
                case 'Booking Confirmation':
                    templateText = "I'm confirming our upcoming [Service Type] on [Date] at [Time]. Please prepare [Any Specific Materials/Information] for our session. I'm looking forward to working with you on [Goal/Objective]. Feel free to let me know if you have any questions before our meeting.";
                    break;
                case 'Service Proposal':
                    templateText = "Based on our discussion about your [Challenge/Goal], I'd like to propose my [Service Package] which includes [Key Benefits/Features]. This service is designed to help you [Desired Outcome] within [Timeframe]. The investment for this service is [Price]. Would you like to schedule a call to discuss this further?";
                    break;
            }

            messageBody.value = templateText;
        });
    });

    // Send new message
    const sendButton = modal.querySelector('.btn-primary');
    sendButton.addEventListener('click', function() {
        const recipient = document.getElementById('recipient').value.trim();
        const subject = document.getElementById('message-subject').value.trim();
        const body = document.getElementById('message-body').value.trim();

        if (recipient === '' || body === '') {
            alert('Please enter a recipient and message.');
            return;
        }

        // In a real application, send to API
        console.log('Sending new message:', { recipient, subject, body });

        // Close modal and show confirmation
        modal.style.display = 'none';
        alert(`Message sent to ${recipient}`);
    });
}

// Admin monitoring functionality
const adminMode = {
    enabled: false,
    initialize: function() {
        // Check if user is admin
        const isAdmin = localStorage.getItem('isAdmin') === 'true';
        if (!isAdmin) return;

        this.enabled = true;
        this.addAdminControls();
    },
    addAdminControls: function() {
        // Add admin controls to the UI
        const headerActions = document.querySelector('.conversation-actions');
        if (headerActions) {
            const adminBtn = document.createElement('button');
            adminBtn.className = 'btn-icon admin-mode';
            adminBtn.title = 'Admin: Monitor Mode';
            adminBtn.innerHTML = '<i class="fas fa-shield-alt"></i>';
            headerActions.appendChild(adminBtn);

            // Toggle admin monitoring mode
            adminBtn.addEventListener('click', function() {
                this.classList.toggle('active');
                const isActive = this.classList.contains('active');
                adminMode.toggleMonitoring(isActive);
            });
        }
    },
    toggleMonitoring: function(active) {
        // Toggle monitoring mode
        if (active) {
            alert('Admin monitoring mode activated. Messages in this conversation will be flagged for review.');
            // Apply visual indicator for monitoring
            document.querySelector('.message-header').classList.add('monitoring');
            document.querySelector('.message-header').insertAdjacentHTML('beforeend',
                '<div class="monitoring-banner">Admin Monitoring Active</div>'
            );
        } else {
            alert('Admin monitoring mode deactivated.');
            // Remove visual indicator
            document.querySelector('.message-header').classList.remove('monitoring');
            const banner = document.querySelector('.monitoring-banner');
            if (banner) banner.remove();
        }
    },
    flagMessage: function(messageId) {
        // Flag a message for review
        console.log(`Message ${messageId} flagged for admin review`);

        // In a real application, send to API
        // fetch('/api/admin/flag-message', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ messageId })
        // });
    }
};

// Initialize admin functionality if needed
document.addEventListener('DOMContentLoaded', function() {
    adminMode.initialize();
});
