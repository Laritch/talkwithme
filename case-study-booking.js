// Case Study Booking JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeDatePicker();
    initializeTimeSlots();
    initializeServiceSelection();
    initializeContactModal();
    initializeFormSubmission();
});

// Calendar functionality
function initializeDatePicker() {
    const availableDays = document.querySelectorAll('.day.available');
    const currentMonthElement = document.querySelector('.current-month');
    const timeSelectorHeading = document.querySelector('.time-selector h4');
    const prevMonthBtn = document.querySelector('.month-nav-btn.prev');
    const nextMonthBtn = document.querySelector('.month-nav-btn.next');

    // Current displayed month (starting with April 2025)
    let currentMonth = 3; // 0-indexed (0 = January, 3 = April)
    let currentYear = 2025;

    // Month navigation
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        updateMonthDisplay();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        updateMonthDisplay();
    });

    function updateMonthDisplay() {
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'];
        currentMonthElement.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        // In a real application, this would fetch new available days from the server
        // For this demo, we'll just reset the selected day
        clearSelectedDay();
    }

    // Handle day selection
    availableDays.forEach(day => {
        day.addEventListener('click', () => {
            clearSelectedDay();
            day.classList.add('selected');

            // Update time slots heading with selected date
            const selectedDate = `April ${day.textContent}, 2025`;
            timeSelectorHeading.textContent = `Available Times for ${selectedDate}`;

            // Scroll to time selection
            document.querySelector('.time-selector').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });

    function clearSelectedDay() {
        availableDays.forEach(day => {
            day.classList.remove('selected');
        });

        // Also clear time selection when date changes
        clearSelectedTime();
    }
}

// Time slot selection
function initializeTimeSlots() {
    const timeSlots = document.querySelectorAll('.time-slot');

    timeSlots.forEach(slot => {
        slot.addEventListener('click', () => {
            clearSelectedTime();
            slot.classList.add('selected');

            // Scroll to booking form
            document.querySelector('.booking-form').scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    });
}

function clearSelectedTime() {
    const timeSlots = document.querySelectorAll('.time-slot');
    timeSlots.forEach(slot => {
        slot.classList.remove('selected');
    });
}

// Service selection
function initializeServiceSelection() {
    const serviceOptions = document.querySelectorAll('.service-option input[type="radio"]');

    serviceOptions.forEach(option => {
        option.addEventListener('change', function() {
            // Update price display or any other service-related UI elements
            const selectedService = this.value;

            // Example: You could update a summary section or payment details
            console.log(`Selected service: ${selectedService}`);

            // Depending on the service selected, you might want to:
            // - Show/hide certain form fields
            // - Update pricing information
            // - Change available time slots
        });
    });
}

// Contact modal
function initializeContactModal() {
    const contactBtn = document.getElementById('contact-expert-btn');
    const modal = document.getElementById('contact-modal');
    const closeModal = document.querySelector('.close-modal');

    contactBtn.addEventListener('click', () => {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling behind modal
    });

    closeModal.addEventListener('click', () => {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    });

    // Close modal when clicking outside of it
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    });

    // Handle contact form submission
    const contactForm = document.querySelector('.contact-form');

    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Basic form validation
        const requiredFields = this.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                highlightInvalidField(field);
            } else {
                removeInvalidHighlight(field);
            }
        });

        if (isValid) {
            // In a real application, you would send this data to the server
            const formData = new FormData(this);
            const formValues = Object.fromEntries(formData.entries());

            console.log('Contact form submitted:', formValues);

            // Show success message
            showSuccessMessage(contactForm, 'Your message has been sent! The expert will respond shortly.');

            // Close modal after delay
            setTimeout(() => {
                modal.classList.remove('active');
                document.body.style.overflow = '';
                // Reset form after closing
                contactForm.reset();
            }, 3000);
        }
    });
}

// Booking form submission
function initializeFormSubmission() {
    const bookingForm = document.querySelector('.booking-form');

    bookingForm.addEventListener('submit', function(e) {
        e.preventDefault();

        // Validate selected date and time
        const selectedDay = document.querySelector('.day.selected');
        const selectedTime = document.querySelector('.time-slot.selected');

        if (!selectedDay || !selectedTime) {
            alert('Please select both a date and time for your appointment.');
            return;
        }

        // Basic form validation
        const requiredFields = this.querySelectorAll('[required]');
        let isValid = true;

        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                isValid = false;
                highlightInvalidField(field);
            } else {
                removeInvalidHighlight(field);
            }
        });

        if (isValid) {
            // Get selected service
            const selectedService = document.querySelector('.service-option input[type="radio"]:checked').value;

            // Get date and time
            const date = `April ${selectedDay.textContent}, 2025`;
            const time = selectedTime.textContent;

            // In a real application, you would send this data to the server
            const formData = new FormData(this);
            const formValues = Object.fromEntries(formData.entries());

            // Add date, time and service info
            formValues.appointmentDate = date;
            formValues.appointmentTime = time;
            formValues.service = selectedService;

            console.log('Booking form submitted:', formValues);

            // Show success message and redirect user
            showBookingConfirmation(formValues);
        }
    });
}

