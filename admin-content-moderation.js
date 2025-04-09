/**
 * Admin Content Moderation
 * Handles content filtering, review, and moderation actions
 */

import { AdminNotificationHandler } from './services/admin-notification-handler.js';

// State management for content moderation
const contentModerationState = {
    // Filters
    filters: {
        contentType: 'all',
        status: 'pending',
        dateStart: null,
        dateEnd: null,
        searchTerm: ''
    },
    // Pagination
    pagination: {
        currentPage: 1,
        totalPages: 10,
        itemsPerPage: 10
    },
    // Selected content items
    selectedContent: [],
    // Active content item for review
    activeContent: null,
    // Tags for moderation
    activeTags: [],
    // Saved filters
    savedFilters: []
};

/**
 * Initialize the page when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the notification system
    AdminNotificationHandler.initNotificationHandler();

    // Initialize event listeners
    initEventListeners();

    // Initialize date range picker
    initDateRangePicker();

    // Load initial content data
    loadContentData();
});

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    // Filter controls
    initFilterControls();

    // Content checkboxes
    initContentCheckboxes();

    // Content action buttons
    initContentActionButtons();

    // Bulk action controls
    initBulkActions();

    // Modal controls
    initModalControls();

    // Tag management
    initTagManagement();
}

/**
 * Initialize filter controls
 */
function initFilterControls() {
    // Content type filter
    const contentTypeSelect = document.getElementById('content-type');
    if (contentTypeSelect) {
        contentTypeSelect.addEventListener('change', function() {
            contentModerationState.filters.contentType = this.value;
        });
    }

    // Status filter
    const statusSelect = document.getElementById('content-status');
    if (statusSelect) {
        statusSelect.addEventListener('change', function() {
            contentModerationState.filters.status = this.value;
        });
    }

    // Search input
    const searchInput = document.getElementById('content-search');
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', function() {
            contentModerationState.filters.searchTerm = searchInput.value.trim();
            loadContentData();
        });

        // Also allow searching on enter key
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                contentModerationState.filters.searchTerm = searchInput.value.trim();
                loadContentData();
            }
        });
    }

    // Apply filters button
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            loadContentData();
        });
    }

    // Reset filters button
    const resetFiltersBtn = document.getElementById('reset-filters');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', function() {
            resetFilters();
        });
    }

    // Save filter button
    const saveFilterBtn = document.getElementById('save-filter');
    if (saveFilterBtn) {
        saveFilterBtn.addEventListener('click', function() {
            saveCurrentFilter();
        });
    }

    // Auto-assign content button
    const autoAssignBtn = document.getElementById('auto-assign-btn');
    if (autoAssignBtn) {
        autoAssignBtn.addEventListener('click', function() {
            autoAssignContent();
        });
    }

    // AI pre-review button
    const aiReviewBtn = document.getElementById('ai-review-btn');
    if (aiReviewBtn) {
        aiReviewBtn.addEventListener('click', function() {
            runAIPreReview();
        });
    }

    // Update guidelines button
    const updateGuidelinesBtn = document.getElementById('update-guidelines-btn');
    if (updateGuidelinesBtn) {
        updateGuidelinesBtn.addEventListener('click', function() {
            showUpdateGuidelinesModal();
        });
    }
}

/**
 * Initialize date range picker
 */
function initDateRangePicker() {
    // Submission date filter
    $('#content-date').daterangepicker({
        autoUpdateInput: false,
        locale: {
            cancelLabel: 'Clear',
            format: 'MMM DD, YYYY'
        }
    });

    $('#content-date').on('apply.daterangepicker', function(ev, picker) {
        $(this).val(picker.startDate.format('MMM DD, YYYY') + ' - ' + picker.endDate.format('MMM DD, YYYY'));
        contentModerationState.filters.dateStart = picker.startDate.toDate();
        contentModerationState.filters.dateEnd = picker.endDate.toDate();
    });

    $('#content-date').on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
        contentModerationState.filters.dateStart = null;
        contentModerationState.filters.dateEnd = null;
    });
}

/**
 * Initialize content checkboxes
 */
function initContentCheckboxes() {
    // Individual content checkboxes
    const contentCheckboxes = document.querySelectorAll('.content-checkbox');
    contentCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectedContent();
        });
    });

    // Select all control would be added here if implemented
}

/**
 * Initialize content action buttons
 */
