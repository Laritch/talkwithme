/**
 * Admin Notification Service
 *
 * This service manages notifications for administrators regarding flagged messages,
 * suspicious activities, and other platform moderation events.
 */

// Notification types and their configurations
const NOTIFICATION_TYPES = {
    MESSAGE_FLAGGED: 'message_flagged',
    USER_REPORTED: 'user_reported',
    CONTENT_DISPUTED: 'content_disputed',
    SUSPICIOUS_ACTIVITY: 'suspicious_activity',
    SYSTEM_ALERT: 'system_alert'
};

// Priority levels for notifications
const PRIORITY_LEVELS = {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical'
};

// Global notification settings (in a real app, would be per admin user)
const NOTIFICATION_SETTINGS = {
    enableRealTimeAlerts: true,
    enableEmailNotifications: true,
    enablePushNotifications: false,
    pushNotificationSettings: {
        // For push notifications in a real app
        token: null,
        deviceId: null
    },
    emailSettings: {
        address: 'admin@example.com',
        frequency: 'immediate' // 'immediate', 'hourly', 'daily'
    },
    notificationFilters: {
        minSeverity: PRIORITY_LEVELS.LOW,
        muteTypes: [] // notification types to mute
    }
};

// Store for active admin sessions (in a real app, this would be in a database)
const activeAdminSessions = {
    sessions: {},

    // Add a new admin session
    addSession(adminId, sessionInfo) {
        this.sessions[adminId] = {
            ...sessionInfo,
            lastActive: Date.now()
        };
    },

    // Update an existing admin session
    updateSession(adminId, updateData) {
        if (this.sessions[adminId]) {
            this.sessions[adminId] = {
                ...this.sessions[adminId],
                ...updateData,
                lastActive: Date.now()
            };
        }
    },

    // Remove an admin session
    removeSession(adminId) {
        delete this.sessions[adminId];
    },

    // Get all active admin sessions
    getActiveSessions() {
        // Filter out inactive sessions (more than 30 minutes inactive)
        const thirtyMinutesAgo = Date.now() - (30 * 60 * 1000);
        return Object.entries(this.sessions)
            .filter(([_, session]) => session.lastActive > thirtyMinutesAgo)
            .map(([adminId, session]) => ({ adminId, ...session }));
    },

    // Check if an admin is active
    isAdminActive(adminId) {
        return (
            this.sessions[adminId] &&
            this.sessions[adminId].lastActive > Date.now() - (30 * 60 * 1000)
        );
    }
};

// Notification queue storage (for notifications that need delivery)
const notificationQueue = {
    queue: [],

    // Add a notification to the queue
    enqueue(notification) {
        this.queue.push({
            ...notification,
            status: 'pending',
            attempts: 0,
            createdAt: Date.now()
        });

        // In a real application, this would trigger a background process
        // to deliver the notification
        this.processQueue();
    },

    // Process the notification queue
    processQueue() {
        // Only process notifications that are pending
        const pendingNotifications = this.queue.filter(n => n.status === 'pending');

        pendingNotifications.forEach(notification => {
            this.deliverNotification(notification);
        });
    },

    // Deliver a notification through appropriate channels
    deliverNotification(notification) {
        const index = this.queue.findIndex(n => n.id === notification.id);
        if (index === -1) return;

        // Update attempt count
        this.queue[index].attempts += 1;

        try {
            // Deliver based on type and settings
            if (NOTIFICATION_SETTINGS.enableRealTimeAlerts) {
                // This would use WebSockets or Server-Sent Events in a real app
                console.log(`[REAL-TIME] Delivering notification: ${notification.title}`);

                // Simulate successful delivery
                this.queue[index].status = 'delivered';
                this.queue[index].deliveredAt = Date.now();
            }

            if (NOTIFICATION_SETTINGS.enableEmailNotifications &&
                notification.priority === PRIORITY_LEVELS.HIGH ||
                notification.priority === PRIORITY_LEVELS.CRITICAL) {
                // This would send an email in a real app
                console.log(`[EMAIL] Sending notification to ${NOTIFICATION_SETTINGS.emailSettings.address}: ${notification.title}`);
            }

            if (NOTIFICATION_SETTINGS.enablePushNotifications &&
                notification.priority === PRIORITY_LEVELS.HIGH ||
                notification.priority === PRIORITY_LEVELS.CRITICAL) {
                // This would send a push notification in a real app
                console.log(`[PUSH] Sending push notification: ${notification.title}`);
            }

        } catch (error) {
            console.error('Failed to deliver notification:', error);
            this.queue[index].status = 'failed';
            this.queue[index].error = error.message;

            // Retry logic for failed notifications
            if (this.queue[index].attempts < 3) {
                // Reset to pending for retry
                setTimeout(() => {
                    if (this.queue[index] && this.queue[index].status === 'failed') {
                        this.queue[index].status = 'pending';
                        this.processQueue();
                    }
                }, 60000); // Retry after 1 minute
            }
        }
    },

    // Get pending notifications
    getPendingNotifications() {
        return this.queue.filter(n => n.status === 'pending');
    },

    // Get all notifications
    getAllNotifications() {
        return [...this.queue];
    },

    // Clear delivered notifications older than the specified time
    clearOldNotifications(maxAgeMs = 7 * 24 * 60 * 60 * 1000) { // 7 days by default
        const cutoffTime = Date.now() - maxAgeMs;
        this.queue = this.queue.filter(n => {
            // Keep all pending/failed notifications
            if (n.status !== 'delivered') return true;

            // For delivered, only keep recent ones
            return n.deliveredAt > cutoffTime;
        });
    }
};

