/**
 * Admin Notification Handler
 *
 * This module connects the AdminNotificationService to the UI components,
 * providing real-time notifications in the admin interface.
 */

import { AdminNotificationService } from './admin-notification-service.js';

// DOM element references
let notificationBell;
let notificationCounter;
let notificationPanel;
let notificationList;

// State management
const notificationState = {
    notifications: [],
    unreadCount: 0,
    isPanelOpen: false,
    isInitialized: false,
    lastNotificationId: null,
    pollingInterval: null,
    currentAdminId: 'admin-user', // Default admin ID (in a real app, would be dynamic)
};

/**
 * Initialize the notification handler
 */
function initNotificationHandler() {
    if (notificationState.isInitialized) return;

    // Get DOM elements
    notificationBell = document.getElementById('notification-bell');
    notificationCounter = document.getElementById('notification-counter');
    notificationPanel = document.getElementById('notification-panel');
    notificationList = document.getElementById('notification-list');

    if (!notificationBell || !notificationCounter || !notificationPanel || !notificationList) {
        console.error('Required notification UI elements not found in the DOM');
        return;
    }

    // Set up event listeners
    notificationBell.addEventListener('click', toggleNotificationPanel);

    // Close panel when clicking outside
    document.addEventListener('click', (event) => {
        if (notificationState.isPanelOpen &&
            !notificationPanel.contains(event.target) &&
            !notificationBell.contains(event.target)) {
            closeNotificationPanel();
        }
    });

    // Register the admin session for notifications
    registerAdminSession();

    // Load initial notifications
    refreshNotifications();

    // Start polling for new notifications every 30 seconds
    startNotificationPolling(30000);

    notificationState.isInitialized = true;
}

/**
 * Start polling for new notifications
 */
function startNotificationPolling(interval = 30000) {
    // Clear any existing interval
    if (notificationState.pollingInterval) {
        clearInterval(notificationState.pollingInterval);
    }

    // Set a new interval
    notificationState.pollingInterval = setInterval(() => {
        refreshNotifications();
        updateAdminActivity();
    }, interval);
}

/**
 * Stop polling for notifications
 */
function stopNotificationPolling() {
    if (notificationState.pollingInterval) {
        clearInterval(notificationState.pollingInterval);
        notificationState.pollingInterval = null;
    }
}

/**
 * Register the current admin session
 */
function registerAdminSession() {
    const sessionInfo = {
        browser: navigator.userAgent,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        ipAddress: '127.0.0.1', // Would be provided by server in a real app
        lastActive: Date.now()
    };

    AdminNotificationService.registerAdminSession(
        notificationState.currentAdminId,
        sessionInfo
    );
}

/**
 * Update the admin activity timestamp
 */
function updateAdminActivity() {
    AdminNotificationService.updateAdminActivity(notificationState.currentAdminId);
}

/**
 * End the admin session when leaving the page
 */
function endAdminSession() {
    AdminNotificationService.endAdminSession(notificationState.currentAdminId);
}

/**
 * Refresh notifications from the service
 */
function refreshNotifications() {
    // Get the latest notifications with limit of 20
    const notifications = AdminNotificationService.getAdminNotifications(20, false);

    // Update state
    notificationState.notifications = notifications;
    notificationState.unreadCount = notifications.filter(n => !n.read).length;

    // Update UI
    updateNotificationCounter();
    renderNotifications();

    // Check for new notifications to play sound/show toast
    const latestNotification = notifications[0];
    if (latestNotification &&
        notificationState.lastNotificationId !== latestNotification.id) {
        // Only notify if it's not the first load
        if (notificationState.lastNotificationId !== null) {
            notifyNewNotification(latestNotification);
        }
        notificationState.lastNotificationId = latestNotification.id;
    }
}

/**
 * Update the notification counter badge
 */
function updateNotificationCounter() {
    if (!notificationCounter) return;

    const count = notificationState.unreadCount;

    // Update the counter badge
    notificationCounter.textContent = count;
    notificationCounter.style.display = count > 0 ? 'flex' : 'none';

    // Apply attention class if there are unread notifications
    if (count > 0 && !notificationBell.classList.contains('has-notifications')) {
        notificationBell.classList.add('has-notifications');
    } else if (count === 0) {
        notificationBell.classList.remove('has-notifications');
    }
}

/**
 * Play a notification sound and show a toast for new notifications
 */
function notifyNewNotification(notification) {
    // Play notification sound
    playNotificationSound();

    // Show toast notification
    showNotificationToast(notification);
}

/**
 * Play the notification sound
 */
function playNotificationSound() {
    // Create an audio element and play it
    const audio = new Audio('/assets/notification-sound.mp3');
    audio.volume = 0.5;
    audio.play().catch(err => {
        // Handle auto-play restrictions gracefully
        console.warn('Could not play notification sound:', err);
    });
}

