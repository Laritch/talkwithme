/**
 * Expert Dashboard for Service Marketplace
 * This file handles the expert dashboard UI and functionality
 */

// State management for the dashboard
const dashboardState = {
  expertData: null,
  consultations: [],
  clients: [],
  reviews: [],
  charts: {},
  activeTab: 'dashboard'
};

// Initialize the dashboard
function initExpertDashboard() {
  // Check if expert is logged in
  const expertData = JSON.parse(localStorage.getItem('expertData') || '{}');
  if (!expertData.token) {
    // Redirect to login if not logged in
    window.location.href = '/expert-login.html';
    return;
  }

  // Add membership tier if not present
  if (!expertData.membershipTier) {
    expertData.membershipTier = 'basic';
    localStorage.setItem('expertData', JSON.stringify(expertData));
  }

  // Store expert data in state
  dashboardState.expertData = expertData;

  // Set up UI with expert data
  setupExpertUI(expertData);

  // Generate mock data (in a real app, this would be fetched from an API)
  generateMockData();

  // Initialize dashboard components
  initDashboardComponents();

  // Set up event listeners
  setupEventListeners();

  // Show dashboard content
  document.getElementById('loadingIndicator').style.display = 'none';
  document.getElementById('dashboardContent').style.display = 'block';
}

// Set up the UI with expert data
function setupExpertUI(expertData) {
  // Set expert name and verification status
  document.getElementById('expert-name').textContent = expertData.name;
  document.getElementById('expert-avatar').src = expertData.profilePicture;

  const verificationBadge = document.getElementById('verification-badge');
  verificationBadge.textContent = capitalizeFirstLetter(expertData.verificationStatus);
  verificationBadge.className = `verification-badge ${expertData.verificationStatus}`;

  // Show/hide verification messages based on status
  if (expertData.verificationStatus === 'pending') {
    document.getElementById('verification-pending-message').style.display = 'block';
    document.getElementById('verification-rejected-message').style.display = 'none';
  } else if (expertData.verificationStatus === 'rejected') {
    document.getElementById('verification-pending-message').style.display = 'none';
    document.getElementById('verification-rejected-message').style.display = 'block';
    document.getElementById('rejection-reason').textContent = expertData.verificationNotes || 'No specific reason provided.';
  } else {
    // Verified expert - hide messages
    document.getElementById('verification-pending-message').style.display = 'none';
    document.getElementById('verification-rejected-message').style.display = 'none';
  }

  // Set dashboard stats
  document.getElementById('totalRevenue').textContent = `$${numberWithCommas(expertData.metrics?.totalRevenue || 0)}`;
  document.getElementById('totalConsultations').textContent = expertData.metrics?.totalConsultations || 0;
  document.getElementById('avgRating').textContent = `${expertData.rating?.average || 0} `;
  document.getElementById('completionRate').textContent = `${Math.round((expertData.metrics?.completionRate || 0) * 100)}%`;

  // Set trends
  document.getElementById('revenueTrend').innerHTML = `<i class="fas fa-arrow-up"></i> +15% vs last period`;
  document.getElementById('consultationsTrend').innerHTML = `<i class="fas fa-arrow-up"></i> +8% vs last period`;
  document.getElementById('ratingTrend').textContent = `Based on ${expertData.rating?.count || 0} reviews`;
  document.getElementById('completionTrend').textContent = `${expertData.metrics?.totalConsultations || 0} completed out of ${expertData.metrics?.totalConsultations || 0}`;

  // Add membership tier info (NEW)
  const membershipTier = expertData.membershipTier || 'basic';
  const commissionRate = membershipTier === 'elite' ? 8 :
                         membershipTier === 'premium' ? 12 : 18;

  // Add membership info to header if element exists
  const membershipInfoEl = document.getElementById('membership-info');
  if (membershipInfoEl) {
    membershipInfoEl.innerHTML = `
      <span class="membership-badge ${membershipTier}">
        ${capitalizeFirstLetter(membershipTier)} Tier
      </span>
      <span class="commission-rate">
        ${commissionRate}% Commission
      </span>
    `;
  }

  // Update profile view
  updateProfileView();
}

