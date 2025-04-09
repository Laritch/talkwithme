/**
 * Admin User Management
 * Handles user search, filtering, bulk actions, and user management operations
 */

import { AdminNotificationHandler } from './services/admin-notification-handler.js';

// State management for user controls
const userManagementState = {
    // Filters and search
    filters: {
        userType: 'all',
        status: 'all',
        joinDateStart: null,
        joinDateEnd: null,
        category: 'all',
        verification: 'all',
        activity: 'all',
        keyword: ''
    },
    // Pagination
    pagination: {
        currentPage: 1,
        totalPages: 12,
        usersPerPage: 10
    },
    // Selected users for bulk operations
    selectedUsers: [],
    // Active modal
    activeModal: null,
    // Save filters
    savedFilters: [
        // Would be loaded from storage in a real app
    ]
};

/**
 * Initialize the page when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the notification system
    AdminNotificationHandler.initNotificationHandler();

    // Initialize event listeners
    initEventListeners();

    // Initialize date range pickers
    initDateRangePickers();

    // Load initial user data
    loadUserData();
});

/**
 * Initialize all event listeners
 */
function initEventListeners() {
    // Advanced search toggle
    const advancedSearchToggle = document.getElementById('advanced-search-toggle');
    if (advancedSearchToggle) {
        advancedSearchToggle.addEventListener('click', function() {
            const advancedFilters = document.getElementById('advanced-filters');
            if (advancedFilters) {
                if (advancedFilters.style.display === 'none') {
                    advancedFilters.style.display = 'block';
                    advancedSearchToggle.innerHTML = '<i class="fas fa-times"></i> Hide Filters';
                } else {
                    advancedFilters.style.display = 'none';
                    advancedSearchToggle.innerHTML = '<i class="fas fa-sliders-h"></i> Advanced Filters';
                }
            }
        });
    }

    // Search button
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const keyword = document.getElementById('search-keyword').value;
            userManagementState.filters.keyword = keyword;
            loadUserData();
        });
    }

    // Apply filters button
    const applyFiltersBtn = document.getElementById('apply-filters');
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', function() {
            updateFiltersFromInputs();
            loadUserData();
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

    // Select all users checkbox
    const selectAllUsers = document.getElementById('select-all-users');
    if (selectAllUsers) {
        selectAllUsers.addEventListener('change', function() {
            selectAllUsersToggle(this.checked);
        });
    }

    // User checkboxes
    const userCheckboxes = document.querySelectorAll('.user-select-checkbox');
    userCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            updateSelectedUsers();
        });
    });

    // Apply bulk action button
    const applyBulkActionBtn = document.getElementById('apply-bulk-action');
    if (applyBulkActionBtn) {
        applyBulkActionBtn.addEventListener('click', function() {
            applyBulkAction();
        });
    }

    // Add user button
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            showAddUserModal();
        });
    }

    // Modal close buttons
    const modalCloseButtons = document.querySelectorAll('.modal-close');
    modalCloseButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeActiveModal();
        });
    });

    // Cancel action button in modal
    const cancelActionBtn = document.getElementById('cancel-action-btn');
    if (cancelActionBtn) {
        cancelActionBtn.addEventListener('click', function() {
            closeActiveModal();
        });
    }

    // Confirm action button in modal
    const confirmActionBtn = document.getElementById('confirm-action-btn');
    if (confirmActionBtn) {
        confirmActionBtn.addEventListener('click', function() {
            executeModalAction();
        });
    }

    // Action buttons in user rows
    initUserActionButtons();

    // Pagination buttons
    initPaginationButtons();
}

/**
 * Initialize date range pickers
 */
