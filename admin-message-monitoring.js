/**
 * Admin Message Monitoring Dashboard
 * This file contains functionality for the admin message monitoring interface
 * including message tracking, filtering, and moderation actions.
 */

import { AdminNotificationHandler } from './services/admin-notification-handler.js';
import { AdminNotificationService } from './services/admin-notification-service.js';

// Admin monitoring state
const adminMonitoringState = {
    conversations: [],
    flaggedMessages: [],
    filters: {
        status: 'all',
        period: 'all',
        searchTerm: ''
    },
    pagination: {
        currentPage: 1,
        totalPages: 12,
        itemsPerPage: 10
    },
    selectedConversation: null,
    viewingMessageId: null
};

// Mock data for demonstration
const mockConversations = [
    {
        id: '1',
        subject: 'Business Growth Strategy',
        expert: {
            id: 'exp1',
            name: 'James Wilson',
            avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a'
        },
        client: {
            id: 'cli1',
            name: 'Emily Davis',
            avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330'
        },
        lastActivity: '2 hours ago',
        status: 'flagged',
        messageCount: 28,
        startDate: 'Apr 1, 2025'
    },
    {
        id: '2',
        subject: 'Marketing Strategy Consultation',
        expert: {
            id: 'exp2',
            name: 'Amanda Rodriguez',
            avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e'
        },
        client: {
            id: 'cli2',
            name: 'Michael Brown',
            avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'
        },
        lastActivity: 'Yesterday',
        status: 'normal',
        messageCount: 15,
        startDate: 'Mar 28, 2025'
    },
    {
        id: '3',
        subject: 'Financial Planning Services',
        expert: {
            id: 'exp3',
            name: 'Sarah Johnson',
            avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2'
        },
        client: {
            id: 'cli3',
            name: 'Robert Chen',
            avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d'
        },
        lastActivity: '2 days ago',
        status: 'pending',
        messageCount: 10,
        startDate: 'Mar 25, 2025'
    },
    {
        id: '4',
        subject: 'Website Optimization',
        expert: {
            id: 'exp4',
            name: 'David Wilson',
            avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e'
        },
        client: {
            id: 'cli4',
            name: 'Lisa Thompson',
            avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2'
        },
        lastActivity: '3 days ago',
        status: 'resolved',
        messageCount: 32,
        startDate: 'Mar 20, 2025'
    },
    {
        id: '5',
        subject: 'Legal Consultation',
        expert: {
            id: 'exp5',
            name: 'Thomas Wright',
            avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5'
        },
        client: {
            id: 'cli5',
            name: 'Jennifer Adams',
            avatar: 'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb'
        },
        lastActivity: '1 week ago',
        status: 'normal',
        messageCount: 18,
        startDate: 'Mar 15, 2025'
    }
];

// Parse URL parameters on page load to check for direct navigation from notifications
document.addEventListener('DOMContentLoaded', function() {
    // Initialize notification handler
    AdminNotificationHandler.initNotificationHandler();

    // Check for conversation parameter in URL (coming from notification)
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversation');

    if (conversationId) {
        // Open the conversation from the notification
        setTimeout(() => {
            viewConversation(conversationId);
        }, 500); // Short delay to ensure UI is ready
    }

    // Add demo notification button (for demonstration, would be removed in production)
    const actionBar = document.querySelector('.section-actions');
    if (actionBar) {
        const demoButton = document.createElement('button');
        demoButton.className = 'btn btn-secondary';
        demoButton.innerHTML = '<i class="fas fa-bell"></i> Demo Notification';
        demoButton.addEventListener('click', createDemoNotification);
        actionBar.appendChild(demoButton);
    }
});

// Initialize the dashboard
function initializeAdminDashboard() {
    // Load conversations (mock data for now)
    adminMonitoringState.conversations = mockConversations;

    // Initialize filters
    initializeFilters();

    // Initialize checkboxes
    initializeCheckboxes();

    // Initialize pagination
    initializePagination();

    // Initialize bulk actions
    initializeBulkActions();

    // Initialize modal functionality
    initializeModal();

    // Initialize refresh and export buttons
    initializeButtons();

    // Render conversation list
    renderConversationList();
}