/**
 * Show a toast notification
 */
function showNotificationToast(notification) {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'notification-toast';

    // Add priority class
    if (notification.priority) {
        toast.classList.add(`priority-${notification.priority}`);
    }

    // Set content
    toast.innerHTML = `
        <div class="toast-header">
            <i class="fas fa-bell"></i>
            <span>${notification.title}</span>
            <button class="toast-close"><i class="fas fa-times"></i></button>
        </div>
        <div class="toast-body">
            ${notification.message}
        </div>
    `;

    // Add to document
    document.body.appendChild(toast);

    // Animate in
    setTimeout(() => {
        toast.classList.add('show');
    }, 10);

    // Set up close button
    const closeButton = toast.querySelector('.toast-close');
    if (closeButton) {
        closeButton.addEventListener('click', () => {
            toast.classList.remove('show');
            setTimeout(() => {
                toast.remove();
            }, 300);
        });
    }

    // Auto remove after 8 seconds
    setTimeout(() => {
        if (document.body.contains(toast)) {
            toast.classList.remove('show');
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    toast.remove();
                }
            }, 300);
        }
    }, 8000);
}

/**
 * Toggle the notification panel
 */
function toggleNotificationPanel() {
    if (notificationState.isPanelOpen) {
        closeNotificationPanel();
    } else {
        openNotificationPanel();
    }
}

/**
 * Open the notification panel
 */
function openNotificationPanel() {
    if (!notificationPanel) return;

    notificationPanel.classList.add('open');
    notificationState.isPanelOpen = true;

    // Mark all visible notifications as read
    if (notificationState.unreadCount > 0) {
        setTimeout(() => {
            markVisibleNotificationsAsRead();
        }, 2000); // Short delay to ensure they're seen
    }
}

/**
 * Close the notification panel
 */
function closeNotificationPanel() {
    if (!notificationPanel) return;

    notificationPanel.classList.remove('open');
    notificationState.isPanelOpen = false;
}

/**
 * Mark visible notifications as read
 */
function markVisibleNotificationsAsRead() {
    const unreadNotifications = notificationState.notifications.filter(n => !n.read);

    unreadNotifications.forEach(notification => {
        AdminNotificationService.markNotificationRead(notification.id);
    });

    // Update state
    refreshNotifications();
}

/**
 * Mark all notifications as read
 */
function markAllNotificationsAsRead() {
    AdminNotificationService.markAllNotificationsRead();
    refreshNotifications();
}

/**
 * Render notifications in the panel
 */
function renderNotifications() {
    if (!notificationList) return;

    // Clear existing notifications
    notificationList.innerHTML = '';

    // If no notifications, show message
    if (notificationState.notifications.length === 0) {
        notificationList.innerHTML = `
            <div class="empty-notifications">
                <i class="fas fa-check-circle"></i>
                <p>No new notifications</p>
            </div>
        `;
        return;
    }

    // Add header with mark all as read button
    if (notificationState.unreadCount > 0) {
        const header = document.createElement('div');
        header.className = 'notification-header';
        header.innerHTML = `
            <span>${notificationState.unreadCount} unread notification${notificationState.unreadCount !== 1 ? 's' : ''}</span>
            <button id="mark-all-read" class="btn-link">Mark all as read</button>
        `;
        notificationList.appendChild(header);

        // Add event listener
        const markAllReadBtn = header.querySelector('#mark-all-read');
        if (markAllReadBtn) {
            markAllReadBtn.addEventListener('click', markAllNotificationsAsRead);
        }
    }

    // Render each notification
    notificationState.notifications.forEach(notification => {
        const notificationItem = document.createElement('div');
        notificationItem.className = 'notification-item';

        // Add classes based on status
        if (!notification.read) {
            notificationItem.classList.add('unread');
        }

        if (notification.priority) {
            notificationItem.classList.add(`priority-${notification.priority}`);
        }

        // Format the relative time
        const relativeTime = formatRelativeTime(notification.timestamp);

        // Create icon based on notification type
        let icon = 'fa-bell';

        switch (notification.type) {
            case AdminNotificationService.NOTIFICATION_TYPES.MESSAGE_FLAGGED:
                icon = 'fa-flag';
                break;
            case AdminNotificationService.NOTIFICATION_TYPES.USER_REPORTED:
                icon = 'fa-user-shield';
                break;
            case AdminNotificationService.NOTIFICATION_TYPES.CONTENT_DISPUTED:
                icon = 'fa-gavel';
                break;
            case AdminNotificationService.NOTIFICATION_TYPES.SUSPICIOUS_ACTIVITY:
                icon = 'fa-exclamation-triangle';
                break;
            case AdminNotificationService.NOTIFICATION_TYPES.SYSTEM_ALERT:
                icon = 'fa-exclamation-circle';
                break;
        }

        // Set content
        notificationItem.innerHTML = `
            <div class="notification-icon">
                <i class="fas ${icon}"></i>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notification.title}</div>
                <div class="notification-message">${notification.message}</div>
                <div class="notification-time">${relativeTime}</div>
            </div>
            <div class="notification-actions">
                <button class="btn-icon mark-read-btn" title="Mark as read" data-id="${notification.id}">
                    <i class="fas fa-check"></i>
                </button>
            </div>
        `;

        // Add item to the list
        notificationList.appendChild(notificationItem);

        // Add event listener to mark as read button
        const markReadBtn = notificationItem.querySelector('.mark-read-btn');
        if (markReadBtn) {
            markReadBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = markReadBtn.getAttribute('data-id');
                if (id) {
                    AdminNotificationService.markNotificationRead(id);
                    refreshNotifications();
                }
            });
        }

        // Add click handler to view the related item
        notificationItem.addEventListener('click', () => {
            handleNotificationClick(notification);
        });
    });
}

