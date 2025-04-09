/**
 * Expert Messaging System for Service Marketplace
 * Handles expert-client communication
 */

// Messaging state management
const messageState = {
  expertData: null,
  clients: [],
  selectedClient: null,
  conversations: {},  // Maps clientId -> array of messages
  searchTerm: ''
};

// Initialize the messaging system
document.addEventListener('DOMContentLoaded', () => {
  // Check if expert is logged in
  const expertData = JSON.parse(localStorage.getItem('expertData') || '{}');
  if (!expertData.token) {
    // Redirect to login if not logged in
    window.location.href = '/expert-login.html';
    return;
  }

  // Store expert data
  messageState.expertData = expertData;

  // Update UI with expert data
  document.getElementById('expert-avatar').src = expertData.profilePicture || '/uploads/default-avatar.png';
  document.getElementById('expert-name').textContent = expertData.name || 'Expert';

  // Load mock data for demonstration
  loadMockData();

  // Set up event listeners
  setupEventListeners();
});

// Load mock data for clients and conversations
function loadMockData() {
  // Create mock clients
  const mockClients = [
    {
      id: 'client-1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      avatar: '/uploads/default-avatar.png',
      lastSeen: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
      status: 'online',
      unreadCount: 3
    },
    {
      id: 'client-2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      avatar: '/uploads/default-avatar.png',
      lastSeen: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      status: 'offline',
      unreadCount: 0
    },
    {
      id: 'client-3',
      name: 'Michael Brown',
      email: 'michael.brown@example.com',
      avatar: '/uploads/default-avatar.png',
      lastSeen: new Date(Date.now() - 15 * 60000).toISOString(), // 15 minutes ago
      status: 'offline',
      unreadCount: 0
    },
    {
      id: 'client-4',
      name: 'Jessica Lee',
      email: 'jessica.lee@example.com',
      avatar: '/uploads/default-avatar.png',
      lastSeen: new Date(Date.now() - 30 * 60000).toISOString(), // 30 minutes ago
      status: 'offline',
      unreadCount: 1
    },
    {
      id: 'client-5',
      name: 'David Wilson',
      email: 'david.wilson@example.com',
      avatar: '/uploads/default-avatar.png',
      lastSeen: new Date(Date.now() - 2 * 24 * 3600000).toISOString(), // 2 days ago
      status: 'offline',
      unreadCount: 0
    }
  ];

  // Store clients in state
  messageState.clients = mockClients;

  // Create mock conversations
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const twoDaysAgoDate = new Date();
  twoDaysAgoDate.setDate(twoDaysAgoDate.getDate() - 2);

  // Conversation with John Smith (client-1)
  messageState.conversations['client-1'] = [
    {
      id: 'msg-1-1',
      clientId: 'client-1',
      type: 'incoming',
      content: 'Hello, I would like to schedule a consultation about my diet plan',
      timestamp: twoDaysAgoDate.setHours(10, 30).toISOString(),
      read: true
    },
    {
      id: 'msg-1-2',
      clientId: 'client-1',
      type: 'outgoing',
      content: 'Hi John, I would be happy to help. I have availability next week on Monday or Wednesday. Would either of those days work for you?',
      timestamp: twoDaysAgoDate.setHours(11, 15).toISOString(),
      read: true
    },
    {
      id: 'msg-1-3',
      clientId: 'client-1',
      type: 'incoming',
      content: 'Wednesday would be perfect. Do you have any openings in the afternoon?',
      timestamp: twoDaysAgoDate.setHours(13, 45).toISOString(),
      read: true
    },
    {
      id: 'msg-1-4',
      clientId: 'client-1',
      type: 'outgoing',
      content: 'Yes, I have slots available at 2:00 PM or 4:30 PM. Which would you prefer?',
      timestamp: twoDaysAgoDate.setHours(14, 20).toISOString(),
      read: true
    },
    {
      id: 'msg-1-5',
      clientId: 'client-1',
      type: 'incoming',
      content: '2:00 PM works great for me!',
      timestamp: yesterdayDate.setHours(9, 10).toISOString(),
      read: true
    },
    {
      id: 'msg-1-6',
      clientId: 'client-1',
      type: 'outgoing',
      content: 'Perfect! I have you scheduled for Wednesday at 2:00 PM. Before our session, could you please fill out the initial assessment form I\'ll be sending to your email?',
      timestamp: yesterdayDate.setHours(10, 5).toISOString(),
      read: true
    },
    {
      id: 'msg-1-7',
      clientId: 'client-1',
      type: 'incoming',
      content: 'Sure, I\'ll keep an eye out for that email.',
      timestamp: yesterdayDate.setHours(10, 30).toISOString(),
      read: true
    },
    {
      id: 'msg-1-8',
      clientId: 'client-1',
      type: 'incoming',
      content: 'Hello again, I filled out the form but had some questions about my current diet...',
      timestamp: new Date(Date.now() - 65 * 60000).toISOString(), // 65 minutes ago
      read: false
    },
    {
      id: 'msg-1-9',
      clientId: 'client-1',
      type: 'incoming',
      content: 'Should I be logging everything I eat before our consultation?',
      timestamp: new Date(Date.now() - 64 * 60000).toISOString(), // 64 minutes ago
      read: false
    },
    {
      id: 'msg-1-10',
      clientId: 'client-1',
      type: 'incoming',
      content: 'Also, I have a family event on Wednesday, is it possible to reschedule to Thursday?',
      timestamp: new Date(Date.now() - 5 * 60000).toISOString(), // 5 minutes ago
      read: false
    }
  ];

  // Conversation with Sarah Johnson (client-2)
  messageState.conversations['client-2'] = [
    {
      id: 'msg-2-1',
      clientId: 'client-2',
      type: 'incoming',
      content: 'I saw your profile and I\'m interested in scheduling a consultation. Do you have any availability this week?',
      timestamp: yesterdayDate.setHours(15, 20).toISOString(),
      read: true
    },
    {
      id: 'msg-2-2',
      clientId: 'client-2',
      type: 'outgoing',
      content: 'Hi Sarah, thank you for your interest! I have availability this Thursday and Friday. Would either of those days work for you?',
      timestamp: yesterdayDate.setHours(16, 0).toISOString(),
      read: true
    },
    {
      id: 'msg-2-3',
      clientId: 'client-2',
      type: 'incoming',
      content: 'Friday would be great. What time slots do you have?',
      timestamp: yesterdayDate.setHours(16, 45).toISOString(),
      read: true
    },
    {
      id: 'msg-2-4',
      clientId: 'client-2',
      type: 'outgoing',
      content: 'On Friday, I have availability at 10:00 AM, 1:30 PM, and 3:00 PM. Let me know what works best for you!',
      timestamp: yesterdayDate.setHours(17, 15).toISOString(),
      read: true
    }
  ];

  // Conversation with Jessica Lee (client-4)
  messageState.conversations['client-4'] = [
    {
      id: 'msg-4-1',
      clientId: 'client-4',
      type: 'incoming',
      content: 'Hi there! I\'ve been following your work and would love to get some personalized advice.',
      timestamp: twoDaysAgoDate.setHours(14, 30).toISOString(),
      read: true
    },
    {
      id: 'msg-4-2',
      clientId: 'client-4',
      type: 'outgoing',
      content: 'Hello Jessica! Thank you for reaching out. I'd be happy to help. What specifically are you looking for assistance with?',
      timestamp: twoDaysAgoDate.setHours(15, 10).toISOString(),
      read: true
    },
    {
      id: 'msg-4-3',
      clientId: 'client-4',
      type: 'incoming',
      content: 'I\'m trying to improve my diet while training for a half marathon. I\'ve been feeling low on energy during my longer runs.',
      timestamp: twoDaysAgoDate.setHours(16, 5).toISOString(),
      read: true
    },
    {
      id: 'msg-4-4',
      clientId: 'client-4',
      type: 'outgoing',
      content: 'That\'s a common issue for runners. We can definitely work on a nutrition plan specifically tailored for your training. Would you like to schedule a full consultation?',
      timestamp: twoDaysAgoDate.setHours(16, 20).toISOString(),
      read: true
    },
    {
      id: 'msg-4-5',
      clientId: 'client-4',
      type: 'incoming',
      content: 'Yes, that would be great! How does your scheduling work?',
      timestamp: new Date(Date.now() - 45 * 60000).toISOString(), // 45 minutes ago
      read: false
    }
  ];

  // Display client list
  displayClientList();
}

