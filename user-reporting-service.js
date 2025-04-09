/**
 * User Reporting Service
 *
 * This service manages the reporting of inappropriate messages, content, or user behavior
 * within the expert marketplace platform.
 */

// Import the admin notification service (in a real app, use proper import system)
// import { AdminNotificationService } from './admin-notification-service.js';
// For simplicity in this demo, we'll assume it's available globally

// Report categories and their configurations
const REPORT_CATEGORIES = {
    // Message-related reports
    HARASSMENT: 'harassment',
    SPAM: 'spam',
    INAPPROPRIATE_CONTENT: 'inappropriate_content',
    MISLEADING_INFORMATION: 'misleading_information',

    // User-related reports
    IMPERSONATION: 'impersonation',
    FAKE_CREDENTIALS: 'fake_credentials',
    FRAUD: 'fraud',
    UNPROFESSIONAL_BEHAVIOR: 'unprofessional_behavior',

    // Platform-related reports
    TECHNICAL_ISSUE: 'technical_issue',
    PAYMENT_ISSUE: 'payment_issue',
    POLICY_VIOLATION: 'policy_violation',

    // Other
    OTHER: 'other'
};

// Report status codes
const REPORT_STATUS = {
    PENDING: 'pending',
    UNDER_REVIEW: 'under_review',
    RESOLVED: 'resolved',
    DISMISSED: 'dismissed',
    ESCALATED: 'escalated'
};

// Report targets
const REPORT_TARGETS = {
    MESSAGE: 'message',
    USER: 'user',
    CONVERSATION: 'conversation',
    CONTENT: 'content',
    TECHNICAL: 'technical'
};

// Global settings for automated handling
const REPORT_SETTINGS = {
    // Auto-escalate reports with these categories
    autoEscalateCategories: [
        REPORT_CATEGORIES.FRAUD,
        REPORT_CATEGORIES.IMPERSONATION,
        REPORT_CATEGORIES.HARASSMENT
    ],

    // Threshold for automatic action (e.g., if a message gets this many reports)
    thresholds: {
        message: 3,
        user: 5,
        conversation: 3
    },

    // Whether to notify the reported user
    notifyReportedUser: false,

    // Whether to allow anonymous reports
    allowAnonymousReports: true
};