/**
 * Create a new notification object
 */
function createNotification(type, data, priority = PRIORITY_LEVELS.MEDIUM) {
    // Generate a unique ID (in a real app, use UUID)
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Generate title and message based on notification type
    const { title, message } = generateNotificationContent(type, data);

    // Check if this notification should be included based on filter settings
    if (
        NOTIFICATION_SETTINGS.notificationFilters.muteTypes.includes(type) ||
        getPriorityRank(priority) < getPriorityRank(NOTIFICATION_SETTINGS.notificationFilters.minSeverity)
    ) {
        return { ignored: true };
    }

    return {
        id,
        type,
        priority,
        title,
        message,
        data,
        timestamp: Date.now(),
        read: false,
        ignored: false
    };
}

/**
 * Generate notification content based on type and data
 */
function generateNotificationContent(type, data) {
    switch (type) {
        case NOTIFICATION_TYPES.MESSAGE_FLAGGED:
            return {
                title: `Message Flagged: ${data.flagReason}`,
                message: `A message in the conversation "${data.conversationSubject}" has been flagged for "${data.flagReason}". Confidence: ${Math.round(data.confidenceScore * 100)}%`
            };

        case NOTIFICATION_TYPES.USER_REPORTED:
            return {
                title: `User Reported: ${data.reportReason}`,
                message: `${data.reporterType} ${data.reporterName} has reported ${data.reportedType} ${data.reportedName} for "${data.reportReason}"`
            };

        case NOTIFICATION_TYPES.CONTENT_DISPUTED:
            return {
                title: `Content Dispute`,
                message: `${data.disputerName} has disputed a moderation action on their content. Reason: "${data.disputeReason}"`
            };

        case NOTIFICATION_TYPES.SUSPICIOUS_ACTIVITY:
            return {
                title: `Suspicious Activity Detected`,
                message: `System detected suspicious activity: ${data.activityDescription}`
            };

        case NOTIFICATION_TYPES.SYSTEM_ALERT:
            return {
                title: `System Alert: ${data.alertType}`,
                message: data.message || `System alert: ${data.alertType}`
            };

        default:
            return {
                title: `Notification`,
                message: `You have a new notification.`
            };
    }
}

/**
 * Get numeric rank for priority level for comparison
 */
function getPriorityRank(priority) {
    const ranks = {
        [PRIORITY_LEVELS.LOW]: 1,
        [PRIORITY_LEVELS.MEDIUM]: 2,
        [PRIORITY_LEVELS.HIGH]: 3,
        [PRIORITY_LEVELS.CRITICAL]: 4
    };
    return ranks[priority] || 0;
}

/**
 * Handle a flagged message, creating and sending notifications
 */
