/**
 * Client Dashboard JavaScript
 */

// DOM Elements
const dashboardNavItems = document.querySelectorAll('.dashboard-nav-item');
const dashboardSections = document.querySelectorAll('.dashboard-section');
const userNameElement = document.querySelector('.user-name');
const lastLoginElement = document.querySelector('.last-login-date');
const statsElements = {
  orderCount: document.querySelector('.stat-card .order-count'),
  loyaltyPoints: document.querySelector('.stat-card .loyalty-points'),
  chatCount: document.querySelector('.stat-card .chat-count'),
  consultationCount: document.querySelector('.consultation-count') // Added consultation count
};

// Overview elements
const recentOrdersList = document.querySelector('.recent-orders-list');
const recentChatsList = document.querySelector('.recent-chats-list');
const tierNameElement = document.querySelector('.tier-name');
const tierProgressElement = document.querySelector('.tier-progress');
const progressBarElement = document.querySelector('.progress-bar');
const pointsBalanceElement = document.querySelector('.points-balance .value');
const availableRewardsElement = document.querySelector('.available-rewards .value');
const savedItemsPreview = document.querySelector('.saved-items-preview');

// Orders section elements
const ordersSearchInput = document.getElementById('orders-search');
const ordersFilterSelect = document.getElementById('orders-filter');
const ordersList = document.querySelector('.orders-list');
const ordersPaginationInfo = document.querySelector('#orders-section .pagination-info');
const ordersPrevButton = document.querySelector('#orders-section .pagination-prev');
const ordersNextButton = document.querySelector('#orders-section .pagination-next');

// Chats section elements
const chatsSearchInput = document.getElementById('chats-search');
const chatsFilterSelect = document.getElementById('chats-filter');
const chatsList = document.querySelector('.chats-list');
const chatsPaginationInfo = document.querySelector('#chats-section .pagination-info');
const chatsPrevButton = document.querySelector('#chats-section .pagination-prev');
const chatsNextButton = document.querySelector('#chats-section .pagination-next');

// Saved items section elements
const sectionTabs = document.querySelectorAll('.section-tab');
const sectionTabContents = document.querySelectorAll('.section-tab-content');
const savedProductsGrid = document.querySelector('.saved-products-grid');
const savedExpertsGrid = document.querySelector('.saved-experts-grid');
const savedBundlesGrid = document.querySelector('.saved-bundles-grid');

// Affiliate section elements
const referralCodeElement = document.querySelector('.referral-code');
const referralLinkElement = document.querySelector('.referral-link');
const copyButtons = document.querySelectorAll('.copy-btn');
const shareButtons = document.querySelectorAll('.share-btn');
const referralStatsElements = document.querySelectorAll('.affiliate-stats-card .stat-value');
const referralHistoryBody = document.querySelector('.referral-history-body');

// Settings section elements
const profileForm = document.getElementById('profile-form');
const passwordForm = document.getElementById('password-form');
const notificationForm = document.getElementById('notification-form');
const downloadDataBtn = document.getElementById('download-data-btn');
const deleteAccountBtn = document.getElementById('delete-account-btn');

// Modal elements
const deleteAccountModal = document.getElementById('delete-account-modal');
const deleteConfirmationInput = document.getElementById('delete-confirmation');
const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
const orderDetailsModal = document.getElementById('order-details-modal');
const orderDetailsContent = document.querySelector('.order-details-content');
const closeModalButtons = document.querySelectorAll('.close-modal, .close-button, .cancel-button');

// API Endpoints
const API = {
  PROFILE: '/api/users/profile',
  ORDERS: '/api/ecommerce/orders',
  CHATS: '/api/messages/conversations',
  SAVED_ITEMS: '/api/users/saved-items',
  LOYALTY: '/api/loyalty/profile',
  REFERRAL: '/api/loyalty/referral-code',
  ACCOUNT: '/api/users/account',
  CONSULTATIONS: '/api/expert-consult/appointments', // Added consultations endpoint
  EXPERTS: '/api/experts', // Added experts endpoint
  EXPERT_FEEDBACK: '/api/expert-consult/feedback' // Added expert feedback endpoint
};

