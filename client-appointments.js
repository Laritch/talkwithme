// Client Appointments JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeTabs();
    initializeCalendarSync();
    initializeReminderSettings();
    initializeAppointmentActions();
    startCountdownTimers();
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

// Reminder settings modal
function initializeReminderSettings() {
    const remindersButton = document.getElementById('get-reminders-btn');
    const remindersModal = document.getElementById('reminders-modal');
    const closeModalButton = remindersModal.querySelector('.close-modal');

    remindersButton.addEventListener('click', () => {
        remindersModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    });

    closeModalButton.addEventListener('click', () => {
        remindersModal.classList.remove('active');
        document.body.style.overflow = ''; // Enable scrolling
    });

    // Close modal when clicking outside content
    remindersModal.addEventListener('click', (e) => {
        if (e.target === remindersModal) {
            remindersModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Handle form submission
    const reminderForm = remindersModal.querySelector('.reminders-form');
    reminderForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // In a real application, this would save the reminder settings to the server
        // For this demo, just show a success message and close the modal

        // Create formData object to capture all form values
        const formData = new FormData(this);
        const formValues = {};

        for (const [key, value] of formData.entries()) {
            if (formValues[key]) {
                if (!Array.isArray(formValues[key])) {
                    formValues[key] = [formValues[key]];
                }
                formValues[key].push(value);
            } else {
                formValues[key] = value;
            }
        }

        console.log('Reminder settings:', formValues);

        // Show success message
        alert('Your reminder settings have been saved!');

        // Close the modal
        remindersModal.classList.remove('active');
        document.body.style.overflow = '';
    });

    // Reset to default button
    const resetButton = reminderForm.querySelector('.btn-text');
    resetButton.addEventListener('click', function() {
        // Reset the form to default values
        const defaultSettings = {
            'email-1-day': true,
            'email-1-hour': true,
            'email-15-min': false,
            'sms-1-day': false,
            'sms-1-hour': true,
            'sms-15-min': false,
            'add-to-calendar': true,
            'send-summary': true
        };

        // Apply default settings to form
        for (const [key, value] of Object.entries(defaultSettings)) {
            const checkbox = reminderForm.querySelector(`#${key}`);
            if (checkbox) {
                checkbox.checked = value;
            }
        }

        // Reset phone number field
        const phoneInput = reminderForm.querySelector('#phone-number');
        if (phoneInput) {
            phoneInput.value = '+1 (555) 123-4567';
        }

        // Show message
        alert('Reminder settings have been reset to default values.');
    });
}

// Initialize appointment actions
function initializeAppointmentActions() {
    // Join session buttons
    const joinButtons = document.querySelectorAll('.join-btn');
    joinButtons.forEach(button => {
        button.addEventListener('click', function() {
            const appointmentCard = this.closest('.appointment-card');
            const expertName = appointmentCard.querySelector('.expert-info h4').textContent;
            const appointmentTime = appointmentCard.querySelector('.appointment-time .time').textContent;

            // In a real application, this would launch a video call
            alert(`Joining video session with ${expertName} scheduled for ${appointmentTime}`);
        });
    });

    // Reschedule buttons
    const rescheduleButtons = document.querySelectorAll('.reschedule-btn');
    rescheduleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const appointmentCard = this.closest('.appointment-card');
            const expertName = appointmentCard.querySelector('.expert-info h4').textContent;

            // In a real application, this would open a reschedule interface
            alert(`Opening reschedule options for your session with ${expertName}`);
        });
    });

    // Message buttons
    const messageButtons = document.querySelectorAll('.message-btn');
    messageButtons.forEach(button => {
        button.addEventListener('click', function() {
            const appointmentCard = this.closest('.appointment-card');
            const expertName = appointmentCard.querySelector('.expert-info h4').textContent;

            // In a real application, this would open a messaging interface
            alert(`Opening message composer to contact ${expertName}`);
        });
    });

    // Cancel buttons
    const cancelButtons = document.querySelectorAll('.cancel-btn');
    cancelButtons.forEach(button => {
        button.addEventListener('click', function() {
            const appointmentCard = this.closest('.appointment-card');
            const expertName = appointmentCard.querySelector('.expert-info h4').textContent;
            const appointmentTime = appointmentCard.querySelector('.appointment-time .time').textContent;
            const appointmentDay = appointmentCard.querySelector('.appointment-time .day').textContent;

            if (confirm(`Are you sure you want to cancel your appointment with ${expertName} on ${appointmentDay} at ${appointmentTime}?`)) {
                // In a real application, this would call an API to cancel the booking
                alert(`Your appointment with ${expertName} has been cancelled. A confirmation email has been sent.`);

                // Remove the appointment card with a fade-out effect
                appointmentCard.style.opacity = '0';
                appointmentCard.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    appointmentCard.remove();

                    // Check if the date group is now empty
                    const dateGroup = appointmentCard.closest('.appointment-date-group');
                    if (dateGroup && dateGroup.querySelectorAll('.appointment-card').length === 0) {
                        dateGroup.remove();
                    }

                    // Update the count in the tab
                    const upcomingTab = document.querySelector('[data-tab="upcoming"]');
                    const currentCount = parseInt(upcomingTab.textContent.match(/\d+/)[0]);
                    upcomingTab.textContent = upcomingTab.textContent.replace(/\d+/, currentCount - 1);

                    // If no more appointments, show a message
                    const appointmentsList = document.querySelector('.appointments-list');
                    if (appointmentsList.children.length === 0) {
                        appointmentsList.innerHTML = `
                            <div class="empty-state" style="text-align: center; padding: 40px 20px;">
                                <i class="fas fa-calendar-alt" style="font-size: 2rem; color: #666; margin-bottom: 15px;"></i>
                                <h3>No Upcoming Appointments</h3>
                                <p>You don't have any upcoming appointments scheduled.</p>
                                <a href="experts.html" class="btn btn-primary" style="margin-top: 15px;">Find an Expert</a>
                            </div>
                        `;
                    }
                }, 500);
            }
        });
    });

    // Pending request buttons
    const editRequestButtons = document.querySelectorAll('.pending-card .btn-outline');
    editRequestButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pendingCard = this.closest('.pending-card');
            const expertName = pendingCard.querySelector('.expert-info h4').textContent;

            // In a real application, this would open an edit request interface
            alert(`Opening edit interface for your pending request with ${expertName}`);
        });
    });

    const cancelRequestButtons = document.querySelectorAll('.pending-card .btn-text');
    cancelRequestButtons.forEach(button => {
        button.addEventListener('click', function() {
            const pendingCard = this.closest('.pending-card');
            const expertName = pendingCard.querySelector('.expert-info h4').textContent;

            if (confirm(`Are you sure you want to cancel your request to book ${expertName}?`)) {
                // In a real application, this would call an API to cancel the request
                alert(`Your booking request with ${expertName} has been cancelled.`);

                // Remove the pending card with a fade-out effect
                pendingCard.style.opacity = '0';
                pendingCard.style.transition = 'opacity 0.5s';
                setTimeout(() => {
                    pendingCard.remove();

                    // Update the count in the tab
                    const pendingTab = document.querySelector('[data-tab="requests"]');
                    const currentCount = parseInt(pendingTab.textContent.match(/\d+/)[0]);
                    pendingTab.textContent = pendingTab.textContent.replace(/\d+/, currentCount - 1);

                    // If no more pending requests, show a message
                    const pendingRequests = document.querySelector('.pending-requests');
                    if (pendingRequests.children.length === 0) {
                        pendingRequests.innerHTML = `
                            <div class="empty-state" style="text-align: center; padding: 40px 20px;">
                                <i class="fas fa-check-circle" style="font-size: 2rem; color: #666; margin-bottom: 15px;"></i>
                                <h3>No Pending Requests</h3>
                                <p>You don't have any pending booking requests.</p>
                            </div>
                        `;
                    }
                }, 500);
            }
        });
    });
}

