/**
 * Expert Booking System for Service Marketplace
 * Handles the booking flow for client consultations with experts
 */

// Booking state management
const bookingState = {
  expertId: null,
  expertData: null,
  selectedConsultation: null,
  selectedDate: null,
  selectedTime: null,
  clientInfo: null,
  currentStep: 1
};

// Initialize the booking system
document.addEventListener('DOMContentLoaded', () => {
  // Get expert ID from URL parameter
  const urlParams = new URLSearchParams(window.location.search);
  const expertId = urlParams.get('expertId');

  if (expertId) {
    loadExpertData(expertId);
  } else {
    // For demo purposes, load mock expert data
    loadMockExpertData();
  }

  // Set up event listeners
  setupEventListeners();
});

// Load expert data from API (or mock data for demo)
function loadExpertData(expertId) {
  bookingState.expertId = expertId;

  // In a real app, this would fetch data from the server
  // For demo purposes, load mock data
  loadMockExpertData();
}

// Load mock expert data for demonstration
function loadMockExpertData() {
  // Create a mock expert
  const mockExpert = {
    id: 'exp-123456',
    name: 'Dr. Jessica Chen',
    specialization: 'Nutrition - Diet Planning',
    profilePicture: '/uploads/default-avatar.png',
    bio: 'Dr. Jessica Chen is a certified nutritionist with over 10 years of experience in diet planning and nutrition counseling. She specializes in helping clients achieve their health goals through personalized nutrition plans.',
    expertise: 'Diet Planning, Weight Management, Sports Nutrition, Medical Nutrition Therapy',
    education: 'Ph.D. in Nutritional Sciences, Stanford University',
    languages: 'English, Spanish',
    rating: {
      average: 4.5,
      count: 28
    },
    consultationTypes: [
      {
        id: 'consult-1',
        title: 'Initial Consultation',
        description: 'Comprehensive assessment and personalized plan development.',
        duration: 60,
        price: 150
      },
      {
        id: 'consult-2',
        title: 'Follow-up Session',
        description: 'Review progress and make adjustments to your plan.',
        duration: 30,
        price: 75
      },
      {
        id: 'consult-3',
        title: 'In-Depth Analysis',
        description: 'Detailed nutritional analysis and advanced planning.',
        duration: 90,
        price: 220
      },
      {
        id: 'consult-4',
        title: 'Quick Check-in',
        description: 'Brief session to address specific questions or concerns.',
        duration: 15,
        price: 45
      }
    ],
    availability: [
      { day: 'monday', startTime: '09:00', endTime: '17:00' },
      { day: 'tuesday', startTime: '09:00', endTime: '17:00' },
      { day: 'wednesday', startTime: '09:00', endTime: '17:00' },
      { day: 'thursday', startTime: '09:00', endTime: '17:00' },
      { day: 'friday', startTime: '09:00', endTime: '17:00' }
    ]
  };

  // Store expert data in state
  bookingState.expertData = mockExpert;

  // Update UI with expert data
  updateExpertProfile(mockExpert);

  // Display consultation types
  displayConsultationTypes(mockExpert.consultationTypes);
}

// Update the expert profile section with data
function updateExpertProfile(expertData) {
  document.getElementById('expert-avatar').src = expertData.profilePicture;
  document.getElementById('expert-name').textContent = expertData.name;
  document.getElementById('expert-specialization').textContent = expertData.specialization;
  document.getElementById('expert-bio').textContent = expertData.bio;
  document.getElementById('expert-expertise').textContent = expertData.expertise;
  document.getElementById('expert-education').textContent = expertData.education;
  document.getElementById('expert-languages').textContent = expertData.languages;

  // Update rating
  const starsContainer = document.getElementById('expert-stars');
  starsContainer.innerHTML = generateStarsHTML(expertData.rating.average);
  document.getElementById('expert-rating-count').textContent = `(${expertData.rating.average} / ${expertData.rating.count} reviews)`;
}

// Generate HTML for star ratings
function generateStarsHTML(rating) {
  let starsHTML = '';
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    starsHTML += '<i class="fas fa-star"></i>';
  }

  // Add half star if needed
  if (hasHalfStar) {
    starsHTML += '<i class="fas fa-star-half-alt"></i>';
  }

  // Add empty stars
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  for (let i = 0; i < emptyStars; i++) {
    starsHTML += '<i class="far fa-star"></i>';
  }

  return starsHTML;
}