// State
let userProfile = null;
let orders = {
  data: [],
  page: 1,
  totalPages: 1,
  filter: 'all',
  search: ''
};
let chats = {
  data: [],
  page: 1,
  totalPages: 1,
  filter: 'all',
  search: ''
};
let savedItems = {
  products: [],
  experts: [],
  bundles: []
};
let loyaltyData = null;
let referralData = null;

// Additional state variables
let consultations = {
  upcoming: [],
  past: [],
  page: 1,
  totalPages: 1,
  filter: 'all',
  search: ''
};

let experts = {
  data: [],
  page: 1,
  totalPages: 1,
  filter: {
    category: '',
    rating: 0,
    availability: 'any'
  },
  search: '',
  sort: 'recommended'
};

/**
 * Initialize the dashboard
 */
const initDashboard = async () => {
  // Check if user is logged in
  if (!isLoggedIn()) {
    window.location.href = 'login.html?redirect=client-dashboard.html';
    return;
  }

  // Get user data
  userProfile = getCurrentUser();

  // Show loading spinner
  showLoadingSpinner();

  try {
    // Update welcome message with user's name
    if (userNameElement) {
      userNameElement.textContent = userProfile.username || 'Client';
    }

    // Update last login date
    if (lastLoginElement && userProfile.lastLogin) {
      lastLoginElement.textContent = formatDate(userProfile.lastLogin);
    }

    // Fetch overview data (recent orders, chats, loyalty, saved items)
    await fetchOverviewData();

    // Initialize event listeners
    initializeEventListeners();
    initializeConsultations(); // Initialize consultations

  } catch (error) {
    console.error('Error initializing dashboard:', error);
    showToast('Error loading dashboard data', 'error');
  } finally {
    // Hide loading spinner
    hideLoadingSpinner();
  }
};

/**
 * Fetch overview data for the dashboard (recent orders, chats, loyalty, saved items)
 */
const fetchOverviewData = async () => {
  try {
    // For demo purposes, we'll create mock data
    // In a real application, these would be API calls to the backend

    // Mock orders data
    const mockOrders = Array.from({ length: 3 }, (_, i) => ({
      _id: `order-${i+1}`,
      orderNumber: `ORD-${100 + i}`,
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
      total: 100 + i * 25,
      status: ['processing', 'shipped', 'delivered'][i],
      items: [{ name: 'Product Consultation', quantity: 1, price: 100 + i * 25 }]
    }));

    // Mock chats data
    const mockChats = Array.from({ length: 2 }, (_, i) => ({
      _id: `chat-${i+1}`,
      expertName: `Expert ${i+1}`,
      expertPicture: '/uploads/default-avatar.png',
      lastMessage: `This is a sample message ${i+1}`,
      date: new Date(Date.now() - i * 3 * 60 * 60 * 1000),
      status: 'active'
    }));

    // Mock loyalty data
    const mockLoyalty = {
      tier: 'Bronze',
      points: 150,
      availableRewards: 1,
      progress: 30, // percentage to next tier
      nextTier: 'Silver'
    };

    // Mock saved items
    const mockSavedItems = {
      products: Array.from({ length: 2 }, (_, i) => ({
        _id: `product-${i+1}`,
        name: `Saved Product ${i+1}`,
        image: '/uploads/default-avatar.png',
        price: 100 + i * 15
      })),
      experts: Array.from({ length: 1 }, (_, i) => ({
        _id: `expert-${i+1}`,
        name: `Saved Expert ${i+1}`,
        image: '/uploads/default-avatar.png',
        specialty: 'Product Expert'
      })),
      bundles: []
    };

    // Update stats
    if (statsElements.orderCount) {
      statsElements.orderCount.textContent = mockOrders.length;
    }
    if (statsElements.loyaltyPoints) {
      statsElements.loyaltyPoints.textContent = mockLoyalty.points;
    }
    if (statsElements.chatCount) {
      statsElements.chatCount.textContent = mockChats.length;
    }

    // Update recent orders
    updateRecentOrders(mockOrders);

    // Update recent chats
    updateRecentChats(mockChats);

    // Update loyalty info
    updateLoyaltyInfo(mockLoyalty);

    // Update saved items
    updateSavedItemsPreview(mockSavedItems);

    // Store mock data in state for later use
    orders.data = mockOrders;
    chats.data = mockChats;
    loyaltyData = mockLoyalty;
    savedItems = mockSavedItems;

  } catch (error) {
    console.error('Error fetching overview data:', error);
    showToast('Error loading overview data', 'error');
  }
};