// Set up event listeners
function setupEventListeners() {
  // Search clients
  const searchInput = document.getElementById('search-clients');
  searchInput.addEventListener('input', function() {
    messageState.searchTerm = this.value.toLowerCase();
    displayClientList();
  });

  // Send message
  const sendButton = document.getElementById('send-message-btn');
  const messageInput = document.getElementById('message-input');

  sendButton.addEventListener('click', sendMessage);

  messageInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Handle textarea auto resize
  messageInput.addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = (this.scrollHeight) + 'px';
  });
}

// Display client list with filtering
function displayClientList() {
  const clientsList = document.getElementById('clients-list');
  const filteredClients = messageState.clients.filter(client => {
    if (!messageState.searchTerm) return true;

    return client.name.toLowerCase().includes(messageState.searchTerm) ||
           client.email.toLowerCase().includes(messageState.searchTerm);
  });

  // Sort clients by unread messages first, then by most recent message
  filteredClients.sort((a, b) => {
    // First sort by unread count
    if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
    if (a.unreadCount === 0 && b.unreadCount > 0) return 1;

    // Then sort by most recent message
    const aMessages = messageState.conversations[a.id] || [];
    const bMessages = messageState.conversations[b.id] || [];

    const aLatest = aMessages.length > 0 ? new Date(aMessages[aMessages.length - 1].timestamp) : new Date(0);
    const bLatest = bMessages.length > 0 ? new Date(bMessages[bMessages.length - 1].timestamp) : new Date(0);

    return bLatest - aLatest;
  });

  // Clear list
  clientsList.innerHTML = '';

  // Create client items
  filteredClients.forEach(client => {
    const clientItem = document.createElement('div');
    clientItem.className = `client-item ${messageState.selectedClient && messageState.selectedClient.id === client.id ? 'active' : ''}`;
    clientItem.dataset.clientId = client.id;

    // Get last message for preview
    const clientMessages = messageState.conversations[client.id] || [];
    const lastMessage = clientMessages.length > 0 ? clientMessages[clientMessages.length - 1] : null;

    // Calculate time display
    let timeDisplay = '';
    if (lastMessage) {
      const messageDate = new Date(lastMessage.timestamp);
      const now = new Date();
      const diffMinutes = Math.floor((now - messageDate) / 60000);
      const diffHours = Math.floor(diffMinutes / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMinutes < 60) {
        timeDisplay = `${diffMinutes}m ago`;
      } else if (diffHours < 24) {
        timeDisplay = `${diffHours}h ago`;
      } else {
        timeDisplay = `${diffDays}d ago`;
      }
    }

    // Create client item HTML
    clientItem.innerHTML = `
      <img src="${client.avatar}" alt="${client.name}" class="client-avatar">
      <div class="client-info">
        <div class="client-name">
          ${client.name}
          ${lastMessage ? `<span class="client-time">${timeDisplay}</span>` : ''}
        </div>
        <div class="client-preview">
          ${lastMessage ?
            (lastMessage.type === 'outgoing' ? 'You: ' : '') +
            lastMessage.content.substring(0, 40) +
            (lastMessage.content.length > 40 ? '...' : '') :
            'No messages yet'}
        </div>
      </div>
      ${client.unreadCount > 0 ? `<div class="unread-badge">${client.unreadCount}</div>` : ''}
    `;

    // Add click event to select client
    clientItem.addEventListener('click', () => {
      selectClient(client);
    });

    clientsList.appendChild(clientItem);
  });

  // Show empty state if no clients
  if (filteredClients.length === 0) {
    clientsList.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #7f8c8d;">
        No clients found
      </div>
    `;
  }
}

// Select a client to view conversation
function selectClient(client) {
  // Update selected client
  messageState.selectedClient = client;

  // Update UI
  document.querySelectorAll('.client-item').forEach(item => {
    item.classList.remove('active');
  });

  const clientItem = document.querySelector(`.client-item[data-client-id="${client.id}"]`);
  if (clientItem) {
    clientItem.classList.add('active');
  }

  // Hide empty state
  document.getElementById('empty-state').style.display = 'none';

  // Show chat interface
  document.getElementById('chat-interface').style.display = 'flex';

  // Update chat header
  updateChatHeader(client);

  // Load and display conversation
  displayConversation(client);

  // Mark messages as read
  markMessagesAsRead(client.id);
}

// Update chat header with client information
function updateChatHeader(client) {
  const chatHeader = document.getElementById('chat-header');

  const statusText = client.status === 'online' ? 'Online' :
    `Last seen ${formatLastSeen(client.lastSeen)}`;

  chatHeader.innerHTML = `
    <div class="chat-header-info">
      <img src="${client.avatar}" alt="${client.name}" class="chat-client-avatar">
      <div class="chat-client-details">
        <div class="chat-client-name">${client.name}</div>
        <div class="chat-client-status">
          <span class="status-indicator ${client.status === 'online' ? 'status-online' : 'status-offline'}"></span>
          ${statusText}
        </div>
      </div>
    </div>
    <div class="chat-header-actions">
      <button title="Video Call">
        <i class="fas fa-video"></i>
      </button>
      <button title="Audio Call">
        <i class="fas fa-phone-alt"></i>
      </button>
      <button title="View Profile">
        <i class="fas fa-user"></i>
      </button>
    </div>
  `;
}

// Format last seen time
function formatLastSeen(isoTimestamp) {
  const lastSeen = new Date(isoTimestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now - lastSeen) / 60000);

  if (diffMinutes < 1) {
    return 'just now';
  } else if (diffMinutes < 60) {
    return `${diffMinutes} ${diffMinutes === 1 ? 'minute' : 'minutes'} ago`;
  } else if (diffMinutes < 24 * 60) {
    const hours = Math.floor(diffMinutes / 60);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else {
    const days = Math.floor(diffMinutes / (24 * 60));
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
}

// Display conversation with a client
function displayConversation(client) {
  const chatMessages = document.getElementById('chat-messages');
  chatMessages.innerHTML = '';

  const messages = messageState.conversations[client.id] || [];

  if (messages.length === 0) {
    chatMessages.innerHTML = `
      <div style="text-align: center; padding: 20px; color: #7f8c8d;">
        No messages yet. Start the conversation!
      </div>
    `;
    return;
  }

  // Group messages by date
  const groupedMessages = groupMessagesByDate(messages);

  // Check if client has upcoming appointment
  const hasUpcomingAppointment = Math.random() > 0.5; // Just for demo purposes

  if (hasUpcomingAppointment) {
    // Add upcoming appointment notice
    const appointmentElement = document.createElement('div');
    appointmentElement.className = 'upcoming-appointment';
    appointmentElement.innerHTML = `
      <div class="appointment-icon">
        <i class="far fa-calendar-check"></i>
      </div>
      <div class="appointment-details">
        <div class="appointment-title">Upcoming Consultation</div>
        <div class="appointment-info">Wednesday, March 27, 2025 at 2:00 PM (60 minutes)</div>
        <div class="appointment-info">Initial Consultation</div>
        <div class="appointment-buttons">
          <button class="appointment-btn secondary">Reschedule</button>
          <button class="appointment-btn primary">Send Reminder</button>
        </div>
      </div>
    `;
    chatMessages.appendChild(appointmentElement);
  }

  // Display messages by date groups
  for (const [date, messagesForDate] of Object.entries(groupedMessages)) {
    // Add date divider
    const dateDivider = document.createElement('div');
    dateDivider.className = 'date-divider';
    dateDivider.textContent = date;
    chatMessages.appendChild(dateDivider);

    // Add messages for this date
    messagesForDate.forEach(message => {
      const messageElement = document.createElement('div');
      messageElement.className = `message ${message.type}`;

      // Format timestamp
      const messageTime = new Date(message.timestamp);
      const formattedTime = messageTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });

      messageElement.innerHTML = `
        <div class="message-content">${message.content}</div>
        <div class="message-time">
          ${formattedTime}
          ${message.type === 'outgoing' && message.read ? '<i class="fas fa-check-double" style="margin-left: 5px; font-size: 10px;"></i>' : ''}
        </div>
      `;

      chatMessages.appendChild(messageElement);
    });
  }

  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;

  // Focus message input
  document.getElementById('message-input').focus();
}

// Group messages by date
function groupMessagesByDate(messages) {
  const groups = {};

  messages.forEach(message => {
    const messageDate = new Date(message.timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let dateKey;

    if (messageDate.toDateString() === today.toDateString()) {
      dateKey = 'Today';
    } else if (messageDate.toDateString() === yesterday.toDateString()) {
      dateKey = 'Yesterday';
    } else {
      dateKey = messageDate.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });
    }

    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }

    groups[dateKey].push(message);
  });

  return groups;
}

// Mark messages as read
function markMessagesAsRead(clientId) {
  const conversation = messageState.conversations[clientId] || [];
  let unreadCount = 0;

  // Mark all incoming messages as read
  conversation.forEach(message => {
    if (message.type === 'incoming' && !message.read) {
      message.read = true;
    }
  });

  // Update client's unread count
  const client = messageState.clients.find(c => c.id === clientId);
  if (client) {
    client.unreadCount = 0;

    // Update client list to reflect changes
    displayClientList();
  }
}

// Send a new message
function sendMessage() {
  const messageInput = document.getElementById('message-input');
  const content = messageInput.value.trim();

  if (!content || !messageState.selectedClient) return;

  // Create new message
  const newMessage = {
    id: `msg-${Date.now()}`,
    clientId: messageState.selectedClient.id,
    type: 'outgoing',
    content: content,
    timestamp: new Date().toISOString(),
    read: false
  };

  // Add to conversation
  if (!messageState.conversations[messageState.selectedClient.id]) {
    messageState.conversations[messageState.selectedClient.id] = [];
  }
  messageState.conversations[messageState.selectedClient.id].push(newMessage);

  // Clear input
  messageInput.value = '';
  messageInput.style.height = 'auto';

  // Update UI
  displayConversation(messageState.selectedClient);
  displayClientList(); // Update the message preview

  // For demo purposes, add a simulated response after a delay if the client is "John Smith"
  if (messageState.selectedClient.id === 'client-1') {
    // Show typing indicator
    setTimeout(showTypingIndicator, 1000);

    // Add response after delay
    setTimeout(() => {
      addMockResponse(messageState.selectedClient.id);
    }, 3000);
  }
}

// Show typing indicator
function showTypingIndicator() {
  const chatMessages = document.getElementById('chat-messages');

  // Create typing indicator element if it doesn't exist
  let typingIndicator = document.getElementById('typing-indicator');
  if (!typingIndicator) {
    typingIndicator = document.createElement('div');
    typingIndicator.id = 'typing-indicator';
    typingIndicator.className = 'typing-indicator';
    typingIndicator.innerHTML = `
      <div class="typing-animation">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
      <span>${messageState.selectedClient.name} is typing...</span>
    `;
    chatMessages.appendChild(typingIndicator);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
}

// Hide typing indicator
function hideTypingIndicator() {
  const typingIndicator = document.getElementById('typing-indicator');
  if (typingIndicator) {
    typingIndicator.remove();
  }
}

// Add a mock response from the client
function addMockResponse(clientId) {
  // Hide typing indicator
  hideTypingIndicator();

  // Random responses for demo
  const responses = [
    "That sounds good to me, thank you!",
    "Great, I appreciate your help with this.",
    "Perfect! I'll make a note of that.",
    "Thanks for the quick response!",
    "I understand, that makes sense.",
    "Could you clarify that a bit more?",
    "I have another question about that...",
    "When would be a good time to follow up?",
    "That works for my schedule.",
    "I'll send over those details shortly."
  ];

  const randomResponse = responses[Math.floor(Math.random() * responses.length)];

  // Create response message
  const responseMessage = {
    id: `msg-${Date.now()}`,
    clientId: clientId,
    type: 'incoming',
    content: randomResponse,
    timestamp: new Date().toISOString(),
    read: true // Automatically mark as read since we're in the conversation
  };

  // Add to conversation
  messageState.conversations[clientId].push(responseMessage);

  // Update UI
  if (messageState.selectedClient && messageState.selectedClient.id === clientId) {
    displayConversation(messageState.selectedClient);
  }

  // Update client list
  displayClientList();
}