// Create a demo notification for testing
function createDemoNotification() {
    // Create random sample data
    const demoTypes = [
        {
            type: AdminNotificationService.NOTIFICATION_TYPES.MESSAGE_FLAGGED,
            data: {
                flagReason: 'Potential external contact',
                confidenceScore: Math.random() * 0.5 + 0.5, // 0.5-1.0
                severity: 'medium',
                conversationSubject: 'Business Strategy Consultation',
                conversationId: '1'
            },
            priority: AdminNotificationService.PRIORITY_LEVELS.MEDIUM
        },
        {
            type: AdminNotificationService.NOTIFICATION_TYPES.USER_REPORTED,
            data: {
                reportReason: 'Unprofessional behavior',
                reporterType: 'Client',
                reporterName: 'John Smith',
                reportedType: 'Expert',
                reportedName: 'Sarah Johnson',
                reportedId: 'exp3'
            },
            priority: AdminNotificationService.PRIORITY_LEVELS.HIGH
        },
        {
            type: AdminNotificationService.NOTIFICATION_TYPES.SYSTEM_ALERT,
            data: {
                alertType: 'High Traffic',
                message: 'The platform is experiencing unusually high traffic. Performance monitoring engaged.'
            },
            priority: AdminNotificationService.PRIORITY_LEVELS.LOW
        }
    ];

    // Select a random demo notification
    const demoNotification = demoTypes[Math.floor(Math.random() * demoTypes.length)];

    // Handle the notification based on type
    let result;
    switch (demoNotification.type) {
        case AdminNotificationService.NOTIFICATION_TYPES.MESSAGE_FLAGGED:
            result = AdminNotificationService.handleFlaggedMessage(
                demoNotification.data,
                { id: demoNotification.data.conversationId, subject: demoNotification.data.conversationSubject }
            );
            break;

        case AdminNotificationService.NOTIFICATION_TYPES.USER_REPORTED:
            result = AdminNotificationService.handleUserReport(demoNotification.data);
            break;

        case AdminNotificationService.NOTIFICATION_TYPES.SYSTEM_ALERT:
            result = AdminNotificationService.sendSystemAlert(
                demoNotification.data.alertType,
                demoNotification.data.message,
                demoNotification.priority
            );
            break;

        default:
            // Use the simulate method as fallback
            result = AdminNotificationHandler.simulateNewNotification(
                demoNotification.type,
                demoNotification.data,
                demoNotification.priority
            );
    }

    // Update the notifications
    AdminNotificationHandler.refreshNotifications();

    console.log('Demo notification created:', result);
}

// Initialize filter controls
function initializeFilters() {
    // Status filter
    const statusFilter = document.getElementById('filter-status');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            adminMonitoringState.filters.status = this.value;
            renderConversationList();
        });
    }

    // Time period filter
    const periodFilter = document.getElementById('filter-period');
    if (periodFilter) {
        periodFilter.addEventListener('change', function() {
            adminMonitoringState.filters.period = this.value;
            renderConversationList();
        });
    }

    // Search functionality
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            adminMonitoringState.filters.searchTerm = this.value.toLowerCase().trim();
            renderConversationList();
        });
    }
}

// Initialize checkbox functionality
function initializeCheckboxes() {
    // Select all checkbox
    const selectAllCheckbox = document.getElementById('select-all');
    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function() {
            const isChecked = this.checked;
            const rowCheckboxes = document.querySelectorAll('.row-checkbox');
            rowCheckboxes.forEach(checkbox => {
                checkbox.checked = isChecked;
            });
        });
    }

    // Listen for individual checkbox changes to update the "select all" state
    document.addEventListener('change', function(e) {
        if (e.target && e.target.classList.contains('row-checkbox')) {
            updateSelectAllCheckbox();
        }
    });
}