/**
 * Load consultations from the server
 */
const loadConsultations = async () => {
  try {
    const token = getToken();
    if (!token) return;

    const response = await fetch(`${API.CONSULTATIONS}?userId=${userProfile._id}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) throw new Error('Failed to fetch consultations');

    const data = await response.json();

    // Separate upcoming and past consultations
    const now = new Date();
    consultations.upcoming = data.filter(c => new Date(c.scheduledAt) > now);
    consultations.past = data.filter(c => new Date(c.scheduledAt) <= now);

    // Update UI
    updateConsultationCount();
    renderUpcomingConsultations();
    renderUpcomingConsultationsPreview();

    // Update past consultations if that tab is visible
    if (document.getElementById('past-consultations-content').classList.contains('active')) {
      renderPastConsultations();
    }
  } catch (error) {
    console.error('Error loading consultations:', error);
    showToast('Failed to load consultations. Please try again.', 'error');
  }
};

/**
 * Update consultation count in stats
 */
const updateConsultationCount = () => {
  const consultationCountElement = document.querySelector('.consultation-count');
  if (consultationCountElement) {
    consultationCountElement.textContent = consultations.upcoming.length;
  }
};

/**
 * Render upcoming consultations in the consultations tab
 */
const renderUpcomingConsultations = () => {
  const consultationsList = document.querySelector('.consultations-list');
  if (!consultationsList) return;

  consultationsList.innerHTML = '';

  const emptyState = consultationsList.querySelector('.empty-state') ||
                    consultationsList.closest('.section-tab-content').querySelector('.empty-state');

  if (consultations.upcoming.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Sort by date (closest first)
  const sortedConsultations = [...consultations.upcoming]
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));

  sortedConsultations.forEach(consultation => {
    const consultationCard = createConsultationCard(consultation);
    consultationsList.appendChild(consultationCard);
  });
};

/**
 * Render upcoming consultations preview in overview section
 */
const renderUpcomingConsultationsPreview = () => {
  const previewList = document.querySelector('.upcoming-consultations-list');
  if (!previewList) return;

  previewList.innerHTML = '';

  const emptyState = previewList.querySelector('.empty-state');

  if (consultations.upcoming.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Get the next 3 consultations
  const nextConsultations = [...consultations.upcoming]
    .sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt))
    .slice(0, 3);

  nextConsultations.forEach(consultation => {
    const consultationCard = createConsultationCard(consultation, true);
    previewList.appendChild(consultationCard);
  });
};

/**
 * Render past consultations
 */
const renderPastConsultations = () => {
  const pastConsultationsList = document.querySelector('.past-consultations-list');
  if (!pastConsultationsList) return;

  pastConsultationsList.innerHTML = '';

  const emptyState = pastConsultationsList.querySelector('.empty-state') ||
                      pastConsultationsList.closest('.section-tab-content').querySelector('.empty-state');

  // Filter by period if needed
  let filteredConsultations = [...consultations.past];
  const periodFilter = consultationPeriodSelect ? consultationPeriodSelect.value : 'all';

  if (periodFilter !== 'all') {
    const daysAgo = parseInt(periodFilter);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);

    filteredConsultations = filteredConsultations.filter(c =>
      new Date(c.scheduledAt) >= cutoffDate
    );
  }

  // Filter by search term if provided
  const searchTerm = (pastConsultationsSearchInput ? pastConsultationsSearchInput.value : '').toLowerCase();
  if (searchTerm) {
    filteredConsultations = filteredConsultations.filter(c =>
      c.expert.name.toLowerCase().includes(searchTerm) ||
      c.expert.category.toLowerCase().includes(searchTerm) ||
      c.title.toLowerCase().includes(searchTerm)
    );
  }

  if (filteredConsultations.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');

  // Sort by date (newest first)
  const sortedConsultations = filteredConsultations
    .sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

  sortedConsultations.forEach(consultation => {
    const consultationCard = createPastConsultationCard(consultation);
    pastConsultationsList.appendChild(consultationCard);
  });
};

/**
 * Create a consultation card element
 * @param {Object} consultation - The consultation object
 * @param {boolean} isPreview - Whether this is for the preview section
 * @returns {HTMLElement} The consultation card element
 */
const createConsultationCard = (consultation, isPreview = false) => {
  const card = document.createElement('div');
  card.className = 'consultation-card';
  card.dataset.id = consultation._id;

  const scheduledDate = new Date(consultation.scheduledAt);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Calculate duration in minutes
  const endTime = new Date(scheduledDate.getTime() + (consultation.durationMinutes * 60 * 1000));
  const formattedEndTime = endTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Simplified card for preview section
  if (isPreview) {
    card.innerHTML = `
      <div class="consultation-expert">
        <div class="expert-avatar">
          <img src="${consultation.expert.profileImage || 'uploads/default-avatar.png'}" alt="${consultation.expert.name}">
        </div>
        <div class="expert-info">
          <h4>${consultation.expert.name}</h4>
          <div class="expert-category">${consultation.expert.category}</div>
        </div>
      </div>
      <div class="consultation-details">
        <div class="consultation-detail">
          <i class="fas fa-calendar"></i>
          <span>${formattedDate}</span>
        </div>
        <div class="consultation-detail">
          <i class="fas fa-clock"></i>
          <span>${formattedTime} - ${formattedEndTime}</span>
        </div>
      </div>
      <div class="consultation-actions-col">
        <div class="consultation-status status-${consultation.status.toLowerCase()}">${consultation.status}</div>
        <button class="primary-button view-consultation-btn">View Details</button>
      </div>
    `;
  } else {
    card.innerHTML = `
      <div class="consultation-expert">
        <div class="expert-avatar">
          <img src="${consultation.expert.profileImage || 'uploads/default-avatar.png'}" alt="${consultation.expert.name}">
        </div>
        <div class="expert-info">
          <h4>${consultation.expert.name}</h4>
          <div class="expert-rating">
            <div class="stars">
              ${generateStars(consultation.expert.rating)}
            </div>
            <span class="rating-count">${consultation.expert.rating.toFixed(1)} (${consultation.expert.reviewCount})</span>
          </div>
          <div class="expert-category">${consultation.expert.category}</div>
        </div>
      </div>
      <div class="consultation-details">
        <div class="consultation-detail">
          <i class="fas fa-calendar"></i>
          <span>${formattedDate}</span>
        </div>
        <div class="consultation-detail">
          <i class="fas fa-clock"></i>
          <span>${formattedTime} - ${formattedEndTime}</span>
        </div>
        <div class="consultation-detail">
          <i class="fas ${consultation.type === 'Video' ? 'fa-video' : 'fa-phone'}"></i>
          <span>${consultation.type} Consultation</span>
        </div>
        <div class="consultation-detail">
          <i class="fas fa-tag"></i>
          <span>${formatCurrency(consultation.price)}</span>
        </div>
      </div>
      <div class="consultation-actions-col">
        <div class="consultation-status status-${consultation.status.toLowerCase()}">${consultation.status}</div>
        <button class="primary-button view-consultation-btn">View Details</button>
        <button class="secondary-button message-expert-btn"><i class="fas fa-comment"></i> Message</button>
      </div>
    `;
  }

  // Add event listeners
  const viewBtn = card.querySelector('.view-consultation-btn');
  if (viewBtn) {
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openConsultationDetails(consultation);
    });
  }

  const messageBtn = card.querySelector('.message-expert-btn');
  if (messageBtn) {
    messageBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      // Navigate to chat with this expert
      window.location.href = `chat.html?expertId=${consultation.expert._id}`;
    });
  }

  // Make the entire card clickable
  card.addEventListener('click', () => {
    openConsultationDetails(consultation);
  });

  return card;
};

/**
 * Create a past consultation card
 * @param {Object} consultation - The consultation object
 * @returns {HTMLElement} The past consultation card element
 */
const createPastConsultationCard = (consultation) => {
  const card = document.createElement('div');
  card.className = 'past-consultation-card';
  card.dataset.id = consultation._id;

  const scheduledDate = new Date(consultation.scheduledAt);
  const formattedDate = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const formattedTime = scheduledDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });

  // Check if feedback has been given
  const hasFeedback = consultation.hasFeedback || false;

  card.innerHTML = `
    <div class="consultation-expert">
      <div class="expert-avatar">
        <img src="${consultation.expert.profileImage || 'uploads/default-avatar.png'}" alt="${consultation.expert.name}">
      </div>
      <div class="expert-info">
        <h4>${consultation.expert.name}</h4>
        <div class="expert-category">${consultation.expert.category}</div>
      </div>
    </div>
    <div class="consultation-details">
      <div class="consultation-detail">
        <i class="fas fa-calendar"></i>
        <span>${formattedDate}</span>
      </div>
      <div class="consultation-detail">
        <i class="fas fa-clock"></i>
        <span>${formattedTime}</span>
      </div>
      <div class="consultation-detail">
        <i class="fas ${consultation.type === 'Video' ? 'fa-video' : 'fa-phone'}"></i>
        <span>${consultation.type} Consultation</span>
      </div>
    </div>
    <div class="past-consultation-actions">
      <button class="secondary-button view-consultation-details-btn">View Details</button>
      ${hasFeedback ?
        `<button class="secondary-button view-feedback-btn">View Your Feedback</button>` :
        `<button class="primary-button give-feedback-btn">Leave Feedback</button>`
      }
    </div>
  `;

  // Add event listeners
  const viewDetailsBtn = card.querySelector('.view-consultation-details-btn');
  if (viewDetailsBtn) {
    viewDetailsBtn.addEventListener('click', () => {
      openConsultationDetails(consultation);
    });
  }

  const giveFeedbackBtn = card.querySelector('.give-feedback-btn');
  if (giveFeedbackBtn) {
    giveFeedbackBtn.addEventListener('click', () => {
      openFeedbackModal(consultation);
    });
  }

  const viewFeedbackBtn = card.querySelector('.view-feedback-btn');
  if (viewFeedbackBtn) {
    viewFeedbackBtn.addEventListener('click', () => {
      // TODO: Implement view feedback functionality
      showToast('Feedback viewing will be available soon', 'info');
    });
  }

  return card;
};

/**
 * Open the consultation details modal
 * @param {Object} consultation - The consultation object
 */
const openConsultationDetails = (consultation) => {
  const consultationDetailsModal = document.getElementById('consultation-details-modal');
  if (!consultationDetailsModal) return;

  // Fill in consultation details
  consultationExpertImg.src = consultation.expert.profileImage || 'uploads/default-avatar.png';
  consultationExpertName.textContent = consultation.expert.name;
  consultationExpertRating.textContent = `${consultation.expert.rating.toFixed(1)} (${consultation.expert.reviewCount} reviews)`;
  consultationExpertCategory.textContent = consultation.expert.category;

  const scheduledDate = new Date(consultation.scheduledAt);
  consultationDate.textContent = scheduledDate.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const endTime = new Date(scheduledDate.getTime() + (consultation.durationMinutes * 60 * 1000));
  consultationTime.textContent = `${scheduledDate.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })} - ${endTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })}`;

  consultationType.textContent = `${consultation.type} Consultation`;
  consultationPrice.textContent = formatCurrency(consultation.price);
  consultationStatus.textContent = consultation.status;
  consultationStatus.className = `info-value status-${consultation.status.toLowerCase()}`;
  consultationDescription.textContent = consultation.description || 'No description provided.';

  // Set countdown or join now button
  const now = new Date();
  const timeDiff = scheduledDate - now;

  if (timeDiff > 0) {
    // Consultation is in the future
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));

    let countdownText = 'Starts in: ';
    if (days > 0) countdownText += `${days} day${days !== 1 ? 's' : ''}, `;
    if (hours > 0 || days > 0) countdownText += `${hours} hour${hours !== 1 ? 's' : ''}, `;
    countdownText += `${minutes} minute${minutes !== 1 ? 's' : ''}`;

    consultationCountdown.textContent = countdownText;

    // Show/hide buttons
    joinConsultationBtn.classList.add('hidden');

    // Only show reschedule/cancel if it's confirmed and more than 24 hours away
    if (consultation.status === 'Confirmed' && timeDiff > (24 * 60 * 60 * 1000)) {
      rescheduleConsultationBtn.classList.remove('hidden');
      cancelConsultationBtn.classList.remove('hidden');
    } else {
      rescheduleConsultationBtn.classList.add('hidden');
      cancelConsultationBtn.classList.add('hidden');
    }

    // Show message button
    messageExpertBtn.classList.remove('hidden');
  } else if (timeDiff > -1 * (consultation.durationMinutes * 60 * 1000)) {
    // Consultation is happening now
    consultationCountdown.textContent = 'In Progress';

    // Show join button, hide reschedule/cancel
    joinConsultationBtn.classList.remove('hidden');
    rescheduleConsultationBtn.classList.add('hidden');
    cancelConsultationBtn.classList.add('hidden');

    // Show message button
    messageExpertBtn.classList.remove('hidden');
  } else {
    // Consultation is in the past
    consultationCountdown.textContent = 'Completed';

    // Hide all action buttons
    joinConsultationBtn.classList.add('hidden');
    rescheduleConsultationBtn.classList.add('hidden');
    cancelConsultationBtn.classList.add('hidden');

    // Show message button
    messageExpertBtn.classList.remove('hidden');
  }

  // Attach event listeners to buttons
  rescheduleConsultationBtn.onclick = () => {
    // TODO: Implement reschedule functionality
    showToast('Rescheduling will be available soon', 'info');
    closeModal(consultationDetailsModal);
  };

  cancelConsultationBtn.onclick = () => {
    if (confirm('Are you sure you want to cancel this consultation? This action cannot be undone.')) {
      // TODO: Implement cancel functionality
      showToast('Cancellation will be available soon', 'info');
      closeModal(consultationDetailsModal);
    }
  };

  joinConsultationBtn.onclick = () => {
    window.location.href = consultation.joinUrl || `video-call.html?consultationId=${consultation._id}`;
  };

  messageExpertBtn.onclick = () => {
    window.location.href = `chat.html?expertId=${consultation.expert._id}`;
  };

  // Show modal
  consultationDetailsModal.classList.add('active');
};

/**
 * Open the feedback modal for a consultation
 * @param {Object} consultation - The consultation object
 */
const openFeedbackModal = (consultation) => {
  const feedbackModal = document.getElementById('feedback-modal');
  if (!feedbackModal) return;

  // Fill in expert details
  feedbackExpertImg.src = consultation.expert.profileImage || 'uploads/default-avatar.png';
  feedbackExpertName.textContent = consultation.expert.name;
  feedbackExpertCategory.textContent = consultation.expert.category;

  // Reset rating
  ratingValue.value = '0';
  const stars = ratingInput.querySelectorAll('i');
  stars.forEach(star => {
    star.className = 'far fa-star';
    star.classList.remove('active');
  });

  // Reset comment
  feedbackComment.value = '';

  // Reset tags
  feedbackCategories.forEach(checkbox => {
    checkbox.checked = false;
  });

  // Disable submit button
  submitFeedbackBtn.disabled = true;

  // Add star rating functionality
  stars.forEach(star => {
    star.addEventListener('click', function() {
      const value = this.getAttribute('data-rating');
      ratingValue.value = value;

      // Update star display
      stars.forEach(s => {
        const starValue = s.getAttribute('data-rating');
        if (starValue <= value) {
          s.className = 'fas fa-star active';
        } else {
          s.className = 'far fa-star';
        }
      });

      // Enable submit button if rating is given
      submitFeedbackBtn.disabled = value === '0';
    });
  });

  // Handle submit feedback
  submitFeedbackBtn.onclick = async () => {
    const rating = parseInt(ratingValue.value);
    const comment = feedbackComment.value.trim();
    const categories = Array.from(feedbackCategories)
      .filter(cb => cb.checked)
      .map(cb => cb.value);

    // Validate
    if (rating === 0) {
      showToast('Please provide a rating', 'error');
      return;
    }

    // Prepare feedback data
    const feedbackData = {
      consultationId: consultation._id,
      expertId: consultation.expert._id,
      rating,
      comment,
      categories
    };

    try {
      const token = getToken();
      if (!token) return;

      const response = await fetch(API.EXPERT_FEEDBACK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) throw new Error('Failed to submit feedback');

      showToast('Feedback submitted successfully', 'success');

      // Update consultation to show it has feedback
      consultation.hasFeedback = true;

      // Refresh past consultations list
      renderPastConsultations();

      // Close modal
      closeModal(feedbackModal);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      showToast('Failed to submit feedback. Please try again.', 'error');
    }
  };

  // Handle skip feedback
  skipFeedbackBtn.onclick = () => {
    closeModal(feedbackModal);
  };

  // Show modal
  feedbackModal.classList.add('active');
};

/**
 * Generate star rating HTML
 * @param {number} rating - The rating value
 * @returns {string} The star rating HTML
 */
const generateStars = (rating) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  let starsHtml = '';

  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += '<i class="fas fa-star"></i>';
  }

  // Add half star if needed
  if (hasHalfStar) {
    starsHtml += '<i class="fas fa-star-half-alt"></i>';
  }

  // Add empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += '<i class="far fa-star"></i>';
  }

  return starsHtml;
};

// Add event listeners for consultation features
document.addEventListener('click', (event) => {
  // Handle section tab clicks in consultations section
  if (event.target.classList.contains('section-tab')) {
    const tabButtons = event.target.closest('.section-tabs').querySelectorAll('.section-tab');
    tabButtons.forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');

    const tabId = event.target.getAttribute('data-tab');
    const tabContents = event.target.closest('.dashboard-section').querySelectorAll('.section-tab-content');

    tabContents.forEach(content => {
      content.classList.remove('active');
    });

    document.getElementById(`${tabId}-content`).classList.add('active');

    // Load specific tab content if needed
    if (tabId === 'past-consultations') {
      renderPastConsultations();
    } else if (tabId === 'find-experts') {
      // TODO: Load experts data
      // loadExperts();
    }
  }

  // Close modals when clicking outside
  if (event.target.classList.contains('modal')) {
    closeModal(event.target);
  }
});

// Close modal function
function closeModal(modal) {
  modal.classList.remove('active');
}

// Initialize consultation filters
if (consultationPeriodSelect) {
  consultationPeriodSelect.addEventListener('change', renderPastConsultations);
}

if (pastConsultationsSearchInput) {
  pastConsultationsSearchInput.addEventListener('input', debounce(renderPastConsultations, 300));
}

// Add to the initialized function
const initializeConsultations = () => {
  if (userProfile) {
    loadConsultations();
  }
};

// Update the initialization logic to include consultations
document.addEventListener('DOMContentLoaded', async () => {
  // ... existing initialization code ...

  // Add consultations initialization after userProfile is loaded
  if (userProfile) {
    initializeConsultations();
    // ... existing initializations ...
  }
});

// Initialize dashboard on page load
document.addEventListener('DOMContentLoaded', initDashboard);