function initDateRangePickers() {
    // Join date filter
    $('#filter-join-date').daterangepicker({
        autoUpdateInput: false,
        locale: {
            cancelLabel: 'Clear',
            format: 'MMM DD, YYYY'
        }
    });

    $('#filter-join-date').on('apply.daterangepicker', function(ev, picker) {
        $(this).val(picker.startDate.format('MMM DD, YYYY') + ' - ' + picker.endDate.format('MMM DD, YYYY'));
        userManagementState.filters.joinDateStart = picker.startDate.toDate();
        userManagementState.filters.joinDateEnd = picker.endDate.toDate();
    });

    $('#filter-join-date').on('cancel.daterangepicker', function(ev, picker) {
        $(this).val('');
        userManagementState.filters.joinDateStart = null;
        userManagementState.filters.joinDateEnd = null;
    });
}

/**
 * Update filters from input values
 */
function updateFiltersFromInputs() {
    const userType = document.getElementById('filter-user-type');
    const status = document.getElementById('filter-status');
    const category = document.getElementById('filter-category');
    const verification = document.getElementById('filter-verification');
    const activity = document.getElementById('filter-activity');

    if (userType) userManagementState.filters.userType = userType.value;
    if (status) userManagementState.filters.status = status.value;
    if (category) userManagementState.filters.category = category.value;
    if (verification) userManagementState.filters.verification = verification.value;
    if (activity) userManagementState.filters.activity = activity.value;

    // Join date is already updated via the date range picker
}

/**
 * Reset all filters to default values
 */
function resetFilters() {
    userManagementState.filters = {
        userType: 'all',
        status: 'all',
        joinDateStart: null,
        joinDateEnd: null,
        category: 'all',
        verification: 'all',
        activity: 'all',
        keyword: ''
    };

    // Reset UI elements
    const filterInputs = document.querySelectorAll('select.select-control');
    filterInputs.forEach(input => {
        input.value = 'all';
    });

    document.getElementById('filter-join-date').value = '';
    document.getElementById('search-keyword').value = '';

    // Reload data with reset filters
    loadUserData();
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
        filters: { ...userManagementState.filters }
    };

    userManagementState.savedFilters.push(newFilter);

    // In a real app, would save to localStorage or server
    alert(`Filter "${filterName}" has been saved.`);
}

/**
 * Toggle selection of all users
 */
function selectAllUsersToggle(checked) {
    const checkboxes = document.querySelectorAll('.user-select-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = checked;
    });

    updateSelectedUsers();
}

/**
 * Update the list of selected users
 */
function updateSelectedUsers() {
    const checkboxes = document.querySelectorAll('.user-select-checkbox:checked');
    const selectedUserIds = Array.from(checkboxes).map(checkbox => checkbox.getAttribute('data-user-id'));

    userManagementState.selectedUsers = selectedUserIds;

    // Update selected counter
    const counter = document.getElementById('selection-counter');
    if (counter) {
        counter.textContent = `${selectedUserIds.length} user${selectedUserIds.length !== 1 ? 's' : ''} selected`;
    }

    // Enable/disable bulk action button
    const bulkActionBtn = document.getElementById('apply-bulk-action');
    if (bulkActionBtn) {
        bulkActionBtn.disabled = selectedUserIds.length === 0;
    }
}

/**
 * Apply the selected bulk action to selected users
 */
function applyBulkAction() {
    const action = document.getElementById('bulk-action').value;
    if (!action) {
        alert('Please select an action.');
        return;
    }

    if (userManagementState.selectedUsers.length === 0) {
        alert('Please select at least one user.');
        return;
    }

    // Show confirmation modal for the selected action
    const actionLabel = document.getElementById('bulk-action').options[document.getElementById('bulk-action').selectedIndex].text;
    showConfirmationModal(
        `${actionLabel} Users`,
        `Are you sure you want to ${actionLabel.toLowerCase()} ${userManagementState.selectedUsers.length} selected user${userManagementState.selectedUsers.length !== 1 ? 's' : ''}?`,
        `bulk-${action}`
    );
}

/**
 * Show the modal for adding a new user
 */
