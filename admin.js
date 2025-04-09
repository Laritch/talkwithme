/**
 * Enhanced Chat System - Admin Features
 * This file contains functionality for the admin panel including
 * user management and content moderation
 */

// Admin Panel State
const adminState = {
  users: [],
  content: [],
  settings: {
    autoModerate: true,
    emailNotifications: true,
    maxUploadSize: 10,
    inactivityTimeout: 10
  },
  modFilters: {
    userFilter: 'all',
    contentFilter: 'all',
    userSearch: '',
    contentSearch: ''
  },
  selectedUser: null,
  selectedContent: null
};

// Initialize Admin Features
export const initAdminFeatures = () => {
  // Only run for admin users
  const userData = JSON.parse(localStorage.getItem('userData') || '{}');
  if (!userData.isAdmin) return;

  // Add event listeners for admin panel
  document.getElementById('create-user-btn').addEventListener('click', openCreateUserModal);
  document.getElementById('save-user-btn').addEventListener('click', saveUserChanges);
  document.getElementById('delete-user-btn').addEventListener('click', deleteUser);
  document.getElementById('close-user-modal').addEventListener('click', closeUserModal);

  document.getElementById('user-filter').addEventListener('change', filterUsers);
  document.getElementById('user-search').addEventListener('input', filterUsers);

  document.getElementById('content-filter').addEventListener('change', filterContent);
  document.getElementById('content-search').addEventListener('input', filterContent);

  document.getElementById('close-content-modal').addEventListener('click', closeContentModal);
  document.getElementById('cancel-moderation-btn').addEventListener('click', closeContentModal);
  document.getElementById('apply-moderation-btn').addEventListener('click', applyModeration);

  document.getElementById('save-settings-btn').addEventListener('click', saveSettings);

  // Initialize toggle and select inputs
  document.getElementById('auto-moderate-toggle').addEventListener('change', function() {
    adminState.settings.autoModerate = this.checked;
  });

  document.getElementById('email-notifications-toggle').addEventListener('change', function() {
    adminState.settings.emailNotifications = this.checked;
  });

  document.getElementById('max-upload-size').addEventListener('change', function() {
    adminState.settings.maxUploadSize = parseInt(this.value);
  });

  document.getElementById('inactivity-timeout').addEventListener('change', function() {
    adminState.settings.inactivityTimeout = parseInt(this.value);
  });
};

// Load Admin Data
export const loadAdminData = async () => {
  try {
    await Promise.all([
      loadUsers(),
      loadContent(),
      loadSettings()
    ]);

    updateAdminStatsDisplay();
  } catch (error) {
    console.error('Error loading admin data:', error);
    showAdminNotification('Failed to load admin data', 'error');
  }
};

// User Management Functions
const loadUsers = async () => {
  try {
    const response = await fetch('/api/users', {
      headers: {
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }

    adminState.users = await response.json();
    renderUserList();
  } catch (error) {
    console.error('Error loading users:', error);
    document.getElementById('admin-user-list').innerHTML = '<div class="error-message">Failed to load users</div>';
  }
};

const renderUserList = () => {
  const userListElement = document.getElementById('admin-user-list');
  const { users, modFilters } = adminState;

  // Apply filters
  let filteredUsers = users;

  if (modFilters.userFilter !== 'all') {
    if (modFilters.userFilter === 'admins') {
      filteredUsers = users.filter(user => user.isAdmin);
    } else {
      filteredUsers = users.filter(user => user.status === modFilters.userFilter);
    }
  }

  if (modFilters.userSearch.trim() !== '') {
    const searchTerm = modFilters.userSearch.toLowerCase();
    filteredUsers = filteredUsers.filter(user =>
      user.username.toLowerCase().includes(searchTerm) ||
      user.email.toLowerCase().includes(searchTerm)
    );
  }

  // Render the list
  if (filteredUsers.length === 0) {
    userListElement.innerHTML = '<div class="loading-message">No users found</div>';
    return;
  }

  let html = '';
  filteredUsers.forEach(user => {
    html += `
      <div class="user-item" data-user-id="${user._id}">
        <img src="${user.profilePicture}" alt="${user.username}">
        <div class="user-item-name">
          ${user.username} ${user.isAdmin ? '<span style="color: #667eea; font-size: 12px;">(Admin)</span>' : ''}
        </div>
        <div class="user-actions">
          <button class="edit-user-btn" data-user-id="${user._id}" title="Edit User">
            <i class="fas fa-edit"></i>
          </button>
          <button class="view-chat-btn" data-user-id="${user._id}" title="View Chats">
            <i class="fas fa-comments"></i>
          </button>
        </div>
      </div>
    `;
  });

  userListElement.innerHTML = html;

  // Add event listeners for user actions
  document.querySelectorAll('.edit-user-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const userId = e.currentTarget.getAttribute('data-user-id');
      openEditUserModal(userId);
      e.stopPropagation();
    });
  });

  document.querySelectorAll('.view-chat-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const userId = e.currentTarget.getAttribute('data-user-id');
      viewUserChats(userId);
      e.stopPropagation();
    });
  });
};