function initContentActionButtons() {
    // View details buttons
    const viewButtons = document.querySelectorAll('.content-actions button[title="View Details"]');
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const contentCard = this.closest('.content-card');
            const contentId = contentCard.querySelector('.content-checkbox').getAttribute('data-id');
            viewContentDetails(contentId);
        });
    });

    // Approve buttons
    const approveButtons = document.querySelectorAll('.content-actions button[title="Approve"]');
    approveButtons.forEach(button => {
        button.addEventListener('click', function() {
            const contentCard = this.closest('.content-card');
            const contentId = contentCard.querySelector('.content-checkbox').getAttribute('data-id');
            approveContent(contentId);
        });
    });

    // Reject buttons
    const rejectButtons = document.querySelectorAll('.content-actions button[title="Reject"]');
    rejectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const contentCard = this.closest('.content-card');
            const contentId = contentCard.querySelector('.content-checkbox').getAttribute('data-id');
            rejectContent(contentId);
        });
    });

    // Flag buttons
    const flagButtons = document.querySelectorAll('.content-actions button[title="Flag"]');
    flagButtons.forEach(button => {
        button.addEventListener('click', function() {
            const contentCard = this.closest('.content-card');
            const contentId = contentCard.querySelector('.content-checkbox').getAttribute('data-id');
            flagContent(contentId);
        });
    });
}

/**
 * Initialize bulk action controls
 */
function initBulkActions() {
    // Apply bulk action button
    const applyBulkActionBtn = document.getElementById('apply-bulk-action');
    if (applyBulkActionBtn) {
        applyBulkActionBtn.addEventListener('click', function() {
            applyBulkAction();
        });
    }
}

/**
 * Initialize modal controls
 */
function initModalControls() {
    // Modal close button
    const modalCloseBtn = document.querySelector('.modal-close');
    if (modalCloseBtn) {
        modalCloseBtn.addEventListener('click', function() {
            closeContentModal();
        });
    }

    // Cancel review button
    const cancelReviewBtn = document.getElementById('cancel-review-btn');
    if (cancelReviewBtn) {
        cancelReviewBtn.addEventListener('click', function() {
            closeContentModal();
        });
    }

    // Submit review button
    const submitReviewBtn = document.getElementById('submit-review-btn');
    if (submitReviewBtn) {
        submitReviewBtn.addEventListener('click', function() {
            submitContentReview();
        });
    }

    // Modal action buttons
    const modalApproveBtn = document.getElementById('modal-approve-btn');
    if (modalApproveBtn) {
        modalApproveBtn.addEventListener('click', function() {
            setModalDecision('approve');
        });
    }

    const modalRejectBtn = document.getElementById('modal-reject-btn');
    if (modalRejectBtn) {
        modalRejectBtn.addEventListener('click', function() {
            setModalDecision('reject');
        });
    }

    const modalFlagBtn = document.getElementById('modal-flag-btn');
    if (modalFlagBtn) {
        modalFlagBtn.addEventListener('click', function() {
            setModalDecision('flag');
        });
    }
}

/**
 * Initialize tag management
 */
function initTagManagement() {
    // Add tag button
    const addTagBtn = document.getElementById('add-tag-btn');
    if (addTagBtn) {
        addTagBtn.addEventListener('click', function() {
            addTag();
        });
    }

    // Tag input enter key
    const tagInput = document.getElementById('tag-input');
    if (tagInput) {
        tagInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
            }
        });
    }

    // Remove tag buttons
    initRemoveTagButtons();
}

/**
 * Initialize remove tag buttons
 */
function initRemoveTagButtons() {
    const removeTagButtons = document.querySelectorAll('.tag-remove');
    removeTagButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tag = this.parentElement;
            const tagText = tag.textContent.trim().replace('×', '').trim();
            removeTag(tagText);
        });
    });
}

/**
 * Update the list of selected content
 */
function updateSelectedContent() {
    const checkboxes = document.querySelectorAll('.content-checkbox:checked');
    const selectedContentIds = Array.from(checkboxes).map(checkbox => checkbox.getAttribute('data-id'));

    contentModerationState.selectedContent = selectedContentIds;

    // Update selected counter
    const counter = document.getElementById('selection-counter');
    if (counter) {
        counter.textContent = `${selectedContentIds.length} item${selectedContentIds.length !== 1 ? 's' : ''} selected`;
    }

    // Enable/disable bulk action button
    const bulkActionBtn = document.getElementById('apply-bulk-action');
    if (bulkActionBtn) {
        bulkActionBtn.disabled = selectedContentIds.length === 0;
    }
}

/**
 * Reset all filters to default values
 */
function resetFilters() {
    contentModerationState.filters = {
        contentType: 'all',
        status: 'pending',
        dateStart: null,
        dateEnd: null,
        searchTerm: ''
    };

    // Reset UI elements
    const contentTypeSelect = document.getElementById('content-type');
    if (contentTypeSelect) contentTypeSelect.value = 'all';

    const statusSelect = document.getElementById('content-status');
    if (statusSelect) statusSelect.value = 'pending';

    const dateInput = document.getElementById('content-date');
    if (dateInput) dateInput.value = '';

    const searchInput = document.getElementById('content-search');
    if (searchInput) searchInput.value = '';

    // Reload content with reset filters
    loadContentData();
}