// Store for reports (in a real app, this would be in a database)
const reportStore = {
    reports: [],

    // Add a new report
    addReport(report) {
        this.reports.push({
            ...report,
            id: `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            status: REPORT_STATUS.PENDING,
            reviewHistory: []
        });

        return this.reports[this.reports.length - 1];
    },

    // Update a report
    updateReport(reportId, updateData) {
        const index = this.reports.findIndex(r => r.id === reportId);
        if (index === -1) return null;

        this.reports[index] = {
            ...this.reports[index],
            ...updateData,
            updatedAt: Date.now()
        };

        return this.reports[index];
    },

    // Add a review entry to a report
    addReviewEntry(reportId, reviewData) {
        const index = this.reports.findIndex(r => r.id === reportId);
        if (index === -1) return null;

        const reviewEntry = {
            ...reviewData,
            timestamp: Date.now()
        };

        this.reports[index].reviewHistory.push(reviewEntry);
        this.reports[index].updatedAt = Date.now();

        return reviewEntry;
    },

    // Get report by ID
    getReportById(reportId) {
        return this.reports.find(r => r.id === reportId) || null;
    },

    // Get reports by target ID (message, user, etc.)
    getReportsByTargetId(targetId, targetType) {
        return this.reports.filter(
            r => r.targetId === targetId && r.targetType === targetType
        );
    },

    // Get reports by reporter ID
    getReportsByReporterId(reporterId) {
        return this.reports.filter(r => r.reporterId === reporterId);
    },

    // Get reports by status
    getReportsByStatus(status) {
        return this.reports.filter(r => r.status === status);
    },

    // Get all reports
    getAllReports() {
        return [...this.reports];
    },

    // Get reports with pagination and filtering
    getReports(filters = {}, pagination = { page: 1, limit: 20 }) {
        let filteredReports = [...this.reports];

        // Apply filters
        if (filters.status) {
            filteredReports = filteredReports.filter(r => r.status === filters.status);
        }

        if (filters.category) {
            filteredReports = filteredReports.filter(r => r.category === filters.category);
        }

        if (filters.targetType) {
            filteredReports = filteredReports.filter(r => r.targetType === filters.targetType);
        }

        if (filters.fromDate) {
            const fromTimestamp = new Date(filters.fromDate).getTime();
            filteredReports = filteredReports.filter(r => r.createdAt >= fromTimestamp);
        }

        if (filters.toDate) {
            const toTimestamp = new Date(filters.toDate).getTime();
            filteredReports = filteredReports.filter(r => r.createdAt <= toTimestamp);
        }

        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filteredReports = filteredReports.filter(r =>
                (r.reporterName && r.reporterName.toLowerCase().includes(searchLower)) ||
                (r.targetName && r.targetName.toLowerCase().includes(searchLower)) ||
                (r.description && r.description.toLowerCase().includes(searchLower))
            );
        }

        // Sort by created date, newest first
        filteredReports.sort((a, b) => b.createdAt - a.createdAt);

        // Apply pagination
        const startIndex = (pagination.page - 1) * pagination.limit;
        const paginatedReports = filteredReports.slice(startIndex, startIndex + pagination.limit);

        return {
            reports: paginatedReports,
            total: filteredReports.length,
            page: pagination.page,
            limit: pagination.limit,
            totalPages: Math.ceil(filteredReports.length / pagination.limit)
        };
    }
};

/**
 * Submit a new report from a user
 * @param {Object} reportData - Data for the report
 * @returns {Object} The created report object
 */
function submitReport(reportData) {
    // Validate required fields
    const requiredFields = ['reporterId', 'targetId', 'targetType', 'category'];
    const missingFields = requiredFields.filter(field => !reportData[field]);

    if (missingFields.length > 0) {
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }

    // Create the report object
    const report = {
        ...reportData,
        isAnonymous: reportData.isAnonymous || false,
        submittedFrom: reportData.submittedFrom || 'web',
        evidenceUrls: reportData.evidenceUrls || [],
        priority: calculateReportPriority(reportData)
    };

    // Add the report to the store
    const savedReport = reportStore.addReport(report);

    // Check for auto-escalation
    if (REPORT_SETTINGS.autoEscalateCategories.includes(report.category)) {
        escalateReport(savedReport.id, {
            reason: 'Auto-escalated based on report category',
            automated: true
        });
    }

    // Check if threshold has been reached for this target
    checkReportingThreshold(report.targetId, report.targetType);

    // Notify administrators if this implementation is connected to AdminNotificationService
    notifyAdminsAboutReport(savedReport);

    return savedReport;
}

/**
 * Calculate the priority level for a report
 */
function calculateReportPriority(reportData) {
    // High priority categories
    const highPriorityCategories = [
        REPORT_CATEGORIES.HARASSMENT,
        REPORT_CATEGORIES.FRAUD,
        REPORT_CATEGORIES.IMPERSONATION
    ];

    // Medium priority categories
    const mediumPriorityCategories = [
        REPORT_CATEGORIES.INAPPROPRIATE_CONTENT,
        REPORT_CATEGORIES.FAKE_CREDENTIALS,
        REPORT_CATEGORIES.MISLEADING_INFORMATION
    ];

    if (highPriorityCategories.includes(reportData.category)) {
        return 'high';
    } else if (mediumPriorityCategories.includes(reportData.category)) {
        return 'medium';
    } else {
        return 'low';
    }
}

/**
 * Check if the reporting threshold has been reached for a target
 */
function checkReportingThreshold(targetId, targetType) {
    const reports = reportStore.getReportsByTargetId(targetId, targetType);
    const threshold = REPORT_SETTINGS.thresholds[targetType];

    if (reports.length >= threshold) {
        // Threshold reached - take automated action
        handleThresholdReached(targetId, targetType, reports);
    }
}

/**
 * Handle when a reporting threshold has been reached
 */
function handleThresholdReached(targetId, targetType, reports) {
    // In a real implementation, this would take appropriate action
    // like hiding the content, temporarily suspending the user, etc.
    console.log(`Threshold reached for ${targetType} ${targetId}. Taking automated action.`);

    // For this demo, we'll just mark the reports as escalated
    reports.forEach(report => {
        if (report.status === REPORT_STATUS.PENDING) {
            escalateReport(report.id, {
                reason: `Automatically escalated due to threshold reached (${reports.length} reports)`,
                automated: true
            });
        }
    });

    // Send a high-priority notification to admins
    try {
        if (typeof AdminNotificationService !== 'undefined') {
            AdminNotificationService.sendSystemAlert(
                'threshold_reached',
                `Reporting threshold reached for ${targetType} ${targetId}. ${reports.length} reports received.`,
                'high'
            );
        }
    } catch (error) {
        console.error('Failed to send admin notification:', error);
    }
}

/**
 * Escalate a report for urgent review
 */
function escalateReport(reportId, escalationData) {
    const report = reportStore.getReportById(reportId);
    if (!report) {
        throw new Error(`Report with ID ${reportId} not found`);
    }

    // Update the report status
    const updatedReport = reportStore.updateReport(reportId, {
        status: REPORT_STATUS.ESCALATED,
        escalatedAt: Date.now(),
        escalatedBy: escalationData.escalatedBy || 'system',
        escalationReason: escalationData.reason || 'No reason provided'
    });

    // Add a review entry
    reportStore.addReviewEntry(reportId, {
        type: 'escalation',
        reviewerId: escalationData.escalatedBy || 'system',
        automated: escalationData.automated || false,
        notes: escalationData.reason || 'Report escalated',
        action: 'escalate'
    });

    // Notify administrators
    notifyAdminsAboutEscalation(updatedReport, escalationData);

    return updatedReport;
}

/**
 * Review a report
 */
function reviewReport(reportId, reviewData) {
    const report = reportStore.getReportById(reportId);
    if (!report) {
        throw new Error(`Report with ID ${reportId} not found`);
    }

    // Update the report status based on the review action
    let newStatus;
    switch (reviewData.action) {
        case 'dismiss':
            newStatus = REPORT_STATUS.DISMISSED;
            break;
        case 'resolve':
            newStatus = REPORT_STATUS.RESOLVED;
            break;
        case 'escalate':
            newStatus = REPORT_STATUS.ESCALATED;
            break;
        default:
            newStatus = REPORT_STATUS.UNDER_REVIEW;
    }

    // Update the report
    const updatedReport = reportStore.updateReport(reportId, {
        status: newStatus,
        reviewedAt: Date.now(),
        reviewedBy: reviewData.reviewerId
    });

    // Add a review entry
    reportStore.addReviewEntry(reportId, {
        type: 'review',
        reviewerId: reviewData.reviewerId,
        notes: reviewData.notes || '',
        action: reviewData.action,
        actionTaken: reviewData.actionTaken || null
    });

    return updatedReport;
}

/**
 * Notify administrators about a new report
 */
function notifyAdminsAboutReport(report) {
    try {
        // Check if AdminNotificationService is available
        if (typeof AdminNotificationService !== 'undefined') {
            // Prepare the report data for the notification
            const reportData = {
                reporterId: report.reporterId,
                reporterName: report.reporterName || 'Anonymous User',
                reporterType: report.reporterType || 'user',
                reportedId: report.targetId,
                reportedName: report.targetName || 'Unknown',
                reportedType: report.targetType,
                reportReason: report.category,
                reportDescription: report.description || '',
                reportId: report.id
            };

            // Send the notification
            AdminNotificationService.handleUserReport(reportData);
        }
    } catch (error) {
        console.error('Failed to send admin notification:', error);
    }
}

/**
 * Notify administrators about an escalated report
 */
function notifyAdminsAboutEscalation(report, escalationData) {
    try {
        // Check if AdminNotificationService is available
        if (typeof AdminNotificationService !== 'undefined') {
            // Send the notification
            AdminNotificationService.sendSystemAlert(
                'report_escalated',
                `Report ${report.id} has been escalated. Reason: ${escalationData.reason}`,
                report.priority === 'high' ? 'high' : 'medium'
            );
        }
    } catch (error) {
        console.error('Failed to send admin notification:', error);
    }
}

/**
 * Get common report reasons for a specific target type
 */
function getReportReasonsForTargetType(targetType) {
    switch (targetType) {
        case REPORT_TARGETS.MESSAGE:
            return [
                { id: REPORT_CATEGORIES.HARASSMENT, label: 'Harassment or bullying' },
                { id: REPORT_CATEGORIES.INAPPROPRIATE_CONTENT, label: 'Inappropriate or offensive content' },
                { id: REPORT_CATEGORIES.SPAM, label: 'Spam or commercial solicitation' },
                { id: REPORT_CATEGORIES.MISLEADING_INFORMATION, label: 'Misleading or false information' },
                { id: REPORT_CATEGORIES.POLICY_VIOLATION, label: 'Platform policy violation' },
                { id: REPORT_CATEGORIES.OTHER, label: 'Other concern' }
            ];

        case REPORT_TARGETS.USER:
            return [
                { id: REPORT_CATEGORIES.IMPERSONATION, label: 'Impersonation or fake identity' },
                { id: REPORT_CATEGORIES.FAKE_CREDENTIALS, label: 'Falsified credentials or experience' },
                { id: REPORT_CATEGORIES.FRAUD, label: 'Fraudulent behavior or scam' },
                { id: REPORT_CATEGORIES.UNPROFESSIONAL_BEHAVIOR, label: 'Unprofessional behavior' },
                { id: REPORT_CATEGORIES.HARASSMENT, label: 'Harassment or bullying' },
                { id: REPORT_CATEGORIES.OTHER, label: 'Other concern' }
            ];

        case REPORT_TARGETS.CONVERSATION:
            return [
                { id: REPORT_CATEGORIES.HARASSMENT, label: 'Harassment or bullying' },
                { id: REPORT_CATEGORIES.INAPPROPRIATE_CONTENT, label: 'Inappropriate or offensive content' },
                { id: REPORT_CATEGORIES.POLICY_VIOLATION, label: 'Platform policy violation' },
                { id: REPORT_CATEGORIES.FRAUD, label: 'Fraudulent activity' },
                { id: REPORT_CATEGORIES.OTHER, label: 'Other concern' }
            ];

        case REPORT_TARGETS.TECHNICAL:
            return [
                { id: REPORT_CATEGORIES.TECHNICAL_ISSUE, label: 'Technical issue or bug' },
                { id: REPORT_CATEGORIES.PAYMENT_ISSUE, label: 'Payment processing issue' },
                { id: REPORT_CATEGORIES.OTHER, label: 'Other technical problem' }
            ];

        default:
            return [
                { id: REPORT_CATEGORIES.INAPPROPRIATE_CONTENT, label: 'Inappropriate content' },
                { id: REPORT_CATEGORIES.POLICY_VIOLATION, label: 'Policy violation' },
                { id: REPORT_CATEGORIES.OTHER, label: 'Other issue' }
            ];
    }
}

// Export the reporting service
export const UserReportingService = {
    // Core reporting functions
    submitReport,
    reviewReport,
    escalateReport,

    // Helper functions
    getReportReasonsForTargetType,

    // Report retrieval
    getReportById: reportStore.getReportById.bind(reportStore),
    getReportsByTargetId: reportStore.getReportsByTargetId.bind(reportStore),
    getReportsByReporterId: reportStore.getReportsByReporterId.bind(reportStore),
    getReportsByStatus: reportStore.getReportsByStatus.bind(reportStore),
    getAllReports: reportStore.getAllReports.bind(reportStore),
    getReports: reportStore.getReports.bind(reportStore),

    // Constants
    REPORT_CATEGORIES,
    REPORT_STATUS,
    REPORT_TARGETS
};

// For CommonJS environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UserReportingService };
}