// Generate mock data for consultations, clients, and reviews
function generateMockData() {
  // Generate mock consultations
  const consultationTypes = ['Initial Consultation', 'Follow-up', 'Emergency Consult', 'Extended Session'];
  const statuses = ['scheduled', 'completed', 'cancelled'];
  const clientNames = ['Alice Johnson', 'Bob Smith', 'Carol Williams', 'David Brown', 'Eve Davis', 'Frank Miller', 'Grace Wilson', 'Henry Taylor', 'Ivy Martinez', 'Jack Thompson'];

  for (let i = 0; i < 20; i++) {
    // Random date within next 30 days (for scheduled) or past 30 days (for completed/cancelled)
    const now = new Date();
    const isScheduled = i < 10 && Math.random() > 0.3;
    const randomDays = isScheduled ?
      Math.floor(Math.random() * 30) + 1 : // Future date
      -Math.floor(Math.random() * 30) - 1; // Past date

    const consultDate = new Date();
    consultDate.setDate(now.getDate() + randomDays);

    // Random time
    const hours = Math.floor(Math.random() * 9) + 9; // 9 AM to 6 PM
    const minutes = [0, 15, 30, 45][Math.floor(Math.random() * 4)]; // Quarter-hour increments
    consultDate.setHours(hours, minutes);

    // Determine status based on date and some randomness
    let status;
    if (isScheduled) {
      status = 'scheduled';
    } else {
      status = Math.random() > 0.2 ? 'completed' : 'cancelled';
    }

    // Random client
    const clientIdx = Math.floor(Math.random() * clientNames.length);
    const clientName = clientNames[clientIdx];
    const clientEmail = clientName.toLowerCase().replace(' ', '.') + '@example.com';

    // Create consultation object
    const consultation = {
      id: `consult-${i + 1}`,
      clientName: clientName,
      clientEmail: clientEmail,
      clientAvatar: '/uploads/default-avatar.png',
      date: consultDate,
      type: consultationTypes[Math.floor(Math.random() * consultationTypes.length)],
      duration: [30, 45, 60, 90][Math.floor(Math.random() * 4)],
      price: [75, 100, 150, 200, 250][Math.floor(Math.random() * 5)],
      status: status,
      notes: status === 'completed' ? 'Consultation completed successfully.' :
             status === 'cancelled' ? 'Client canceled due to scheduling conflict.' :
             'Upcoming consultation.'
    };

    dashboardState.consultations.push(consultation);

    // Add to unique clients list if not already there
    if (!dashboardState.clients.some(c => c.email === clientEmail)) {
      dashboardState.clients.push({
        name: clientName,
        email: clientEmail,
        avatar: '/uploads/default-avatar.png',
        firstConsultation: dashboardState.consultations
          .filter(c => c.clientEmail === clientEmail)
          .sort((a, b) => a.date - b.date)[0]?.date || consultDate,
        totalConsultations: dashboardState.consultations.filter(c => c.clientEmail === clientEmail).length,
        totalRevenue: dashboardState.consultations
          .filter(c => c.clientEmail === clientEmail && c.status === 'completed')
          .reduce((sum, c) => sum + c.price, 0)
      });
    }
  }

  // Generate mock reviews
  const reviewComments = [
    "Very knowledgeable and professional. Highly recommend!",
    "Excellent consultation, provided valuable insights.",
    "Helped me understand my situation better. Thank you!",
    "Great expertise, would definitely consult again.",
    "Very thorough and answered all my questions.",
    "Incredibly helpful and patient.",
    "Explained everything clearly, great communication skills.",
    "Provided practical advice that I could implement right away.",
    "Very attentive and really listened to my concerns.",
    "Went above and beyond in providing assistance."
  ];

  for (let i = 0; i < 8; i++) {
    // Random date within past 90 days
    const reviewDate = new Date();
    reviewDate.setDate(reviewDate.getDate() - Math.floor(Math.random() * 90));

    // Random client (from existing ones)
    const client = dashboardState.clients[Math.floor(Math.random() * dashboardState.clients.length)];

    // Create review object
    const review = {
      id: `review-${i + 1}`,
      clientName: client.name,
      clientAvatar: client.avatar,
      rating: Math.floor(Math.random() * 3) + 3, // 3-5 stars (mostly positive)
      comment: reviewComments[Math.floor(Math.random() * reviewComments.length)],
      date: reviewDate
    };

    dashboardState.reviews.push(review);
  }

  // Sort by date
  dashboardState.consultations.sort((a, b) => b.date - a.date);
  dashboardState.reviews.sort((a, b) => b.date - a.date);
}