function handleFlaggedMessage(flagData, conversationData) {
    // Map severity from AI analyzer to notification priority
    const priorityMap = {
        'low': PRIORITY_LEVELS.LOW,
        'medium': PRIORITY_LEVELS.MEDIUM,
        'high': PRIORITY_LEVELS.HIGH,
        'critical': PRIORITY_LEVELS.CRITICAL
    };

    // Create the notification
    const notification = createNotification(
        NOTIFICATION_TYPES.MESSAGE_FLAGGED,
        {
            ...flagData,
            conversationSubject: conversationData.subject || 'Untitled Conversation',
            conversationId: conversationData.id
        },
        priorityMap[flagData.severity] || PRIORITY_LEVELS.MEDIUM
    );

    // If notification was ignored due to settings, return early
    if (notification.ignored) {
        return { success: true, ignored: true };
    }

    // Add to notification queue for delivery
    notificationQueue.enqueue(notification);

    return {
        success: true,
        notification
    };
}

/**
 * Handle user reports against other users
 */
function handleUserReport(reportData) {
    // Determine priority based on report reason
    let priority = PRIORITY_LEVELS.MEDIUM;

    // Higher priority for serious issues
    const highPriorityReasons = [
        'harassment', 'fraud', 'impersonation', 'illegal_activity', 'threatening'
    ];

    if (highPriorityReasons.includes(reportData.reportReason)) {
        priority = PRIORITY_LEVELS.HIGH;
    }

    // Create notification
    const notification = createNotification(
        NOTIFICATION_TYPES.USER_REPORTED,
        reportData,
        priority
    );

    // If notification was ignored due to settings, return early
    if (notification.ignored) {
        return { success: true, ignored: true };
    }

    // Add to notification queue for delivery
    notificationQueue.enqueue(notification);

    return {
        success: true,
        notification
    };
}

/**
 * Get notifications for the admin dashboard
 */
function getAdminNotifications(limit = 10, includeRead = false) {
    let notifications = notificationQueue.getAllNotifications();

    // Filter out read notifications if requested
    if (!includeRead) {
        notifications = notifications.filter(n => !n.read);
    }

    // Sort by priority and timestamp
    notifications.sort((a, b) => {
        // First sort by priority (higher first)
        const priorityDiff = getPriorityRank(b.priority) - getPriorityRank(a.priority);
        if (priorityDiff !== 0) return priorityDiff;

        // Then by timestamp (newer first)
        return b.timestamp - a.timestamp;
    });

    // Apply limit
    return notifications.slice(0, limit);
}

/**
 * Mark a notification as read
 */
function markNotificationRead(notificationId) {
    const index = notificationQueue.queue.findIndex(n => n.id === notificationId);
    if (index !== -1) {
        notificationQueue.queue[index].read = true;
        return true;
    }
    return false;
}

/**
 * Mark all notifications as read
 */
function markAllNotificationsRead() {
    notificationQueue.queue.forEach(n => {
        n.read = true;
    });
    return true;
}

/**
 * Register an admin session for real-time notifications
 */
function registerAdminSession(adminId, sessionInfo) {
    activeAdminSessions.addSession(adminId, sessionInfo);
    return true;
}

/**
 * Update admin session activity
 */
function updateAdminActivity(adminId) {
    if (activeAdminSessions.sessions[adminId]) {
        activeAdminSessions.updateSession(adminId, { lastActive: Date.now() });
        return true;
    }
    return false;
}

/**
 * End an admin session
 */
function endAdminSession(adminId) {
    activeAdminSessions.removeSession(adminId);
    return true;
}

/**
 * Send a system alert to all active admins
 */
function sendSystemAlert(alertType, message, priority = PRIORITY_LEVELS.MEDIUM) {
    const notification = createNotification(
        NOTIFICATION_TYPES.SYSTEM_ALERT,
        { alertType, message },
        priority
    );

    // If notification was ignored due to settings, return early
    if (notification.ignored) {
        return { success: true, ignored: true };
    }

    // Add to notification queue for delivery
    notificationQueue.enqueue(notification);

    return {
        success: true,
        notification
    };
}

// Setup cleanup task to remove old delivered notifications (in a real app, use a job scheduler)
setInterval(() => {
    notificationQueue.clearOldNotifications();
}, 24 * 60 * 60 * 1000); // Run once per day

// Export the notification service
export const AdminNotificationService = {
    // Notification handling
    handleFlaggedMessage,
    handleUserReport,
    sendSystemAlert,

    // Notification retrieval
    getAdminNotifications,
    markNotificationRead,
    markAllNotificationsRead,

    // Session management
    registerAdminSession,
    updateAdminActivity,
    endAdminSession,

    // Constants
    NOTIFICATION_TYPES,
    PRIORITY_LEVELS
};

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdminNotificationService };
}