const filterUsers = () => {
  adminState.modFilters.userFilter = document.getElementById('user-filter').value;
  adminState.modFilters.userSearch = document.getElementById('user-search').value;
  renderUserList();
};

const openCreateUserModal = () => {
  adminState.selectedUser = null;
  document.getElementById('user-modal-title').textContent = 'Create New User';
  document.getElementById('user-form').reset();
  document.getElementById('delete-user-btn').style.display = 'none';
  document.getElementById('user-modal').style.display = 'block';
};

const openEditUserModal = (userId) => {
  const user = adminState.users.find(u => u._id === userId);
  if (!user) return;

  adminState.selectedUser = user;
  document.getElementById('user-modal-title').textContent = 'Edit User';
  document.getElementById('user-username').value = user.username;
  document.getElementById('user-email').value = user.email;
  document.getElementById('user-password').value = '';
  document.getElementById('user-status').value = user.status;
  document.getElementById('user-admin').checked = user.isAdmin;
  document.getElementById('user-notes').value = user.adminNotes || '';
  document.getElementById('delete-user-btn').style.display = 'block';
  document.getElementById('user-modal').style.display = 'block';
};

const closeUserModal = () => {
  document.getElementById('user-modal').style.display = 'none';
  document.getElementById('user-form').reset();
};

const saveUserChanges = async () => {
  try {
    const userData = {
      username: document.getElementById('user-username').value,
      email: document.getElementById('user-email').value,
      status: document.getElementById('user-status').value,
      isAdmin: document.getElementById('user-admin').checked,
      adminNotes: document.getElementById('user-notes').value
    };

    const password = document.getElementById('user-password').value;
    if (password) {
      userData.password = password;
    }

    let url = '/api/users';
    let method = 'POST';

    if (adminState.selectedUser) {
      url = `/api/users/${adminState.selectedUser._id}`;
      method = 'PUT';
    }

    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
      },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error('Failed to save user');
    }

    const result = await response.json();

    // Update local list
    if (adminState.selectedUser) {
      const index = adminState.users.findIndex(u => u._id === adminState.selectedUser._id);
      if (index !== -1) {
        adminState.users[index] = { ...adminState.users[index], ...result };
      }
    } else {
      adminState.users.push(result);
    }

    renderUserList();
    closeUserModal();
    showAdminNotification('User saved successfully', 'success');

    // Send email notification if creating new admin user
    if (userData.isAdmin && !adminState.selectedUser) {
      sendAdminNotificationEmail('new_admin', {
        username: userData.username,
        email: userData.email
      });
    }
  } catch (error) {
    console.error('Error saving user:', error);
    showAdminNotification('Failed to save user', 'error');
  }
};