// Initialize dashboard components
function initDashboardComponents() {
  // Display upcoming consultations in the overview tab
  displayUpcomingConsultations();

  // Display recent reviews in the overview tab
  displayRecentReviews();

  // Initialize charts
  initCharts();

  // Initial tab setup
  document.querySelector(`.sidebar-menu a[data-tab="dashboard"]`).classList.add('active');
}

// Display upcoming consultations in the overview tab
function displayUpcomingConsultations() {
  const tableBody = document.querySelector('#upcoming-consultations-table tbody');
  const upcomingConsultations = dashboardState.consultations
    .filter(c => c.status === 'scheduled')
    .sort((a, b) => a.date - b.date)
    .slice(0, 5);

  if (upcomingConsultations.length === 0) {
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No upcoming consultations</td></tr>';
    return;
  }

  tableBody.innerHTML = '';

  upcomingConsultations.forEach(consultation => {
    const row = document.createElement('tr');

    // Format date and time
    const dateOptions = { weekday: 'short', month: 'short', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    const formattedDate = consultation.date.toLocaleDateString('en-US', dateOptions);
    const formattedTime = consultation.date.toLocaleTimeString('en-US', timeOptions);

    row.innerHTML = `
      <td>
        <div class="flex-center">
          <img src="${consultation.clientAvatar}" alt="${consultation.clientName}" class="avatar">
          <div class="client-info">
            <div>${consultation.clientName}</div>
            <div style="font-size: 12px; color: #666;">${consultation.clientEmail}</div>
          </div>
        </div>
      </td>
      <td>
        <div>${formattedDate}</div>
        <div style="font-size: 12px; color: #666;">${formattedTime}</div>
      </td>
      <td>${consultation.type}</td>
      <td>${consultation.duration} min</td>
      <td>$${consultation.price}</td>
      <td><span class="status ${consultation.status}">${capitalizeFirstLetter(consultation.status)}</span></td>
      <td>
        <button class="btn btn-outline btn-sm view-consultation-btn" data-id="${consultation.id}">
          <i class="fas fa-eye"></i> View
        </button>
      </td>
    `;

    tableBody.appendChild(row);
  });

  // Add event listeners to buttons
  document.querySelectorAll('.view-consultation-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const consultationId = this.getAttribute('data-id');
      // Switch to consultations tab and highlight this consultation
      showTab('consultations');
      // TODO: Show consultation details modal
    });
  });
}

// Display recent reviews in the overview tab
function displayRecentReviews() {
  const reviewsContainer = document.getElementById('recent-reviews');
  const recentReviews = dashboardState.reviews
    .sort((a, b) => b.date - a.date)
    .slice(0, 3);

  if (recentReviews.length === 0) {
    reviewsContainer.innerHTML = '<p class="text-center">No reviews yet</p>';
    return;
  }

  reviewsContainer.innerHTML = '';

  recentReviews.forEach(review => {
    // Format date
    const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const formattedDate = review.date.toLocaleDateString('en-US', dateOptions);

    // Create stars
    let stars = '';
    for (let i = 1; i <= 5; i++) {
      stars += `<i class="fas fa-star" style="color: ${i <= review.rating ? '#f1c40f' : '#ddd'};"></i>`;
    }

    const reviewEl = document.createElement('div');
    reviewEl.style.marginBottom = '20px';
    reviewEl.style.padding = '15px';
    reviewEl.style.backgroundColor = '#f9f9f9';
    reviewEl.style.borderRadius = '8px';

    reviewEl.innerHTML = `
      <div style="display: flex; align-items: center; margin-bottom: 10px;">
        <img src="${review.clientAvatar}" alt="${review.clientName}" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
        <div>
          <div style="font-weight: 500;">${review.clientName}</div>
          <div style="font-size: 12px; color: #666;">${formattedDate}</div>
        </div>
        <div style="margin-left: auto;">${stars}</div>
      </div>
      <div>${review.comment}</div>
    `;

    reviewsContainer.appendChild(reviewEl);
  });
}