// Start countdown timers for upcoming appointments
function startCountdownTimers() {
    // For a real application, this would calculate actual time differences
    // This is a simplified demo version that just displays static text

    const updateImminent = () => {
        // Find the appointment that's closest to starting
        const todayAppointments = document.querySelectorAll('.appointment-card');

        if (todayAppointments.length > 0) {
            // In a real application, we would check the actual start time
            // For this demo, just simulate a countdown for the first appointment
            const firstAppointment = todayAppointments[0];
            const countdownElement = firstAppointment.querySelector('.countdown');

            if (countdownElement) {
                // Simulate a countdown (in a real app, this would be calculated)
                let minutes = 80; // Starting at 1 hour 20 minutes

                // Update every minute
                const interval = setInterval(() => {
                    minutes--;

                    if (minutes <= 0) {
                        clearInterval(interval);
                        countdownElement.textContent = 'Starting now!';
                        countdownElement.style.backgroundColor = '#f44336';
                        countdownElement.style.color = 'white';

                        // Show join button more prominently
                        const joinButton = firstAppointment.querySelector('.join-btn');
                        if (joinButton) {
                            joinButton.style.animation = 'pulse 1.5s infinite';
                        }
                    } else if (minutes <= 5) {
                        countdownElement.textContent = `Starting in ${minutes} min`;
                        countdownElement.style.backgroundColor = '#f44336';
                        countdownElement.style.color = 'white';
                    } else {
                        const hours = Math.floor(minutes / 60);
                        const mins = minutes % 60;

                        if (hours > 0) {
                            countdownElement.textContent = `Starts in: ${hours}h ${mins}m`;
                        } else {
                            countdownElement.textContent = `Starts in: ${mins}m`;
                        }
                    }
                }, 60000); // Update every minute (60000 ms)

                // For demo purposes, speed up the simulation
                setTimeout(() => {
                    countdownElement.textContent = 'Starts in: 5m';
                    countdownElement.style.backgroundColor = '#f44336';
                    countdownElement.style.color = 'white';
                }, 5000);
            }
        }
    };

    // Start the countdown updates
    updateImminent();
}

// Add a style for the pulse animation
const style = document.createElement('style');
style.textContent = `
@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.05);
    }
    100% {
        transform: scale(1);
    }
}
`;
document.head.appendChild(style);
