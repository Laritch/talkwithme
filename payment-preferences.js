/**
 * Payment Preferences
 *
 * Handles user payment preferences, saved payment methods,
 * and payment processor settings
 */

document.addEventListener('DOMContentLoaded', function() {
  // Check if user is logged in
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (!token) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname);
    return;
  }

  // Update auth UI
  if (typeof updateAuthUI === 'function') {
    updateAuthUI();
  }

  // Initialize components
  initializeModal();
  initializeTabSwitching();
  loadPaymentMethods();
  loadProcessorPreferences();
  setupEventListeners();
});

/**
 * Initialize the payment method modal
 */
function initializeModal() {
  const modal = document.getElementById('payment-method-modal');
  const openModalBtn = document.getElementById('add-payment-method');
  const closeModalButtons = document.querySelectorAll('.modal-close');

  if (openModalBtn) {
    openModalBtn.addEventListener('click', function() {
      modal.style.display = 'flex';
    });
  }

  closeModalButtons.forEach(button => {
    button.addEventListener('click', function() {
      modal.style.display = 'none';
    });
  });

  // Close modal when clicking outside the content
  window.addEventListener('click', function(event) {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

/**
 * Initialize tab switching in the payment method modal
 */
function initializeTabSwitching() {
  const tabButtons = document.querySelectorAll('.tab-btn');

  tabButtons.forEach(button => {
    button.addEventListener('click', function() {
      // Remove active class from all tabs
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
      });

      // Hide all tab panes
      document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
      });

      // Set clicked tab as active
      this.classList.add('active');

      // Show corresponding tab pane
      const tabId = this.getAttribute('data-tab');
      document.getElementById(tabId).classList.add('active');
    });
  });
}

/**
 * Load saved payment methods from API
 */
async function loadPaymentMethods() {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await fetch('/api/payment-methods', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load payment methods');
    }

    const data = await response.json();

    if (data.success) {
      displayPaymentMethods(data.paymentMethods);
    } else {
      throw new Error(data.message || 'Failed to load payment methods');
    }
  } catch (error) {
    console.error('Error loading payment methods:', error);

    // For demo purposes, display mock data
    displayMockPaymentMethods();
  }
}

/**
 * Display mock payment methods for demonstration
 */
function displayMockPaymentMethods() {
  const mockMethods = [
    {
      id: 'pm_123456',
      type: 'card',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2025,
      isDefault: true
    },
    {
      id: 'pm_234567',
      type: 'card',
      brand: 'mastercard',
      last4: '5555',
      expMonth: 6,
      expYear: 2024,
      isDefault: false
    }
  ];

  displayPaymentMethods(mockMethods);
}

/**
 * Display payment methods in the UI
 * @param {Array} paymentMethods - List of payment methods
 */
function displayPaymentMethods(paymentMethods) {
  const container = document.getElementById('payment-methods-list');
  const emptyState = document.getElementById('no-payment-methods');

  if (!paymentMethods || paymentMethods.length === 0) {
    if (emptyState) {
      emptyState.style.display = 'block';
    }
    return;
  }

  // Hide empty state
  if (emptyState) {
    emptyState.style.display = 'none';
  }

  // Build payment methods HTML
  let html = '<div class="saved-payment-methods">';

  paymentMethods.forEach(method => {
    let icon = 'fa-credit-card';
    let brandClass = '';

    // Set icon based on card brand
    if (method.type === 'card') {
      if (method.brand === 'visa') {
        icon = 'fa-cc-visa';
        brandClass = 'visa';
      } else if (method.brand === 'mastercard') {
        icon = 'fa-cc-mastercard';
        brandClass = 'mastercard';
      } else if (method.brand === 'amex') {
        icon = 'fa-cc-amex';
        brandClass = 'amex';
      } else if (method.brand === 'discover') {
        icon = 'fa-cc-discover';
        brandClass = 'discover';
      }
    } else if (method.type === 'bank_account') {
      icon = 'fa-university';
    } else if (method.type === 'mpesa') {
      icon = 'fa-mobile-alt';
    }

    html += `
      <div class="payment-method-card ${method.isDefault ? 'default' : ''}" data-id="${method.id}">
        <div class="payment-method-icon ${brandClass}">
          <i class="fab ${icon}"></i>
        </div>
        <div class="payment-method-details">
          <div class="payment-method-info">
            ${method.type === 'card' ? `
              <h3>${method.brand.charAt(0).toUpperCase() + method.brand.slice(1)} •••• ${method.last4}</h3>
              <p>Expires ${method.expMonth}/${method.expYear}</p>
            ` : method.type === 'bank_account' ? `
              <h3>Bank Account</h3>
              <p>••••${method.last4}</p>
            ` : method.type === 'mpesa' ? `
              <h3>M-Pesa</h3>
              <p>${method.phoneNumber}</p>
            ` : `
              <h3>Payment Method</h3>
              <p>${method.type}</p>
            `}
            ${method.isDefault ? '<span class="default-badge">Default</span>' : ''}
          </div>
        </div>
        <div class="payment-method-actions">
          <button class="btn btn-outline btn-sm edit-payment-method">Edit</button>
          <button class="btn btn-outline btn-sm btn-danger remove-payment-method">Remove</button>
          ${!method.isDefault ? '<button class="btn btn-outline btn-sm set-default-method">Set as Default</button>' : ''}
        </div>
      </div>
    `;
  });

  html += '</div>';
  container.innerHTML = html;

  // Add event listeners for payment method actions
  setupPaymentMethodActions();
}