// Update the state of the "select all" checkbox based on individual selections
function updateSelectAllCheckbox() {
    const selectAllCheckbox = document.getElementById('select-all');
    const rowCheckboxes = document.querySelectorAll('.row-checkbox');

    if (rowCheckboxes.length === 0) return;

    let allChecked = true;
    rowCheckboxes.forEach(checkbox => {
        if (!checkbox.checked) {
            allChecked = false;
        }
    });

    if (selectAllCheckbox) {
        selectAllCheckbox.checked = allChecked;
    }
}

// Initialize pagination controls
function initializePagination() {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    // Previous page button
    const prevBtn = pagination.querySelector('.pagination-btn:first-child');
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            if (adminMonitoringState.pagination.currentPage > 1) {
                adminMonitoringState.pagination.currentPage--;
                updatePagination();
                renderConversationList();
            }
        });
    }

    // Next page button
    const nextBtn = pagination.querySelector('.pagination-btn:last-child');
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            if (adminMonitoringState.pagination.currentPage < adminMonitoringState.pagination.totalPages) {
                adminMonitoringState.pagination.currentPage++;
                updatePagination();
                renderConversationList();
            }
        });
    }

    // Page number buttons
    const pageButtons = pagination.querySelectorAll('.pagination-btn:not(:first-child):not(:last-child)');
    pageButtons.forEach(button => {
        if (!button.classList.contains('pagination-ellipsis')) {
            button.addEventListener('click', function() {
                const page = parseInt(this.textContent);
                if (!isNaN(page)) {
                    adminMonitoringState.pagination.currentPage = page;
                    updatePagination();
                    renderConversationList();
                }
            });
        }
    });
}

// Update pagination UI based on current state
function updatePagination() {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    const currentPage = adminMonitoringState.pagination.currentPage;
    const totalPages = adminMonitoringState.pagination.totalPages;

    // Update page buttons active state
    const pageButtons = pagination.querySelectorAll('.pagination-btn:not(:first-child):not(:last-child)');
    pageButtons.forEach(button => {
        if (!button.classList.contains('pagination-ellipsis')) {
            const pageNum = parseInt(button.textContent);
            if (!isNaN(pageNum)) {
                if (pageNum === currentPage) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            }
        }
    });

    // Update prev/next buttons disabled state
    const prevBtn = pagination.querySelector('.pagination-btn:first-child');
    const nextBtn = pagination.querySelector('.pagination-btn:last-child');

    if (prevBtn) {
        prevBtn.disabled = currentPage === 1;
    }

    if (nextBtn) {
        nextBtn.disabled = currentPage === totalPages;
    }
}

// Initialize bulk actions
function initializeBulkActions() {
    const bulkActionSelect = document.querySelector('.bulk-action');
    const applyBulkActionBtn = document.querySelector('.table-actions .btn');

    if (bulkActionSelect && applyBulkActionBtn) {
        applyBulkActionBtn.addEventListener('click', function() {
            const action = bulkActionSelect.value;
            if (!action) {
                alert('Please select an action.');
                return;
            }

            const selectedRows = Array.from(document.querySelectorAll('.row-checkbox:checked'));
            if (selectedRows.length === 0) {
                alert('Please select at least one conversation.');
                return;
            }

            const selectedIds = selectedRows.map(checkbox => {
                const row = checkbox.closest('tr');
                return row.getAttribute('data-id');
            });

            applyBulkAction(action, selectedIds);
        });
    }
}