function showAddUserModal() {
    const modal = document.getElementById('user-actions-modal');
    const modalTitle = modal.querySelector('.modal-header h2');
    const formContainer = document.getElementById('user-action-form');

    modalTitle.textContent = 'Add New User';

    // Populate form
    formContainer.innerHTML = `
        <div class="form-group">
            <label for="new-user-type">User Type</label>
            <select id="new-user-type" class="select-control">
                <option value="client">Client</option>
                <option value="expert">Expert</option>
                <option value="admin">Admin</option>
            </select>
        </div>
        <div class="form-group">
            <label for="new-user-name">Full Name</label>
            <input type="text" id="new-user-name" class="form-control" placeholder="Enter full name">
        </div>
        <div class="form-group">
            <label for="new-user-email">Email Address</label>
            <input type="email" id="new-user-email" class="form-control" placeholder="Enter email address">
        </div>
        <div class="form-group">
            <label for="new-user-password">Password</label>
            <input type="password" id="new-user-password" class="form-control" placeholder="Enter password">
        </div>
        <div class="form-group">
            <label for="new-user-status">Initial Status</label>
            <select id="new-user-status" class="select-control">
                <option value="active">Active</option>
                <option value="pending">Pending Verification</option>
                <option value="inactive">Inactive</option>
            </select>
        </div>
    `;

    userManagementState.activeModal = 'add-user';

    // Show modal
    modal.style.display = 'block';
}

/**
 * Show a confirmation modal for an action
 */
function showConfirmationModal(title, message, action) {
    const modal = document.getElementById('user-actions-modal');
    const modalTitle = modal.querySelector('.modal-header h2');
    const formContainer = document.getElementById('user-action-form');

    modalTitle.textContent = title;

    // Populate message
    formContainer.innerHTML = `
        <p class="confirmation-message">${message}</p>
    `;

    userManagementState.activeModal = action;

    // Show modal
    modal.style.display = 'block';
}

/**
 * Close the currently active modal
 */
function closeActiveModal() {
    const modal = document.getElementById('user-actions-modal');
    modal.style.display = 'none';
    userManagementState.activeModal = null;
}

/**
 * Execute the action associated with the active modal
 */
function executeModalAction() {
    if (!userManagementState.activeModal) return;

    // Handle different actions
    if (userManagementState.activeModal === 'add-user') {
        addNewUser();
    } else if (userManagementState.activeModal.startsWith('bulk-')) {
        executeBulkAction(userManagementState.activeModal.replace('bulk-', ''));
    }

    closeActiveModal();
}

/**
 * Add a new user based on form data
 */
function addNewUser() {
    // In a real app, would validate and send to server
    const userType = document.getElementById('new-user-type').value;
    const name = document.getElementById('new-user-name').value;
    const email = document.getElementById('new-user-email').value;

    if (!name || !email) {
        alert('Please fill in all required fields');
        return;
    }

    // Simulate successful creation
    alert(`User ${name} (${email}) created successfully as ${userType}.`);

    // Reload user data
    loadUserData();
}

/**
 * Execute a bulk action on selected users
 */
function executeBulkAction(action) {
    const userCount = userManagementState.selectedUsers.length;

    // In a real app, would send to server
    switch (action) {
        case 'verify':
            alert(`Verified ${userCount} user(s) successfully.`);
            break;
        case 'suspend':
            alert(`Suspended ${userCount} user(s) successfully.`);
            break;
        case 'activate':
            alert(`Activated ${userCount} user(s) successfully.`);
            break;
        case 'delete':
            alert(`Deleted ${userCount} user(s) successfully.`);
            break;
        case 'export':
            alert(`Exporting data for ${userCount} user(s)...`);
            break;
        case 'message':
            alert(`Sending message to ${userCount} user(s)...`);
            break;
    }

    // Reload user data
    loadUserData();
}

/**
 * Initialize user action buttons
 */