// Initialize charts
function initCharts() {
  // Revenue Chart
  const revenueCtx = document.getElementById('revenueChart').getContext('2d');
  const revenueMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = [0, 0, 0, 0, 0, 0, 1200, 1800, 2400, 3200, 2800, 3500]; // Mock data with recent months having actual values

  dashboardState.charts.revenueChart = new Chart(revenueCtx, {
    type: 'line',
    data: {
      labels: revenueMonths,
      datasets: [{
        label: 'Revenue ($)',
        data: revenueData,
        backgroundColor: 'rgba(52, 152, 219, 0.2)',
        borderColor: 'rgba(52, 152, 219, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(52, 152, 219, 1)',
        tension: 0.3
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          bodyFont: {
            size: 14
          },
          callbacks: {
            label: function(context) {
              return `Revenue: $${context.raw}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        },
        x: {
          grid: {
            display: false
          }
        }
      }
    }
  });

  // Consultation Types Chart
  const typesCtx = document.getElementById('consultationTypesChart').getContext('2d');
  const consultationTypes = {
    'Initial Consultation': 12,
    'Follow-up': 25,
    'Emergency Consult': 5,
    'Extended Session': 8
  };

  dashboardState.charts.typesChart = new Chart(typesCtx, {
    type: 'doughnut',
    data: {
      labels: Object.keys(consultationTypes),
      datasets: [{
        data: Object.values(consultationTypes),
        backgroundColor: [
          'rgba(52, 152, 219, 0.8)',
          'rgba(46, 204, 113, 0.8)',
          'rgba(231, 76, 60, 0.8)',
          'rgba(155, 89, 182, 0.8)'
        ],
        borderColor: [
          'rgba(52, 152, 219, 1)',
          'rgba(46, 204, 113, 1)',
          'rgba(231, 76, 60, 1)',
          'rgba(155, 89, 182, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 20,
            boxWidth: 15
          }
        }
      }
    }
  });

  // Ratings Distribution Chart
  const ratingsCtx = document.getElementById('ratingsChart').getContext('2d');
  const ratings = {
    '5 stars': 15,
    '4 stars': 8,
    '3 stars': 4,
    '2 stars': 1,
    '1 star': 0
  };

  dashboardState.charts.ratingsChart = new Chart(ratingsCtx, {
    type: 'bar',
    data: {
      labels: Object.keys(ratings),
      datasets: [{
        data: Object.values(ratings),
        backgroundColor: 'rgba(241, 196, 15, 0.8)',
        borderColor: 'rgba(241, 196, 15, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

// Set up event listeners
function setupEventListeners() {
  // Tab navigation
  document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.addEventListener('click', function(e) {
      // Don't prevent default for external links
      if (this.getAttribute('href') &&
          this.getAttribute('href') !== '#' &&
          !this.getAttribute('href').startsWith('#')) {
        return; // Allow navigation to external pages
      }

      e.preventDefault();
      const tabName = this.getAttribute('data-tab');
      showTab(tabName);
    });
  });

  // Tab navigation in overview
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const tabName = this.getAttribute('data-tab');

      // Remove active class from all tab buttons and contents
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      // Add active class to selected tab button and content
      this.classList.add('active');
      document.getElementById(tabName).classList.add('active');
    });
  });

  // View all buttons
  document.getElementById('view-all-consultations').addEventListener('click', function() {
    showTab('consultations');
  });

  document.getElementById('view-all-reviews').addEventListener('click', function() {
    showTab('reviews-tab');
  });

  // Add membership and AI matching links/buttons (if elements exist)
  const membershipButton = document.getElementById('view-membership-btn');
  if (membershipButton) {
    membershipButton.addEventListener('click', function() {
      window.location.href = 'expert-membership.html';
    });
  }

  const aiMatchingButton = document.getElementById('view-ai-matching-btn');
  if (aiMatchingButton) {
    aiMatchingButton.addEventListener('click', function() {
      window.location.href = 'expert-matching.html';
    });
  });

  // Profile edit button
  document.getElementById('edit-profile-btn').addEventListener('click', function() {
    document.getElementById('profile-view').style.display = 'none';
    document.getElementById('profile-edit').style.display = 'block';
    this.style.display = 'none';
  });

  // Date range button (dummy functionality)
  document.getElementById('dateRangeBtn').addEventListener('click', function() {
    showNotification('Date range functionality is not implemented in this demo', 'info');
  });

  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', function() {
    showNotification('Dashboard data refreshed', 'success');
  });
}

// Show tab by name
function showTab(tabName) {
  // Hide all tab contents
  document.querySelectorAll('.tab-content').forEach(tab => {
    tab.style.display = 'none';
  });

  // Remove active class from all sidebar links
  document.querySelectorAll('.sidebar-menu a').forEach(link => {
    link.classList.remove('active');
  });

  // Show selected tab and add active class to sidebar link
  if (tabName === 'dashboard') {
    document.getElementById('overview').parentElement.style.display = 'block';
  } else {
    document.getElementById(tabName).style.display = 'block';
  }

  document.querySelector(`.sidebar-menu a[data-tab="${tabName}"]`).classList.add('active');
  dashboardState.activeTab = tabName;
}

// Update profile view with expert data
function updateProfileView() {
  const expertData = dashboardState.expertData;
  if (!expertData) return;

  const profileView = document.getElementById('profile-view');

  profileView.innerHTML = `
    <div style="display: flex; align-items: center; margin-bottom: 30px;">
      <img src="${expertData.profilePicture}" alt="${expertData.name}" style="width: 100px; height: 100px; border-radius: 50%; object-fit: cover; margin-right: 20px;">
      <div>
        <h2 style="margin: 0 0 5px 0;">${expertData.name}</h2>
        <div style="color: #666;">${expertData.category} - ${expertData.specialization}</div>
        <div style="margin-top: 10px;">
          <span class="status ${expertData.verificationStatus}">${capitalizeFirstLetter(expertData.verificationStatus)}</span>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h3>Contact Information</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
        <div>
          <div style="font-weight: 500; color: #666;">Email</div>
          <div>${expertData.email}</div>
        </div>
      </div>
    </div>

    <div style="margin-bottom: 30px;">
      <h3>Professional Information</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div>
          <div style="font-weight: 500; color: #666;">Category</div>
          <div>${expertData.category}</div>
        </div>
        <div>
          <div style="font-weight: 500; color: #666;">Specialization</div>
          <div>${expertData.specialization}</div>
        </div>
        <div>
          <div style="font-weight: 500; color: #666;">Highest Degree</div>
          <div>${expertData.credentials?.degree || 'Not specified'}</div>
        </div>
        <div>
          <div style="font-weight: 500; color: #666;">Institution</div>
          <div>${expertData.credentials?.institution || 'Not specified'}</div>
        </div>
        <div>
          <div style="font-weight: 500; color: #666;">Years of Experience</div>
          <div>${expertData.credentials?.yearsOfExperience || 0} years</div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <div style="font-weight: 500; color: #666;">Bio</div>
        <div style="margin-top: 5px;">${expertData.bio || 'No bio provided'}</div>
      </div>
    </div>
  `;

  // Create profile edit form
  const profileEdit = document.getElementById('profile-edit');

  profileEdit.innerHTML = `
    <form id="profile-edit-form" class="profile-form">
      <div class="form-group">
        <label for="edit-name">Full Name</label>
        <input type="text" id="edit-name" name="name" value="${expertData.name}" required>
      </div>

      <div class="form-group">
        <label for="edit-email">Email Address</label>
        <input type="email" id="edit-email" name="email" value="${expertData.email}" required>
      </div>

      <div class="form-group">
        <label for="edit-category">Category</label>
        <select id="edit-category" name="category" required>
          <option value="Nutrition" ${expertData.category === 'Nutrition' ? 'selected' : ''}>Nutrition</option>
          <option value="Legal" ${expertData.category === 'Legal' ? 'selected' : ''}>Legal</option>
          <option value="Financial" ${expertData.category === 'Financial' ? 'selected' : ''}>Financial</option>
          <option value="Medical" ${expertData.category === 'Medical' ? 'selected' : ''}>Medical</option>
          <option value="Technical" ${expertData.category === 'Technical' ? 'selected' : ''}>Technical</option>
          <option value="Other" ${expertData.category === 'Other' ? 'selected' : ''}>Other</option>
        </select>
      </div>

      <div class="form-group">
        <label for="edit-specialization">Specialization</label>
        <input type="text" id="edit-specialization" name="specialization" value="${expertData.specialization}" required>
      </div>

      <div class="form-group full-width">
        <label for="edit-bio">Professional Bio</label>
        <textarea id="edit-bio" name="bio" rows="5" required>${expertData.bio || ''}</textarea>
      </div>

      <div class="form-group">
        <label for="edit-degree">Highest Degree/Certification</label>
        <input type="text" id="edit-degree" name="degree" value="${expertData.credentials?.degree || ''}">
      </div>

      <div class="form-group">
        <label for="edit-institution">Institution</label>
        <input type="text" id="edit-institution" name="institution" value="${expertData.credentials?.institution || ''}">
      </div>

      <div class="form-group">
        <label for="edit-experience">Years of Experience</label>
        <input type="number" id="edit-experience" name="yearsOfExperience" value="${expertData.credentials?.yearsOfExperience || 0}" min="0">
      </div>

      <div class="form-buttons">
        <button type="button" id="cancel-edit-btn" class="btn btn-outline">Cancel</button>
        <button type="submit" class="btn btn-success">Save Changes</button>
      </div>
    </form>
  `;

  // Add event listeners for the edit form
  document.getElementById('cancel-edit-btn').addEventListener('click', function() {
    document.getElementById('profile-view').style.display = 'block';
    document.getElementById('profile-edit').style.display = 'none';
    document.getElementById('edit-profile-btn').style.display = 'inline-block';
  });

  document.getElementById('profile-edit-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // Update expert data with form values
    expertData.name = document.getElementById('edit-name').value;
    expertData.email = document.getElementById('edit-email').value;
    expertData.category = document.getElementById('edit-category').value;
    expertData.specialization = document.getElementById('edit-specialization').value;
    expertData.bio = document.getElementById('edit-bio').value;

    if (!expertData.credentials) expertData.credentials = {};
    expertData.credentials.degree = document.getElementById('edit-degree').value;
    expertData.credentials.institution = document.getElementById('edit-institution').value;
    expertData.credentials.yearsOfExperience = parseInt(document.getElementById('edit-experience').value);

    // Update localStorage
    localStorage.setItem('expertData', JSON.stringify(expertData));

    // Update UI
    setupExpertUI(expertData);

    // Show success message
    showNotification('Profile updated successfully', 'success');

    // Switch back to view mode
    document.getElementById('profile-view').style.display = 'block';
    document.getElementById('profile-edit').style.display = 'none';
    document.getElementById('edit-profile-btn').style.display = 'inline-block';
  });
}

// Show notification
function showNotification(message, type = 'info') {
  const notificationArea = document.getElementById('notification-area');

  const notification = document.createElement('div');
  notification.className = `notification ${type}`;

  // Set icon based on type
  let icon = 'fa-info-circle';
  if (type === 'success') icon = 'fa-check-circle';
  if (type === 'error') icon = 'fa-exclamation-circle';

  notification.innerHTML = `
    <i class="fas ${icon} notification-icon"></i>
    <div>${message}</div>
  `;

  notificationArea.appendChild(notification);

  // Remove after 5 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// Helper function to format numbers with commas
function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

// Helper function to capitalize first letter
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Initialize the dashboard when the DOM is loaded
document.addEventListener('DOMContentLoaded', initExpertDashboard);