// Apply bulk action to selected conversations
function applyBulkAction(action, ids) {
    // In a real app, this would be an API call
    console.log(`Applying action "${action}" to conversations:`, ids);

    switch (action) {
        case 'flag':
            alert(`Flagged ${ids.length} conversations.`);
            break;
        case 'resolve':
            alert(`Marked ${ids.length} conversations as resolved.`);
            break;
        case 'archive':
            alert(`Archived ${ids.length} conversations.`);
            break;
        case 'delete':
            if (confirm(`Are you sure you want to delete ${ids.length} conversations? This action cannot be undone.`)) {
                alert(`Deleted ${ids.length} conversations.`);
            }
            break;
    }

    // Uncheck all checkboxes after action
    document.querySelectorAll('.row-checkbox, #select-all').forEach(checkbox => {
        checkbox.checked = false;
    });
}

// Initialize buttons
function initializeButtons() {
    // Refresh data button
    const refreshBtn = document.getElementById('refresh-data-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', function() {
            // In a real app, this would fetch fresh data from the API
            alert('Refreshing data...');
            setTimeout(() => {
                renderConversationList();
                alert('Data refreshed!');
            }, 1000);
        });
    }

    // Export report button
    const exportBtn = document.getElementById('export-report-btn');
    if (exportBtn) {
        exportBtn.addEventListener('click', function() {
            // In a real app, this would generate and download a report
            alert('Generating report...');
            setTimeout(() => {
                alert('Report downloaded!');
            }, 1000);
        });
    }
}