/**
 * Save the current filter for future use
 */
function saveCurrentFilter() {
    const filterName = prompt('Enter a name for this filter:');
    if (!filterName) return;

    const newFilter = {
        id: Date.now().toString(),
        name: filterName,
        filters: { ...contentModerationState.filters }
    };

    contentModerationState.savedFilters.push(newFilter);

    // In a real app, would save to localStorage or server
    alert(`Filter "${filterName}" has been saved.`);
}

/**
 * Apply the selected bulk action to selected content
 */
function applyBulkAction() {
    const action = document.getElementById('bulk-action').value;
    if (!action) {
        alert('Please select an action.');
        return;
    }

    if (contentModerationState.selectedContent.length === 0) {
        alert('Please select at least one content item.');
        return;
    }

    // Handle different bulk actions
    switch (action) {
        case 'approve':
            bulkApproveContent();
            break;
        case 'reject':
            bulkRejectContent();
            break;
        case 'flag':
            bulkFlagContent();
            break;
        case 'assign':
            showAssignModeratorModal();
            break;
    }
}

/**
 * Load content data based on current filters and pagination
 */
function loadContentData() {
    // In a real app, this would make an API call
    console.log('Loading content with filters:', contentModerationState.filters);
    console.log('Page:', contentModerationState.pagination.currentPage);

    // Reset selected content
    contentModerationState.selectedContent = [];
    updateSelectedContent();

    // For demo purposes, we'll pretend the data has been loaded
    // In a real application, this would fetch data from the server and update the UI
}

/**
 * View content details in modal
 */
function viewContentDetails(contentId) {
    // In a real app, would fetch content details from server
    console.log(`Viewing content details: ${contentId}`);

    // Set active content
    contentModerationState.activeContent = contentId;

    // Populate content detail modal
    populateContentModal(contentId);

    // Show modal
    const modal = document.getElementById('content-detail-modal');
    if (modal) {
        modal.style.display = 'block';
    }
}

/**
 * Populate the content modal with content data
 */
function populateContentModal(contentId) {
    // In a real app, would populate with actual content data
    const container = document.getElementById('content-detail-container');
    if (!container) return;

    // For demo purposes, populate with mock data
    container.innerHTML = `
        <div class="content-detail">
            <h3>Content ID: ${contentId}</h3>
            <p>This is where the full content would be displayed for review.</p>
            <div class="content-detail-meta">
                <p><strong>Submitted by:</strong> User123</p>
                <p><strong>Submission Date:</strong> April 2, 2023</p>
                <p><strong>Content Type:</strong> Expert Profile</p>
            </div>
        </div>
    `;

    // Reset decision state
    resetModalDecisionState();
}

/**
 * Reset the modal decision state
 */
function resetModalDecisionState() {
    // Clear decision buttons
    const approveBtn = document.getElementById('modal-approve-btn');
    const rejectBtn = document.getElementById('modal-reject-btn');
    const flagBtn = document.getElementById('modal-flag-btn');

    if (approveBtn) approveBtn.classList.remove('active');
    if (rejectBtn) rejectBtn.classList.remove('active');
    if (flagBtn) flagBtn.classList.remove('active');

    // Clear feedback
    const feedback = document.getElementById('moderation-feedback');
    if (feedback) feedback.value = '';

    // Clear tags
    contentModerationState.activeTags = [];
    updateTagsDisplay();
}

/**
 * Set the modal decision
 */
function setModalDecision(decision) {
    // Update UI
    const approveBtn = document.getElementById('modal-approve-btn');
    const rejectBtn = document.getElementById('modal-reject-btn');
    const flagBtn = document.getElementById('modal-flag-btn');

    if (approveBtn) approveBtn.classList.remove('active');
    if (rejectBtn) rejectBtn.classList.remove('active');
    if (flagBtn) flagBtn.classList.remove('active');

    // Highlight the selected decision
    switch (decision) {
        case 'approve':
            if (approveBtn) approveBtn.classList.add('active');
            break;
        case 'reject':
            if (rejectBtn) rejectBtn.classList.add('active');
            break;
        case 'flag':
            if (flagBtn) flagBtn.classList.add('active');
            break;
    }
}

/**
 * Submit the content review
 */
