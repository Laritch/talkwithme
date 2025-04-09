/**
 * Live Q&A Sessions Management
 * Handles session creation, editing, and management
 */

import expertAPI from './api/expertProfileAPI.js';

document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initModal();
    initSessionForm();
    initCountdowns();
    loadSessions();
});

/**
 * Initialize tab functionality
 */
function initTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const tabName = button.dataset.tab;

            // Update active tab button
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Show selected tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === `${tabName}-tab`) {
                    content.classList.add('active');
                }
            });
        });
    });
}

/**
 * Initialize modal functionality
 */
function initModal() {
    const modal = document.getElementById('create-session-modal');
    const modalOverlay = modal.querySelector('.modal-overlay');
    const modalClose = modal.querySelector('.modal-close');
    const createButton = document.getElementById('create-session-btn');

    // Open modal
    createButton.addEventListener('click', () => {
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    });

    // Close modal
    function closeModal() {
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', closeModal);

    // Prevent closing when clicking inside modal content
    modal.querySelector('.modal-container').addEventListener('click', e => {
        e.stopPropagation();
    });

    // Close modal on escape key
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal.classList.contains('open')) {
            closeModal();
        }
    });
}

/**
 * Initialize session form functionality
 */
function initSessionForm() {
    const sessionForm = document.getElementById('session-form');
    const saveDraftBtn = document.getElementById('save-draft-btn');
    const fileUpload = document.getElementById('session-image');
    const fileName = document.querySelector('.file-name');

    // File upload preview
    fileUpload.addEventListener('change', () => {
        if (fileUpload.files.length > 0) {
            fileName.textContent = fileUpload.files[0].name;
        } else {
            fileName.textContent = '';
        }
    });

    // Save as draft
    saveDraftBtn.addEventListener('click', async () => {
        try {
            const sessionData = getFormData(true);
            sessionData.status = 'draft';

            // Show loading state
            saveDraftBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
            saveDraftBtn.disabled = true;

            // Send to API
            const result = await expertAPI.createSession(sessionData);

            // Close modal & show success message
            closeModal();
            showNotification('Draft saved successfully!', 'success');

            // Reload draft sessions
            loadDraftSessions();

        } catch (error) {
            console.error('Error saving draft:', error);
            showNotification('Failed to save draft. Please try again.', 'error');
        } finally {
            // Reset button state
            saveDraftBtn.innerHTML = 'Save as Draft';
            saveDraftBtn.disabled = false;
        }
    });

    // Create session
    sessionForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate form
        if (!sessionForm.checkValidity()) {
            sessionForm.reportValidity();
            return;
        }

        try {
            const sessionData = getFormData();
            sessionData.status = 'scheduled';

            // Show loading state
            const submitBtn = sessionForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating...';
            submitBtn.disabled = true;

            // Send to API
            const result = await expertAPI.createSession(sessionData);

            // Close modal & show success message
            closeModal();
            showNotification('Session created successfully!', 'success');

            // Reload upcoming sessions
            loadUpcomingSessions();

        } catch (error) {
            console.error('Error creating session:', error);
            showNotification('Failed to create session. Please try again.', 'error');
        } finally {
            // Reset button state
            const submitBtn = sessionForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = 'Create Session';
            submitBtn.disabled = false;
        }
    });

    /**
     * Get form data as an object
     * @param {boolean} isDraft - Whether this is a draft (skip validation)
     * @returns {Object} Session data
     */
    function getFormData(isDraft = false) {
        // Get all the form values
        const title = document.getElementById('session-title').value;
        const date = document.getElementById('session-date').value;
        const startTime = document.getElementById('session-start-time').value;
        const endTime = document.getElementById('session-end-time').value;
        const timezone = document.getElementById('session-timezone').value;
        const price = document.getElementById('session-price').value;
        const description = document.getElementById('session-description').value;

        // Get selected categories
        const categoriesEl = document.getElementById('session-categories');
        const categories = Array.from(categoriesEl.selectedOptions).map(option => option.value);

        // Get tags and split into array
        const tagsInput = document.getElementById('session-tags').value;
        const tags = tagsInput ? tagsInput.split(',').map(tag => tag.trim()) : [];

        // Get checkbox values
        const enableRegistration = document.getElementById('enable-registration').checked;
        const recordSession = document.getElementById('record-session').checked;
        const allowQuestionsBefore = document.getElementById('allow-questions-before').checked;
        const emailReminders = document.getElementById('email-reminders').checked;

        // Combine date and time
        const startDateTime = new Date(`${date}T${startTime}:00`);
        const endDateTime = new Date(`${date}T${endTime}:00`);

        return {
            title,
            description,
            startTime: startDateTime.toISOString(),
            endTime: endDateTime.toISOString(),
            timezone,
            price: parseFloat(price) || 0,
            categories,
            tags,
            settings: {
                enableRegistration,
                recordSession,
                allowQuestionsBefore,
                emailReminders
            }
        };
    }

    /**
     * Close the modal
     */
    function closeModal() {
        const modal = document.getElementById('create-session-modal');
        modal.classList.remove('open');
        document.body.style.overflow = '';
        sessionForm.reset();
        fileName.textContent = '';
    }
}

/**
 * Initialize countdown timers
 */