// Display consultation types
function displayConsultationTypes(consultationTypes) {
  const container = document.getElementById('consultation-types');
  container.innerHTML = '';

  consultationTypes.forEach(type => {
    const typeElement = document.createElement('div');
    typeElement.className = 'consultation-option';
    typeElement.dataset.id = type.id;

    typeElement.innerHTML = `
      <div class="consultation-title">
        ${type.title}
        <i class="fas fa-check-circle" style="color: #2ecc71; display: none;"></i>
      </div>
      <div class="consultation-duration">${type.duration} minutes</div>
      <div class="consultation-description">${type.description}</div>
      <div class="consultation-price">$${type.price.toFixed(2)}</div>
    `;

    // Add click event to select consultation type
    typeElement.addEventListener('click', () => {
      // Remove selected class from all options
      document.querySelectorAll('.consultation-option').forEach(el => {
        el.classList.remove('selected');
        el.querySelector('.fa-check-circle').style.display = 'none';
      });

      // Add selected class to clicked option
      typeElement.classList.add('selected');
      typeElement.querySelector('.fa-check-circle').style.display = 'inline-block';

      // Update booking state
      bookingState.selectedConsultation = consultationTypes.find(c => c.id === type.id);

      // Enable the continue button
      document.getElementById('next-step-1').disabled = false;
    });

    container.appendChild(typeElement);
  });
}

// Display available dates
function displayAvailableDates() {
  const container = document.getElementById('date-options');
  container.innerHTML = '';

  // Generate dates for the next 14 days
  const today = new Date();
  const availableDays = bookingState.expertData.availability.map(a => a.day.toLowerCase());

  for (let i = 0; i < 14; i++) {
    const date = new Date();
    date.setDate(today.getDate() + i);

    // Check if expert is available on this day
    const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const isAvailable = availableDays.includes(dayOfWeek);

    const dateElement = document.createElement('div');
    dateElement.className = `date-option ${isAvailable ? '' : 'disabled'}`;

    // Format date display
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'short' });

    dateElement.innerHTML = `
      <div class="date-weekday">${weekday}</div>
      <div class="date-day">${day}</div>
      <div class="date-month">${month}</div>
    `;

    if (isAvailable) {
      // Store the date object as a data attribute
      dateElement.dataset.date = date.toISOString();

      // Add click event to select date
      dateElement.addEventListener('click', () => {
        // Remove selected class from all options
        document.querySelectorAll('.date-option').forEach(el => {
          el.classList.remove('selected');
        });

        // Add selected class to clicked option
        dateElement.classList.add('selected');

        // Update booking state
        bookingState.selectedDate = new Date(dateElement.dataset.date);

        // Show available times for selected date
        displayAvailableTimes(bookingState.selectedDate);
      });
    }

    container.appendChild(dateElement);
  }
}

// Display available times for the selected date
function displayAvailableTimes(selectedDate) {
  const container = document.getElementById('time-options');
  container.innerHTML = '';

  // Get day of week for selected date
  const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();

  // Find availability for that day
  const dayAvailability = bookingState.expertData.availability.find(a => a.day.toLowerCase() === dayOfWeek);

  if (!dayAvailability) {
    container.innerHTML = '<p>No available times for the selected date.</p>';
    return;
  }

  // Generate time slots based on availability
  const startTime = dayAvailability.startTime;
  const endTime = dayAvailability.endTime;

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);

  const startDate = new Date(selectedDate);
  startDate.setHours(startHour, startMinute, 0, 0);

  const endDate = new Date(selectedDate);
  endDate.setHours(endHour, endMinute, 0, 0);

  // Generate time slots in 30-minute increments
  const timeSlots = [];
  let currentTime = new Date(startDate);

  while (currentTime < endDate) {
    timeSlots.push(new Date(currentTime));
    currentTime.setMinutes(currentTime.getMinutes() + 30);
  }

  // Create time option elements
  timeSlots.forEach(timeSlot => {
    const timeElement = document.createElement('div');
    timeElement.className = 'time-option';

    // Format time display
    const timeString = timeSlot.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    timeElement.textContent = timeString;

    // Store the time object as a data attribute
    timeElement.dataset.time = timeSlot.toISOString();

    // Add click event to select time
    timeElement.addEventListener('click', () => {
      // Remove selected class from all options
      document.querySelectorAll('.time-option').forEach(el => {
        el.classList.remove('selected');
      });

      // Add selected class to clicked option
      timeElement.classList.add('selected');

      // Update booking state
      bookingState.selectedTime = new Date(timeElement.dataset.time);

      // Enable the continue button
      document.getElementById('next-step-2').disabled = false;
    });

    container.appendChild(timeElement);
  });
}

