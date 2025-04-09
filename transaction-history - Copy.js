/**
 * Transaction History
 *
 * Handles fetching and displaying transaction history
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

  // Initialize date picker
  initDatePicker();

  // Set up event listeners
  setupEventListeners();

  // Load transactions (first page)
  loadTransactions();
});

/**
 * Initialize date range picker
 */
function initDatePicker() {
  const dateRangeInput = document.getElementById('date-range');
  if (dateRangeInput) {
    flatpickr(dateRangeInput, {
      mode: 'range',
      dateFormat: 'Y-m-d',
      altInput: true,
      altFormat: 'F j, Y',
      wrap: false,
      maxDate: 'today'
    });
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Apply filters button
  const applyFiltersBtn = document.getElementById('apply-filters');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', function() {
      loadTransactions(1);
    });
  }

  // Reset filters button
  const resetFiltersBtn = document.getElementById('reset-filters');
  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', function() {
      resetFilters();
      loadTransactions(1);
    });
  }

  // Pagination buttons
  const prevPageBtn = document.getElementById('prev-page');
  const nextPageBtn = document.getElementById('next-page');

  if (prevPageBtn) {
    prevPageBtn.addEventListener('click', function() {
      if (!this.disabled) {
        const currentPage = parseInt(document.getElementById('current-page').textContent);
        loadTransactions(currentPage - 1);
      }
    });
  }

  if (nextPageBtn) {
    nextPageBtn.addEventListener('click', function() {
      const currentPage = parseInt(document.getElementById('current-page').textContent);
      const totalPages = parseInt(document.getElementById('total-pages').textContent);

      if (currentPage < totalPages) {
        loadTransactions(currentPage + 1);
      }
    });
  }

  // Modal close buttons
  const modalCloseButtons = document.querySelectorAll('.modal-close, .modal-close-btn');
  modalCloseButtons.forEach(button => {
    button.addEventListener('click', function() {
      document.getElementById('transaction-modal').style.display = 'none';
    });
  });

  // Download receipt button
  const downloadReceiptBtn = document.getElementById('download-receipt');
  if (downloadReceiptBtn) {
    downloadReceiptBtn.addEventListener('click', function() {
      const transactionId = this.getAttribute('data-transaction-id');
      if (transactionId) {
        downloadReceipt(transactionId);
      }
    });
  }

  // Close modal when clicking outside
  window.addEventListener('click', function(event) {
    const modal = document.getElementById('transaction-modal');
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });

  // Add more payment method options
  const paymentMethodSelect = document.getElementById('payment-method');
  if (paymentMethodSelect) {
    // Check if we need to add the new options by seeing if they already exist
    const existingOptions = Array.from(paymentMethodSelect.options).map(opt => opt.value);

    // Add any missing payment processors
    const processors = [
      { value: 'square', label: 'Square' },
      { value: 'adyen', label: 'Adyen' },
      { value: 'razorpay', label: 'Razorpay' }
    ];

    processors.forEach(processor => {
      if (!existingOptions.includes(processor.value)) {
        const option = document.createElement('option');
        option.value = processor.value;
        option.textContent = processor.label;
        paymentMethodSelect.appendChild(option);
      }
    });
  }
}

/**
 * Reset all filters
 */
function resetFilters() {
  document.getElementById('date-range').value = '';
  document.getElementById('payment-method').value = '';
  document.getElementById('transaction-type').value = '';
  document.getElementById('transaction-status').value = '';
}

/**
 * Load transactions with filters
 * @param {number} page - Page number
 */