function initCountdowns() {
    const countdownTimers = document.querySelectorAll('.countdown-timer');

    countdownTimers.forEach(timer => {
        const targetTime = new Date(timer.dataset.time).getTime();

        // Update countdown every second
        const interval = setInterval(() => {
            const now = new Date().getTime();
            const distance = targetTime - now;

            // If the countdown is over
            if (distance < 0) {
                clearInterval(interval);
                timer.innerHTML = '<div class="starting-soon">Starting soon...</div>';
                return;
            }

            // Calculate days, hours, minutes
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

            // Update timer display
            timer.querySelector('.days').textContent = days.toString().padStart(2, '0');
            timer.querySelector('.hours').textContent = hours.toString().padStart(2, '0');
            timer.querySelector('.minutes').textContent = minutes.toString().padStart(2, '0');
        }, 1000);
    });
}

/**
 * Load all sessions from API
 */
async function loadSessions() {
    try {
        await Promise.all([
            loadUpcomingSessions(),
            loadPastSessions(),
            loadDraftSessions()
        ]);
    } catch (error) {
        console.error('Error loading sessions:', error);
        showNotification('Failed to load sessions. Please refresh the page.', 'error');
    }
}

/**
 * Load upcoming sessions
 */
async function loadUpcomingSessions() {
    try {
        const upcomingSessions = await expertAPI.getUpcomingSessions();

        // Update tab count
        document.querySelector('[data-tab="upcoming"] .count').textContent = `(${upcomingSessions.length})`;

        // Get container
        const container = document.getElementById('upcoming-tab');
        const emptyState = container.querySelector('.empty-state');

        // Show empty state if no sessions
        if (upcomingSessions.length === 0) {
            // Hide any session cards
            const sessionCards = container.querySelectorAll('.session-card');
            sessionCards.forEach(card => card.style.display = 'none');

            // Show empty state
            emptyState.style.display = 'block';
        } else {
            // Hide empty state
            if (emptyState) emptyState.style.display = 'none';

            // TODO: Render session cards
            // This would dynamically create session cards based on data
            // For now, we have static HTML in the template
        }
    } catch (error) {
        console.error('Error loading upcoming sessions:', error);
        throw error;
    }
}

/**
 * Load past sessions
 */
async function loadPastSessions() {
    try {
        const pastSessions = await expertAPI.getPastSessions(1, 5);

        // Update tab count
        document.querySelector('[data-tab="past"] .count').textContent = `(${pastSessions.total})`;

        // Get container
        const container = document.getElementById('past-tab');

        // TODO: Render past session cards
        // This would dynamically create session cards based on data
        // For now, we have static HTML in the template
    } catch (error) {
        console.error('Error loading past sessions:', error);
        throw error;
    }
}

/**
 * Load draft sessions
 */
async function loadDraftSessions() {
    try {
        // In a real implementation, we would call the API
        // For now, we'll just update the tab count based on static HTML
        const container = document.getElementById('drafts-tab');
        const draftCards = container.querySelectorAll('.session-card.draft');

        // Update tab count
        document.querySelector('[data-tab="drafts"] .count').textContent = `(${draftCards.length})`;

        const emptyState = container.querySelector('.empty-state');

        // Show empty state if no drafts
        if (draftCards.length === 0) {
            // Show empty state
            emptyState.style.display = 'block';
        } else {
            // Hide empty state
            if (emptyState) emptyState.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading draft sessions:', error);
        throw error;
    }
}

/**
 * Show a notification
 * @param {string} message - Notification message
 * @param {string} type - Notification type (success, error, info)
 */
function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-icon">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        </div>
        <div class="notification-message">${message}</div>
        <button class="notification-close"><i class="fas fa-times"></i></button>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Show with animation
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    // Remove after timeout
    const timeout = setTimeout(() => {
        removeNotification(notification);
    }, 5000);

    // Close button
    notification.querySelector('.notification-close').addEventListener('click', () => {
        clearTimeout(timeout);
        removeNotification(notification);
    });
}

/**
 * Remove a notification with animation
 * @param {HTMLElement} notification - Notification element
 */
function removeNotification(notification) {
    notification.classList.remove('show');
    setTimeout(() => {
        notification.remove();
    }, 300);
}

// Add event listeners for session actions
document.addEventListener('click', async (e) => {
    // Copy session link
    if (e.target.closest('.btn') && e.target.closest('.btn').innerHTML.includes('Copy Link')) {
        const button = e.target.closest('.btn');
        const sessionId = button.closest('.session-card').dataset.id;

        // In a real implementation, this would be a real link
        const sessionLink = `https://expertmarketplace.com/live-session/${sessionId || '123'}`;

        // Copy to clipboard
        navigator.clipboard.writeText(sessionLink)
            .then(() => {
                // Show success message
                const originalText = button.innerHTML;
                button.innerHTML = '<i class="fas fa-check"></i> Copied!';

                // Reset after 2 seconds
                setTimeout(() => {
                    button.innerHTML = originalText;
                }, 2000);
            })
            .catch(err => {
                console.error('Could not copy text: ', err);
            });
    }

    // Start session
    if (e.target.closest('.btn') && e.target.closest('.btn').innerHTML.includes('Start Session')) {
        const button = e.target.closest('.btn');
        const sessionCard = button.closest('.session-card');

        // Normally we would validate if the session is ready to start
        // and redirect to the live room, but for demo we just show a message

        // Show loading state
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Starting...';
        button.disabled = true;

        // Simulate API call
        setTimeout(() => {
            window.location.href = 'live-session-room.html';
        }, 1500);
    }
});