const deleteUser = async () => {
  if (!adminState.selectedUser) return;

  if (!confirm(`Are you sure you want to delete the user ${adminState.selectedUser.username}? This action cannot be undone.`)) {
    return;
  }

  try {
    const response = await fetch(`/api/users/${adminState.selectedUser._id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to delete user');
    }

    // Remove from local list
    adminState.users = adminState.users.filter(u => u._id !== adminState.selectedUser._id);
    renderUserList();
    closeUserModal();
    showAdminNotification('User deleted successfully', 'success');

    // Send email notification
    sendAdminNotificationEmail('user_deleted', {
      username: adminState.selectedUser.username,
      email: adminState.selectedUser.email
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    showAdminNotification('Failed to delete user', 'error');
  }
};

const viewUserChats = (userId) => {
  const user = adminState.users.find(u => u._id === userId);
  if (!user) return;

  // Implementation would depend on chat history viewing functionality
  alert(`Chat history for ${user.username} would be displayed here`);
};

// Content Moderation Functions
const loadContent = async () => {
  try {
    const response = await fetch('/api/messages/moderation', {
      headers: {
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch content');
    }

    adminState.content = await response.json();
    renderContentList();
  } catch (error) {
    console.error('Error loading content:', error);
    document.getElementById('content-list').innerHTML = '<div class="error-message">Failed to load content</div>';
  }
};

const renderContentList = () => {
  const contentListElement = document.getElementById('content-list');
  const { content, modFilters } = adminState;

  // Apply filters
  let filteredContent = content;

  if (modFilters.contentFilter !== 'all') {
    filteredContent = content.filter(item => {
      if (modFilters.contentFilter === 'flagged') {
        return item.isFlagged;
      } else if (modFilters.contentFilter === 'reported') {
        return item.reports && item.reports.length > 0;
      }
      return true;
    });
  }

  if (modFilters.contentSearch.trim() !== '') {
    const searchTerm = modFilters.contentSearch.toLowerCase();
    filteredContent = filteredContent.filter(item =>
      item.content.toLowerCase().includes(searchTerm) ||
      (item.sender && item.sender.username.toLowerCase().includes(searchTerm))
    );
  }

  // Render the list
  if (filteredContent.length === 0) {
    contentListElement.innerHTML = '<div class="loading-message">No content found</div>';
    return;
  }

  let html = '';
  filteredContent.forEach(item => {
    const date = new Date(item.createdAt).toLocaleString();
    const isImage = item.type === 'image';
    const isFile = item.type === 'file';
    const icon = isImage ? 'image' : (isFile ? 'file' : 'comment');
    const reportsCount = item.reports ? item.reports.length : 0;

    html += `
      <div class="content-item" data-content-id="${item._id}">
        <div class="content-icon">
          <i class="fas fa-${icon}"></i>
        </div>
        <div class="content-details">
          <div class="content-text">${truncateText(item.content, 50)}</div>
          <div class="content-meta">
            <div class="content-meta-item">
              <i class="fas fa-user"></i> ${item.sender ? item.sender.username : 'Unknown'}
            </div>
            <div class="content-meta-item">
              <i class="far fa-clock"></i> ${date}
            </div>
            ${reportsCount > 0 ? `
              <div class="content-meta-item">
                <i class="fas fa-flag"></i> ${reportsCount} report${reportsCount !== 1 ? 's' : ''}
              </div>
            ` : ''}
          </div>
        </div>
        ${item.isFlagged ? `
          <div class="content-flag">
            <i class="fas fa-exclamation-triangle"></i> Flagged
          </div>
        ` : ''}
      </div>
    `;
  });

  contentListElement.innerHTML = html;

  // Add event listeners for content items
  document.querySelectorAll('.content-item').forEach(item => {
    item.addEventListener('click', () => {
      const contentId = item.getAttribute('data-content-id');
      openContentModal(contentId);
    });
  });
};

const filterContent = () => {
  adminState.modFilters.contentFilter = document.getElementById('content-filter').value;
  adminState.modFilters.contentSearch = document.getElementById('content-search').value;
  renderContentList();
};

const openContentModal = (contentId) => {
  const contentItem = adminState.content.find(item => item._id === contentId);
  if (!contentItem) return;

  adminState.selectedContent = contentItem;

  document.getElementById('content-id').textContent = contentItem._id;
  document.getElementById('content-sender').textContent = contentItem.sender ? contentItem.sender.username : 'Unknown';
  document.getElementById('content-datetime').textContent = new Date(contentItem.createdAt).toLocaleString();
  document.getElementById('content-type').textContent = contentItem.type.charAt(0).toUpperCase() + contentItem.type.slice(1);

  let contentDisplay = contentItem.content;
  if (contentItem.type === 'image') {
    contentDisplay = `<img src="${contentItem.fileUrl}" alt="Image content" style="max-width: 100%; max-height: 200px;">
                    <div style="margin-top: 10px;">${contentItem.content}</div>`;
  } else if (contentItem.type === 'file') {
    contentDisplay = `<div><i class="fas fa-file"></i> <a href="${contentItem.fileUrl}" target="_blank">${getFilenameFromUrl(contentItem.fileUrl)}</a></div>
                    <div style="margin-top: 10px;">${contentItem.content}</div>`;
  }

  document.getElementById('content-message').innerHTML = contentDisplay;
  document.getElementById('moderation-notes').value = '';
  document.getElementById('content-modal').style.display = 'block';
};

const closeContentModal = () => {
  document.getElementById('content-modal').style.display = 'none';
  adminState.selectedContent = null;
};

const applyModeration = async () => {
  if (!adminState.selectedContent) return;

  try {
    const action = document.getElementById('moderation-action').value;
    const notes = document.getElementById('moderation-notes').value;

    const moderationData = {
      contentId: adminState.selectedContent._id,
      action,
      notes
    };

    const response = await fetch('/api/moderation/content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
      },
      body: JSON.stringify(moderationData)
    });

    if (!response.ok) {
      throw new Error('Moderation action failed');
    }

    // Update content item locally based on action
    if (action === 'remove') {
      adminState.content = adminState.content.filter(item => item._id !== adminState.selectedContent._id);
    } else {
      const index = adminState.content.findIndex(item => item._id === adminState.selectedContent._id);
      if (index !== -1) {
        adminState.content[index] = {
          ...adminState.content[index],
          moderationAction: action,
          moderationNotes: notes,
          moderatedAt: new Date().toISOString(),
          moderatedBy: JSON.parse(localStorage.getItem('userData'))._id,
          isFlagged: action !== 'approve'
        };
      }
    }

    renderContentList();
    closeContentModal();
    showAdminNotification('Moderation action applied successfully', 'success');

    // Send email notification for serious actions
    if (action === 'remove' || action === 'restrict') {
      sendAdminNotificationEmail('content_moderated', {
        action,
        contentType: adminState.selectedContent.type,
        username: adminState.selectedContent.sender?.username || 'Unknown user'
      });
    }
  } catch (error) {
    console.error('Error applying moderation:', error);
    showAdminNotification('Failed to apply moderation action', 'error');
  }
};

// Settings Functions
const loadSettings = async () => {
  try {
    const response = await fetch('/api/admin/settings', {
      headers: {
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch settings');
    }

    const settings = await response.json();
    adminState.settings = settings;

    // Update UI
    document.getElementById('auto-moderate-toggle').checked = settings.autoModerate;
    document.getElementById('email-notifications-toggle').checked = settings.emailNotifications;
    document.getElementById('max-upload-size').value = settings.maxUploadSize.toString();
    document.getElementById('inactivity-timeout').value = settings.inactivityTimeout.toString();
  } catch (error) {
    console.error('Error loading settings:', error);
    // Use defaults from adminState
  }
};

const saveSettings = async () => {
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
      },
      body: JSON.stringify(adminState.settings)
    });

    if (!response.ok) {
      throw new Error('Failed to save settings');
    }

    showAdminNotification('Settings saved successfully', 'success');
  } catch (error) {
    console.error('Error saving settings:', error);
    showAdminNotification('Failed to save settings', 'error');
  }
};

// Update Stats Display
const updateAdminStatsDisplay = () => {
  document.getElementById('total-users').textContent = adminState.users.length;

  const activeUsers = adminState.users.filter(user => user.status === 'online').length;
  document.getElementById('active-users').textContent = activeUsers;

  const totalMessages = adminState.content.length;
  document.getElementById('total-messages').textContent = totalMessages;

  // This would need an API call to get group count or track it elsewhere
  const totalGroups = 0; // Placeholder
  document.getElementById('total-groups').textContent = totalGroups;
};

// Helper Functions
const truncateText = (text, maxLength) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const getFilenameFromUrl = (url) => {
  if (!url) return 'File';
  const parts = url.split('/');
  return parts[parts.length - 1];
};

const showAdminNotification = (message, type = 'info') => {
  // Implementation would depend on your notification system
  console.log(`[Admin ${type}] ${message}`);

  // Simple alert for now
  if (type === 'error') {
    alert(`Error: ${message}`);
  } else if (type === 'success') {
    // You might want to show a toast notification instead
    console.log(`Success: ${message}`);
  }
};

// Email Notification Function
export const sendAdminNotificationEmail = async (type, data) => {
  // Only send if enabled in settings
  if (!adminState.settings.emailNotifications) return;

  try {
    const response = await fetch('/api/admin/notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${JSON.parse(localStorage.getItem('userData')).token}`
      },
      body: JSON.stringify({ type, data })
    });

    if (!response.ok) {
      throw new Error('Failed to send notification');
    }

    console.log('Admin notification email sent');
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

// Export for use in other files
export default {
  initAdminFeatures,
  loadAdminData,
  adminState,
  sendAdminNotificationEmail
};