async function loadTransactions(page = 1) {
  try {
    // Show loading
    const transactionList = document.getElementById('transaction-list');
    transactionList.innerHTML = `
      <div class="loading-container" id="loading-transactions">
        <div class="loading-spinner"></div>
        <p>Loading your transactions...</p>
      </div>
    `;

    // Hide pagination initially
    document.getElementById('pagination').style.display = 'none';

    // Get filters
    const filters = getFilters();
    filters.page = page;
    filters.limit = 10;

    // Build query string
    const queryString = Object.entries(filters)
      .filter(([_, value]) => value !== '')
      .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
      .join('&');

    // Fetch transactions
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await fetch(`/api/transactions?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transactions');
    }

    const data = await response.json();

    // Process the response
    if (data.success) {
      displayTransactions(data.transactions);
      updatePagination(data.pagination);
    } else {
      throw new Error(data.message || 'Failed to load transactions');
    }
  } catch (error) {
    console.error('Error loading transactions:', error);
    showError('Failed to load transactions. Please try again later.');
  }
}

/**
 * Get current filter values
 * @returns {Object} - Filter values
 */
function getFilters() {
  const dateRange = document.getElementById('date-range').value;
  let startDate = '';
  let endDate = '';

  if (dateRange) {
    const dates = dateRange.split(' to ');
    startDate = dates[0];
    endDate = dates[1] || dates[0];
  }

  return {
    startDate,
    endDate,
    paymentMethod: document.getElementById('payment-method').value,
    type: document.getElementById('transaction-type').value,
    status: document.getElementById('transaction-status').value
  };
}

/**
 * Display transactions in the UI
 * @param {Array} transactions - List of transactions
 */
function displayTransactions(transactions) {
  const transactionList = document.getElementById('transaction-list');

  if (!transactions || transactions.length === 0) {
    transactionList.innerHTML = `
      <div class="no-transactions" id="no-transactions">
        <div class="empty-state">
          <i class="fas fa-receipt"></i>
          <h3>No Transactions Found</h3>
          <p>You don't have any transactions that match your filters. Try adjusting your filters or make a purchase to get started.</p>
        </div>
      </div>
    `;
    return;
  }

  // Create transaction items
  let html = '';

  transactions.forEach(transaction => {
    // Determine icon
    let icon = 'fa-shopping-bag';
    let iconClass = 'order';

    if (transaction.type === 'subscription') {
      icon = 'fa-sync-alt';
      iconClass = 'subscription';
    } else if (transaction.refunded) {
      icon = 'fa-undo';
      iconClass = 'refund';
    }

    // Format amount
    const amountClass = transaction.refunded ? 'negative' : 'positive';
    const formattedAmount = formatCurrency(transaction.amount, transaction.currency);

    // Format date
    const formattedDate = formatDate(transaction.date);

    // Payment method icon based on payment processor
    let methodIcon = getPaymentMethodIcon(transaction.paymentMethod, transaction.processor);
    let displayMethod = getPaymentMethodDisplay(transaction.paymentMethod, transaction.processor);

    html += `
      <div class="transaction-item" onclick="viewTransactionDetails('${transaction.id}')">
        <div class="transaction-icon ${iconClass}">
          <i class="fas ${icon}"></i>
        </div>
        <div class="transaction-content">
          <div class="transaction-header">
            <div class="transaction-title">${escapeHtml(transaction.description)}</div>
            <div class="transaction-amount ${amountClass}">${formattedAmount}</div>
          </div>
          <div class="transaction-details">
            <div class="transaction-info">
              <span class="transaction-date">${formattedDate}</span>
              <span class="transaction-method">
                <i class="fas ${methodIcon}"></i>
                ${displayMethod}
              </span>
            </div>
            <div class="transaction-status ${transaction.status.toLowerCase()}">
              ${transaction.refunded ? 'Refunded' : transaction.status}
            </div>
          </div>
        </div>
      </div>
    `;
  });

  transactionList.innerHTML = html;
}

/**
 * Get the appropriate icon class for a payment method
 * @param {string} method - Payment method
 * @param {string} processor - Payment processor
 * @returns {string} - Icon class
 */
function getPaymentMethodIcon(method, processor) {
  // Base method icons
  const methodIcons = {
    'card': 'fa-credit-card',
    'mpesa': 'fa-mobile-alt',
    'paypal': 'fa-paypal',
    'bank': 'fa-university',
    'square': 'fa-square',
    'adyen': 'fa-credit-card',
    'razorpay': 'fa-rupee-sign',
    'apple': 'fa-apple',
    'google': 'fa-google'
  };

  // Return the icon based on method, fallback to credit card
  return methodIcons[method] || 'fa-credit-card';
}

/**
 * Get formatted display name for payment method
 * @param {string} method - Payment method
 * @param {string} processor - Payment processor
 * @returns {string} - Display name
 */
function getPaymentMethodDisplay(method, processor) {
  // For processor-specific naming
  if (processor) {
    if (method === 'card') {
      return `${capitalizeFirstLetter(processor)} Card`;
    }

    // For digital wallets with processors
    if (method === 'apple' || method === 'google') {
      return method === 'apple' ? 'Apple Pay' : 'Google Pay';
    }

    return `${capitalizeFirstLetter(processor)} ${capitalizeFirstLetter(method)}`;
  }

  // Standard method naming
  const methodNames = {
    'card': 'Credit/Debit Card',
    'mpesa': 'M-Pesa',
    'paypal': 'PayPal',
    'bank': 'Bank Transfer',
    'apple': 'Apple Pay',
    'google': 'Google Pay',
    'square': 'Square',
    'adyen': 'Adyen',
    'razorpay': 'Razorpay'
  };

  return methodNames[method] || capitalizeFirstLetter(method);
}

/**
 * Update pagination UI
 * @param {Object} pagination - Pagination data
 */
function updatePagination(pagination) {
  const paginationContainer = document.getElementById('pagination');
  const currentPageElement = document.getElementById('current-page');
  const totalPagesElement = document.getElementById('total-pages');
  const prevPageButton = document.getElementById('prev-page');
  const nextPageButton = document.getElementById('next-page');

  // Update page numbers
  currentPageElement.textContent = pagination.page;
  totalPagesElement.textContent = pagination.totalPages;

  // Update button states
  prevPageButton.disabled = pagination.page <= 1;
  nextPageButton.disabled = pagination.page >= pagination.totalPages;

  // Show pagination if we have more than one page
  paginationContainer.style.display = pagination.totalPages > 1 ? 'flex' : 'none';
}

/**
 * View transaction details
 * @param {string} transactionId - Transaction ID
 */
async function viewTransactionDetails(transactionId) {
  try {
    // Show modal
    const modal = document.getElementById('transaction-modal');
    modal.style.display = 'flex';

    // Show loading state
    const detailsContainer = document.getElementById('transaction-details');
    detailsContainer.innerHTML = `
      <div class="loading-container" id="loading-transaction-details">
        <div class="loading-spinner"></div>
        <p>Loading transaction details...</p>
      </div>
    `;

    // Set transaction ID on the download button
    const downloadButton = document.getElementById('download-receipt');
    if (downloadButton) {
      downloadButton.setAttribute('data-transaction-id', transactionId);
    }

    // Fetch transaction details
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await fetch(`/api/transactions/${transactionId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch transaction details');
    }

    const data = await response.json();

    if (data.success) {
      displayTransactionDetails(data.transaction);
    } else {
      throw new Error(data.message || 'Failed to load transaction details');
    }
  } catch (error) {
    console.error('Error loading transaction details:', error);

    // Show error in the modal
    const detailsContainer = document.getElementById('transaction-details');
    detailsContainer.innerHTML = `
      <div class="error-message">
        <p><i class="fas fa-exclamation-circle"></i> ${error.message || 'Failed to load transaction details'}</p>
      </div>
    `;
  }
}

/**
 * Display transaction details in the modal
 * @param {Object} transaction - Transaction data
 */
function displayTransactionDetails(transaction) {
  const detailsContainer = document.getElementById('transaction-details');

  // Determine icon and background color
  let icon = 'fa-shopping-bag';
  let iconClass = 'order';

  if (transaction.type === 'subscription') {
    icon = 'fa-sync-alt';
    iconClass = 'subscription';
  } else if (transaction.refunded) {
    icon = 'fa-undo';
    iconClass = 'refund';
  }

  // Format amount and date
  const formattedAmount = formatCurrency(transaction.amount, transaction.currency);
  const formattedDate = formatDate(transaction.date);

  // Get payment method display
  const paymentMethodDisplay = getPaymentMethodDisplay(transaction.paymentMethod, transaction.processor);

  // Build HTML for transaction details
  let html = `
    <div class="transaction-detail-header">
      <div class="transaction-detail-icon ${iconClass}">
        <i class="fas ${icon}"></i>
      </div>
      <div class="transaction-detail-title">
        <h3>${escapeHtml(transaction.description)}</h3>
        <p>${formattedDate}</p>
      </div>
    </div>

    <div class="transaction-summary">
      <div class="transaction-summary-row">
        <span class="transaction-summary-label">Transaction ID</span>
        <span class="transaction-summary-value">${transaction.id}</span>
      </div>
      <div class="transaction-summary-row">
        <span class="transaction-summary-label">Status</span>
        <span class="transaction-summary-value">
          <span class="transaction-status ${transaction.status.toLowerCase()}">
            ${transaction.refunded ? 'Refunded' : transaction.status}
          </span>
        </span>
      </div>
      <div class="transaction-summary-row">
        <span class="transaction-summary-label">Payment Method</span>
        <span class="transaction-summary-value">${paymentMethodDisplay}</span>
      </div>
  `;

  // Add processor information if available
  if (transaction.processor) {
    html += `
      <div class="transaction-summary-row">
        <span class="transaction-summary-label">Payment Processor</span>
        <span class="transaction-summary-value">${capitalizeFirstLetter(transaction.processor)}</span>
      </div>
    `;
  }

  // Add total amount row
  html += `
      <div class="transaction-summary-row total">
        <span class="transaction-summary-label">Total Amount</span>
        <span class="transaction-summary-value">${formattedAmount}</span>
      </div>
    </div>
  `;

  // Add items section if available
  if (transaction.items && transaction.items.length > 0) {
    html += `
      <div class="transaction-items">
        <h4>Items</h4>
        <div class="transaction-item-list">
    `;

    transaction.items.forEach(item => {
      const itemTotal = item.price * (item.quantity || 1);

      html += `
        <div class="transaction-list-item">
          <div class="transaction-item-details">
            <div class="transaction-item-name">${escapeHtml(item.name)}</div>
            <div class="transaction-item-meta">Quantity: ${item.quantity || 1}</div>
          </div>
          <div class="transaction-item-price">${formatCurrency(itemTotal, transaction.currency)}</div>
        </div>
      `;
    });

    html += `
        </div>
      </div>
    `;
  }

  // Add loyalty points if earned
  if (transaction.loyaltyPointsEarned && transaction.loyaltyPointsEarned > 0) {
    html += `
      <div class="loyalty-points-earned">
        <i class="fas fa-award"></i>
        <div class="loyalty-points-text">
          <h4>Loyalty Points Earned</h4>
          <p>You earned ${transaction.loyaltyPointsEarned} points with this transaction!</p>
        </div>
      </div>
    `;
  }

  // Add refund details if refunded
  if (transaction.refunded && transaction.refundDetails) {
    html += `
      <div class="transaction-additional-info">
        <h4>Refund Information</h4>
        <div class="info-card">
          <div class="transaction-summary-row">
            <span class="transaction-summary-label">Refund ID</span>
            <span class="transaction-summary-value">${transaction.refundDetails.refundId || 'N/A'}</span>
          </div>
          <div class="transaction-summary-row">
            <span class="transaction-summary-label">Refund Date</span>
            <span class="transaction-summary-value">${formatDate(transaction.refundDetails.refundedAt)}</span>
          </div>
          <div class="transaction-summary-row">
            <span class="transaction-summary-label">Reason</span>
            <span class="transaction-summary-value">${transaction.refundDetails.reason || 'Not specified'}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Add processor-specific details if available
  if (transaction.processorDetails) {
    html += `
      <div class="transaction-additional-info">
        <h4>Processor Information</h4>
        <div class="info-card">
    `;

    // Add different fields based on processor
    if (transaction.processor === 'mpesa') {
      html += `
        <div class="transaction-summary-row">
          <span class="transaction-summary-label">M-Pesa Reference</span>
          <span class="transaction-summary-value">${transaction.processorDetails.mpesaReference || 'N/A'}</span>
        </div>
        <div class="transaction-summary-row">
          <span class="transaction-summary-label">Phone Number</span>
          <span class="transaction-summary-value">${transaction.processorDetails.phoneNumber || 'N/A'}</span>
        </div>
      `;
    } else if (transaction.processor === 'square') {
      html += `
        <div class="transaction-summary-row">
          <span class="transaction-summary-label">Square Order ID</span>
          <span class="transaction-summary-value">${transaction.processorDetails.orderId || 'N/A'}</span>
        </div>
      `;
    } else if (transaction.processor === 'adyen') {
      html += `
        <div class="transaction-summary-row">
          <span class="transaction-summary-label">Adyen PSP Reference</span>
          <span class="transaction-summary-value">${transaction.processorDetails.pspReference || 'N/A'}</span>
        </div>
      `;
    }

    html += `
        </div>
      </div>
    `;
  }

  // Add shipping and billing address if available (for orders)
  if (transaction.type === 'order') {
    if (transaction.shipping || transaction.billingAddress) {
      html += '<div class="transaction-additional-info"><h4>Additional Information</h4>';

      // Shipping info
      if (transaction.shipping) {
        html += `
          <div class="info-card">
            <h5>Shipping Information</h5>
            <address>
              ${transaction.shipping.name || ''}<br>
              ${transaction.shipping.address || ''}<br>
              ${transaction.shipping.city || ''}, ${transaction.shipping.state || ''} ${transaction.shipping.postalCode || ''}<br>
              ${transaction.shipping.country || ''}
            </address>
          </div>
        `;
      }

      // Billing info
      if (transaction.billingAddress) {
        html += `
          <div class="info-card">
            <h5>Billing Address</h5>
            <address>
              ${transaction.billingAddress.name || ''}<br>
              ${transaction.billingAddress.address || ''}<br>
              ${transaction.billingAddress.city || ''}, ${transaction.billingAddress.state || ''} ${transaction.billingAddress.postalCode || ''}<br>
              ${transaction.billingAddress.country || ''}
            </address>
          </div>
        `;
      }

      html += '</div>';
    }
  }

  // Set the HTML
  detailsContainer.innerHTML = html;
}

/**
 * Download receipt for a transaction
 * @param {string} transactionId - Transaction ID
 */
async function downloadReceipt(transactionId) {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    // Change button state
    const downloadButton = document.getElementById('download-receipt');
    if (downloadButton) {
      downloadButton.disabled = true;
      downloadButton.textContent = 'Generating Receipt...';
    }

    // Fetch receipt
    const response = await fetch(`/api/transactions/${transactionId}/receipt`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to generate receipt');
    }

    // Convert response to blob
    const blob = await response.blob();

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `receipt-${transactionId}.pdf`;

    // Add to DOM and trigger download
    document.body.appendChild(a);
    a.click();

    // Clean up
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    // Reset button
    if (downloadButton) {
      downloadButton.disabled = false;
      downloadButton.textContent = 'Download Receipt';
    }
  } catch (error) {
    console.error('Error downloading receipt:', error);
    showError('Failed to download receipt. Please try again later.');

    // Reset button
    const downloadButton = document.getElementById('download-receipt');
    if (downloadButton) {
      downloadButton.disabled = false;
      downloadButton.textContent = 'Download Receipt';
    }
  }
}

/**
 * Format currency amount
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @returns {string} - Formatted currency amount
 */
function formatCurrency(amount, currency = 'USD') {
  // Default to USD formatting if currency is not provided
  if (!currency) {
    currency = 'USD';
  }

  // Define some common currency formats for better localization
  const currencyFormats = {
    'KES': { locale: 'en-KE', symbol: 'KSh' },
    'INR': { locale: 'en-IN', symbol: '₹' },
    'NGN': { locale: 'en-NG', symbol: '₦' },
    'ZAR': { locale: 'en-ZA', symbol: 'R' },
    'GHS': { locale: 'en-GH', symbol: 'GH₵' }
  };

  try {
    // Use locale-specific formatting if available
    if (currencyFormats[currency]) {
      return new Intl.NumberFormat(currencyFormats[currency].locale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    }

    // Default formatting
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  } catch (error) {
    // Fallback if Intl formatter fails
    console.error('Currency formatting error:', error);
    return `${amount} ${currency}`;
  }
}

/**
 * Format date
 * @param {string} dateString - Date string
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Capitalize first letter of a string
 * @param {string} string - Input string
 * @returns {string} - String with first letter capitalized
 */
function capitalizeFirstLetter(string) {
  if (!string) return '';
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * Escape HTML to prevent XSS
 * @param {string} unsafe - Unsafe string
 * @returns {string} - Safe HTML string
 */
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = 'error-toast';
  toast.innerHTML = `
    <div class="error-toast-content">
      <i class="fas fa-exclamation-circle"></i>
      <span>${message}</span>
    </div>
    <button class="error-toast-close">&times;</button>
  `;

  // Add styles
  toast.style.position = 'fixed';
  toast.style.bottom = '1rem';
  toast.style.right = '1rem';
  toast.style.backgroundColor = 'white';
  toast.style.color = '#e53e3e';
  toast.style.padding = '0.75rem 1rem';
  toast.style.borderRadius = '0.375rem';
  toast.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
  toast.style.display = 'flex';
  toast.style.alignItems = 'center';
  toast.style.justifyContent = 'space-between';
  toast.style.maxWidth = '24rem';
  toast.style.zIndex = '1001';

  toast.querySelector('.error-toast-content').style.display = 'flex';
  toast.querySelector('.error-toast-content').style.alignItems = 'center';
  toast.querySelector('.fas').style.marginRight = '0.5rem';
  toast.querySelector('.error-toast-close').style.background = 'none';
  toast.querySelector('.error-toast-close').style.border = 'none';
  toast.querySelector('.error-toast-close').style.fontSize = '1.25rem';
  toast.querySelector('.error-toast-close').style.cursor = 'pointer';
  toast.querySelector('.error-toast-close').style.color = '#a0aec0';

  // Add to DOM
  document.body.appendChild(toast);

  // Close button event
  toast.querySelector('.error-toast-close').addEventListener('click', function() {
    document.body.removeChild(toast);
  });

  // Auto-hide after 5 seconds
  setTimeout(() => {
    if (document.body.contains(toast)) {
      document.body.removeChild(toast);
    }
  }, 5000);
}

// Make viewTransactionDetails globally accessible
window.viewTransactionDetails = viewTransactionDetails;