/**
 * Set up event listeners for payment method actions
 */
function setupPaymentMethodActions() {
  // Edit payment method
  document.querySelectorAll('.edit-payment-method').forEach(button => {
    button.addEventListener('click', function() {
      const methodId = this.closest('.payment-method-card').getAttribute('data-id');
      console.log('Edit payment method:', methodId);
      // Implement edit functionality
    });
  });

  // Remove payment method
  document.querySelectorAll('.remove-payment-method').forEach(button => {
    button.addEventListener('click', function() {
      const methodId = this.closest('.payment-method-card').getAttribute('data-id');
      console.log('Remove payment method:', methodId);
      removePaymentMethod(methodId);
    });
  });

  // Set as default
  document.querySelectorAll('.set-default-method').forEach(button => {
    button.addEventListener('click', function() {
      const methodId = this.closest('.payment-method-card').getAttribute('data-id');
      console.log('Set as default:', methodId);
      setDefaultPaymentMethod(methodId);
    });
  });
}

/**
 * Remove a payment method
 * @param {string} methodId - Payment method ID
 */
async function removePaymentMethod(methodId) {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await fetch(`/api/payment-methods/${methodId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to remove payment method');
    }

    const data = await response.json();

    if (data.success) {
      // Reload payment methods
      loadPaymentMethods();
      showToast('Payment method removed successfully', 'success');
    } else {
      throw new Error(data.message || 'Failed to remove payment method');
    }
  } catch (error) {
    console.error('Error removing payment method:', error);
    showToast('Failed to remove payment method. Please try again.', 'error');

    // For demo purposes, remove from UI
    const methodCard = document.querySelector(`.payment-method-card[data-id="${methodId}"]`);
    if (methodCard) {
      methodCard.remove();

      // If no methods left, show empty state
      const methodsList = document.querySelectorAll('.payment-method-card');
      if (methodsList.length === 0) {
        const emptyState = document.getElementById('no-payment-methods');
        if (emptyState) {
          emptyState.style.display = 'block';
        }
      }
    }
  }
}

/**
 * Set a payment method as default
 * @param {string} methodId - Payment method ID
 */
async function setDefaultPaymentMethod(methodId) {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await fetch(`/api/payment-methods/${methodId}/default`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error('Failed to set default payment method');
    }

    const data = await response.json();

    if (data.success) {
      // Reload payment methods
      loadPaymentMethods();
      showToast('Default payment method updated', 'success');
    } else {
      throw new Error(data.message || 'Failed to set default payment method');
    }
  } catch (error) {
    console.error('Error setting default payment method:', error);
    showToast('Failed to update default payment method. Please try again.', 'error');

    // For demo purposes, update UI directly
    document.querySelectorAll('.payment-method-card').forEach(card => {
      card.classList.remove('default');
      card.querySelector('.default-badge')?.remove();

      const setDefaultButton = document.createElement('button');
      setDefaultButton.className = 'btn btn-outline btn-sm set-default-method';
      setDefaultButton.textContent = 'Set as Default';
      setDefaultButton.addEventListener('click', function() {
        setDefaultPaymentMethod(card.getAttribute('data-id'));
      });

      const actionsDiv = card.querySelector('.payment-method-actions');
      if (actionsDiv && !actionsDiv.querySelector('.set-default-method')) {
        actionsDiv.appendChild(setDefaultButton);
      }
    });

    const selectedCard = document.querySelector(`.payment-method-card[data-id="${methodId}"]`);
    if (selectedCard) {
      selectedCard.classList.add('default');

      const infoDiv = selectedCard.querySelector('.payment-method-info');
      if (infoDiv) {
        const defaultBadge = document.createElement('span');
        defaultBadge.className = 'default-badge';
        defaultBadge.textContent = 'Default';
        infoDiv.appendChild(defaultBadge);
      }

      selectedCard.querySelector('.set-default-method')?.remove();
    }
  }
}

/**
 * Load processor preferences from API or local storage
 */
function loadProcessorPreferences() {
  try {
    // Get selected region
    const regionSelect = document.getElementById('region-select');
    const region = regionSelect ? regionSelect.value : 'global';

    // Try to load from localStorage first
    const savedPreferences = localStorage.getItem(`processor_preferences_${region}`);
    if (savedPreferences) {
      const preferences = JSON.parse(savedPreferences);
      updateProcessorPreferences(preferences);
      return;
    }

    // If not in localStorage, get regional defaults
    const defaultPreferences = getDefaultProcessorPreferences(region);
    updateProcessorPreferences(defaultPreferences);

  } catch (error) {
    console.error('Error loading processor preferences:', error);
  }
}

/**
 * Get default processor preferences based on region
 * @param {string} region - Region code
 * @returns {Object} - Default preferences
 */
function getDefaultProcessorPreferences(region) {
  const defaults = {
    global: {
      stripe: true,
      square: false,
      adyen: false,
      mpesa: false,
      razorpay: false
    },
    us: {
      stripe: true,
      square: true,
      adyen: false,
      mpesa: false,
      razorpay: false
    },
    eu: {
      stripe: true,
      square: false,
      adyen: true,
      mpesa: false,
      razorpay: false
    },
    africa: {
      stripe: false,
      square: false,
      adyen: false,
      mpesa: true,
      razorpay: false
    },
    asia: {
      stripe: false,
      square: false,
      adyen: true,
      mpesa: false,
      razorpay: true
    }
  };

  return defaults[region] || defaults.global;
}

/**
 * Update processor preferences in the UI
 * @param {Object} preferences - Processor preferences
 */
function updateProcessorPreferences(preferences) {
  // Update toggle switches
  Object.entries(preferences).forEach(([processor, isPreferred]) => {
    const toggle = document.querySelector(`.processor-preference[data-processor="${processor}"]`);
    if (toggle) {
      toggle.checked = isPreferred;
    }

    // Update availability based on region
    const region = document.getElementById('region-select').value;
    updateProcessorAvailability(processor, region);
  });
}

/**
 * Update processor availability based on region
 * @param {string} processor - Processor name
 * @param {string} region - Region code
 */
function updateProcessorAvailability(processor, region) {
  const processorAvailability = {
    stripe: ['global', 'us', 'eu', 'asia'],
    square: ['global', 'us'],
    adyen: ['global', 'eu', 'asia'],
    mpesa: ['global', 'africa'],
    razorpay: ['global', 'asia']
  };

  const available = processorAvailability[processor]?.includes(region);
  const processorItem = document.querySelector(`.processor-item[data-processor="${processor}"]`);

  if (processorItem) {
    const availabilityBadge = processorItem.querySelector('.availability-badge');
    const toggleInput = processorItem.querySelector('.processor-preference');

    if (availabilityBadge) {
      availabilityBadge.classList.remove('available', 'limited', 'unavailable');

      if (available) {
        if (processor === 'mpesa' && region !== 'africa') {
          availabilityBadge.classList.add('limited');
          availabilityBadge.textContent = 'Available in select African countries';
        } else if (processor === 'razorpay' && region !== 'asia') {
          availabilityBadge.classList.add('limited');
          availabilityBadge.textContent = 'Available in India';
        } else {
          availabilityBadge.classList.add('available');
          availabilityBadge.textContent = 'Available in your region';
        }
      } else {
        availabilityBadge.classList.add('unavailable');
        availabilityBadge.textContent = 'Not available in your region';
      }
    }

    // Disable toggle if not available
    if (toggleInput) {
      toggleInput.disabled = !available;
      if (!available) {
        toggleInput.checked = false;
      }
    }
  }
}

/**
 * Save processor preferences
 */
async function saveProcessorPreferences() {
  try {
    // Get selected region
    const regionSelect = document.getElementById('region-select');
    const region = regionSelect ? regionSelect.value : 'global';

    // Get preferences from UI
    const preferences = {};
    document.querySelectorAll('.processor-preference').forEach(toggle => {
      const processor = toggle.getAttribute('data-processor');
      preferences[processor] = toggle.checked;
    });

    // Save to API
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await fetch('/api/payment-preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        region,
        processors: preferences
      })
    });

    if (!response.ok) {
      throw new Error('Failed to save preferences');
    }

    const data = await response.json();

    if (data.success) {
      // Save to localStorage for faster loading
      localStorage.setItem(`processor_preferences_${region}`, JSON.stringify(preferences));
      showToast('Preferences saved successfully', 'success');
    } else {
      throw new Error(data.message || 'Failed to save preferences');
    }
  } catch (error) {
    console.error('Error saving preferences:', error);
    showToast('Failed to save preferences. Please try again.', 'error');

    // For demo, just save to localStorage
    const region = document.getElementById('region-select').value || 'global';
    const preferences = {};
    document.querySelectorAll('.processor-preference').forEach(toggle => {
      const processor = toggle.getAttribute('data-processor');
      preferences[processor] = toggle.checked;
    });

    localStorage.setItem(`processor_preferences_${region}`, JSON.stringify(preferences));
    showToast('Preferences saved to browser storage', 'success');
  }
}

/**
 * Save all settings
 */
function saveAllSettings() {
  // Get default currency
  const defaultCurrency = document.getElementById('default-currency').value;
  // Get save payment info setting
  const savePaymentInfo = document.getElementById('save-payment-info').checked;
  // Get auto currency setting
  const autoCurrency = document.getElementById('auto-currency').checked;

  // Save to localStorage
  localStorage.setItem('default_currency', defaultCurrency);
  localStorage.setItem('save_payment_info', savePaymentInfo);
  localStorage.setItem('auto_currency', autoCurrency);

  // Save processor preferences
  saveProcessorPreferences();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Region select change
  const regionSelect = document.getElementById('region-select');
  if (regionSelect) {
    regionSelect.addEventListener('change', function() {
      loadProcessorPreferences();
    });
  }

  // Save preferences button
  const saveButton = document.getElementById('save-preferences');
  if (saveButton) {
    saveButton.addEventListener('click', function() {
      saveAllSettings();
    });
  }

  // Card form submission
  const cardForm = document.getElementById('card-form');
  if (cardForm) {
    cardForm.addEventListener('submit', function(e) {
      e.preventDefault();
      addCardPaymentMethod();
    });
  }

  // Bank form submission
  const bankForm = document.getElementById('bank-form');
  if (bankForm) {
    bankForm.addEventListener('submit', function(e) {
      e.preventDefault();
      addBankPaymentMethod();
    });
  }
}

/**
 * Add card payment method
 */
function addCardPaymentMethod() {
  const cardholderName = document.getElementById('card-name').value;
  const cardNumber = document.getElementById('card-number').value.replace(/\s/g, '');
  const cardExpiry = document.getElementById('card-expiry').value;
  const cardCvc = document.getElementById('card-cvc').value;
  const isDefault = document.getElementById('card-default').checked;

  // Validate inputs
  if (!cardholderName || !cardNumber || !cardExpiry || !cardCvc) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  // Format card expiry
  const [expMonth, expYear] = cardExpiry.split('/');

  // For demo purposes, just add to UI
  const mockMethod = {
    id: 'pm_' + Math.random().toString(36).substring(2, 10),
    type: 'card',
    brand: getCardBrand(cardNumber),
    last4: cardNumber.slice(-4),
    expMonth: parseInt(expMonth),
    expYear: parseInt('20' + expYear),
    isDefault: isDefault || document.querySelectorAll('.payment-method-card').length === 0
  };

  const methods = document.querySelectorAll('.payment-method-card');
  const mockMethods = Array.from(methods).map(card => {
    const id = card.getAttribute('data-id');
    const isDefault = card.classList.contains('default');
    const brand = card.querySelector('.payment-method-icon').classList[1];
    const last4 = card.querySelector('h3').textContent.split('••••')[1].trim();
    const expText = card.querySelector('p').textContent;
    const [expMonth, expYear] = expText.replace('Expires ', '').split('/');

    return {
      id,
      type: 'card',
      brand,
      last4,
      expMonth: parseInt(expMonth),
      expYear: parseInt(expYear),
      isDefault: isDefault && !mockMethod.isDefault ? true : false
    };
  });

  mockMethods.push(mockMethod);

  // Update UI
  displayPaymentMethods(mockMethods);

  // Close modal
  document.getElementById('payment-method-modal').style.display = 'none';

  // Clear form
  document.getElementById('card-form').reset();

  showToast('Payment method added successfully', 'success');
}

/**
 * Add bank payment method
 */
function addBankPaymentMethod() {
  const bankName = document.getElementById('bank-name').value;
  const accountHolder = document.getElementById('account-holder').value;
  const accountNumber = document.getElementById('account-number').value;
  const routingNumber = document.getElementById('routing-number').value;
  const isDefault = document.getElementById('bank-default').checked;

  // Validate inputs
  if (!bankName || !accountHolder || !accountNumber || !routingNumber) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  // For demo purposes, just add to UI
  const mockMethod = {
    id: 'ba_' + Math.random().toString(36).substring(2, 10),
    type: 'bank_account',
    bankName,
    accountHolder,
    last4: accountNumber.slice(-4),
    isDefault: isDefault || document.querySelectorAll('.payment-method-card').length === 0
  };

  const methods = document.querySelectorAll('.payment-method-card');
  let mockMethods = Array.from(methods).map(card => {
    const id = card.getAttribute('data-id');
    const isDefault = card.classList.contains('default');

    // This is simplified - in a real app, you'd have properly stored data
    return {
      id,
      type: id.startsWith('ba_') ? 'bank_account' : 'card',
      isDefault: isDefault && !mockMethod.isDefault ? true : false
    };
  });

  mockMethods.push(mockMethod);

  // Update UI
  displayPaymentMethods(mockMethods);

  // Close modal
  document.getElementById('payment-method-modal').style.display = 'none';

  // Clear form
  document.getElementById('bank-form').reset();

  showToast('Bank account added successfully', 'success');
}

/**
 * Get card brand from card number
 * @param {string} cardNumber - Card number
 * @returns {string} - Card brand
 */
function getCardBrand(cardNumber) {
  // Simplified version - in reality, use a proper validation library
  if (cardNumber.startsWith('4')) {
    return 'visa';
  } else if (cardNumber.startsWith('5')) {
    return 'mastercard';
  } else if (cardNumber.startsWith('3')) {
    return 'amex';
  } else if (cardNumber.startsWith('6')) {
    return 'discover';
  }
  return 'unknown';
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - Type of toast (success, error)
 */
function showToast(message, type = 'success') {
  // Create toast element
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
      <span>${message}</span>
    </div>
    <button class="toast-close">&times;</button>
  `;

  // Style the toast
  toast.style.position = 'fixed';
  toast.style.bottom = '1rem';
  toast.style.right = '1rem';
  toast.style.backgroundColor = type === 'success' ? '#ebf8ff' : '#fff5f5';
  toast.style.color = type === 'success' ? '#3182ce' : '#e53e3e';
  toast.style.padding = '0.75rem 1rem';
  toast.style.borderRadius = '0.375rem';
  toast.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.justifyContent = 'space-between';
  toast.style.maxWidth = '24rem';
  toast.style.zIndex = '1001';

  // Add to DOM
  document.body.appendChild(toast);

  // Close button event
  toast.querySelector('.toast-close').addEventListener('click', function() {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  });

  // Auto-hide after 3 seconds
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 3000);
}
