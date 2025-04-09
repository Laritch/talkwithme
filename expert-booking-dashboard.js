// Expert Booking Dashboard JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeCalendarSync();
    initializeBookingActions();
    initializeFormFilters();
});

// Tab functionality
function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active class from all buttons and contents
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));

            // Add active class to clicked button
            button.classList.add('active');

            // Show corresponding tab content
            const tabId = button.getAttribute('data-tab');
            document.getElementById(`${tabId}-tab`).classList.add('active');
        });
    });
}

// Calendar sync modal
function initializeCalendarSync() {
    const syncButton = document.getElementById('sync-calendar-btn');
    const calendarModal = document.getElementById('calendar-modal');
    const closeModalButton = calendarModal.querySelector('.close-modal');

    syncButton.addEventListener('click', () => {
        calendarModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    });

    closeModalButton.addEventListener('click', () => {
        calendarModal.classList.remove('active');
        document.body.style.overflow = ''; // Enable scrolling
    });

    // Close modal when clicking outside content
    calendarModal.addEventListener('click', (e) => {
        if (e.target === calendarModal) {
            calendarModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Connect calendar buttons
    const connectButtons = document.querySelectorAll('.calendar-option .btn');
    connectButtons.forEach(button => {
        button.addEventListener('click', function() {
            const calendarType = this.parentElement.querySelector('h4').textContent;

            // In a real application, this would trigger an OAuth flow
            // For this demo, just show a success message
            this.textContent = 'Connected';
            this.classList.add('btn-success');
            this.disabled = true;

            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'connection-success';
            successMessage.innerHTML = `<i class="fas fa-check-circle"></i> ${calendarType} connected successfully!`;
            successMessage.style.color = '#4caf50';
            successMessage.style.marginTop = '10px';
            successMessage.style.fontSize = '0.9rem';

            this.parentElement.appendChild(successMessage);

            // In a real application, we would call an API to set up the calendar sync
            console.log(`Connecting to ${calendarType}...`);
        });
    });
}

// Initialize booking card actions
function initializeBookingActions() {
    // Join button for video calls
    const joinButtons = document.querySelectorAll('.join-btn');
    joinButtons.forEach(button => {
        button.addEventListener('click', function() {
            const bookingCard = this.closest('.booking-card');
            const clientName = bookingCard.querySelector('.client-info h4').textContent;
            const bookingTime = bookingCard.querySelector('.booking-time .time').textContent;

            // In a real application, this would launch a video call
            alert(`Joining video call with ${clientName} scheduled for ${bookingTime}`);
        });
    });

    // Reschedule buttons
    const rescheduleButtons = document.querySelectorAll('.reschedule-btn');
    rescheduleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const bookingCard = this.closest('.booking-card');
            const clientName = bookingCard.querySelector('.client-info h4').textContent;

            // In a real application, this would open a reschedule interface
            alert(`Opening reschedule options for session with ${clientName}`);
        });
    });

    // Message buttons
    const messageButtons = document.querySelectorAll('.message-btn');
    messageButtons.forEach(button => {
        button.addEventListener('click', function() {
            const bookingCard = this.closest('.booking-card');
            const clientName = bookingCard.querySelector('.client-info h4').textContent;

            // In a real application, this would open a messaging interface
            alert(`Opening message composer for ${clientName}`);
        });
    });

    // More options buttons
    const moreButtons = document.querySelectorAll('.more-btn');
    moreButtons.forEach(button => {
        button.addEventListener('click', function() {
            // In a real application, this would show a context menu
            const actions = ['Cancel Booking', 'Add to Case Study', 'Send Reminder', 'View Client Profile'];
            alert(`Additional actions:\n- ${actions.join('\n- ')}`);
        });
    });

    // Pending request action buttons
    const acceptButtons = document.querySelectorAll('.pending-actions .btn-primary');
    acceptButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pendingCard = this.closest('.pending-card');
            const clientName = pendingCard.querySelector('.client-info h4').textContent;

            // In a real application, this would open a scheduling interface
            alert(`Accepting booking request from ${clientName}. Opening scheduler...`);

            // Show a confirmation message in place of the pending card
            pendingCard.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <i class="fas fa-check-circle" style="font-size: 2rem; color: #4caf50; margin-bottom: 15px;"></i>
                    <h3>Booking Accepted</h3>
                    <p>You've accepted the booking request from ${clientName}.</p>
                    <p>An email confirmation has been sent to the client.</p>
                </div>
            `;
        });
    });

    const alternativeButtons = document.querySelectorAll('.pending-actions .btn-outline');
    alternativeButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pendingCard = this.closest('.pending-card');
            const clientName = pendingCard.querySelector('.client-info h4').textContent;

            // In a real application, this would open an alternative time suggestion interface
            alert(`Suggesting alternative times for ${clientName}`);
        });
    });

    const declineButtons = document.querySelectorAll('.pending-actions .btn-text');
    declineButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pendingCard = this.closest('.pending-card');
            const clientName = pendingCard.querySelector('.client-info h4').textContent;

            if (confirm(`Are you sure you want to decline the booking request from ${clientName}?`)) {
                // In a real application, this would call an API to decline the booking
                alert(`Booking request from ${clientName} has been declined.`);

                // Remove the pending card with a fade-out effect
                pendingCard.style.opacity = '0';
                pendingCard.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    pendingCard.remove();

                    // Update the count in the tab
                    const pendingTab = document.querySelector('[data-tab="pending"]');
                    const currentCount = parseInt(pendingTab.textContent.match(/\d+/)[0]);
                    pendingTab.textContent = pendingTab.textContent.replace(/\d+/, currentCount - 1);

                    // If no more pending requests, show a message
                    const pendingRequests = document.querySelector('.pending-requests');
                    if (pendingRequests.children.length === 0) {
                        pendingRequests.innerHTML = `
                            <div class="empty-state" style="text-align: center; padding: 40px 20px;">
                                <i class="fas fa-check-circle" style="font-size: 2rem; color: #666; margin-bottom: 15px;"></i>
                                <h3>No Pending Requests</h3>
                                <p>You've handled all booking requests. New requests will appear here.</p>
                            </div>
                        `;
                    }
                }, 500);
            }
        });
    });
}

// Handle search and filter functionality
function initializeFormFilters() {
    // Search functionality
    const searchInputs = document.querySelectorAll('.search-box input');
    searchInputs.forEach(input => {
        input.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase().trim();
            const tabContent = this.closest('.tab-content');

            if (tabContent.id === 'upcoming-tab') {
                const bookingCards = tabContent.querySelectorAll('.booking-card');

                bookingCards.forEach(card => {
                    const clientName = card.querySelector('.client-info h4').textContent.toLowerCase();
                    const serviceType = card.querySelector('.client-info p').textContent.toLowerCase();
                    const bookingTopic = card.querySelector('.booking-topic').textContent.toLowerCase();

                    // Check if the card matches the search term
                    const isMatch = clientName.includes(searchTerm) ||
                                    serviceType.includes(searchTerm) ||
                                    bookingTopic.includes(searchTerm);

                    // Show or hide the card
                    card.style.display = isMatch ? 'flex' : 'none';
                });

                // Show or hide date labels based on visible cards
                const dateGroups = tabContent.querySelectorAll('.booking-date-group');
                dateGroups.forEach(group => {
                    const hasVisibleCards = Array.from(group.querySelectorAll('.booking-card'))
                        .some(card => card.style.display !== 'none');

                    group.style.display = hasVisibleCards ? 'flex' : 'none';
                });
            } else if (tabContent.id === 'pending-tab') {
                const pendingCards = tabContent.querySelectorAll('.pending-card');

                pendingCards.forEach(card => {
                    const clientName = card.querySelector('.client-info h4').textContent.toLowerCase();
                    const requestTopic = card.querySelector('.request-topic').textContent.toLowerCase();

                    // Check if the card matches the search term
                    const isMatch = clientName.includes(searchTerm) || requestTopic.includes(searchTerm);

                    // Show or hide the card
                    card.style.display = isMatch ? 'block' : 'none';
                });
            }
        });
    });

    // Filter dropdowns
    const filterSelects = document.querySelectorAll('.filter-select');
    filterSelects.forEach(select => {
        select.addEventListener('change', function() {
            // In a real application, this would filter the bookings based on selection
            console.log(`Filter changed to: ${this.value}`);
        });
    });

    // Show more button
    const showMoreButton = document.querySelector('.show-more .btn');
    if (showMoreButton) {
        showMoreButton.addEventListener('click', function() {
            // In a real application, this would load more bookings
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';

            // Simulate loading delay
            setTimeout(() => {
                this.innerHTML = 'Show More Bookings <i class="fas fa-chevron-down"></i>';
                alert('In a real application, this would load more bookings from the server.');
            }, 1000);
        });
    }
}

// Optional: Dropdown menu toggling
document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.dropdown');
    const dropdownMenu = document.querySelector('.dropdown-menu');

    if (!dropdown.contains(e.target) && dropdownMenu.style.display === 'block') {
        dropdownMenu.style.display = 'none';
    }
});

// Settings dropdown menu items
document.addEventListener('click', function(e) {
    if (e.target.id === 'edit-availability') {
        // Switch to the availability tab
        const availabilityTab = document.querySelector('[data-tab="availability"]');
        availabilityTab.click();
    } else if (e.target.id === 'manage-services') {
        // Switch to the services tab
        const servicesTab = document.querySelector('[data-tab="services"]');
        servicesTab.click();
    } else if (e.target.id === 'notification-settings') {
        // In a real application, this would open notification settings
        alert('Opening notification settings...');
    }
});