/**
 * Handle clicking on a notification
 */
function handleNotificationClick(notification) {
    // Mark notification as read
    AdminNotificationService.markNotificationRead(notification.id);

    // Handle based on notification type
    switch (notification.type) {
        case AdminNotificationService.NOTIFICATION_TYPES.MESSAGE_FLAGGED:
            // Navigate to message monitoring with this conversation open
            if (notification.data && notification.data.conversationId) {
                navigateToFlaggedMessage(notification.data.conversationId);
            }
            break;

        case AdminNotificationService.NOTIFICATION_TYPES.USER_REPORTED:
            // Navigate to user management with this user's profile
            if (notification.data && notification.data.reportedType === 'expert' && notification.data.reportedId) {
                navigateToExpertProfile(notification.data.reportedId);
            } else if (notification.data && notification.data.reportedType === 'client' && notification.data.reportedId) {
                navigateToClientProfile(notification.data.reportedId);
            }
            break;

        // Handle other notification types...
    }

    // Refresh notifications to update UI
    refreshNotifications();

    // Close the panel
    closeNotificationPanel();
}

/**
 * Navigate to a flagged message
 */
function navigateToFlaggedMessage(conversationId) {
    // If already on message monitoring page
    if (window.location.pathname.includes('admin-message-monitoring')) {
        // Use the existing view conversation function
        if (typeof viewConversation === 'function') {
            viewConversation(conversationId);
        }
    } else {
        // Navigate to message monitoring with conversation ID parameter
        window.location.href = `admin-message-monitoring.html?conversation=${conversationId}`;
    }
}

/**
 * Navigate to an expert profile
 */
function navigateToExpertProfile(expertId) {
    window.location.href = `admin-experts.html?expert=${expertId}`;
}

/**
 * Navigate to a client profile
 */
function navigateToClientProfile(clientId) {
    window.location.href = `admin-clients.html?client=${clientId}`;
}

/**
 * Format relative time (e.g., "5 minutes ago")
 */
function formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    // Within the last minute
    if (diff < 60 * 1000) {
        return 'Just now';
    }

    // Within the last hour
    if (diff < 60 * 60 * 1000) {
        const minutes = Math.floor(diff / (60 * 1000));
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    }

    // Within the last day
    if (diff < 24 * 60 * 60 * 1000) {
        const hours = Math.floor(diff / (60 * 60 * 1000));
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    }

    // Within the last week
    if (diff < 7 * 24 * 60 * 60 * 1000) {
        const days = Math.floor(diff / (24 * 60 * 60 * 1000));
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }

    // Format as date
    return new Date(timestamp).toLocaleDateString();
}

// Setup event listeners for page load/unload
window.addEventListener('load', initNotificationHandler);
window.addEventListener('beforeunload', endAdminSession);

// Export the notification handler
export const AdminNotificationHandler = {
    initNotificationHandler,
    refreshNotifications,
    markAllNotificationsAsRead,
    openNotificationPanel,
    closeNotificationPanel,

    // For simulating notifications in demo mode
    simulateNewNotification(type, data, priority) {
        // Create a notification with the provided data
        const notification = AdminNotificationService.sendSystemAlert(
            data.alertType || 'Demo Alert',
            data.message || 'This is a simulated notification for demonstration purposes.',
            priority || AdminNotificationService.PRIORITY_LEVELS.MEDIUM
        );

        // Refresh notifications to show the new one
        refreshNotifications();

        return notification;
    }
};

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminNotificationHandler };
}