// Set up event listeners for the booking flow
function setupEventListeners() {
  // Step 1: Consultation Type - Continue button
  document.getElementById('next-step-1').addEventListener('click', () => {
    goToStep(2);
    displayAvailableDates();
  });

  // Step 2: Date & Time - Navigation buttons
  document.getElementById('prev-step-2').addEventListener('click', () => {
    goToStep(1);
  });

  document.getElementById('next-step-2').addEventListener('click', () => {
    goToStep(3);
  });

  // Step 3: Client Information - Form submission
  document.getElementById('client-form').addEventListener('submit', event => {
    event.preventDefault();

    // Gather client information
    bookingState.clientInfo = {
      name: document.getElementById('client-name').value,
      email: document.getElementById('client-email').value,
      phone: document.getElementById('client-phone').value,
      timezone: document.getElementById('client-timezone').value,
      notes: document.getElementById('client-notes').value
    };

    // Update summary
    updateBookingSummary();

    // Go to confirmation step
    goToStep(4);
  });

  document.getElementById('prev-step-3').addEventListener('click', () => {
    goToStep(2);
  });

  // Step 4: Confirmation - Navigation buttons
  document.getElementById('prev-step-4').addEventListener('click', () => {
    goToStep(3);
  });

  document.getElementById('confirm-booking').addEventListener('click', () => {
    // Submit booking (in a real app, this would send data to the server)
    submitBooking();
  });
}

// Update booking summary for confirmation
function updateBookingSummary() {
  const { expertData, selectedConsultation, selectedDate, selectedTime, clientInfo } = bookingState;

  // Format date and time
  const dateTimeOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  };
  const formattedDateTime = selectedTime.toLocaleDateString('en-US', dateTimeOptions);

  // Update summary elements
  document.getElementById('summary-expert').textContent = expertData.name;
  document.getElementById('summary-type').textContent = `${selectedConsultation.title} (${selectedConsultation.duration} min)`;
  document.getElementById('summary-datetime').textContent = formattedDateTime;
  document.getElementById('summary-name').textContent = clientInfo.name;
  document.getElementById('summary-email').textContent = clientInfo.email;
  document.getElementById('summary-phone').textContent = clientInfo.phone;
  document.getElementById('summary-price').textContent = `$${selectedConsultation.price.toFixed(2)}`;
}

// Navigate to the specified step
function goToStep(stepNumber) {
  // Hide all step content
  document.querySelectorAll('.step-content').forEach(el => {
    el.classList.remove('active');
  });

  // Show the target step content
  document.querySelector(`.step-content[data-step="${stepNumber}"]`).classList.add('active');

  // Update step indicators
  document.querySelectorAll('.step').forEach(el => {
    const step = parseInt(el.dataset.step);
    el.classList.remove('active', 'completed');

    if (step === stepNumber) {
      el.classList.add('active');
    } else if (step < stepNumber) {
      el.classList.add('completed');
    }
  });

  // Update current step in state
  bookingState.currentStep = stepNumber;

  // Scroll to top of content
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Submit booking to the server (or simulate for demo)
function submitBooking() {
  // In a real app, this would send a request to the server
  // For demo purposes, simulate a server response with a timeout

  // Disable the confirm button to prevent multiple submissions
  const confirmButton = document.getElementById('confirm-booking');
  confirmButton.disabled = true;
  confirmButton.textContent = 'Processing...';

  setTimeout(() => {
    // Generate a random booking reference
    const bookingReference = 'BK-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    document.getElementById('booking-reference').textContent = bookingReference;

    // Show success message
    goToStep(5);

    // In a real app, this would also display a notification to the expert
    // and update their dashboard with the new booking
  }, 1500);
}