// Utility functions
function highlightInvalidField(field) {
    field.classList.add('invalid');
    field.style.borderColor = '#f44336';

    // Add validation message
    const parent = field.parentElement;
    let errorMessage = parent.querySelector('.error-message');

    if (!errorMessage) {
        errorMessage = document.createElement('div');
        errorMessage.className = 'error-message';
        errorMessage.style.color = '#f44336';
        errorMessage.style.fontSize = '0.85rem';
        errorMessage.style.marginTop = '5px';
        parent.appendChild(errorMessage);
    }

    errorMessage.textContent = 'This field is required';
}

function removeInvalidHighlight(field) {
    field.classList.remove('invalid');
    field.style.borderColor = '';

    // Remove validation message if exists
    const parent = field.parentElement;
    const errorMessage = parent.querySelector('.error-message');
    if (errorMessage) {
        parent.removeChild(errorMessage);
    }
}

function showSuccessMessage(form, message) {
    // Remove any existing success message
    const existingSuccess = form.querySelector('.success-message');
    if (existingSuccess) {
        existingSuccess.remove();
    }

    // Create success message
    const successMessage = document.createElement('div');
    successMessage.className = 'success-message';
    successMessage.style.backgroundColor = '#e8f5e9';
    successMessage.style.color = '#43a047';
    successMessage.style.padding = '15px';
    successMessage.style.borderRadius = '6px';
    successMessage.style.marginTop = '15px';
    successMessage.style.textAlign = 'center';
    successMessage.innerHTML = `<i class="fas fa-check-circle" style="margin-right: 8px;"></i>${message}`;

    // Append to form
    form.appendChild(successMessage);
}

function showBookingConfirmation(formData) {
    // Replace form with confirmation
    const bookingContainer = document.querySelector('.booking-container');

    // Create confirmation content
    const confirmationContent = document.createElement('div');
    confirmationContent.className = 'booking-confirmation';
    confirmationContent.innerHTML = `
        <div class="confirmation-header">
            <i class="fas fa-check-circle" style="font-size: 48px; color: #43a047; margin-bottom: 20px;"></i>
            <h2>Your booking is confirmed!</h2>
            <p>We've sent a confirmation email to <strong>${formData.clientEmail}</strong> with all the details.</p>
        </div>

        <div class="confirmation-details">
            <h3>Booking Details</h3>
            <div class="detail-row">
                <div class="detail-label">Service:</div>
                <div class="detail-value">${getServiceName(formData.service)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Date & Time:</div>
                <div class="detail-value">${formData.appointmentDate} at ${formData.appointmentTime}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Expert:</div>
                <div class="detail-value">James Wilson</div>
            </div>
        </div>

        <div class="confirmation-actions">
            <button class="btn btn-primary">Add to Calendar</button>
            <a href="expert-case-studies.html" class="btn btn-outline">Browse More Case Studies</a>
        </div>

        <div class="confirmation-next-steps">
            <h3>What's Next?</h3>
            <ul>
                <li>You'll receive a calendar invitation with meeting details.</li>
                <li>The expert will send you a preparation guide before your session.</li>
                <li>You'll get a reminder email 24 hours before your appointment.</li>
            </ul>
        </div>
    `;

    // Style confirmation
    const style = document.createElement('style');
    style.textContent = `
        .booking-confirmation {
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
            padding: 40px;
            max-width: 700px;
            margin: 0 auto;
            text-align: center;
        }

        .confirmation-header {
            margin-bottom: 30px;
        }

        .confirmation-header h2 {
            margin-bottom: 10px;
            color: #333;
        }

        .confirmation-header p {
            color: #666;
        }

        .confirmation-details {
            background-color: #f8f9fa;
            border-radius: 8px;
            padding: 25px;
            margin-bottom: 30px;
            text-align: left;
        }

        .confirmation-details h3 {
            margin-top: 0;
            margin-bottom: 20px;
            color: #333;
            font-size: 1.2rem;
        }

        .detail-row {
            display: flex;
            margin-bottom: 12px;
            font-size: 1rem;
        }

        .detail-label {
            width: 120px;
            color: #666;
            font-weight: 500;
        }

        .detail-value {
            flex: 1;
            font-weight: 600;
        }

        .confirmation-actions {
            display: flex;
            justify-content: center;
            gap: 15px;
            margin-bottom: 30px;
        }

        .confirmation-next-steps {
            background-color: #fff3e0;
            border-radius: 8px;
            padding: 25px;
            text-align: left;
        }

        .confirmation-next-steps h3 {
            margin-top: 0;
            margin-bottom: 15px;
            color: #333;
            font-size: 1.2rem;
        }

        .confirmation-next-steps ul {
            padding-left: 20px;
            margin: 0;
        }

        .confirmation-next-steps li {
            margin-bottom: 8px;
            color: #555;
        }
    `;

    // Clear booking container and add confirmation
    bookingContainer.innerHTML = '';
    document.head.appendChild(style);
    bookingContainer.appendChild(confirmationContent);

    // Scroll to top
    window.scrollTo(0, 0);
}

function getServiceName(serviceValue) {
    const serviceMap = {
        'discovery-call': 'Discovery Call (Free)',
        'strategy-session': 'Strategy Session ($199)',
        'growth-package': 'Growth Package ($749)'
    };

    return serviceMap[serviceValue] || serviceValue;
}