// Render the filtered conversation list
function renderConversationList() {
    const tableBody = document.querySelector('.admin-table tbody');
    if (!tableBody) return;

    // Get filtered conversations
    const filteredConversations = filterConversations();

    // Clear existing rows
    tableBody.innerHTML = '';

    // Generate new rows
    if (filteredConversations.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="7" class="no-results">No conversations found matching your filters.</td>
            </tr>
        `;
        return;
    }

    filteredConversations.forEach(conversation => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', conversation.id);

        row.innerHTML = `
            <td>
                <input type="checkbox" class="row-checkbox">
            </td>
            <td>
                <div class="conversation-preview">
                    <span class="conversation-subject">${conversation.subject}</span>
                    <span class="conversation-excerpt">Latest message preview would appear here...</span>
                </div>
            </td>
            <td>
                <div class="user-info">
                    <img src="${conversation.expert.avatar}" alt="${conversation.expert.name}" class="user-avatar">
                    <span>${conversation.expert.name}</span>
                </div>
            </td>
            <td>
                <div class="user-info">
                    <img src="${conversation.client.avatar}" alt="${conversation.client.name}" class="user-avatar">
                    <span>${conversation.client.name}</span>
                </div>
            </td>
            <td>${conversation.lastActivity}</td>
            <td><span class="status-badge ${conversation.status}">${capitalizeFirstLetter(conversation.status)}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon view-conversation-btn" title="View Conversation" data-id="${conversation.id}">
                        <i class="fas fa-eye"></i>
                    </button>
                    ${getActionButtonsForStatus(conversation.status, conversation.id)}
                </div>
            </td>
        `;

        tableBody.appendChild(row);
    });

    // Add event listeners to view buttons
    document.querySelectorAll('.view-conversation-btn').forEach(button => {
        button.addEventListener('click', function() {
            const convId = this.getAttribute('data-id');
            viewConversation(convId);
        });
    });

    // Add event listeners to action buttons
    document.querySelectorAll('.action-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const action = this.getAttribute('data-action');
            const convId = this.getAttribute('data-id');
            handleConversationAction(action, convId);
        });
    });
}

// Filter conversations based on current filters
function filterConversations() {
    const { status, period, searchTerm } = adminMonitoringState.filters;

    return adminMonitoringState.conversations.filter(conversation => {
        // Filter by status
        if (status !== 'all' && conversation.status !== status) {
            return false;
        }

        // Filter by period (in a real app, this would use actual dates)
        if (period !== 'all') {
            // Simplified example
            if (period === 'today' && !conversation.lastActivity.includes('hours ago')) {
                return false;
            } else if (period === 'week' && conversation.lastActivity.includes('week ago')) {
                return false;
            } else if (period === 'month' && conversation.lastActivity.includes('month ago')) {
                return false;
            }
        }

        // Filter by search term
        if (searchTerm) {
            const searchableContent = [
                conversation.subject,
                conversation.expert.name,
                conversation.client.name
            ].join(' ').toLowerCase();

            if (!searchableContent.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });
}

// Get action buttons based on conversation status
function getActionButtonsForStatus(status, id) {
    switch(status) {
        case 'flagged':
            return `
                <button class="btn-icon action-btn" data-action="resolve" data-id="${id}" title="Mark as Resolved">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-icon action-btn" data-action="delete" data-id="${id}" title="Delete">
                    <i class="fas fa-trash"></i>
                </button>
            `;
        case 'pending':
            return `
                <button class="btn-icon action-btn" data-action="approve" data-id="${id}" title="Approve">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn-icon action-btn" data-action="flag" data-id="${id}" title="Flag">
                    <i class="far fa-flag"></i>
                </button>
            `;
        case 'resolved':
            return `
                <button class="btn-icon action-btn" data-action="flag" data-id="${id}" title="Flag">
                    <i class="far fa-flag"></i>
                </button>
                <button class="btn-icon action-btn" data-action="archive" data-id="${id}" title="Archive">
                    <i class="fas fa-archive"></i>
                </button>
            `;
        case 'normal':
        default:
            return `
                <button class="btn-icon action-btn" data-action="flag" data-id="${id}" title="Flag">
                    <i class="far fa-flag"></i>
                </button>
                <button class="btn-icon action-btn" data-action="archive" data-id="${id}" title="Archive">
                    <i class="fas fa-archive"></i>
                </button>
            `;
    }
}

// Handle conversation actions
function handleConversationAction(action, conversationId) {
    // In a real app, this would send an API request
    console.log(`Action ${action} on conversation ${conversationId}`);

    // Find the conversation
    const conversation = adminMonitoringState.conversations.find(conv => conv.id === conversationId);
    if (!conversation) return;

    switch(action) {
        case 'flag':
            conversation.status = 'flagged';
            alert(`Conversation "${conversation.subject}" has been flagged for review.`);
            break;
        case 'resolve':
            conversation.status = 'resolved';
            alert(`Conversation "${conversation.subject}" has been marked as resolved.`);
            break;
        case 'approve':
            conversation.status = 'normal';
            alert(`Conversation "${conversation.subject}" has been approved.`);
            break;
        case 'archive':
            // In this demo, we'll just say it was archived
            alert(`Conversation "${conversation.subject}" has been archived.`);
            break;
        case 'delete':
            if (confirm(`Are you sure you want to delete the conversation "${conversation.subject}"?`)) {
                // In this demo, we'll just remove from the array
                const index = adminMonitoringState.conversations.findIndex(conv => conv.id === conversationId);
                if (index !== -1) {
                    adminMonitoringState.conversations.splice(index, 1);
                    alert(`Conversation "${conversation.subject}" has been deleted.`);
                }
            }
            break;
    }

    // Re-render the list
    renderConversationList();
}

// Initialize modal functionality
function initializeModal() {
    const modal = document.getElementById('message-viewer-modal');
    if (!modal) return;

    // Close button
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    // Close button in footer
    const closeViewerBtn = document.getElementById('close-viewer-btn');
    if (closeViewerBtn) {
        closeViewerBtn.addEventListener('click', function() {
            modal.style.display = 'none';
        });
    }

    // Resolve flag button
    const resolveFlagBtn = document.getElementById('resolve-flag-btn');
    if (resolveFlagBtn) {
        resolveFlagBtn.addEventListener('click', function() {
            if (adminMonitoringState.selectedConversation) {
                const convoId = adminMonitoringState.selectedConversation.id;
                handleConversationAction('resolve', convoId);
                modal.style.display = 'none';
            }
        });
    }

    // Suspend conversation button
    const suspendBtn = document.getElementById('suspend-conversation-btn');
    if (suspendBtn) {
        suspendBtn.addEventListener('click', function() {
            if (adminMonitoringState.selectedConversation) {
                alert(`This would suspend the conversation and notify all parties of the suspension.`);
                modal.style.display = 'none';
            }
        });
    }

    // Flag message buttons
    modal.addEventListener('click', function(e) {
        if (e.target && e.target.closest('.btn-text[title="Flag Message"]')) {
            const messageElement = e.target.closest('.message');
            if (messageElement) {
                const messageId = messageElement.getAttribute('data-message-id') || 'unknown';
                flagMessage(messageId, messageElement);
            }
        }
    });

    // Approve message buttons
    modal.addEventListener('click', function(e) {
        if (e.target && e.target.closest('.approve-btn')) {
            const messageElement = e.target.closest('.message');
            if (messageElement) {
                const messageId = messageElement.getAttribute('data-message-id') || 'unknown';
                approveMessage(messageId, messageElement);
            }
        }
    });

    // Warn expert buttons
    modal.addEventListener('click', function(e) {
        if (e.target && e.target.closest('.warn-btn')) {
            const messageElement = e.target.closest('.message');
            if (messageElement) {
                const messageId = messageElement.getAttribute('data-message-id') || 'unknown';
                warnExpert(messageId);
            }
        }
    });

    // Download transcript button
    const downloadTranscriptBtn = document.getElementById('download-transcript-btn');
    if (downloadTranscriptBtn) {
        downloadTranscriptBtn.addEventListener('click', function() {
            if (adminMonitoringState.selectedConversation) {
                alert(`This would download a transcript of the conversation.`);
            }
        });
    }

    // Analyze conversation button
    const analyzeConversationBtn = document.getElementById('analyze-conversation-btn');
    if (analyzeConversationBtn) {
        analyzeConversationBtn.addEventListener('click', function() {
            if (adminMonitoringState.selectedConversation) {
                alert(`This would open a conversation analysis dashboard with metrics and insights.`);
            }
        });
    }

    // Save notes button
    const saveNotesBtn = modal.querySelector('.admin-notes .btn-primary');
    if (saveNotesBtn) {
        saveNotesBtn.addEventListener('click', function() {
            const notes = modal.querySelector('.admin-notes textarea').value;
            alert(`Notes saved: ${notes}`);
        });
    }

    // Close when clicking outside
    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

// View a conversation in the modal
function viewConversation(conversationId) {
    const conversation = adminMonitoringState.conversations.find(conv => conv.id === conversationId);
    if (!conversation) return;

    // Store the selected conversation
    adminMonitoringState.selectedConversation = conversation;

    // Update modal content
    const modal = document.getElementById('message-viewer-modal');
    if (!modal) return;

    // Update conversation header
    updateConversationHeader(conversation);

    // Show modal
    modal.style.display = 'block';
}

// Update the conversation header in the modal
function updateConversationHeader(conversation) {
    // Update subject
    document.querySelector('.conversation-info h3').textContent = conversation.subject;

    // Update participants
    const expertParticipant = document.querySelector('.participant:first-child');
    if (expertParticipant) {
        expertParticipant.querySelector('img').src = conversation.expert.avatar;
        expertParticipant.querySelector('img').alt = conversation.expert.name;
        expertParticipant.querySelector('span').textContent = `${conversation.expert.name} (Expert)`;
    }

    const clientParticipant = document.querySelector('.participant:last-child');
    if (clientParticipant) {
        clientParticipant.querySelector('img').src = conversation.client.avatar;
        clientParticipant.querySelector('img').alt = conversation.client.name;
        clientParticipant.querySelector('span').textContent = `${conversation.client.name} (Client)`;
    }

    // Update details
    const details = document.querySelectorAll('.conversation-details span');
    if (details.length >= 3) {
        details[0].innerHTML = `<i class="fas fa-calendar"></i> Started: ${conversation.startDate}`;
        details[1].innerHTML = `<i class="fas fa-exchange-alt"></i> ${conversation.messageCount} messages`;
        details[2].innerHTML = `<i class="fas fa-clock"></i> Last activity: ${conversation.lastActivity}`;
    }

    // Show/hide resolve flag button based on status
    const resolveFlagBtn = document.getElementById('resolve-flag-btn');
    if (resolveFlagBtn) {
        resolveFlagBtn.style.display = conversation.status === 'flagged' ? 'block' : 'none';
    }
}

// Flag a message for review
function flagMessage(messageId, messageElement) {
    // In a real app, this would send an API request
    console.log(`Flagging message: ${messageId}`);

    // Add flagged class and indicator
    if (messageElement && !messageElement.classList.contains('flagged')) {
        messageElement.classList.add('flagged');

        const header = messageElement.querySelector('.message-header');
        if (header) {
            const flagIndicator = document.createElement('span');
            flagIndicator.className = 'flag-indicator';
            flagIndicator.innerHTML = '<i class="fas fa-flag"></i> Flagged';
            header.appendChild(flagIndicator);
        }

        const footer = messageElement.querySelector('.message-footer');
        if (footer) {
            footer.innerHTML = `
                <div class="message-flagged-info">
                    <p><strong>Flagged reason:</strong> Manual admin flag</p>
                    <p><strong>Flagged by:</strong> Admin User</p>
                    <p><strong>Flagged on:</strong> ${new Date().toLocaleString()}</p>
                </div>
                <div class="message-actions">
                    <button class="btn-text approve-btn" title="Approve Message"><i class="fas fa-check"></i> Approve</button>
                    <button class="btn-text warn-btn" title="Send Warning"><i class="fas fa-exclamation-triangle"></i> Warn Sender</button>
                </div>
            `;
        }

        // Create a notification for the manual flag
        const selectedConversation = adminMonitoringState.selectedConversation;
        if (selectedConversation) {
            AdminNotificationService.handleFlaggedMessage(
                {
                    flagReason: 'Manual admin flag',
                    confidenceScore: 1.0,
                    severity: 'medium',
                    messageId: messageId
                },
                {
                    id: selectedConversation.id,
                    subject: selectedConversation.subject || 'Untitled Conversation'
                }
            );

            // Refresh notifications
            AdminNotificationHandler.refreshNotifications();
        }

        alert(`Message has been flagged for review.`);
    }
}

// Approve a flagged message
function approveMessage(messageId, messageElement) {
    // In a real app, this would send an API request
    console.log(`Approving message: ${messageId}`);

    // Remove flagged class and indicators
    if (messageElement && messageElement.classList.contains('flagged')) {
        messageElement.classList.remove('flagged');

        const flagIndicator = messageElement.querySelector('.flag-indicator');
        if (flagIndicator) {
            flagIndicator.remove();
        }

        const footer = messageElement.querySelector('.message-footer');
        if (footer) {
            footer.innerHTML = `
                <div class="message-actions">
                    <button class="btn-text" title="Flag Message"><i class="far fa-flag"></i> Flag</button>
                </div>
            `;
        }

        alert(`Message has been approved and unflagged.`);
    }
}

// Send a warning to an expert
function warnExpert(messageId) {
    // In a real app, this would send an API request and email
    console.log(`Sending warning for message: ${messageId}`);

    const expert = adminMonitoringState.selectedConversation?.expert;
    if (expert) {
        // Create a system notification about the warning
        AdminNotificationService.sendSystemAlert(
            'Warning Sent',
            `A warning has been sent to expert ${expert.name} regarding message #${messageId}.`,
            AdminNotificationService.PRIORITY_LEVELS.MEDIUM
        );

        // Refresh notifications
        AdminNotificationHandler.refreshNotifications();

        alert(`Warning sent to ${expert.name}. They will receive an email with details about the policy violation.`);
    }
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Export functions for other modules
export {
    flagMessage,
    approveMessage,
    warnExpert,
    viewConversation
};