function submitContentReview() {
    // Get active decision
    let decision = null;

    const approveBtn = document.getElementById('modal-approve-btn');
    const rejectBtn = document.getElementById('modal-reject-btn');
    const flagBtn = document.getElementById('modal-flag-btn');

    if (approveBtn && approveBtn.classList.contains('active')) decision = 'approve';
    else if (rejectBtn && rejectBtn.classList.contains('active')) decision = 'reject';
    else if (flagBtn && flagBtn.classList.contains('active')) decision = 'flag';

    if (!decision) {
        alert('Please select a decision (Approve, Reject, or Flag).');
        return;
    }

    // Get feedback
    const feedback = document.getElementById('moderation-feedback').value;

    // In a real app, would submit to server
    console.log(`Submitting review for content ${contentModerationState.activeContent}:`);
    console.log(`Decision: ${decision}`);
    console.log(`Feedback: ${feedback}`);
    console.log(`Tags: ${contentModerationState.activeTags.join(', ')}`);

    // Simulate success
    alert(`Content ${decision}ed successfully.`);

    // Close modal
    closeContentModal();

    // Reload content
    loadContentData();
}

/**
 * Close the content modal
 */
function closeContentModal() {
    const modal = document.getElementById('content-detail-modal');
    if (modal) {
        modal.style.display = 'none';
    }

    // Clear active content
    contentModerationState.activeContent = null;
}

/**
 * Add a tag to the active content
 */
function addTag() {
    const tagInput = document.getElementById('tag-input');
    if (!tagInput) return;

    const tag = tagInput.value.trim();
    if (!tag) return;

    // Add tag if it doesn't already exist
    if (!contentModerationState.activeTags.includes(tag)) {
        contentModerationState.activeTags.push(tag);
        updateTagsDisplay();
    }

    // Clear input
    tagInput.value = '';
}

/**
 * Remove a tag from the active content
 */
function removeTag(tag) {
    contentModerationState.activeTags = contentModerationState.activeTags.filter(t => t !== tag);
    updateTagsDisplay();
}

/**
 * Update the tags display
 */
function updateTagsDisplay() {
    const tagsContainer = document.getElementById('tags-container');
    if (!tagsContainer) return;

    // Clear container
    tagsContainer.innerHTML = '';

    // Add tags
    contentModerationState.activeTags.forEach(tag => {
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.innerHTML = `${tag} <button class="tag-remove">&times;</button>`;
        tagsContainer.appendChild(tagElement);
    });

    // Reinitialize remove buttons
    initRemoveTagButtons();
}

/**
 * Auto-assign content to moderators
 */
function autoAssignContent() {
    // In a real app, would call API to assign content
    alert('Content auto-assignment would happen here. This would distribute content evenly among available moderators.');
}

/**
 * Run AI pre-review on content
 */
function runAIPreReview() {
    // In a real app, would call API to run AI pre-review
    alert('AI pre-review would be triggered here. This would analyze content for potential issues before human review.');
}

/**
 * Show modal to update moderation guidelines
 */
function showUpdateGuidelinesModal() {
    // In a real app, would show modal with editable guidelines
    alert('Guidelines update interface would appear here. This would allow admins to edit the moderation guidelines.');
}

/**
 * Show modal to assign content to specific moderator
 */
function showAssignModeratorModal() {
    // In a real app, would show modal with moderator selection
    alert(`Moderator assignment interface would appear here. This would allow assigning the ${contentModerationState.selectedContent.length} selected items to a specific moderator.`);
}

/**
 * Approve a content item
 */
function approveContent(contentId) {
    // In a real app, would call API to approve content
    console.log(`Approving content: ${contentId}`);
    alert(`Content ${contentId} approved successfully.`);
    loadContentData();
}

/**
 * Reject a content item
 */
function rejectContent(contentId) {
    // In a real app, would call API to reject content
    console.log(`Rejecting content: ${contentId}`);
    alert(`Content ${contentId} rejected successfully.`);
    loadContentData();
}

/**
 * Flag a content item for review
 */
function flagContent(contentId) {
    // In a real app, would call API to flag content
    console.log(`Flagging content: ${contentId}`);
    alert(`Content ${contentId} flagged for review.`);
    loadContentData();
}

/**
 * Bulk approve selected content
 */
function bulkApproveContent() {
    // In a real app, would call API to approve content
    console.log(`Bulk approving content: ${contentModerationState.selectedContent.join(', ')}`);
    alert(`${contentModerationState.selectedContent.length} items approved successfully.`);
    loadContentData();
}

/**
 * Bulk reject selected content
 */
function bulkRejectContent() {
    // In a real app, would call API to reject content
    console.log(`Bulk rejecting content: ${contentModerationState.selectedContent.join(', ')}`);
    alert(`${contentModerationState.selectedContent.length} items rejected successfully.`);
    loadContentData();
}

/**
 * Bulk flag selected content
 */
function bulkFlagContent() {
    // In a real app, would call API to flag content
    console.log(`Bulk flagging content: ${contentModerationState.selectedContent.join(', ')}`);
    alert(`${contentModerationState.selectedContent.length} items flagged for review.`);
    loadContentData();
}