function initUserActionButtons() {
    // View profile buttons
    const viewProfileButtons = document.querySelectorAll('.table-actions .btn-icon[title="View Profile"]');
    viewProfileButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.closest('tr').querySelector('.user-select-checkbox').getAttribute('data-user-id');
            viewUserProfile(userId);
        });
    });

    // Edit user buttons
    const editUserButtons = document.querySelectorAll('.table-actions .btn-icon[title="Edit User"]');
    editUserButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.closest('tr').querySelector('.user-select-checkbox').getAttribute('data-user-id');
            editUser(userId);
        });
    });

    // Message buttons
    const messageButtons = document.querySelectorAll('.table-actions .btn-icon[title="Message"]');
    messageButtons.forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.closest('tr').querySelector('.user-select-checkbox').getAttribute('data-user-id');
            messageUser(userId);
        });
    });

    // Dropdown menu items
    const dropdownItems = document.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const userId = this.closest('tr').querySelector('.user-select-checkbox').getAttribute('data-user-id');
            const action = this.textContent.trim();

            handleDropdownAction(userId, action);
        });
    });
}

/**
 * Initialize pagination buttons
 */
function initPaginationButtons() {
    const paginationButtons = document.querySelectorAll('.pagination-btn');
    paginationButtons.forEach(button => {
        if (!button.disabled) {
            button.addEventListener('click', function() {
                if (this.classList.contains('active')) return;

                if (this.textContent === '...') return;

                if (this.innerHTML.includes('fa-chevron-left')) {
                    userManagementState.pagination.currentPage--;
                } else if (this.innerHTML.includes('fa-chevron-right')) {
                    userManagementState.pagination.currentPage++;
                } else {
                    userManagementState.pagination.currentPage = parseInt(this.textContent);
                }

                loadUserData();
            });
        }
    });
}

/**
 * Handle dropdown menu actions for a user
 */
function handleDropdownAction(userId, action) {
    // In a real app, would send to server
    switch (action) {
        case 'Login History':
            alert(`Viewing login history for user ID: ${userId}`);
            break;
        case 'Activity Log':
            alert(`Viewing activity log for user ID: ${userId}`);
            break;
        case 'Reset Password':
            alert(`Resetting password for user ID: ${userId}`);
            break;
        case 'Suspend Account':
            alert(`Suspending account for user ID: ${userId}`);
            break;
        case 'Reactivate Account':
            alert(`Reactivating account for user ID: ${userId}`);
            break;
        case 'Complete Verification':
            alert(`Completing verification for user ID: ${userId}`);
            break;
    }
}

/**
 * View a user's profile
 */
function viewUserProfile(userId) {
    // In a real app, would navigate to profile page
    alert(`Viewing profile for user ID: ${userId}`);
}

/**
 * Edit a user
 */
function editUser(userId) {
    // In a real app, would show edit form or navigate to edit page
    alert(`Editing user ID: ${userId}`);
}

/**
 * Send a message to a user
 */
function messageUser(userId) {
    // In a real app, would show message composition form
    alert(`Sending message to user ID: ${userId}`);
}

/**
 * Load user data based on current filters and pagination
 */
function loadUserData() {
    // In a real app, this would make an API call
    // For the demo, we'll simply simulate reloading by updating UI

    // Update the table with the current page of users

    // Reset checkboxes
    document.getElementById('select-all-users').checked = false;
    userManagementState.selectedUsers = [];
    updateSelectedUsers();

    // Update pagination UI
    updatePaginationUI();

    console.log('Loading users with filters:', userManagementState.filters);
    console.log('Page:', userManagementState.pagination.currentPage);
}

/**
 * Update the pagination UI
 */
function updatePaginationUI() {
    const pagination = document.querySelector('.pagination');
    if (!pagination) return;

    const { currentPage, totalPages } = userManagementState.pagination;

    // Update active button
    const buttons = pagination.querySelectorAll('.pagination-btn:not(:first-child):not(:last-child)');
    buttons.forEach(button => {
        if (button.textContent === currentPage.toString()) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });

    // Enable/disable previous button
    const prevButton = pagination.querySelector('.pagination-btn:first-child');
    prevButton.disabled = currentPage === 1;

    // Enable/disable next button
    const nextButton = pagination.querySelector('.pagination-btn:last-child');
    nextButton.disabled = currentPage === totalPages;
}
